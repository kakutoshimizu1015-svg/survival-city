import React, { useState, useEffect } from 'react';
import { useNetworkStore } from '../store/useNetworkStore';
import { useGameStore } from '../store/useGameStore';
import { genSmallMap, genMediumMap, genLargeMap } from '../constants/maps';
import { charEmoji, charInfo } from '../constants/characters';
import { randomizeTileTypes, randomizeTileLayout, randomizeStartPosition, scatterPlayerPositions } from '../utils/mapRandomizer';
// ▼ 追加：ユーザー情報の取得用
import { useUserStore } from '../store/useUserStore';

const TEAM_COLORS = { 
    none: { label:'ソロ', color:'transparent', icon:'⚪' }, 
    red: { label:'赤', color:'#e74c3c', icon:'🔴' }, 
    blue: { label:'青', color:'#3498db', icon:'🔵' }, 
    green: { label:'緑', color:'#2ecc71', icon:'🟢' }, 
    yellow: { label:'黄', color:'#f1c40f', icon:'🟡' } 
};

export const OnlineLobby = () => {
    // ▼ 修正：useUserStore から名前を取得し、ローカルの初期値にする
    const globalPlayerName = useUserStore(state => state.playerName);
    const [playerName, setPlayerName] = useState(globalPlayerName || 'Player' + Math.floor(Math.random() * 1000));
    
    const [roomInput, setRoomInput] = useState('');
    
    // ホスト設定用
    const [mapSize, setMapSize] = useState('medium'); 
    const [maxRounds, setMaxRounds] = useState(20);
    const [skipTurnDice, setSkipTurnDice] = useState(false);
    const [isCreative, setIsCreative] = useState(false);
    const [rmapTileType, setRmapTileType] = useState(false);
    const [rmapLayout, setRmapLayout] = useState(false);
    const [rmapStart, setRmapStart] = useState(false);
    const [rmapScatter, setRmapScatter] = useState(false);
    const [charAssignMode, setCharAssignMode] = useState('choose'); 
    
    const { 
        createRoom, joinRoom, leaveRoom, status, roomId, lobbyPlayers, isHost, broadcast, 
        activeRooms, subscribeToRooms, unsubscribeFromRooms, updateRoomStatus,
        myUserId, updateMyInfo, addCpu, updateCpu, removeCpu, randomizeTeams, clearTeams
    } = useNetworkStore();
    
    const setGameState = useGameStore(state => state.setGameState);

    // ▼ 追加：グローバルな名前が非同期でロードされた場合にローカルステートを更新
    useEffect(() => {
        if (globalPlayerName) {
            setPlayerName(globalPlayerName);
        }
    }, [globalPlayerName]);

    useEffect(() => {
        subscribeToRooms();
        return () => {
            unsubscribeFromRooms();
            if (useGameStore.getState().gamePhase !== 'playing') leaveRoom();
        };
    }, []);

    const handleCreate = () => createRoom(Math.random().toString(36).substring(2, 6).toUpperCase(), playerName);
    const handleJoin = (targetRoomId) => { const code = targetRoomId || roomInput; if (code.length > 0) joinRoom(code.toUpperCase(), playerName); };

    const handleStartGame = async () => {
        if (!isHost) return;
        await updateRoomStatus('playing');

        let mapData = mapSize === 'small' ? genSmallMap() : mapSize === 'medium' ? genMediumMap() : genLargeMap();
        if (rmapTileType) mapData = randomizeTileTypes(mapData);
        if (rmapLayout) mapData = randomizeTileLayout(mapData);

        let finalPlayers = [...lobbyPlayers];
        const allChars = Object.keys(charInfo);
        const shuffledChars = [...allChars].sort(() => Math.random() - 0.5);
        if (charAssignMode === 'random') { finalPlayers.forEach((p, i) => p.charType = shuffledChars[i % shuffledChars.length]); } 
        else if (charAssignMode === 'cpu_random') { let cpuIdx = 0; finalPlayers.forEach(p => { if (p.isCPU) { p.charType = shuffledChars[cpuIdx % shuffledChars.length]; cpuIdx++; } }); }

        let startPos = 0; let scatterPos = [];
        if (rmapScatter) scatterPos = scatterPlayerPositions(mapData, finalPlayers.length);
        else if (rmapStart) startPos = randomizeStartPosition(mapData);

        const creativeHand = Array.from({length: 38}, (_, i) => i);
        finalPlayers = finalPlayers.map((p, i) => ({
            ...p, id: i, color: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#e91e8c'][i % 8],
            pos: rmapScatter ? scatterPos[i] : startPos, hp: 100, p: 15, ap: 0,
            hand: isCreative ? [...creativeHand] : [Math.floor(Math.random() * 38), Math.floor(Math.random() * 38), Math.floor(Math.random() * 38)], 
            maxHand: isCreative ? 99 : (p.charType === 'hacker' ? 9 : 7), cans: 0, trash: 0, kills: 0, deaths: 0, equip: {}
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
            finalPlayers = finalPlayers.sort(() => Math.random() - 0.5).map((p, idx) => ({ ...p, id: idx, color: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#e91e8c'][idx % 8] }));
        }

        const maxId = mapData.length - 1;
        const canTrashTiles = mapData.filter(t => t.type === 'can' || t.type === 'trash');
        
        const initialGameState = {
            mapData, players: finalPlayers, turn: 0, roundCount: 1, maxRounds, diceRolled: false, gameOver: false,
            turnOrderActive, turnOrderData,
            truckPos: Math.floor(maxId * 0.4), policePos: Math.floor(maxId * 0.8), unclePos: Math.floor(maxId * 0.2), 
            animalPos: canTrashTiles.length > 0 ? canTrashTiles[Math.floor(Math.random() * canTrashTiles.length)].id : Math.floor(maxId * 0.3), 
            yakuzaPos: Math.floor(maxId * 0.5), loansharkPos: Math.floor(maxId * 0.6), friendPos: Math.floor(maxId * 0.15)
        };

        broadcast({ type: 'GAME_START', gameState: initialGameState });
        setGameState({ ...initialGameState, gamePhase: 'playing' });
    };

    if (status === 'connected') {
        const myInfo = lobbyPlayers.find(p => p.userId === myUserId) || { name: playerName, charType: 'athlete', teamColor: 'none' };

        return (
            <div id="setup-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: '#fdf5e6', overflowY: 'auto', height: '100vh' }}>
                <h2>🌐 ロビー: 部屋コード【 {roomId} 】</h2>
                
                {/* ▼ 参加者リスト */}
                <div className="panel" style={{ width: '100%', maxWidth: '650px', marginBottom: '20px' }}>
                    <h3 style={{ borderBottom: '2px solid #8d7b68', paddingBottom: '10px' }}>👥 参加者リスト ({lobbyPlayers.length}/8)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {lobbyPlayers.map(p => (
                            <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(92, 74, 68, 0.4)', padding: '10px', borderRadius: '8px', borderLeft: p.teamColor !== 'none' ? `5px solid ${TEAM_COLORS[p.teamColor]?.color}` : 'none' }}>
                                <div style={{ fontSize: '24px' }}>{charEmoji[p.charType] || '🏃'}</div>
                                <div style={{ fontWeight: 'bold', color: TEAM_COLORS[p.teamColor]?.color || '#fff' }}>{p.name}</div>
                                {p.isHost && <span style={{ background: '#e74c3c', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>HOST</span>}
                                {p.isCPU && <span style={{ background: '#95a5a6', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>CPU</span>}
                                {p.userId === myUserId && <span style={{ color: '#f1c40f', fontSize: '11px' }}>(あなた)</span>}
                                
                                {/* ホストによるCPUの直接編集 */}
                                {isHost && p.isCPU && (
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                        <input type="text" value={p.name} onChange={e => updateCpu(p.userId, { name: e.target.value })} style={{ padding: '4px', borderRadius: '4px', width: '70px', fontSize: '12px' }} />
                                        <select value={p.charType} onChange={e => updateCpu(p.userId, { charType: e.target.value })} style={{ padding: '4px', borderRadius: '4px', fontSize: '12px' }}>
                                            {Object.entries(charInfo).map(([k, info]) => <option key={k} value={k}>{info.name}</option>)}
                                        </select>
                                        <select value={p.teamColor} onChange={e => updateCpu(p.userId, { teamColor: e.target.value })} style={{ padding: '4px', borderRadius: '4px', fontSize: '12px' }}>
                                            {Object.entries(TEAM_COLORS).map(([k, t]) => <option key={k} value={k}>{t.icon} {t.label}</option>)}
                                        </select>
                                        <button onClick={() => removeCpu(p.userId)} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>✕</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ▼ 全員共通：自分の設定 */}
                <div className="panel" style={{ width: '100%', maxWidth: '650px', marginBottom: '20px' }}>
                    <h3 style={{ borderBottom: '2px solid #8d7b68', paddingBottom: '10px', color: '#fdf5e6', marginTop: 0 }}>🎭 自分の設定を変更する</h3>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* ▼ 名前変更を無効化（名前の変更はモード選択画面で行うため） */}
                        <label style={{ fontWeight: 'bold' }}>名前: <input type="text" value={myInfo.name || ''} readOnly style={{ padding: '8px', borderRadius: '4px', width: '100px', background: '#d7ccc8', color: '#5c4a44', cursor: 'not-allowed' }} title="名前の変更はモード選択画面で行ってください" /></label>
                        <label style={{ fontWeight: 'bold' }}>キャラ: 
                            <select value={myInfo.charType || 'athlete'} onChange={e => updateMyInfo({ charType: e.target.value })} style={{ padding: '8px', borderRadius: '4px', marginLeft: '5px' }}>
                                {Object.entries(charInfo).map(([k, info]) => <option key={k} value={k}>{info.name}</option>)}
                            </select>
                        </label>
                        <label style={{ fontWeight: 'bold' }}>チーム: 
                            <select value={myInfo.teamColor || 'none'} onChange={e => updateMyInfo({ teamColor: e.target.value })} style={{ padding: '8px', borderRadius: '4px', marginLeft: '5px' }}>
                                {Object.entries(TEAM_COLORS).map(([k, t]) => <option key={k} value={k}>{t.icon} {t.label}</option>)}
                            </select>
                        </label>
                    </div>
                    <div style={{ fontSize: '12px', color: '#bdc3c7', marginTop: '10px' }}>{charInfo[myInfo.charType]?.desc}</div>
                </div>

                {/* ▼ ホスト専用設定 */}
                {isHost ? (
                    <div className="panel" style={{ width: '100%', maxWidth: '650px', marginBottom: '20px', background: '#8d6e63', borderColor: '#4a3b32' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#fdf5e6' }}>👑 ホスト専用コントロール</h3>

                        {/* CPUとチームの操作 */}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <button onClick={addCpu} className="btn-clay btn-blue" style={{ padding: '8px 15px' }}>＋ CPUを追加</button>
                            <button onClick={randomizeTeams} className="btn-clay" style={{ background: '#8e44ad', color: 'white', padding: '8px 15px' }}>🎲 ランダムチーム分け</button>
                            <button onClick={clearTeams} className="btn-clay" style={{ background: '#95a5a6', color: 'white', padding: '8px 15px' }}>⚪ チームリセット</button>
                        </div>

                        {/* 以下マップ設定 */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', marginBottom: '15px' }}>
                            <label style={{ color: '#fdf5e6', fontWeight: 'bold' }}>マップ: <select value={mapSize} onChange={e => setMapSize(e.target.value)} style={{ marginLeft: '8px', padding: '6px', borderRadius: '4px' }}><option value="small">小(12)</option><option value="medium">中(48)</option><option value="large">大(75)</option></select></label>
                            <label style={{ color: '#fdf5e6', fontWeight: 'bold' }}>ラウンド: <select value={maxRounds} onChange={e => setMaxRounds(Number(e.target.value))} style={{ marginLeft: '8px', padding: '6px', borderRadius: '4px' }}>{[1, 5, 10, 15, 20, 30].map(r => <option key={r} value={r}>{r}R</option>)}</select></label>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                            <label style={{ color: '#fdf5e6', cursor: 'pointer' }}><input type="checkbox" checked={skipTurnDice} onChange={e => setSkipTurnDice(e.target.checked)} /> 🎲 順番決めダイスをスキップ</label>
                            <label style={{ color: '#f1c40f', cursor: 'pointer', fontWeight: 'bold' }}><input type="checkbox" checked={isCreative} onChange={e => setIsCreative(e.target.checked)} /> 🎨 クリエイティブモード</label>
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '8px', border: '2px solid #5c4a44', marginBottom: '15px' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f1c40f', textAlign: 'center', marginBottom: '8px' }}>🎲 ランダムマップ</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                                <label style={{ color: '#fdf5e6' }}><input type="checkbox" checked={rmapTileType} onChange={e => setRmapTileType(e.target.checked)} /> 🔀 マス種類</label>
                                <label style={{ color: '#fdf5e6' }}><input type="checkbox" checked={rmapLayout} onChange={e => setRmapLayout(e.target.checked)} /> 📐 マス配置</label>
                                <label style={{ color: '#fdf5e6' }}><input type="checkbox" checked={rmapStart} onChange={e => setRmapStart(e.target.checked)} /> 🏁 開始位置</label>
                                <label style={{ color: '#fdf5e6' }}><input type="checkbox" checked={rmapScatter} onChange={e => setRmapScatter(e.target.checked)} /> 🧭 バラバラ</label>
                            </div>
                        </div>
                        <button className="btn-large btn-blue" onClick={handleStartGame} style={{ width: '100%', marginTop: '10px', padding: '15px', fontSize: '20px' }}>🎲 全員でゲーム開始！</button>
                    </div>
                ) : (
                    <p style={{ fontSize: '20px', color: '#f1c40f', fontWeight: 'bold', margin: '30px 0' }}>⏳ ホストがゲームを開始するのを待っています...</p>
                )}
                <button className="btn-large" style={{ marginTop: '20px', background: '#e74c3c' }} onClick={() => { leaveRoom(); setGameState({ gamePhase: 'mode_select' }); }}>🚪 退室する</button>
            </div>
        );
    }

    // --- 部屋を作る/探す画面 ---
    return (
        <div id="setup-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: '#fdf5e6', width: '100vw' }}>
            <h2 style={{ fontSize: '32px' }}>🌐 オンライン対戦</h2>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div className="panel" style={{ width: '350px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* ▼ 名前入力は App.jsx で行うため ReadOnly（表示のみ）に変更 */}
                    <div>
                        <label>プレイヤー名:</label>
                        <input 
                            type="text" 
                            value={playerName} 
                            readOnly
                            title="名前の変更はモード選択画面で行ってください"
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', background: '#d7ccc8', color: '#5c4a44', cursor: 'not-allowed' }} 
                        />
                    </div>
                    <hr style={{ borderColor: '#5c4a44' }} />
                    <button className="btn-large btn-green" onClick={handleCreate} disabled={status === 'connecting'}>👑 部屋を新しく作る</button>
                    <div style={{ textAlign: 'center', margin: '5px 0' }}>または手動で入力</div>
                    <div style={{ display: 'flex', gap: '10px' }}><input type="text" placeholder="コード入力" value={roomInput} onChange={e => setRoomInput(e.target.value)} style={{ flexGrow: 1, padding: '10px', borderRadius: '4px' }} /><button className="btn-clay btn-blue" onClick={() => handleJoin()} disabled={status === 'connecting' || roomInput === ''}>参加</button></div>
                </div>
                <div className="panel" style={{ width: '400px', height: '350px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ borderBottom: '2px solid #8d7b68', paddingBottom: '10px', marginBottom: '15px' }}>📡 募集中の部屋</h3>
                    <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '10px' }}>
                        {activeRooms.length === 0 ? <div style={{ color: '#bdc3c7', textAlign: 'center', marginTop: '80px' }}>現在募集中の部屋はありません</div> : activeRooms.map(room => (
                            <div key={room.roomId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(92, 74, 68, 0.4)', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                                <div><div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fdf5e6' }}>👑 {room.hostName} の部屋</div><div style={{ fontSize: '12px', color: '#f1c40f', marginTop: '4px' }}>コード: {room.roomId}</div></div>
                                <button className="btn-clay btn-blue" style={{ padding: '10px 20px' }} onClick={() => handleJoin(room.roomId)} disabled={status === 'connecting'}>参加</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <button className="btn-large" style={{ marginTop: '30px', background: '#7f8c8d' }} onClick={() => setGameState({ gamePhase: 'mode_select' })}>◀ 戻る</button>
        </div>
    );
};