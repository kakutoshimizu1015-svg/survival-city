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
      
      // ▼ 追加：永続化する環境設定
      showSmoke: true,
      liteMode: false,
      volume: 1.0,
      layoutMode: 'auto',
      showSkipButton: false,
      autoScrollToPlayer: true,

      setUserData: (data) => set((state) => ({ ...state, ...data })),
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
        liteMode: state.liteMode,
        volume: state.volume,
        layoutMode: state.layoutMode,
        showSkipButton: state.showSkipButton,
        autoScrollToPlayer: state.autoScrollToPlayer,
      }),
    }
  )
);