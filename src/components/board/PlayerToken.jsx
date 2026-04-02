import React, { useEffect, useRef, useState } from 'react';
import { charEmoji, charImages } from '../../constants/characters';

export const PlayerToken = ({ player, mapData, isActiveTurn }) => {
    const isImage = charImages[player.charType] !== undefined;
    const currentTile = mapData.find(t => t.id === player.pos) || mapData[0];
    
    const tokenRef = useRef(null);
    const prevPosRef = useRef(player.pos);
    // 0: 前(右向き), 180: 裏(左向き) - CSSのrotateYで制御し、完璧な裏表回転を実現
    const [facing, setFacing] = useState(0); 

    useEffect(() => {
        if (prevPosRef.current === player.pos) return;
        const startTile = mapData.find(t => t.id === prevPosRef.current);
        const endTile = mapData.find(t => t.id === player.pos);

        if (startTile && endTile && tokenRef.current) {
            // 移動方向の判定と回転
            const dx = endTile.col - startTile.col;
            const dy = endTile.row - startTile.row;
            
            if (dx > 0) setFacing(0);
            else if (dx < 0) setFacing(180);

            // CSS Gridの中でのピクセル移動距離を計算 (TILE_SIZE=60, GAP=20 -> 1マス80px)
            const pxDistX = -dx * 80;
            const pxDistY = -dy * 80;

            // アニメーション (始点から終点へジャンプしながらスライド)
            tokenRef.current.animate([
                { transform: `translate(calc(-50% + ${pxDistX}px), calc(-100% + ${pxDistY}px))` },
                { transform: `translate(calc(-50% + ${pxDistX * 0.5}px), calc(-100% + ${pxDistY * 0.5}px - 30px))` }, // ジャンプの頂点
                { transform: `translate(-50%, -100%)` }
            ], { duration: 400, easing: 'ease-out' });
        }
        prevPosRef.current = player.pos;
    }, [player.pos, mapData]);

    const shadowColor = isActiveTurn ? '#ffe066' : 'rgba(0,0,0,0.6)';

    return (
        <div style={{
            gridColumn: currentTile.col, // マス目と同じGridに配置するため絶対にズレない
            gridRow: currentTile.row,
            position: 'relative',
            width: '100%', height: '100%',
            zIndex: 50 + currentTile.row, // 手前のマスにいるほど前面に描画
            pointerEvents: 'none'
        }}>
            <div ref={tokenRef} style={{
                position: 'absolute',
                left: '50%', top: '80%', // マスの中心から少し下の「足元」を基準にする
                transform: 'translate(-50%, -100%)', 
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                <div style={{
                    width: 72, height: 72, // 画像サイズを大きく
                    position: 'relative',
                    transformStyle: 'preserve-3d', // CSSの3D空間を有効化
                    transform: `rotateY(${facing}deg)`, // ここが変わるだけでクルッと回る
                    transition: 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
                }}>
                    {isImage ? (
                        <>
                            {/* 表面の画像 */}
                            <img src={charImages[player.charType].front} alt="" 
                                style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', backfaceVisibility: 'hidden', filter: `drop-shadow(0 4px 6px ${shadowColor})` }} />
                            {/* 裏面の画像（あらかじめ180度裏返して配置しておく） */}
                            <img src={charImages[player.charType].back} alt="" 
                                style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', filter: `drop-shadow(0 4px 6px ${shadowColor})` }} />
                        </>
                    ) : (
                        <div style={{
                            width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: `2px solid ${isActiveTurn ? '#ffe066' : player.color}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '14px auto'
                        }}>
                            {charEmoji[player.charType]}
                        </div>
                    )}
                </div>

                <div style={{
                    marginTop: 2, fontSize: 12, fontWeight: 900, color: player.color,
                    textShadow: '1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000',
                    whiteSpace: 'nowrap'
                }}>
                    {player.name}
                </div>
            </div>
        </div>
    );
};