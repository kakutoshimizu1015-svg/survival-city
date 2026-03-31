import React, { useEffect, useRef } from 'react';
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
import { GameEffectsOverlay } from '../components/overlays/GameEffectsOverlay';
import { TeamActionOverlay } from '../components/overlays/TeamActionOverlay'; 

export const GameMain = () => {
    const { turn, players, gameOver, gamePhase, turnBannerActive } = useGameStore();
    const { status, isHost } = useNetworkStore();
    const prevTurn = useRef(-1);

    // ターンバナーの表示管理
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

    // CPUの自動ターン進行（修正版）
    useEffect(() => {
        if (gameOver || gamePhase !== 'playing') return;
        const currentPlayer = players[turn];
        if (currentPlayer && currentPlayer.isCPU) {
            if (status === 'connected' && !isHost) return;
            
            // ▼ ここがバグ修正のキモ。
            // 人間のターン終了時に一瞬だけ turnBannerActive が false のまま
            // turn が切り替わるタイミングがあり、そこでCPUが誤爆起動していたのを防ぐ
            // 「現在CPUが動いていない」「バナーが消えている」「自分の番である」ことのトリプルチェック
            const state = useGameStore.getState();
            if (!turnBannerActive && !state.cpuActing && state.turn === currentPlayer.id) {
                runCpuTurn();
            }
        }
    }, [turn, players, gameOver, gamePhase, status, isHost, turnBannerActive]);

    return (
        <div id="game-screen" style={{ display: 'flex', width: '100%', height: '100dvh', maxWidth: '1800px', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', paddingBottom: '5px' }}>
            
            <GameEffectsOverlay />
            <DiceOverlay />
            <GameEventOverlays />
            <WeaponArcOverlay />
            <EnvironmentOverlay />
            <ShopOverlay />
            <TurnOrderOverlay />
            <TeamActionOverlay />

            <div id="top-bar" style={{ display: 'flex', width: '100%', gap: '15px', marginBottom: '10px', alignItems: 'stretch', flexShrink: 0 }}>
                <div id="left-status-area" style={{ display: 'flex', gap: '15px', flexShrink: 0 }}>
                    <StatusPanel />
                </div>
                <HandCards />
            </div>

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