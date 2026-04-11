import { useGameStore } from '../store/useGameStore';
import { logMsg } from './actions';
import { dealDamage } from './combat';
import { getDistance } from '../utils/gameLogic';

export const actionDash = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 3) return;
    
    const reach = new Set();
    const dfs = (id, n) => {
        const t = state.mapData.find(x => x.id === id); 
        if (!t) return;
        t.next.filter(nx => nx !== state.constructionPos).forEach(nx => {
            if (n === 1) reach.add(nx); else dfs(nx, n - 1);
        });
    };
    dfs(cp.pos, 3);
    const targets = [...reach];
    
    if (targets.length === 0) {
        useGameStore.getState().showToast("3マス先に進める場所がありません");
        return;
    }
    
    state.updateCurrentPlayer(p => ({ ap: p.ap - 3 }));
    if (targets.length === 1) {
        state.updateCurrentPlayer(p => ({ pos: targets[0] }));
        logMsg(`💨 疾風ダッシュ！3マス先へ跳躍！`);
    } else {
        // ▼ 追加：isDashPicking を true にして、UI側で白く光らせる判定に使う
        useGameStore.setState({ isBranchPicking: true, currentBranchOptions: targets, isDashPicking: true });
        logMsg(`💨 疾風ダッシュ！着地点を選んでください`);
    }
};

export const actionPunch = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const targets = state.players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);
    if (targets.length === 0 || cp.ap < 2) return;
    
    state.updateCurrentPlayer(p => ({ ap: p.ap - 2 }));
    const target = targets[0]; 
    dealDamage(target.id, 10, "殴る", cp.id);
    logMsg(`👊 ${cp.name}が${target.name}を殴った！10ダメージ！`);
};

export const actionCamp = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 2) return;
    
    const healed = Math.min(15, 100 - cp.hp);
    state.updateCurrentPlayer(p => ({ ap: p.ap - 2, hp: p.hp + healed }));
    logMsg(`⛺ ${cp.name}が野宿した！HPが${healed}回復！`);
};

// ▼ 修正：すぐ押し付けるのではなく、カードを選択するモードへ移行する
export const actionSalesVisit = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const targets = state.players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);
    if (targets.length === 0 || cp.ap < 2 || cp.hand.length === 0) return;

    // 手札選択モードのUIを表示させるためのステートを設定
    useGameStore.setState({ isSalesVisiting: true, salesTargetId: targets[0].id });
    logMsg(`📦 訪問販売の準備... 押し付けるカードを選んでください。`);
};

// ▼ 追加：UI側（HandCards.jsxなど）でカードを選んだ時に呼ばれる確定処理
export const executeSalesVisit = (cardIndex) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const targetId = state.salesTargetId;
    const target = state.players.find(p => p.id === targetId);
    
    if (!target || cp.ap < 2 || cp.hand.length <= cardIndex) return;

    const cardToGive = cp.hand[cardIndex]; 
    const fee = Math.min(3, Math.max(0, target.p));

    const newHand = [...cp.hand];
    newHand.splice(cardIndex, 1);

    state.updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p + fee, hand: newHand }));
    state.updatePlayer(target.id, p => ({ p: p.p - fee, hand: [...p.hand, cardToGive] }));
    
    useGameStore.setState({ isSalesVisiting: false, salesTargetId: null });
    logMsg(`📦 ${cp.name}が${target.name}にカードを押し付け、${fee}Pを徴収した！`);
};

export const actionHack = () => {
    const state = useGameStore.getState();
    if (state.players[state.turn].ap < 3) return;
    state.updateCurrentPlayer(p => ({ ap: p.ap - 3 }));
    useGameStore.setState({ shopStockTurn: -1, shopActive: true });
    logMsg(`💻 遠隔ハッキング！ショップネットワークに侵入した！`);
};

export const actionConcert = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 3) return; // ▼ 軽量化: 4AP → 3AP

    state.updateCurrentPlayer(p => ({ ap: p.ap - 3 }));
    
    let pulledPlayers = [];
    state.players.forEach(op => {
        if (op.id !== cp.id && op.hp > 0) {
            const dist = getDistance(cp.pos, op.pos, state.mapData);
            if (dist <= 2) {
                // ▼ 引き寄せ＋次回移動時のAPペナルティ付与
                state.updatePlayer(op.id, p => ({ pos: cp.pos, nextMoveCostPenalty: (p.nextMoveCostPenalty || 0) + 1 }));
                pulledPlayers.push(op.name);
            }
        }
    });

    if (pulledPlayers.length > 0) {
        const bonusP = pulledPlayers.length * 2; // 集めた人数×2P
        state.updateCurrentPlayer(p => ({ p: p.p + bonusP }));
        logMsg(`🎸 アンコール！ ${pulledPlayers.join(' と ')} を引き寄せ、${bonusP}Pを獲得！`);
        logMsg(`🎵 引き寄せられた相手は足止めされ、次回の移動APが+1される！`);
    } else {
        logMsg(`🎸 アンコール！しかし周囲に誰もいなかった...`);
    }
};

