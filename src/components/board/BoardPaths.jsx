import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getDepthScale } from '../../utils/gameLogic';

export const BoardPaths = () => {
    const mapData = useGameStore(state => state.mapData);

    if (!mapData || mapData.length === 0) return null;

    const TILE = 80;
    const GAP = 20;
    const PAD = 30;
    const STEP = TILE + GAP;
    const R = TILE / 2;

    const maxCol = Math.max(...mapData.map(t => t.col));
    const maxRow = Math.max(...mapData.map(t => t.row));
    const W = (maxCol - 1) * STEP + TILE + PAD * 2;
    const H = (maxRow - 1) * STEP + TILE + PAD * 2;

    const tcx = (t) => (t.col - 1) * STEP + R + PAD;
    const tcy = (t) => (t.row - 1) * STEP + R + PAD;

    const labelDefs = [
        { label: 'スラム', xFrac: 0.15, fill: 'rgba(30,30,30,0.32)' },
        { label: '商業', xFrac: 0.50, fill: 'rgba(70,45,0,0.32)' },
        { label: '高級住宅街', xFrac: 0.84, fill: 'rgba(40,40,70,0.32)' },
    ];

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
                    <polygon points="0,1 13,7 0,13" fill="rgba(0,0,0,0.55)" />
                </marker>
            </defs>

            {labelDefs.map((def, idx) => (
                <text
                    key={`label-${idx}`}
                    x={W * def.xFrac}
                    y={H * 0.5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="64"
                    fontWeight="900"
                    fill={def.fill}
                    fontFamily="'Hiragino Maru Gothic ProN','Meiryo',sans-serif"
                    letterSpacing="4"
                    pointerEvents="none"
                >
                    {def.label}
                </text>
            ))}

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

                    const x1 = fx + ux * (R + 4);
                    const y1 = fy + uy * (R + 4);
                    const x2 = tx - ux * (R + 8);
                    const y2 = ty - uy * (R + 8);

                    // 遠近法スケールの適用
                    const avgRow = (tile.row + nextTile.row) / 2;
                    const ds = getDepthScale(avgRow, maxRow);

                    return (
                        <line
                            key={`path-${tile.id}-${nextId}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={`rgba(0,0,0,${Math.max(0.2, 0.6 * ds)})`}
                            strokeWidth={Math.max(1.5, 7 * ds)}
                            strokeLinecap="round"
                            markerEnd="url(#arr-bk)"
                        />
                    );
                });
            })}
        </svg>
    );
};