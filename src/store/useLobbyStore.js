import { create } from 'zustand';

// ランダムなユーザーIDを生成（元のコードと同じロジック）
const initialUserId = Math.random().toString(36).substring(2, 10);

export const useLobbyStore = create((set) => ({
    isOnlineMode: false,
    isHost: false,
    myUserId: initialUserId,
    myRoomId: null,
    hostRoomName: "",
    hostPassword: "",
    lobbyPlayers: [],

    // まとめて状態を更新
    setLobbyState: (newState) => set((state) => ({ ...state, ...newState })),

    // ロビー状態をリセット（退室時など）
    resetLobby: () => set({ 
        isOnlineMode: false, 
        isHost: false, 
        myRoomId: null, 
        hostRoomName: "", 
        hostPassword: "", 
        lobbyPlayers: [] 
    }),
}));