import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { GameHeader, ResultBox } from './MiniGamesPart1';

// ========== 共通ユーティリティ ==========
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// ========== Part 3 専用スタイル ==========
export const MiniGameStylesPart3 = () => (
    <style>{`
        /* Fly Game */
        .fly-arena { width:100%; height:310px; background:linear-gradient(160deg,#1a1208 0%,#0d0a05 60%,#120e08 100%); border:2px solid var(--border); border-radius:14px; position:relative; overflow:hidden; cursor:crosshair; }
        .fly-start-overlay { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.5rem; background:rgba(0,0,0,0.4); z-index: 20; }
        .big-fly { font-size:4rem; animation:flyBuzz .3s ease infinite, bounce 1.5s ease infinite; cursor:pointer; }
        .fly { position:absolute; font-size:2.1rem; cursor:pointer; user-select:none; z-index:10; line-height:1; }
        .fly-prog { display:flex; gap:.35rem; justify-content:center; }
        .fly-prog-dot { width:18px; height:18px; border-radius:50%; border:2px solid var(--border2); background:var(--card2); display:flex; align-items:center; justify-content:center; font-size:.7rem; }
        .fly-prog-dot.caught { background:var(--green2); border-color:var(--green2); }
        .fly-timer-box { font-family:'Bebas Neue',sans-serif; font-size:2.8rem; color:var(--gold); line-height:1; }

        /* Rat Game */
        .rat-arena { width:100%; height:280px; background:linear-gradient(160deg,#1a1208,#0d0a05); border:2px solid var(--border); border-radius:14px; position:relative; overflow:hidden; cursor:crosshair; }
        .rat-stash { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:65px; height:65px; background:rgba(201,123,42,.1); border:2px solid rgba(201,123,42,.4); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.7rem; z-index:5; pointer-events:none; }
        .rat-el { position:absolute; font-size:1.7rem; cursor:pointer; user-select:none; z-index:10; transition: transform 0.1s; }
        
        /* Drunk Game */
        .balance-bar-track { width:100%; height:26px; background:var(--card3); border-radius:13px; border:2px solid var(--border2); position:relative; overflow:hidden; }
        .balance-center { position:absolute; left:50%; top:0; bottom:0; width:3px; background:rgba(255,255,255,.15); transform:translateX(-50%); }
        .balance-zone { position:absolute; top:0; bottom:0; left:35%; width:30%; background:rgba(78,133,57,.2); border-left:2px solid rgba(78,133,57,.5); border-right:2px solid rgba(78,133,57,.5); }
        .balance-indicator { position:absolute; top:3px; bottom:3px; width:20px; background:var(--gold); border-radius:10px; transform:translateX(-50%); transition:left .1s ease; }
        .drunk-char { font-size:4.5rem; text-align:center; transition: transform 0.1s ease; }
        .drunk-tap-area { display:flex; gap:.5rem; width:100%; }
        .drunk-tap { flex:1; height:75px; border-radius:12px; border:2px solid var(--border); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1.4rem; font-weight: bold; user-select:none; transition:background .1s; -webkit-tap-highlight-color:transparent; }
        .drunk-tap:active { opacity:.7; }
        .drunk-left { background:rgba(42,90,138,.12); border-color:#2a5a8a; color: #a0d0f0; }
        .drunk-right { background:rgba(138,42,42,.12); border-color:#8a2a2a; color: #f0a0a0; }

        @keyframes flyBuzz{0%,100%{transform:rotate(-5deg);}50%{transform:rotate(5deg);}}
        @keyframes bounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
    `}</style>
);

// ========== 7. 🪰 ハエ捕まえ ==========

