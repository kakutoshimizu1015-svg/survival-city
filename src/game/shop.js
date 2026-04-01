import { useGameStore } from '../store/useGameStore';
import { deckData } from '../constants/cards';
import { logMsg } from './actions';

export const generateShopStock = () => {
    const state = useGameStore.getState();
    const { roundCount, turn, shopStockTurn } = state;
    const currentTurnKey = roundCount * 1000 + turn;

    if (shopStockTurn !== currentTurnKey) {
        const pool = [0,1,2,3,4,5,6,7,8,9,10,11,15,16,17,18,19,20,24,25,26,27,28,29,30,31,32,33,34];
        const newStock = [];
        // ▼ 修正：在庫上限を6枚に変更
        for (let i = 0; i < 6; i++) {
            newStock.push(pool[Math.floor(Math.random() * pool.length)]);
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
    shopCart.forEach(item => {
        newHand.push(item.cardId);
        names.push(deckData.find(c => c.id === item.cardId).name);
    });

    state.updateCurrentPlayer(p => ({ p: p.p - totalCost, hand: newHand }));
    logMsg(`🛒 一括購入！${names.join('・')} (合計 -${totalCost}P)`);
    useGameStore.setState({ shopCart: [] });
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