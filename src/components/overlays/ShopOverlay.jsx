import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import { useGameStore } from "../../store/useGameStore";
import { deckData } from "../../constants/cards";
import { playSfx } from "../../utils/audio";

/* =============================================================
   1. CONSTANTS — デザイントークン・ゲーム設定
   ============================================================= */
const SHUFFLE_COST = 3;
const MAX_STOCK = 4;
const SELL_PRICE = 2;
const TOAST_DURATION = 2000;
const SHUFFLE_ANIM_MS = 600;

const RARITY = {
  N:   { bg: "#6b7280", glow: "rgba(107,114,128,0.4)", label: "#d1d5db" },
  R:   { bg: "#3b82f6", glow: "rgba(59,130,246,0.4)",  label: "#93c5fd" },
  SR:  { bg: "#a855f7", glow: "rgba(168,85,247,0.5)",  label: "#d8b4fe" },
  SSR: { bg: "#eab308", glow: "rgba(234,179,8,0.5)",   label: "#fde047" },
};

const TYPE_LABEL = {
  weapon: "武器", heal: "回復", buff: "バフ",
  equip: "装備", attack: "妨害", magic: "魔法", action: "行動", reaction: "反撃"
};

const TABS = [
  { key: "buy",  label: "🛒 購入" },
  { key: "sell", label: "🪙 売却" },
];

// ▼ 2%の確率で出現させるレアカードのID群
const RARE_IDS = [12, 13, 35, 36, 37]; // 大暴落、下剋上、弁護士の盾、裏取引、反撃の一撃

const getRarity = (id) => {
  if (RARE_IDS.includes(id)) return "SSR";
  if ([20, 21, 22, 23].includes(id)) return "SR"; // 銃器など
  if ([24, 25, 26, 27, 28, 29, 30, 32].includes(id)) return "R"; 
  return "N";
};

const generateStockIds = () => {
  const NORMAL_IDS = deckData.map(c => c.id).filter(id => !RARE_IDS.includes(id));
  const stock = [];
  for (let i = 0; i < 6; i++) {
    // 2%の確率でレアプールから、98%でノーマルプールから選出
    if (Math.random() < 0.02) {
      stock.push(RARE_IDS[Math.floor(Math.random() * RARE_IDS.length)]);
    } else {
      stock.push(NORMAL_IDS[Math.floor(Math.random() * NORMAL_IDS.length)]);
    }
  }
  return stock;
};

const mapCardData = (c, player, purchased) => {
  const alreadyBought = purchased?.[c.id] || 0;
  const basePrice = c.type === 'weapon' ? Math.max(5, (c.dmg || 5) / 5) : c.type === 'equip' ? 6 : 4;
  const discount = player?.charType === 'sales' ? 2 : 0;

  return {
    id: c.id,
    name: c.name,
    type: c.type || "action",
    rarity: getRarity(c.id),
    price: Math.max(0, basePrice - discount),
    desc: c.desc,
    emoji: c.icon,
    stock: Math.max(0, MAX_STOCK - alreadyBought)
  };
};

/* =============================================================
   2. CUSTOM HOOKS
   ============================================================= */
function useToast() {
  const [toast, setToast] = useState({ visible: false, text: "" });
  const show = useCallback((text) => {
    setToast({ visible: true, text });
    setTimeout(() => setToast({ visible: false, text: "" }), TOAST_DURATION);
  }, []);
  return { toast, show };
}

