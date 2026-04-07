import { ref, get, set, update, push, onValue, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/useUserStore';

/**
 * フレンド・招待のリアルタイム監視
 */
export const listenToFriendsAndInvites = (uid) => {
    if (!uid) return;
    
    const friendsRef = ref(db, `users/${uid}/friends`);
    onValue(friendsRef, (snapshot) => {
        const data = snapshot.val();
        const friendsList = data ? Object.values(data) : [];
        useUserStore.getState().setUserData({ friends: friendsList });
    });

    const reqRef = ref(db, `friendRequests/${uid}`);
    onValue(reqRef, (snapshot) => {
        const data = snapshot.val();
        const requests = data ? Object.values(data) : [];
        useUserStore.getState().setUserData({ friendRequests: requests });
    });

    const invitesRef = ref(db, `invites/${uid}`);
    onValue(invitesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const invitesList = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
            useUserStore.getState().setUserData({ invites: invitesList });
        } else {
            useUserStore.getState().setUserData({ invites: [] });
        }
    });
};

/**
 * ▼ 新規追加: グローバルメール（運営からのプレゼント）のリアルタイム監視
 */
export const listenToMails = (uid) => {
    if (!uid) return;
    const globalMailsRef = ref(db, 'globalMails');
    
    onValue(globalMailsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // 新しい順（降順）にソートしてStoreへ格納
            const mailsList = Object.entries(data)
                .map(([id, val]) => ({ id, ...val }))
                .sort((a, b) => b.timestamp - a.timestamp);
            useUserStore.getState().setUserData({ inbox: mailsList });
        } else {
            useUserStore.getState().setUserData({ inbox: [] });
        }
    });
};

/**
 * ▼ 新規追加: メールを受け取り、資産を加算する
 */
export const claimMail = async (mail) => {
    const state = useUserStore.getState();
    if (!state.uid) return false;
    
    // 既に受け取り済みの場合はブロック
    if (state.claimedMails.includes(mail.id)) return false;

    // ガチャ資産の付与
    const pReward = mail.p || 0;
    const canReward = mail.cans || 0;
    if (pReward > 0 || canReward > 0) {
        state.addGachaAssets(canReward, pReward);
    }

    // クレーム済みリストを更新
    const newClaimedMails = [...state.claimedMails, mail.id];
    state.setUserData({ claimedMails: newClaimedMails });

    try {
        // 受け取り履歴とガチャ資産の増加を同時にFirebaseへ保存
        await update(ref(db, `users/${state.uid}`), { 
            claimedMails: newClaimedMails,
            gachaCans: state.gachaCans,     // 最新のステート値ではなく加算後を担保するため、即時取得が無難だが、
            gachaPoints: state.gachaPoints  // addGachaAssetsで同期された直後の値をsyncGachaData経由で送る
        });
        await syncGachaData();
        return true;
    } catch (error) {
        console.error("メール受け取りエラー:", error);
        return false;
    }
};

/**
 * ログイン直後にDBからユーザーデータを読み込む
 */
export const loadUserData = async (uid) => {
  const userRef = ref(db, `users/${uid}`);
  try {
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      const mergedData = {
          ...data,
          gachaCans: data.gachaCans || 0,
          unlockedSkins: data.unlockedSkins || [],
          equippedSkins: data.equippedSkins || {},
          claimedMails: data.claimedMails || [] // ▼ 追加
      };
      useUserStore.getState().setUserData(mergedData);
      console.log("ユーザーデータ読み込み成功:", mergedData);
    } else {
      const initialData = {
        playerName: '名無しサバイバー',
        gachaPoints: 0,
        gachaCans: 0,
        unlockedSkins: [],
        equippedSkins: {},
        claimedMails: [], // ▼ 追加
        wins: 0,
        totalEarnedP: 0
      };
      await set(userRef, initialData);
      console.log("新規ユーザーデータ作成完了");
    }

    // 監視の開始
    listenToFriendsAndInvites(uid);
    listenToMails(uid); // ▼ 追加

  } catch (error) {
    console.error("データ読み込み失敗:", error);
  }
};

export const savePlayerName = async (newName) => {
  const { uid } = useUserStore.getState();
  if (!uid) return;
  await update(ref(db, `users/${uid}`), { playerName: newName });
  useUserStore.getState().setUserData({ playerName: newName });
};

export const recordWin = async (earnedP) => {
  const { uid, wins, totalEarnedP, gachaPoints } = useUserStore.getState();
  if (!uid) return;
  const newData = {
    wins: wins + 1,
    totalEarnedP: totalEarnedP + earnedP,
    gachaPoints: gachaPoints + earnedP 
  };
  await update(ref(db, `users/${uid}`), newData);
  useUserStore.getState().setUserData(newData);
};

export const syncGachaData = async () => {
  const { uid, gachaCans, gachaPoints, unlockedSkins, equippedSkins } = useUserStore.getState();
  if (!uid) return;
  const syncData = { gachaCans, gachaPoints, unlockedSkins, equippedSkins };
  try {
      await update(ref(db, `users/${uid}`), syncData);
      console.log("ガチャデータ同期成功");
  } catch (error) {
      console.error("ガチャデータ同期失敗:", error);
  }
};

// --- 以下、フレンド・招待アクション群 ---
export const sendFriendRequest = async (targetUid) => {
    const state = useUserStore.getState();
    if (!state.uid || !targetUid || state.uid === targetUid) return;
    const reqRef = ref(db, `friendRequests/${targetUid}/${state.uid}`);
    await set(reqRef, { uid: state.uid, name: state.playerName, timestamp: Date.now() });
};

export const acceptFriendRequest = async (requesterUid, requesterName) => {
    const state = useUserStore.getState();
    if (!state.uid) return;
    await set(ref(db, `users/${state.uid}/friends/${requesterUid}`), { uid: requesterUid, name: requesterName });
    await set(ref(db, `users/${requesterUid}/friends/${state.uid}`), { uid: state.uid, name: state.playerName });
    await remove(ref(db, `friendRequests/${state.uid}/${requesterUid}`));
};

export const removeFriendRequest = async (requesterUid) => {
    const state = useUserStore.getState();
    if (!state.uid) return;
    await remove(ref(db, `friendRequests/${state.uid}/${requesterUid}`));
};

export const sendRoomInvite = async (targetUid, roomId) => {
    const state = useUserStore.getState();
    if (!state.uid || !targetUid || !roomId) return;
    const inviteRef = push(ref(db, `invites/${targetUid}`));
    await set(inviteRef, { fromUid: state.uid, fromName: state.playerName, roomId: roomId, timestamp: Date.now() });
    setTimeout(() => remove(inviteRef), 600000);
};

export const deleteInvite = async (inviteId) => {
    const state = useUserStore.getState();
    if (!state.uid || !inviteId) return;
    await remove(ref(db, `invites/${state.uid}/${inviteId}`));
};