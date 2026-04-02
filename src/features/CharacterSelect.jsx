import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { charEmoji, charInfo, charDetailData } from '../constants/characters';

/* ══════════════════════════════════════════════════════════════
   characters.js の3オブジェクトをマージしてUI用リストを生成
   ══════════════════════════════════════════════════════════════ */
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
  athlete: '#e74c3c', sales: '#3498db', survivor: '#2ecc71', yankee: '#e67e22',
  hacker: '#9b59b6', musician: '#f1c40f', doctor: '#1abc9c', gambler: '#e91e8c', detective: '#6c5ce7',
};

/* ══════════════════════════════════════════════════════════════
   SkinSelector — 将来拡張用プレースホルダー
   ══════════════════════════════════════════════════════════════ */
const SkinSelector = ({ color }) => (
  <div style={{ marginTop: 14 }}>
    <div style={{ fontSize: 10, color: '#8d6e63', fontWeight: 700, marginBottom: 6, letterSpacing: 2 }}>
      ▸ スキン
    </div>
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <div style={{
        width: 34, height: 34, borderRadius: 6,
        border: `2px solid ${color}`,
        background: `linear-gradient(135deg, ${color}44, ${color}22)`,
        boxShadow: `0 0 10px ${color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 8, color: '#fdf5e6', fontWeight: 700,
      }}>✓</div>
      {[1, 2].map(i => (
        <div key={i} style={{
          width: 34, height: 34, borderRadius: 6,
          border: '1px dashed rgba(141,110,99,0.3)',
          background: 'rgba(30,25,20,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, opacity: 0.3, cursor: 'not-allowed',
        }}>🔒</div>
      ))}
      <span style={{ fontSize: 9, color: 'rgba(141,110,99,0.5)', marginLeft: 4 }}>
        COMING SOON
      </span>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   CharacterIcon — グリッド内の個々のキャラアイコン
   ══════════════════════════════════════════════════════════════ */
const CharacterIcon = ({ charKey, emoji, name, isSelected, isHovered, isLocked, lockedByLabel, onClick, onHover, onLeave }) => {
  const color = CHAR_COLORS[charKey] || '#aaa';
  const disabled = isLocked;

  return (
    <button
      onClick={() => !disabled && onClick(charKey)}
      onMouseEnter={() => onHover(charKey)}
      onMouseLeave={() => onLeave()}
      onTouchStart={() => onHover(charKey)}
      style={{
        width: 88, height: 100, borderRadius: 10, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: isSelected
          ? `linear-gradient(145deg, ${color}33, ${color}11)`
          : disabled
            ? 'rgba(30,25,20,0.6)'
            : isHovered
              ? 'rgba(253,245,230,0.06)'
              : 'rgba(253,245,230,0.03)',
        position: 'relative',
        transition: 'all 0.18s ease',
        outline: isSelected
          ? `2px solid ${color}`
          : isHovered && !disabled
            ? `1px solid ${color}88`
            : '1px solid rgba(141,110,99,0.25)',
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
      }}>{emoji}</span>
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: isSelected ? color : '#b0a090',
        transition: 'color 0.2s', letterSpacing: 1,
      }}>{name}</span>

      {disabled && lockedByLabel && (
        <div style={{
          position: 'absolute', top: 3, right: 3, fontSize: 9, fontWeight: 700,
          background: 'rgba(0,0,0,0.7)', color: '#f1c40f', borderRadius: 4,
          padding: '1px 5px',
        }}>{lockedByLabel}</div>
      )}
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

/* ══════════════════════════════════════════════════════════════
   CharacterGrid — 3×3 アイコングリッド
   ══════════════════════════════════════════════════════════════ */
const CharacterGrid = ({ characters, selectedKey, hoveredKey, lockedChars, onSelect, onHover, onLeave }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
    padding: 14, borderRadius: 12,
    background: 'rgba(92,74,68,0.3)', border: '1px solid rgba(141,110,99,0.3)',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
  }}>
    {characters.map(char => {
      const lockEntry = lockedChars[char.key];
      return (
        <CharacterIcon
          key={char.key}
          charKey={char.key}
          emoji={char.emoji}
          name={char.name}
          isSelected={selectedKey === char.key}
          isHovered={hoveredKey === char.key}
          isLocked={!!lockEntry}
          lockedByLabel={lockEntry || null}
          onClick={onSelect}
          onHover={onHover}
          onLeave={onLeave}
        />
      );
    })}
  </div>
);

/* ══════════════════════════════════════════════════════════════
   CharacterPreview — 選択/ホバー中キャラの詳細パネル
   ══════════════════════════════════════════════════════════════ */
const CharacterPreview = ({ character, show }) => {
  if (!character) {
    return (
      <div style={{
        flex: 1, minWidth: 280, maxWidth: 480,
        background: 'rgba(92,74,68,0.25)', border: '1px solid rgba(141,110,99,0.2)',
        borderRadius: 12, padding: 24, minHeight: 380,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 42, marginBottom: 10, opacity: 0.2 }}>👤</div>
        <div style={{ fontSize: 14, color: '#8d6e63' }}>キャラクターを選んでください</div>
      </div>
    );
  }

  const color = CHAR_COLORS[character.key] || '#aaa';

  return (
    <div style={{
      flex: 1, minWidth: 280, maxWidth: 480,
      background: 'rgba(92,74,68,0.3)', border: '1px solid rgba(141,110,99,0.25)',
      borderRadius: 12, padding: 20, minHeight: 380,
      position: 'relative', overflow: 'hidden',
      animation: show ? 'charPreviewSlide 0.3s ease both' : 'none',
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 3, height: '100%',
        background: `linear-gradient(180deg, ${color}, transparent)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 14,
          background: `linear-gradient(135deg, ${color}33, ${color}11)`,
          border: `2px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, boxShadow: `0 0 20px ${color}22`, flexShrink: 0,
        }}>{character.emoji}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fdf5e6' }}>{character.name}</div>
          <div style={{ fontSize: 11, color: '#b0a090', marginTop: 3, lineHeight: 1.5, fontStyle: 'italic' }}>
            「{character.tagline}」
          </div>
        </div>
      </div>

      <div style={{
        background: `linear-gradient(135deg, ${color}11, transparent)`,
        borderRadius: 8, padding: 12, marginBottom: 10,
        border: `1px solid ${color}22`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: 2 }}>▸ パッシブ</span>
          <span style={{
            fontSize: 8, color: '#f1c40f', background: 'rgba(241,196,15,0.15)',
            padding: '1px 6px', borderRadius: 3, fontWeight: 700,
          }}>常時発動</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fdf5e6', marginBottom: 3 }}>{character.passive?.name}</div>
        <div style={{ fontSize: 11, color: '#b0a090', lineHeight: 1.6 }}>{character.passive?.desc}</div>
      </div>

      <div style={{
        background: 'rgba(253,245,230,0.03)', borderRadius: 8, padding: 12, marginBottom: 10,
        border: '1px solid rgba(141,110,99,0.2)',
      }}>
        <span style={{ fontSize: 9, color: '#8d6e63', fontWeight: 700, letterSpacing: 2 }}>▸ アクティブスキル</span>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fdf5e6', marginTop: 5, marginBottom: 3 }}>{character.action?.name}</div>
        <div style={{ fontSize: 11, color: '#b0a090', lineHeight: 1.6 }}>{character.action?.desc}</div>
      </div>

      <SkinSelector color={color} />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   CharacterSelect — メインコンポーネント
   配置先: src/features/CharacterSelect.jsx
   ══════════════════════════════════════════════════════════════ */
export const CharacterSelect = () => {
  const characters = useMemo(() => mergeCharacterData(), []);
  const players = useGameStore(s => s.players);
  const setGameState = useGameStore(s => s.setGameState);

  const isOnline = useNetworkStore(s => s.status === 'connected');
  const myUserId = useNetworkStore(s => s.myUserId);
  const isHost = useNetworkStore(s => s.isHost);
  const lobbyPlayers = useNetworkStore(s => s.lobbyPlayers);
  const updateMyInfo = useNetworkStore(s => s.updateMyInfo);
  const broadcast = useNetworkStore(s => s.broadcast);

  const [hoveredKey, setHoveredKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectingIndex, setSelectingIndex] = useState(0);
  const [lockedChars, setLockedChars] = useState({});
  const [selections, setSelections] = useState({});
  const [allDone, setAllDone] = useState(false);
  const [shaking, setShaking] = useState(false);
  const prevKey = useRef(null);

  const targetPlayers = useMemo(() => {
    if (isOnline) return lobbyPlayers || [];
    return players || [];
  }, [isOnline, lobbyPlayers, players]);

  const humanPlayers = useMemo(
    () => targetPlayers.filter(p => !p.isCPU),
    [targetPlayers]
  );

  const currentPlayer = humanPlayers[selectingIndex] || null;

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
      newLocked[pick] = 'CPU';
      usedKeys.add(pick);
    });
    setSelections(newSelections);
    setLockedChars(newLocked);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedKey && selectedKey !== prevKey.current) {
      setShowPreview(false);
      const t = setTimeout(() => setShowPreview(true), 40);
      prevKey.current = selectedKey;
      return () => clearTimeout(t);
    }
    if (selectedKey) setShowPreview(true);
  }, [selectedKey]);

  const previewChar = useMemo(() => {
    const key = hoveredKey ?? selectedKey;
    return characters.find(c => c.key === key) || null;
  }, [hoveredKey, selectedKey, characters]);

  const handleConfirm = useCallback(() => {
    if (!selectedKey || lockedChars[selectedKey]) return;
    const player = isOnline
      ? targetPlayers.find(p => p.userId === myUserId)
      : currentPlayer;
    if (!player) return;
    const playerId = player.userId || player.id;
    const playerLabel = player.name || `P${selectingIndex + 1}`;

    setShaking(true);
    setTimeout(() => setShaking(false), 350);
    setLockedChars(prev => ({ ...prev, [selectedKey]: playerLabel }));
    setSelections(prev => ({ ...prev, [playerId]: selectedKey }));

    if (isOnline) {
      updateMyInfo({ charType: selectedKey, charLocked: true });
    }
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

  useEffect(() => {
    if (!isOnline) return;
    const allLocked = lobbyPlayers.every(p => p.isCPU || p.charLocked);
    setAllDone(allLocked);
  }, [isOnline, lobbyPlayers]);

  const handleStart = useCallback(() => {
    if (isOnline) {
      if (isHost) {
        setGameState({ gamePhase: 'playing' });
        broadcast({ type: 'GAME_START', gameState: useGameStore.getState() });
      }
    } else {
      const updatedPlayers = players.map(p => {
        const pId = p.userId || p.id;
        const charKey = selections[pId] || p.charType || 'athlete';
        return { ...p, charType: charKey };
      });
      setGameState({ players: updatedPlayers, gamePhase: 'playing' });
    }
  }, [isOnline, isHost, players, selections, setGameState, broadcast]);

  const handleBack = useCallback(() => {
    if (selectingIndex > 0 && !isOnline) {
      const prevPlayer = humanPlayers[selectingIndex - 1];
      const prevId = prevPlayer?.userId || prevPlayer?.id;
      const prevCharKey = selections[prevId];
      if (prevCharKey) {
        setLockedChars(prev => { const next = { ...prev }; delete next[prevCharKey]; return next; });
        setSelections(prev => { const next = { ...prev }; delete next[prevId]; return next; });
      }
      setSelectingIndex(selectingIndex - 1);
      setSelectedKey(prevCharKey || null);
      setAllDone(false);
    } else {
      setGameState({ gamePhase: isOnline ? 'online_lobby' : 'setup_offline' });
    }
  }, [selectingIndex, isOnline, humanPlayers, selections, setGameState]);

  const myLockedOnline = isOnline && lobbyPlayers.find(p => p.userId === myUserId)?.charLocked;
  const canInteract = isOnline ? !myLockedOnline : !allDone;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(180deg, #1a1410 0%, #2c221a 40%, #1a1410 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      color: '#fdf5e6', overflow: 'auto',
    }}>
      <style>{`
        @keyframes charPreviewSlide { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeInUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes shakeAnim { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 15px rgba(241,196,15,0.2)} 50%{box-shadow:0 0 25px rgba(241,196,15,0.4)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(253,245,230,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(253,245,230,0.3) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 50 }}>
        <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(253,245,230,0.03), transparent)', animation: 'scanline 6s linear infinite' }} />
      </div>

      <div style={{ textAlign: 'center', padding: '24px 0 8px', position: 'relative', zIndex: 2, width: '100%' }}>
        <h1 style={{
          fontSize: 26, fontWeight: 900, letterSpacing: 6, margin: 0, color: '#f1c40f',
          textShadow: '0 0 20px rgba(241,196,15,0.3), 0 2px 4px rgba(0,0,0,0.5)',
        }}>キャラクター選択</h1>
        <div style={{ fontSize: 10, color: '#8d6e63', marginTop: 4, letterSpacing: 3, fontWeight: 700 }}>
          CHARACTER SELECT — SURVIVAL CITY
        </div>
      </div>

      {!isOnline && !allDone && currentPlayer && (
        <div style={{
          background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.25)',
          borderRadius: 8, padding: '8px 24px', marginBottom: 12,
          fontSize: 14, fontWeight: 700, color: '#f1c40f',
          animation: 'fadeInUp 0.3s ease', zIndex: 2,
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
          fontSize: 14, fontWeight: 700, color: '#3498db', zIndex: 2,
        }}>
          🌐 あなたのキャラクターを選択してください
        </div>
      )}

      <div style={{
        display: 'flex', maxWidth: 880, width: '100%', padding: '0 16px', gap: 20,
        flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start',
        animation: shaking ? 'shakeAnim 0.35s ease' : 'none',
        position: 'relative', zIndex: 2,
      }}>
        <CharacterGrid
          characters={characters}
          selectedKey={canInteract ? selectedKey : null}
          hoveredKey={hoveredKey}
          lockedChars={lockedChars}
          onSelect={(key) => canInteract && setSelectedKey(key)}
          onHover={setHoveredKey}
          onLeave={() => setHoveredKey(null)}
        />
        <CharacterPreview character={previewChar} show={showPreview} />
      </div>

      <div style={{
        display: 'flex', gap: 12, marginTop: 20, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <button onClick={handleBack} style={{
          padding: '12px 28px', borderRadius: 8, border: '1px solid rgba(141,110,99,0.4)',
          background: 'rgba(92,74,68,0.5)', color: '#b0a090', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', transition: 'all 0.2s',
        }}>
          ◂ {selectingIndex > 0 && !isOnline ? '前のプレイヤー' : '戻る'}
        </button>

        {canInteract && selectedKey && !lockedChars[selectedKey] && (
          <button onClick={handleConfirm} style={{
            padding: '12px 40px', borderRadius: 8, border: 'none',
            background: `linear-gradient(135deg, ${CHAR_COLORS[selectedKey] || '#f1c40f'}, ${(CHAR_COLORS[selectedKey] || '#f1c40f') + 'cc'})`,
            color: '#1a1410', fontSize: 16, fontWeight: 900, cursor: 'pointer',
            letterSpacing: 3,
            boxShadow: `0 4px 15px ${(CHAR_COLORS[selectedKey] || '#f1c40f') + '44'}`,
            transition: 'all 0.2s', animation: 'fadeInUp 0.25s ease',
          }}>
            決定 ▸
          </button>
        )}

        {allDone && (!isOnline || isHost) && (
          <button onClick={handleStart} style={{
            padding: '14px 48px', borderRadius: 8, border: '2px solid #f1c40f',
            background: 'linear-gradient(135deg, #f1c40f, #e67e22)',
            color: '#1a1410', fontSize: 18, fontWeight: 900, cursor: 'pointer',
            letterSpacing: 4,
            boxShadow: '0 0 20px rgba(241,196,15,0.3)',
            animation: 'pulseGlow 2s ease infinite, fadeInUp 0.4s ease',
            transition: 'all 0.2s',
          }}>
            🎮 ゲーム開始
          </button>
        )}
      </div>

      {targetPlayers.length > 1 && (
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
          padding: '0 16px 20px', position: 'relative', zIndex: 2,
        }}>
          {targetPlayers.map((p, i) => {
            const pId = p.userId || p.id;
            const charKey = selections[pId];
            const emoji = charKey ? charEmoji[charKey] : '❓';
            const isSelecting = !isOnline && !allDone && humanPlayers.indexOf(currentPlayer) === targetPlayers.indexOf(p) && !p.isCPU;
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
                }}>{p.name || (p.isCPU ? `CPU${i + 1}` : `P${i + 1}`)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
