import React from 'react';
import { charEmoji, charImages } from '../../constants/characters';

export const CharImage = ({ charType, size = 40 }) => {
    const isImage = charImages && charImages[charType] !== undefined;

    return (
        <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isImage ? (
                <img 
                    src={charImages[charType].front} 
                    alt={charType} 
                    style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain', 
                        imageRendering: 'pixelated',
                        filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.4))'
                    }} 
                />
            ) : (
                <span style={{ fontSize: size * 0.75 }}>{charEmoji[charType] || '❓'}</span>
            )}
        </div>
    );
};