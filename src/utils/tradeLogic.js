import { ref, get, update, push, set, onValue, remove } from 'firebase/database';
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
 * @param {string} targetUid 相手のUID
 * @param {string} targetName 相手の名前
 * @param {object} offer 自分が提示するアイテム { p: 0, cans: 0, skins: ['skin_A'] }
 * @param {object} request 相手に要求するアイテム { p: 0, cans: 0, skins: ['skin_B'] }
 */
export const sendTradeOffer = async (targetUid, targetName, offer, request) => {
    const state = useUserStore.getState();
    if (!state.uid || !targetUid) return { success: false, message: '通信エラー：ユーザー情報がありません' };

    // ▼ 事前チェック: 自分が提示するアイテムを本当に持っているか確認
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
        // 1. 相手(from)と自分(to)の最新データを取得
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

        // 2. 資産の最終チェック（相手が提示品を持っているか、自分が要求品を持っているか）
        if (fromUser.gachaPoints < trade.offer.p || fromUser.gachaCans < trade.offer.cans) return { success: false, message: '相手の資産が不足しているため成立しませんでした' };
        if (toUser.gachaPoints < trade.request.p || toUser.gachaCans < trade.request.cans) return { success: false, message: 'あなたの資産が不足しています' };
        
        const fromHasSkins = trade.offer.skins.every(s => fromUser.unlockedSkins.includes(s));
        const toHasSkins = trade.request.skins.every(s => toUser.unlockedSkins.includes(s));
        
        if (!fromHasSkins) return { success: false, message: '相手が約束のスキンを持っていません' };
        if (!toHasSkins) return { success: false, message: 'あなたが約束のスキンを持っていません' };

        // 3. アイテムの増減計算
        // Pと缶の移動
        const newFromP = fromUser.gachaPoints - trade.offer.p + trade.request.p;
        const newFromCans = fromUser.gachaCans - trade.offer.cans + trade.request.cans;
        const newToP = toUser.gachaPoints - trade.request.p + trade.offer.p;
        const newToCans = toUser.gachaCans - trade.request.cans + trade.offer.cans;

        // スキンの移動（配列から削除し、相手に追加する）
        const newFromSkins = fromUser.unlockedSkins.filter(s => !trade.offer.skins.includes(s));
        trade.request.skins.forEach(s => { if (!newFromSkins.includes(s)) newFromSkins.push(s); });

        const newToSkins = toUser.unlockedSkins.filter(s => !trade.request.skins.includes(s));
        trade.offer.skins.forEach(s => { if (!newToSkins.includes(s)) newToSkins.push(s); });

        // 4. アトミックな一括書き込み（どれか1つでも失敗したら全て無効になるため安全）
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

        // ※装備中スキンがトレードで失われた場合は外す安全処理
        const equipped = { ...state.equippedSkins };
        let equippedChanged = false;
        Object.keys(equipped).forEach(charKey => {
            if (trade.request.skins.includes(equipped[charKey])) {
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