export function FlyGame({ handleGameEnd }) {
    const [caught, setCaught] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const [flyPos, setFlyPos] = useState({ x: 150, y: 150, vx: 5, vy: 5 });
    
    const timerRef = useRef(null);
    const rafRef = useRef(null);
    const playingRef = useRef(false);

    const init = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setResult(null); setPlaying(false); playingRef.current = false; 
        setTime(10); setCaught(0);
    }, []);

    const start = () => {
        setPlaying(true); playingRef.current = true; setCaught(0); 
        setFlyPos({ x: 150, y: 150, vx: 6, vy: 6 });
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
        
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        animate();
    };

    const animate = () => {
        if (!playingRef.current) return;
        setFlyPos(p => {
            let { x, y, vx, vy } = p;
            // ランダムな揺らぎを加える
            vx += (Math.random() - 0.5) * 2.0; 
            vy += (Math.random() - 0.5) * 2.0;
            
            // 速度制限
            const spd = Math.hypot(vx, vy);
            const max = 12 + caught * 2; // 捕まえるほど速くなる
            if (spd > max) { vx = (vx / spd) * max; vy = (vy / spd) * max; }
            
            x += vx; y += vy;
            
            // 壁での反射 (コンテナ幅約340, 高さ260を想定)
            if (x < 10) { x = 10; vx = Math.abs(vx) + 1; }
            if (x > 300) { x = 300; vx = -Math.abs(vx) - 1; }
            if (y < 10) { y = 10; vy = Math.abs(vy) + 1; }
            if (y > 250) { y = 250; vy = -Math.abs(vy) - 1; }
            
            return { x, y, vx, vy };
        });
        rafRef.current = requestAnimationFrame(animate);
    };

    const end = useCallback((forceWin) => {
        setPlaying(false); playingRef.current = false;
        if (timerRef.current) clearInterval(timerRef.current); 
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        
        setCaught(c => {
            const win = forceWin || c >= 3;
            const p = win ? 15 : c * 3;
            setResult({ win, icon: win ? '🪰' : '⏰', main: win ? '3匹全部捕まえた！' : '時間切れ！', sub: `${c}匹捕獲`, pts: p });
            if (p > 0) handleGameEnd(p);
            return c;
        });
    }, [handleGameEnd]);

    const catchFly = (e) => {
        e.stopPropagation();
        if (!playing) return;
        setCaught(c => {
            const nc = c + 1;
            if (nc >= 3) { 
                end(true); 
            } else { 
                // 次のハエをランダムな位置に再配置
                setFlyPos({ 
                    x: rnd(30, 280), y: rnd(30, 230), 
                    vx: rnd(5, 10) * (Math.random() > 0.5 ? 1 : -1), 
                    vy: rnd(5, 10) * (Math.random() > 0.5 ? 1 : -1) 
                }); 
            }
            return nc;
        });
    };

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); playingRef.current = false; }; }, [init]);
    useEffect(() => { if (time === 0 && playing) end(false); }, [time, playing, end]);

    return (
        <>
            <MiniGameStylesPart3 />
            <GameHeader title="🪰 ハエ捕まえ" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'center' }}>
                    <div>
                        <div style={{ fontSize: '.6rem', color: 'var(--dim)', textAlign: 'center', letterSpacing: '.1em' }}>CATCH</div>
                        <div className="fly-timer-box" style={{ textAlign: 'center' }}>{caught}</div>
                    </div>
                    <div className="fly-prog">
                        {[0, 1, 2].map(i => <div key={i} className={`fly-prog-dot ${caught > i ? 'caught' : ''}`}>{caught > i ? '✓' : '🪰'}</div>)}
                    </div>
                </div>
                
                <div className="fly-arena">
                    {!playing && !result && (
                        <div className="fly-start-overlay" onClick={start}>
                            <div className="big-fly">🪰</div>
                            <div style={{ fontSize: '.85rem', color: 'var(--dim)' }}>タップでスタート！</div>
                        </div>
                    )}
                    {playing && (
                        <div 
                            className="fly" 
                            style={{ left: flyPos.x, top: flyPos.y, transform: flyPos.vx < 0 ? 'scaleX(-1)' : 'scaleX(1)' }} 
                            onPointerDown={catchFly}
                        >
                            🪰
                        </div>
                    )}
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

// ========== 8. 🐀 ネズミ追い払い ==========

