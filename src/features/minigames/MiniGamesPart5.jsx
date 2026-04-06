import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameHeader, ResultBox } from './MiniGamesPart1';

// ========== 共通ユーティリティ ==========
const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

// ========== Part 5 専用スタイル ==========
export const MiniGameStylesPart5 = () => (
    <style>{`
        /* Trash Game */
        .danger-wrap { width:100%; }
        .danger-track { width:100%; height:13px; background:var(--card3); border-radius:7px; overflow:hidden; border:1px solid var(--border); }
        .danger-fill { height:100%; background:linear-gradient(90deg,var(--green2),var(--amber),var(--red2)); border-radius:7px; transition:width .3s ease; }
        .gc-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.65rem; width:100%; }
        .gc-can { height:85px; background:linear-gradient(145deg,#2a2018,#1a1510); border:2px solid #3d2e18; border-radius:10px; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:2.1rem; transition:transform .18s cubic-bezier(.34,1.56,.64,1); user-select:none; position:relative; }
        .gc-can:active { transform:scale(.95); }
        .gc-can.done { opacity:.4; cursor:default; pointer-events:none; }
        .gc-can.danger-can { background:linear-gradient(145deg,#3a1808,#200a05); border-color:#6a2010; }
        .gc-can-label { font-size:.58rem; color:var(--dim); margin-top:2px; }
        .gc-pop { position:absolute; top:-5px; right:-5px; font-size:.7rem; font-weight:900; padding:2px 5px; border-radius:6px; color:#fff; animation:popIn .3s ease; z-index: 10; }
        
        /* Beg Game */
        .beg-street { width:100%; height:120px; background:linear-gradient(to bottom,#1a1208,#0d0a05 60%,#222018 60%,#1a1810 100%); border:2px solid var(--border); border-radius:12px; position:relative; overflow:hidden; }
        .beg-road { position:absolute; bottom:0; left:0; right:0; height:50px; background:linear-gradient(to bottom,#242018,#1a1810); border-top:2px dashed #3a3028; }
        .beg-zone { position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:85px; height:50px; background:rgba(232,184,75,.08); border-left:2px dashed rgba(232,184,75,.5); border-right:2px dashed rgba(232,184,75,.5); }
        .beg-zone::before { content:'⭐'; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:.85rem; opacity:.6; }
        .beg-char { position:absolute; bottom:5px; left:50%; transform:translateX(-50%); font-size:1.7rem; z-index:5; }
        .beg-npc { position:absolute; bottom:6px; font-size:1.7rem; z-index:4; white-space:nowrap; }
        .beg-feedback { height:1.4rem; text-align:center; font-weight:700; font-size:.9rem; }

        /* Nego Game */
        .nego-item-box { background:var(--card2); border:2px solid var(--border2); border-radius:14px; padding:.9rem; text-align:center; width:100%; }
        .nego-item-emoji { font-size:3rem; }
        .nego-item-name { font-size:.95rem; font-weight:700; color:var(--white); margin-top:.25rem; }
        .nego-item-desc { font-size:.72rem; color:var(--dim); margin-top:.15rem; }
        .nego-npc-say { background:rgba(0,0,0,.4); border-left:3px solid var(--amber); border-radius:0 8px 8px 0; padding:.45rem .75rem; font-size:.82rem; color:var(--text); width:100%; display: flex; align-items: center;}
        .nego-offers { display:flex; gap:.5rem; flex-wrap:wrap; justify-content:center; }
        .nego-offer-btn { background:var(--card2); border:2px solid var(--border); border-radius:10px; color:var(--white); font:700 .9rem 'Noto Sans JP',sans-serif; padding:.65rem 1rem; cursor:pointer; transition:border-color .12s,transform .1s; flex: 1; }
        .nego-offer-btn:active { transform:scale(0.95); }
        .nego-history { font-size:.75rem; color:var(--dim); text-align:center; line-height:1.7; }
    `}</style>
);

// ========== 13. 🗑️ ゴミ箱あさり ==========

