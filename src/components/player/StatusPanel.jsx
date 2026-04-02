import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { charInfo } from '../../constants/characters';
import { CharImage } from '../common/CharImage';

export const StatusPanel = () => {
    const turn = useGameStore(state => state.turn);
    const players = useGameStore(state => state.players);
    const currentPlayer = players[turn];

    if (!currentPlayer) return null;

    const cInfo = charInfo[currentPlayer.charType];
    const hpPercent = Math.max(0, Math.min(100, currentPlayer.hp));

    const hpColor = hpPercent > 50 ? 'linear-gradient(90deg,#2ecc71,#27ae60)' 
                  : hpPercent > 20 ? 'linear-gradient(90deg,#f39c12,#e67e22)' 
                  : 'linear-gradient(90deg,#e74c3c,#c0392b)';

    return (
        <div id="portrait-active" className="panel" title="クリックでキャラ詳細を表示" onClick={() => useGameStore.setState({ charInfoModal: currentPlayer.id })} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div className="active-id-clay" style={{ backgroundColor: currentPlayer.color }}>
                    P{currentPlayer.id + 1}
                </div>
                <div className="turn-text-clay" style={{ flexGrow: 1, marginLeft: '10px' }}>
                    {currentPlayer.name}のターン
                </div>
            </div>

            {/* アバター部分をCharImageに差し替え */}
            <div className="avatar-large" style={{ borderColor: currentPlayer.color, overflow: 'hidden', padding: 0 }}>
                <CharImage charType={currentPlayer.charType} size={68} />
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
                    🚩 領土: {Object.values(useGameStore(state => state.territories)).filter(id => id === currentPlayer.id).length}
                </div>
                <div className="status-box" style={{ width: '48%', background: '#4a3b32' }}>
                    ⚔️ {currentPlayer.kills}K / 💀{currentPlayer.deaths}D
                </div>
                <div className="status-box" style={{ width: '100%', background: '#6d5c4e' }}>
                    🥫{currentPlayer.cans} 🗑️{currentPlayer.trash} 🎴{currentPlayer.hand.length}/{currentPlayer.maxHand}
                </div>
            </div>

            <div style={{ width: '100%', marginTop: '5px' }}>
                <div style={{ fontSize: '10px', borderBottom: '1px solid #8d6e63', color: '#bdc3c7' }}>装備アイテム</div>
                <div id="items-indicator" style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '5px', background: '#3e2f2a', padding: '5px', borderRadius: '8px', width: '100%', flexWrap: 'wrap' }}>
                    <div title="ステルス" style={{ filter: currentPlayer.stealth ? 'none' : 'grayscale(100%) opacity(0.3)', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: currentPlayer.stealth ? '#e8dcc4' : '#5c4a44', borderRadius: '5px', border: currentPlayer.stealth ? '1px solid #f1c40f' : '1px solid #2e1e18', transform: currentPlayer.stealth ? 'scale(1.1)' : 'none' }}>💨</div>
                    <div title="身分証" style={{ filter: currentPlayer.hasID ? 'none' : 'grayscale(100%) opacity(0.3)', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: currentPlayer.hasID ? '#e8dcc4' : '#5c4a44', borderRadius: '5px', border: currentPlayer.hasID ? '1px solid #f1c40f' : '1px solid #2e1e18', transform: currentPlayer.hasID ? 'scale(1.1)' : 'none' }}>🪪</div>
                    <div title="自転車" style={{ filter: currentPlayer.equip?.bicycle ? 'none' : 'grayscale(100%) opacity(0.3)', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: currentPlayer.equip?.bicycle ? '#e8dcc4' : '#5c4a44', borderRadius: '5px', border: currentPlayer.equip?.bicycle ? '1px solid #f1c40f' : '1px solid #2e1e18', transform: currentPlayer.equip?.bicycle ? 'scale(1.1)' : 'none' }}>🚲</div>
                    <div title="安全靴" style={{ filter: currentPlayer.equip?.shoes ? 'none' : 'grayscale(100%) opacity(0.3)', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: currentPlayer.equip?.shoes ? '#e8dcc4' : '#5c4a44', borderRadius: '5px', border: currentPlayer.equip?.shoes ? '1px solid #f1c40f' : '1px solid #2e1e18', transform: currentPlayer.equip?.shoes ? 'scale(1.1)' : 'none' }}>👢</div>
                    <div title="リヤカー" style={{ filter: currentPlayer.equip?.cart ? 'none' : 'grayscale(100%) opacity(0.3)', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: currentPlayer.equip?.cart ? '#e8dcc4' : '#5c4a44', borderRadius: '5px', border: currentPlayer.equip?.cart ? '1px solid #f1c40f' : '1px solid #2e1e18', transform: currentPlayer.equip?.cart ? 'scale(1.1)' : 'none' }}>🛒</div>
                    <div title="盾" style={{ filter: currentPlayer.equip?.shield ? 'none' : 'grayscale(100%) opacity(0.3)', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: currentPlayer.equip?.shield ? '#e8dcc4' : '#5c4a44', borderRadius: '5px', border: currentPlayer.equip?.shield ? '1px solid #f1c40f' : '1px solid #2e1e18', transform: currentPlayer.equip?.shield ? 'scale(1.1)' : 'none' }}>🛡️</div>
                    <div title="ヘルメット" style={{ filter: currentPlayer.equip?.helmet ? 'none' : 'grayscale(100%) opacity(0.3)', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: currentPlayer.equip?.helmet ? '#e8dcc4' : '#5c4a44', borderRadius: '5px', border: currentPlayer.equip?.helmet ? '1px solid #f1c40f' : '1px solid #2e1e18', transform: currentPlayer.equip?.helmet ? 'scale(1.1)' : 'none' }}>🪖</div>
                    <div title="身代わり" style={{ filter: currentPlayer.equip?.doll ? 'none' : 'grayscale(100%) opacity(0.3)', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: currentPlayer.equip?.doll ? '#e8dcc4' : '#5c4a44', borderRadius: '5px', border: currentPlayer.equip?.doll ? '1px solid #f1c40f' : '1px solid #2e1e18', transform: currentPlayer.equip?.doll ? 'scale(1.1)' : 'none' }}>🎎</div>
                    <div title="雨具" style={{ filter: currentPlayer.rainGear ? 'none' : 'grayscale(100%) opacity(0.3)', width: '24px', height: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: currentPlayer.rainGear ? '#e8dcc4' : '#5c4a44', borderRadius: '5px', border: currentPlayer.rainGear ? '1px solid #f1c40f' : '1px solid #2e1e18', transform: currentPlayer.rainGear ? 'scale(1.1)' : 'none' }}>☂️</div>
                </div>
            </div>
        </div>
    );
};