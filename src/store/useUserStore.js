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
      
      // ▼ 追加：スタッツ（累計データ）
      totalTilesMoved: 0,       // 移動したマス
      totalCardsUsed: 0,        // 使ったカード数
      totalCansCollected: 0,    // 集めた缶
      totalTrashCollected: 0,   // 漁ったゴミ
      totalPSpentAtShop: 0,     // Shopで使ったP
      npcEncounters: {          // 各NPC遭遇回数
          police: 0,
          uncle: 0,
          yakuza: 0,
          loanshark: 0,
          friend: 0
      },
      
      // 永続化する環境設定
      showSmoke: true,
      liteMode: false,
      volume: 1.0,
      layoutMode: 'auto',
      showSkipButton: false,
      autoScrollToPlayer: true,

      setUserData: (data) => set((state) => ({ ...state, ...data })),
      setShowSmoke: (show) => set({ showSmoke: show }), 
      
      // ▼ 追加：スタッツのカウントアップ用関数
      incrementStat: (key, amount = 1) => set((state) => ({ 
          [key]: (state[key] || 0) + amount 
      })),
      incrementNpcEncounter: (npcType) => set((state) => ({
          npcEncounters: { 
              ...state.npcEncounters, 
              [npcType]: (state.npcEncounters[npcType] || 0) + 1 
          }
      }))
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
        
        totalTilesMoved: state.totalTilesMoved,
        totalCardsUsed: state.totalCardsUsed,
        totalCansCollected: state.totalCansCollected,
        totalTrashCollected: state.totalTrashCollected,
        totalPSpentAtShop: state.totalPSpentAtShop,
        npcEncounters: state.npcEncounters,
        
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