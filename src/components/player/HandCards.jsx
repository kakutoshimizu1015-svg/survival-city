import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { deckData } from '../../constants/cards';
import { actionUseCard, actionDiscardCard } from '../../game/cards';

export const HandCards = () => {
    const turn = useGameStore(state => state.turn);
    const players = useGameStore(state => state.players);
    const currentPlayer = players[turn];

    if (!currentPlayer || !currentPlayer.hand || currentPlayer.hand.length === 0) {
        return (
            <div id="hand-cards-area">
                <div id="card-panel-clay" className="panel" style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ color: '#fdf5e6', width: '100%', textAlign: 'center' }}>手札なし</div>
                </div>
            </div>
        );
    }

    return (
        <div id="hand-cards-area">
            <div id="card-panel-clay" className="panel">
                {currentPlayer.hand.map((cardId, index) => {
                    const card = deckData.find(c => c.id === cardId);
                    if (!card) return null;
                    const apCost = card.type === 'weapon' ? 2 : 0;
                    const canUse = currentPlayer.ap >= apCost;

                    return (
                        <div key={index} className="card-btn-clay" style={{ borderColor: card.color }}>
                            <div className="card-title-clay">{card.icon} {card.name}</div>
                            <div style={{ fontSize: '11px', margin: '3px 0' }}>{card.desc}</div>
                            <div className="card-actions">
                                <button 
                                    className="card-mini-btn" 
                                    disabled={!canUse}
                                    onClick={() => actionUseCard(index, card.id)}
                                >
                                    使用 {apCost > 0 && `(${apCost}AP)`}
                                </button>
                                <button 
                                    className="card-mini-btn" 
                                    style={{ borderColor: '#c0392b' }}
                                    onClick={() => actionDiscardCard(index)}
                                >
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