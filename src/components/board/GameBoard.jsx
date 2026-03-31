import React, { useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { charEmoji } from '../../constants/characters';
import { getDistance } from '../../game/combat';
import { executeMove } from '../../game/actions'; // ▼ アクションをインポート

export const GameBoard = () => {
    const { mapData, players, turn, territories, truckPos, policePos, unclePos, animalPos, yakuzaPos, loansharkPos, friendPos, isNight, npcMovePick, isBranchPicking, currentBranchOptions } = useGameStore();

    // 探偵の移動先タップ機能 ＆ 分岐時の移動先タップ機能
    const handleTileClick = (tileId) => {
        if (npcMovePick) {
            const state = useGameStore.getState();
            state.updateCurrentPlayer(p => ({ ap: p.ap - 3 }));
            useGameStore.setState({ [npcMovePick]: tileId, npcMovePick: null });
        } else if (isBranchPicking && currentBranchOptions.includes(tileId)) {
            // ▼ クリックされたマスへ移動を実行する
            executeMove(tileId);
        }
    };

    // 夜間フォグ計算（自分のキャラから距離3以内のみ表示）
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

    return (
        <div id="game-board-container" className="panel" style={{ flexGrow: 1, overflow: 'auto', position: 'relative' }}>
            {npcMovePick && <div style={{ position:'sticky', top:0, left:0, background:'rgba(241,196,15,0.9)', color:'#000', padding:'10px', textAlign:'center', fontWeight:'bold', zIndex:1000 }}>🎯 マップをタップして移動先を選択してください</div>}
            <div id="game-board" style={{ display: 'grid', gap: '20px', padding: '30px', background: 'linear-gradient(to right,#b0b0b0 0%,#b0b0b0 32%,#f0c830 32%,#f0c830 68%,#f8f8f8 68%,#f8f8f8 100%)', width: 'max-content', margin: '0 auto', position: 'relative' }}>
                {mapData.map(tile => {
                    const owner = territories[tile.id] !== undefined ? players.find(p => p.id === territories[tile.id]) : null;
                    const isFog = visibleTiles && !visibleTiles.has(tile.id);
                    
                    // ▼ 分岐マスかどうかの判定を追加
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
                            
                            {/* 陣地マーク */}
                            {owner && <div className="owner-mark-clay" style={{ display: 'block', backgroundColor: owner.color, fontSize: '10px' }}>🚩</div>}

                            {/* フィールドドロップアイテム */}
                            {(tile.fieldCans > 0 || tile.fieldTrash > 0) && !isFog && (
                                <div style={{ position:'absolute', top:'-10px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'2px', zIndex:5, background:'rgba(0,0,0,0.7)', borderRadius:'5px', padding:'2px 4px', fontSize:'12px' }}>
                                    {tile.fieldCans > 0 && <span>🥫{tile.fieldCans}</span>}
                                    {tile.fieldTrash > 0 && <span>🗑️{tile.fieldTrash}</span>}
                                </div>
                            )}

                            {/* プレイヤー＆NPC */}
                            {!isFog && players.filter(p => p.pos === tile.id && p.hp > 0).map(p => (
                                <div key={p.id} className={`player-token pos-${p.id % 4} ${turn === p.id ? 'token-active' : ''}`} style={{ borderColor: p.color, width: '36px', height: '36px' }}>
                                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', lineHeight:1 }}>
                                        <span style={{ fontSize:'18px' }}>{charEmoji[p.charType]}</span>
                                        <span style={{ fontSize:'7px', fontWeight:900, color:p.color, textShadow:'0 0 4px #000' }}>{p.name}</span>
                                    </div>
                                </div>
                            ))}
                            {!isFog && tile.id === truckPos && <div className="truck-token">🚛</div>}
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
    );
};