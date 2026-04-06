import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';

// ========== 共通ユーティリティ ==========
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// ========== 共通UIコンポーネント ==========

export const MiniGameStyles = () => (
    <style>{`
        :root {
            --bg: #0c0a07; --card: #1a1309; --card2: #241a0e; --border: #3d2e1a;
            --border2: #5a4228; --amber: #c97b2a; --gold: #e8b84b; --green2: #4e8539;
            --red2: #b52e1e; --text: #d4c4a0; --dim: #7a6a4a; --white: #f0e8d0;
        }
        /* Shared */
        .game-header { width:100%; display:flex; align-items:center; gap:.8rem; padding:.7rem 1rem; background:rgba(0,0,0,.6); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:50; }
        .back-btn { background:var(--card2); border:1px solid var(--border); color:var(--text); padding:.35rem .9rem; border-radius:6px; cursor:pointer; font-size:.82rem; }
        .gh-title { font-family:'Bebas Neue',sans-serif; font-size:1.3rem; color:var(--amber); }
        .gh-cd { font-family:'Bebas Neue',sans-serif; font-size:1.5rem; color:var(--gold); margin-left:auto; }
        .gh-cd.danger { color:var(--red2); }
        .game-body { flex:1; display:flex; flex-direction:column; align-items:center; padding:1rem; width:100%; max-width:500px; margin:0 auto; gap:.9rem; }
        .instr { font-size:.78rem; color:var(--dim); text-align:center; background:rgba(0,0,0,.4); padding:.5rem .9rem; border-radius:8px; width:100%; border:1px solid var(--border); }
        .btn-prim { background:linear-gradient(135deg,var(--amber),#8a5010); border:none; border-radius:12px; color:var(--white); font-weight:700; padding:.75rem 2.2rem; cursor:pointer; box-shadow:0 4px 20px rgba(201,123,42,.4); transition:transform .12s;}
        .btn-prim:active { transform:translateY(2px); }
        .result-box { text-align:center; background:var(--card2); border:1px solid var(--border2); border-radius:14px; padding:.9rem 1.2rem; width:100%; animation:popIn .4s cubic-bezier(.34,1.56,.64,1); }
        .r-badge { font-size:.8rem; font-weight:900; padding:.2rem .8rem; border-radius:20px; display:inline-block; margin-bottom:.4rem; }
        .r-badge.win { background:rgba(78,133,57,.3); color:#90e060; border:1px solid #4e8539; }
        .r-badge.fail { background:rgba(140,35,24,.3); color:#ff8070; border:1px solid #8c2318; }
        .r-win { font-size:1.4rem; color:var(--gold); font-weight:900; margin-top:.4rem; }
        .r-lose { font-size:1.4rem; color:var(--red2); font-weight:900; margin-top:.4rem; }
        .r-sub { font-size:.95rem; color:var(--gold); font-weight:700; margin-top:.3rem; }
        .r-sub-dim { font-size:.82rem; color:var(--dim); margin-top:.25rem; }
        @keyframes popIn{from{transform:scale(.5);opacity:0;}to{transform:scale(1);opacity:1;}}

        /* Box Game */
        .boxes-row { display:flex; gap:1rem; justify-content:center; }
        .box { width:100px; height:110px; background:linear-gradient(145deg,#9b7520,#5c4010); border:3px solid #7a5a18; border-radius:8px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:2.6rem; position:relative; box-shadow:0 6px 20px rgba(0,0,0,.6); transition:transform .18s cubic-bezier(.34,1.56,.64,1); user-select:none; }
        .box::before { content:''; position:absolute; top:12px; left:0; right:0; height:3px; background:rgba(0,0,0,.3); }
        .box::after { content:''; position:absolute; top:0; bottom:0; left:50%; width:3px; background:rgba(0,0,0,.2); transform:translateX(-50%); }
        .box:hover { transform:scale(1.06) translateY(-4px); } .box:active { transform:scale(.96); }
        .box.shake { animation:shake .35s ease; } .box.dim { opacity:.4; cursor:default; pointer-events:none; }
        .box.win-box { background:linear-gradient(145deg,#2a5a18,#163a0a); border-color:#4a8a28; animation:glow 1.5s ease infinite; }
        .box.lose-box { background:linear-gradient(145deg,#5a1818,#3a0a0a); border-color:#8a2828; }
        .box-num { position:absolute; bottom:6px; font-family:'Bebas Neue',sans-serif; font-size:.75rem; letter-spacing:.15em; color:rgba(255,255,255,.4); }
        @keyframes shake{0%,100%{transform:translateX(0);}20%{transform:translateX(-8px);}40%{transform:translateX(6px);}60%{transform:translateX(-4px);}80%{transform:translateX(3px);}}
        @keyframes glow{0%,100%{box-shadow:0 0 10px rgba(232,184,75,.3);}50%{box-shadow:0 0 30px rgba(232,184,75,.8);}}

        /* Vend Game */
        .vending-row { display:flex; gap:.8rem; justify-content:center; }
        .vending { width:110px; height:180px; border-radius:8px 8px 4px 4px; cursor:pointer; display:flex; flex-direction:column; align-items:center; padding:.5rem .4rem; position:relative; box-shadow:-4px 4px 15px rgba(0,0,0,.7),inset -3px 0 8px rgba(0,0,0,.3); transition:transform .18s cubic-bezier(.34,1.56,.64,1); user-select:none; border:3px solid; }
        .vending:hover { transform:scale(1.04) translateY(-4px); } .vending:active { transform:scale(.97); }
        .vending.dim { opacity:.4; cursor:default; pointer-events:none; }
        .v-screen { width:85%; height:62px; background:#080f08; border:2px solid #1a2a1a; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:1.9rem; margin-bottom:.35rem; }
        .v-btns { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; width:85%; margin-bottom:.25rem; }
        .v-btn-dot { height:12px; border-radius:2px; border:1px solid rgba(255,255,255,.1); }
        .v-slot { width:55%; height:16px; background:#050505; border:2px solid #1a1a1a; border-radius:2px; margin-top:auto; display:flex; align-items:center; justify-content:center; font-size:.6rem; color:#444; }
        .v-label { font-size:.6rem; color:rgba(255,255,255,.35); margin-top:3px; font-family:'Bebas Neue',sans-serif; letter-spacing:.1em; }
        .v-coin-drop { position:absolute; bottom:22px; left:50%; font-size:1.1rem; animation:coinDrop .5s ease-in forwards; pointer-events:none; }
        @keyframes coinDrop{from{transform:translateX(-50%) translateY(-15px);opacity:1;}to{transform:translateX(-50%) translateY(25px);opacity:0;}}

        /* Scratch Game */
        .scratch-remain { font-size:.95rem; font-weight:700; color:var(--amber); text-align:center; }
        .scratch-grid-wrap { background:linear-gradient(145deg,#1a1308,#0d0a05); border:2px solid var(--border); border-radius:14px; padding:.9rem; display:inline-block; }
        .scratch-grid { display:grid; grid-template-columns:repeat(3,84px); grid-template-rows:repeat(3,84px); gap:.45rem; }
        .scratch-cell { width:84px; height:84px; position:relative; border-radius:8px; overflow:hidden; border:2px solid var(--border); }
        .scratch-reveal { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:2.1rem; background:var(--card2); transition:opacity 0.2s; }
        .scratch-canvas { position:absolute; inset:0; touch-action:none; cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'%3E%3Ccircle cx='15' cy='15' r='12' fill='%23e8b84b' stroke='%23a07820' stroke-width='2'/%3E%3Ctext x='15' y='20' text-anchor='middle' font-size='12' font-weight='bold' fill='%23333'%3E%C2%A5%3C/text%3E%3C/svg%3E") 15 15,pointer; }
    `}</style>
);

