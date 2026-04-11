import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { deckData } from '../../constants/cards';
import { ClayButton } from '../common/ClayButton';
// ▼ 修正: getOccupyCost をインポート
import { actionRollDice, actionMove, actionCan, actionTrash, actionJob, actionOccupy, actionExchange, actionEndTurn, actionManhole, getOccupyCost } from '../../game/actions';
import { actionPunch, actionCamp, actionSalesVisit, actionHack, actionDarkCure, actionGamble, actionDash, actionConcert, actionNpcMove, actionSetTrap, setupSetTrap } from '../../game/skills';

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
    // ▼ 修正: isTrapPicking を展開に追加
    const { turn, players, mapData, diceRolled, diceAnim, isBranchPicking, mgActive, storyActive, canPickedThisTurn, territories, animalPos, turnBannerActive, showSkipButton, _roundEndInProgress, isTrapPicking } = state;
    const cp = players[turn];
    const { myUserId, status } = useNetworkStore();

    if (!cp) return null;
    const currentTile = mapData.find(t => t.id === cp.pos) || {};
    const tileType = currentTile.type;

    // ▼ 追加: 現在の移動コストを動的に計算（雨ペナルティ＋アンコール等のデバフ）
    const baseMoveCost = (state.isRainy && !cp.rainGear && cp.charType !== "athlete") ? 2 : 1;
    const currentMoveCost = baseMoveCost + (cp.nextMoveCostPenalty || 0);

    let isMyTurn = !cp.isCPU; 
    if (status === 'connected') { 
        isMyTurn = !cp.isCPU && cp.userId === myUserId; 
    }

    // ▼ 修正: diceAnim.active を追加
    const isBusy = isBranchPicking || mgActive || storyActive || turnBannerActive || _roundEndInProgress || diceAnim.active;
    const hasAP = (cost) => cp.ap >= cost;
    const othersOnTile = players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);

    const canRoll = isMyTurn && !diceRolled && !isBusy;
    // ▼ 修正: hasAP(1) を hasAP(currentMoveCost) に変更
    const canMove = isMyTurn && diceRolled && hasAP(currentMoveCost) && !cp.cannotMove && !isBusy;
    const isBlockedByAnimal = cp.pos === animalPos;
    
    // ▼ 修正: ボタンに表示する動的な価格を取得
    const occupyCost = getOccupyCost(cp.pos);

    const canDoCan = isMyTurn && diceRolled && hasAP(1) && tileType === 'can' && canPickedThisTurn < 3 && !isBlockedByAnimal && !isBusy;
    const canDoTrash = isMyTurn && diceRolled && hasAP(cp.equip?.shoes ? 1 : 2) && tileType === 'trash' && !isBlockedByAnimal && !isBusy;
    // ▼ 修正: 動的なコスト(occupyCost) で判定を行うように変更
// ★ 修正: 陣地化できる条件を "normal" (道マス) のみに変更
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

    // ▼ 追加: 罠の設置モードがONの場合、通常のアクションパネルを隠して「罠選択UI」を表示する
    if (isTrapPicking && isMyTurn) {
        return (
            <div id="action-panel" className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ textAlign: 'center', color: '#fdf5e6', fontWeight: 'bold', marginBottom: '4px' }}>
                    🪤 設置する罠を選んでください
                </div>
                <ClayButton onClick={() => setupSetTrap('police')} style={{ background: '#3498db' }}>👮 警察罠 (AP減少)</ClayButton>
                <ClayButton onClick={() => setupSetTrap('pitfall')} style={{ background: '#e74c3c' }}>🕳️ 落とし穴 (ダメージ)</ClayButton>
                <ClayButton onClick={() => setupSetTrap('jamming')} style={{ background: '#9b59b6' }}>📡 情報撹乱 (手札破棄)</ClayButton>
                <ClayButton onClick={() => useGameStore.setState({ isTrapPicking: false })} style={{ background: '#95a5a6', marginTop: '4px' }}>✖ キャンセル</ClayButton>
            </div>
        );
    }

    return (
        <div id="action-panel" className="panel">
            <div id="btn-roll"><ActionBtn action={actionRollDice} condition={canRoll} failMsg={diceRolled ? "すでにサイコロを振っています" : "今は振れません"} highlight={canRoll} isMyTurn={isMyTurn} isBusy={isBusy}>🎲 サイコロを振る</ActionBtn></div>
            {/* ▼ 修正: テキストを (1AP) から ({currentMoveCost}AP) に変更 */}
            <div id="btn-move"><ActionBtn action={actionMove} condition={canMove} failMsg={cp.cannotMove ? "足止めされています！" : !diceRolled ? "サイコロを振ってください" : "APが不足しています"} highlight={canMove} isMyTurn={isMyTurn} isBusy={isBusy}>🚶 移動 ({currentMoveCost}AP)</ActionBtn></div>
            <div id="btn-can"><ActionBtn action={actionCan} condition={canDoCan} failMsg={isBlockedByAnimal ? "野良犬がいて拾えません！" : canPickedThisTurn >= 3 ? "1ターンの拾う上限です" : "AP不足か場所が違います"} isMyTurn={isMyTurn} isBusy={isBusy}>🥫 缶拾い (1AP)</ActionBtn></div>
            <div id="btn-trash"><ActionBtn action={actionTrash} condition={canDoTrash} failMsg={isBlockedByAnimal ? "野良犬がいて漁れません！" : "AP不足か場所が違います"} isMyTurn={isMyTurn} isBusy={isBusy}>🗑️ ゴミ漁り ({cp.equip?.shoes ? 1 : 2}AP)</ActionBtn></div>
            {/* ▼ 修正: ボタンテキストに occupyCost を表示 */}
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
            
            {/* ▼ 探偵のスキルボタン（情報操作＆罠の設置）と長押しスキャン */}
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
                            userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none' // 長押し時のテキスト選択・メニューを防止
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