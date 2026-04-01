import { create } from 'zustand';

export const useUserStore = create((set) => ({
  uid: null,              // Firebaseから付与される固有ID
  playerName: '名無しサバイバー', // プレイヤー名の初期値
  gachaPoints: 0,         // ガチャ用のポイント
  isLoggedIn: false,      // ログイン完了フラグ

  // 取得したデータをStoreに上書きする関数
  setUserData: (data) => set((state) => ({ ...state, ...data })),
}));