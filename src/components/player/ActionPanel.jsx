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
    
    const { myUserId, status } = useNetworkStore();

    if (!cp) return null;
    const currentTile = mapData.find(t => t.id === cp.pos) || {};
    const tileType = currentTile.type;

    // ▼ 超重要：オンラインなら「自分のターン」の時だけ操作できるようにする
    let isMyTurn = !cp.isCPU;
    if (status === 'connected') {
        isMyTurn = (cp.userId === myUserId);
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

    return (
        <div id="action-panel" className="panel">
            <ClayButton onClick={actionRollDice} disabled={!canRoll} highlight={canRoll}>🎲 サイコロを振る</ClayButton>
            <ClayButton onClick={actionMove} disabled={!canMove} highlight={canMove}>🚶 移動 (1AP)</ClayButton>
            
            <ClayButton onClick={actionCan} disabled={!canDoCan}>🥫 缶拾い (1AP)</ClayButton>
            <ClayButton onClick={actionTrash} disabled={!canDoTrash}>🗑️ ゴミ漁り ({cp.equip?.shoes ? 1 : 2}AP)</ClayButton>
            <ClayButton onClick={actionOccupy} disabled={!canDoOccupy}>🚩 陣地占領 (3P〜)</ClayButton>
            <ClayButton onClick={actionJob} disabled={!(isMyTurn && diceRolled && hasAP(3) && tileType === 'job' && !isBusy)} style={{borderColor: '#2980b9'}}>💼 バイト (3AP)</ClayButton>
            
            {tileType === 'exchange' && <ClayButton onClick={actionExchange} disabled={!(isMyTurn && diceRolled && (cp.cans > 0 || cp.trash > 0) && !isBusy)} style={{borderColor: '#d4a017'}}>💱 換金 (0AP)</ClayButton>}
            {tileType === 'manhole' && <ClayButton onClick={actionManhole} disabled={!(isMyTurn && diceRolled && hasAP(1) && !isBusy)} style={{borderColor: '#2c3e50'}}>🕳️ ワープ (1AP)</ClayButton>}
            {tileType === 'shop' && <ClayButton onClick={() => useGameStore.setState({ shopActive: true })} disabled={!(isMyTurn && diceRolled && !isBusy)} style={{borderColor: '#8e44ad'}}>🛒 ショップ</ClayButton>}

            {cp.charType === 'athlete' && <ClayButton onClick={actionDash} disabled={!hasAP(3) || !isMyTurn} color="green">💨 疾風ダッシュ (3AP)</ClayButton>}
            {cp.charType === 'yankee' && othersOnTile.length > 0 && <ClayButton onClick={actionPunch} disabled={!hasAP(2) || !isMyTurn} color="red">👊 殴る (2AP)</ClayButton>}
            {cp.charType === 'survivor' && <ClayButton onClick={actionCamp} disabled={!hasAP(2) || !isMyTurn} color="green">⛺ 野宿 (2AP)</ClayButton>}
            {cp.charType === 'sales' && othersOnTile.length > 0 && <ClayButton onClick={actionSalesVisit} disabled={!hasAP(2) || cp.hand.length === 0 || !isMyTurn} style={{borderColor:'#f39c12'}}>📦 訪問販売 (2AP)</ClayButton>}
            {cp.charType === 'hacker' && <ClayButton onClick={actionHack} disabled={!hasAP(3) || !isMyTurn} color="blue">💻 ハッキング (3AP)</ClayButton>}
            {cp.charType === 'musician' && <ClayButton onClick={actionConcert} disabled={!hasAP(4) || !isMyTurn} style={{borderColor:'#9b59b6'}}>🎸 路上ライブ (4AP)</ClayButton>}
            {cp.charType === 'doctor' && othersOnTile.length > 0 && <ClayButton onClick={actionDarkCure} disabled={!hasAP(2) || !isMyTurn} color="red">🩺 闇診療 (2AP)</ClayButton>}
            {cp.charType === 'gambler' && othersOnTile.length > 0 && <ClayButton onClick={actionGamble} disabled={!hasAP(2) || !isMyTurn} style={{borderColor:'#f1c40f'}}>🎲 イカサマ勝負 (2AP)</ClayButton>}
            {cp.charType === 'detective' && <ClayButton onClick={actionNpcMove} disabled={!hasAP(3) || !isMyTurn} style={{borderColor:'#95a5a6'}}>🕵️ 情報操作 (3AP)</ClayButton>}

            <div style={{ flexGrow: 1, minHeight: '5px' }}></div>
            <ClayButton color="red" onClick={actionEndTurn} disabled={!isMyTurn || !diceRolled || isBusy}>🛑 ターン終了</ClayButton>
        </div>
    );
};