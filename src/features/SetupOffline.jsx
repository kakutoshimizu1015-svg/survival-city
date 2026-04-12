import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { charInfo } from '../constants/characters';
import { genSmallMap, genMediumMap, genLargeMap, genCustomMap } from '../constants/maps';
import { randomizeTileTypes, randomizeTileLayout, randomizeStartPosition, scatterPlayerPositions } from '../utils/mapRandomizer';
import { useUserStore } from '../store/useUserStore';
import { savePlayerName } from '../utils/userLogic';
import { CharacterSelect } from './CharacterSelect';
import { CharImage } from '../components/common/CharImage';
import { MissionContainer } from '../components/common/mission/MissionContainer'; // ▼ ミッションモーダルを追加

// ▼ 修正: 6色に拡張（紫、橙を追加）
const TEAM_COLORS = { 
    none:   { label:'ソロ', color:'transparent', icon:'⚪' }, 
    red:    { label:'赤', color:'#e74c3c', icon:'🔴' }, 
    blue:   { label:'青', color:'#3498db', icon:'🔵' }, // 🟢から🔵に修正
    green:  { label:'緑', color:'#2ecc71', icon:'🟢' }, // greenが抜けていたので追加
    yellow: { label:'黄', color:'#f1c40f', icon:'🟡' },
    purple: { label:'紫', color:'#9b59b6', icon:'🟣' }, 
    orange: { label:'橙', color:'#e67e22', icon:'🟠' }  
};

