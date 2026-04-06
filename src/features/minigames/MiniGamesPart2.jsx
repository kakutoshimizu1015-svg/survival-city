import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useUserStore } from '../../store/useUserStore';
import { GameHeader, ResultBox } from './MiniGamesPart1'; // 第1弾の共通コンポーネントを再利用

// ========== 共通ユーティリティ ==========
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// ========== Part 2 専用スタイル ==========
export const MiniGameStylesPart2 = () => (
    <style>{`
        /* HL Game */
        .cards-row { display:flex; gap:1.2rem; align-items:center; justify-content:center; }
        .playing-card { width:118px; height:168px; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; box-shadow:0 8px 30px rgba(0,0,0,.8); transition:transform .3s cubic-bezier(.34,1.56,.64,1); }
        .playing-card.face-up { background:linear-gradient(145deg,#f2eada,#e0d2b0); border:3px solid #c4a870; color:#1a0a0a; }
        .playing-card.face-down { background:repeating-linear-gradient(45deg,#1a2a5a 0px,#1a2a5a 6px,#0f1a3a 6px,#0f1a3a 12px); border:3px solid #2a3a6a; }
        .card-red { color:#cc2222 !important; }
        .card-val { font-size:3rem; font-weight:900; font-family:'Bebas Neue',sans-serif; line-height:1; }
        .card-suit { font-size:1.8rem; margin-top:.15rem; }
        .card-corner { position:absolute; font-size:.8rem; font-weight:900; font-family:'Bebas Neue',sans-serif; line-height:1.1; }
        .card-corner.tl { top:7px; left:9px; }
        .card-corner.br { bottom:7px; right:9px; transform:rotate(180deg); }
        .card-mystery { font-size:2.8rem; }
        .arrow-sep { font-size:1.8rem; color:var(--dim); }
        .hl-btns { display:flex; gap:.8rem; }
        .btn-high { background:linear-gradient(135deg,#2a5a1a,#183a0a); border:2px solid #4a8a2a; border-radius:12px; color:#a0e080; padding:.7rem 1.5rem; cursor:pointer; font-weight:bold; box-shadow:0 4px 15px rgba(74,138,42,.3); transition:transform .1s;}
        .btn-low { background:linear-gradient(135deg,#5a1a1a,#3a0a0a); border:2px solid #8a2a2a; border-radius:12px; color:#e08080; padding:.7rem 1.5rem; cursor:pointer; font-weight:bold; box-shadow:0 4px 15px rgba(138,42,42,.3); transition:transform .1s;}
        .btn-high:hover, .btn-low:hover { transform:scale(1.05); }
        .streak-bar { font-size:1rem; color:var(--gold); font-weight:700; text-align:center; }

        /* Slot Game */
        .slot-machine { background:linear-gradient(180deg,#2a1805,#130d03); border:4px solid #5a3a12; border-radius:18px; padding:1rem .9rem; width:100%; box-shadow:0 0 40px rgba(201,123,42,.15),inset 0 2px 10px rgba(0,0,0,.6); }
        .slot-top-light { display:flex; justify-content:center; gap:.4rem; margin-bottom:.7rem; }
        .light-dot { width:9px; height:9px; border-radius:50%; background:var(--amber); box-shadow:0 0 8px var(--amber); animation:lightBlink 1s ease infinite; }
        .light-dot:nth-child(2){animation-delay:.2s;} .light-dot:nth-child(3){animation-delay:.4s;} .light-dot:nth-child(4){animation-delay:.6s;} .light-dot:nth-child(5){animation-delay:.8s;}
        .reels-wrap { display:flex; gap:.5rem; justify-content:center; margin-bottom:.8rem; }
        .reel-col { display:flex; flex-direction:column; align-items:center; gap:.4rem; }
        .reel-window { width:84px; height:220px; overflow:hidden; position:relative; background:#060402; border:3px solid #3a2208; border-radius:8px; box-shadow:inset 0 0 20px rgba(0,0,0,.9); }
        .reel-window::before { content:''; position:absolute; top:70px; left:0; right:0; height:80px; border-top:2px solid rgba(201,123,42,.7); border-bottom:2px solid rgba(201,123,42,.7); background:rgba(201,123,42,.05); z-index:5; pointer-events:none; }
        .reel-window::after { content:''; position:absolute; inset:0; z-index:6; pointer-events:none; background:linear-gradient(to bottom,#060402 0%,transparent 25%,transparent 75%,#060402 100%); }
        .reel-inner { position:absolute; top:0; left:0; width:100%; will-change:transform; }
        .reel-sym { width:84px; height:80px; display:flex; align-items:center; justify-content:center; font-size:2.4rem; user-select:none; }
        .stop-btn { width:84px; background:linear-gradient(135deg,#5a2808,#3a1805); border:2px solid #8a4a18; border-radius:8px; color:#e0a070; padding:.45rem .25rem; cursor:pointer; font-weight:bold; letter-spacing:.05em; transition:transform .1s;}
        .stop-btn:hover:not(:disabled) { transform:scale(1.05); }
        .stop-btn:disabled { opacity:.35; cursor:not-allowed; }
        .stop-btn.stopped { background:linear-gradient(135deg,#1a3a08,#0d2005); border-color:#3a6a18; color:#90c060; }
        .slot-start { width:100%; background:linear-gradient(135deg,var(--amber),#7a4808); border:none; border-radius:12px; color:var(--white); font-weight:700; padding:.8rem; cursor:pointer; box-shadow:0 4px 20px rgba(201,123,42,.4); transition:transform .1s;}
        .slot-start:hover { transform:scale(1.02); } .slot-start:active { transform:scale(.98); }
        .slot-paylabel { display:flex; justify-content:space-between; font-size:.62rem; color:var(--dim); margin-top:.4rem; padding:0 .15rem; }
        @keyframes lightBlink{0%,100%{opacity:1;}50%{opacity:.2;}}

        /* Oxo Game */
        .oxo-board { display:grid; grid-template-columns:repeat(3,1fr); gap:.45rem; width:230px; margin: 0 auto; }
        .oxo-cell { height:72px; background:var(--card2); border:2px solid var(--border2); border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:2.4rem; font-weight:900; transition:background .15s,transform .12s; user-select:none; }
        .oxo-cell:hover:not(.taken) { background:var(--card3); transform:scale(1.04); }
        .oxo-cell.taken { cursor:default; }
        .oxo-cell.win-cell { background:rgba(78,133,57,.3); border-color:var(--green2); }
        .oxo-status { font-size:.95rem; font-weight:700; color:var(--white); text-align:center; margin-bottom: 10px; }
        .bet-btns { display:flex; gap:.55rem; flex-wrap:wrap; justify-content:center; }
        .bet-btn { background:var(--card2); border:2px solid var(--border); border-radius:8px; color:var(--text); font-weight:700; padding:.4rem 1rem; cursor:pointer; transition:border-color .15s,background .15s; }
        .bet-btn:hover { border-color:var(--amber); background:var(--card3); }
        .bet-btn.selected { border-color:var(--gold); background:rgba(232,184,75,.15); color:var(--gold); }
    `}</style>
);

