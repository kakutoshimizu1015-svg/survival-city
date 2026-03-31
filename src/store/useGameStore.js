import { create } from 'zustand';

// ゲームの初期状態
const initialState = {
    // --- システム・UI状態 ---
    gamePhase: 'title', 
    diceAnim: { active: false, d1: 1, d2: 1, text: '' },
    turnOrderActive: false, // 順番決めダイス用
    turnOrderData: null,    // 順番決めダイス用データ
    gameOver: false, 
    isBranchPicking: false, 
    currentBranchOptions: [],
    shopActive: false, 
    shopStock: [], 
    shopStockTurn: -1, 
    shopCart: [],
    mgActive: false, 
    mgType: "", 
    mgTimeLeft: 10, 
    mgValue: 0, 
    mgResult: null,
    storyActive: false, 
    currentStory: null,
    weaponArcData: null, // 武器の照準UI用データ
    
    // --- プレイヤー・ターン状態 ---
    players: [], 
    turn: 0, 
    diceRolled: false, 
    canPickedThisTurn: 0, 
    cpuActing: false,

    // --- マップ・環境状態 ---
    mapData: [], 
    territories: {}, 
    isRainy: false, 
    weatherState: 'sunny', 
    isNight: false,
    roundCount: 1, // 初期値1
    maxRounds: 20, 
    canPrice: 1, 
    trashPrice: 2, 
    destTile: -1, 
    constructionPos: -1, 
    constructionTimer: 0,

    // --- NPC・ギミック位置 ---
    truckPos: 0, 
    policePos: 0, 
    unclePos: 0, 
    animalPos: 0, 
    yakuzaPos: 0, 
    loansharkPos: 0, 
    friendPos: 0,
};

export const useGameStore = create((set, get) => ({
    ...initialState,
    
    // 状態をまとめて上書き・更新する関数
    setGameState: (newState) => set((state) => ({ ...state, ...newState })),
    
    // 特定のプレイヤーの情報を更新する関数
    updatePlayer: (id, updater) => set((state) => ({ 
        players: state.players.map(p => p.id === id ? { ...p, ...updater(p) } : p) 
    })),
    
    // 現在のターンのプレイヤーの情報を更新する関数
    updateCurrentPlayer: (updater) => set((state) => ({ 
        players: state.players.map(p => p.id === state.turn ? { ...p, ...updater(p) } : p) 
    })),
    
    // ゲームを初期状態にリセットする関数
    resetGame: () => set(initialState),

    // ネットワーク経由でアクションを受け取った時の処理
    applyNetworkAction: (action) => {
        console.log("Received action from client:", action);
    }
}));