export function RatGame({ handleGameEnd }) {
    const { addGachaAssets } = useUserStore();
    const [rats, setRats] = useState([]);
    const [hit, setHit] = useState(0);
    const [stolen, setStolen] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    
    const timerRef = useRef(null);
    const rafRef = useRef(null);
    const playingRef = useRef(false);

    const init = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setResult(null); setPlaying(true); playingRef.current = true; 
        setTime(10); setHit(0); setStolen(0);
        
        // 初期ネズミ4匹スポーン
        setRats(Array.from({ length: 4 }, (_, i) => spawnRat(i)));
        
        timerRef.current = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
        animate();
    }, []);

    const spawnRat = (id) => {
        const side = rnd(0, 3);
        const w = 340; // arena width approx
        const h = 240; // arena height approx
        let x = side === 0 ? rnd(0, w) : side === 1 ? w : side === 2 ? rnd(0, w) : 0;
        let y = side === 0 ? 0 : side === 1 ? rnd(0, h) : side === 2 ? h : rnd(0, h);
        const speed = rnd(9, 16) / 10;
        return { id, x, y, alive: true, speed };
    };

    const animate = () => {
        if (!playingRef.current) return;
        setRats(prev => {
            let next = [...prev];
            const cx = 170; // 画面中央X
            const cy = 120; // 画面中央Y
            
            next.forEach(r => {
                if (!r.alive) return;
                const dx = cx - r.x;
                const dy = cy - r.y;
                const dist = Math.hypot(dx, dy);
                
                // 中央（荷物）に到達したか判定
                if (dist < 25) { 
                    r.alive = false; 
                    // リアルタイムで所持Pを減らす
                    addGachaAssets(0, -2);
                    setStolen(s => s + 2); 
                    
                    // 1.2秒後に新しいネズミを補充
                    setTimeout(() => {
                        if(playingRef.current) setRats(rr => rr.map(x => x.id === r.id ? spawnRat(x.id) : x));
                    }, 1200);
                } else { 
                    // 中央へ向かって移動
                    r.x += (dx / dist) * r.speed; 
                    r.y += (dy / dist) * r.speed; 
                    r.dx = dx; // 向き判定用
                }
            });
            rafRef.current = requestAnimationFrame(animate);
            return next;
        });
    };

    const tapRat = (e, id) => {
        e.stopPropagation();
        if (!playing) return;
        setRats(prev => prev.map(r => r.id === id ? { ...r, alive: false } : r));
        setHit(h => h + 1);
        
        // 1秒後に新しいネズミを補充
        setTimeout(() => {
            if(playingRef.current) setRats(prev => prev.map(r => r.id === id ? spawnRat(id) : r));
        }, 1000);
    };

    const end = useCallback(() => {
        setPlaying(false); playingRef.current = false;
        if (timerRef.current) clearInterval(timerRef.current); 
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        
        setStolen(s => {
            setHit(h => {
                const win = s <= 3; // 3P以下の損失なら成功
                const p = win ? Math.max(0, h * 2 - s) : 0;
                setResult({ win, icon: win ? '🐀' : '💀', main: win ? 'ネズミ撃退成功！' : '盗まれすぎた…', sub: `撃退${h}匹 / 損失${s}P`, pts: p });
                if (p > 0) handleGameEnd(p);
                return h;
            });
            return s;
        });
    }, [handleGameEnd]);

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); playingRef.current = false; }; }, [init]);
    useEffect(() => { if (time === 0 && playing) end(); }, [time, playing, end]);

    return (
        <>
            <MiniGameStylesPart3 />
            <GameHeader title="🐀 ネズミ追い払い" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="status-row">
                    <div className="stat-box"><span className="stat-label">🐀 撃退</span><span className="stat-val">{hit}</span></div>
                    <div className="stat-box"><span className="stat-label">💰 損失</span><span className="stat-val" style={{ color: 'var(--red2)' }}>{stolen}P</span></div>
                </div>
                
                <div className="rat-arena">
                    <div className="rat-stash">💰</div>
                    {rats.map(r => r.alive && (
                        <div 
                            key={r.id} 
                            className="rat-el"
                            onPointerDown={(e) => tapRat(e, r.id)} 
                            style={{ 
                                left: r.x, top: r.y, 
                                transform: r.dx < 0 ? 'scaleX(-1)' : 'scaleX(1)' 
                            }}
                        >
                            🐀
                        </div>
                    ))}
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

// ========== 9. 🍺 酔っ払いバランス ==========

export function DrunkGame({ handleGameEnd }) {
    const [bal, setBal] = useState(50);
    const [keep, setKeep] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    
    const timerRef = useRef(null);
    const rafRef = useRef(null);
    const drift = useRef(0);
    const playingRef = useRef(false);

    const init = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setResult(null); setPlaying(true); playingRef.current = true; 
        setTime(10); setBal(50); setKeep(0); drift.current = 0;
        
        timerRef.current = setInterval(() => {
            setTime(t => Math.max(0, t - 1));
            // 1秒ごとに緑ゾーン(35〜65)にいるか判定し、いれば秒数加算
            setBal(b => { 
                if (b >= 35 && b <= 65) setKeep(k => k + 1); 
                return b; 
            });
        }, 1000);
        animate();
    }, []);

    const animate = () => {
        if (!playingRef.current) return;
        setBal(b => {
            // ランダムな揺らぎ（ドリフト）を加算
            drift.current += (Math.random() - 0.5) * 0.8;
            // 揺らぎの最大速度を制限
            drift.current = Math.max(-2.5, Math.min(2.5, drift.current));
            
            const nb = b + drift.current;
            // ゲージが振り切れたら即座に失敗
            if (nb <= 0 || nb >= 100) { 
                end(false); 
                return nb <= 0 ? 0 : 100; 
            }
            
            rafRef.current = requestAnimationFrame(animate);
            return nb;
        });
    };

    const tap = (e, direction) => { 
        e.preventDefault();
        if (playing) { 
            // タップでゲージを戻し、ドリフト（慣性）も相殺する
            setBal(b => Math.max(0, Math.min(100, b - direction * 10))); 
            drift.current -= direction * 1.5; 
        } 
    };

    const end = useCallback((survived) => {
        setPlaying(false); playingRef.current = false;
        if (timerRef.current) clearInterval(timerRef.current); 
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        
        setKeep(k => {
            const win = survived && k >= 6; // 6秒以上キープで成功
            const p = win ? Math.floor(k * 1.5) : 0;
            setResult({ win, icon: win ? '🎉' : '🌀', main: win ? 'バランスキープ成功！' : '倒れた！', sub: `緑ゾーン内 ${k}秒`, pts: p });
            if (p > 0) handleGameEnd(p);
            return k;
        });
    }, [handleGameEnd]);

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); playingRef.current = false; }; }, [init]);
    useEffect(() => { if (time === 0 && playing) end(true); }, [time, playing, end]);

    return (
        <>
            <MiniGameStylesPart3 />
            <GameHeader title="🍺 酔っ払いバランス" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="instr">緑ゾーンを6秒以上キープで成功！<br/>左に傾いたら右タップ、右なら左タップ！</div>
                
                <div className="stat-box" style={{ width: '100%' }}>
                    <span className="stat-label">✅ ゾーン内</span>
                    <span className="stat-val" style={{ color: 'var(--green2)', fontSize: '1.2rem' }}>{keep}秒</span>
                </div>
                
                <div className="drunk-char" style={{ transform: `rotate(${(bal - 50) / 1.5}deg)` }}>🧔</div>
                
                <div style={{ width: '100%' }}>
                    <div style={{ fontSize: '.75rem', color: 'var(--dim)', textAlign: 'center', marginBottom: '.3rem' }}>← 左タップ　　　　右タップ →</div>
                    <div className="balance-bar-track">
                        <div className="balance-center"></div>
                        <div className="balance-zone"></div>
                        <div className="balance-indicator" style={{ left: `${bal}%` }}></div>
                    </div>
                </div>
                
                {!result && (
                    <div className="drunk-tap-area">
                        <div className="drunk-tap drunk-left" onPointerDown={(e) => tap(e, -1)}>← 左</div>
                        <div className="drunk-tap drunk-right" onPointerDown={(e) => tap(e, 1)}>右 →</div>
                    </div>
                )}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}