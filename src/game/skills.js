import { useGameStore } from '../store/useGameStore';
import { deckData } from '../constants/cards'; // ▼ 追加: カード情報を参照するため
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

export const actionSalesVisit = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const targets = state.players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);
    if (targets.length === 0 || cp.ap < 2 || cp.hand.length === 0) return;

    useGameStore.setState({ isSalesVisiting: true, salesTargetId: targets[0].id });
    logMsg(`📦 訪問販売の準備... 押し付けるカードを選んでください。`);
};

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
    if (cp.ap < 3) return;

    state.updateCurrentPlayer(p => ({ ap: p.ap - 3 }));
    
    let pulledPlayers = [];
    state.players.forEach(op => {
        if (op.id !== cp.id && op.hp > 0) {
            const dist = getDistance(cp.pos, op.pos, state.mapData);
            if (dist <= 2) {
                state.updatePlayer(op.id, p => ({ pos: cp.pos, nextMoveCostPenalty: (p.nextMoveCostPenalty || 0) + 1 }));
                pulledPlayers.push(op.name);
            }
        }
    });

    if (pulledPlayers.length > 0) {
        const bonusP = pulledPlayers.length * 2; 
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

    if (targets.length === 1) {
        executeDarkCure(targets[0].id);
    } else {
        useGameStore.setState({ isDarkCurePicking: true, darkCureTargets: targets.map(t => t.id) });
    }
};

export const executeDarkCure = (targetId) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const target = state.players.find(p => p.id === targetId);

    if (!target || cp.ap < 2) return;

    const healed = Math.min(30, 100 - target.hp);
    const fee = Math.min(5, Math.max(0, target.p));

    state.updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p + fee }));
    state.updatePlayer(target.id, p => ({ 
        hp: p.hp + healed, 
        p: p.p - fee, 
        statusEffects: { ...(p.statusEffects || {}), poison: 3 } 
    }));
    
    useGameStore.setState({ isDarkCurePicking: false, darkCureTargets: [] });
    logMsg(`🩺 毒入り治療！${target.name}のHPを${healed}回復させ、治療費${fee}Pを徴収！`);
    logMsg(`☠️ ${target.name}は「治療済み」となり、今後3ターンの間毒ダメージを受ける...`);
};

export const actionGamble = () => { 
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 3) return;

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

export const actionSetTrap = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    
    if (cp.ap < 2) return;
    const myTraps = state.traps?.filter(t => t.ownerId === cp.id) || [];
    if (myTraps.length >= 2) {
        useGameStore.getState().showToast("設置できる罠は同時に2つまでです");
        return;
    }
    
    useGameStore.setState({ isTrapTypePicking: true });
    logMsg(`🪤 罠の準備！仕掛ける種類を選んでください。`);
};

export const setupSetTrap = (trapType) => {
    useGameStore.setState({ isTrapTypePicking: false, isTrapTilePicking: true, selectedTrapType: trapType });
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
        isTrapTilePicking: false,
        selectedTrapType: null
    }));
    
    logMsg(`🪤 ${cp.name}が罠を設置した...（他プレイヤーには見えません）`);
};

// ==========================================
// ▼ フェーズ3: 新キャラクターのアクションスキル
// ==========================================

// 🍳 元シェフ: 特製料理
export const actionChef = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 3) return;
    
    useGameStore.setState({ isChefPicking: true });
    logMsg(`🍳 特製料理の準備！調理する回復カードを選んでください。`);
};

export const executeChef = (handIndex) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const cardId = cp.hand[handIndex];
    const cardData = deckData.find(c => c.id === cardId);

    if (!cardData || cardData.type !== 'heal') {
        useGameStore.getState().showToast("料理できるのは回復カードのみです");
        return;
    }

    const newHand = [...cp.hand];
    newHand.splice(handIndex, 1);

    const healAmount = (cardData.heal || 0) * 2;
    const newHp = Math.min(100, cp.hp + healAmount);

    state.updateCurrentPlayer(p => ({ ap: p.ap - 3, hp: newHp, hand: newHand }));
    useGameStore.setState({ isChefPicking: false });
    
    logMsg(`🍳 特製料理完成！「${cardData.name}」が極上の味になり、食中毒なしでHPが${healAmount}回復した！`);
    state.addEventPopup(cp.id, "🍳", "特製料理", `HP+${healAmount}`, "good");
};

