import React, { useMemo, useRef, useEffect, useCallback, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getDistance, getPathPreviewTiles, getManholeLinkedTiles, getTileW, getTileH } from '../../utils/gameLogic';
import { executeMove } from '../../game/actions';
import { WeaponArcOverlay } from '../overlays/WeaponArcOverlay';
import { BoardPaths } from './BoardPaths';
import { Tile } from './Tile';
import { TileTooltip } from '../overlays/TileTooltip';
import { PlayerToken } from './PlayerToken';

export const GameBoard = () => {
    const { 
        mapData, players, turn, territories, truckPos, policePos, unclePos, animalPos, yakuzaPos, loansharkPos, friendPos, 
        isNight, npcMovePick, isBranchPicking, currentBranchOptions,
        roundCount, maxRounds, weatherState, isRainy, canPrice, trashPrice, gameOver,
        autoScrollToPlayer
    } = useGameStore();

    const cp = players[turn];
    // カメラ制御用のステート (プレビュー版のロジック)
    const [cam, setCam] = useState({ x: 0, y: 0, zoom: 1 });
    const wrapperRef = useRef(null);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0, cx: 0, cy: 0 });
    const prevAutoScrollTurn = useRef(-1);

    // カメラ制御（ドラッグ、ズーム、リセット）の実装
    const onPointerDown = useCallback((e) => {
        // TileTooltipやHUD、NPC選択時はドラッグ不可
        if (e.target.closest("button") || e.target.closest(".tile")) return;
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [cam]);

    const onPointerMove = useCallback((e) => {
        if (!isDragging.current) return;
        const dx = (e.clientX - dragStart.current.x) / cam.zoom;
        const dy = (e.clientY - dragStart.current.y) / cam.zoom;
        setCam(c => ({ ...c, x: dragStart.current.cx + dx, y: dragStart.current.cy + dy }));
    }, [cam.zoom]);

    const onPointerUp = useCallback(() => { isDragging.current = false; }, []);

    const onWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.92 : 1.08; // ズーム倍率
        setCam(c => ({ ...c, zoom: Math.min(3, Math.max(0.25, c.zoom * delta)) }));
    }, []);

    const handleZoomBtn = (delta) => setCam(c => ({ ...c, zoom: Math.min(3, Math.max(0.25, c.zoom + delta)) }));
    const resetZoom = useCallback(() => setCam({ x: 0, y: 0, zoom: 1 }), []);

    const mapTileCount = mapData?.length || 0;

    // マップ読み込み時の自動初期配置 (resetZoom)
    useEffect(() => {
        if (mapTileCount === 0) return; 
        const timer = setTimeout(() => { resetZoom(); }, 150);
        return () => clearTimeout(timer);
    }, [mapTileCount, resetZoom]);

    // プレイヤーターン時のオートスクロールの実装 (viewBox操作へ移行)
    useEffect(() => {
        if (!autoScrollToPlayer || !mapData || mapData.length === 0 || !cp || prevAutoScrollTurn.current === turn || gameOver) return;
        prevAutoScrollTurn.current = turn;
        const targetTile = mapData.find(t => t.id === cp.pos);
        if (!targetTile) return;

        const timer = setTimeout(() => {
            const tw = getTileW(targetTile.z);
            const th = getTileH(targetTile.z);
            // 画面中心へカメラを移動する計算
            setCam(c => ({ ...c, x: -(targetTile.x + tw/2) + 310, y: -(targetTile.y + th/2) + 250 }));
        }, 300);

        return () => clearTimeout(timer);
    }, [turn, cp, mapData, autoScrollToPlayer, gameOver]);

    const handleTileClick = (tileId) => {
        if (isDragging.current) return;
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
    
    // ViewBoxの計算 (プレビュー版のロジック復元、310,250はSVGの中心)
    const vw = wrapperRef.current ? wrapperRef.current.clientWidth / cam.zoom : 620 / cam.zoom;
    const vh = wrapperRef.current ? wrapperRef.current.clientHeight / cam.zoom : 500 / cam.zoom;
    const vx = (wrapperRef.current ? wrapperRef.current.clientWidth / 2 : 310) - vw / 2 - cam.x;
    const vy = (wrapperRef.current ? wrapperRef.current.clientHeight / 2 : 250) - vh / 2 - cam.y;

    return (
        <div id="board-area" style={{ flexGrow: 1, overflowX: 'hidden', minWidth: 0, position: 'relative' }}>
            <TileTooltip />
            
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
                </div>
            </div>

            {cp && (
                <div id="map-ap-hud" style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', border: `2px solid ${cp.ap > 0 ? 'rgba(255,220,50,0.5)' : 'rgba(200,80,80,0.5)'}`, borderRadius: '10px', padding: '6px 12px', color: cp.ap > 0 ? '#f1c40f' : '#e74c3c', fontWeight: 'bold', fontSize: '18px', textShadow: '0 0 8px currentColor', pointerEvents: 'none', transition: 'all 0.3s' }}>
                    ⚡ <span id="map-ap-display">{cp.ap}</span>
                </div>
            )}

            <div id="game-board-container" ref={wrapperRef} className="panel" style={{ width: '100%', paddingBottom: '10px', height: 'calc(100vh - 280px)', background: "linear-gradient(180deg, #1a0e2e 0%, #1a2a1e 35%, #1a1a2e 100%)", position: "relative", overflow: "hidden", touchAction: "none" }}>
                {/* 星空背景エフェクト */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
                    {[...Array(40)].map((_, i) => (
                        <div key={i} style={{ position: "absolute", left: `${(i * 31 + 11) % 100}%`, top: `${(i * 19 + 3) % 30}%`, width: i % 5 === 0 ? 3 : 1.5, height: i % 5 === 0 ? 3 : 1.5, borderRadius: "50%", background: `rgba(255,255,${200 + (i % 55)},${0.15 + (i % 4) * 0.1})`, animation: `twinkle ${1.8 + (i % 4) * 0.7}s ease-in-out infinite ${i * 0.2}s` }} />
                    ))}
                </div>
                
                {/* 完全SVGキャンバス移行 */}
                <svg 
                    id="game-board-svg" 
                    viewBox={`${vx} ${vy} ${vw} ${vh}`} 
                    style={{ width: "100%", height: "100%", display: "block", position: "relative", zIndex: 1, cursor: isDragging.current ? "grabbing" : "grab" }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp} // キャンセル時もUpと同じ処理
                    onWheel={onWheel}
                >
                    <BoardPaths />
                    <WeaponArcOverlay />

                    {/* タイル描画（Y座標ソートで奥から手前へ） */}
                    {[...mapData].sort((a, b) => a.y - b.y).map(tile => {
                        const owner = territories[tile.id] !== undefined ? players.find(p => p.id === territories[tile.id]) : null;
                        const isFog = visibleTiles && !visibleTiles.has(tile.id);
                        const isBranchTarget = isBranchPicking && currentBranchOptions.includes(tile.id);
                        const isClickable = npcMovePick !== null || isBranchTarget;
                        
                        let pathClass = '';
                        if (pathPreview.path1.has(tile.id)) pathClass = 'tile-path-1';
                        else if (pathPreview.path2.has(tile.id)) pathClass = 'tile-path-2';
                        else if (pathPreview.path3.has(tile.id)) pathClass = 'tile-path-3';
                        else if (pathPreview.manholes.has(tile.id)) pathClass = 'tile-manhole-linked';

                        return (
                            <Tile 
                                key={tile.id} tile={tile} owner={owner} isFog={isFog} isClickable={isClickable} onClick={() => handleTileClick(tile.id)}
                                isTruck={tile.id === truckPos} isPolice={tile.id === policePos} isUncle={tile.id === unclePos} isAnimal={tile.id === animalPos} isYakuza={tile.id === yakuzaPos} isLoanshark={tile.id === loansharkPos} isFriend={tile.id === friendPos} pathClass={pathClass}
                            />
                        );
                    })}

                    {/* プレイヤー駒描画（絶対座標(SVG)に対応） */}
                    {players.filter(p => p.hp > 0).map(p => {
                        const isFog = visibleTiles && !visibleTiles.has(p.pos);
                        if (isFog) return null;
                        return <PlayerToken key={p.id} player={p} mapData={mapData} isActiveTurn={p.id === turn} />;
                    })}

                    {/* 霧グラデーション (Defsで定義し、最前面を覆うように配置) */}
                    <defs>
                        <linearGradient id="depthFog" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(230,230,230,0.85)"/>
                            <stop offset="30%" stopColor="rgba(230,230,230,0.55)"/>
                            <stop offset="60%" stopColor="rgba(230,230,230,0.1)"/>
                            <stop offset="100%" stopColor="rgba(230,230,230,0)"/>
                        </linearGradient>
                    </defs>
                    <rect 
                        x={vx} y={vy} 
                        width={vw} height={vh * 0.45} // 上部45%を覆う
                        fill="url(#depthFog)" 
                        style={{ pointerEvents: "none" }}
                    />
                </svg>
            </div>
            <style>{`@keyframes twinkle { 0%,100% { opacity: 0.15; } 50% { opacity: 0.7; } }`}</style>
        </div>
    );
};