import { useGameStore, isSameTeam } from '../store/useGameStore';
import { logMsg } from './actions';
import { playSfx } from '../utils/audio';

export const getDistance = (posA, posB, mapData) => {
    if (posA === posB) return 0;
    let visited = new Set([posA]), queue = [{ id: posA, dist: 0 }];
    while (queue.length > 0) {
        let cur = queue.shift(), tile = mapData.find(t => t.id === cur.id);
        if (!tile) continue;
        for (let n of tile.next) {
            if (n === posB) return cur.dist + 1;
            if (!visited.has(n)) { visited.add(n); queue.push({ id: n, dist: cur.dist + 1 }); }
        }
    }
    return 999;
};

export const dealDamage = (targetId, dmg, source, attackerId = null) => {
    const state = useGameStore.getState();

    // ▼ NPCがターゲットの場合の処理
    if (String(targetId).startsWith('npc_')) {
        const npcType = targetId.split('_')[1];
        const currentHp = state[`${npcType}Hp`];
        
        if (currentHp <= 0) return 0;

        const newHp = currentHp - dmg;
        const npcNames = { police: 'パトカー', uncle: '厄介なおじさん', yakuza: 'ヤクザ', loanshark: '闇金', friend: '仲間のホームレス' };
        
        logMsg(`<span style="color:#e74c3c">💥 ${npcNames[npcType] || 'NPC'}に${dmg}ダメージ！</span>`);
        playSfx('hit');

        if (newHp <= 0) {
            logMsg(`☠️ 武器で${npcNames[npcType] || 'NPC'}を倒した！`);
            useGameStore.setState({
                [`${npcType}Hp`]: 0,
                [`${npcType}Pos`]: 999, // マップから一時消去
                [`${npcType}Respawn`]: 1 // 1ターン後に再スポーン
            });
            if (attackerId !== null) {
                state.updatePlayer(attackerId, p => ({ kills: (p.kills || 0) + 1 }));
            }
        } else {
            useGameStore.setState({ [`${npcType}Hp`]: newHp });
        }
        return dmg;
    }

    // 以下、プレイヤーがターゲットの場合の処理
    const target = state.players.find(p => p.id === targetId);
    const attacker = attackerId !== null ? state.players.find(p => p.id === attackerId) : null;
    
    if (!target || target.hp <= 0) return 0;
    if (attacker && isSameTeam(attacker, target)) { logMsg(`🤝 ${target.name}は味方なのでダメージ無効！`); return 0; }
    if (target.respawnShield > 0) { logMsg(`🛡️ ${target.name}は無敵中！`); return 0; }
    
    if (target.reaction === 'block') {
        state.updatePlayer(targetId, { reaction: null }); logMsg(`⚖️ 弁護士の盾で完全防御！`); playSfx('success');
        state.addEventPopup(targetId, "⚖️", "弁護士の盾", "ダメージ無効", "good"); return 0;
    }
    if (target.reaction === 'counter' && attacker) {
        state.updatePlayer(targetId, { reaction: null }); logMsg(`🔄 反撃！${attacker.name}に${dmg}ダメ！`); playSfx('hit');
        state.addEventPopup(targetId, "🔄", "反撃発動", `${attacker.name}に${dmg}ダメ`, "good");
        dealDamage(attackerId, dmg, "反撃"); return 0;
    }
    
    let actualDmg = dmg;
    if (target.equip?.helmet) { state.updatePlayer(targetId, p => ({ equip: { ...p.equip, helmet: false } })); actualDmg = Math.floor(actualDmg / 2); playSfx('success'); }
    if (target.equip?.shield) {
        state.updatePlayer(targetId, p => ({ equip: { ...p.equip, shield: false } }));
        if (Math.random() < 0.5) { actualDmg = Math.floor(actualDmg / 2); playSfx('hit'); }
    }

    let newHp = target.hp - actualDmg;
    let dropP = Math.min(Math.floor(actualDmg / 5), Math.max(0, target.p));

    logMsg(`<span style="color:#e74c3c">💥 ${target.name}に${actualDmg}ダメージ！${dropP > 0 ? dropP+'P落とした' : ''}</span>`);
    playSfx('hit');
    state.addEventPopup(targetId, "💥", `${actualDmg}ダメージ`, dropP > 0 ? `${dropP}P落とした` : "", "damage");

    if (attacker && dropP > 0) {
        state.updatePlayer(attackerId, p => ({ p: p.p + dropP })); logMsg(`💰 ${attacker.name}が${dropP}P奪取！`); playSfx('coin');
    } else if (!attacker && dropP > 0) {
        let neighbors = state.players.filter(p => p.id !== target.id && p.hp > 0 && getDistance(p.pos, target.pos, state.mapData) <= 2);
        if (neighbors.length > 0) {
            let share = Math.floor(dropP / neighbors.length);
            neighbors.forEach(n => { state.updatePlayer(n.id, p => ({ p: p.p + share })); if (share > 0) logMsg(`🦴 ${n.name}がハイエナで${share}P拾った！`); });
        }
    }

    if (newHp <= 0) {
        let lostP = Math.min(15, Math.max(0, Math.floor((target.p - dropP) / 3)));
        let newEquip = { ...target.equip };
        const eqKeys = Object.keys(newEquip).filter(k => newEquip[k]);
        if (eqKeys.length > 0) newEquip[eqKeys[Math.floor(Math.random() * eqKeys.length)]] = false;

        if (target.cans > 0 || target.trash > 0) {
            useGameStore.setState(s => ({ mapData: s.mapData.map(t => t.id === target.pos ? { ...t, fieldCans: (t.fieldCans||0) + target.cans, fieldTrash: (t.fieldTrash||0) + target.trash } : t) }));
        }

        logMsg(`<span style="color:#e74c3c">☠️ ${target.name}が死亡！病院へ搬送...</span>`); playSfx('death');
        state.addEventPopup(targetId, "☠️", "死亡", "病院へ搬送...", "damage");
        state.updatePlayer(targetId, { hp: 100, p: target.p - dropP - lostP, pos: 0, ap: 0, cans: 0, trash: 0, deaths: (target.deaths || 0) + 1, respawnShield: 2, equip: newEquip });
        if (attacker) state.updatePlayer(attackerId, p => ({ kills: (p.kills || 0) + 1 }));
    } else {
        state.updatePlayer(targetId, { hp: newHp, p: target.p - dropP });
    }
    return actualDmg;
};