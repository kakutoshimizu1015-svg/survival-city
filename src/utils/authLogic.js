import { signInAnonymously, linkWithPopup } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { useUserStore } from '../store/useUserStore';
import { auth, googleProvider, db } from '../lib/firebase'; 
import { useNetworkStore } from '../store/useNetworkStore';
import { loadUserData } from './userLogic';

export const loginAnonymously = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;

    // 既にリンクされているかチェック
    const isLinked = user.providerData && user.providerData.some(p => p.providerId === 'google.com');

    useUserStore.getState().setUserData({
      uid: user.uid,
      isLoggedIn: true,
      isLinked: isLinked,
      linkedEmail: isLinked ? user.providerData.find(p => p.providerId === 'google.com')?.email : null
    });

    useNetworkStore.getState().setMyUserId(user.uid);
    await loadUserData(user.uid);

    console.log("ログイン・データ同期成功!");
    return user.uid;
  } catch (error) {
    console.error("ログイン失敗:", error);
    return null;
  }
};

// ▼ 追加: 現在の匿名データをGoogleアカウントに紐づける
export const linkGoogleAccount = async () => {
    try {
        if (!auth.currentUser) return { success: false, message: "エラー：未ログイン状態です" };
        
        // 匿名ユーザーにGoogleクレデンシャルをリンク（結合）する
        const result = await linkWithPopup(auth.currentUser, googleProvider);
        const user = result.user;
        const email = user.email || user.providerData.find(p => p.providerId === 'google.com')?.email;
        
        // ローカルステートを更新
        useUserStore.getState().setUserData({
            isLinked: true,
            linkedEmail: email
        });
        
        // データベースにも連携済みフラグを立てる（オプション）
        await update(ref(db, `users/${user.uid}`), {
            isLinked: true,
            linkedEmail: email
        });
        
        console.log("Googleアカウントとの連携に成功しました", user);
        return { success: true, message: 'Googleアカウントと連携しました！\nデータが保護され、引き継ぎ可能になりました。' };

    } catch (error) {
        console.error("Google連携エラー:", error);
        if (error.code === 'auth/credential-already-in-use') {
            return { success: false, message: 'このGoogleアカウントは既に別のプレイヤーデータと連携されています。別のアカウントを選択してください。' };
        }
        if (error.code === 'auth/popup-closed-by-user') {
            return { success: false, message: '連携がキャンセルされました。' };
        }
        return { success: false, message: '連携に失敗しました。' };
    }
};