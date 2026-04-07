import React, { useState, useCallback, useRef, useEffect } from "react";
import { useGameStore } from '../../store/useGameStore';
import { useUserStore } from '../../store/useUserStore';
import { syncGachaData } from '../../utils/userLogic';

// ▼ 4つに分割したミニゲームコンポーネントをインポート
import { BoxGame, VendGame, ScratchGame, HLGame } from './MiniGamesPart1';
import { SlotGame, OxoGame, TetrisGame, FlyGame } from './MiniGamesPart2';
import { RatGame, DrunkGame, RainGame, KashiGame } from './MiniGamesPart3';
import { BegGame, MusicGame, NegoGame } from './MiniGamesPart4';

/* ─── メニュー画面用データ (全15種) ─────────────────────── */
export const ALL_GAMES = [
  { id: 'box', icon: '📦', name: '箱選びゲーム', desc: 'シャッフルされる3つの箱から当たりを見つけ出せ！箱を直接タップして選択します。', reward: '最大+10P' },
  { id: 'vend', icon: '🏧', name: 'ボロ自販機ガチャ', desc: '3台の自販機から当たりを1台引き当てろ！自販機を直接タップして選択します。', reward: '最大+15P' },
  { id: 'hl', icon: '🃏', name: 'ハイ＆ロー', desc: '次のカードが今の数字より大きい(HIGH)か小さい(LOW)か当てろ！画面下のボタンで操作します。', reward: '最大+25P' },
  { id: 'slot', icon: '🎰', name: '路上スロット', desc: '3つのリールを絵柄が揃うように止めろ！各リールの下にある「STOP」ボタンを押します。', reward: '最大+50P' },
  { id: 'fly', icon: '🪰', name: 'ハエ捕まえ', desc: '画面を飛び回るハエを10秒で3匹捕まえろ！ハエを直接タップ(クリック)して捕獲します。', reward: '最大+15P' },
  { id: 'scratch', icon: '🪙', name: 'スクラッチくじ', desc: '10秒以内に3マス削って絵柄を揃えろ！マスの上をスワイプ(ドラッグ)して削ります。', reward: '最大+20P' },
  { id: 'beg', icon: '🙏', name: '物乞いゲーム', desc: '通行人が中央の⭐ゾーンを通るタイミングを狙え！画面下の「🙏 お恵みを…」ボタンを押します。', reward: '最大+20P' },
  { id: 'rain', icon: '☔', name: '雨宿りダッシュ', desc: '迫りくる障害物を避けて走り抜けろ！タイミングよく「⬆️ JUMP！」ボタンを押して飛び越えます。', reward: '最大+12P' },
  { id: 'kashi', icon: '🍱', name: '炊き出し争奪戦', desc: '落ちてくる弁当をライバルより多く拾え！「◀ 左」「右 ▶」ボタンを押し続けて移動します。', reward: '最大+15P' },
  { id: 'oxo', icon: '♟️', name: '路上○×ゲーム', desc: 'CPUとの○×ゲーム。5秒以内に空いているマスをタップ！勝てば賭けたPが2倍になります。', reward: '賭けP×2' },
  { id: 'tetris', icon: '📦', name: '段ボールパズル', desc: '左右に動くパーツを「◀」「▶」で移動し、「⬇ DROP」で落とせ！横一列揃えて2段消せばクリア！', reward: '最大+20P' },
  { id: 'rat', icon: '🐀', name: 'ネズミ追い払い', desc: '中央の荷物を狙うネズミを撃退しろ！近づいてくるネズミを直接タップして追い払います。', reward: '最大+12P' },
  { id: 'drunk', icon: '🍺', name: '酔っ払いバランス', desc: '左に傾いたら「右→」、右に傾いたら「←左」ボタンを押し、緑のゾーン(中央)を6秒以上キープしろ！', reward: '最大+15P' },
  { id: 'music', icon: '🎸', name: '路上ライブ音ゲー', desc: '落ちてくるノーツが下のラインに重なるタイミングで、対応する「🎸」「🥁」「🎹」ボタンをタップ！', reward: '最大+20P' },
  { id: 'nego', icon: '💬', name: '闇市交渉ゲーム', desc: '提示される3つの価格ボタンから、相手の許容上限ギリギリを狙ってタップ！高く売りつけろ！', reward: '最大+25P' }
];

