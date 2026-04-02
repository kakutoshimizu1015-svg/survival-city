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
        roundCount, maxRounds, weatherState, isRainy, canPrice, trashPrice, gameOver,
        autoScrollToPlayer
    } = useGameStore();

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

    // ▼ 追加: 自動スクロール用のターン追跡ref
    const prevAutoScrollTurn = useRef(-1);

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

    // ▼ 修正: 安全装置とモバイル向けパディングを追加した resetZoom
    const resetZoom = useCallback(() => {
        if (!wrapperRef.current) return;
        const board = document.getElementById('game-board');
        if (!board) return;
        
        const bw = board.scrollWidth;
        const bh = board.scrollHeight;
        let ww = wrapperRef.current.clientWidth;
        let wh = wrapperRef.current.clientHeight;

        if (bw === 0 || bh === 0 || ww === 0 || wh === 0) return;

        // 【安全対策】万が一ラッパーの高さが異常に大きい（画面を突き抜けている）場合はスマホ高さを基準にする
        if (wh > window.innerHeight) {
            wh = window.innerHeight * 0.5;
        }

        // スマホ画面幅の場合は少し余白を持たせる
        const paddingRatio = ww <= 768 ? 0.95 : 1.0; 

        const fitScale = Math.min(ww / bw, wh / bh, 1.0) * paddingRatio;
        scale.current = fitScale;
        
        // 中央揃えの計算
        offset.current = {
            x: (ww - bw * fitScale) / 2,
            y: (wh - bh * fitScale) / 2
        };
        applyTransform(true);
    }, [applyTransform]);

    const mapTileCount = mapData?.length || 0;

    // ▼ 修正: マウント時とリサイズ時に自動フィットを実行
    useEffect(() => {
        if (mapTileCount === 0) return; 
        
        // DOM描画のラグを考慮して少し待ってから実行
        const timer = setTimeout(() => {
            resetZoom();
        }, 150);

        // 画面サイズが変わった時（スマホの縦横回転など）もフィットし直す
        window.addEventListener('resize', resetZoom);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', resetZoom);
        };
    }, [mapTileCount, resetZoom]);

    // ▼ 追加: ターン開始時にプレイヤーのマス位置へ自動パン
    useEffect(() => {
        // 条件チェック: 設定OFF、マップ未読み込み、同じターンの重複実行を防止
        if (!autoScrollToPlayer) return;
        if (!wrapperRef.current) return;
        if (!mapData || mapData.length === 0) return;
        if (!cp) return;
        if (prevAutoScrollTurn.current === turn) return;
        if (gameOver) return;

        prevAutoScrollTurn.current = turn;

        // 現在のプレイヤーがいるマスのデータを取得
        const targetTile = mapData.find(t => t.id === cp.pos);
        if (!targetTile) return;

        // DOM描画の完了を待ってから実行（ターンバナー表示中の遅延も考慮）
        const timer = setTimeout(() => {
            if (!wrapperRef.current) return;

            // CSSの --tile-size を取得（デフォルト60px想定）
            const computedStyle = getComputedStyle(document.documentElement);
            const tileSizeStr = computedStyle.getPropertyValue('--tile-size').trim();
            const tileSize = parseInt(tileSizeStr, 10) || 60;
            const gap = 20;     // GameBoardのgrid gap
            const padding = 30; // GameBoardのpadding

            // マスのピクセル座標を計算（グリッドの左上基準）
            // col, row は1始まりなので -1 する
            const tilePixelX = padding + (targetTile.col - 1) * (tileSize + gap) + tileSize / 2;
            const tilePixelY = padding + (targetTile.row - 1) * (tileSize + gap) + tileSize / 2;

            // ラッパーの中央にそのマスが来るようにオフセットを計算
            const ww = wrapperRef.current.clientWidth;
            const wh = wrapperRef.current.clientHeight;
            const currentScale = scale.current;

            offset.current = {
                x: ww / 2 - tilePixelX * currentScale,
                y: wh / 2 - tilePixelY * currentScale
            };
            applyTransform(true);
        }, 300);

        return () => clearTimeout(timer);
    }, [turn, cp, mapData, autoScrollToPlayer, gameOver, applyTransform]);

    const getTouchCoords = (touches) => {
        return Array.from(touches).map(t => ({ clientX: t.clientX, clientY: t.clientY }));
    };

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
                const dx = (currentTouches[0].clientX - lastTouches.current[0].clientX) * sensitivity;
                const dy = (currentTouches[0].clientY - lastTouches.current[0].clientY) * sensitivity;
                offset.current = { x: offset.current.x + dx, y: offset.current.y + dy };
                applyTransform(false);
                if (e.cancelable) e.preventDefault();
            } else if (currentTouches.length === 2 && lastTouches.current.length === 2) {
                const prevDist = Math.hypot(
                    lastTouches.current[0].clientX - lastTouches.current[1].clientX,
                    lastTouches.current[0].clientY - lastTouches.current[1].clientY
                );
                const newDist = Math.hypot(
                    currentTouches[0].clientX - currentTouches[1].clientX,
                    currentTouches[0].clientY - currentTouches[1].clientY
                );
                const rect = wrapper.getBoundingClientRect();
                const cx = ((currentTouches[0].clientX + currentTouches[1].clientX) / 2) - rect.left;
                const cy = ((currentTouches[0].clientY + currentTouches[1].clientY) / 2) - rect.top;
                zoomAt(cx, cy, (newDist - prevDist) * 0.005);
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
                <div id="branch-prompt" style={{ display: 'block', background: 'rgba(149,165,166,0.95)', pointerEvents: 'auto', cursor: 'pointer' }} onClick={() => { useGameStore.setState({ npcMovePick: null }); useGameStore.getState().showToast("情報操作をキャンセルしました"); }}>
                    🕵️ 移動先マスをタップしてください（タップでキャンセル）
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
                <div id="zoom-controls" style={{ display: 'flex', flexDirection: 'row', position: 'static', gap: '6px', pointerEvents: 'auto', marginTop: '8px' }}>
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