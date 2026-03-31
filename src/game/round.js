import { useGameStore } from '../store/useGameStore';
import { logMsg } from './actions';
import { dealDamage } from './combat';
import { playSfx } from '../utils/audio';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export const processRoundEnd = async () => {
    const state = useGameStore.getState();
    let newRound = state.roundCount + 1;
    
    if (newRound > state.maxRounds) {
        useGameStore.setState({ gameOver: true });
        playSfx('win');
        logMsg(`🏆 指定ラウンド終了！ゲームクリア！`);
        return;
    }

    logMsg(`<span style="color:#2980b9">--- 🌙 ラウンド${newRound}/${state.maxRounds} 開始 ---</span>`);

    let weather = Math.random() < 0.2 ? "rainy" : Math.random() < 0.4 ? "cloudy" : "sunny";
    let isNight = Math.floor(newRound / 3) % 2 === 1;
    let canPrice = Math.max(1, Math.floor(Math.random() * 4));
    let trashPrice = Math.max(1, Math.floor(Math.random() * 6));

    const md = state.mapData;
    const canTrashTiles = md.filter(t => t.type === 'can' || t.type === 'trash');
    let animalPos = canTrashTiles.length > 0 ? canTrashTiles[Math.floor(Math.random() * canTrashTiles.length)].id : 0;
    let unclePos = md[Math.floor(Math.random() * md.length)].id;
    let yakuzaPos = md[Math.floor(Math.random() * md.length)].id;
    let loansharkPos = md[Math.floor(Math.random() * md.length)].id;
    let friendPos = md[Math.floor(Math.random() * md.length)].id;

    // ▼ ごみ収集車のホラー演出スタート
    logMsg(`<span style="color:#c0392b">🛻 ごみ収集車が通過！</span>`);
    useGameStore.setState({ horrorMode: true });
    playSfx('hit');
    await sleep(800);

    const hitPlayers = [];
    state.players.forEach(p => {
        if (p.hp > 0 && Math.random() < 0.15) { // ランダムでひかれる確率
            if (p.equip?.doll) {
                useGameStore.getState().updatePlayer(p.id, prev => ({ equip: { ...prev.equip, doll: false } }));
                logMsg(`🎎 身代わり人形が${p.name}を収集車から守った！`);
                useGameStore.getState().addEventPopup(p.id, "🎎", "身代わり人形", "収集車を無効化", "good");
            } else {
                hitPlayers.push(p);
            }
        }
    });

    // 順番にひかれる演出
    for (let p of hitPlayers) {
        useGameStore.setState({ bloodAnim: p.name });
        dealDamage(p.id, 50, "収集車");
        await sleep(1000);
        useGameStore.setState({ bloodAnim: null });
    }

    useGameStore.setState({ horrorMode: false });
    // ▲ 演出終了

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
                    useGameStore.getState().addEventPopup(p.id, "🚓", "警察パトロール", "次回AP-2", "bad");
                }
            }
        });
    }

    // 予兆をセット
    useGameStore.setState({ disasterWarning: "次のラウンドは収集車が活発化するかもしれない..." });
    setTimeout(() => useGameStore.setState({ disasterWarning: null }), 3600);

    useGameStore.setState({
        roundCount: newRound, weatherState: weather, isRainy: weather === "rainy",
        isNight, canPrice, trashPrice,
        animalPos, unclePos, yakuzaPos, loansharkPos, friendPos, policePos: newPolicePos
    });
};