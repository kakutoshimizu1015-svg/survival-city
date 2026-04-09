import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getDepthScale } from '../../utils/gameLogic';
import { MAP_CONFIG } from '../../constants/maps';

export const BoardPaths = () => {
    const mapData = useGameStore(state => state.mapData);

    if (!mapData || mapData.length === 0) return null;

    const TILE = MAP_CONFIG.TILE_SIZE;
    const GAP = MAP_CONFIG.GAP;
    const PAD = MAP_CONFIG.PADDING;

    const BASE_STROKE_WIDTH = TILE * (7 / 80);
    const STEP = TILE + GAP;
    const R = TILE / 2;

    const maxCol = Math.max(...mapData.map(t => t.col));
    const maxRow = Math.max(...mapData.map(t => t.row));
    const W = (maxCol - 1) * STEP + TILE + PAD * 2;
    const H = (maxRow - 1) * STEP + TILE + PAD * 2;

    const tcx = (t) => (t.col - 1) * STEP + R + PAD;
    const tcy = (t) => (t.row - 1) * STEP + R + PAD;

    return (
        <svg
            id="board-path-svg"
            viewBox={`0 0 ${W} ${H}`}
            width={W}
            height={H}
            style={{
                pointerEvents: 'none',
                display: 'block',
                overflow: 'visible',
                background: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 2
            }}
        >
            <defs>
                <marker
                    id="arr-bk"
                    viewBox="0 0 14 14"
                    refX="7"
                    refY="7"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto"
                >
                    <polygon points="0,1 13,7 0,13" fill="rgba(0,0,0,0.85)" />
                </marker>
            </defs>

            {mapData.map(tile => {
                const fx = tcx(tile);
                const fy = tcy(tile);

                return tile.next.map(nextId => {
                    const nextTile = mapData.find(t => t.id === nextId);
                    if (!nextTile) return null;

                    const tx = tcx(nextTile);
                    const ty = tcy(nextTile);
                    const dx = tx - fx;
                    const dy = ty - fy;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    
                    if (len < 2) return null;

                    const ux = dx / len;
                    const uy = dy / len;

                    const f_ds = getDepthScale(tile.row, maxRow);
                    const t_ds = getDepthScale(nextTile.row, maxRow);

                    // ★ 修正: 矢印が突き刺さらないよう、すき間もTILE_SIZEの割合で自動計算する
                    const gapBase = TILE * 0.05; // 80pxの時は4px、45pxの時は約2px

                    const x1 = fx + ux * ((R * f_ds) + gapBase); 
                    const y1 = fy + uy * ((R * f_ds) + gapBase);
                    const x2 = tx - ux * ((R * t_ds) + gapBase * 2.5); // 先端は少し広めに空ける
                    const y2 = ty - uy * ((R * t_ds) + gapBase * 2.5);

                    const avgRow = (tile.row + nextTile.row) / 2;
                    const ds = getDepthScale(avgRow, maxRow);

                    return (
                        <line
                            key={`path-${tile.id}-${nextId}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="rgba(0,0,0,0.85)"
                            strokeWidth={Math.max(1.5, BASE_STROKE_WIDTH * ds)}
                            strokeLinecap="round"
                            markerEnd="url(#arr-bk)"
                        />
                    );
                });
            })}
        </svg>
    );
};