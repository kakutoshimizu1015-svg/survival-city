import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useNetworkStore } from '../store/useNetworkStore';
import { runCpuTurn } from '../game/cpu';

import { StatusPanel } from '../components/player/StatusPanel';
import { HandCards } from '../components/player/HandCards';
import { ActionPanel } from '../components/player/ActionPanel';
import { PlayerList } from '../components/player/PlayerList';
import { GameBoard } from '../components/board/GameBoard';
import { LogPanel } from '../components/board/LogPanel'; // ログパネルをインポート

import { DiceOverlay } from '../components/overlays/DiceOverlay';
import { GameEventOverlays } from '../components/overlays/GameEventOverlays';
import { WeaponArcOverlay } from '../components/overlays/WeaponArcOverlay';
import { EnvironmentOverlay } from '../components/overlays/EnvironmentOverlay';
import { ShopOverlay } from '../components/overlays/ShopOverlay';
import { TurnOrderOverlay } from '../components/overlays/TurnOrderOverlay';
import { GameEffectsOverlay } from '../components/overlays/GameEffectsOverlay';
import { TeamActionOverlay } from '../components/overlays/TeamActionOverlay'; 

export const GameMain = () => {
    const { turn, players, gameOver, gamePhase, turnBannerActive } = useGameStore();
    const { status, isHost } = useNetworkStore();
    const prevTurn = useRef(-1);

    // ターンバナー表示
    useEffect(() => {
        if (gamePhase !== 'playing' || gameOver || !players[turn]) return;
        if (prevTurn.current !== turn) {
            prevTurn.current = turn;
            useGameStore.setState({ turnBanner: players[turn], turnBannerActive: true });
            setTimeout(() => {
                useGameStore.setState({ turnBanner: null });
                setTimeout(() => useGameStore.setState({ turnBannerActive: false }), 1000);
            }, 1500);
        }
    }, [turn, players, gameOver, gamePhase]);

    // CPUの自動ターン進行
    useEffect(() => {
        if (gameOver || gamePhase !== 'playing') return;
        const currentPlayer = players[turn];
        if (currentPlayer && currentPlayer.isCPU) {
            if (status === 'connected' && !isHost) return;
            const state = useGameStore.getState();
            if (!turnBannerActive && !state.cpuActing && state.turn === currentPlayer.id) {
                runCpuTurn();
            }
        }
    }, [turn, players, gameOver, gamePhase, status, isHost, turnBannerActive]);

    // モバイルレイアウト付与判定
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                document.body.classList.add('layout-mobile');
            } else {
                document.body.classList.remove('layout-mobile');
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // 初回
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div id="game-screen" className="game-screen">
            <GameEffectsOverlay />
            <DiceOverlay />
            <GameEventOverlays />
            <WeaponArcOverlay />
            <EnvironmentOverlay />
            <ShopOverlay />
            <TurnOrderOverlay />
            <TeamActionOverlay />

            <div id="top-bar" className="top-bar">
                <div id="left-status-area" className="left-status-area">
                    <StatusPanel />
                </div>
                <HandCards />
            </div>

            <div id="main-area" className="main-area">
                <GameBoard />
                <div id="right-side-area" className="right-side-area">
                    <ActionPanel />
                    <PlayerList />
                </div>
            </div>
            
            {/* ▼ ログパネルを復活 */}
            <LogPanel />
        </div>
    );
};