/* ─── タイトル（メニュー）コンポーネント ─────────────────── */
function TitleScreen({ pts, onSelect, scrollRef }) {
  // ▼ 追加: 画面表示時に前回のスクロール位置を復元
  React.useEffect(() => {
    const el = document.getElementById('minigames-scroll-area');
    if (el && scrollRef.current) el.scrollTop = scrollRef.current;
  }, [scrollRef]);

  return (
    <div id="minigames-scroll-area" onScroll={(e) => scrollRef.current = e.target.scrollTop} style={{
      position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', 
      overflowY: 'auto', overflowX: 'hidden', background: 'radial-gradient(ellipse 120% 80% at 50% 20%,#2a1a08 0%,#0c0a07 65%)', 
      color: '#d4c4a0', fontFamily: "'Noto Sans JP',sans-serif", zIndex: 1000, 
      justifyContent: 'flex-start', paddingBottom: '2rem'
    }}>
      <p style={{ marginTop: '1.5rem', fontSize: '.7rem', letterSpacing: '.3em', color: '#7a6a4a' }}>脱・ホームレスサバイバルシティ</p>
      <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(2.5rem,9vw,5rem)', lineHeight: .9, color: '#c97b2a', textShadow: '0 0 40px rgba(201,123,42,.4),4px 4px 0 #000', textAlign: 'center', margin: '.5rem 0' }}>
        路上<br/>ミニゲーム
      </h1>
      
      <div style={{ width: 200, height: 2, background: 'linear-gradient(90deg,transparent,#c97b2a,transparent)', margin: '.7rem auto' }} />
      
      <div style={{ background: '#241a0e', border: '1px solid #5a4228', borderRadius: 50, padding: '.4rem 1.4rem', fontSize: '1rem', color: '#e8b84b', fontWeight: 700, marginBottom: '1.2rem', boxShadow: '0 0 15px rgba(232,184,75,.15)' }}>
        💰 所持P: {pts}
      </div>

      {/* ▼ 追加: 画面上部にも戻るボタンを配置 */}
      <button
        onClick={() => useGameStore.setState({ gamePhase: 'mode_select' })}
        style={{
            marginBottom: '1.2rem', padding: '10px 24px', borderRadius: '8px',
            background: '#241a0e', border: '2px solid #5a4228', color: '#d4c4a0',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '.9rem', transition: 'background .1s'
        }}
        onPointerDown={(e) => e.currentTarget.style.background = '#3d2e1a'}
        onPointerUp={(e) => e.currentTarget.style.background = '#241a0e'}
      >
        ← モード選択へ戻る
      </button>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '.65rem', padding: '0 .8rem', width: '100%', maxWidth: 500 }}>
        {ALL_GAMES.map(g => (
          <div 
            key={g.id} 
            onClick={() => onSelect(g.id)} 
            style={{ 
              background: '#1a1309', border: '1px solid #3d2e1a', borderRadius: 13, padding: '1rem .8rem', 
              cursor: 'pointer', textAlign: 'center', userSelect: 'none', transition: 'transform .1s' 
            }}
            onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onPointerLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '.3rem' }}>{g.icon}</span>
            <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#f0e8d0', marginBottom: '.15rem' }}>{g.name}</div>
            <div style={{ fontSize: '.65rem', color: '#7a6a4a', lineHeight: 1.5 }}>{g.desc}</div>
            <div style={{ fontSize: '.62rem', color: '#c97b2a', marginTop: '.25rem', fontWeight: 700 }}>{g.reward}</div>
          </div>
        ))}
      </div>
      
      <div style={{ height: '1rem' }} />
      
      <button
        onClick={() => useGameStore.setState({ gamePhase: 'mode_select' })}
        style={{
            marginTop: '10px', padding: '12px 24px', borderRadius: '8px',
            background: '#241a0e', border: '2px solid #5a4228', color: '#d4c4a0',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', transition: 'background .1s'
        }}
        onPointerDown={(e) => e.currentTarget.style.background = '#3d2e1a'}
        onPointerUp={(e) => e.currentTarget.style.background = '#241a0e'}
      >
        ← モード選択へ戻る
      </button>
      <div style={{ height: '2rem' }} />
    </div>
  );
}

/* ════════════════════════════════════════
   ROOT APP (統合コンポーネント)
════════════════════════════════════════ */
export default function MinigamesApp() {
  // ▼ ユーザーの永続化データ（ガチャP）を取得
  const { gachaPoints, addGachaAssets } = useUserStore();
  const [screen, setScreen] = useState(null); // null = タイトル画面, 文字列 = ゲームID
  const scrollRef = useRef(0); // ▼ 追加: スクロール位置の記憶用

  // Pを加算し、即座にFirebaseへセーブするラッパー関数
  const addPts = useCallback(async (n) => { 
    if (n > 0) {
      addGachaAssets(0, n);
      await syncGachaData();
    }
  }, [addGachaAssets]);

  // Pを減算し、即座にFirebaseへセーブするラッパー関数
  const subPts = useCallback(async (n) => { 
    if (n > 0) {
      addGachaAssets(0, -n);
      await syncGachaData();
    }
  }, [addGachaAssets]);

  const goTitle = useCallback(() => setScreen(null), []);
  const goGame = useCallback((id) => setScreen(id), []);

  // 全ゲームに共通で渡すProps
  const gameProps = { 
    pts: gachaPoints, 
    addPts, 
    subPts, 
    onBack: goTitle 
  };

  // 選択されたscreen IDに応じてコンポーネントをマッピング
  const GameComponent = {
    // Part 1
    box: BoxGame, vend: VendGame, scratch: ScratchGame, hl: HLGame,
    // Part 2
    slot: SlotGame, oxo: OxoGame, tetris: TetrisGame, fly: FlyGame,
    // Part 3
    rat: RatGame, drunk: DrunkGame, rain: RainGame, kashi: KashiGame,
    // Part 4
    beg: BegGame, music: MusicGame, nego: NegoGame
  }[screen];

  return (
    <>
      {/* ▼ 修正: scrollRefを渡すように変更 */}
      {!screen && <TitleScreen pts={gachaPoints} onSelect={goGame} scrollRef={scrollRef} />}
      {screen && GameComponent && <GameComponent key={screen} {...gameProps} />}
    </>
  );
}