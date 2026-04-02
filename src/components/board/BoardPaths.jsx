import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getTileW, getTileH } from '../../utils/gameLogic';

export const BoardPaths = () => {
    // オブジェクトの全体デストラクトを避け、個別に関数呼び出しして無限ループを防ぐ
    const mapData = useGameStore(state => state.mapData);

    if (!mapData || mapData.length === 0) return null;

    const labelDefs = [
        { label: 'スラム', xFrac: 0.15, fill: 'rgba(30,30,30,0.32)' },
        { label: '商業', xFrac: 0.50, fill: 'rgba(70,45,0,0.32)' },
        { label: '高級住宅街', xFrac: 0.84, fill: 'rgba(40,40,70,0.32)' },
    ];

    // マップ全体の幅と高さを計算 (絶対座標形式へ移行)
    const maxX = Math.max(...mapData.map(t => t.x));
    const maxRow = Math.max(...mapData.map(t => t.row));
    const W = maxX + 200;
    const H = maxRow * 80 + 200; // col/rowに基づくサイズではなく絶対座標

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
            </defs>

            {/* 背景のエリア文字（絶対座標に対応、Wを基準に配置） */}
            {labelDefs.map((def, idx) => (
                <text
                    key={`label-${idx}`}
                    x={W * def.xFrac}
                    y={H * 0.5} // 中央に配置
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

            {/* マスとマスを繋ぐ矢印（Z軸スケール計算による遠近法に対応） */}
            {mapData.map(tile => {
                const tw1 = getTileW(tile.z);
                const th1 = getTileH(tile.z);
                const fx = tile.x + tw1 / 2; // tile1の中央X座標
                const fy = tile.y + th1 / 2; // tile1の中央Y座標

                return tile.next.map(nextId => {
                    const nextTile = mapData.find(t => t.id === nextId);
                    if (!nextTile) return null;

                    const tw2 = getTileW(nextTile.z);
                    const th2 = getTileH(nextTile.z);
                    const tx = nextTile.x + tw2 / 2; // nextTileの中央X座標
                    const ty = nextTile.y + th2 / 2; // nextTileの中央Y座標
                    
                    const dx = tx - fx;
                    const dy = ty - fy;
                    const len = Math.sqrt(dx * dx + dy * dy);
                    
                    if (len < 2) return null;

                    const ux = dx / len;
                    const uy = dy / len;
                    const avgZ = (tile.z + nextTile.z) / 2;

                    // タイルの立体的な端から端へ矢印を引くための、dsを考慮したサイズ調整
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
                            // 立体マス用に遠近法（奥ほど細く薄く）を適用
                            stroke={`rgba(0,0,0,${Math.max(0.1, 0.5 - avgZ * 0.05)})`} 
                            strokeWidth={Math.max(2, 5 - avgZ * 0.4)} 
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