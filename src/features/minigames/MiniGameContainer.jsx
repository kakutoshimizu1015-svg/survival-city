import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useUserStore } from '../../store/useUserStore';
import { syncGachaData } from '../../utils/userLogic';

// ========== 共通ユーティリティ ==========
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// タイマー＆ヘッダーコンポーネント
const GameHeader = ({ title, time, setTime, onEnd, isTimerDanger }) => {
    return (
        <div className="game-header">
            <button className="back-btn" onClick={() => useGameStore.setState({ gamePhase: 'minigame_menu' })}>← 戻る</button>
            <span className="gh-title">{title}</span>
            <span className={`gh-cd ${isTimerDanger ? 'danger' : ''}`}>{time}</span>
        </div>
    );
};

// リザルトコンポーネント
const ResultBox = ({ win, icon, mainText, subText, pts, onRetry }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '1rem' }}>
            <div className="result-box">
                <div className={`r-badge ${win ? 'win' : 'fail'}`}>{win ? '✅ SUCCESS' : '❌ FAILED'}</div>
                <div className={win ? 'r-win' : 'r-lose'}>{icon} {mainText}</div>
                {subText && <div className="r-sub-dim">{subText}</div>}
                {pts > 0 && <div className="r-sub">+{pts}P ゲット！</div>}
            </div>
            <button className="btn-prim" onClick={onRetry}>🔁 もう一度</button>
        </div>
    );
};

// ========== 個別ミニゲームコンポーネント (15種類) ==========