// 🛠️ スカベンジャー: ガラクタ工作
export const actionScavenger = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 3) return;
    if (cp.trash < 3) {
        useGameStore.getState().showToast("ゴミが3つ必要です");
        return;
    }
    useGameStore.setState({ isScavengerPicking: true });
    logMsg(`🛠️ ガラクタ工作！ゴミを3つ消費して何を作る？`);
};

export const executeScavenger = (type) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 3 || cp.trash < 3) return;

    let newHand = [...cp.hand];
    let msg = "";

    if (type === 'equip') {
        const equipPool = [8, 24, 25, 26, 27, 28, 29, 45, 46];
        const generated = equipPool[Math.floor(Math.random() * equipPool.length)];
        newHand.push(generated);
        msg = `ランダムな装備品（${deckData.find(c=>c.id===generated).name}）`;
    } else {
        newHand.push(20); // 既存のショットガンで代用
        msg = `ショットガン`;
    }

    state.updateCurrentPlayer(p => ({ ap: p.ap - 3, trash: p.trash - 3, hand: newHand }));
    useGameStore.setState({ isScavengerPicking: false });
    
    logMsg(`🛠️ ゴミから ${msg} を組み上げた！`);
    state.addEventPopup(cp.id, "🛠️", "工作完了", msg + "を獲得", "good");
};

// 💴 億万長者: 買収
export const actionBribe = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 2) return;
    useGameStore.setState({ isBribePicking: true });
    logMsg(`💴 買収の準備... ターゲットと買収方法を選んでください。`);
};

export const executeBribe = (targetId, type, extraData) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const target = state.players.find(p => p.id === targetId);

    if (!target || cp.ap < 2) return;

    if (type === 'hand') {
        if (cp.p < 5 || target.hand.length === 0) return;
        const stolenCard = target.hand[extraData]; 
        const tHand = [...target.hand]; tHand.splice(extraData, 1);
        state.updatePlayer(targetId, p => ({ p: p.p + 5, hand: tHand }));
        state.updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p - 5, hand: [...p.hand, stolenCard] }));
        logMsg(`💴 【手札買収】5Pを支払い、${target.name}の手札を強制的に買い取った！`);
    } else if (type === 'territory') {
        const tileId = extraData;
        const cost = (state.territoryCosts[tileId] || 3) * 2;
        if (cp.p < cost) return;
        state.updatePlayer(targetId, p => ({ p: p.p + cost }));
        state.updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p - cost }));
        useGameStore.setState(prev => ({ territories: { ...prev.territories, [tileId]: cp.id } }));
        logMsg(`💴 【陣地買収】${cost}Pを支払い、${target.name}の陣地を強制買収した！`);
    } else if (type === 'hire') {
        if (cp.p < 10) return;
        state.updatePlayer(targetId, p => ({ p: p.p + 10, penaltyAP: (p.penaltyAP || 0) + 3 })); // 雇用による次ターンの実質行動制限
        state.updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p - 10 }));
        logMsg(`💴 【雇用】10Pを支払い、${target.name}を次のターン雇用した！（APを制限する）`);
    }
    useGameStore.setState({ isBribePicking: false });
};

// 👼 路上の神様: 神託
export const actionOracle = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 3) return;

    state.updateCurrentPlayer(p => ({ ap: p.ap - 3 }));
    state.players.forEach(p => {
        if (p.id !== cp.id && p.hp > 0) {
            state.updatePlayer(p.id, prev => ({ godBlessing: true, bonusAP: (prev.bonusAP || 0) + 2 }));
            state.addEventPopup(p.id, "👼", "神の導き", "次ダイス+2", "good");
        }
    });
    logMsg(`👼 【神託】自分以外の全員に「神の導き（次ダイス+2）」を与えた！`);
    logMsg(`（※導きを受けたプレイヤーは、ターン終了時に神様へ2Pを強制送金します）`);
};

// 🥫 缶コレクターの帝王: 缶バリスタ
export const actionCanBallista = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 2) return;
    if (cp.cans < 1) {
        useGameStore.getState().showToast("空き缶がありません");
        return;
    }
    useGameStore.setState({ isCanBallistaPicking: true });
    logMsg(`🥫 缶バリスタ！発射する缶の数を選んでください。`);
};

