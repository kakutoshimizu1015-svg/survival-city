import React, { useState, useEffect, useRef, useCallback } from 'react';
import { S, GameHeader, ResultBox, BtnPrim, Instr, StatBox, useTimer, rnd, sleep, SpectatorOverlay } from './MiniGamesPart1';
import { useUserStore } from '../../store/useUserStore';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';

export const MiniGameStylesPart3 = () => (
    <style>{`
        /* Rat Game */
        .rat-arena { width:100%; height:280px; background:linear-gradient(160deg,#1a1208,#0d0a05); border:2px solid #3d2e1a; border-radius:14px; position:relative; overflow:hidden; cursor:crosshair; touch-action:none; }
        .rat-stash { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:65px; height:65px; background:rgba(201,123,42,.1); border:2px solid rgba(201,123,42,.4); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.7rem; z-index:5; pointer-events:none; }
        .rat-el { position:absolute; font-size:1.9rem; cursor:pointer; user-select:none; z-index:10; display:flex; align-items:center; justify-content:center; width:44px; height:44px; margin-left:-22px; margin-top:-22px; -webkit-tap-highlight-color: transparent; }
        .rat-fx { position:absolute; pointer-events:none; z-index:20; font-size:1.1rem; font-weight:900; animation:catchFx .5s ease-out forwards; }
        
        /* Drunk Game */
        .balance-bar-track { width:100%; height:26px; background:#2e2213; border-radius:13px; border:2px solid #5a4228; position:relative; overflow:hidden; }
        .balance-center { position:absolute; left:50%; top:0; bottom:0; width:3px; background:rgba(255,255,255,.15); transform:translateX(-50%); }
        .balance-zone { position:absolute; top:0; bottom:0; left:35%; width:30%; background:rgba(78,133,57,.2); border-left:2px solid rgba(78,133,57,.5); border-right:2px solid rgba(78,133,57,.5); }
        .balance-indicator { position:absolute; top:3px; bottom:3px; width:20px; background:#e8b84b; border-radius:10px; transform:translateX(-50%); transition:left .1s ease; }
        .drunk-char { font-size:4.5rem; text-align:center; transition: transform 0.1s ease; }
        .drunk-tap-area { display:flex; gap:.5rem; width:100%; }
        .drunk-tap { flex:1; height:75px; border-radius:12px; border:2px solid #3d2e1a; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:1.4rem; font-weight: bold; user-select:none; transition:background .1s, transform .1s; touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
        .drunk-tap:active { transform: scale(0.95); }
        .drunk-left { background:rgba(42,90,138,.12); border-color:#2a5a8a; color: #a0d0f0; }
        .drunk-right { background:rgba(138,42,42,.12); border-color:#8a2a2a; color: #f0a0a0; }

        /* Rain Game */
        .rain-arena { width:100%; height:180px; background:linear-gradient(to bottom,#0d1a2a,#101510 65%,#1a2018 65%,#181e15 100%); border:2px solid #3d2e1a; border-radius:12px; position:relative; overflow:hidden; }
        .rain-runner { position:absolute; left:18%; font-size:1.9rem; z-index:10; transition:bottom 0.1s ease-out; }
        .rain-shelter { position:absolute; bottom:0; right:8px; width:65px; height:70px; background:rgba(50,40,20,.8); border:2px solid #5a4228; border-radius:6px 6px 0 0; display:flex; align-items:center; justify-content:center; font-size:2.2rem; }
        .obs-el { position:absolute; bottom:24px; font-size:1.7rem; z-index:9; }
        .jump-btn-big { background:linear-gradient(135deg,#2a5a8a,#1a3a6a); border:2px solid #3a7ab0; border-radius:14px; color:#a0d0f0; font:700 1.2rem 'Noto Sans JP',sans-serif; padding:.8rem 2.5rem; cursor:pointer; user-select:none; box-shadow:0 4px 15px rgba(42,90,138,.4); width: 100%; touch-action:manipulation; }
        .jump-btn-big:active { transform:scale(0.96); }

        /* Kashi Game */
        .kashi-arena { width:100%; height:280px; background:linear-gradient(160deg,#1a1208,#0d0a05); border:2px solid #3d2e1a; border-radius:14px; position:relative; overflow:hidden; }
        .kashi-player { position:absolute; bottom:10px; font-size:1.9rem; z-index:10; transform:translateX(-50%); }
        .kashi-npc { position:absolute; bottom:10px; font-size:1.9rem; z-index:9; transform:translateX(-50%); }
        .bento-el { position:absolute; font-size:1.7rem; z-index:8; transform:translateX(-50%); }
        .kashi-btns { display:flex; gap:.8rem; width: 100%; }
        .kashi-mv-btn { flex: 1; background:#241a0e; border:2px solid #5a4228; border-radius:12px; color:#d4c4a0; font:700 1.6rem 'Noto Sans JP',sans-serif; padding:.7rem 1.6rem; cursor:pointer; user-select:none; touch-action: none; transition:background .1s;}
        .kashi-mv-btn:active { background:#3d2e1a; }
    `}</style>
);