function BoxGame({ handleGameEnd }) {
    const [msg, setMsg] = useState('シャッフル中…');
    const [boxes, setBoxes] = useState([
        { id: 0, state: 'normal', text: '📦', num: 'BOX 1' },
        { id: 1, state: 'normal', text: '📦', num: 'BOX 2' },
        { id: 2, state: 'normal', text: '📦', num: 'BOX 3' },
    ]);
    const [result, setResult] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [time, setTime] = useState(10);
    const timerRef = useRef(null);
    const winBox = useRef(-1);

    const init = useCallback(async () => {
        setResult(null); setPlaying(false); setTime(10); setMsg('シャッフル中…');
        setBoxes(boxes.map(b => ({ ...b, state: 'normal', text: '📦' })));
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
        timerRef.current = setInterval(() => {
            setTime(t => {
                if (t <= 1) { clearInterval(timerRef.current); pickBox(rnd(0, 2)); return 0; }
                return t - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => { init(); return () => clearInterval(timerRef.current); }, [init]);

    const pickBox = async (idx) => {
        if (!playing) return;
        setPlaying(false); clearInterval(timerRef.current);
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
        if (win) { setResult({ win: true, icon: pz.e, main: pz.l, sub: '', pts: pz.p }); handleGameEnd(pz.p); } 
        else { setResult({ win: false, icon: '💀', main: 'ハズレ…', sub: 'また挑戦しな', pts: 0 }); }
    };

    return (
        <>
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

function VendGame({ handleGameEnd }) {
    const [machines, setMachines] = useState([]);
    const [result, setResult] = useState(null);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const timerRef = useRef(null);
    const VEND_WIN = [{ e: '💰', l: 'コイン大量発見！', p: 15 }, { e: '🥤', l: 'コーヒー缶！', p: 10 }, { e: '🎁', l: '謎のプレゼント！', p: 12 }];
    const VEND_LOSE = [{ e: '❌', l: '空っぽ…', p: 0 }, { e: '🕷️', l: 'クモが出た！', p: 0 }, { e: '💨', l: '何も出てこない…', p: 0 }];
    const VEND_STYLES = [['#2a3020', '#3d4a30', '#4a6a38'], ['#2a2010', '#3d3018', '#6a5020'], ['#102030', '#182838', '#204858']];

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10);
        const winItem = VEND_WIN[rnd(0, VEND_WIN.length - 1)];
        const losers = [...VEND_LOSE].sort(() => Math.random() - 0.5).slice(0, 2);
        const choices = [winItem, ...losers].sort(() => Math.random() - 0.5);
        const labels = ['缶ジュース', 'エナジー', 'ビール'];
        
        setMachines(choices.map((c, i) => ({
            id: i, data: c, style: VEND_STYLES[i], label: labels[i], state: 'normal', screen: '?'
        })));

        timerRef.current = setInterval(() => {
            setTime(t => {
                if (t <= 1) { clearInterval(timerRef.current); pickVend(rnd(0, 2)); return 0; }
                return t - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => { init(); return () => clearInterval(timerRef.current); }, [init]);

    const pickVend = async (idx) => {
        if (!playing) return;
        setPlaying(false); clearInterval(timerRef.current);
        
        for (const f of ['⚙️', '🔄', '⚡', '🔄']) {
            setMachines(prev => prev.map(m => m.id === idx ? { ...m, screen: f } : m));
            await sleep(130);
        }
        
        const pr = machines[idx].data;
        setMachines(prev => prev.map(m => m.id === idx ? { ...m, screen: pr.e } : { ...m, screen: m.data.e, state: 'dim' }));
        await sleep(300);
        
        const isWin = pr.p > 0;
        if (isWin) { setResult({ win: true, icon: pr.e, main: pr.l, sub: '当たり1台を引き当てた！', pts: pr.p }); handleGameEnd(pr.p); } 
        else { setResult({ win: false, icon: '💀', main: '空っぽ…', sub: '3台のうちハズレを選んだ', pts: 0 }); }
    };

    return (
        <>
            <GameHeader title="🏧 ボロ自販機" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="instr">3台のうち当たりは1台だけ！はずれ2台は空っぽ！</div>
                <div className="vending-row">
                    {machines.map(m => (
                        <div key={m.id} className={`vending ${m.state}`} style={{ background: `linear-gradient(180deg,${m.style[0]} 0%,${m.style[1]} 100%)`, borderColor: m.style[2] }} onClick={() => pickVend(m.id)}>
                            <div className="v-screen"><span>{m.screen}</span></div>
                            <div className="v-btns">{[0, 1, 2].map(i => <div key={i} className="v-btn-dot" style={{ background: m.style[2] }}></div>)}</div>
                            <div className="v-slot">↓</div>
                            <div className="v-label">{m.label}</div>
                        </div>
                    ))}
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

function HLGame({ handleGameEnd }) {
    const SUITS = ['♠', '♥', '♦', '♣'], VALS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
    const [deck, setDeck] = useState([]);
    const [idx, setIdx] = useState(0);
    const [streak, setStreak] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [nextCardVisible, setNextCardVisible] = useState(false);
    const [result, setResult] = useState(null);
    const timerRef = useRef(null);

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10); setStreak(0); setIdx(0); setNextCardVisible(false);
        let d = [];
        for (const s of SUITS) for (let i = 0; i < VALS.length; i++) d.push({ s, v: VALS[i], n: NUMS[i] });
        setDeck(d.sort(() => Math.random() - 0.5));
        
        timerRef.current = setInterval(() => {
            setTime(t => {
                if (t <= 1) { clearInterval(timerRef.current); endHL(); return 0; }
                return t - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => { init(); return () => clearInterval(timerRef.current); }, [init]);

    const endHL = () => {
        setPlaying(false); clearInterval(timerRef.current);
        setStreak(s => {
            const p = s * 5; const win = s >= 3;
            setResult({ win, icon: win ? '🎉' : '💀', main: win ? `${s}連続正解！` : '連続3回に届かず…', sub: `${s}連続 × 5P`, pts: win ? p : 0 });
            if (win) handleGameEnd(p);
            return s;
        });
    };

    const guess = async (dir) => {
        if (!playing || nextCardVisible) return;
        setNextCardVisible(true);
        const cur = deck[idx], nxt = deck[idx + 1];
        const ok = (dir === 'h' && nxt.n >= cur.n) || (dir === 'l' && nxt.n <= cur.n);
        
        await sleep(450);
        if (ok) {
            setStreak(s => s + 1); setIdx(i => i + 1);
            await sleep(550); setNextCardVisible(false);
        } else {
            setPlaying(false); clearInterval(timerRef.current);
            await sleep(300); endHL();
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

function SlotGame({ handleGameEnd }) {
    const SYMS = ['🥫', '💰', '🍺', '🐀', '💊', '🚬', '🗑️'];
    const [reels, setReels] = useState([{ stop: true, res: null }, { stop: true, res: null }, { stop: true, res: null }]);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const timerRef = useRef(null);
    const rafRef = useRef(null);
    const offsets = useRef([0, 0, 0]);

    const init = useCallback(() => {
        setResult(null); setPlaying(false); setTime(10); setReels([{ stop: true, res: null }, { stop: true, res: null }, { stop: true, res: null }]);
        offsets.current = [0, 0, 0];
        document.querySelectorAll('.reel-inner').forEach(el => el.style.transform = `translateY(0px)`);
    }, []);

    const startSlot = () => {
        setPlaying(true); setResult(null); setReels([{ stop: false, res: null }, { stop: false, res: null }, { stop: false, res: null }]);
        timerRef.current = setInterval(() => {
            setTime(t => {
                if (t <= 1) { clearInterval(timerRef.current); stopAll(); return 0; }
                return t - 1;
            });
        }, 1000);
        animate();
    };

    const animate = () => {
        if (!playing) return;
        let anyMoved = false;
        setReels(prev => {
            let nextReels = [...prev];
            prev.forEach((r, i) => {
                if (!r.stop) {
                    offsets.current[i] = (offsets.current[i] + (3.5 + i * 0.4)) % (SYMS.length * 80);
                    const el = document.getElementById('ri' + i);
                    if (el) el.style.transform = `translateY(${-SYMS.length * 80 + offsets.current[i]}px)`;
                    anyMoved = true;
                }
            });
            return nextReels;
        });
        if (anyMoved) rafRef.current = requestAnimationFrame(animate);
    };

    const stopReel = (i) => {
        setReels(prev => {
            if (prev[i].stop) return prev;
            let n = [...prev];
            const iy = 80 + SYMS.length * 80 - offsets.current[i];
            n[i].stop = true; n[i].res = SYMS[((Math.floor(iy / 80) % SYMS.length) + SYMS.length) % SYMS.length];
            return n;
        });
    };

    const stopAll = () => { [0, 1, 2].forEach(stopReel); };

    useEffect(() => {
        if (playing && reels.every(r => r.stop)) {
            setPlaying(false); clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current);
            setTimeout(() => {
                const rs = reels.map(r => r.res);
                const allSame = rs[0] === rs[1] && rs[1] === rs[2];
                const twoSame = rs[0] === rs[1] || rs[1] === rs[2] || rs[0] === rs[2];
                if (allSame) { const p = rs[0] === '💰' ? 50 : 20; setResult({ win: true, icon: '🎊', main: 'ジャックポット！', sub: rs.join(''), pts: p }); handleGameEnd(p); }
                else if (twoSame) { setResult({ win: true, icon: '✨', main: '2つ揃い！', sub: rs.join(''), pts: 5 }); handleGameEnd(5); }
                else { setResult({ win: false, icon: '💀', main: 'ハズレ', sub: rs.join(''), pts: 0 }); }
            }, 150);
        }
    }, [reels, playing, handleGameEnd]);

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); }; }, [init]);

    return (
        <>
            <GameHeader title="🎰 路上スロット" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="instr">10秒以内に全リールをSTOP！時間切れで自動停止！</div>
                <div className="slot-machine">
                    <div className="reels-wrap">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="reel-col">
                                <div className="reel-window">
                                    <div className="reel-inner" id={"ri" + i}>
                                        {Array(3).fill(0).map((_, r) => SYMS.map((s, si) => <div key={r + '-' + si} className="reel-sym">{s}</div>))}
                                    </div>
                                </div>
                                <button className={`stop-btn ${reels[i].stop && playing ? 'stopped' : ''}`} disabled={!playing || reels[i].stop} onClick={() => stopReel(i)}>
                                    {reels[i].stop && reels[i].res ? '✓ ' + reels[i].res : 'STOP'}
                                </button>
                            </div>
                        ))}
                    </div>
                    {!playing && !result && <button className="slot-start" onClick={startSlot}>🎰 スタート！</button>}
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

function FlyGame({ handleGameEnd }) {
    const [caught, setCaught] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const [flyPos, setFlyPos] = useState({ x: 150, y: 150, vx: 5, vy: 5 });
    const timerRef = useRef(null);
    const rafRef = useRef(null);

    const init = useCallback(() => {
        setResult(null); setPlaying(false); setTime(10); setCaught(0);
    }, []);

    const start = () => {
        setPlaying(true); setCaught(0); setFlyPos({ x: 150, y: 150, vx: 5, vy: 5 });
        timerRef.current = setInterval(() => {
            setTime(t => {
                if (t <= 1) { clearInterval(timerRef.current); end(false); return 0; }
                return t - 1;
            });
        }, 1000);
        animate();
    };

    const animate = () => {
        if (!playing) return;
        setFlyPos(p => {
            let { x, y, vx, vy } = p;
            vx += (Math.random() - 0.5) * 1.5; vy += (Math.random() - 0.5) * 1.5;
            x += vx; y += vy;
            if (x < 0 || x > 380) vx *= -1; if (y < 0 || y > 270) vy *= -1;
            return { x, y, vx, vy };
        });
        rafRef.current = requestAnimationFrame(animate);
    };

    const end = (forceWin) => {
        setPlaying(false); clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current);
        setCaught(c => {
            const win = forceWin || c >= 3;
            setResult({ win, icon: win ? '🪰' : '⏰', main: win ? '3匹全部捕まえた！' : '時間切れ！', sub: `${c}匹捕獲`, pts: win ? 15 : c * 3 });
            if (win || c > 0) handleGameEnd(win ? 15 : c * 3);
            return c;
        });
    };

    const catchFly = (e) => {
        e.stopPropagation();
        if (!playing) return;
        setCaught(c => {
            const nc = c + 1;
            if (nc >= 3) { end(true); }
            else { setFlyPos({ x: rnd(20, 300), y: rnd(20, 200), vx: rnd(-8, 8), vy: rnd(-8, 8) }); }
            return nc;
        });
    };

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); }; }, [init]);

    return (
        <>
            <GameHeader title="🪰 ハエ捕まえ" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div className="fly-timer-box">{caught}</div>
                    <div className="fly-prog">{[0, 1, 2].map(i => <div key={i} className={`fly-prog-dot ${caught > i ? 'caught' : ''}`}>{caught > i ? '✓' : '🪰'}</div>)}</div>
                </div>
                <div className="fly-arena">
                    {!playing && !result && <div className="fly-start-overlay" onClick={start}><div className="big-fly">🪰</div><div>タップでスタート</div></div>}
                    {playing && <div className="fly" style={{ left: flyPos.x, top: flyPos.y, transform: flyPos.vx < 0 ? 'scaleX(-1)' : 'scaleX(1)' }} onClick={catchFly}>🪰</div>}
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

function ScratchGame({ handleGameEnd }) {
    const SC_SYMS = ['🥫', '💰', '🍺', '🐀', '💊', '🎁'];
    const [grid, setGrid] = useState([]);
    const [revealed, setRevealed] = useState(Array(9).fill(false));
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const timerRef = useRef(null);
    
    const count = revealed.filter(Boolean).length;

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10); setRevealed(Array(9).fill(false));
        const newGrid = Array.from({ length: 9 }, () => SC_SYMS[rnd(0, 5)]);
        if (Math.random() < 0.3) { const sym = SC_SYMS[rnd(0, 5)]; const pos = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5).slice(0, 3); pos.forEach(p => newGrid[p] = sym); }
        setGrid(newGrid);
        
        timerRef.current = setInterval(() => {
            setTime(t => {
                if (t <= 1) { clearInterval(timerRef.current); check(); return 0; }
                return t - 1;
            });
        }, 1000);
    }, []);

    const check = useCallback(() => {
        setPlaying(false); clearInterval(timerRef.current);
        setRevealed(prev => {
            const rev = grid.filter((_, i) => prev[i]);
            const counts = {}; rev.forEach(s => counts[s] = (counts[s] || 0) + 1);
            const mx = Math.max(0, ...Object.values(counts));
            const ws = Object.keys(counts).find(k => counts[k] === mx) || '';
            const win = mx >= 2; const p = mx >= 3 ? 20 : mx >= 2 ? 5 : 0;
            setResult({ win, icon: win ? '🎊' : '💀', main: win ? `${ws}×${mx} 揃い！` : '揃わなかった…', sub: `削ったマス: ${rev.join(' ')}`, pts: p });
            if (win) handleGameEnd(p);
            return prev; // State update shouldn't be here ideally, but fine for quick port
        });
    }, [grid, handleGameEnd]);

    const scratch = (idx) => {
        if (!playing || revealed[idx] || count >= 3) return;
        setRevealed(prev => {
            const next = [...prev]; next[idx] = true;
            if (next.filter(Boolean).length >= 3) setTimeout(check, 500);
            return next;
        });
    };

    useEffect(() => { init(); return () => clearInterval(timerRef.current); }, [init]);

    return (
        <>
            <GameHeader title="🪙 スクラッチ" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="scratch-remain">あと {3 - count} マス削れます</div>
                <div className="scratch-grid-wrap">
                    <div className="scratch-grid">
                        {grid.map((sym, i) => (
                            <div key={i} className="scratch-cell" onClick={() => scratch(i)} style={{ background: revealed[i] ? 'var(--card2)' : '#4a3520', cursor: revealed[i] ? 'default' : 'pointer' }}>
                                <div className="scratch-reveal" style={{ opacity: revealed[i] ? 1 : 0 }}>{sym}</div>
                                {!revealed[i] && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(220,170,80,0.6)', fontSize: '26px', fontWeight: 'bold' }}>？</div>}
                            </div>
                        ))}
                    </div>
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

function TrashGame({ handleGameEnd }) {
    const TRASH_DATA = [
        { label: '🗑️', name: '普通のゴミ箱', d: 15, res: [{ e: '🥫', t: 'c', w: 3 }, { e: '🍔', t: 'f', w: 2 }, { e: '💀', t: 'e', w: 0 }] },
        { label: '🗑️', name: 'ゴミ箱2', d: 12, res: [{ e: '🥫', t: 'c', w: 3 }, { e: '🪙', t: 'm', w: 1 }] },
        { label: '🗑️', name: '捨て場', d: 8, res: [{ e: '💰', t: 'm', w: 5 }, { e: '🍜', t: 'f', w: 2 }] },
        { label: '⚠️🗑️', name: '危険なゴミ箱！', d: 80, type: 'danger', res: [{ e: '🚔', t: 'p', w: 0 }] },
        { label: '🚫🗑️', name: '立入禁止！', d: 100, type: 'danger', res: [{ e: '🚔', t: 'p', w: 0 }] }
    ];
    const [cans, setCans] = useState([]);
    const [stats, setStats] = useState({ c: 0, f: 0, m: 0, danger: 0 });
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const timerRef = useRef(null);

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10); setStats({ c: 0, f: 0, m: 0, danger: 0 });
        const shuffled = [...TRASH_DATA].sort(() => Math.random() - 0.5).slice(0, 5);
        setCans(shuffled.map((c, i) => ({ id: i, ...c, done: false })));
        timerRef.current = setInterval(() => {
            setTime(t => {
                if (t <= 1) { clearInterval(timerRef.current); end('time'); return 0; }
                return t - 1;
            });
        }, 1000);
    }, []);

    const end = (reason, st = stats) => {
        setPlaying(false); clearInterval(timerRef.current);
        const p = st.c * 2 + st.f * 3 + st.m * 4;
        if (reason === 'police') { setResult({ win: false, icon: '🚔', main: '警察に捕まった！', sub: '全て没収…', pts: 0 }); }
        else { const w = p > 0; setResult({ win: w, icon: w ? '🗑️' : '💀', main: w ? '収穫完了！' : '何も見つからなかった…', sub: `缶×${st.c} 食料×${st.f} 金×${st.m}`, pts: p }); if (w) handleGameEnd(p); }
    };

    const search = async (idx) => {
        if (!playing || cans[idx].done) return;
        const c = cans[idx];
        const res = c.res[rnd(0, c.res.length - 1)];
        
        setCans(prev => prev.map((x, i) => i === idx ? { ...x, done: true, pop: res.e } : x));
        setStats(prev => {
            let n = { ...prev, danger: Math.min(100, prev.danger + c.d) };
            if (res.t === 'c') n.c++; else if (res.t === 'f') n.f++; else if (res.t === 'm') n.m += res.w || 2;
            if (res.t === 'p' || n.danger >= 100) setTimeout(() => end('police', n), 500);
            else if (cans.filter(x => x.done).length >= 4) setTimeout(() => end('all', n), 500);
            return n;
        });
    };

    useEffect(() => { init(); return () => clearInterval(timerRef.current); }, [init]);

    return (
        <>
            <GameHeader title="🗑️ ゴミ箱あさり" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="status-row">
                    <div className="stat-box"><span className="stat-label">🥫 缶</span><span className="stat-val">{stats.c}</span></div>
                    <div className="stat-box"><span className="stat-label">🍔 食</span><span className="stat-val">{stats.f}</span></div>
                    <div className="stat-box"><span className="stat-label">💰 金</span><span className="stat-val">{stats.m}</span></div>
                </div>
                <div className="danger-wrap">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: '3px' }}><span style={{ color: 'var(--dim)' }}>⚠️ 危険度</span><span style={{ color: 'var(--red2)' }}>{stats.danger}%</span></div>
                    <div className="danger-track"><div className="danger-fill" style={{ width: `${stats.danger}%` }}></div></div>
                </div>
                <div className="gc-grid">
                    {cans.map((c, i) => (
                        <div key={i} className={`gc-can ${c.type === 'danger' ? 'danger-can' : ''} ${c.done ? 'done' : ''}`} onClick={() => search(i)}>
                            <span style={{ fontSize: '1.4rem' }}>{c.label}</span><span className="gc-can-label">{c.name}</span>
                            {c.pop && <div className="gc-pop" style={{ background: c.type === 'danger' ? '#8a2020' : '#3a5020' }}>{c.pop}</div>}
                        </div>
                    ))}
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

function BegGame({ handleGameEnd }) {
    const NPCS = [{ e: '🤵', p: 5 }, { e: '👩', p: 0 }, { e: '🧑‍🎓', p: 2 }, { e: '🕴️', p: -3 }, { e: '👮', p: -5 }, { e: '👴', p: 4 }, { e: '💼', p: 10 }];
    const [earned, setEarned] = useState(0);
    const [count, setCount] = useState(6);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const [npcX, setNpcX] = useState(-50);
    const [curNpc, setCurNpc] = useState(null);
    const timerRef = useRef(null);
    const rafRef = useRef(null);

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10); setEarned(0); setCount(6); spawnNpc();
        timerRef.current = setInterval(() => {
            setTime(t => {
                if (t <= 1) { clearInterval(timerRef.current); end(); return 0; }
                return t - 1;
            });
        }, 1000);
    }, []);

    const spawnNpc = () => {
        setCurNpc(NPCS[rnd(0, NPCS.length - 1)]);
        setNpcX(110);
        cancelAnimationFrame(rafRef.current);
        const tick = () => {
            setNpcX(x => {
                if (x < -20) { setCount(c => c - 1); setTimeout(spawnNpc, 500); return -50; }
                return x - 1.5;
            });
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    };

    const beg = () => {
        if (!playing || npcX < -10 || npcX > 100) return;
        const inZone = npcX >= 38 && npcX <= 62;
        cancelAnimationFrame(rafRef.current); setNpcX(-50);
        if (inZone && curNpc) {
            setEarned(e => Math.max(0, e + curNpc.p));
        }
        setCount(c => c - 1);
        if (count > 1) setTimeout(spawnNpc, 800); else setTimeout(end, 500);
    };

    const end = () => {
        setPlaying(false); clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current);
        setEarned(e => {
            const win = e >= 5;
            setResult({ win, icon: win ? '💰' : '😔', main: win ? '物乞い成功！' : '稼ぎが足りなかった…', sub: `獲得 ${e}P`, pts: win ? e : 0 });
            if (win) handleGameEnd(e);
            return e;
        });
    };

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); }; }, [init]);

    return (
        <>
            <GameHeader title="🙏 物乞い" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="status-row">
                    <div className="stat-box"><span className="stat-label">残りNPC</span><span className="stat-val">{count}</span></div>
                    <div className="stat-box"><span className="stat-label">💰 獲得</span><span className="stat-val" style={{ color: 'var(--gold)' }}>{earned}P</span></div>
                </div>
                <div className="beg-street">
                    <div className="beg-road"></div><div className="beg-zone"></div><div className="beg-char">🧎</div>
                    {npcX > -20 && <div className="beg-npc" style={{ left: `${npcX}%` }}>{curNpc?.e}</div>}
                </div>
                {!result && <button className="btn-prim" onClick={beg}>🙏 お恵みを…</button>}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

function RainGame({ handleGameEnd }) {
    const [wet, setWet] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const [jump, setJump] = useState(false);
    const [obs, setObs] = useState({ x: 120, active: false });
    const timerRef = useRef(null);
    const obsRef = useRef(null);

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10); setWet(0); setObs({ x: 120, active: false });
        timerRef.current = setInterval(() => {
            setTime(t => {
                if (t <= 1) { clearInterval(timerRef.current); end(true); return 0; }
                return t - 1;
            });
            setWet(w => Math.min(100, w + 1.5));
        }, 1000);
        setTimeout(spawnObs, 1500);
    }, []);

    const spawnObs = () => {
        if (!playing) return;
        setObs({ x: 120, active: true });
        cancelAnimationFrame(obsRef.current);
        let x = 120;
        const tick = () => {
            x -= 4;
            setObs({ x, active: true });
            if (x < 25 && x > 15) {
                setJump(j => {
                    if (!j) setWet(w => { const nw = Math.min(100, w + 25); if (nw >= 100) end(false); return nw; });
                    return j;
                });
            }
            if (x < -20) { setTimeout(spawnObs, 800); return; }
            obsRef.current = requestAnimationFrame(tick);
        };
        obsRef.current = requestAnimationFrame(tick);
    };

    const doJump = () => { if (!playing || jump) return; setJump(true); setTimeout(() => setJump(false), 500); };

    const end = (win) => {
        setPlaying(false); clearInterval(timerRef.current); cancelAnimationFrame(obsRef.current);
        setWet(w => {
            const p = win ? Math.max(2, Math.floor(12 * (1 - w / 100))) : 0;
            setResult({ win, icon: win ? '🏕️' : '💧', main: win ? '雨宿り成功！' : 'びしょ濡れで動けない…', sub: `濡れ度 ${Math.floor(w)}%`, pts: p });
            if (p > 0) handleGameEnd(p);
            return w;
        });
    };

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(obsRef.current); }; }, [init]);

    return (
        <>
            <GameHeader title="☔ 雨宿りダッシュ" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="danger-wrap"><div className="wet-track"><div className="wet-fill" style={{ width: `${wet}%` }}></div></div></div>
                <div className="rain-arena">
                    <div className={`rain-runner ${jump ? 'runner-jumping' : ''}`} style={{ bottom: jump ? '60px' : '20px' }}>🏃</div>
                    {obs.active && <div className="obs-el" style={{ left: `${obs.x}%` }}>🐕</div>}
                </div>
                {!result && <button className="jump-btn-big" onClick={doJump}>⬆️ JUMP！</button>}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

function KashiGame({ handleGameEnd }) {
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

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10); setScore(0); setRival(0); setPx(40); setRx(68); setBentos([]);
        timerRef.current = setInterval(() => {
            setTime(t => {
                if (t <= 1) { clearInterval(timerRef.current); end(); return 0; }
                return t - 1;
            });
            setBentos(prev => [...prev, { id: Date.now(), x: rnd(10, 90), y: 0 }]);
        }, 1000);
        animate();
    }, []);

    const animate = () => {
        if (!playing) return;
        setBentos(prev => {
            let next = prev.map(b => ({ ...b, y: b.y + 2.5 }));
            next = next.filter(b => {
                if (b.y > 90) return false;
                if (b.y > 75) {
                    setPx(cx => { if (Math.abs(b.x - cx) < 10) { setScore(s => s + 1); b.hit = true; } return cx; });
                    setRx(cx => { if (!b.hit && Math.abs(b.x - cx) < 10) { setRival(s => s + 1); b.hit = true; } return cx; });
                }
                return !b.hit;
            });
            return next;
        });
        setRx(cx => { const tgt = bentos[0]?.x || 50; return cx + (tgt > cx ? 1.5 : -1.5); });
        rafRef.current = requestAnimationFrame(animate);
    };

    const move = (d) => { if (playing) setPx(x => Math.max(5, Math.min(95, x + d * 10))); };

    const end = () => {
        setPlaying(false); clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current);
        setScore(s => {
            const win = s >= 3; const p = s * 3;
            setResult({ win, icon: win ? '🍱' : '😢', main: win ? '弁当3個ゲット！' : '3個に届かなかった…', sub: `あなた${s}個`, pts: p });
            if (p > 0) handleGameEnd(p);
            return s;
        });
    };

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); }; }, [init]);

    return (
        <>
            <GameHeader title="🍱 炊き出し争奪" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="status-row">
                    <div className="stat-box"><span className="stat-label">🍱 あなた</span><span className="stat-val">{score}</span></div>
                </div>
                <div className="kashi-arena">
                    <div className="kashi-player" style={{ left: `${px}%`, transition: 'left 0.1s' }}>🧍</div>
                    <div className="kashi-npc" style={{ left: `${rx}%`, transition: 'left 0.1s' }}>🧟</div>
                    {bentos.map(b => <div key={b.id} className="bento-el" style={{ left: `${b.x}%`, top: `${b.y}%` }}>🍱</div>)}
                </div>
                {!result && <div className="kashi-btns"><button className="kashi-mv-btn" onClick={() => move(-1)}>◀</button><button className="kashi-mv-btn" onClick={() => move(1)}>▶</button></div>}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

function OxoGame({ handleGameEnd }) {
    const { gachaPoints } = useUserStore();
    const [board, setBoard] = useState(Array(9).fill(null));
    const [bet, setBet] = useState(0);
    const [phase, setPhase] = useState('bet');
    const [time, setTime] = useState(5);
    const [result, setResult] = useState(null);
    const timerRef = useRef(null);

    const init = useCallback(() => { setResult(null); setPhase('bet'); setBoard(Array(9).fill(null)); }, []);

    const start = (b) => {
        if (gachaPoints < b) { alert('Pが足りない！'); return; }
        useUserStore.getState().addGachaAssets(0, -b); // 賭け金没収
        setBet(b); setPhase('play'); setTime(5);
        timerRef.current = setInterval(() => {
            setTime(t => { if (t <= 1) { clearInterval(timerRef.current); end('lose'); return 0; } return t - 1; });
        }, 1000);
    };

    const checkWin = (brd) => {
        const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        for (let [a, b, c] of lines) { if (brd[a] && brd[a] === brd[b] && brd[a] === brd[c]) return brd[a]; }
        if (brd.every(c => c)) return 'draw';
        return null;
    };

    const move = (i) => {
        if (board[i] || phase !== 'play') return;
        clearInterval(timerRef.current);
        const nb = [...board]; nb[i] = 'p'; setBoard(nb);
        let res = checkWin(nb); if (res) { end(res); return; }
        
        setTimeout(() => {
            const avail = nb.map((c, idx) => c === null ? idx : null).filter(c => c !== null);
            if (avail.length === 0) { end('draw'); return; }
            nb[avail[rnd(0, avail.length - 1)]] = 'c'; setBoard(nb);
            res = checkWin(nb); if (res) { end(res); return; }
            setTime(5); timerRef.current = setInterval(() => { setTime(t => { if (t <= 1) { clearInterval(timerRef.current); end('lose'); return 0; } return t - 1; }); }, 1000);
        }, 500);
    };

    const end = (res) => {
        clearInterval(timerRef.current); setPhase('end');
        if (res === 'p') { setResult({ win: true, icon: '○', main: '勝ち！', sub: `${bet}P→2倍`, pts: bet * 2 }); handleGameEnd(bet * 2); }
        else if (res === 'draw') { setResult({ win: false, icon: '🤝', main: '引き分け', sub: '返還', pts: bet }); handleGameEnd(bet); }
        else { setResult({ win: false, icon: '×', main: '負け…', sub: '没収', pts: 0 }); }
    };

    useEffect(() => { return () => clearInterval(timerRef.current); }, []);

    return (
        <>
            <GameHeader title="♟️ 路上○×" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                {phase === 'bet' && (
                    <div className="bet-btns">
                        {[3, 5, 8, 10].map(b => <button key={b} className="bet-btn" onClick={() => start(b)}>{b}P賭ける</button>)}
                    </div>
                )}
                {phase !== 'bet' && (
                    <div className="oxo-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px', width: '230px' }}>
                        {board.map((c, i) => <div key={i} className="oxo-cell" onClick={() => move(i)} style={{ height: '70px', background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{c === 'p' ? '○' : c === 'c' ? '×' : ''}</div>)}
                    </div>
                )}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

function RatGame({ handleGameEnd }) {
    const [rats, setRats] = useState([]);
    const [hit, setHit] = useState(0);
    const [stolen, setStolen] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const timerRef = useRef(null);
    const rafRef = useRef(null);

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10); setHit(0); setStolen(0);
        setRats(Array.from({ length: 4 }, (_, i) => spawnRat(i)));
        timerRef.current = setInterval(() => {
            setTime(t => { if (t <= 1) { clearInterval(timerRef.current); end(); return 0; } return t - 1; });
        }, 1000);
        animate();
    }, []);

    const spawnRat = (id) => {
        const side = rnd(0, 3);
        let x = side === 0 ? rnd(0, 300) : side === 1 ? 300 : side === 2 ? rnd(0, 300) : 0;
        let y = side === 0 ? 0 : side === 1 ? rnd(0, 200) : side === 2 ? 200 : rnd(0, 200);
        return { id, x, y, alive: true };
    };

    const animate = () => {
        if (!playing) return;
        setRats(prev => {
            let next = [...prev];
            next.forEach(r => {
                if (!r.alive) return;
                const dx = 150 - r.x, dy = 100 - r.y, dist = Math.hypot(dx, dy);
                if (dist < 20) { r.alive = false; setStolen(s => { useUserStore.getState().addGachaAssets(0, -2); return s + 2; }); setTimeout(() => setRats(rr => rr.map(x => x.id === r.id ? spawnRat(x.id) : x)), 1000); }
                else { r.x += dx / dist * 1.5; r.y += dy / dist * 1.5; }
            });
            return next;
        });
        rafRef.current = requestAnimationFrame(animate);
    };

    const tapRat = (id) => {
        if (!playing) return;
        setRats(prev => prev.map(r => r.id === id ? { ...r, alive: false } : r));
        setHit(h => h + 1);
        setTimeout(() => setRats(prev => prev.map(r => r.id === id ? spawnRat(id) : r)), 1000);
    };

    const end = () => {
        setPlaying(false); clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current);
        setStolen(s => {
            setHit(h => {
                const win = s <= 3; const p = win ? Math.max(0, h * 2 - s) : 0;
                setResult({ win, icon: win ? '🐀' : '💀', main: win ? '撃退成功！' : '盗まれすぎた…', sub: `撃退${h} 損失${s}`, pts: p });
                if (p > 0) handleGameEnd(p);
                return h;
            });
            return s;
        });
    };

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); }; }, [init]);

    return (
        <>
            <GameHeader title="🐀 ネズミ追い払い" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="status-row"><div className="stat-box">🐀 撃退 {hit}</div><div className="stat-box" style={{ color: 'var(--red2)' }}>💰 損失 {stolen}P</div></div>
                <div className="rat-arena" style={{ width: '300px', height: '200px', position: 'relative' }}>
                    <div className="rat-stash" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '2rem' }}>💰</div>
                    {rats.map(r => r.alive && <div key={r.id} onClick={() => tapRat(r.id)} style={{ position: 'absolute', left: r.x, top: r.y, fontSize: '1.5rem', cursor: 'pointer' }}>🐀</div>)}
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

