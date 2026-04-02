import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getTileW, getTileH } from '../../utils/gameLogic';

export const BoardPaths = () => {
    const { mapData } = useGameStore();

    if (!mapData || mapData.length === 0) return null;

    const labelDefs = [
        { label: 'スラム', xFrac: 0.15, fill: 'rgba(30,30,30,0.32)' },
        { label: '商業', xFrac: 0.50, fill: 'rgba(70,45,0,0.32)' },
        { label: '高級住宅街', xFrac: 0.84, fill: 'rgba(40,40,70,0.32)' },
    ];

    const maxX = Math.max(...mapData.map(t => t.x));
    const W = maxX + 200;

    return (
        <g id="board-path-group" style={{ pointerEvents: 'none' }}>
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
                
                {/* 奥行きを強調する深い霧のグラデーション */}
                <linearGradient id="depthFog" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(26,14,46,0.95)"/>
                    <stop offset="30%" stopColor="rgba(26,14,46,0.55)"/>
                    <stop offset="60%" stopColor="rgba(26,14,46,0.1)"/>
                    <stop offset="100%" stopColor="rgba(26,14,46,0)"/>
                </linearGradient>
            </defs>

            {/* 背景のエリア文字（スラム、商業など） */}
            {labelDefs.map((def, idx) => (
                <text
                    key={`label-${idx}`}
                    x={W * def.xFrac}
                    y={300}
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

            {/* マスとマスを繋ぐ矢印（Z軸スケール計算による遠近法） */}
            {mapData.map(tile => {
                const tw1 = getTileW(tile.z);
                const th1 = getTileH(tile.z);
                const fx = tile.x + tw1 / 2;
                const fy = tile.y + th1 / 2;

                return tile.next.map(nextId => {
                    const nextTile = mapData.find(t => t.id === nextId);
                    if (!nextTile) return null;

                    const tw2 = getTileW(nextTile.z);
                    const th2 = getTileH(nextTile.z);
                    const tx = nextTile.x + tw2 / 2;
                    const ty = nextTile.y + th2 / 2;
                    
                    const dx = tx - fx;
                    const dy = ty - fy;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    
                    if (len < 2) return null;

                    const ux = dx / len;
                    const uy = dy / len;
                    const avgZ = (tile.z + nextTile.z) / 2;

                    // タイルの端から端へ矢印を引く計算（スケールに応じて調整）
                    const x1 = fx + ux * (tw1/2 + 4);
                    const y1 = fy + uy * (th1/2 + 4);
                    const x2 = tx - ux * (tw2/2 + 8);
                    const y2 = ty - uy * (th2/2 + 8);

                    return (
                        <line
                            key={`path-${tile.id}-${nextId}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={`rgba(232,213,163,${Math.max(0.04, 0.4 - avgZ * 0.04)})`} 
                            strokeWidth={Math.max(1, 3.5 - avgZ * 0.35)} 
                            strokeDasharray={`${4 - avgZ * 0.3},${3 - avgZ * 0.2}`} 
                            strokeLinecap="round"
                            markerEnd="url(#arr-bk)"
                        />
                    );
                });
            })}
        </g>
    );
};