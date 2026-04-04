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
    if (cp.ap < 4) return;

    state.updateCurrentPlayer(p => ({ ap: p.ap - 4 }));
    
    let pulledPlayers = [];
    state.players.forEach(op => {
        if (op.id !== cp.id && op.hp > 0) {
            const dist = getDistance(cp.pos, op.pos, state.mapData);
            if (dist <= 2) {
                state.updatePlayer(op.id, p => ({ pos: cp.pos }));
                pulledPlayers.push(op.name);
            }
        }
    });

    if (pulledPlayers.length > 0) {
        state.updateCurrentPlayer(p => ({ p: p.p + pulledPlayers.length * 2 }));
        logMsg(`🎸 路上ライブ！ ${pulledPlayers.join('と')} を引き寄せ、${pulledPlayers.length * 2}Pを獲得！`);
    } else {
        logMsg(`🎸 路上ライブ！しかし周囲に誰もいなかった...`);
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
    state.updatePlayer(target.id, p => ({ hp: p.hp + healed, p: p.p - fee }));
    logMsg(`🩺 闇診療！${target.name}のHPを${healed}回復させ、治療費${fee}Pを徴収した！`);
};

export const actionGamble = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const targets = state.players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);
    if (targets.length === 0 || cp.ap < 2) return;

    const target = targets[0];
    state.updateCurrentPlayer(p => ({ ap: p.ap - 2 }));

    const myRoll = Math.floor(Math.random() * 6) + 1;
    const enemyRoll = Math.floor(Math.random() * 6) + 1;
    
    if (myRoll > enemyRoll) {
        const fee = Math.min(5, target.p);
        state.updateCurrentPlayer(p => ({ p: p.p + fee }));
        state.updatePlayer(target.id, p => ({ p: p.p - fee }));
        logMsg(`🎲 イカサマ勝負(${myRoll}対${enemyRoll})：${cp.name}の勝ち！${fee}Pを奪った！`);
    } else {
        const fee = Math.min(5, cp.p);
        state.updateCurrentPlayer(p => ({ p: p.p - fee }));
        state.updatePlayer(target.id, p => ({ p: p.p + fee }));
        logMsg(`🎲 イカサマ勝負(${myRoll}対${enemyRoll})：${cp.name}の負け...${fee}Pを奪われた。`);
    }
};

// ▼ 修正：固定で警察を動かすのではなく、UIを開いてNPCを選ばせる
export const actionNpcMove = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    
    if (cp.ap < 3) return;
    if (cp.detectiveCd > 0) {
        useGameStore.getState().showToast(`クールタイム中です（あと${cp.detectiveCd}ラウンド）`);
        return;
    }
    
    // UI側にNPC選択モーダルを開くよう指示
    useGameStore.setState({ npcSelectActive: true });
    logMsg(`🕵️ 情報操作！動かすNPCを選んでください。`);
};

// ▼ 追加：UI側でNPCを選んだ時に呼ばれ、マップ選択モードへ移行する処理
export const setupNpcMove = (npcKey) => {
    const state = useGameStore.getState();
    
    // コストとクールタイムを適用
    state.updateCurrentPlayer(p => ({ ap: p.ap - 3, detectiveCd: 3 }));
    
    // ターゲット指定モードへ移行
    useGameStore.setState({ npcSelectActive: false, npcMovePick: npcKey });
    logMsg(`🕵️ マップ上のマスをタップしてNPCを移動させてください。`);
};