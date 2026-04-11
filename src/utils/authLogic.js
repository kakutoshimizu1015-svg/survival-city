import { signInAnonymously, linkWithPopup, onAuthStateChanged } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { useUserStore } from '../store/useUserStore';
import { auth, googleProvider, db } from '../lib/firebase'; 
import { useNetworkStore } from '../store/useNetworkStore';
import { loadUserData } from './userLogic';

export const loginAnonymously = () => {
  // ▼ Promiseを使って、ログイン（復元）が完了するまで待機する構造に変更
  return new Promise((resolve) => {
    // ▼ onAuthStateChanged: Firebaseがブラウザに保存されたセッションをチェックする
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      
      // 1回チェックしたら監視を解除（ゲーム起動時の初期化でのみ使うため）
      unsubscribe();
      
      if (user) {
        // ==========================================
        // ① すでにログイン済み（セッション復元）の場合
        // ==========================================
        const isLinked = user.providerData && user.providerData.some(p => p.providerId === 'google.com');
        
        useUserStore.getState().setUserData({
          uid: user.uid,
          isLoggedIn: true,
          isLinked: isLinked,
          linkedEmail: isLinked ? user.providerData.find(p => p.providerId === 'google.com')?.email : null
        });

        useNetworkStore.getState().setMyUserId(user.uid);
        await loadUserData(user.uid);
        
        console.log(`自動ログイン成功！ (${isLinked ? 'Google連携済み' : 'ゲストデータ'})`);
        resolve(user.uid);

      } else {
        // ==========================================
        // ② 全くの初回プレイ（未ログイン）の場合
        // ==========================================
        try {
          const userCredential = await signInAnonymously(auth);
          const newUser = userCredential.user;

          useUserStore.getState().setUserData({
            uid: newUser.uid,
            isLoggedIn: true,
            isLinked: false,
            linkedEmail: null
          });

          useNetworkStore.getState().setMyUserId(newUser.uid);
          await loadUserData(newUser.uid);
          
          console.log("新規ゲストプレイとしてログインしました");
          resolve(newUser.uid);

        } catch (error) {
          console.error("ゲストログイン失敗:", error);
          resolve(null);
        }
      }
    });
  });
};

// ▼ 現在の匿名データをGoogleアカウントに紐づける
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
        
        // データベースにも連携済みフラグを立てる
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