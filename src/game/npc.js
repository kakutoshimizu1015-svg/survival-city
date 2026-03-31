import { useGameStore } from '../store/useGameStore';
import { logMsg } from './actions';
import { dealDamage } from './combat';

// ラウンド終了時のNPC移動（変更なし）
export const moveNPCs = async () => {
    const state = useGameStore.getState();
    const { mapData, players, policePos, truckPos } = state;

    if (!mapData || mapData.length === 0) return;

    const policeTile = mapData.find(t => t.id === policePos) || mapData[10] || mapData[0];
    const nextPolicePos = policeTile.next[Math.floor(Math.random() * policeTile.next.length)];
    const nextTruckPos = (truckPos + 2) % mapData.length;

    useGameStore.setState({ policePos: nextPolicePos, truckPos: nextTruckPos });

    players.forEach(p => {
        if (p.pos === nextPolicePos) {
            logMsg(`🚓 ${p.name}は職務質問を受けた！`);
            useGameStore.getState().updatePlayer(p.id, prev => ({ p: Math.floor(prev.p * 0.8) }));
        }
        if (p.pos === nextTruckPos) {
            logMsg(`🚚 ${p.name}はゴミ収集車に接触！`);
            dealDamage(p.id, 40, "ゴミ収集車");
        }
    });
};

// ▼ 新規追加：プレイヤー移動時のNPC接触判定
export const checkNpcCollision = (playerId) => {
    const state = useGameStore.getState();
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.hp <= 0) return;

    // 🚓 警察
    if (player.pos === state.policePos) {
        if (player.equip?.doll) {
            state.updatePlayer(player.id, p => ({ equip: { ...p.equip, doll: false } }));
            logMsg(`🎎 身代わり人形が警察を防いだ！`);
        } else if (player.stealth) {
            state.updatePlayer(player.id, p => ({ stealth: false }));
            logMsg(`💨 ステルスで警察回避！`);
        } else if (player.hasID) {
            state.updatePlayer(player.id, p => ({ hasID: false }));
            logMsg(`🔵 身分証で警察回避！`);
        } else if (player.charType === "survivor") {
            logMsg(`🌿 サバイバーの勘で回避！`);
        } else {
            state.updatePlayer(player.id, p => ({ ap: 0 }));
            logMsg(`<span style="color:#e74c3c">🚓 警察に補導！このターンの行動終了！</span>`);
        }
    }
    // 🧓 厄介なおじさん
    if (player.pos === state.unclePos) {
        let newHand = [...player.hand];
        if (newHand.length > 0) newHand.pop();
        state.updatePlayer(player.id, p => ({ ap: 0, hand: newHand }));
        logMsg(`<span style="color:#e74c3c">🧓 厄介なおじさん！カード1枚破棄＆ターン終了！</span>`);
    }
    // 😎 ヤクザ
    if (player.pos === state.yakuzaPos) {
        if (player.equip?.doll) {
            state.updatePlayer(player.id, p => ({ equip: { ...p.equip, doll: false } }));
            logMsg(`🎎 身代わり人形がヤクザを防いだ！`);
        } else {
            dealDamage(player.id, 30, "ヤクザ");
            let newHand = [...player.hand];
            if (newHand.length > 0) {
                newHand.splice(Math.floor(Math.random() * newHand.length), 1);
                state.updatePlayer(player.id, p => ({ hand: newHand }));
                logMsg(`😎 ヤクザにカード1枚を強奪された！`);
            }
        }
    }
    // 💀 闇金
    if (player.pos === state.loansharkPos) {
        if (player.equip?.doll) {
            state.updatePlayer(player.id, p => ({ equip: { ...p.equip, doll: false } }));
            logMsg(`🎎 身代わり人形が闇金を防いだ！`);
        } else {
            const lostP = Math.min(10, Math.max(0, player.p));
            state.updatePlayer(player.id, p => ({ p: p.p - lostP }));
            logMsg(`<span style="color:#e74c3c">💀 闇金に遭遇！${lostP}P没収！</span>`);
        }
    }
    // 🤝 仲間
    if (player.pos === state.friendPos) {
        state.updatePlayer(player.id, p => ({ cans: p.cans + 1 }));
        logMsg(`🤝 仲間のホームレスから空き缶を1つもらった！`);
    }
};