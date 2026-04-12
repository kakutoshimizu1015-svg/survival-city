import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { deckData } from '../../constants/cards';
// ▼ 変更: executeRecycle を追加インポート
import { actionUseCard, actionDiscardCard, executeRecycle } from '../../game/cards';
import { executeSalesVisit } from '../../game/skills'; 

export const HandCards = () => {
    // ▼ 修正: isCreativeMode と setGameState を追加で取得
    const { players, turn, diceRolled, mgActive, isBranchPicking, isSalesVisiting, isRecyclePicking, isCreativeMode, setGameState } = useGameStore();
    const cp = players[turn];
    const { myUserId, status } = useNetworkStore();

    if (!cp) return null;

    let isMyTurn = !cp.isCPU;
    
    if (status === 'connected') {
        isMyTurn = (cp.userId === myUserId);
    }

    if (!isMyTurn) {
        return (
            <div id="hand-cards-area" style={{ flexGrow: 1, display: 'flex', overflowX: 'auto', minWidth: 0 }}>
                <div id="card-panel-clay" className="panel" style={{ display: 'flex', gap: '10px', overflowX: 'auto', alignItems: 'center', width: '100%', padding: '10px', margin: 0, minHeight: '120px' }}>
                    {cp.hand.map((_, idx) => (
                        <div key={idx} style={{ background: 'repeating-linear-gradient(45deg,#e07a5f,#e07a5f 10px,#c0392b 10px,#c0392b 20px)', border: '3px solid #fff', borderRadius: '8px', padding: '8px', textAlign: 'center', minWidth: '110px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '4px 4px 0px rgba(0,0,0,0.4)' }}>
                            <div style={{ fontSize: '30px' }}>🎴</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const isSalesMode = isMyTurn && isSalesVisiting;
    const isRecycleMode = isMyTurn && isRecyclePicking; // ▼ 追加: 廃品再生モード

    return (
        <div id="hand-cards-area" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            
            {/* ▼ 追加: クリエイティブモード用コントロールパネル（自分のターンの時だけ表示） */}
            {isMyTurn && (
                <div style={{ display: 'flex', gap: '10px', padding: '0 10px 5px', justifyContent: 'flex-end' }}>
                    <button 
                        onClick={() => setGameState({ isCreativeMode: !isCreativeMode })}
                        style={{ padding: '4px 8px', fontSize: '10px', background: isCreativeMode ? '#e74c3c' : '#bdc3c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        {isCreativeMode ? '🛠️ クリエイティブ: ON' : '🛠️ クリエイティブ: OFF'}
                    </button>
                    {isCreativeMode && (
                        <button 
                            onClick={() => {
                                const allCards = deckData.map(c => c.id);
                                useGameStore.getState().updateCurrentPlayer({ hand: allCards });
                            }}
                            style={{ padding: '4px 8px', fontSize: '10px', background: '#f39c12', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            🃏 全カード取得
                        </button>
                    )}
                </div>
            )}

            <div id="card-panel-clay" className="panel" style={{ display: 'flex', gap: '10px', overflowX: 'auto', alignItems: 'center', width: '100%', padding: '10px', margin: 0, minHeight: '120px' }}>
                {cp.hand.length === 0 && <div style={{ color: '#fdf5e6', width: '100%', textAlign: 'center' }}>手札なし</div>}
                
                {cp.hand.map((cardId, index) => {
                    const cardData = deckData.find(c => c.id === cardId);
                    if (!cardData) return null;

                    let apCost = cardData.type === 'weapon' ? 2 : 0;
                    if ([3, 4, 13].includes(cardId)) apCost = 1;
                    
                    // ▼ 修正: クリエイティブモード中は、AP不足等の Disabled 条件を完全に無視する
                    const isDisabled = !isCreativeMode && (!isMyTurn || !diceRolled || cp.ap < (isSalesMode ? 2 : apCost) || mgActive || isBranchPicking || isRecycleMode);
                    const isDiscardDisabled = !isMyTurn || mgActive || isBranchPicking || isSalesMode; 

                    return (
                        <div key={index} style={{ background: '#fdf5e6', border: `3px solid ${cardData.color || '#8d6e63'}`, borderRadius: '8px', padding: '8px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', minWidth: '110px', display: 'flex', flexDirection: 'column', gap: '3px', color: '#333', boxShadow: '4px 4px 0px rgba(0,0,0,0.4)' }}>
                            <div style={{ fontSize: '12px', borderBottom: '1px solid #ccc', paddingBottom: '2px' }}>{cardData.icon} {cardData.name}</div>
                            <div style={{ flexGrow: 1, marginTop: '3px' }}>{cardData.desc}</div>
                            <div style={{ display: 'flex', gap: '5px', width: '100%', justifyContent: 'center', marginTop: '3px' }}>
                                <button 
                                    onClick={() => isSalesMode ? executeSalesVisit(index) : actionUseCard(index, cardId)} 
                                    disabled={isDisabled} 
                                    style={{ flex: 1, padding: '4px', fontSize: '10px', fontWeight: 'bold', borderRadius: '5px', cursor: isDisabled ? 'not-allowed' : 'pointer', border: `2px solid ${isSalesMode ? '#f39c12' : '#8d6e63'}`, background: isDisabled ? '#eee' : (isSalesMode ? '#fdebd0' : '#fff'), opacity: isDisabled ? 0.5 : 1, color: isSalesMode ? '#d35400' : '#333' }}
                                >
                                    {isSalesMode ? '売りつける' : (cardId === 12 ? '使用(HP半減)' : (apCost > 0 ? `使用(${apCost}AP)` : '使用'))}
                                </button>
                                <button 
                                    onClick={() => isRecycleMode ? executeRecycle(index) : actionDiscardCard(index)} 
                                    disabled={isDiscardDisabled} 
                                    style={{ flex: 1, padding: '4px', fontSize: '10px', fontWeight: 'bold', borderRadius: '5px', cursor: isDiscardDisabled ? 'not-allowed' : 'pointer', border: `2px solid ${isRecycleMode ? '#27ae60' : '#c0392b'}`, background: isDiscardDisabled ? '#eee' : (isRecycleMode ? '#d5f5e3' : '#fff'), opacity: isDiscardDisabled ? 0.5 : 1, color: isRecycleMode ? '#27ae60' : '#333' }}
                                >
                                    {isRecycleMode ? '売却する' : '捨てる'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};