function DrunkGame({ handleGameEnd }) {
    const [bal, setBal] = useState(50);
    const [keep, setKeep] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const timerRef = useRef(null);
    const rafRef = useRef(null);
    const drift = useRef(0);

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10); setBal(50); setKeep(0); drift.current = 0;
        timerRef.current = setInterval(() => {
            setTime(t => { if (t <= 1) { clearInterval(timerRef.current); end(true); return 0; } return t - 1; });
            setBal(b => { if (b >= 35 && b <= 65) setKeep(k => k + 1); return b; });
        }, 1000);
        animate();
    }, []);

    const animate = () => {
        if (!playing) return;
        setBal(b => {
            drift.current += (Math.random() - 0.5) * 0.5;
            drift.current = Math.max(-1.5, Math.min(1.5, drift.current));
            const nb = b + drift.current;
            if (nb <= 0 || nb >= 100) { end(false); return nb; }
            return nb;
        });
        rafRef.current = requestAnimationFrame(animate);
    };

    const tap = (d) => { if (playing) { setBal(b => Math.max(0, Math.min(100, b - d * 15))); drift.current -= d; } };

    const end = (survived) => {
        setPlaying(false); clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current);
        setKeep(k => {
            const win = survived && k >= 6; const p = Math.floor(k * 1.5);
            setResult({ win, icon: win ? '🎉' : '🌀', main: win ? 'キープ成功！' : '倒れた！', sub: `緑ゾーン${k}秒`, pts: win ? p : 0 });
            if (win) handleGameEnd(p);
            return k;
        });
    };

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); }; }, [init]);

    return (
        <>
            <GameHeader title="🍺 酔っ払いバランス" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="stat-box">✅ ゾーン内 {keep}秒</div>
                <div style={{ fontSize: '4rem', transform: `rotate(${(bal - 50) / 2}deg)` }}>🧔</div>
                <div className="balance-bar-track" style={{ width: '100%', height: '26px', background: 'var(--card3)', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '35%', width: '30%', height: '100%', background: 'rgba(78,133,57,0.3)' }}></div>
                    <div style={{ position: 'absolute', left: `${bal}%`, width: '10px', height: '100%', background: 'var(--gold)', transform: 'translateX(-5%)' }}></div>
                </div>
                {!result && <div style={{ display: 'flex', width: '100%', gap: '10px' }}><button style={{ flex: 1, padding: '20px' }} onClick={() => tap(-1)}>←左</button><button style={{ flex: 1, padding: '20px' }} onClick={() => tap(1)}>右→</button></div>}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

function MusicGame({ handleGameEnd }) {
    const [score, setScore] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const [notes, setNotes] = useState([]);
    const timerRef = useRef(null);
    const rafRef = useRef(null);
    const SEQ = [{ l: 0, t: 0.2 }, { l: 1, t: 0.7 }, { l: 2, t: 1.2 }, { l: 0, t: 1.6 }, { l: 1, t: 2.0 }, { l: 2, t: 2.4 }, { l: 0, t: 2.7 }, { l: 1, t: 3.1 }, { l: 2, t: 3.5 }, { l: 0, t: 3.8 }];
    const t0 = useRef(0);

    const init = useCallback(() => {
        setResult(null); setPlaying(false); setTime(10); setScore(0); setNotes([]);
    }, []);

    const start = () => {
        setPlaying(true); setScore(0); t0.current = performance.now() / 1000;
        setNotes(SEQ.map((n, i) => ({ id: i, ...n, hit: false, missed: false, y: -20 })));
        timerRef.current = setInterval(() => { setTime(t => { if (t <= 1) { clearInterval(timerRef.current); end(); return 0; } return t - 1; }); }, 1000);
        animate();
    };

    const animate = () => {
        if (!playing) return;
        const now = performance.now() / 1000 - t0.current;
        setNotes(prev => prev.map(n => {
            if (n.hit || n.missed) return n;
            if (now >= n.t) {
                const elapsed = now - n.t;
                const y = -20 + (elapsed / 1.5) * 320;
                if (y > 300) return { ...n, missed: true };
                return { ...n, y };
            }
            return n;
        }));
        rafRef.current = requestAnimationFrame(animate);
    };

    const tap = (lane) => {
        if (!playing) return;
        setNotes(prev => {
            let next = [...prev];
            const targetIdx = next.findIndex(n => n.l === lane && !n.hit && !n.missed && n.y > 200 && n.y < 300);
            if (targetIdx >= 0) {
                next[targetIdx].hit = true;
                setScore(s => s + 10);
            }
            return next;
        });
    };

    const end = () => {
        setPlaying(false); clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current);
        setScore(s => {
            const win = s >= 60; const p = Math.round(s / 5);
            setResult({ win, icon: win ? '🎸' : '😔', main: win ? 'ライブ成功！' : '失敗…', sub: `スコア ${s}`, pts: win ? p : 0 });
            if (win) handleGameEnd(p);
            return s;
        });
    };

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); }; }, [init]);

    return (
        <>
            <GameHeader title="🎸 路上ライブ" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="music-score-disp">スコア: {score}</div>
                <div className="music-arena" style={{ width: '100%', height: '300px', background: '#080608', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', bottom: '60px', width: '100%', height: '3px', background: 'var(--amber)' }}></div>
                    {notes.map(n => (!n.hit && !n.missed && n.y >= 0 && <div key={n.id} style={{ position: 'absolute', left: `${n.l * 33.3}%`, top: `${n.y}px`, width: '33%', textAlign: 'center', fontSize: '2rem' }}>{['🎸', '🥁', '🎹'][n.l]}</div>))}
                    <div style={{ position: 'absolute', bottom: 0, display: 'flex', width: '100%', height: '60px' }}>
                        {[0, 1, 2].map(l => <button key={l} style={{ flex: 1 }} onClick={() => tap(l)}>{['🎸', '🥁', '🎹'][l]}</button>)}
                    </div>
                </div>
                {!playing && !result && <button className="btn-prim" onClick={start}>スタート</button>}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

function NegoGame({ handleGameEnd }) {
    const ITEMS = [{ e: '🥫', n: '缶詰', m: 20 }, { e: '📱', n: 'スマホ', m: 30 }, { e: '🧥', n: 'コート', m: 40 }];
    const [items, setItems] = useState([]);
    const [idx, setIdx] = useState(0);
    const [total, setTotal] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const timerRef = useRef(null);

    const init = useCallback(() => {
        setResult(null); setPlaying(true); setTime(10); setTotal(0); setIdx(0);
        setItems([...ITEMS].sort(() => Math.random() - 0.5));
        timerRef.current = setInterval(() => { setTime(t => { if (t <= 1) { clearInterval(timerRef.current); end(); return 0; } return t - 1; }); }, 1000);
    }, []);

    const offer = (val) => {
        if (!playing) return;
        const cur = items[idx];
        const ok = val <= cur.m;
        setTotal(t => t + (ok ? val : 0));
        if (idx >= 2) setTimeout(end, 500);
        else setIdx(i => i + 1);
    };

    const end = () => {
        setPlaying(false); clearInterval(timerRef.current);
        setTotal(t => {
            const win = t >= 15;
            setResult({ win, icon: win ? '💰' : '😔', main: win ? '交渉成功！' : '失敗…', sub: `合計${t}P`, pts: win ? t : 0 });
            if (win) handleGameEnd(t);
            return t;
        });
    };

    useEffect(() => { init(); return () => clearInterval(timerRef.current); }, [init]);

    const cur = items[idx];
    const offers = cur ? [Math.floor(cur.m * 0.4), Math.floor(cur.m * 0.8), Math.floor(cur.m * 1.2)].sort(() => Math.random() - 0.5) : [];

    return (
        <>
            <GameHeader title="💬 闇市交渉" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="stat-box">アイテム {idx + 1} / 3</div>
                {playing && cur && (
                    <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        <div style={{ fontSize: '3rem' }}>{cur.e}</div><div>{cur.n}</div>
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            {offers.map((o, i) => <button key={i} className="btn-prim" onClick={() => offer(o)}>{o}Pで売る</button>)}
                        </div>
                    </div>
                )}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

// ========== メインコンテナ ==========

export default function MiniGameContainer() {
    const { selectedMiniGame } = useGameStore();

    // ゲームクリア時にガチャ資産を追加しクラウド同期
    const handleGameEnd = async (earnedP) => {
        if (earnedP > 0) {
            useUserStore.getState().addGachaAssets(0, earnedP);
            await syncGachaData();
        }
    };

    const renderGame = () => {
        switch (selectedMiniGame) {
            case 'box': return <BoxGame handleGameEnd={handleGameEnd} />;
            case 'vend': return <VendGame handleGameEnd={handleGameEnd} />;
            case 'hl': return <HLGame handleGameEnd={handleGameEnd} />;
            case 'slot': return <SlotGame handleGameEnd={handleGameEnd} />;
            case 'fly': return <FlyGame handleGameEnd={handleGameEnd} />;
            case 'scratch': return <ScratchGame handleGameEnd={handleGameEnd} />;
            case 'trash': return <TrashGame handleGameEnd={handleGameEnd} />;
            case 'beg': return <BegGame handleGameEnd={handleGameEnd} />;
            case 'rain': return <RainGame handleGameEnd={handleGameEnd} />;
            case 'kashi': return <KashiGame handleGameEnd={handleGameEnd} />;
            case 'oxo': return <OxoGame handleGameEnd={handleGameEnd} />;
            case 'rat': return <RatGame handleGameEnd={handleGameEnd} />;
            case 'drunk': return <DrunkGame handleGameEnd={handleGameEnd} />;
            case 'music': return <MusicGame handleGameEnd={handleGameEnd} />;
            case 'nego': return <NegoGame handleGameEnd={handleGameEnd} />;
            default: return <div>Game Not Found</div>;
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0c0a07', overflowY: 'auto', zIndex: 1000, color: '#d4c4a0' }}>
            <style>{`
                .game-header { width:100%; display:flex; align-items:center; gap:.8rem; padding:.7rem 1rem; background:rgba(0,0,0,.6); border-bottom:1px solid #3d2e1a; position:sticky; top:0; z-index:50; }
                .back-btn { background:#2e2213; border:1px solid #3d2e1a; color:#d4c4a0; padding:.35rem .9rem; border-radius:6px; cursor:pointer; font-size:.82rem; }
                .gh-title { font-family:'Bebas Neue',sans-serif; font-size:1.3rem; color:#c97b2a; }
                .gh-cd { font-family:'Bebas Neue',sans-serif; font-size:1.5rem; color:#e8b84b; margin-left:auto; }
                .gh-cd.danger { color:#b52e1e; }
                .game-body { flex:1; display:flex; flex-direction:column; align-items:center; padding:1rem; width:100%; max-width:500px; margin:0 auto; gap:.9rem; }
                .instr { font-size:.78rem; color:#7a6a4a; text-align:center; background:rgba(0,0,0,.4); padding:.5rem .9rem; border-radius:8px; width:100%; }
                .btn-prim { background:linear-gradient(135deg,#c97b2a,#8a5010); border:none; border-radius:12px; color:#f0e8d0; font-weight:700; padding:.75rem 2.2rem; cursor:pointer; box-shadow:0 4px 20px rgba(201,123,42,.4); }
                .result-box { text-align:center; background:#241a0e; border:1px solid #5a4228; border-radius:14px; padding:.9rem 1.2rem; width:100%; }
                .r-badge.win { background:rgba(78,133,57,.3); color:#90e060; border:1px solid #4e8539; padding:.2rem .8rem; border-radius:20px; font-weight:900; }
                .r-badge.fail { background:rgba(140,35,24,.3); color:#ff8070; border:1px solid #8c2318; padding:.2rem .8rem; border-radius:20px; font-weight:900; }
                .r-win, .r-lose { font-size:1.4rem; font-weight:900; margin-top:.4rem; } .r-win { color:#e8b84b; } .r-lose { color:#b52e1e; }
                .r-sub { font-size:.95rem; color:#e8b84b; font-weight:700; margin-top:.3rem; } .r-sub-dim { font-size:.82rem; color:#7a6a4a; margin-top:.25rem; }
                
                /* Box */ .boxes-row { display:flex; gap:1rem; justify-content:center; } .box { width:100px; height:110px; background:linear-gradient(145deg,#9b7520,#5c4010); border:3px solid #7a5a18; border-radius:8px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:2.6rem; position:relative; transition:transform .1s; } .box.shake { transform:translateX(5px); } .box.win-box { background:linear-gradient(145deg,#2a5a18,#163a0a); border-color:#4a8a28; } .box.lose-box { background:linear-gradient(145deg,#5a1818,#3a0a0a); border-color:#8a2828; } .box.dim { opacity:0.4; pointer-events:none; } .box-num { position:absolute; bottom:6px; font-size:.75rem; color:rgba(255,255,255,.4); }
                /* Vend */ .vending-row { display:flex; gap:.8rem; justify-content:center; } .vending { width:110px; height:180px; border-radius:8px 8px 4px 4px; cursor:pointer; display:flex; flex-direction:column; align-items:center; padding:.5rem .4rem; border:3px solid; transition:transform .1s; } .vending.dim { opacity:0.4; } .v-screen { width:85%; height:62px; background:#080f08; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:1.9rem; margin-bottom:.35rem; } .v-btns { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; width:85%; } .v-btn-dot { height:12px; border-radius:2px; } .v-slot { width:55%; height:16px; background:#050505; border-radius:2px; margin-top:auto; display:flex; align-items:center; justify-content:center; font-size:.6rem; } .v-label { font-size:.6rem; color:rgba(255,255,255,.35); margin-top:3px; }
                /* HL */ .cards-row { display:flex; gap:1.2rem; align-items:center; justify-content:center; } .playing-card { width:118px; height:168px; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; } .playing-card.face-up { background:#f2eada; border:3px solid #c4a870; color:#1a0a0a; } .playing-card.face-down { background:#1a2a5a; border:3px solid #2a3a6a; } .card-red { color:#cc2222 !important; } .card-val { font-size:3rem; font-weight:900; } .card-suit { font-size:1.8rem; } .card-corner { position:absolute; font-size:.8rem; font-weight:900; } .card-corner.tl { top:7px; left:9px; } .card-corner.br { bottom:7px; right:9px; transform:rotate(180deg); } .hl-btns { display:flex; gap:.8rem; } .btn-high { background:#2a5a1a; padding:.7rem 1.5rem; border-radius:12px; color:#a0e080; } .btn-low { background:#5a1a1a; padding:.7rem 1.5rem; border-radius:12px; color:#e08080; }
                /* Slot */ .slot-machine { background:#2a1805; padding:1rem; border-radius:18px; width:100%; border:4px solid #5a3a12; } .reels-wrap { display:flex; gap:.5rem; justify-content:center; margin-bottom:.8rem; } .reel-window { width:84px; height:220px; overflow:hidden; position:relative; background:#060402; border:3px solid #3a2208; } .reel-inner { position:absolute; width:100%; } .reel-sym { height:80px; display:flex; align-items:center; justify-content:center; font-size:2.4rem; } .stop-btn { width:84px; background:#5a2808; color:#e0a070; padding:.45rem; border-radius:8px; cursor:pointer; } .stop-btn.stopped { background:#1a3a08; color:#90c060; } .slot-start { width:100%; background:#c97b2a; padding:.8rem; border-radius:12px; color:#fff; font-weight:bold; cursor:pointer; }
                /* Fly */ .fly-arena { width:100%; height:310px; background:#1a1208; border-radius:14px; position:relative; overflow:hidden; } .fly-start-overlay { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; } .big-fly { font-size:4rem; cursor:pointer; } .fly { position:absolute; font-size:2.1rem; cursor:pointer; user-select:none; } .fly-prog-dot { width:18px; height:18px; border-radius:50%; background:#241a0e; display:flex; align-items:center; justify-content:center; font-size:.7rem; } .fly-prog-dot.caught { background:#4e8539; } .fly-timer-box { font-size:2.5rem; color:#e8b84b; }
                /* Scratch */ .scratch-grid { display:grid; grid-template-columns:repeat(3,84px); gap:.45rem; } .scratch-cell { width:84px; height:84px; position:relative; border-radius:8px; overflow:hidden; border:2px solid #3d2e1a; display:flex; align-items:center; justify-content:center; font-size:2.1rem; }
                /* Trash */ .gc-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.65rem; width:100%; } .gc-can { height:85px; background:#2a2018; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; cursor:pointer; } .gc-can.done { opacity:0.4; pointer-events:none; } .gc-can.danger-can { background:#3a1808; border-color:#6a2010; } .gc-pop { position:absolute; top:-5px; right:-5px; font-size:.7rem; padding:2px 5px; border-radius:6px; color:#fff; } .danger-track { width:100%; height:13px; background:#2e2213; border-radius:7px; } .danger-fill { height:100%; background:linear-gradient(90deg,#4e8539,#c97b2a,#b52e1e); border-radius:7px; transition:width 0.3s; }
                /* Status Row */ .status-row { display:flex; gap:.8rem; justify-content:center; } .stat-box { background:#241a0e; border-radius:8px; padding:.35rem .9rem; text-align:center; font-size:.85rem; } .stat-label { font-size:.6rem; color:#7a6a4a; display:block; } .stat-val { font-weight:700; color:#f0e8d0; }
                /* Beg */ .beg-street { width:100%; height:120px; background:#1a1208; position:relative; border-radius:12px; overflow:hidden; } .beg-road { position:absolute; bottom:0; width:100%; height:50px; background:#242018; } .beg-zone { position:absolute; bottom:0; left:38%; width:24%; height:50px; background:rgba(232,184,75,0.2); } .beg-char { position:absolute; bottom:5px; left:50%; transform:translateX(-50%); font-size:1.7rem; } .beg-npc { position:absolute; bottom:6px; font-size:1.7rem; }
                /* Rain */ .rain-arena { width:100%; height:180px; background:#0d1a2a; position:relative; border-radius:12px; overflow:hidden; } .rain-runner { position:absolute; left:18%; font-size:1.9rem; transition:bottom 0.2s; } .obs-el { position:absolute; bottom:24px; font-size:1.7rem; } .jump-btn-big { background:#2a5a8a; color:#a0d0f0; padding:.8rem 2.5rem; border-radius:14px; font-size:1rem; font-weight:bold; cursor:pointer; } .wet-track { width:100%; height:13px; background:#2e2213; border-radius:7px; } .wet-fill { height:100%; background:#3a7aa0; border-radius:7px; transition:width 0.3s; }
                /* Kashi */ .kashi-arena { width:100%; height:280px; background:#1a1208; position:relative; border-radius:14px; overflow:hidden; } .kashi-player, .kashi-npc { position:absolute; bottom:10px; font-size:1.9rem; } .bento-el { position:absolute; font-size:1.7rem; } .kashi-btns { display:flex; gap:10px; } .kashi-mv-btn { background:#241a0e; padding:10px 30px; font-size:1.5rem; border-radius:12px; color:#fff; cursor:pointer; }
            `}</style>
            {renderGame()}
        </div>
    );
}