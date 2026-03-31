import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { charEmoji, charInfo } from '../../constants/characters';

export const StatusPanel = () => {
    const turn = useGameStore(state => state.turn);
    const players = useGameStore(state => state.players);
    const currentPlayer = players[turn];

    if (!currentPlayer) return null;

    const emoji = charEmoji[currentPlayer.charType] || '🏃';
    const cInfo = charInfo[currentPlayer.charType];
    const hpPercent = Math.max(0, Math.min(100, currentPlayer.hp));

    // HPバーの色を計算
    const hpColor = hpPercent > 50 ? 'linear-gradient(90deg,#2ecc71,#27ae60)' 
                  : hpPercent > 20 ? 'linear-gradient(90deg,#f39c12,#e67e22)' 
                  : 'linear-gradient(90deg,#e74c3c,#c0392b)';

    return (
        <div id="portrait-active" className="panel" title="クリックでキャラ詳細を表示">
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div className="active-id-clay" style={{ backgroundColor: currentPlayer.color }}>
                    P{currentPlayer.id + 1}
                </div>
                <div className="turn-text-clay" style={{ flexGrow: 1, marginLeft: '10px' }}>
                    {currentPlayer.name}のターン
                </div>
            </div>

            <div className="avatar-large" style={{ borderColor: currentPlayer.color }}>
                {emoji}
            </div>

            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f1c40f', marginBottom: '5px', textAlign: 'center' }}>
                ★ {cInfo?.name}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', width: '100%', justifyContent: 'space-between' }}>
                <div className="status-box" style={{ width: '48%' }}>
                    ❤️ HP: {currentPlayer.hp}
                    <div className="hp-bar-outer">
                        <div className="hp-bar-inner" style={{ width: `${hpPercent}%`, background: hpColor }}></div>
                    </div>
                </div>
                <div className="status-box" style={{ width: '48%', background: 'var(--clay-ap)' }}>
                    ⚡ AP: {currentPlayer.ap}
                </div>
                <div className="status-box" style={{ width: '48%' }}>
                    💰 P: <span className={currentPlayer.p < 0 ? 'bankrupt' : ''}>{currentPlayer.p}</span>
                </div>
                <div className="status-box" style={{ width: '48%' }}>
                    🚩 領土: {0 /* 後で計算ロジックを入れます */}
                </div>
                <div className="status-box" style={{ width: '48%', background: '#4a3b32' }}>
                    ⚔️ {currentPlayer.kills}K / 💀{currentPlayer.deaths}D
                </div>
                <div className="status-box" style={{ width: '100%', background: '#6d5c4e' }}>
                    🥫{currentPlayer.cans} 🗑️{currentPlayer.trash} 🎴{currentPlayer.hand.length}/{currentPlayer.maxHand}
                </div>
            </div>
        </div>
    );
};