export const actionDarkCure = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const targets = state.players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);
    if (targets.length === 0 || cp.ap < 2) return;

    const target = targets[0];
    const healed = Math.min(30, 100 - target.hp);
    const fee = Math.min(5, Math.max(0, target.p));

    state.updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p + fee }));
    // ▼ 対象に「治療済み」の毒ステータスを付与（3ターン継続）
    state.updatePlayer(target.id, p => ({ 
        hp: p.hp + healed, 
        p: p.p - fee, 
        statusEffects: { ...(p.statusEffects || {}), poison: 3 } 
    }));
    logMsg(`🩺 毒入り治療！${target.name}のHPを${healed}回復させ、治療費${fee}Pを徴収！`);
    logMsg(`☠️ ${target.name}は「治療済み」となり、今後3ターンの間毒ダメージを受ける...`);
};

export const actionGamble = () => { // ※旧「イカサマ勝負」。UI連動の互換性のため関数名は据え置き
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 3) return;

    // 1ターン3回までの制限
    const drawCount = cp.drawCountThisTurn || 0;
    if (drawCount >= 3) {
        useGameStore.getState().showToast("ドロー勝負は1ターンに3回までです");
        return;
    }

    if (cp.hand.length >= (cp.maxHand || 9) + (cp.charType === 'hacker' ? 2 : 0)) {
        useGameStore.getState().showToast("手札がいっぱいです");
        return;
    }

    state.updateCurrentPlayer(p => ({ ap: p.ap - 3, drawCountThisTurn: drawCount + 1 }));

    // レアとノーマルのプールからランダムドロー
    const rarePool = [12, 13, 35, 36, 37];
    const normalPool = [0,1,2,3,4,5,6,7,8,9,10,11,14,15,16,17,18,19,20,24,25,26,27,28,29,30,31,32,33,34];
    const drawCard = () => Math.random() < 0.1 ? rarePool[Math.floor(Math.random() * rarePool.length)] : normalPool[Math.floor(Math.random() * normalPool.length)];
    
    const cardId = drawCard();
    state.updateCurrentPlayer(p => ({ hand: [...p.hand, cardId] }));
    
    logMsg(`🃏 ドロー勝負！ ${cp.name}は山札からカードを1枚手に入れた！(${drawCount + 1}/3回)`);
};

export const actionNpcMove = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    
    if (cp.ap < 3) return;
    if (cp.detectiveCd > 0) {
        useGameStore.getState().showToast(`クールタイム中です（あと${cp.detectiveCd}ラウンド）`);
        return;
    }
    
    useGameStore.setState({ npcSelectActive: true });
    logMsg(`🕵️ 情報操作！動かすNPCを選んでください。`);
};

export const setupNpcMove = (npcKey) => {
    const state = useGameStore.getState();
    state.updateCurrentPlayer(p => ({ ap: p.ap - 3, detectiveCd: 3 }));
    useGameStore.setState({ npcSelectActive: false, npcMovePick: npcKey });
    logMsg(`🕵️ マップ上のマスをタップしてNPCを移動させてください。`);
};

// ▼ 新規追加: 罠の設置ロジック
export const actionSetTrap = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    
    if (cp.ap < 2) return;
    const myTraps = state.traps?.filter(t => t.ownerId === cp.id) || [];
    if (myTraps.length >= 2) {
        useGameStore.getState().showToast("設置できる罠は同時に2つまでです");
        return;
    }
    
    useGameStore.setState({ isTrapPicking: true });
    logMsg(`🪤 罠の準備！仕掛ける種類を選んでください。`);
};

export const setupSetTrap = (trapType) => {
    useGameStore.setState({ isTrapPicking: false, selectedTrapType: trapType });
    logMsg(`🪤 罠を仕掛けるマスをタップしてください。`);
};

export const executeSetTrap = (tileId) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const type = state.selectedTrapType;
    
    if (cp.ap < 2) return;
    
    state.updateCurrentPlayer(p => ({ ap: p.ap - 2 }));
    useGameStore.setState(prev => ({
        traps: [...(prev.traps || []), { tileId, type, ownerId: cp.id }],
        selectedTrapType: null
    }));
    
    logMsg(`🪤 ${cp.name}が罠を設置した...（他プレイヤーには見えません）`);
};