// ========== 4. 🃏 ハイ＆ロー ==========

export function HLGame({ handleGameEnd }) {
    const SUITS = ['♠', '♥', '♦', '♣'];
    const VALS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    
    const [deck, setDeck] = useState([]);
    const [idx, setIdx] = useState(0);
    const [streak, setStreak] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [nextCardVisible, setNextCardVisible] = useState(false);
    const [result, setResult] = useState(null);
    const timerRef = useRef(null);

    const init = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setResult(null); setPlaying(true); setTime(10); setStreak(0); setIdx(0); setNextCardVisible(false);
        
        let d = [];
        for (const s of SUITS) for (let i = 0; i < VALS.length; i++) d.push({ s, v: VALS[i], n: NUMS[i] });
        setDeck(d.sort(() => Math.random() - 0.5));
        
        timerRef.current = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
    }, []);

    useEffect(() => { init(); return () => clearInterval(timerRef.current); }, [init]);

    const endHL = useCallback(() => {
        setPlaying(false); clearInterval(timerRef.current);
        setStreak(s => {
            const p = s * 5; const win = s >= 3;
            setResult({ win, icon: win ? '🎉' : '💀', main: win ? `${s}連続正解！` : '連続3回に届かず…', sub: `${s}連続 × 5P`, pts: win ? p : 0 });
            if (win) handleGameEnd(p);
            return s;
        });
    }, [handleGameEnd]);

    useEffect(() => { if (time === 0 && playing) endHL(); }, [time, playing, endHL]);

    const guess = async (dir) => {
        if (!playing || nextCardVisible) return;
        setNextCardVisible(true);
        const cur = deck[idx], nxt = deck[idx + 1];
        if (!nxt) return;

        const ok = (dir === 'h' && nxt.n >= cur.n) || (dir === 'l' && nxt.n <= cur.n);
        
        await sleep(450);
        if (ok) {
            setStreak(s => s + 1); 
            setIdx(i => i + 1);
            await sleep(550); 
            setNextCardVisible(false);
        } else {
            setPlaying(false); clearInterval(timerRef.current);
            await sleep(300); 
            endHL();
        }
    };

    const renderCard = (c, faceUp) => {
        if (!c || !faceUp) return <div className="playing-card face-down"><div className="card-mystery">🂠</div></div>;
        const red = c.s === '♥' || c.s === '♦';
        return (
            <div className={`playing-card face-up ${red ? 'card-red' : ''}`}>
                <div className="card-corner tl">{c.v}<br />{c.s}</div>
                <div className="card-val">{c.v}</div>
                <div className="card-suit">{c.s}</div>
                <div className="card-corner br">{c.v}<br />{c.s}</div>
            </div>
        );
    };

    return (
        <>
            <MiniGameStylesPart2 />
            <GameHeader title="🃏 ハイ＆ロー" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="instr">10秒間で連続正解を重ねろ！3連続以上で成功！</div>
                <div className="streak-bar">🔥 連続正解: {streak} 回</div>
                <div className="cards-row">
                    {deck.length > 0 && renderCard(deck[idx], true)}
                    <div className="arrow-sep">→</div>
                    {deck.length > 0 && renderCard(deck[idx + 1], nextCardVisible)}
                </div>
                {playing && (
                    <div className="hl-btns">
                        <button className="btn-high" onClick={() => guess('h')}>▲ HIGH</button>
                        <button className="btn-low" onClick={() => guess('l')}>▼ LOW</button>
                    </div>
                )}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

// ========== 5. 🎰 路上スロット ==========

export function SlotGame({ handleGameEnd }) {
    const SYMS = ['🥫', '💰', '🍺', '🐀', '💊', '🚬', '🗑️'];
    const SH = 80;
    const TOT = SYMS.length * SH;
    
    const [reels, setReels] = useState([{ stop: true, res: null }, { stop: true, res: null }, { stop: true, res: null }]);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    
    const timerRef = useRef(null);
    const rafRef = useRef(null);
    const offsets = useRef([0, 0, 0]);
    const innerRefs = useRef([]); // DOM直接操作の代わりにRefで管理

    const init = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setResult(null); setPlaying(false); setTime(10); 
        setReels([{ stop: true, res: null }, { stop: true, res: null }, { stop: true, res: null }]);
        offsets.current = [0, 0, 0];
        innerRefs.current.forEach(el => {
            if(el) el.style.transform = `translateY(${-TOT}px)`;
        });
    }, [TOT]);

    const startSlot = () => {
        setPlaying(true); setResult(null); 
        setReels([{ stop: false, res: null }, { stop: false, res: null }, { stop: false, res: null }]);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
        
        // ランダムな初期オフセット
        offsets.current = [Math.random() * TOT, Math.random() * TOT, Math.random() * TOT];
        animate();
    };

    const animate = () => {
        let anyMoved = false;
        const speeds = [3.5, 4.2, 3.8];
        
        setReels(prev => {
            prev.forEach((r, i) => {
                if (!r.stop) {
                    offsets.current[i] = (offsets.current[i] + speeds[i]) % TOT;
                    if(innerRefs.current[i]) {
                        innerRefs.current[i].style.transform = `translateY(${-TOT + offsets.current[i]}px)`;
                    }
                    anyMoved = true;
                }
            });
            return prev;
        });
        
        if (anyMoved) rafRef.current = requestAnimationFrame(animate);
    };

    const stopReel = (i) => {
        setReels(prev => {
            if (prev[i].stop) return prev;
            let n = [...prev];
            n[i].stop = true;
            
            // シンボルの判定ロジック
            const iy = SH + TOT - offsets.current[i];
            n[i].res = SYMS[((Math.floor(iy / SH) % SYMS.length) + SYMS.length) % SYMS.length];
            return n;
        });
    };

    const stopAll = useCallback(() => { [0, 1, 2].forEach(stopReel); }, []);

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); }; }, [init]);
    useEffect(() => { if (time === 0 && playing) stopAll(); }, [time, playing, stopAll]);

    // 全て停止した後の判定
    useEffect(() => {
        if (playing && reels.every(r => r.stop)) {
            setPlaying(false); clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current);
            setTimeout(() => {
                const rs = reels.map(r => r.res);
                const allSame = rs[0] === rs[1] && rs[1] === rs[2];
                const twoSame = rs[0] === rs[1] || rs[1] === rs[2] || rs[0] === rs[2];
                
                if (allSame) { 
                    const p = rs[0] === '💰' ? 50 : 20; 
                    setResult({ win: true, icon: '🎊', main: 'ジャックポット！', sub: rs.join(''), pts: p }); 
                    handleGameEnd(p); 
                } else if (twoSame) { 
                    setResult({ win: true, icon: '✨', main: '2つ揃い！', sub: rs.join(''), pts: 5 }); 
                    handleGameEnd(5); 
                } else { 
                    setResult({ win: false, icon: '💀', main: 'ハズレ', sub: rs.join(''), pts: 0 }); 
                }
            }, 150);
        }
    }, [reels, playing, handleGameEnd]);

    return (
        <>
            <MiniGameStylesPart2 />
            <GameHeader title="🎰 路上スロット" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="instr">10秒以内に全リールをSTOP！時間切れで自動停止！</div>
                <div className="slot-machine">
                    <div className="slot-top-light">
                        {[0,1,2,3,4].map(i => <div key={i} className="light-dot"></div>)}
                    </div>
                    <div className="reels-wrap">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="reel-col">
                                <div className="reel-window">
                                    <div className="reel-inner" ref={el => innerRefs.current[i] = el}>
                                        {Array(3).fill(0).map((_, r) => SYMS.map((s, si) => <div key={r + '-' + si} className="reel-sym">{s}</div>))}
                                    </div>
                                </div>
                                <button className={`stop-btn ${reels[i].stop && playing ? 'stopped' : ''}`} disabled={!playing || reels[i].stop} onClick={() => stopReel(i)}>
                                    {reels[i].stop && reels[i].res ? '✓ ' + reels[i].res : 'STOP'}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="slot-paylabel"><span>💰×3=+50P</span><span>3揃い=+20P</span><span>2揃い=+5P</span></div>
                    <div style={{ height: '.5rem' }}></div>
                    {!playing && !result && <button className="slot-start" onClick={startSlot}>🎰 スタート！</button>}
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

// ========== 6. ♟️ 路上○×ゲーム ==========

export function OxoGame({ handleGameEnd }) {
    const { gachaPoints, addGachaAssets } = useUserStore();
    const [board, setBoard] = useState(Array(9).fill(null));
    const [bet, setBet] = useState(0);
    const [phase, setPhase] = useState('bet'); // 'bet', 'play', 'end'
    const [turn, setTurn] = useState('p'); // 'p' or 'c'
    const [time, setTime] = useState(5);
    const [result, setResult] = useState(null);
    const [winCells, setWinCells] = useState([]);
    const timerRef = useRef(null);

    const init = useCallback(() => { 
        if (timerRef.current) clearInterval(timerRef.current); 
        setResult(null); setPhase('bet'); setBoard(Array(9).fill(null)); setWinCells([]); 
    }, []);

    const start = (b) => {
        if (gachaPoints < b) { alert('Pが足りない！'); return; }
        addGachaAssets(0, -b); // 賭け金を先に没収
        setBet(b); setPhase('play'); setTurn('p'); setTime(5);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
    };

    const checkWin = (brd) => {
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (let [a, b, c] of lines) { 
            if (brd[a] && brd[a] === brd[b] && brd[a] === brd[c]) {
                setWinCells([a, b, c]);
                return brd[a]; 
            }
        }
        if (brd.every(c => c)) return 'draw';
        return null;
    };

    const move = (i) => {
        if (board[i] || phase !== 'play' || turn !== 'p') return;
        clearInterval(timerRef.current);
        
        const nb = [...board]; 
        nb[i] = 'p'; 
        setBoard(nb);
        
        let res = checkWin(nb); 
        if (res) { end(res); return; }
        
        // CPU Turn
        setTurn('c');
        setTimeout(() => {
            // CPUの賢い手（自分が勝つ > 相手を防ぐ > 中央 > ランダム）
            const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
            let cpuMove = null;
            
            // 1. 自分が勝てる手を探す
            for (let [a, b, c] of lines) {
                if (nb[a] === 'c' && nb[b] === 'c' && !nb[c]) cpuMove = c;
                else if (nb[a] === 'c' && !nb[b] && nb[c] === 'c') cpuMove = b;
                else if (!nb[a] && nb[b] === 'c' && nb[c] === 'c') cpuMove = a;
            }
            // 2. プレイヤーのリーチを防ぐ
            if (cpuMove === null) {
                for (let [a, b, c] of lines) {
                    if (nb[a] === 'p' && nb[b] === 'p' && !nb[c]) cpuMove = c;
                    else if (nb[a] === 'p' && !nb[b] && nb[c] === 'p') cpuMove = b;
                    else if (!nb[a] && nb[b] === 'p' && nb[c] === 'p') cpuMove = a;
                }
            }
            // 3. 中央を取る
            if (cpuMove === null && !nb[4]) cpuMove = 4;
            // 4. ランダム
            if (cpuMove === null) {
                const avail = nb.map((c, idx) => c === null ? idx : null).filter(c => c !== null);
                if (avail.length === 0) { end('draw'); return; }
                cpuMove = avail[rnd(0, avail.length - 1)];
            }
            
            nb[cpuMove] = 'c'; 
            setBoard(nb);
            
            res = checkWin(nb); 
            if (res) { end(res); return; }
            
            // プレイヤーターンへ戻る
            setTurn('p');
            setTime(5); 
            timerRef.current = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
        }, 600);
    };

    const end = useCallback((res) => {
        if (timerRef.current) clearInterval(timerRef.current); 
        setPhase('end');
        if (res === 'p') { 
            setResult({ win: true, icon: '○', main: 'あなたの勝ち！', sub: `賭け${bet}P → 2倍`, pts: bet * 2 }); 
            handleGameEnd(bet * 2); 
        }
        else if (res === 'draw') { 
            setResult({ win: false, icon: '🤝', main: '引き分け', sub: `賭け${bet}P 返還`, pts: bet }); 
            handleGameEnd(bet); 
        }
        else { 
            setResult({ win: false, icon: '×', main: 'CPUの勝ち…', sub: `賭け${bet}P 没収`, pts: 0 }); 
        }
    }, [bet, handleGameEnd]);

    useEffect(() => { return () => clearInterval(timerRef.current); }, []);
    
    // プレイヤーの時間切れ監視
    useEffect(() => { 
        if (time === 0 && phase === 'play' && turn === 'p') end('lose'); 
    }, [time, phase, turn, end]);

    return (
        <>
            <MiniGameStylesPart2 />
            {/* 時間表示はPhase=Playの時だけ */}
            <GameHeader title="♟️ 路上○×" time={phase === 'play' ? time : ''} isTimerDanger={time <= 2} />
            <div className="game-body">
                {phase === 'bet' && (
                    <div id="oxo-bet-phase">
                        <div className="instr" style={{ marginBottom: '1rem' }}>CPUに勝てばP倍増！5秒以内に手を打て！</div>
                        <div style={{ fontSize: '.88rem', color: 'var(--dim)', textAlign: 'center', marginBottom: '.5rem' }}>賭けPを選べ（所持: {gachaPoints}P）</div>
                        <div className="bet-btns">
                            {[3, 5, 8, 10].map(b => (
                                <button key={b} className="bet-btn" onClick={() => start(b)}>{b}P</button>
                            ))}
                        </div>
                    </div>
                )}
                
                {phase !== 'bet' && (
                    <div id="oxo-game-phase">
                        <div className="oxo-status">
                            {phase === 'end' ? '決着！' : (turn === 'p' ? 'あなた(○) の番 — 5秒！' : 'CPU(×) の番…')}
                        </div>
                        <div className="oxo-board">
                            {board.map((c, i) => (
                                <div 
                                    key={i} 
                                    className={`oxo-cell ${c ? 'taken' : ''} ${winCells.includes(i) ? 'win-cell' : ''}`} 
                                    onClick={() => move(i)} 
                                    style={{ color: c === 'p' ? 'var(--gold)' : (c === 'c' ? 'var(--red2)' : 'inherit') }}
                                >
                                    {c === 'p' ? '○' : c === 'c' ? '×' : ''}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}