import { useGameStore, isSameTeam } from '../store/useGameStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { checkNpcCollision } from './npc';
import { processRoundEnd } from './round';
import { playSfx } from '../utils/audio';
import { getDistance } from './combat';

export const logMsg = (htmlMsg) => { 
    useGameStore.setState(state => {
        const newLogs = [...(state.logs || []), htmlMsg].slice(-50); 
        return { logs: newLogs };
    });

    const logger = document.getElementById("log"); 
    if (logger) { 
        const div = document.createElement("div"); 
        div.innerHTML = `> ${htmlMsg}`; 
        logger.appendChild(div); 
        logger.scrollTop = logger.scrollHeight; 
    } 
};

export const actionRollDice = async (isCpuCall = false) => {
    const state = useGameStore.getState();
    const { turn, players, diceRolled } = state;
    const cp = players[turn];
    if (diceRolled || (!isCpuCall && cp.isCPU)) return;

    useGameStore.setState({ diceAnim: { active: true, d1: 1, d2: 1, text: `${cp.name}がサイコロを振っています...` }});
    const sfxInterval = setInterval(() => playSfx('dice'), 100);
    await new Promise(r => setTimeout(r, 1000));
    clearInterval(sfxInterval);

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    
    const isGamblerBonus = cp.charType === 'gambler' && Math.random() < 0.25;
    const d3 = isGamblerBonus ? Math.floor(Math.random() * 6) + 1 : 0;

    let totalAP = d1 + d2 + d3;
    const isZorome = d1 === d2;
    if (isZorome) totalAP *= 2; 
    if (cp.equip?.bicycle) totalAP += 2; 

    if (isZorome && cp.charType === 'gambler') {
        const heal = Math.min(10, 100 - cp.hp);
        if (heal > 0) { state.updateCurrentPlayer(p => ({ hp: p.hp + heal })); logMsg(`🎲 ギャンブラー興奮！HP+${heal}`); }
    }

    let textResult = `${d1}+${d2}${d3 > 0 ? '+'+d3 : ''}=${d1+d2+d3}AP${isZorome ? " (🎲ゾロ目×2)" : ""}`;
    useGameStore.setState({ diceAnim: { active: true, d1, d2, text: textResult }, diceRolled: true, canPickedThisTurn: 0 });
    state.updateCurrentPlayer(p => ({ ap: p.ap + totalAP }));
    
    if (isGamblerBonus) {
        logMsg(`🎲 <span style="color:#f1c40f">大勝負！ギャンブラーの第3のサイコロ発動（+${d3}）！</span>`);
        playSfx('success');
        state.addEventPopup(cp.id, "🎰", "大勝負！", `第3のサイコロ発動(+${d3})`, "good");
    }
    
    playSfx('success'); logMsg(`<span style="color:${cp.color}">${cp.name}</span>は${totalAP}AP獲得！`);
    
    await new Promise(r => setTimeout(r, 1800));
    useGameStore.setState(prev => ({ diceAnim: { ...prev.diceAnim, active: false } }));
};

export const actionMove = () => {
    const state = useGameStore.getState();
    const currentTile = state.mapData.find(t => t.id === state.players[state.turn].pos);
    const validNextTiles = currentTile.next.filter(id => id !== state.constructionPos);
    if (validNextTiles.length === 1) executeMove(validNextTiles[0]);
    else if (validNextTiles.length > 1) { useGameStore.setState({ isBranchPicking: true, currentBranchOptions: validNextTiles }); logMsg("🛣️ 分岐点！進む道を選んでください。"); }
};

