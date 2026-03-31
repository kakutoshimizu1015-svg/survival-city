import { useGameStore } from '../store/useGameStore';
import { checkNpcCollision } from './npc';
import { processRoundEnd } from './round';

export const logMsg = (htmlMsg) => {
    const logger = document.getElementById("log");
    if (logger) {
        const div = document.createElement("div");
        div.innerHTML = `> ${htmlMsg}`;
        logger.appendChild(div);
        logger.scrollTop = logger.scrollHeight;
    }
};

export const actionRollDice = async (isCpuCall = false) => {
    const state = useGameStore.getState();
    const { turn, players, diceRolled } = state;
    const cp = players[turn];

    if (diceRolled || (!isCpuCall && cp.isCPU)) return;

    useGameStore.setState({ diceAnim: { active: true, d1: 1, d2: 1, text: `${cp.name}がサイコロを振っています...` }});
    await new Promise(r => setTimeout(r, 1000));

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    let totalAP = d1 + d2;
    const isZorome = d1 === d2;
    if (isZorome) totalAP *= 2;
    if (cp.equip?.bicycle) totalAP += 2; 

    let textResult = `${d1}+${d2}=${d1+d2}AP${isZorome ? " (🎲ゾロ目×2)" : ""}`;
    useGameStore.setState({ diceAnim: { active: true, d1, d2, text: textResult }, diceRolled: true, canPickedThisTurn: 0 });
    state.updateCurrentPlayer(p => ({ ap: p.ap + totalAP }));
    logMsg(`<span style="color:${cp.color}">${cp.name}</span>は${totalAP}AP獲得！`);

    await new Promise(r => setTimeout(r, 1800));
    useGameStore.setState(prev => ({ diceAnim: { ...prev.diceAnim, active: false } }));
};

export const actionMove = () => {
    const state = useGameStore.getState();
    const currentTile = state.mapData.find(t => t.id === state.players[state.turn].pos);
    const validNextTiles = currentTile.next;

    if (validNextTiles.length === 1) {
        executeMove(validNextTiles[0]);
    } else if (validNextTiles.length > 1) {
        useGameStore.setState({ isBranchPicking: true, currentBranchOptions: validNextTiles });
        logMsg("🛣️ 分岐点！進む道を選んでください。");
    }
};

export const executeMove = (targetTileId) => {
    const state = useGameStore.getState();
    const tile = state.mapData.find(t => t.id === targetTileId);
    const cp = state.players[state.turn];

    const moveCost = (state.isRainy && !cp.rainGear && cp.charType !== "athlete") ? 2 : 1;

    state.updateCurrentPlayer(p => ({ ap: Math.max(0, p.ap - moveCost), pos: targetTileId, rainGear: state.isRainy ? false : p.rainGear }));
    useGameStore.setState({ isBranchPicking: false, currentBranchOptions: [] });
    logMsg(`🚶 「${tile.name}」に移動しました。`);

    // NPCとの接触判定
    checkNpcCollision(cp.id);

    // イベントマス判定
    if (tile.type === "event") {
        if (!cp.isCPU) {
            if (Math.random() < 0.3) {
                useGameStore.setState({ storyActive: true });
            } else {
                const types = ["highlow", "boxes", "slot"];
                useGameStore.setState({ mgActive: true, mgType: types[Math.floor(Math.random() * types.length)], mgValue: Math.floor(Math.random() * 14), mgResult: null });
            }
        }
    }
    if (tile.type === "shelter") {
        state.updateCurrentPlayer(p => ({ stealth: true }));
        logMsg(`🏕️ 避難所で休息。ステルス獲得！`);
    }
};

export const actionCan = () => {
    const state = useGameStore.getState();
    state.updateCurrentPlayer(p => ({ ap: p.ap - 1, cans: p.cans + 1 }));
    useGameStore.setState(s => ({ canPickedThisTurn: s.canPickedThisTurn + 1 }));
    logMsg(`🥫 空き缶を拾った！`);
};

export const actionTrash = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const cost = cp.equip?.shoes ? 1 : 2;
    
    state.updateCurrentPlayer(p => ({ ap: p.ap - cost }));
    const gain = Math.floor(Math.random() * 6);
    
    if (gain === 0) {
        if (cp.stealth) {
            state.updateCurrentPlayer(p => ({ stealth: false }));
            logMsg(`💨 ステルスで警察回避！`);
        } else {
            state.updateCurrentPlayer(p => ({ ap: Math.max(0, p.ap - 2) }));
            logMsg(`👮 ゴミ漁り失敗！警察に見つかりAP減少！`);
        }
    } else {
        state.updateCurrentPlayer(p => ({ trash: p.trash + gain }));
        logMsg(`🗑️ ゴミを${gain}個見つけた！`);
    }
};

export const actionJob = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const isSuccess = Math.random() < (cp.charType === "sales" ? 0.8 : 0.6);
    state.updateCurrentPlayer(p => ({ ap: p.ap - 3, p: p.p + (isSuccess ? 12 : 0) }));
    logMsg(isSuccess ? `💼 バイト成功！12P獲得！` : `💼 バイト失敗...`);
};

export const actionOccupy = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const pCost = (state.territories[cp.pos] !== undefined) ? 5 : 3; 
    if (cp.p < pCost) return;
    
    state.updateCurrentPlayer(p => ({ p: p.p - pCost }));
    useGameStore.setState(s => ({ territories: { ...s.territories, [cp.pos]: cp.id } }));
    logMsg(`🚩 陣地を占領した！(-${pCost}P)`);
};

export const actionExchange = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const total = cp.cans * state.canPrice + cp.trash * state.trashPrice;
    state.updateCurrentPlayer(p => ({ p: p.p + total, cans: 0, trash: 0 }));
    logMsg(`💱 換金！${total}P獲得！`);
};

export const actionManhole = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const manholes = state.mapData.filter(t => t.type === "manhole" && t.id !== cp.pos);
    if (manholes.length > 0) {
        const dest = manholes[Math.floor(Math.random() * manholes.length)];
        state.updateCurrentPlayer(p => ({ ap: p.ap - 1, pos: dest.id }));
        logMsg(`🕳️ ワープ！→ ${dest.name}`);
        checkNpcCollision(cp.id);
    }
};

export const actionEndTurn = async () => {
    try {
        const state = useGameStore.getState();
        const isLastPlayer = state.turn === state.players.length - 1;
        const nextTurn = (state.turn + 1) % state.players.length;
        
        state.updateCurrentPlayer(p => ({ ap: 0, stealth: false })); 
        
        // 分岐やミニゲームのスタック状態を強制リセットしてフリーズを防ぐ
        useGameStore.setState({ isBranchPicking: false, mgActive: false, storyActive: false });
        
        if (isLastPlayer) {
            await processRoundEnd();
        }
        
        useGameStore.setState({ turn: nextTurn, diceRolled: false });
    } catch (error) {
        console.error("ターン終了処理でエラー発生:", error);
        // エラーが起きても強引に次のターンへ回すフェイルセーフ
        useGameStore.setState(s => ({ turn: (s.turn + 1) % s.players.length, diceRolled: false, isBranchPicking: false }));
    }
};