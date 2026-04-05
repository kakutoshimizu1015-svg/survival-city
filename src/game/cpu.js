import { useGameStore } from '../store/useGameStore';
import { actionRollDice, executeMove, actionCan, actionTrash, actionJob, actionOccupy, actionExchange, actionEndTurn, logMsg } from './actions';
import { deckData } from '../constants/cards';
import { actionUseCard, actionDiscardCard } from './cards';
import { dealDamage, getDistance } from './combat';
import { checkNpcCollision } from './npc'; // ▼ スキル移動後のNPC判定用に追加

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ============================================================
// ユーティリティ: スコア・経路・状況評価
// ============================================================

/** ルールブック準拠のスコア計算 */
const calcScore = (player, state) => {
    const terrScore = Object.entries(state.territories)
        .filter(([, ownerId]) => ownerId === player.id)
        .reduce((sum, [tileId]) => {
            const tile = state.mapData.find(t => t.id === parseInt(tileId));
            if (!tile) return sum;
            if (tile.area === 'luxury')     return sum + 10;
            if (tile.area === 'commercial') return sum + 6;
            return sum + 3;
        }, 0);
    const resourceScore = player.cans * state.canPrice + player.trash * state.trashPrice;
    const combatScore   = (player.kills || 0) * 3 - (player.deaths || 0) * 5;
    return player.p * 2 + terrScore + resourceScore + combatScore;
};