/* ════════════════════════════════════════
   Game 9: 🐀 ネズミ追い払い
════════════════════════════════════════ */
export function RatGame({ pts, addPts, onBack, isEventMode }) {
    const { activeMiniGamePlayerId, mgSyncState } = useGameStore();
    const { myUserId } = useNetworkStore();
    const isSpectator = isEventMode && activeMiniGamePlayerId && activeMiniGamePlayerId !== myUserId;

    const { addGachaAssets } = useUserStore();
    const [rats, setRats] = useState([]);
    const [hitCount, setHitCount] = useState(0);
    const [stolen, setStolen] = useState(0);
    const [result, setResult] = useState(null);
    const [fxList, setFxList] = useState([]);
    const [isReady, setIsReady] = useState(false);
    
    const arenaRef = useRef(null);
    const rafRef = useRef(null);
    const playingRef = useRef(false);
    
    const ratsRef = useRef([]);
    const hitRef = useRef(0);
    const stolenRef = useRef(0);
    const idRef = useRef(0);

    const { time, start, stop } = useTimer(10, () => { 
        if (!isSpectator && playingRef.current) endRat(); 
    }, isSpectator);

    const spawnRat = useCallback(() => {
        if (isSpectator || !arenaRef.current || !playingRef.current) return;
        
        const W = arenaRef.current.offsetWidth; 
        const H = arenaRef.current.offsetHeight;
        const edge = rnd(0, 3);
        let x, y;
        
        if (edge === 0) { 
            x = rnd(20, W - 20); y = 10; 
        } else if (edge === 1) { 
            x = W - 10; y = rnd(20, H - 20); 
        } else if (edge === 2) { 
            x = rnd(20, W - 20); y = H - 10; 
        } else { 
            x = 10; y = rnd(20, H - 20); 
        }
        
        const r = { id: idRef.current++, x, y, alive: true, speed: rnd(10, 18) / 10 };
        ratsRef.current.push(r);
    }, [isSpectator]);

    const animate = useCallback(() => {
        if (isSpectator || !playingRef.current) return;
        let stolenOccurred = false;
        
        ratsRef.current.forEach(r => {
            if (!r.alive) return;
            
            const cx = (arenaRef.current?.offsetWidth || 300) / 2;
            const cy = (arenaRef.current?.offsetHeight || 280) / 2;
            
            const dx = cx - r.x;
            const dy = cy - r.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist < 25) {
                r.alive = false;
                stolenRef.current += 2;
                stolenOccurred = true;
                
                addGachaAssets(0, -2);
                
                const fid = Date.now() + Math.random();
                setFxList(prev => [...prev, { id: fid, x: cx, y: cy, t: '-2P', c: '#b52e1e' }]);
                
                setTimeout(() => setFxList(prev => prev.filter(f => f.id !== fid)), 600);
                setTimeout(() => { if (playingRef.current) spawnRat(); }, 1000);
            } else {
                r.x += (dx / dist) * r.speed;
                r.y += (dy / dist) * r.speed;
                r.flip = dx > 0;
            }
        });
        
        setRats(ratsRef.current.filter(r => r.alive).map(r => ({ ...r })));
        
        if (stolenOccurred) {
            setStolen(stolenRef.current);
        }
        
        rafRef.current = requestAnimationFrame(animate);
    }, [isSpectator, addGachaAssets, spawnRat]);

    const hitRat = (e, id) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isSpectator || !playingRef.current) return;
        
        const r = ratsRef.current.find(x => x.id === id);
        if (!r || !r.alive) return;
        
        r.alive = false;
        hitRef.current++;
        setHitCount(hitRef.current);
        
        const fid = Date.now() + Math.random();
        setFxList(prev => [...prev, { id: fid, x: r.x, y: r.y, t: '💥', c: '#e8b84b' }]);
        
        setTimeout(() => setFxList(prev => prev.filter(f => f.id !== fid)), 400);
        setTimeout(() => { if (playingRef.current) spawnRat(); }, 800);
    };

    const endRat = useCallback(() => {
        if (isSpectator) return;
        
        playingRef.current = false; 
        stop(); 
        cancelAnimationFrame(rafRef.current);
        
        const win = stolenRef.current <= 3;
        const p = win ? Math.max(0, hitRef.current * 2 - stolenRef.current) : 0;
        
        setResult({ 
            win, 
            icon: win ? '🐀' : '💀', 
            main: win ? 'ネズミ撃退成功！' : '盗まれすぎた…', 
            sub: `撃退${hitRef.current}匹 / 損失${stolenRef.current}P`, 
            pts: p 
        });
        
        if (p > 0) {
            addPts(p);
        }
    }, [isSpectator, stop, addPts]);

    const init = useCallback(() => {
        if (isSpectator) return;
        
        playingRef.current = false; 
        cancelAnimationFrame(rafRef.current);
        hitRef.current = 0; 
        stolenRef.current = 0; 
        ratsRef.current = []; 
        idRef.current = 0;
        
        setHitCount(0); 
        setStolen(0); 
        setRats([]); 
        setFxList([]); 
        setResult(null); 
        setIsReady(false);
    }, [isSpectator]);

    const startGame = () => {
        if (isSpectator) return;
        
        setIsReady(true); 
        playingRef.current = true; 
        
        for (let i = 0; i < 4; i++) {
            spawnRat();
        }
        
        start(); 
        rafRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => { 
        init(); 
        return () => { 
            playingRef.current = false; 
            cancelAnimationFrame(rafRef.current); 
        }; 
    }, [init]);

    // ▼ 同期送信
    useEffect(() => {
        if (!isSpectator) {
            useGameStore.setState({ 
                mgSyncState: { isReady, hitCount, stolen, rats, result } 
            });
        }
    }, [isReady, hitCount, stolen, rats, result, isSpectator]);

    // ▼ 同期受信
    useEffect(() => {
        if (isSpectator && mgSyncState) {
            if (mgSyncState.isReady !== undefined) setIsReady(mgSyncState.isReady);
            if (mgSyncState.hitCount !== undefined) setHitCount(mgSyncState.hitCount);
            if (mgSyncState.stolen !== undefined) setStolen(mgSyncState.stolen);
            if (mgSyncState.rats !== undefined) setRats(mgSyncState.rats);
            if (mgSyncState.result !== undefined) setResult(mgSyncState.result);
        }
    }, [isSpectator, mgSyncState]);

    return (
        <div style={{ ...S.screen, pointerEvents: isSpectator ? 'none' : 'auto' }}>
            <MiniGameStylesPart3 />
            <SpectatorOverlay isSpectator={isSpectator} />
            <GameHeader title="🐀 ネズミ追い払い" pts={pts} timer={playingRef.current ? time : null} onBack={onBack} />
            <div style={S.body}>
                {!isReady && !result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Instr>
                            <strong style={{color:'#e8b84b', fontSize:'1.1rem'}}>【ルール説明】</strong><br/><br/>
                            10秒間、中央の荷物💰に迫ってくるネズミを直接タップして撃退しろ！<br/>
                            盗まれた被害が3P以下なら成功だ！
                        </Instr>
                        <BtnPrim onClick={startGame} style={{ width: '100%' }}>ゲーム開始！</BtnPrim>
                    </div>
                ) : (
                    <>
                        <Instr>荷物💰を狙うネズミをタップ！盗まれ3P以下で成功！</Instr>
                        <div style={{ display: 'flex', gap: '.8rem', justifyContent: 'center' }}>
                            <StatBox label="🐀 撃退" val={hitCount} />
                            <StatBox label="💰 損失" val={`${stolen}P`} style={{ color: '#b52e1e' }} />
                        </div>
                        
                        <div ref={arenaRef} className="rat-arena">
                            <div className="rat-stash">💰</div>
                            {rats.map(r => (
                                <div 
                                    key={r.id} 
                                    className="rat-el" 
                                    onPointerDown={(e) => hitRat(e, r.id)}
                                    style={{ left: r.x, top: r.y, transform: r.flip ? 'scaleX(-1)' : 'scaleX(1)' }}
                                >
                                    🐀
                                </div>
                            ))}
                            {fxList.map(f => (
                                <div key={f.id} className="rat-fx" style={{ left: f.x, top: f.y, color: f.c }}>
                                    {f.t}
                                </div>
                            ))}
                        </div>
                    </>
                )}
                <ResultBox result={result} />
                {result && !isSpectator && (
                    <BtnPrim onClick={isEventMode ? onBack : init}>
                        {isEventMode ? '⬅ マップに戻る' : '🔁 もう一度'}
                    </BtnPrim>
                )}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   Game 10: 🍺 酔っ払いバランス
