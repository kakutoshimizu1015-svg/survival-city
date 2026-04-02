import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set) => ({
      uid: null,
      isLoggedIn: false,
      
      // 保存対象のデータ
      playerName: '名無しサバイバー',
      gachaPoints: 0,      // 現在持っているガチャ用P
      wins: 0,             // 優勝数
      totalEarnedP: 0,     // 今まで優勝したときの総Pポイント
      
      // ▼ 追加：煙エフェクトの表示設定（デフォルトON）
      showSmoke: true,

      setUserData: (data) => set((state) => ({ ...state, ...data })),
      // ▼ 追加：設定切り替え用アクション
      setShowSmoke: (show) => set({ showSmoke: show }), 
    }),
    {
      name: 'homeless-survival-user-storage', // ローカルストレージのキー名
      storage: createJSONStorage(() => localStorage),
      // 端末に保存（永続化）したい値だけを指定
      partialize: (state) => ({
        playerName: state.playerName,
        gachaPoints: state.gachaPoints,
        wins: state.wins,
        totalEarnedP: state.totalEarnedP,
        showSmoke: state.showSmoke,
      }),
    }
  )
);