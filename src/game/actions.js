import { useGameStore, isSameTeam } from '../store/useGameStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { useUserStore } from '../store/useUserStore';
import { checkNpcCollision } from './npc';
import { processRoundEnd } from './round';
import { playSfx } from '../utils/audio';
import { getDistance, dealDamage } from './combat';

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

    // ▼ パッシブスキルの解決（ターン開始時）
    
    // 🩺 闇医者のパッシブ【再生能力】
    if (cp.charType === 'doctor') {
        const healAmt = cp.hp <= 50 ? 16 : 8; 
        const actualHeal = Math.min(healAmt, 100 - cp.hp);
        if (actualHeal > 0) {
            state.updateCurrentPlayer(p => ({ hp: p.hp + actualHeal }));
            logMsg(`🩸 闇医者の再生能力！HPが${actualHeal}回復！`);
            playSfx('success');
            state.addEventPopup(cp.id, "🩸", "再生能力", `HP+${actualHeal}`, "good");
        }
    }

    // 🥫 缶コレクターの帝王: 15缶以上の時HP+5回復
    if (cp.charType === 'emperor' && cp.cans >= 15) {
        const heal = Math.min(5, 100 - cp.hp);
        if (heal > 0) {
            state.updateCurrentPlayer(p => ({ hp: p.hp + heal }));
            logMsg(`🥫 帝王の休息！缶の加護でHPが${heal}回復した！`);
            state.addEventPopup(cp.id, "🥫", "帝王の休息", `HP+${heal}`, "good");
        }
    }

    // 🥫 缶コレクターの帝王: 20缶以上の時、同マスの相手に毎ターン3ダメージ
    if (cp.charType === 'emperor' && cp.cans >= 20) {
        const others = players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);
        others.forEach(target => {
            dealDamage(target.id, 3, "帝王オーラ", cp.id);
            logMsg(`🔥 帝王オーラ！${target.name}に3ダメージ与えた！`);
        });
    }

    // 💴 億万長者: 所持Pが50以上の時、同マスの相手から自動で1Pずつ徴収
    if (cp.charType === 'billionaire' && cp.p >= 50) {
        const others = players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0 && p.p > 0);
        others.forEach(target => {
            state.updatePlayer(target.id, p => ({ p: p.p - 1 }));
            state.updateCurrentPlayer(p => ({ p: p.p + 1 }));
            logMsg(`💴 羨望！${target.name}から1Pを自動徴収した！`);
            state.addEventPopup(cp.id, "💴", "羨望", `${target.name}から1P徴収`, "good");
            state.addEventPopup(target.id, "💴", "徴収された", "億万長者に1P払った", "bad");
        });
    }

    // 👼 路上の神様: ゲーム開始時（1ラウンド目）のみ全員に加護トークン付与
    if (cp.charType === 'god' && state.roundCount === 1) {
        players.forEach(p => {
            if (p.id !== cp.id) {
                state.updatePlayer(p.id, { godBlessing: true });
                state.addEventPopup(p.id, "👼", "神の加護", "死亡回避1回付与", "good");
            }
        });
        logMsg(`👼 路上の神様が降臨！全プレイヤーに【加護トークン】を授けた！`);
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    
    const isGamblerBonus = cp.charType === 'gambler' && Math.random() < 0.25;
    const d3 = isGamblerBonus ? Math.floor(Math.random() * 6) + 1 : 0;

    let totalAP = d1 + d2 + d3;
    const isZorome = d1 === d2;
    if (isZorome) totalAP *= 2; 
    if (cp.equip?.bicycle) totalAP += 2;

    if (cp.penaltyAP > 0) {
        const penalty = cp.penaltyAP;
        totalAP = Math.max(0, totalAP - penalty);
        state.updateCurrentPlayer(p => ({ penaltyAP: 0 }));
        logMsg(`<span style="color:#e74c3c">🚓 ペナルティ発動！AP-${penalty}</span>`);
        state.addEventPopup(cp.id, "🚓", `AP-${penalty}ペナルティ`, "前回の補導の影響", "bad");
        playSfx('fail');
    }

    if (isZorome && cp.charType === 'gambler') {
        const heal = Math.min(10, 100 - cp.hp);
        if (heal > 0) { state.updateCurrentPlayer(p => ({ hp: p.hp + heal })); logMsg(`🎲 ギャンブラー興奮！HP+${heal}`); }
    }

    useGameStore.setState({
        diceAnim: { active: true, d1, d2, d3, isDouble: isZorome, text: '' },
        diceRolled: true,
        canPickedThisTurn: 0
    });

    // ▼ 修正: 仙人の「何も行動しなかった」判定のために、ダイス直後のAPを保存する
    state.updateCurrentPlayer(p => {
        const finalAP = p.ap + totalAP;
        useGameStore.setState({ lastDiceRollTotal: finalAP });
        return { ap: finalAP };
    });
    
    let territoryIncome = 0;
    let ownedTilesCount = 0;

    Object.entries(state.territories).forEach(([tileId, ownerId]) => {
        if (ownerId === cp.id) {
            ownedTilesCount++;
            const tile = state.mapData.find(t => t.id === Number(tileId) || t.id === String(tileId));
            
            if (tile && tile.area === 'luxury') {
                territoryIncome += 3;
            } else if (tile && tile.area === 'commercial') {
                territoryIncome += 2;
            } else {
                territoryIncome += 1;
            }
        }
    });

    if (territoryIncome > 0) {
        // 天地開闢(仙人) または ニセ情報(カード) のデバフ判定
        if (cp.fakeInfoDebuff > 0 || state.tenchiZeroIncome > 0) {
            logMsg(`📰 収入停止中！陣地からの収入がゼロになった！`);
        } else {
            state.updateCurrentPlayer(p => ({ p: p.p + territoryIncome }));
            logMsg(`🏙️ 陣地収入！ ${ownedTilesCount}つの陣地から合計 ${territoryIncome}P を獲得！`);
            playSfx('coin');
            state.addEventPopup(cp.id, "🏙️", "陣地収入", `合計 ${territoryIncome}P を獲得`, "good");
        }
    }

    if (isGamblerBonus) {
        logMsg(`🎲 <span style="color:#f1c40f">大勝負！ギャンブラーの第3のサイコロ発動（+${d3}）！</span>`);
        playSfx('success');
        state.addEventPopup(cp.id, "🎰", "大勝負！", `第3のサイコロ発動(+${d3})`, "good");
    }
    
    playSfx('success'); logMsg(`<span style="color:${cp.color}">${cp.name}</span>は${totalAP}AP獲得！`);

    if (isCpuCall) {
        await new Promise(resolve => {
            const checkOverlay = setInterval(() => {
                if (!useGameStore.getState().diceAnim.active) {
                    clearInterval(checkOverlay);
                    resolve();
                }
            }, 100);
        });
    }
};