════════════════════════════════════════ */
export function DrunkGame({ pts, addPts, onBack, isEventMode }) {
    const { activeMiniGamePlayerId, mgSyncState } = useGameStore();
    const { myUserId } = useNetworkStore();
    const isSpectator = isEventMode && activeMiniGamePlayerId && activeMiniGamePlayerId !== myUserId;

    const [bal, setBal] = useState(50);
    const [keep, setKeep] = useState(0);
    const [result, setResult] = useState(null);
    const [isReady, setIsReady] = useState(false);
    
    const balRef = useRef(50);
    const driftRef = useRef(0);
    const keepRef = useRef(0);
    const playingRef = useRef(false);
    
    const rafRef = useRef(null);
    const keepIvRef = useRef(null);

    const { time, start, stop } = useTimer(10, () => { 
        if (!isSpectator && playingRef.current) endDrunk(true); 
    }, isSpectator);

    const endDrunk = useCallback((survived) => {
        if (isSpectator) return;
        
        playingRef.current = false; 
        stop(); 
        cancelAnimationFrame(rafRef.current); 
        clearInterval(keepIvRef.current);
        
        const win = survived && keepRef.current >= 6;
        const p = win ? Math.floor(keepRef.current * 1.5) : 0;
        
        setResult({ 
            win, 
            icon: win ? '🎉' : '🌀', 
            main: win ? 'バランスキープ成功！' : '倒れた！', 
            sub: `緑ゾーン内 ${keepRef.current}秒 / 6秒以上で成功`, 
            pts: p 
        });
        
        if (p > 0) addPts(p);
    }, [isSpectator, stop, addPts]);

    const animate = useCallback(() => {
        if (isSpectator || !playingRef.current) return;
        
        driftRef.current += (Math.random() - 0.5) * 0.06;
        driftRef.current = Math.max(-0.25, Math.min(0.25, driftRef.current)); 
        
        balRef.current += driftRef.current;
        setBal(balRef.current);
        
        if (balRef.current <= 0 || balRef.current >= 100) {
            endDrunk(false);
            return;
        }
        
        rafRef.current = requestAnimationFrame(animate);
    }, [isSpectator, endDrunk]);

    const tap = (e, d) => {
        e.preventDefault();
        
        if (isSpectator || !playingRef.current) return;
        
        balRef.current = Math.max(0, Math.min(100, balRef.current - d * 10));
        driftRef.current -= d * 0.15; 
        setBal(balRef.current);
    };

    const init = useCallback(() => {
        if (isSpectator) return;
        
        playingRef.current = false; 
        cancelAnimationFrame(rafRef.current); 
        clearInterval(keepIvRef.current);
        
        balRef.current = 50; 
        driftRef.current = 0; 
        keepRef.current = 0;
        
        setBal(50); 
        setKeep(0); 
        setResult(null); 
        setIsReady(false);
    }, [isSpectator]);

    const startGame = () => {
        if (isSpectator) return;
        
        setIsReady(true); 
        playingRef.current = true; 
        start();
        
        rafRef.current = requestAnimationFrame(animate);
        
        keepIvRef.current = setInterval(() => {
            if (playingRef.current && balRef.current >= 35 && balRef.current <= 65) {
                keepRef.current++;
                setKeep(keepRef.current);
            }
        }, 1000);
    };

    useEffect(() => { 
        init(); 
        return () => { 
            playingRef.current = false; 
            cancelAnimationFrame(rafRef.current); 
            clearInterval(keepIvRef.current); 
        }; 
    }, [init]);

    // ▼ 同期送信
    useEffect(() => {
        if (!isSpectator) {
            useGameStore.setState({ 
                mgSyncState: { isReady, bal, keep, result } 
            });
        }
    }, [isReady, bal, keep, result, isSpectator]);

    // ▼ 同期受信
    useEffect(() => {
        if (isSpectator && mgSyncState) {
            if (mgSyncState.isReady !== undefined) setIsReady(mgSyncState.isReady);
            if (mgSyncState.bal !== undefined) setBal(mgSyncState.bal);
            if (mgSyncState.keep !== undefined) setKeep(mgSyncState.keep);
            if (mgSyncState.result !== undefined) setResult(mgSyncState.result);
        }
    }, [isSpectator, mgSyncState]);

    return (
        <div style={{ ...S.screen, pointerEvents: isSpectator ? 'none' : 'auto' }}>
            <MiniGameStylesPart3 />
            <SpectatorOverlay isSpectator={isSpectator} />
            <GameHeader title="🍺 酔っ払いバランス" pts={pts} timer={playingRef.current ? time : null} onBack={onBack} />
            <div style={S.body}>
                {!isReady && !result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Instr>
                            <strong style={{color:'#e8b84b', fontSize:'1.1rem'}}>【ルール説明】</strong><br/><br/>
                            酔っ払いがフラフラと倒れそうになるぞ！<br/>
                            左に傾いたら「右タップ」、右に傾いたら「左タップ」してバランスを取れ。<br/>
                            緑のゾーン内に合計6秒以上いればクリアだ！
                        </Instr>
                        <BtnPrim onClick={startGame} style={{ width: '100%' }}>ゲーム開始！</BtnPrim>
                    </div>
                ) : (
                    <>
                        <Instr>緑ゾーンを6秒以上キープで成功！<br/>左に傾いたら右タップ、右なら左タップ！</Instr>
                        
                        <StatBox label="✅ ゾーン内" val={`${keep}秒`} style={{ color: '#4e8539', fontSize: '1.1rem' }} />
                        
                        <div className="drunk-char" style={{ transform: `rotate(${(bal - 50) / 1.5}deg)` }}>🧔</div>
                        
                        <div style={{ width: '100%' }}>
                            <div style={{ fontSize: '.75rem', color: '#7a6a4a', textAlign: 'center', marginBottom: '.3rem' }}>
                                ← 左タップ　　　右タップ →
                            </div>
                            <div className="balance-bar-track">
                                <div className="balance-center" />
                                <div className="balance-zone" />
                                <div className="balance-indicator" style={{ left: `${bal}%` }} />
                            </div>
                        </div>
                        
                        {!result && (
                            <div className="drunk-tap-area">
                                <div className="drunk-tap drunk-left" onPointerDown={(e) => tap(e, -1)}>← 左</div>
                                <div className="drunk-tap drunk-right" onPointerDown={(e) => tap(e, 1)}>右 →</div>
                            </div>
                        )}
                    </>
                )}
                <ResultBox result={result} />
                {result && !isSpectator && (
                    <BtnPrim onClick={isEventMode ? onBack : init}>
                        {isEventMode ? '⬅ マップに戻る' : '🔁 もう一度'}
                    </BtnPrim>
                )}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   Game 11: ☔ 雨宿りダッシュ
════════════════════════════════════════ */
export function RainGame({ pts, addPts, onBack, isEventMode }) {
    const { activeMiniGamePlayerId, mgSyncState } = useGameStore();
    const { myUserId } = useNetworkStore();
    const isSpectator = isEventMode && activeMiniGamePlayerId && activeMiniGamePlayerId !== myUserId;

    const OBS_LIST = [
        { e: '👮', name: '警察', danger: 28 }, 
        { e: '🐕', name: '野良犬', danger: 20 }, 
        { e: '💦', name: '水たまり', danger: 12 }, 
        { e: '🧟', name: 'おじさん', danger: 25 }
    ];

    const [wet, setWet] = useState(0);
    const [obs, setObs] = useState({ x: -100, e: null });
    const [info, setInfo] = useState('障害物を待て…');
    const [jumping, setJumping] = useState(false);
    const [result, setResult] = useState(null);
    const [isReady, setIsReady] = useState(false);
    
    const wetRef = useRef(0);
    const jumpRef = useRef(false);
    const playingRef = useRef(false);
    
    const rafRef = useRef(null);
    const wetIvRef = useRef(null);
    const arenaRef = useRef(null);
    
    const { time, start, stop } = useTimer(10, () => { 
        if (!isSpectator && playingRef.current) endRain(wetRef.current < 100); 
    }, isSpectator);

    const endRain = useCallback((win) => {
        if (isSpectator) return;
        
        playingRef.current = false; 
        stop(); 
        clearInterval(wetIvRef.current); 
        cancelAnimationFrame(rafRef.current);
        
        const p = win ? Math.max(2, Math.floor(12 * (1 - wetRef.current / 100))) : 0;
        
        setResult({ 
            win, 
            icon: win ? '🏕️' : '💧', 
            main: win ? '雨宿り成功！' : 'びしょ濡れで動けない…', 
            sub: `濡れ度 ${Math.floor(wetRef.current)}%`, 
            pts: p 
        });
        
        if (p > 0) addPts(p);
    }, [isSpectator, stop, addPts]);

    const spawnObs = useCallback(() => {
        if (isSpectator || !playingRef.current) return;
        
        const target = OBS_LIST[rnd(0, OBS_LIST.length - 1)];
        setInfo(`⚠️ ${target.name}が来る！`); 
        
        let ox = 120;
        let hit = false;
        
        const tick = () => {
            if (!playingRef.current) return;
            
            ox -= 2.5;
            setObs({ x: ox, e: target.e });
            
            if (!hit && ox < 25 && ox > 12) {
                hit = true;
                if (!jumpRef.current) {
                    wetRef.current = Math.min(100, wetRef.current + target.danger);
                    setWet(wetRef.current);
                    setInfo(`💥 ${target.name}にぶつかった！`);
                    
                    if (wetRef.current >= 100) { 
                        endRain(false); 
                        return; 
                    }
                } else {
                    setInfo('🌟 ジャンプ成功！');
                }
            }
            
            if (ox < -20) {
                setObs({ x: -100, e: null });
                setTimeout(() => { if (playingRef.current) spawnObs(); }, rnd(600, 1000));
                return;
            }
            
            rafRef.current = requestAnimationFrame(tick);
        };
        
        rafRef.current = requestAnimationFrame(tick);
    }, [isSpectator, endRain]);

    const doJump = useCallback((e) => {
        e.preventDefault();
        
        if (isSpectator || !playingRef.current || jumpRef.current) return;
        
        jumpRef.current = true; 
        setJumping(true);
        
        setTimeout(() => {
            if (playingRef.current) { 
                jumpRef.current = false; 
                setJumping(false); 
            }
        }, 500); 
    }, [isSpectator]);

    const init = useCallback(() => {
        if (isSpectator) return;
        
        playingRef.current = false; 
        cancelAnimationFrame(rafRef.current); 
        clearInterval(wetIvRef.current);
        
        jumpRef.current = false; 
        wetRef.current = 0;
        
        setWet(0); 
        setJumping(false); 
        setObs({ x: -100, e: null }); 
        setInfo('障害物を待て…'); 
        setResult(null); 
        setIsReady(false);
    }, [isSpectator]);

    const startGame = () => {
        if (isSpectator) return;
        
        setIsReady(true); 
        playingRef.current = true; 
        start();
        
        wetIvRef.current = setInterval(() => {
            if (playingRef.current) {
                wetRef.current = Math.min(100, wetRef.current + 1.5);
                setWet(wetRef.current);
                if (wetRef.current >= 100) endRain(false);
            }
        }, 400);
        
        setTimeout(spawnObs, 1500);
    };

    useEffect(() => { 
        init(); 
        return () => { 
            playingRef.current = false; 
            clearInterval(wetIvRef.current); 
            cancelAnimationFrame(rafRef.current); 
        }; 
    }, [init]);

    // ▼ 同期送信
    useEffect(() => {
        if (!isSpectator) {
            useGameStore.setState({ 
                mgSyncState: { isReady, wet, obs, info, jumping, result } 
            });
        }
    }, [isReady, wet, obs, info, jumping, result, isSpectator]);

    // ▼ 同期受信
    useEffect(() => {
        if (isSpectator && mgSyncState) {
            if (mgSyncState.isReady !== undefined) setIsReady(mgSyncState.isReady);
            if (mgSyncState.wet !== undefined) setWet(mgSyncState.wet);
            if (mgSyncState.obs !== undefined) setObs(mgSyncState.obs);
            if (mgSyncState.info !== undefined) setInfo(mgSyncState.info);
            if (mgSyncState.jumping !== undefined) setJumping(mgSyncState.jumping);
            if (mgSyncState.result !== undefined) setResult(mgSyncState.result);
        }
    }, [isSpectator, mgSyncState]);

    return (
        <div style={{ ...S.screen, pointerEvents: isSpectator ? 'none' : 'auto' }}>
            <MiniGameStylesPart3 />
            <SpectatorOverlay isSpectator={isSpectator} />
            <GameHeader title="☔ 雨宿りダッシュ" pts={pts} timer={playingRef.current ? time : null} onBack={onBack} />
            <div style={S.body}>
                {!isReady && !result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Instr>
                            <strong style={{color:'#e8b84b', fontSize:'1.1rem'}}>【ルール説明】</strong><br/><br/>
                            雨宿り先までダッシュしろ！<br/>
                            途中で障害物が向かってくるので、「JUMP！」ボタンで避けろ。<br/>
                            濡れ度が100%になる前に10秒間逃げ切ればクリアだ！
                        </Instr>
                        <BtnPrim onClick={startGame} style={{ width: '100%' }}>ゲーム開始！</BtnPrim>
                    </div>
                ) : (
                    <>
                        <Instr>障害物がきたらジャンプ！濡れ度100%で失敗！</Instr>
                        
                        <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', marginBottom: 3 }}>
                                <span style={{ color: '#6af' }}>☔ 濡れ度</span>
                                <span style={{ color: '#6af' }}>{Math.floor(wet)}%</span>
                            </div>
                            <div className="wet-track">
                                <div className="wet-fill" style={{ width: `${wet}%`, background: '#6af', height: '100%' }} />
                            </div>
                        </div>
                        
                        <div ref={arenaRef} className="rain-arena">
                            {playingRef.current && Array.from({ length: 8 }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className="rain-drop" 
                                    style={{ 
                                        left: `${rnd(0, 100)}%`, 
                                        animationDuration: `${rnd(6, 12) / 10}s`, 
                                        animationDelay: `${rnd(0, 10) / 10}s` 
                                    }} 
                                >
                                    |
                                </div>
                            ))}
                            
                            <div className={`rain-runner ${jumping ? 'runner-jump' : ''}`} style={{ bottom: jumping ? '65px' : '20px' }}>🏃</div>
                            
                            {obs.e && <div className="obs-el" style={{ left: `${obs.x}%` }}>{obs.e}</div>}
                            
                            <div className="rain-shelter">🏕️</div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', alignItems: 'center', width: '100%' }}>
                            <div style={{ fontSize: '.82rem', color: '#7a6a4a' }}>{info}</div>
                            {!result && <button onPointerDown={doJump} className="jump-btn-big">⬆️ JUMP！</button>}
                        </div>
                    </>
                )}
                <ResultBox result={result} />
                {result && !isSpectator && (
                    <BtnPrim onClick={isEventMode ? onBack : init}>
                        {isEventMode ? '⬅ マップに戻る' : '🔁 もう一度'}
                    </BtnPrim>
                )}
            </div>
        </div>
    );
}

