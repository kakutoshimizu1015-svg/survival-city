import { useGameStore } from '../store/useGameStore';
import { actionRollDice, executeMove, actionCan, actionTrash, actionJob, actionOccupy, actionExchange, actionEndTurn, logMsg } from './actions';
import { deckData } from '../constants/cards';
import { actionUseCard, actionDiscardCard } from './cards';
import { dealDamage, getDistance } from './combat';
import { checkNpcCollision } from './npc';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ============================================================
// ユーティリティ: スコア・経路・状況評価
// ============================================================

const calcScore = (player, state) => {
    const terrScore = Object.entries(state.territories)
        .filter(([, ownerId]) => ownerId === player.id)
        .reduce((sum, [tileId]) => {
            const tile = state.mapData.find(t => t.id === parseInt(tileId));
            if (!tile) return sum;
            if (tile.area === 'luxury') return sum + 10;
            if (tile.area === 'commercial') return sum + 6;
            return sum + 3;
        }, 0);
    const resourceScore = player.cans * state.canPrice + player.trash * state.trashPrice;
    const combatScore = (player.kills || 0) * 3 - (player.deaths || 0) * 5;
    return player.p * 2 + terrScore + resourceScore + combatScore;
};

const bfsNearest = (fromPos, targetTypes, mapData, maxSteps = 14) => {
    const queue = [{ pos: fromPos, path: [] }];
    const visited = new Set([fromPos]);
    while (queue.length > 0) {
        const { pos, path } = queue.shift();
        const tile = mapData.find(t => t.id === pos);
        if (!tile) continue;
        if (path.length > 0 && targetTypes.includes(tile.type)) {
            return { tileId: pos, path, steps: path.length };
        }
        if (path.length >= maxSteps) continue;
        for (const nextId of (tile.next || [])) {
            if (!visited.has(nextId)) {
                visited.add(nextId);
                queue.push({ pos: nextId, path: [...path, nextId] });
            }
        }
    }
    return null;
};

const safeMoves = (candidates, state, cp) => {
    const hasDoll = cp.equip?.doll;
    const hasStealth = cp.stealth;
    if (hasDoll || hasStealth) return candidates;
    const danger = new Set([state.policePos, state.yakuzaPos, state.loansharkPos, state.unclePos]);
    const safe = candidates.filter(id => !danger.has(id));
    return safe.length > 0 ? safe : candidates;
};

const tileValue = (tile) => {
    if (!tile) return 0;
    if (tile.area === 'luxury') return 10;
    if (tile.area === 'commercial') return 6;
    return 3;
};

// 難易度とモードに応じた攻撃の閾値（低いほど攻撃しやすい）
const getAttackThreshold = (mode, difficulty) => {
    const thresholds = {
        normal: {
            aggressive: 0.25, endgame_chase: 0.30, night_ambush: 0.20,
            balanced: 0.55, defensive: 0.80, endgame_lead: 0.90, comeback: 0.30, default: 0.55
        },
        hard: {
            aggressive: 0.10, endgame_chase: 0.15, night_ambush: 0.05,
            balanced: 0.35, defensive: 0.65, endgame_lead: 0.75, comeback: 0.15, default: 0.35
        }
    };
    const map = thresholds[difficulty] || thresholds.normal;
    return map[mode] ?? map.default ?? 0.55;
};

