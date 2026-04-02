import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { charEmoji, charInfo, charDetailData } from '../constants/characters';
import { CharacterGrid } from '../components/charselect/CharacterGrid';
import { CharacterPreview } from '../components/charselect/CharacterPreview';

/* ──────────────────────────────────────────────
   定数データをマージして統一的なキャラクターリストを生成
   ※ characters.js の3オブジェクト構造はそのまま維持
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
   メインコンポーネント
   ────────────────────────────────────────────── */
export const CharacterSelect = () => {
  const characters = useMemo(() => mergeCharacterData(), []);
  const players = useGameStore(s => s.players);
  const setGameState = useGameStore(s => s.setGameState);

  // ネットワーク状態
  const isOnline = useNetworkStore(s => s.status === 'connected');
  const myUserId = useNetworkStore(s => s.myUserId);
  const isHost = useNetworkStore(s => s.isHost);
  const lobbyPlayers = useNetworkStore(s => s.lobbyPlayers);
  const updateMyInfo = useNetworkStore(s => s.updateMyInfo);
  const broadcast = useNetworkStore(s => s.broadcast);

  // UI状態（ローカルのみ・同期不要）
  const [hoveredKey, setHoveredKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // オフライン: 何番目のプレイヤーが選択中か
  const [selectingIndex, setSelectingIndex] = useState(0);
  // { charKey: 'P1ラベル' } の形式。ロック済みキャラを追跡
  const [lockedChars, setLockedChars] = useState({});
  // プレイヤーごとの選択結果 { playerId: charKey }
  const [selections, setSelections] = useState({});
  // 全員完了フラグ
  const [allDone, setAllDone] = useState(false);
  // 演出用
  const [shaking, setShaking] = useState(false);
  const prevKey = useRef(null);

  /* ──── 対象プレイヤーリスト（オフライン / オンライン共通） ──── */
  const targetPlayers = useMemo(() => {
    if (isOnline) return lobbyPlayers || [];
    return players || [];
  }, [isOnline, lobbyPlayers, players]);

  // 人間プレイヤーのみ（CPU除外）
  const humanPlayers = useMemo(
    () => targetPlayers.filter(p => !p.isCPU),
    [targetPlayers]
  );

  // 現在選択中のプレイヤー情報（オフライン用）
  const currentPlayer = humanPlayers[selectingIndex] || null;

  /* ──── CPU自動選択（初回マウント時） ──── */
  useEffect(() => {
    const cpus = targetPlayers.filter(p => p.isCPU);
    if (cpus.length === 0) return;

    const usedKeys = new Set(Object.values(selections));
    const available = [...CHAR_KEYS];
    const newSelections = { ...selections };
    const newLocked = { ...lockedChars };

    cpus.forEach(cpu => {
      const remaining = available.filter(k => !usedKeys.has(k) && !newLocked[k]);
      const pick = remaining[Math.floor(Math.random() * remaining.length)] || available[0];
      newSelections[cpu.userId || cpu.id] = pick;
      newLocked[pick] = `CPU`;
      usedKeys.add(pick);
    });

    setSelections(newSelections);
    setLockedChars(newLocked);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  /* ──── 決定（ロック） ──── */
  const handleConfirm = useCallback(() => {
    if (!selectedKey || lockedChars[selectedKey]) return;
    const player = isOnline
      ? targetPlayers.find(p => p.userId === myUserId)
      : currentPlayer;
    if (!player) return;

    const playerId = player.userId || player.id;
    const playerLabel = player.name || `P${selectingIndex + 1}`;

    // 演出
    setShaking(true);
    setTimeout(() => setShaking(false), 350);

    // ロック
    setLockedChars(prev => ({ ...prev, [selectedKey]: playerLabel }));
    setSelections(prev => ({ ...prev, [playerId]: selectedKey }));

    // オンライン: 自分のcharTypeを同期
    if (isOnline) {
      updateMyInfo({ charType: selectedKey, charLocked: true });
    }

    // オフライン: 次のプレイヤーへ
    if (!isOnline) {
      const nextIdx = selectingIndex + 1;
      if (nextIdx >= humanPlayers.length) {
        setAllDone(true);
      } else {
        setSelectingIndex(nextIdx);
        setSelectedKey(null);
        setShowPreview(false);
        prevKey.current = null;
      }
    }
  }, [selectedKey, lockedChars, isOnline, currentPlayer, selectingIndex, humanPlayers.length, myUserId, targetPlayers, updateMyInfo]);

  /* ──── オンライン: 全員ロック済みか監視 ──── */
  useEffect(() => {
    if (!isOnline) return;
    const allLocked = lobbyPlayers.every(p => p.isCPU || p.charLocked);
    setAllDone(allLocked);
  }, [isOnline, lobbyPlayers]);

  /* ──── ゲーム開始 ──── */
  const handleStart = useCallback(() => {
    if (isOnline) {
      // オンライン: ホストがplayersを構築してブロードキャスト
      // ※ 実際のゲーム開始処理はOnlineLobbyの startGame ロジックに準拠
      // ここでは lobbyPlayers の charType が既に同期されている前提で playing へ遷移
      if (isHost) {
        setGameState({ gamePhase: 'playing' });
        broadcast({ type: 'GAME_START', gameState: useGameStore.getState() });
      }
    } else {
      // オフライン: players の charType を selections で上書きしてゲーム開始
      const updatedPlayers = players.map(p => {
        const pId = p.userId || p.id;
        const charKey = selections[pId] || p.charType || 'athlete';
        return { ...p, charType: charKey };
      });
      setGameState({ players: updatedPlayers, gamePhase: 'playing' });
    }
  }, [isOnline, isHost, players, selections, setGameState, broadcast]);

  /* ──── 戻るボタン ──── */
  const handleBack = useCallback(() => {
    if (selectingIndex > 0 && !isOnline) {
      // 前のプレイヤーに戻す
      const prevPlayer = humanPlayers[selectingIndex - 1];
      const prevId = prevPlayer?.userId || prevPlayer?.id;
      const prevCharKey = selections[prevId];
      if (prevCharKey) {
        setLockedChars(prev => {
          const next = { ...prev };
          delete next[prevCharKey];
          return next;
        });
        setSelections(prev => {
          const next = { ...prev };
          delete next[prevId];
          return next;
        });
      }
      setSelectingIndex(selectingIndex - 1);
      setSelectedKey(prevCharKey || null);
      setAllDone(false);
    } else {
      // セットアップ画面に戻る
      setGameState({ gamePhase: isOnline ? 'online_lobby' : 'setup_offline' });
    }
  }, [selectingIndex, isOnline, humanPlayers, selections, setGameState]);

  /* ──── 自分がロック済みか（オンライン用） ──── */
  const myLockedOnline = isOnline && lobbyPlayers.find(p => p.userId === myUserId)?.charLocked;

  /* ──── 現在操作可能か ──── */
  const canInteract = isOnline ? !myLockedOnline : !allDone;

  return (
    <div style={{
      position: 'fixed', inset: 0, 
      background: 'linear-gradient(180deg, #1a1410 0%, #2c221a 40%, #1a1410 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: "'M PLUS Rounded 1c', 'Noto Sans JP', sans-serif",
      color: '#fdf5e6', overflow: 'auto',
    }}>
      {/* CSS アニメーション定義 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;900&display=swap');
        @keyframes charPreviewSlide { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeInUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes shakeAnim { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 15px rgba(241,196,15,0.2)} 50%{box-shadow:0 0 25px rgba(241,196,15,0.4)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
      `}</style>

      {/* 背景グリッドエフェクト */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(253,245,230,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(253,245,230,0.3) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }} />
      {/* スキャンライン */}
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
        <div style={{ fontSize: 10, color: '#8d6e63', marginTop: 4, letterSpacing: 3, fontWeight: 700 }}>
          CHARACTER SELECT — SURVIVAL CITY
        </div>
      </div>

      {/* ──── 現在のプレイヤー表示 ──── */}
      {!isOnline && !allDone && currentPlayer && (
        <div style={{
          background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.25)',
          borderRadius: 8, padding: '8px 24px', marginBottom: 12,
          fontSize: 14, fontWeight: 700, color: '#f1c40f',
          animation: 'fadeInUp 0.3s ease',
        }}>
          🎮 {currentPlayer.name || `P${selectingIndex + 1}`} のキャラクターを選択
          <span style={{ fontSize: 11, color: '#8d6e63', marginLeft: 10 }}>
            ({selectingIndex + 1} / {humanPlayers.length})
          </span>
        </div>
      )}
      {isOnline && !myLockedOnline && (
        <div style={{
          background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.25)',
          borderRadius: 8, padding: '8px 24px', marginBottom: 12,
          fontSize: 14, fontWeight: 700, color: '#3498db',
        }}>
          🌐 あなたのキャラクターを選択してください
        </div>
      )}

      {/* ──── メインレイアウト ──── */}
      <div style={{
        display: 'flex', maxWidth: 880, width: '100%', padding: '0 16px', gap: 20,
        flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start',
        animation: shaking ? 'shakeAnim 0.35s ease' : 'none',
        position: 'relative', zIndex: 2,
      }}>
        {/* グリッド */}
        <CharacterGrid
          characters={characters}
          selectedKey={canInteract ? selectedKey : null}
          hoveredKey={hoveredKey}
          lockedChars={lockedChars}
          onSelect={(key) => canInteract && setSelectedKey(key)}
          onHover={setHoveredKey}
          onLeave={() => setHoveredKey(null)}
        />

        {/* プレビュー */}
        <CharacterPreview character={previewChar} show={showPreview} />
      </div>

      {/* ──── 下部ボタンエリア ──── */}
      <div style={{
        display: 'flex', gap: 12, marginTop: 20, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center',
        position: 'relative', zIndex: 2,
      }}>
        {/* 戻るボタン */}
        <button
          onClick={handleBack}
          style={{
            padding: '12px 28px', borderRadius: 8, border: '1px solid rgba(141,110,99,0.4)',
            background: 'rgba(92,74,68,0.5)', color: '#b0a090', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s',
            fontFamily: "'M PLUS Rounded 1c', sans-serif",
          }}
          onMouseEnter={e => { e.target.style.background = 'rgba(92,74,68,0.8)'; e.target.style.color = '#fdf5e6'; }}
          onMouseLeave={e => { e.target.style.background = 'rgba(92,74,68,0.5)'; e.target.style.color = '#b0a090'; }}
        >
          ◂ {selectingIndex > 0 && !isOnline ? '前のプレイヤー' : '戻る'}
        </button>

        {/* 決定ボタン（選択中キャラがある場合） */}
        {canInteract && selectedKey && !lockedChars[selectedKey] && (
          <button
            onClick={handleConfirm}
            style={{
              padding: '12px 40px', borderRadius: 8, border: 'none',
              background: `linear-gradient(135deg, ${CHAR_COLORS[selectedKey] || '#f1c40f'}, ${CHAR_COLORS[selectedKey] ? CHAR_COLORS[selectedKey] + 'cc' : '#e67e22'})`,
              color: '#1a1410', fontSize: 16, fontWeight: 900, cursor: 'pointer',
              fontFamily: "'M PLUS Rounded 1c', sans-serif", letterSpacing: 3,
              boxShadow: `0 4px 15px ${CHAR_COLORS[selectedKey] || '#f1c40f'}44`,
              transition: 'all 0.2s', animation: 'fadeInUp 0.25s ease',
            }}
            onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; e.target.style.filter = 'brightness(1.15)'; }}
            onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.filter = 'brightness(1)'; }}
          >
            決定 ▸
          </button>
        )}

        {/* ゲーム開始ボタン（全員選択完了時） */}
        {allDone && (!isOnline || isHost) && (
          <button
            onClick={handleStart}
            style={{
              padding: '14px 48px', borderRadius: 8, border: '2px solid #f1c40f',
              background: 'linear-gradient(135deg, #f1c40f, #e67e22)',
              color: '#1a1410', fontSize: 18, fontWeight: 900, cursor: 'pointer',
              fontFamily: "'M PLUS Rounded 1c', sans-serif", letterSpacing: 4,
              boxShadow: '0 0 20px rgba(241,196,15,0.3)',
              animation: 'pulseGlow 2s ease infinite, fadeInUp 0.4s ease',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.target.style.transform = 'scale(1.06)'; }}
            onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}
          >
            🎮 ゲーム開始
          </button>
        )}
      </div>

      {/* ──── 選択状況バー ──── */}
      {targetPlayers.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
          padding: '0 16px 20px', position: 'relative', zIndex: 2,
        }}>
          {targetPlayers.map((p, i) => {
            const pId = p.userId || p.id;
            const charKey = selections[pId];
            const emoji = charKey ? charEmoji[charKey] : '❓';
            const isSelecting = !isOnline && !allDone && i === humanPlayers.indexOf(currentPlayer) && !p.isCPU;
            return (
              <div key={pId} style={{
                background: isSelecting ? 'rgba(241,196,15,0.15)' : 'rgba(92,74,68,0.3)',
                border: isSelecting ? '1px solid rgba(241,196,15,0.4)' : '1px solid rgba(141,110,99,0.2)',
                borderRadius: 8, padding: '6px 12px', minWidth: 70, textAlign: 'center',
                transition: 'all 0.3s',
              }}>
                <div style={{ fontSize: 20 }}>{emoji}</div>
                <div style={{
                  fontSize: 10, fontWeight: 700, marginTop: 2,
                  color: charKey ? '#fdf5e6' : '#8d6e63',
                }}>
                  {p.name || (p.isCPU ? `CPU${i + 1}` : `P${i + 1}`)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
