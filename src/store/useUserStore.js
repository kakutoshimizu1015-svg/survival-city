import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set) => ({
      uid: null,
      isLoggedIn: false,
      
      playerName: '名無しサバイバー',
      gachaPoints: 0,
      wins: 0,
      totalEarnedP: 0,
      
      // ガチャ資産とスキンデータ
      gachaCans: 0,
      unlockedSkins: [],
      equippedSkins: {}, // { charKey: skinId }
      
      // スタッツ（累計データ）
      totalTilesMoved: 0,
      totalCardsUsed: 0,
      totalCansCollected: 0,
      totalTrashCollected: 0,
      totalPSpentAtShop: 0,
      npcEncounters: { police: 0, uncle: 0, yakuza: 0, loanshark: 0, friend: 0 },
      
      // 永続化する環境設定
      showSmoke: true,
      liteMode: false,
      volume: 1.0,
      layoutMode: 'auto',
      showSkipButton: false,
      autoScrollToPlayer: true,

      // ▼ 新規追加: フレンド・招待機能用ステート
      friends: [], 
      friendRequests: [],
      invites: [],

      setUserData: (data) => set((state) => ({ ...state, ...data })),
      setShowSmoke: (show) => set({ showSmoke: show }), 
      
      incrementStat: (key, amount = 1) => set((state) => ({ 
          [key]: (state[key] || 0) + amount 
      })),
      incrementNpcEncounter: (npcType) => set((state) => ({
          npcEncounters: { 
              ...state.npcEncounters, 
              [npcType]: (state.npcEncounters[npcType] || 0) + 1 
          }
      })),

      // リロードバグ対策。計算結果を確実に反映させるため状態をディープコピーして更新
      addGachaAssets: (cansAmount, pointsAmount) => set((state) => {
          const newCans = Math.max(0, (state.gachaCans || 0) + cansAmount);
          const newPoints = Math.max(0, (state.gachaPoints || 0) + pointsAmount);
          return { gachaCans: newCans, gachaPoints: newPoints };
      }),

      unlockMultipleSkins: (skinIds) => set((state) => {
          // 重複を防ぎながら追加
          const currentSkins = state.unlockedSkins || [];
          const newSkins = skinIds.filter(id => !currentSkins.includes(id));
          return { unlockedSkins: [...currentSkins, ...newSkins] };
      }),

      setEquippedSkin: (charKey, skinId) => set((state) => ({
          equippedSkins: { ...state.equippedSkins, [charKey]: skinId }
      }))
    }),
    {
      name: 'homeless-survival-user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        playerName: state.playerName,
        gachaPoints: state.gachaPoints,
        wins: state.wins,
        totalEarnedP: state.totalEarnedP,
        
        gachaCans: state.gachaCans,
        unlockedSkins: state.unlockedSkins,
        equippedSkins: state.equippedSkins,
        
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
        
        // フレンド一覧もキャッシュとして永続化
        friends: state.friends,
      }),
    }
  )
);