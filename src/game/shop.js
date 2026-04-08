import { useGameStore } from '../store/useGameStore';
import { useUserStore } from '../store/useUserStore'; 
import { deckData } from '../constants/cards';
import { logMsg } from './actions';

export const generateShopStock = () => {
    const state = useGameStore.getState();
    const { roundCount, maxRounds, turn, players, shopStockTurn } = state;
    const currentTurnKey = roundCount * 1000 + turn;

    if (shopStockTurn !== currentTurnKey) {
        const cp = players[turn];
        
        // 所持Pで仮の順位を計算
        const scores = players.map(p => ({ id: p.id, p: p.p })).sort((a, b) => b.p - a.p);
        const rank = scores.findIndex(s => s.id === cp.id);
        const isBottom2 = players.length >= 2 && rank >= players.length - 2;
        const isLateGame = (maxRounds - roundCount) <= 4;
        
        // レアカード確率の動的調整
        let rareChance = 0.05; // 序盤・基本確率は5%
        if (isLateGame && isBottom2) rareChance = 0.30; // 終了4ターン前＆下位2名は30%にアップ

        // 12:大暴落, 13:下剋上, 35:弁護士の盾, 36:裏取引, 37:反撃の一撃
        const purchased = state.purchasedCards || {};
        // ▼ 修正: 既に4枚買われているカードは抽選プールから除外する
        const rarePool = [12, 13, 35, 36, 37].filter(id => (purchased[id] || 0) < 4);
        const normalPool = [0,1,2,3,4,5,6,7,8,9,10,11,14,15,16,17,18,19,20,24,25,26,27,28,29,30,31,32,33,34].filter(id => (purchased[id] || 0) < 4);

        if (normalPool.length === 0) normalPool.push(0); // 万が一全て売り切れた場合のフォールバック

        const newStock = [];
        for (let i = 0; i < 6; i++) {
            if (Math.random() < rareChance) {
                newStock.push(rarePool[Math.floor(Math.random() * rarePool.length)]);
            } else {
                newStock.push(normalPool[Math.floor(Math.random() * normalPool.length)]);
            }
        }
        useGameStore.setState({ shopStock: newStock, shopStockTurn: currentTurnKey, shopCart: [] });
    }
};

export const shopCartAdd = (cardId, price) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const { shopCart } = state;
    const cartTotal = shopCart.reduce((s, c) => s + c.price, 0);
    const slotsUsed = cp.hand.length + shopCart.length;

    if (slotsUsed >= cp.maxHand) { alert("手札上限です！これ以上カートに追加できません。"); return; }
    if (cp.p < cartTotal + price) { alert("ポイント不足です！"); return; }

    useGameStore.setState({ shopCart: [...shopCart, { cardId, price }] });
};

export const shopCartRemove = (index) => {
    const { shopCart } = useGameStore.getState();
    const newCart = [...shopCart];
    newCart.splice(index, 1);
    useGameStore.setState({ shopCart: newCart });
};

export const shopCartClear = () => useGameStore.setState({ shopCart: [] });

export const shopCartBuy = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const { shopCart } = state;

    if (shopCart.length === 0) return;
    const totalCost = shopCart.reduce((s, c) => s + c.price, 0);

    if (cp.p < totalCost || cp.hand.length + shopCart.length > cp.maxHand) return;

    const newHand = [...cp.hand];
    const names = [];
    const stateForStock = useGameStore.getState();
    let newStock = [...stateForStock.shopStock]; // ▼ 追加: 現在の在庫をコピー
    const newPurchased = { ...(stateForStock.purchasedCards || {}) }; // ▼ 追加: これまでの購入履歴をコピー

    shopCart.forEach(item => {
        newHand.push(item.cardId);
        names.push(deckData.find(c => c.id === item.cardId).name);
        
        // ▼ 追加: 在庫から購入したカードを削除
        const stockIdx = newStock.indexOf(item.cardId);
        if (stockIdx !== -1) newStock.splice(stockIdx, 1);
        
        // ▼ 追加: 買った枚数をゲーム全体で記録しカウントアップ
        newPurchased[item.cardId] = (newPurchased[item.cardId] || 0) + 1;
    });

    useGameStore.setState(prev => ({
        shopStock: newStock, // ▼ 追加: 減った在庫をStoreに反映
        purchasedCards: newPurchased, // ▼ 追加: 購入履歴をStoreに保存
        players: prev.players.map(p => {
            if (p.id === cp.id) {
                // ▼ 修正: 既存のスタッツと初期値テンプレートを完全にマージして欠落を防ぐ
                const baseStats = { tiles: 0, cards: 0, cans: 0, trash: 0, shopP: 0, jobs: 0, territories: 0, minigames: 0 };
                const currentStats = { ...baseStats, ...(p.gameStats || {}) };
                return {
                    ...p,
                    p: p.p - totalCost,
                    hand: newHand,
                    gameStats: { ...currentStats, shopP: currentStats.shopP + totalCost }
                };
            }
            return p;
        }),
        shopCart: [] 
    }));

    logMsg(`🛒 一括購入！${names.join('・')} (合計 -${totalCost}P)`);
    
    if (!cp.isCPU) {
        useUserStore.getState().incrementStat('totalPSpentAtShop', totalCost);
    }
};

export const shopSellCard = (handIndex) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const cardId = cp.hand[handIndex];
    const cardData = deckData.find(c => c.id === cardId);

    const newHand = [...cp.hand];
    newHand.splice(handIndex, 1);

    state.updateCurrentPlayer(p => ({ p: p.p + 2, hand: newHand }));
    logMsg(`🛒 「${cardData.name}」を2Pで売却！`);
};