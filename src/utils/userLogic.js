import { ref, get, set, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { useUserStore } from '../store/useUserStore';

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
      
      // ▼ 修正: DBに無い可能性がある新しいキー（ガチャ資産・スキン）のデフォルト値ケア
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
 * @param {number} earnedP 今回の優勝で獲得したP
 */
export const recordWin = async (earnedP) => {
  const { uid, wins, totalEarnedP, gachaPoints } = useUserStore.getState();
  if (!uid) return;

  const newData = {
    wins: wins + 1,
    totalEarnedP: totalEarnedP + earnedP,
    gachaPoints: gachaPoints + earnedP // 稼いだPをガチャPに加算
  };

  await update(ref(db, `users/${uid}`), newData);
  useUserStore.getState().setUserData(newData);
};

/**
 * ▼ 新規追加: ガチャ資産やスキンの変動をFirebaseに同期する
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