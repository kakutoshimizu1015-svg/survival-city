import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useUserStore } from '../store/useUserStore';
import { charInfo } from '../constants/characters';
import { genSmallMap, genMediumMap, genLargeMap, genCustomMap } from '../constants/maps';
import { randomizeTileTypes, randomizeTileLayout, randomizeStartPosition, scatterPlayerPositions } from '../utils/mapRandomizer';
import { savePlayerName } from '../utils/userLogic';
import { CharacterSelect } from './CharacterSelect';
import { CharImage } from '../components/common/CharImage';
import { MissionContainer } from '../components/common/mission/MissionContainer';

/* ── 定数 ── */
const TEAM_COLORS = {
    none:   { label: 'ソロ',  color: 'transparent', icon: '⚪' },
    red:    { label: '赤',    color: '#e74c3c',     icon: '🔴' },
    blue:   { label: '青',    color: '#3498db',     icon: '🔵' },
    green:  { label: '緑',    color: '#2ecc71',     icon: '🟢' },
    yellow: { label: '黄',    color: '#f1c40f',     icon: '🟡' },
    purple: { label: '紫',    color: '#9b59b6',     icon: '🟣' },
    orange: { label: '橙',    color: '#e67e22',     icon: '🟠' },
};

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#e91e8c'];

const CPU_DIFFICULTY = {
    easy:   { label: '弱め', color: '#27ae60' },
    normal: { label: '普通', color: '#e67e22' },
    hard:   { label: '鬼畜', color: '#c0392b' },
};


