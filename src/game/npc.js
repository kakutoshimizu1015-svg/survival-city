import { useGameStore } from '../store/useGameStore';
import { dealDamage } from './combat';
import { logMsg } from './actions';
import { playSfx } from '../utils/audio';

export const checkNpcCollision = (playerId) => {
    const state = useGameStore.getState();
    const p = state.players.find(x => x.id === playerId);
    if (!p || p.hp <= 0 || p.respawnShield > 0) return;

    if (p.pos === state.policePos) {
        if (p.equip?.doll) { state.updatePlayer(p.id, prev => ({ equip: {...prev.equip, doll: false} })); logMsg(`🎎 身代わり人形で警察回避！`); }
        else if (p.stealth) { state.updatePlayer(p.id, { stealth: false }); logMsg(`💨 ステルスで警察回避！`); }
        else if (p.hasID) { state.updatePlayer(p.id, { hasID: false }); logMsg(`🔵 身分証で警察回避！`); }
        else if (p.charType === "survivor") { logMsg(`🌿 サバイバーの勘で回避！`); }
        else {
            // ▼ cannotMove: true を追加し、確実に行動を封じる
            state.updatePlayer(p.id, { penaltyAP: (p.penaltyAP || 0) + 2, ap: 0, cannotMove: true });
            logMsg(`<span style="color:#e74c3c">🚓 警察に補導！次回AP-2、行動終了！</span>`); playSfx('fail');
            state.addEventPopup(p.id, "🚓", "警察に補導", "次回AP-2", "bad");
        }
    }
    if (p.pos === state.unclePos) {
        state.updatePlayer(p.id, prev => ({ ap: 0, cannotMove: true, hand: prev.hand.slice(0, -1) }));
        logMsg(`<span style="color:#e74c3c">🧓 厄介なおじさん！カード破棄＆ターン終了！</span>`); playSfx('fail');
        state.addEventPopup(p.id, "🧓", "厄介なおじさん", "カード破棄＆行動終了", "bad");
    }
    if (p.pos === state.yakuzaPos) {
        if (p.equip?.doll) { state.updatePlayer(p.id, prev => ({ equip: {...prev.equip, doll: false} })); logMsg(`🎎 身代わり人形でヤクザ回避！`); }
        else {
            dealDamage(p.id, 30, "ヤクザ");
            if (p.hand.length > 0) {
                state.updatePlayer(p.id, prev => { const newHand = [...prev.hand]; newHand.splice(Math.floor(Math.random() * newHand.length), 1); return { hand: newHand }; });
                logMsg(`😎 ヤクザにカードを強奪された！`); state.addEventPopup(p.id, "😎", "ヤクザ", "カード強奪", "bad");
            }
        }
    }
    if (p.pos === state.loansharkPos) {
        if (p.equip?.doll) { state.updatePlayer(p.id, prev => ({ equip: {...prev.equip, doll: false} })); logMsg(`🎎 身代わり人形で闇金回避！`); }
        else {
            const lostP = Math.min(10, Math.max(0, p.p));
            state.updatePlayer(p.id, { p: p.p - lostP });
            logMsg(`<span style="color:#e74c3c">💀 闇金に遭遇！${lostP}P没収！</span>`); playSfx('fail');
            state.addEventPopup(p.id, "💀", "闇金", `-${lostP}P没収`, "bad");
        }
    }
    if (p.pos === state.friendPos) {
        state.updatePlayer(p.id, { cans: p.cans + 1 });
        logMsg(`🤝 仲間のホームレスから空き缶をもらった！`); playSfx('coin');
        state.addEventPopup(p.id, "🤝", "仲間", "缶ゲット！", "good");
    }
};