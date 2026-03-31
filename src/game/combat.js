import { useGameStore } from '../store/useGameStore';
import { logMsg } from './actions';
import { playSfx } from '../utils/audio';

const isSameTeam = (p1, p2) => {
    if (!p1 || !p2 || p1.id === p2.id) return false;
    return p1.teamColor !== 'none' && p1.teamColor === p2.teamColor;
};

export const getDistance = (posA, posB, mapData) => {
    if (posA === posB) return 0;
    let visited = new Set([posA]);
    let queue = [{ id: posA, dist: 0 }];
    while (queue.length > 0) {
        let current = queue.shift();
        let tile = mapData.find(t => t.id === current.id);
        if (!tile) continue;
        for (let nextId of tile.next) {
            if (nextId === posB) return current.dist + 1;
            if (!visited.has(nextId)) { visited.add(nextId); queue.push({ id: nextId, dist: current.dist + 1 }); }
        }
    }
    return 999;
};

export const dealDamage = (targetId, dmg, source, attackerId = null) => {
    const state = useGameStore.getState();
    const target = state.players.find(p => p.id === targetId);
    const attacker = attackerId !== null ? state.players.find(p => p.id === attackerId) : null;
    
    if (!target || target.hp <= 0) return 0;

    if (attacker && isSameTeam(attacker, target)) { logMsg(`🤝 ${target.name}はチームメイトなのでダメージ無効！`); return 0; }
    if (target.respawnShield > 0) { logMsg(`🛡️ ${target.name}は復活無敵中！ダメージ無効`); return 0; }
    
    if (target.reaction === 'block') {
        state.updatePlayer(targetId, { reaction: null });
        logMsg(`⚖️ 弁護士の盾がダメージを無効化！`); playSfx('success');
        state.addEventPopup(targetId, "⚖️", "弁護士の盾", "ダメージ無効", "good"); return 0;
    }
    if (target.reaction === 'counter' && attacker) {
        state.updatePlayer(targetId, { reaction: null });
        logMsg(`🔄 反撃！${attacker.name}に${dmg}ダメージ！`); playSfx('hit');
        state.addEventPopup(targetId, "🔄", "反撃発動", `${attacker.name}に${dmg}ダメ`, "good");
        dealDamage(attackerId, dmg, "反撃"); return 0;
    }
    
    let actualDmg = dmg;
    if (target.equip?.helmet) {
        state.updatePlayer(targetId, p => ({ equip: { ...p.equip, helmet: false } }));
        actualDmg = Math.floor(actualDmg / 2); logMsg(`🪖 ヘルメットでダメージ半減！`); playSfx('success');
    }
    if (target.equip?.shield) {
        state.updatePlayer(targetId, p => ({ equip: { ...p.equip, shield: false } }));
        if (Math.random() < 0.5) { actualDmg = Math.floor(actualDmg / 2); logMsg(`🛡️ 段ボールの盾でダメージ半減！`); playSfx('hit'); }
        else { logMsg(`🛡️ 段ボールの盾が壊れた...`); playSfx('hit'); }
    }

    let newHp = target.hp - actualDmg;
    let dropP = Math.min(Math.floor(actualDmg / 5), Math.max(0, target.p));
    let newP = target.p - dropP;

    logMsg(`<span style="color:#e74c3c">💥 ${target.name}に${actualDmg}ダメージ！${dropP > 0 ? dropP+'P落とした' : ''}</span>`);
    playSfx('hit');
    state.addEventPopup(targetId, "💥", `${actualDmg}ダメージ`, dropP > 0 ? `${dropP}P落とした` : "", "damage");

    if (attacker && dropP > 0) {
        state.updatePlayer(attackerId, p => ({ p: p.p + dropP }));
        logMsg(`💰 ${attacker.name}が${dropP}P奪取！`); playSfx('coin');
    }

    if (newHp <= 0) {
        newHp = 0;
        let lostP = Math.min(15, Math.max(0, Math.floor(newP / 3)));
        newP -= lostP;
        
        let newEquip = { ...target.equip };
        const eqKeys = Object.keys(newEquip).filter(k => newEquip[k]);
        if (eqKeys.length > 0) newEquip[eqKeys[Math.floor(Math.random() * eqKeys.length)]] = false;

        logMsg(`<span style="color:#e74c3c">☠️ ${target.name}が死亡！病院へ搬送...</span>`);
        playSfx('death');
        state.addEventPopup(targetId, "☠️", "死亡", "病院へ搬送...", "damage");
        
        state.updatePlayer(targetId, {
            hp: 100, p: newP, pos: 0, ap: 0, cans: 0, trash: 0,
            deaths: (target.deaths || 0) + 1, respawnShield: 2, equip: newEquip
        });

        if (attacker) state.updatePlayer(attackerId, p => ({ kills: (p.kills || 0) + 1 }));
    } else {
        state.updatePlayer(targetId, { hp: newHp, p: newP });
    }

    return actualDmg;
};