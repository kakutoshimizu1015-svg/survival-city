import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { deckData } from '../../constants/cards';
import { actionRollDice, actionMove, actionCan, actionTrash, actionJob, actionOccupy, actionExchange, actionEndTurn, actionManhole, getOccupyCost } from '../../game/actions';
import { actionPunch, actionCamp, actionSalesVisit, actionHack, actionDarkCure, executeDarkCure, actionGamble, actionDash, actionConcert, actionNpcMove, actionSetTrap, setupSetTrap, actionChef, actionScavenger, executeScavenger, actionBribe, executeBribe, actionOracle, actionCanBallista, setupCanBallistaAim, actionTenchi } from '../../game/skills';

/* ── Dark themed action button ── */
const ActionBtn = ({ action, condition, failMsg, highlight, style, children, isMyTurn, isBusy, className = '' }) => (
    <button
        className={`dt-action-btn ${highlight ? 'highlight' : ''} ${className}`}
        onClick={() => {
            if (!isMyTurn || isBusy) return;
            if (!condition) { useGameStore.getState().showToast(failMsg); return; }
            action();
        }}
        disabled={!condition}
        style={style}
    >
        {children}
    </button>
);

export const ActionPanel = () => {
    const state = useGameStore();
    const {
        turn, players, mapData, diceRolled, diceAnim, isBranchPicking, mgActive, storyActive,
        canPickedThisTurn, territories, animalPos, turnBannerActive, showSkipButton, _roundEndInProgress,
        isTrapTypePicking, isTrapTilePicking, isDarkCurePicking, darkCureTargets
    } = state;

    const cp = players[turn];
    const { myUserId, status } = useNetworkStore();

    if (!cp) return null;
    const currentTile = mapData.find(t => t.id === cp.pos) || {};
    const tileType = currentTile.type;

    // ▼ 修正: 移動コストの計算を actions.js と完全に同期（帝王の0AP制限、折りたたみ自転車など）
    let baseMoveCost = (state.isRainy && !cp.rainGear && cp.charType !== 'athlete' && !cp.equip?.foldBike) ? 2 : 1;
    const freeMoves = cp.freeMovesThisTurn || 0;
    if (cp.charType === 'emperor' && cp.cans >= 5 && freeMoves < 6) {
        baseMoveCost = 0;
    }
    const currentMoveCost = baseMoveCost + (cp.nextMoveCostPenalty || 0);

    let isMyTurn = !cp.isCPU;
    if (status === 'connected') isMyTurn = !cp.isCPU && cp.userId === myUserId;

    const isBusy = isBranchPicking || mgActive || storyActive || turnBannerActive || _roundEndInProgress || diceAnim.active;
    const hasAP = (cost) => cp.ap >= cost;
    const othersOnTile = players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);

    const canRoll = isMyTurn && !diceRolled && !isBusy;
    const canMove = isMyTurn && diceRolled && hasAP(currentMoveCost) && !cp.cannotMove && !isBusy;
    const isBlockedByAnimal = cp.pos === animalPos;
    const occupyCost = getOccupyCost(cp.pos);

    const canPickLimit = cp.charType === 'emperor' ? 5 : 3;
    const canDoCan = isMyTurn && diceRolled && hasAP(1) && tileType === 'can' && canPickedThisTurn < canPickLimit && !isBlockedByAnimal && !isBusy;
    const canDoTrash = isMyTurn && diceRolled && hasAP(cp.equip?.shoes ? 1 : 2) && tileType === 'trash' && !isBlockedByAnimal && !isBusy;
    const canDoOccupy = isMyTurn && diceRolled && tileType === 'normal' && territories[cp.pos] !== cp.id && !isBusy && cp.p >= occupyCost;
    const canDoJob = isMyTurn && diceRolled && hasAP(3) && tileType === 'job' && !isBusy;
    const canDoExchange = isMyTurn && diceRolled && (cp.cans > 0 || cp.trash > 0) && tileType === 'exchange' && !isBusy;
    const canDoShop = isMyTurn && diceRolled && tileType === 'shop' && !isBusy;
    const isHandOverLimit = cp.hand.length > cp.maxHand;
    const canEndTurn = isMyTurn && diceRolled && !isBusy && !isHandOverLimit;

    /* ── Auto end turn ── */
    useEffect(() => {
        if (!isMyTurn || !diceRolled || isBusy || isHandOverLimit || cp.hp <= 0) return;
        let autoEndTimer, warningTimer;

        if (cp.ap === 0) {
            const canUseCard = cp.hand.some(cId => {
                const cd = deckData.find(d => d.id === cId);
                return cd && cd.type !== 'weapon';
            });
            if (!canUseCard && !canDoShop && !canDoExchange && !canDoOccupy) {
                autoEndTimer = setTimeout(() => actionEndTurn(), 1500);
            } else {
                warningTimer = setTimeout(() => {
                    useGameStore.getState().showCenterWarning('ターンエンドしてください🛑');
                }, 30000);
            }
        }
        return () => { clearTimeout(autoEndTimer); clearTimeout(warningTimer); };
    }, [cp.ap, cp.hand.length, cp.maxHand, diceRolled, isBusy, isMyTurn, tileType, territories, cp.pos, cp.p, cp.cans, cp.trash, isHandOverLimit]);


    /* ══════════════════
       Special mode UIs
       ══════════════════ */

    if (isTrapTypePicking && isMyTurn) {
        return (
            <div id="action-panel" className="dt-action-panel">
                <div style={{ textAlign: 'center', color: 'var(--dt-gold)', fontWeight: 700, marginBottom: 4 }}>🪤 設置する罠を選んでください</div>
                <button className="dt-action-btn" onClick={() => setupSetTrap('police')} style={{ borderColor: 'rgba(52,152,219,0.3)' }}>👮 警察罠 (AP減少)</button>
                <button className="dt-action-btn" onClick={() => setupSetTrap('pitfall')} style={{ borderColor: 'rgba(231,76,60,0.3)' }}>🕳️ 落とし穴 (ダメージ)</button>
                <button className="dt-action-btn" onClick={() => setupSetTrap('jamming')} style={{ borderColor: 'rgba(155,89,182,0.3)' }}>📡 情報撹乱 (手札破棄)</button>
                <button className="dt-action-btn" onClick={() => useGameStore.setState({ isTrapTypePicking: false })} style={{ color: '#888', marginTop: 4 }}>✖ キャンセル</button>
            </div>
        );
    }

    if (isDarkCurePicking && isMyTurn) {
        return (
            <div id="action-panel" className="dt-action-panel">
                <div style={{ textAlign: 'center', color: 'var(--dt-gold)', fontWeight: 700, marginBottom: 4 }}>🩺 治療する相手を選んでください</div>
                {darkCureTargets.map(tid => {
                    const t = players.find(p => p.id === tid);
                    return <button key={tid} className="dt-action-btn" onClick={() => executeDarkCure(tid)} style={{ borderColor: 'rgba(231,76,60,0.3)' }}>{t?.name} を治療</button>;
                })}
                <button className="dt-action-btn" onClick={() => useGameStore.setState({ isDarkCurePicking: false, darkCureTargets: [] })} style={{ color: '#888', marginTop: 4 }}>✖ キャンセル</button>
            </div>
        );
    }

    const { isChefPicking, isScavengerPicking, isBribePicking, isCanBallistaPicking } = state;

    if (isChefPicking && isMyTurn) {
        return (
            <div id="action-panel" className="dt-action-panel" style={{ textAlign: 'center', padding: 15, background: 'rgba(211,84,0,0.2)', borderColor: 'rgba(211,84,0,0.4)' }}>
                🍳 手札の回復カードをタップして調理してください
            </div>
        );
    }

    if (isScavengerPicking && isMyTurn) {
        return (
            <div id="action-panel" className="dt-action-panel">
                <div style={{ textAlign: 'center', color: 'var(--dt-text)', fontWeight: 700 }}>🛠️ 何を組み上げますか？ (ゴミ3個消費)</div>
                <button className="dt-action-btn" onClick={() => executeScavenger('equip')} style={{ borderColor: 'rgba(46,204,113,0.3)' }}>🛡️ 装備品を生成</button>
                <button className="dt-action-btn" onClick={() => executeScavenger('weapon')} style={{ borderColor: 'rgba(231,76,60,0.3)' }}>🔫 ショットガンを生成</button>
                <button className="dt-action-btn" onClick={() => useGameStore.setState({ isScavengerPicking: false })} style={{ color: '#888' }}>✖ キャンセル</button>
            </div>
        );
    }

    if (isBribePicking && isMyTurn) {
        const targets = players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);

        if (targets.length > 1 && !state.bribeTargetId) {
            return (
                <div id="action-panel" className="dt-action-panel">
                    <div style={{ textAlign: 'center', color: 'var(--dt-gold)', fontWeight: 700 }}>💴 買収する相手を選んでください</div>
                    {targets.map(t => (
                        <button key={t.id} className="dt-action-btn" onClick={() => useGameStore.setState({ bribeTargetId: t.id })} style={{ borderColor: 'rgba(243,156,18,0.3)' }}>{t.name}</button>
                    ))}
                    <button className="dt-action-btn" onClick={() => useGameStore.setState({ isBribePicking: false })} style={{ color: '#888' }}>✖ キャンセル</button>
                </div>
            );
        }

        const target = state.bribeTargetId ? players.find(p => p.id === state.bribeTargetId) : targets[0];
        return (
            <div id="action-panel" className="dt-action-panel">
                <div style={{ textAlign: 'center', color: 'var(--dt-gold)', fontWeight: 700 }}>💴 {target?.name} をどう買収しますか？</div>
                <button className="dt-action-btn" onClick={() => { executeBribe(target.id, 'hand', 0); useGameStore.setState({ bribeTargetId: null }); }} disabled={cp.p < 5 || target.hand.length === 0} style={{ borderColor: 'rgba(243,156,18,0.3)' }}>🃏 手札を1枚奪う (5P)</button>
                <button className="dt-action-btn" onClick={() => { executeBribe(target.id, 'territory', cp.pos); useGameStore.setState({ bribeTargetId: null }); }} disabled={cp.p < 10 || territories[cp.pos] !== target.id} style={{ borderColor: 'rgba(243,156,18,0.3)' }}>🚩 この陣地を奪う (倍額)</button>
                <button className="dt-action-btn" onClick={() => { executeBribe(target.id, 'hire', 0); useGameStore.setState({ bribeTargetId: null }); }} disabled={cp.p < 10} style={{ borderColor: 'rgba(243,156,18,0.3)' }}>💼 次ターン雇用する (10P)</button>
                <button className="dt-action-btn" onClick={() => useGameStore.setState({ isBribePicking: false, bribeTargetId: null })} style={{ color: '#888' }}>✖ キャンセル</button>
            </div>
        );
    }

    if (isCanBallistaPicking && isMyTurn) {
        return (
            <div id="action-panel" className="dt-action-panel">
                <div style={{ textAlign: 'center', color: 'var(--dt-text)', fontWeight: 700 }}>🥫 缶を何個発射しますか？(現在:{cp.cans}個)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                    <button className="dt-action-btn" onClick={() => setupCanBallistaAim(3)} disabled={cp.cans < 3}>3個 (射程2/10ダメ)</button>
                    <button className="dt-action-btn" onClick={() => setupCanBallistaAim(6)} disabled={cp.cans < 6}>6個 (射程3/25ダメ/AP-1)</button>
                    <button className="dt-action-btn" onClick={() => setupCanBallistaAim(9)} disabled={cp.cans < 9}>9個 (射程4/40ダメ/破壊)</button>
                    <button className="dt-action-btn" onClick={() => setupCanBallistaAim(12)} disabled={cp.cans < 12}>12個 (射程5/広範囲爆撃)</button>
                </div>
                <button className="dt-action-btn" onClick={() => useGameStore.setState({ isCanBallistaPicking: false })} style={{ color: '#888' }}>✖ キャンセル</button>
            </div>
        );
    }


    /* ══════════════════
       Main action panel
       ══════════════════ */
    return (
        <div id="action-panel" className="dt-action-panel">
            {/* ▼ 追加: 仙気スタックのリアルタイムUI表示メーター */}
            {cp.charType === 'sennin' && (
                <div style={{ background: 'rgba(155, 89, 182, 0.2)', border: '1px solid #9b59b6', borderRadius: '8px', padding: '5px', textAlign: 'center', color: '#e0b0ff', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>
                    ☁️ 現在の仙気: {cp.senki || 0} / 5
                    <div style={{ fontSize: '10px', color: '#bdc3c7', fontWeight: 'normal', marginTop: '2px' }}>行動せずターン終了でスタック増加</div>
                </div>
            )}

            {/* Core actions */}
            <div id="btn-roll"><ActionBtn action={actionRollDice} condition={canRoll} failMsg={diceRolled ? 'すでにサイコロを振っています' : '今は振れません'} highlight={canRoll} isMyTurn={isMyTurn} isBusy={isBusy}>🎲 サイコロを振る</ActionBtn></div>
            
            {/* ▼ 修正: 帝王で缶が5個以上あり、無料移動が残っている場合、ボタン内に残り回数を表示 */}
            <div id="btn-move">
                <ActionBtn action={actionMove} condition={canMove} failMsg={cp.cannotMove ? '足止めされています！' : !diceRolled ? 'サイコロを振ってください' : 'APが不足しています'} highlight={canMove} isMyTurn={isMyTurn} isBusy={isBusy}>
                    🚶 移動 ({currentMoveCost}AP)
                    {cp.charType === 'emperor' && cp.cans >= 5 && freeMoves < 6 && (
                        <span style={{ fontSize: '11px', color: '#f1c40f', marginLeft: '6px' }}>[無料:残{6 - freeMoves}マス]</span>
                    )}
                </ActionBtn>
            </div>
            
            <div id="btn-can"><ActionBtn action={actionCan} condition={canDoCan} failMsg={isBlockedByAnimal ? '野良犬がいて拾えません！' : canPickedThisTurn >= canPickLimit ? '1ターンの拾う上限です' : 'AP不足か場所が違います'} isMyTurn={isMyTurn} isBusy={isBusy}>🥫 缶拾い (1AP)</ActionBtn></div>
            <div id="btn-trash"><ActionBtn action={actionTrash} condition={canDoTrash} failMsg={isBlockedByAnimal ? '野良犬がいて漁れません！' : 'AP不足か場所が違います'} isMyTurn={isMyTurn} isBusy={isBusy}>🗑️ ゴミ漁り ({cp.equip?.shoes ? 1 : 2}AP)</ActionBtn></div>
            <div id="btn-occupy"><ActionBtn action={actionOccupy} condition={canDoOccupy} failMsg={cp.p < occupyCost ? 'Pが不足しています' : 'このマスは陣地にできません'} isMyTurn={isMyTurn} isBusy={isBusy}>🚩 陣地占領 ({occupyCost}P)</ActionBtn></div>
            <div id="btn-job"><ActionBtn action={actionJob} condition={canDoJob} failMsg="AP不足か場所が違います" isMyTurn={isMyTurn} isBusy={isBusy}>💼 バイト (3AP)</ActionBtn></div>

            {/* Tile-specific */}
            {tileType === 'exchange' && <ActionBtn action={actionExchange} condition={canDoExchange} failMsg="換金するものがありません" isMyTurn={isMyTurn} isBusy={isBusy}>💱 換金 (0AP)</ActionBtn>}
            {tileType === 'manhole' && <ActionBtn action={actionManhole} condition={isMyTurn && diceRolled && hasAP(1) && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy}>🕳️ ワープ (1AP)</ActionBtn>}
            {tileType === 'shop' && <ActionBtn action={() => useGameStore.setState({ shopActive: true })} condition={canDoShop} failMsg="今は開けません" isMyTurn={isMyTurn} isBusy={isBusy}>🛒 ショップ</ActionBtn>}

            {/* Character skills */}
            <div id="btn-dash">{cp.charType === 'athlete' && <ActionBtn action={actionDash} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(46,204,113,0.3)' }}>💨 疾風ダッシュ (3AP)</ActionBtn>}</div>
            {cp.charType === 'yankee' && othersOnTile.length > 0 && <ActionBtn action={actionPunch} condition={hasAP(2) && isMyTurn && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(231,76,60,0.3)' }}>👊 殴る (2AP)</ActionBtn>}
            {cp.charType === 'survivor' && <ActionBtn action={actionCamp} condition={hasAP(2) && isMyTurn && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(46,204,113,0.3)' }}>⛺ 野宿 (2AP)</ActionBtn>}
            {cp.charType === 'sales' && othersOnTile.length > 0 && <ActionBtn action={actionSalesVisit} condition={hasAP(2) && cp.hand.length > 0 && isMyTurn && !isBusy} failMsg="AP不足か手札がありません" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(243,156,18,0.3)' }}>📦 訪問販売 (2AP)</ActionBtn>}
            {cp.charType === 'hacker' && <ActionBtn action={actionHack} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(52,152,219,0.3)' }}>💻 ハッキング (3AP)</ActionBtn>}
            {cp.charType === 'musician' && <ActionBtn action={actionConcert} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(155,89,182,0.3)' }}>🎸 アンコール (3AP)</ActionBtn>}
            {cp.charType === 'doctor' && othersOnTile.length > 0 && <ActionBtn action={actionDarkCure} condition={hasAP(2) && isMyTurn && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(231,76,60,0.3)' }}>🩺 毒入り治療 (2AP)</ActionBtn>}
            {cp.charType === 'gambler' && <ActionBtn action={actionGamble} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(241,196,15,0.3)' }}>🎲 ドロー勝負 (3AP)</ActionBtn>}

            {/* Phase 3 characters */}
            {cp.charType === 'chef' && <ActionBtn action={actionChef} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(230,126,34,0.3)' }}>🍳 特製料理 (3AP)</ActionBtn>}
            {cp.charType === 'scavenger' && <ActionBtn action={actionScavenger} condition={hasAP(3) && cp.trash >= 3 && isMyTurn && !isBusy} failMsg="AP不足かゴミが足りません" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(52,152,219,0.3)' }}>🛠️ ガラクタ工作 (3AP)</ActionBtn>}
            {cp.charType === 'billionaire' && othersOnTile.length > 0 && <ActionBtn action={actionBribe} condition={hasAP(2) && isMyTurn && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(241,196,15,0.3)' }}>💴 買収 (2AP)</ActionBtn>}
            {cp.charType === 'god' && <ActionBtn action={actionOracle} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(241,196,15,0.3)', background: 'rgba(241,196,15,0.06)' }}>👼 神託 (3AP)</ActionBtn>}
            {cp.charType === 'emperor' && <ActionBtn action={actionCanBallista} condition={hasAP(2) && cp.cans >= 1 && isMyTurn && !isBusy} failMsg="AP不足か缶がありません" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(231,76,60,0.3)' }}>🥫 缶バリスタ (2AP)</ActionBtn>}
            {/* ▼ 修正: 天地開闢ボタンに現在の仙気スタック数を表示 */}
            {cp.charType === 'sennin' && <ActionBtn action={actionTenchi} condition={(cp.senki || 0) >= 5 && isMyTurn && !isBusy} failMsg="仙気スタックが足りません(5必要)" isMyTurn={isMyTurn} isBusy={isBusy} style={{ borderColor: 'rgba(155,89,182,0.3)' }}>🧘 天地開闢 (0AP) [仙気: {cp.senki || 0}/5]</ActionBtn>}

            {/* Detective compound buttons */}
            {cp.charType === 'detective' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <ActionBtn action={actionNpcMove} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy} style={{ flex: 1 }}>🕵️ 情報操作(3AP)</ActionBtn>
                        <ActionBtn action={actionSetTrap} condition={hasAP(2) && isMyTurn && !isBusy} failMsg="AP不足です" isMyTurn={isMyTurn} isBusy={isBusy} style={{ flex: 1 }}>🪤 罠の設置(2AP)</ActionBtn>
                    </div>
                    <button
                        className="dt-action-btn"
                        onPointerDown={() => useGameStore.setState({ isTrapScanActive: true })}
                        onPointerUp={() => useGameStore.setState({ isTrapScanActive: false })}
                        onPointerLeave={() => useGameStore.setState({ isTrapScanActive: false })}
                        style={{ borderColor: 'rgba(72,52,212,0.3)', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none', textAlign: 'center' }}
                    >
                        👁️ 長押しで罠スキャン
                    </button>
                </div>
            )}

            {/* Spacer */}
            <div style={{ flexGrow: 1, minHeight: 5 }} />

            {/* End turn */}
            <div style={{ display: 'flex', gap: 4 }}>
                <div id="btn-end" style={{ flex: 1 }}>
                    <ActionBtn
                        action={actionEndTurn}
                        condition={canEndTurn}
                        failMsg={isHandOverLimit ? '手札が上限です！カードを捨ててください' : '今は終了できません'}
                        highlight={canEndTurn && cp.ap === 0}
                        isMyTurn={isMyTurn}
                        isBusy={isBusy}
                        className={`end-turn ${canEndTurn && cp.ap === 0 && !isHandOverLimit ? 'pulse' : ''}`}
                    >
                        🛑 ターン終了
                    </ActionBtn>
                </div>
                {isMyTurn && showSkipButton && (
                    <button
                        className="dt-action-btn"
                        onClick={() => { useGameStore.setState({ isBranchPicking: false, mgActive: false, storyActive: false, turnBannerActive: false }); actionEndTurn(); }}
                        style={{ fontSize: 11, padding: '5px 10px', color: '#888' }}
                        title="エラーで動けなくなった場合に強制的にターンを終了します"
                    >
                        ⚡スキップ
                    </button>
                )}
            </div>
        </div>
    );
};