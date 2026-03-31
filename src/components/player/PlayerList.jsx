import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { charEmoji } from '../../constants/characters';

export const PlayerList = () => {
    const players = useGameStore(state => state.players);
    const turn = useGameStore(state => state.turn);

    return (
        <div id="player-list-panel" className="panel">
            <h3 className="player-list-header" style={{ margin: '0 0 8px 0', fontSize: '13px', borderBottom: '2px dashed #8d7b68', paddingBottom: '5px', textAlign: 'center' }}>
                👥 プレイヤー
            </h3>
            <div id="all-players-list" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {players.map((p, index) => {
                    const isActive = index === turn;
                    const activeStyle = isActive 
                        ? { boxShadow: '0 0 12px #f1c40f', borderColor: '#f1c40f', background: '#5c4a44' } 
                        : { borderColor: p.color, opacity: 0.9 };
                    const emoji = charEmoji[p.charType] || '🏃';

                    return (
                        <div key={p.id} className="mini-player-clay" style={{ ...activeStyle, cursor: 'pointer' }}>
                            <div className="avatar-small-clay" style={{ borderColor: p.color }}>{emoji}</div>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', lineHeight: '1.3', overflow: 'hidden', flex: 1 }}>
                                <div style={{ color: p.color, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {p.name} {p.isCPU && <span style={{ color: '#bdc3c7' }}>(CPU)</span>}
                                </div>
                                <div style={{ color: '#fdf5e6' }}>❤️{p.hp} 💰{p.p}P 🎴{p.hand?.length || 0} 🚩0</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};