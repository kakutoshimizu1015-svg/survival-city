import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { playSfx } from '../../utils/audio';

// ─────────────────────────────────────────────
//  定数
// ─────────────────────────────────────────────

const DOTS = {
  1: [[1,1]],
  2: [[0,2],[2,0]],
  3: [[0,2],[1,1],[2,0]],
  4: [[0,0],[0,2],[2,0],[2,2]],
  5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
  6: [[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]],
};

// キューブ回転角 → 各面を正面へ向ける
const SHOW = {
  1: { rx: 0,   ry: 0   },
  2: { rx: -90, ry: 0   },
  3: { rx: 0,   ry: -90 },
  4: { rx: 0,   ry: 90  },
  5: { rx: 90,  ry: 0   },
  6: { rx: 0,   ry: 180 },
};

// 各面のCSS transform
const FACE_TRANSFORMS = {
  1: 'translateZ(44px)',
  2: 'rotateX(90deg)   translateZ(44px)',
  3: 'rotateY(90deg)   translateZ(44px)',
  4: 'rotateY(-90deg)  translateZ(44px)',
  5: 'rotateX(-90deg)  translateZ(44px)',
  6: 'rotateY(180deg)  translateZ(44px)',
};

// ─────────────────────────────────────────────
//  CSS keyframes を <head> に一度だけ注入
// ─────────────────────────────────────────────

const KEYFRAMES = `
@keyframes diceRollBnc {
  0%  { transform: scale(1.2);  }
  35% { transform: scale(.84);  }
  58% { transform: scale(1.1);  }
  75% { transform: scale(.96);  }
  88% { transform: scale(1.04); }
  100%{ transform: scale(1);    }
}
@keyframes diceRollD3in {
  0%  { transform: scale(0)    translateY(-32px); opacity: 0; }
  60% { transform: scale(1.18) translateY(5px);   opacity: 1; }
  100%{ transform: scale(1)    translateY(0);     opacity: 1; }
}
@keyframes diceRollTshk {
  0%,100%{ transform: translate(0,0);       }
  12%    { transform: translate(-7px,-3px); }
  25%    { transform: translate(7px,4px);   }
  37%    { transform: translate(-5px,5px);  }
  50%    { transform: translate(5px,-3px);  }
  62%    { transform: translate(-4px,4px);  }
  75%    { transform: translate(4px,-4px);  }
  87%    { transform: translate(-2px,2px);  }
}
@keyframes diceRollRin {
  0%  { opacity: 0; transform: scale(.5)   translateY(14px); }
  55% {             transform: scale(1.08) translateY(-3px);  }
  100%{ opacity: 1; transform: scale(1)    translateY(0);     }
}
`;

let _kfInjected = false;
function injectKeyframes() {
  if (_kfInjected) return;
  const tag = document.createElement('style');
  tag.textContent = KEYFRAMES;
  document.head.appendChild(tag);
  _kfInjected = true;
}

// ─────────────────────────────────────────────
//  生DOM でサイコロ1個を組み立てるクラス
//  ※ React の仮想DOMを通さず imperative に操作する
//    理由: transitionend + requestAnimationFrame の
//    精密なタイミング制御が必要なため
// ─────────────────────────────────────────────

class Die {
  constructor(val, fast = false) {
    const face = SHOW[val] || SHOW[1];
    const sx   = (fast ? 2 : 4) + Math.floor(Math.random() * (fast ? 1 : 2));
    const sy   = (fast ? 2 : 3) + Math.floor(Math.random() * (fast ? 1 : 2));

    this.sRx = Math.random() * 360;
    this.sRy = Math.random() * 360;

    // ── 目標角の正しい計算 ──────────────────────────────────────
    // tRx mod 360 === face.rx になるよう「前向きオフセット」を求める
    //   例) sRx=45, face.rx=0 → offX=315 → tRx=45+N*360+315 → mod360=0 ✓
    //       (旧式) tRx=45+N*360+0 → mod360=45 → 斜めで止まる ✗
    // ────────────────────────────────────────────────────────────
    const offX  = ((face.rx - this.sRx) % 360 + 360) % 360;
    const offY  = ((face.ry - this.sRy) % 360 + 360) % 360;
    this.tRx    = this.sRx + sx * 360 + offX;
    this.tRy    = this.sRy + sy * 360 + offY;
    this.dur    = fast ? 0.85 : 2.05;

    // ── DOM 構築 ─────────────────────────────────────────────────
    // wrapper (.bw): バウンスアニメーション用
    this.bw = document.createElement('div');
    this.bw.style.display = 'inline-block';

    // perspective container (.cw)
    const cw = document.createElement('div');
    cw.style.cssText = [
      'width:88px', 'height:88px',
      'perspective:340px', 'perspective-origin:50% 36%',
      'flex-shrink:0',
    ].join(';');

    // cube: 6面体
    this.cube = document.createElement('div');
    this.cube.style.cssText = [
      'width:88px', 'height:88px',
      'position:relative',
      'transform-style:preserve-3d',
      'will-change:transform',
    ].join(';');

    for (let v = 1; v <= 6; v++) {
      this.cube.appendChild(this._makeFace(v));
    }

    cw.appendChild(this.cube);
    this.bw.appendChild(cw);

    // 開始角をコミット（transition より先に確定させる）
    this.cube.style.transform =
      `rotateX(${this.sRx}deg) rotateY(${this.sRy}deg)`;
  }

