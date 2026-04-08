import { create } from 'zustand';

const initialState = {
    gamePhase: 'title', diceAnim: { active: false, d1: 1, d2: 1, text: '' },
    turnOrderActive: false, turnOrderData: null, gameOver: false, 
    
    isBranchPicking: false, 
    currentBranchOptions: [],
    isDashPicking: false,    
    isSalesVisiting: false,  
    salesTargetId: null,     
    npcSelectActive: false,  
    npcMovePick: null,       
    
    shopActive: false, shopStock: [], shopStockTurn: -1, shopCart: [],
    purchasedCards: {}, // ▼ 追加: ゲーム全体で各カードが何枚買われたかを記憶 { cardId: count }
    mgActive: false, mgType: "", mgValue: 0, mgResult: null, storyActive: false,
    mgSyncData: null, // ▼ 追加: ミニゲームのリアルタイム同期用データ（座標やスコア等）
    mgStarted: false, // ▼ 追加: ミニゲームがスタートしたかを全員で共有するフラグ
    settingsActive: false, rulesActive: false, tutorialActive: false, teamActionActive: false,
    tutorialStep: 0, sandboxActive: false, sandboxScenario: -1, sandboxStep: 0,
    turnBanner: null, turnBannerActive: false, eventPopups: [], horrorMode: false, disasterWarning: null, bloodAnim: null,
    
    jobResult: null,
    logs: [],
    charInfoModal: null,
    roundSummary: null,
    acquiredCard: null,
    territorySelectOptions: null,
    gameResult: null,
    
    awardsActive: false,
    awardsData: null,
    pendingGameResult: null,

    toastMsg: null,
    centerWarning: null,
    tooltipData: null,
    _roundEndInProgress: false,

    players: [], turn: 0, diceRolled: false, canPickedThisTurn: 0, cpuActing: false,
    mapData: [], territories: {}, territoryCosts: {}, isRainy: false, weatherState: 'sunny', isNight: false,
    roundCount: 1, maxRounds: 20, canPrice: 1, trashPrice: 2, destTile: -1,
    
    truckPos: 0, 
    policePos: 0, policeCd: 0, policeHp: 10, policeRespawn: 0,
    unclePos: 0, uncleCd: 0, uncleHp: 10, uncleRespawn: 0,
    animalPos: 0, animalCd: 0, animalHp: 10, animalRespawn: 0,
    yakuzaPos: 0, yakuzaCd: 0, yakuzaHp: 10, yakuzaRespawn: 0,
    loansharkPos: 0, loansharkCd: 0, loansharkHp: 10, loansharkRespawn: 0,
    friendPos: 0, friendCd: 0, friendHp: 10, friendRespawn: 0,
    
    layoutMode: 'auto',
    
    // ▼ ミニゲームモード用ステート追加
    selectedMiniGame: null,
};

export const useGameStore = create((set, get) => ({
    ...initialState,
    setGameState: (newState) => set((state) => ({ ...state, ...newState })),
    
    updatePlayer: (id, updater) => set((state) => ({
        players: state.players.map(p => p.id === id ? { 
            ...p, 
            ...(typeof updater === 'function' ? updater(p) : updater) 
        } : p)
    })),
    
    updateCurrentPlayer: (updater) => set((state) => ({
        players: state.players.map((p, index) => index === state.turn ? { 
            ...p, 
            ...(typeof updater === 'function' ? updater(p) : updater) 
        } : p)
    })),

    incrementGameStat: (playerId, key, amount) => set((state) => ({
        players: state.players.map(p => {
            if (p.id === playerId) {
                const baseStats = { tiles: 0, cards: 0, cans: 0, trash: 0, shopP: 0, jobs: 0, territories: 0, minigames: 0 };
                const currentStats = { ...baseStats, ...(p.gameStats || {}) };
                const newStats = { ...currentStats, [key]: currentStats[key] + amount };
                return { ...p, gameStats: newStats };
            }
            return p;
        })
    })),
    
    resetGame: () => set(initialState),
    applyNetworkAction: (action) => { console.log("Network action:", action); },
    
    addEventPopup: (playerId, icon, title, detail = "", type = "neutral") => {
        const id = Date.now() + Math.random();
        set(state => ({ eventPopups: [...state.eventPopups.slice(-2), { id, playerId, icon, title, detail, type }] }));
        setTimeout(() => set(state => ({ eventPopups: state.eventPopups.filter(p => p.id !== id) })), 2800);
    },

    showToast: (msg) => {
        set({ toastMsg: msg });
        setTimeout(() => set({ toastMsg: null }), 3000);
    },
    showCenterWarning: (msg) => {
        set({ centerWarning: msg });
        setTimeout(() => set({ centerWarning: null }), 4000);
    },
    
    setTooltipData: (data) => set({ tooltipData: data })
}));

export const isSameTeam = (p1, p2) => p1 && p2 && p1.id !== p2.id && p1.teamColor !== 'none' && p1.teamColor === p2.teamColor;