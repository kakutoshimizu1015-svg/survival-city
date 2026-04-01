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
        let killBonus = (p.kills || 0) * 3;
        let deathPenalty = (p.deaths || 0) * 5;
        let totalScore = scaledP + terrValue + resourceValue + killBonus - deathPenalty;
        return { ...p, scaledP, terrValue, resourceValue, killBonus, deathPenalty, totalScore, emoji: charEmoji[p.charType] };
    }).sort((a, b) => b.totalScore - a.totalScore);
    
    let isTeamGame = false;
    let sortedTeams = null;
    const hasTeams = state.players.some(p => p.teamColor !== 'none');
    if (hasTeams) {
        isTeamGame = true;
        const teamScores = {};
        results.forEach(r => {
            const tk = r.teamColor !== 'none' ? r.teamColor : `_solo_${r.id}`;
            if (!teamScores[tk]) teamScores[tk] = { color: r.teamColor, total: 0, members: [] };
            teamScores[tk].total += r.totalScore;
            teamScores[tk].members.push(r);
        });
        sortedTeams = Object.values(teamScores).sort((a, b) => b.total - a.total);
        logMsg(`🏆 優勝は ${sortedTeams[0].color !== 'none' ? sortedTeams[0].color+'チーム' : sortedTeams[0].members[0].name}！`);
    } else {
        logMsg(`🏆 優勝は ${results[0].name}！`);
    }
    
    useGameStore.setState({ gameResult: { results, isTeamGame, sortedTeams } });
    playSfx('win');
};