// 12種類の戦略モード判定
const getMode = (cp, state, difficulty = 'normal') => {
    const myScore = calcScore(cp, state);
    const livePlayers = state.players.filter(p => p.hp > 0);
    const scores = livePlayers
        .map(p => ({ id: p.id, score: calcScore(p, state) }))
        .sort((a, b) => b.score - a.score);
    const myRank = scores.findIndex(s => s.id === cp.id);
    const topScore = scores[0]?.score || 0;
    const gap = topScore - myScore;
    const remaining = state.maxRounds - state.roundCount;
    const myTerrCount = Object.values(state.territories).filter(id => id === cp.id).length;
    const terrMainCost = myTerrCount * 2;
    const roundPhase = state.roundCount <= 5 ? 'early' : state.roundCount <= 15 ? 'mid' : 'late';
    const isRainy = state.isRainy && !cp.rainGear && cp.charType !== 'athlete';

    if (cp.hp < 25) return 'crisis_hp';
    if (cp.p < 5 && cp.cans === 0 && cp.trash === 0) return 'crisis_money';
    if (cp.cans + cp.trash >= 6) return 'resource_rush';
    if (isRainy && cp.ap < 6) return 'rainy_passive';
    
    const nightHpThresh = difficulty === 'hard' ? 80 : 65;
    if (state.isNight && cp.hp > nightHpThresh && myRank <= 1) return 'night_ambush';
    
    const maintRound = state.roundCount % 3 === 2;
    if (maintRound && myTerrCount > 0 && cp.p < terrMainCost) return 'maintenance_alert';
    
    if (remaining <= 5 && myRank === 0) return 'endgame_lead';
    if (remaining <= 5 && myRank > 0) return 'endgame_chase';
    
    const aggrThresh = difficulty === 'hard' ? 20 : 35;
    if (myRank === 0 && gap < 20) return 'defensive';
    if (myRank === scores.length - 1 && gap >= 50) return 'comeback';
    if (gap >= aggrThresh) return 'aggressive';
    if (roundPhase === 'mid' && cp.p >= 10 && myTerrCount < 3) return 'territory_rush';
    
    return 'balanced';
};

// ============================================================
// EASY難易度専用ルーチン
// ============================================================
const runCpuTurnEasy = async (turnId) => {
    if (!useGameStore.getState().diceRolled) {
        await actionRollDice(true);
        await sleep(900);
    }
    
    let maxLoops = 20;
    while (maxLoops-- > 0) {
        const state = useGameStore.getState();
        const cp = state.players[turnId];
        
        if (!cp || cp.ap <= 0 || state.turn !== cp.id || state.gameOver) break;
        
        const tile = state.mapData.find(t => t.id === cp.pos);
        if (!tile) break;

        if (state.mgActive) {
            await sleep(900);
            useGameStore.setState({ mgResult: Math.random() > 0.5 ? '大成功！' : '失敗...', mgActive: false });
            await sleep(400);
            continue;
        }

        let acted = false;

        // 換金 (資源があれば確定)
        if (tile.type === 'exchange' && (cp.cans > 0 || cp.trash > 0)) {
            actionExchange();
            acted = true;
        }

        // 缶拾い (雨以外、40%の確率でスルーする)
        if (!acted && tile.type === 'can' && cp.ap >= 1 && !state.isRainy && state.canPickedThisTurn < 3 && Math.random() > 0.6) {
            actionCan();
            acted = true;
        }

        // 病院は意図的に回復しない(スルー)
        if (!acted && tile.type === 'center') {
            acted = false; 
        }

        // 移動処理 (安全なランダム移動)
        if (!acted) {
            const moveCost = (state.isRainy && !cp.rainGear && cp.charType !== 'athlete') ? 2 : 1;
            const validNext = tile.next.filter(id => id !== state.constructionPos);
            
            if (validNext.length > 0 && cp.ap >= moveCost) {
                const nextId = validNext[Math.floor(Math.random() * validNext.length)];
                executeMove(nextId);
                acted = true;
            } else {
                break;
            }
        }
        
        if (!acted) break;
        await sleep(900);
    }
    
    await actionEndTurn();
    useGameStore.setState({ cpuActing: false });
};