export function TrashGame({ handleGameEnd }) {
    const TRASH_DATA = [
        { label: '🗑️', name: '普通のゴミ箱', d: 15, type: 'normal', res: [{ e: '🥫', t: 'c', w: 3 }, { e: '🍔', t: 'f', w: 2 }, { e: '💀', t: 'e', w: 0 }] },
        { label: '🗑️', name: 'ゴミ箱2', d: 12, type: 'normal', res: [{ e: '🥫', t: 'c', w: 3 }, { e: '🪙', t: 'm', w: 1 }, { e: '🐀', t: 'e', w: 0 }] },
        { label: '🗑️', name: '捨て場', d: 8, type: 'normal', res: [{ e: '💰', t: 'm', w: 5 }, { e: '🍜', t: 'f', w: 2 }, { e: '💀', t: 'e', w: 0 }] },
        { label: '⚠️🗑️', name: '危険なゴミ箱！', d: 80, type: 'danger', res: [{ e: '🚔', t: 'p', w: 0 }] },
        { label: '🚫🗑️', name: '立入禁止ゴミ箱！', d: 100, type: 'danger', res: [{ e: '🚔', t: 'p', w: 0 }] }
    ];

    const [cans, setCans] = useState([]);
    const [stats, setStats] = useState({ c: 0, f: 0, m: 0, danger: 0 });
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const timerRef = useRef(null);

    const init = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setResult(null); setPlaying(true); setTime(10); setStats({ c: 0, f: 0, m: 0, danger: 0 });
        
        const shuffled = [...TRASH_DATA].sort(() => Math.random() - 0.5).slice(0, 5);
        setCans(shuffled.map((c, i) => ({ id: i, ...c, done: false, pop: null })));
        
        timerRef.current = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
    }, []);

    const end = useCallback((reason, st = stats) => {
        setPlaying(false); clearInterval(timerRef.current);
        const p = st.c * 2 + st.f * 3 + st.m * 4;
        
        if (reason === 'police') { 
            setResult({ win: false, icon: '🚔', main: '警察に捕まった！', sub: '全て没収…', pts: 0 }); 
        } else { 
            const w = p > 0; 
            setResult({ win: w, icon: w ? '🗑️' : '💀', main: w ? '収穫完了！' : '何も見つからなかった…', sub: `缶×${st.c} 食料×${st.f} 金×${st.m}`, pts: p }); 
            if (w) handleGameEnd(p); 
        }
    }, [stats, handleGameEnd]);

    useEffect(() => { init(); return () => clearInterval(timerRef.current); }, [init]);
    useEffect(() => { if (time === 0 && playing) end('time'); }, [time, playing, end]);

    const searchCan = (idx) => {
        if (!playing || cans[idx].done) return;
        const c = cans[idx];
        const res = c.res[rnd(0, c.res.length - 1)];
        
        setCans(prev => prev.map((x, i) => i === idx ? { ...x, done: true, pop: res.e } : x));
        
        setStats(prev => {
            const nextDanger = Math.min(100, prev.danger + c.d);
            let n = { ...prev, danger: nextDanger };
            
            if (res.t === 'c') n.c++; 
            else if (res.t === 'f') n.f++; 
            else if (res.t === 'm') n.m += res.w || 2;
            
            if (res.t === 'p' || n.danger >= 100) {
                setTimeout(() => end('police', n), 500);
            } else if (cans.filter(x => x.done).length >= 4) { // 今回で5個目(全部完了)
                setTimeout(() => end('all', n), 500);
            }
            return n;
        });
    };

    return (
        <>
            <MiniGameStylesPart5 />
            <GameHeader title="🗑️ ゴミ箱あさり" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="instr">⚠️マークのゴミ箱は即タイホ！<br/>普通のゴミ箱から缶・食料・金を漁れ！</div>
                
                <div className="status-row" style={{ width: '100%' }}>
                    <div className="stat-box" style={{ flex: 1 }}><span className="stat-label">🥫 缶</span><span className="stat-val">{stats.c}</span></div>
                    <div className="stat-box" style={{ flex: 1 }}><span className="stat-label">🍔 食料</span><span className="stat-val">{stats.f}</span></div>
                    <div className="stat-box" style={{ flex: 1 }}><span className="stat-label">💰 金</span><span className="stat-val">{stats.m}</span></div>
                </div>
                
                <div className="danger-wrap">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: '3px' }}>
                        <span style={{ color: 'var(--dim)' }}>⚠️ 危険度</span>
                        <span style={{ color: 'var(--red2)' }}>{stats.danger}%</span>
                    </div>
                    <div className="danger-track">
                        <div className="danger-fill" style={{ width: `${stats.danger}%` }}></div>
                    </div>
                </div>
                
                <div className="gc-grid">
                    {cans.map((c, i) => (
                        <div key={i} className={`gc-can ${c.type === 'danger' ? 'danger-can' : ''} ${c.done ? 'done' : ''}`} onClick={() => searchCan(i)}>
                            <span style={{ fontSize: '1.4rem' }}>{c.label}</span>
                            <span className="gc-can-label">{c.name}</span>
                            {c.pop && <div className="gc-pop" style={{ background: c.type === 'danger' ? '#8a2020' : '#3a5020' }}>{c.pop}</div>}
                        </div>
                    ))}
                </div>
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

