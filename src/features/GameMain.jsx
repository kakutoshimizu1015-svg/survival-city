import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { runCpuTurn } from '../game/cpu';

import { StatusPanel } from '../components/player/StatusPanel';
import { HandCards } from '../components/player/HandCards';
import { ActionPanel } from '../components/player/ActionPanel';
import { PlayerList } from '../components/player/PlayerList';
import { GameBoard } from '../components/board/GameBoard';
import { LogPanel } from '../components/board/LogPanel';
import { DiceOverlay } from '../components/overlays/DiceOverlay';
import { GameEventOverlays } from '../components/overlays/GameEventOverlays';
import { WeaponArcOverlay } from '../components/overlays/WeaponArcOverlay';
import { EnvironmentOverlay } from '../components/overlays/EnvironmentOverlay';
import { ShopOverlay } from '../components/overlays/ShopOverlay';
import { TurnOrderOverlay } from '../components/overlays/TurnOrderOverlay'; // ▼ 新規追加！

export const GameMain = () => {
    const turn = useGameStore(state => state.turn);
    const players = useGameStore(state => state.players);
    const gameOver = useGameStore(state => state.gameOver);

    useEffect(() => {
        if (gameOver) return;
        const currentPlayer = players[turn];
        if (currentPlayer && currentPlayer.isCPU) {
            runCpuTurn();
        }
    }, [turn, players, gameOver]);

    return (
        <div id="game-screen" style={{ display: 'flex', width: '100%', maxWidth: '1800px', flexDirection: 'column', alignItems: 'center' }}>
            
            <DiceOverlay />
            <GameEventOverlays />
            <WeaponArcOverlay />
            <EnvironmentOverlay />
            <ShopOverlay />
            <TurnOrderOverlay /> {/* ▼ 新規追加！ */}

            <div id="top-bar" style={{ display: 'flex', width: '100%', gap: '15px', marginBottom: '15px', alignItems: 'stretch' }}>
                <div id="left-status-area" style={{ display: 'flex', gap: '15px', flexShrink: 0 }}>
                    <StatusPanel />
                </div>
                <HandCards />
            </div>

            <div id="main-area" style={{ display: 'flex', width: '100%', gap: '15px' }}>
                <GameBoard />
                <div id="right-side-area" style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '220px', flexShrink: 0 }}>
                    <ActionPanel />
                    <PlayerList />
                </div>
            </div>

            <LogPanel />
        </div>
    );
};