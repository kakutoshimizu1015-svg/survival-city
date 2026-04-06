import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameHeader, ResultBox } from './MiniGamesPart1';

// ========== 共通ユーティリティ ==========
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// ========== Part 4 専用スタイル ==========
export const MiniGameStylesPart4 = () => (
    <style>{`
        /* Rain Game */
        .rain-arena { width:100%; height:180px; background:linear-gradient(to bottom,#0d1a2a,#101510 65%,#1a2018 65%,#181e15 100%); border:2px solid var(--border); border-radius:12px; position:relative; overflow:hidden; }
        .rain-runner { position:absolute; left:18%; font-size:1.9rem; z-index:10; transition:bottom 0.1s ease-out; }
        .rain-shelter { position:absolute; bottom:0; right:8px; width:65px; height:70px; background:rgba(50,40,20,.8); border:2px solid var(--border2); border-radius:6px 6px 0 0; display:flex; align-items:center; justify-content:center; font-size:2.2rem; }
        .obs-el { position:absolute; bottom:24px; font-size:1.7rem; z-index:9; }
        .jump-btn-big { background:linear-gradient(135deg,#2a5a8a,#1a3a6a); border:2px solid #3a7ab0; border-radius:14px; color:#a0d0f0; font:700 1.2rem 'Noto Sans JP',sans-serif; padding:.8rem 2.5rem; cursor:pointer; user-select:none; box-shadow:0 4px 15px rgba(42,90,138,.4); width: 100%; margin-top: 10px; }
        .jump-btn-big:active { transform:scale(0.98); }
        .wet-track { width:100%; height:13px; background:var(--card3); border-radius:7px; overflow:hidden; border:1px solid var(--border); }
        .wet-fill { height:100%; background:linear-gradient(90deg,#3a7aa0,#1a3a6a); border-radius:7px; transition:width .2s linear; }

        /* Kashi Game */
        .kashi-arena { width:100%; height:280px; background:linear-gradient(160deg,#1a1208,#0d0a05); border:2px solid var(--border); border-radius:14px; position:relative; overflow:hidden; }
        .kashi-player { position:absolute; bottom:10px; font-size:1.9rem; z-index:10; transform:translateX(-50%); }
        .kashi-npc { position:absolute; bottom:10px; font-size:1.9rem; z-index:9; transform:translateX(-50%); }
        .bento-el { position:absolute; font-size:1.7rem; z-index:8; transform:translateX(-50%); }
        .kashi-btns { display:flex; gap:.8rem; width: 100%; margin-top: 10px; }
        .kashi-mv-btn { flex: 1; background:var(--card2); border:2px solid var(--border2); border-radius:12px; color:var(--text); font:700 1.5rem 'Noto Sans JP',sans-serif; padding:.8rem 1.6rem; cursor:pointer; user-select:none; touch-action: none; }
        .kashi-mv-btn:active { background:var(--border2); }

        /* Music Game */
        .music-arena { width:100%; height:300px; background:linear-gradient(to bottom,#080608,#180e08); border:2px solid var(--border); border-radius:14px; position:relative; overflow:hidden; }
        .music-lane-line { position:absolute; top:0; bottom:60px; width:1px; background:rgba(255,255,255,.06); }
        .music-note { position:absolute; height:38px; border-radius:8px; border:2px solid; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:700; z-index:10; transform:translateX(-50%); }
        .music-hit-line { position:absolute; left:0; right:0; bottom:60px; height:3px; background:rgba(232,184,75,.5); }
        .music-btns { position:absolute; bottom:0; left:0; right:0; height:58px; display:flex; gap:4px; padding:4px; }
        .music-btn { flex:1; border-radius:8px; border:2px solid; cursor:pointer; font-size:1.5rem; user-select:none; touch-action: none; background: rgba(255,255,255,0.05); }
        .music-btn:active { transform:scale(.95); filter: brightness(1.3); }
        .music-judge { position:absolute; top:40%; width:100%; text-align:center; font-size:1.5rem; font-weight:900; pointer-events:none; opacity:0; transition:opacity .1s; text-shadow: 0 2px 4px #000; }
        .music-judge.show { opacity:1; transform: scale(1.1); transition: all 0.1s; }
        .music-score-disp { font-size:1.1rem; color:var(--gold); font-weight:700; text-align:center; margin-bottom: 0.5rem; }
    `}</style>
);

