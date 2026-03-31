import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { ClayButton } from '../common/ClayButton';
import { actionRollDice, actionMove, actionCan, actionTrash, actionJob, actionOccupy, actionExchange, actionEndTurn, actionManhole } from '../../game/actions';
import { actionPunch, actionCamp, actionSalesVisit, actionHack, actionDarkCure, actionGamble, actionDash, actionConcert, actionNpcMove } from '../../game/skills';

export const ActionPanel = () => {
    const state = useGameStore();
    const { turn, players, mapData, diceRolled, isBranchPicking, mgActive, storyActive, canPickedThisTurn, territories, animalPos } = state;
    const cp = players[turn];
    const { myUserId, status, isHost } = useNetworkStore();

    if (!cp) return null;
    const currentTile = mapData.find(t => t.id === cp.pos) || {};
    const tileType = currentTile.type;

    let isMyTurn = !cp.isCPU;
    // オンライン時はホストならCPUも操作補助可能、人間なら本人のみ
    if (status === 'connected') { 
        isMyTurn = cp.isCPU ? isHost : (cp.userId === myUserId); 
    }

    const isBusy = isBranchPicking || mgActive || storyActive;
    const hasAP = (cost) => cp.ap >= cost;
    const othersOnTile = players.filter(p => p.id !== cp.id && p.pos === cp.pos && p.hp > 0);

    const canRoll = isMyTurn && !diceRolled && !isBusy;
    const canMove = isMyTurn && diceRolled && hasAP(1) && !isBusy;
    const isBlockedByAnimal = cp.pos === animalPos;
    
    const canDoCan = isMyTurn && diceRolled && hasAP(1) && tileType === 'can' && canPickedThisTurn < 3 && !isBlockedByAnimal && !isBusy;
    const canDoTrash = isMyTurn && diceRolled && hasAP(cp.equip?.shoes ? 1 : 2) && tileType === 'trash' && !isBlockedByAnimal && !isBusy;
    const canDoOccupy = isMyTurn && diceRolled && ["normal","can","trash","job","exchange","shelter"].includes(tileType) && territories[cp.pos] !== cp.id && !isBusy;

    // 手札上限オーバー時は行動不可
    const isHandOverLimit = cp.hand.length > cp.maxHand;
    const canEndTurn = isMyTurn && diceRolled && !isBusy && !isHandOverLimit;

    // フリーズ脱出用の強制終了処理
    const forceEndTurn = () => {
        useGameStore.setState({ isBranchPicking: false, mgActive: false, storyActive: false });
        actionEndTurn();
    };

    return (
        <div id="action-panel" className="panel">
            <div id="btn-roll"><ClayButton onClick={actionRollDice} disabled={!canRoll} highlight={canRoll}>🎲 サイコロを振る</ClayButton></div>
            <div id="btn-move"><ClayButton onClick={actionMove} disabled={!canMove} highlight={canMove}>🚶 移動 (1AP)</ClayButton></div>
            
            <div id="btn-can"><ClayButton onClick={actionCan} disabled={!canDoCan}>🥫 缶拾い (1AP)</ClayButton></div>
            <div id="btn-trash"><ClayButton onClick={actionTrash} disabled={!canDoTrash}>🗑️ ゴミ漁り ({cp.equip?.shoes ? 1 : 2}AP)</ClayButton></div>
            <div id="btn-occupy"><ClayButton onClick={actionOccupy} disabled={!canDoOccupy}>🚩 陣地占領 (3P〜)</ClayButton></div>
            <div id="btn-job"><ClayButton onClick={actionJob} disabled={!(isMyTurn && diceRolled && hasAP(3) && tileType === 'job' && !isBusy)} style={{borderColor: '#2980b9'}}>💼 バイト (3AP)</ClayButton></div>
            
            {tileType === 'exchange' && <ClayButton onClick={actionExchange} disabled={!(isMyTurn && diceRolled && (cp.cans > 0 || cp.trash > 0) && !isBusy)} style={{borderColor: '#d4a017'}}>💱 換金 (0AP)</ClayButton>}
            {tileType === 'manhole' && <ClayButton onClick={actionManhole} disabled={!(isMyTurn && diceRolled && hasAP(1) && !isBusy)} style={{borderColor: '#2c3e50'}}>🕳️ ワープ (1AP)</ClayButton>}
            {tileType === 'shop' && <ClayButton onClick={() => useGameStore.setState({ shopActive: true })} disabled={!(isMyTurn && diceRolled && !isBusy)} style={{borderColor: '#8e44ad'}}>🛒 ショップ</ClayButton>}

            <div id="btn-dash">{cp.charType === 'athlete' && <ClayButton onClick={actionDash} disabled={!hasAP(3) || !isMyTurn || isBusy} color="green">💨 疾風ダッシュ (3AP)</ClayButton>}</div>
            {cp.charType === 'yankee' && othersOnTile.length > 0 && <ClayButton onClick={actionPunch} disabled={!hasAP(2) || !isMyTurn || isBusy} color="red">👊 殴る (2AP)</ClayButton>}
            {cp.charType === 'survivor' && <ClayButton onClick={actionCamp} disabled={!hasAP(2) || !isMyTurn || isBusy} color="green">⛺ 野宿 (2AP)</ClayButton>}
            {cp.charType === 'sales' && othersOnTile.length > 0 && <ClayButton onClick={actionSalesVisit} disabled={!hasAP(2) || cp.hand.length === 0 || !isMyTurn || isBusy} style={{borderColor:'#f39c12'}}>📦 訪問販売 (2AP)</ClayButton>}
            {cp.charType === 'hacker' && <ClayButton onClick={actionHack} disabled={!hasAP(3) || !isMyTurn || isBusy} color="blue">💻 ハッキング (3AP)</ClayButton>}
            {cp.charType === 'musician' && <ClayButton onClick={actionConcert} disabled={!hasAP(4) || !isMyTurn || isBusy} style={{borderColor:'#9b59b6'}}>🎸 路上ライブ (4AP)</ClayButton>}
            {cp.charType === 'doctor' && othersOnTile.length > 0 && <ClayButton onClick={actionDarkCure} disabled={!hasAP(2) || !isMyTurn || isBusy} color="red">🩺 闇診療 (2AP)</ClayButton>}
            {cp.charType === 'gambler' && othersOnTile.length > 0 && <ClayButton onClick={actionGamble} disabled={!hasAP(2) || !isMyTurn || isBusy} style={{borderColor:'#f1c40f'}}>🎲 イカサマ勝負 (2AP)</ClayButton>}
            {cp.charType === 'detective' && <ClayButton onClick={actionNpcMove} disabled={!hasAP(3) || !isMyTurn || isBusy} style={{borderColor:'#95a5a6'}}>🕵️ 情報操作 (3AP)</ClayButton>}

            <div style={{ flexGrow: 1, minHeight: '5px' }}></div>
            
            {isHandOverLimit && <div style={{ color: '#e74c3c', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>手札が上限です！カードを捨てるか使ってください</div>}
            
            <div style={{ display: 'flex', gap: '5px' }}>
                <div id="btn-end" style={{ flex: 1 }}>
                    <ClayButton color="red" onClick={actionEndTurn} disabled={!canEndTurn} highlight={canEndTurn && cp.ap === 0}>🛑 ターン終了</ClayButton>
                </div>
                {/* フリーズ脱出用の強制スキップボタン（自分のターンの時だけ押せる） */}
                {isMyTurn && (
                    <button onClick={forceEndTurn} style={{ background: '#34495e', color: '#fff', border: 'none', borderRadius: '8px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer' }} title="エラーで動けなくなった場合に強制的にターンを終了します">
                        ⚡スキップ
                    </button>
                )}
            </div>
        </div>
    );
};