// ========== 14. 🙏 物乞いゲーム ==========

export function BegGame({ handleGameEnd }) {
    const NPCS = [
        { e: '🤵', name: 'サラリーマン', p: 5 }, { e: '👩', name: '主婦', p: 0 }, 
        { e: '🧑‍🎓', name: '学生', p: 2 }, { e: '🕴️', name: 'ヤクザ', p: -3 }, 
        { e: '👮', name: '警察官', p: -5 }, { e: '👴', name: 'おじいさん', p: 4 }, 
        { e: '💼', name: '社長', p: 10 }
    ];
    const BEG_REACT = { 
        5: '「しょうがないな」💰', 0: '無視された…', 2: '「少しだけ」🪙', 
        '-3': '「うっとうしい！」👊', '-5': '「不法行為だ！」🚔', 4: '「元気出せ」🪙', 10: '「頑張れよ」💰💰' 
    };

    const [earned, setEarned] = useState(0);
    const [count, setCount] = useState(6);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const [npcX, setNpcX] = useState(112);
    const [curNpc, setCurNpc] = useState(null);
    const [feedback, setFeedback] = useState({ text: '', color: 'var(--dim)' });
    
    const timerRef = useRef(null);
    const rafRef = useRef(null);
    const playingRef = useRef(false);

    const init = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setResult(null); setPlaying(true); playingRef.current = true; 
        setTime(10); setEarned(0); setCount(6); setFeedback({ text: '', color: 'var(--dim)' });
        
        timerRef.current = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
        spawnNpc();
    }, []);

    const spawnNpc = () => {
        if (!playingRef.current) return;
        setCurNpc(NPCS[rnd(0, NPCS.length - 1)]);
        setNpcX(112);
        
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const spd = rnd(12, 22) / 10;
        
        const tick = () => {
            if (!playingRef.current) return;
            setNpcX(x => {
                const nextX = x - spd;
                if (nextX < -18) {
                    setCount(c => c - 1);
                    setFeedback({ text: '逃した…', color: 'var(--dim)' });
                    setTimeout(spawnNpc, 600);
                    return -18;
                }
                return nextX;
            });
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    };

    const beg = () => {
        if (!playing || npcX < -18 || npcX > 112) return;
        if (rafRef.current) cancelAnimationFrame(rafRef.current); 
        
        // 当たり判定 (中央38%〜62%)
        const inZone = npcX >= 38 && npcX <= 62;
        const npc = curNpc;
        const gain = npc.p;
        
        if (inZone) {
            setEarned(e => Math.max(0, e + gain));
            setFeedback({ 
                text: `${npc.name}—${BEG_REACT[gain]||''} ${gain > 0 ? '+'+gain+'P' : gain < 0 ? gain+'P' : ''}`, 
                color: gain > 0 ? 'var(--gold)' : gain < 0 ? 'var(--red2)' : 'var(--dim)' 
            });
        } else {
            setFeedback({ text: 'タイミングが悪い…無視', color: 'var(--dim)' });
        }
        
        setNpcX(-50); // 画面外へ消す
        setCount(c => {
            const nextC = c - 1;
            if (nextC > 0) setTimeout(spawnNpc, 1100); 
            else setTimeout(end, 700);
            return nextC;
        });
    };

    const end = useCallback(() => {
        setPlaying(false); playingRef.current = false;
        if (timerRef.current) clearInterval(timerRef.current); 
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        
        setEarned(e => {
            const win = e >= 5;
            setResult({ win, icon: win ? '💰' : '😔', main: win ? '物乞い成功！' : '稼ぎが足りなかった…', sub: `獲得 ${e}P / 5P以上で成功`, pts: win ? e : 0 });
            if (win) handleGameEnd(e);
            return e;
        });
    }, [handleGameEnd]);

    useEffect(() => { init(); return () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); playingRef.current = false; }; }, [init]);
    useEffect(() => { if (time === 0 && playing) end(); }, [time, playing, end]);

    return (
        <>
            <MiniGameStylesPart5 />
            <GameHeader title="🙏 物乞い" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="instr">⭐ゾーンにNPCがいるとき押せ！<br/>5P以上稼げば成功！</div>
                
                <div className="status-row" style={{ width: '100%' }}>
                    <div className="stat-box" style={{ flex: 1 }}><span className="stat-label">残りNPC</span><span className="stat-val">{count}</span></div>
                    <div className="stat-box" style={{ flex: 1 }}><span className="stat-label">💰 獲得</span><span className="stat-val" style={{ color: 'var(--gold)' }}>{earned}P</span></div>
                </div>
                
                <div className="beg-street">
                    <div className="beg-road"></div>
                    <div className="beg-zone"></div>
                    <div className="beg-char">🧎</div>
                    {npcX > -18 && <div className="beg-npc" style={{ left: `${npcX}%` }}>{curNpc?.e}</div>}
                </div>
                
                <div className="beg-feedback" style={{ color: feedback.color }}>{feedback.text}</div>
                {!result && <button className="btn-prim" onClick={beg} style={{ width: '100%' }}>🙏 お恵みを…</button>}
                {result && <ResultBox {...result} onRetry={init} />}
            </div>
        </>
    );
}

