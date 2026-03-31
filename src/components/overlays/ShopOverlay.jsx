import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { deckData } from '../../constants/cards';
import { generateShopStock, shopCartAdd, shopCartRemove, shopCartClear, shopCartBuy, shopSellCard } from '../../game/shop';

export const ShopOverlay = () => {
    const { shopActive, shopStock, shopCart, players, turn } = useGameStore();
    const cp = players[turn];

    // ショップが開かれたら在庫を更新
    useEffect(() => {
        if (shopActive && cp && !cp.isCPU) {
            generateShopStock();
        }
    }, [shopActive, cp]);

    if (!shopActive || !cp) return null;

    // ▼ データが空でもエラーにならないようにする安全対策（セーフティ）
    const safeShopStock = shopStock || [];
    const safeShopCart = shopCart || [];
    const safeHand = cp.hand || [];

    const cartTotal = safeShopCart.reduce((s, c) => s + c.price, 0);
    const slotsUsed = safeHand.length + safeShopCart.length;
    const remainP = cp.p - cartTotal;

    return (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 1100 }}>
            <div className="modal-box" style={{ maxWidth: '520px', background: '#fdf5e6', color: '#3e2723' }}>
                <h2 style={{ marginTop: 0 }}>🛒 闇市ショップ</h2>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    所持P: <span style={{ color: '#f1c40f', fontSize: '24px' }}>{cp.p}</span>
                    {safeShopCart.length > 0 && <span style={{ color: '#e74c3c', marginLeft: '10px', fontSize: '14px' }}>(カート: -{cartTotal}P / 残: {remainP}P)</span>}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', maxHeight: '30vh', overflowY: 'auto', padding: '5px' }}>
                    {safeShopStock.map((cardId, idx) => {
                        const cardData = deckData.find(c => c.id === cardId);
                        if (!cardData) return null; // カードが見つからなければスキップ
                        
                        let price = cardData.type === 'weapon' ? Math.max(5, cardData.dmg / 5) : cardData.type === 'equip' ? 6 : 4;
                        if (cp.charType === 'sales') price = Math.max(1, price - 1); 
                        
                        const canAfford = remainP >= price;
                        const handFull = slotsUsed >= cp.maxHand;

                        return (
                            <button key={idx} disabled={!canAfford || handFull} onClick={() => shopCartAdd(cardId, price)}
                                style={{ background: '#fff', border: `3px solid ${cardData.color}`, borderRadius: '8px', padding: '8px', textAlign: 'left', cursor: (!canAfford || handFull) ? 'not-allowed' : 'pointer', opacity: (!canAfford || handFull) ? 0.6 : 1 }}>
                                <strong>{cardData.icon} {cardData.name} (<span style={{ color: canAfford ? '#2ecc71' : '#e74c3c' }}>{price}P</span>)</strong><br />
                                <span style={{ fontSize: '11px' }}>{cardData.desc}</span>
                            </button>
                        );
                    })}
                </div>

                {safeShopCart.length > 0 && (
                    <div style={{ marginTop: '12px', padding: '10px', background: '#f0e6d2', border: '3px dashed #8d6e63', borderRadius: '10px' }}>
                        <h4 style={{ margin: '0 0 8px 0' }}>🛒 カート</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                            {safeShopCart.map((item, idx) => {
                                const cd = deckData.find(c => c.id === item.cardId);
                                if (!cd) return null;
                                return (
                                    <div key={idx} onClick={() => shopCartRemove(idx)} style={{ background: '#fff', border: `2px solid ${cd.color}`, borderRadius: '6px', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {cd.icon} {cd.name} ({item.price}P) <span style={{ color: '#e74c3c' }}>✕</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn-large btn-green" onClick={shopCartBuy}>💰 一括購入</button>
                            <button className="btn-large" style={{ background: '#e74c3c' }} onClick={shopCartClear}>🗑️ 空にする</button>
                        </div>
                    </div>
                )}

                <hr style={{ border: '1px dashed #5b2c6f', margin: '15px 0' }} />
                <h3 style={{ margin: '5px 0', fontSize: '16px' }}>🃏 手札を売る (+2P)</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px' }}>
                    {safeHand.length === 0 ? <span style={{ color: '#bdc3c7', fontSize: '12px' }}>売れるカードなし</span> : 
                        safeHand.map((cardId, idx) => {
                            const cd = deckData.find(c => c.id === cardId);
                            if (!cd) return null;
                            return <button key={idx} onClick={() => shopSellCard(idx)} style={{ padding: '6px', fontSize: '11px', borderRadius: '6px', border: '1px solid #8d6e63', cursor: 'pointer' }}>{cd.icon}{cd.name}を売る</button>;
                        })
                    }
                </div>

                <button className="btn-large" style={{ width: '100%', marginTop: '15px', background: '#7f8c8d', color: 'white', cursor: 'pointer' }} onClick={() => useGameStore.setState({ shopActive: false })}>✕ 閉じる</button>
            </div>
        </div>
    );
};