export const actionMove = () => {
    const state = useGameStore.getState();
    const currentTile = state.mapData.find(t => t.id === state.players[state.turn].pos);

    if (!currentTile) {
        logMsg(`❌ 現在地のマス情報が見つかりません（pos: ${state.players[state.turn].pos}）`);
        return;
    }

    const validNextTiles = currentTile.next.filter(id => id !== state.constructionPos);
    if (validNextTiles.length === 1) executeMove(validNextTiles[0]);
    else if (validNextTiles.length > 1) { useGameStore.setState({ isBranchPicking: true, currentBranchOptions: validNextTiles }); logMsg("🛣️ 分岐点！進む道を選んでください。"); }
};

export const executeMove = (targetTileId) => {
    const state = useGameStore.getState();
    const tile = state.mapData.find(t => t.id === targetTileId);
    const cp = state.players[state.turn];
    const prevPos = cp.pos;
    
    let baseMoveCost = (state.isRainy && !cp.rainGear && cp.charType !== "athlete" && !cp.equip?.foldBike) ? 2 : 1;
    
    // 🥫 缶コレクターの帝王: 5缶以上の時、移動コストが0APになる（移動し放題）
    if (cp.charType === 'emperor' && cp.cans >= 5) {
        baseMoveCost = 0;
    }

    const penaltyCost = cp.nextMoveCostPenalty || 0;
    const moveCost = baseMoveCost + penaltyCost;

    state.updateCurrentPlayer(p => ({ 
        ap: Math.max(0, p.ap - moveCost), 
        pos: targetTileId, 
        rainGear: state.isRainy ? false : p.rainGear,
        nextMoveCostPenalty: 0 
    }));
    useGameStore.setState({ isBranchPicking: false, currentBranchOptions: [], isDashPicking: false });
    
    logMsg(`🚶 「${tile.name}」に移動。`); playSfx('move');
    
    state.incrementGameStat(cp.id, 'tiles', 1);
    if (!cp.isCPU) {
        useUserStore.getState().incrementStat('totalTilesMoved', 1);
    }

    if (cp.equip?.shoppingCart && Math.random() < 0.2) {
        const getCan = Math.random() < 0.5;
        state.updateCurrentPlayer(p => ({ cans: p.cans + (getCan ? 1 : 0), trash: p.trash + (getCan ? 0 : 1) }));
        logMsg(`🛒 カートに${getCan ? '空き缶' : 'ゴミ'}を放り込んだ！`);
        playSfx('coin');
    }

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
        
        if (tile.fieldCans > 0) {
            state.incrementGameStat(cp.id, 'cans', tile.fieldCans);
            if (!cp.isCPU) useUserStore.getState().incrementStat('totalCansCollected', tile.fieldCans);
        }
        if (tile.fieldTrash > 0) {
            state.incrementGameStat(cp.id, 'trash', tile.fieldTrash);
            if (!cp.isCPU) useUserStore.getState().incrementStat('totalTrashCollected', tile.fieldTrash);
        }
        
        useGameStore.setState(s => ({ mapData: s.mapData.map(t => t.id === targetTileId ? { ...t, fieldCans: 0, fieldTrash: 0 } : t) }));
        logMsg(`📦 ドロップアイテムを回収！`); playSfx('coin');
    }

    checkNpcCollision(cp.id);

    if (tile.type === "event" && !cp.isCPU) {
        if (Math.random() < 0.3) {
            useGameStore.setState({ storyActive: true, storyIndex: Math.floor(Math.random() * 4) });
        } else {
            const mgTypes = ['box', 'vend', 'scratch', 'hl', 'slot', 'oxo', 'tetris', 'fly', 'rat', 'drunk', 'rain', 'kashi', 'beg', 'music', 'nego'];
            useGameStore.setState({ mgActive: true, mgType: mgTypes[Math.floor(Math.random() * mgTypes.length)] });
        }
    }

    const trapIndex = state.traps?.findIndex(t => t.tileId === targetTileId);
    if (trapIndex !== undefined && trapIndex !== -1) {
        const trap = state.traps[trapIndex];
        if (trap.ownerId !== cp.id) {
            const trapNames = { police: '警察罠', pitfall: '落とし穴', jamming: '情報撹乱', bottle: '割れたビール瓶' };
            logMsg(`⚠️ <span style="color:#e74c3c">${cp.name}は罠（${trapNames[trap.type]}）を踏んでしまった！</span>`);
            playSfx('fail');
            
            if (trap.type === 'police') {
                state.updateCurrentPlayer(p => ({ penaltyAP: (p.penaltyAP || 0) + 2 }));
                state.addEventPopup(cp.id, "🚓", "警察罠", "次回AP-2", "bad");
            } else if (trap.type === 'pitfall') {
                const hospitalTile = state.mapData.find(t => t.type === 'center');
                const hospitalId = hospitalTile ? hospitalTile.id : (state.mapData[0]?.id ?? 0);
                const newHp = cp.hp - 20;
                if (newHp <= 0) {
                    logMsg(`☠️ 落とし穴のダメージで倒れた！`);
                    state.updateCurrentPlayer(p => ({ hp: 100, p: Math.floor(p.p*0.66), pos: hospitalId, deaths: (p.deaths || 0) + 1, respawnShield: 2 }));
                } else {
                    state.updateCurrentPlayer(p => ({ hp: newHp }));
                }
                state.addEventPopup(cp.id, "🕳️", "落とし穴", "20ダメージ", "damage");
            } else if (trap.type === 'jamming') {
                state.updateCurrentPlayer(p => {
                    const h = [...p.hand];
                    if (h.length > 0) h.splice(Math.floor(Math.random() * h.length), 1);
                    return { hand: h };
                });
                state.addEventPopup(cp.id, "📡", "情報撹乱", "手札1枚破棄", "bad");
            } else if (trap.type === 'bottle') {
                let dropText = "";
                if (Math.random() < 0.3 && cp.cans > 0) {
                    state.updateCurrentPlayer(p => ({ cans: p.cans - 1 }));
                    useGameStore.setState(s => ({ mapData: s.mapData.map(t => t.id === targetTileId ? { ...t, fieldCans: (t.fieldCans||0) + 1 } : t) }));
                    dropText = " 空き缶を1つ落とした！";
                }
                dealDamage(cp.id, 15, "割れたビール瓶");
                state.addEventPopup(cp.id, "🍾", "割れたビール瓶", `15ダメージ${dropText}`, "damage");
            }
            
            useGameStore.setState(prev => {
                const newTraps = [...prev.traps];
                newTraps.splice(trapIndex, 1);
                return { traps: newTraps };
            });
        }
    }
};

