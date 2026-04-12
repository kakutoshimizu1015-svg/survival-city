import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set) => ({
      uid: null,
      isLoggedIn: false,
      
      // ▼ 追加: Google連携状態の管理
      isLinked: false,
      linkedEmail: null,
      isAuthResolved: false, // ▼ 追加: 認証・データロードが完了したかどうかのフラグ
      
      playerName: '名無しサバイバー',
      friendCode: null, 
      lastClaimedDate: null, 
      loginDays: 0,
      gachaPoints: 0,
      wins: 0,
      totalEarnedP: 0,
      gachaCans: 0,
      unlockedSkins: [],
      equippedSkins: {}, 
      favoriteSkin: null, 
      totalTilesMoved: 0,
      totalCardsUsed: 0,
      totalCansCollected: 0,
      totalTrashCollected: 0,
      totalPSpentAtShop: 0,
      npcEncounters: { police: 0, uncle: 0, yakuza: 0, loanshark: 0, friend: 0 },
      showSmoke: true,
      liteMode: false,
      showTileLabels: false, 
      volume: 1.0,
      layoutMode: 'auto',
      showSkipButton: false,
      autoScrollToPlayer: true,
      friends: [], 
      friendRequests: [],
      invites: [],
      claimedMails: [], 
      inbox: [],        

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
      addGachaAssets: (cansAmount, pointsAmount) => set((state) => {
          const newCans = Math.max(0, (state.gachaCans || 0) + cansAmount);
          const newPoints = Math.max(0, (state.gachaPoints || 0) + pointsAmount);
          return { gachaCans: newCans, gachaPoints: newPoints };
      }),
      unlockMultipleSkins: (skinIds) => set((state) => {
          const currentSkins = state.unlockedSkins || [];
          const newSkins = skinIds.filter(id => !currentSkins.includes(id));
          return { unlockedSkins: [...currentSkins, ...newSkins] };
      }),
      setEquippedSkin: (charKey, skinId) => set((state) => ({
          equippedSkins: { ...state.equippedSkins, [charKey]: skinId }
      })),
      setFavoriteSkin: (skinData) => set({ favoriteSkin: skinData })
    }),
    {
      name: 'homeless-survival-user-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        uid: state.uid,
        isLinked: state.isLinked,
        linkedEmail: state.linkedEmail,
        // isAuthResolved は毎回 false でスタートさせるため保存しない
        playerName: state.playerName,
        friendCode: state.friendCode, 
        lastClaimedDate: state.lastClaimedDate, 
        loginDays: state.loginDays,
        gachaPoints: state.gachaPoints,
        wins: state.wins,
        totalEarnedP: state.totalEarnedP,
        gachaCans: state.gachaCans,
        unlockedSkins: state.unlockedSkins,
        equippedSkins: state.equippedSkins,
        favoriteSkin: state.favoriteSkin, 
        totalTilesMoved: state.totalTilesMoved,
        totalCardsUsed: state.totalCardsUsed,
        totalCansCollected: state.totalCansCollected,
        totalTrashCollected: state.totalTrashCollected,
        totalPSpentAtShop: state.totalPSpentAtShop,
        npcEncounters: state.npcEncounters,
        showSmoke: state.showSmoke,
        liteMode: state.liteMode,
        showTileLabels: state.showTileLabels, 
        volume: state.volume,
        layoutMode: state.layoutMode,
        showSkipButton: state.showSkipButton,
        autoScrollToPlayer: state.autoScrollToPlayer,
        friends: state.friends,
        claimedMails: state.claimedMails,
      }),
    }
  )
);