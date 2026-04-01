import { create } from 'zustand';

export const useUserStore = create((set) => ({
  uid: null,
  isLoggedIn: false,
  
  // 保存対象のデータ
  playerName: '名無しサバイバー',
  gachaPoints: 0,      // 現在持っているガチャ用P
  wins: 0,             // 優勝数
  totalEarnedP: 0,     // 今まで優勝したときの総Pポイント

  setUserData: (data) => set((state) => ({ ...state, ...data })),
}));