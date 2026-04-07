import React, { useState, useEffect, useRef, useCallback } from 'react';
import { S, GameHeader, ResultBox, BtnPrim, Instr, StatBox, useTimer, rnd, sleep } from './MiniGamesPart1';
import { useUserStore } from '../../store/useUserStore';
import { useGameStore } from '../../store/useGameStore'; // ▼ 追加: 状態同期用Store

export const MiniGameStylesPart2 = () => (
    <style>{`
        /* Slot Game */
        .slot-machine { background:linear-gradient(180deg,#2a1805,#130d03); border:4px solid #5a3a12; border-radius:18px; padding:1rem .9rem; width:100%; box-shadow:0 0 40px rgba(201,123,42,.15),inset 0 2px 10px rgba(0,0,0,.6); }
        .slot-top-light { display:flex; justify-content:center; gap:.4rem; margin-bottom:.7rem; }
        .light-dot { width:9px; height:9px; border-radius:50%; background:#c97b2a; box-shadow:0 0 8px #c97b2a; animation:lightBlink 1s ease infinite; }
        .light-dot:nth-child(2){animation-delay:.2s;} .light-dot:nth-child(3){animation-delay:.4s;} .light-dot:nth-child(4){animation-delay:.6s;} .light-dot:nth-child(5){animation-delay:.8s;}
        .reels-wrap { display:flex; gap:.5rem; justify-content:center; margin-bottom:.8rem; }
        .reel-col { display:flex; flex-direction:column; align-items:center; gap:.4rem; }
        .reel-window { width:84px; height:220px; overflow:hidden; position:relative; background:#060402; border:3px solid #3a2208; border-radius:8px; box-shadow:inset 0 0 20px rgba(0,0,0,.9); }
        .reel-window::before { content:''; position:absolute; top:70px; left:0; right:0; height:80px; border-top:2px solid rgba(201,123,42,.7); border-bottom:2px solid rgba(201,123,42,.7); background:rgba(201,123,42,.05); z-index:5; pointer-events:none; }
        .reel-window::after { content:''; position:absolute; inset:0; z-index:6; pointer-events:none; background:linear-gradient(to bottom,#060402 0%,transparent 25%,transparent 75%,#060402 100%); }
        .reel-inner { position:absolute; top:0; left:0; width:100%; will-change:transform; }
        .reel-sym { width:84px; height:80px; display:flex; align-items:center; justify-content:center; font-size:2.4rem; user-select:none; }
        .stop-btn { width:84px; background:linear-gradient(135deg,#5a2808,#3a1805); border:2px solid #8a4a18; border-radius:8px; color:#e0a070; padding:.55rem .25rem; cursor:pointer; font-weight:bold; letter-spacing:.05em; transition:transform .1s;}
        .stop-btn:active:not(:disabled) { transform:scale(0.95); }
        .stop-btn:disabled { opacity:.35; cursor:not-allowed; }
        .stop-btn.stopped { background:linear-gradient(135deg,#1a3a08,#0d2005); border-color:#3a6a18; color:#90c060; }
        .slot-start { width:100%; background:linear-gradient(135deg,#c97b2a,#7a4808); border:none; border-radius:12px; color:#f0e8d0; font-weight:700; padding:.8rem; cursor:pointer; box-shadow:0 4px 20px rgba(201,123,42,.4); transition:transform .1s;}
        .slot-start:active { transform:scale(0.96); }
        .slot-paylabel { display:flex; justify-content:space-between; font-size:.62rem; color:#7a6a4a; margin-top:.4rem; padding:0 .15rem; }

        /* Oxo Game */
        .oxo-board { display:grid; grid-template-columns:repeat(3,1fr); gap:.45rem; width:230px; margin: 0 auto; }
        .oxo-cell { height:72px; background:#241a0e; border:2px solid #5a4228; border-radius:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:2.4rem; font-weight:900; transition:background .15s,transform .1s; user-select:none; }
        .oxo-cell:active:not(.taken) { background:#2e2213; transform:scale(0.92); }
        .oxo-cell.taken { cursor:default; }
        .oxo-cell.win-cell { background:rgba(78,133,57,.3); border-color:#4e8539; }
        .oxo-status { font-size:.95rem; font-weight:700; color:#f0e8d0; text-align:center; margin-bottom: 10px; }
        .bet-btns { display:flex; gap:.55rem; flex-wrap:wrap; justify-content:center; }
        .bet-btn { background:#241a0e; border:2px solid #3d2e1a; border-radius:8px; color:#d4c4a0; font-weight:700; padding:.7rem 1.4rem; cursor:pointer; transition:border-color .1s,transform .1s; }
        .bet-btn:active { transform:scale(0.92); border-color:#c97b2a; }

        /* Tetris Game */
        .tet-preview-cell { width:36px; height:36px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; border:2px solid #222; background:#0a0a0a; transition:background .05s; }
        .tet-cell { border-radius:3px; background:#0f0f0f; border:1px solid #1a1a1a; display:flex; align-items:center; justify-content:center; font-size:.8rem; }
        .tet-btn { background:#241a0e; border:2px solid #3d2e1a; border-radius:8px; color:#f0e8d0; font-weight:700; padding:.6rem 1.2rem; cursor:pointer; user-select:none; touch-action:manipulation; transition:transform .1s;}
        .tet-btn:active { transform:scale(0.92); }
        .tet-btn-drop { background:#c97b2a; border:2px solid #e8b84b; color:#000; font-weight:900; }

        /* Fly Game */
        .fly-arena { width:100%; height:310px; background:linear-gradient(160deg,#1a1208,#0d0a05); border:2px solid #3d2e1a; border-radius:14px; position:relative; overflow:hidden; cursor:crosshair; }
        .fly-start-overlay { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:.5rem; background:rgba(0,0,0,0.4); z-index: 20; }
        .big-fly { font-size:4rem; animation:flyBuzz .3s ease infinite, bounce 1.5s ease infinite; cursor:pointer; }
        .fly-el { position:absolute; font-size:3.5rem; cursor:pointer; user-select:none; z-index:10; line-height:1; display:flex; align-items:center; justify-content:center; width:60px; height:60px; margin-left:-30px; margin-top:-30px; -webkit-tap-highlight-color: transparent;}
        .fly-prog { display:flex; gap:.35rem; justify-content:center; }
        .fly-prog-dot { width:18px; height:18px; border-radius:50%; border:2px solid #5a4228; background:#241a0e; display:flex; align-items:center; justify-content:center; font-size:.7rem; }
        .fly-prog-dot.caught { background:#4e8539; border-color:#4e8539; }
        .catch-fx { position:absolute; pointer-events:none; z-index:20; font-size:1.1rem; font-weight:900; animation:catchFx .5s ease-out forwards; color:#e8b84b; }
    `}</style>
);

