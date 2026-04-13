import React from 'react';
import { CharImage } from '../common/CharImage';

const CHAR_COLORS = {
  athlete:'#e74c3c', sales:'#3498db', survivor:'#2ecc71', yankee:'#e67e22',
  hacker:'#9b59b6', musician:'#f1c40f', doctor:'#1abc9c', gambler:'#e91e8c', detective:'#6c5ce7',
  chef:'#e74c3c', scavenger:'#7f8c8d', billionaire:'#f1c40f', god:'#f39c12', emperor:'#e67e22', sennin:'#95a5a6'
};

// ▼ 修正: isLocked を引数に追加
export const CharacterIcon = ({ charKey, name, isSelected, isHovered, isLocked, onClick, onHover, onLeave }) => {
  const color = CHAR_COLORS[charKey] || '#aaa';

  return (
    <button
      onClick={() => onClick(charKey)}
      onMouseEnter={() => onHover(charKey)}
      onMouseLeave={() => onLeave()}
      style={{
        width: 90, height: 110, borderRadius: 10, border: 'none', cursor: isLocked ? 'not-allowed' : 'pointer',
        background: isSelected ? `linear-gradient(145deg, ${color}33, ${color}11)` : isHovered ? 'rgba(253,245,230,0.06)' : 'rgba(253,245,230,0.03)',
        position: 'relative', transition: 'all 0.18s ease',
        outline: isSelected ? `2px solid ${color}` : isHovered ? `1px solid ${color}88` : '1px solid rgba(141,110,99,0.25)',
        boxShadow: isSelected ? `0 0 20px ${color}33, inset 0 0 15px ${color}11` : 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        transform: isHovered ? 'scale(1.08)' : isSelected ? 'scale(1.03)' : 'scale(1)',
        zIndex: isHovered ? 5 : 1,
        touchAction: 'manipulation',
        overflow: 'hidden' // ▼ 追加: カバーが角丸からはみ出ないようにする
      }}
    >
      <div style={{
        transition: 'filter 0.2s', 
        filter: isSelected ? `drop-shadow(0 0 6px ${color})` : isLocked ? 'brightness(0.4) grayscale(100%)' : 'none' // ▼ 修正: ロック時は暗くする
      }}>
        <CharImage charType={charKey} size={64} imgStyle={{ filter: 'none' }} />
      </div>

      <span style={{
        fontSize: 12, fontWeight: 700, color: isSelected ? color : isLocked ? '#5c4a44' : '#b0a090', // ▼ 修正: ロック時の文字色
        fontFamily: "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif",
        transition: 'color 0.2s', letterSpacing: 1,
      }}>
        {name}
      </span>

      {isSelected && (
        <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 22, height: 3, borderRadius: 2, background: color, boxShadow: `0 0 8px ${color}` }} />
      )}

      {/* ▼ 追加: ロックされている時のオーバーレイ演出 */}
      {isLocked && (
        <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2
        }}>
            <span style={{ fontSize: 28, opacity: 0.9, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}>🔒</span>
        </div>
      )}
    </button>
  );
};