export const processRoundEnd = async () => {
    const state = useGameStore.getState();
    let newRound = state.roundCount + 1;
    if (newRound > state.maxRounds) { endGame(); return; }

    logMsg(`<span style="color:#2980b9">--- 🌙 ラウンド${newRound}/${state.maxRounds} 開始 ---</span>`);

    let summaryDigest = [];

    let weather = Math.random() < 0.2 ? "rainy" : Math.random() < 0.4 ? "cloudy" : "sunny";
    let isNight = Math.floor(newRound / 3) % 2 === 1;
    let canPrice = Math.max(1, Math.floor(Math.random() * 4));
    let trashPrice = Math.max(1, Math.floor(Math.random() * 6));

    summaryDigest.push(weather === "rainy" ? "🌧️ 雨" : weather === "cloudy" ? "☁️ 曇り" : "☀️ 晴れ");
    summaryDigest.push(isNight ? "🌙 夜になった" : "☀️ 昼になった");
    summaryDigest.push(`📈 相場変動: 缶${canPrice}P ゴミ${trashPrice}P`);

    if (newRound % 3 === 0) {
        const AREA_TAX = { slum: 0, commercial: 1, luxury: 2 };
        state.players.forEach(p => {
            const owned = Object.keys(state.territories).filter(k => state.territories[k] === p.id);
            if (owned.length === 0) return;
            let tax = 0;
            owned.forEach(tId => { tax += AREA_TAX[state.mapData.find(x => x.id == tId)?.area || 'slum']; });
            if (tax === 0) { summaryDigest.push(`💸 ${p.name}: 維持費 0P`); return; }
            if (p.p >= tax) {
                useGameStore.getState().updatePlayer(p.id, prev => ({ p: prev.p - tax }));
                logMsg(`💸 ${p.name}の維持費: -${tax}P`);
                summaryDigest.push(`💸 ${p.name}: 維持費 -${tax}P`);
            } else {
                const lostId = owned.sort((a, b) => AREA_TAX[state.mapData.find(x=>x.id==b)?.area] - AREA_TAX[state.mapData.find(x=>x.id==a)?.area])[0];
                const newTerr = { ...useGameStore.getState().territories };
                delete newTerr[lostId];
                useGameStore.getState().updatePlayer(p.id, { p: 0 });
                useGameStore.setState({ territories: newTerr });
                logMsg(`⚠️ ${p.name}は維持費不足で陣地没収！`);
                summaryDigest.push(`⚠️ ${p.name}: 維持費不足で陣地没収`);
            }
        });
    }

    const md = state.mapData;
    let animalPos = md.filter(t=>t.type==='can'||t.type==='trash')[Math.floor(Math.random()*md.filter(t=>t.type==='can'||t.type==='trash').length)]?.id || 0;
    let unclePos = md[Math.floor(Math.random() * md.length)].id;
    let yakuzaPos = md[Math.floor(Math.random() * md.length)].id;
    let loansharkPos = md[Math.floor(Math.random() * md.length)].id;
    let friendPos = md[Math.floor(Math.random() * md.length)].id;

    // --- ① ラウンドサマリーの表示と待機 ---
    useGameStore.setState({ roundSummary: summaryDigest });
    await sleep(summaryDigest.length * 400 + 2500);
    useGameStore.setState({ roundSummary: null });
    await sleep(300);

    // --- ② ごみ収集車 ホラー演出 ---
    logMsg(`<span style="color:#c0392b">🛻 ごみ収集車が暴走！</span>`);
    useGameStore.setState({ horrorMode: true }); 
    playSfx('hit'); 
    await sleep(800);
    
    let truckRoll = Math.floor(Math.random()*6)+1 + Math.floor(Math.random()*6)+1;
    let truckMove = getDestRandom(state.truckPos, truckRoll, md);
    
    const hitPlayers = [];
    const allTruckPath = [state.truckPos, ...truckMove.hitList];

    for (let stepId of allTruckPath) {
        useGameStore.setState({ truckPos: stepId });
        
        useGameStore.getState().players.forEach(p => {
            if (p.hp > 0 && p.pos === stepId && !hitPlayers.includes(p.id)) {
                hitPlayers.push(p.id);

                if (p.equip?.doll) {
                    useGameStore.getState().updatePlayer(p.id, prev => ({ equip: {...prev.equip, doll:false} }));
                    logMsg(`🎎 身代わり人形が${p.name}を守った！`);
                    useGameStore.getState().addEventPopup(p.id, "🎎", "回避", "身代わり人形が守った", "good");
                } else if (Math.random() < 0.55) {
                    useGameStore.setState({ bloodAnim: p.name });
                    setTimeout(() => useGameStore.setState({ bloodAnim: null }), 2000);
                    dealDamage(p.id, 50, "収集車");
                    useGameStore.getState().addEventPopup(p.id, "💥", "轢かれた！", "収集車に轢かれた", "damage");
                } else {
                    logMsg(`💨 ${p.name}は収集車をギリギリ回避！`);
                    useGameStore.getState().addEventPopup(p.id, "💨", "回避！", "収集車をギリギリかわした", "good");
                }
            }
        });
        
        await sleep(300);
    }

    await sleep(800);
    useGameStore.setState({ horrorMode: false });

    // --- ③ 警察パトロール ---
    let newPolicePos = state.policePos;
    if (newRound % 2 === 0) {
        logMsg(`🚓 警察パトロール！`);
        let policeRoll = Math.floor(Math.random()*6)+1 + Math.floor(Math.random()*6)+1 + Math.floor(Math.random()*6)+1;
        let pMove = getDestRandom(state.policePos, policeRoll, md);
        newPolicePos = pMove.finalPos;
        useGameStore.getState().players.forEach(p => {
            if (p.hp > 0 && pMove.hitList.includes(p.pos)) {
                if (!p.stealth && !p.hasID) { 
                    useGameStore.getState().updatePlayer(p.id, { penaltyAP: (p.penaltyAP||0)+2 }); 
                    logMsg(`🚓 ${p.name}補導！次回AP-2`); 
                    useGameStore.getState().addEventPopup(p.id, "🚓", "補導", "次回AP-2", "bad");
                }
            }
        });
    }

    // --- ④ 次の収集車のエリア予兆表示 ---
    const nextPreviewRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
    const nextMove = getDestRandom(truckMove.finalPos, nextPreviewRoll, md);
    const areaCounts = {};
    nextMove.hitList.forEach(tid => {
        const t = md.find(x => x.id === tid);
        if (t) areaCounts[t.area] = (areaCounts[t.area] || 0) + 1;
    });
    const sortedAreas = Object.entries(areaCounts).sort((a,b)=>b[1]-a[1]);
    if (sortedAreas.length > 0) {
        const dangerArea = sortedAreas[0][0];
        const areaNames = { slum: 'スラムエリア', commercial: '商業エリア', luxury: '高級エリア' };
        const warningMsg = `次の収集車は「${areaNames[dangerArea] || dangerArea}」を中心に暴走するらしい…`;
        
        useGameStore.setState({ disasterWarning: warningMsg });
        await sleep(3500);
        useGameStore.setState({ disasterWarning: null });
        await sleep(300);
    }

    // --- ⑤ ラウンド状態の最終更新 ---
    useGameStore.setState({ roundCount: newRound, weatherState: weather, isRainy: weather === "rainy", isNight, canPrice, trashPrice, animalPos, unclePos, yakuzaPos, loansharkPos, friendPos, policePos: newPolicePos });
};