// ========== 10. ☔ 雨宿りダッシュ ==========

export function RainGame({ handleGameEnd }) {
    const OBS_DATA = [
        { e: '👮', name: '警察', danger: 28 }, 
        { e: '🐕', name: '野良犬', danger: 20 }, 
        { e: '💦', name: '水たまり', danger: 12 }, 
        { e: '🧟', name: 'おじさん', danger: 25 }
    ];

    const [wet, setWet] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const [jump, setJump] = useState(false);
    const [obs, setObs] = useState({ x: 120, active: false, e: '' });
    const [infoMsg, setInfoMsg] = useState('障害物を待て…');
    
    const timerRef = useRef(null);
    const rafRef = useRef(null);
    const playingRef = useRef(false);
    const jumpRef = useRef(false);
    const hasHitRef = useRef(false); // 1回の障害物で何度もダメージを受けないためのフラグ

    const init = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setResult(null); setPlaying(true); playingRef.current = true; 
        setTime(10); setWet(0); setJump(false); jumpRef.current = false;
        setObs({ x: 120, active: false, e: '' }); setInfoMsg('障害物を待て…');
        
        timerRef.current = setInterval(() => {
            setTime(t => Math.max(0, t - 1));
            // 時間経過で徐々に濡れる
            setWet(w => {
                const nw = Math.min(100, w + 1.5);
                if (nw >= 100) end(false);
                return nw;
            });
        }, 1000);
        
        setTimeout(spawnObs, 1500);
    }, []);

    const spawnObs = () => {
        if (!playingRef.current) return;
        const nextObs = OBS_DATA[rnd(0, OBS_DATA.length - 1)];
        setInfoMsg(`⚠️ ${nextObs.name}が来る！`);
        hasHitRef.current = false;
        
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        
        let x = 110;
        const tick = () => {
            if (!playingRef.current) return;
            x -= 2.5; // 障害物のスピード
            setObs({ x, active: true, e: nextObs.e });
            
            // 当たり判定 (プレイヤーのX座標は18%付近)
            if (!hasHitRef.current && x < 25 && x > 12) {
                if (!jumpRef.current) {
                    hasHitRef.current = true;
                    setInfoMsg(`💥 ${nextObs.name}にぶつかった！`);
                    setWet(w => {
                        const nw = Math.min(100, w + nextObs.danger);
                        if (nw >= 100) end(false);
                        return nw;
                    });
                } else if (x < 18 && x > 16) {
                    setInfoMsg('🌟 ジャンプ成功！');
                }
            }
            
            if (x < -15) {
                setObs(prev => ({ ...prev, active: false }));
                setTimeout(spawnObs, rnd(600, 1200));
                return;
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    };

    const doJump = (e) => {
        e.preventDefault();
        if (!playing || jumpRef.current) return;
        setJump(true); jumpRef.current = true;
        // ジャンプの滞空時間
        setTimeout(() => {
            if (playingRef.current) {
                setJump(false); jumpRef.current = false;
            }
        }, 500);
    };

    const end = useCallback((winCondition) => {
        setPlaying(false); playingRef.current = false;
        if (timerRef.current) clearInterval(timerRef.current); 
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        
        setWet(w => {
            const win = winCondition && w < 100;
            // 濡れていないほど高得点（最大12P）
            const p = win ? Math.max(2, Math.floor(12 * (1 - w / 100))) : 0;
            setResult({ 
                win, icon: win ? '🏕️' : '💧', main: win ? '雨宿り成功！' : 'びしょ濡れで動けない…', 
                sub: `濡れ度 ${Math.floor(w)}%`, pts: p 
            });
            if (p > 0) handleGameEnd(p);
            return w;
        });
    }, [handleGameEnd]);

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); playingRef.current = false; }; }, [init]);
    useEffect(() => { if (time === 0 && playing) end(true); }, [time, playing, end]);

    return (
        <>
            <MiniGameStylesPart4 />
            <GameHeader title="☔ 雨宿りダッシュ" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="instr">障害物がきたらジャンプ！濡れ度100%で失敗！</div>
                
                <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: '3px' }}>
                        <span style={{ color: '#6af' }}>☔ 濡れ度</span><span style={{ color: '#6af' }}>{Math.floor(wet)}%</span>
                    </div>
                    <div className="wet-track"><div className="wet-fill" style={{ width: `${wet}%` }}></div></div>
                </div>
                
                <div className="rain-arena">
                    <div className="rain-runner" style={{ bottom: jump ? '65px' : '20px' }}>🏃</div>
                    <div className="rain-shelter">🏕️</div>
                    {obs.active && <div className="obs-el" style={{ left: `${obs.x}%` }}>{obs.e}</div>}
                    
                    {/* 背景の雨粒エフェクト */}
                    {playing && Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} style={{
                            position: 'absolute', width: '2px', height: '10px', background: 'rgba(102, 170, 255, 0.4)',
                            left: `${rnd(0, 100)}%`, top: `${(time * 10 + i * 20) % 100}%`,
                        }} />
                    ))}
                </div>
                
                <div style={{ width: '100%', textAlign: 'center', fontSize: '.82rem', color: 'var(--dim)' }}>{infoMsg}</div>
                {!result && <button className="jump-btn-big" onPointerDown={doJump}>⬆️ JUMP！</button>}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