export const executeMove = (targetTileId) => {
    const state = useGameStore.getState();
    const tile = state.mapData.find(t => t.id === targetTileId);
    const cp = state.players[state.turn];
    const prevPos = cp.pos;
    const moveCost = (state.isRainy && !cp.rainGear && cp.charType !== "athlete") ? 2 : 1;

    state.updateCurrentPlayer(p => ({ ap: Math.max(0, p.ap - moveCost), pos: targetTileId, rainGear: state.isRainy ? false : p.rainGear }));
    useGameStore.setState({ isBranchPicking: false, currentBranchOptions: [], isDashPicking: false });
    logMsg(`🚶 「${tile.name}」に移動。`); playSfx('move');

    if (tile.type === "center") {
        const healAmount = Math.min(30, 100 - cp.hp);
        if (healAmount > 0) {
            state.updateCurrentPlayer(p => ({ hp: p.hp + healAmount }));
            logMsg(`🏥 病院に立ち寄り！HP+${healAmount}無料回復！`);
            playSfx('success');
            state.addEventPopup(cp.id, "🏥", "病院で無料回復！", `HP+${healAmount}回復`, "good");
        }
    }

    if (tile.type === "koban") {
        state.updateCurrentPlayer(p => ({ ap: 0, cannotMove: true }));
        logMsg(`<span style="color:#e74c3c">🚓 交番！職務質問で足止め！</span>`); playSfx('fail');
        state.addEventPopup(cp.id, "🚓", "交番で職務質問", "ターンエンドしてください", "bad");
    }

    const sameOrPassed = state.players.filter(op => op.id !== cp.id && (op.pos === targetTileId || op.pos === prevPos) && op.p > 0 && op.hp > 0 && !isSameTeam(cp, op));
    sameOrPassed.forEach(t => {
        if (cp.charType === 'yankee' && (!cp._katsuage || cp._katsuage < 2)) {
            state.updatePlayer(t.id, p => ({ p: p.p - 1 })); state.updateCurrentPlayer(p => ({ p: p.p + 1, _katsuage: (p._katsuage||0) + 1 }));
            logMsg(`👊 ${cp.name}が${t.name}から1Pカツアゲ！`);
        }
        if (t.charType === 'yankee' && (!t._katsuage || t._katsuage < 2) && cp.p > 0) {
            state.updateCurrentPlayer(p => ({ p: p.p - 1 })); state.updatePlayer(t.id, p => ({ p: p.p + 1, _katsuage: (p._katsuage||0) + 1 }));
            logMsg(`👊 ${t.name}が${cp.name}から1Pカツアゲ！`);
        }
    });

    state.players.forEach(m => {
        if (m.id !== cp.id && m.charType === 'musician' && m.hp > 0 && getDistance(m.pos, targetTileId, state.mapData) <= 1) {
            state.updatePlayer(m.id, p => ({ p: p.p + 3 })); logMsg(`🎸 ${m.name}【投げ銭】${cp.name}が来て+3P！`);
        }
    });

    const terrOwnerId = state.territories[targetTileId];
    if (terrOwnerId !== undefined && terrOwnerId !== cp.id) {
        const det = state.players.find(p => p.id === terrOwnerId && p.charType === 'detective' && p.hp > 0 && !isSameTeam(p, cp));
        if (det && cp.hand.length > 0 && Math.random() < 0.3) {
            state.updateCurrentPlayer(p => { const h = [...p.hand]; const stolen = h.splice(Math.floor(Math.random() * h.length), 1)[0]; state.updatePlayer(det.id, dp => ({ hand: [...dp.hand, stolen] })); return { hand: h }; });
            logMsg(`🕵️ ${det.name}が張り込みで${cp.name}の手札を没収！`);
        }
    }

    if (tile.fieldCans > 0 || tile.fieldTrash > 0) {
        state.updateCurrentPlayer(p => ({ cans: p.cans + (tile.fieldCans||0), trash: p.trash + (tile.fieldTrash||0) }));
        useGameStore.setState(s => ({ mapData: s.mapData.map(t => t.id === targetTileId ? { ...t, fieldCans: 0, fieldTrash: 0 } : t) }));
        logMsg(`📦 ドロップアイテムを回収！`); playSfx('coin');
    }

    checkNpcCollision(cp.id);

    if (tile.type === "event" && !cp.isCPU) {
        if (Math.random() < 0.3) {
            useGameStore.setState({ storyActive: true, storyIndex: Math.floor(Math.random() * 4) });
        } else {
            useGameStore.setState({ mgActive: true, mgType: ["highlow", "boxes", "slot"][Math.floor(Math.random() * 3)], mgValue: Math.floor(Math.random() * 14) });
        }
    }
};

export const actionCan = () => { const s = useGameStore.getState(); s.updateCurrentPlayer(p => ({ ap: p.ap - 1, cans: p.cans + 1 })); useGameStore.setState(st => ({ canPickedThisTurn: st.canPickedThisTurn + 1 })); playSfx('coin'); };

export const actionTrash = () => { 
    const s = useGameStore.getState();
    const cp = s.players[s.turn]; 
    const cost = cp.equip?.shoes ? 1 : 2;
    
    s.updateCurrentPlayer(p => ({ ap: p.ap - cost }));
    
    let gain = Math.floor(Math.random() * 6);
    if (gain === 0) {
        if (cp.stealth) {
            s.updateCurrentPlayer(p => ({ stealth: false }));
            logMsg(`💨 ステルスで回避！`);
        } else if (cp.hasID) {
            s.updateCurrentPlayer(p => ({ hasID: false }));
            logMsg(`🔵 身分証で警察を回避！`);
        } else if (cp.charType === 'survivor') {
            logMsg(`🌿 サバイバーの勘で回避！`);
        } else {
            s.updateCurrentPlayer(p => ({ penaltyAP: (p.penaltyAP||0) + 2 }));
            logMsg(`<span style="color:#e74c3c">👮 ゴミ漁り失敗！警察に見つかり次回AP-2！</span>`);
            playSfx('fail');
            s.addEventPopup(cp.id, "👮", "ゴミ漁り失敗", "次回AP-2", "bad");
            return; 
        }
    }
    
    let nightBonus = s.isNight ? Math.floor(Math.random() * 3) : 0;
    gain += nightBonus;
    s.updateCurrentPlayer(p => ({ trash: p.trash + gain }));
    logMsg(`🗑️ ゴミ${gain}個見つけた！${nightBonus > 0 ? `(夜ボーナス+${nightBonus})` : ''}`);
    playSfx('coin');
    s.addEventPopup(cp.id, "🗑️", `ゴミ${gain}個発見！`, nightBonus > 0 ? `夜+${nightBonus}` : "", "good");
};

