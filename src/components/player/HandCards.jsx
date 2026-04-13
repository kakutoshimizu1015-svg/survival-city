import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { deckData } from '../../constants/cards';
import { actionUseCard, actionDiscardCard, executeRecycle } from '../../game/cards';
import { executeSalesVisit, executeChef } from '../../game/skills'; 

export const HandCards = () => {
    const { players, turn, diceRolled, mgActive, isBranchPicking, isSalesVisiting, isRecyclePicking, isCreativeMode, isChefPicking } = useGameStore();
    const cp = players[turn];
    const { myUserId, status } = useNetworkStore();

    if (!cp) return null;

    let isMyTurn = !cp.isCPU;
    if (status === 'connected') isMyTurn = (cp.userId === myUserId);

    /* ── 他プレイヤーのターン → カード裏面表示 ── */
    if (!isMyTurn) {
        return (
            <div className="dt-hand-area">
                <div className="dt-card-scroll">
                    {cp.hand.length === 0 && (
                        <div style={{ color: '#666', width: '100%', textAlign: 'center', alignSelf: 'center' }}>手札なし</div>
                    )}
                    {cp.hand.map((_, idx) => (
                        <div key={idx} className="dt-card dt-card-back" style={{ height: 80, minHeight: 80 }}>
                            <div style={{ fontSize: 24, color: 'rgba(200,162,78,0.4)' }}>🎴</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const isSalesMode = isMyTurn && isSalesVisiting;
    const isRecycleMode = isMyTurn && isRecyclePicking;
    const isChefMode = isMyTurn && isChefPicking;

    return (
        <div className="dt-hand-area">
            <div className="dt-card-scroll">
                {cp.hand.length === 0 && (
                    <div style={{ color: '#666', width: '100%', textAlign: 'center', alignSelf: 'center' }}>手札なし</div>
                )}

                {cp.hand.map((cardId, index) => {
                    const cardData = deckData.find(c => c.id === cardId);
                    if (!cardData) return null;

                    let apCost = cardData.type === 'weapon' ? 2 : 0;
                    if ([3, 4, 13].includes(cardId)) apCost = 1;
                    
                    const isHealCard = cardData.type === 'heal';
                    const modeCost = isChefMode ? 3 : isSalesMode ? 2 : apCost;
                    
                    const isDisabled = !isCreativeMode && (
                        !isMyTurn || !diceRolled || cp.ap < modeCost || mgActive || isBranchPicking || isRecycleMode || (isChefMode && !isHealCard)
                    );
                    const isDiscardDisabled = !isMyTurn || mgActive || isBranchPicking || isSalesMode || isChefMode;

                    /* カードの左ボーダー色 */
                    const accentColor = cardData.color || 'rgba(200,162,78,0.3)';

                    return (
                        <div
                            key={index}
                            className="dt-card"
                            style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
                        >
                            <div className="dt-card-title">
                                {cardData.icon} {cardData.name}
                            </div>
                            <div className="dt-card-desc">{cardData.desc}</div>
                            <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                                <button
                                    className="dt-card-btn"
                                    onClick={() => isSalesMode ? executeSalesVisit(index) : isChefMode ? executeChef(index) : actionUseCard(index, cardId)}
                                    disabled={isDisabled}
                                    style={
                                        isSalesMode ? { borderColor: 'rgba(243,156,18,0.3)', color: '#f39c12' }
                                      : isChefMode ? { borderColor: 'rgba(231,76,60,0.3)', color: '#e74c3c' }
                                      : {}
                                    }
                                >
                                    {isSalesMode ? '売りつける'
                                    : isChefMode ? '調理する'
                                    : cardId === 12 ? '使用(HP半減)'
                                    : apCost > 0 ? `使用(${apCost}AP)`
                                    : '使用'}
                                </button>
                                <button
                                    className={`dt-card-btn ${isRecycleMode ? '' : 'discard'}`}
                                    onClick={() => isRecycleMode ? executeRecycle(index) : actionDiscardCard(index)}
                                    disabled={isDiscardDisabled}
                                    style={isRecycleMode ? { borderColor: 'rgba(46,204,113,0.3)', color: '#2ecc71' } : {}}
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
