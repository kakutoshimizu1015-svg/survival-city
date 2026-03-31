import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { ClayButton } from '../common/ClayButton';
import { logMsg } from '../../game/actions';

export const GameEventOverlays = () => {
    const { mgActive, mgType, mgValue, mgResult, storyActive, players, turn } = useGameStore();
    const cp = players[turn];

    // スロット用のローカルステート
    const [slotReels, setSlotReels] = useState([0, 0, 0]);
    const [slotStopped, setSlotStopped] = useState([false, false, false]);
    const marks = ["🍒", "🔔", "🍇"];

    useEffect(() => {
        if (mgActive && mgType === 'slot' && !mgResult) {
            setSlotStopped([false, false, false]);
            const interval = setInterval(() => {
                setSlotReels(prev => prev.map((r, i) => slotStopped[i] ? r : Math.floor(Math.random() * 3)));
            }, 100);
            return () => clearInterval(interval);
        }
    }, [mgActive, mgType, mgResult]);

    // --- 各ミニゲームの判定処理 ---
    const handleResult = (isWin, msg) => {
        useGameStore.setState({ mgResult: isWin ? '大成功！' : '失敗...' });
        logMsg(`🎲 ${msg}`);
        if (isWin) {
            const cardId = Math.floor(Math.random() * 15); // 仮のカード獲得処理
            useGameStore.getState().updateCurrentPlayer(p => ({ hand: [...p.hand, cardId] }));
            logMsg(`✨ カードを獲得しました！`);
        }
        setTimeout(() => useGameStore.setState({ mgActive: false }), 2000);
    };

    const handleHighLow = (choice) => {
        const resultNum = Math.floor(Math.random() * 14);
        const isWin = (choice === 'high' && resultNum >= mgValue) || (choice === 'low' && resultNum < mgValue);
        handleResult(isWin, `ハイ＆ロー: 結果は${resultNum}！`);
    };

    const handleBoxes = (idx) => {
        const winIdx = Math.floor(Math.random() * 3);
        handleResult(idx === winIdx, idx === winIdx ? "宝箱: 当たり！" : "宝箱: 空っぽ...");
    };

    const stopSlot = (idx) => {
        const newStopped = [...slotStopped];
        newStopped[idx] = true;
        setSlotStopped(newStopped);
        
        if (newStopped.every(s => s)) {
            // スロットが全部止まったら1テンポ遅れて判定
            setTimeout(() => {
                const isWin = slotReels[0] === slotReels[1] && slotReels[1] === slotReels[2];
                handleResult(isWin, isWin ? "スロット: 揃った！" : "スロット: 揃わず...");
            }, 500);
        }
    };

    // --- ストーリーイベント ---
    const handleStory = () => {
        useGameStore.getState().updateCurrentPlayer(p => ({ p: p.p + 5 }));
        logMsg(`📖 ストーリーイベント！ 5Pを見つけた！`);
        useGameStore.setState({ storyActive: false });
    };

    return (
        <>
            {mgActive && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
                    <div className="modal-box" style={{ background: '#2c3e50', color: 'white' }}>
                        <h2>🎲 ミニゲーム</h2>
                        {!mgResult ? (
                            <>
                                {mgType === 'highlow' && (
                                    <>
                                        <p>基準：<span style={{ fontSize: '36px', color: '#f1c40f' }}>{mgValue}</span></p>
                                        <p>次の数はHighかLowか？</p>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button className="mg-btn high" style={{ background: '#e74c3c', padding: '10px 20px', fontSize: '18px' }} onClick={() => handleHighLow('high')}>High</button>
                                            <button className="mg-btn low" style={{ background: '#3498db', padding: '10px 20px', fontSize: '18px' }} onClick={() => handleHighLow('low')}>Low</button>
                                        </div>
                                    </>
                                )}
                                {mgType === 'boxes' && (
                                    <>
                                        <p>宝箱を1つ選べ！</p>
                                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '40px', cursor: 'pointer' }}>
                                            <div onClick={() => handleBoxes(0)}>📦</div>
                                            <div onClick={() => handleBoxes(1)}>📦</div>
                                            <div onClick={() => handleBoxes(2)}>📦</div>
                                        </div>
                                    </>
                                )}
                                {mgType === 'slot' && (
                                    <>
                                        <p>3つの絵柄を揃えろ！</p>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            {[0, 1, 2].map(i => (
                                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <div style={{ fontSize: '40px', background: '#fff', border: '4px solid #333', borderRadius: '10px', padding: '10px', width: '60px', height: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                        {marks[slotReels[i]]}
                                                    </div>
                                                    <ClayButton disabled={slotStopped[i]} onClick={() => stopSlot(i)} style={{ marginTop: '10px' }}>STOP</ClayButton>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <h2 style={{ color: mgResult === '大成功！' ? '#f1c40f' : '#bdc3c7', fontSize: '30px' }}>{mgResult}</h2>
                        )}
                    </div>
                </div>
            )}

            {storyActive && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 1002 }}>
                    <div className="modal-box" style={{ background: '#2c3e50', color: 'white' }}>
                        <h2 style={{ color: '#f1c40f' }}>📖 イベント発生</h2>
                        <p>道端で小銭を拾った！</p>
                        <ClayButton onClick={handleStory}>5Pをもらう</ClayButton>
                    </div>
                </div>
            )}
        </>
    );
};