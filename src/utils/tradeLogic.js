import { ref, get, update, push, set, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/useUserStore';

/**
 * 自身の関わるトレード（送信・受信）をリアルタイム監視する
 */
export const listenToTrades = (uid) => {
    if (!uid) return;
    const tradesRef = ref(db, `trades`);
    
    onValue(tradesRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            useUserStore.getState().setUserData({ activeTrades: [] });
            return;
        }

        const myTrades = Object.entries(data)
            .map(([id, val]) => ({ id, ...val }))
            .filter(trade => (trade.fromUid === uid || trade.toUid === uid) && trade.status === 'pending')
            .sort((a, b) => b.timestamp - a.timestamp);

        useUserStore.getState().setUserData({ activeTrades: myTrades });
    });
};

/**
 * トレードの提案を送信する
 */
export const sendTradeOffer = async (targetUid, targetName, offer, request) => {
    const state = useUserStore.getState();
    if (!state.uid || !targetUid) return { success: false, message: '通信エラー：ユーザー情報がありません' };

    if (state.gachaPoints < offer.p || state.gachaCans < offer.cans) {
        return { success: false, message: '提示するPまたは空き缶が不足しています' };
    }
    const hasAllOfferSkins = offer.skins.every(skinId => state.unlockedSkins.includes(skinId));
    if (!hasAllOfferSkins) {
        return { success: false, message: '提示するスキンを所持していません' };
    }

    try {
        const newTradeRef = push(ref(db, 'trades'));
        await set(newTradeRef, {
            fromUid: state.uid,
            fromName: state.playerName,
            toUid: targetUid,
            toName: targetName,
            offer,
            request,
            status: 'pending',
            timestamp: Date.now()
        });
        return { success: true, message: 'トレードの提案を送信しました！' };
    } catch (error) {
        console.error("トレード送信エラー:", error);
        return { success: false, message: '送信に失敗しました' };
    }
};

/**
 * 届いたトレードを拒否（キャンセル）する
 */
export const rejectTrade = async (tradeId) => {
    try {
        await update(ref(db, `trades/${tradeId}`), { status: 'rejected' });
    } catch (error) {
        console.error("トレード拒否エラー:", error);
    }
};

/**
 * 届いたトレードを承認し、アイテムを安全に交換する（アトミック処理）
 */
export const acceptTrade = async (trade) => {
    const state = useUserStore.getState();
    if (state.uid !== trade.toUid) return { success: false, message: '権限がありません' };

    try {
        const fromSnap = await get(ref(db, `users/${trade.fromUid}`));
        const toSnap = await get(ref(db, `users/${trade.toUid}`));
        const tradeSnap = await get(ref(db, `trades/${trade.id}`));

        if (!fromSnap.exists() || !toSnap.exists() || !tradeSnap.exists()) {
            return { success: false, message: 'データが見つかりません' };
        }
        if (tradeSnap.val().status !== 'pending') {
            return { success: false, message: 'このトレードは既に処理されています' };
        }

        const fromUser = fromSnap.val();
        const toUser = toSnap.val();

        fromUser.gachaPoints = fromUser.gachaPoints || 0;
        fromUser.gachaCans = fromUser.gachaCans || 0;
        fromUser.unlockedSkins = fromUser.unlockedSkins || [];
        
        toUser.gachaPoints = toUser.gachaPoints || 0;
        toUser.gachaCans = toUser.gachaCans || 0;
        toUser.unlockedSkins = toUser.unlockedSkins || [];

        // ▼ 修正: Firebaseの空配列削除仕様に対応するためのフォールバック
        const offerSkins = trade.offer.skins || [];
        const requestSkins = trade.request.skins || [];
        const offerP = trade.offer.p || 0;
        const offerCans = trade.offer.cans || 0;
        const requestP = trade.request.p || 0;
        const requestCans = trade.request.cans || 0;

        if (fromUser.gachaPoints < offerP || fromUser.gachaCans < offerCans) return { success: false, message: '相手の資産が不足しているため成立しませんでした' };
        if (toUser.gachaPoints < requestP || toUser.gachaCans < requestCans) return { success: false, message: 'あなたの資産が不足しています' };
        
        const fromHasSkins = offerSkins.every(s => fromUser.unlockedSkins.includes(s));
        const toHasSkins = requestSkins.every(s => toUser.unlockedSkins.includes(s));
        
        if (!fromHasSkins) return { success: false, message: '相手が約束のスキンを持っていません' };
        if (!toHasSkins) return { success: false, message: 'あなたが約束のスキンを持っていません' };

        // 3. アイテムの増減計算
        const newFromP = fromUser.gachaPoints - offerP + requestP;
        const newFromCans = fromUser.gachaCans - offerCans + requestCans;
        const newToP = toUser.gachaPoints - requestP + offerP;
        const newToCans = toUser.gachaCans - requestCans + offerCans;

        const newFromSkins = fromUser.unlockedSkins.filter(s => !offerSkins.includes(s));
        requestSkins.forEach(s => { if (!newFromSkins.includes(s)) newFromSkins.push(s); });

        const newToSkins = toUser.unlockedSkins.filter(s => !requestSkins.includes(s));
        offerSkins.forEach(s => { if (!newToSkins.includes(s)) newToSkins.push(s); });

        // 4. アトミックな一括書き込み
        const updates = {};
        updates[`users/${trade.fromUid}/gachaPoints`] = newFromP;
        updates[`users/${trade.fromUid}/gachaCans`] = newFromCans;
        updates[`users/${trade.fromUid}/unlockedSkins`] = newFromSkins;

        updates[`users/${trade.toUid}/gachaPoints`] = newToP;
        updates[`users/${trade.toUid}/gachaCans`] = newToCans;
        updates[`users/${trade.toUid}/unlockedSkins`] = newToSkins;

        updates[`trades/${trade.id}/status`] = 'completed';

        await update(ref(db), updates);

        // 5. 自分のローカルステートを更新
        useUserStore.getState().setUserData({
            gachaPoints: newToP,
            gachaCans: newToCans,
            unlockedSkins: newToSkins
        });

        // 装備中スキンがトレードで失われた場合は外す
        const equipped = { ...state.equippedSkins };
        let equippedChanged = false;
        Object.keys(equipped).forEach(charKey => {
            if (requestSkins.includes(equipped[charKey])) {
                equipped[charKey] = `${charKey}_default`;
                equippedChanged = true;
            }
        });
        if (equippedChanged) useUserStore.getState().setUserData({ equippedSkins: equipped });

        return { success: true, message: 'トレードが成立しました！' };

    } catch (error) {
        console.error("トレード成立エラー:", error);
        return { success: false, message: '通信エラーが発生しました' };
    }
};