export const GameHeader = ({ title, time, isTimerDanger }) => (
    <div className="game-header">
        <button className="back-btn" onClick={() => useGameStore.setState({ gamePhase: 'minigame_menu' })}>← 戻る</button>
        <span className="gh-title">{title}</span>
        <span className={`gh-cd ${isTimerDanger ? 'danger' : ''}`}>{time}</span>
    </div>
);

export const ResultBox = ({ win, icon, main, sub, pts, onRetry }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '1rem' }}>
        <div className="result-box">
            <div className={`r-badge ${win ? 'win' : 'fail'}`}>{win ? '✅ SUCCESS' : '❌ FAILED'}</div>
            <div className={win ? 'r-win' : 'r-lose'}>{icon} {main}</div>
            {sub && <div className="r-sub-dim">{sub}</div>}
            {pts > 0 && <div className="r-sub">+{pts}P ゲット！</div>}
        </div>
        <button className="btn-prim" onClick={onRetry}>🔁 もう一度</button>
    </div>
);

// ========== 1. 📦 箱選びゲーム ==========

export function BoxGame({ handleGameEnd }) {
    const [msg, setMsg] = useState('シャッフル中…');
    const [boxes, setBoxes] = useState([
        { id: 0, state: 'normal', text: '📦', num: 'BOX 1' },
        { id: 1, state: 'normal', text: '📦', num: 'BOX 2' },
        { id: 2, state: 'normal', text: '📦', num: 'BOX 3' },
    ]);
    const [result, setResult] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [time, setTime] = useState(10);
    const winBox = useRef(-1);

    // タイマー管理
    useEffect(() => {
        if (!playing) return;
        const timer = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(timer);
    }, [playing]);

    // 時間切れ監視
    useEffect(() => {
        if (time === 0 && playing) pickBox(rnd(0, 2), true);
    }, [time, playing]);

    const init = useCallback(async () => {
        setResult(null); setPlaying(false); setTime(10); setMsg('シャッフル中…');
        setBoxes(prev => prev.map(b => ({ ...b, state: 'normal', text: '📦', num: `BOX ${b.id + 1}` })));
        winBox.current = rnd(0, 2);
        
        for (let r = 0; r < 6; r++) {
            const a = rnd(0, 2), b = (a + 1 + rnd(0, 1)) % 3;
            setBoxes(prev => prev.map(bx => bx.id === a || bx.id === b ? { ...bx, state: 'shake' } : bx));
            await sleep(300);
            setBoxes(prev => prev.map(bx => ({ ...bx, state: 'normal' })));
            await sleep(70);
        }
        setMsg('どれだ！10秒以内に選べ！');
        setPlaying(true);
    }, []);

    useEffect(() => { init(); }, [init]);

    const pickBox = async (idx, isTimeout = false) => {
        if (!isTimeout && !playing) return;
        setPlaying(false);
        const win = idx === winBox.current;
        
        setBoxes(prev => prev.map((b, i) => {
            if (i === idx) return { ...b, state: win ? 'win-box' : 'lose-box', text: win ? '✅' : '❌', num: win ? '当たり！' : 'ハズレ' };
            return b;
        }));
        await sleep(400);
        
        if (!win) {
            setBoxes(prev => prev.map((b, i) => i === winBox.current ? { ...b, state: 'win-box', text: '✅', num: '当たり！' } : b));
        }
        setBoxes(prev => prev.map((b, i) => i !== idx && i !== winBox.current ? { ...b, state: 'dim' } : b));
        await sleep(200);
        
        const prizes = [{ e: '🥫', l: '空き缶発見！', p: 3 }, { e: '💰', l: 'お金を見つけた！', p: 10 }, { e: '🍺', l: 'ビール缶ゲット！', p: 5 }];
        const pz = prizes[rnd(0, 2)];
        
        if (win) { 
            setResult({ win: true, icon: pz.e, main: pz.l, sub: '', pts: pz.p }); 
            handleGameEnd(pz.p); 
        } else { 
            setResult({ win: false, icon: '💀', main: 'ハズレ…', sub: 'また挑戦しな', pts: 0 }); 
        }
    };

    return (
        <>
            <MiniGameStyles />
            <GameHeader title="📦 箱選び" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="instr">{msg}</div>
                <div className="boxes-row">
                    {boxes.map(b => (
                        <div key={b.id} className={`box ${b.state}`} onClick={() => pickBox(b.id)}>
                            {b.text}<span className="box-num">{b.num}</span>
                        </div>
                    ))}
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

// ========== 2. 🏧 ボロ自販機ガチャ ==========

export function VendGame({ handleGameEnd }) {
    const [machines, setMachines] = useState([]);
    const [result, setResult] = useState(null);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    
    useEffect(() => {
        if (!playing) return;
        const timer = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(timer);
    }, [playing]);

    useEffect(() => {
        if (time === 0 && playing) pickVend(rnd(0, 2), true);
    }, [time, playing]);

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10);
        const VEND_WIN = [{ e: '💰', l: 'コイン大量発見！', p: 15 }, { e: '🥤', l: 'コーヒー缶！', p: 10 }, { e: '🎁', l: '謎のプレゼント！', p: 12 }];
        const VEND_LOSE = [{ e: '❌', l: '空っぽ…', p: 0 }, { e: '🕷️', l: 'クモが出た！', p: 0 }, { e: '💨', l: '何も出てこない…', p: 0 }];
        const VEND_STYLES = [['#2a3020', '#3d4a30', '#4a6a38'], ['#2a2010', '#3d3018', '#6a5020'], ['#102030', '#182838', '#204858']];
        
        const winItem = VEND_WIN[rnd(0, VEND_WIN.length - 1)];
        const losers = [...VEND_LOSE].sort(() => Math.random() - 0.5).slice(0, 2);
        const choices = [winItem, ...losers].sort(() => Math.random() - 0.5);
        const labels = ['缶ジュース', 'エナジー', 'ビール'];
        
        setMachines(choices.map((c, i) => ({
            id: i, data: c, style: VEND_STYLES[i], label: labels[i], state: 'normal', screen: '?', showCoin: false
        })));
    }, []);

    useEffect(() => { init(); }, [init]);

    const pickVend = async (idx, isTimeout = false) => {
        if (!isTimeout && !playing) return;
        setPlaying(false);
        
        for (const f of ['⚙️', '🔄', '⚡', '🔄']) {
            setMachines(prev => prev.map(m => m.id === idx ? { ...m, screen: f } : m));
            await sleep(130);
        }
        
        const pr = machines[idx].data;
        const isWin = pr.p > 0;
        
        setMachines(prev => prev.map(m => m.id === idx ? { ...m, screen: pr.e, showCoin: isWin } : { ...m, screen: m.data.e, state: 'dim' }));
        await sleep(600);
        
        if (isWin) { 
            setResult({ win: true, icon: pr.e, main: pr.l, sub: '当たり1台を引き当てた！', pts: pr.p }); 
            handleGameEnd(pr.p); 
        } else { 
            setResult({ win: false, icon: '💀', main: '空っぽ…', sub: '3台のうちハズレを選んだ', pts: 0 }); 
        }
    };

    return (
        <>
            <MiniGameStyles />
            <GameHeader title="🏧 ボロ自販機" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="instr">3台のうち当たりは1台だけ！はずれ2台は空っぽ！</div>
                <div className="vending-row">
                    {machines.map(m => (
                        <div key={m.id} className={`vending ${m.state}`} style={{ background: `linear-gradient(180deg,${m.style[0]} 0%,${m.style[1]} 100%)`, borderColor: m.style[2] }} onClick={() => pickVend(m.id)}>
                            <div className="v-screen"><span style={{ opacity: m.screen === '?' ? 0.45 : 1, fontSize: m.screen === '?' ? '1.5rem' : '1.9rem' }}>{m.screen}</span></div>
                            <div className="v-btns">{[0, 1, 2].map(i => <div key={i} className="v-btn-dot" style={{ background: m.style[2] }}></div>)}</div>
                            <div className="v-slot">↓</div>
                            <div className="v-label">{m.label}</div>
                            {m.showCoin && <div className="v-coin-drop">🪙</div>}
                        </div>
                    ))}
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

// ========== 3. 🪙 スクラッチくじ ==========

// Canvasを内包して削る挙動を管理するセルコンポーネント
function ScratchCell({ sym, isRevealed, onReveal, disabled }) {
    const canvasRef = useRef(null);
    const [scratched, setScratched] = useState(false);
    const isDrawing = useRef(false);

    useEffect(() => {
        const cv = canvasRef.current;
        if (!cv) return;
        const ctx = cv.getContext('2d');

        // 初期カバーの描画
        const g = ctx.createLinearGradient(0, 0, 84, 84);
        g.addColorStop(0, '#4a3520'); g.addColorStop(0.5, '#3a2818'); g.addColorStop(1, '#2e1e10');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 84, 84);

        ctx.strokeStyle = 'rgba(180,130,70,.15)'; ctx.lineWidth = 1;
        for (let y = 8; y < 84; y += 13) {
            ctx.beginPath();
            ctx.moveTo(0, y + (Math.random() - 0.5) * 3);
            ctx.lineTo(84, y + (Math.random() - 0.5) * 3);
            ctx.stroke();
        }
        ctx.font = 'bold 26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(220,170,80,.6)'; ctx.fillText('？', 42, 40);
        ctx.font = '8px sans-serif'; ctx.fillStyle = 'rgba(180,140,70,.45)'; ctx.fillText('¥100', 42, 68);
    }, []); // 初回のみ描画

    const scratch = (clientX, clientY) => {
        if (scratched || disabled || isRevealed) return;
        const cv = canvasRef.current;
        const ctx = cv.getContext('2d');
        const rect = cv.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // 削る処理（destination-out）
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();

        // 透過ピクセル（削られた面積）の割合を計算
        const data = ctx.getImageData(0, 0, 84, 84).data;
        let transparentPixels = 0;
        for (let p = 3; p < data.length; p += 4) {
            if (data[p] < 50) transparentPixels++;
        }
        
        // 50%以上削られたら確定
        if (transparentPixels / (84 * 84) > 0.5) {
            setScratched(true);
            onReveal();
        }
    };

    const handleStart = (e) => { isDrawing.current = true; scratch(e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY); };
    const handleMove = (e) => { if (!isDrawing.current) return; scratch(e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY); };
    const handleEnd = () => { isDrawing.current = false; };

    const showFace = scratched || isRevealed;

    return (
        <div className="scratch-cell" style={{ background: showFace ? 'var(--card2)' : '#4a3520' }}>
            <div className="scratch-reveal" style={{ opacity: showFace ? 1 : 0 }}>{sym}</div>
            <canvas
                ref={canvasRef}
                className="scratch-canvas"
                width={84}
                height={84}
                style={{ opacity: showFace ? 0 : 1, pointerEvents: showFace ? 'none' : 'auto' }}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
            />
        </div>
    );
}

