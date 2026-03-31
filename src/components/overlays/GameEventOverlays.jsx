import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { ClayButton } from '../common/ClayButton';
import { logMsg } from '../../game/actions';
import { deckData } from '../../constants/cards'; // 追加：カード情報取得用

export const GameEventOverlays = () => {
    const { mgActive, mgType, mgValue, mgResult, storyActive, players, turn } = useGameStore();
    const { myUserId, status } = useNetworkStore();
    const cp = players[turn];

    const [slotReels, setSlotReels] = useState([0, 0, 0]);
    const [slotStopped, setSlotStopped] = useState([false, false, false]);
    // ★ 最新の絵柄を確実に判定するためのRef
    const slotReelsRef = useRef([0, 0, 0]);
    const marks = ["🍒", "🔔", "🍇"];

    const isMyTurn = status === 'connected' ? (cp?.userId === myUserId) : true;

    // ミニゲーム起動時の初期化
    useEffect(() => {
        if (mgActive && !mgResult) {
            setSlotStopped([false, false, false]);
            setSlotReels([0, 0, 0]);
            slotReelsRef.current = [0, 0, 0];
        }
    }, [mgActive, mgResult]);

    // ★ スロットを回すアニメーション
    useEffect(() => {
        if (mgActive && mgType === 'slot' && !mgResult) {
            const interval = setInterval(() => {
                setSlotReels(prev => {
                    const next = prev.map((r, i) => slotStopped[i] ? r : Math.floor(Math.random() * 3));
                    slotReelsRef.current = next; // 常に最新の絵柄をRefに保存
                    return next;
                });
            }, 100);
            return () => clearInterval(interval);
        }
    }, [mgActive, mgType, mgResult, slotStopped]);

    const handleResult = (isWin, msg) => {
        if (!isMyTurn) return;
        useGameStore.setState({ mgResult: isWin ? '大成功！' : '失敗...' });
        logMsg(`🎲 ${msg}`);
        
        if (isWin) {
            const cardId = Math.floor(Math.random() * 38);
            useGameStore.getState().updateCurrentPlayer(p => ({ hand: [...p.hand, cardId] }));
            
            // ▼ イベントでゲットしたカードをポップアップ等で表示する処理を追加
            const cardData = deckData.find(c => c.id === cardId) || { name: '謎のカード', icon: '🃏' };
            useGameStore.getState().addEventPopup(cp.id, cardData.icon, "カード獲得！", `${cardData.name}を手に入れた`, "card");
            logMsg(`🎁 ${cp.name}は「${cardData.name}」を手に入れた！`);
        }
        
        // ★ 失敗しても必ず mgResult を null に戻してフリーズを回避
        setTimeout(() => useGameStore.setState({ mgActive: false, mgResult: null }), 2000);
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
                                                    const ns = [...slotStopped]; 
                                                    ns[i] = true; 
                                                    setSlotStopped(ns);
                                                    // 全て止まったら、最新の絵柄（Ref）を元に判定
                                                    if(ns.every(s => s)) {
                                                        setTimeout(() => {
                                                            const finalReels = slotReelsRef.current;
                                                            const isWin = finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2];
                                                            handleResult(isWin, "スロット判定");
                                                        }, 150);
                                                    }
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