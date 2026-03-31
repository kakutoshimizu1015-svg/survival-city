import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useNetworkStore } from '../store/useNetworkStore';
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
import { TurnOrderOverlay } from '../components/overlays/TurnOrderOverlay';

export const GameMain = () => {
    const turn = useGameStore(state => state.turn);
    const players = useGameStore(state => state.players);
    const gameOver = useGameStore(state => state.gameOver);
    const { status, isHost } = useNetworkStore();

    useEffect(() => {
        if (gameOver) return;
        const currentPlayer = players[turn];
        
        if (currentPlayer && currentPlayer.isCPU) {
            if (status === 'connected' && !isHost) return;
            runCpuTurn();
        }
    }, [turn, players, gameOver, status, isHost]);

    return (
        // ▼ height: 100dvh と overflow: hidden で全体のはみ出しを防止！
        <div id="game-screen" style={{ display: 'flex', width: '100%', height: '100dvh', maxWidth: '1800px', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', paddingBottom: '5px' }}>
            
            <DiceOverlay />
            <GameEventOverlays />
            <WeaponArcOverlay />
            <EnvironmentOverlay />
            <ShopOverlay />
            <TurnOrderOverlay />

            <div id="top-bar" style={{ display: 'flex', width: '100%', gap: '15px', marginBottom: '10px', alignItems: 'stretch', flexShrink: 0 }}>
                <div id="left-status-area" style={{ display: 'flex', gap: '15px', flexShrink: 0 }}>
                    <StatusPanel />
                </div>
                <HandCards />
            </div>

            {/* ▼ flexGrow: 1 と minHeight: 0 で、このエリアが画面下端にピッタリ収まるようにする */}
            <div id="main-area" style={{ display: 'flex', width: '100%', gap: '15px', flexGrow: 1, minHeight: 0 }}>
                <GameBoard />
                <div id="right-side-area" style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '220px', flexShrink: 0, overflowY: 'auto' }}>
                    <ActionPanel />
                    <PlayerList />
                </div>
            </div>

            <LogPanel />
        </div>
    );
};