function useCart(shopCards) {
  const [cart, setCart] = useState({});
  const add = useCallback((id) => {
    const card = shopCards.find((c) => c.id === id);
    if (!card || card.stock === 0) return;
    setCart((prev) => {
      const qty = prev[id] || 0;
      if (qty >= card.stock) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: qty + 1 };
    });
  }, [shopCards]);

  const decrement = useCallback((id) => {
    setCart((prev) => {
      const qty = prev[id] || 0;
      if (qty <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: qty - 1 };
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);
  const total = useMemo(() => shopCards.reduce((sum, c) => sum + c.price * (cart[c.id] || 0), 0), [shopCards, cart]);
  const count = useMemo(() => Object.values(cart).reduce((s, q) => s + q, 0), [cart]);

  return { cart, add, decrement, clear, total, count };
}

// ※ 手札に同じカードが複数ある場合を考慮し uniqueId で管理
function useSellSelection(handCards) {
  const [selection, setSelection] = useState(new Set());
  const toggle = useCallback((uid) => {
    setSelection((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });
  }, []);
  const clear = useCallback(() => setSelection(new Set()), []);
  const total = useMemo(() => handCards.filter((c) => selection.has(c.uniqueId)).reduce((s, c) => s + c.sellPrice, 0), [handCards, selection]);
  return { selection, toggle, clear, total };
}

/* =============================================================
   3. ATOMIC UI COMPONENTS
   ============================================================= */
const GlobalKeyframes = memo(() => (
  <style>{`
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes flickerFire {
      0%, 100% { text-shadow: 0 0 10px rgba(251,191,36,0.5), 0 0 30px rgba(234,88,12,0.25); }
      50%      { text-shadow: 0 0 22px rgba(251,191,36,0.9), 0 0 44px rgba(234,88,12,0.45); }
    }
    @keyframes stockPulse {
      0%   { transform: scale(1); }
      50%  { transform: scale(1.18); }
      100% { transform: scale(1); }
    }
    @keyframes cardPop {
      0%   { transform: scale(0.8) rotateY(90deg); opacity: 0; }
      60%  { transform: scale(1.04) rotateY(-4deg); opacity: 1; }
      100% { transform: scale(1) rotateY(0deg); opacity: 1; }
    }
  `}</style>
));

const Toast = memo(({ visible, text }) => (
  <div style={{
    position: "fixed", top: 56, left: "50%", transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #292015, #3d2e15)",
    border: "1.5px solid #f59e0b", borderRadius: 12, padding: "10px 24px", color: "#fde68a",
    fontSize: 14, fontWeight: 700, boxShadow: "0 4px 30px rgba(245,158,11,0.4)",
    zIndex: 1200, opacity: visible ? 1 : 0, transition: "opacity 0.3s", pointerEvents: "none",
    textAlign: "center", whiteSpace: "nowrap", maxWidth: "85vw"
  }}>{text}</div>
));

const ShopHeader = memo(({ playerP, onClose }) => (
  <div style={S.header}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, fontWeight: 800, color: "#fbbf24", animation: "flickerFire 3s ease-in-out infinite" }}>
      <span style={{ fontSize: 26 }}>🕯️</span>闇市ショップ
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={S.pointsBadge}>
        <span style={{ fontSize: 18 }}>💰</span>
        <span>{playerP}</span>
        <span style={{ fontSize: 12, color: "#a07830" }}>P</span>
      </div>
      <button onClick={onClose} style={S.closeBtnTop}>✕</button>
    </div>
  </div>
));

const TabBar = memo(({ mode, onChangeMode }) => (
  <div style={S.tabBar}>
    {TABS.map(({ key, label }) => (
      <div key={key} onClick={() => onChangeMode(key)} style={{
        flex: 1, padding: "13px 0", textAlign: "center", fontSize: 15, fontWeight: 700, cursor: "pointer",
        color: mode === key ? "#fbbf24" : "#6b5c3a",
        background: mode === key ? "linear-gradient(180deg, rgba(42,31,10,0.8), rgba(26,18,9,0.8))" : "transparent",
        borderBottom: mode === key ? "2.5px solid #f59e0b" : "2.5px solid transparent", transition: "all 0.25s"
      }}>{label}</div>
    ))}
  </div>
));

const RarityBadge = memo(({ rarity, style: extra }) => {
  const r = RARITY[rarity] || RARITY.N;
  return (
    <span style={{
      display: "inline-block", fontSize: 9, fontWeight: 800, color: r.label, background: `${r.bg}33`,
      border: `1px solid ${r.bg}88`, borderRadius: 6, padding: "2px 7px", ...extra,
    }}>{rarity}</span>
  );
});

const StockDots = memo(({ stock, rarity }) => {
  const r = RARITY[rarity] || RARITY.N;
  return (
    <div style={{ position: "absolute", top: 5, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 3 }}>
      {Array.from({ length: MAX_STOCK }, (_, i) => (
        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i < stock ? r.bg : "#2a2015", opacity: i < stock ? 1 : 0.4 }} />
      ))}
    </div>
  );
});

const SummaryBar = memo(({ left, right, rightColor = "#fde68a" }) => (
  <div style={S.cartBar}>
    <div>{left}</div>
    <div style={{ fontSize: 18, fontWeight: 800, color: rightColor, textShadow: `0 0 10px ${rightColor}4d` }}>{right}</div>
  </div>
));

