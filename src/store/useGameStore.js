import { create } from 'zustand';

const initialState = {
    gamePhase: 'title', diceAnim: { active: false, d1: 1, d2: 1, text: '' },
    turnOrderActive: false, turnOrderData: null, gameOver: false, 
    isBranchPicking: false, currentBranchOptions: [],
    shopActive: false, shopStock: [], shopStockTurn: -1, shopCart: [],
    mgActive: false, mgType: "", mgValue: 0, mgResult: null, storyActive: false,
    settingsActive: false, rulesActive: false, tutorialActive: false,
    layoutMode: 'auto', volume: 1.0, tutorialStep: 0, sandboxActive: false, sandboxScenario: -1, sandboxStep: 0,
    
    // ▼ 追加：演出ステート
    turnBanner: null, turnBannerActive: false,
    eventPopups: [], horrorMode: false, disasterWarning: null, bloodAnim: null,

    players: [], turn: 0, diceRolled: false, canPickedThisTurn: 0, cpuActing: false,
    mapData: [], territories: {}, isRainy: false, weatherState: 'sunny', isNight: false,
    roundCount: 1, maxRounds: 20, canPrice: 1, trashPrice: 2, destTile: -1,
    truckPos: 0, policePos: 0, unclePos: 0, animalPos: 0, yakuzaPos: 0, loansharkPos: 0, friendPos: 0,
};

export const useGameStore = create((set, get) => ({
    ...initialState,
    setGameState: (newState) => set((state) => ({ ...state, ...newState })),
    updatePlayer: (id, updater) => set((state) => ({ players: state.players.map(p => p.id === id ? { ...p, ...updater(p) } : p) })),
    updateCurrentPlayer: (updater) => set((state) => ({ players: state.players.map(p => p.id === state.turn ? { ...p, ...updater(p) } : p) })),
    resetGame: () => set(initialState),
    applyNetworkAction: (action) => { console.log("Network action:", action); },
    
    // ▼ 追加：ポップアップ自動管理
    addEventPopup: (playerId, icon, title, detail = "", type = "neutral") => {
        const id = Date.now() + Math.random();
        set(state => ({ eventPopups: [...state.eventPopups.slice(-2), { id, playerId, icon, title, detail, type }] }));
        setTimeout(() => set(state => ({ eventPopups: state.eventPopups.filter(p => p.id !== id) })), 2800);
    }
}));