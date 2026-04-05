import { useGameStore } from '../store/useGameStore';
import { useUserStore } from '../store/useUserStore'; // ▼ 追加
import { dealDamage } from './combat';
import { logMsg } from './actions';
import { playSfx } from '../utils/audio';

export const checkNpcCollision = (playerId) => {
    const state = useGameStore.getState();
    const p = state.players.find(x => x.id === playerId);
    if (!p || p.hp <= 0 || p.respawnShield > 0) return;

    if (p.pos === state.policePos) {
        // ▼ 追加: NPC遭遇スタッツの更新
        if (!p.isCPU) useUserStore.getState().incrementNpcEncounter('police');
        
        if (p.equip?.doll) { state.updatePlayer(p.id, prev => ({ equip: {...prev.equip, doll: false} })); logMsg(`🎎 身代わり人形でパトカー回避！`); }
        else if (p.stealth) { state.updatePlayer(p.id, { stealth: false }); logMsg(`💨 ステルスでパトカー回避！`); }
        else if (p.hasID) { state.updatePlayer(p.id, { hasID: false }); logMsg(`🔵 身分証でパトカー回避！`); }
        else if (p.charType === "survivor") { logMsg(`🌿 サバイバーの勘で回避！`); }
        else {
            state.updatePlayer(p.id, { penaltyAP: (p.penaltyAP || 0) + 2 });
            logMsg(`<span style="color:#e74c3c">🚓 パトカーに補導！次回AP-2！</span>`); playSfx('fail');
            state.addEventPopup(p.id, "🚓", "パトカー補導", "次回AP-2", "bad");
            useGameStore.setState({ policePos: 999, policeCd: 2 });
        }
    }
    
    if (p.pos === state.unclePos) {
        if (!p.isCPU) useUserStore.getState().incrementNpcEncounter('uncle');
        
        if (p.hand.length > 0) {
            state.updatePlayer(p.id, prev => {
                const newHand = [...prev.hand];
                newHand.splice(Math.floor(Math.random() * newHand.length), 1);
                return { hand: newHand };
            });
            logMsg(`<span style="color:#e74c3c">🧓 厄介なおじさんに絡まれた！手札をランダムに1枚破棄！</span>`); 
            state.addEventPopup(p.id, "🧓", "厄介なおじさん", "カード破棄", "bad");
        } else {
            logMsg(`🧓 厄介なおじさんに絡まれたが、破棄するカードがなかった。`);
        }
        playSfx('fail');
        useGameStore.setState({ unclePos: 999, uncleCd: 2 });
    }
    
    if (p.pos === state.yakuzaPos) {
        if (!p.isCPU) useUserStore.getState().incrementNpcEncounter('yakuza');
        
        if (p.equip?.doll) { state.updatePlayer(p.id, prev => ({ equip: {...prev.equip, doll: false} })); logMsg(`🎎 身代わり人形でヤクザ回避！`); }
        else {
            const dmg = 15 + Math.floor(Math.random() * 6);
            dealDamage(p.id, dmg, "ヤクザ");
            if (p.hand.length > 0) {
                state.updatePlayer(p.id, prev => { const newHand = [...prev.hand]; newHand.splice(Math.floor(Math.random() * newHand.length), 1); return { hand: newHand }; });
                logMsg(`😎 ヤクザ！${dmg}ダメージ＆カード強奪！`); state.addEventPopup(p.id, "😎", "ヤクザ", "強奪", "bad");
            } else {
                logMsg(`😎 ヤクザ！${dmg}ダメージ！`); state.addEventPopup(p.id, "😎", "ヤクザ", `${dmg}ダメ`, "bad");
            }
            useGameStore.setState({ yakuzaPos: 999, yakuzaCd: 2 });
        }
    }
    
    if (p.pos === state.loansharkPos) {
        if (!p.isCPU) useUserStore.getState().incrementNpcEncounter('loanshark');
        
        if (p.equip?.doll) { state.updatePlayer(p.id, prev => ({ equip: {...prev.equip, doll: false} })); logMsg(`🎎 身代わり人形で闇金回避！`); }
        else {
            const lostP = Math.min(20, Math.floor(p.p * 0.2));
            state.updatePlayer(p.id, { p: p.p - lostP });
            logMsg(`<span style="color:#e74c3c">💀 闇金に遭遇！${lostP}P没収！</span>`); playSfx('fail');
            state.addEventPopup(p.id, "💀", "闇金", `-${lostP}P没収`, "bad");
            useGameStore.setState({ loansharkPos: 999, loansharkCd: 2 });
        }
    }
    
    if (p.pos === state.friendPos) {
        if (!p.isCPU) useUserStore.getState().incrementNpcEncounter('friend');
        
        state.updatePlayer(p.id, { cans: p.cans + 1 });
        logMsg(`🤝 仲間のホームレスから空き缶をもらった！`); playSfx('coin');
        state.addEventPopup(p.id, "🤝", "仲間", "缶ゲット！", "good");
        useGameStore.setState({ friendPos: 999, friendCd: 2 });
    }
};