import { useGameStore } from '../store/useGameStore';
import { logMsg } from './actions';
import { dealDamage } from './combat';
import { playSfx } from '../utils/audio';
import { charEmoji } from '../constants/characters';
import { recordWin } from '../utils/userLogic';
import { useNetworkStore } from '../store/useNetworkStore';
import { useUserStore } from '../store/useUserStore';
import { checkNpcCollision } from './npc';

const sleep = ms => new Promise(r => setTimeout(r, ms));

const getDestRandom = (start, steps, mapData) => {
    let current = start, hitList = [];
    for (let i = 0; i < steps; i++) {
        let tile = mapData.find(t => t.id === current);
        if (!tile || tile.next.length === 0) break;
        current = tile.next[Math.floor(Math.random() * tile.next.length)];
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
    
    const netState = useNetworkStore.getState();
    const isOnline = netState.status === 'connected';
    
    const isMe = (p) => {
        if (isOnline) return p.userId === netState.myUserId;
        const myName = useUserStore.getState().playerName;
        return !p.isCPU && p.name === myName;
    };

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
        const winningTeamMembers = sortedTeams[0].members;
        if (winningTeamMembers.some(p => isMe(p))) {
             const myResult = winningTeamMembers.find(p => isMe(p));
             if(myResult) { recordWin(myResult.totalScore); console.log(`[戦績セーブ] チーム優勝！`); }
        }
    } else {
        logMsg(`🏆 優勝は ${results[0].name}！`);
        if (isMe(results[0])) { recordWin(results[0].totalScore); console.log(`[戦績セーブ] 優勝！`); }
    }
    useGameStore.setState({ gameResult: { results, isTeamGame, sortedTeams } });
    playSfx('win');
};

export const processRoundEnd = async () => {
    useGameStore.setState({ _roundEndInProgress: true });

    try {
        const state = useGameStore.getState();
        let newRound = state.roundCount + 1;
        if (newRound > state.maxRounds) { endGame(); return; }

        logMsg(`<span style="color:#2980b9">--- 🌙 ラウンド${newRound}/${state.maxRounds} 開始 ---</span>`);

        let summaryDigest = [];

        state.players.forEach(p => {
            if (p.detectiveCd > 0) useGameStore.getState().updatePlayer(p.id, { detectiveCd: p.detectiveCd - 1 });
        });

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
                owned.forEach(tId => { 
                    const areaType = state.mapData.find(x => x.id == tId)?.area || 'slum';
                    tax += AREA_TAX[areaType]; 
                });
                
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
                    logMsg(`⚠️ ${p.name}は維持費不足で最も価値の高い陣地を没収！`);
                    summaryDigest.push(`⚠️ ${p.name}: 維持費不足で陣地没収`);
                }
            });
        }

        const md = state.mapData;
        let nextNpcState = {};

        // ▼ 追加: テレポート廃止・隣接移動＆クールタイムロジック
        const moveOrRespawn = (posKey, cdKey, filterCondition = null) => {
            let cd = state[cdKey] || 0;
            let pos = state[posKey];
            if (cd > 0) {
                cd--;
                if (cd === 0) {
                    let pool = filterCondition ? md.filter(filterCondition) : md;
                    if (pool.length === 0) pool = md;
                    pos = pool[Math.floor(Math.random() * pool.length)].id;
                }
            } else if (pos !== 999) {
                const tile = md.find(t => t.id === pos);
                if (tile && tile.next && tile.next.length > 0) {
                    pos = tile.next[Math.floor(Math.random() * tile.next.length)];
                }
            }
            nextNpcState[cdKey] = cd;
            nextNpcState[posKey] = pos;
        };

        moveOrRespawn('animalPos', 'animalCd', t => t.type === 'can' || t.type === 'trash');
        moveOrRespawn('unclePos', 'uncleCd');
        moveOrRespawn('yakuzaPos', 'yakuzaCd');
        moveOrRespawn('loansharkPos', 'loansharkCd');
        moveOrRespawn('friendPos', 'friendCd');

        useGameStore.setState({ roundSummary: summaryDigest });
        await sleep(summaryDigest.length * 400 + 2500);
        useGameStore.setState({ roundSummary: null });
        await sleep(300);

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

        // ▼ パトカーの移動とパトロール
        let pCd = state.policeCd || 0;
        let newPolicePos = state.policePos;

        if (pCd > 0) {
            pCd--;
            if (pCd === 0) newPolicePos = md[Math.floor(Math.random() * md.length)].id;
        } else if (newPolicePos !== 999) {
            if (newRound % 2 === 0) {
                logMsg(`🚓 パトカーがパトロール中！`);
                let policeRoll = Math.floor(Math.random()*6)+1 + Math.floor(Math.random()*6)+1; // 2d6に変更
                let pMove = getDestRandom(newPolicePos, policeRoll, md);
                newPolicePos = pMove.finalPos;
                let hitSomeone = false;

                useGameStore.getState().players.forEach(p => {
                    if (p.hp > 0 && pMove.hitList.includes(p.pos)) {
                        if (p.equip?.doll) {
                            useGameStore.getState().updatePlayer(p.id, prev => ({ equip: {...prev.equip, doll:false} }));
                            logMsg(`🎎 身代わり人形でパトカー回避！`);
                            useGameStore.getState().addEventPopup(p.id, "🎎", "回避", "身代わり人形で守った", "good");
                        } else if (!p.stealth && !p.hasID && p.charType !== "survivor") {
                            useGameStore.getState().updatePlayer(p.id, { penaltyAP: (p.penaltyAP||0)+2 });
                            logMsg(`🚓 パトカーが${p.name}を補導！次回AP-2`);
                            useGameStore.getState().addEventPopup(p.id, "🚓", "補導", "次回AP-2", "bad");
                            hitSomeone = true;
                        }
                    }
                });
                if (hitSomeone) {
                    pCd = 2;
                    newPolicePos = 999;
                }
            } else {
                const tile = md.find(t => t.id === newPolicePos);
                if (tile && tile.next && tile.next.length > 0) {
                    newPolicePos = tile.next[Math.floor(Math.random() * tile.next.length)];
                }
            }
        }
        nextNpcState.policeCd = pCd;
        nextNpcState.policePos = newPolicePos;

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

        // ステートをまとめて適用
        useGameStore.setState({ 
            roundCount: newRound, weatherState: weather, isRainy: weather === "rainy", isNight, canPrice, trashPrice, 
            ...nextNpcState 
        });

        // ▼ 追加: 移動してきたNPCがプレイヤーにぶつかった場合の判定
        useGameStore.getState().players.forEach(p => {
            if (p.hp > 0) checkNpcCollision(p.id);
        });

    } finally {
        useGameStore.setState({ _roundEndInProgress: false });
    }
};