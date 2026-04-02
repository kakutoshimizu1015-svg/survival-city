import React from 'react';

const CHAR_COLORS = {
  athlete:'#e74c3c', sales:'#3498db', survivor:'#2ecc71', yankee:'#e67e22',
  hacker:'#9b59b6', musician:'#f1c40f', doctor:'#1abc9c', gambler:'#e91e8c', detective:'#6c5ce7',
};

export const CharacterIcon = ({ charKey, emoji, name, isSelected, isHovered, isLocked, lockedByLabel, onClick, onHover, onLeave }) => {
  const color = CHAR_COLORS[charKey] || '#aaa';
  const disabled = isLocked;

  return (
    <button
      onClick={() => !disabled && onClick(charKey)}
      onMouseEnter={() => onHover(charKey)}
      onMouseLeave={() => onLeave()}
      onTouchStart={() => onHover(charKey)}
      style={{
        width: 88, height: 100, borderRadius: 10, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: isSelected
          ? `linear-gradient(145deg, ${color}33, ${color}11)`
          : disabled
          ? 'rgba(30,25,20,0.6)'
          : isHovered
          ? 'rgba(253,245,230,0.06)'
          : 'rgba(253,245,230,0.03)',
        position: 'relative', 
        transition: 'all 0.18s ease',
        outline: isSelected ? `2px solid ${color}` : isHovered && !disabled ? `1px solid ${color}88` : '1px solid rgba(141,110,99,0.25)',
        boxShadow: isSelected ? `0 0 20px ${color}33, inset 0 0 15px ${color}11` : 'none',
        opacity: disabled ? 0.35 : 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
        filter: disabled ? 'grayscale(0.7)' : 'none',
        transform: isHovered && !disabled ? 'scale(1.08)' : isSelected ? 'scale(1.03)' : 'scale(1)',
        zIndex: isHovered ? 5 : 1,
      }}
    >
      <span style={{
        fontSize: 34, display: 'block', 
        filter: isSelected ? `drop-shadow(0 0 6px ${color})` : 'none',
        transition: 'filter 0.2s',
      }}>
        {emoji}
      </span>
      <span style={{
        fontSize: 11, fontWeight: 700, 
        color: isSelected ? color : '#b0a090',
        fontFamily: "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif",
        transition: 'color 0.2s', letterSpacing: 1,
      }}>
        {name}
      </span>

      {/* ロック済みバッジ */}
      {disabled && lockedByLabel && (
        <div style={{
          position: 'absolute', top: 3, right: 3, fontSize: 9, fontWeight: 700,
          background: 'rgba(0,0,0,0.7)', color: '#f1c40f', borderRadius: 4, 
          padding: '1px 5px', fontFamily: "'M PLUS Rounded 1c', sans-serif",
        }}>
          {lockedByLabel}
        </div>
      )}

      {/* 選択中インジケーター */}
      {isSelected && !disabled && (
        <div style={{
          position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)',
          width: 22, height: 3, borderRadius: 2, background: color,
          boxShadow: `0 0 8px ${color}`,
        }} />
      )}
    </button>
  );
};