export const actionCan = () => { 
    const s = useGameStore.getState();
    const cp = s.players[s.turn]; 
    
    s.updateCurrentPlayer(p => ({ ap: p.ap - 1, cans: p.cans + 1 })); 
    useGameStore.setState(st => ({ canPickedThisTurn: st.canPickedThisTurn + 1 })); 
    
    s.incrementGameStat(cp.id, 'cans', 1);
    if (!cp.isCPU) {
        useUserStore.getState().incrementStat('totalCansCollected', 1);
    }
    
    playSfx('coin'); 
};

export const actionTrash = () => { 
    const s = useGameStore.getState();
    const cp = s.players[s.turn]; 

    // 🥫 缶コレクターの帝王は雨でも缶・ゴミを拾える特権を持つ
    if (s.isRainy && !cp.rainGear && cp.charType !== 'emperor') {
        s.showToast("雨具がないと漁れません！");
        return;
    }
    const cost = cp.equip?.shoes ? 1 : 2;
    
    s.updateCurrentPlayer(p => ({ ap: p.ap - cost }));
    
    let gain = Math.floor(Math.random() * 6);
    if (gain === 0) {
        if (cp.stealth) {
            s.updateCurrentPlayer(p => ({ stealth: false }));
            logMsg(`💨 ステルスで回避！`);
        } else if (cp.hasID) {
            s.updateCurrentPlayer(p => ({ hasID: false }));
            logMsg(`🔵 身分証でパトカーを回避！`);
        } else if (cp.charType === 'survivor') {
            logMsg(`🌿 サバイバーの勘で回避！`);
        } else {
            s.updateCurrentPlayer(p => ({ penaltyAP: (p.penaltyAP||0) + 2 }));
            logMsg(`<span style="color:#e74c3c">🚓 ゴミ漁り失敗！パトカーに見つかり次回AP-2！</span>`);
            playSfx('fail');
            s.addEventPopup(cp.id, "🚓", "ゴミ漁り失敗", "次回AP-2", "bad");
            return; 
        }
    }
    
    let nightBonus = s.isNight ? Math.floor(Math.random() * 3) : 0;
    gain += nightBonus;
    s.updateCurrentPlayer(p => ({ trash: p.trash + gain }));
    
    s.incrementGameStat(cp.id, 'trash', gain);
    if (!cp.isCPU) {
        useUserStore.getState().incrementStat('totalTrashCollected', gain);
    }
    
    logMsg(`🗑️ ゴミ${gain}個見つけた！${nightBonus > 0 ? `(夜ボーナス+${nightBonus})` : ''}`);
    playSfx('coin');
    s.addEventPopup(cp.id, "🗑️", `ゴミ${gain}個発見！`, nightBonus > 0 ? `夜+${nightBonus}` : "", "good");
};

