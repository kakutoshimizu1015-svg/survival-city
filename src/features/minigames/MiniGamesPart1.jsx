import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ─── 共通ユーティリティ (他Partでも利用) ───────────────── */
export const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const beep = (freq = 440, dur = 0.1) => {
    try {
        const a = new (window.AudioContext || window.webkitAudioContext)();
        const o = a.createOscillator(), g = a.createGain();
        o.connect(g); g.connect(a.destination);
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.25, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
        o.start(); o.stop(a.currentTime + dur);
    } catch (_) {}
};

/* ─── 共通スタイル定義 ───────────────────────────────── */
export const S = {
    screen: { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto', overflowX: 'hidden', background: '#0c0a07', color: '#d4c4a0', fontFamily: "'Noto Sans JP', sans-serif", zIndex: 1000 },
    header: { width: '100%', display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.65rem .9rem', background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #3d2e1a', position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 },
    body: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', width: '100%', maxWidth: 500, margin: '0 auto', gap: '.85rem' },
    instr: { fontSize: '.78rem', color: '#7a6a4a', textAlign: 'center', lineHeight: 1.6, background: 'rgba(0,0,0,.4)', padding: '.5rem .9rem', borderRadius: 8, border: '1px solid #3d2e1a', width: '100%' },
    btnPrim: { background: 'linear-gradient(135deg,#c97b2a,#8a5010)', border: 'none', borderRadius: 12, color: '#f0e8d0', font: "700 1rem 'Noto Sans JP',sans-serif", padding: '.75rem 2.2rem', cursor: 'pointer', boxShadow: '0 4px 20px rgba(201,123,42,.4)', userSelect: 'none' },
    statBox: { background: '#241a0e', border: '1px solid #3d2e1a', borderRadius: 8, padding: '.35rem .9rem', textAlign: 'center', fontSize: '.85rem' },
    resultBox: { textAlign: 'center', animation: 'popIn .4s cubic-bezier(.34,1.56,.64,1)', background: '#241a0e', border: '1px solid #5a4228', borderRadius: 14, padding: '.9rem 1.2rem', width: '100%' }
};

/* ─── 共通UIコンポーネント (他Partでも利用) ─────────────── */
export function BackBtn({ onClick }) {
    return <button onClick={onClick} style={{ background: '#2e2213', border: '1px solid #3d2e1a', color: '#d4c4a0', padding: '.35rem .9rem', borderRadius: 6, cursor: 'pointer', font: "inherit", fontSize: '.82rem', flexShrink: 0 }}>← 戻る</button>;
}

export function BtnPrim({ children, onClick, disabled, style }) {
    return <button onClick={onClick} disabled={disabled} style={{ ...S.btnPrim, ...(disabled ? { opacity: .4, cursor: 'not-allowed' } : {}), ...style }}>{children}</button>;
}

export function StatBox({ label, val, style }) {
    return <div style={S.statBox}><span style={{ fontSize: '.6rem', color: '#7a6a4a', letterSpacing: '.1em', display: 'block' }}>{label}</span><span style={{ fontWeight: 700, color: '#f0e8d0', ...style }}>{val}</span></div>;
}

export function Instr({ children }) {
    return <div style={S.instr}>{children}</div>;
}

export function ResultBox({ result }) {
    if (!result) return null;
    const { win, icon, main, sub, pts: p } = result;
    return (
        <div style={S.resultBox}>
            <div style={{ fontSize: '.8rem', fontWeight: 900, letterSpacing: '.15em', padding: '.2rem .8rem', borderRadius: 20, display: 'inline-block', marginBottom: '.35rem', background: win ? 'rgba(78,133,57,.3)' : 'rgba(140,35,24,.3)', color: win ? '#90e060' : '#ff8070', border: `1px solid ${win ? '#4e8539' : '#8c2318'}` }}>{win ? '✅ SUCCESS' : '❌ FAILED'}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: win ? '#e8b84b' : '#b52e1e' }}>{icon} {main}</div>
            {sub && <div style={{ fontSize: '.82rem', color: '#7a6a4a', marginTop: '.25rem' }}>{sub}</div>}
            {p > 0 && <div style={{ fontSize: '.95rem', color: '#e8b84b', fontWeight: 700, marginTop: '.3rem' }}>+{p}P ゲット！</div>}
        </div>
    );
}

