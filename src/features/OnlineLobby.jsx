import React, { useState, useEffect } from 'react';
import { useNetworkStore } from '../store/useNetworkStore';
import { useGameStore } from '../store/useGameStore';
import { genSmallMap, genMediumMap, genLargeMap } from '../constants/maps';
import { charEmoji, charInfo } from '../constants/characters';
import { randomizeTileTypes, randomizeTileLayout, randomizeStartPosition, scatterPlayerPositions } from '../utils/mapRandomizer';
import { useUserStore } from '../store/useUserStore';
import { CharacterSelect } from './CharacterSelect';
import { CharImage } from '../components/common/CharImage';
import { sendFriendRequest, acceptFriendRequest, removeFriendRequest, sendRoomInvite, deleteInvite } from '../utils/userLogic';

const TEAM_COLORS = { 
    none: { label:'ソロ', color:'transparent', icon:'⚪' }, 
    red: { label:'赤', color:'#e74c3c', icon:'🔴' }, 
    blue: { label:'青', color:'#3498db', icon:'🔵' }, 
    green: { label:'緑', color:'#2ecc71', icon:'🟢' }, 
    yellow: { label:'黄', color:'#f1c40f', icon:'🟡' } 
};

export const OnlineLobby = () => {
    const globalPlayerName = useUserStore(state => state.playerName);
    const equippedSkins = useUserStore(state => state.equippedSkins);
    const myUid = useUserStore(state => state.uid);

    // ▼ 新規追加: フレンド・招待用ステートの読み込み
    const friends = useUserStore(state => state.friends) || [];
    const friendRequests = useUserStore(state => state.friendRequests) || [];
    const invites = useUserStore(state => state.invites) || [];

    const [playerName, setPlayerName] = useState(globalPlayerName || 'Player' + Math.floor(Math.random() * 1000));
    const [roomInput, setRoomInput] = useState('');
    const [targetUidInput, setTargetUidInput] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    
    const [mapSize, setMapSize] = useState('medium'); 
    const [maxRounds, setMaxRounds] = useState(20);
    const [skipTurnDice, setSkipTurnDice] = useState(false);
    const [isCreative, setIsCreative] = useState(false);
    const [rmapTileType, setRmapTileType] = useState(false);
    const [rmapLayout, setRmapLayout] = useState(false);
    const [rmapStart, setRmapStart] = useState(false);
    const [rmapScatter, setRmapScatter] = useState(false);
    const [charAssignMode, setCharAssignMode] = useState('choose'); 

    const [charSelectTarget, setCharSelectTarget] = useState(null);
    
    const { 
        createRoom, joinRoom, leaveRoom, status, roomId, lobbyPlayers, isHost, broadcast, 
        activeRooms, subscribeToRooms, unsubscribeFromRooms, updateRoomStatus,
        myUserId, updateMyInfo, addCpu, updateCpu, removeCpu, randomizeTeams, clearTeams
    } = useNetworkStore();
    
    const setGameState = useGameStore(state => state.setGameState);

    useEffect(() => {
        if (globalPlayerName) {
            setPlayerName(globalPlayerName);
        }
    }, [globalPlayerName]);

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

    const handleSendFriendReq = () => {
        if (targetUidInput) {
            sendFriendRequest(targetUidInput);
            setTargetUidInput('');
            alert('フレンド申請を送信しました！');
        }
    };

    const drawInitialCard = () => {
        const rarePool = [12, 13, 35, 36, 37];
        const normalPool = [0,1,2,3,4,5,6,7,8,9,10,11,14,15,16,17,18,19,20,24,25,26,27,28,29,30,31,32,33,34];
        if (Math.random() < 0.05) return rarePool[Math.floor(Math.random() * rarePool.length)];
        return normalPool[Math.floor(Math.random() * normalPool.length)];
    };

    const handleStartGame = async () => {
        if (!isHost) return;
        await updateRoomStatus('playing');

        let mapData = mapSize === 'small' ? genSmallMap() : mapSize === 'medium' ? genMediumMap() : genLargeMap();
        if (rmapTileType) mapData = randomizeTileTypes(mapData);
        if (rmapLayout) mapData = randomizeTileLayout(mapData);

        let finalPlayers = [...lobbyPlayers];
        const allChars = Object.keys(charInfo);
        
        if (charAssignMode === 'random') { 
            finalPlayers.forEach(p => p.charType = allChars[Math.floor(Math.random() * allChars.length)]); 
        } else if (charAssignMode === 'cpu_random') { 
            finalPlayers.forEach(p => { 
                if (p.isCPU) p.charType = allChars[Math.floor(Math.random() * allChars.length)]; 
            }); 
        }

        let startPos = 0; let scatterPos = [];
        if (rmapScatter) scatterPos = scatterPlayerPositions(mapData, finalPlayers.length);
        else if (rmapStart) startPos = randomizeStartPosition(mapData);

        const creativeHand = Array.from({length: 38}, (_, i) => i);
        finalPlayers = finalPlayers.map((p, i) => ({
            ...p, id: i, color: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#e91e8c'][i % 8],
            pos: rmapScatter ? scatterPos[i] : startPos, 
            skinId: p.skinId || 'default', 
            hp: 100, p: 15, ap: 0,
            hand: isCreative ? [...creativeHand] : [drawInitialCard(), drawInitialCard(), drawInitialCard()], 
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
            <div id="setup-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fdf5e6', overflowY: 'auto', height: '100vh', width: '100%' }}>
                <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <h2>🌐 ロビー: 部屋コード【 {roomId} 】</h2>
                    
                    <div className="panel" style={{ width: '100%', maxWidth: '650px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #8d7b68', paddingBottom: '10px', marginBottom: '10px' }}>
                            <h3 style={{ margin: 0 }}>👥 参加者リスト ({lobbyPlayers.length}/8)</h3>
                            {isHost && (
                                <button onClick={() => setShowInviteModal(true)} className="btn-clay btn-green" style={{ padding: '5px 10px', fontSize: '12px' }}>👥 フレンドを招待</button>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {lobbyPlayers.map(p => (
                                <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(92, 74, 68, 0.4)', padding: '10px', borderRadius: '8px', borderLeft: p.teamColor !== 'none' ? `5px solid ${TEAM_COLORS[p.teamColor]?.color}` : 'none' }}>
                                    <CharImage charType={p.charType} skinId={p.skinId} size={30} />
                                    <div style={{ fontWeight: 'bold', color: TEAM_COLORS[p.teamColor]?.color || '#fff' }}>{p.name}</div>
                                    {p.isHost && <span style={{ background: '#e74c3c', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>HOST</span>}
                                    {p.isCPU && <span style={{ background: '#95a5a6', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>CPU</span>}
                                    {p.userId === myUserId && <span style={{ color: '#f1c40f', fontSize: '11px' }}>(あなた)</span>}
                                    
                                    {isHost && p.isCPU && (
                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <input type="text" value={p.name} onChange={e => updateCpu(p.userId, { name: e.target.value })} style={{ padding: '4px', borderRadius: '4px', width: '70px', fontSize: '12px' }} />
                                            <button onClick={() => setCharSelectTarget(p.userId)} className="btn-clay" style={{ padding: '4px 8px', fontSize: '12px', background: '#e67e22' }}>変更</button>
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

                    <div className="panel" style={{ width: '100%', maxWidth: '650px', marginBottom: '20px' }}>
                        <h3 style={{ borderBottom: '2px solid #8d7b68', paddingBottom: '10px', color: '#fdf5e6', marginTop: 0 }}>🎭 自分の設定を変更する</h3>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <label style={{ fontWeight: 'bold' }}>名前: <input type="text" value={myInfo.name || ''} readOnly style={{ padding: '8px', borderRadius: '4px', width: '100px', background: '#d7ccc8', color: '#5c4a44', cursor: 'not-allowed' }} title="名前の変更はモード選択画面で行ってください" /></label>
                            
                            <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                キャラ: 
                                <CharImage charType={myInfo.charType} skinId={myInfo.skinId} size={30} style={{ marginLeft: 5 }} />
                                <button onClick={() => setCharSelectTarget(myUserId)} className="btn-clay" style={{ padding: '4px 8px', fontSize: '12px', background: '#3498db' }}>キャラ変更</button>
                            </label>
                            
                            <label style={{ fontWeight: 'bold' }}>チーム: 
                                <select value={myInfo.teamColor || 'none'} onChange={e => updateMyInfo({ teamColor: e.target.value })} style={{ padding: '8px', borderRadius: '4px', marginLeft: '5px' }}>
                                    {Object.entries(TEAM_COLORS).map(([k, t]) => <option key={k} value={k}>{t.icon} {t.label}</option>)}
                                </select>
                            </label>
                        </div>
                        <div style={{ fontSize: '12px', color: '#bdc3c7', marginTop: '10px' }}>{charInfo[myInfo.charType]?.desc}</div>
                    </div>

                    {isHost ? (
                        <div className="panel" style={{ width: '100%', maxWidth: '650px', marginBottom: '20px', background: '#8d6e63', borderColor: '#4a3b32' }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#fdf5e6' }}>👑 ホスト専用コントロール</h3>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                                <button onClick={addCpu} className="btn-clay btn-blue" style={{ padding: '8px 15px' }}>＋ CPUを追加</button>
                                <button onClick={randomizeTeams} className="btn-clay" style={{ background: '#8e44ad', color: 'white', padding: '8px 15px' }}>🎲 ランダムチーム分け</button>
                                <button onClick={clearTeams} className="btn-clay" style={{ background: '#95a5a6', color: 'white', padding: '8px 15px' }}>⚪ チームリセット</button>
                            </div>

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

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                                <button onClick={() => setCharAssignMode('choose')} className="btn-clay" style={{ background: charAssignMode === 'choose' ? '#2ecc71' : '', opacity: charAssignMode === 'choose' ? 1 : 0.6, padding: '8px 12px' }}>🎭 各自選択</button>
                                <button onClick={() => setCharAssignMode('cpu_random')} className="btn-clay" style={{ background: charAssignMode === 'cpu_random' ? '#e67e22' : '', opacity: charAssignMode === 'cpu_random' ? 1 : 0.6, padding: '8px 12px' }}>🤖 CPUのみ🎲</button>
                                <button onClick={() => setCharAssignMode('random')} className="btn-clay" style={{ background: charAssignMode === 'random' ? '#8e44ad' : '', opacity: charAssignMode === 'random' ? 1 : 0.6, color: 'white', padding: '8px 12px' }}>🎲 全員ランダム</button>
                            </div>

                            <button className="btn-large btn-blue" onClick={handleStartGame} style={{ width: '100%', marginTop: '20px', padding: '15px', fontSize: '20px' }}>🎲 全員でゲーム開始！</button>
                        </div>
                    ) : (
                        <p style={{ fontSize: '20px', color: '#f1c40f', fontWeight: 'bold', margin: '30px 0' }}>⏳ ホストがゲームを開始するのを待っています...</p>
                    )}
                    <button className="btn-large" style={{ marginTop: '20px', background: '#e74c3c' }} onClick={() => { leaveRoom(); setGameState({ gamePhase: 'mode_select' }); }}>🚪 退室する</button>

                    <CharacterSelect 
                        isOpen={charSelectTarget !== null}
                        onClose={() => setCharSelectTarget(null)}
                        onConfirm={(charKey, skinId) => {
                            if (charSelectTarget === myUserId) {
                                updateMyInfo({ charType: charKey, skinId });
                            } else {
                                updateCpu(charSelectTarget, { charType: charKey, skinId });
                            }
                            setCharSelectTarget(null);
                        }}
                        initialCharKey={charSelectTarget === myUserId ? myInfo.charType : lobbyPlayers.find(p => p.userId === charSelectTarget)?.charType || 'athlete'}
                        targetName={charSelectTarget === myUserId ? "あなた" : lobbyPlayers.find(p => p.userId === charSelectTarget)?.name || "CPU"}
                    />

                    {/* ▼ 新規追加: フレンド招待モーダル */}
                    {showInviteModal && (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="panel" style={{ width: '90%', maxWidth: '400px', padding: '20px' }}>
                                <h3 style={{ borderBottom: '2px solid #8d7b68', paddingBottom: '10px', marginTop: 0 }}>👥 フレンドを招待</h3>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '15px' }}>
                                    {friends.length === 0 ? <p style={{ textAlign: 'center', color: '#bdc3c7' }}>フレンドがいません</p> : friends.map(f => (
                                        <div key={f.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(92, 74, 68, 0.4)', padding: '10px', borderRadius: '8px', marginBottom: '5px' }}>
                                            <span>{f.name}</span>
                                            <button className="btn-clay btn-blue" onClick={() => { sendRoomInvite(f.uid, roomId); alert(`${f.name} に招待を送信しました`); }}>招待送信</button>
                                        </div>
                                    ))}
                                </div>
                                <button className="btn-large" style={{ width: '100%', background: '#7f8c8d' }} onClick={() => setShowInviteModal(false)}>閉じる</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div id="setup-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fdf5e6', width: '100vw', height: '100vh', overflowY: 'auto' }}>
            <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <h2 style={{ fontSize: '32px' }}>🌐 オンライン対戦</h2>
                
                {/* 中央：プロフィール */}
                <div className="panel" style={{ width: '350px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                    <div>
                        <label>プレイヤー名:</label>
                        <input 
                            type="text" value={playerName} readOnly title="名前の変更はモード選択画面で行ってください"
                            style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '4px', background: '#d7ccc8', color: '#5c4a44', cursor: 'not-allowed' }} 
                        />
                    </div>
                    <hr style={{ borderColor: '#5c4a44', width: '100%' }} />
                    <button className="btn-large btn-green" onClick={handleCreate} disabled={status === 'connecting'}>👑 部屋を新しく作る</button>
                    <div style={{ textAlign: 'center', margin: '5px 0' }}>または手動で入力</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="text" placeholder="コード入力" value={roomInput} onChange={e => setRoomInput(e.target.value)} style={{ flexGrow: 1, padding: '10px', borderRadius: '4px' }} />
                        <button className="btn-clay btn-blue" onClick={() => handleJoin()} disabled={status === 'connecting' || roomInput === ''}>参加</button>
                    </div>
                    {status === 'error' && <div style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px', fontWeight: 'bold' }}>接続エラーが発生しました。もう一度お試しください。</div>}
                </div>

                {/* 左右分割：部屋リストとフレンドリスト */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: '900px' }}>
                    
                    {/* 左：部屋リスト */}
                    <div className="panel" style={{ flex: '1 1 350px', height: '400px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ borderBottom: '2px solid #8d7b68', paddingBottom: '10px', marginBottom: '15px', marginTop: 0 }}>📡 募集中の部屋</h3>
                        <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '10px' }}>
                            {activeRooms.length === 0 ? <div style={{ color: '#bdc3c7', textAlign: 'center', marginTop: '80px' }}>現在募集中の部屋はありません</div> : activeRooms.map(room => (
                                <div key={room.roomId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(92, 74, 68, 0.4)', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                                    <div><div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fdf5e6' }}>👑 {room.hostName} の部屋</div><div style={{ fontSize: '12px', color: '#f1c40f', marginTop: '4px' }}>コード: {room.roomId}</div></div>
                                    <button className="btn-clay btn-blue" style={{ padding: '10px 20px' }} onClick={() => handleJoin(room.roomId)} disabled={status === 'connecting'}>参加</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 右：フレンド＆招待パネル ▼ 新規追加 */}
                    <div className="panel" style={{ flex: '1 1 350px', height: '400px', padding: '20px', display: 'flex', flexDirection: 'column', background: '#3e2723' }}>
                        <h3 style={{ borderBottom: '2px solid #8d7b68', paddingBottom: '10px', marginBottom: '15px', marginTop: 0 }}>👥 フレンド＆招待</h3>
                        
                        <div style={{ fontSize: '12px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            あなたのUID: 
                            <input type="text" value={myUid || ''} readOnly style={{ padding: '4px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid #5c4a44', borderRadius: '4px', width: '180px' }} onClick={e => e.target.select()} />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                            <input type="text" placeholder="相手のUIDを入力して追加" value={targetUidInput} onChange={e => setTargetUidInput(e.target.value)} style={{ flexGrow: 1, padding: '8px', borderRadius: '4px' }} />
                            <button className="btn-clay btn-blue" onClick={handleSendFriendReq} disabled={!targetUidInput}>申請</button>
                        </div>

                        <div style={{ flexGrow: 1, overflowY: 'auto', paddingRight: '5px' }}>
                            {/* 招待一覧 */}
                            {invites.length > 0 && (
                                <div style={{ marginBottom: '15px' }}>
                                    <div style={{ color: '#f1c40f', fontWeight: 'bold', marginBottom: '5px' }}>📩 届いた招待</div>
                                    {invites.map(inv => (
                                        <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(241, 196, 15, 0.2)', padding: '10px', borderRadius: '8px', marginBottom: '5px' }}>
                                            <div style={{ fontSize: '14px' }}>{inv.fromName} からの招待</div>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button className="btn-clay btn-green" style={{ padding: '4px 8px' }} onClick={() => { handleJoin(inv.roomId); deleteInvite(inv.id); }}>参加</button>
                                                <button className="btn-clay" style={{ background: '#e74c3c', padding: '4px 8px' }} onClick={() => deleteInvite(inv.id)}>✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 申請一覧 */}
                            {friendRequests.length > 0 && (
                                <div style={{ marginBottom: '15px' }}>
                                    <div style={{ color: '#e67e22', fontWeight: 'bold', marginBottom: '5px' }}>👤 届いたフレンド申請</div>
                                    {friendRequests.map(req => (
                                        <div key={req.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(230, 126, 34, 0.2)', padding: '10px', borderRadius: '8px', marginBottom: '5px' }}>
                                            <div style={{ fontSize: '14px' }}>{req.name}</div>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <button className="btn-clay btn-green" style={{ padding: '4px 8px' }} onClick={() => acceptFriendRequest(req.uid, req.name)}>承認</button>
                                                <button className="btn-clay" style={{ background: '#e74c3c', padding: '4px 8px' }} onClick={() => removeFriendRequest(req.uid)}>拒否</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* フレンド一覧 */}
                            <div style={{ color: '#2ecc71', fontWeight: 'bold', marginBottom: '5px' }}>🤝 フレンド一覧 ({friends.length})</div>
                            {friends.length === 0 ? <div style={{ fontSize: '12px', color: '#bdc3c7' }}>フレンドはいません</div> : (
                                friends.map(f => (
                                    <div key={f.uid} style={{ background: 'rgba(92, 74, 68, 0.4)', padding: '10px', borderRadius: '8px', marginBottom: '5px', fontSize: '14px' }}>
                                        {f.name}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>

                <button className="btn-large" style={{ marginTop: '30px', background: '#7f8c8d' }} onClick={() => setGameState({ gamePhase: 'mode_select' })}>◀ 戻る</button>
            </div>
        </div>
    );
};