export const actionJob = () => { 
    const s = useGameStore.getState();
    const cp = s.players[s.turn];
    const isSales = cp.charType === "sales";
    const win = Math.random() < (isSales ? 0.8 : 0.6); 
    const reward = isSales ? 14 : 12; 
    
    s.updateCurrentPlayer(p => ({ ap: p.ap - 3, p: p.p + (win ? reward : 0) })); 
    
    if (win) {
        playSfx('success');
        s.incrementGameStat(cp.id, 'jobs', 1);
    } else {
        playSfx('fail');
    }

    const msg = win ? `💼 バイト成功！${reward}P獲得！` : `💼 バイト失敗...`;
    logMsg(msg);
    s.addEventPopup(cp.id, win ? "💼" : "😞", win ? "バイト成功！" : "バイト失敗...", win ? `+${reward}P獲得` : "次回がんばろう", win ? "good" : "bad");

    useGameStore.setState({ jobResult: { active: true, isSuccess: win, points: win ? reward : 0 } });
};

export const getOccupyCost = (tileId) => {
    const s = useGameStore.getState();
    const currentOwner = s.territories[tileId];
    const cp = s.players[s.turn];
    
    let cost = 3;
    if (currentOwner !== undefined && currentOwner !== cp?.id) {
        const prevCost = s.territoryCosts?.[tileId] || 3;
        cost = Math.round(prevCost * 1.5);
    }
    return cost;
};