// ========== 15. 💬 闇市交渉ゲーム ==========

export function NegoGame({ handleGameEnd }) {
    const NEGO_ITEMS = [
        { e: '🥫', name: '缶詰セット×5', desc: '拾い集めた缶詰', max: 20 }, 
        { e: '🔧', name: '謎の工具', desc: '使えるかわからない工具', max: 15 }, 
        { e: '📱', name: '拾ったスマホ', desc: '画面割れ・充電切れ', max: 30 }, 
        { e: '🧥', name: 'ブランドコート', desc: '少し汚れているが本物', max: 40 }, 
        { e: '📦', name: '段ボール特大', desc: '高品質な大きい箱', max: 8 }, 
        { e: '🪙', name: '古銭コレクション', desc: '価値不明の古いコイン', max: 25 }
    ];
    const NEGO_NPCS = ['🧔', '🧑‍🦱', '👩‍🦳', '🧑‍🦲'];

    const [items, setItems] = useState([]);
    const [idx, setIdx] = useState(0);
    const [total, setTotal] = useState(0);
    const [time, setTime] = useState(10);
    const [playing, setPlaying] = useState(false);
    const [result, setResult] = useState(null);
    const [history, setHistory] = useState([]);
    const [npcSay, setNpcSay] = useState('交渉相手を呼んでいる…');
    const [npcEmoji, setNpcEmoji] = useState('👤');
    
    const timerRef = useRef(null);

    const init = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setResult(null); setPlaying(true); setTime(10); setTotal(0); setIdx(0); setHistory([]);
        
        const selectedItems = [...NEGO_ITEMS].sort(() => Math.random() - 0.5).slice(0, 3);
        setItems(selectedItems);
        
        const firstNpc = NEGO_NPCS[rnd(0, NEGO_NPCS.length - 1)];
        setNpcEmoji(firstNpc);
        setNpcSay(`「${selectedItems[0].name}？…で、いくらで売る？」`);
        
        timerRef.current = setInterval(() => setTime(t => Math.max(0, t - 1)), 1000);
    }, []);

    const end = useCallback(() => {
        setPlaying(false); clearInterval(timerRef.current);
        setTotal(t => {
            const win = t >= 15;
            setResult({ 
                win, icon: win ? '💰' : '😔', main: win ? `合計${t}P 交渉成功！` : `合計${t}P 稼ぎが足りなかった`, 
                sub: `15P以上で成功。`, pts: win ? t : 0 
            });
            if (win) handleGameEnd(t);
            return t;
        });
    }, [handleGameEnd]);

    useEffect(() => { init(); return () => clearInterval(timerRef.current); }, [init]);
    useEffect(() => { if (time === 0 && playing) end(); }, [time, playing, end]);

    const offer = async (val) => {
        if (!playing) return;
        const cur = items[idx];
        const accepted = val <= cur.max;
        const gain = accepted ? val : 0;
        
        setTotal(t => t + gain);
        setNpcSay(accepted ? `「${val}P か…わかった！」✅ 成立！` : `「${val}P！？高すぎる！」❌ 交渉決裂`);
        setHistory(prev => [...prev, `${cur.e}→${gain > 0 ? '+' + gain : '✗'}P`]);
        
        if (idx >= 2) {
            setTimeout(end, 1000);
        } else {
            const nextIdx = idx + 1;
            setIdx(nextIdx);
            setTimeout(() => {
                if (playing) {
                    const nextNpc = NEGO_NPCS[rnd(0, NEGO_NPCS.length - 1)];
                    setNpcEmoji(nextNpc);
                    setNpcSay(`「${items[nextIdx].name}？…で、いくらで売る？」`);
                }
            }, 1200);
        }
    };

    const curItem = items[idx];
    let offers = [];
    if (curItem) {
        const mid = Math.floor(curItem.max * 0.6);
        offers = [Math.floor(curItem.max * 0.35), mid, Math.floor(curItem.max * 1.3)].sort(() => Math.random() - 0.5);
    }

    return (
        <>
            <MiniGameStylesPart5 />
            <GameHeader title="💬 闇市交渉" time={time} isTimerDanger={time <= 3} />
            <div className="game-body">
                <div className="instr">アイテムを最高値で売れ！相手の上限を超えると失敗！<br/>3アイテムで15P以上稼げば成功！</div>
                
                <div className="stat-box" style={{ width: '100%' }}>
                    <span className="stat-label">アイテム</span>
                    <span className="stat-val">{Math.min(3, idx + 1)} / 3</span>
                </div>
                
                {playing && curItem && (
                    <>
                        <div className="nego-item-box">
                            <div className="nego-item-emoji">{curItem.e}</div>
                            <div className="nego-item-name">{curItem.name}</div>
                            <div className="nego-item-desc">{curItem.desc}</div>
                        </div>
                        
                        <div className="nego-npc-say">
                            <span style={{ fontSize: '1.5rem', marginRight: '.8rem' }}>{npcEmoji}</span>
                            <span>{npcSay}</span>
                        </div>
                        
                        <div className="nego-history">{history.join(' | ')}</div>
                        
                        <div className="nego-offers" style={{ width: '100%' }}>
                            {offers.map((o, i) => (
                                <button key={i} className="nego-offer-btn" onClick={() => offer(o)}>
                                    {o}P
                                </button>
                            ))}
                        </div>
                    </>
                )}
                {result && (
                    <>
                        <div className="nego-history" style={{ marginBottom: '10px' }}>{history.join(' | ')}</div>
                        <ResultBox {...result} onRetry={init} />
                    </>
                )}
            </div>
        </>
    );
}