  _makeFace(v) {
    const f = document.createElement('div');
    f.style.cssText = [
      'position:absolute', 'inset:0',
      'border-radius:13px',
      'outline:2.5px solid #C9A96E',
      'background:#FAF0DC',
      'padding:11px',
      'display:grid',
      'grid-template-columns:repeat(3,1fr)',
      'grid-template-rows:repeat(3,1fr)',
      'gap:5px',
      'backface-visibility:hidden',
      'will-change:transform',
      `transform:${FACE_TRANSFORMS[v]}`,
    ].join(';');

    const dots = DOTS[v] || [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const d   = document.createElement('div');
        const isOn = dots.some(([dr, dc]) => dr === r && dc === c);
        d.style.cssText = `border-radius:50%;${isOn ? 'background:#A02020;' : ''}`;
        // markDouble() で使うフラグ
        d.dataset.on = isOn ? '1' : '0';
        f.appendChild(d);
      }
    }
    return f;
  }

  // ── ロール開始 → Promise で着弾を通知 ──────────────────────────
  roll(onLand) {
    return new Promise(resolve => {
      // reflow を強制して開始角を描画にコミット
      void this.cube.offsetHeight;

      // ── cubic-bezier(0.5, 0.4, 0.7, 1) ────────────────────────
      // 初速 = P1y/P1x = 0.4/0.5 = 平均速度の 0.8 倍
      // → フレーム 0 から単調減速
      // → rAF フェーズ切り替えなし → stop-and-go が物理的に起きない
      // ──────────────────────────────────────────────────────────
      this.cube.style.transition =
        `transform ${this.dur}s cubic-bezier(0.5,0.4,0.7,1)`;
      this.cube.style.transform =
        `rotateX(${this.tRx}deg) rotateY(${this.tRy}deg)`;

      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        this.cube.style.transition = 'none';
        try { onLand?.(); } catch (_) {}
        // バウンス
        this.bw.style.animation = 'diceRollBnc .52s both';
        setTimeout(() => {
          this.bw.style.animation = '';
          resolve();
        }, 520);
      };

      this.cube.addEventListener('transitionend', finish, { once: true });
      // フォールバック: transitionend が発火しない環境向け
      setTimeout(finish, (this.dur + 1.4) * 1000);
    });
  }

  // ゾロ目演出: 面とドットの色をアンバーに変更
  markDouble() {
    Array.from(this.cube.children).forEach(face => {
      face.style.outlineColor = '#B07800';
      face.style.background   = '#FFF3B0';
      Array.from(face.children).forEach(dot => {
        if (dot.dataset.on === '1') dot.style.background = '#7A4D00';
      });
    });
  }
}

// ─────────────────────────────────────────────
//  パーティクルバースト（生DOM を tray に直接 append）
// ─────────────────────────────────────────────

function burst(trayEl, dieEl, isDbl) {
  try {
    if (!trayEl || !dieEl) return;
    const tr = trayEl.getBoundingClientRect();
    const dr = dieEl.getBoundingClientRect();
    const cx = dr.left + dr.width  / 2 - tr.left;
    const cy = dr.top  + dr.height / 2 - tr.top;
    const c1 = isDbl ? '#C48A00' : '#A02020';
    const c2 = isDbl ? '#FFD700' : '#E05050';

    for (let i = 0; i < 16; i++) {
      const a    = Math.random() * Math.PI * 2;
      const dist = 20 + Math.random() * 50;
      const sz   = 2  + Math.random() * 4;
      const ms   = 350 + Math.random() * 300;
      const col  = Math.random() > 0.5 ? c1 : c2;

      const p = document.createElement('div');
      p.style.cssText = [
        'position:absolute',
        `width:${sz}px`, `height:${sz}px`,
        'border-radius:50%',
        `background:${col}`,
        `left:${cx}px`, `top:${cy}px`,
        'transform:translate(-50%,-50%)',
        'pointer-events:none',
        'z-index:20',
        `transition:transform ${ms}ms ease-out,opacity ${ms}ms ease-out`,
      ].join(';');
      trayEl.appendChild(p);

      // ダブル rAF で開始位置コミット後に移動
      requestAnimationFrame(() => requestAnimationFrame(() => {
        p.style.transform =
          `translate(calc(-50% + ${Math.cos(a)*dist}px),` +
          `calc(-50% + ${Math.sin(a)*dist}px))`;
        p.style.opacity = '0';
      }));
      setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, ms + 100);
    }
  } catch (_) {}
}

