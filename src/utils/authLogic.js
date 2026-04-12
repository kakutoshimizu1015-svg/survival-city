import { signInAnonymously, linkWithPopup, signInWithPopup, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { useUserStore } from '../store/useUserStore';
import { auth, googleProvider, db } from '../lib/firebase'; 
import { useNetworkStore } from '../store/useNetworkStore';
import { loadUserData } from './userLogic';

/**
 * 共通処理: FirebaseのUserオブジェクトをStoreに同期し、DBから完全なデータをロードする
 */
const syncUserToStore = async (user) => {
    const isLinked = user.providerData && user.providerData.some(p => p.providerId === 'google.com');
    const email = isLinked ? (user.email || user.providerData.find(p => p.providerId === 'google.com')?.email) : null;

    useUserStore.getState().setUserData({
      uid: user.uid,
      isLoggedIn: true,
      isLinked: isLinked,
      linkedEmail: email
    });

    useNetworkStore.getState().setMyUserId(user.uid);
    await loadUserData(user.uid);
};

/**
 * アプリ起動時: 既存セッションの復元、または新規匿名ログイン
 */
export const initAuth = async () => {
  // ▼ 確実にブラウザを閉じてもセッションが残るように明示的に設定
  await setPersistence(auth, browserLocalPersistence);

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // 1回確認したら解除

      if (user) {
        console.log("既存セッションを復元:", user.uid);
        await syncUserToStore(user);
        useUserStore.getState().setUserData({ isAuthResolved: true });
        resolve(user.uid);
      } else {
        console.log("セッションなし。新規ゲストアカウントを作成します。");
        try {
          const res = await signInAnonymously(auth);
          await syncUserToStore(res.user);
          useUserStore.getState().setUserData({ isAuthResolved: true });
          resolve(res.user.uid);
        } catch (error) {
          console.error("ゲストログイン失敗:", error);
          useUserStore.getState().setUserData({ isAuthResolved: true });
          resolve(null);
        }
      }
    });
  });
};

/**
 * 現在のゲストデータをGoogleアカウントに紐づける
 */
export const linkGoogleAccount = async () => {
    try {
        if (!auth.currentUser) return { success: false, message: "未ログイン状態です" };
        const result = await linkWithPopup(auth.currentUser, googleProvider);
        await syncUserToStore(result.user);
        
        await update(ref(db, `users/${result.user.uid}`), { isLinked: true, linkedEmail: result.user.email });
        return { success: true, message: '現在のアカウントをGoogleに紐づけました！\nデータが保護されました。' };
    } catch (error) {
        console.error("Google連携エラー:", error);
        if (error.code === 'auth/credential-already-in-use') {
            return { success: false, message: 'このGoogleアカウントは既に別のデータで使用されています。「ロード」を試してください。' };
        }
        return { success: false, message: '連携に失敗しました。' };
    }
};

/**
 * 他端末からGoogleアカウントでデータをロードする（引き継ぎ）
 */
export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log("Googleログイン成功（引き継ぎ）:", result.user.uid);
        
        // ▼ 別のデータが混ざらないよう、ローカルの資産やスタッツを一度リセットする
        useUserStore.getState().setUserData({
            gachaCans: 0, gachaPoints: 0, unlockedSkins: [], equippedSkins: {},
            wins: 0, totalEarnedP: 0, totalTilesMoved: 0, totalCardsUsed: 0,
            totalCansCollected: 0, totalTrashCollected: 0, totalPSpentAtShop: 0
        });

        await syncUserToStore(result.user);
        return { success: true, message: 'データの引き継ぎ（ロード）が完了しました！' };
    } catch (error) {
        console.error("Googleログインエラー:", error);
        return { success: false, message: 'ログインに失敗しました。' };
    }
};