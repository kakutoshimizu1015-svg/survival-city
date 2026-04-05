import { useGameStore } from '../store/useGameStore';
import { useUserStore } from '../store/useUserStore'; // ▼ 追加
import { deckData } from '../constants/cards';
import { logMsg } from './actions';

export const actionUseCard = (handIndex, cardId) => {
    const state = useGameStore.getState();
    const { turn, players, territories, mapData } = state;
    const cp = players[turn];
    const cardData = deckData.find(c => c.id === cardId);

    if (!cardData) return;

    const apCost = cardData.type === 'weapon' ? 2 : 0;
    if (cp.ap < apCost) { logMsg("⚡ APが足りません！"); return; }

    // 手札から削除しAP消費
    const newHand = [...cp.hand];
    newHand.splice(handIndex, 1);
    state.updateCurrentPlayer(p => ({ ap: p.ap - apCost, hand: newHand }));

    logMsg(`🎴 「${cardData.name}」を使用！`);
    
    // ▼ 追加: 使ったカード数のスタッツ更新
    if (!cp.isCPU) {
        useUserStore.getState().incrementStat('totalCardsUsed', 1);
    }

    // 武器は別UIで処理
    if (cardData.type === 'weapon') {
        const targets = players.filter(op => op.id !== cp.id && op.hp > 0);
        useGameStore.setState({ weaponArcData: { cardData, targets, attacker: cp } });
        return;
    }

    // --- 各カードの固有効果 ---
    switch (cardId) {
        case 0: state.updateCurrentPlayer(p => ({ stealth: true })); logMsg(`🔵 ステルス発動！次の敵をやり過ごす`); break;
        case 1: state.updateCurrentPlayer(p => ({ rainGear: true })); logMsg(`🌂 雨具装備！次の雨ペナルティを無効化`); break;
        case 2: state.updateCurrentPlayer(p => ({ hasID: true, p: p.p + 1 })); logMsg(`🪪 身分証！+1P＆次の警察回避`); break;
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
                state.updateCurrentPlayer(p => ({ p: p.p + stolen }));
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
        case 6: state.updateCurrentPlayer(p => ({ p: p.p + 5, bonusAP: (p.bonusAP || 0) + 2 })); logMsg(`🤝 支援面談！+5P＆次回AP+2！`); break;
        case 7: state.updateCurrentPlayer(p => ({ p: p.p + 3 })); logMsg(`🍲 炊き出し！+3P！`); break;
        case 8: state.updateCurrentPlayer(p => ({ maxHand: p.maxHand + 2, equip: {...p.equip, backpack: true} })); logMsg(`🎒 リュック装備！手札上限+2`); break;
        case 9:
            if(Math.random() > 0.5) { state.updateCurrentPlayer(p => ({ p: p.p + 3 })); logMsg(`🔮 運勢良し！+3P`); }
            else { state.updateCurrentPlayer(p => ({ p: Math.max(0, p.p - 3) })); logMsg(`🔮 凶...-3P`); }
            break;
        case 10: state.updateCurrentPlayer(p => ({ p: p.p + 2 })); logMsg(`🐱 野良猫の導き！+2P`); break;
        case 11:
            if(Math.random() > 0.5) { state.updateCurrentPlayer(p => ({ p: p.p + 6 })); logMsg(`💼 密かなバイト成功！+6P`); }
            else { state.updateCurrentPlayer(p => ({ p: Math.max(0, p.p - 3) })); logMsg(`💼 密かなバイト失敗... -3P`); }
            break;
        case 12:
            players.forEach(op => {
                if(op.id === cp.id) return;
                if(op.reaction === 'reflect') {
                    state.updatePlayer(op.id, p => ({ reaction: null }));
                    state.updateCurrentPlayer(p => ({ p: Math.floor(p.p / 2) }));
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
                    state.updateCurrentPlayer(p => ({ p: Math.max(0, p.p - 10) }));
                    logMsg(`🤝 ${top.name}の裏取引で下剋上を反射され10P失った！`);
                } else {
                    const steal = Math.min(15, Math.floor((top.p - cp.p) * 0.3));
                    state.updatePlayer(top.id, p => ({ p: p.p - steal }));
                    state.updateCurrentPlayer(p => ({ p: p.p + steal }));
                    logMsg(`🔥 下剋上！${top.name}から${steal}P奪取！`);
                }
            } else { logMsg(`🔥 自分がトップなので何も起きない...`); }
            break;
        case 14:
            if(Math.random() < 0.1) { state.updateCurrentPlayer(p => ({ p: p.p + 15 })); logMsg(`🎉 宝くじ当選！+15P！`); }
            else { logMsg(`📄 宝くじハズレ...`); }
            break;
        case 15: state.updateCurrentPlayer(p => ({ ap: p.ap + 5 })); logMsg(`⚡ エナドリ！即座にAP+5`); break;
        case 16: state.updateCurrentPlayer(p => ({ bonusAP: (p.bonusAP || 0) + 5 })); logMsg(`🛹 スケボー！次回ダイスAP+5`); break;
        case 24: state.updateCurrentPlayer(p => ({ equip: {...p.equip, bicycle: true}, equipTimer: {...(p.equipTimer||{}), bicycle: 5} })); logMsg(`🚲 自転車装備！5ターンAP+2`); break;
        case 25: state.updateCurrentPlayer(p => ({ equip: {...p.equip, shoes: true} })); logMsg(`👢 安全靴装備！ゴミ漁りが1APに`); break;
        case 26: state.updateCurrentPlayer(p => ({ equip: {...p.equip, cart: true}, equipTimer: {...(p.equipTimer||{}), cart: 5} })); logMsg(`🛒 リヤカー装備！5ターン陣地収入2倍`); break;
        case 27: state.updateCurrentPlayer(p => ({ equip: {...p.equip, shield: true} })); logMsg(`🛡️ 段ボールの盾装備！50%でダメージ半減`); break;
        case 28: state.updateCurrentPlayer(p => ({ equip: {...p.equip, helmet: true} })); logMsg(`🪖 ヘルメット装備！次のダメージ確実半減`); break;
        case 29: state.updateCurrentPlayer(p => ({ equip: {...p.equip, doll: true} })); logMsg(`🎎 身代わり人形装備！NPC妨害を1回無効`); break;
        case 35: state.updateCurrentPlayer(p => ({ reaction: 'block' })); logMsg(`⚖️ 弁護士の盾！次の攻撃/カツアゲを無効化`); break;
        case 36: state.updateCurrentPlayer(p => ({ reaction: 'reflect' })); logMsg(`🤝 裏取引！次の大暴落/下剋上を反射`); break;
        case 37: state.updateCurrentPlayer(p => ({ reaction: 'counter' })); logMsg(`🔄 反撃の一撃！次のダメージを相手に返す`); break;
        default:
            if (cardData.type === 'heal') {
                if (cardData.risk > 0 && Math.random() < 0.5) {
                    state.updateCurrentPlayer(p => ({ hp: Math.max(1, p.hp - cardData.risk) }));
                    logMsg(`🤢 ${cardData.name}...食中毒！${cardData.risk}ダメージ！`);
                } else {
                    state.updateCurrentPlayer(p => ({ hp: Math.min(100, p.hp + cardData.heal), ap: p.ap + (cardData.apBonus || 0) }));
                    logMsg(`💊 ${cardData.name}でHP+${cardData.heal}回復！`);
                }
            }
            break;
    }
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

    // 手札の末尾に戻し、消費したAP(2)を回復
    state.updateCurrentPlayer(p => ({
        ap: p.ap + 2,
        hand: [...p.hand, cardId]
    }));
    useGameStore.setState({ weaponArcData: null });
    logMsg(`🔙 武器の使用をキャンセルしました`);
};