export const actionOccupy = () => { 
    const s = useGameStore.getState();
    const cp = s.players[s.turn];
    const currentTile = s.mapData.find(t => t.id === cp.pos); 

    if (!currentTile || currentTile.type !== 'normal') {
        logMsg(`❌ このマスは陣地にできません`);
        return;
    }

    let cost = getOccupyCost(cp.pos);

    if (cp.charType === 'musician') {
        cost = Math.max(1, cost - 2);
    }

    const currentOwner = s.territories[cp.pos];
    if (currentOwner !== undefined && currentOwner !== cp.id) {
        const ownerPlayer = s.players.find(p => p.id === currentOwner);
        if (ownerPlayer && ownerPlayer.charType === 'musician' && ownerPlayer.pos === cp.pos) {
            logMsg(`🎤 カリスマ発動！${ownerPlayer.name}が滞在中のためこの陣地は奪えません！`);
            useGameStore.getState().showToast("ミュージシャン滞在中の陣地は奪えません");
            return;
        }
    }

    if (cp.p >= cost) { 
        // 💴 億万長者: 支払額の10%キャッシュバック
        const cashback = (cp.charType === 'billionaire') ? Math.floor(cost * 0.1) : 0;
        const actualCost = cost - cashback;

        s.updateCurrentPlayer(p => ({ p: p.p - actualCost }));
        useGameStore.setState(st => ({ 
            territories: { ...st.territories, [cp.pos]: cp.id },
            territoryCosts: { ...(st.territoryCosts || {}), [cp.pos]: cost } 
        })); 
        s.incrementGameStat(cp.id, 'territories', 1);
        
        let msg = `🚩 ${cp.name}が${cost}P支払って陣地を占領しました！`;
        if (cashback > 0) msg += ` (成金還元で${cashback}P返ってきた！)`;
        logMsg(msg);
        playSfx('success'); 
    } else {
        logMsg(`❌ Pが足りません（必要: ${cost}P）`);
    }
};

export const actionExchange = () => { const s = useGameStore.getState(), cp = s.players[s.turn], tot = cp.cans * s.canPrice + cp.trash * s.trashPrice; s.updateCurrentPlayer(p => ({ p: p.p + tot, cans: 0, trash: 0 })); playSfx('coin'); };

