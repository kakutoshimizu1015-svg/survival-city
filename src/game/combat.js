import { useGameStore } from '../store/useGameStore';
import { logMsg } from './actions';

export const dealDamage = (targetId, dmg, sourceName, attackerId = null) => {
    const state = useGameStore.getState();
    const target = state.players.find(p => p.id === targetId);
    if (!target || target.hp <= 0) return;

    let actualDmg = dmg;
    let targetUpdate = {};

    // 装備によるダメージ軽減
    if (target.equip?.helmet) {
        targetUpdate.equip = { ...target.equip, helmet: false };
        actualDmg = Math.floor(actualDmg / 2);
        logMsg(`🪖 ${target.name}のヘルメットがダメージを半減！`);
    }

    let newHp = target.hp - actualDmg;
    let dropP = Math.min(Math.floor(actualDmg / 5), Math.max(0, target.p));
    let newP = target.p - dropP;

    logMsg(`💥 <span style="color:#e74c3c">${target.name}に${actualDmg}ダメージ！</span> ${dropP > 0 ? `${dropP}P落とした！` : ''}`);

    // 死亡判定
    if (newHp <= 0) {
        newHp = 100; // 復活
        let lostP = Math.min(15, Math.max(0, Math.floor(newP / 3)));
        newP -= lostP;
        
        targetUpdate.pos = 0; // 病院マス（ID:0）へ転送
        targetUpdate.ap = 0;
        targetUpdate.deaths = (target.deaths || 0) + 1;
        targetUpdate.cans = 0;
        targetUpdate.trash = 0;
        logMsg(`☠️ ${target.name}が死亡！最大15P没収され、病院に搬送...`);

        if (attackerId !== null) {
            state.updatePlayer(attackerId, p => ({ kills: (p.kills || 0) + 1 }));
        }
    }

    // お金を奪う（落としたお金を攻撃者が拾う）
    if (attackerId !== null && dropP > 0) {
        state.updatePlayer(attackerId, p => ({ p: p.p + dropP }));
        logMsg(`💰 攻撃者が${dropP}Pを奪った！`);
    }

    targetUpdate.hp = newHp;
    targetUpdate.p = newP;
    state.updatePlayer(targetId, () => targetUpdate);
};