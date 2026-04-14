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

// ▼ 修正: 🍳 元シェフ: 腐敗料理（攻撃）のフロー変更と追加効果
export const actionChefAttack = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const targets = state.players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);

    if (targets.length === 0 || cp.ap < 2) return;

    if (targets.length === 1) {
        // 相手が1人の場合はすぐにカード選択モードへ移行
        useGameStore.setState({ 
            isChefAttackPicking: false, 
            chefAttackTargets: [], 
            chefAttackTargetId: targets[0].id, 
            isChefAttackCardPicking: true 
        });
        logMsg(`🤢 ${targets[0].name} に食べさせる食料を手札から選んでください。`);
    } else {
        // 複数いる場合はターゲット選択モードへ
        useGameStore.setState({ isChefAttackPicking: true, chefAttackTargets: targets.map(t => t.id) });
    }
};

// ▼ 引数を targetId から handIndex に変更し、手札を消費させる
export const executeChefAttack = (handIndex) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const targetId = state.chefAttackTargetId;
    const target = state.players.find(p => p.id === targetId);

    if (!target || cp.ap < 2) return;

    const cardId = cp.hand[handIndex];
    const cardData = deckData.find(c => c.id === cardId);

    if (!cardData || cardData.type !== 'heal') {
        useGameStore.getState().showToast("食べさせられるのは回復カードのみです");
        return;
    }

    // 手札を消費
    const newHand = [...cp.hand];
    newHand.splice(handIndex, 1);

    state.updateCurrentPlayer(p => ({ ap: p.ap - 2, hand: newHand }));
    useGameStore.setState({ isChefAttackCardPicking: false, chefAttackTargetId: null });

    // 腐敗判定（名前による判定、または毒効果持ち）
    const isRotten = cardData.name.includes("腐った") || cardData.name.includes("拾った") || cardData.poison;
    const damage = isRotten ? 40 : 25;

    logMsg(`🤢 【腐敗料理】${cp.name}は${target.name}の口に「${cardData.name}」を無理やりねじ込んだ！`);
    dealDamage(targetId, damage, "腐敗料理", cp.id);
    state.addEventPopup(targetId, "🤢", "食中毒", `${damage}ダメージ`, "damage");

    // 腐った食品の場合は腹痛（2ターンAP-1）を付与
    if (isRotten && target.hp > 0) {
        state.updatePlayer(targetId, p => ({ stomachache: (p.stomachache || 0) + 2 }));
        logMsg(`🤢 さらに猛烈な腹痛が ${target.name} を襲う！（2ターンAP-1）`);
    }
};

// 🛠️ スカベンジャー: ガラクタ工作
export const actionScavenger = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 3) return;
    if (cp.trash < 3 && cp.cans < 10) {
        useGameStore.getState().showToast("素材が足りません");
        return;
    }
    useGameStore.setState({ isScavengerPicking: true });
    logMsg(`🛠️ ガラクタ工作！何を作る？`);
};

export const executeScavenger = (type) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];

    let newHand = [...cp.hand];
    let msg = "";

    if (type === 'equip') {
        if (cp.ap < 3 || cp.trash < 3) return;
        const equipPool = [8, 24, 25, 26, 27, 28, 29, 45, 46];
        const generated = equipPool[Math.floor(Math.random() * equipPool.length)];
        newHand.push(generated);
        // ランダム装備はゴミ3つ消費
        state.updateCurrentPlayer(p => ({ ap: p.ap - 3, trash: p.trash - 3, hand: newHand }));
        msg = `ランダムな装備品`;
    } else if (type === 'junkgun') {
        if (cp.ap < 3 || cp.cans < 10) return;
        newHand.push(48); // 48: ジャンクガン(残3)
        // ジャンクガンは缶10個消費
        state.updateCurrentPlayer(p => ({ ap: p.ap - 3, cans: p.cans - 10, hand: newHand }));
        msg = `ジャンクガン[残3]`;
    }

    useGameStore.setState({ isScavengerPicking: false });
    logMsg(`🛠️ 素材を消費して ${msg} を組み上げた！`);
    state.addEventPopup(cp.id, "🛠️", "工作完了", msg + "を獲得", "good");
};

// ▼ 追加: ジャンクガンの使用フロー
export const setupJunkGun = (handIndex, cardId) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 2) {
        useGameStore.getState().showToast("APが足りません");
        return;
    }
    if (cp.trash < 1) {
        useGameStore.getState().showToast("ゴミがありません");
        return;
    }
    useGameStore.setState({ isJunkGunPicking: true, junkGunData: { handIndex, cardId } });
    logMsg(`🔫 ジャンクガンを構えた！ゴミをいくつ消費して撃つ？`);
};

export const executeJunkGunAim = (consumeTrash, dmg) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const { handIndex, cardId } = state.junkGunData;

    // 武器のエイムUIを呼び出す
    const playerTargets = state.players.filter(op => op.id !== cp.id && op.hp > 0);
    const npcs = [
        { id: 'npc_police', name: 'パトカー', pos: state.policePos, hp: state.policeHp, type: 'npc' },
        { id: 'npc_uncle', name: '厄介なおじさん', pos: state.unclePos, hp: state.uncleHp, type: 'npc' },
        { id: 'npc_yakuza', name: 'ヤクザ', pos: state.yakuzaPos, hp: state.yakuzaHp, type: 'npc' },
        { id: 'npc_loanshark', name: '闇金', pos: state.loansharkPos, hp: state.loansharkHp, type: 'npc' },
        { id: 'npc_friend', name: '仲間のホームレス', pos: state.friendPos, hp: state.friendHp, type: 'npc' }
    ].filter(n => n.hp > 0 && n.pos !== 999);

    useGameStore.setState({
        isJunkGunPicking: false,
        weaponArcData: {
            cardData: { id: cardId, name: 'ジャンクガン', range: 2, dmg: dmg, isSkill: 'junkGun', consumeTrash, handIndex },
            targets: [...playerTargets, ...npcs],
            attacker: cp
        }
    });
};