/** BFS で最も近い指定タイプのタイルへの経路を返す */
const bfsNearest = (fromPos, targetTypes, mapData, maxSteps = 14) => {
    const queue   = [{ pos: fromPos, path: [] }];
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

/** 危険なNPC位置を避けた移動候補を返す */
const safeMoves = (candidates, state, cp) => {
    const hasDoll    = cp.equip?.doll;
    const hasStealth = cp.stealth;
    if (hasDoll || hasStealth) return candidates; 
    const danger = new Set([state.policePos, state.yakuzaPos, state.loansharkPos, state.unclePos]);
    const safe   = candidates.filter(id => !danger.has(id));
    return safe.length > 0 ? safe : candidates; 
};

/** タイルの陣地としての価値点数 */
const tileValue = (tile) => {
    if (!tile) return 0;
    if (tile.area === 'luxury')     return 10;
    if (tile.area === 'commercial') return 6;
    return 3;
};

/**
 * CPUの戦略モードを決定する
 * 'survival'   - HP危機、回復最優先
 * 'aggressive' - スコアで大差負け、攻撃的
 * 'endgame'    - 残り3ラウンド以下、逆転狙い
 * 'defensive'  - 1位、守りに徹する
 * 'balanced'   - 通常
 */
const getMode = (cp, state) => {
    if (cp.hp < 25) return 'survival';
    const remaining = state.maxRounds - state.roundCount;
    if (remaining <= 3) return 'endgame';
    const scores = state.players
        .filter(p => p.hp > 0)
        .map(p => ({ id: p.id, score: calcScore(p, state) }))
        .sort((a, b) => b.score - a.score);
    const myRank  = scores.findIndex(s => s.id === cp.id);
    const myScore = calcScore(cp, state);
    const top     = scores[0]?.score || 0;
    if (myRank === 0)            return 'defensive';
    if (top - myScore > 35)     return 'aggressive';
    return 'balanced';
};

// ============================================================
// メインCPUターン関数
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

        // ── 手札超過：武器以外を優先して捨てる ──────────────────────────────
        while (cp.hand && cp.maxHand !== undefined && cp.hand.length > cp.maxHand) {
            const discardIdx = cp.hand.findIndex(id => deckData.find(d => d.id === id)?.type !== 'weapon');
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
            cp    = state.players[turnId];

            if (
                state.gameOver || cp.ap <= 0 || state.turn !== cp.id ||
                cp.cannotMove || state.mgActive || state.storyActive || state.isBranchPicking
            ) break;

            const currentTile = state.mapData.find(t => t.id === cp.pos);
            if (!currentTile) break;

            const validNextTiles = currentTile.next.filter(id => id !== state.constructionPos);
            const moveCost = (state.isRainy && !cp.rainGear && cp.charType !== 'athlete') ? 2 : 1;
            const canMove  = cp.ap >= moveCost && validNextTiles.length > 0;
            const mode     = getMode(cp, state);

            const livePlayers = state.players.filter(p => p.hp > 0 && p.id !== cp.id);
            const leader = [...livePlayers].sort((a, b) => calcScore(b, state) - calcScore(a, state))[0];

            let acted = false;

            // ======================================================
            // A. 緊急回復（HP < 40 または survival モード）
            // ======================================================
            if (!acted && (cp.hp < 40 || mode === 'survival')) {
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
            // C. キャラクター固有スキルの発動（新規追加）
            // ======================================================
            if (!acted && cp.ap >= 2) {
                const othersOnTile = state.players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);

                if (cp.charType === 'survivor' && cp.ap >= 2 && cp.hp <= 75) {
                    useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 2, hp: Math.min(100, p.hp + 15) }));
                    logMsg(`🏕️ ${cp.name}が【野宿】でHPを回復！`);
                    acted = true;
                }
                else if (cp.charType === 'yankee' && cp.ap >= 2 && othersOnTile.length > 0) {
                    // 最もHPが低い相手を狙って殴る（確殺狙い）
                    const target = othersOnTile.sort((a, b) => a.hp - b.hp)[0]; 
                    useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 2 }));
                    dealDamage(target.id, 10, "殴る", cp.id);
                    logMsg(`👊 ${cp.name}が【殴る】！${target.name}に10ダメージ！`);
                    acted = true;
                }
                else if (cp.charType === 'doctor' && cp.ap >= 2 && othersOnTile.length > 0 && cp.p < 30) {
                    const target = othersOnTile.find(p => p.p >= 5);
                    if (target) {
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p + 5 }));
                        useGameStore.getState().updatePlayer(target.id, p => ({ p: Math.max(0, p.p - 5), hp: Math.min(100, p.hp + 30) }));
                        logMsg(`💉 ${cp.name}が${target.name}に【闇診療】！HPを回復させ5P強制徴収！`);
                        acted = true;
                    }
                }
                else if (cp.charType === 'sales' && cp.ap >= 2 && othersOnTile.length > 0 && cp.hand.length > 0) {
                    const target = othersOnTile.find(p => p.p >= 3 && p.hand.length < (p.maxHand || 7));
                    if (target) {
                        const trashIdx = cp.hand.findIndex(id => deckData.find(d => d.id === id)?.type !== 'weapon');
                        const sellIdx = trashIdx >= 0 ? trashIdx : 0;
                        const cardToSell = cp.hand[sellIdx];
                        
                        const newMyHand = [...cp.hand];
                        newMyHand.splice(sellIdx, 1);
                        
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p + 3, hand: newMyHand }));
                        useGameStore.getState().updatePlayer(target.id, p => ({ p: Math.max(0, p.p - 3), hand: [...p.hand, cardToSell] }));
                        logMsg(`💼 ${cp.name}が${target.name}に【訪問販売】！カードを押し付け3P獲得！`);
                        acted = true;
                    }
                }
                else if (cp.charType === 'gambler' && cp.ap >= 2 && othersOnTile.length > 0) {
                    const target = othersOnTile.find(p => p.p >= 5);
                    if (target && Math.random() > 0.4) { // 無限にやらないように確率で制御
                        const win = Math.random() > 0.5;
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 2, p: p.p + (win ? 5 : -5) }));
                        useGameStore.getState().updatePlayer(target.id, p => ({ p: p.p + (win ? -5 : 5) }));
                        logMsg(`🎲 ${cp.name}が${target.name}と【イカサマ勝負】！${win ? '勝利して5P奪取！' : '失敗して5P支払った...'}`);
                        acted = true;
                    }
                }
                else if (cp.charType === 'musician' && cp.ap >= 4 && mode !== 'survival') {
                    // 周囲2マス以内の生存プレイヤーを検索
                    const inRange = state.players.filter(p => p.id !== cp.id && p.hp > 0 && getDistance(cp.pos, p.pos, state.mapData) <= 2 && p.pos !== cp.pos);
                    // 2人以上いるなら引き寄せる（投げ銭パッシブとのコンボ狙い）
                    if (inRange.length >= 2) {
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 4 }));
                        inRange.forEach(t => {
                            useGameStore.getState().updatePlayer(t.id, { pos: cp.pos });
                            // 引き寄せた際の投げ銭パッシブを強制発動
                            useGameStore.getState().updateCurrentPlayer(p => ({ p: p.p + 3 }));
                        });
                        logMsg(`🎸 ${cp.name}が【路上ライブ】！周囲のプレイヤーを引き寄せた！`);
                        acted = true;
                    }
                }
                else if (cp.charType === 'hacker' && cp.ap >= 3 && cp.p >= 4 && cp.hand.length < (cp.maxHand||7) && Math.random() > 0.5) {
                    // ランダムなカードを購入（UIのショップ在庫をバイパスしてプールから直接抽選）
                    const pool = [0,1,2,3,4,5,6,7,8,9,10,11,15,16,17,18,19,20,24,25,26,27,28,29,30,31,32,33,34];
                    const cardId = pool[Math.floor(Math.random() * pool.length)];
                    useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 3, p: p.p - 4, hand: [...p.hand, cardId] }));
                    logMsg(`💻 ${cp.name}が【遠隔ハッキング】！システムに侵入しカードを入手！(-4P)`);
                    acted = true;
                }
                else if (cp.charType === 'athlete' && cp.ap >= 3 && (mode === 'aggressive' || cp.ap > 5)) {
                    // ピッタリ3マス先をBFSで探索してジャンプ
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
                    const safe3 = safeMoves(exact3, state, cp);
                    if (safe3.length > 0) {
                        const targetPos = safe3[Math.floor(Math.random() * safe3.length)];
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 3, pos: targetPos }));
                        logMsg(`🏃 ${cp.name}が【疾風ダッシュ】！ピッタリ3マス先へジャンプ！`);
                        checkNpcCollision(cp.id); 
                        acted = true;
                    }
                }
                else if (cp.charType === 'detective' && cp.ap >= 3 && leader && Math.random() > 0.5) {
                    // パトカーがマップに存在する場合、トッププレイヤー（リーダー）に誘導する
                    if (state.policePos !== 999 && state.policeHp > 0) {
                        useGameStore.getState().updateCurrentPlayer(p => ({ ap: p.ap - 3 }));
                        useGameStore.setState({ policePos: leader.pos });
                        logMsg(`🕵️ ${cp.name}が【情報操作】！パトカーを${leader.name}の元へ誘導した！`);
                        checkNpcCollision(leader.id);
                        acted = true;
                    }
                }
            }

            // ======================================================
            // D. 逆転カード（下剋上・大暴落）：積極的な状況で使う
            // ======================================================
            if (!acted && (mode === 'aggressive' || mode === 'endgame')) {
                const powerIdx = cp.hand.findIndex(id => {
                    const cd = deckData.find(d => d.id === id);
                    return cd && ['下剋上', '大暴落'].includes(cd.name) && (cd.ap ?? 0) <= cp.ap;
                });
                if (powerIdx >= 0) {
                    logMsg(`🃏 ${cp.name}が逆転カードを発動！`);
                    actionUseCard(powerIdx, cp.hand[powerIdx]);
                    acted = true;
                }
            }

            // ======================================================
            // E. 武器攻撃：リーダーを優先ターゲット
            // ======================================================
            if (!acted && cp.ap >= 2) {
                const weaponCards = (cp.hand || [])
                    .map((id, idx) => ({ id, idx, data: deckData.find(d => d.id === id) }))
                    .filter(c => c.data?.type === 'weapon');

                const attackThresh = { aggressive: 0.25, endgame: 0.35, balanced: 0.55, defensive: 0.80, survival: 1.0 }[mode] ?? 0.55;

                if (weaponCards.length > 0 && Math.random() > attackThresh) {
                    const wc = weaponCards[0];
                    const inRange = state.players.filter(op =>
                        op.id !== cp.id && op.hp > 0 &&
                        getDistance(cp.pos, op.pos, state.mapData) <= wc.data.range
                    );
                    const target = inRange.find(p => p.id === leader?.id)
                        || inRange.sort((a, b) => a.hp - b.hp)[0];

                    if (target) {
                        const newHand = [...cp.hand];
                        newHand.splice(wc.idx, 1);
                        useGameStore.getState().updateCurrentPlayer(() => ({ ap: cp.ap - 2, hand: newHand }));
                        if (wc.data.aoe) {
                            inRange.forEach(t => dealDamage(t.id, wc.data.dmg, wc.data.name, cp.id));
                            logMsg(`💥 ${cp.name}が${wc.data.name}で広範囲攻撃！`);
                        } else {
                            dealDamage(target.id, wc.data.dmg, wc.data.name, cp.id);
                            logMsg(`💥 ${cp.name}が${wc.data.name}で${target.name}を狙い撃ち！`);
                        }
                        acted = true;
                    }
                }
            }

            // ======================================================
            // F. 陣地占領（価値・P余裕・モードで判断）
            // ======================================================
            if (!acted && state.territories[cp.pos] !== cp.id && cp.pos !== state.unclePos) {
                const occupiable = ['normal', 'can', 'trash', 'job', 'exchange', 'shelter'].includes(currentTile.type);
                if (occupiable) {
                    const val      = tileValue(currentTile);
                    const isEnemy  = state.territories[cp.pos] !== undefined;
                    const cost     = isEnemy ? Math.round((state.territoryCosts?.[cp.pos] || val) * 1.5) : val;
                    const wantOccupy = mode === 'defensive' ? val >= 6 : val >= 3;
                    if (wantOccupy && cp.p >= cost + 5) {
                        actionOccupy();
                        acted = true;
                    }
                }
            }

            // ======================================================
            // G. バイト（資金不足かつAP余裕あり）
            // ======================================================
            if (!acted && currentTile.type === 'job' && cp.ap >= 3 && cp.p < 20) {
                actionJob();
                acted = true;
            }

            // ======================================================
            // H. 缶拾い（換金所への距離を考慮）
            // ======================================================
            if (!acted && currentTile.type === 'can' && cp.ap >= 1 &&
                state.canPickedThisTurn < 3 && !state.isRainy && cp.pos !== state.animalPos) {
                const nearExchange = bfsNearest(cp.pos, ['exchange'], state.mapData, 8);
                if (nearExchange || cp.cans < 4) {
                    actionCan();
                    acted = true;
                }
            }

            // ======================================================
            // I. ゴミ漁り（リスク評価あり）
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
            // J. ショップ購入（状況に応じた優先カードを選ぶ）
            // ======================================================
            if (!acted && currentTile.type === 'shop' && cp.hand.length < (cp.maxHand || 7) && cp.p >= 4) {
                const shopStock = state.shopStock || [];
                let wantType = 'buff';
                if (cp.hp < 50)                    wantType = 'heal';
                if (mode === 'aggressive' || mode === 'endgame') wantType = 'weapon';

                const pick = shopStock.find(s => {
                    const cd = deckData.find(d => d.id === s.id);
                    return cd?.type === wantType && cp.p >= (s.price ?? 4);
                }) || shopStock.find(s => cp.p >= (s.price ?? 4));

                if (pick) {
                    const cd    = deckData.find(d => d.id === pick.id);
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
            // K. 移動（BFS で目的地を決め、NPCを回避しながら進む）
            // ======================================================
            if (!acted && canMove) {
                const hasResources = cp.cans > 3 || cp.trash > 3;
                const needsHealing = cp.hp < 50;
                const needsMoney   = cp.p < 10;
                const isRainy      = state.isRainy && !cp.rainGear && cp.charType !== 'athlete';

                let goalTypes = [];
                if (needsHealing)                    goalTypes.push('center');
                if (hasResources)                    goalTypes.push('exchange');
                if (needsMoney)                      goalTypes.push('job');
                if (!isRainy && cp.cans < 4)         goalTypes.push('can');
                if (!isRainy && cp.trash < 4)        goalTypes.push('trash');
                if (mode === 'aggressive' && leader) {
                    const lt = state.mapData.find(t => t.id === leader.pos);
                    if (lt) goalTypes.push(lt.type);
                }
                goalTypes.push('can', 'trash', 'job', 'exchange', 'normal');

                const safeNext = safeMoves(validNextTiles, state, cp);
                const found    = bfsNearest(cp.pos, goalTypes, state.mapData, 12);

                let targetId = null;
                if (found && found.path.length > 0) {
                    const firstStep = found.path[0];
                    targetId = safeNext.includes(firstStep)
                        ? firstStep
                        : safeNext[Math.floor(Math.random() * safeNext.length)];
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