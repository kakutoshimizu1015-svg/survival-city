import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { charEmoji } from '../../constants/characters';

const SORT_MODES = [
    { key: 'order', label: '🔢 順番' },
    { key: 'rank',  label: '🏆 ランク' },
    { key: 'team',  label: '🚩 チーム' },
];

// チームカラーのソート優先度（同じチームをまとめるため）
const TEAM_ORDER = { red: 0, blue: 1, green: 2, yellow: 3, none: 99 };

export const PlayerList = () => {
    const players = useGameStore(state => state.players);
    const turn = useGameStore(state => state.turn);
    const territories = useGameStore(state => state.territories);

    // ▼ ソートモードのローカルstate（ネットワーク同期しない）
    const [sortMode, setSortMode] = useState('order');

    // ▼ ソート済みプレイヤー配列を生成
    const sortedPlayers = useMemo(() => {
        // 元の配列を壊さないようにコピー（元indexも保持）
        const list = players.map((p, index) => ({ ...p, _originalIndex: index }));

        if (sortMode === 'rank') {
            // 総ポイント数（p.p）の降順
            list.sort((a, b) => b.p - a.p);
        } else if (sortMode === 'team') {
            // チームカラーでグループ化 → 同チーム内は元の順番順
            list.sort((a, b) => {
                const teamDiff = (TEAM_ORDER[a.teamColor] ?? 50) - (TEAM_ORDER[b.teamColor] ?? 50);
                if (teamDiff !== 0) return teamDiff;
                return a._originalIndex - b._originalIndex;
            });
        }
        // 'order' の場合はそのまま（元の配列順＝ターン順）

        return list;
    }, [players, sortMode]);

    // ▼ ソートモード切替ボタンのスタイル
    const sortBtnStyle = (isActive) => ({
        flex: 1,
        padding: '3px 2px',
        fontSize: '10px',
        fontWeight: 'bold',
        border: '1.5px solid #8d7b68',
        borderRadius: '5px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        background: isActive ? '#5c4a44' : 'rgba(62,47,42,0.3)',
        color: isActive ? '#f1c40f' : '#bdc3c7',
        boxShadow: isActive ? '0 0 6px rgba(241,196,15,0.3)' : 'none',
        whiteSpace: 'nowrap',
    });

    return (
        <div id="player-list-panel" className="panel">
            <h3 className="player-list-header" style={{ margin: '0 0 4px 0', fontSize: '13px', borderBottom: '2px dashed #8d7b68', paddingBottom: '5px', textAlign: 'center' }}>
                👥 プレイヤー
            </h3>

            {/* ▼ ソート切替ボタン */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                {SORT_MODES.map(mode => (
                    <button
                        key={mode.key}
                        style={sortBtnStyle(sortMode === mode.key)}
                        onClick={() => setSortMode(mode.key)}
                        title={`${mode.label}で並べ替え`}
                    >
                        {mode.label}
                    </button>
                ))}
            </div>

            <div id="all-players-list" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {sortedPlayers.map((p) => {
                    // ▼ 修正: ソート後もp.idで正しく判定
                    const isActive = p.id === turn;
                    const activeStyle = isActive 
                        ? { boxShadow: '0 0 12px #f1c40f', borderColor: '#f1c40f', background: '#5c4a44' } 
                        : { borderColor: p.color, opacity: 0.9 };
                    const emoji = charEmoji[p.charType] || '🏃';

                    // 領土数の計算
                    const terrCount = Object.values(territories).filter(id => id === p.id).length;

                    // 装備アイテムアイコンの文字列生成
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
                    if (!equipIcons) equipIcons = '-';

                    // ▼ ランクモード時は順位バッジを表示
                    let rankBadge = null;
                    if (sortMode === 'rank') {
                        const rankIndex = sortedPlayers.indexOf(p);
                        const rankEmoji = rankIndex === 0 ? '🥇' : rankIndex === 1 ? '🥈' : rankIndex === 2 ? '🥉' : `${rankIndex + 1}.`;
                        rankBadge = (
                            <span style={{ fontSize: '11px', marginRight: '3px' }}>{rankEmoji}</span>
                        );
                    }

                    // ▼ チームモード時はチームカラーバッジを表示
                    let teamBadge = null;
                    if (sortMode === 'team' && p.teamColor !== 'none') {
                        const teamColorMap = { red: '#e74c3c', blue: '#3498db', green: '#2ecc71', yellow: '#f1c40f' };
                        teamBadge = (
                            <span style={{
                                display: 'inline-block',
                                width: '8px', height: '8px',
                                borderRadius: '50%',
                                background: teamColorMap[p.teamColor] || '#999',
                                marginRight: '4px',
                                border: '1px solid rgba(255,255,255,0.4)',
                                verticalAlign: 'middle',
                            }} />
                        );
                    }

                    return (
                        <div 
                            key={p.id} 
                            className="mini-player-clay" 
                            style={{ ...activeStyle, cursor: 'pointer' }}
                            onClick={() => useGameStore.setState({ charInfoModal: p.id })}
                            title={`${p.name}のキャラ詳細を表示`}
                        >
                            <div className="avatar-small-clay" style={{ borderColor: p.color }}>{emoji}</div>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', lineHeight: '1.3', overflow: 'hidden', flex: 1 }}>
                                <div style={{ color: p.color, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {rankBadge}
                                    {teamBadge}
                                    {p.name} {p.isCPU && <span style={{ color: '#bdc3c7' }}>(CPU)</span>}
                                    {p.respawnShield > 0 && <span style={{ color: '#f1c40f' }}> 🛡️{p.respawnShield}</span>}
                                </div>
                                <div style={{ color: '#fdf5e6' }}>
                                    ❤️{p.hp} 💰{p.p}P 🎴{p.hand?.length || 0} 🚩{terrCount}
                                </div>
                                <div style={{ color: '#bdc3c7', fontSize: '9px' }}>
                                    {equipIcons}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
