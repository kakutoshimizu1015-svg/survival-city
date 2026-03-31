import { useGameStore } from '../store/useGameStore';
import { actionRollDice, actionEndTurn, executeMove } from './actions';

export const runCpuTurn = async () => {
    const state = useGameStore.getState();
    const { turn, players } = state;
    const currentPlayer = players[turn];

    if (!currentPlayer || !currentPlayer.isCPU || state.cpuActing) return;

    useGameStore.setState({ cpuActing: true });

    // 1. サイコロを振る
    await new Promise(r => setTimeout(r, 1000));
    await actionRollDice(true); 

    // 2. 移動 (APがなくなるまで繰り返す)
    let safetyLoop = 0;
    while (useGameStore.getState().players[turn].ap > 0 && safetyLoop < 15) {
        await new Promise(r => setTimeout(r, 800));
        const s = useGameStore.getState();
        const cp = s.players[turn];
        const tile = s.mapData.find(t => t.id === cp.pos);
        
        if (tile && tile.next && tile.next.length > 0) {
            const nextId = tile.next[Math.floor(Math.random() * tile.next.length)];
            executeMove(nextId);
        } else {
            break; // 進める道がなければループ終了
        }
        safetyLoop++;
    }

    // 3. ターン終了 (★必ず await をつける)
    await new Promise(r => setTimeout(r, 1000));
    await actionEndTurn();
    
    useGameStore.setState({ cpuActing: false });
};