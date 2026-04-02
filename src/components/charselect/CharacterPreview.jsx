import React from 'react';
import { SkinSelector } from './SkinSelector';
import { charEmoji, charImages } from '../../constants/characters';

const CHAR_COLORS = {
  athlete:'#e74c3c', sales:'#3498db', survivor:'#2ecc71', yankee:'#e67e22',
  hacker:'#9b59b6', musician:'#f1c40f', doctor:'#1abc9c', gambler:'#e91e8c', detective:'#6c5ce7',
};

export const CharacterPreview = ({ character, show }) => {
  if (!character) {
    return (
      <div style={{ flex: 1, minWidth: 280, maxWidth: 480, background: 'rgba(92,74,68,0.25)', border: '1px solid rgba(141,110,99,0.2)', borderRadius: 12, padding: 24, minHeight: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 42, marginBottom: 10, opacity: 0.2 }}>👤</div>
        <div style={{ fontSize: 14, color: '#8d6e63', fontFamily: "'M PLUS Rounded 1c', sans-serif" }}>キャラクターを選んでください</div>
      </div>
    );
  }

  const color = CHAR_COLORS[character.key] || '#aaa';
  const isImage = charImages && charImages[character.key] !== undefined;

  return (
    <div style={{ flex: 1, minWidth: 280, maxWidth: 480, background: 'rgba(92,74,68,0.3)', border: '1px solid rgba(141,110,99,0.25)', borderRadius: 12, padding: 20, minHeight: 380, position: 'relative', overflow: 'hidden', animation: show ? 'charPreviewSlide 0.3s ease both' : 'none' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: '100%', background: `linear-gradient(180deg, ${color}, transparent)` }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 120, height: 120, borderRadius: 14, // 画像エリアをさらに大きく
          background: isImage ? 'transparent' : `linear-gradient(135deg, ${color}33, ${color}11)`, // 画像なら背景なし
          border: isImage ? 'none' : `2px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60, 
          boxShadow: isImage ? 'none' : `0 0 20px ${color}22`, flexShrink: 0, overflow: 'hidden'
        }}>
          {isImage ? (
            <img src={charImages[character.key].front} alt={character.name} style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0px 6px 8px rgba(0,0,0,0.5))' }} />
          ) : (
            character.emoji || charEmoji[character.key]
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fdf5e6', fontFamily: "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif" }}>
            {character.name}
          </div>
          <div style={{ fontSize: 12, color: '#b0a090', marginTop: 3, lineHeight: 1.5, fontStyle: 'italic' }}>
            「{character.tagline}」
          </div>
        </div>
      </div>

      <div style={{ background: `linear-gradient(135deg, ${color}11, transparent)`, borderRadius: 8, padding: 12, marginBottom: 10, border: `1px solid ${color}22` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: 2, fontFamily: "'M PLUS Rounded 1c', sans-serif" }}>▸ パッシブ</span>
          <span style={{ fontSize: 8, color: '#f1c40f', background: 'rgba(241,196,15,0.15)', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>常時発動</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fdf5e6', marginBottom: 3 }}>{character.passive?.name}</div>
        <div style={{ fontSize: 11, color: '#b0a090', lineHeight: 1.6 }}>{character.passive?.desc}</div>
      </div>

      <div style={{ background: 'rgba(253,245,230,0.03)', borderRadius: 8, padding: 12, marginBottom: 10, border: '1px solid rgba(141,110,99,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 9, color: '#8d6e63', fontWeight: 700, letterSpacing: 2, fontFamily: "'M PLUS Rounded 1c', sans-serif" }}>▸ アクティブスキル</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fdf5e6', marginBottom: 3 }}>{character.action?.name}</div>
        <div style={{ fontSize: 11, color: '#b0a090', lineHeight: 1.6 }}>{character.action?.desc}</div>
      </div>

      <SkinSelector charKey={character.key} color={color} />
    </div>
  );
};