// ─────────────────────────────────────────────
//  フェーズバッジのスタイルマップ
// ─────────────────────────────────────────────

const PHASE_MAP = {
  idle:    { background: '#2a2a3e', color: '#888',    border: '1px solid #333'    },
  rolling: { background: '#1a2a4e', color: '#7aadee', border: '1px solid #3a5a8e' },
  slowing: { background: '#3a2a1a', color: '#e4a840', border: '1px solid #7A5800' },
  landing: { background: '#1a3a1a', color: '#6ecc6e', border: '1px solid #2a6a2a' },
};

// ─────────────────────────────────────────────
//  内部コンポーネント（active=true のときのみ mount される）
//  → useEffect([]) が「アニメーション開始」と同義になる
// ─────────────────────────────────────────────

export const DiceOverlayInner = ({ diceAnim }) => {
  const trayRef  = useRef(null);
  const flashRef = useRef(null);
  const areaRef  = useRef(null);
  const timersRef = useRef([]);
  const intervalsRef = useRef([]);

  const [phase,  setPhase]  = useState('rolling');
  const [result, setResult] = useState({ text: '', color: '#eee', bonus: '', visible: false });

  // タイマー管理（コンポーネント破棄時に全クリア）
  const addTimer = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  };
  // ▼追加: インターバルを安全に管理する関数
  const addInterval = (fn, ms) => {
    const id = setInterval(fn, ms);
    intervalsRef.current.push(id);
    return id;
  };
  const wait = ms => new Promise(resolve => { addTimer(resolve, ms); });

  // ─── アニメーション本体（マウント時に1回だけ実行）─────────────
  useEffect(() => {
    injectKeyframes();

    const area = areaRef.current;
    if (!area) return;
    area.innerHTML = '';
    setResult({ text: '', color: '#eee', bonus: '', visible: false });

    const d1    = diceAnim.d1 || 1;
    const d2    = diceAnim.d2 || 1;
    const d3    = diceAnim.d3 || 0;          // ギャンブラー第3ダイス（0=なし）
    const isDbl = diceAnim.isDouble ?? (d1 === d2);

    const die1 = new Die(d1);
    const die2 = new Die(d2);
    area.appendChild(die1.bw);
    area.appendChild(die2.bw);

    // 着弾コールバック（2個揃ったときにシェイク・フラッシュ）
    let landCount = 0;
    const onLand = (dieEl) => {
      burst(trayRef.current, dieEl, isDbl);
      landCount++;
      if (landCount >= 2) {
        // トレイシェイク
        const t = trayRef.current;
        if (t) {
          t.style.animation = 'diceRollTshk 0.44s both';
          setTimeout(() => { t.style.animation = ''; }, 500);
        }
        // フラッシュ
        const f = flashRef.current;
        if (f) {
          f.style.background = isDbl ? '#C4820E' : '#ffffff';
          f.style.transition  = 'opacity 0.04s';
          f.style.opacity     = isDbl ? '0.4' : '0.22';
          setTimeout(() => { f.style.transition = 'opacity 0.6s'; f.style.opacity = '0'; }, 55);
        }
      }
    };

    // 2つ同時ロール開始
    const p1 = die1.roll(() => onLand(die1.bw));
    const p2 = die2.roll(() => onLand(die2.bw));

    // SE スケジュール（audio.js の playSfx を使用）
    const sfxFast = addInterval(() => { try { playSfx('dice'); } catch(_) {} }, 75);
    addTimer(() => {
      clearInterval(sfxFast);
      setPhase('slowing');
      const sfxMid = addInterval(() => { try { playSfx('dice'); } catch(_) {} }, 165);
      addTimer(() => {
        clearInterval(sfxMid);
        const sfxSlow = addInterval(() => { try { playSfx('dice'); } catch(_) {} }, 310);
        addTimer(() => {
          clearInterval(sfxSlow);
          setPhase('landing');
        }, 380);
      }, 500);
    }, 420);

    // Promise チェーン
    Promise.all([p1, p2])
      .then(() => {
        // ゾロ目演出
        if (isDbl) {
          return wait(170).then(() => {
            die1.markDouble();
            die2.markDouble();
            try { playSfx('success'); } catch(_) {}
          });
        }
      })
      .then(() => {
        // ギャンブラー第3ダイス
        if (d3 > 0) {
          return wait(420).then(() => {
            const die3 = new Die(d3, true);
            die3.bw.style.animation = 'diceRollD3in .55s both';
            area.appendChild(die3.bw);
            const p3 = die3.roll(() => {
              setTimeout(() => burst(trayRef.current, die3.bw, false), 800);
            });
            try { playSfx('dice'); } catch(_) {}
            return p3;
          });
        }
      })
      .then(() => wait(200))
      .then(() => {
        const sumRaw = d1 + d2 + d3;
        const total  = sumRaw * (isDbl ? 2 : 1);
        const txt    =
          `${d1} + ${d2}${d3 ? ' + ' + d3 : ''} = ${sumRaw}AP${isDbl ? ' ×2' : ''}`;
        const bonus  =
          isDbl       ? 'ゾロ目ボーナス — AP ×2'   :
          d3 > 0      ? '大勝負！ 第3のサイコロ発動' : '';

        setResult({ text: txt, color: isDbl ? '#d4a020' : '#eee', bonus, visible: true });
        setPhase('idle');

        // 【パターンA】結果テキストをしっかり表示してから閉じる (2.5秒)
        // 合計で約4.6秒強の演出になります
        return wait(2500);
      })
      .then(() => {
        useGameStore.setState(prev => ({
          diceAnim: { ...prev.diceAnim, active: false },
        }));
      })
      .catch(err => {
        console.warn('[DiceOverlay]', err);
        useGameStore.setState(prev => ({
          diceAnim: { ...prev.diceAnim, active: false },
        }));
      });

    // クリーンアップ
    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      intervalsRef.current.forEach(clearInterval); // ▼追加: 画面が消えたら強制的に音を止める
      intervalsRef.current = [];                   // ▼追加
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ 空依存: マウント時に1回だけ実行 = active が true になった瞬間のみ起動

  const phaseStyle = PHASE_MAP[phase] || PHASE_MAP.idle;
  const phaseLabel = {
    rolling: 'ローリング中...',
    slowing: '減速中...',
    landing: '確定中...',
    idle:    '待機中',
  }[phase];

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      zIndex:         9000,
      display:        'flex',
      flexDirection:  'column',
      justifyContent: 'center',
      alignItems:     'center',
      background:     'rgba(0,0,0,0.75)',
      fontFamily:     '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* フェーズバッジ */}
      <div style={{
        display:      'inline-block',
        padding:      '5px 16px',
        borderRadius: 8,
        fontSize:     12,
        fontWeight:   600,
        marginBottom: 12,
        transition:   'background .3s, color .3s',
        ...phaseStyle,
      }}>
        {phaseLabel}
      </div>

      {/* サイコロトレイ */}
      <div ref={trayRef} style={{
        position:     'relative',
        background:   '#1E140C',
        border:       '2px solid #7A5800',
        borderRadius: 18,
        padding:      '28px 24px 22px',
        overflow:     'hidden',
        minWidth:     260,
      }}>
        {/* 装飾ドット（::before / ::after の代替） */}
        <div style={{ position:'absolute', width:7, height:7, borderRadius:'50%', background:'#7A5800', top:11, left:12  }} />
        <div style={{ position:'absolute', width:7, height:7, borderRadius:'50%', background:'#7A5800', top:11, right:12 }} />

        {/* タイトル */}
        <div style={{
          position:      'absolute', top:10, left:0, right:0,
          fontSize:      10, color:'#5C3D00', fontWeight:600,
          letterSpacing: '0.2em', textAlign:'center',
        }}>
          D I C E &nbsp; R O L L
        </div>

        {/* フラッシュレイヤー */}
        <div ref={flashRef} style={{
          position: 'absolute', inset:0, opacity:0,
          pointerEvents:'none', borderRadius:16,
        }} />

        {/* サイコロエリア（生DOMで子を追加） */}
        <div ref={areaRef} style={{
          display:        'flex',
          gap:            24,
          justifyContent: 'center',
          alignItems:     'center',
          minHeight:      120,
          position:       'relative',
        }} />
      </div>

      {/* 結果テキスト */}
      <div style={{ minHeight:70, paddingTop:8, textAlign:'center' }}>
        <div style={{
          fontSize:      28,
          fontWeight:    600,
          color:         result.color,
          letterSpacing: '.02em',
          minHeight:     38,
          animation:     result.visible ? 'diceRollRin .42s both' : 'none',
        }}>
          {result.text}
        </div>
        <div style={{
          fontSize:   14,
          fontWeight: 600,
          color:      '#c8920a',
          minHeight:  22,
          marginTop:  5,
        }}>
          {result.bonus}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  公開コンポーネント
//  active=false のとき null → active=true で mount →
//  useEffect([]) がアニメーション開始トリガーになる
// ─────────────────────────────────────────────

export const DiceOverlay = () => {
  const diceAnim = useGameStore(state => state.diceAnim);
  if (!diceAnim.active) return null;
  return <DiceOverlayInner key={Date.now()} diceAnim={diceAnim} />;
};
