import { useGameStore } from '../store/useGameStore';
import { logMsg } from './actions';
import { dealDamage } from './combat';

export const processRoundEnd = async () => {
    const state = useGameStore.getState();
    let newRound = state.roundCount + 1;
    
    if (newRound > state.maxRounds) {
        useGameStore.setState({ gameOver: true });
        logMsg(`🏆 指定ラウンド終了！ゲームクリア！`);
        return;
    }

    logMsg(`<span style="color:#2980b9">--- 🌙 ラウンド${newRound}/${state.maxRounds} 開始 ---</span>`);

    // 天候と相場の変動
    let weather = Math.random() < 0.2 ? "rainy" : Math.random() < 0.4 ? "cloudy" : "sunny";
    let isNight = Math.floor(newRound / 3) % 2 === 1;
    let canPrice = Math.max(1, Math.floor(Math.random() * 4));
    let trashPrice = Math.max(1, Math.floor(Math.random() * 6));

    // NPCのランダム再配置
    const md = state.mapData;
    const canTrashTiles = md.filter(t => t.type === 'can' || t.type === 'trash');
    let animalPos = canTrashTiles.length > 0 ? canTrashTiles[Math.floor(Math.random() * canTrashTiles.length)].id : 0;
    let unclePos = md[Math.floor(Math.random() * md.length)].id;
    let yakuzaPos = md[Math.floor(Math.random() * md.length)].id;
    let loansharkPos = md[Math.floor(Math.random() * md.length)].id;
    let friendPos = md[Math.floor(Math.random() * md.length)].id;

    // ごみ収集車イベント（簡易版）
    logMsg(`<span style="color:#c0392b">🛻 ごみ収集車が通過！</span>`);
    state.players.forEach(p => {
        if (p.hp > 0 && Math.random() < 0.15) {
            if (p.equip?.doll) {
                useGameStore.getState().updatePlayer(p.id, prev => ({ equip: { ...prev.equip, doll: false } }));
                logMsg(`🎎 身代わり人形が${p.name}を収集車から守った！`);
            } else {
                dealDamage(p.id, 50, "収集車");
                logMsg(`💥 ${p.name}が収集車に轢かれた！50ダメージ！`);
            }
        }
    });

    // 警察パトロール（偶数ラウンド）
    let newPolicePos = state.policePos;
    if (newRound % 2 === 0) {
        logMsg(`🚓 警察がパトロールを実施！`);
        newPolicePos = md[Math.floor(Math.random() * md.length)].id;
        state.players.forEach(p => {
            if (p.hp > 0 && p.pos === newPolicePos) {
                if (!p.stealth && !p.hasID) {
                    useGameStore.getState().updatePlayer(p.id, { penaltyAP: (p.penaltyAP || 0) + 2 });
                    logMsg(`🚓 ${p.name}が補導された！次回AP-2`);
                }
            }
        });
    }

    // 状態の更新
    useGameStore.setState({
        roundCount: newRound,
        weatherState: weather,
        isRainy: weather === "rainy",
        isNight, canPrice, trashPrice,
        animalPos, unclePos, yakuzaPos, loansharkPos, friendPos, policePos: newPolicePos
    });
};