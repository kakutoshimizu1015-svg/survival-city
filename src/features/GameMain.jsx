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

// オーバーレイ群
import { DiceOverlay } from '../components/overlays/DiceOverlay';
import { GameEventOverlays } from '../components/overlays/GameEventOverlays';
import { WeaponArcOverlay } from '../components/overlays/WeaponArcOverlay';
import { EnvironmentOverlay } from '../components/overlays/EnvironmentOverlay';
import { ShopOverlay } from '../components/overlays/ShopOverlay';
import { TurnOrderOverlay } from '../components/overlays/TurnOrderOverlay';
import { GameEffectsOverlay } from '../components/overlays/GameEffectsOverlay';
import { TeamActionOverlay } from '../components/overlays/TeamActionOverlay'; // ▼ チーム連携画面を追加

export const GameMain = () => {
    const { turn, players, gameOver, gamePhase } = useGameStore();
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

    // CPUの自動ターン進行
    useEffect(() => {
        if (gameOver) return;
        const currentPlayer = players[turn];
        if (currentPlayer && currentPlayer.isCPU) {
            if (status === 'connected' && !isHost) return;
            // ターンバナー表示中はCPUも待機
            if (!useGameStore.getState().turnBannerActive) runCpuTurn();
        }
    }, [turn, players, gameOver, status, isHost, useGameStore.getState().turnBannerActive]);

    return (
        <div id="game-screen" style={{ display: 'flex', width: '100%', height: '100dvh', maxWidth: '1800px', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', paddingBottom: '5px' }}>
            
            {/* 画面に重なる演出・UI群 */}
            <GameEffectsOverlay />
            <DiceOverlay />
            <GameEventOverlays />
            <WeaponArcOverlay />
            <EnvironmentOverlay />
            <ShopOverlay />
            <TurnOrderOverlay />
            <TeamActionOverlay /> {/* ▼ チーム連携画面 */}

            {/* 上部ステータスバー */}
            <div id="top-bar" style={{ display: 'flex', width: '100%', gap: '15px', marginBottom: '10px', alignItems: 'stretch', flexShrink: 0 }}>
                <div id="left-status-area" style={{ display: 'flex', gap: '15px', flexShrink: 0 }}>
                    <StatusPanel />
                </div>
                <HandCards />
            </div>

            {/* 中央マップ ＆ 右側アクションパネル */}
            <div id="main-area" style={{ display: 'flex', width: '100%', gap: '15px', flexGrow: 1, minHeight: 0 }}>
                <GameBoard />
                <div id="right-side-area" style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '220px', flexShrink: 0, overflowY: 'auto' }}>
                    <ActionPanel />
                    <PlayerList />
                </div>
            </div>
            
            {/* 下部ログ */}
            <LogPanel />
        </div>
    );
};