import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { charInfo } from '../../constants/characters';
import { CharImage } from '../common/CharImage';

const EQUIP_ITEMS = [
    { key: 'stealth',  field: 'stealth',         emoji: '💨', title: 'ステルス' },
    { key: 'hasID',    field: 'hasID',            emoji: '🪪', title: '身分証' },
    { key: 'bicycle',  field: 'equip.bicycle',    emoji: '🚲', title: '自転車' },
    { key: 'shoes',    field: 'equip.shoes',      emoji: '👢', title: '安全靴' },
    { key: 'cart',     field: 'equip.cart',        emoji: '🛒', title: 'リヤカー' },
    { key: 'shield',   field: 'equip.shield',     emoji: '🛡️', title: '盾' },
    { key: 'helmet',   field: 'equip.helmet',     emoji: '🪖', title: 'ヘルメット' },
    { key: 'doll',     field: 'equip.doll',       emoji: '🎎', title: '身代わり' },
    { key: 'rainGear', field: 'rainGear',         emoji: '☂️', title: '雨具' },
];

const getField = (player, fieldPath) => {
    const parts = fieldPath.split('.');
    let val = player;
    for (const p of parts) { val = val?.[p]; }
    return !!val;
};

export const StatusPanel = () => {
    const turn = useGameStore(state => state.turn);
    const players = useGameStore(state => state.players);
    const territories = useGameStore(state => state.territories);
    const cp = players[turn];

    if (!cp) return null;

    const cInfo = charInfo[cp.charType];
    const hpPercent = Math.max(0, Math.min(100, cp.hp));
    const terrCount = Object.values(territories).filter(id => id === cp.id).length;

    const hpColor = hpPercent > 50 ? 'linear-gradient(90deg,#2ecc71,#27ae60)'
                  : hpPercent > 20 ? 'linear-gradient(90deg,#f39c12,#e67e22)'
                  : 'linear-gradient(90deg,#e74c3c,#c0392b)';

    return (
        <div
            className="dt-status-panel"
            onClick={() => useGameStore.setState({ charInfoModal: cp.id })}
            title="クリックでキャラ詳細を表示"
        >
            {/* ── Header row ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: cp.color, flexShrink: 0,
                }} />
                <div style={{
                    flex: 1, fontSize: 12, fontWeight: 800,
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 6, padding: '3px 8px',
                    color: 'var(--dt-text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {cp.name}のターン
                </div>
            </div>

            {/* ── Avatar + char name ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{
                    width: 52, height: 52, borderRadius: 10,
                    border: `2px solid ${cp.color}`,
                    background: 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', flexShrink: 0,
                }}>
                    <CharImage charType={cp.charType} skinId={cp.skinId} size={48} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dt-gold)', marginBottom: 4 }}>
                        ★ {cInfo?.name}
                    </div>
                    {/* HP bar */}
                    <div className="dt-stat-box" style={{ padding: '4px 6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                            <span>❤️ HP</span><span>{cp.hp}</span>
                        </div>
                        <div className="dt-hp-bar-outer">
                            <div className="dt-hp-bar-inner" style={{ width: `${hpPercent}%`, background: hpColor }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stats grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 6 }}>
                <div className="dt-stat-box" style={{ background: 'rgba(46,204,113,0.08)', borderColor: 'rgba(46,204,113,0.15)' }}>
                    ⚡ AP: {cp.ap}
                </div>
                <div className="dt-stat-box">
                    💰 <span className={cp.p < 0 ? 'bankrupt' : ''}>{cp.p}</span>P
                </div>
                <div className="dt-stat-box">
                    🚩 {terrCount}
                </div>
                <div className="dt-stat-box">
                    ⚔️ {cp.kills}K / 💀{cp.deaths}D
                </div>
            </div>
            <div className="dt-stat-box" style={{ marginBottom: 6 }}>
                🥫{cp.cans} 🗑️{cp.trash} 🎴{cp.hand.length}/{cp.maxHand}
            </div>

            {/* ── Equip bar ── */}
            <div style={{ fontSize: 10, color: '#666', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 3, marginBottom: 4 }}>
                装備アイテム
            </div>
            <div className="dt-equip-bar">
                {EQUIP_ITEMS.map(item => {
                    const isActive = getField(cp, item.field);
                    return (
                        <div
                            key={item.key}
                            className={`dt-equip-icon ${isActive ? 'active' : 'inactive'}`}
                            title={item.title}
                        >
                            {item.emoji}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
