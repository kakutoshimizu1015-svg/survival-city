import React from 'react';

export const CharacterIcon = ({ charType, name, emoji, status, onClick, onMouseEnter, onMouseLeave }) => {
    let baseStyle = {
        position: 'relative', width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0', // 余白を削って最大化
        cursor: status === 'disabled' ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        background: '#fdf5e6',
        borderRadius: '12px',
    };

    if (status === 'hover') {
        baseStyle = { ...baseStyle, border: '6px solid #f1c40f', background: '#fff9e6' };
    } else if (status === 'selected') {
        baseStyle = { ...baseStyle, border: '6px solid #e74c3c', background: '#ffebeb' };
    } else {
        baseStyle = { ...baseStyle, border: '4px solid #8d6e63' };
    }

    if (status === 'disabled') {
        baseStyle = { ...baseStyle, opacity: 0.5 };
    }

    return (
        <div style={baseStyle} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            {/* アイコンを限界まで大きく */}
            <div style={{ fontSize: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
                {emoji}
            </div>
            
            {/* 名前を少し小さめにして下に配置 */}
            <div style={{
                position: 'absolute', bottom: '4px', left: '0', width: '100%',
                fontSize: '12px', fontWeight: 'bold', color: '#5d4037', textAlign: 'center',
                textShadow: '1px 1px 0 rgba(255,255,255,0.8)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                padding: '0 4px', boxSizing: 'border-box'
            }}>{name}</div>

            {status === 'selected' && (
                <div style={{ position: 'absolute', top: '4px', right: '4px', fontSize: '20px' }}>✅</div>
            )}
            {status === 'disabled' && (
                <div style={{ position: 'absolute', top: '4px', right: '4px', fontSize: '20px' }}>🔒</div>
            )}
        </div>
    );
};

export default CharacterIcon;