import React, { useState, useEffect, useMemo, useRef } from 'react';
import { charEmoji, charInfo, charDetailData } from '../constants/characters';
import { CharacterGrid } from '../components/charselect/CharacterGrid';
import { CharacterPreview } from '../components/charselect/CharacterPreview';

/* ──────────────────────────────────────────────
   定数データをマージして統一的なキャラクターリストを生成
   ────────────────────────────────────────────── */
const CHAR_KEYS = Object.keys(charInfo);

const mergeCharacterData = () =>
  CHAR_KEYS.map(key => ({
    key,
    emoji: charEmoji[key] || '❓',
    name: charInfo[key]?.name || key,
    desc: charInfo[key]?.desc || '',
    tagline: charDetailData[key]?.tagline || '',
    passive: charDetailData[key]?.passive || { name: '', desc: '' },
    action: charDetailData[key]?.action || { name: '', desc: '' },
  }));

const CHAR_COLORS = {
  athlete:'#e74c3c', sales:'#3498db', survivor:'#2ecc71', yankee:'#e67e22',
  hacker:'#9b59b6', musician:'#f1c40f', doctor:'#1abc9c', gambler:'#e91e8c', detective:'#6c5ce7',
};

/* ──────────────────────────────────────────────
   メインコンポーネント（独立したポップアップモーダル）
   ────────────────────────────────────────────── */
export const CharacterSelect = ({ isOpen, onClose, onConfirm, initialCharKey, targetName }) => {
  const characters = useMemo(() => mergeCharacterData(), []);
  
  // UI状態
  const [hoveredKey, setHoveredKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const prevKey = useRef(null);

  // モーダルが開かれたら初期キャラをセット
  useEffect(() => {
    if (isOpen) {
        setSelectedKey(initialCharKey || 'athlete');
        setHoveredKey(null);
    }
  }, [isOpen, initialCharKey]);

  /* ──── キャラ選択時のプレビュー切替アニメーション ──── */
  useEffect(() => {
    if (selectedKey && selectedKey !== prevKey.current) {
      setShowPreview(false);
      const t = setTimeout(() => setShowPreview(true), 40);
      prevKey.current = selectedKey;
      return () => clearTimeout(t);
    }
    if (selectedKey) setShowPreview(true);
  }, [selectedKey]);

  /* ──── 表示するキャラデータ（ホバー優先 → 選択中） ──── */
  const previewChar = useMemo(() => {
    const key = hoveredKey ?? selectedKey;
    return characters.find(c => c.key === key) || null;
  }, [hoveredKey, selectedKey, characters]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000,
      background: 'linear-gradient(180deg, #1a1410 0%, #2c221a 40%, #1a1410 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif",
      color: '#fdf5e6', overflow: 'auto',
    }}>
      <style>{`
        @keyframes charPreviewSlide { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeInUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
      `}</style>

      {/* 背景エフェクト */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(253,245,230,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(253,245,230,0.3) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 50 }}>
        <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(253,245,230,0.03), transparent)', animation: 'scanline 6s linear infinite' }} />
      </div>

      {/* ──── ヘッダー ──── */}
      <div style={{ textAlign: 'center', padding: '24px 0 8px', position: 'relative', zIndex: 2, width: '100%' }}>
        <h1 style={{
          fontSize: 26, fontWeight: 900, letterSpacing: 6, margin: 0,
          color: '#f1c40f',
          textShadow: '0 0 20px rgba(241,196,15,0.3), 0 2px 4px rgba(0,0,0,0.5)',
        }}>
          キャラクター選択
        </h1>
      </div>

      {/* ──── 現在のプレイヤー表示 ──── */}
      <div style={{
        background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.25)',
        borderRadius: 8, padding: '8px 24px', marginBottom: 12,
        fontSize: 14, fontWeight: 700, color: '#f1c40f',
        animation: 'fadeInUp 0.3s ease',
      }}>
        🎮 {targetName} のキャラクターを選択
      </div>

      {/* ──── メインレイアウト ──── */}
      <div style={{
        display: 'flex', maxWidth: 880, width: '100%', padding: '0 16px', gap: 20,
        flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start',
        position: 'relative', zIndex: 2,
      }}>
        {/* グリッド */}
        <CharacterGrid
          characters={characters}
          selectedKey={selectedKey}
          hoveredKey={hoveredKey}
          onSelect={setSelectedKey}
          onHover={setHoveredKey}
          onLeave={() => setHoveredKey(null)}
        />

        {/* プレビュー */}
        <CharacterPreview character={previewChar} show={showPreview} />
      </div>

      {/* ──── 下部ボタンエリア ──── */}
      <div style={{
        display: 'flex', gap: 15, marginTop: 30, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '12px 28px', borderRadius: 8, border: '1px solid rgba(141,110,99,0.4)',
            background: 'rgba(92,74,68,0.5)', color: '#b0a090', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'M PLUS Rounded 1c', sans-serif",
          }}
        >
          ✖ キャンセル
        </button>

        <button
          onClick={() => onConfirm(selectedKey)}
          style={{
            padding: '12px 40px', borderRadius: 8, border: 'none',
            background: `linear-gradient(135deg, ${CHAR_COLORS[selectedKey] || '#f1c40f'}, ${CHAR_COLORS[selectedKey] ? CHAR_COLORS[selectedKey] + 'cc' : '#e67e22'})`,
            color: '#1a1410', fontSize: 18, fontWeight: 900, cursor: 'pointer',
            fontFamily: "'M PLUS Rounded 1c', sans-serif", letterSpacing: 3,
            boxShadow: `0 4px 15px ${CHAR_COLORS[selectedKey] || '#f1c40f'}44`,
            transition: 'all 0.2s',
          }}
        >
          ✓ 決定する
        </button>
      </div>
    </div>
  );
};