export const SetupOffline = () => {
    const setGameState = useGameStore(state => state.setGameState);
    const globalPlayerName = useUserStore(state => state.playerName);

    /* ── State ── */
    const [players, setPlayers] = useState([
        { id: 0, name: globalPlayerName || 'P1', charType: 'athlete', isCPU: false, teamColor: 'none', selectedSkin: null },
        { id: 1, name: 'CPU1', charType: 'sales', isCPU: true, teamColor: 'none', selectedSkin: null, cpuDifficulty: 'normal' },
    ]);
    const [mapSize, setMapSize] = useState('midtown');
    const [maxRounds, setMaxRounds] = useState(20);
    const [charAssignMode, setCharAssignMode] = useState('choose');
    const [charSelectTarget, setCharSelectTarget] = useState(null);

    // Randomize
    const [rmapTileType, setRmapTileType] = useState(false);
    const [rmapLayout, setRmapLayout] = useState(false);
    const [rmapStart, setRmapStart] = useState(false);
    const [rmapScatter, setRmapScatter] = useState(false);

    // Developer tools (collapsed by default)
    const [devOpen, setDevOpen] = useState(false);
    const [skipTurnDice, setSkipTurnDice] = useState(false);
    const [isCreative, setIsCreative] = useState(false);
    const [isTestMode, setIsTestMode] = useState(false);

    const [showMissionModal, setShowMissionModal] = useState(false);

    /* ── Sync player name ── */
    useEffect(() => {
        if (globalPlayerName) {
            setPlayers(prev => prev.map(p => p.id === 0 ? { ...p, name: globalPlayerName } : p));
        }
    }, [globalPlayerName]);

    /* ── Player CRUD ── */
    const addPlayer = (isCPU) => {
        if (players.length >= 8) return;
        setPlayers(prev => [...prev, {
            id: prev.length,
            name: isCPU ? `CPU${prev.length + 1}` : `P${prev.length + 1}`,
            charType: 'survivor', isCPU, teamColor: 'none',
            selectedSkin: null, cpuDifficulty: 'normal',
        }]);
    };

    const updatePlayer = (id, key, value) => {
        setPlayers(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));
    };

    const removePlayer = (id) => {
        if (players.length <= 2) return;
        setPlayers(prev => prev.filter(p => p.id !== id).map((p, idx) => ({ ...p, id: idx })));
    };

    const handleRandomizeTeams = () => {
        const teamColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        const numTeams = Math.min(Math.max(2, Math.floor(players.length / 2)), teamColors.length);
        const teamPool = teamColors.slice(0, numTeams);
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        setPlayers(prev => prev.map(p => {
            const idx = shuffled.findIndex(s => s.id === p.id);
            return { ...p, teamColor: teamPool[idx % numTeams] };
        }));
    };

    const handleClearTeams = () => {
        setPlayers(prev => prev.map(p => ({ ...p, teamColor: 'none' })));
    };

    /* ── Game Start ── */
    const drawInitialCard = () => {
        const rarePool = [12, 13, 35, 36, 37];
        const normalPool = [0,1,2,3,4,5,6,7,8,9,10,11,14,15,16,17,18,19,20,24,25,26,27,28,29,30,31,32,33,34];
        if (Math.random() < 0.05) return rarePool[Math.floor(Math.random() * rarePool.length)];
        return normalPool[Math.floor(Math.random() * normalPool.length)];
    };

    const handleStart = async () => {
        const p1Name = players.find(p => p.id === 0)?.name;
        if (p1Name && p1Name.trim() !== '') await savePlayerName(p1Name);

        let mapData = mapSize === 'small' ? genSmallMap() : mapSize === 'medium' ? genMediumMap() : mapSize === 'midtown' ? genCustomMap() : genLargeMap();
        if (rmapTileType) mapData = randomizeTileTypes(mapData);
        if (rmapLayout) mapData = randomizeTileLayout(mapData);

        if (isTestMode) {
            mapData = mapData.map(t => ({ ...t, type: 'normal', name: '道', fieldCans: 0, fieldTrash: 0 }));
        }

        let finalPlayers = [...players];
        const allChars = Object.keys(charInfo);
        const { equippedSkins } = useUserStore.getState();

        if (charAssignMode === 'random') {
            finalPlayers.forEach(p => p.charType = allChars[Math.floor(Math.random() * allChars.length)]);
        } else if (charAssignMode === 'cpu_random') {
            finalPlayers.forEach(p => { if (p.isCPU) p.charType = allChars[Math.floor(Math.random() * allChars.length)]; });
        }

        let startPos = mapData.find(t => t.type === 'center')?.id || mapData[0].id;
        let scatterPos = [];
        if (rmapScatter) scatterPos = scatterPlayerPositions(mapData, finalPlayers.length);
        else if (rmapStart) startPos = randomizeStartPosition(mapData);

        const creativeHand = Array.from({ length: 48 }, (_, i) => i);

        finalPlayers = finalPlayers.map((p, i) => ({
            ...p,
            color: PLAYER_COLORS[i % PLAYER_COLORS.length],
            pos: rmapScatter ? scatterPos[i] : startPos,
            skinId: p.selectedSkin || equippedSkins[p.charType] || 'default',
            // ▼ 修正: 億万長者の場合は初期Pが +15 されて 30P でスタートする
            hp: isTestMode ? 9999 : 100,
            p: p.charType === 'billionaire' ? 30 : 15,
            ap: isTestMode ? 9999 : 0,
            hand: isCreative ? [...creativeHand] : [drawInitialCard(), drawInitialCard(), drawInitialCard()],
            maxHand: isCreative ? 99 : (p.charType === 'hacker' ? 9 : 7),
            cans: 0, trash: 0, kills: 0, deaths: 0, equip: {},
        }));

        let turnOrderData = null;
        let turnOrderActive = false;

        if (!skipTurnDice) {
            const diceValues = finalPlayers.map(() => ({ d1: Math.floor(Math.random() * 6) + 1, d2: Math.floor(Math.random() * 6) + 1 }));
            const preRollData = finalPlayers.map((p, idx) => ({ idx, total: diceValues[idx].d1 + diceValues[idx].d2 }));
            preRollData.sort((a, b) => b.total !== a.total ? b.total - a.total : Math.random() - 0.5);
            const sortedOrder = preRollData.map(rd => rd.idx);
            turnOrderData = { players: finalPlayers, diceValues, sortedOrder };
            turnOrderActive = true;
        } else {
            finalPlayers = finalPlayers.sort(() => Math.random() - 0.5).map((p, idx) => ({ ...p, id: idx, color: PLAYER_COLORS[idx % 8] }));
        }

        const maxId = mapData.length - 1;
        const canTrashTiles = mapData.filter(t => t.type === 'can' || t.type === 'trash');

        setGameState({
            mapData, players: finalPlayers, turn: 0, roundCount: 1, maxRounds,
            diceRolled: false, gameOver: false, gamePhase: 'playing',
            turnOrderActive, turnOrderData,
            isCreativeMode: isCreative,
            truckPos:     isTestMode ? -1 : Math.floor(maxId * 0.4),
            policePos:    isTestMode ? -1 : Math.floor(maxId * 0.8),
            unclePos:     isTestMode ? -1 : Math.floor(maxId * 0.2),
            animalPos:    isTestMode ? -1 : (canTrashTiles.length > 0 ? canTrashTiles[Math.floor(Math.random() * canTrashTiles.length)].id : Math.floor(maxId * 0.3)),
            yakuzaPos:    isTestMode ? -1 : Math.floor(maxId * 0.5),
            loansharkPos: isTestMode ? -1 : Math.floor(maxId * 0.6),
            friendPos:    isTestMode ? -1 : Math.floor(maxId * 0.15),
        });
    };


    /* ══════════════════════════════
       Render
       ══════════════════════════════ */
    return (
        <div className="dt-screen">
            {/* ── Header ── */}
            <div className="dt-sticky-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className="dt-back-btn" onClick={() => setGameState({ gamePhase: 'mode_select' })}>◀</button>
                    <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--dt-text)' }}>🎮 ゲーム設定</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                        fontSize: 11, color: 'var(--dt-gold)',
                        border: '1px solid rgba(200,162,78,0.3)',
                        borderRadius: 6, padding: '4px 10px',
                    }}>
                        オフライン
                    </span>
                    <button
                        onClick={() => setShowMissionModal(true)}
                        style={{
                            fontSize: 11, color: 'var(--dt-orange)',
                            border: '1px solid rgba(230,126,34,0.3)',
                            borderRadius: 6, padding: '4px 10px',
                            background: 'rgba(230,126,34,0.08)',
                            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                        }}
                    >
                        🏆 ミッション
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div style={{ padding: '16px 20px', flex: 1 }}>

                {/* ===== 1. PLAYERS ===== */}
                <div className="dt-section-label">PLAYERS ({players.length}/8)</div>
                <div className="dt-card">
                    {players.map((p, idx) => (
                        <PlayerRow
                            key={p.id}
                            player={p}
                            colorDot={PLAYER_COLORS[idx % PLAYER_COLORS.length]}
                            charAssignMode={charAssignMode}
                            onUpdate={(key, val) => updatePlayer(p.id, key, val)}
                            onRemove={() => removePlayer(p.id)}
                            onCharSelect={() => setCharSelectTarget(p.id)}
                            canRemove={players.length > 2}
                        />
                    ))}

                    {/* Add / Team buttons */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="dt-add-btn" style={{ color: '#6a8a6a', borderColor: 'rgba(46,204,113,0.3)' }} onClick={() => addPlayer(false)}>+ 人間</button>
                        <button className="dt-add-btn" style={{ color: '#6a8aaa', borderColor: 'rgba(52,152,219,0.3)' }} onClick={() => addPlayer(true)}>+ CPU</button>
                        <button className="dt-add-btn" style={{ color: '#8a6aaa', borderColor: 'rgba(155,89,182,0.3)' }} onClick={handleRandomizeTeams}>🎲 ランダムチーム</button>
                        {players.some(p => p.teamColor !== 'none') && (
                            <button className="dt-add-btn" style={{ color: '#8a8a8a', borderColor: 'rgba(150,150,150,0.3)' }} onClick={handleClearTeams}>⚪ リセット</button>
                        )}
                    </div>
                </div>

                {/* ===== 2. CHARACTER ===== */}
                <div className="dt-section-label">CHARACTER</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    {[
                        { key: 'choose',     label: '🎭 各自選択', color: 'var(--dt-green)' },
                        { key: 'cpu_random', label: '🤖 CPUのみ🎲', color: 'var(--dt-orange)' },
                        { key: 'random',     label: '🎲 全員ランダム', color: 'var(--dt-purple)' },
                    ].map(opt => (
                        <button
                            key={opt.key}
                            className={`dt-pill ${charAssignMode === opt.key ? 'active' : ''}`}
                            style={charAssignMode === opt.key
                                ? { background: `${opt.color}18`, borderColor: opt.color, color: opt.color }
                                : {}
                            }
                            onClick={() => setCharAssignMode(opt.key)}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* ===== 3. RULES ===== */}
                <div className="dt-section-label">RULES</div>
                <div className="dt-card">
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, color: 'var(--dt-text-muted)', marginBottom: 6 }}>マップ</div>
                            <div style={{ position: 'relative' }}>
                                <select className="dt-select" value={mapSize} onChange={e => setMapSize(e.target.value)}>
                                    <option value="midtown">midtown (46)</option>
                                </select>
                                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--dt-text-muted)', pointerEvents: 'none' }}>▼</span>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 10, color: 'var(--dt-text-muted)', marginBottom: 6 }}>ラウンド</div>
                            <div style={{ position: 'relative' }}>
                                <select className="dt-select" value={maxRounds} onChange={e => setMaxRounds(Number(e.target.value))}>
                                    {[1, 5, 10, 15, 20, 30].map(r => <option key={r} value={r}>{r}R</option>)}
                                </select>
                                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--dt-text-muted)', pointerEvents: 'none' }}>▼</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== 4. RANDOMIZE ===== */}
                <div className="dt-section-label">RANDOMIZE</div>
                <div className="dt-card">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <RmapTile label="🔀 マス種類" active={rmapTileType} onClick={() => setRmapTileType(!rmapTileType)} />
                        <RmapTile label="📐 マス配置" active={rmapLayout} onClick={() => setRmapLayout(!rmapLayout)} />
                        <RmapTile label="🏁 開始位置" active={rmapStart} onClick={() => setRmapStart(!rmapStart)} />
                        <RmapTile label="🧭 バラバラ" active={rmapScatter} onClick={() => setRmapScatter(!rmapScatter)} />
                    </div>
                </div>

                {/* ===== 5. DEVELOPER TOOL (collapsible) ===== */}
                <div
                    className={`dt-collapsible-header ${devOpen ? 'open' : ''}`}
                    onClick={() => setDevOpen(!devOpen)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--dt-text-subtle)' }}>🛠</span>
                        <span style={{ fontSize: 11, color: 'var(--dt-text-subtle)', letterSpacing: 2, fontWeight: 500 }}>DEVELOPER TOOL</span>
                    </div>
                    <span className={`dt-collapsible-chevron ${devOpen ? 'open' : ''}`}>▼</span>
                </div>
                <div className={`dt-collapsible-body ${devOpen ? 'open' : ''}`}>
                    <div className="dt-collapsible-body-inner">
                        <label className="dt-checkbox-card">
                            <input type="checkbox" checked={skipTurnDice} onChange={e => setSkipTurnDice(e.target.checked)} />
                            <span style={{ fontSize: 12, color: '#6a6a6a' }}>🎲 順番決めダイスをスキップ</span>
                        </label>
                        <label className="dt-checkbox-card" style={{ marginTop: 8 }}>
                            <input type="checkbox" checked={isCreative} onChange={e => setIsCreative(e.target.checked)} />
                            <span style={{ fontSize: 12, color: '#b8960f', fontWeight: 600 }}>🎨 クリエイティブモード</span>
                        </label>
                        <label className="dt-checkbox-card" style={{ marginTop: 8, background: 'rgba(46,204,113,0.04)', border: '1px solid rgba(46,204,113,0.1)', borderRadius: 8 }}>
                            <input type="checkbox" checked={isTestMode} onChange={e => setIsTestMode(e.target.checked)} />
                            <span style={{ fontSize: 11, color: '#5a8a5a' }}>🛠 検証用：無限移動モード</span>
                        </label>
                    </div>
                </div>

                {/* ===== START BUTTON ===== */}
                <div style={{ marginTop: 24, marginBottom: 32 }}>
                    <button className="dt-cta" onClick={handleStart}>
                        🎲 ゲームを開始する
                    </button>
                </div>
            </div>

            {/* ── Modals ── */}
            <CharacterSelect
                isOpen={charSelectTarget !== null}
                onClose={() => setCharSelectTarget(null)}
                onConfirm={(charKey, skinId) => {
                    setPlayers(prev => prev.map(p =>
                        p.id === charSelectTarget ? { ...p, charType: charKey, selectedSkin: skinId } : p
                    ));
                    setCharSelectTarget(null);
                }}
                initialCharKey={players.find(p => p.id === charSelectTarget)?.charType || 'athlete'}
                targetName={players.find(p => p.id === charSelectTarget)?.name || ''}
                isCreative={isCreative}
            />
            <MissionContainer isOpen={showMissionModal} onClose={() => setShowMissionModal(false)} />
        </div>
    );
};


