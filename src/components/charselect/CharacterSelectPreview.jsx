import { useState, useEffect, useMemo, useRef } from "react";

/* ── 実際の characters.js のデータを埋め込み（プレビュー用） ── */
const charEmoji = { athlete:'🏃', sales:'💼', survivor:'🌿', yankee:'👊', hacker:'💻', musician:'🎸', doctor:'🩺', gambler:'🎲', detective:'🕵️' };
const charInfo = {
  athlete:  { name:'元アスリート',           desc:'【健脚】移動常1AP・雨無効 / 【疾風ダッシュ】3AP:3マス先へ跳躍' },
  sales:    { name:'元営業マン',             desc:'【コミュ力】バイト80%・ショップ1P割引 / 【訪問販売】2AP:カード押付けて3P徴収' },
  survivor: { name:'サバイバー',             desc:'【危機察知】ゴミ漁り失敗ペナ無効 / 【野宿】2AP:HP+15回復' },
  yankee:   { name:'元ヤン',                desc:'【威圧】同マス/すれ違いで自動1Pカツアゲ / 【殴る】2AP:同マス相手に10ダメ' },
  hacker:   { name:'元ハッカー',             desc:'【クラウドストレージ】手札上限+2 / 【遠隔ハッキング】3AP:どこからでもショップ操作' },
  musician: { name:'ストリートミュージシャン',  desc:'【投げ銭】他者が隣接で銀行+3P / 【路上ライブ】4AP:周囲2マス全員を引き寄せ' },
  doctor:   { name:'闇医者',                desc:'【自己治癒】ターン開始時HP+5 / 【闇診療】2AP:同マス相手HP+30→5P徴収' },
  gambler:  { name:'ギャンブラー',            desc:'【アドレナリン】ゾロ目でAP倍+HP10回復 / 【イカサマ勝負】2AP:1d6対決' },
  detective:{ name:'元探偵',                desc:'【張り込み】自陣地侵入者の手札没収 / 【情報操作】3AP:NPC1体を移動' },
};
const charDetailData = {
  athlete:  { tagline:'雨も夜も止まらない、鍛え抜かれた肉体', passive:{name:'【健脚】',desc:'移動コストが常に1AP固定。雨の日の移動ペナルティを完全無効化。'}, action:{name:'【疾風ダッシュ】 (3AP)',desc:'ダイス後でも使用可。3マス先の到達点を列挙し、選んだ地点へ即時跳躍。'} },
  sales:    { tagline:'口八丁で金を生み出す、元・敏腕セールスマン', passive:{name:'【コミュ力】',desc:'バイト成功率80%。ショップの購入価格が常に1P割引。'}, action:{name:'【訪問販売】 (2AP)',desc:'同マスの相手にランダムな手札1枚を押し付け、3Pを徴収する。'} },
  survivor: { tagline:'過酷な路上生活を生き抜いてきた、不死身のホームレス', passive:{name:'【危機察知】',desc:'ゴミ漁り失敗時の警察ペナルティを完全無効化。'}, action:{name:'【野宿】 (2AP)',desc:'その場でHP15を即時回復。持久戦型スキル。'} },
  yankee:   { tagline:'一度睨まれたら誰でも縮み上がる、元不良の威圧感', passive:{name:'【威圧】',desc:'同マス・すれ違った他プレイヤーから自動で1Pをカツアゲ（1ターン最大2P）。'}, action:{name:'【殴る】 (2AP)',desc:'同マスの相手に10ダメージ。Pとして落とさせる直接攻撃。'} },
  hacker:   { tagline:'情報の海を泳ぐ、孤高のデジタル浮浪者', passive:{name:'【クラウドストレージ】',desc:'手札上限+2枚。リュック装備と重複可能。'}, action:{name:'【遠隔ハッキング】 (3AP)',desc:'どこにいてもショップの品揃えを強制入替えし、1枚購入できる。'} },
  musician: { tagline:'路上ライブで人々を引き寄せる、カリスマ流浪のアーティスト', passive:{name:'【投げ銭】',desc:'他プレイヤーが隣接マスに止まる/通過するたびに銀行から3P獲得。'}, action:{name:'【路上ライブ】 (4AP)',desc:'周囲2マス以内の全プレイヤーを自分のマスに強制引き寄せ。'} },
  doctor:   { tagline:'闇の診療所を開く、危うい善意の医者', passive:{name:'【自己治癒】',desc:'毎ターン開始時に自動でHP5回復。持久型パッシブ。'}, action:{name:'【闇診療】 (2AP)',desc:'同マスの相手のHP30回復、5Pを強制徴収。助けるフリのカツアゲ。'} },
  gambler:  { tagline:'運命を賭けることに喜びを感じる、無一文の賭博師', passive:{name:'【アドレナリン】',desc:'ゾロ目でAPが倍+HP10回復。高リスク高リターン。'}, action:{name:'【イカサマ勝負】 (2AP)',desc:'同マスの相手と1〜6の対決。勝者が5Pを奪う。同点は仕掛け側の負け。'} },
  detective:{ tagline:'陰からすべてを見通す、元・辣腕探偵', passive:{name:'【張り込み】',desc:'自分の陣地に他プレイヤーが止まった時、手札を1枚没収。'}, action:{name:'【情報操作】 (3AP)',desc:'マップ上のNPCを1体選び、任意のマスへ瞬間移動させる。'} },
};