const ActionRow = memo(({ primary, onPrimary, disabled, onClear, variant = "buy" }) => {
  const isBuy = variant === "buy";
  const activeBg = isBuy ? "linear-gradient(135deg, #f59e0b, #d97706, #b45309)" : "linear-gradient(135deg, #ef4444, #dc2626, #b91c1c)";
  const disabledBg = isBuy ? "linear-gradient(135deg, #3d3020, #2a2015)" : "linear-gradient(135deg, #3d2020, #2a1515)";
  const activeBorder = isBuy ? "1.5px solid #fbbf24" : "1.5px solid #f87171";
  const disabledBorder = isBuy ? "1.5px solid #3d2e15" : "1.5px solid #3d2020";
  return (
    <div style={S.actionRow}>
      <div onClick={disabled ? undefined : onPrimary} style={{
        flex: 2, padding: "16px 0", borderRadius: 14, background: disabled ? disabledBg : activeBg,
        border: disabled ? disabledBorder : activeBorder, color: disabled ? (isBuy ? "#6b5c3a" : "#6b3a3a") : (isBuy ? "#1a1209" : "#fff"),
        fontSize: 16, fontWeight: 800, cursor: disabled ? "default" : "pointer", textAlign: "center",
        boxShadow: disabled ? "none" : (isBuy ? "0 4px 20px rgba(245,158,11,0.4)" : "0 4px 20px rgba(239,68,68,0.3)"), transition: "all 0.25s",
      }}>{primary}</div>
      <div onClick={onClear} style={S.clearBtn}>クリア</div>
    </div>
  );
});