export const actionJob = () => { 
    const s = useGameStore.getState();
    const cp = s.players[s.turn];
    const win = Math.random() < (cp.charType === "sales" ? 0.8 : 0.6); 
    
    s.updateCurrentPlayer(p => ({ ap: p.ap - 3, p: p.p + (win ? 12 : 0) })); 
    if (win) playSfx('success'); else playSfx('fail'); 

    const msg = win ? `💼 バイト成功！12P獲得！` : `💼 バイト失敗...`;
    logMsg(msg);
    s.addEventPopup(cp.id, win ? "💼" : "😞", win ? "バイト成功！" : "バイト失敗...", win ? "+12P獲得" : "次回がんばろう", win ? "good" : "bad");

    useGameStore.setState({ jobResult: { active: true, isSuccess: win, points: win ? 12 : 0 } });
};

export const actionOccupy = () => { 
    const s = useGameStore.getState(), cp = s.players[s.turn];
    const cost = s.territories[cp.pos] !== undefined ? 6 : 3; 
    if (cp.p >= cost) { 
        s.updateCurrentPlayer(p => ({ p: p.p - cost })); 
        useGameStore.setState(st => ({ territories: { ...st.territories, [cp.pos]: cp.id } })); 
        playSfx('success'); 
    } 
};

export const actionExchange = () => { const s = useGameStore.getState(), cp = s.players[s.turn], tot = cp.cans * s.canPrice + cp.trash * s.trashPrice; s.updateCurrentPlayer(p => ({ p: p.p + tot, cans: 0, trash: 0 })); playSfx('coin'); };
export const actionManhole = () => { const s = useGameStore.getState(), cp = s.players[s.turn], mh = s.mapData.filter(t => t.type === "manhole" && t.id !== cp.pos); if (mh.length > 0) { s.updateCurrentPlayer(p => ({ ap: p.ap - 1, pos: mh[Math.floor(Math.random() * mh.length)].id })); playSfx('move'); checkNpcCollision(cp.id); } };

export const actionEndTurn = async () => {
    const state = useGameStore.getState();
    // ▼ 修正: すでにラウンド終了処理が走っている場合はここで強制ブロック
    if (state._roundEndInProgress) return;

    try {
        const cp = state.players[state.turn];
        
        let newEquip = { ...cp.equip }, newTimer = { ...cp.equipTimer };
        if (newEquip.bicycle) { newTimer.bicycle = (newTimer.bicycle || 5) - 1; if (newTimer.bicycle <= 0) { newEquip.bicycle = false; logMsg(`🚲 自転車が壊れた！`); } }
        if (newEquip.cart) { newTimer.cart = (newTimer.cart || 5) - 1; if (newTimer.cart <= 0) { newEquip.cart = false; logMsg(`🛒 リヤカーが壊れた！`); } }

        state.updateCurrentPlayer(p => ({ ap: 0, stealth: false, _katsuage: 0, equip: newEquip, equipTimer: newTimer, cannotMove: false })); 
        
        useGameStore.setState({ 
            isBranchPicking: false, isDashPicking: false, 
            isSalesVisiting: false, salesTargetId: null, npcSelectActive: false,
            mgActive: false, storyActive: false, turnBannerActive: false, npcMovePick: null 
        });
        
        const isLastPlayer = state.turn === state.players.length - 1;

        if (isLastPlayer) {
            const netState = useNetworkStore.getState();
            if (netState.status === 'connected' && !netState.isHost) {
                if (netState.hostConnection && netState.hostConnection.open) {
                    netState.hostConnection.send({ type: 'REQUEST_ROUND_END' });
                }
                return; 
            }
            await processRoundEnd();
        }

        useGameStore.setState(s => ({ turn: (s.turn + 1) % s.players.length, diceRolled: false }));
    } catch (e) { 
        console.error("actionEndTurn Error:", e); 
        useGameStore.setState(s => ({ turn: (s.turn + 1) % s.players.length, diceRolled: false })); 
    }
};