const CHAR_KEYS = Object.keys(charInfo);
const CHAR_COLORS = {
  athlete:'#e74c3c', sales:'#3498db', survivor:'#2ecc71', yankee:'#e67e22',
  hacker:'#9b59b6', musician:'#f1c40f', doctor:'#1abc9c', gambler:'#e91e8c', detective:'#6c5ce7',
};

const characters = CHAR_KEYS.map(key => ({
  key, emoji: charEmoji[key], name: charInfo[key].name,
  tagline: charDetailData[key]?.tagline || '',
  passive: charDetailData[key]?.passive || {},
  action: charDetailData[key]?.action || {},
}));

/* ── SkinSelector ── */
const SkinSelector = ({ color }) => (
  <div style={{ marginTop: 14 }}>
    <div style={{ fontSize: 10, color: '#8d6e63', fontWeight: 700, marginBottom: 6, letterSpacing: 2 }}>▸ スキン</div>
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <div style={{ width: 34, height: 34, borderRadius: 6, border: `2px solid ${color}`, background: `linear-gradient(135deg, ${color}44, ${color}22)`, boxShadow: `0 0 10px ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fdf5e6', fontWeight: 700 }}>✓</div>
      {[1,2].map(i => <div key={i} style={{ width: 34, height: 34, borderRadius: 6, border: '1px dashed rgba(141,110,99,0.3)', background: 'rgba(30,25,20,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, opacity: 0.3 }}>🔒</div>)}
      <span style={{ fontSize: 9, color: 'rgba(141,110,99,0.5)', marginLeft: 4 }}>COMING SOON</span>
    </div>
  </div>
);

/* ── CharacterPreview ── */
const CharacterPreview = ({ character, show }) => {
  if (!character) return (
    <div style={{ flex: 1, minWidth: 280, maxWidth: 480, background: 'rgba(92,74,68,0.25)', border: '1px solid rgba(141,110,99,0.2)', borderRadius: 12, padding: 24, minHeight: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 42, marginBottom: 10, opacity: 0.2 }}>👤</div>
      <div style={{ fontSize: 14, color: '#8d6e63' }}>キャラクターを選んでください</div>
    </div>
  );
  const color = CHAR_COLORS[character.key] || '#aaa';
  return (
    <div style={{ flex: 1, minWidth: 280, maxWidth: 480, background: 'rgba(92,74,68,0.3)', border: '1px solid rgba(141,110,99,0.25)', borderRadius: 12, padding: 20, minHeight: 380, position: 'relative', overflow: 'hidden', animation: show ? 'charSlide 0.3s ease both' : 'none' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: '100%', background: `linear-gradient(180deg, ${color}, transparent)` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 14, background: `linear-gradient(135deg, ${color}33, ${color}11)`, border: `2px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, boxShadow: `0 0 20px ${color}22`, flexShrink: 0 }}>{character.emoji}</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fdf5e6' }}>{character.name}</div>
          <div style={{ fontSize: 11, color: '#b0a090', marginTop: 3, lineHeight: 1.5, fontStyle: 'italic' }}>「{character.tagline}」</div>
        </div>
      </div>
      <div style={{ background: `linear-gradient(135deg, ${color}11, transparent)`, borderRadius: 8, padding: 12, marginBottom: 10, border: `1px solid ${color}22` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{ fontSize: 9, color, fontWeight: 700, letterSpacing: 2 }}>▸ パッシブ</span>
          <span style={{ fontSize: 8, color: '#f1c40f', background: 'rgba(241,196,15,0.15)', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>常時発動</span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fdf5e6', marginBottom: 3 }}>{character.passive?.name}</div>
        <div style={{ fontSize: 11, color: '#b0a090', lineHeight: 1.6 }}>{character.passive?.desc}</div>
      </div>
      <div style={{ background: 'rgba(253,245,230,0.03)', borderRadius: 8, padding: 12, marginBottom: 10, border: '1px solid rgba(141,110,99,0.2)' }}>
        <span style={{ fontSize: 9, color: '#8d6e63', fontWeight: 700, letterSpacing: 2 }}>▸ アクティブスキル</span>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fdf5e6', marginTop: 5, marginBottom: 3 }}>{character.action?.name}</div>
        <div style={{ fontSize: 11, color: '#b0a090', lineHeight: 1.6 }}>{character.action?.desc}</div>
      </div>
      <SkinSelector color={color} />
    </div>
  );
};

/* ── メインコンポーネント ── */
export default function CharacterSelectPreview() {
  const [hoveredKey, setHoveredKey] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [lockedChars, setLockedChars] = useState({});
  const [selectingIndex, setSelectingIndex] = useState(0);
  const [shaking, setShaking] = useState(false);
  const prevKey = useRef(null);

  const mockPlayers = [
    { id: 0, name: 'プレイヤー1' },
    { id: 1, name: 'プレイヤー2' },
    { id: 2, name: 'CPU1', isCPU: true },
  ];
  const humanPlayers = mockPlayers.filter(p => !p.isCPU);
  const currentPlayer = humanPlayers[selectingIndex];
  const allDone = selectingIndex >= humanPlayers.length;

  // CPU auto-select on mount
  useEffect(() => {
    const cpus = mockPlayers.filter(p => p.isCPU);
    const newLocked = {};
    cpus.forEach(cpu => {
      const available = CHAR_KEYS.filter(k => !newLocked[k]);
      const pick = available[Math.floor(Math.random() * available.length)];
      newLocked[pick] = 'CPU';
    });
    setLockedChars(newLocked);
  }, []);

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
  }, [hoveredKey, selectedKey]);

  const handleConfirm = () => {
    if (!selectedKey || lockedChars[selectedKey]) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 350);
    setLockedChars(prev => ({ ...prev, [selectedKey]: currentPlayer?.name || `P${selectingIndex+1}` }));
    const nextIdx = selectingIndex + 1;
    if (nextIdx < humanPlayers.length) {
      setSelectingIndex(nextIdx);
      setSelectedKey(null);
      setShowPreview(false);
      prevKey.current = null;
    } else {
      setSelectingIndex(nextIdx);
    }
  };

  const handleBack = () => {
    if (selectingIndex > 0 && !allDone) {
      const prevPlayer = humanPlayers[selectingIndex - 1];
      const prevCharKey = Object.entries(lockedChars).find(([_, v]) => v === (prevPlayer?.name || `P${selectingIndex}`))?.[0];
      if (prevCharKey) setLockedChars(prev => { const n = {...prev}; delete n[prevCharKey]; return n; });
      setSelectingIndex(selectingIndex - 1);
      setSelectedKey(prevCharKey || null);
    }
  };

  const canInteract = !allDone;

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: 'linear-gradient(180deg, #1a1410 0%, #2c221a 40%, #1a1410 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#fdf5e6', overflow: 'auto', position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;900&display=swap');
        * { font-family: 'M PLUS Rounded 1c', sans-serif; box-sizing: border-box; }
        @keyframes charSlide { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes fadeInUp { from { transform: translateY(15px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes shakeAnim { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 15px rgba(241,196,15,0.2)} 50%{box-shadow:0 0 25px rgba(241,196,15,0.4)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
      `}</style>

      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.04, backgroundImage: 'linear-gradient(rgba(253,245,230,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(253,245,230,0.3) 1px, transparent 1px)', backgroundSize: '36px 36px' }} />
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 50 }}>
        <div style={{ width: '100%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(253,245,230,0.03), transparent)', animation: 'scanline 6s linear infinite' }} />
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '24px 0 8px', zIndex: 2 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: 6, margin: 0, color: '#f1c40f', textShadow: '0 0 20px rgba(241,196,15,0.3), 0 2px 4px rgba(0,0,0,0.5)' }}>キャラクター選択</h1>
        <div style={{ fontSize: 10, color: '#8d6e63', marginTop: 4, letterSpacing: 3, fontWeight: 700 }}>CHARACTER SELECT — SURVIVAL CITY</div>
      </div>

      {/* Current player indicator */}
      {!allDone && currentPlayer && (
        <div style={{ background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.25)', borderRadius: 8, padding: '8px 24px', marginBottom: 12, fontSize: 14, fontWeight: 700, color: '#f1c40f', animation: 'fadeInUp 0.3s ease', zIndex: 2 }}>
          🎮 {currentPlayer.name} のキャラクターを選択
          <span style={{ fontSize: 11, color: '#8d6e63', marginLeft: 10 }}>({selectingIndex + 1} / {humanPlayers.length})</span>
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: 'flex', maxWidth: 880, width: '100%', padding: '0 16px', gap: 20, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', animation: shaking ? 'shakeAnim 0.35s ease' : 'none', zIndex: 2 }}>
        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: 14, borderRadius: 12, background: 'rgba(92,74,68,0.3)', border: '1px solid rgba(141,110,99,0.3)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}>
          {characters.map(char => {
            const color = CHAR_COLORS[char.key];
            const isSelected = selectedKey === char.key;
            const isHovered = hoveredKey === char.key;
            const lockLabel = lockedChars[char.key];
            const disabled = !!lockLabel;
            return (
              <button key={char.key}
                onClick={() => canInteract && !disabled && setSelectedKey(char.key)}
                onMouseEnter={() => setHoveredKey(char.key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{
                  width: 88, height: 100, borderRadius: 10, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                  background: isSelected ? `linear-gradient(145deg, ${color}33, ${color}11)` : disabled ? 'rgba(30,25,20,0.6)' : isHovered ? 'rgba(253,245,230,0.06)' : 'rgba(253,245,230,0.03)',
                  position: 'relative', transition: 'all 0.18s ease',
                  outline: isSelected ? `2px solid ${color}` : isHovered && !disabled ? `1px solid ${color}88` : '1px solid rgba(141,110,99,0.25)',
                  boxShadow: isSelected ? `0 0 20px ${color}33, inset 0 0 15px ${color}11` : 'none',
                  opacity: disabled ? 0.35 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  filter: disabled ? 'grayscale(0.7)' : 'none',
                  transform: isHovered && !disabled ? 'scale(1.08)' : isSelected ? 'scale(1.03)' : 'scale(1)', zIndex: isHovered ? 5 : 1,
                }}>
                <span style={{ fontSize: 34, filter: isSelected ? `drop-shadow(0 0 6px ${color})` : 'none', transition: 'filter 0.2s' }}>{char.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? color : '#b0a090', transition: 'color 0.2s', letterSpacing: 1 }}>{char.name}</span>
                {disabled && lockLabel && <div style={{ position: 'absolute', top: 3, right: 3, fontSize: 9, fontWeight: 700, background: 'rgba(0,0,0,0.7)', color: '#f1c40f', borderRadius: 4, padding: '1px 5px' }}>{lockLabel}</div>}
                {isSelected && !disabled && <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 22, height: 3, borderRadius: 2, background: color, boxShadow: `0 0 8px ${color}` }} />}
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <CharacterPreview character={previewChar} show={showPreview} />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center', zIndex: 2 }}>
        <button onClick={handleBack} style={{ padding: '12px 28px', borderRadius: 8, border: '1px solid rgba(141,110,99,0.4)', background: 'rgba(92,74,68,0.5)', color: '#b0a090', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.target.style.background = 'rgba(92,74,68,0.8)'; e.target.style.color = '#fdf5e6'; }}
          onMouseLeave={e => { e.target.style.background = 'rgba(92,74,68,0.5)'; e.target.style.color = '#b0a090'; }}>
          ◂ {selectingIndex > 0 ? '前のプレイヤー' : '戻る'}
        </button>

        {canInteract && selectedKey && !lockedChars[selectedKey] && (
          <button onClick={handleConfirm} style={{
            padding: '12px 40px', borderRadius: 8, border: 'none',
            background: `linear-gradient(135deg, ${CHAR_COLORS[selectedKey]}, ${CHAR_COLORS[selectedKey]}cc)`,
            color: '#1a1410', fontSize: 16, fontWeight: 900, cursor: 'pointer', letterSpacing: 3,
            boxShadow: `0 4px 15px ${CHAR_COLORS[selectedKey]}44`, transition: 'all 0.2s', animation: 'fadeInUp 0.25s ease',
          }}
            onMouseEnter={e => { e.target.style.transform = 'scale(1.05)'; e.target.style.filter = 'brightness(1.15)'; }}
            onMouseLeave={e => { e.target.style.transform = 'scale(1)'; e.target.style.filter = 'brightness(1)'; }}>
            決定 ▸
          </button>
        )}

        {allDone && (
          <button onClick={() => alert('🎮 ゲーム開始！（プレビューのためここで停止）')} style={{
            padding: '14px 48px', borderRadius: 8, border: '2px solid #f1c40f',
            background: 'linear-gradient(135deg, #f1c40f, #e67e22)', color: '#1a1410',
            fontSize: 18, fontWeight: 900, cursor: 'pointer', letterSpacing: 4,
            boxShadow: '0 0 20px rgba(241,196,15,0.3)', animation: 'pulseGlow 2s ease infinite, fadeInUp 0.4s ease', transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
            🎮 ゲーム開始
          </button>
        )}
      </div>

      {/* Player status bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', padding: '0 16px 20px', zIndex: 2 }}>
        {mockPlayers.map((p, i) => {
          const charKey = Object.entries(lockedChars).find(([_, v]) => v === p.name || (p.isCPU && v === 'CPU'))?.[0];
          const emoji = charKey ? charEmoji[charKey] : '❓';
          const isSelecting = !allDone && !p.isCPU && humanPlayers.indexOf(p) === selectingIndex;
          return (
            <div key={p.id} style={{
              background: isSelecting ? 'rgba(241,196,15,0.15)' : 'rgba(92,74,68,0.3)',
              border: isSelecting ? '1px solid rgba(241,196,15,0.4)' : '1px solid rgba(141,110,99,0.2)',
              borderRadius: 8, padding: '6px 12px', minWidth: 70, textAlign: 'center', transition: 'all 0.3s',
            }}>
              <div style={{ fontSize: 20 }}>{emoji}</div>
              <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2, color: charKey ? '#fdf5e6' : '#8d6e63' }}>{p.name || (p.isCPU ? `CPU${i+1}` : `P${i+1}`)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
