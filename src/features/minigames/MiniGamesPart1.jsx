import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';

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

// ▼ 共通：観戦者用オーバーレイ
export const SpectatorOverlay = ({ isSpectator }) => {
    if (!isSpectator) return null;
    return (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
            <div style={{ background: 'rgba(0,0,0,0.85)', padding: '1.5rem 2.5rem', borderRadius: 16, border: '2px solid #c97b2a', color: '#f0e8d0', textAlign: 'center', boxShadow: '0 0 20px rgba(201,123,42,.4)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👀</div>
                <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>他プレイヤーの<br/>プレイを観戦中...</div>
            </div>
        </div>
    );
};

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
export function BoxGame({ pts, addPts, onBack, isEventMode }) {
    const { activeMiniGamePlayerId } = useGameStore();
    const { myUserId } = useNetworkStore();
    const isSpectator = isEventMode && activeMiniGamePlayerId && activeMiniGamePlayerId !== myUserId;

    const [msg, setMsg] = useState('');
    const [states, setStates] = useState(['', '', '']);
    const [result, setResult] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const doneRef = useRef(false);
    const winRef = useRef(-1);
    const { time, start, stop } = useTimer(10, () => { if (!doneRef.current) pick(rnd(0, 2)); });

    const pick = useCallback(async (idx) => {
        if (doneRef.current) return;
        doneRef.current = true; stop();
        const win = idx === winRef.current;
        setStates(prev => { const n = [...prev]; n[idx] = win ? 'win' : 'lose'; return n; });
        await sleep(400);
        if (!win) setStates(prev => { const n = [...prev]; n[winRef.current] = 'win'; return n; });
        await sleep(200);
        setStates(prev => prev.map((s, i) => (i === idx || i === winRef.current) ? s : 'dim'));
        
        const prizes = [{ e: '🥫', l: '空き缶発見！', p: 3 }, { e: '💰', l: 'お金を見つけた！', p: 10 }, { e: '🍺', l: 'ビール缶ゲット！', p: 5 }];
        const pr = prizes[rnd(0, 2)];
        if (win) { addPts(pr.p); setResult({ win: true, icon: pr.e, main: pr.l, pts: pr.p }); }
        else setResult({ win: false, icon: '💀', main: 'ハズレ…', sub: 'また挑戦しな', pts: 0 });
    }, [stop, addPts]);

    const init = useCallback(() => {
        doneRef.current = false; winRef.current = rnd(0, 2);
        setResult(null); setMsg('ルールを読んでスタート！'); setStates(['', '', '']);
        setIsReady(false);
    }, []);

    const startGame = async () => {
        setIsReady(true);
        setMsg('シャッフル中…');
        for (let r = 0; r < 6; r++) {
            const a = rnd(0, 2), b = (a + 1 + rnd(0, 1)) % 3;
            setStates(prev => { const n = [...prev]; n[a] = 'shake'; n[b] = 'shake'; return n; });
            await sleep(300);
            setStates(prev => { const n = [...prev]; if (n[a] === 'shake') n[a] = ''; if (n[b] === 'shake') n[b] = ''; return n; });
            await sleep(70);
        }
        setMsg('どれだ！10秒以内に選べ！');
        start();
    };

    useEffect(() => { init(); }, [init]);

    const boxStyle = (s) => ({
        width: 100, height: 110,
        background: s === 'win' ? 'linear-gradient(145deg,#2a5a18,#163a0a)' : s === 'lose' ? 'linear-gradient(145deg,#5a1818,#3a0a0a)' : 'linear-gradient(145deg,#9b7520,#5c4010)',
        border: `3px solid ${s === 'win' ? '#4a8a28' : s === 'lose' ? '#8a2828' : '#7a5a18'}`,
        borderRadius: 8, cursor: doneRef.current || !isReady ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.6rem', position: 'relative', boxShadow: '0 6px 20px rgba(0,0,0,.6)',
        opacity: s === 'dim' ? 0.4 : 1, transition: 'transform .18s',
        animation: s === 'shake' ? 'shake .35s ease' : s === 'win' ? 'glow 1.5s ease infinite' : 'none',
        userSelect: 'none'
    });

    return (
        <div style={{ ...S.screen, pointerEvents: isSpectator ? 'none' : 'auto' }}>
            <SpectatorOverlay isSpectator={isSpectator} />
            <GameHeader title="📦 箱選びゲーム" pts={pts} timer={isReady && !result ? time : null} onBack={onBack} />
            <div style={S.body}>
                {!isReady && !result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Instr>
                            <strong style={{color:'#e8b84b', fontSize:'1.1rem'}}>【ルール説明】</strong><br/><br/>
                            3つの箱のうち、1つだけアタリが入っているぞ！<br/>
                            シャッフル後、10秒以内にアタリだと思う箱をタップしろ！
                        </Instr>
                        <BtnPrim onClick={startGame} style={{ width: '100%' }}>ゲーム開始！</BtnPrim>
                    </div>
                ) : (
                    <>
                        <Instr>{msg}</Instr>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            {states.map((s, i) => (
                                <div key={i} style={boxStyle(s)} onClick={() => isReady && !doneRef.current && s !== 'dim' && pick(i)}>
                                    {s === 'win' ? '✅' : s === 'lose' ? '❌' : '📦'}
                                    <span style={{ position: 'absolute', bottom: 6, fontFamily: "'Bebas Neue',sans-serif", fontSize: '.75rem', color: 'rgba(255,255,255,.4)' }}>BOX {i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                <ResultBox result={result} />
                {result && (
                    <BtnPrim onClick={isEventMode ? onBack : init}>
                        {isEventMode ? '⬅ マップに戻る' : '🔁 もう一度'}
                    </BtnPrim>
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

export function VendGame({ pts, addPts, onBack, isEventMode }) {
    const { activeMiniGamePlayerId } = useGameStore();
    const { myUserId } = useNetworkStore();
    const isSpectator = isEventMode && activeMiniGamePlayerId && activeMiniGamePlayerId !== myUserId;

    const [choices, setChoices] = useState([]);
    const [screens, setScreens] = useState(['?', '?', '?']);
    const [dimmed, setDimmed] = useState([false, false, false]);
    const [result, setResult] = useState(null);
    const [showCoin, setShowCoin] = useState(-1);
    const [isReady, setIsReady] = useState(false);
    const doneRef = useRef(false);
    const choicesRef = useRef([]);
    const { time, start, stop } = useTimer(10, () => { if (!doneRef.current) pick(rnd(0, 2)); });

    const pick = useCallback(async (idx) => {
        if (doneRef.current) return;
        doneRef.current = true; stop();
        const ch = choicesRef.current;
        for (const f of ['⚙️', '🔄', '⚡', '🔄']) {
            setScreens(prev => { const n = [...prev]; n[idx] = f; return n; });
            await sleep(130);
        }
        setScreens(prev => { const n = [...prev]; n[idx] = ch[idx].e; return n; });
        if (ch[idx].p > 0) { setShowCoin(idx); setTimeout(() => setShowCoin(-1), 600); }
        await sleep(250);
        
        for (let i = 0; i < 3; i++) {
            if (i !== idx) {
                setScreens(prev => { const n = [...prev]; n[i] = ch[i].e; return n; });
                setDimmed(prev => { const n = [...prev]; n[i] = true; return n; });
                await sleep(250);
            }
        }
        const pr = ch[idx];
        if (pr.p > 0) { addPts(pr.p); setResult({ win: true, icon: pr.e, main: pr.l, pts: pr.p }); }
        else setResult({ win: false, icon: '💀', main: '空っぽ…', sub: '3台のうちハズレを選んだ', pts: 0 });
    }, [stop, addPts]);

    const init = useCallback(() => {
        doneRef.current = false;
        const win = VEND_WIN[rnd(0, VEND_WIN.length - 1)];
        const losers = [...VEND_LOSE].sort(() => Math.random() - .5).slice(0, 2);
        const ch = [win, ...losers].sort(() => Math.random() - .5);
        choicesRef.current = ch; setChoices(ch);
        setScreens(['?', '?', '?']); setDimmed([false, false, false]); setResult(null); setShowCoin(-1);
        setIsReady(false);
    }, []);

    const startGame = () => {
        setIsReady(true);
        start();
    };

    useEffect(() => { init(); }, [init]);

    return (
        <div style={{ ...S.screen, pointerEvents: isSpectator ? 'none' : 'auto' }}>
            <SpectatorOverlay isSpectator={isSpectator} />
            <GameHeader title="🏧 ボロ自販機ガチャ" pts={pts} timer={isReady && !result ? time : null} onBack={onBack} />
            <div style={S.body}>
                {!isReady && !result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Instr>
                            <strong style={{color:'#e8b84b', fontSize:'1.1rem'}}>【ルール説明】</strong><br/><br/>
                            3台のボロ自販機のうち、中身が入っているアタリは1台だけだ！<br/>
                            10秒以内に運を天に任せて好きな自販機をタップしろ！
                        </Instr>
                        <BtnPrim onClick={startGame} style={{ width: '100%' }}>ゲーム開始！</BtnPrim>
                    </div>
                ) : (
                    <>
                        <Instr>3台のうち当たりは1台だけ！はずれ2台は空っぽ！</Instr>
                        <div style={{ display: 'flex', gap: '.8rem', justifyContent: 'center' }}>
                            {choices.map((ch, i) => (
                                <div key={i} onClick={() => isReady && !doneRef.current && !dimmed[i] && pick(i)} style={{
                                    width: 110, height: 180, borderRadius: '8px 8px 4px 4px', cursor: dimmed[i] || doneRef.current || !isReady ? 'default' : 'pointer',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '.5rem .4rem',
                                    position: 'relative', border: `3px solid ${VEND_COLORS[i][2]}`,
                                    background: `linear-gradient(180deg,${VEND_COLORS[i][0]},${VEND_COLORS[i][1]})`,
                                    opacity: dimmed[i] ? 0.4 : 1, transition: 'transform .18s,opacity .3s', boxShadow: '-4px 4px 15px rgba(0,0,0,.7)', userSelect: 'none'
                                }}>
                                    <div style={{ width: '85%', height: 62, background: '#080f08', border: '2px solid #1a2a1a', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.9rem', marginBottom: '.35rem' }}>
                                        {screens[i] === '?' ? <span style={{ opacity: .45, fontSize: '1.5rem' }}>?</span> : <span>{screens[i]}</span>}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 2, width: '85%', marginBottom: '.25rem' }}>
                                        {[0, 1, 2].map(j => <div key={j} style={{ height: 12, borderRadius: 2, border: '1px solid rgba(255,255,255,.1)', background: VEND_COLORS[i][2] }} />)}
                                    </div>
                                    <div style={{ width: '55%', height: 16, background: '#050505', border: '2px solid #1a1a1a', borderRadius: 2, marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', color: '#444' }}>↓</div>
                                    <div style={{ fontSize: '.6rem', color: 'rgba(255,255,255,.35)', marginTop: 3, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: '.1em' }}>{['缶ジュース', 'エナジー', 'ビール'][i]}</div>
                                    {showCoin === i && <div style={{ position: 'absolute', bottom: 22, left: '50%', fontSize: '1.1rem', animation: 'coinDrop .5s ease-in forwards', pointerEvents: 'none' }}>🪙</div>}
                                </div>
                            ))}
                        </div>
                    </>
                )}
                <ResultBox result={result} />
                {result && (
                    <BtnPrim onClick={isEventMode ? onBack : init}>
                        {isEventMode ? '⬅ マップに戻る' : '🔁 もう一度'}
                    </BtnPrim>
                )}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   Game 3: 🪙 スクラッチくじ
════════════════════════════════════════ */
const SC_SYMS = ['🥫', '💰', '🍺', '🐀', '💊', '🎁'];

function ScratchCell({ sym, onRevealed, disabled }) {
    const cvRef = useRef(null);
    const revealedRef = useRef(false);
    const scratchRef = useRef(false);

    useEffect(() => {
        const cv = cvRef.current; if (!cv) return;
        const ctx = cv.getContext('2d');
        const g = ctx.createLinearGradient(0, 0, 84, 84);
        g.addColorStop(0, '#4a3520'); g.addColorStop(.5, '#3a2818'); g.addColorStop(1, '#2e1e10');
        ctx.fillStyle = g; ctx.fillRect(0, 0, 84, 84);
        ctx.strokeStyle = 'rgba(180,130,70,.15)'; ctx.lineWidth = 1;
        for (let y = 8; y < 84; y += 13) { ctx.beginPath(); ctx.moveTo(0, y + (Math.random() - .5) * 3); ctx.lineTo(84, y + (Math.random() - .5) * 3); ctx.stroke(); }
        ctx.font = 'bold 26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(220,170,80,.6)'; ctx.fillText('？', 42, 40);
        ctx.font = '8px sans-serif'; ctx.fillStyle = 'rgba(180,140,70,.45)'; ctx.fillText('¥100', 42, 68);
    }, []);

    const doScratch = useCallback((cx, cy) => {
        if (revealedRef.current || disabled) return;
        const cv = cvRef.current; if (!cv) return;
        const ctx = cv.getContext('2d');
        ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.fill();
        const data = ctx.getImageData(0, 0, 84, 84).data; let tr = 0;
        for (let p = 3; p < data.length; p += 4) if (data[p] < 50) tr++;
        if (tr / (84 * 84) > .5 && !revealedRef.current) {
            revealedRef.current = true; cv.style.pointerEvents = 'none'; onRevealed();
        }
    }, [disabled, onRevealed]);

    const handlers = {
        onMouseDown: e => { scratchRef.current = true; const r = cvRef.current.getBoundingClientRect(); doScratch(e.clientX - r.left, e.clientY - r.top); },
        onMouseMove: e => { if (!scratchRef.current) return; const r = cvRef.current.getBoundingClientRect(); doScratch(e.clientX - r.left, e.clientY - r.top); },
        onMouseUp: () => scratchRef.current = false, onMouseLeave: () => scratchRef.current = false,
        onTouchStart: e => { e.preventDefault(); const r = cvRef.current.getBoundingClientRect(); const t = e.touches[0]; doScratch(t.clientX - r.left, t.clientY - r.top); },
        onTouchMove: e => { e.preventDefault(); const r = cvRef.current.getBoundingClientRect(); const t = e.touches[0]; doScratch(t.clientX - r.left, t.clientY - r.top); },
    };

    return (
        <div style={{ width: 84, height: 84, position: 'relative', borderRadius: 8, overflow: 'hidden', border: '2px solid #3d2e1a' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.1rem', background: '#241a0e' }}>{sym}</div>
            <canvas ref={cvRef} width={84} height={84} style={{ position: 'absolute', inset: 0, touchAction: 'none', cursor: 'crosshair' }} {...handlers} />
        </div>
    );
}

export function ScratchGame({ pts, addPts, onBack, isEventMode }) {
    const { activeMiniGamePlayerId } = useGameStore();
    const { myUserId } = useNetworkStore();
    const isSpectator = isEventMode && activeMiniGamePlayerId && activeMiniGamePlayerId !== myUserId;

    const [grid, setGrid] = useState([]);
    const [count, setCount] = useState(0);
    const [result, setResult] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const countRef = useRef(0);
    const revRef = useRef([]);
    const gridRef = useRef([]);
    const doneRef = useRef(false);
    const [gameKey, setGameKey] = useState(0);
    const { time, start, stop } = useTimer(10, () => { if (!doneRef.current) checkScratch(); });

    const checkScratch = useCallback(() => {
        if (doneRef.current) return; doneRef.current = true; stop();
        const revSyms = gridRef.current.filter((_, i) => revRef.current[i]);
        const counts = {}; revSyms.forEach(s => counts[s] = (counts[s] || 0) + 1);
        const mx = Math.max(0, ...Object.values(counts));
        const ws = Object.keys(counts).find(k => counts[k] === mx) || '';
        const win = mx >= 2; const p = mx >= 3 ? 20 : mx >= 2 ? 5 : 0;
        if (p > 0) addPts(p);
        setResult({ win, icon: win ? '🎊' : '💀', main: win ? `${ws}×${mx} 揃い！` : '揃わなかった…', sub: `削ったマス: ${revSyms.join(' ')}`, pts: p });
    }, [stop, addPts]);

    const onRevealed = useCallback((i) => {
        if (revRef.current[i]) return;
        revRef.current[i] = true; countRef.current++;
        setCount(countRef.current);
        if (countRef.current >= 3) { stop(); setTimeout(checkScratch, 600); }
    }, [stop, checkScratch]);

    const init = useCallback(() => {
        doneRef.current = false; countRef.current = 0; revRef.current = Array(9).fill(false);
        let g = Array.from({ length: 9 }, () => SC_SYMS[rnd(0, 5)]);
        if (Math.random() < .25) { const sym = SC_SYMS[rnd(0, 5)]; const pos = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - .5).slice(0, 3); pos.forEach(p => g[p] = sym); }
        gridRef.current = g; setGrid(g); setCount(0); setResult(null); setIsReady(false);
        setGameKey(k => k + 1);
    }, []);

    const startGame = () => {
        setIsReady(true);
        start();
    };

    useEffect(() => { init(); }, [init]);

    return (
        <div style={{ ...S.screen, pointerEvents: isSpectator ? 'none' : 'auto' }}>
            <SpectatorOverlay isSpectator={isSpectator} />
            <GameHeader title="🪙 スクラッチくじ" pts={pts} timer={isReady && !result ? time : null} onBack={onBack} />
            <div style={S.body}>
                {!isReady && !result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Instr>
                            <strong style={{color:'#e8b84b', fontSize:'1.1rem'}}>【ルール説明】</strong><br/><br/>
                            9つのマスのうち、好きな3マスを指で削れ！<br/>
                            10秒以内に同じ絵柄が2つ以上出れば成功だ！
                        </Instr>
                        <BtnPrim onClick={startGame} style={{ width: '100%' }}>ゲーム開始！</BtnPrim>
                    </div>
                ) : (
                    <>
                        <Instr>10秒以内に3マス削れ！2つ以上揃えば成功！</Instr>
                        <div style={{ fontSize: '.95rem', fontWeight: 700, color: '#c97b2a', textAlign: 'center' }}>あと {Math.max(0, 3 - count)} マス削れます</div>
                        <div style={{ background: 'linear-gradient(145deg,#1a1308,#0d0a05)', border: '2px solid #3d2e1a', borderRadius: 14, padding: '.9rem', display: 'inline-block' }}>
                            <div key={gameKey} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,84px)', gridTemplateRows: 'repeat(3,84px)', gap: '.45rem' }}>
                                {grid.map((sym, i) => <ScratchCell key={`${i}-${sym}`} sym={sym} disabled={!isReady || count >= 3 || doneRef.current} onRevealed={() => onRevealed(i)} />)}
                            </div>
                        </div>
                    </>
                )}
                <ResultBox result={result} />
                {result && (
                    <BtnPrim onClick={isEventMode ? onBack : init}>
                        {isEventMode ? '⬅ マップに戻る' : '🔁 もう一度'}
                    </BtnPrim>
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

export function HLGame({ pts, addPts, onBack, isEventMode }) {
    const { activeMiniGamePlayerId } = useGameStore();
    const { myUserId } = useNetworkStore();
    const isSpectator = isEventMode && activeMiniGamePlayerId && activeMiniGamePlayerId !== myUserId;

    const [deck, setDeck] = useState([]);
    const [idx, setIdx] = useState(0);
    const [streak, setStreak] = useState(0);
    const [revealedNext, setRevealedNext] = useState(null);
    const [result, setResult] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const doneRef = useRef(false);
    const streakRef = useRef(0);
    const idxRef = useRef(0);
    const deckRef = useRef([]);
    const guessing = useRef(false);
    const { time, start, stop } = useTimer(10, () => { if (!doneRef.current) endHL(); });

    const endHL = useCallback(() => {
        if (doneRef.current) return;
        doneRef.current = true; stop();
        const p = streakRef.current * 5;
        const win = streakRef.current >= 3;
        if (win) addPts(p);
        setResult({ win, icon: win ? '🎉' : '💀', main: win ? `${streakRef.current}連続正解！` : '連続3回に届かず…', sub: `${streakRef.current}連続 × 5P`, pts: win ? p : 0 });
    }, [stop, addPts]);

    const guess = useCallback(async (dir) => {
        if (doneRef.current || guessing.current) return;
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
            doneRef.current = true; stop();
            setResult({ win: false, icon: '💀', main: 'ハズレ…', sub: `${streakRef.current}連続で止まった`, pts: 0 });
            guessing.current = false;
        }
    }, [endHL, stop]);

    const init = useCallback(() => {
        doneRef.current = false; streakRef.current = 0; idxRef.current = 0; guessing.current = false;
        const d = [];
        for (const s of SUITS) for (let i = 0; i < CVALS.length; i++) d.push({ s, v: CVALS[i], n: CNUMS[i] });
        d.sort(() => Math.random() - .5);
        deckRef.current = d; setDeck(d); setIdx(0); setStreak(0); setRevealedNext(null); setResult(null); setIsReady(false);
    }, []);

    const startGame = () => {
        setIsReady(true);
        start();
    };

    useEffect(() => { init(); }, [init]);

    const cur = deckRef.current[idxRef.current] || deckRef.current[0];

    return (
        <div style={{ ...S.screen, pointerEvents: isSpectator ? 'none' : 'auto' }}>
            <SpectatorOverlay isSpectator={isSpectator} />
            <GameHeader title="🃏 ハイ＆ロー" pts={pts} timer={isReady && !result ? time : null} onBack={onBack} />
            <div style={S.body}>
                {!isReady && !result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Instr>
                            <strong style={{color:'#e8b84b', fontSize:'1.1rem'}}>【ルール説明】</strong><br/><br/>
                            10秒間で連続正解を重ねろ！<br/>
                            右の裏向きのカードの数字が、左より「高い」か「低い」かを当てろ！<br/>
                            3連続以上正解でクリアだ！
                        </Instr>
                        <BtnPrim onClick={startGame} style={{ width: '100%' }}>ゲーム開始！</BtnPrim>
                    </div>
                ) : (
                    <>
                        <Instr>10秒間で連続正解を重ねろ！3連続以上で成功！</Instr>
                        <div style={{ fontWeight: 700, color: '#e8b84b', textAlign: 'center', fontSize: '1.1rem' }}>🔥 連続正解: {streak} 回</div>
                        
                        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                            <PlayingCard c={cur} isFaceDown={false} />
                            <span style={{ fontSize: '1.8rem', color: '#7a6a4a' }}>→</span>
                            <PlayingCard c={revealedNext} isFaceDown={!revealedNext} />
                        </div>

                        {!result && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '10px' }}>
                                <button onClick={() => guess('h')} style={{ background: 'linear-gradient(135deg,#2a5a1a,#183a0a)', border: '2px solid #4a8a2a', borderRadius: 12, color: '#a0e080', font: "700 1.1rem 'Noto Sans JP',sans-serif", padding: '.8rem 2rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(74,138,42,.3)', transition: 'transform .1s' }} onMouseDown={e=>e.currentTarget.style.transform='scale(0.95)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>▲ HIGH</button>
                                <button onClick={() => guess('l')} style={{ background: 'linear-gradient(135deg,#5a1a1a,#3a0a0a)', border: '2px solid #8a2a2a', borderRadius: 12, color: '#e08080', font: "700 1.1rem 'Noto Sans JP',sans-serif", padding: '.8rem 2rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(138,42,42,.3)', transition: 'transform .1s' }} onMouseDown={e=>e.currentTarget.style.transform='scale(0.95)'} onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}>▼ LOW</button>
                            </div>
                        )}
                    </>
                )}
                
                <ResultBox result={result} />
                {result && (
                    <BtnPrim onClick={isEventMode ? onBack : init}>
                        {isEventMode ? '⬅ マップに戻る' : '🔁 もう一度'}
                    </BtnPrim>
                )}
            </div>
        </div>
    );
}