// ============================================================
// メインCPUターン関数 (NORMAL / HARD)
// ============================================================
export const runCpuTurn = async () => {
    let state = useGameStore.getState();
    if (state.cpuActing || state.gameOver || state.players.length === 0) return;

    useGameStore.setState({ cpuActing: true });
    const turnId = state.turn;

    try {
        while (useGameStore.getState()._roundEndInProgress) {
            await sleep(500);
        }

        await sleep(1200);

        state = useGameStore.getState();
        let cp = state.players[turnId];
        if (!cp || !cp.isCPU) return;

        const difficulty = cp.cpuDifficulty || 'normal';

        // EASY分岐
        if (difficulty === 'easy') {
            await runCpuTurnEasy(turnId);
            return;
        }

        // ── 手札超過：武器以外を優先して捨てる ──────────────────────────────
        while (cp.hand && cp.maxHand !== undefined && cp.hand.length > cp.maxHand) {
            const discardIdx = cp.hand.findIndex(id => {
                const d = deckData.find(x => x.id === id);
                return d?.type !== 'weapon';
            });
            actionDiscardCard(discardIdx >= 0 ? discardIdx : 0);
            await sleep(300);
            cp = useGameStore.getState().players[turnId];
        }

        // ── ミニゲーム消化 ───────────────────────────────────────────────────
        if (state.mgActive) {
            await sleep(900);
            useGameStore.setState({ mgResult: Math.random() > 0.5 ? '大成功！' : '失敗...', mgActive: false });
            await sleep(400);
            cp = useGameStore.getState().players[turnId];
        }

        // ── サイコロを振る ───────────────────────────────────────────────────
        if (!useGameStore.getState().diceRolled) {
            await actionRollDice(true);
            await sleep(900);
        }

        let maxLoops = 35;

        // ── メインアクションループ ───────────────────────────────────────────
        while (maxLoops-- > 0) {
            state = useGameStore.getState();
            cp = state.players[turnId];

            if (state.gameOver || cp.ap <= 0 || state.turn !== cp.id || cp.cannotMove || state.mgActive || state.storyActive || state.isBranchPicking) break;

            const currentTile = state.mapData.find(t => t.id === cp.pos);
            if (!currentTile) break;

            const validNextTiles = currentTile.next.filter(id => id !== state.constructionPos);
            const moveCost = (state.isRainy && !cp.rainGear && cp.charType !== 'athlete') ? 2 : 1;
            const canMove = cp.ap >= moveCost && validNextTiles.length > 0;

            const mode = getMode(cp, state, difficulty);
            const livePlayers = state.players.filter(p => p.hp > 0 && p.id !== cp.id);
            const leader = [...livePlayers].sort((a, b) => calcScore(b, state) - calcScore(a, state))[0];
            const othersOnTile = livePlayers.filter(p => p.pos === cp.pos);

            let acted = false;

            // ======================================================
            // A. 緊急回復（HP < 40 または crisis_hp モード）
            // ======================================================
            if (!acted && (cp.hp < 40 || mode === 'crisis_hp')) {
                const healIdx = cp.hand.findIndex(id => {
                    const cd = deckData.find(d => d.id === id);
                    return cd?.type === 'heal' || (cd?.ap === 0 && cd?.effect?.includes?.('hp'));
                });
                if (healIdx >= 0) {
                    logMsg(`💊 ${cp.name}は回復カードを使用！`);
                    actionUseCard(healIdx, cp.hand[healIdx]);
                    acted = true;
                }
            }

            // ======================================================
            // B. 換金所にいてリソースがある → 即換金
            // ======================================================
            if (!acted && currentTile.type === 'exchange' && (cp.cans > 0 || cp.trash > 0)) {
                actionExchange();
                acted = true;
            }

            // ======================================================
            // C. キャラクター固有スキルの発動
            // ======================================================
            if (!acted && cp.ap >= 2) {
                // アスリート (3AP: 3マス先ジャンプ)
                if (cp.charType === 'athlete' && cp.ap >= 3 && (mode === 'aggressive' || cp.ap > 5)) {
                    const getTilesExactSteps = (start, steps) => {
                        let currentSet = new Set([start]);
                        for(let i=0; i<steps; i++) {
                            let nextSet = new Set();
                            currentSet.forEach(pos => {
                                const t = state.mapData.find(x => x.id === pos);
                                if(t) t.next.forEach(n => nextSet.add(n));
                            });
                            currentSet = nextSet;
                        }
                        return Array.from(currentSet);
                    };
                    const exact3 = getTilesExactSteps(cp.pos, 3);
                    const dangerPos = [state.policePos, state.yakuzaPos, state.loansharkPos, state.unclePos];
                    
                    const scoredTargets = exact3.map(tileId => {
                        const tile = state.mapData.find(t => t.id === tileId);
                        let score = 0;
                        if (tile.type === 'exchange' && (cp.cans > 0 || cp.trash > 0)) score += 20;
                        if (tile.type === 'can' && !state.isRainy) score += 8;
                        if (tile.type === 'trash' && !state.isRainy) score += 6;
                        if (tile.type === 'job' && cp.p < 15) score += 10;
                        if (tile.type === 'center' && cp.hp < 60) score += 15;
                        if (dangerPos.includes(tileId)) score -= 20;
                        if ((mode === 'aggressive' || mode === 'endgame_chase') && leader) {
                            score += Math.max(0, 10 - getDistance(tileId, leader.pos, state.mapData));
                        }
                        if (mode === 'night_ambush' && state.isNight) {
                            const enemyNear = state.players.some(p => p.id !== cp.id && p.hp > 0 && getDistance(tileId, p.pos, state.mapData) <= 1);
                            if (enemyNear) score += 12;
                        }
                        return { tileId, score };
                    });

                    const best = scoredTargets.sort((a, b) => b.score - a.score)[0];
                    if (best && best.score > 0) {
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 3, pos: best.tileId }));
                        logMsg(`🏃 ${cp.name}が【疾風ダッシュ】！(評価:${best.score})`);
                        checkNpcCollision(cp.id);
                        acted = true;
                    }
                }
                // 営業 (2AP: カード押し付け)
                else if (cp.charType === 'sales' && cp.ap >= 2 && othersOnTile.length > 0 && cp.hand.length > 0) {
                    const target = othersOnTile.sort((a, b) => b.p - a.p)[0];
                    if (target && target.p >= 3 && target.hand.length < (target.maxHand || 7)) {
                        const pushPriority = [12, 13, 3, 4, 14, 9, 10, 11];
                        let sellIdx = -1;
                        for (const cardId of pushPriority) {
                            const idx = cp.hand.indexOf(cardId);
                            if (idx >= 0) { sellIdx = idx; break; }
                        }
                        if (sellIdx < 0) sellIdx = cp.hand.findIndex(id => { const d = deckData.find(x => x.id === id); return d?.type !== 'weapon' && d?.type !== 'equip' && d?.type !== 'reaction'; });
                        if (sellIdx < 0) sellIdx = cp.hand.findIndex(id => deckData.find(d => d.id === id)?.type !== 'weapon');
                        
                        if (sellIdx >= 0) {
                            const cardToGive = cp.hand[sellIdx];
                            const fee = Math.min(3, Math.max(0, target.p));
                            const newHand = [...cp.hand];
                            newHand.splice(sellIdx, 1);
                            useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p + fee, hand: newHand }));
                            useGameStore.getState().updatePlayer(target.id, p => ({ p: Math.max(0, p.p - fee), hand: [...p.hand, cardToGive] }));
                            logMsg(`💼 ${cp.name}が${target.name}に【訪問販売】！${fee}P獲得！`);
                            acted = true;
                        }
                    }
                }
                // サバイバー (2AP: 野宿)
                else if (cp.charType === 'survivor' && cp.ap >= 2) {
                    const enemyHasWeapon = state.players.some(p => p.id !== cp.id && p.hp > 0 && getDistance(cp.pos, p.pos, state.mapData) <= 2 && p.hand.some(id => deckData.find(d => d.id === id)?.type === 'weapon'));
                    const shouldCamp = (cp.hp <= 70) || (cp.hp <= 85 && mode === 'crisis_hp') || (cp.hp <= 80 && state.isNight) || (cp.hp <= 85 && remaining <= 3) || (cp.hp <= 85 && enemyHasWeapon);
                    if (shouldCamp && cp.hp < 100) {
                        const healed = Math.min(15, 100 - cp.hp);
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 2, hp: Math.min(100, p.hp + 15) }));
                        logMsg(`🏕️ ${cp.name}が【野宿】！HP+${healed}`);
                        acted = true;
                    }
                }
                // ヤンキー (2AP: 殴る)
                else if (cp.charType === 'yankee' && cp.ap >= 2 && othersOnTile.length > 0) {
                    const killTarget = othersOnTile.find(p => p.hp <= 10);
                    const richTarget = othersOnTile.filter(p => p.p > 5).sort((a, b) => b.p - a.p)[0];
                    const weakTarget = othersOnTile.sort((a, b) => a.hp - b.hp)[0];
                    const target = killTarget || richTarget || weakTarget;
                    if (target) {
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 2 }));
                        dealDamage(target.id, 10, "殴る", cp.id);
                        if (killTarget) logMsg(`👊 ${cp.name}が確殺狙いで${target.name}を殴った！`);
                        else if (richTarget) logMsg(`👊 ${cp.name}がP目当てで${target.name}を殴った！`);
                        else logMsg(`👊 ${cp.name}が${target.name}を殴った！`);
                        acted = true;
                    }
                }
                // ハッカー (3AP: ハッキング)
                else if (cp.charType === 'hacker' && cp.ap >= 3 && cp.p >= 4 && cp.hand.length < (cp.maxHand || 9)) {
                    let wantPool = [6, 7, 15, 16, 24, 25, 26, 27, 28, 29];
                    if (mode === 'crisis_hp' && cp.hp < 50) wantPool = [30, 31, 32, 33, 34];
                    else if (['night_ambush', 'aggressive', 'endgame_chase'].includes(mode)) wantPool = [17, 18, 19, 20, 21, 22, 23, 12, 13];
                    else if (mode === 'comeback') wantPool = [12, 13, 35, 36, 37];
                    else if (['rainy_passive', 'defensive', 'endgame_lead'].includes(mode)) wantPool = [35, 36, 37, 27, 28, 29, 24, 25, 26];
                    else if (['maintenance_alert', 'crisis_money'].includes(mode)) wantPool = [6, 7, 10, 11, 15, 16];

                    const deduped = wantPool.filter(id => !cp.hand.includes(id));
                    const finalPool = deduped.length > 0 ? deduped : wantPool;
                    const cardId = finalPool[Math.floor(Math.random() * finalPool.length)];
                    const handRatio = cp.hand.length / (cp.maxHand || 9);
                    const shouldHack = handRatio < 0.8 || (mode === 'aggressive' && Math.random() > 0.3) || mode === 'night_ambush';

                    if (shouldHack) {
                        const cardName = deckData.find(d => d.id === cardId)?.name;
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 3, p: p.p - 4, hand: [...p.hand, cardId] }));
                        logMsg(`💻 ${cp.name}が【遠隔ハッキング】で「${cardName}」を入手！(-4P)`);
                        acted = true;
                    }
                }
                // ミュージシャン (4AP: 路上ライブ)
                else if (cp.charType === 'musician' && cp.ap >= 4) {
                    const nearby = state.players.filter(p => p.id !== cp.id && p.hp > 0 && getDistance(cp.pos, p.pos, state.mapData) <= 2 && p.pos !== cp.pos);
                    const expectedIncome = nearby.length * 5; // 基本3P + パッシブ2P
                    const shouldConcert = nearby.length >= 2 && expectedIncome >= 8 && !['crisis_hp', 'crisis_money', 'rainy_passive'].includes(mode);
                    
                    if (shouldConcert) {
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 4 }));
                        let pulled = [];
                        nearby.forEach(op => {
                            useGameStore.getState().updatePlayer(op.id, { pos: cp.pos });
                            useGameStore.getState().updateCurrentPlayer(p => ({ p: p.p + 3 })); // 投げ銭パッシブ分
                            pulled.push(op.name);
                        });
                        useGameStore.getState().updateCurrentPlayer(p => ({ p: p.p + pulled.length * 2 })); // スキル本体分
                        logMsg(`🎸 ${cp.name}が【路上ライブ】！${pulled.join('と')}を引き寄せた！`);
                        acted = true;
                    }
                }
                // 医者 (2AP: 闇診療)
                else if (cp.charType === 'doctor' && cp.ap >= 2 && othersOnTile.length > 0) {
                    const bestTarget = othersOnTile.filter(p => p.p >= 3 && p.hp <= 70)
                        .sort((a, b) => (Math.min(5, b.p)*2 + (70-b.hp)*0.1) - (Math.min(5, a.p)*2 + (70-a.hp)*0.1))[0];
                    const doctorReady = cp.hp >= 50 || mode === 'crisis_money' || (cp.hp >= 35 && remaining <= 5);

                    if (bestTarget && doctorReady) {
                        const healed = Math.min(30, 100 - bestTarget.hp);
                        const fee = Math.min(5, Math.max(0, bestTarget.p));
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p + fee }));
                        useGameStore.getState().updatePlayer(bestTarget.id, p => ({ hp: Math.min(100, p.hp + 30), p: Math.max(0, p.p - fee) }));
                        logMsg(`💉 ${cp.name}が${bestTarget.name}に【闇診療】！(HP+${healed} / ${fee}P徴収)`);
                        acted = true;
                    }
                }
                // ギャンブラー (2AP: イカサマ)
                else if (cp.charType === 'gambler' && cp.ap >= 2 && othersOnTile.length > 0) {
                    const gamblerTargets = othersOnTile.filter(p => p.p >= 5);
                    if (gamblerTargets.length > 0) {
                        const target = gamblerTargets.sort((a, b) => b.p - a.p)[0];
                        const shouldGamble = mode === 'comeback' || mode === 'aggressive' || mode === 'endgame_chase' || (cp.p < target.p && Math.random() > 0.3) || (cp.p < 10 && Math.random() > 0.2);
                        if (shouldGamble && !['defensive', 'crisis_hp', 'rainy_passive'].includes(mode)) {
                            useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 2 }));
                            const myRoll = Math.floor(Math.random() * 6) + 1;
                            const enemyRoll = Math.floor(Math.random() * 6) + 1;
                            if (myRoll > enemyRoll) {
                                const gain = Math.min(5, target.p);
                                useGameStore.getState().updateCurrentPlayer(p => ({ p: p.p + gain }));
                                useGameStore.getState().updatePlayer(target.id, p => ({ p: p.p - gain }));
                                logMsg(`🎲 ${cp.name}(${myRoll}) > ${target.name}(${enemyRoll}) 勝利！${gain}P奪取！`);
                            } else {
                                const loss = Math.min(5, cp.p);
                                useGameStore.getState().updateCurrentPlayer(p => ({ p: Math.max(0, p.p - loss) }));
                                useGameStore.getState().updatePlayer(target.id, p => ({ p: p.p + loss }));
                                logMsg(`🎲 ${cp.name}(${myRoll}) <= ${target.name}(${enemyRoll}) 敗北...${loss}P支払い`);
                            }
                            acted = true;
                        }
                    }
                }
                // 探偵 (3AP: 情報操作)
                else if (cp.charType === 'detective' && cp.ap >= 3 && leader && !cp.detectiveCd) {
                    const npcOptions = [];
                    if (state.horrorMode && state.truckPos !== -1) npcOptions.push({ npc: 'truck', priority: 100, target: leader, label: 'ひき逃げトラック' });
                    if (state.yakuzaHp > 0 && state.yakuzaPos !== 999) npcOptions.push({ npc: 'yakuza', priority: 80, target: leader, label: 'ヤクザ' });
                    
                    if (state.loansharkHp > 0 && state.loansharkPos !== 999) {
                        const richest = state.players.filter(p => p.id !== cp.id && p.hp > 0).sort((a, b) => b.p - a.p)[0];
                        if (richest) npcOptions.push({ npc: 'loanshark', priority: 70, target: richest, label: `闇金 (${richest.name}へ)` });
                    }
                    if (state.policeHp > 0 && state.policePos !== 999) {
                        const rank2 = state.players.filter(p => p.id !== cp.id && p.hp > 0).sort((a, b) => calcScore(b, state) - calcScore(a, state))[1];
                        const polTarget = rank2 || leader;
                        npcOptions.push({ npc: 'police', priority: 50, target: polTarget, label: `警察 (${polTarget.name}へ)` });
                    }
                    
                    npcOptions.sort((a, b) => b.priority - a.priority);
                    const best = npcOptions[0];
                    if (best && best.target) {
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 3, detectiveCd: 3 }));
                        if (best.npc === 'truck') useGameStore.setState({ truckPos: best.target.pos });
                        else {
                            useGameStore.setState({ [`${best.npc}Pos`]: best.target.pos });
                            checkNpcCollision(best.target.id);
                        }
                        logMsg(`🕵️ ${cp.name}が【情報操作】！${best.label}を誘導した！`);
                        acted = true;
                    }
                }
            }

            // ======================================================
            // D. 逆転カード（下剋上・大暴落）
            // ======================================================
            if (!acted && ['comeback', 'aggressive', 'endgame_chase'].includes(mode)) {
                const powerIdx = cp.hand.findIndex(id => {
                    const cd = deckData.find(d => d.id === id);
                    return cd && ['下剋上', '大暴落'].includes(cd.name) && (cd.ap ?? 0) <= cp.ap;
                });
                if (powerIdx >= 0) {
                    actionUseCard(powerIdx, cp.hand[powerIdx]);
                    acted = true;
                }
            }

            // ======================================================
            // E. 武器攻撃
            // ======================================================
            if (!acted && cp.ap >= 2) {
                const weaponCards = (cp.hand || [])
                    .map((id, idx) => ({ id, idx, data: deckData.find(d => d.id === id) }))
                    .filter(c => c.data?.type === 'weapon');

                const attackThresh = getAttackThreshold(mode, difficulty);

                if (weaponCards.length > 0 && Math.random() > attackThresh) {
                    const wc = weaponCards[0];
                    const inRange = state.players.filter(op =>
                        op.id !== cp.id && op.hp > 0 &&
                        getDistance(cp.pos, op.pos, state.mapData) <= wc.data.range
                    );
                    const target = inRange.find(p => p.id === leader?.id) || inRange.sort((a, b) => a.hp - b.hp)[0];

                    if (target) {
                        const newHand = [...cp.hand];
                        newHand.splice(wc.idx, 1);
                        useGameStore.getState().updateCurrentPlayer(() => ({ ap: cp.ap - 2, hand: newHand }));
                        if (wc.data.aoe) {
                            inRange.forEach(t => dealDamage(t.id, wc.data.dmg, wc.data.name, cp.id));
                        } else {
                            dealDamage(target.id, wc.data.dmg, wc.data.name, cp.id);
                        }
                        acted = true;
                    }
                }
            }

            // ======================================================
            // F. 陣地占領
            // ======================================================
            if (!acted && state.territories[cp.pos] !== cp.id && cp.pos !== state.unclePos) {
                const occupiable = ['normal', 'can', 'trash', 'job', 'exchange', 'shelter'].includes(currentTile.type);
                if (occupiable) {
                    const val = tileValue(currentTile);
                    const isEnemy = state.territories[cp.pos] !== undefined;
                    const cost = isEnemy ? Math.round((state.territoryCosts?.[cp.pos] || val) * 1.5) : val;
                    const wantOccupy = mode === 'territory_rush' ? val >= 3 : mode === 'defensive' ? val >= 6 : val >= 3;
                    
                    if (wantOccupy && cp.p >= cost + 5) {
                        actionOccupy();
                        acted = true;
                    }
                }
            }

            // ======================================================
            // G. バイト
            // ======================================================
            if (!acted && currentTile.type === 'job' && cp.ap >= 3 && (cp.p < 20 || mode === 'maintenance_alert' || mode === 'crisis_money')) {
                actionJob();
                acted = true;
            }

            // ======================================================
            // H. 缶拾い
            // ======================================================
            if (!acted && currentTile.type === 'can' && cp.ap >= 1 && state.canPickedThisTurn < 3 && !state.isRainy && cp.pos !== state.animalPos) {
                const nearExchange = bfsNearest(cp.pos, ['exchange'], state.mapData, 8);
                if (nearExchange || cp.cans < 4) {
                    actionCan();
                    acted = true;
                }
            }

            // ======================================================
            // I. ゴミ漁り
            // ======================================================
            if (!acted && currentTile.type === 'trash' && !state.isRainy && cp.pos !== state.animalPos) {
                const trashCost = cp.equip?.shoes ? 1 : 2;
                if (cp.ap >= trashCost) {
                    const isSafe = cp.charType === 'survivor' || cp.stealth || cp.hasID;
                    if (isSafe || Math.random() > 0.30) {
                        actionTrash();
                        acted = true;
                    }
                }
            }

            // ======================================================
            // J. ショップ購入
            // ======================================================
            if (!acted && currentTile.type === 'shop' && cp.hand.length < (cp.maxHand || 7) && cp.p >= 4) {
                const shopStock = state.shopStock || [];
                let wantType = 'buff';
                if (cp.hp < 50) wantType = 'heal';
                if (['aggressive', 'night_ambush', 'endgame_chase'].includes(mode)) wantType = 'weapon';
                if (['defensive', 'endgame_lead', 'rainy_passive'].includes(mode)) wantType = 'reaction';

                const pick = shopStock.find(s => {
                    const cd = deckData.find(d => d.id === s.id);
                    return cd?.type === wantType && cp.p >= (s.price ?? 4);
                }) || shopStock.find(s => cp.p >= (s.price ?? 4));

                if (pick) {
                    const cd = deckData.find(d => d.id === pick.id);
                    const price = pick.price ?? 4;
                    useGameStore.getState().updateCurrentPlayer(p => ({
                        p: p.p - price,
                        hand: [...p.hand, pick.id]
                    }));
                    logMsg(`🛒 ${cp.name}が「${cd?.name}」を購入！(-${price}P)`);
                    acted = true;
                }
            }

            // ======================================================
            // K. 移動（BFS でモードに応じた目的地を決定）
            // ======================================================
            if (!acted && canMove) {
                const hasResources = cp.cans > 3 || cp.trash > 3;
                const needsHealing = cp.hp < 50;
                const needsMoney = cp.p < 10;
                
                let goalTypes = [];
                switch (mode) {
                    case 'crisis_hp': goalTypes = ['center']; break;
                    case 'crisis_money': goalTypes = ['job', 'can', 'trash', 'exchange']; break;
                    case 'resource_rush': goalTypes = ['exchange']; break;
                    case 'rainy_passive': goalTypes = ['normal', 'exchange', 'shop']; break;
                    case 'night_ambush': 
                        if (leader) { const lt = state.mapData.find(t => t.id === leader.pos); if (lt) goalTypes.push(lt.type); }
                        goalTypes.push('normal'); break;
                    case 'maintenance_alert': goalTypes = ['job', 'can', 'exchange', 'trash']; break;
                    case 'endgame_lead': goalTypes = ['exchange', 'normal']; break;
                    case 'endgame_chase':
                        if (leader) { const lt = state.mapData.find(t => t.id === leader.pos); if (lt) goalTypes.push(lt.type); }
                        goalTypes.push('exchange', 'job', 'can'); break;
                    case 'defensive': goalTypes = ['exchange', 'normal']; break;
                    case 'comeback':
                        if (leader) { const lt = state.mapData.find(t => t.id === leader.pos); if (lt) goalTypes.push(lt.type); }
                        goalTypes.push('shop'); break;
                    case 'territory_rush': goalTypes = ['normal', 'can', 'trash', 'job']; break;
                    default: // balanced + aggressive
                        if (needsHealing) goalTypes.push('center');
                        if (hasResources) goalTypes.push('exchange');
                        if (needsMoney) goalTypes.push('job');
                        goalTypes.push('can', 'trash', 'job', 'exchange', 'normal');
                }
                
                // 特殊行動キャラの目的地追加
                if (cp.charType === 'yankee' && ['balanced', 'territory_rush'].includes(mode)) {
                    const crowdMap = {};
                    state.players.forEach(p => { if (p.id !== cp.id && p.hp > 0 && p.p > 0) crowdMap[p.pos] = (crowdMap[p.pos] || 0) + 1; });
                    const crowdedPos = Object.entries(crowdMap).sort((a, b) => b[1] - a[1])[0]?.[0];
                    if (crowdedPos) { const t = state.mapData.find(x => x.id === parseInt(crowdedPos)); if (t) goalTypes.unshift(t.type); }
                }
                if (cp.charType === 'musician') {
                    const hubTile = state.mapData.filter(t => (t.next || []).length >= 3).sort((a, b) => b.next.length - a.next.length)[0];
                    if (hubTile) goalTypes.unshift(hubTile.type);
                }
                if (cp.charType === 'detective' && mode === 'territory_rush') {
                    const crossroads = state.mapData.filter(t => !state.territories[t.id] && (t.next || []).length >= 4).map(t => t.type);
                    if (crossroads.length > 0) goalTypes.unshift(...crossroads);
                }

                const safeNext = safeMoves(validNextTiles, state, cp);
                const found = bfsNearest(cp.pos, goalTypes, state.mapData, 12);

                let targetId = null;
                if (found && found.path.length > 0) {
                    const firstStep = found.path[0];
                    targetId = safeNext.includes(firstStep) ? firstStep : safeNext[Math.floor(Math.random() * safeNext.length)];
                } else {
                    targetId = safeNext[Math.floor(Math.random() * safeNext.length)];
                }

                if (targetId != null) {
                    executeMove(targetId);
                    acted = true;
                }
            }

            if (!acted) break;

            await sleep(700);

            state = useGameStore.getState();
            if (state.mgActive) {
                await sleep(800);
                useGameStore.setState({ mgResult: Math.random() > 0.5 ? '大成功！' : '失敗...', mgActive: false });
                await sleep(400);
            }
            if (state.storyActive) {
                useGameStore.setState({ storyActive: false });
                useGameStore.getState().updateCurrentPlayer(p => ({ p: p.p + 5 }));
                logMsg(`📖 ${cp.name}はイベントで5P獲得した！`);
                await sleep(400);
            }
        }

    } catch (e) {
        console.error('CPU Turn Error:', e);
    } finally {
        const finalState = useGameStore.getState();
        if (!finalState.gameOver && finalState.players[finalState.turn]?.id === finalState.players[turnId]?.id) {
            await actionEndTurn();
        }
        useGameStore.setState({ cpuActing: false });
    }
};