import { create } from 'zustand';
import Peer from 'peerjs';
import { ref, set, get, onDisconnect, remove, onValue, off, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { useGameStore } from './useGameStore';
import { processRoundEnd } from '../game/round';

// ネットワーク受信中フラグ（無限ループ防止用）
let isReceivingNetworkData = false;

export const useNetworkStore = create((setStore, getStore) => ({
    myUserId: Math.random().toString(36).substring(2, 10),
    isHost: false,
    roomId: null,
    peer: null,
    connections: [], 
    hostConnection: null, 
    lobbyPlayers: [], 
    status: 'disconnected', 
    activeRooms: [],

    subscribeToRooms: () => {
        const roomsRef = ref(db, 'rooms');
        onValue(roomsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const roomsList = Object.entries(data).map(([roomId, info]) => ({ roomId, ...info })).filter(room => room.status === 'waiting');
                setStore({ activeRooms: roomsList });
            } else { setStore({ activeRooms: [] }); }
        });
    },

    unsubscribeFromRooms: () => off(ref(db, 'rooms')),

    createRoom: async (roomCode, playerName) => {
        setStore({ status: 'connecting', isHost: true, roomId: roomCode });
        const peer = new Peer();
        peer.on('open', async (id) => {
            const roomRef = ref(db, `rooms/${roomCode}`);
            await set(roomRef, { hostPeerId: id, createdAt: Date.now(), hostName: playerName, status: 'waiting' });
            onDisconnect(roomRef).remove(); 
            setStore({ peer, status: 'connected', lobbyPlayers: [{ userId: getStore().myUserId, name: playerName, charType: 'athlete', teamColor: 'none', isHost: true, isCPU: false }] });
        });

        peer.on('connection', (conn) => {
            conn.on('open', () => {
                setStore(state => ({ connections: [...state.connections, conn] }));
                conn.on('data', (data) => {
                    if (data.type === 'JOIN') {
                        const newPlayer = { ...data.user, isHost: false, isCPU: false };
                        const updatedPlayers = [...getStore().lobbyPlayers, newPlayer];
                        setStore({ lobbyPlayers: updatedPlayers });
                        getStore().broadcast({ type: 'LOBBY_UPDATE', players: updatedPlayers });
                    }
                    if (data.type === 'LOBBY_CHANGE') {
                        const updatedPlayers = getStore().lobbyPlayers.map(p => p.userId === data.user.userId ? { ...p, ...data.user } : p);
                        setStore({ lobbyPlayers: updatedPlayers });
                        getStore().broadcast({ type: 'LOBBY_UPDATE', players: updatedPlayers });
                    }
                    if (data.type === 'GAME_SYNC') {
                        if (data.lastUpdater !== getStore().myUserId) {
                            isReceivingNetworkData = true;
                            
                            // ▼ ログのDOM同期処理
                            const logger = document.getElementById("log");
                            if (logger && data.gameState.logs) {
                                logger.innerHTML = data.gameState.logs.map(msg => `<div>> ${msg}</div>`).join('');
                                logger.scrollTop = logger.scrollHeight;
                            }

                            useGameStore.setState(data.gameState);
                            // ▼ 修正: ガード時間を50ms → 200msに延長（長時間非同期処理中の再broadcast防止）
                            setTimeout(() => { isReceivingNetworkData = false; }, 200);
                        }
                        getStore().connections.forEach(c => {
                            if (c.peer !== conn.peer && c.open) c.send(data);
                        });
                    }

                    // ▼ 追加: ゲストからのラウンド終了リクエスト（ホスト側でのみ処理を実行）
                    if (data.type === 'REQUEST_ROUND_END') {
                        const gameState = useGameStore.getState();
                        if (gameState.gamePhase === 'playing' && !gameState.gameOver) {
                            (async () => {
                                try {
                                    await processRoundEnd();
                                    useGameStore.setState(s => ({ turn: (s.turn + 1) % s.players.length, diceRolled: false }));
                                } catch (e) {
                                    console.error("Host processRoundEnd error:", e);
                                    useGameStore.setState(s => ({ turn: (s.turn + 1) % s.players.length, diceRolled: false }));
                                }
                            })();
                        }
                    }
                });
            });
            conn.on('close', () => {
                setStore(state => ({ connections: state.connections.filter(c => c.peer !== conn.peer) }));
                const currentPlayers = getStore().lobbyPlayers.filter(p => p.userId !== conn.peer);
                setStore({ lobbyPlayers: currentPlayers });
                getStore().broadcast({ type: 'LOBBY_UPDATE', players: currentPlayers });
            });
        });
    },

    joinRoom: async (roomCode, playerName) => {
        setStore({ status: 'connecting', isHost: false, roomId: roomCode });
        const roomRef = ref(db, `rooms/${roomCode}`);
        const snapshot = await get(roomRef);
        if (!snapshot.exists()) { setStore({ status: 'error' }); return; }

        const peer = new Peer(getStore().myUserId); 
        peer.on('open', () => {
            const conn = peer.connect(snapshot.val().hostPeerId);
            conn.on('open', () => {
                setStore({ peer, hostConnection: conn, status: 'connected' });
                conn.send({ type: 'JOIN', user: { userId: getStore().myUserId, name: playerName, charType: 'athlete', teamColor: 'none' } }); 
                conn.on('data', (data) => {
                    if (data.type === 'LOBBY_UPDATE') setStore({ lobbyPlayers: data.players });
                    if (data.type === 'GAME_START') useGameStore.setState({ ...data.gameState, gamePhase: 'playing' });
                    if (data.type === 'GAME_SYNC') {
                        if (data.lastUpdater !== getStore().myUserId) {
                            isReceivingNetworkData = true;
                            
                            // ▼ ログのDOM同期処理
                            const logger = document.getElementById("log");
                            if (logger && data.gameState.logs) {
                                logger.innerHTML = data.gameState.logs.map(msg => `<div>> ${msg}</div>`).join('');
                                logger.scrollTop = logger.scrollHeight;
                            }

                            useGameStore.setState(data.gameState);
                            // ▼ 修正: ガード時間を50ms → 200msに延長
                            setTimeout(() => { isReceivingNetworkData = false; }, 200);
                        }
                    }
                });
            });
            conn.on('error', () => setStore({ status: 'error' }));
        });
    },

    updateMyInfo: (updater) => {
        const state = getStore();
        const me = state.lobbyPlayers.find(p => p.userId === state.myUserId);
        if (!me) return;
        const newUser = { ...me, ...updater };
        if (state.isHost) {
            const updatedPlayers = state.lobbyPlayers.map(p => p.userId === state.myUserId ? newUser : p);
            setStore({ lobbyPlayers: updatedPlayers });
            state.broadcast({ type: 'LOBBY_UPDATE', players: updatedPlayers });
        } else if (state.hostConnection && state.hostConnection.open) {
            state.hostConnection.send({ type: 'LOBBY_CHANGE', user: newUser });
        }
    },

    addCpu: () => {
        const state = getStore();
        if (!state.isHost || state.lobbyPlayers.length >= 8) return;
        const newCpu = { userId: 'cpu-' + Math.random().toString(36).substring(2, 8), name: `CPU${state.lobbyPlayers.length + 1}`, charType: 'survivor', teamColor: 'none', isHost: false, isCPU: true };
        const updatedPlayers = [...state.lobbyPlayers, newCpu];
        setStore({ lobbyPlayers: updatedPlayers });
        state.broadcast({ type: 'LOBBY_UPDATE', players: updatedPlayers });
    },
    updateCpu: (userId, updater) => {
        const state = getStore();
        if (!state.isHost) return;
        const updatedPlayers = state.lobbyPlayers.map(p => p.userId === userId ? { ...p, ...updater } : p);
        setStore({ lobbyPlayers: updatedPlayers });
        state.broadcast({ type: 'LOBBY_UPDATE', players: updatedPlayers });
    },
    removeCpu: (userId) => {
        const state = getStore();
        if (!state.isHost) return;
        const updatedPlayers = state.lobbyPlayers.filter(p => p.userId !== userId);
        setStore({ lobbyPlayers: updatedPlayers });
        state.broadcast({ type: 'LOBBY_UPDATE', players: updatedPlayers });
    },
    randomizeTeams: () => {
        const state = getStore();
        if (!state.isHost) return;
        const colors = ['red', 'blue', 'green', 'yellow'];
        const numTeams = Math.min(Math.max(2, Math.floor(state.lobbyPlayers.length / 2)), colors.length);
        const teamPool = colors.slice(0, numTeams);
        const shuffled = [...state.lobbyPlayers].sort(() => Math.random() - 0.5);
        const updatedPlayers = state.lobbyPlayers.map(p => {
            const idx = shuffled.findIndex(s => s.userId === p.userId);
            return { ...p, teamColor: teamPool[idx % numTeams] };
        });
        setStore({ lobbyPlayers: updatedPlayers });
        state.broadcast({ type: 'LOBBY_UPDATE', players: updatedPlayers });
    },
    clearTeams: () => {
        const state = getStore();
        if (!state.isHost) return;
        const updatedPlayers = state.lobbyPlayers.map(p => ({ ...p, teamColor: 'none' }));
        setStore({ lobbyPlayers: updatedPlayers });
        state.broadcast({ type: 'LOBBY_UPDATE', players: updatedPlayers });
    },

    updateRoomStatus: async (newStatus) => {
        const { roomId, isHost } = getStore();
        if (isHost && roomId) await update(ref(db, `rooms/${roomId}`), { status: newStatus });
    },
    broadcast: (data) => getStore().connections.forEach(conn => conn.send(data)),
    leaveRoom: () => {
        const { peer, isHost, roomId } = getStore();
        if (peer) peer.destroy();
        if (isHost && roomId) remove(ref(db, `rooms/${roomId}`));
        setStore({ isHost: false, roomId: null, peer: null, connections: [], hostConnection: null, lobbyPlayers: [], status: 'disconnected' });
    }
}));