export function GameHeader({ title, pts, timer, onBack }) {
    return (
        <div style={S.header}>
            <BackBtn onClick={onBack} />
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.3rem', color: '#c97b2a', letterSpacing: '.05em' }}>{title}</span>
            <span style={{ fontSize: '.82rem', color: '#e8b84b', fontWeight: 700, marginLeft: 'auto' }}>💰{pts}P</span>
            {timer != null && <span style={{ marginLeft: '1rem', fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.5rem', color: timer <= 3 ? '#b52e1e' : '#e8b84b', minWidth: '2rem', textAlign: 'right' }}>{timer}</span>}
        </div>
    );
}

/* ─── タイマーフック (安全な状態管理) ──────────────────── */
export function useTimer(secs, onEnd) {
    const [time, setTime] = useState(secs);
    const ivRef = useRef(null);
    const doneRef = useRef(false);
    const cbRef = useRef(onEnd);
    cbRef.current = onEnd;

    const start = useCallback((overrideSecs) => {
        const total = overrideSecs ?? secs;
        doneRef.current = false;
        setTime(total);
        clearInterval(ivRef.current);
        let t = total;
        ivRef.current = setInterval(() => {
            t--;
            setTime(t);
            if (t <= 0) {
                clearInterval(ivRef.current);
                if (!doneRef.current) { doneRef.current = true; cbRef.current(); }
            }
        }, 1000);
    }, [secs]);

    const stop = useCallback(() => {
        doneRef.current = true;
        clearInterval(ivRef.current);
    }, []);

    useEffect(() => () => clearInterval(ivRef.current), []);
    return { time, start, stop };
}

/* ════════════════════════════════════════
   Game 1: 📦 箱選びゲーム
════════════════════════════════════════ */
export function BoxGame({ pts, addPts, onBack, isEventMode, isObserver }) {
    const [msg, setMsg] = useState('シャッフル中…');
    const [states, setStates] = useState(['', '', '']);
    const [result, setResult] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [time, setTime] = useState(10);
    const doneRef = useRef(false);
    const winRef = useRef(-1);

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
        doneRef.current = false;
        setResult(null); setPlaying(false); setTime(10); setMsg('シャッフル中…');
        setStates(['normal', 'normal', 'normal']);
        winRef.current = rnd(0, 2);
        
        for (let r = 0; r < 6; r++) {
            const a = rnd(0, 2), b = (a + 1 + rnd(0, 1)) % 3;
            setStates(prev => prev.map((s, i) => i === a || i === b ? 'shake' : s));
            await sleep(300);
            setStates(prev => prev.map(s => s === 'shake' ? 'normal' : s));
            await sleep(70);
        }
        setMsg('どれだ！10秒以内に選べ！');
        setPlaying(true);
    }, []);

    useEffect(() => { init(); }, [init]);

    const pickBox = async (idx, isTimeout = false) => {
        if (!isTimeout && (!playing || isObserver)) return; // 観戦者はブロック
        setPlaying(false);
        doneRef.current = true;
        const win = idx === winRef.current;
        
        setStates(prev => prev.map((s, i) => {
            if (i === idx) return win ? 'win-box' : 'lose-box';
            return s;
        }));
        await sleep(400);
        
        if (!win) {
            setStates(prev => prev.map((s, i) => i === winRef.current ? 'win-box' : s));
        }
        setStates(prev => prev.map((s, i) => i !== idx && i !== winRef.current ? 'dim' : s));
        await sleep(200);
        
        const prizes = [{ e: '🥫', l: '空き缶発見！', p: 3 }, { e: '💰', l: 'お金を見つけた！', p: 10 }, { e: '🍺', l: 'ビール缶ゲット！', p: 5 }];
        const pz = prizes[rnd(0, 2)];
        
        if (win) { 
            setResult({ win: true, icon: pz.e, main: pz.l, sub: '', pts: pz.p }); 
            addPts(pz.p); 
        } else { 
            setResult({ win: false, icon: '💀', main: 'ハズレ…', sub: 'また挑戦しな', pts: 0 }); 
        }
    };

    const getBoxProps = (state, index) => {
        let text = '📦';
        let num = `BOX ${index + 1}`;
        if (state === 'win-box') { text = '✅'; num = '当たり！'; }
        if (state === 'lose-box') { text = '❌'; num = 'ハズレ'; }
        return { text, num };
    };

    const boxStyle = (s) => ({
        width: 100, height: 110,
        background: s === 'win-box' ? 'linear-gradient(145deg,#2a5a18,#163a0a)' : s === 'lose-box' ? 'linear-gradient(145deg,#5a1818,#3a0a0a)' : 'linear-gradient(145deg,#9b7520,#5c4010)',
        border: `3px solid ${s === 'win-box' ? '#4a8a28' : s === 'lose-box' ? '#8a2828' : '#7a5a18'}`,
        borderRadius: 8, cursor: doneRef.current || isObserver ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.6rem', position: 'relative', boxShadow: '0 6px 20px rgba(0,0,0,.6)',
        opacity: s === 'dim' ? 0.4 : 1, transition: 'transform .18s',
        animation: s === 'shake' ? 'shake .35s ease' : s === 'win-box' ? 'glow 1.5s ease infinite' : 'none',
        userSelect: 'none'
    });

    return (
        <div style={S.screen}>
            <GameHeader title="📦 箱選びゲーム" pts={pts} timer={time} onBack={onBack} />
            <div style={S.body}>
                <Instr>{msg}</Instr>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    {states.map((s, i) => {
                        const props = getBoxProps(s, i);
                        return (
                            <div key={i} style={boxStyle(s)} onClick={() => pickBox(i)}>
                                {props.text}<span style={{ position: 'absolute', bottom: 6, fontFamily: "'Bebas Neue',sans-serif", fontSize: '.75rem', color: 'rgba(255,255,255,.4)' }}>{props.num}</span>
                            </div>
                        );
                    })}
                </div>
                <ResultBox result={result} />
                {result && !isObserver && (
                    <BtnPrim onClick={isEventMode ? onBack : init}>
                        {isEventMode ? '⬅ マップに戻る' : '🔁 もう一度'}
                    </BtnPrim>
                )}
                {result && isObserver && (
                    <div style={{ marginTop: '15px', color: '#7a6a4a', fontWeight: 'bold' }}>ターンプレイヤーの操作を待っています...</div>
                )}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   Game 2: 🏧 ボロ自販機ガチャ
════════════════════════════════════════ */
const VEND_WIN = [{ e: '💰', l: 'コイン大量発見！', p: 15 }, { e: '🥤', l: 'コーヒー缶！', p: 10 }, { e: '🎁', l: '謎のプレゼント！', p: 12 }];
const VEND_LOSE = [{ e: '❌', l: '空っぽ…', p: 0 }, { e: '🕷️', l: 'クモが出た！', p: 0 }, { e: '💨', l: '何も出てこない…', p: 0 }];
const VEND_COLORS = [['#2a3020', '#3d4a30', '#4a6a38'], ['#2a2010', '#3d3018', '#6a5020'], ['#102030', '#182838', '#204858']];

export function VendGame({ pts, addPts, onBack, isEventMode, isObserver }) {
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
        
        const winItem = VEND_WIN[rnd(0, VEND_WIN.length - 1)];
        const losers = [...VEND_LOSE].sort(() => Math.random() - .5).slice(0, 2);
        const choices = [winItem, ...losers].sort(() => Math.random() - .5);
        const labels = ['缶ジュース', 'エナジー', 'ビール'];
        
        setMachines(choices.map((c, i) => ({
            id: i, data: c, style: VEND_COLORS[i], label: labels[i], state: 'normal', screen: '?', showCoin: false
        })));
    }, []);

    useEffect(() => { init(); }, [init]);

    const pickVend = async (idx, isTimeout = false) => {
        if (!isTimeout && (!playing || isObserver)) return; // 観戦者はブロック
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
            addPts(pr.p); 
        } else { 
            setResult({ win: false, icon: '💀', main: '空っぽ…', sub: '3台のうちハズレを選んだ', pts: 0 }); 
        }
    };

    return (
        <div style={S.screen}>
            <GameHeader title="🏧 ボロ自販機ガチャ" pts={pts} timer={time} onBack={onBack} />
            <div style={S.body}>
                <Instr>3台のうち当たりは1台だけ！はずれ2台は空っぽ！</Instr>
                <div style={{ display: 'flex', gap: '.8rem', justifyContent: 'center' }}>
                    {machines.map((m, i) => (
                        <div key={m.id} onClick={() => pickVend(m.id)} style={{
                            width: 110, height: 180, borderRadius: '8px 8px 4px 4px', cursor: m.state === 'dim' || !playing || isObserver ? 'default' : 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '.5rem .4rem',
                            position: 'relative', border: `3px solid ${m.style[2]}`,
                            background: `linear-gradient(180deg,${m.style[0]},${m.style[1]})`,
                            opacity: m.state === 'dim' ? 0.4 : 1, transition: 'transform .18s,opacity .3s', boxShadow: '-4px 4px 15px rgba(0,0,0,.7)', userSelect: 'none'
                        }}>
                            <div style={{ width: '85%', height: 62, background: '#080f08', border: '2px solid #1a2a1a', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.9rem', marginBottom: '.35rem' }}>
                                <span style={{ opacity: m.screen === '?' ? 0.45 : 1, fontSize: m.screen === '?' ? '1.5rem' : '1.9rem' }}>{m.screen}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, width: '85%', marginBottom: '.25rem' }}>
                                {[0, 1, 2].map(j => <div key={j} style={{ height: 12, borderRadius: 2, border: '1px solid rgba(255,255,255,.1)', background: m.style[2] }} />)}
                            </div>
                            <div style={{ width: '55%', height: 16, background: '#050505', border: '2px solid #1a1a1a', borderRadius: 2, marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', color: '#444' }}>↓</div>
                            <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.35)', marginTop: 3, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '.1em' }}>{m.label}</div>
                            {m.showCoin && <div style={{ position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)', fontSize: '1.1rem' }}>🪙</div>}
                        </div>
                    ))}
                </div>
                <ResultBox result={result} />
                {result && !isObserver && (
                    <BtnPrim onClick={isEventMode ? onBack : init}>
                        {isEventMode ? '⬅ マップに戻る' : '🔁 もう一度'}
                    </BtnPrim>
                )}
                {result && isObserver && (
                    <div style={{ marginTop: '15px', color: '#7a6a4a', fontWeight: 'bold' }}>ターンプレイヤーの操作を待っています...</div>
                )}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   Game 3: 🪙 スクラッチくじ
════════════════════════════════════════ */
const SC_SYMS = ['🥫', '💰', '🍺', '🐀', '💊', '🎁'];

function ScratchCell({ sym, isRevealed, onReveal, disabled }) {
    const canvasRef = useRef(null);
    const [scratched, setScratched] = useState(false);
    const isDrawing = useRef(false);

    useEffect(() => {
        const cv = canvasRef.current;
        if (!cv) return;
        const ctx = cv.getContext('2d');

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
    }, []);

    const scratch = (clientX, clientY) => {
        if (scratched || disabled || isRevealed) return;
        const cv = canvasRef.current;
        const ctx = cv.getContext('2d');
        const rect = cv.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();

        const data = ctx.getImageData(0, 0, 84, 84).data;
        let transparentPixels = 0;
        for (let p = 3; p < data.length; p += 4) {
            if (data[p] < 50) transparentPixels++;
        }
        
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
        <div style={{ width: 84, height: 84, position: 'relative', borderRadius: 8, overflow: 'hidden', border: '2px solid #3d2e1a', background: showFace ? '#241a0e' : '#4a3520' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.1rem', opacity: showFace ? 1 : 0, transition: 'opacity 0.2s' }}>{sym}</div>
            <canvas
                ref={canvasRef}
                width={84}
                height={84}
                style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: 'crosshair', opacity: showFace ? 0 : 1, pointerEvents: showFace ? 'none' : 'auto' }}
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

export function ScratchGame({ pts, addPts, onBack, isEventMode, isObserver }) {
    const [grid, setGrid] = useState([]);
    const [revealed, setRevealed] = useState(Array(9).fill(false));
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const [gameKey, setGameKey] = useState(0);
    
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
        
        if (win) addPts(p);
    }, [grid, revealed, addPts]);

    useEffect(() => {
        if (playing && (count >= 3 || time === 0)) {
            checkResult();
        }
    }, [count, time, playing, checkResult]);

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10); setRevealed(Array(9).fill(false));
        setGameKey(k => k + 1); 
        
        const newGrid = Array.from({ length: 9 }, () => SC_SYMS[rnd(0, 5)]);
        if (Math.random() < 0.3) { 
            const sym = SC_SYMS[rnd(0, 5)]; 
            const pos = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5).slice(0, 3); 
            pos.forEach(p => newGrid[p] = sym); 
        }
        setGrid(newGrid);
    }, []);

    useEffect(() => { init(); }, [init]);

    const handleReveal = (idx) => {
        if (!playing || revealed[idx] || count >= 3 || isObserver) return; // 観戦者はブロック
        setRevealed(prev => {
            const next = [...prev]; 
            next[idx] = true;
            return next;
        });
    };

    return (
        <div style={S.screen}>
            <GameHeader title="🪙 スクラッチ" pts={pts} timer={time} onBack={onBack} />
            <div style={S.body}>
                <Instr>10秒以内に3マス削れ！2つ以上揃えば成功！</Instr>
                <div style={{ fontSize: '.95rem', fontWeight: 700, color: '#c97b2a', textAlign: 'center' }}>あと {Math.max(0, 3 - count)} マス削れます</div>
                <div style={{ background: 'linear-gradient(145deg,#1a1308,#0d0a05)', border: '2px solid #3d2e1a', borderRadius: 14, padding: '.9rem', display: 'inline-block' }}>
                    <div key={gameKey} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,84px)', gridTemplateRows: 'repeat(3,84px)', gap: '.45rem' }}>
                        {grid.map((sym, i) => (
                            <ScratchCell 
                                key={i} 
                                sym={sym} 
                                isRevealed={revealed[i] || (!playing && result)} 
                                onReveal={() => handleReveal(i)} 
                                disabled={!playing || count >= 3 || isObserver} 
                            />
                        ))}
                    </div>
                </div>
                <ResultBox result={result} />
                {result && !isObserver && (
                    <BtnPrim onClick={isEventMode ? onBack : init}>
                        {isEventMode ? '⬅ マップに戻る' : '🔁 もう一度'}
                    </BtnPrim>
                )}
                {result && isObserver && (
                    <div style={{ marginTop: '15px', color: '#7a6a4a', fontWeight: 'bold' }}>ターンプレイヤーの操作を待っています...</div>
                )}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   Game 4: 🃏 ハイ＆ロー
════════════════════════════════════════ */
const SUITS = ['♠', '♥', '♦', '♣'];
const CVALS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CNUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

const PlayingCard = ({ c, isFaceDown }) => {
    if (isFaceDown || !c) {
        return (
            <div style={{
                width: 118, height: 168, borderRadius: 10, flexShrink: 0,
                background: 'repeating-linear-gradient(45deg, #1b264f 0px, #1b264f 8px, #121936 8px, #121936 16px)',
                border: '3px solid #28386b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.6)'
            }}>
                <div style={{ width: 40, height: 60, border: '2px solid #c4a870', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#c4a870', fontSize: '2rem' }}>🂠</span>
                </div>
            </div>
        );
    }
    const isRed = c.s === '♥' || c.s === '♦';
    const color = isRed ? '#d32f2f' : '#1c1c1c';

    return (
        <div style={{
            width: 118, height: 168, borderRadius: 10, flexShrink: 0,
            background: '#F4EEDC', border: '2px solid #e0d4b8',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', boxShadow: '0 8px 20px rgba(0,0,0,0.6)', color
        }}>
            <div style={{ position: 'absolute', top: 6, left: 8, textAlign: 'center', lineHeight: 1 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: '"Bebas Neue", sans-serif' }}>{c.v}</div>
                <div style={{ fontSize: '1rem' }}>{c.s}</div>
            </div>
            <div style={{ fontSize: '4rem', fontWeight: 900, fontFamily: '"Bebas Neue", sans-serif', lineHeight: 1 }}>{c.v}</div>
            <div style={{ fontSize: '2.5rem', marginTop: '-10px' }}>{c.s}</div>
            <div style={{ position: 'absolute', bottom: 6, right: 8, textAlign: 'center', lineHeight: 1, transform: 'rotate(180deg)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: '"Bebas Neue", sans-serif' }}>{c.v}</div>
                <div style={{ fontSize: '1rem' }}>{c.s}</div>
            </div>
        </div>
    );
};

export function HLGame({ pts, addPts, onBack, isEventMode, isObserver }) {
    const [deck, setDeck] = useState([]);
    const [idx, setIdx] = useState(0);
    const [streak, setStreak] = useState(0);
    const [revealedNext, setRevealedNext] = useState(null); 
    const [result, setResult] = useState(null);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    
    const streakRef = useRef(0);
    const idxRef = useRef(0);
    const deckRef = useRef([]);
    const guessing = useRef(false);

    useEffect(() => {
        if (!playing) return;
        const timer = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
        return () => clearInterval(timer);
    }, [playing]);

    const endHL = useCallback(() => {
        setPlaying(false);
        const p = streakRef.current * 5;
        const win = streakRef.current >= 3;
        if (win) addPts(p);
        setResult({ win, icon: win ? '🎉' : '💀', main: win ? `${streakRef.current}連続正解！` : '連続3回に届かず…', sub: `${streakRef.current}連続 × 5P`, pts: win ? p : 0 });
    }, [addPts]);

    useEffect(() => {
        if (time === 0 && playing) endHL();
    }, [time, playing, endHL]);

    const guess = useCallback(async (dir) => {
        if (guessing.current || !playing || isObserver) return; // 観戦者はブロック
        guessing.current = true;
        const cur = deckRef.current[idxRef.current];
        const nxt = deckRef.current[idxRef.current + 1];
        if (!nxt) { endHL(); guessing.current = false; return; }

        setRevealedNext(nxt); 

        const ok = (dir === 'h' && nxt.n >= cur.n) || (dir === 'l' && nxt.n <= cur.n);
        
        await sleep(800); 

        if (ok) {
            streakRef.current++;
            idxRef.current++;
            setStreak(streakRef.current);
            setIdx(idxRef.current);
            setRevealedNext(null); 
            guessing.current = false;
        } else {
            setPlaying(false);
            setResult({ win: false, icon: '💀', main: 'ハズレ…', sub: `${streakRef.current}連続で止まった`, pts: 0 });
            guessing.current = false;
        }
    }, [endHL, playing, isObserver]);

    const init = useCallback(() => {
        streakRef.current = 0; idxRef.current = 0; guessing.current = false;
        const d = [];
        for (const s of SUITS) for (let i = 0; i < CVALS.length; i++) d.push({ s, v: CVALS[i], n: CNUMS[i] });
        d.sort(() => Math.random() - .5);
        deckRef.current = d; setDeck(d); setIdx(0); setStreak(0); setRevealedNext(null); setResult(null);
        setTime(10); setPlaying(true);
    }, []);

    useEffect(() => { init(); }, [init]);

    const cur = deckRef.current[idxRef.current] || deckRef.current[0];

    return (
        <div style={S.screen}>
            <GameHeader title="🃏 ハイ＆ロー" pts={pts} timer={time} onBack={onBack} />
            <div style={S.body}>
                <Instr>10秒間で連続正解を重ねろ！3連続以上で成功！</Instr>
                <div style={{ fontWeight: 700, color: '#e8b84b', textAlign: 'center', fontSize: '1.1rem' }}>🔥 連続正解: {streak} 回</div>
                
                <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                    <PlayingCard c={cur} isFaceDown={false} />
                    <span style={{ fontSize: '1.8rem', color: '#7a6a4a' }}>→</span>
                    <PlayingCard c={revealedNext} isFaceDown={!revealedNext} />
                </div>

                {!result && !isObserver && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '10px' }}>
                        <button onClick={() => guess('h')} style={{ background: 'linear-gradient(135deg,#2a5a1a,#183a0a)', border: '2px solid #4a8a2a', borderRadius: 12, color: '#a0e080', font: "700 1.1rem 'Noto Sans JP',sans-serif", padding: '.8rem 2rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(74,138,42,.3)', transition: 'transform .1s' }} onMouseDown={e=>e.currentTarget.style.transform='scale(0.95)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>▲ HIGH</button>
                        <button onClick={() => guess('l')} style={{ background: 'linear-gradient(135deg,#5a1a1a,#3a0a0a)', border: '2px solid #8a2a2a', borderRadius: 12, color: '#e08080', font: "700 1.1rem 'Noto Sans JP',sans-serif", padding: '.8rem 2rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(138,42,42,.3)', transition: 'transform .1s' }} onMouseDown={e=>e.currentTarget.style.transform='scale(0.95)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>▼ LOW</button>
                    </div>
                )}
                
                <ResultBox result={result} />
                {result && !isObserver && (
                    <BtnPrim onClick={isEventMode ? onBack : init}>
                        {isEventMode ? '⬅ マップに戻る' : '🔁 もう一度'}
                    </BtnPrim>
                )}
                {result && isObserver && (
                    <div style={{ marginTop: '15px', color: '#7a6a4a', fontWeight: 'bold' }}>ターンプレイヤーの操作を待っています...</div>
                )}
            </div>
        </div>
    );
}