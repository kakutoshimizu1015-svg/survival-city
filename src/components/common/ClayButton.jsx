import React from 'react';

// size: 'normal' | 'large'
// color: 'default' | 'blue' | 'brown' | 'green' | 'red'
export const ClayButton = ({ 
    children, 
    onClick, 
    disabled = false, 
    size = 'normal', 
    color = 'default',
    highlight = false,
    style = {} 
}) => {
    // クラス名の組み立て
    let className = size === 'large' ? 'btn-large' : 'btn-clay';
    
    if (color === 'blue') className += ' btn-blue';
    if (color === 'brown') className += ' btn-brown';
    if (color === 'green') className += ' btn-green';
    if (color === 'red') className += ' btn-end-clay'; // ターン終了などの赤いボタン
    
    if (highlight) className += ' btn-active-highlight';

    return (
        <button 
            className={className} 
            onClick={onClick} 
            disabled={disabled}
            style={style}
        >
            {children}
        </button>
    );
};