// ======================================================================
// 自動同期エンジン
// ======================================================================
useGameStore.subscribe((state) => {
    const netState = useNetworkStore.getState();
    if (netState.status !== 'connected' || isReceivingNetworkData || state.gamePhase !== 'playing') return;

    // ▼ 追加: ゲスト側はラウンド終了処理中の再broadcastを抑止する
    // ホストが processRoundEnd を実行中に _roundEndInProgress = true を同期してくるので、
    // ゲストはこのフラグが true の間はbroadcastしない（状態の巻き戻りを防ぐ）
    if (!netState.isHost && state._roundEndInProgress) return;

    // ▼ 同期させない（ローカルのみで保持する）Stateのキーを指定
    const localOnlyKeys = [
        // --- UIモーダル・ローカル設定系 ---
        'charInfoModal',
        'acquiredCard',
        'toastMsg',
        'centerWarning',
        'tooltipData',
        'settingsActive',
        'rulesActive',
        'tutorialActive',
        'shopActive',
        'shopCart',
        'layoutMode',
        'autoScrollToPlayer',

        // --- タイマー駆動の演出系 ---
        // setTimeout で自動的に値が変更されるため、放置すると古い状態で再broadcastが発生する
        'eventPopups',      // addEventPopup → 2800ms後に自動削除
        'bloodAnim',        // 2000ms後に自動クリア
        'turnBanner',       // GameMain.jsx で 1500ms後にクリア
        'turnBannerActive', // GameMain.jsx で 2500ms後にクリア
        'jobResult',        // バイト結果のUI表示（ローカル演出）

        // --- 個人設定系（デバイスごとに異なるべき値）---
        'volume',
        'showSkipButton',
    ];

    const pureState = {};
    for (const key in state) {
        // 関数と、ローカル専用のキーを除外して同期データを作る
        if (typeof state[key] !== 'function' && !localOnlyKeys.includes(key)) {
            pureState[key] = state[key];
        }
    }
    
    const data = { type: 'GAME_SYNC', gameState: pureState, lastUpdater: netState.myUserId };
    
    if (netState.isHost) {
        netState.broadcast(data);
    } else if (netState.hostConnection && netState.hostConnection.open) {
        netState.hostConnection.send(data);
    }
});