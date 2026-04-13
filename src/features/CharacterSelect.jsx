import React, { useState, useEffect, useMemo, useRef } from 'react';
import { charEmoji, charInfo, charDetailData } from '../constants/characters';
import { CharacterGrid } from '../components/charselect/CharacterGrid';
import { CharacterPreview } from '../components/charselect/CharacterPreview';
import { useUserStore } from '../store/useUserStore';

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
  chef:'#e74c3c', scavenger:'#7f8c8d', billionaire:'#f1c40f', god:'#f39c12', emperor:'#e67e22', sennin:'#95a5a6' // ▼ 追加
};

const DEFAULT_UNLOCKED_CHARS = ['yankee', 'athlete', 'survivor', 'sales', 'hacker', 'musician', 'doctor', 'gambler', 'detective'];

const UNLOCK_CONDITIONS = {
  chef: "解放条件: ミッション「10勝」達成",
  scavenger: "解放条件: ミッション「累計5,000P」達成",
  billionaire: "解放条件: ミッション「累計10万P」達成",
  god: "解放条件: ミッション「100勝」達成",
  emperor: "解放条件: ミッション「2万マス移動」達成",
  sennin: "解放条件: ミッション「NPC合計100回遭遇」達成"
};

/* ──────────────────────────────────────────────
   メインコンポーネント（独立したポップアップモーダル）
   ────────────────────────────────────────────── */
// ▼ 修正: isCreative を引数に追加
export const CharacterSelect = ({ isOpen, onClose, onConfirm, initialCharKey, targetName, isCreative }) => {
  const characters = useMemo(() => mergeCharacterData(), []);
  const { equippedSkins, unlockedSkins } = useUserStore(); // ▼ 追加: unlockedSkins
  
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

  // 決定時に charKey と skinId の両方を親に返す
  const handleConfirm = () => {
    const activeSkinId = equippedSkins[selectedKey] || "default";
    onConfirm(selectedKey, activeSkinId);
  };

  if (!isOpen) return null;

  // ▼ 修正: isCreative が true の場合はロック判定を無効化（常に false になる）
  const isLockedSelected = selectedKey && !isCreative && !DEFAULT_UNLOCKED_CHARS.includes(selectedKey) && !unlockedSkins.includes(selectedKey);

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
        
        /* ▼ 追加: スマホ（タッチデバイス）でのみ表示する注釈のCSS */
        .mobile-double-tap-notice {
            display: none;
        }
        @media (hover: none) and (pointer: coarse), (max-width: 768px) {
            .mobile-double-tap-notice {
                display: block;
                animation: fadeInUp 0.4s ease;
            }
        }
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

      {/* ▼ 追加: スマホ用注釈（PCでは非表示） */}
      <div className="mobile-double-tap-notice" style={{
        fontSize: 12, color: '#e67e22', fontWeight: 700, marginBottom: 15,
        textAlign: 'center', background: 'rgba(230, 126, 34, 0.15)', padding: '6px 16px', borderRadius: 20,
        border: '1px solid rgba(230, 126, 34, 0.3)'
      }}>
        📱 キャラをダブルタップしてね！スキン変更できるようになります
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
          isCreative={isCreative}             // ▼ 追加: クリエイティブモードフラグを渡す
          unlockedSkins={unlockedSkins}       // ▼ 追加: 解放済み配列を渡す
          defaultUnlocked={DEFAULT_UNLOCKED_CHARS} // ▼ 追加: デフォルトキャラ配列を渡す
          onSelect={(key) => {
             const isLocked = !isCreative && !DEFAULT_UNLOCKED_CHARS.includes(key) && !unlockedSkins.includes(key);
             if (!isLocked) setSelectedKey(key);
             else setHoveredKey(key); 
          }}
          onHover={setHoveredKey}
          onLeave={() => setHoveredKey(null)}
        />

        {/* プレビュー */}
        <div style={{ position: 'relative' }}>
          <CharacterPreview character={previewChar} show={showPreview} />
          {/* ▼ 修正: !isCreative 条件を追加し、クリエイティブ時はロック画面(黒い幕)を出さない */}
          {previewChar && !isCreative && !DEFAULT_UNLOCKED_CHARS.includes(previewChar.key) && !unlockedSkins.includes(previewChar.key) && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10,
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              borderRadius: 12, backdropFilter: 'blur(3px)'
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
              <div style={{ color: '#fdf5e6', fontWeight: 'bold', fontSize: 16, background: 'rgba(0,0,0,0.8)', padding: '12px 20px', borderRadius: 8, textAlign: 'center' }}>
                {UNLOCK_CONDITIONS[previewChar.key] || "未解放のキャラクターです"}
              </div>
            </div>
          )}
        </div>
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
          onClick={handleConfirm}
          disabled={isLockedSelected}
          style={{
            padding: '12px 40px', borderRadius: 8, border: 'none',
            background: isLockedSelected ? '#7f8c8d' : `linear-gradient(135deg, ${CHAR_COLORS[selectedKey] || '#f1c40f'}, ${CHAR_COLORS[selectedKey] ? CHAR_COLORS[selectedKey] + 'cc' : '#e67e22'})`,
            color: isLockedSelected ? '#bdc3c7' : '#1a1410', fontSize: 18, fontWeight: 900, cursor: isLockedSelected ? 'not-allowed' : 'pointer',
            fontFamily: "'M PLUS Rounded 1c', sans-serif", letterSpacing: 3,
            boxShadow: isLockedSelected ? 'none' : `0 4px 15px ${CHAR_COLORS[selectedKey] || '#f1c40f'}44`,
            transition: 'all 0.2s',
          }}
        >
          ✓ 決定する
        </button>
      </div>
    </div>
  );
};