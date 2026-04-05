import React from 'react';
import { charEmoji, charImages, npcImages } from '../../constants/characters';
import { useUserStore } from '../../store/useUserStore'; // ▼ 修正: useUserStore をインポート

export const CharImage = ({ charType, size = 40, style = {}, imgStyle = {}, className = '' }) => {
    const liteMode = useUserStore(state => state.liteMode); // ▼ 修正: useUserStore から取得

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
                        imageRendering: playerImgData ? 'pixelated' : 'auto',
                        WebkitFontSmoothing: playerImgData ? 'none' : 'auto',
                        filter: liteMode ? 'none' : 'drop-shadow(0px 4px 4px rgba(0,0,0,0.4))',
                        ...imgStyle 
                    }} 
                />
            ) : (
                <span style={{ fontSize: size * 0.75, filter: liteMode ? 'none' : 'drop-shadow(0px 2px 2px rgba(0,0,0,0.4))' }}>
                    {charEmoji[charType] || '❓'}
                </span>
            )}
        </div>
    );
};