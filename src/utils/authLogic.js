import { getAuth, signInAnonymously } from 'firebase/auth';
import { useUserStore } from '../store/useUserStore';
// ※ すでにロビー機能等で使っているFirebase初期化ファイルから app を読み込みます
// （プロジェクトの構造に合わせてパスは変更してください）
import { app } from './firebase'; 

const auth = getAuth(app);

export const loginAnonymously = async () => {
  try {
    // Firebaseで匿名ログインを実行
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    // 成功したら、先ほど作ったStoreにUIDを保存して状態を更新
    useUserStore.getState().setUserData({
      uid: user.uid,
      isLoggedIn: true,
    });

    console.log("匿名ログイン成功! UID:", user.uid);
    return user.uid;
  } catch (error) {
    console.error("匿名ログインに失敗しました:", error);
    return null;
  }
};