export function ScratchGame({ handleGameEnd }) {
    const SC_SYMS = ['🥫', '💰', '🍺', '🐀', '💊', '🎁'];
    const [grid, setGrid] = useState([]);
    const [revealed, setRevealed] = useState(Array(9).fill(false));
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const [gameKey, setGameKey] = useState(0); // Canvas再マウント用
    
    const count = revealed.filter(Boolean).length;

    useEffect(() => {
        if (!playing) return;
        const timer = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(timer);
    }, [playing]);

    const checkResult = useCallback(() => {
        setPlaying(false);
        const rev = grid.filter((_, i) => revealed[i]);
        const counts = {};
        rev.forEach(s => counts[s] = (counts[s] || 0) + 1);
        const mx = Math.max(0, ...Object.values(counts));
        const ws = Object.keys(counts).find(k => counts[k] === mx) || '';
        
        const win = mx >= 2; 
        const p = mx >= 3 ? 20 : mx >= 2 ? 5 : 0;
        
        setResult({ 
            win, 
            icon: win ? '🎊' : '💀', 
            main: win ? `${ws}×${mx} 揃い！` : '揃わなかった…', 
            sub: `削ったマス: ${rev.join(' ')}`, 
            pts: p 
        });
        
        if (win) handleGameEnd(p);
    }, [grid, revealed, handleGameEnd]);

    // 3マス削り終わるか時間切れで判定
    useEffect(() => {
        if (playing && (count >= 3 || time === 0)) {
            checkResult();
        }
    }, [count, time, playing, checkResult]);

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10); setRevealed(Array(9).fill(false));
        setGameKey(k => k + 1); // Componentを再生成してCanvasを初期化
        
        const newGrid = Array.from({ length: 9 }, () => SC_SYMS[rnd(0, 5)]);
        // 30%の確率で必ず1つは3つ揃うようにする
        if (Math.random() < 0.3) { 
            const sym = SC_SYMS[rnd(0, 5)]; 
            const pos = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5).slice(0, 3); 
            pos.forEach(p => newGrid[p] = sym); 
        }
        setGrid(newGrid);
    }, []);

    useEffect(() => { init(); }, [init]);

    const handleReveal = (idx) => {
        if (!playing || revealed[idx] || count >= 3) return;
        setRevealed(prev => {
            const next = [...prev]; 
            next[idx] = true;
            return next;
        });
    };

    return (
        <>
            <MiniGameStyles />
            <GameHeader title="🪙 スクラッチ" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="scratch-remain">あと {3 - count} マス削れます</div>
                <div className="scratch-grid-wrap">
                    <div className="scratch-grid" key={gameKey}>
                        {grid.map((sym, i) => (
                            <ScratchCell 
                                key={i} 
                                sym={sym} 
                                isRevealed={revealed[i] || (!playing && result)} 
                                onReveal={() => handleReveal(i)} 
                                disabled={!playing || count >= 3} 
                            />
                        ))}
                    </div>
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}