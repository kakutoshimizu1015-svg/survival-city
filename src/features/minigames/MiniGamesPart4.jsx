import React, { useState, useEffect, useRef, useCallback } from 'react';
import { S, GameHeader, ResultBox, BtnPrim, Instr, StatBox, useTimer, rnd, sleep, beep, SpectatorOverlay } from './MiniGamesPart1';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';

/* ─── Part 4 専用スタイル ─────────────────────────────── */
export const MiniGameStylesPart4 = () => (
    <style>{`
        /* Beg Game */
        .beg-street { 
            width: 100%; height: 120px; 
            background: linear-gradient(to bottom,#1a1208,#0d0a05 60%,#222018 60%,#1a1810 100%); 
            border: 2px solid #3d2e1a; border-radius: 12px; position: relative; overflow: hidden; 
        }
        .beg-road { 
            position: absolute; bottom: 0; left: 0; right: 0; height: 50px; 
            background: linear-gradient(to bottom,#242018,#1a1810); 
            border-top: 2px dashed #3a3028; 
        }
        .beg-zone { 
            position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); 
            width: 85px; height: 50px; background: rgba(232,184,75,.15); 
            border-left: 2px dashed rgba(232,184,75,.8); border-right: 2px dashed rgba(232,184,75,.8); 
        }
        .beg-zone::before { 
            content: '⭐'; position: absolute; top: 50%; left: 50%; 
            transform: translate(-50%,-50%); font-size: 1rem; opacity: .8; 
        }
        .beg-char { 
            position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); 
            font-size: 1.7rem; z-index: 5; 
        }
        .beg-npc { 
            position: absolute; bottom: 6px; font-size: 1.7rem; 
            z-index: 4; white-space: nowrap; 
        }
        .beg-feedback { 
            height: 1.4rem; text-align: center; font-weight: 700; font-size: .9rem; 
        }

        /* Music Game */
        .music-arena { 
            width: 100%; height: 300px; 
            background: linear-gradient(to bottom,#080608,#180e08); 
            border: 2px solid #3d2e1a; border-radius: 14px; position: relative; overflow: hidden; 
        }
        .music-lane-line { 
            position: absolute; top: 0; bottom: 60px; width: 2px; background: rgba(255,255,255,.1); 
        }
        .music-hit-line { 
            position: absolute; left: 0; right: 0; bottom: 60px; height: 4px; 
            background: #e8b84b; box-shadow: 0 0 8px rgba(232,184,75,0.8); z-index: 5; 
        }
        .music-note { 
            position: absolute; height: 38px; border-radius: 8px; border: 3px solid; 
            display: flex; align-items: center; justify-content: center; 
            font-size: 1.2rem; font-weight: 700; z-index: 10; transform: translateX(-50%); 
            text-shadow: 0 1px 2px #000; box-shadow: 0 2px 5px rgba(0,0,0,0.5); 
        }
        .music-btns { 
            position: absolute; bottom: 0; left: 0; right: 0; height: 58px; 
            display: flex; gap: 4px; padding: 4px; z-index: 15; 
        }
        .music-btn { 
            flex: 1; border-radius: 8px; border: 2px solid; cursor: pointer; 
            font-size: 1.5rem; user-select: none; touch-action: manipulation; 
            background: rgba(255,255,255,0.1); transition: transform 0.1s, filter 0.1s; 
            -webkit-tap-highlight-color: transparent;
        }
        .music-btn:active { 
            transform: scale(.92); filter: brightness(1.5); 
        }
        .music-judge { 
            position: absolute; top: 40%; left: 0; right: 0; text-align: center; 
            font-size: 1.8rem; font-weight: 900; pointer-events: none; opacity: 0; 
            transition: opacity .1s; text-shadow: 0 2px 4px #000; z-index: 20;
        }
        .music-judge.show { 
            opacity: 1; transform: scale(1.1); transition: all 0.1s; 
        }

        /* Nego Game */
        .nego-item-box { 
            background: #241a0e; border: 2px solid #5a4228; border-radius: 14px; 
            padding: .9rem; text-align: center; width: 100%; 
        }
        .nego-npc-say { 
            background: rgba(0,0,0,.4); border-left: 4px solid #c97b2a; 
            border-radius: 0 8px 8px 0; padding: .6rem .8rem; font-size: .9rem; 
            color: #d4c4a0; width: 100%; display: flex; align-items: center; gap: 0.8rem;
        }
        .nego-offer-btn { 
            background: #241a0e; border: 2px solid #3d2e1a; border-radius: 10px; 
            color: #f0e8d0; font: 700 .9rem 'Noto Sans JP',sans-serif; padding: .7rem 1rem; 
            cursor: pointer; transition: border-color .1s,transform .1s; flex: 1; touch-action: manipulation;
        }
        .nego-offer-btn:active { 
            transform: scale(0.95); border-color: #c97b2a; 
        }
    `}</style>
);