const ShopCard = memo(({ card, qty, shuffling, index, onTap, onDecrement }) => {
  const r = RARITY[card.rarity] || RARITY.N;
  const inCart = qty > 0;
  const outOfStock = card.stock === 0;

  return (
    <div onClick={() => onTap(card.id)} style={{
      position: "relative", background: inCart ? `linear-gradient(160deg, ${r.glow}, rgba(26,18,9,0.9) 70%)` : "linear-gradient(160deg, rgba(34,26,14,0.8), rgba(21,16,8,0.8))",
      border: inCart ? `2px solid ${r.bg}` : "1.5px solid #3d2e15", borderRadius: 14, padding: "12px 8px 10px",
      cursor: outOfStock ? "default" : "pointer", textAlign: "center",
      boxShadow: inCart ? `0 0 16px ${r.glow}, inset 0 0 20px ${r.glow}` : "0 2px 8px rgba(0,0,0,0.3)",
      transform: inCart ? "scale(1.02)" : "scale(1)",
      animation: shuffling ? `cardPop 0.5s ease ${index * 0.07}s both` : `slideIn 0.25s ease ${index * 0.04}s both`,
    }}>
      <StockDots stock={card.stock} rarity={card.rarity} />
      {inCart && (
        <div onClick={(e) => { e.stopPropagation(); onDecrement(card.id); }} style={S.qtyBadge}>×{qty}</div>
      )}
      {outOfStock && <div style={S.soldOutOverlay}>売切</div>}
      <div style={{ fontSize: 30, lineHeight: 1, margin: "8px 0 6px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>{card.emoji}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#e8d5b0", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden" }}>{card.name}</div>
      <div style={{ marginBottom: 3 }}><RarityBadge rarity={card.rarity} /></div>
      <div style={{ fontSize: 9, color: "#8b7355", lineHeight: 1.3, marginBottom: 5, minHeight: 24 }}>{card.desc}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#fde68a" }}>💰 {card.price}P</div>
    </div>
  );
});

const SellCardRow = memo(({ card, selected, index, onToggle }) => (
  <div onClick={() => onToggle(card.uniqueId)} style={{
    position: "relative", display: "flex", alignItems: "center", gap: 12,
    background: selected ? "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(26,18,9,0.8))" : "linear-gradient(135deg, rgba(30,24,16,0.8), rgba(21,16,8,0.8))",
    border: selected ? "1.5px solid #ef4444" : "1.5px solid #3d2e15", borderRadius: 14, padding: "12px 14px", cursor: "pointer", marginBottom: 8,
    animation: `slideIn 0.25s ease ${index * 0.05}s both`,
  }}>
    {selected && <div style={S.checkBadge}>✓</div>}
    <div style={{ fontSize: 28, flexShrink: 0 }}>{card.emoji}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#e8d5b0" }}>{card.name} <RarityBadge rarity={card.rarity} style={{ marginLeft: 6, verticalAlign: "middle" }} /></div>
      <div style={{ fontSize: 10, color: "#8b7355", marginTop: 2 }}>{card.desc}</div>
    </div>
    <div style={{ fontSize: 14, fontWeight: 800, color: "#fca5a5" }}>+{card.sellPrice}P</div>
  </div>
));

const ShuffleButton = memo(({ canShuffle, shuffling, angle, onShuffle, hasShuffledThisTurn }) => (
  <div style={{ margin: "10px 14px 0", display: "flex", justifyContent: "center" }}>
    <div onClick={canShuffle && !shuffling && !hasShuffledThisTurn ? onShuffle : undefined} style={{
      display: "flex", alignItems: "center", gap: 8,
      background: (!canShuffle || hasShuffledThisTurn) ? "linear-gradient(135deg, rgba(30,24,16,0.8), rgba(21,16,8,0.8))" : "linear-gradient(135deg, rgba(42,31,10,0.8), rgba(30,22,8,0.8))",
      border: (!canShuffle || hasShuffledThisTurn) ? "1px solid #2a2015" : "1px solid #a07830",
      borderRadius: 12, padding: "9px 20px", cursor: (!canShuffle || hasShuffledThisTurn || shuffling) ? "default" : "pointer",
      opacity: (!canShuffle || hasShuffledThisTurn) ? 0.5 : 1, transition: "all 0.3s",
    }}>
      <span style={{ display: "inline-block", fontSize: 18, transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)", transform: `rotate(${angle}deg)` }}>🔀</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#a07830" }}>{hasShuffledThisTurn ? "シャッフル済み" : "商品シャッフル"}</span>
      {!hasShuffledThisTurn && <span style={{ fontSize: 12, fontWeight: 800, color: "#fde68a", background: "#a0783022", borderRadius: 8, padding: "2px 8px", marginLeft: 4 }}>{SHUFFLE_COST}P</span>}
    </div>
  </div>
));

/* =============================================================
   4. MAIN COMPONENT — ShopOverlay
   ============================================================= */
export const ShopOverlay = () => {
  const { shopActive, players, turn, setGameState, purchasedCards } = useGameStore();
  const cp = players[turn];

  const [mode, setMode] = useState("buy");
  const [localShopStock, setLocalShopStock] = useState([]);
  const [shuffling, setShuffling] = useState(false);
  const [shuffleAngle, setShuffleAngle] = useState(0);
  
  // 1ターンにつき1回までのシャッフル制限管理
  const [lastShuffledTurn, setLastShuffledTurn] = useState(-1);
  const hasShuffledThisTurn = lastShuffledTurn === turn;
  const [currentShopTurn, setCurrentShopTurn] = useState(-1);

  const { toast, show: showToast } = useToast();
  const { cart, add: addToCart, decrement: decrementCart, clear: clearCart, total: cartTotal, count: cartCount } = useCart(localShopStock);

  // 初回展開時の在庫生成
  useEffect(() => {
    if (shopActive && currentShopTurn !== turn) {
      setCurrentShopTurn(turn);
      const newIds = generateStockIds();
      setLocalShopStock(newIds.map(id => mapCardData(deckData.find(c => c.id === id), cp, purchasedCards)));
      clearCart();
      setMode("buy");
    }
  }, [shopActive, turn, currentShopTurn, cp, purchasedCards, clearCart]);

  // 手札データの成型 (uniqueIdを付与)
  const mappedHandCards = useMemo(() => {
    if (!cp) return [];
    return cp.hand.map((cardId, index) => {
      const c = deckData.find(d => d.id === cardId);
      return { ...mapCardData(c, cp, purchasedCards), uniqueId: `${index}_${cardId}`, sellPrice: SELL_PRICE, originalIndex: index };
    });
  }, [cp, purchasedCards]);

  const { selection: sellSelection, toggle: toggleSell, clear: clearSell, total: sellTotal } = useSellSelection(mappedHandCards);

  if (!shopActive || !cp) return null;
  const canAfford = cartTotal <= cp.p;
  const maxHand = cp.maxHand || 7;

  // --- Handlers ---
  const handleClose = () => {
    setGameState({ shopActive: false, shopCart: [] });
    clearCart(); clearSell();
  };

  const handleBuy = useCallback(() => {
    if (cartCount === 0 || !canAfford) return;
    if (cp.hand.length + cartCount > maxHand) {
      showToast(`手札が上限（${maxHand}枚）を超えます！`); return;
    }
    let addedCards = [];
    const newPurchased = { ...purchasedCards };
    Object.entries(cart).forEach(([idStr, qty]) => {
      const cId = Number(idStr);
      for (let i = 0; i < qty; i++) addedCards.push(cId);
      newPurchased[cId] = (newPurchased[cId] || 0) + qty;
    });

    useGameStore.getState().updateCurrentPlayer(p => ({ p: p.p - cartTotal, hand: [...p.hand, ...addedCards] }));
    setGameState({ purchasedCards: newPurchased });
    setLocalShopStock(prev => prev.map(c => cart[c.id] ? { ...c, stock: c.stock - cart[c.id] } : c));
    
    clearCart(); playSfx('coin'); showToast("💰 購入完了！");
  }, [cartCount, canAfford, cp, maxHand, cart, cartTotal, purchasedCards, showToast, clearCart, setGameState]);

  const handleShuffle = useCallback(() => {
    if (hasShuffledThisTurn || shuffling) return;
    if (cp.p < SHUFFLE_COST) { showToast("Pが足りません！"); return; }
    
    useGameStore.getState().updateCurrentPlayer(p => ({ p: p.p - SHUFFLE_COST }));
    setLastShuffledTurn(turn);
    setShuffling(true);
    setShuffleAngle(a => a + 720);
    clearCart(); playSfx('move');
    
    setTimeout(() => {
      const newIds = generateStockIds();
      setLocalShopStock(newIds.map(id => mapCardData(deckData.find(c => c.id === id), cp, purchasedCards)));
      setShuffling(false);
      showToast("🔀 商品がシャッフルされた！");
    }, SHUFFLE_ANIM_MS);
  }, [hasShuffledThisTurn, shuffling, cp, turn, clearCart, showToast, purchasedCards]);

  const handleSell = useCallback(() => {
    if (sellSelection.size === 0) return;
    const profit = sellSelection.size * SELL_PRICE;
    
    useGameStore.getState().updateCurrentPlayer(p => {
      const newHand = p.hand.filter((_, idx) => !sellSelection.has(`${idx}_${p.hand[idx]}`));
      return { p: p.p + profit, hand: newHand };
    });
    
    clearSell(); playSfx('coin'); showToast(`🪙 ${sellSelection.size}枚を売却し、${profit}P獲得！`);
  }, [sellSelection, clearSell, showToast]);

  return (
    <div style={S.overlay}>
      <div style={S.container}>
        <GlobalKeyframes />
        <Toast visible={toast.visible} text={toast.text} />
        
        <ShopHeader playerP={cp.p} onClose={handleClose} />
        <TabBar mode={mode} onChangeMode={setMode} />

        <div style={S.scrollArea}>
          {mode === "buy" ? (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <ShuffleButton canShuffle={cp.p >= SHUFFLE_COST} shuffling={shuffling} angle={shuffleAngle} onShuffle={handleShuffle} hasShuffledThisTurn={hasShuffledThisTurn} />
              <div style={S.section}>
                <div style={S.sectionTitle}>— 本日の品揃え —</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {localShopStock.map((card, idx) => (
                    <ShopCard key={`${card.id}-${idx}`} card={card} qty={cart[card.id] || 0} shuffling={shuffling} index={idx} onTap={addToCart} onDecrement={decrementCart} />
                  ))}
                </div>
              </div>
              <SummaryBar left={<div style={{ fontSize: 13, color: "#a07830" }}>🛒 カート: <span style={{ color: "#fde68a", fontWeight: 700 }}>{cartCount}枚</span>{!canAfford && cartCount > 0 && <span style={{ color: "#ef4444", marginLeft: 8 }}>⚠ P不足</span>}</div>} right={`合計 ${cartTotal}P`} />
              <ActionRow primary="💰 一括購入" disabled={cartCount === 0 || !canAfford} onPrimary={handleBuy} onClear={clearCart} variant="buy" />
            </div>
          ) : (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <div style={S.section}>
                <div style={S.sectionTitle}>— 手札を売る —</div>
                <div style={{ fontSize: 11, color: "#6b5c3a", textAlign: "center", marginBottom: 12 }}>カードは一律 {SELL_PRICE}P で買い取ります</div>
                {mappedHandCards.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "36px 0", color: "#6b5c3a", fontSize: 14 }}>手札がありません</div>
                ) : (
                  mappedHandCards.map((card, idx) => <SellCardRow key={card.uniqueId} card={card} selected={sellSelection.has(card.uniqueId)} index={idx} onToggle={toggleSell} />)
                )}
              </div>
              <SummaryBar left={<div style={{ fontSize: 13, color: "#a07830" }}>選択: <span style={{ color: "#fca5a5", fontWeight: 700 }}>{sellSelection.size}枚</span></div>} right={`+${sellTotal}P`} rightColor="#fca5a5" />
              <ActionRow primary="🪙 一括売却" disabled={sellSelection.size === 0} onPrimary={handleSell} onClear={clearSell} variant="sell" />
            </div>
          )}
          
          <div style={{ padding: "16px 14px 0" }}>
            <div onClick={handleClose} style={S.closeBtnBottom}>閉じる</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =============================================================
   5. STYLES
   ============================================================= */
