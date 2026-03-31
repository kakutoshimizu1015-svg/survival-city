import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { charInfo } from '../constants/characters';
import { genSmallMap, genMediumMap, genLargeMap } from '../constants/maps';
import { randomizeTileTypes, randomizeTileLayout, randomizeStartPosition, scatterPlayerPositions } from '../utils/mapRandomizer';

const TEAM_COLORS = { none: { label:'ソロ', color:'transparent', icon:'⚪' }, red: { label:'赤', color:'#e74c3c', icon:'🔴' }, blue: { label:'青', color:'#3498db', icon:'🔵' }, green: { label:'緑', color:'#2ecc71', icon:'🟢' }, yellow: { label:'黄', color:'#f1c40f', icon:'🟡' } };

export const SetupOffline = () => {
    const setGameState = useGameStore(state => state.setGameState);
    const [players, setPlayers] = useState([{ id: 0, name: 'P1', charType: 'athlete', isCPU: false, teamColor: 'none' }, { id: 1, name: 'CPU1', charType: 'sales', isCPU: true, teamColor: 'none' }]);
    const [mapSize, setMapSize] = useState('medium'); 
    const [maxRounds, setMaxRounds] = useState(20);
    const [skipTurnDice, setSkipTurnDice] = useState(false);
    const [isCreative, setIsCreative] = useState(false);
    const [rmapTileType, setRmapTileType] = useState(false);
    const [rmapLayout, setRmapLayout] = useState(false);
    const [rmapStart, setRmapStart] = useState(false);
    const [rmapScatter, setRmapScatter] = useState(false);
    const [charAssignMode, setCharAssignMode] = useState('choose'); 

    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#e91e8c'];

    const addPlayer = (isCPU) => {
        if (players.length >= 8) return;
        setPlayers([...players, { id: players.length, name: isCPU ? `CPU${players.length + 1}` : `P${players.length + 1}`, charType: 'survivor', isCPU, teamColor: 'none' }]);
    };
    const updatePlayer = (id, key, value) => setPlayers(players.map(p => p.id === id ? { ...p, [key]: value } : p));
    const removePlayer = (id) => { if (players.length > 2) setPlayers(players.filter(p => p.id !== id).map((p, idx) => ({ ...p, id: idx }))); };

    const handleStart = () => {
        let mapData = mapSize === 'small' ? genSmallMap() : mapSize === 'medium' ? genMediumMap() : genLargeMap();
        if (rmapTileType) mapData = randomizeTileTypes(mapData);
        if (rmapLayout) mapData = randomizeTileLayout(mapData);

        let finalPlayers = [...players];
        const allChars = Object.keys(charInfo);
        const shuffledChars = [...allChars].sort(() => Math.random() - 0.5);
        if (charAssignMode === 'random') { finalPlayers.forEach((p, i) => p.charType = shuffledChars[i % shuffledChars.length]); } 
        else if (charAssignMode === 'cpu_random') { let cpuIdx = 0; finalPlayers.forEach(p => { if (p.isCPU) { p.charType = shuffledChars[cpuIdx % shuffledChars.length]; cpuIdx++; } }); }

        let startPos = 0; let scatterPos = [];
        if (rmapScatter) scatterPos = scatterPlayerPositions(mapData, finalPlayers.length);
        else if (rmapStart) startPos = randomizeStartPosition(mapData);

        const creativeHand = Array.from({length: 38}, (_, i) => i);
        finalPlayers = finalPlayers.map((p, i) => ({
            ...p, color: colors[i % colors.length], pos: rmapScatter ? scatterPos[i] : startPos, hp: 100, p: 15, ap: 0,
            hand: isCreative ? [...creativeHand] : [Math.floor(Math.random() * 38), Math.floor(Math.random() * 38), Math.floor(Math.random() * 38)], 
            maxHand: isCreative ? 99 : (p.charType === 'hacker' ? 9 : 7),
            cans: 0, trash: 0, kills: 0, deaths: 0, equip: {}
        }));

        let turnOrderData = null;
        let turnOrderActive = false;

        // ▼ 順番決めダイスのロジック
        if (!skipTurnDice) {
            const diceValues = finalPlayers.map(() => ({ d1: Math.floor(Math.random() * 6) + 1, d2: Math.floor(Math.random() * 6) + 1 }));
            const preRollData = finalPlayers.map((p, idx) => ({ idx, total: diceValues[idx].d1 + diceValues[idx].d2 }));
            preRollData.sort((a, b) => b.total !== a.total ? b.total - a.total : Math.random() - 0.5);
            const sortedOrder = preRollData.map(rd => rd.idx);
            
            turnOrderData = { players: finalPlayers, diceValues, sortedOrder };
            turnOrderActive = true;
        } else {
            // スキップ時は即座にシャッフルして適用
            finalPlayers = finalPlayers.sort(() => Math.random() - 0.5).map((p, idx) => ({ ...p, id: idx, color: colors[idx % 8] }));
        }

        const maxId = mapData.length - 1;
        const canTrashTiles = mapData.filter(t => t.type === 'can' || t.type === 'trash');
        
        setGameState({
            mapData, players: finalPlayers, turn: 0, roundCount: 1, maxRounds, diceRolled: false, gameOver: false, gamePhase: 'playing',
            turnOrderActive, turnOrderData, // ▼ ストアに送信
            truckPos: Math.floor(maxId * 0.4), policePos: Math.floor(maxId * 0.8), unclePos: Math.floor(maxId * 0.2), 
            animalPos: canTrashTiles.length > 0 ? canTrashTiles[Math.floor(Math.random() * canTrashTiles.length)].id : Math.floor(maxId * 0.3), 
            yakuzaPos: Math.floor(maxId * 0.5), loansharkPos: Math.floor(maxId * 0.6), friendPos: Math.floor(maxId * 0.15)
        });
    };

    // UI部分は前回と同じため省略せずそのまま（前回のSetupOfflineUIを維持）
    return (
        <div id="setup-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', color: '#fdf5e6', width: '100vw', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '32px', textShadow: '2px 2px 4px #000', margin: '10px 0' }}>🏠 ゲーム設定</h2>
            {/* --- (UI部分は前回と全く同じため省略せずに描画します) --- */}
            <div className="panel" style={{ width: '90%', maxWidth: '800px', marginBottom: '15px', padding: '20px' }}>
                <h3 style={{ borderBottom: '2px solid #8d7b68', paddingBottom: '5px', margin: '0 0 10px 0', color: '#5c4a44' }}>👥 プレイヤー設定 ({players.length}/8人)</h3>
                {players.map((p, idx) => (
                    <div key={p.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', background: 'rgba(92, 74, 68, 0.1)', padding: '8px', borderRadius: '8px', flexWrap: 'wrap' }}>
                        <div style={{ width: '16px', height: '16px', backgroundColor: colors[idx % colors.length], borderRadius: '50%' }}></div>
                        <input type="text" value={p.name} onChange={e => updatePlayer(p.id, 'name', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '90px' }} />
                        <select value={p.isCPU ? 'cpu' : 'human'} onChange={e => updatePlayer(p.id, 'isCPU', e.target.value === 'cpu')} style={{ padding: '6px', borderRadius: '4px' }}><option value="human">人間</option><option value="cpu">CPU</option></select>
                        <select value={p.charType} onChange={e => updatePlayer(p.id, 'charType', e.target.value)} style={{ padding: '6px', borderRadius: '4px', maxWidth: '140px' }}>{Object.entries(charInfo).map(([key, info]) => <option key={key} value={key}>{info.name}</option>)}</select>
                        <select value={p.teamColor} onChange={e => updatePlayer(p.id, 'teamColor', e.target.value)} style={{ padding: '6px', borderRadius: '4px' }}>{Object.entries(TEAM_COLORS).map(([key, t]) => <option key={key} value={key}>{t.icon} {t.label}</option>)}</select>
                        {players.length > 2 && <button onClick={() => removePlayer(p.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>✕</button>}
                    </div>
                ))}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}><button onClick={() => addPlayer(false)} className="btn-clay btn-green" style={{ padding: '8px 12px' }}>＋ 人間</button><button onClick={() => addPlayer(true)} className="btn-clay btn-blue" style={{ padding: '8px 12px' }}>＋ CPU</button></div>
            </div>
            <div className="panel" style={{ width: '90%', maxWidth: '800px', marginBottom: '20px', padding: '20px', background: '#8d6e63', borderColor: '#4a3b32' }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#fdf5e6' }}>🗺️ ゲームルール設定</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', marginBottom: '15px' }}>
                    <label style={{ color: '#fdf5e6', fontWeight: 'bold' }}>マップ: <select value={mapSize} onChange={e => setMapSize(e.target.value)} style={{ marginLeft: '8px', padding: '6px', borderRadius: '4px' }}><option value="small">小(12)</option><option value="medium">中(48)</option><option value="large">大(75)</option></select></label>
                    <label style={{ color: '#fdf5e6', fontWeight: 'bold' }}>ラウンド: <select value={maxRounds} onChange={e => setMaxRounds(Number(e.target.value))} style={{ marginLeft: '8px', padding: '6px', borderRadius: '4px' }}>{[1, 5, 10, 15, 20, 30].map(r => <option key={r} value={r}>{r}R</option>)}</select></label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                    <label style={{ color: '#fdf5e6', cursor: 'pointer' }}><input type="checkbox" checked={skipTurnDice} onChange={e => setSkipTurnDice(e.target.checked)} /> 🎲 順番決めダイスをスキップ</label>
                    <label style={{ color: '#f1c40f', cursor: 'pointer', fontWeight: 'bold' }}><input type="checkbox" checked={isCreative} onChange={e => setIsCreative(e.target.checked)} /> 🎨 クリエイティブモード</label>
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
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}><button className="btn-large" style={{ background: '#7f8c8d' }} onClick={() => setGameState({ gamePhase: 'mode_select' })}>◀ 戻る</button><button className="btn-large btn-brown" onClick={handleStart} style={{ padding: '15px 40px', fontSize: '20px' }}>🎲 ゲームを開始する</button></div>
        </div>
    );
};