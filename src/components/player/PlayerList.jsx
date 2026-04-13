import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { CharImage } from '../common/CharImage';

const SORT_MODES = [
    { key: 'order', label: '🔢 順番' },
    { key: 'rank',  label: '🏆 ランク' },
    { key: 'team',  label: '🚩 チーム' },
];

const TEAM_ORDER = { red: 0, blue: 1, green: 2, yellow: 3, none: 99 };

export const PlayerList = () => {
    const players = useGameStore(state => state.players);
    const turn = useGameStore(state => state.turn);
    const territories = useGameStore(state => state.territories);
    const [sortMode, setSortMode] = useState('order');

    const sortedPlayers = useMemo(() => {
        const list = players.map((p, index) => ({ ...p, _originalIndex: index }));
        if (sortMode === 'rank') {
            list.sort((a, b) => b.p - a.p);
        } else if (sortMode === 'team') {
            list.sort((a, b) => {
                const teamDiff = (TEAM_ORDER[a.teamColor] ?? 50) - (TEAM_ORDER[b.teamColor] ?? 50);
                if (teamDiff !== 0) return teamDiff;
                return a._originalIndex - b._originalIndex;
            });
        }
        return list;
    }, [players, sortMode]);

    return (
        <div id="player-list-panel" className="dt-player-list">
            <div style={{
                fontSize: 12, fontWeight: 700, textAlign: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: 6, marginBottom: 6,
                color: 'var(--dt-text)',
            }}>
                👥 プレイヤー
            </div>

            {/* Sort buttons */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexShrink: 0 }}>
                {SORT_MODES.map(mode => (
                    <button
                        key={mode.key}
                        className={`dt-sort-btn ${sortMode === mode.key ? 'active' : ''}`}
                        onClick={() => setSortMode(mode.key)}
                        title={`${mode.label}で並べ替え`}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>

            {/* Player list */}
            <div style={{
                display: 'flex', flexDirection: 'column', gap: 3,
                overflowY: 'auto', maxHeight: 280, paddingRight: 4,
            }}>
                {sortedPlayers.map((p) => {
                    const isActive = p.id === turn;
                    const terrCount = Object.values(territories).filter(id => id === p.id).length;

                    const eq = p.equip || {};
                    let equipIcons = '';
                    if (eq.bicycle) equipIcons += '🚲';
                    if (eq.shoes) equipIcons += '👢';
                    if (eq.cart) equipIcons += '🛒';
                    if (eq.shield) equipIcons += '🛡️';
                    if (eq.helmet) equipIcons += '🪖';
                    if (eq.doll) equipIcons += '🎎';
                    if (eq.backpack) equipIcons += '🎒';
                    if (p.rainGear) equipIcons += '☂️';

                    let rankBadge = null;
                    if (sortMode === 'rank') {
                        const rankIndex = sortedPlayers.indexOf(p);
                        const rankEmoji = rankIndex === 0 ? '🥇' : rankIndex === 1 ? '🥈' : rankIndex === 2 ? '🥉' : `${rankIndex + 1}.`;
                        rankBadge = <span style={{ fontSize: 11, marginRight: 3 }}>{rankEmoji}</span>;
                    }

                    let teamBadge = null;
                    if (sortMode === 'team' && p.teamColor !== 'none') {
                        const teamColorMap = { red: '#e74c3c', blue: '#3498db', green: '#2ecc71', yellow: '#f1c40f' };
                        teamBadge = (
                            <span style={{
                                display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                                background: teamColorMap[p.teamColor] || '#999',
                                marginRight: 4, border: '1px solid rgba(255,255,255,0.2)',
                                verticalAlign: 'middle',
                            }} />
                        );
                    }

                    return (
                        <div
                            key={p.id}
                            className={`dt-player-item ${isActive ? 'active-turn' : ''}`}
                            onClick={() => useGameStore.setState({ charInfoModal: p.id })}
                            title={`${p.name}のキャラ詳細を表示`}
                        >
                            {/* Avatar */}
                            <div style={{
                                width: 28, height: 28, borderRadius: 6,
                                border: `2px solid ${p.color}`,
                                background: 'rgba(255,255,255,0.04)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', flexShrink: 0,
                            }}>
                                <CharImage charType={p.charType} skinId={p.skinId} size={26} />
                            </div>

                            {/* Info */}
                            <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.3, overflow: 'hidden', flex: 1, minWidth: 0 }}>
                                <div style={{
                                    color: p.color, whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis', overflow: 'hidden',
                                }}>
                                    {rankBadge}
                                    {teamBadge}
                                    {p.name} {p.isCPU && <span style={{ color: '#666' }}>(CPU)</span>}
                                    {p.respawnShield > 0 && <span style={{ color: 'var(--dt-gold)' }}> 🛡️{p.respawnShield}</span>}
                                </div>
                                <div style={{ color: '#aaa' }}>
                                    ❤️{p.hp} 💰{p.p}P 🎴{p.hand?.length || 0} 🚩{terrCount}
                                </div>
                                {equipIcons && (
                                    <div style={{ color: '#666', fontSize: 9 }}>{equipIcons}</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