// ▼ 共通: 状態をNetwork経由で他人に送る関数 (プレイヤー側のみ実行される)
const syncToStore = (isObserver, data) => {
    if (!isObserver) {
        useGameStore.setState(s => ({ mgSyncData: { ...(s.mgSyncData || {}), ...data } }));
    }
};

/* ════════════════════════════════════════
   Game 5: 🎰 路上スロット (完全同期対応版)
════════════════════════════════════════ */
export function SlotGame({ pts, addPts, onBack, isEventMode, isObserver }) {
    const SYMS = ['🥫', '💰', '🍺', '🐀', '💊', '🚬', '🗑️'];
    const SH = 80;
    const TOT = SYMS.length * SH;
    
    const [reels, setReels] = useState([{ stop: true, res: null }, { stop: true, res: null }, { stop: true, res: null }]);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    
    const rafRef = useRef(null);
    const offsets = useRef([0, 0, 0]);
    const innerRefs = useRef([]); 
    const reelsDataRef = useRef([{ stop: true, res: null }, { stop: true, res: null }, { stop: true, res: null }]);

    const mgSyncData = useGameStore(s => s.mgSyncData);

    const { time, start, stop } = useTimer(10, () => {
        if (playing && !isObserver) [0, 1, 2].forEach(i => stopReel(i));
    });

    // プレイヤーがタイマーを更新したら同期
    useEffect(() => { if (!isObserver) syncToStore(isObserver, { time }); }, [time, isObserver]);
    // 観戦者は送られてきたタイマーを表示
    const displayTime = isObserver ? (mgSyncData?.time ?? 10) : time;

    // ▼ 観戦者: 送られてきたSyncDataを画面に反映させる
    useEffect(() => {
        if (isObserver && mgSyncData) {
            if (mgSyncData.reels) setReels(mgSyncData.reels);
            if (mgSyncData.playing !== undefined) setPlaying(mgSyncData.playing);
            if (mgSyncData.result !== undefined) setResult(mgSyncData.result);
            if (mgSyncData.offsets) {
                mgSyncData.offsets.forEach((off, i) => {
                    if (innerRefs.current[i]) innerRefs.current[i].style.transform = `translateY(${-TOT + off}px)`;
                });
            }
        }
    }, [isObserver, mgSyncData, TOT]);

    const init = useCallback(() => {
        if (isObserver) return; // 観戦者はロジックを走らせない
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setResult(null); setPlaying(false); 
        
        const initial = [{ stop: true, res: null }, { stop: true, res: null }, { stop: true, res: null }];
        reelsDataRef.current = initial;
        setReels(initial);
        
        offsets.current = [0, 0, 0];
        innerRefs.current.forEach(el => { if(el) el.style.transform = `translateY(${-TOT}px)`; });
        
        syncToStore(isObserver, { reels: initial, playing: false, result: null, offsets: [0, 0, 0] });
    }, [TOT, isObserver]);

    const startSlot = () => {
        if (isObserver) return;
        setPlaying(true); setResult(null); 
        
        const nextReels = [{ stop: false, res: null }, { stop: false, res: null }, { stop: false, res: null }];
        reelsDataRef.current = nextReels;
        setReels(nextReels);
        
        offsets.current = [Math.random() * TOT, Math.random() * TOT, Math.random() * TOT];
        syncToStore(isObserver, { reels: nextReels, playing: true, result: null, offsets: offsets.current });
        
        start(); 
        animate();
    };

    const animate = () => {
        let anyMoved = false;
        const speeds = [3.5, 4.2, 3.8];
        
        reelsDataRef.current.forEach((r, i) => {
            if (!r.stop) {
                offsets.current[i] = (offsets.current[i] + speeds[i]) % TOT;
                if (innerRefs.current[i]) {
                    innerRefs.current[i].style.transform = `translateY(${-TOT + offsets.current[i]}px)`;
                }
                anyMoved = true;
            }
        });
        
        if (anyMoved) {
            syncToStore(isObserver, { offsets: offsets.current });
            rafRef.current = requestAnimationFrame(animate);
        }
    };

    const stopReel = (i) => {
        if (!playing || isObserver || reelsDataRef.current[i].stop) return;
        
        reelsDataRef.current[i].stop = true;
        const iy = SH + TOT - offsets.current[i];
        reelsDataRef.current[i].res = SYMS[((Math.floor(iy / SH) % SYMS.length) + SYMS.length) % SYMS.length];
        
        setReels([...reelsDataRef.current]);
        syncToStore(isObserver, { reels: reelsDataRef.current });
        
        if (reelsDataRef.current.every(r => r.stop)) {
            setPlaying(false); stop(); cancelAnimationFrame(rafRef.current);
            setTimeout(() => {
                const rs = reelsDataRef.current.map(r => r.res);
                const allSame = rs[0] === rs[1] && rs[1] === rs[2];
                const twoSame = rs[0] === rs[1] || rs[1] === rs[2] || rs[0] === rs[2];
                
                let resObj;
                if (allSame) { 
                    const p = rs[0] === '💰' ? 50 : 20; 
                    resObj = { win: true, icon: '🎊', main: 'ジャックポット！', sub: rs.join(''), pts: p };
                    addPts(p); 
                } else if (twoSame) { 
                    resObj = { win: true, icon: '✨', main: '2つ揃い！', sub: rs.join(''), pts: 5 };
                    addPts(5); 
                } else { 
                    resObj = { win: false, icon: '💀', main: 'ハズレ', sub: rs.join(''), pts: 0 };
                }
                setResult(resObj);
                syncToStore(isObserver, { playing: false, result: resObj });
            }, 150);
        }
    };

    useEffect(() => { init(); return () => cancelAnimationFrame(rafRef.current); }, [init]);

    return (
        <div style={S.screen}>
            <MiniGameStylesPart2 />
            <GameHeader title="🎰 路上スロット" pts={pts} timer={playing ? displayTime : null} onBack={onBack} />
            <div style={S.body}>
                <Instr>10秒以内に全リールをSTOP！時間切れで自動停止！</Instr>
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
                                <button className={`stop-btn ${reels[i].stop && playing ? 'stopped' : ''}`} disabled={!playing || reels[i].stop} onPointerDown={() => stopReel(i)}>
                                    {reels[i].stop && reels[i].res ? `✓ ${reels[i].res}` : 'STOP'}
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="slot-paylabel"><span>💰×3=+50P</span><span>3揃い=+20P</span><span>2揃い=+5P</span></div>
                    <div style={{ height: '.5rem' }}></div>
                    {!playing && !result && <button className="slot-start" onPointerDown={startSlot}>🎰 スタート！</button>}
                </div>
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
   Game 6: ♟️ 路上○×ゲーム (完全同期対応版)
════════════════════════════════════════ */
export function OxoGame({ pts, addPts, onBack, isEventMode, isObserver }) {
    const { gachaPoints, addGachaAssets } = useUserStore();
    const mgSyncData = useGameStore(s => s.mgSyncData);

    const [board, setBoard] = useState(Array(9).fill(null));
    const [bet, setBet] = useState(0);
    const [phase, setPhase] = useState('bet'); 
    const [turn, setTurn] = useState('p'); 
    const [result, setResult] = useState(null);
    const [winCells, setWinCells] = useState([]);
    
    const isCpuThinking = useRef(false);

    const { time, start, stop } = useTimer(5, () => {
        if (phase === 'play' && turn === 'p' && !isObserver) end('lose');
    });

    useEffect(() => { if (!isObserver) syncToStore(isObserver, { time }); }, [time, isObserver]);
    const displayTime = isObserver ? (mgSyncData?.time ?? 5) : time;

    // ▼ 観戦者: 同期
    useEffect(() => {
        if (isObserver && mgSyncData) {
            if (mgSyncData.board) setBoard(mgSyncData.board);
            if (mgSyncData.bet !== undefined) setBet(mgSyncData.bet);
            if (mgSyncData.phase !== undefined) setPhase(mgSyncData.phase);
            if (mgSyncData.turn !== undefined) setTurn(mgSyncData.turn);
            if (mgSyncData.winCells) setWinCells(mgSyncData.winCells);
            if (mgSyncData.result !== undefined) setResult(mgSyncData.result);
        }
    }, [isObserver, mgSyncData]);

    const init = useCallback(() => { 
        if (isObserver) return;
        stop(); setResult(null); setPhase('bet'); setBoard(Array(9).fill(null)); setWinCells([]); isCpuThinking.current = false;
        syncToStore(isObserver, { board: Array(9).fill(null), bet: 0, phase: 'bet', turn: 'p', winCells: [], result: null });
    }, [stop, isObserver]);

    const startGame = (b) => {
        if (isObserver) return;
        if (gachaPoints < b) { alert('Pが足りない！ゲーム本編で稼ごう！'); return; }
        addGachaAssets(0, -b);
        setBet(b); setPhase('play'); setTurn('p');
        syncToStore(isObserver, { bet: b, phase: 'play', turn: 'p' });
        start(5);
    };

    const checkWin = (brd) => {
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (let [a, b, c] of lines) { 
            if (brd[a] && brd[a] === brd[b] && brd[a] === brd[c]) {
                setWinCells([a, b, c]);
                syncToStore(isObserver, { winCells: [a, b, c] });
                return brd[a]; 
            }
        }
        if (brd.every(c => c)) return 'draw';
        return null;
    };

    const move = (i) => {
        if (board[i] || phase !== 'play' || turn !== 'p' || isCpuThinking.current || isObserver) return;
        stop();
        
        const nb = [...board]; 
        nb[i] = 'p'; 
        setBoard(nb);
        syncToStore(isObserver, { board: nb });
        
        let res = checkWin(nb); 
        if (res) { end(res); return; }
        
        setTurn('c');
        syncToStore(isObserver, { turn: 'c' });
        isCpuThinking.current = true;

        setTimeout(() => {
            const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
            let cpuMove = null;
            
            for (let [a, b, c] of lines) {
                if (nb[a] === 'c' && nb[b] === 'c' && !nb[c]) cpuMove = c;
                else if (nb[a] === 'c' && !nb[b] && nb[c] === 'c') cpuMove = b;
                else if (!nb[a] && nb[b] === 'c' && nb[c] === 'c') cpuMove = a;
            }
            if (cpuMove === null) {
                for (let [a, b, c] of lines) {
                    if (nb[a] === 'p' && nb[b] === 'p' && !nb[c]) cpuMove = c;
                    else if (nb[a] === 'p' && !nb[b] && nb[c] === 'p') cpuMove = b;
                    else if (!nb[a] && nb[b] === 'p' && nb[c] === 'p') cpuMove = a;
                }
            }
            if (cpuMove === null && !nb[4]) cpuMove = 4;
            if (cpuMove === null) {
                const avail = nb.map((c, idx) => c === null ? idx : null).filter(c => c !== null);
                if (avail.length === 0) { end('draw'); return; }
                cpuMove = avail[rnd(0, avail.length - 1)];
            }
            
            nb[cpuMove] = 'c'; 
            setBoard(nb);
            isCpuThinking.current = false;
            
            res = checkWin(nb); 
            if (res) { end(res); return; }
            
            setTurn('p');
            syncToStore(isObserver, { board: nb, turn: 'p' });
            start(5);
        }, 600);
    };

    const end = useCallback((res) => {
        if (isObserver) return;
        stop(); setPhase('end');
        let resObj;
        if (res === 'p') { 
            resObj = { win: true, icon: '○', main: 'あなたの勝ち！', sub: `賭け${bet}P → 2倍`, pts: bet * 2 };
            addPts(bet * 2); 
        } else if (res === 'draw') { 
            resObj = { win: false, icon: '🤝', main: '引き分け', sub: `賭け${bet}P 返還`, pts: bet };
            addPts(bet); 
        } else { 
            resObj = { win: false, icon: '×', main: 'CPUの勝ち…', sub: `賭け${bet}P 没収`, pts: 0 };
        }
        setResult(resObj);
        syncToStore(isObserver, { phase: 'end', result: resObj });
    }, [bet, addPts, stop, isObserver]);

    useEffect(() => { init(); }, [init]);

    return (
        <div style={S.screen}>
            <MiniGameStylesPart2 />
            <GameHeader title="♟️ 路上○×" pts={pts} timer={phase === 'play' ? displayTime : null} onBack={onBack} />
            <div style={S.body}>
                {phase === 'bet' && (
                    <>
                        <Instr>CPUに勝てばP倍増！5秒以内に手を打て！</Instr>
                        <div style={{ fontSize: '.88rem', color: '#7a6a4a', textAlign: 'center', marginBottom: '.5rem', marginTop: '20px' }}>賭けPを選べ（所持: {gachaPoints}P）</div>
                        <div className="bet-btns">
                            {[3, 5, 8, 10].map(b => (
                                <button key={b} className="bet-btn" onPointerDown={() => startGame(b)}>{b}P</button>
                            ))}
                        </div>
                    </>
                )}
                
                {phase !== 'bet' && (
                    <>
                        <div className="oxo-status">
                            {phase === 'end' ? '決着！' : (turn === 'p' ? 'あなた(○) の番 — 5秒！' : 'CPU(×) の番…')}
                        </div>
                        <div className="oxo-board">
                            {board.map((c, i) => (
                                <div 
                                    key={i} 
                                    className={`oxo-cell ${c ? 'taken' : ''} ${winCells.includes(i) ? 'win-cell' : ''}`} 
                                    onPointerDown={() => move(i)} 
                                    style={{ color: c === 'p' ? '#e8b84b' : (c === 'c' ? '#b52e1e' : 'inherit') }}
                                >
                                    {c === 'p' ? '○' : c === 'c' ? '×' : ''}
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
   Game 7: 📦 段ボールパズル (完全同期対応版)
════════════════════════════════════════ */
export function TetrisGame({ pts, addPts, onBack, isEventMode, isObserver }) {
    const TET_COLS = 6, TET_ROWS = 10;
    const TET_WS = [1, 2, 2, 3, 1, 2];
    const TET_COLORS = ['#c97b2a', '#4e8539', '#2a5a8a', '#8a3a2a', '#6a4a8a', '#3a6a5a'];

    const mgSyncData = useGameStore(s => s.mgSyncData);

    const [board, setBoard] = useState(() => Array.from({ length: TET_ROWS }, () => Array(TET_COLS).fill(null)));
    const [cleared, setCleared] = useState(0);
    const [pieceX, setPieceX] = useState(0);
    const [pieceW, setPieceW] = useState(2);
    const [pieceColor, setPieceColor] = useState(TET_COLORS[0]);
    const [result, setResult] = useState(null);
    const [playing, setPlaying] = useState(false);
    
    const boardRef = useRef(Array.from({ length: TET_ROWS }, () => Array(TET_COLS).fill(null)));
    const pxRef = useRef(0);
    const pwRef = useRef(2);
    const posRef = useRef(0);
    const dirRef = useRef(1);
    const clearedRef = useRef(0);
    const rafRef = useRef(null);
    const colorRef = useRef(TET_COLORS[0]);

    // ▼ 観戦者: 同期
    useEffect(() => {
        if (isObserver && mgSyncData) {
            if (mgSyncData.board) setBoard(mgSyncData.board);
            if (mgSyncData.cleared !== undefined) setCleared(mgSyncData.cleared);
            if (mgSyncData.pieceX !== undefined) setPieceX(mgSyncData.pieceX);
            if (mgSyncData.pieceW !== undefined) setPieceW(mgSyncData.pieceW);
            if (mgSyncData.pieceColor) setPieceColor(mgSyncData.pieceColor);
            if (mgSyncData.result !== undefined) setResult(mgSyncData.result);
            if (mgSyncData.playing !== undefined) setPlaying(mgSyncData.playing);
        }
    }, [isObserver, mgSyncData]);

    const slideTick = useCallback(() => {
        if (isObserver) return;
        const max = TET_COLS - pwRef.current;
        posRef.current += 0.05 * dirRef.current; 
        
        if (posRef.current >= max + 0.8) { posRef.current = max + 0.8; dirRef.current = -1; }
        if (posRef.current <= -0.8) { posRef.current = -0.8; dirRef.current = 1; }
        
        pxRef.current = Math.floor(Math.max(0, Math.min(max, posRef.current))); 
        setPieceX(pxRef.current);
        
        syncToStore(isObserver, { pieceX: pxRef.current, pieceW: pwRef.current, pieceColor: colorRef.current });
        rafRef.current = requestAnimationFrame(slideTick);
    }, [isObserver]);

    const newPiece = useCallback(() => {
        if (isObserver) return;
        const pi = rnd(0, TET_WS.length - 1); 
        pwRef.current = TET_WS[pi]; 
        colorRef.current = TET_COLORS[pi];
        posRef.current = 0; dirRef.current = 1; pxRef.current = 0;
        setPieceW(TET_WS[pi]); setPieceColor(TET_COLORS[pi]); setPieceX(0);
        syncToStore(isObserver, { pieceW: TET_WS[pi], pieceColor: TET_COLORS[pi], pieceX: 0 });
    }, [isObserver]);

    const tetDrop = useCallback(() => {
        if (!playing || isObserver) return;
        const b = boardRef.current.map(r => [...r]);
        let land = -1; 
        for (let r = TET_ROWS - 1; r >= 0; r--) {
            let ok = true;
            for (let c = pxRef.current; c < pxRef.current + pwRef.current; c++) {
                if (b[r][c]) { ok = false; break; }
            }
            if (ok) { land = r; break; }
        }
        if (land < 0) return;
        
        for (let c = pxRef.current; c < pxRef.current + pwRef.current; c++) {
            b[land][c] = colorRef.current;
        }
        
        let cl = 0; 
        for (let r = TET_ROWS - 1; r >= 0; r--) {
            if (b[r].every(c => c !== null)) {
                b.splice(r, 1);
                b.unshift(Array(TET_COLS).fill(null));
                cl++; r++;
            }
        }
        
        clearedRef.current += cl; 
        boardRef.current = b; 
        setBoard(b.map(r => [...r])); 
        setCleared(clearedRef.current);
        
        if (clearedRef.current >= 2) { 
            setPlaying(false); cancelAnimationFrame(rafRef.current); 
            const p = clearedRef.current * 4; addPts(p); 
            const resObj = { win: true, icon: '🏠', main: '2段クリア成功！', sub: 'ダンボールハウスが建った！', pts: p };
            setResult(resObj); 
            syncToStore(isObserver, { board: b, cleared: clearedRef.current, playing: false, result: resObj });
            return; 
        }
        if (b[0].some(c => c !== null)) { 
            setPlaying(false); cancelAnimationFrame(rafRef.current); 
            const p = clearedRef.current * 4; if (p > 0) addPts(p); 
            const resObj = { win: false, icon: '💀', main: '積みすぎた！', sub: `${clearedRef.current}段クリア`, pts: p };
            setResult(resObj); 
            syncToStore(isObserver, { board: b, cleared: clearedRef.current, playing: false, result: resObj });
            return; 
        }
        
        syncToStore(isObserver, { board: b, cleared: clearedRef.current });
        newPiece();
    }, [playing, addPts, newPiece, isObserver]);

    const tetMove = (d) => {
        if (!playing || isObserver) return;
        posRef.current = Math.max(0, Math.min(TET_COLS - pwRef.current, pxRef.current + d)); 
        pxRef.current = Math.floor(posRef.current); 
        setPieceX(pxRef.current);
    };

    const init = useCallback(() => {
        if (isObserver) return;
        cancelAnimationFrame(rafRef.current);
        clearedRef.current = 0; posRef.current = 0; dirRef.current = 1;
        const b = Array.from({ length: TET_ROWS }, () => Array(TET_COLS).fill(null)); 
        boardRef.current = b;
        setBoard(b.map(r => [...r])); setCleared(0); setResult(null); setPlaying(true);
        syncToStore(isObserver, { board: b, cleared: 0, result: null, playing: true });
        
        newPiece(); 
        rafRef.current = requestAnimationFrame(slideTick);
    }, [slideTick, newPiece, isObserver]);

    useEffect(() => { init(); return () => cancelAnimationFrame(rafRef.current); }, [init]);

    return (
        <div style={S.screen}>
            <MiniGameStylesPart2 />
            <GameHeader title="📦 段ボールパズル" pts={pts} onBack={onBack} />
            <div style={S.body}>
                <Instr>制限時間なし！パーツが左右に動く！◀▶で列を選んでDROPで落とせ！2段クリアで成功！</Instr>
                <StatBox label="クリア段数" val={`${cleared} / 2`} />
                
                <div style={{ display: 'flex', gap: 2, padding: '6px 8px', background: '#241a0e', border: `2px solid ${playing ? '#c97b2a' : '#3d2e1a'}`, borderRadius: 10, width: 'fit-content', minHeight: 50, alignItems: 'center' }}>
                    {Array.from({ length: TET_COLS }).map((_, c) => (
                        <div key={c} className="tet-preview-cell" style={{ background: c >= pieceX && c < pieceX + pieceW ? pieceColor : '#0a0a0a', borderColor: c >= pieceX && c < pieceX + pieceW ? 'rgba(255,255,255,.4)' : '#222' }}>
                            {c >= pieceX && c < pieceX + pieceW ? '📦' : ''}
                        </div>
                    ))}
                </div>
                
                <div style={{ background: '#1a1309', border: '3px solid #5a4228', borderRadius: 12, padding: '.6rem', display: 'inline-block' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${TET_COLS}, 36px)`, gridTemplateRows: `repeat(${TET_ROWS}, 28px)`, gap: 2 }}>
                        {board.map((row, r) => row.map((cell, c) => (
                            <div key={`${r}-${c}`} className="tet-cell" style={{ background: cell || '#0f0f0f', borderColor: cell ? 'rgba(255,255,255,.15)' : '#1a1a1a' }}>{cell ? '📦' : ''}</div>
                        )))}
                    </div>
                </div>
                
                {!result && (
                    <div style={{ display: 'flex', gap: '.55rem', justifyContent: 'center' }}>
                        <button className="tet-btn" onPointerDown={() => tetMove(-1)}>◀ 左</button>
                        <button className="tet-btn tet-btn-drop" onPointerDown={tetDrop}>⬇ DROP</button>
                        <button className="tet-btn" onPointerDown={() => tetMove(1)}>右 ▶</button>
                    </div>
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
   Game 8: 🪰 ハエ捕まえ (完全同期対応版)
════════════════════════════════════════ */
export function FlyGame({ pts, addPts, onBack, isEventMode, isObserver }) {
    const mgSyncData = useGameStore(s => s.mgSyncData);

    const [caught, setCaught] = useState(0);
    const [started, setStarted] = useState(false);
    const [result, setResult] = useState(null);
    const [fxList, setFxList] = useState([]);
    
    const arenaRef = useRef(null);
    const rafRef = useRef(null);
    const pos = useRef({ x: 0, y: 0, vx: 3, vy: 3 });
    const caughtRef = useRef(0);
    const playingRef = useRef(false);

    const { time, start, stop } = useTimer(10, () => { if (playingRef.current && !isObserver) endFly(); });
    
    useEffect(() => { if (!isObserver) syncToStore(isObserver, { time }); }, [time, isObserver]);
    const displayTime = isObserver ? (mgSyncData?.time ?? 10) : time;

    // ▼ 観戦者: 同期
    useEffect(() => {
        if (isObserver && mgSyncData) {
            if (mgSyncData.caught !== undefined) setCaught(mgSyncData.caught);
            if (mgSyncData.started !== undefined) setStarted(mgSyncData.started);
            if (mgSyncData.fxList) setFxList(mgSyncData.fxList);
            if (mgSyncData.result !== undefined) setResult(mgSyncData.result);
            
            const el = document.getElementById('fly-target');
            if (el && mgSyncData.flyX !== undefined) {
                el.style.left = mgSyncData.flyX + 'px';
                el.style.top = mgSyncData.flyY + 'px';
                el.style.transform = mgSyncData.flip ? 'scaleX(-1)' : 'scaleX(1)';
            }
        }
    }, [isObserver, mgSyncData]);

    const endFly = useCallback((forceWin = false) => {
        if (isObserver) return;
        playingRef.current = false; stop(); cancelAnimationFrame(rafRef.current);
        const c = caughtRef.current;
        const win = forceWin || c >= 3;
        if (win) addPts(15);
        
        const resObj = { win, icon: win ? '🪰🪰🪰' : '⏰', main: win ? '3匹全部捕まえた！' : '時間切れ！', sub: `${c}匹捕獲`, pts: win ? 15 : c * 3 };
        setResult(resObj);
        syncToStore(isObserver, { result: resObj });
    }, [stop, addPts, isObserver]);

    const moveFly = useCallback(() => {
        if (!playingRef.current || !arenaRef.current || isObserver) return;
        const W = arenaRef.current.offsetWidth; 
        const H = arenaRef.current.offsetHeight;
        const p = pos.current;
        
        p.vx += (Math.random() - .5) * 1.0; 
        p.vy += (Math.random() - .5) * 1.0;
        
        const spd = Math.hypot(p.vx, p.vy);
        const max = 6 + caughtRef.current * 1.0; 
        if (spd > max) { p.vx = (p.vx / spd) * max; p.vy = (p.vy / spd) * max; }
        
        p.x += p.vx; p.y += p.vy;
        
        const margin = 30;
        if (p.x < margin) { p.x = margin; p.vx = Math.abs(p.vx) + 1; } 
        if (p.x > W - margin) { p.x = W - margin; p.vx = -Math.abs(p.vx) - 1; }
        if (p.y < margin) { p.y = margin; p.vy = Math.abs(p.vy) + 1; } 
        if (p.y > H - margin) { p.y = H - margin; p.vy = -Math.abs(p.vy) - 1; }
        
        const el = document.getElementById('fly-target');
        if (el) {
            el.style.left = p.x + 'px';
            el.style.top = p.y + 'px';
            const flip = p.vx < 0;
            el.style.transform = flip ? 'scaleX(-1)' : 'scaleX(1)';
            syncToStore(isObserver, { flyX: p.x, flyY: p.y, flip });
        }
        
        rafRef.current = requestAnimationFrame(moveFly);
    }, [isObserver]);

    const catchFly = useCallback((e) => {
        e.stopPropagation(); e.preventDefault();
        if (!playingRef.current || isObserver) return;
        
        caughtRef.current++; 
        setCaught(caughtRef.current);
        
        const id = Date.now();
        setFxList(prev => {
            const newList = [...prev, { id, x: pos.current.x - 15, y: pos.current.y - 15 }];
            syncToStore(isObserver, { caught: caughtRef.current, fxList: newList });
            return newList;
        });
        
        setTimeout(() => {
            setFxList(prev => {
                const newList = prev.filter(f => f.id !== id);
                syncToStore(isObserver, { fxList: newList });
                return newList;
            });
        }, 500);
        
        if (caughtRef.current >= 3) {
            endFly(true);
        } else {
            if (arenaRef.current) {
                const W = arenaRef.current.offsetWidth, H = arenaRef.current.offsetHeight;
                pos.current.x = rnd(40, W - 40); 
                pos.current.y = rnd(40, H - 40);
                const ang = Math.random() * Math.PI * 2;
                const spd = 4 + caughtRef.current;
                pos.current.vx = Math.cos(ang) * spd; 
                pos.current.vy = Math.sin(ang) * spd;
            }
        }
    }, [endFly, isObserver]);

    const startFly = useCallback(() => {
        if (isObserver) return;
        setStarted(true); playingRef.current = true;
        if (arenaRef.current) {
            const W = arenaRef.current.offsetWidth / 2, H = arenaRef.current.offsetHeight / 2;
            const ang = Math.random() * Math.PI * 2; 
            pos.current = { x: W, y: H, vx: Math.cos(ang) * 4, vy: Math.sin(ang) * 4 };
        }
        syncToStore(isObserver, { started: true });
        start(); 
        rafRef.current = requestAnimationFrame(moveFly);
    }, [start, moveFly, isObserver]);

    const init = useCallback(() => {
        if (isObserver) return;
        playingRef.current = false; caughtRef.current = 0; setCaught(0); setStarted(false); setResult(null); setFxList([]);
        cancelAnimationFrame(rafRef.current); stop();
        syncToStore(isObserver, { caught: 0, started: false, result: null, fxList: [] });
    }, [stop, isObserver]);

    useEffect(() => { init(); return () => { playingRef.current = false; cancelAnimationFrame(rafRef.current); }; }, [init]);

    return (
        <div style={S.screen}>
            <MiniGameStylesPart2 />
            <GameHeader title="🪰 ハエ捕まえ" pts={pts} timer={started && !result ? displayTime : null} onBack={onBack} />
            <div style={S.body}>
                <Instr>10秒で3匹捕まえたら成功！（難易度緩和版）</Instr>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}><div style={{ fontSize: '.6rem', color: '#7a6a4a', letterSpacing: '.1em' }}>CATCH</div><div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.5rem', color: '#e8b84b' }}>{caught}</div></div>
                    <div className="fly-prog">
                        {[0, 1, 2].map(i => <div key={i} className={`fly-prog-dot ${i < caught ? 'caught' : ''}`}>{i < caught ? '✓' : '🪰'}</div>)}
                    </div>
                </div>
                
                <div ref={arenaRef} className="fly-arena">
                    {!started && !result && (
                        <div className="fly-start-overlay">
                            <div onPointerDown={startFly} className="big-fly">🪰</div>
                            <div style={{ fontSize: '.85rem', color: '#7a6a4a' }}>タップでスタート！</div>
                        </div>
                    )}
                    
                    {started && !result && (
                        <div id="fly-target" className="fly-el" onPointerDown={catchFly}>🪰</div>
                    )}
                    
                    {fxList.map(f => <div key={f.id} className="catch-fx" style={{ left: f.x, top: f.y }}>✨+1</div>)}
                </div>
                
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