/* ════════════════════════════════════════
   Game 13: 🙏 物乞いゲーム
════════════════════════════════════════ */
export function BegGame({ pts, addPts, subPts, onBack, isEventMode }) {
    const { activeMiniGamePlayerId, mgSyncState } = useGameStore();
    const { myUserId } = useNetworkStore();
    const isSpectator = isEventMode && activeMiniGamePlayerId && activeMiniGamePlayerId !== myUserId;

    const NPCS = [
        { e: '🤵', name: 'サラリーマン', p: 5 }, 
        { e: '👩', name: '主婦', p: 0 }, 
        { e: '🧑‍🎓', name: '学生', p: 2 }, 
        { e: '🕴️', name: 'ヤクザ', p: -3 }, 
        { e: '👮', name: '警察官', p: -5 }, 
        { e: '👴', name: 'おじいさん', p: 4 }, 
        { e: '💼', name: '社長', p: 10 }
    ];
    
    const BEG_REACT = { 
        5: '「しょうがないな」💰', 
        0: '無視された…', 
        2: '「少しだけ」🪙', 
        '-3': '「うっとうしい！」👊', 
        '-5': '「不法行為だ！」🚔', 
        4: '「元気出せ」🪙', 
        10: '「頑張れよ」💰💰' 
    };

    const [earned, setEarned] = useState(0);
    const [count, setCount] = useState(6);
    const [result, setResult] = useState(null);
    const [npcX, setNpcX] = useState(112);
    const [curNpc, setCurNpc] = useState(null);
    const [feedback, setFeedback] = useState({ text: '', color: '#7a6a4a' });
    const [isReady, setIsReady] = useState(false);
    
    const rafRef = useRef(null);
    const earnedRef = useRef(0);
    const countRef = useRef(6);
    const npcXRef = useRef(112);
    const playingRef = useRef(false);

    const { time, start, stop } = useTimer(10, () => { 
        if (!isSpectator && playingRef.current) endBeg(); 
    }, isSpectator);

    const endBeg = useCallback(() => {
        if (isSpectator) return;
        
        playingRef.current = false; 
        stop(); 
        cancelAnimationFrame(rafRef.current);
        
        const p = Math.max(0, earnedRef.current);
        const win = p >= 5;
        
        setResult({ 
            win, 
            icon: win ? '💰' : '😔', 
            main: win ? '物乞い成功！' : '稼ぎが足りなかった…', 
            sub: `獲得 ${p}P / 5P以上で成功`, 
            pts: win ? p : 0 
        });
        
        if (win && p > 0) addPts(p);
    }, [isSpectator, stop, addPts]);

    const spawnNpc = useCallback(() => {
        if (isSpectator || !playingRef.current || countRef.current <= 0) return;
        
        const npc = NPCS[rnd(0, NPCS.length - 1)];
        setCurNpc(npc);
        npcXRef.current = 112; 
        setNpcX(112);
        setFeedback({ text: '', color: '#7a6a4a' });
        
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const spd = rnd(12, 22) / 10;
        
        const tick = () => {
            if (!playingRef.current) return;
            
            npcXRef.current -= spd;
            setNpcX(npcXRef.current);
            
            if (npcXRef.current < -18) {
                countRef.current--; 
                setCount(countRef.current);
                setFeedback({ text: '逃した…', color: '#7a6a4a' });
                
                if (countRef.current > 0) {
                    setTimeout(spawnNpc, 600);
                } else {
                    setTimeout(endBeg, 500);
                }
                return;
            }
            
            rafRef.current = requestAnimationFrame(tick);
        };
        
        rafRef.current = requestAnimationFrame(tick);
    }, [isSpectator, endBeg]);

    const doBeg = () => {
        if (isSpectator || !playingRef.current || npcXRef.current < -18 || npcXRef.current > 112) return;
        cancelAnimationFrame(rafRef.current);
        
        const inZone = npcXRef.current >= 35 && npcXRef.current <= 65;
        const npc = curNpc;
        const gain = npc.p;
        
        if (inZone) {
            earnedRef.current += gain;
            
            if (gain > 0) addPts(gain); 
            else if (gain < 0) subPts(-gain);
            
            setEarned(Math.max(0, earnedRef.current));
            
            setFeedback({ 
                text: `${npc.name}—${BEG_REACT[gain]||''} ${gain > 0 ? '+'+gain+'P' : gain < 0 ? gain+'P' : ''}`, 
                color: gain > 0 ? '#e8b84b' : gain < 0 ? '#b52e1e' : '#7a6a4a' 
            });
        } else {
            setFeedback({ text: 'タイミングが悪い…無視', color: '#7a6a4a' });
        }
        
        npcXRef.current = -50; 
        setNpcX(-50); 
        countRef.current--; 
        setCount(countRef.current);
        
        if (countRef.current > 0) {
            setTimeout(spawnNpc, 1000); 
        } else {
            setTimeout(endBeg, 600);
        }
    };

    const init = useCallback(() => {
        if (isSpectator) return;
        
        playingRef.current = false; 
        cancelAnimationFrame(rafRef.current);
        
        earnedRef.current = 0; 
        countRef.current = 6; 
        npcXRef.current = 112;
        
        setEarned(0); 
        setCount(6); 
        setNpcX(112); 
        setFeedback({ text: '', color: '#7a6a4a' }); 
        setResult(null); 
        setIsReady(false);
    }, [isSpectator]);

    const startGame = () => {
        if (isSpectator) return;
        
        setIsReady(true); 
        playingRef.current = true; 
        start();
        spawnNpc();
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
                mgSyncState: { isReady, earned, count, npcX, curNpc, feedback, result } 
            });
        }
    }, [isReady, earned, count, npcX, curNpc, feedback, result, isSpectator]);

    // ▼ 同期受信
    useEffect(() => {
        if (isSpectator && mgSyncState) {
            if (mgSyncState.isReady !== undefined) setIsReady(mgSyncState.isReady);
            if (mgSyncState.earned !== undefined) setEarned(mgSyncState.earned);
            if (mgSyncState.count !== undefined) setCount(mgSyncState.count);
            if (mgSyncState.npcX !== undefined) setNpcX(mgSyncState.npcX);
            if (mgSyncState.curNpc !== undefined) setCurNpc(mgSyncState.curNpc);
            if (mgSyncState.feedback !== undefined) setFeedback(mgSyncState.feedback);
            if (mgSyncState.result !== undefined) setResult(mgSyncState.result);
        }
    }, [isSpectator, mgSyncState]);

    return (
        <div style={{ ...S.screen, pointerEvents: isSpectator ? 'none' : 'auto' }}>
            <MiniGameStylesPart4 />
            <SpectatorOverlay isSpectator={isSpectator} />
            <GameHeader title="🙏 物乞い" pts={pts} timer={playingRef.current ? time : null} onBack={onBack} />
            <div style={S.body}>
                {!isReady && !result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Instr>
                            <strong style={{color:'#e8b84b', fontSize:'1.1rem'}}>【ルール説明】</strong><br/><br/>
                            通行人が⭐マークのゾーンに入った瞬間にボタンを押せ！<br/>
                            良い人からPをもらい、ヤクザや警察からは逃げろ。<br/>
                            10秒以内に5P以上稼げばクリアだ！
                        </Instr>
                        <BtnPrim onClick={startGame} style={{ width: '100%' }}>ゲーム開始！</BtnPrim>
                    </div>
                ) : (
                    <>
                        <Instr>⭐ゾーンにNPCがいるとき押せ！5P以上稼げば成功！</Instr>
                        
                        <div style={{ display: 'flex', gap: '.8rem', justifyContent: 'center', width: '100%' }}>
                            <StatBox label="残りNPC" val={count} style={{ flex: 1 }} />
                            <StatBox label="💰 獲得" val={`${earned}P`} style={{ color: '#e8b84b', flex: 1 }} />
                        </div>
                        
                        <div className="beg-street">
                            <div className="beg-road"></div>
                            <div className="beg-zone"></div>
                            <div className="beg-char">🧎</div>
                            {npcX > -18 && (
                                <div className="beg-npc" style={{ left: `${npcX}%` }}>
                                    {curNpc?.e}
                                </div>
                            )}
                        </div>
                        
                        <div className="beg-feedback" style={{ color: feedback.color }}>
                            {feedback.text}
                        </div>
                        
                        {!result && (
                            <BtnPrim onClick={doBeg} style={{ width: '100%' }}>
                                🙏 お恵みを…
                            </BtnPrim>
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
   Game 14: 🎸 路上ライブ音ゲー
════════════════════════════════════════ */
export function MusicGame({ pts, addPts, onBack, isEventMode }) {
    const { activeMiniGamePlayerId, mgSyncState } = useGameStore();
    const { myUserId } = useNetworkStore();
    const isSpectator = isEventMode && activeMiniGamePlayerId && activeMiniGamePlayerId !== myUserId;

    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [result, setResult] = useState(null);
    const [notes, setNotes] = useState([]);
    const [judge, setJudge] = useState({ text: '', color: '', show: false });
    const [isReady, setIsReady] = useState(false);
    
    const rafRef = useRef(null);
    const playingRef = useRef(false);
    const t0 = useRef(0);
    const notesRef = useRef([]);
    const scoreRef = useRef(0);
    const comboRef = useRef(0);
    const judgeTimerRef = useRef(null);
    
    const SEQ = [
        { l: 0, t: 0.5 }, { l: 1, t: 1.2 }, { l: 2, t: 1.8 }, { l: 0, t: 2.5 }, 
        { l: 1, t: 3.0 }, { l: 2, t: 3.5 }, { l: 0, t: 4.2 }, { l: 1, t: 4.8 }, 
        { l: 2, t: 5.4 }, { l: 0, t: 6.0 }
    ];
    const FALL_DUR = 1.5; 

    const { time, start, stop } = useTimer(10, () => { 
        if (!isSpectator && playingRef.current) endMusic(); 
    }, isSpectator);

    const showJudge = useCallback((text, color) => {
        if (isSpectator) return;
        
        setJudge({ text, color, show: false });
        clearTimeout(judgeTimerRef.current);
        
        requestAnimationFrame(() => setJudge({ text, color, show: true }));
        judgeTimerRef.current = setTimeout(() => setJudge(j => ({ ...j, show: false })), 400);
    }, [isSpectator]);

    const endMusic = useCallback(() => {
        if (isSpectator) return;
        
        playingRef.current = false; 
        stop(); 
        cancelAnimationFrame(rafRef.current);
        
        const total = SEQ.length;
        const hit = notesRef.current.filter(n => n.hit).length;
        const pct = Math.round((hit / total) * 100);
        
        const win = pct >= 60;
        const rank = pct >= 90 ? 'S' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : 'C';
        const p = win ? Math.round(scoreRef.current / 5) : 0;
        
        setResult({ 
            win, 
            icon: win ? '🎸' : '😔', 
            main: win ? `ランク ${rank}！${pct}%成功！` : `ランク ${rank}…${pct}%しか合わなかった`, 
            sub: `ヒット ${hit}/${total} / スコア ${scoreRef.current}`, 
            pts: p 
        });
        
        if (p > 0) addPts(p);
        setNotes([]);
    }, [isSpectator, stop, addPts, SEQ.length]);

    const animate = useCallback(() => {
        if (isSpectator || !playingRef.current) return;
        
        const now = performance.now() / 1000 - t0.current;
        const hitY = 240; 
        
        let allFinished = true;
        let missedOccurred = false;
        
        notesRef.current.forEach(n => {
            if (n.hit || n.missed) return;
            allFinished = false;
            
            if (now >= n.t) {
                const elapsed = now - n.t;
                const y = -40 + (elapsed / FALL_DUR) * (hitY + 40);
                
                if (y > hitY + 40) {
                    n.missed = true;
                    comboRef.current = 0;
                    missedOccurred = true;
                } else {
                    n.y = y;
                }
            }
        });
        
        if (missedOccurred) {
            setCombo(0);
            showJudge('MISS', '#ff8070');
            beep(220, 0.1);
        }
        
        setNotes(notesRef.current.filter(n => !n.hit && !n.missed && n.y > -40).map(n => ({ ...n })));
        
        if (allFinished) {
            setTimeout(endMusic, 500);
            return;
        }
        
        rafRef.current = requestAnimationFrame(animate);
    }, [isSpectator, endMusic, showJudge]);

    const tap = (e, lane) => {
        e.preventDefault();
        if (isSpectator || !playingRef.current) return;
        
        const hitY = 240;
        const target = notesRef.current.find(n => n.l === lane && !n.hit && !n.missed && n.y > 0);
        
        if (target) {
            const dist = Math.abs(target.y - hitY);
            if (dist < 28) {
                target.hit = true; 
                scoreRef.current += 10; 
                comboRef.current++;
                showJudge('PERFECT', '#e8b84b'); 
                beep(660, 0.1);
            } else if (dist < 50) {
                target.hit = true; 
                scoreRef.current += 5; 
                comboRef.current++;
                showJudge('GOOD', '#90e060'); 
                beep(440, 0.1);
            } else {
                target.missed = true; 
                comboRef.current = 0;
                showJudge('MISS', '#ff8070'); 
                beep(220, 0.1);
            }
            setScore(scoreRef.current); 
            setCombo(comboRef.current);
        } else {
            comboRef.current = 0; 
            setCombo(0);
        }
    };

    const startGame = useCallback(() => {
        if (isSpectator) return;
        
        setIsReady(true); 
        playingRef.current = true; 
        t0.current = performance.now() / 1000;
        
        notesRef.current = SEQ.map((n, i) => ({ id: i, ...n, hit: false, missed: false, y: -40 }));
        scoreRef.current = 0; 
        comboRef.current = 0;
        
        setScore(0); 
        setCombo(0); 
        setResult(null);
        
        start(); 
        rafRef.current = requestAnimationFrame(animate);
    }, [isSpectator, start, animate, SEQ]);

    const init = useCallback(() => {
        if (isSpectator) return;
        
        playingRef.current = false; 
        cancelAnimationFrame(rafRef.current);
        
        setScore(0); 
        setCombo(0); 
        setResult(null); 
        setNotes([]); 
        setIsReady(false);
        setJudge({ text: '', color: '', show: false });
    }, [isSpectator]);

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
                mgSyncState: { isReady, score, combo, notes, judge, result } 
            });
        }
    }, [isReady, score, combo, notes, judge, result, isSpectator]);

    // ▼ 同期受信
    useEffect(() => {
        if (isSpectator && mgSyncState) {
            if (mgSyncState.isReady !== undefined) setIsReady(mgSyncState.isReady);
            if (mgSyncState.score !== undefined) setScore(mgSyncState.score);
            if (mgSyncState.combo !== undefined) setCombo(mgSyncState.combo);
            if (mgSyncState.notes !== undefined) setNotes(mgSyncState.notes);
            if (mgSyncState.judge !== undefined) setJudge(mgSyncState.judge);
            if (mgSyncState.result !== undefined) setResult(mgSyncState.result);
        }
    }, [isSpectator, mgSyncState]);

    const LANE_DATA = [
        { icon: '🎸', bg: 'rgba(201,123,42,0.3)', border: '#c97b2a' },
        { icon: '🥁', bg: 'rgba(78,133,57,0.3)', border: '#4e8539' },
        { icon: '🎹', bg: 'rgba(42,90,138,0.3)', border: '#2a5a8a' }
    ];

    return (
        <div style={{ ...S.screen, pointerEvents: isSpectator ? 'none' : 'auto' }}>
            <MiniGameStylesPart4 />
            <SpectatorOverlay isSpectator={isSpectator} />
            <GameHeader title="🎸 路上ライブ" pts={pts} timer={playingRef.current ? time : null} onBack={onBack} />
            <div style={S.body}>
                {!isReady && !result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Instr>
                            <strong style={{color:'#e8b84b', fontSize:'1.1rem'}}>【ルール説明】</strong><br/><br/>
                            上から落ちてくるノーツが下のラインに重なるタイミングで、<br/>
                            対応する楽器ボタンをタップして演奏しろ！<br/>
                            ヒット率60%以上でライブ成功だ！
                        </Instr>
                        <BtnPrim onClick={startGame} style={{ width: '100%' }}>🎸 ゲーム開始！</BtnPrim>
                    </div>
                ) : (
                    <>
                        <Instr>ノーツがラインに来たらタップ！60%以上ヒットで成功！</Instr>
                        
                        <div style={{ fontSize: '1.1rem', color: '#e8b84b', fontWeight: 700, textAlign: 'center' }}>
                            SCORE: {score} / COMBO: {combo}
                        </div>
                        
                        <div className="music-arena">
                            <div className="music-lane-line" style={{ left: '33.33%' }} />
                            <div className="music-lane-line" style={{ left: '66.66%' }} />
                            <div className="music-hit-line" />
                            
                            <div className={`music-judge ${judge.show ? 'show' : ''}`} style={{ color: judge.color }}>
                                {judge.text}
                            </div>
                            
                            {notes.map(n => (
                                <div 
                                    key={n.id} 
                                    className="music-note" 
                                    style={{ 
                                        left: `${n.l * 33.33 + 16.66}%`, top: n.y, width: '28%',
                                        background: LANE_DATA[n.l].bg, borderColor: LANE_DATA[n.l].border, color: LANE_DATA[n.l].border
                                    }}
                                >
                                    {LANE_DATA[n.l].icon}
                                </div>
                            ))}
                            
                            <div className="music-btns">
                                {[0, 1, 2].map(l => (
                                    <button 
                                        key={l} 
                                        className="music-btn" 
                                        onPointerDown={(e) => tap(e, l)}
                                        style={{ borderColor: LANE_DATA[l].border, color: LANE_DATA[l].border }}
                                    >
                                        {LANE_DATA[l].icon}
                                    </button>
                                ))}
                            </div>
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
   Game 15: 💬 闇市交渉ゲーム
════════════════════════════════════════ */
export function NegoGame({ pts, addPts, onBack, isEventMode }) {
    const { activeMiniGamePlayerId, mgSyncState } = useGameStore();
    const { myUserId } = useNetworkStore();
    const isSpectator = isEventMode && activeMiniGamePlayerId && activeMiniGamePlayerId !== myUserId;

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
    const [history, setHistory] = useState([]);
    const [npc, setNpc] = useState('🧔');
    const [npcText, setNpcText] = useState('交渉相手を呼んでいる…');
    const [offers, setOffers] = useState([]);
    const [result, setResult] = useState(null);
    const [isReady, setIsReady] = useState(false);
    
    const totalRef = useRef(0);
    const idxRef = useRef(0);
    const itemsRef = useRef([]);
    const doneRef = useRef(false);

    const { time, start, stop } = useTimer(10, () => { 
        if (!isSpectator && !doneRef.current) endNego(); 
    }, isSpectator);

    const endNego = useCallback(() => {
        if (isSpectator || doneRef.current) return; 
        
        doneRef.current = true; 
        stop();
        
        const win = totalRef.current >= 15; 
        const p = win ? totalRef.current : 0; 
        
        setResult({ 
            win, 
            icon: win ? '💰' : '😔', 
            main: win ? `合計${totalRef.current}P 交渉成功！` : `合計${totalRef.current}P 稼ぎが足りなかった`, 
            sub: `15P以上で成功`, 
            pts: p 
        });
        
        if (p > 0) addPts(p);
    }, [isSpectator, stop, addPts]);

    const showItem = useCallback((i, its) => {
        if (isSpectator || doneRef.current) return;
        
        const item = its[i]; 
        const n = NEGO_NPCS[rnd(0, NEGO_NPCS.length - 1)];
        
        setNpc(n); 
        setNpcText(`「${item.name}？…で、いくらで売る？」`); 
        setIdx(i);
        
        const o = [
            Math.floor(item.max * 0.35), 
            Math.floor(item.max * 0.6), 
            Math.floor(item.max * 1.3)
        ].sort(() => Math.random() - .5);
        
        setOffers(o.map(v => ({ v, item, npc: n })));
    }, [isSpectator]);

    const makeOffer = useCallback(({ v, item, npc: n }) => {
        if (isSpectator) return;
        
        setOffers([]); 
        const accepted = v <= item.max; 
        const gain = accepted ? v : 0; 
        
        totalRef.current += gain; 
        setTotal(totalRef.current);
        
        setNpcText(accepted ? `「${v}P か…わかった！」✅ 成立！` : `「${v}P！？高すぎる！」❌ 交渉決裂`);
        setHistory(prev => [...prev, `${item.e}→${gain > 0 ? '+' + gain : '✗'}P`]);
        
        const next = idxRef.current + 1; 
        idxRef.current = next;
        
        if (next >= 3) {
            setTimeout(endNego, 1000);
        } else {
            setTimeout(() => showItem(next, itemsRef.current), 1200);
        }
    }, [isSpectator, endNego, showItem]);

    const init = useCallback(() => {
        if (isSpectator) return;
        
        doneRef.current = false; 
        totalRef.current = 0; 
        idxRef.current = 0;
        
        const its = [...NEGO_ITEMS].sort(() => Math.random() - .5).slice(0, 3);
        itemsRef.current = its; 
        setItems(its); 
        setIdx(0); 
        setTotal(0); 
        setHistory([]); 
        setResult(null); 
        setIsReady(false);
    }, [isSpectator]);

    const startGame = () => {
        if (isSpectator) return;
        
        setIsReady(true); 
        start(); 
        showItem(0, itemsRef.current);
    };

    useEffect(() => { 
        init(); 
        return () => { 
            doneRef.current = true; 
        }; 
    }, [init]);

    // ▼ 同期送信
    useEffect(() => {
        if (!isSpectator) {
            useGameStore.setState({ 
                mgSyncState: { isReady, items, idx, total, history, npc, npcText, offers, result } 
            });
        }
    }, [isReady, items, idx, total, history, npc, npcText, offers, result, isSpectator]);

    // ▼ 同期受信
    useEffect(() => {
        if (isSpectator && mgSyncState) {
            if (mgSyncState.isReady !== undefined) setIsReady(mgSyncState.isReady);
            if (mgSyncState.items !== undefined) setItems(mgSyncState.items);
            if (mgSyncState.idx !== undefined) setIdx(mgSyncState.idx);
            if (mgSyncState.total !== undefined) setTotal(mgSyncState.total);
            if (mgSyncState.history !== undefined) setHistory(mgSyncState.history);
            if (mgSyncState.npc !== undefined) setNpc(mgSyncState.npc);
            if (mgSyncState.npcText !== undefined) setNpcText(mgSyncState.npcText);
            if (mgSyncState.offers !== undefined) setOffers(mgSyncState.offers);
            if (mgSyncState.result !== undefined) setResult(mgSyncState.result);
        }
    }, [isSpectator, mgSyncState]);

    const item = items[idx];

    return (
        <div style={{ ...S.screen, pointerEvents: isSpectator ? 'none' : 'auto' }}>
            <MiniGameStylesPart4 />
            <SpectatorOverlay isSpectator={isSpectator} />
            <GameHeader title="💬 闇市交渉" pts={pts} timer={isReady && !result ? time : null} onBack={onBack} />
            <div style={S.body}>
                {!isReady && !result ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <Instr>
                            <strong style={{color:'#e8b84b', fontSize:'1.1rem'}}>【ルール説明】</strong><br/><br/>
                            3つのアイテムを闇市の住人に売りつけろ！<br/>
                            相手が買える上限額を超えると交渉決裂になってしまう。<br/>
                            上手く足元を見て、合計15P以上稼げば成功だ！
                        </Instr>
                        <BtnPrim onClick={startGame} style={{ width: '100%' }}>ゲーム開始！</BtnPrim>
                    </div>
                ) : (
                    <>
                        <Instr>アイテムを最高値で売れ！相手の上限を超えると失敗！3アイテムで15P以上稼げば成功！</Instr>
                        
                        <StatBox label="アイテム" val={`${Math.min(idx + 1, 3)} / 3`} style={{ width: '100%' }} />
                        
                        {item && !result && (
                            <div className="nego-item-box">
                                <div style={{ fontSize: '3.5rem' }}>{item.e}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f0e8d0', marginTop: '.25rem' }}>{item.name}</div>
                                <div style={{ fontSize: '.85rem', color: '#7a6a4a', marginTop: '.15rem' }}>{item.desc}</div>
                            </div>
                        )}
                        
                        {!result && (
                            <div className="nego-npc-say">
                                <span style={{ fontSize: '1.8rem' }}>{npc}</span>
                                <span style={{ fontWeight: 'bold' }}>{npcText}</span>
                            </div>
                        )}
                        
                        {history.length > 0 && (
                            <div className="nego-history">
                                {history.join(' | ')}
                            </div>
                        )}
                        
                        {offers.length > 0 && (
                            <div style={{ display: 'flex', gap: '.8rem', width: '100%', marginTop: '10px' }}>
                                {offers.map((o, i) => (
                                    <button 
                                        key={i} 
                                        className="nego-offer-btn" 
                                        onPointerDown={() => makeOffer(o)}
                                    >
                                        {o.v}P
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
                <ResultBox result={result} />
                {result && !isSpectator && (
                    <BtnPrim onClick={init}>🔁 もう一度</BtnPrim>
                )}
            </div>
        </div>
    );
}