import { getAuth, signInAnonymously } from 'firebase/auth';
import { useUserStore } from '../store/useUserStore';
// ▼ 修正：正しいパス（../lib/firebase）に変更
import { app } from '../lib/firebase'; 

const auth = getAuth(app);

export const loginAnonymously = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

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