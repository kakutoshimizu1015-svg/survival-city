import { useGameStore } from '../store/useGameStore';
import { logMsg } from './actions';
import { moveNPCs } from './npc';

export const processRoundEnd = async () => {
    const state = useGameStore.getState();
    const newRound = state.roundCount + 1;

    logMsg(`<div style="color:#f1c40f; font-weight:bold; border-top:1px solid #f1c40f">⏰ ラウンド ${newRound} 開始</div>`);

    // 1. 天候の変化 (30%で雨)
    const isRainy = Math.random() < 0.3;
    const weatherState = isRainy ? 'rainy' : 'sunny';
    
    // 2. 昼夜の切り替え (2ラウンドごとに交代)
    const isNight = Math.floor(newRound / 2) % 2 === 1;

    // 3. 物価の変動
    const newCanPrice = isRainy ? 2 : 1; // 雨の日は缶が高い
    
    useGameStore.setState({
        roundCount: newRound,
        isRainy,
        weatherState,
        isNight,
        canPrice: newCanPrice
    });

    if (isRainy) logMsg("🌧️ 雨が降り始めました。風邪に注意してください。");
    if (isNight) logMsg("🌙 夜になりました。視界が悪くなります。");

    // 4. NPCの移動処理
    await moveNPCs();

    // 5. ゲーム終了判定
    if (newRound >= state.maxRounds) {
        useGameStore.setState({ gameOver: true });
        logMsg("🏁 全ラウンド終了！リザルトを表示します。");
    }
};