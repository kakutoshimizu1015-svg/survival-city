import { ref, get, set, update, push, onValue, remove } from 'firebase/database';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/useUserStore';
import { listenToTrades } from './tradeLogic'

/**
 * ▼ 新規追加: 8桁のランダムなフレンドコード（英数字）を生成する
 */
const generateFriendCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // 見やすくハイフンを入れる (例: A1B2-C3D4)
    return `${code.slice(0, 4)}-${code.slice(4, 8)}`;
};

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
 * グローバルメール（運営からのプレゼント）のリアルタイム監視
 */
export const listenToMails = (uid) => {
    if (!uid) return;
    const globalMailsRef = ref(db, 'globalMails');
    
    onValue(globalMailsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
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
 * メールを受け取り、資産を加算する
 */
export const claimMail = async (mail) => {
    const state = useUserStore.getState();
    if (!state.uid) return false;
    
    if (state.claimedMails.includes(mail.id)) return false;

    const pReward = mail.p || 0;
    const canReward = mail.cans || 0;
    if (pReward > 0 || canReward > 0) {
        state.addGachaAssets(canReward, pReward);
    }

    const newClaimedMails = [...state.claimedMails, mail.id];
    state.setUserData({ claimedMails: newClaimedMails });

    try {
        await update(ref(db, `users/${state.uid}`), { 
            claimedMails: newClaimedMails,
            gachaCans: state.gachaCans,     
            gachaPoints: state.gachaPoints  
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
    
    // ▼ 前回追加した todayStr の判定ロジックをすべて削除し、元の処理にスッキリ戻します
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // ▼ 修正: 既存ユーザーでフレンドコードがない場合は生成して保存
      let currentFriendCode = data.friendCode;
      if (!currentFriendCode) {
          currentFriendCode = generateFriendCode();
          await update(userRef, { friendCode: currentFriendCode });
          await set(ref(db, `friendCodes/${currentFriendCode}`), { uid: uid });
      }

      const mergedData = {
          ...data,
          friendCode: currentFriendCode,
          gachaCans: data.gachaCans || 0,
          unlockedSkins: data.unlockedSkins || [],
          equippedSkins: data.equippedSkins || {},
          claimedMails: data.claimedMails || []
      };
      useUserStore.getState().setUserData(mergedData);
      console.log("ユーザーデータ読み込み成功:", mergedData);
    } else {
      // ▼ 新規ユーザー作成時にフレンドコードを生成し、逆引き辞書にも登録
      const newFriendCode = generateFriendCode();
      const initialData = {
        playerName: '名無しサバイバー',
        friendCode: newFriendCode,
        gachaPoints: 0,
        gachaCans: 0,
        unlockedSkins: [],
        equippedSkins: {},
        claimedMails: [], 
        wins: 0,
        totalEarnedP: 0
      };
      
      await set(userRef, initialData);
      // 検索用ノードへの書き込み
      await set(ref(db, `friendCodes/${newFriendCode}`), { uid: uid });
      console.log("新規ユーザーデータ作成完了");
    }

    listenToFriendsAndInvites(uid);
    listenToMails(uid); 
    
    // ▼ 追加: トレード監視を開始
    // ※ import { listenToTrades } from './tradeLogic'; をファイルの最上部に追加してください
    const { listenToTrades } = await import('./tradeLogic');
    listenToTrades(uid);

  } catch (error) {
    console.error("データ読み込み失敗:", error);
  }
};

export const savePlayerName = async (newName) => {
  const state = useUserStore.getState();
  const { uid, friends } = state;
  if (!uid) return;
  
  // 1. 自分のデータを更新
  await update(ref(db, `users/${uid}`), { playerName: newName });
  
  // 2. ▼ 追加: 自分のフレンド全員の「フレンドリスト」の中にある自分の名前も更新する
  if (friends && friends.length > 0) {
      const updates = {};
      friends.forEach(f => {
          updates[`users/${f.uid}/friends/${uid}/name`] = newName;
      });
      await update(ref(db), updates);
  }

  state.setUserData({ playerName: newName });
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
  // ▼ 修正: favoriteSkin も取得して同期データに含める
  const { uid, gachaCans, gachaPoints, unlockedSkins, equippedSkins, favoriteSkin } = useUserStore.getState();
  if (!uid) return;
  const syncData = { gachaCans, gachaPoints, unlockedSkins, equippedSkins, favoriteSkin };
  try {
      await update(ref(db, `users/${uid}`), syncData);
      console.log("ガチャデータ同期成功");
  } catch (error) {
      console.error("ガチャデータ同期失敗:", error);
  }
};

// ==========================================
// ▼ フレンド・招待アクション群（新コード検索対応）
// ==========================================

/**
 * ▼ 新規追加: 短いフレンドコードから相手のUIDを検索し、フレンド申請を送る
 */
export const sendFriendRequestByCode = async (friendCode) => {
    const state = useUserStore.getState();
    if (!state.uid || !friendCode) return { success: false, message: 'コードが未入力です' };

    // ハイフンや小文字を吸収する整形
    const formattedCode = friendCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const searchCode = `${formattedCode.slice(0, 4)}-${formattedCode.slice(4, 8)}`;

    if (searchCode === state.friendCode) return { success: false, message: '自分自身には申請できません' };

    try {
        // 1. friendCodes辞書から相手のUIDを検索
        const codeSnap = await get(ref(db, `friendCodes/${searchCode}`));
        if (!codeSnap.exists()) return { success: false, message: 'プレイヤーが見つかりません' };

        const targetUid = codeSnap.val().uid;

        // 2. すでにフレンドかどうかチェック
        const isAlreadyFriend = state.friends.some(f => f.uid === targetUid);
        if (isAlreadyFriend) return { success: false, message: 'すでにフレンドです' };

        // 3. 相手のユーザーデータを取得して名前を確認
        const userSnap = await get(ref(db, `users/${targetUid}/playerName`));
        const targetName = userSnap.exists() ? userSnap.val() : '不明なプレイヤー';

        // 4. 相手のリクエストノードに自分の情報を追加
        const reqRef = ref(db, `friendRequests/${targetUid}/${state.uid}`);
        await set(reqRef, { uid: state.uid, name: state.playerName, timestamp: Date.now() });

        return { success: true, message: `${targetName} にフレンド申請を送りました！` };
    } catch (error) {
        console.error("フレンド申請エラー:", error);
        return { success: false, message: '通信エラーが発生しました' };
    }
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

/**
 * ▼ 新規追加: 指定したUIDのプロフィールデータを取得する
 */
export const fetchUserProfile = async (targetUid) => {
    if (!targetUid) return null;
    try {
        const snapshot = await get(ref(db, `users/${targetUid}`));
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    } catch (error) {
        console.error("プロフィール取得エラー:", error);
        return null;
    }
};