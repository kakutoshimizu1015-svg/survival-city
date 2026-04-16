import React, { useState, useEffect } from 'react';
import { useNetworkStore } from '../store/useNetworkStore';
import { useGameStore } from '../store/useGameStore';
import { genSmallMap, genMediumMap, genLargeMap, genCustomMap } from '../constants/maps';
import { charEmoji, charInfo } from '../constants/characters';
import { randomizeTileTypes, randomizeTileLayout, randomizeStartPosition, scatterPlayerPositions } from '../utils/mapRandomizer';
import { useUserStore } from '../store/useUserStore';
import { CharacterSelect } from './CharacterSelect';
import { CharImage } from '../components/common/CharImage';
import { FriendListModal } from '../components/common/FriendListModal';
import { UserProfileModal } from '../components/common/UserProfileModal';
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

const RmapTile = ({ label, active, onClick }) => (
    <div className={`dt-rmap-tile ${active ? 'active' : ''}`} onClick={onClick}>{label}</div>
);


export const OnlineLobby = () => {
    const globalPlayerName = useUserStore(state => state.playerName);
    const equippedSkins = useUserStore(state => state.equippedSkins);

    const [playerName, setPlayerName] = useState(globalPlayerName || 'Player' + Math.floor(Math.random() * 1000));
    const [roomInput, setRoomInput] = useState('');

    const [mapSize, setMapSize] = useState('midtown');
    const [maxRounds, setMaxRounds] = useState(20);
    const [skipTurnDice, setSkipTurnDice] = useState(false);
    const [isCreative, setIsCreative] = useState(false);
    const [rmapTileType, setRmapTileType] = useState(false);
    const [rmapLayout, setRmapLayout] = useState(false);
    const [rmapStart, setRmapStart] = useState(false);
    const [rmapScatter, setRmapScatter] = useState(false);
    const [charAssignMode, setCharAssignMode] = useState('choose');

    const [gameDetailsOpen, setGameDetailsOpen] = useState(false);
    const [teamModeEnabled, setTeamModeEnabled] = useState(false);

    const [charSelectTarget, setCharSelectTarget] = useState(null);
    const [showFriendModal, setShowFriendModal] = useState(false);
    const [selectedProfileUid, setSelectedProfileUid] = useState(null);
    const [showMissionModal, setShowMissionModal] = useState(false);
    const [devOpen, setDevOpen] = useState(false);

    const {
        createRoom, joinRoom, leaveRoom, status, roomId, lobbyPlayers, isHost, broadcast,
        activeRooms, subscribeToRooms, unsubscribeFromRooms, updateRoomStatus,
        myUserId, updateMyInfo, addCpu, updateCpu, removeCpu, randomizeTeams, clearTeams
    } = useNetworkStore();

    const setGameState = useGameStore(state => state.setGameState);

    const handleRandomizeTeamsWrap = () => {
        setTeamModeEnabled(true);
        randomizeTeams();
    };

    const handleClearTeamsWrap = () => {
        setTeamModeEnabled(false);
        clearTeams();
    };

    useEffect(() => { if (globalPlayerName) setPlayerName(globalPlayerName); }, [globalPlayerName]);

    useEffect(() => {
        if (status === 'connected' && myUserId) {
            const myChar = lobbyPlayers.find(p => p.userId === myUserId)?.charType || 'athlete';
            updateMyInfo({ skinId: equippedSkins[myChar] || 'default' });
        }
    }, [status, myUserId, equippedSkins]);

    useEffect(() => {
        subscribeToRooms();
        return () => {
            unsubscribeFromRooms();
            if (useGameStore.getState().gamePhase !== 'playing') leaveRoom();
        };
    }, []);

    const handleCreate = () => createRoom(Math.random().toString(36).substring(2, 6).toUpperCase(), playerName);
    const handleJoin = (targetRoomId) => { const code = targetRoomId || roomInput; if (code.length > 0) joinRoom(code.toUpperCase(), playerName); };

    const drawInitialCard = () => {
        const rarePool = [12, 13, 35, 36, 37];
        const normalPool = [0,1,2,3,4,5,6,7,8,9,10,11,14,15,16,17,18,19,20,24,25,26,27,28,29,30,31,32,33,34];
        if (Math.random() < 0.05) return rarePool[Math.floor(Math.random() * rarePool.length)];
        return normalPool[Math.floor(Math.random() * normalPool.length)];
    };

    const handleStartGame = async () => {
        if (!isHost) return;
        await updateRoomStatus('playing');

        let mapData = mapSize === 'small' ? genSmallMap() : mapSize === 'medium' ? genMediumMap() : mapSize === 'midtown' ? genCustomMap() : genLargeMap();
        if (rmapTileType) mapData = randomizeTileTypes(mapData);
        if (rmapLayout) mapData = randomizeTileLayout(mapData);

        let finalPlayers = [...lobbyPlayers];
        const allChars = Object.keys(charInfo);

        if (charAssignMode === 'random') {
            finalPlayers.forEach(p => p.charType = allChars[Math.floor(Math.random() * allChars.length)]);
        } else if (charAssignMode === 'cpu_random') {
            finalPlayers.forEach(p => { if (p.isCPU) p.charType = allChars[Math.floor(Math.random() * allChars.length)]; });
        }

        let startPos = mapData.find(t => t.type === 'center')?.id || mapData[0].id;
        let scatterPos = [];
        if (rmapScatter) scatterPos = scatterPlayerPositions(mapData, finalPlayers.length);
        else if (rmapStart) startPos = randomizeStartPosition(mapData);

        const creativeHand = Array.from({ length: 38 }, (_, i) => i);
        finalPlayers = finalPlayers.map((p, i) => ({
            ...p, id: i, color: PLAYER_COLORS[i % 8],
            pos: rmapScatter ? scatterPos[i] : startPos,
            skinId: p.skinId || 'default',
            // ▼ 修正: 億万長者の場合は初期Pが +15 されて 30P でスタートする
            hp: 100, p: p.charType === 'billionaire' ? 30 : 15, ap: 0,
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

        const initialGameState = {
            mapData, players: finalPlayers, turn: 0, roundCount: 1, maxRounds, diceRolled: false, gameOver: false,
            turnOrderActive, turnOrderData,
            truckPos: Math.floor(maxId * 0.4), policePos: Math.floor(maxId * 0.8), unclePos: Math.floor(maxId * 0.2),
            animalPos: canTrashTiles.length > 0 ? canTrashTiles[Math.floor(Math.random() * canTrashTiles.length)].id : Math.floor(maxId * 0.3),
            yakuzaPos: Math.floor(maxId * 0.5), loansharkPos: Math.floor(maxId * 0.6), friendPos: Math.floor(maxId * 0.15),
        };

        broadcast({ type: 'GAME_START', gameState: initialGameState });
        setGameState({ ...initialGameState, gamePhase: 'playing' });
    };


    /* ══════════════════════════════════════════
       接続済み → ロビー画面
       ══════════════════════════════════════════ */
    if (status === 'connected') {
        const myInfo = lobbyPlayers.find(p => p.userId === myUserId) || { name: playerName, charType: 'athlete', teamColor: 'none' };

        return (
            <div className="dt-screen">
                {/* ── Header ── */}
                <div className="dt-sticky-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--dt-text-dim)', letterSpacing: 1 }}>ONLINE LOBBY</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--dt-text)' }}>
                            🌐 部屋コード【 {roomId} 】
                        </div>
                    </div>
                    <button
                        onClick={() => setShowMissionModal(true)}
                        style={{
                            fontSize: 11, color: 'var(--dt-orange)',
                            border: '1px solid rgba(230,126,34,0.3)', borderRadius: 6, padding: '4px 10px',
                            background: 'rgba(230,126,34,0.08)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                        }}
                    >
                        🏆 ミッション
                    </button>
                </div>

                <div style={{ padding: '16px 20px', flex: 1 }}>

                    {/* ===== MEMBERS ===== */}
                    <div className="dt-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>MEMBERS ({lobbyPlayers.length}/8)</span>
                        <button
                            onClick={() => setShowFriendModal(true)}
                            style={{
                                fontSize: 11, color: 'var(--dt-blue)', background: 'rgba(52,152,219,0.08)',
                                border: '1px solid rgba(52,152,219,0.2)', borderRadius: 6, padding: '3px 10px',
                                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                            }}
                        >
                            ✉️ フレンドを招待
                        </button>
                    </div>
                    <div className="dt-card">
                        {isHost && (
                            <div style={{ marginBottom: 16 }}>
                                <button
                                    className="dt-card-interactive"
                                    style={{ width: '100%', padding: '12px', background: 'linear-gradient(145deg, rgba(52,152,219,0.1), rgba(52,152,219,0.2))', borderColor: 'rgba(52,152,219,0.4)', color: '#3498db', fontWeight: 900, fontSize: 13, textAlign: 'center', boxShadow: 'none' }}
                                    onClick={addCpu}
                                >
                                    + 🤖 CPUを追加
                                </button>
                            </div>
                        )}

                        {lobbyPlayers.map(p => {
                            const diff = CPU_DIFFICULTY[p.cpuDifficulty || 'normal'];
                            return (
                                <div key={p.userId} className="dt-player-row">
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: TEAM_COLORS[p.teamColor]?.color || 'transparent', flexShrink: 0 }} />
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(200,162,78,0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                                    }}>
                                        <CharImage charType={p.charType} skinId={p.skinId} size={28} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dt-text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                            {isHost && p.isCPU ? (
                                                <input
                                                    className="dt-input"
                                                    type="text" value={p.name}
                                                    onChange={e => updateCpu(p.userId, { name: e.target.value })}
                                                    style={{ width: 80, padding: '3px 6px', fontSize: 13, fontWeight: 700, background: 'transparent', border: '1px solid transparent' }}
                                                    onFocus={e => { e.target.style.borderColor = 'rgba(200,162,78,0.3)'; }}
                                                    onBlur={e => { e.target.style.borderColor = 'transparent'; }}
                                                />
                                            ) : (
                                                <span>{p.name}</span>
                                            )}
                                            
                                            {isHost && p.isCPU && (
                                                <select
                                                    value={p.cpuDifficulty || 'normal'}
                                                    onChange={e => updateCpu(p.userId, { cpuDifficulty: e.target.value })}
                                                    style={{ fontSize: 10, color: '#fff', fontWeight: 700, background: diff.color, border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontFamily: 'inherit' }}
                                                >
                                                    <option value="easy">弱め</option>
                                                    <option value="normal">普通</option>
                                                    <option value="hard">鬼畜</option>
                                                </select>
                                            )}

                                            {p.isHost && <span style={{ fontSize: 9, background: 'rgba(231,76,60,0.15)', color: '#e74c3c', padding: '1px 5px', borderRadius: 4 }}>HOST</span>}
                                            {p.isCPU && <span style={{ fontSize: 9, background: 'rgba(150,150,150,0.15)', color: '#888', padding: '1px 5px', borderRadius: 4 }}>CPU</span>}
                                            {p.userId === myUserId && <span style={{ fontSize: 10, color: 'var(--dt-gold)' }}>(あなた)</span>}
                                            
                                            {teamModeEnabled && p.teamColor !== 'none' && (
                                                <span style={{ fontSize: 10 }}>{TEAM_COLORS[p.teamColor]?.icon}</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--dt-text-muted)', marginTop: 2 }}>{charInfo[p.charType]?.name}</div>
                                    </div>

                                    {isHost && p.isCPU && (
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                                            {teamModeEnabled && (
                                                <select value={p.teamColor} onChange={e => updateCpu(p.userId, { teamColor: e.target.value })} style={{
                                                    fontSize: 10, color: 'var(--dt-text-dim)', background: 'transparent', border: '1px solid var(--dt-border)', borderRadius: 4, padding: '4px', cursor: 'pointer', fontFamily: 'inherit',
                                                }}>
                                                    {Object.entries(TEAM_COLORS).map(([k, t]) => <option key={k} value={k} style={{ background: '#2a221a', color: '#fff' }}>{t.icon} {t.label}</option>)}
                                                </select>
                                            )}
                                            
                                            <button onClick={() => setCharSelectTarget(p.userId)} style={{
                                                fontSize: 12, color: 'var(--dt-gold)', fontWeight: 'bold', border: '1px solid rgba(200,162,78,0.5)',
                                                borderRadius: 6, padding: '5px 12px', background: 'rgba(200,162,78,0.15)', cursor: 'pointer', fontFamily: 'inherit',
                                            }}>キャラクター変更</button>

                                            <button onClick={() => removeCpu(p.userId)} style={{
                                                fontSize: 11, color: '#e74c3c', border: '1px solid rgba(231,76,60,0.2)',
                                                borderRadius: 6, padding: '5px 8px', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                                            }}>✕</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ===== MY SETTINGS ===== */}
                    <div className="dt-section-label">MY SETTINGS</div>
                    <div className="dt-card">
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: 'rgba(200,162,78,0.1)', border: '1.5px solid rgba(200,162,78,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                }}>
                                    <CharImage charType={myInfo.charType} skinId={myInfo.skinId} size={32} />
                                </div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dt-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {myInfo.name}
                                        {teamModeEnabled && myInfo.teamColor !== 'none' && (
                                            <span style={{ fontSize: 10 }}>{TEAM_COLORS[myInfo.teamColor]?.icon}</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'var(--dt-gold)' }}>★ {charInfo[myInfo.charType]?.name}</div>
                                </div>
                            </div>
                            <button onClick={() => setCharSelectTarget(myUserId)} style={{
                                fontSize: 12, color: 'var(--dt-gold)', fontWeight: 'bold', border: '1px solid rgba(200,162,78,0.5)',
                                borderRadius: 6, padding: '5px 12px', background: 'rgba(200,162,78,0.15)', cursor: 'pointer', fontFamily: 'inherit',
                            }}>キャラクター変更</button>
                            
                            {teamModeEnabled && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ fontSize: 11, color: 'var(--dt-text-dim)' }}>チーム:</span>
                                    <select value={myInfo.teamColor || 'none'} onChange={e => updateMyInfo({ teamColor: e.target.value })} style={{
                                        fontSize: 10, color: 'var(--dt-text-dim)', background: 'transparent', border: '1px solid var(--dt-border)',
                                        borderRadius: 4, padding: '4px', cursor: 'pointer', fontFamily: 'inherit',
                                    }}>
                                        {Object.entries(TEAM_COLORS).map(([k, t]) => <option key={k} value={k} style={{ background: '#2a221a', color: '#fff' }}>{t.icon} {t.label}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 8 }}>{charInfo[myInfo.charType]?.desc}</div>
                    </div>

                    {/* ===== HOST CONTROLS ===== */}
                    {isHost ? (
                        <>
                            {/* GAME SETTINGS */}
                            <div className="dt-section-label">GAME SETTINGS</div>
                            <div className="dt-card">
                                {/* RULES */}
                                <div style={{ fontSize: 12, color: 'var(--dt-text)', fontWeight: 600, marginBottom: 8 }}>🗺️ マップとラウンド数</div>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ position: 'relative' }}>
                                            <select className="dt-select" value={mapSize} onChange={e => setMapSize(e.target.value)} style={{ backgroundColor: '#2a221a', color: '#fdf5e6' }}>
                                                <option value="midtown" style={{ backgroundColor: '#2a221a', color: '#fdf5e6' }}>midtown (46)</option>
                                            </select>
                                            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--dt-text-muted)', pointerEvents: 'none' }}>▼</span>
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ position: 'relative' }}>
                                            <select className="dt-select" value={maxRounds} onChange={e => setMaxRounds(Number(e.target.value))} style={{ backgroundColor: '#2a221a', color: '#fdf5e6' }}>
                                                {[1, 5, 10, 15, 20, 30].map(r => <option key={r} value={r} style={{ backgroundColor: '#2a221a', color: '#fdf5e6' }}>{r}R</option>)}
                                            </select>
                                            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--dt-text-muted)', pointerEvents: 'none' }}>▼</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ゲーム詳細 Accordion */}
                                <div
                                    className={`dt-collapsible-header ${gameDetailsOpen ? 'open' : ''}`}
                                    onClick={() => setGameDetailsOpen(!gameDetailsOpen)}
                                    style={{ marginTop: 16, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 12, color: 'var(--dt-text)' }}>⚙️</span>
                                        <span style={{ fontSize: 12, color: 'var(--dt-text)', fontWeight: 600 }}>ゲーム詳細</span>
                                    </div>
                                    <span className={`dt-collapsible-chevron ${gameDetailsOpen ? 'open' : ''}`}>▼</span>
                                </div>

                                <div className={`dt-collapsible-body ${gameDetailsOpen ? 'open' : ''}`}>
                                    <div className="dt-collapsible-body-inner" style={{ paddingTop: 16 }}>

                                        {/* チーム設定 */}
                                        <div style={{ fontSize: 12, color: 'var(--dt-text)', fontWeight: 600, marginBottom: 8 }}>🤝 チーム設定</div>
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                                            <button className="dt-add-btn" style={{ flex: 1, color: '#8a6aaa', borderColor: 'rgba(155,89,182,0.3)', padding: '8px' }} onClick={handleRandomizeTeamsWrap}>🎲 ランダムチーム構成</button>
                                            {teamModeEnabled && (
                                                <button className="dt-add-btn" style={{ flex: 1, color: '#8a8a8a', borderColor: 'rgba(150,150,150,0.3)', padding: '8px' }} onClick={handleClearTeamsWrap}>⚪ チームリセット</button>
                                            )}
                                        </div>

                                        {/* CHARACTER */}
                                        <div style={{ fontSize: 12, color: 'var(--dt-text)', fontWeight: 600, marginBottom: 8 }}>🎭 キャラクターの決め方</div>
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                                            {[
                                                { key: 'cpu_random', label: 'CPUのみ🎲', color: 'var(--dt-orange)' },
                                                { key: 'random',     label: '全員ランダム', color: 'var(--dt-purple)' },
                                            ].map(opt => (
                                                <button
                                                    key={opt.key}
                                                    className={`dt-pill ${charAssignMode === opt.key ? 'active' : ''}`}
                                                    style={charAssignMode === opt.key
                                                        ? { background: `${opt.color}18`, borderColor: opt.color, color: opt.color }
                                                        : { opacity: 0.6 }
                                                    }
                                                    onClick={() => setCharAssignMode(prev => prev === opt.key ? 'choose' : opt.key)}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* RANDOMIZE */}
                                        <div style={{ fontSize: 12, color: 'var(--dt-text)', fontWeight: 600, marginBottom: 8 }}>🔀 ランダム化（上級者向け）</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                            <RmapTile label="マスの種類をシャッフル" active={rmapTileType} onClick={() => setRmapTileType(!rmapTileType)} />
                                            <RmapTile label="マスの配置をシャッフル" active={rmapLayout} onClick={() => setRmapLayout(!rmapLayout)} />
                                            <RmapTile label="開始位置をランダム" active={rmapStart} onClick={() => setRmapStart(!rmapStart)} />
                                            <RmapTile label="スタート位置をバラバラ" active={rmapScatter} onClick={() => setRmapScatter(!rmapScatter)} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DEVELOPER TOOL */}
                            <div className={`dt-collapsible-header ${devOpen ? 'open' : ''}`} onClick={() => setDevOpen(!devOpen)}>
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
                                </div>
                            </div>

                            {/* START */}
                            <div style={{ marginTop: 24, marginBottom: 16 }}>
                                <button className="dt-cta" onClick={handleStartGame} style={{ padding: '22px', fontSize: '18px', boxShadow: '0 8px 32px rgba(230,126,34,0.4)', borderRadius: '16px' }}>
                                    🎲 全員でゲーム開始！
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            textAlign: 'center', padding: '30px 0',
                            fontSize: 16, fontWeight: 700, color: 'var(--dt-gold)',
                            animation: 'dt-blink 2s ease-in-out infinite',
                        }}>
                            ⏳ ホストがゲームを開始するのを待っています...
                        </div>
                    )}

                    {/* EXIT */}
                    <button
                        onClick={() => { leaveRoom(); setGameState({ gamePhase: 'mode_select' }); }}
                        style={{
                            width: '100%', padding: 14, borderRadius: 12, fontSize: 14, fontWeight: 700,
                            background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)',
                            color: '#e74c3c', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 32,
                        }}
                    >
                        🚪 退室する
                    </button>
                </div>

                {/* ── Modals ── */}
                <CharacterSelect
                    isOpen={charSelectTarget !== null}
                    onClose={() => setCharSelectTarget(null)}
                    onConfirm={(charKey, skinId) => {
                        if (charSelectTarget === myUserId) updateMyInfo({ charType: charKey, skinId });
                        else updateCpu(charSelectTarget, { charType: charKey, skinId });
                        setCharSelectTarget(null);
                    }}
                    initialCharKey={charSelectTarget === myUserId ? myInfo.charType : lobbyPlayers.find(p => p.userId === charSelectTarget)?.charType || 'athlete'}
                    targetName={charSelectTarget === myUserId ? 'あなた' : lobbyPlayers.find(p => p.userId === charSelectTarget)?.name || 'CPU'}
                />
                {showFriendModal && (
                    <FriendListModal onClose={() => setShowFriendModal(false)} onSelectFriend={(uid) => setSelectedProfileUid(uid)} currentRoomId={roomId} />
                )}
                {selectedProfileUid && (
                    <UserProfileModal uid={selectedProfileUid} onClose={() => setSelectedProfileUid(null)} />
                )}
                <MissionContainer isOpen={showMissionModal} onClose={() => setShowMissionModal(false)} />
            </div>
        );
    }


    /* ══════════════════════════════════════════
       未接続 → ロビー選択 / 部屋作成画面
       ══════════════════════════════════════════ */
    return (
        <div className="dt-screen">
            {/* ── Header ── */}
            <div className="dt-sticky-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button className="dt-back-btn" onClick={() => setGameState({ gamePhase: 'mode_select' })}>◀</button>
                    <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--dt-text)' }}>🌐 オンライン対戦</span>
                </div>
                <button
                    onClick={() => setShowMissionModal(true)}
                    style={{
                        fontSize: 11, color: 'var(--dt-orange)',
                        border: '1px solid rgba(230,126,34,0.3)', borderRadius: 6, padding: '4px 10px',
                        background: 'rgba(230,126,34,0.08)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
                    }}
                >
                    🏆 ミッション
                </button>
            </div>

            <div style={{ padding: '16px 20px', flex: 1 }}>

                {/* ===== PLAYER INFO ===== */}
                <div className="dt-section-label">PLAYER INFO</div>
                <div className="dt-card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(200,162,78,0.1)', border: '1px solid rgba(200,162,78,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        👤
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'var(--dt-text-dim)', marginBottom: 4 }}>プレイヤー表示名</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dt-text)' }}>{playerName}</div>
                        <div style={{ fontSize: 10, color: 'var(--dt-text-muted)' }}>名前の変更はモード選択画面で可能です</div>
                    </div>
                </div>

                {/* ===== CREATE ROOM ===== */}
                <div className="dt-section-label">CREATE ROOM</div>
                <button className="dt-cta" onClick={handleCreate} disabled={status === 'connecting'} style={{ marginBottom: 24, padding: '20px', borderRadius: '16px', fontSize: '16px', boxShadow: '0 8px 32px rgba(230,126,34,0.4)' }}>
                    👑 部屋を新しく作る
                </button>

                {/* ===== JOIN ROOM ===== */}
                <div className="dt-section-label">JOIN ROOM</div>
                <div className="dt-card" style={{ marginBottom: 20, background: 'rgba(52,152,219,0.04)', borderColor: 'rgba(52,152,219,0.2)' }}>
                    <div style={{ fontSize: 12, color: 'var(--dt-text)', fontWeight: 600, marginBottom: 8 }}>コードを入力して参加</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            className="dt-input"
                            type="text" placeholder="部屋コードを入力"
                            value={roomInput} onChange={e => setRoomInput(e.target.value)}
                            style={{ flex: 1, borderColor: 'rgba(52,152,219,0.3)', background: 'rgba(28,22,14,0.95)' }}
                        />
                        <button
                            onClick={() => handleJoin()}
                            disabled={status === 'connecting' || roomInput === ''}
                            style={{
                                background: 'rgba(52,152,219,0.12)', border: '1px solid rgba(52,152,219,0.4)',
                                borderRadius: 8, padding: '8px 20px', color: '#3498db',
                                fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                                opacity: (status === 'connecting' || roomInput === '') ? 0.4 : 1,
                            }}
                        >
                            参加
                        </button>
                    </div>
                    {status === 'error' && (
                        <div style={{ color: '#e74c3c', fontSize: 12, marginTop: 10, fontWeight: 700 }}>⚠️ 接続エラーが発生しました。</div>
                    )}
                </div>

                {/* ===== ACTIVE ROOMS ===== */}
                <div className="dt-section-label">ACTIVE ROOMS</div>
                <div className="dt-card" style={{ minHeight: 120 }}>
                    {activeRooms.length === 0 ? (
                        <div style={{ color: '#555', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
                            現在募集中の部屋はありません
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {activeRooms.map(room => (
                                <div key={room.roomId} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 10,
                                    border: '1px solid var(--dt-border)',
                                }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dt-text)' }}>👑 {room.hostName} の部屋</div>
                                        <div style={{ fontSize: 11, color: 'var(--dt-gold)', marginTop: 3 }}>コード: {room.roomId}</div>
                                    </div>
                                    <button
                                        onClick={() => handleJoin(room.roomId)}
                                        disabled={status === 'connecting'}
                                        style={{
                                            background: 'rgba(52,152,219,0.12)', border: '1px solid rgba(52,152,219,0.3)',
                                            borderRadius: 8, padding: '8px 16px', color: 'var(--dt-blue)',
                                            fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                                        }}
                                    >
                                        参加
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ▼ 修正: MissionModal → MissionContainer (これがエラーの原因だった) */}
            <MissionContainer isOpen={showMissionModal} onClose={() => setShowMissionModal(false)} />
        </div>
    );
};
