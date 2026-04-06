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
    
    // ▼ 追加: チャット管理用ステート
    chatQueue: [],

    // まとめて状態を更新
    setLobbyState: (newState) => set((state) => ({ ...state, ...newState })),

    // ロビー状態をリセット（退室時など）
    resetLobby: () => set({ 
        isOnlineMode: false, 
        isHost: false, 
        myRoomId: null, 
        hostRoomName: "", 
        hostPassword: "", 
        lobbyPlayers: [],
        chatQueue: [] // リセット時にもクリア
    }),

    // ▼ 追加: チャットオーバーレイ用のアクション
    addChatToQueue: (chat) => set((state) => ({
        chatQueue: [...state.chatQueue, chat]
    })),
    removeChatFromQueue: (id) => set((state) => ({
        chatQueue: state.chatQueue.filter(c => c.id !== id)
    })),
}));