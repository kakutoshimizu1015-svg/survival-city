import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getDistance, getPathPreviewTiles, getManholeLinkedTiles } from '../../utils/gameLogic';
import { executeMove } from '../../game/actions';
import { WeaponArcOverlay } from '../overlays/WeaponArcOverlay';
import { BoardPaths } from './BoardPaths';
import { Tile } from './Tile';
import { TileTooltip } from '../overlays/TileTooltip';

export const GameBoard = () => {
    const { 
        mapData, players, turn, territories, truckPos, policePos, unclePos, animalPos, yakuzaPos, loansharkPos, friendPos, 
        isNight, npcMovePick, isBranchPicking, currentBranchOptions,
        roundCount, maxRounds, weatherState, isRainy, canPrice, trashPrice, gameOver
    } = useGameStore();

    const cp = players[turn];
    
    // Zoom and Pan States (Reactの再レンダリングを防ぐため全て useRef で管理)
    const scale = useRef(1.0);
    const offset = useRef({ x: 0, y: 0 });
    const wrapperRef = useRef(null);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const offsetStart = useRef({ x: 0, y: 0 });
    const lastTouches = useRef(null);
    const isClickPrevented = useRef(false); // ドラッグ後の誤クリック防止用

    // DOMを直接書き換え、オリジナル版と同じCSS transition制御を行う
    const applyTransform = useCallback((smooth = false) => {
        const inner = document.getElementById('game-board-inner');
        if (inner) {
            inner.style.transition = smooth ? 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
            inner.style.transform = `translate(${offset.current.x}px, ${offset.current.y}px) scale(${scale.current})`;
        }
    }, []);

    const zoomAt = useCallback((px, py, delta) => {
        const prevScale = scale.current;
        const newScale = Math.min(3.0, Math.max(0.25, prevScale + delta));
        const ratio = newScale / prevScale;
        offset.current = {
            x: px - ratio * (px - offset.current.x),
            y: py - ratio * (py - offset.current.y)
        };
        scale.current = newScale;
        applyTransform(true);
    }, [applyTransform]);

    const handleZoomBtn = (delta) => {
        if (!wrapperRef.current) return;
        const cx = wrapperRef.current.clientWidth / 2;
        const cy = wrapperRef.current.clientHeight / 2;
        zoomAt(cx, cy, delta);
    };

    const resetZoom = useCallback(() => {
        if (!wrapperRef.current) return;
        const board = document.getElementById('game-board');
        if (!board) return;
        const bw = board.scrollWidth;
        const bh = board.scrollHeight;
        const ww = wrapperRef.current.clientWidth;
        const wh = wrapperRef.current.clientHeight;
        if (bw === 0 || bh === 0) return;
        const fitScale = Math.min(ww / bw, wh / bh, 1.0);
        scale.current = fitScale;
        offset.current = {
            x: (ww - bw * fitScale) / 2,
            y: (wh - bh * fitScale) / 2
        };
        applyTransform(true);
    }, [applyTransform]);

    useEffect(() => {
        resetZoom();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapData, resetZoom]);

    // オリジナル版のスクロールロジックを完全移植したネイティブイベント登録
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const rect = wrapper.getBoundingClientRect();
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            const delta = e.deltaY < 0 ? 0.15 : -0.15;
            zoomAt(px, py, delta);
        };

        const handleMouseDown = (e) => {
            if (e.button !== 0) return;
            isDragging.current = true;
            dragStart.current = { x: e.clientX, y: e.clientY };
            offsetStart.current = { ...offset.current };
            wrapper.classList.add('dragging');
            
            // ドラッグ開始時にtransitionを完全に切る（オリジナル版完全再現）
            const inner = document.getElementById('game-board-inner');
            if (inner) inner.style.transition = 'none';
        };

        const handleMouseMove = (e) => {
            if (!isDragging.current) return;
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;
            offset.current = {
                x: offsetStart.current.x + dx,
                y: offsetStart.current.y + dy
            };
            applyTransform(false);
        };

        const handleMouseUp = (e) => {
            if (!isDragging.current) return;
            isDragging.current = false;
            wrapper.classList.remove('dragging');
            
            // 指を離した瞬間に少し慣性を残す（オリジナル版完全再現）
            const inner = document.getElementById('game-board-inner');
            if (inner) inner.style.transition = 'transform 0.12s ease';

            // 5px以上ドラッグしていた場合は、直後のマスクリック判定を無効化する
            const moved = Math.abs(e.clientX - dragStart.current.x) + Math.abs(e.clientY - dragStart.current.y);
            if (moved > 5) {
                isClickPrevented.current = true;
                setTimeout(() => { isClickPrevented.current = false; }, 50);
            }
        };

        const handleTouchStart = (e) => {
            lastTouches.current = e.touches;
            // スワイプ開始時にtransitionを切る
            const inner = document.getElementById('game-board-inner');
            if (inner) inner.style.transition = 'none';
        };

        const handleTouchMove = (e) => {
            if (!lastTouches.current) return;
            if (e.touches.length === 1 && lastTouches.current.length === 1) {
                // スマホの1スクロール移動量を1.8倍にして感度を上げる
                const sensitivity = 1.8;
                const dx = (e.touches[0].clientX - lastTouches.current[0].clientX) * sensitivity;
                const dy = (e.touches[0].clientY - lastTouches.current[0].clientY) * sensitivity;
                offset.current = { x: offset.current.x + dx, y: offset.current.y + dy };
                applyTransform(false);
                e.preventDefault(); // ブラウザ標準のスクロールを遮断
            } else if (e.touches.length === 2 && lastTouches.current.length === 2) {
                const prevDist = Math.hypot(
                    lastTouches.current[0].clientX - lastTouches.current[1].clientX,
                    lastTouches.current[0].clientY - lastTouches.current[1].clientY
                );
                const newDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const rect = wrapper.getBoundingClientRect();
                const cx = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
                const cy = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
                zoomAt(cx, cy, (newDist - prevDist) * 0.005);
                e.preventDefault();
            }
            lastTouches.current = e.touches;
        };

        const handleTouchEnd = () => { 
            lastTouches.current = null; 
            // スワイプ終了時に慣性を戻す
            const inner = document.getElementById('game-board-inner');
            if (inner) inner.style.transition = 'transform 0.12s ease';
        };

        wrapper.addEventListener('wheel', handleWheel, { passive: false });
        wrapper.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        wrapper.addEventListener('touchstart', handleTouchStart, { passive: true });
        wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
        wrapper.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            wrapper.removeEventListener('wheel', handleWheel);
            wrapper.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            wrapper.removeEventListener('touchstart', handleTouchStart);
            wrapper.removeEventListener('touchmove', handleTouchMove);
            wrapper.removeEventListener('touchend', handleTouchEnd);
        };
    }, [zoomAt, applyTransform]);

    const handleTileClick = (tileId) => {
        // ドラッグ操作による誤クリックを防ぐ
        if (isClickPrevented.current) return;

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
            if (v.hp > 0) {
                mapData.forEach(t => { if (getDistance(v.pos, t.id, mapData) <= 3) visible.add(t.id); });
            }
        });
        if (isBranchPicking) {
            currentBranchOptions.forEach(id => visible.add(id));
        }
        return visible;
    }, [isNight, players, mapData, turn, isBranchPicking, currentBranchOptions]);

    const pathPreview = useMemo(() => {
        const preview = { path1: new Set(), path2: new Set(), path3: new Set(), manholes: new Set() };
        if (!players || players.length === 0 || gameOver || !cp || cp.isCPU) return preview;

        const pathData = getPathPreviewTiles(cp.pos, mapData);
        preview.path1 = pathData.depth1;
        preview.path2 = pathData.depth2;
        preview.path3 = pathData.depth3;

        const curTile = mapData.find(t => t.id === cp.pos);
        if (curTile && curTile.type === 'manhole') {
            preview.manholes = getManholeLinkedTiles(cp.pos, mapData);
        }

        return preview;
    }, [players, gameOver, cp, mapData]);

    const zoomBtnStyle = {
        width: '28px', height: '28px', borderRadius: '6px', border: '2px solid #8d6e63', 
        background: 'rgba(62,47,42,0.88)', color: '#fdf5e6', fontSize: '14px', fontWeight: 'bold', 
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', 
        boxShadow: '2px 2px 4px rgba(0,0,0,0.5)', transition: 'background 0.15s, transform 0.1s',
        padding: 0
    };

    let maxCol = 0, maxRow = 0;
    if (mapData && mapData.length > 0) {
        maxCol = Math.max(...mapData.map(t => t.col));
        maxRow = Math.max(...mapData.map(t => t.row));
    }

    return (
        <div id="board-area" style={{ flexGrow: 1, overflowX: 'hidden', minWidth: 0, position: 'relative' }}>
            
            <TileTooltip />

            {npcMovePick && (
                <div id="branch-prompt" style={{ display: 'block', background: 'rgba(149,165,166,0.95)', pointerEvents: 'auto', cursor: 'pointer' }}>
                    🕵️ 移動先マスをタップしてください
                </div>
            )}
            {isBranchPicking && !npcMovePick && (
                <div id="branch-prompt" style={{ display: 'block' }}>
                    🛣️ 光っているマスをタップして進む道を選んでください
                </div>
            )}

            <div id="map-env-hud" style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 55, display: 'flex', flexDirection: 'column', pointerEvents: 'none' }}>
                <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', fontWeight: 'bold', color: '#fdf5e6', lineHeight: 1.6, whiteSpace: 'nowrap' }}>
                    <span id="hud-round" style={{ color: '#f1c40f' }}>R:{roundCount}/{maxRounds}</span>
                    <span id="hud-weather" style={{ marginLeft: '6px' }}>{isRainy ? '🌧️雨' : weatherState === 'cloudy' ? '☁️曇' : '☀️晴'}</span>
                    <span id="hud-daynight" style={{ marginLeft: '6px' }}>{isNight ? '🌙夜' : '☀️昼'}</span>
                    <br/>
                    <span style={{ color: '#bdc3c7' }}>缶:<span id="hud-can-price">{canPrice}</span>P</span>
                    <span style={{ color: '#bdc3c7', marginLeft: '6px' }}>ゴミ:<span id="hud-trash-price">{trashPrice}</span>P</span>
                </div>
                <div id="zoom-controls" style={{ display: 'flex', gap: '6px', pointerEvents: 'auto', marginTop: '8px' }}>
                    <button className="zoom-btn" style={zoomBtnStyle} onClick={() => handleZoomBtn(0.15)} title="ズームイン">＋</button>
                    <button className="zoom-btn" style={zoomBtnStyle} onClick={() => handleZoomBtn(-0.15)} title="ズームアウト">－</button>
                    <button className="zoom-btn" style={{ ...zoomBtnStyle, fontSize: '12px' }} onClick={resetZoom} title="リセット">⟳</button>
                </div>
            </div>

            {cp && (
                <div id="map-ap-hud" style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', border: `2px solid ${cp.ap > 0 ? 'rgba(255,220,50,0.5)' : 'rgba(200,80,80,0.5)'}`, borderRadius: '10px', padding: '6px 12px', color: cp.ap > 0 ? '#f1c40f' : '#e74c3c', fontWeight: 'bold', fontSize: '18px', textShadow: '0 0 8px currentColor', pointerEvents: 'none', transition: 'all 0.3s' }}>
                    ⚡ <span id="map-ap-display">{cp.ap}</span>
                </div>
            )}

            <div id="game-board-container" className="panel" style={{ width: '100%', paddingBottom: '10px' }}>
                <div id="game-board-wrapper" ref={wrapperRef} style={{ 
                    overflow: 'hidden', 
                    width: '100%', 
                    maxHeight: 'calc(100vh - 280px)', 
                    cursor: 'grab', 
                    userSelect: 'none',
                    touchAction: 'none'
                }}>
                    {/* inline style の transition を削除。直接DOM操作（applyTransform）に任せる */}
                    <div id="game-board-inner" style={{ transformOrigin: 'top left', display: 'inline-block', willChange: 'transform' }}>
                        <div id="game-board" style={{ display: 'grid', gap: '20px', padding: '30px', borderRadius: '15px', border: '4px solid #3e2f2a', boxShadow: '4px 4px 0px rgba(0,0,0,0.4)', background: 'linear-gradient(to right,#b0b0b0 0%,#b0b0b0 32%,#f0c830 32%,#f0c830 68%,#f8f8f8 68%,#f8f8f8 100%)', width: 'max-content', margin: '0 auto', position: 'relative', isolation: 'isolate', gridTemplateColumns: `repeat(${maxCol}, var(--tile-size))`, gridTemplateRows: `repeat(${maxRow}, var(--tile-size))` }}>
                            
                            <BoardPaths />
                            <WeaponArcOverlay />

                            {mapData.map(tile => {
                                const owner = territories[tile.id] !== undefined ? players.find(p => p.id === territories[tile.id]) : null;
                                const isFog = visibleTiles && !visibleTiles.has(tile.id);
                                const isBranchTarget = isBranchPicking && currentBranchOptions.includes(tile.id);
                                const isClickable = npcMovePick !== null || isBranchTarget;
                                
                                const playersOnTile = players.filter(p => p.pos === tile.id && p.hp > 0);
                                const isActiveTurnPlayerOnTile = playersOnTile.some(p => p.id === turn);

                                let pathClass = '';
                                if (pathPreview.path1.has(tile.id)) pathClass = 'tile-path-1';
                                else if (pathPreview.path2.has(tile.id)) pathClass = 'tile-path-2';
                                else if (pathPreview.path3.has(tile.id)) pathClass = 'tile-path-3';
                                else if (pathPreview.manholes.has(tile.id)) pathClass = 'tile-manhole-linked';

                                return (
                                    <Tile 
                                        key={tile.id}
                                        tile={tile}
                                        owner={owner}
                                        isFog={isFog}
                                        isClickable={isClickable}
                                        onClick={() => handleTileClick(tile.id)}
                                        playersOnTile={playersOnTile}
                                        isActiveTurnPlayerOnTile={isActiveTurnPlayerOnTile}
                                        isTruck={tile.id === truckPos}
                                        isPolice={tile.id === policePos}
                                        isUncle={tile.id === unclePos}
                                        isAnimal={tile.id === animalPos}
                                        isYakuza={tile.id === yakuzaPos}
                                        isLoanshark={tile.id === loansharkPos}
                                        isFriend={tile.id === friendPos}
                                        pathClass={pathClass}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};