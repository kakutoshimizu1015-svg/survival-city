import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { deckData } from '../../constants/cards';
import { actionUseCard, actionDiscardCard } from '../../game/cards';

export const HandCards = () => {
    const { players, turn, diceRolled, mgActive, isBranchPicking } = useGameStore();
    const cp = players[turn];
    const { myUserId, status } = useNetworkStore();

    if (!cp) return null;

    let isMyTurn = !cp.isCPU;
    if (status === 'connected') {
        isMyTurn = (cp.userId === myUserId);
    }

    // 他人のターンの時はカード裏面を表示
    if (!isMyTurn) {
        return (
            <div id="hand-cards-area" style={{ flexGrow: 1, display: 'flex', overflowX: 'auto', minWidth: 0 }}>
                <div id="card-panel-clay" className="panel" style={{ flex: 1, display: 'flex', gap: '10px', overflowX: 'auto', alignItems: 'center', width: '100%', padding: '10px', margin: 0 }}>
                    {cp.hand.map((_, idx) => (
                        <div key={idx} style={{ background: 'repeating-linear-gradient(45deg,#e07a5f,#e07a5f 10px,#c0392b 10px,#c0392b 20px)', border: '3px solid #fff', borderRadius: '8px', padding: '8px', textAlign: 'center', minWidth: '110px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '4px 4px 0px rgba(0,0,0,0.4)' }}>
                            <div style={{ fontSize: '30px' }}>🎴</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div id="hand-cards-area" style={{ flexGrow: 1, display: 'flex', overflowX: 'auto', minWidth: 0 }}>
            <div id="card-panel-clay" className="panel" style={{ flex: 1, display: 'flex', gap: '10px', overflowX: 'auto', alignItems: 'center', width: '100%', padding: '10px', margin: 0 }}>
                {cp.hand.length === 0 && <div style={{ color: '#fdf5e6', width: '100%', textAlign: 'center' }}>手札なし</div>}
                
                {cp.hand.map((cardId, index) => {
                    const cardData = deckData.find(c => c.id === cardId);
                    if (!cardData) return null;

                    const apCost = cardData.type === 'weapon' ? 2 : 0;
                    const isDisabled = !isMyTurn || !diceRolled || cp.ap < apCost || mgActive || isBranchPicking;
                    const isDiscardDisabled = !isMyTurn || mgActive || isBranchPicking;

                    return (
                        <div key={index} style={{ background: '#fdf5e6', border: `3px solid ${cardData.color || '#8d6e63'}`, borderRadius: '8px', padding: '8px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', minWidth: '110px', display: 'flex', flexDirection: 'column', gap: '3px', color: '#333', boxShadow: '4px 4px 0px rgba(0,0,0,0.4)' }}>
                            <div style={{ fontSize: '12px', borderBottom: '1px solid #ccc', paddingBottom: '2px' }}>{cardData.icon} {cardData.name}</div>
                            <div style={{ flexGrow: 1, marginTop: '3px' }}>{cardData.desc}</div>
                            <div style={{ display: 'flex', gap: '5px', width: '100%', justifyContent: 'center', marginTop: '3px' }}>
                                <button onClick={() => actionUseCard(index, cardId)} disabled={isDisabled} style={{ flex: 1, padding: '4px', fontSize: '10px', fontWeight: 'bold', borderRadius: '5px', cursor: isDisabled ? 'not-allowed' : 'pointer', border: '2px solid #8d6e63', background: isDisabled ? '#eee' : '#fff', opacity: isDisabled ? 0.5 : 1 }}>
                                    {apCost > 0 ? `使用(${apCost}AP)` : '使用'}
                                </button>
                                <button onClick={() => actionDiscardCard(index)} disabled={isDiscardDisabled} style={{ flex: 1, padding: '4px', fontSize: '10px', fontWeight: 'bold', borderRadius: '5px', cursor: isDiscardDisabled ? 'not-allowed' : 'pointer', border: '2px solid #c0392b', background: isDiscardDisabled ? '#eee' : '#fff', opacity: isDiscardDisabled ? 0.5 : 1 }}>
                                    捨てる
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};