export const actionManhole = () => { 
    const s = useGameStore.getState(), cp = s.players[s.turn], mh = s.mapData.filter(t => t.type === "manhole" && t.id !== cp.pos); 
    if (mh.length > 0) { 
        if (cp.equip?.foldBike && mh.length >= 2) {
            const shuffled = [...mh].sort(() => 0.5 - Math.random());
            useGameStore.setState({ isManholePicking: true, manholeOptions: [shuffled[0].id, shuffled[1].id] });
            s.updateCurrentPlayer(p => ({ ap: p.ap - 1 }));
            logMsg(`🚲 どこに出るか選んでください！`);
        } else {
            s.updateCurrentPlayer(p => ({ ap: p.ap - 1, pos: mh[Math.floor(Math.random() * mh.length)].id })); 
            playSfx('move'); checkNpcCollision(cp.id); 
        }
    } 
};

export const executeManhole = (tileId) => {
    const s = useGameStore.getState(), cp = s.players[s.turn];
    s.updateCurrentPlayer({ pos: tileId });
    useGameStore.setState({ isManholePicking: false, manholeOptions: [] });
    playSfx('move'); checkNpcCollision(cp.id);
    logMsg(`🚇 マンホールから出現した！`);
};

export const actionEndTurn = async () => {
    const state = useGameStore.getState();
    if (state._roundEndInProgress) return;

    try {
        const cp = state.players[state.turn];
        const { mapData, players } = state;
        
        // ☁️ 路上の仙人: AP繰り越し判定
        let carryOverAP = 0;
        if (cp.charType === 'sennin') {
            carryOverAP = Math.min(10, cp.ap);
            if (carryOverAP > 0) logMsg(`☁️ 仙人の無為自然！APを ${carryOverAP} 繰り越した。`);
        }

        // ☁️ 路上の仙人: 仙気スタックの計算
        // 今ターンの「移動マス数」と「カード使用数」が0ならスタック+1
        const stats = cp.gameStats || {};
        // 1ゲーム累計から増加分を引くのは難しいので、このターンのフラグとして簡易的に判定
        // 本来はactionMove等でフラグを立てるべきだが、ここでは仙人独自の「何もしなかった」を評価
        let newSenki = cp.senki || 0;
        if (cp.ap > 0 && cp.ap === state.lastDiceRollTotal) { // ダイス後1度も行動していない簡易判定
             newSenki = Math.min(5, newSenki + 1);
             logMsg(`☁️ 仙気が高まる... (現在: ${newSenki}スタック)`);
             if (newSenki === 5) {
                 // 5スタック効果: 他全員から5%徴収
                 players.forEach(op => {
                     if (op.id !== cp.id && op.p > 0) {
                         const tax = Math.ceil(op.p * 0.05);
                         state.updatePlayer(op.id, p => ({ p: p.p - tax }));
                         state.updateCurrentPlayer(p => ({ p: p.p + tax }));
                         logMsg(`🧘 悟りの境地！${op.name}から${tax}Pが仙人に流れた。`);
                     }
                 });
             } else if (newSenki === 3) {
                 state.updateCurrentPlayer(p => ({ hp: Math.min(100, p.hp + 20) }));
                 logMsg(`🧘 仙術による自己治癒！HPが20回復した。`);
             }
        } else {
             newSenki = 0; // アクションをした瞬間に全リセット
        }

        // 👼 路上の神様: 神の導きによる2P強制送金
        if (cp.godBlessingReceived) {
            const godPlayer = players.find(p => p.charType === 'god' && p.hp > 0);
            if (godPlayer) {
                const fee = Math.min(2, cp.p);
                state.updateCurrentPlayer(p => ({ p: p.p - fee, godBlessingReceived: false }));
                state.updatePlayer(godPlayer.id, p => ({ p: p.p + fee }));
                logMsg(`👼 神の導きの対価！神様に${fee}Pを捧げた。`);
            }
        }

        // 👼 路上の神様: 隣接している他人の獲得Pを吸収
        if (cp.charType === 'god') {
            players.forEach(op => {
                if (op.id !== cp.id && op.hp > 0 && getDistance(cp.pos, op.pos, mapData) <= 1) {
                    // ※本来はopが獲得した瞬間にやるべきだが、簡易的に毎ターン終了時1P吸う
                    if (op.p > 0) {
                        state.updatePlayer(op.id, p => ({ p: p.p - 1 }));
                        state.updateCurrentPlayer(p => ({ p: p.p + 1 }));
                        logMsg(`👼 隣人からの感謝！${op.name}から1Pを受け取った。`);
                    }
                }
            });
        }

        let newEquip = { ...cp.equip }, newTimer = { ...cp.equipTimer };
        if (newEquip.bicycle) { newTimer.bicycle = (newTimer.bicycle || 5) - 1; if (newTimer.bicycle <= 0) { newEquip.bicycle = false; logMsg(`🚲 自転車が壊れた！`); } }
        if (newEquip.cart) { newTimer.cart = (newTimer.cart || 5) - 1; if (newTimer.cart <= 0) { newEquip.cart = false; logMsg(`🛒 リヤカーが壊れた！`); } }
        if (newEquip.foldBike) { newTimer.foldBike = (newTimer.foldBike || 5) - 1; if (newTimer.foldBike <= 0) { newEquip.foldBike = false; logMsg(`🚲 折りたたみ自転車が壊れた！`); } }
        if (newEquip.shoppingCart) { newTimer.shoppingCart = (newTimer.shoppingCart || 5) - 1; if (newTimer.shoppingCart <= 0) { newEquip.shoppingCart = false; logMsg(`🛒 ショッピングカートが壊れた！`); } }

        state.updateCurrentPlayer(p => ({
            ap: carryOverAP, // AP繰り越し適用
            senki: newSenki, // 仙気スタック更新
            zazenTurns: Math.max(0, (p.zazenTurns || 0) - 1), // 仙人の座禅ターン減少
            stealth: false,
            ignoreNightVision: false,
            _katsuage: 0,
            equip: newEquip,
            equipTimer: newTimer,
            cannotMove: (p.zazenTurns > 0), // 座禅中は移動不可
            respawnShield: Math.max(0, (p.respawnShield || 0) - 1),
            drawCountThisTurn: 0 
        }));

        if (cp.statusEffects?.poison > 0) {
            logMsg(`☠️ <span style="color:#9b59b6">${cp.name}は毒の副作用を受けた！(残り${cp.statusEffects.poison}ターン)</span>`);
            const hospitalTile = state.mapData.find(t => t.type === 'center');
            const hospitalId = hospitalTile ? hospitalTile.id : (state.mapData[0]?.id ?? 0);
            
            const newHp = cp.hp - 8;
            if (newHp <= 0) {
                logMsg(`☠️ 毒により死亡...`);
                state.updateCurrentPlayer(p => ({ hp: 100, p: Math.floor(p.p*0.66), pos: hospitalId, deaths: (p.deaths || 0) + 1, respawnShield: 2 }));
            } else {
                state.updateCurrentPlayer(p => ({ hp: newHp }));
            }
            state.updateCurrentPlayer(p => ({
                statusEffects: { ...p.statusEffects, poison: p.statusEffects.poison - 1 }
            }));
            state.addEventPopup(cp.id, "☠️", "毒ダメージ", "8ダメージ", "damage");
            playSfx('hit');
        }
        
        useGameStore.setState({ 
            isBranchPicking: false, isDashPicking: false, 
            isSalesVisiting: false, salesTargetId: null, npcSelectActive: false,
            mgActive: false, storyActive: false, turnBannerActive: false, npcMovePick: null,
            isTrapScanActive: false, isTrapPicking: false,
            isRecyclePicking: false, isFakeInfoPicking: false, isSubwayPicking: false, isManholePicking: false,
            fakeInfoTargets: [], manholeOptions: []
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