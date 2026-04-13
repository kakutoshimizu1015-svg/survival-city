import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { deckData } from '../../constants/cards';
import { ClayButton } from '../common/ClayButton';
import { actionRollDice, actionMove, actionCan, actionTrash, actionJob, actionOccupy, actionExchange, actionEndTurn, actionManhole, getOccupyCost } from '../../game/actions';
import { actionPunch, actionCamp, actionSalesVisit, actionHack, actionDarkCure, executeDarkCure, actionGamble, actionDash, actionConcert, actionNpcMove, actionSetTrap, setupSetTrap } from '../../game/skills';

const ActionBtn = ({ action, condition, failMsg, highlight, color, style, children, isMyTurn, isBusy }) => (
    <ClayButton 
        onClick={() => {
            if (!isMyTurn || isBusy) return;
            if (!condition) { useGameStore.getState().showToast(failMsg); return; }
            action();
        }}
        highlight={highlight}
        color={color}
        style={{ ...style, opacity: condition ? 1 : 0.4, cursor: condition ? 'pointer' : 'not-allowed' }}
    >
        {children}
    </ClayButton>
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

    const baseMoveCost = (state.isRainy && !cp.rainGear && cp.charType !== "athlete") ? 2 : 1;
    const currentMoveCost = baseMoveCost + (cp.nextMoveCostPenalty || 0);

    let isMyTurn = !cp.isCPU; 
    if (status === 'connected') { 
        isMyTurn = !cp.isCPU && cp.userId === myUserId; 
    }

    const isBusy = isBranchPicking || mgActive || storyActive || turnBannerActive || _roundEndInProgress || diceAnim.active;
    const hasAP = (cost) => cp.ap >= cost;
    const othersOnTile = players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);

    const canRoll = isMyTurn && !diceRolled && !isBusy;
    const canMove = isMyTurn && diceRolled && hasAP(currentMoveCost) && !cp.cannotMove && !isBusy;
    const isBlockedByAnimal = cp.pos === animalPos;
    
    const occupyCost = getOccupyCost(cp.pos);

    const canDoCan = isMyTurn && diceRolled && hasAP(1) && tileType === 'can' && canPickedThisTurn < 3 && !isBlockedByAnimal && !isBusy;
    const canDoTrash = isMyTurn && diceRolled && hasAP(cp.equip?.shoes ? 1 : 2) && tileType === 'trash' && !isBlockedByAnimal && !isBusy;
    const canDoOccupy = isMyTurn && diceRolled && tileType === 'normal' && territories[cp.pos] !== cp.id && !isBusy && cp.p >= occupyCost;
    const canDoJob = isMyTurn && diceRolled && hasAP(3) && tileType === 'job' && !isBusy;
    const canDoExchange = isMyTurn && diceRolled && (cp.cans > 0 || cp.trash > 0) && tileType === 'exchange' && !isBusy;
    const canDoShop = isMyTurn && diceRolled && tileType === 'shop' && !isBusy;

    const isHandOverLimit = cp.hand.length > cp.maxHand;
    const canEndTurn = isMyTurn && diceRolled && !isBusy && !isHandOverLimit;

    useEffect(() => {
        if (!isMyTurn || !diceRolled || isBusy || isHandOverLimit || cp.hp <= 0) return;

        let autoEndTimer;
        let warningTimer;

        if (cp.ap === 0) {
            const canUseCard = cp.hand.some(cId => {
                const cd = deckData.find(d => d.id === cId);
                return cd && cd.type !== 'weapon'; 
            });

            if (!canUseCard && !canDoShop && !canDoExchange && !canDoOccupy) {
                autoEndTimer = setTimeout(() => actionEndTurn(), 1500);
            } else {
                warningTimer = setTimeout(() => {
                    useGameStore.getState().showCenterWarning("ターンエンドしてください🛑");
                }, 30000);
            }
        }

        return () => {
            clearTimeout(autoEndTimer);
            clearTimeout(warningTimer);
        };
    }, [cp.ap, cp.hand.length, cp.maxHand, diceRolled, isBusy, isMyTurn, tileType, territories, cp.pos, cp.p, cp.cans, cp.trash, isHandOverLimit]);

    if (isTrapTypePicking && isMyTurn) {
        return (
            <div id="action-panel" className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ textAlign: 'center', color: '#fdf5e6', fontWeight: 'bold', marginBottom: '4px' }}>
                    🪤 設置する罠を選んでください
                </div>
                <ClayButton onClick={() => setupSetTrap('police')} style={{ background: '#3498db' }}>👮 警察罠 (AP減少)</ClayButton>
                <ClayButton onClick={() => setupSetTrap('pitfall')} style={{ background: '#e74c3c' }}>🕳️ 落とし穴 (ダメージ)</ClayButton>
                <ClayButton onClick={() => setupSetTrap('jamming')} style={{ background: '#9b59b6' }}>📡 情報撹乱 (手札破棄)</ClayButton>
                <ClayButton onClick={() => useGameStore.setState({ isTrapTypePicking: false })} style={{ background: '#95a5a6', marginTop: '4px' }}>✖ キャンセル</ClayButton>
            </div>
        );
    }

    if (isDarkCurePicking && isMyTurn) {
        return (
            <div id="action-panel" className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ textAlign: 'center', color: '#fdf5e6', fontWeight: 'bold', marginBottom: '4px' }}>🩺 治療する相手を選んでください</div>
                {darkCureTargets.map(tid => {
                    const t = players.find(p => p.id === tid);
                    return <ClayButton key={tid} onClick={() => executeDarkCure(tid)} style={{ background: '#e74c3c' }}>{t?.name} を治療</ClayButton>
                })}
                <ClayButton onClick={() => useGameStore.setState({ isDarkCurePicking: false, darkCureTargets: [] })} style={{ background: '#95a5a6', marginTop: '4px' }}>✖ キャンセル</ClayButton>
            </div>
        );
    }

    // ▼ フェーズ3: 新キャラ用UIプロンプト群
    const { isChefPicking, isScavengerPicking, isBribePicking, isCanBallistaPicking } = state;

    if (isChefPicking && isMyTurn) {
        return <div id="action-panel" className="panel" style={{ background: '#d35400', textAlign: 'center', padding: '15px' }}>🍳 手札の回復カードをタップして調理してください</div>;
    }

    if (isScavengerPicking && isMyTurn) {
        return (
            <div id="action-panel" className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>🛠️ 何を組み上げますか？ (ゴミ3個消費)</div>
                <ClayButton onClick={() => executeScavenger('equip')} style={{ background: '#2ecc71' }}>🛡️ 装備品を生成</ClayButton>
                <ClayButton onClick={() => executeScavenger('weapon')} style={{ background: '#e74c3c' }}>🔫 ショットガンを生成</ClayButton>
                <ClayButton onClick={() => useGameStore.setState({ isScavengerPicking: false })} style={{ background: '#95a5a6' }}>✖ キャンセル</ClayButton>
            </div>
        );
    }

    if (isBribePicking && isMyTurn) {
        const target = players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0)[0];
        return (
            <div id="action-panel" className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ textAlign: 'center', color: '#f1c40f', fontWeight: 'bold' }}>💴 ${target?.name}をどう買収しますか？</div>
                <ClayButton onClick={() => executeBribe(target.id, 'hand', 0)} disabled={cp.p < 5 || target.hand.length === 0} style={{ background: '#f39c12' }}>🃏 手札を1枚奪う (5P)</ClayButton>
                <ClayButton onClick={() => executeBribe(target.id, 'territory', cp.pos)} disabled={cp.p < 10 || territories[cp.pos] !== target.id} style={{ background: '#f39c12' }}>🚩 この陣地を奪う (倍額)</ClayButton>
                <ClayButton onClick={() => executeBribe(target.id, 'hire', 0)} disabled={cp.p < 10} style={{ background: '#f39c12' }}>💼 次ターン雇用する (10P)</ClayButton>
                <ClayButton onClick={() => useGameStore.setState({ isBribePicking: false })} style={{ background: '#95a5a6' }}>✖ キャンセル</ClayButton>
            </div>
        );
    }

    if (isCanBallistaPicking && isMyTurn) {
        return (
            <div id="action-panel" className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>🥫 缶を何個発射しますか？(現在:${cp.cans}個)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    <ClayButton onClick={() => useGameStore.setState({ canBallistaAmount: 3 })} style={{ background: cp.cans >= 3 ? '#e67e22' : '#7f8c8d' }}>3個 (10ダメ)</ClayButton>
                    <ClayButton onClick={() => useGameStore.setState({ canBallistaAmount: 6 })} style={{ background: cp.cans >= 6 ? '#e67e22' : '#7f8c8d' }}>6個 (25ダメ/AP-1)</ClayButton>
                    <ClayButton onClick={() => useGameStore.setState({ canBallistaAmount: 9 })} style={{ background: cp.cans >= 9 ? '#e67e22' : '#7f8c8d' }}>9個 (40ダメ/缶破壊)</ClayButton>
                    <ClayButton onClick={() => useGameStore.setState({ canBallistaAmount: 12 })} style={{ background: cp.cans >= 12 ? '#e67e22' : '#7f8c8d' }}>12個 (60ダメ/爆風)</ClayButton>
                </div>
                <div style={{ color:'#fdf5e6', fontSize:'10px', textAlign:'center' }}>※この後、マップ上の他プレイヤーの駒をタップしてください</div>
                <ClayButton onClick={() => useGameStore.setState({ isCanBallistaPicking: false })} style={{ background: '#95a5a6' }}>✖ キャンセル</ClayButton>
            </div>
        );
    }

    return (
        <div id="action-panel" className="panel">
            <div id="btn-roll"><ActionBtn action={actionRollDice} condition={canRoll} failMsg={diceRolled ? "すでにサイコロを振っています" : "今は振れません"} highlight={canRoll} isMyTurn={isMyTurn} isBusy={isBusy}>🎲 サイコロを振る</ActionBtn></div>
            <div id="btn-move"><ActionBtn action={actionMove} condition={canMove} failMsg={cp.cannotMove ? "足止めされています！" : !diceRolled ? "サイコロを振ってください" : "APが不足しています"} highlight={canMove} isMyTurn={isMyTurn} isBusy={isBusy}>🚶 移動 ({currentMoveCost}AP)</ActionBtn></div>
            <div id="btn-can"><ActionBtn action={actionCan} condition={canDoCan} failMsg={isBlockedByAnimal ? "野良犬がいて拾えません！" : canPickedThisTurn >= 3 ? "1ターンの拾う上限です" : "AP不足か場所が違います"} isMyTurn={isMyTurn} isBusy={isBusy}>🥫 缶拾い (1AP)</ActionBtn></div>
            <div id="btn-trash"><ActionBtn action={actionTrash} condition={canDoTrash} failMsg={isBlockedByAnimal ? "野良犬がいて漁れません！" : "AP不足か場所が違います"} isMyTurn={isMyTurn} isBusy={isBusy}>🗑️ ゴミ漁り ({cp.equip?.shoes ? 1 : 2}AP)</ActionBtn></div>
            <div id="btn-occupy"><ActionBtn action={actionOccupy} condition={canDoOccupy} failMsg={cp.p < occupyCost ? "Pが不足しています" : "このマスは陣地にできません"} isMyTurn={isMyTurn} isBusy={isBusy}>🚩 陣地占領 ({occupyCost}P)</ActionBtn></div>
            <div id="btn-job"><ActionBtn action={actionJob} condition={canDoJob} failMsg="AP不足か場所が違います" style={{borderColor: '#2980b9'}} isMyTurn={isMyTurn} isBusy={isBusy}>💼 バイト (3AP)</ActionBtn></div>
            
            {tileType === 'exchange' && <ActionBtn action={actionExchange} condition={canDoExchange} failMsg="換金するものがありません" style={{borderColor: '#d4a017'}} isMyTurn={isMyTurn} isBusy={isBusy}>💱 換金 (0AP)</ActionBtn>}
            {tileType === 'manhole' && <ActionBtn action={actionManhole} condition={isMyTurn && diceRolled && hasAP(1) && !isBusy} failMsg="AP不足です" style={{borderColor: '#2c3e50'}} isMyTurn={isMyTurn} isBusy={isBusy}>🕳️ ワープ (1AP)</ActionBtn>}
            {tileType === 'shop' && <ActionBtn action={() => useGameStore.setState({ shopActive: true })} condition={canDoShop} failMsg="今は開けません" style={{borderColor: '#8e44ad'}} isMyTurn={isMyTurn} isBusy={isBusy}>🛒 ショップ</ActionBtn>}

            <div id="btn-dash">{cp.charType === 'athlete' && <ActionBtn action={actionDash} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" color="green" isMyTurn={isMyTurn} isBusy={isBusy}>💨 疾風ダッシュ (3AP)</ActionBtn>}</div>
            {cp.charType === 'yankee' && othersOnTile.length > 0 && <ActionBtn action={actionPunch} condition={hasAP(2) && isMyTurn && !isBusy} failMsg="AP不足です" color="red" isMyTurn={isMyTurn} isBusy={isBusy}>👊 殴る (2AP)</ActionBtn>}
            {cp.charType === 'survivor' && <ActionBtn action={actionCamp} condition={hasAP(2) && isMyTurn && !isBusy} failMsg="AP不足です" color="green" isMyTurn={isMyTurn} isBusy={isBusy}>⛺ 野宿 (2AP)</ActionBtn>}
            {cp.charType === 'sales' && othersOnTile.length > 0 && <ActionBtn action={actionSalesVisit} condition={hasAP(2) && cp.hand.length > 0 && isMyTurn && !isBusy} failMsg="AP不足か手札がありません" style={{borderColor:'#f39c12'}} isMyTurn={isMyTurn} isBusy={isBusy}>📦 訪問販売 (2AP)</ActionBtn>}
            {cp.charType === 'hacker' && <ActionBtn action={actionHack} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" color="blue" isMyTurn={isMyTurn} isBusy={isBusy}>💻 ハッキング (3AP)</ActionBtn>}
            {cp.charType === 'musician' && <ActionBtn action={actionConcert} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" style={{borderColor:'#9b59b6'}} isMyTurn={isMyTurn} isBusy={isBusy}>🎸 アンコール (3AP)</ActionBtn>}
            {cp.charType === 'doctor' && othersOnTile.length > 0 && <ActionBtn action={actionDarkCure} condition={hasAP(2) && isMyTurn && !isBusy} failMsg="AP不足です" color="red" isMyTurn={isMyTurn} isBusy={isBusy}>🩺 毒入り治療 (2AP)</ActionBtn>}
            {cp.charType === 'gambler' && <ActionBtn action={actionGamble} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" style={{borderColor:'#f1c40f'}} isMyTurn={isMyTurn} isBusy={isBusy}>🎲 ドロー勝負 (3AP)</ActionBtn>}

            {/* ▼ フェーズ3: 新キャラクター専用ボタン */}
            {cp.charType === 'chef' && <ActionBtn action={actionChef} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" color="orange" isMyTurn={isMyTurn} isBusy={isBusy}>🍳 特製料理 (3AP)</ActionBtn>}
            {cp.charType === 'scavenger' && <ActionBtn action={actionScavenger} condition={hasAP(3) && cp.trash >= 3 && isMyTurn && !isBusy} failMsg="AP不足かゴミが足りません" color="blue" isMyTurn={isMyTurn} isBusy={isBusy}>🛠️ ガラクタ工作 (3AP)</ActionBtn>}
            {cp.charType === 'billionaire' && othersOnTile.length > 0 && <ActionBtn action={actionBribe} condition={hasAP(2) && isMyTurn && !isBusy} failMsg="AP不足です" color="yellow" isMyTurn={isMyTurn} isBusy={isBusy}>💴 買収 (2AP)</ActionBtn>}
            {cp.charType === 'god' && <ActionBtn action={actionOracle} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" style={{borderColor:'#f1c40f', background:'rgba(255,255,255,0.2)'}} isMyTurn={isMyTurn} isBusy={isBusy}>👼 神託 (3AP)</ActionBtn>}
            {cp.charType === 'emperor' && <ActionBtn action={actionCanBallista} condition={hasAP(2) && cp.cans >= 1 && isMyTurn && !isBusy} failMsg="AP不足か缶がありません" color="red" isMyTurn={isMyTurn} isBusy={isBusy}>🥫 缶バリスタ (2AP)</ActionBtn>}
            {cp.charType === 'sennin' && <ActionBtn action={actionTenchi} condition={cp.senki >= 5 && isMyTurn && !isBusy} failMsg="仙気スタックが足りません(5必要)" color="purple" isMyTurn={isMyTurn} isBusy={isBusy}>🧘 天地開闢 (0AP)</ActionBtn>}
            
            {cp.charType === 'detective' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <ActionBtn action={actionNpcMove} condition={hasAP(3) && isMyTurn && !isBusy} failMsg="AP不足です" style={{flex: 1, borderColor:'#95a5a6'}} isMyTurn={isMyTurn} isBusy={isBusy}>🕵️ 情報操作(3AP)</ActionBtn>
                        <ActionBtn action={actionSetTrap} condition={hasAP(2) && isMyTurn && !isBusy} failMsg="AP不足です" style={{flex: 1, borderColor:'#95a5a6'}} isMyTurn={isMyTurn} isBusy={isBusy}>🪤 罠の設置(2AP)</ActionBtn>
                    </div>
                    <button
                        onPointerDown={() => useGameStore.setState({ isTrapScanActive: true })}
                        onPointerUp={() => useGameStore.setState({ isTrapScanActive: false })}
                        onPointerLeave={() => useGameStore.setState({ isTrapScanActive: false })}
                        style={{ 
                            width: '100%', padding: '10px', borderRadius: '8px', border: '2px solid #4834d4',
                            background: 'rgba(72,52,212,0.2)', color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                            userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none'
                        }}
                    >
                        👁️ 長押しで罠スキャン
                    </button>
                </div>
            )}

            <div style={{ flexGrow: 1, minHeight: '5px' }}></div>
            
            <div style={{ display: 'flex', gap: '5px' }}>
                <div id="btn-end" style={{ flex: 1 }}>
                    <ActionBtn action={actionEndTurn} condition={canEndTurn} failMsg={isHandOverLimit ? "手札が上限です！カードを捨ててください" : "今は終了できません"} color="red" className={(canEndTurn && cp.ap === 0 && !isHandOverLimit) ? "btn-end-highlight" : ""} isMyTurn={isMyTurn} isBusy={isBusy}>🛑 ターン終了</ActionBtn>
                </div>
                {isMyTurn && showSkipButton && (
                    <button onClick={() => { useGameStore.setState({ isBranchPicking: false, mgActive: false, storyActive: false, turnBannerActive: false }); actionEndTurn(); }} style={{ background: '#34495e', color: '#fff', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer' }} title="エラーで動けなくなった場合に強制的にターンを終了します">
                        ⚡スキップ
                    </button>
                )}
            </div>
        </div>
    );
};