// ▼ 追加: 武器の照準UI(WeaponArcOverlay)を呼び出す関数
export const setupCanBallistaAim = (consumeAmount) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];

    if (cp.ap < 2 || cp.cans < consumeAmount) return;

    let dmg = 0, range = 0, aoe = false;
    if (consumeAmount >= 12) { dmg = 60; range = 5; aoe = true; } // 12個消費は扇状範囲攻撃に！
    else if (consumeAmount >= 9) { dmg = 40; range = 4; }
    else if (consumeAmount >= 6) { dmg = 25; range = 3; }
    else { dmg = 10; range = 2; }

    const playerTargets = state.players.filter(op => op.id !== cp.id && op.hp > 0);
    const npcs = [
        { id: 'npc_police', name: 'パトカー', pos: state.policePos, hp: state.policeHp, type: 'npc' },
        { id: 'npc_uncle', name: '厄介なおじさん', pos: state.unclePos, hp: state.uncleHp, type: 'npc' },
        { id: 'npc_yakuza', name: 'ヤクザ', pos: state.yakuzaPos, hp: state.yakuzaHp, type: 'npc' },
        { id: 'npc_loanshark', name: '闇金', pos: state.loansharkPos, hp: state.loansharkHp, type: 'npc' },
        { id: 'npc_friend', name: '仲間のホームレス', pos: state.friendPos, hp: state.friendHp, type: 'npc' }
    ].filter(n => n.hp > 0 && n.pos !== 999);

    // 武器と同じエイムUIを呼び出す
    useGameStore.setState({
        isCanBallistaPicking: false,
        weaponArcData: {
            cardData: { id: 'can_ballista', name: '缶バリスタ', range, dmg, aoe, isSkill: 'canBallista', consumeAmount },
            targets: [...playerTargets, ...npcs],
            attacker: cp
        }
    });
};

// ▼ 修正: 照準UIからターゲットを受け取り、ここで初めてAPと缶を消費する
export const executeCanBallista = (hitTargets, consumeAmount) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];

    if (hitTargets.length === 0 || cp.ap < 2 || cp.cans < consumeAmount) return;

    // コスト消費（ここで初めて消費する）
    state.updateCurrentPlayer(p => ({ ap: p.ap - 2, cans: p.cans - consumeAmount }));

    let dmg = 0;
    if (consumeAmount >= 12) dmg = 60;
    else if (consumeAmount >= 9) dmg = 40;
    else if (consumeAmount >= 6) dmg = 25;
    else dmg = 10;

    logMsg(`🥫 【缶バリスタ】${consumeAmount}個の空き缶を乱射！！`);

    hitTargets.forEach(target => {
        dealDamage(target.id, dmg, "缶バリスタ", cp.id);

        if (consumeAmount >= 6 && consumeAmount < 9) {
            if (!String(target.id).startsWith('npc_')) {
                state.updatePlayer(target.id, p => ({ penaltyAP: (p.penaltyAP||0) + 1 }));
                logMsg(`💥 衝撃で${target.name}は次AP-1！`);
            }
        } else if (consumeAmount >= 9 && consumeAmount < 12) {
            if (!String(target.id).startsWith('npc_')) {
                state.updatePlayer(target.id, p => ({ cans: 0 }));
                logMsg(`💥 破壊的な威力で${target.name}の所持する缶がすべて弾け飛んだ！`);
            }
        }
    });

    if (consumeAmount >= 12) {
        logMsg(`💥 圧倒的な缶の弾幕が範囲内のすべてを吹き飛ばした！`);
    }
};

// ☁️ 路上の仙人: 天地開闢
export const actionTenchi = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];

    if (cp.senki < 5) {
        useGameStore.getState().showToast("仙気が5スタック必要です");
        return;
    }

    useGameStore.setState({ tenchiZeroIncome: 1 });

    const npcKeys = ['policePos', 'unclePos', 'animalPos', 'yakuzaPos', 'loansharkPos', 'friendPos'];
    let updates = {};
    npcKeys.forEach(k => {
        if (state[k] !== 999) {
            updates[k] = state.mapData[Math.floor(Math.random() * state.mapData.length)].id;
        }
    });
    useGameStore.setState(updates);

    const addP = Math.min(30, cp.p);
    state.updateCurrentPlayer(p => ({
        senki: 0,
        p: p.p + addP,
        zazenTurns: 2 // 行動不能フラグ
    }));

    logMsg(`☁️ 【天地開闢】発動！！ 次ラウンドの全陣地収入がゼロになり、全NPCがワープした！`);
    logMsg(`🧘 ${cp.name}は所持Pが倍増したが、仙気を失い2ターンの座禅（行動不可）に入った...`);
    state.addEventPopup(cp.id, "☁️", "天地開闢", "マップ全体に影響！", "good");
};