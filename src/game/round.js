import { useGameStore } from '../store/useGameStore';
import { logMsg } from './actions';
import { dealDamage } from './combat';
import { playSfx } from '../utils/audio';
import { charEmoji } from '../constants/characters';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const getDestRandom = (start, steps, mapData) => {
    let current = start, hitList = [];
    for (let i = 0; i < steps; i++) {
        let tile = mapData.find(t => t.id === current);
        let nexts = tile.next;
        if (nexts.length === 0) break;
        current = nexts[Math.floor(Math.random() * nexts.length)];
        hitList.push(current);
    }
    return { finalPos: current, hitList };
};

const endGame = () => {
    const state = useGameStore.getState();
    useGameStore.setState({ gameOver: true });
    
    let results = state.players.map(p => {
        let terrValue = 0;
        Object.keys(state.territories).filter(k => state.territories[k] === p.id).forEach(tId => {
            let area = state.mapData.find(t => t.id == tId).area;
            terrValue += (area === "slum" ? 3 : area === "commercial" ? 6 : 10);
        });
        let resourceValue = p.cans * state.canPrice + p.trash * state.trashPrice;
        let scaledP = Math.round(p.p * 2.0);
        let totalScore = scaledP + terrValue + resourceValue + (p.kills || 0) * 3 - (p.deaths || 0) * 5;
        return { ...p, scaledP, terrValue, totalScore, emoji: charEmoji[p.charType] };
    }).sort((a, b) => b.totalScore - a.totalScore);
    
    // チーム戦スコア合算
    const hasTeams = state.players.some(p => p.teamColor !== 'none');
    if (hasTeams) {
        const teamScores = {};
        results.forEach(r => {
            const tk = r.teamColor !== 'none' ? r.teamColor : `_solo_${r.id}`;
            if (!teamScores[tk]) teamScores[tk] = { color: r.teamColor, total: 0, members: [] };
            teamScores[tk].total += r.totalScore;
            teamScores[tk].members.push(r);
        });
        const sortedTeams = Object.values(teamScores).sort((a, b) => b.total - a.total);
        logMsg(`🏆 優勝は ${sortedTeams[0].color !== 'none' ? sortedTeams[0].color+'チーム' : sortedTeams[0].members[0].name}！`);
    } else {
        logMsg(`🏆 優勝は ${results[0].name}！`);
    }
    playSfx('win');
};

export const processRoundEnd = async () => {
    const state = useGameStore.getState();
    let newRound = state.roundCount + 1;
    if (newRound > state.maxRounds) { endGame(); return; }

    logMsg(`<span style="color:#2980b9">--- 🌙 ラウンド${newRound}/${state.maxRounds} 開始 ---</span>`);

    let weather = Math.random() < 0.2 ? "rainy" : Math.random() < 0.4 ? "cloudy" : "sunny";
    let isNight = Math.floor(newRound / 3) % 2 === 1;
    let canPrice = Math.max(1, Math.floor(Math.random() * 4));
    let trashPrice = Math.max(1, Math.floor(Math.random() * 6));

    // 陣地維持費 (3ラウンド毎)
    if (newRound % 3 === 0) {
        const AREA_TAX = { slum: 0, commercial: 1, luxury: 2 };
        state.players.forEach(p => {
            const owned = Object.keys(state.territories).filter(k => state.territories[k] === p.id);
            if (owned.length === 0) return;
            let tax = 0;
            owned.forEach(tId => { tax += AREA_TAX[state.mapData.find(x => x.id == tId)?.area || 'slum']; });
            if (tax === 0) return;
            if (p.p >= tax) {
                useGameStore.getState().updatePlayer(p.id, prev => ({ p: prev.p - tax }));
                logMsg(`💸 ${p.name}の維持費: -${tax}P`);
            } else {
                const lostId = owned.sort((a, b) => AREA_TAX[state.mapData.find(x=>x.id==b)?.area] - AREA_TAX[state.mapData.find(x=>x.id==a)?.area])[0];
                const newTerr = { ...useGameStore.getState().territories };
                delete newTerr[lostId];
                useGameStore.getState().updatePlayer(p.id, { p: 0 });
                useGameStore.setState({ territories: newTerr });
                logMsg(`⚠️ ${p.name}は維持費不足で陣地没収！`);
            }
        });
    }

    const md = state.mapData;
    let animalPos = md.filter(t=>t.type==='can'||t.type==='trash')[Math.floor(Math.random()*md.filter(t=>t.type==='can'||t.type==='trash').length)]?.id || 0;
    let unclePos = md[Math.floor(Math.random() * md.length)].id;
    let yakuzaPos = md[Math.floor(Math.random() * md.length)].id;
    let loansharkPos = md[Math.floor(Math.random() * md.length)].id;
    let friendPos = md[Math.floor(Math.random() * md.length)].id;

    // ▼ ごみ収集車 ホラー演出＆1マスずつの移動アニメーション
    logMsg(`<span style="color:#c0392b">🛻 ごみ収集車が暴走！</span>`);
    useGameStore.setState({ horrorMode: true }); 
    playSfx('hit'); 
    await sleep(800);
    
    let truckRoll = Math.floor(Math.random()*6)+1 + Math.floor(Math.random()*6)+1;
    let truckMove = getDestRandom(state.truckPos, truckRoll, md);
    
    const hitPlayers = [];
    for (let stepId of truckMove.hitList) {
        useGameStore.setState({ truckPos: stepId });
        
        useGameStore.getState().players.forEach(p => {
            if (p.hp > 0 && p.pos === stepId && !hitPlayers.includes(p.id)) {
                if (p.equip?.doll) {
                    useGameStore.getState().updatePlayer(p.id, prev => ({ equip: {...prev.equip, doll:false} }));
                    logMsg(`🎎 身代わり人形が${p.name}を守った！`);
                } else if (Math.random() < 0.55) {
                    hitPlayers.push(p.id);
                    useGameStore.setState({ bloodAnim: p.name });
                    dealDamage(p.id, 50, "収集車");
                }
            }
        });
        
        await sleep(300); // これで1マスずつ進んでいくように見える
        useGameStore.setState({ bloodAnim: null });
    }

    await sleep(800);
    useGameStore.setState({ horrorMode: false });

    // 警察パトロール（偶数ラウンド）
    let newPolicePos = state.policePos;
    if (newRound % 2 === 0) {
        logMsg(`🚓 警察パトロール！`);
        let policeRoll = Math.floor(Math.random()*6)+1 + Math.floor(Math.random()*6)+1 + Math.floor(Math.random()*6)+1;
        let pMove = getDestRandom(state.policePos, policeRoll, md);
        newPolicePos = pMove.finalPos;
        useGameStore.getState().players.forEach(p => {
            if (p.hp > 0 && pMove.hitList.includes(p.pos)) {
                if (!p.stealth && !p.hasID) { useGameStore.getState().updatePlayer(p.id, { penaltyAP: (p.penaltyAP||0)+2 }); logMsg(`🚓 ${p.name}補導！次回AP-2`); }
            }
        });
    }

    useGameStore.setState({ roundCount: newRound, weatherState: weather, isRainy: weather === "rainy", isNight, canPrice, trashPrice, animalPos, unclePos, yakuzaPos, loansharkPos, friendPos, policePos: newPolicePos });
};