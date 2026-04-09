import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useUserStore } from '../../store/useUserStore';
import { getDistance, getPathPreviewTiles, getManholeLinkedTiles } from '../../utils/gameLogic';
import { executeMove } from '../../game/actions';
import { WeaponArcOverlay } from '../overlays/WeaponArcOverlay';
import { useNetworkStore } from '../../store/useNetworkStore'; // ▼ 追加: ネットワークStore
import { BoardPaths } from './BoardPaths';
import { Tile } from './Tile';
import { TileTooltip } from '../overlays/TileTooltip';
import { PlayerToken } from './PlayerToken';
import { mapBackgrounds, MAP_CONFIG } from '../../constants/maps';

export const GameBoard = () => {
    const { 
        mapData, players, turn, territories, truckPos, policePos, unclePos, animalPos, yakuzaPos, loansharkPos, friendPos, 
        isNight, npcMovePick, isBranchPicking, currentBranchOptions,
        roundCount, maxRounds, weatherState, isRainy, canPrice, trashPrice, gameOver,
        horrorMode,
        isDashPicking // ▼ 追加: ダッシュ中かどうかのフラグを取得
    } = useGameStore();

    // ▼ 修正: autoScrollToPlayer の取得元を useUserStore に変更
    const showSmoke = useUserStore(state => state.showSmoke);
    const autoScrollToPlayer = useUserStore(state => state.autoScrollToPlayer); 

    const cp = players[turn];
    const scale = useRef(1.0);
    const offset = useRef({ x: 0, y: 0 });
    const wrapperRef = useRef(null);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const offsetStart = useRef({ x: 0, y: 0 });
    const lastTouches = useRef(null);
    const isClickPrevented = useRef(false);
    const rafRef = useRef(null);
    const prevAutoScrollTurn = useRef(-1);
    
    const prevHorrorMode = useRef(false);

    const applyTransform = useCallback((smooth = false) => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            const inner = document.getElementById('game-board-inner');
            if (inner) {
                inner.style.transition = smooth ? 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
                inner.style.transform = `translate3d(${offset.current.x}px, ${offset.current.y}px, 0) scale(${scale.current})`;
            }
        });
    }, []);

    const zoomAt = useCallback((px, py, delta) => {
        const prevScale = scale.current;
        const newScale = Math.min(3.0, Math.max(0.25, prevScale + delta));
        const ratio = newScale / prevScale;
        offset.current = { x: px - ratio * (px - offset.current.x), y: py - ratio * (py - offset.current.y) };
        scale.current = newScale;
        applyTransform(true);
    }, [applyTransform]);

    const handleZoomBtn = (delta) => {
        if (!wrapperRef.current) return;
        zoomAt(wrapperRef.current.clientWidth / 2, wrapperRef.current.clientHeight / 2, delta);
    };

    const resetZoom = useCallback(() => {
        if (!wrapperRef.current) return;
        const board = document.getElementById('game-board');
        if (!board) return;
        
        const bw = board.scrollWidth;
        const bh = board.scrollHeight;
        let ww = wrapperRef.current.clientWidth;
        let wh = wrapperRef.current.clientHeight;

        if (bw === 0 || bh === 0 || ww === 0 || wh === 0) return;
        if (wh > window.innerHeight) wh = window.innerHeight * 0.5;

        const paddingRatio = ww <= 768 ? 0.95 : 1.0; 
        const fitScale = Math.min(ww / bw, wh / bh, 1.0) * paddingRatio;
        scale.current = fitScale;
        offset.current = { x: (ww - bw * fitScale) / 2, y: (wh - bh * fitScale) / 2 };
        applyTransform(true);
    }, [applyTransform]);

    const focusTile = useCallback((targetTileId) => {
        if (!wrapperRef.current || !mapData || mapData.length === 0 || gameOver) return;
        const targetTile = mapData.find(t => t.id === targetTileId);
        if (!targetTile) return;

        const tileSize = MAP_CONFIG.TILE_SIZE;
        const gap = MAP_CONFIG.GAP;     
        const padding = MAP_CONFIG.PADDING; 

        const tilePixelX = padding + (targetTile.col - 1) * (tileSize + gap) + tileSize / 2;
        const tilePixelY = padding + (targetTile.row - 1) * (tileSize + gap) + tileSize / 2;

        const ww = wrapperRef.current.clientWidth;
        const wh = wrapperRef.current.clientHeight;
        offset.current = { x: ww / 2 - tilePixelX * scale.current, y: wh / 2 - tilePixelY * scale.current };
        applyTransform(true);
    }, [mapData, gameOver, applyTransform]);

    const focusCurrentPlayer = useCallback(() => {
        if (cp) focusTile(cp.pos);
    }, [cp, focusTile]);

    const mapTileCount = mapData?.length || 0;

    useEffect(() => {
        if (mapTileCount === 0) return; 
        
        let lastWidth = window.innerWidth;
        const handleResize = () => {
            if (window.innerWidth !== lastWidth) {
                lastWidth = window.innerWidth;
                resetZoom();
            }
        };

        const timer = setTimeout(() => { resetZoom(); }, 150);
        window.addEventListener('resize', handleResize);
        return () => { clearTimeout(timer); window.removeEventListener('resize', handleResize); };
    }, [mapTileCount, resetZoom]);

    useEffect(() => {
        if (!autoScrollToPlayer || !cp || prevAutoScrollTurn.current === turn || gameOver) return;
        prevAutoScrollTurn.current = turn;

        const timer = setTimeout(() => {
            focusTile(cp.pos);
        }, 300);

        return () => clearTimeout(timer);
    }, [turn, cp, autoScrollToPlayer, gameOver, focusTile]);

    useEffect(() => {
        if (horrorMode && !prevHorrorMode.current) {
            focusTile(truckPos);
        }
        prevHorrorMode.current = horrorMode;
    }, [horrorMode, truckPos, focusTile]);

    const getTouchCoords = (touches) => Array.from(touches).map(t => ({ clientX: t.clientX, clientY: t.clientY }));

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const rect = wrapper.getBoundingClientRect();
            zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 0.15 : -0.15);
        };

        const handleMouseDown = (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            isDragging.current = true;
            dragStart.current = { x: e.clientX, y: e.clientY };
            offsetStart.current = { ...offset.current };
            wrapper.classList.add('dragging');
            const inner = document.getElementById('game-board-inner');
            if (inner) inner.style.transition = 'none';
        };

        const handleMouseMove = (e) => {
            if (!isDragging.current) return;
            offset.current = { x: offsetStart.current.x + (e.clientX - dragStart.current.x), y: offsetStart.current.y + (e.clientY - dragStart.current.y) };
            applyTransform(false);
        };

        const handleMouseUp = (e) => {
            if (!isDragging.current) return;
            isDragging.current = false;
            wrapper.classList.remove('dragging');
            const inner = document.getElementById('game-board-inner');
            if (inner) inner.style.transition = 'transform 0.12s ease';
            const moved = Math.abs(e.clientX - dragStart.current.x) + Math.abs(e.clientY - dragStart.current.y);
            if (moved > 5) {
                isClickPrevented.current = true;
                setTimeout(() => { isClickPrevented.current = false; }, 50);
            }
        };

        const handleTouchStart = (e) => {
            lastTouches.current = getTouchCoords(e.touches);
            wrapper.classList.add('dragging');
            const inner = document.getElementById('game-board-inner');
            if (inner) inner.style.transition = 'none';
        };

        const handleTouchMove = (e) => {
            if (!lastTouches.current) return;
            const currentTouches = getTouchCoords(e.touches);

            if (currentTouches.length === 1 && lastTouches.current.length === 1) {
                const sensitivity = 1.8;
                offset.current = { x: offset.current.x + (currentTouches[0].clientX - lastTouches.current[0].clientX) * sensitivity, y: offset.current.y + (currentTouches[0].clientY - lastTouches.current[0].clientY) * sensitivity };
                applyTransform(false);
                if (e.cancelable) e.preventDefault();
            } else if (currentTouches.length === 2 && lastTouches.current.length === 2) {
                const prevDist = Math.hypot(lastTouches.current[0].clientX - lastTouches.current[1].clientX, lastTouches.current[0].clientY - lastTouches.current[1].clientY);
                const newDist = Math.hypot(currentTouches[0].clientX - currentTouches[1].clientX, currentTouches[0].clientY - currentTouches[1].clientY);
                const rect = wrapper.getBoundingClientRect();
                zoomAt(((currentTouches[0].clientX + currentTouches[1].clientX) / 2) - rect.left, ((currentTouches[0].clientY + currentTouches[1].clientY) / 2) - rect.top, (newDist - prevDist) * 0.005);
                if (e.cancelable) e.preventDefault();
            }
            lastTouches.current = currentTouches;
        };

        const handleTouchEnd = () => {
            lastTouches.current = null;
            wrapper.classList.remove('dragging');
            const inner = document.getElementById('game-board-inner');
            if (inner) inner.style.transition = 'transform 0.12s ease';
        };

        wrapper.addEventListener('wheel', handleWheel, { passive: false });
        wrapper.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        wrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
        wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
        wrapper.addEventListener('touchend', handleTouchEnd, { passive: true });
        wrapper.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        return () => {
            wrapper.removeEventListener('wheel', handleWheel);
            wrapper.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            wrapper.removeEventListener('touchstart', handleTouchStart);
            wrapper.removeEventListener('touchmove', handleTouchMove);
            wrapper.removeEventListener('touchend', handleTouchEnd);
            wrapper.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [zoomAt, applyTransform]);

    const handleTileClick = (tileId) => {
        if (isClickPrevented.current) return;

        // ▼ 追加: オンライン時の他人のターン中の誤操作をブロック
        const netState = useNetworkStore.getState();
        if (netState.status === 'connected') {
            const currentPlayer = players[turn]; // GameBoard内で取得済みのplayersとturnを利用
            if (currentPlayer && currentPlayer.userId !== netState.myUserId) {
                return; // 自分のターンでなければ操作を無視
            }
        }

        if (npcMovePick) {
            const state = useGameStore.getState();
            state.updateCurrentPlayer(p => ({ ap: p.ap - 3 }));
            useGameStore.setState({ [npcMovePick]: tileId, npcMovePick: null });
        } else if (isBranchPicking && currentBranchOptions.includes(tileId)) {
            executeMove(tileId);
        }
    };

    const visibleTiles = useMemo(() => {
        if (!isNight) return null;
        const visible = new Set();
        const viewers = players.filter(p => !p.isCPU || p.id === turn);
        viewers.forEach(v => {
            if (v.hp > 0) { mapData.forEach(t => { if (getDistance(v.pos, t.id, mapData) <= 3) visible.add(t.id); }); }
        });
        if (isBranchPicking) currentBranchOptions.forEach(id => visible.add(id));
        return visible;
    }, [isNight, players, mapData, turn, isBranchPicking, currentBranchOptions]);

    const pathPreview = useMemo(() => {
        const preview = { path1: new Set(), path2: new Set(), path3: new Set(), manholes: new Set() };
        if (!players || players.length === 0 || gameOver || !cp || cp.isCPU) return preview;
        const pathData = getPathPreviewTiles(cp.pos, mapData);
        preview.path1 = pathData.depth1; preview.path2 = pathData.depth2; preview.path3 = pathData.depth3;
        const curTile = mapData.find(t => t.id === cp.pos);
        if (curTile && curTile.type === 'manhole') preview.manholes = getManholeLinkedTiles(cp.pos, mapData);
        return preview;
    }, [players, gameOver, cp, mapData]);

    const zoomBtnStyle = { width: '28px', height: '28px', borderRadius: '6px', border: '2px solid #8d6e63', background: 'rgba(62,47,42,0.88)', color: '#fdf5e6', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 4px rgba(0,0,0,0.5)', transition: 'background 0.15s, transform 0.1s', padding: 0 };
    
    let maxCol = 0, maxRow = 0;
    if (mapData && mapData.length > 0) {
        maxCol = Math.max(...mapData.map(t => t.col));
        maxRow = Math.max(...mapData.map(t => t.row));
    }

    const mapSize = mapData?.length || 0;
    const bgData = mapBackgrounds[mapSize] || Object.values(mapBackgrounds)[0];
    const currentBgImage = bgData ? (isNight ? bgData.night : bgData.day) : null;

    return (
        <div id="board-area" style={{ flexGrow: 1, overflowX: 'hidden', minWidth: 0, position: 'relative' }}>
            <TileTooltip />
            {npcMovePick && (
                <div id="branch-prompt" style={{ display: 'block', background: 'rgba(149,165,166,0.95)', pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => { useGameStore.setState({ npcMovePick: null }); useGameStore.getState().showToast("情報操作をキャンセルしました"); }}>
                    🕵️ 移動先マスをタップしてください（タップでキャンセル）
                </div>
            )}
            {isBranchPicking && !npcMovePick && (
                <div id="branch-prompt" style={{ display: 'block' }}>🛣️ 光っているマスをタップして進む道を選んでください</div>
            )}

            <div id="map-env-hud" style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 55, display: 'flex', flexDirection: 'column', pointerEvents: 'none' }}>
                <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: 'bold', color: '#fdf5e6', lineHeight: 1.6, whiteSpace: 'nowrap' }}>
                    <span id="hud-round" style={{ color: '#f1c40f' }}>R:{roundCount}/{maxRounds}</span>
                    <span id="hud-weather" style={{ marginLeft: '6px' }}>{isRainy ? '🌧️雨' : weatherState === 'cloudy' ? '☁️曇' : '☀️晴'}</span>
                    <span id="hud-daynight" style={{ marginLeft: '6px' }}>{isNight ? '🌙夜' : '☀️昼'}</span><br/>
                    <span style={{ color: '#bdc3c7' }}>缶:<span id="hud-can-price">{canPrice}</span>P</span>
                    <span style={{ color: '#bdc3c7', marginLeft: '6px' }}>ゴミ:<span id="hud-trash-price">{trashPrice}</span>P</span>
                </div>
                <div id="zoom-controls" style={{ display: 'flex', flexDirection: 'row', position: 'static', gap: '6px', pointerEvents: 'auto', marginTop: '8px' }}>
                    <button className="zoom-btn" style={zoomBtnStyle} onClick={() => handleZoomBtn(0.15)} title="ズームイン">＋</button>
                    <button className="zoom-btn" style={zoomBtnStyle} onClick={() => handleZoomBtn(-0.15)} title="ズームアウト">－</button>
                    <button className="zoom-btn" style={{ ...zoomBtnStyle, fontSize: '12px' }} onClick={resetZoom} title="リセット">⟳</button>
                    <button className="zoom-btn" style={{ ...zoomBtnStyle, fontSize: '12px' }} onClick={focusCurrentPlayer} title="自分の駒へ">📍</button>
                </div>
            </div>

            {cp && (
                <div id="map-ap-hud" style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', border: `2px solid ${cp.ap > 0 ? 'rgba(255,220,50,0.5)' : 'rgba(200,80,80,0.5)'}`, borderRadius: '10px', padding: '6px 12px', color: cp.ap > 0 ? '#f1c40f' : '#e74c3c', fontWeight: 'bold', fontSize: '18px', textShadow: '0 0 8px currentColor', pointerEvents: 'none', transition: 'all 0.3s' }}>
                    ⚡ <span id="map-ap-display">{cp.ap}</span>
                </div>
            )}

            <div id="game-board-container" className="panel" style={{ width: '100%', paddingBottom: '10px', position: 'relative' }}>
                
                {showSmoke && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)',
                        pointerEvents: 'none', zIndex: 10, borderRadius: '8px 8px 0 0'
                    }} />
                )}

                <div id="game-board-wrapper" ref={wrapperRef} style={{ overflow: 'hidden', width: '100%', maxHeight: 'calc(100vh - 280px)', cursor: 'grab', userSelect: 'none', touchAction: 'none' }}>
                    <div id="game-board-inner" style={{ transformOrigin: 'top left', display: 'inline-block', willChange: 'transform' }}>
                        
                        <div id="game-board" style={{ 
                            display: 'grid', gap: `${MAP_CONFIG.GAP}px`, padding: `${MAP_CONFIG.PADDING}px`, borderRadius: '15px', 
                            border: '4px solid #3e2f2a', boxShadow: '4px 4px 0px rgba(0,0,0,0.4)', 
                            backgroundImage: currentBgImage ? `url("${currentBgImage}")` : 'linear-gradient(to right,#b0b0b0 0%,#b0b0b0 32%,#f0c830 32%,#f0c830 68%,#f8f8f8 68%,#f8f8f8 100%)',
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundColor: isNight ? '#222' : '#fff',
                            transition: 'filter 0.5s ease',
                            width: 'max-content', margin: '0 auto', position: 'relative', isolation: 'isolate', 
                            gridTemplateColumns: `repeat(${maxCol}, ${MAP_CONFIG.TILE_SIZE}px)`, 
                            gridTemplateRows: `repeat(${maxRow}, ${MAP_CONFIG.TILE_SIZE}px)` 
                }}>
                            
                            <BoardPaths />
                            <WeaponArcOverlay />

                            {mapData.map(tile => {
                                const owner = territories[tile.id] !== undefined ? players.find(p => p.id === territories[tile.id]) : null;
                                const isFog = visibleTiles && !visibleTiles.has(tile.id);
                                const isBranchTarget = isBranchPicking && currentBranchOptions.includes(tile.id);
                                const isClickable = npcMovePick !== null || isBranchTarget;
                                
                                // ▼ 追加: 自分がダッシュのターゲットになっているかどうかを個別に判定
                                const isDashTarget = isClickable && isDashPicking;
                                
                                let pathClass = '';
                                if (pathPreview.path1.has(tile.id)) pathClass = 'tile-path-1';
                                else if (pathPreview.path2.has(tile.id)) pathClass = 'tile-path-2';
                                else if (pathPreview.path3.has(tile.id)) pathClass = 'tile-path-3';
                                else if (pathPreview.manholes.has(tile.id)) pathClass = 'tile-manhole-linked';

                                return (
                                    <Tile 
                                        key={tile.id} tile={tile} owner={owner} isFog={isFog} 
                                        isClickable={isClickable} 
                                        isDashTarget={isDashTarget} // ▼ Tile に Prop として渡す
                                        onClick={() => handleTileClick(tile.id)} maxRow={maxRow}
                                        isTruck={tile.id === truckPos} isPolice={tile.id === policePos} isUncle={tile.id === unclePos} isAnimal={tile.id === animalPos} isYakuza={tile.id === yakuzaPos} isLoanshark={tile.id === loansharkPos} isFriend={tile.id === friendPos} pathClass={pathClass}
                                    />
                                );
                            })}

                            {players.filter(p => p.hp > 0).map(p => {
                                const isFog = visibleTiles && !visibleTiles.has(p.pos);
                                if (isFog) return null;
                                return <PlayerToken key={p.id} player={p} mapData={mapData} isActiveTurn={p.id === turn} maxRow={maxRow} />;
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};