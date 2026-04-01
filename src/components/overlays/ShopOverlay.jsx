import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { deckData } from '../../constants/cards';
import { ClayButton } from '../common/ClayButton';
import { playSfx } from '../../utils/audio';
import { generateShopStock } from '../../game/shop'; 

export const ShopOverlay = () => {
    const { shopActive, shopStock, shopCart, players, turn, setGameState } = useGameStore();
    const cp = players[turn];

    useEffect(() => {
        if (shopActive) {
            generateShopStock();
        }
    }, [shopActive]);

    if (!shopActive || !cp) return null;

    const cartTotal = shopCart.reduce((s, c) => s + c.price, 0);
    const remainP = cp.p - cartTotal;
    const slotsUsed = cp.hand.length + shopCart.length;

    const addToCart = (cardId, price) => {
        // ▼ 修正：上限のときは中央警告を表示する
        if (slotsUsed >= cp.maxHand) {
            useGameStore.getState().showCenterWarning("手札が上限です！これ以上カートに追加できません");
            return;
        }
        if (remainP < price) {
            useGameStore.getState().showToast("ポイント不足です！");
            return;
        }
        setGameState({ shopCart: [...shopCart, { cardId, price }] });
    };

    const buyCart = () => {
        if (shopCart.length === 0) return;
        useGameStore.getState().updateCurrentPlayer(p => ({ p: p.p - cartTotal, hand: [...p.hand, ...shopCart.map(c => c.cardId)] }));
        setGameState({ shopCart: [], shopActive: false });
        playSfx('coin');
    };

    const sellCard = (idx) => {
        useGameStore.getState().updateCurrentPlayer(p => { const h = [...p.hand]; h.splice(idx, 1); return { p: p.p + 2, hand: h }; });
        playSfx('coin');
    };

    return (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1100 }}>
            <div className="modal-box" style={{ maxWidth: '520px', background: '#fdf5e6', color: '#3e2723' }}>
                <h2 style={{ marginTop: 0 }}>🛒 闇市ショップ</h2>
                <p style={{ fontWeight: 'bold' }}>所持P: <span style={{ fontSize: '24px', color: '#f1c40f' }}>{cp.p}</span> {cartTotal > 0 && <span style={{ color: '#e74c3c' }}>(-{cartTotal}P)</span>}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '30vh', overflowY: 'auto' }}>
                    {shopStock.map((cardId, i) => {
                        const cd = deckData.find(d => d.id === cardId);
                        const price = (cd.type === 'weapon' ? Math.max(5, cd.dmg / 5) : cd.type === 'equip' ? 6 : 4) - (cp.charType === 'sales' ? 1 : 0);
                        const canAfford = remainP >= price && slotsUsed < cp.maxHand;
                        return (
                            // ▼ 修正：クリック自体は常にできるようにし、エラーチェックを関数の内部で行うため disabled を外す
                            <ClayButton key={i} onClick={() => addToCart(cardId, price)} style={{ borderColor: cd.color, textAlign: 'left', opacity: canAfford ? 1 : 0.5 }}>
                                {cd.icon} {cd.name} (<span style={{ color: canAfford ? '#2ecc71' : '#e74c3c' }}>{price}P</span>)<br/>
                                <span style={{ fontSize: '10px' }}>{cd.desc}</span>
                            </ClayButton>
                        );
                    })}
                </div>

                {shopCart.length > 0 && (
                    <div style={{ marginTop: '12px', padding: '10px', background: '#f0e6d2', border: '3px dashed #8d6e63', borderRadius: '10px' }}>
                        <h4>🛒 カート</h4>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            {shopCart.map((c, i) => (
                                <span key={i} onClick={() => setGameState({ shopCart: shopCart.filter((_, idx) => idx !== i) })} style={{ background: '#fff', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', border: `2px solid ${deckData.find(d=>d.id===c.cardId).color}`, cursor: 'pointer' }}>
                                    {deckData.find(d=>d.id===c.cardId).name} ✕
                                </span>
                            ))}
                        </div>
                        <ClayButton color="green" onClick={buyCart}>💰 一括購入</ClayButton>
                    </div>
                )}

                <hr style={{ border: '1px dashed #5b2c6f', margin: '15px 0' }} />
                <h3 style={{ margin: '5px 0' }}>🃏 手札を売る (+2P)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
                    {cp.hand.length === 0 ? <span style={{ fontSize: '12px', color: '#bdc3c7' }}>売れるカードなし</span> : cp.hand.map((cId, i) => (
                        <button key={i} onClick={() => sellCard(i)} style={{ padding: '6px', fontSize: '11px', borderRadius: '5px', cursor: 'pointer' }}>{deckData.find(d=>d.id===cId).icon} 売却</button>
                    ))}
                </div>

                <ClayButton onClick={() => setGameState({ shopActive: false, shopCart: [] })} style={{ width: '100%', marginTop: '15px', background: '#7f8c8d' }}>閉じる</ClayButton>
            </div>
        </div>
    );
};