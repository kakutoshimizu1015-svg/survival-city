import { useGameStore } from '../store/useGameStore';
import { useUserStore } from '../store/useUserStore';
import { deckData } from '../constants/cards';
import { logMsg } from './actions';

export const actionUseCard = (handIndex, cardId) => {
    const state = useGameStore.getState();
    const { turn, players, territories, mapData } = state;
    const cp = players[turn];
    const cardData = deckData.find(c => c.id === cardId);

    if (!cardData) return;

    let apCost = cardData.type === 'weapon' ? 2 : 0;
    if ([3, 4, 13].includes(cardId)) apCost = 1; // 通報(3), 缶泥棒(4), 下剋上(13)を1APに変更

    if (cp.ap < apCost) { logMsg("⚡ APが足りません！"); return; }

    // ▼ 使用条件の事前チェック（大暴落・下剋上）
    const alivePlayers = players.filter(p => p.hp > 0);
    const isLowestP = alivePlayers.every(p => cp.p <= p.p);
    
    if (cardId === 12) {
        if (!isLowestP) { logMsg("❌ 大暴落は所持Pが最下位の時のみ使用可能です！"); return; }
    }
    if (cardId === 13) {
        const topPlayer = alivePlayers.reduce((a, b) => a.p > b.p ? a : b, alivePlayers[0]);
        if (!isLowestP || (topPlayer.p - cp.p) < 30) {
            logMsg("❌ 下剋上は最下位かつ、1位との差が30P以上ないと使えません！"); return;
        }
    }

    const newHand = [...cp.hand];
    newHand.splice(handIndex, 1);
    
    let playerUpdates = {
        ap: cp.ap - apCost,
        hand: newHand
    };

    if (cardId === 12) {
        playerUpdates.hp = Math.ceil(cp.hp / 2); // 大暴落はHP半減コスト
        logMsg(`🩸 大暴落の代償としてHPを半分消費した！`);
    }

    logMsg(`🎴 「${cardData.name}」を使用！`);
    
    state.incrementGameStat(cp.id, 'cards', 1);
    if (!cp.isCPU) {
        useUserStore.getState().incrementStat('totalCardsUsed', 1);
    }

    if (cardData.type === 'weapon') {
        const playerTargets = players.filter(op => op.id !== cp.id && op.hp > 0);
        
        const npcs = [
            { id: 'npc_police', name: 'パトカー', pos: state.policePos, hp: state.policeHp, type: 'npc' },
            { id: 'npc_uncle', name: '厄介なおじさん', pos: state.unclePos, hp: state.uncleHp, type: 'npc' },
            { id: 'npc_yakuza', name: 'ヤクザ', pos: state.yakuzaPos, hp: state.yakuzaHp, type: 'npc' },
            { id: 'npc_loanshark', name: '闇金', pos: state.loansharkPos, hp: state.loansharkHp, type: 'npc' },
            { id: 'npc_friend', name: '仲間のホームレス', pos: state.friendPos, hp: state.friendHp, type: 'npc' }
        ].filter(n => n.hp > 0 && n.pos !== 999);

        const targets = [...playerTargets, ...npcs];
        // ▼ 修正: 武器の場合はここで更新内容を適用して終了
        state.updateCurrentPlayer(playerUpdates);
        useGameStore.setState({ weaponArcData: { cardData, targets, attacker: cp } });
        return;
    }

    // ▼ 修正: 各カードの効果を `playerUpdates` オブジェクトにマージしていく
    switch (cardId) {
        case 0: playerUpdates.stealth = true; logMsg(`🔵 ステルス発動！次の敵をやり過ごす`); break;
        case 1: playerUpdates.rainGear = true; logMsg(`🌂 雨具装備！次の雨ペナルティを無効化`); break;
        case 2: playerUpdates.hasID = true; playerUpdates.p = cp.p + 1; logMsg(`🪪 身分証！+1P＆次の警察回避`); break;
        case 3: 
            const others1 = players.filter(t => t.id !== cp.id);
            if(others1.length > 0) {
                const tgt = others1[Math.floor(Math.random() * others1.length)];
                state.updatePlayer(tgt.id, p => ({ penaltyAP: (p.penaltyAP || 0) + 2 }));
                logMsg(`📢 通報！${tgt.name}に次回AP-2ペナルティ！`);
            }
            break;
        case 4:
            const others2 = players.filter(t => t.id !== cp.id && t.p > 0);
            if(others2.length > 0) {
                const tgt = others2[Math.floor(Math.random() * others2.length)];
                const stolen = Math.min(2, tgt.p);
                state.updatePlayer(tgt.id, p => ({ p: p.p - stolen }));
                playerUpdates.p = cp.p + stolen;
                logMsg(`🤑 缶泥棒！${tgt.name}から${stolen}P奪取！`);
            }
            break;
        case 5:
            const dice = Math.floor(Math.random() * 6) + 1;
            if (dice >= 4) {
                const enemyTerritories = Object.keys(territories).filter(k => territories[k] !== cp.id);
                if (enemyTerritories.length > 0) {
                    if (cp.isCPU) {
                        const targetT = enemyTerritories[Math.floor(Math.random() * enemyTerritories.length)];
                        useGameStore.setState({ territories: { ...territories, [targetT]: cp.id } });
                        logMsg(`🚩 領土挑戦(出目${dice})成功！ランダムな敵陣地を1つ奪った！`);
                    } else {
                        logMsg(`🚩 領土挑戦(出目${dice})成功！奪う陣地を選んでください。`);
                        useGameStore.setState({ territorySelectOptions: enemyTerritories });
                    }
                } else { logMsg(`🚩 奪える領土がありませんでした`); }
            } else { logMsg(`🚩 領土挑戦(出目${dice})失敗...`); }
            break;
        case 6: playerUpdates.p = cp.p + 5; playerUpdates.bonusAP = (cp.bonusAP || 0) + 2; logMsg(`🤝 支援面談！+5P＆次回AP+2！`); break;
        case 7: playerUpdates.p = cp.p + 3; logMsg(`🍲 炊き出し！+3P！`); break;
        case 8: playerUpdates.maxHand = cp.maxHand + 2; playerUpdates.equip = {...cp.equip, backpack: true}; logMsg(`🎒 リュック装備！手札上限+2`); break;
        case 9:
            if(Math.random() > 0.5) { playerUpdates.p = cp.p + 3; logMsg(`🔮 運勢良し！+3P`); }
            else { playerUpdates.p = Math.max(0, cp.p - 3); logMsg(`🔮 凶...-3P`); }
            break;
        case 10: playerUpdates.p = cp.p + 2; logMsg(`🐱 野良猫の導き！+2P`); break;
        case 11:
            if(Math.random() > 0.5) { playerUpdates.p = cp.p + 6; logMsg(`💼 密かなバイト成功！+6P`); }
            else { playerUpdates.p = Math.max(0, cp.p - 3); logMsg(`💼 密かなバイト失敗... -3P`); }
            break;
        case 12:
            players.forEach(op => {
                if(op.id === cp.id) return;
                if(op.reaction === 'reflect') {
                    state.updatePlayer(op.id, p => ({ reaction: null }));
                    playerUpdates.p = Math.floor(cp.p / 2);
                    logMsg(`🤝 ${op.name}の裏取引で大暴落を反射された！`);
                } else {
                    state.updatePlayer(op.id, p => ({ p: Math.floor(p.p / 2) }));
                }
            });
            logMsg(`📉 大暴落発動！他プレイヤーのPが半分に！`);
            break;
        case 13:
            const richer = players.filter(op => op.id !== cp.id && op.p > cp.p);
            if(richer.length > 0) {
                const top = richer.reduce((a,b) => a.p > b.p ? a : b);
                if (top.reaction === 'reflect') {
                    state.updatePlayer(top.id, p => ({ reaction: null }));
                    playerUpdates.p = Math.max(0, cp.p - 10);
                    logMsg(`🤝 ${top.name}の裏取引で下剋上を反射され10P失った！`);
                } else {
                    const steal = Math.min(15, Math.floor((top.p - cp.p) * 0.3));
                    state.updatePlayer(top.id, p => ({ p: p.p - steal }));
                    playerUpdates.p = cp.p + steal;
                    logMsg(`🔥 下剋上！${top.name}から${steal}P奪取！`);
                }
            } else { logMsg(`🔥 自分がトップなので何も起きない...`); }
            break;
        case 14:
            if(Math.random() < 0.1) { playerUpdates.p = cp.p + 15; logMsg(`🎉 宝くじ当選！+15P！`); }
            else { logMsg(`📄 宝くじハズレ...`); }
            break;
        case 15: playerUpdates.ap = playerUpdates.ap + 5; logMsg(`⚡ エナドリ！即座にAP+5`); break;
        case 16: playerUpdates.bonusAP = (cp.bonusAP || 0) + 5; logMsg(`🛹 スケボー！次回ダイスAP+5`); break;
        case 24: playerUpdates.equip = {...cp.equip, bicycle: true}; playerUpdates.equipTimer = {...(cp.equipTimer||{}), bicycle: 5}; logMsg(`🚲 自転車装備！5ターンAP+2`); break;
        case 25: playerUpdates.equip = {...cp.equip, shoes: true}; logMsg(`👢 安全靴装備！ゴミ漁りが1APに`); break;
        case 26: playerUpdates.equip = {...cp.equip, cart: true}; playerUpdates.equipTimer = {...(cp.equipTimer||{}), cart: 5}; logMsg(`🛒 リヤカー装備！5ターン陣地収入2倍`); break;
        case 27: playerUpdates.equip = {...cp.equip, shield: true}; logMsg(`🛡️ 段ボールの盾装備！50%でダメージ半減`); break;
        case 28: playerUpdates.equip = {...cp.equip, helmet: true}; logMsg(`🪖 ヘルメット装備！次のダメージ確実半減`); break;
        case 29: playerUpdates.equip = {...cp.equip, doll: true}; logMsg(`🎎 身代わり人形装備！NPC妨害を1回無効`); break;
        case 35: playerUpdates.reaction = 'block'; logMsg(`⚖️ 弁護士の盾！次の攻撃/カツアゲを無効化`); break;
        case 36: playerUpdates.reaction = 'reflect'; logMsg(`🤝 裏取引！次の大暴落/下剋上を反射`); break;
        case 37: playerUpdates.reaction = 'counter'; logMsg(`🔄 反撃の一撃！次のダメージを相手に返す`); break;
        default:
            if (cardData.type === 'heal') {
                if (cardData.risk > 0 && Math.random() < 0.5) {
                    playerUpdates.hp = Math.max(1, cp.hp - cardData.risk);
                    logMsg(`🤢 ${cardData.name}...食中毒！${cardData.risk}ダメージ！`);
                } else {
                    playerUpdates.hp = Math.min(100, cp.hp + cardData.heal);
                    playerUpdates.ap = playerUpdates.ap + (cardData.apBonus || 0);
                    logMsg(`💊 ${cardData.name}でHP+${cardData.heal}回復！`);
                }
            }
            break;
    }

    // ▼ 修正: 最後に1回だけ状態を更新する（アトミックな更新）
    state.updateCurrentPlayer(playerUpdates);
};

export const actionDiscardCard = (handIndex) => {
    const state = useGameStore.getState();
    const newHand = [...state.players[state.turn].hand];
    newHand.splice(handIndex, 1);
    state.updateCurrentPlayer(() => ({ hand: newHand }));
    logMsg(`🗑️ カードを捨てました。`);
};

export const actionCancelWeapon = (cardId) => {
    const state = useGameStore.getState();
    const cardData = deckData.find(c => c.id === cardId);
    if (!cardData || cardData.type !== 'weapon') return;

    state.updateCurrentPlayer(p => ({
        ap: p.ap + 2,
        hand: [...p.hand, cardId]
    }));
    useGameStore.setState({ weaponArcData: null });
    logMsg(`🔙 武器の使用をキャンセルしました`);
};