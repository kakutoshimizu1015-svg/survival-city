import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { ClayButton } from '../common/ClayButton';
import { logMsg } from '../../game/actions';

export const GameEventOverlays = () => {
    const { mgActive, mgType, mgValue, mgResult, storyActive, players, turn } = useGameStore();
    const { myUserId, status } = useNetworkStore();
    const cp = players[turn];

    const [slotReels, setSlotReels] = useState([0, 0, 0]);
    const [slotStopped, setSlotStopped] = useState([false, false, false]);
    const marks = ["🍒", "🔔", "🍇"];

    // オンライン時の操作権限チェック
    const isMyTurn = status === 'connected' ? (cp?.userId === myUserId) : true;

    useEffect(() => {
        if (mgActive && mgType === 'slot' && !mgResult) {
            setSlotStopped([false, false, false]);
            const interval = setInterval(() => {
                setSlotReels(prev => prev.map((r, i) => slotStopped[i] ? r : Math.floor(Math.random() * 3)));
            }, 100);
            return () => clearInterval(interval);
        }
    }, [mgActive, mgType, mgResult]);

    const handleResult = (isWin, msg) => {
        if (!isMyTurn) return;
        useGameStore.setState({ mgResult: isWin ? '大成功！' : '失敗...' });
        logMsg(`🎲 ${msg}`);
        if (isWin) {
            const cardId = Math.floor(Math.random() * 38);
            useGameStore.getState().updateCurrentPlayer(p => ({ hand: [...p.hand, cardId] }));
        }
        setTimeout(() => useGameStore.setState({ mgActive: false }), 2000);
    };

    if (!mgActive && !storyActive) return null;

    return (
        <>
            {mgActive && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
                    <div className="modal-box" style={{ background: '#2c3e50', color: 'white' }}>
                        <h2>🎲 ミニゲーム {!isMyTurn && "(待機中...)"}</h2>
                        {!mgResult ? (
                            <div style={{ pointerEvents: isMyTurn ? 'auto' : 'none', opacity: isMyTurn ? 1 : 0.7 }}>
                                {mgType === 'highlow' && (
                                    <>
                                        <p>基準：<span style={{ fontSize: '36px', color: '#f1c40f' }}>{mgValue}</span></p>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button className="mg-btn high" onClick={() => handleResult((Math.random()*14)>=mgValue, "High/Low判定")}>High</button>
                                            <button className="mg-btn low" onClick={() => handleResult((Math.random()*14)<mgValue, "High/Low判定")}>Low</button>
                                        </div>
                                    </>
                                )}
                                {mgType === 'boxes' && (
                                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '40px' }}>
                                        {[0,1,2].map(i => <div key={i} onClick={() => handleResult(Math.random()>0.6, "宝箱判定")} style={{cursor:'pointer'}}>📦</div>)}
                                    </div>
                                )}
                                {mgType === 'slot' && (
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        {[0,1,2].map(i => (
                                            <div key={i}>
                                                <div style={{ fontSize: '40px', background: '#fff', color: '#000', padding: '10px', borderRadius: '10px' }}>{marks[slotReels[i]]}</div>
                                                <ClayButton disabled={slotStopped[i]} onClick={() => {
                                                    const ns = [...slotStopped]; ns[i]=true; setSlotStopped(ns);
                                                    if(ns.every(s=>s)) handleResult(slotReels[0]===slotReels[1] && slotReels[1]===slotReels[2], "スロット判定");
                                                }}>STOP</ClayButton>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : <h2>{mgResult}</h2>}
                    </div>
                </div>
            )}
        </>
    );
};