/* ════════════════════════════════════════
   Game 12: 🍱 炊き出し争奪戦
════════════════════════════════════════ */
export function KashiGame({ pts, addPts, onBack, isEventMode }) {
    const { activeMiniGamePlayerId, mgSyncState } = useGameStore();
    const { myUserId } = useNetworkStore();
    const isSpectator = isEventMode && activeMiniGamePlayerId && activeMiniGamePlayerId !== myUserId;

    const [score, setScore] = useState(0);
    const [rival, setRival] = useState(0);
    const [playerX, setPlayerX] = useState(40);
    const [rivalX, setRivalX] = useState(68);
    const [bentos, setBentos] = useState([]);
    const [result, setResult] = useState(null);
    const [isReady, setIsReady] = useState(false);
    
    const pxRef = useRef(40);
    const rxRef = useRef(68);
    const scoreRef = useRef(0);
    const rivalRef = useRef(0);
    const bentosRef = useRef([]);
    const moveDirRef = useRef(0);
    const playingRef = useRef(false);
    
    const rafRef = useRef(null);
    const bentoIvRef = useRef(null);
    const idRef = useRef(0);

    const { time, start, stop } = useTimer(10, () => { 
        if (!isSpectator && playingRef.current) endKashi(); 
    }, isSpectator);

    const endKashi = useCallback(() => {
        if (isSpectator) return;
        
        playingRef.current = false; 
        stop(); 
        clearInterval(bentoIvRef.current); 
        cancelAnimationFrame(rafRef.current);
        
        const win = scoreRef.current >= 3; 
        const p = win ? scoreRef.current * 3 : 0;
        
        setResult({ 
            win, 
            icon: win ? '🍱' : '😢', 
            main: win ? '弁当3個ゲット！' : '3個に届かなかった…', 
            sub: `あなた${scoreRef.current}個 / ライバル${rivalRef.current}個`, 
            pts: p 
        });
        
        if (p > 0) addPts(p);
        setBentos([]);
    }, [isSpectator, stop, addPts]);

    const spawnBento = useCallback(() => {
        if (isSpectator || !playingRef.current) return;
        bentosRef.current.push({ id: idRef.current++, x: rnd(15, 85), y: -10, hit: false });
    }, [isSpectator]);

    const animate = useCallback(() => {
        if (isSpectator || !playingRef.current) return;
        
        if (moveDirRef.current !== 0) {
            pxRef.current = Math.max(5, Math.min(95, pxRef.current + moveDirRef.current * 1.5));
            setPlayerX(pxRef.current);
        }
        
        for (let i = bentosRef.current.length - 1; i >= 0; i--) {
            const b = bentosRef.current[i];
            b.y += 1.8; 
            
            if (b.y > 90) {
                bentosRef.current.splice(i, 1);
                continue;
            }
            if (b.y > 75 && !b.hit) {
                if (Math.abs(b.x - pxRef.current) < 8) {
                    scoreRef.current++; 
                    setScore(scoreRef.current);
                    b.hit = true; 
                    bentosRef.current.splice(i, 1);
                } else if (Math.abs(b.x - rxRef.current) < 8) {
                    rivalRef.current++; 
                    setRival(rivalRef.current);
                    b.hit = true; 
                    bentosRef.current.splice(i, 1);
                }
            }
        }
        
        if (bentosRef.current.length > 0) {
            const target = [...bentosRef.current].sort((a, b) => b.y - a.y)[0];
            if (target) {
                rxRef.current += (target.x > rxRef.current ? 1.2 : -1.2);
                rxRef.current = Math.max(5, Math.min(95, rxRef.current));
                setRivalX(rxRef.current);
            }
        }
        
        setBentos([...bentosRef.current]);
        rafRef.current = requestAnimationFrame(animate);
    }, [isSpectator]);

    const handlePointerDown = (e, dir) => { 
        e.preventDefault(); 
        if (!isSpectator) moveDirRef.current = dir; 
    };
    
    const handlePointerUp = (e) => { 
        e.preventDefault(); 
        if (!isSpectator) moveDirRef.current = 0; 
    };

    const init = useCallback(() => {
        if (isSpectator) return;
        
        playingRef.current = false; 
        cancelAnimationFrame(rafRef.current); 
        clearInterval(bentoIvRef.current);
        
        moveDirRef.current = 0; 
        pxRef.current = 40; 
        rxRef.current = 68; 
        scoreRef.current = 0; 
        rivalRef.current = 0;
        bentosRef.current = []; 
        idRef.current = 0;
        
        setScore(0); 
        setRival(0); 
        setPlayerX(40); 
        setRivalX(68); 
        setBentos([]); 
        setResult(null); 
        setIsReady(false);
    }, [isSpectator]);

    const startGame = () => {
        if (isSpectator) return;
        
        setIsReady(true); 
        playingRef.current = true; 
        start();
        
        bentoIvRef.current = setInterval(spawnBento, 1000);
        rafRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => { 
        init(); 
        return () => { 
            playingRef.current = false; 
            clearInterval(bentoIvRef.current); 
            cancelAnimationFrame(rafRef.current); 
        }; 
    }, [init]);

    // ▼ 同期送信
    useEffect(() => {
        if (!isSpectator) {
            useGameStore.setState({ 
                mgSyncState: { isReady, score, rival, playerX, rivalX, bentos, result } 
            });
        }
    }, [isReady, score, rival, playerX, rivalX, bentos, result, isSpectator]);

    // ▼ 同期受信
    useEffect(() => {
        if (isSpectator && mgSyncState) {
            if (mgSyncState.isReady !== undefined) setIsReady(mgSyncState.isReady);
            if (mgSyncState.score !== undefined) setScore(mgSyncState.score);
            if (mgSyncState.rival !== undefined) setRival(mgSyncState.rival);
            if (mgSyncState.playerX !== undefined) setPlayerX(mgSyncState.playerX);
            if (mgSyncState.rivalX !== undefined) setRivalX(mgSyncState.rivalX);
            if (mgSyncState.bentos !== undefined) setBentos(mgSyncState.bentos);
            if (mgSyncState.result !== undefined) setResult(mgSyncState.result);
        }
    }, [isSpectator, mgSyncState]);

    return (
        <div style={{ ...S.screen, pointerEvents: isSpectator ? 'none' : 'auto' }}>
            <MiniGameStylesPart3 />
            <SpectatorOverlay isSpectator={isSpectator} />
            <GameHeader title="🍱 炊き出し争奪戦" pts={pts} timer={playingRef.current ? time : null} onBack={onBack} />
            <div style={S.body}>
                {!isReady && !result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Instr>
                            <strong style={{color:'#e8b84b', fontSize:'1.1rem'}}>【ルール説明】</strong><br/><br/>
                            上から落ちてくる弁当をライバルより先にキャッチしろ！<br/>
                            ◀▶ボタンを押し続けて移動だ。<br/>
                            10秒以内に3個キャッチできればクリア！
                        </Instr>
                        <BtnPrim onClick={startGame} style={{ width: '100%' }}>ゲーム開始！</BtnPrim>
                    </div>
                ) : (
                    <>
                        <Instr>◀▶を押し続けて移動し弁当をキャッチ！3個で成功！</Instr>
                        
                        <div style={{ display: 'flex', gap: '.8rem', justifyContent: 'center' }}>
                            <StatBox label="🍱 あなた" val={score} style={{ color: '#e8b84b', fontSize: '1.2rem' }} />
                            <StatBox label="🧟 ライバル" val={rival} />
                        </div>
                        
                        <div className="kashi-arena">
                            <div className="kashi-player" style={{ left: `${playerX}%` }}>🧍</div>
                            <div className="kashi-npc" style={{ left: `${rivalX}%` }}>🧟</div>
                            {bentos.map(b => (
                                <div key={b.id} className="bento-el" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
                                    🍱
                                </div>
                            ))}
                        </div>
                        
                        {!result && (
                            <div className="kashi-btns">
                                <button 
                                    className="kashi-mv-btn" 
                                    onPointerDown={(e) => handlePointerDown(e, -1)} 
                                    onPointerUp={handlePointerUp} 
                                    onPointerLeave={handlePointerUp}
                                >
                                    ◀ 左
                                </button>
                                <button 
                                    className="kashi-mv-btn" 
                                    onPointerDown={(e) => handlePointerDown(e, 1)} 
                                    onPointerUp={handlePointerUp} 
                                    onPointerLeave={handlePointerUp}
                                >
                                    右 ▶
                                </button>
                            </div>
                        )}
                    </>
                )}
                <ResultBox result={result} />
                {result && !isSpectator && (
                    <BtnPrim onClick={isEventMode ? onBack : init}>
                        {isEventMode ? '⬅ マップに戻る' : '🔁 もう一度'}
                    </BtnPrim>
                )}
            </div>
        </div>
    );
}