const S = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 1100,
    backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)",
    display: "flex", justifyContent: "center", alignItems: "center", padding: "20px 10px",
  },
  container: {
    width: "100%", maxWidth: 430, maxHeight: "90vh",
    background: "linear-gradient(180deg, rgba(13,9,6,0.95) 0%, rgba(26,18,9,0.95) 30%, rgba(13,9,6,0.95) 100%)",
    borderRadius: 16, border: "1px solid rgba(251,191,36,0.3)", boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
    display: "flex", flexDirection: "column", fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
    color: "#e8d5b0", position: "relative", overflow: "hidden",
  },
  scrollArea: {
    overflowY: "auto", flex: 1, paddingBottom: 14, msOverflowStyle: "none", scrollbarWidth: "none",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 10px",
  },
  pointsBadge: {
    display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, rgba(41,32,21,0.8), rgba(61,46,21,0.8))",
    border: "1.5px solid #a07830", borderRadius: 14, padding: "6px 14px", fontSize: 16, fontWeight: 700, color: "#fde68a",
  },
  tabBar: {
    display: "flex", margin: "0 14px", background: "rgba(26,18,9,0.5)", borderRadius: "14px 14px 0 0",
    border: "1px solid #3d2e15", borderBottom: "none", overflow: "hidden",
  },
  section: {
    margin: "12px 14px", padding: 14, background: "linear-gradient(145deg, rgba(30,24,16,0.8), rgba(23,16,8,0.8))",
    border: "1px solid #3d2e15", borderRadius: 16, boxShadow: "inset 0 1px 0 rgba(251,191,36,0.08), 0 4px 20px rgba(0,0,0,0.5)",
  },
  sectionTitle: {
    fontSize: 13, fontWeight: 700, color: "#a07830", textAlign: "center", marginBottom: 12, letterSpacing: 3,
  },
  cartBar: {
    margin: "0 14px", padding: "12px 16px", background: "linear-gradient(135deg, rgba(41,31,10,0.8), rgba(30,22,8,0.8))",
    border: "1px solid #3d2e15", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  actionRow: {
    margin: "14px 14px 0", display: "flex", gap: 10,
  },
  clearBtn: {
    flex: 1, padding: "16px 0", borderRadius: 14, background: "transparent", border: "1.5px solid #3d2e15",
    color: "#8b7355", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "center",
  },
  closeBtnTop: {
    background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5",
    width: 32, height: 32, borderRadius: "50%", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  },
  closeBtnBottom: {
    padding: "12px 0", borderRadius: 14, background: "linear-gradient(135deg, rgba(61,48,32,0.8), rgba(42,32,21,0.8))",
    border: "1.5px solid #3d2e15", color: "#e8d5b0", textAlign: "center", cursor: "pointer", fontSize: 14, fontWeight: 700, letterSpacing: 2
  },
  qtyBadge: {
    position: "absolute", top: 4, right: 4, minWidth: 22, height: 22, borderRadius: 11,
    background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, color: "#1a1209", fontWeight: 900, boxShadow: "0 0 10px rgba(245,158,11,0.6)", padding: "0 4px", animation: "stockPulse 0.3s ease",
  },
  soldOutOverlay: {
    position: "absolute", inset: 0, background: "rgba(13,9,6,0.8)", borderRadius: 14,
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#ef4444", letterSpacing: 2, zIndex: 2,
  },
  checkBadge: {
    position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: "#ef4444",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 900,
  }
};