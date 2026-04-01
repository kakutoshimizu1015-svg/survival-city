import { getAuth, signInAnonymously } from 'firebase/auth';
import { useUserStore } from '../store/useUserStore';
import { app } from '../lib/firebase'; 
import { useNetworkStore } from '../store/useNetworkStore';
// ▼ 追加：userLogicをインポート
import { loadUserData } from './userLogic';

const auth = getAuth(app);

export const loginAnonymously = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    // 1. 基本的なログイン状態を保存
    useUserStore.getState().setUserData({
      uid: user.uid,
      isLoggedIn: true,
    });

    // 2. 通信用IDを固定
    useNetworkStore.getState().setMyUserId(user.uid);

    // 3. ▼ 追加：データベースから詳細なセーブデータ（名前、ポイント等）を読み込む
    await loadUserData(user.uid);

    console.log("匿名ログイン・データ同期成功!");
    return user.uid;
  } catch (error) {
    console.error("ログイン失敗:", error);
    return null;
  }
};