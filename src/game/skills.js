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
        useGameStore.setState({ isBranchPicking: true, currentBranchOptions: targets });
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

export const actionSalesVisit = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const targets = state.players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);
    if (targets.length === 0 || cp.ap < 2 || cp.hand.length === 0) return;

    const target = targets[0];
    const cardToGive = cp.hand[0]; 
    const fee = Math.min(3, Math.max(0, target.p));

    state.updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p + fee, hand: p.hand.slice(1) }));
    state.updatePlayer(target.id, p => ({ p: p.p - fee, hand: [...p.hand, cardToGive] }));
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

export const actionNpcMove = () => {
    const state = useGameStore.getState();
    if (state.players[state.turn].ap < 3) return;
    
    useGameStore.setState({ npcMovePick: 'policePos' });
    logMsg(`🕵️ 情報操作！警察を移動させます。マップ上のマスをタップしてください。`);
};