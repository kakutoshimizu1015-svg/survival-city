import { ref, get, set, update, push, onValue, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/useUserStore';

/**
 * ▼ 新規追加: フレンド・招待のリアルタイム監視
 */
export const listenToFriendsAndInvites = (uid) => {
    if (!uid) return;
    
    // 1. フレンド一覧の監視
    const friendsRef = ref(db, `users/${uid}/friends`);
    onValue(friendsRef, (snapshot) => {
        const data = snapshot.val();
        const friendsList = data ? Object.values(data) : [];
        useUserStore.getState().setUserData({ friends: friendsList });
    });

    // 2. フレンドリクエストの監視
    const reqRef = ref(db, `friendRequests/${uid}`);
    onValue(reqRef, (snapshot) => {
        const data = snapshot.val();
        const requests = data ? Object.values(data) : [];
        useUserStore.getState().setUserData({ friendRequests: requests });
    });

    // 3. 届いた招待の監視
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
 * ログイン直後にDBからユーザーデータを読み込む
 */
export const loadUserData = async (uid) => {
  const userRef = ref(db, `users/${uid}`);
  try {
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      // 既存データがあればStoreに反映
      const data = snapshot.val();
      
      // DBに無い可能性がある新しいキー（ガチャ資産・スキン）のデフォルト値ケア
      const mergedData = {
          ...data,
          gachaCans: data.gachaCans || 0,
          unlockedSkins: data.unlockedSkins || [],
          equippedSkins: data.equippedSkins || {}
      };
      
      useUserStore.getState().setUserData(mergedData);
      console.log("ユーザーデータ読み込み成功:", mergedData);
    } else {
      // 新規ユーザーなら初期データをDBに作成
      const initialData = {
        playerName: '名無しサバイバー',
        gachaPoints: 0,
        gachaCans: 0,
        unlockedSkins: [],
        equippedSkins: {},
        wins: 0,
        totalEarnedP: 0
      };
      await set(userRef, initialData);
      console.log("新規ユーザーデータ作成完了");
    }

    // ▼ 追加: ログイン完了と同時にフレンド機能の監視を開始
    listenToFriendsAndInvites(uid);

  } catch (error) {
    console.error("データ読み込み失敗:", error);
  }
};

/**
 * プレイヤー名の変更を保存する
 */
export const savePlayerName = async (newName) => {
  const { uid } = useUserStore.getState();
  if (!uid) return;

  await update(ref(db, `users/${uid}`), { playerName: newName });
  useUserStore.getState().setUserData({ playerName: newName });
};

/**
 * 優勝時の記録更新
 */
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

/**
 * ガチャ資産やスキンの変動をFirebaseに同期する
 */
export const syncGachaData = async () => {
  const { uid, gachaCans, gachaPoints, unlockedSkins, equippedSkins } = useUserStore.getState();
  if (!uid) return;

  const syncData = {
      gachaCans,
      gachaPoints,
      unlockedSkins,
      equippedSkins
  };

  try {
      await update(ref(db, `users/${uid}`), syncData);
      console.log("ガチャデータ同期成功");
  } catch (error) {
      console.error("ガチャデータ同期失敗:", error);
  }
};

// ==========================================
// ▼ 新規追加: フレンド・招待アクション群
// ==========================================

export const sendFriendRequest = async (targetUid) => {
    const state = useUserStore.getState();
    if (!state.uid || !targetUid || state.uid === targetUid) return;
    
    // 相手のリクエストノードに自分の情報を追加
    const reqRef = ref(db, `friendRequests/${targetUid}/${state.uid}`);
    await set(reqRef, { uid: state.uid, name: state.playerName, timestamp: Date.now() });
};

export const acceptFriendRequest = async (requesterUid, requesterName) => {
    const state = useUserStore.getState();
    if (!state.uid) return;
    
    // お互いのfriendsノードに追加
    await set(ref(db, `users/${state.uid}/friends/${requesterUid}`), { uid: requesterUid, name: requesterName });
    await set(ref(db, `users/${requesterUid}/friends/${state.uid}`), { uid: state.uid, name: state.playerName });
    
    // 承認後はリクエストを削除
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
    await set(inviteRef, {
        fromUid: state.uid,
        fromName: state.playerName,
        roomId: roomId,
        timestamp: Date.now()
    });
    
    // 招待は10分後に自動消滅する簡易的な処理
    setTimeout(() => remove(inviteRef), 600000);
};

export const deleteInvite = async (inviteId) => {
    const state = useUserStore.getState();
    if (!state.uid || !inviteId) return;
    await remove(ref(db, `invites/${state.uid}/${inviteId}`));
};