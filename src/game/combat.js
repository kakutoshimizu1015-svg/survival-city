import { useGameStore } from '../store/useGameStore';
import { logMsg } from './actions';

const isSameTeam = (p1, p2) => {
    if (!p1 || !p2 || p1.id === p2.id) return false;
    return p1.teamColor !== 'none' && p1.teamColor === p2.teamColor;
};

// 距離計算ヘルパー
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
            if (!visited.has(nextId)) {
                visited.add(nextId);
                queue.push({ id: nextId, dist: current.dist + 1 });
            }
        }
    }
    return 999;
};

export const dealDamage = (targetId, dmg, source, attackerId = null) => {
    const state = useGameStore.getState();
    const target = state.players.find(p => p.id === targetId);
    const attacker = attackerId !== null ? state.players.find(p => p.id === attackerId) : null;
    
    if (!target || target.hp <= 0) return 0;

    // チームメイトへのダメージ・無敵状態の無効化
    if (attacker && isSameTeam(attacker, target)) {
        logMsg(`🤝 ${target.name}はチームメイトなのでダメージ無効！`); return 0;
    }
    if (target.respawnShield > 0) {
        logMsg(`🛡️ ${target.name}は復活無敵中！ダメージ無効`); return 0;
    }
    if (target.reaction === 'block') {
        state.updatePlayer(targetId, { reaction: null });
        logMsg(`⚖️ 弁護士の盾がダメージを無効化！`); return 0;
    }
    if (target.reaction === 'counter' && attacker) {
        state.updatePlayer(targetId, { reaction: null });
        logMsg(`🔄 反撃！${attacker.name}に${dmg}ダメージ！`);
        dealDamage(attackerId, dmg, "反撃");
        return 0;
    }
    
    // 装備による軽減
    let actualDmg = dmg;
    if (target.equip?.helmet) {
        state.updatePlayer(targetId, p => ({ equip: { ...p.equip, helmet: false } }));
        actualDmg = Math.floor(actualDmg / 2);
        logMsg(`🪖 ヘルメットでダメージ半減！`);
    }
    if (target.equip?.shield) {
        state.updatePlayer(targetId, p => ({ equip: { ...p.equip, shield: false } }));
        if (Math.random() < 0.5) {
            actualDmg = Math.floor(actualDmg / 2);
            logMsg(`🛡️ 段ボールの盾でダメージ半減！`);
        } else {
            logMsg(`🛡️ 段ボールの盾が壊れた...`);
        }
    }

    let newHp = target.hp - actualDmg;
    let dropP = Math.min(Math.floor(actualDmg / 5), Math.max(0, target.p));
    let newP = target.p - dropP;

    logMsg(`<span style="color:#e74c3c">💥 ${target.name}に${actualDmg}ダメージ！${dropP > 0 ? dropP+'P落とした' : ''}</span>`);

    if (attacker && dropP > 0) {
        state.updatePlayer(attackerId, p => ({ p: p.p + dropP }));
        logMsg(`💰 ${attacker.name}が${dropP}P奪取！`);
    } else if (!attacker && dropP > 0) {
        // ハイエナシステム
        let neighbors = state.players.filter(p => p.id !== target.id && p.hp > 0 && getDistance(p.pos, target.pos, state.mapData) <= 2);
        if (neighbors.length > 0) {
            let share = Math.floor(dropP / neighbors.length);
            neighbors.forEach(n => {
                state.updatePlayer(n.id, p => ({ p: p.p + share }));
                if (share > 0) logMsg(`🦴 ${n.name}がハイエナで${share}P拾った！`);
            });
        }
    }

    // 死亡処理
    if (newHp <= 0) {
        newHp = 0;
        let lostP = Math.min(15, Math.max(0, Math.floor(newP / 3)));
        newP -= lostP;
        
        let newEquip = { ...target.equip };
        const eqKeys = Object.keys(newEquip).filter(k => newEquip[k]);
        if (eqKeys.length > 0) newEquip[eqKeys[Math.floor(Math.random() * eqKeys.length)]] = false;

        logMsg(`<span style="color:#e74c3c">☠️ ${target.name}が死亡！病院へ搬送...</span>`);
        
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