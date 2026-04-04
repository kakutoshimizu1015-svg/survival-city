import React from 'react';
import { charEmoji, charImages, npcImages } from '../../constants/characters';

export const CharImage = ({ charType, size = 40, style = {}, imgStyle = {}, className = '' }) => {
    // プレイヤー画像またはNPC画像からデータを取得
    const playerImgData = charImages && charImages[charType];
    const npcImgData = npcImages && npcImages[charType];
    const isImage = playerImgData !== undefined || npcImgData !== undefined;

    // 画像ソースの決定（プレイヤーはfrontプロパティ、NPCはそのまま）
    const imgSrc = playerImgData ? playerImgData.front : npcImgData;

    return (
        <div className={className} style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
            {isImage ? (
                <img 
                    src={imgSrc} 
                    alt={charType} 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain', 
                        // ブラウザの画像補間（ぼやけ）を無効化してドットをくっきりさせる
                        imageRendering: 'pixelated',
                        WebkitFontSmoothing: 'none',
                        filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.4))',
                        ...imgStyle 
                    }} 
                />
            ) : (
                <span style={{ fontSize: size * 0.75, filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.4))' }}>
                    {charEmoji[charType] || '❓'}
                </span>
            )}
        </div>
    );
};