// ========== 11. 🍱 炊き出し争奪戦 ==========

export function KashiGame({ handleGameEnd }) {
    const [score, setScore] = useState(0);
    const [rival, setRival] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const [px, setPx] = useState(40);
    const [rx, setRx] = useState(68);
    const [bentos, setBentos] = useState([]);
    
    const timerRef = useRef(null);
    const rafRef = useRef(null);
    const playingRef = useRef(false);
    const moveDirRef = useRef(0); // プレイヤーの移動方向 (-1, 0, 1)

    const init = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setResult(null); setPlaying(true); playingRef.current = true; 
        setTime(10); setScore(0); setRival(0); setPx(40); setRx(68); setBentos([]); moveDirRef.current = 0;
        
        timerRef.current = setInterval(() => {
            setTime(t => Math.max(0, t - 1));
            // 1秒ごとに新しい弁当を生成
            if (playingRef.current) {
                setBentos(prev => [...prev, { id: Date.now() + rnd(0,100), x: rnd(15, 85), y: 0, hit: false }]);
            }
        }, 1000);
        animate();
    }, []);

    const animate = () => {
        if (!playingRef.current) return;
        
        // プレイヤーの移動処理（ボタン長押し対応）
        if (moveDirRef.current !== 0) {
            setPx(x => Math.max(5, Math.min(95, x + moveDirRef.current * 1.5)));
        }

        setBentos(prev => {
            let next = prev.map(b => ({ ...b, y: b.y + 1.8 })); // 落下スピード
            
            // プレイヤーとライバルの現在位置を取得するために set 内部で処理
            setPx(currentPx => {
                setRx(currentRx => {
                    next = next.filter(b => {
                        if (b.y > 90) return false; // 画面外へ消えた
                        if (b.y > 75 && !b.hit) {
                            // キャッチ判定
                            if (Math.abs(b.x - currentPx) < 8) {
                                setScore(s => s + 1);
                                b.hit = true;
                            } else if (Math.abs(b.x - currentRx) < 8) {
                                setRival(r => r + 1);
                                b.hit = true;
                            }
                        }
                        return !b.hit;
                    });
                    
                    // ライバルの自動移動AI（一番下にある弁当を追いかける）
                    const target = next.find(b => !b.hit);
                    if (target) {
                        return currentRx + (target.x > currentRx ? 1.0 : -1.0);
                    }
                    return currentRx;
                });
                return currentPx;
            });

            rafRef.current = requestAnimationFrame(animate);
            return next;
        });
    };

    const handlePointerDown = (e, dir) => { e.preventDefault(); moveDirRef.current = dir; };
    const handlePointerUp = () => { moveDirRef.current = 0; };

    const end = useCallback(() => {
        setPlaying(false); playingRef.current = false; moveDirRef.current = 0;
        if (timerRef.current) clearInterval(timerRef.current); 
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        
        setScore(s => {
            setRival(r => {
                const win = s >= 3; 
                const p = s * 3;
                setResult({ 
                    win, icon: win ? '🍱' : '😢', main: win ? '弁当3個ゲット！' : '3個に届かなかった…', 
                    sub: `あなた${s}個 / ライバル${r}個`, pts: win ? p : 0 
                });
                if (win && p > 0) handleGameEnd(p);
                return r;
            });
            return s;
        });
    }, [handleGameEnd]);

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); playingRef.current = false; }; }, [init]);
    useEffect(() => { if (time === 0 && playing) end(); }, [time, playing, end]);

    return (
        <>
            <MiniGameStylesPart4 />
            <GameHeader title="🍱 炊き出し争奪" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="instr">◀▶を押し続けて移動し、弁当をキャッチ！3個で成功！</div>
                
                <div className="status-row">
                    <div className="stat-box"><span className="stat-label">🍱 あなた</span><span className="stat-val" style={{ color: 'var(--gold)' }}>{score}</span></div>
                    <div className="stat-box"><span className="stat-label">🧟 ライバル</span><span className="stat-val">{rival}</span></div>
                </div>
                
                <div className="kashi-arena">
                    <div className="kashi-player" style={{ left: `${px}%` }}>🧍</div>
                    <div className="kashi-npc" style={{ left: `${rx}%` }}>🧟</div>
                    {bentos.map(b => <div key={b.id} className="bento-el" style={{ left: `${b.x}%`, top: `${b.y}%` }}>🍱</div>)}
                </div>
                
                {!result && (
                    <div className="kashi-btns">
                        <button className="kashi-mv-btn" onPointerDown={(e) => handlePointerDown(e, -1)} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>◀</button>
                        <button className="kashi-mv-btn" onPointerDown={(e) => handlePointerDown(e, 1)} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>▶</button>
                    </div>
                )}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

// ========== 12. 🎸 路上ライブ音ゲー ==========

export function MusicGame({ handleGameEnd }) {
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const [notes, setNotes] = useState([]);
    const [judge, setJudge] = useState({ text: '', color: '', show: false });
    
    const timerRef = useRef(null);
    const rafRef = useRef(null);
    const playingRef = useRef(false);
    const t0 = useRef(0);
    
    // 10秒に収まるノーツシーケンス
    const SEQ = [
        { l: 0, t: 0.5 }, { l: 1, t: 1.2 }, { l: 2, t: 1.8 }, { l: 0, t: 2.5 }, 
        { l: 1, t: 3.0 }, { l: 2, t: 3.5 }, { l: 0, t: 4.2 }, { l: 1, t: 4.8 }, 
        { l: 2, t: 5.4 }, { l: 0, t: 6.0 }
    ];
    const FALL_DUR = 1.5; // ノーツが落ちるまでの秒数

    const init = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setResult(null); setPlaying(false); playingRef.current = false; 
        setTime(10); setScore(0); setCombo(0); setNotes([]); setJudge({ text: '', color: '', show: false });
    }, []);

    const start = () => {
        setPlaying(true); playingRef.current = true; setScore(0); setCombo(0);
        t0.current = performance.now() / 1000;
        
        setNotes(SEQ.map((n, i) => ({ id: i, ...n, hit: false, missed: false, y: -40 })));
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
        
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        animate();
    };

    const animate = () => {
        if (!playingRef.current) return;
        const now = performance.now() / 1000 - t0.current;
        const hitY = 240; // 判定ラインのY座標 (300px - 60px)
        
        setNotes(prev => {
            let allFinished = true;
            const next = prev.map(n => {
                if (n.hit || n.missed) return n;
                allFinished = false;
                
                if (now >= n.t) {
                    const elapsed = now - n.t;
                    const y = -40 + (elapsed / FALL_DUR) * (hitY + 40); // -40からhitYまでFALL_DUR秒で到達
                    
                    // 判定ラインを大きく越えたらミス
                    if (y > hitY + 30) {
                        showJudge('MISS', '#ff6060');
                        setCombo(0);
                        return { ...n, missed: true };
                    }
                    return { ...n, y };
                }
                return n;
            });
            
            if (allFinished && next.length > 0) {
                setTimeout(() => end(), 500);
                return next;
            }
            
            rafRef.current = requestAnimationFrame(animate);
            return next;
        });
    };

    const showJudge = (text, color) => {
        setJudge({ text, color, show: false });
        // Reactのレンダリングサイクルでアニメーションをリスタートさせるハック
        requestAnimationFrame(() => setJudge({ text, color, show: true }));
    };

    const tap = (e, lane) => {
        e.preventDefault();
        if (!playingRef.current) return;
        
        const hitY = 240;
        setNotes(prev => {
            let next = [...prev];
            // そのレーンで一番下にある（まだ判定されていない）ノーツを探す
            const targetIdx = next.findIndex(n => n.l === lane && !n.hit && !n.missed && n.y > 0);
            
            if (targetIdx >= 0) {
                const dist = Math.abs(next[targetIdx].y - hitY);
                if (dist < 25) {
                    // PERFECT
                    next[targetIdx].hit = true;
                    setScore(s => s + 10);
                    setCombo(c => c + 1);
                    showJudge('PERFECT', 'var(--gold)');
                } else if (dist < 45) {
                    // GOOD
                    next[targetIdx].hit = true;
                    setScore(s => s + 5);
                    setCombo(c => c + 1);
                    showJudge('GOOD', 'var(--green2)');
                } else {
                    // BAD / MISS (早すぎた)
                    next[targetIdx].missed = true;
                    setCombo(0);
                    showJudge('MISS', '#ff6060');
                }
            } else {
                // 空振り
                setCombo(0);
            }
            return next;
        });
    };

    const end = useCallback(() => {
        if (!playingRef.current) return;
        setPlaying(false); playingRef.current = false;
        if (timerRef.current) clearInterval(timerRef.current); 
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        
        setScore(s => {
            const maxScore = SEQ.length * 10;
            const pct = Math.round((s / maxScore) * 100);
            const win = pct >= 60; // 60%以上で成功
            const rank = pct >= 90 ? 'S' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : 'C';
            const p = win ? Math.round(s / 5) : 0;
            
            setResult({ 
                win, icon: win ? '🎸' : '😔', main: win ? `ランク ${rank}！` : `ランク ${rank}…`, 
                sub: `${pct}%の精度 / スコア ${s}`, pts: p 
            });
            if (p > 0) handleGameEnd(p);
            return s;
        });
    }, [handleGameEnd]);

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); playingRef.current = false; }; }, [init]);
    useEffect(() => { if (time === 0 && playing) end(); }, [time, playing, end]);

    const ICONS = ['🎸', '🥁', '🎹'];
    const COLORS = ['#c97b2a', '#4e8539', '#2a5a8a'];

    return (
        <>
            <MiniGameStylesPart4 />
            <GameHeader title="🎸 路上ライブ" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="music-score-disp">SCORE: {score} / COMBO: {combo}</div>
                
                <div className="music-arena">
                    <div className="music-lane-line" style={{ left: '33.33%' }}></div>
                    <div className="music-lane-line" style={{ left: '66.66%' }}></div>
                    <div className="music-hit-line"></div>
                    
                    <div className={`music-judge ${judge.show ? 'show' : ''}`} style={{ color: judge.color }}>
                        {judge.text}
                    </div>
                    
                    {notes.map(n => (!n.hit && !n.missed && n.y > -40 && (
                        <div key={n.id} className="music-note" style={{ 
                            left: `${n.l * 33.33 + 16.66}%`, top: `${n.y}px`, width: '28%',
                            background: `${COLORS[n.l]}28`, borderColor: COLORS[n.l], color: COLORS[n.l]
                        }}>
                            {ICONS[n.l]}
                        </div>
                    )))}
                    
                    <div className="music-btns">
                        {[0, 1, 2].map(l => (
                            <button 
                                key={l} className="music-btn" 
                                onPointerDown={(e) => tap(e, l)}
                                style={{ borderColor: COLORS[l], color: COLORS[l] }}
                            >
                                {ICONS[l]}
                            </button>
                        ))}
                    </div>
                </div>
                
                {!playing && !result && <button className="btn-prim" onClick={start} style={{ width: '100%' }}>🎸 演奏スタート！</button>}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}