/* ══════════════════════════════
   Sub-components
   ══════════════════════════════ */

/**
 * PlayerRow — 1人分のプレイヤー行
 */
const PlayerRow = ({ player: p, colorDot, charAssignMode, onUpdate, onRemove, onCharSelect, canRemove }) => {
    const charData = charInfo[p.charType];
    const diff = CPU_DIFFICULTY[p.cpuDifficulty || 'normal'];

    return (
        <div className="dt-player-row">
            {/* Color dot */}
            <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: colorDot, flexShrink: 0,
            }} />

            {/* Character icon */}
            <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${colorDot}18`, border: `1.5px solid ${colorDot}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                {charAssignMode === 'random' || (charAssignMode === 'cpu_random' && p.isCPU) ? (
                    <span style={{ fontSize: 14, color: 'var(--dt-text-dim)' }}>🎲</span>
                ) : (
                    <CharImage charType={p.charType} skinId={p.selectedSkin} size={28} />
                )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                        className="dt-input"
                        type="text"
                        value={p.name}
                        onChange={e => onUpdate('name', e.target.value)}
                        maxLength={10}
                        style={{ padding: '4px 8px', fontSize: 13, fontWeight: 700, width: 90, background: 'transparent', border: '1px solid transparent' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(200,162,78,0.3)'; }}
                        onBlur={e => { e.target.style.borderColor = 'transparent'; }}
                    />
                    {/* Team color dot */}
                    {p.teamColor !== 'none' && (
                        <span style={{ fontSize: 10 }}>{TEAM_COLORS[p.teamColor]?.icon}</span>
                    )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--dt-text-muted)', marginTop: 2 }}>
                    {charAssignMode === 'random' ? 'ランダム' : charAssignMode === 'cpu_random' && p.isCPU ? 'ランダム' : charData?.name || p.charType}
                    {' ・ '}
                    {p.isCPU ? 'CPU' : '人間'}
                </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                {p.isCPU && (
                    <select
                        value={p.cpuDifficulty || 'normal'}
                        onChange={e => onUpdate('cpuDifficulty', e.target.value)}
                        style={{
                            fontSize: 10, color: '#fff', fontWeight: 700,
                            background: diff.color, border: 'none',
                            borderRadius: 4, padding: '2px 6px',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        <option value="easy">弱め</option>
                        <option value="normal">普通</option>
                        <option value="hard">鬼畜</option>
                    </select>
                )}

                {/* Team select */}
                <select
                    value={p.teamColor}
                    onChange={e => onUpdate('teamColor', e.target.value)}
                    style={{
                        fontSize: 10, color: 'var(--dt-text-dim)',
                        background: 'transparent', border: '1px solid var(--dt-border)',
                        borderRadius: 4, padding: '2px 4px',
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    {Object.entries(TEAM_COLORS).map(([key, t]) => (
                        <option key={key} value={key}>{t.icon} {t.label}</option>
                    ))}
                </select>

                {/* Type toggle */}
                <select
                    value={p.isCPU ? 'cpu' : 'human'}
                    onChange={e => onUpdate('isCPU', e.target.value === 'cpu')}
                    style={{
                        fontSize: 10, color: 'var(--dt-text-dim)',
                        background: 'transparent', border: '1px solid var(--dt-border)',
                        borderRadius: 4, padding: '2px 4px',
                        cursor: 'pointer', fontFamily: 'inherit',
                    }}
                >
                    <option value="human">人間</option>
                    <option value="cpu">CPU</option>
                </select>

                {/* Char change button */}
                {charAssignMode === 'choose' && !(charAssignMode === 'cpu_random' && p.isCPU) && (
                    <button
                        onClick={onCharSelect}
                        style={{
                            fontSize: 11, color: 'var(--dt-gold)',
                            border: '1px solid rgba(200,162,78,0.2)',
                            borderRadius: 6, padding: '3px 8px',
                            background: 'transparent', cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        変更
                    </button>
                )}

                {/* Remove */}
                {canRemove && (
                    <button
                        onClick={onRemove}
                        style={{
                            fontSize: 11, color: '#e74c3c',
                            border: '1px solid rgba(231,76,60,0.2)',
                            borderRadius: 6, padding: '3px 6px',
                            background: 'transparent', cursor: 'pointer',
                            fontFamily: 'inherit',
                        }}
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
};


/**
 * RmapTile — ランダムマップ設定のトグルタイル
 */
const RmapTile = ({ label, active, onClick }) => (
    <div
        className={`dt-rmap-tile ${active ? 'active' : ''}`}
        onClick={onClick}
    >
        {label}
    </div>
);