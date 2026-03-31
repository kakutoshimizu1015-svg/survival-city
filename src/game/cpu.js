import { useGameStore } from '../store/useGameStore';
import { actionRollDice, executeMove, actionCan, actionTrash, actionJob, actionOccupy, actionExchange, actionEndTurn, logMsg } from './actions';
import { deckData } from '../constants/cards';
import { actionUseCard, actionDiscardCard } from './cards';
import { dealDamage, getDistance } from './combat';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export const runCpuTurn = async () => {
    let state = useGameStore.getState();
    // 既にCPUが行動中、またはゲーム終了時は弾く
    if (state.cpuActing || state.gameOver || state.players.length === 0) return;
    
    useGameStore.setState({ cpuActing: true });
    await sleep(1500); // 思考時間（人間らしさの演出）

    state = useGameStore.getState();
    const turnId = state.turn;
    let cp = state.players[turnId];

    if (!cp || !cp.isCPU) {
        useGameStore.setState({ cpuActing: false });
        return;
    }

    // 1. 手札超過の処理（はみ出した分を捨てる）
    while (cp.hand.length > cp.maxHand) {
        actionDiscardCard(0);
        await sleep(300);
        cp = useGameStore.getState().players[turnId];
    }

    // 2. ミニゲームやイベントの消化（ターン開始時に巻き込まれていた場合）
    if (state.mgActive) {
        await sleep(1000);
        useGameStore.setState({ mgResult: Math.random() > 0.6 ? '大成功！' : '失敗...', mgActive: false });
        await sleep(500);
        cp = useGameStore.getState().players[turnId];
    }

    // 3. サイコロを振る
    if (!useGameStore.getState().diceRolled) {
        await actionRollDice(true);
        await sleep(1000);
    }

    let maxLoops = 30; // 無限ループ暴走防止リミッター

    // 4. メインアクションループ
    while (maxLoops-- > 0) {
        // 毎回のループの最初に「最新の」ゲーム状態を取得する
        state = useGameStore.getState();
        cp = state.players[turnId];
        
        // 🛑 APが0になったり、交番で行動不能になった場合はループを抜ける
        if (state.gameOver || cp.ap <= 0 || state.turn !== cp.id || cp.cannotMove || state.mgActive || state.storyActive || state.isBranchPicking) {
            break;
        }

        const currentTile = state.mapData.find(t => t.id === cp.pos);
        if (!currentTile) break;

        const validNextTiles = currentTile.next.filter(id => id !== state.constructionPos);
        const moveCost = (state.isRainy && !cp.rainGear && cp.charType !== "athlete") ? 2 : 1;
        const canMove = cp.ap >= moveCost && validNextTiles.length > 0;
        
        let acted = false;

        // ① 武器カードによる攻撃
        const weaponCards = cp.hand.map((id, idx) => ({ id, idx, data: deckData.find(d => d.id === id) })).filter(c => c.data?.type === 'weapon');
        if (!acted && weaponCards.length > 0 && cp.ap >= 2 && Math.random() > 0.5) {
            const wc = weaponCards[0];
            const targetPlayers = state.players.filter(op => op.id !== cp.id && op.hp > 0 && getDistance(cp.pos, op.pos, state.mapData) <= wc.data.range);
            
            if (targetPlayers.length > 0) {
                cp.ap -= 2;
                const newHand = [...cp.hand];
                newHand.splice(wc.idx, 1);
                useGameStore.getState().updateCurrentPlayer(() => ({ ap: cp.ap, hand: newHand }));
                
                const target = targetPlayers[Math.floor(Math.random() * targetPlayers.length)];
                
                if (wc.data.aoe) {
                    targetPlayers.forEach(t => dealDamage(t.id, wc.data.dmg, wc.data.name, cp.id));
                    logMsg(`💥 ${cp.name}が${wc.data.name}を発動！広範囲に命中！`);
                } else {
                    dealDamage(target.id, wc.data.dmg, wc.data.name, cp.id);
                    logMsg(`💥 ${cp.name}が${wc.data.name}で${target.name}を攻撃！`);
                }
                acted = true;
            }
        }

        // ② 換金
        if (!acted && currentTile.type === "exchange" && (cp.cans > 0 || cp.trash > 0)) {
            actionExchange(); acted = true;
        }

        // ③ 回復・バフカードの使用
        if (!acted && cp.hand.length > 0 && cp.ap >= 2 && Math.random() > 0.4) {
            const healIdx = cp.hp < 60 ? cp.hand.findIndex(id => deckData.find(d => d.id === id)?.type === 'heal') : -1;
            const useIdx = healIdx >= 0 ? healIdx : cp.hand.findIndex(id => deckData.find(d => d.id === id)?.type !== 'weapon');
            if (useIdx >= 0) {
                actionUseCard(useIdx, cp.hand[useIdx]); acted = true;
            }
        }

        // ④ 陣地占領
        if (!acted && ["normal", "can", "trash", "job", "exchange", "shelter"].includes(currentTile.type) && state.territories[cp.pos] !== cp.id && cp.pos !== state.unclePos && Math.random() > 0.4) {
            const isEnemyT = state.territories[cp.pos] !== undefined && state.territories[cp.pos] !== cp.id;
            const neededP = isEnemyT ? 5 : 3;
            if (cp.p >= neededP) {
                actionOccupy(); acted = true;
            }
        }

        // ⑤ バイト
        if (!acted && currentTile.type === "job" && cp.ap >= 3 && Math.random() > 0.3) {
            actionJob(); acted = true;
        }

        // ⑥ 缶拾い
        if (!acted && currentTile.type === "can" && cp.ap >= 1 && state.canPickedThisTurn < 3 && (!state.isRainy || cp.rainGear) && cp.pos !== state.animalPos) {
            actionCan(); acted = true;
        }

        // ⑦ ゴミ漁り
        if (!acted && currentTile.type === "trash" && cp.ap >= (cp.equip?.shoes ? 1 : 2) && (!state.isRainy || cp.rainGear) && cp.pos !== state.animalPos && Math.random() > 0.4) {
            actionTrash(); acted = true;
        }

        // ⑧ ショップでの購入
        if (!acted && currentTile.type === "shop" && cp.p >= 4 && cp.hand.length < cp.maxHand && Math.random() > 0.3) {
            const pool = [0,1,2,3,4,5,6,7,8,9,10,11,15,16,17,18,19,20,24,25,26,27,28,29,30,31,32,33,34];
            const cardId = pool[Math.floor(Math.random() * pool.length)];
            const cd = deckData.find(d => d.id === cardId);
            const price = cd.type === 'weapon' ? Math.max(5, cd.dmg / 5) : cd.type === 'equip' ? 6 : 4;
            
            if (cp.p >= price) {
                useGameStore.getState().updateCurrentPlayer(p => ({ p: p.p - price, hand: [...p.hand, cardId] }));
                logMsg(`🛒 ${cp.name}が「${cd.name}」を購入！(-${price}P)`);
                acted = true;
            }
        }

        // ⑨ 移動
        if (!acted && canMove) {
            const nextTile = validNextTiles[Math.floor(Math.random() * validNextTiles.length)];
            executeMove(nextTile); acted = true;
        }

        // 何も行動できなければループ終了
        if (!acted) break; 
        
        await sleep(800); // アクション間に少しウェイトを入れる
        
        // イベントマスを踏んでミニゲーム等が発生した場合の待機処理
        state = useGameStore.getState();
        if (state.mgActive) {
            await sleep(1000);
            useGameStore.setState({ mgResult: Math.random() > 0.6 ? '大成功！' : '失敗...', mgActive: false });
            await sleep(500);
        }
        if (state.storyActive) {
            useGameStore.setState({ storyActive: false });
            useGameStore.getState().updateCurrentPlayer(p => ({ p: p.p + 5 }));
            logMsg(`📖 ${cp.name}はイベントで5P獲得した！`);
            await sleep(500);
        }
    }

    // 5. ターン終了処理
    // ▼ ここが重要：await actionEndTurn() の完了を待ってから cpuActing = false にする
    state = useGameStore.getState();
    if (!state.gameOver && state.turn === turnId) {
        await actionEndTurn();
        useGameStore.setState({ cpuActing: false });
    } else {
        useGameStore.setState({ cpuActing: false });
    }
};