import React, { useMemo, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { charEmoji } from '../../constants/characters';
import { getDistance } from '../../game/combat';
import { executeMove } from '../../game/actions';

export const GameBoard = () => {
    const { 
        mapData, players, turn, territories, truckPos, policePos, unclePos, animalPos, yakuzaPos, loansharkPos, friendPos, 
        isNight, npcMovePick, isBranchPicking, currentBranchOptions,
        roundCount, maxRounds, weatherState, isRainy, canPrice, trashPrice 
    } = useGameStore();

    const cp = players[turn];

    // ズーム機能のステート (初期値を少し小さめに設定し、見切れを防ぐ)
    const [scale, setScale] = useState(0.85);
    const handleZoom = (delta) => setScale(prev => Math.min(Math.max(0.3, prev + delta), 3.0));
    const resetZoom = () => setScale(0.85);

    // 探偵の移動先タップ機能 ＆ 分岐時の移動先タップ機能
    const handleTileClick = (tileId) => {
        if (npcMovePick) {
            const state = useGameStore.getState();
            state.updateCurrentPlayer(p => ({ ap: p.ap - 3 }));
            useGameStore.setState({ [npcMovePick]: tileId, npcMovePick: null });
        } else if (isBranchPicking && currentBranchOptions.includes(tileId)) {
            executeMove(tileId);
        }
    };

    // 夜間フォグ計算
    const visibleTiles = useMemo(() => {
        if (!isNight) return null;
        const visible = new Set();
        const viewers = players.filter(p => !p.isCPU || p.id === turn);
        viewers.forEach(v => {
            if (v.hp > 0) {
                mapData.forEach(t => { if (getDistance(v.pos, t.id, mapData) <= 3) visible.add(t.id); });
            }
        });
        return visible;
    }, [isNight, players, mapData, turn]);

    // ズームボタンの共通スタイル
    const zoomBtnStyle = {
        width: '32px', height: '32px', borderRadius: '8px', border: '2px solid #8d6e63', 
        background: 'rgba(62,47,42,0.88)', color: '#fdf5e6', fontSize: '16px', fontWeight: 'bold', 
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        boxShadow: '2px 2px 4px rgba(0,0,0,0.5)'
    };

    return (
        <div id="board-area">
            
            {/* ▼ 左上：環境情報HUD & ズームコントロール */}
            <div id="map-env-hud" style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 55, display: 'flex', flexDirection: 'column', gap: '4px', pointerEvents: 'none' }}>
                <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: 'bold', color: '#fdf5e6', lineHeight: 1.6, whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#f1c40f' }}>R:{roundCount}/{maxRounds}</span>
                    <span style={{ marginLeft: '6px' }}>{isRainy ? '🌧️雨' : weatherState === 'cloudy' ? '☁️曇' : '☀️晴'}</span>
                    <span style={{ marginLeft: '6px' }}>{isNight ? '🌙夜' : '☀️昼'}</span>
                    <br/>
                    <span style={{ color: '#bdc3c7' }}>缶:{canPrice}P</span>
                    <span style={{ color: '#bdc3c7', marginLeft: '6px' }}>ゴミ:{trashPrice}P</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', pointerEvents: 'auto' }}>
                    <button style={zoomBtnStyle} onClick={() => handleZoom(0.15)} title="ズームイン">＋</button>
                    <button style={zoomBtnStyle} onClick={() => handleZoom(-0.15)} title="ズームアウト">－</button>
                    <button style={{ ...zoomBtnStyle, fontSize: '12px' }} onClick={resetZoom} title="リセット">⟳</button>
                </div>
            </div>

            {/* ▼ 右上：残りAP表示 */}
            {cp && (
                <div id="map-ap-hud" style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', border: `2px solid ${cp.ap > 0 ? 'rgba(255,220,50,0.5)' : 'rgba(200,80,80,0.5)'}`, borderRadius: '10px', padding: '6px 12px', color: cp.ap > 0 ? '#f1c40f' : '#e74c3c', fontWeight: 'bold', fontSize: '18px', textShadow: '0 0 8px currentColor', pointerEvents: 'none', transition: 'all 0.3s' }}>
                    ⚡ {cp.ap}
                </div>
            )}

            {/* マップ本体 (スクロール制御) */}
            <div id="game-board-container" className="panel">
                {npcMovePick && <div style={{ position:'sticky', top:0, left:0, background:'rgba(241,196,15,0.9)', color:'#000', padding:'10px', textAlign:'center', fontWeight:'bold', zIndex:1000 }}>🎯 マップをタップして移動先を選択してください</div>}
                
                {/* ズーム用のラッパー */}
                <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 'max-content', transition: 'transform 0.2s ease-out' }}>
                    <div id="game-board">
                        {mapData.map(tile => {
                            const owner = territories[tile.id] !== undefined ? players.find(p => p.id === territories[tile.id]) : null;
                            const isFog = visibleTiles && !visibleTiles.has(tile.id);
                            
                            const isBranchTarget = isBranchPicking && currentBranchOptions.includes(tile.id);
                            const isClickable = npcMovePick !== null || isBranchTarget;

                            return (
                                <div key={tile.id} id={`tile-${tile.id}`} onClick={() => isClickable && handleTileClick(tile.id)} 
                                    className={`tile ${tile.type} ${tile.area} ${isFog ? 'night-fog' : ''} ${isClickable ? 'tile-highlight-branch' : ''}`}
                                    style={{ gridColumn: tile.col, gridRow: tile.row, cursor: isClickable ? 'pointer' : 'default' }}>
                                    <div style={{ fontSize: '26px', zIndex: 2 }}>
                                        {tile.type === 'can' ? '🥫' : tile.type === 'trash' ? '🗑️' : tile.type === 'shop' ? '🛒' : tile.type === 'job' ? '💼' : tile.type === 'koban' ? '👮' : tile.type === 'event' ? '❗' : tile.type === 'exchange' ? '💰' : tile.type === 'shelter' ? '🏕️' : tile.type === 'center' ? '🏥' : ''}
                                    </div>
                                    <div style={{ fontSize: '9px', fontWeight: 'bold', zIndex: 2 }}>{tile.name}</div>
                                    
                                    {owner && <div className="owner-mark-clay" style={{ display: 'block', backgroundColor: owner.color, fontSize: '10px' }}>🚩</div>}

                                    {(tile.fieldCans > 0 || tile.fieldTrash > 0) && !isFog && (
                                        <div style={{ position:'absolute', top:'-10px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'2px', zIndex:5, background:'rgba(0,0,0,0.7)', borderRadius:'5px', padding:'2px 4px', fontSize:'12px' }}>
                                            {tile.fieldCans > 0 && <span>🥫{tile.fieldCans}</span>}
                                            {tile.fieldTrash > 0 && <span>🗑️{tile.fieldTrash}</span>}
                                        </div>
                                    )}

                                    {!isFog && players.filter(p => p.pos === tile.id && p.hp > 0).map(p => (
                                        <div key={p.id} className={`player-token pos-${p.id % 4} ${turn === p.id ? 'token-active' : ''}`} style={{ borderColor: p.color, width: '36px', height: '36px' }}>
                                            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1 }}>
                                                <span style={{ fontSize:'18px' }}>{charEmoji[p.charType]}</span>
                                                <span style={{ fontSize:'7px', fontWeight:900, color:p.color, textShadow:'0 0 4px #000' }}>{p.name}</span>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* ▼ 収集車：ホラーモードでなくても見やすく赤く光るように修正 */}
                                    {!isFog && tile.id === truckPos && (
                                        <div className="truck-token" style={{
                                            opacity: 1,
                                            border: '3px solid #ff0000',
                                            boxShadow: '0 0 20px #ff0000, inset 0 0 10px #ff0000',
                                            background: 'rgba(150,0,0,0.8)',
                                            transform: 'scale(1.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '24px',
                                            animation: 'pulse 1s infinite alternate'
                                        }}>🚛</div>
                                    )}

                                    {!isFog && tile.id === policePos && <div className="npc-token npc-police">👮</div>}
                                    {!isFog && tile.id === unclePos && <div className="npc-token npc-uncle">🧓</div>}
                                    {!isFog && tile.id === animalPos && <div className="npc-token npc-animal">🐀</div>}
                                    {!isFog && tile.id === yakuzaPos && <div className="npc-token npc-yakuza">😎</div>}
                                    {!isFog && tile.id === loansharkPos && <div className="npc-token npc-loanshark">💀</div>}
                                    {!isFog && tile.id === friendPos && <div className="npc-token npc-friend">🤝</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};