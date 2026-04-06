import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useUserStore } from '../../store/useUserStore';
import { syncGachaData } from '../../utils/userLogic';

// ========== 分割した全5パック（15ゲーム）をインポート ==========
// 【第1弾】直感・運試しゲームパック
import { BoxGame, VendGame, ScratchGame } from './MiniGamesPart1';

// 【第2弾】カジノ・論理ゲームパック
import { HLGame, SlotGame, OxoGame } from './MiniGamesPart2';

// 【第3弾】アクション・タップ連打パック
import { FlyGame, RatGame, DrunkGame } from './MiniGamesPart3';

// 【第4弾】アクション・移動＆タイミングパック
import { RainGame, KashiGame, MusicGame } from './MiniGamesPart4';

// 【第5弾】探索・駆け引きゲームパック
import { TrashGame, BegGame, NegoGame } from './MiniGamesPart5';

export default function MiniGameContainer() {
    const { selectedMiniGame } = useGameStore();

    // 共通処理: ゲームクリア時にガチャ資産を追加し、即座にクラウド同期する
    const handleGameEnd = async (earnedP) => {
        if (earnedP > 0) {
            useUserStore.getState().addGachaAssets(0, earnedP);
            await syncGachaData();
        }
    };

    // IDに応じた対象のゲームコンポーネントを呼び出す
    const renderGame = () => {
        switch (selectedMiniGame) {
            // ▼ 第1弾 (Part 1)
            case 'box':     return <BoxGame handleGameEnd={handleGameEnd} />;
            case 'vend':    return <VendGame handleGameEnd={handleGameEnd} />;
            case 'scratch': return <ScratchGame handleGameEnd={handleGameEnd} />;
            
            // ▼ 第2弾 (Part 2)
            case 'hl':      return <HLGame handleGameEnd={handleGameEnd} />;
            case 'slot':    return <SlotGame handleGameEnd={handleGameEnd} />;
            case 'oxo':     return <OxoGame handleGameEnd={handleGameEnd} />;
            
            // ▼ 第3弾 (Part 3)
            case 'fly':     return <FlyGame handleGameEnd={handleGameEnd} />;
            case 'rat':     return <RatGame handleGameEnd={handleGameEnd} />;
            case 'drunk':   return <DrunkGame handleGameEnd={handleGameEnd} />;
            
            // ▼ 第4弾 (Part 4)
            case 'rain':    return <RainGame handleGameEnd={handleGameEnd} />;
            case 'kashi':   return <KashiGame handleGameEnd={handleGameEnd} />;
            case 'music':   return <MusicGame handleGameEnd={handleGameEnd} />;
            
            // ▼ 第5弾 (Part 5)
            case 'trash':   return <TrashGame handleGameEnd={handleGameEnd} />;
            case 'beg':     return <BegGame handleGameEnd={handleGameEnd} />;
            case 'nego':    return <NegoGame handleGameEnd={handleGameEnd} />;
            
            // ▼ エラーハンドリング
            default: return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--red2)' }}>
                    <h1>Error</h1>
                    <p>Game ID "{selectedMiniGame}" not found.</p>
                    <button 
                        onClick={() => useGameStore.setState({ gamePhase: 'minigame_menu' })}
                        style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--card2)', color: 'var(--text)', border: '1px solid var(--border)' }}
                    >メニューへ戻る</button>
                </div>
            );
        }
    };

    return (
        <div style={{ 
            position: 'fixed', inset: 0, backgroundColor: '#0c0a07', 
            overflowY: 'auto', overflowX: 'hidden', zIndex: 1000, color: '#d4c4a0' 
        }}>
            {renderGame()}
        </div>
    );
}