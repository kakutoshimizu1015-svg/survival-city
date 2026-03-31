import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { charEmoji } from '../../constants/characters';
import { executeMove } from '../../game/actions';
import { tileTooltipData } from '../../constants/maps';

export const GameBoard = () => {
    const { 
        mapData, players, turn, isBranchPicking, currentBranchOptions, territories,
        // ▼ すべてのNPC位置データを取得
        policePos, yakuzaPos, unclePos, animalPos, loansharkPos, friendPos,
        roundCount, maxRounds, weatherState, canPrice, trashPrice 
    } = useGameStore();

    const currentPlayer = players[turn];

    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
    const isDragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const wrapperRef = useRef(null);
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, title: '', desc: '' });

    const maxCol = Math.max(...mapData.map(t => t.col), 1);
    const maxRow = Math.max(...mapData.map(t => t.row), 1);

    const tileIconMap = { center: '🏥', normal: '', can: '🥫', trash: '🗑️', event: '❗', shelter: '🏕️', job: '💼', shop: '🛒', koban: '👮', manhole: '🕳️', exchange: '💰' };

    const onMouseDown = (e) => {
        isDragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastPos.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => isDragging.current = false;

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;
        const handleWheel = (e) => {
            e.preventDefault();
            const zoom = e.deltaY < 0 ? 0.1 : -0.1;
            setTransform(prev => ({ ...prev, scale: Math.max(0.3, Math.min(3, prev.scale + zoom)) }));
        };
        wrapper.addEventListener('wheel', handleWheel, { passive: false });
        return () => wrapper.removeEventListener('wheel', handleWheel);
    }, []);

    const handleMouseEnterTile = (e, tile) => {
        const ttKey = tileTooltipData[tile.type] ? tile.type : tile.area;
        const data = tileTooltipData[ttKey];
        if (data) {
            setTooltip({ show: true, x: e.clientX + 15, y: e.clientY - 15, title: data.title, desc: data.desc });
        }
    };

    return (
        <div id="board-area" style={{ position: 'relative', flexGrow: 1, overflow: 'hidden' }}>
            
            <div style={{
                position: 'absolute', top: 10, left: 10, zIndex: 100,
                background: 'rgba(40, 30, 25, 0.65)', color: '#fdf5e6', padding: '8px 12px',
                borderRadius: '8px', border: '1px solid rgba(141, 123, 104, 0.8)', fontSize: '12px',
                pointerEvents: 'none', boxShadow: '2px 2px 8px rgba(0,0,0,0.3)',
                display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', fontWeight: 'bold',
                backdropFilter: 'blur(2px)'
            }}>
                <div style={{ color: '#f1c40f' }}>⏳ ラウンド: {roundCount}/{maxRounds}</div>
                <div>{weatherState === 'rainy' ? '🌧️ 雨' : '☀️ 晴れ'}</div>
                <div>💱 買取: 🥫{canPrice}P / 🗑️{trashPrice}P</div>
            </div>

            <div style={{ position: 'absolute', top: 95, left: 10, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <button className="zoom-btn" onClick={() => setTransform(p => ({ ...p, scale: Math.min(3, p.scale + 0.2) }))}>＋</button>
                <button className="zoom-btn" onClick={() => setTransform(p => ({ ...p, scale: Math.max(0.3, p.scale - 0.2) }))}>－</button>
            </div>

            {currentPlayer && (
                <div style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 100,
                    background: 'rgba(243, 156, 18, 0.65)', color: '#fff', padding: '4px 12px',
                    borderRadius: '8px', border: '1px solid rgba(230, 126, 34, 0.8)', fontSize: '13px', fontWeight: 'bold',
                    pointerEvents: 'none', boxShadow: '2px 2px 8px rgba(0,0,0,0.3)',
                    display: 'flex', alignItems: 'baseline', gap: '6px',
                    backdropFilter: 'blur(2px)', textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                }}>
                    ⚡ AP <span style={{ fontSize: '20px' }}>{currentPlayer.ap}</span>
                </div>
            )}

            <div 
                id="game-board-container" 
                className="panel" 
                ref={wrapperRef}
                onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
                style={{ width: '100%', height: 'calc(100vh - 280px)', overflow: 'hidden', cursor: isDragging.current ? 'grabbing' : 'grab' }}
            >
                <div id="game-board-inner" style={{
                    transformOrigin: '0 0',
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transition: isDragging.current ? 'none' : 'transform 0.1s'
                }}>
                    <div id="game-board" style={{ display: 'grid', gap: '20px', padding: '30px', gridTemplateColumns: `repeat(${maxCol}, var(--tile-size))`, gridTemplateRows: `repeat(${maxRow}, var(--tile-size))` }}>
                        {mapData.map(tile => {
                            const playersOnTile = players.filter(p => p.pos === tile.id);
                            const isSelectable = isBranchPicking && currentBranchOptions.includes(tile.id);
                            const ownerId = territories[tile.id];
                            const owner = ownerId !== undefined ? players.find(p => p.id === ownerId) : null;

                            return (
                                <div 
                                    key={tile.id} id={`tile-${tile.id}`} 
                                    className={`tile ${tile.type} ${tile.area} ${isSelectable ? 'tile-highlight-branch' : ''}`} 
                                    style={{ gridColumn: tile.col, gridRow: tile.row, cursor: isSelectable ? 'pointer' : 'inherit' }}
                                    onClick={() => isSelectable && executeMove(tile.id)}
                                    onMouseEnter={(e) => handleMouseEnterTile(e, tile)}
                                    onMouseLeave={() => setTooltip({ ...tooltip, show: false })}
                                >
                                    <div style={{ fontSize: '26px', zIndex: 2, pointerEvents: 'none' }}>{tileIconMap[tile.type]}</div>
                                    <div style={{ fontSize: '9px', zIndex: 2, textAlign: 'center', pointerEvents: 'none' }}>{tile.name}</div>
                                    
                                    {owner && <div className="owner-mark-clay" style={{ display: 'block', backgroundColor: owner.color, fontSize: '10px' }}>🚩</div>}

                                    {playersOnTile.map((p, idx) => (
                                        <div key={p.id} className={`player-token pos-${idx % 4} ${p.id === turn ? 'token-active' : ''}`} style={{ borderColor: p.color, '--token-color': p.color }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: '1' }}>
                                                <span style={{ fontSize: '18px' }}>{charEmoji[p.charType] || '🏃'}</span>
                                                <span style={{ fontSize: '7px', fontWeight: 900, color: p.color, textShadow: '0 0 4px #000' }}>{p.name}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* ▼ 全NPCの描画を網羅 */}
                                    {policePos === tile.id && <div className="npc-token npc-police" title="警察">👮</div>}
                                    {unclePos === tile.id && <div className="npc-token npc-uncle" title="厄介なおじさん">🧓</div>}
                                    {animalPos === tile.id && <div className="npc-token npc-animal" title="野良動物">🐀</div>}
                                    {yakuzaPos === tile.id && <div className="npc-token npc-yakuza" title="ヤクザ">😎</div>}
                                    {loansharkPos === tile.id && <div className="npc-token npc-loanshark" title="闇金">💀</div>}
                                    {friendPos === tile.id && <div className="npc-token npc-friend" title="仲間">🤝</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {tooltip.show && (
                <div id="tile-tooltip" style={{ display: 'block', left: tooltip.x, top: tooltip.y }}>
                    <div className="tt-title">{tooltip.title}</div>
                    <div className="tt-desc">{tooltip.desc}</div>
                </div>
            )}
        </div>
    );
};