export const SetupOffline = () => {
    const setGameState = useGameStore(state => state.setGameState);
    const globalPlayerName = useUserStore(state => state.playerName);
    
    const [players, setPlayers] = useState([
        { id: 0, name: globalPlayerName || 'P1', charType: 'athlete', isCPU: false, teamColor: 'none', selectedSkin: null }, 
        { id: 1, name: 'CPU1', charType: 'sales', isCPU: true, teamColor: 'none', selectedSkin: null, cpuDifficulty: 'normal' }
    ]);
    
    const [mapSize, setMapSize] = useState('midtown'); // ★デフォルトをmidtownに変更
    const [maxRounds, setMaxRounds] = useState(20);
    const [skipTurnDice, setSkipTurnDice] = useState(false);
    const [isCreative, setIsCreative] = useState(false);
    
    const [isTestMode, setIsTestMode] = useState(false);

    const [rmapTileType, setRmapTileType] = useState(false);
    const [rmapLayout, setRmapLayout] = useState(false);
    const [rmapStart, setRmapStart] = useState(false);
    const [rmapScatter, setRmapScatter] = useState(false);
    const [charAssignMode, setCharAssignMode] = useState('choose'); 
    
    const [charSelectTarget, setCharSelectTarget] = useState(null);

    const [showMissionModal, setShowMissionModal] = useState(false); // ▼ ミッションモーダル制御用のステートを追加

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#e91e8c'];

    useEffect(() => {
        if (globalPlayerName) {
            setPlayers(prev => prev.map(p => p.id === 0 ? { ...p, name: globalPlayerName } : p));
        }
    }, [globalPlayerName]);

    const addPlayer = (isCPU) => {
        if (players.length >= 8) return;
        setPlayers([...players, { id: players.length, name: isCPU ? `CPU${players.length + 1}` : `P${players.length + 1}`, charType: 'survivor', isCPU, teamColor: 'none', selectedSkin: null, cpuDifficulty: 'normal' }]);
    };
    
    const updatePlayer = (id, key, value) => {
        setPlayers(players.map(p => p.id === id ? { ...p, [key]: value } : p));
    };

    const removePlayer = (id) => { 
        if (players.length > 2) setPlayers(players.filter(p => p.id !== id).map((p, idx) => ({ ...p, id: idx }))); 
    };

    // ▼ 追加: ランダムチーム分けとリセット機能
    const handleRandomizeTeams = () => {
        // ▼ 修正: 抽選プールを6色に増強
        const teamColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        const numTeams = Math.min(Math.max(2, Math.floor(players.length / 2)), teamColors.length);
        const teamPool = teamColors.slice(0, numTeams);
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        
        setPlayers(players.map(p => {
            const idx = shuffled.findIndex(s => s.id === p.id);
            return { ...p, teamColor: teamPool[idx % numTeams] };
        }));
    };

    const handleClearTeams = () => {
        setPlayers(players.map(p => ({ ...p, teamColor: 'none' })));
    };

    const drawInitialCard = () => {
        const rarePool = [12, 13, 35, 36, 37];
        const normalPool = [0,1,2,3,4,5,6,7,8,9,10,11,14,15,16,17,18,19,20,24,25,26,27,28,29,30,31,32,33,34];
        if (Math.random() < 0.05) return rarePool[Math.floor(Math.random() * rarePool.length)];
        return normalPool[Math.floor(Math.random() * normalPool.length)];
    };

    const handleStart = async () => {
        const p1Name = players.find(p => p.id === 0)?.name;
        if (p1Name && p1Name.trim() !== '') {
            await savePlayerName(p1Name);
        }

        let mapData = mapSize === 'small' ? genSmallMap() : mapSize === 'medium' ? genMediumMap() : mapSize === 'midtown' ? genCustomMap() : genLargeMap();
        if (rmapTileType) mapData = randomizeTileTypes(mapData);
        if (rmapLayout) mapData = randomizeTileLayout(mapData);

        if (isTestMode) {
            mapData = mapData.map(t => ({
                ...t, type: 'normal', name: '道', fieldCans: 0, fieldTrash: 0
            }));
        }

        let finalPlayers = [...players];
        const allChars = Object.keys(charInfo);
        
        const { equippedSkins } = useUserStore.getState();

        if (charAssignMode === 'random') { 
            finalPlayers.forEach(p => p.charType = allChars[Math.floor(Math.random() * allChars.length)]); 
        } else if (charAssignMode === 'cpu_random') { 
            finalPlayers.forEach(p => { 
                if (p.isCPU) p.charType = allChars[Math.floor(Math.random() * allChars.length)]; 
            }); 
        }

        // ★修正: ID:0決め打ちをやめ、病院マス(center)のIDを自動取得する
        let startPos = mapData.find(t => t.type === 'center')?.id || mapData[0].id; 
        let scatterPos = [];
        if (rmapScatter) scatterPos = scatterPlayerPositions(mapData, finalPlayers.length);
        else if (rmapStart) startPos = randomizeStartPosition(mapData);

        const creativeHand = Array.from({length: 38}, (_, i) => i);
        
        finalPlayers = finalPlayers.map((p, i) => ({
            ...p, color: colors[i % colors.length], pos: rmapScatter ? scatterPos[i] : startPos, 
            skinId: p.selectedSkin || equippedSkins[p.charType] || "default",
            hp: isTestMode ? 9999 : 100, p: 15, ap: isTestMode ? 9999 : 0,   
            hand: isCreative ? [...creativeHand] : [drawInitialCard(), drawInitialCard(), drawInitialCard()], 
            maxHand: isCreative ? 99 : (p.charType === 'hacker' ? 9 : 7),
            cans: 0, trash: 0, kills: 0, deaths: 0, equip: {}
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
            finalPlayers = finalPlayers.sort(() => Math.random() - 0.5).map((p, idx) => ({ ...p, id: idx, color: colors[idx % 8] }));
        }

        const maxId = mapData.length - 1;
        const canTrashTiles = mapData.filter(t => t.type === 'can' || t.type === 'trash');
        
        setGameState({
            mapData, players: finalPlayers, turn: 0, roundCount: 1, maxRounds, diceRolled: false, gameOver: false, gamePhase: 'playing',
            turnOrderActive, turnOrderData,
            truckPos: isTestMode ? -1 : Math.floor(maxId * 0.4), 
            policePos: isTestMode ? -1 : Math.floor(maxId * 0.8), 
            unclePos: isTestMode ? -1 : Math.floor(maxId * 0.2), 
            animalPos: isTestMode ? -1 : (canTrashTiles.length > 0 ? canTrashTiles[Math.floor(Math.random() * canTrashTiles.length)].id : Math.floor(maxId * 0.3)), 
            yakuzaPos: isTestMode ? -1 : Math.floor(maxId * 0.5), 
            loansharkPos: isTestMode ? -1 : Math.floor(maxId * 0.6), 
            friendPos: isTestMode ? -1 : Math.floor(maxId * 0.15)
        });
    };

    return (
        <div id="setup-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fdf5e6', width: '100vw', overflowY: 'auto' }}>
            
            <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '10px 0' }}>
                    <h2 style={{ fontSize: '32px', textShadow: '2px 2px 4px #000', margin: 0 }}>🏠 ゲーム設定</h2>
                    <button 
                        onClick={() => setShowMissionModal(true)} 
                        className="btn-clay" 
                        style={{ background: '#e67e22', padding: '8px 16px', fontSize: '16px', fontWeight: 'bold' }}
                    >
                        🏆 ミッション
                    </button>
                </div>
                
                <div className="panel" style={{ width: '90%', maxWidth: '800px', marginBottom: '15px', padding: '20px' }}>
                    <h3 style={{ borderBottom: '2px solid #8d7b68', paddingBottom: '5px', margin: '0 0 10px 0', color: '#5c4a44' }}>👥 プレイヤー設定 ({players.length}/8人)</h3>
                    
                    {players.map((p, idx) => (
                        <div key={p.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', background: 'rgba(92, 74, 68, 0.1)', padding: '8px', borderRadius: '8px', flexWrap: 'wrap' }}>
                            <div style={{ width: '16px', height: '16px', backgroundColor: colors[idx % colors.length], borderRadius: '50%' }}></div>
                            
                            <input 
                                type="text" 
                                value={p.name} 
                                onChange={e => updatePlayer(p.id, 'name', e.target.value)} 
                                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '90px' }} 
                                maxLength={10}
                            />
                            
                            <select value={p.isCPU ? 'cpu' : 'human'} onChange={e => updatePlayer(p.id, 'isCPU', e.target.value === 'cpu')} style={{ padding: '6px', borderRadius: '4px' }}>
                                <option value="human">人間</option>
                                <option value="cpu">CPU</option>
                            </select>
                            
                            {/* ▼ 追加: CPU難易度セレクタ */}
                            {p.isCPU && (
                                <select 
                                    value={p.cpuDifficulty || 'normal'} 
                                    onChange={e => updatePlayer(p.id, 'cpuDifficulty', e.target.value)} 
                                    title='CPU難易度'
                                    style={{ 
                                        padding: '6px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', border: 'none', minWidth: '80px',
                                        background: p.cpuDifficulty === 'easy' ? '#27ae60' : p.cpuDifficulty === 'hard' ? '#c0392b' : '#e67e22', 
                                        color: 'white' 
                                    }}
                                >
                                    <option value="easy">弱め</option>
                                    <option value="normal">普通</option>
                                    <option value="hard">鬼畜</option>
                                </select>
                            )}
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '90px', justifyContent: 'center' }}>
                                {charAssignMode === 'random' ? (
                                    <span style={{ fontSize: '12px', color: '#b0a090' }}>🎲 ランダム</span>
                                ) : charAssignMode === 'cpu_random' && p.isCPU ? (
                                    <span style={{ fontSize: '12px', color: '#b0a090' }}>🤖 ランダム</span>
                                ) : (
                                    <>
                                        <CharImage charType={p.charType} skinId={p.selectedSkin} size={30} />
                                        <button onClick={() => setCharSelectTarget(p.id)} className="btn-clay" style={{ padding: '4px 8px', fontSize: '12px', background: '#3498db' }}>変更</button>
                                    </>
                                )}
                            </div>
                            
                            <select value={p.teamColor} onChange={e => updatePlayer(p.id, 'teamColor', e.target.value)} style={{ padding: '6px', borderRadius: '4px' }}>
                                {Object.entries(TEAM_COLORS).map(([key, t]) => <option key={key} value={key}>{t.icon} {t.label}</option>)}
                            </select>
                            
                            {players.length > 2 && <button onClick={() => removePlayer(p.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>✕</button>}
                        </div>
                    ))}
                    
                    {/* ▼ 修正: チーム分けとリセットボタンを追加 */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => addPlayer(false)} className="btn-clay btn-green" style={{ padding: '8px 12px' }}>＋ 人間</button>
                        <button onClick={() => addPlayer(true)} className="btn-clay btn-blue" style={{ padding: '8px 12px' }}>＋ CPU</button>
                        <button onClick={handleRandomizeTeams} className="btn-clay" style={{ background: '#8e44ad', color: 'white', padding: '8px 12px' }}>🎲 ランダムチーム</button>
                        <button onClick={handleClearTeams} className="btn-clay" style={{ background: '#95a5a6', color: 'white', padding: '8px 12px' }}>⚪ チームリセット</button>
                    </div>
                </div>
                
                <div className="panel" style={{ width: '90%', maxWidth: '800px', marginBottom: '20px', padding: '20px', background: '#8d6e63', borderColor: '#4a3b32' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#fdf5e6' }}>🗺️ ゲームルール設定</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', marginBottom: '15px' }}>
                      <label style={{ color: '#fdf5e6', fontWeight: 'bold' }}>マップ: <select value={mapSize} onChange={e => setMapSize(e.target.value)} style={{ marginLeft: '8px', padding: '6px', borderRadius: '4px' }}><option value="midtown">midtown(46)</option></select></label>
                        <label style={{ color: '#fdf5e6', fontWeight: 'bold' }}>ラウンド: <select value={maxRounds} onChange={e => setMaxRounds(Number(e.target.value))} style={{ marginLeft: '8px', padding: '6px', borderRadius: '4px' }}>{[1, 5, 10, 15, 20, 30].map(r => <option key={r} value={r}>{r}R</option>)}</select></label>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                        <label style={{ color: '#fdf5e6', cursor: 'pointer' }}><input type="checkbox" checked={skipTurnDice} onChange={e => setSkipTurnDice(e.target.checked)} /> 🎲 順番決めダイスをスキップ</label>
                        <label style={{ color: '#f1c40f', cursor: 'pointer', fontWeight: 'bold' }}><input type="checkbox" checked={isCreative} onChange={e => setIsCreative(e.target.checked)} /> 🎨 クリエイティブモード</label>
                        
                        <label style={{ color: '#2ecc71', cursor: 'pointer', fontWeight: 'bold', background: 'rgba(46, 204, 113, 0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid #2ecc71' }}>
                            <input type="checkbox" checked={isTestMode} onChange={e => setIsTestMode(e.target.checked)} style={{ marginRight: '8px' }} /> 
                            🛠 検証用：無限移動モード（全マス道＆AP無限＆NPCなし）
                        </label>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px', border: '2px solid #5c4a44', marginBottom: '15px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f1c40f', textAlign: 'center', marginBottom: '8px' }}>🎲 ランダムマップ設定</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                            <label style={{ background: rmapTileType ? '#6d5c00' : '#4a3b32', padding: '6px 10px', borderRadius: '6px', color: '#fdf5e6', cursor: 'pointer' }}><input type="checkbox" checked={rmapTileType} onChange={e => setRmapTileType(e.target.checked)} /> 🔀 マス種類</label>
                            <label style={{ background: rmapLayout ? '#6d5c00' : '#4a3b32', padding: '6px 10px', borderRadius: '6px', color: '#fdf5e6', cursor: 'pointer' }}><input type="checkbox" checked={rmapLayout} onChange={e => setRmapLayout(e.target.checked)} /> 📐 マス配置</label>
                            <label style={{ background: rmapStart ? '#6d5c00' : '#4a3b32', padding: '6px 10px', borderRadius: '6px', color: '#fdf5e6', cursor: 'pointer' }}><input type="checkbox" checked={rmapStart} onChange={e => setRmapStart(e.target.checked)} /> 🏁 開始位置</label>
                            <label style={{ background: rmapScatter ? '#6d5c00' : '#4a3b32', padding: '6px 10px', borderRadius: '6px', color: '#fdf5e6', cursor: 'pointer' }}><input type="checkbox" checked={rmapScatter} onChange={e => setRmapScatter(e.target.checked)} /> 🧭 バラバラ</label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={() => setCharAssignMode('choose')} className="btn-clay" style={{ background: charAssignMode === 'choose' ? '#2ecc71' : '', opacity: charAssignMode === 'choose' ? 1 : 0.6, padding: '8px 12px' }}>🎭 各自選択</button>
                        <button onClick={() => setCharAssignMode('cpu_random')} className="btn-clay" style={{ background: charAssignMode === 'cpu_random' ? '#e67e22' : '', opacity: charAssignMode === 'cpu_random' ? 1 : 0.6, padding: '8px 12px' }}>🤖 CPUのみ🎲</button>
                        <button onClick={() => setCharAssignMode('random')} className="btn-clay" style={{ background: charAssignMode === 'random' ? '#8e44ad' : '', opacity: charAssignMode === 'random' ? 1 : 0.6, color: 'white', padding: '8px 12px' }}>🎲 全員ランダム</button>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
                    <button className="btn-large" style={{ background: '#7f8c8d' }} onClick={() => setGameState({ gamePhase: 'mode_select' })}>◀ 戻る</button>
                    <button className="btn-large btn-brown" onClick={handleStart} style={{ padding: '15px 40px', fontSize: '20px' }}>🎲 ゲームを開始する</button>
                </div>

                <CharacterSelect 
                    isOpen={charSelectTarget !== null}
                    onClose={() => setCharSelectTarget(null)}
                    onConfirm={(charKey, skinId) => {
                        setPlayers(prev => prev.map(p => p.id === charSelectTarget ? { ...p, charType: charKey, selectedSkin: skinId } : p));
                        setCharSelectTarget(null);
                    }}
                    initialCharKey={players.find(p => p.id === charSelectTarget)?.charType || 'athlete'}
                    targetName={players.find(p => p.id === charSelectTarget)?.name || ""}
                />
            </div>
            <MissionContainer isOpen={showMissionModal} onClose={() => setShowMissionModal(false)} />
        </div>
    );
};