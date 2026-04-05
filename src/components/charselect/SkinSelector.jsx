import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import { charSkins } from '../../constants/characters';

export const SkinSelector = ({ charKey, color }) => {
  const { unlockedSkins, equippedSkins, setEquippedSkin } = useUserStore();
  const skins = charSkins[charKey] || [];
  
  // スキンがデフォルト1つしかないキャラクターの場合は表示しない
  if (skins.length <= 1) return null;

  const currentSkinId = equippedSkins[charKey] || 'default';

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{
        fontSize: 10, color: '#8d6e63', fontWeight: 700, marginBottom: 6,
        fontFamily: "'M PLUS Rounded 1c', sans-serif", letterSpacing: 2,
      }}>
        ▸ スキン選択
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {skins.map(skin => {
          const isUnlocked = skin.id === 'default' || unlockedSkins.includes(skin.id);
          const isSelected = currentSkinId === skin.id;

          return (
            <div 
              key={skin.id}
              onClick={() => isUnlocked && setEquippedSkin(charKey, skin.id)}
              style={{
                width: 42, height: 42, borderRadius: 8, 
                border: isSelected ? `2px solid ${color}` : '2px solid transparent',
                background: isSelected ? `linear-gradient(135deg, ${color}44, ${color}22)` : 'rgba(30,25,20,0.6)',
                boxShadow: isSelected ? `0 0 10px ${color}33` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                opacity: isUnlocked ? 1 : 0.4,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <img 
                src={skin.front} 
                alt={skin.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              {!isUnlocked && (
                <div style={{
                  position: 'absolute', inset: 0, 
                  background: 'rgba(0,0,0,0.6)', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>
                  🔒
                </div>
              )}
              {isSelected && (
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  background: color, borderRadius: '50%', width: 14, height: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#000', fontWeight: 'bold'
                }}>✓</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};