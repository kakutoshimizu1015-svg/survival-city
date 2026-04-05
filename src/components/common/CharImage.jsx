import React from 'react';
import { charEmoji, charImages, charSkins, npcImages } from '../../constants/characters';
import { useUserStore } from '../../store/useUserStore';

export const CharImage = ({ charType, skinId, size = 40, style = {}, imgStyle = {}, className = '' }) => {
    const liteMode = useUserStore(state => state.liteMode);
    
    // 引数で skinId が渡されていない場合は、現在のユーザーが装備しているものを取得
    const equippedSkins = useUserStore(state => state.equippedSkins);
    const activeSkinId = skinId || equippedSkins[charType];

    // キャラクターのスキン画像を探す
    let playerImgData = null;
    if (activeSkinId && charSkins[charType]) {
        playerImgData = charSkins[charType].find(s => s.id === activeSkinId);
    }
    // スキンが見つからなければデフォルト画像へフォールバック
    if (!playerImgData && charImages[charType]) {
        playerImgData = { front: charImages[charType].front };
    }

    const npcImgData = npcImages && npcImages[charType];
    const isImage = playerImgData !== null || npcImgData !== undefined;

    // ▼ 修正：背面画像は廃止したため常に front を利用
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