export const executeJunkGunFire = (targetId, cardData) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];

    if (cp.ap < 2 || cp.trash < cardData.consumeTrash) return;

    // 耐久度（カードID）を減らす処理
    let newHand = [...cp.hand];
    let nextCardId = null;
    let broken = false;
    
    if (cardData.id === 48) nextCardId = 49;
    else if (cardData.id === 49) nextCardId = 50;
    else broken = true;

    if (broken) {
        newHand.splice(cardData.handIndex, 1);
        logMsg(`💥 ジャンクガンは火を噴いて完全に壊れた！`);
    } else {
        newHand[cardData.handIndex] = nextCardId;
    }

    // ゴミとAPを消費
    state.updateCurrentPlayer(p => ({ ap: p.ap - 2, trash: p.trash - cardData.consumeTrash, hand: newHand }));
    
    dealDamage(targetId, cardData.dmg, "ジャンクガン", cp.id);
    logMsg(`🔫 【ジャンクガン】ゴミ${cardData.consumeTrash}個を弾丸にして発射！ ${cardData.dmg}ダメージ！`);
};

// 💴 億万長者: 買収
export const actionBribe = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 2) return;
    useGameStore.setState({ isBribePicking: true });
    logMsg(`💴 買収の準備... ターゲットと買収方法を選んでください。`);
};

export const executeBribe = (targetId, type, pos) => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    const target = state.players.find(p => p.id === targetId);

    if (!target || cp.ap < 2) return;

    let cost = 0;
    let cashback = 0;

    if (type === 'hand') {
        cost = 5;
        if (cp.p < cost || target.hand.length === 0) return;
        // ▼ 10%還元 (5Pの10%で最低1P戻るように計算)
        cashback = Math.ceil(cost * 0.1); 
        
        const stolenCardIndex = Math.floor(Math.random() * target.hand.length);
        const stolenCard = target.hand[stolenCardIndex];
        
        state.updatePlayer(targetId, p => {
            const newHand = [...p.hand];
            newHand.splice(stolenCardIndex, 1);
            return { hand: newHand };
        });
        state.updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p - cost + cashback, hand: [...p.hand, stolenCard] }));
        logMsg(`💴 【買収】5Pを支払い、${target.name}の手札を1枚奪った！（成金10%還元: +${cashback}P）`);
        state.addEventPopup(targetId, "🃏", "買収された", "手札を奪われた", "bad");
        
    } else if (type === 'territory') {
        // ▼ 修正: 陣地は「無料」で譲り受ける（コスト0、還元なし）
        state.updateCurrentPlayer(p => ({ ap: p.ap - 2 }));
        useGameStore.setState(st => ({ territories: { ...st.territories, [pos]: cp.id } }));
        logMsg(`💴 【陣地買収】圧倒的な圧力により、${target.name}の陣地を無料で譲り受けた！`);
        state.addEventPopup(targetId, "🚩", "買収された", "陣地を奪われた", "bad");
        
    } else if (type === 'hire') {
        cost = 10;
        if (cp.p < cost) return;
        // ▼ 10%還元 (10Pの10%で1P戻る)
        cashback = Math.ceil(cost * 0.1); 
        
        state.updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p - cost + cashback }));
        // ▼ 修正: 相手のAPを奪うのではなく、強制的に「次回AP-5」の疲労を与える
        state.updatePlayer(targetId, p => ({ penaltyAP: (p.penaltyAP || 0) + 5 })); 
        logMsg(`💴 【雇用】10Pを支払い、${target.name}を過労させた！（次ターンAP-5）（成金10%還元: +${cashback}P）`);
        state.addEventPopup(targetId, "💼", "買収された", "次回AP-5", "bad");
    }
};

// 👼 路上の神様: 神託
export const actionOracle = () => {
    const state = useGameStore.getState();
    const cp = state.players[state.turn];
    if (cp.ap < 3) return;

    state.updateCurrentPlayer(p => ({ ap: p.ap - 3 }));
    state.players.forEach(p => {
        if (p.id !== cp.id && p.hp > 0) {
            // ▼ 修正: フラグ名を oracleBuff に統一し、ボーナスAPを付与
            state.updatePlayer(p.id, prev => ({ oracleBuff: true, bonusAP: (prev.bonusAP || 0) + 2 }));
            state.addEventPopup(p.id, "👼", "神の導き", "次ダイス+2", "good");
        }
    });
    logMsg(`👼 【神託】自分以外の全員に「神の導き（次ダイス+2）」を与えた！`);
    // ▼ 修正: ログの送金額表示を 所持Pの10% に変更
    logMsg(`（※導きを受けたプレイヤーは、ターン終了時に自身の所持Pの10%を神様へ強制送金します）`);
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