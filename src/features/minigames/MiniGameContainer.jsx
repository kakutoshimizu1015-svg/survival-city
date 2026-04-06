import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useUserStore } from '../../store/useUserStore';
import { syncGachaData } from '../../utils/userLogic';

// 第1〜5弾パックをすべてインポート
import { BoxGame, VendGame, ScratchGame } from './MiniGamesPart1';
import { HLGame, SlotGame, OxoGame } from './MiniGamesPart2';
import { FlyGame, RatGame, DrunkGame } from './MiniGamesPart3';
import { RainGame, KashiGame, MusicGame } from './MiniGamesPart4';
import { TrashGame, BegGame, NegoGame } from './MiniGamesPart5'; // ▼ 追加

export default function MiniGameContainer() {
    const { selectedMiniGame } = useGameStore();

    // ゲームクリア時にガチャ資産を追加しクラウド同期
    const handleGameEnd = async (earnedP) => {
        if (earnedP > 0) {
            useUserStore.getState().addGachaAssets(0, earnedP);
            await syncGachaData();
        }
    };

    const renderGame = () => {
        switch (selectedMiniGame) {
            // 第1弾
            case 'box': return <BoxGame handleGameEnd={handleGameEnd} />;
            case 'vend': return <VendGame handleGameEnd={handleGameEnd} />;
            case 'scratch': return <ScratchGame handleGameEnd={handleGameEnd} />;
            
            // 第2弾
            case 'hl': return <HLGame handleGameEnd={handleGameEnd} />;
            case 'slot': return <SlotGame handleGameEnd={handleGameEnd} />;
            case 'oxo': return <OxoGame handleGameEnd={handleGameEnd} />;
            
            // 第3弾
            case 'fly': return <FlyGame handleGameEnd={handleGameEnd} />;
            case 'rat': return <RatGame handleGameEnd={handleGameEnd} />;
            case 'drunk': return <DrunkGame handleGameEnd={handleGameEnd} />;
            
            // 第4弾
            case 'rain': return <RainGame handleGameEnd={handleGameEnd} />;
            case 'kashi': return <KashiGame handleGameEnd={handleGameEnd} />;
            case 'music': return <MusicGame handleGameEnd={handleGameEnd} />;
            
            // 第5弾
            case 'trash': return <TrashGame handleGameEnd={handleGameEnd} />;
            case 'beg': return <BegGame handleGameEnd={handleGameEnd} />;
            case 'nego': return <NegoGame handleGameEnd={handleGameEnd} />;
            
            // 万が一未知のIDが渡された場合のフォールバック
            default: return <div style={{ color: 'white', padding: 20, textAlign: 'center' }}>Error: Game Not Found</div>;
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#0c0a07', overflowY: 'auto', zIndex: 1000, color: '#d4c4a0' }}>
            {renderGame()}
        </div>
    );
}