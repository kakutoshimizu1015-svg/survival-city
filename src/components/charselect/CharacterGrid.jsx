import React from 'react';
import { CharacterIcon } from './CharacterIcon';

// ▼ 修正: isCreative, unlockedSkins, defaultUnlocked を引数に追加
export const CharacterGrid = ({ characters, selectedKey, hoveredKey, onSelect, onHover, onLeave, isCreative, unlockedSkins, defaultUnlocked }) => {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
      padding: 14, borderRadius: 12,
      background: 'rgba(92,74,68,0.3)', border: '1px solid rgba(141,110,99,0.3)',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
    }}>
      {characters.map((char) => {
        // ▼ 追加: このキャラがロックされているか判定
        const isLocked = !isCreative && !defaultUnlocked.includes(char.key) && !unlockedSkins.includes(char.key);
        
        return (
          <CharacterIcon
            key={char.key}
            charKey={char.key}
            emoji={char.emoji}
            name={char.name}
            isSelected={selectedKey === char.key}
            isHovered={hoveredKey === char.key}
            isLocked={isLocked} // ▼ 追加: ロック状態をアイコンに渡す
            onClick={onSelect}
            onHover={onHover}
            onLeave={onLeave}
          />
        );
      })}
    </div>
  );
};