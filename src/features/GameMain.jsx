import React, { useEffect, useRef, useState } from 'react';
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
import { EnvironmentOverlay } from '../components/overlays/EnvironmentOverlay';
import { ShopOverlay } from '../components/overlays/ShopOverlay';
import { TurnOrderOverlay } from '../components/overlays/TurnOrderOverlay';
import { GameEffectsOverlay } from '../components/overlays/GameEffectsOverlay';
import { TeamActionOverlay } from '../components/overlays/TeamActionOverlay'; 
import { AwardsOverlay } from '../components/overlays/AwardsOverlay';
import { ChatOverlay } from '../components/overlays/ChatOverlay'; // ▼ 追加
import { ChatInput } from '../components/overlays/ChatInput'; // ▼ 追加

export const GameMain = () => {
    const { turn, players, gameOver, gamePhase, turnBannerActive } = useGameStore();
    const { status, isHost } = useNetworkStore();
    const prevTurn = useRef(-1);
    
    // ▼ 追加: スマホレイアウト判定用のステート
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

    useEffect(() => {
        const updateLayout = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile) {
                document.body.classList.add('layout-mobile');
            } else {
                document.body.classList.remove('layout-mobile');
            }
        };

        // 初回と再マウント時に実行
        updateLayout(); 
        
        // 画面幅が変わった際にも実行
        window.addEventListener('resize', updateLayout);
        return () => {
            window.removeEventListener('resize', updateLayout);
        };
    }, []);

    return (
        <div id="game-screen" className="game-screen">
            <GameEffectsOverlay />
            <DiceOverlay />
            <GameEventOverlays />
            <EnvironmentOverlay />
            <ShopOverlay />
            <TurnOrderOverlay />
            <TeamActionOverlay />
            <AwardsOverlay />
            
            {/* ▼ 追加: 画面を流れるチャット */}
            <ChatOverlay />

            <div id="top-bar" className="top-bar">
                <div id="left-status-area" className="left-status-area">
                    <StatusPanel />
                </div>
                {/* PCレイアウト時は上に配置 */}
                {!isMobile && <HandCards />}
            </div>

            <div id="main-area" className="main-area">
                <GameBoard />
                <div id="right-side-area" className="right-side-area">
                    <ActionPanel />
                    <PlayerList />
                </div>
            </div>
            
            {/* スマホレイアウト時はここに手札一覧を配置 */}
            {isMobile && <HandCards />}

            {/* ▼ 追加: チャット入力欄をログパネルの真上に配置 */}
            <ChatInput />
            
            <LogPanel />
        </div>
    );
};