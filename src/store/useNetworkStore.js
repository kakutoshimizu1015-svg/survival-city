import { create } from 'zustand';
import Peer from 'peerjs';
import { ref, set, get, onDisconnect, remove, onValue, off, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { useGameStore } from './useGameStore';
import { useLobbyStore } from './useLobbyStore';
import { processRoundEnd } from '../game/round';

let isReceivingNetworkData = false;
let networkReceiveTimer = null;

// ▼ 修正: index (1).html と完全に同じSTUNサーバーの記述に統一
const peerConfig = {
    config: {
        'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ]
    }
};

export const useNetworkStore = create((setStore, getStore) => ({
    myUserId: null,
    
    setMyUserId: (uid) => setStore({ myUserId: uid }),

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
        
        // ▼ 修正: 旧バージョンと同じSTUN設定を適用
        const peer = new Peer(peerConfig);
        
        peer.on('error', (err) => {
            console.error("Host Peer error:", err);
            setStore({ status: 'error' });
        });

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
                        conn.guestUserId = data.user.userId;

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
                            if (networkReceiveTimer) clearTimeout(networkReceiveTimer);
                            
                            const logger = document.getElementById("log");
                            if (logger && data.gameState.logs) {
                                logger.innerHTML = data.gameState.logs.map(msg => `<div>> ${msg}</div>`).join('');
                                logger.scrollTop = logger.scrollHeight;
                            }

                            useGameStore.setState(data.gameState);
                            networkReceiveTimer = setTimeout(() => { isReceivingNetworkData = false; }, 200);
                        }
                        getStore().connections.forEach(c => {
                            if (c.peer !== conn.peer && c.open) c.send(data);
                        });
                    }

                    if (data.type === 'REQUEST_ROUND_END') {
                        const gameState = useGameStore.getState();
                        if (gameState.gamePhase === 'playing' && !gameState.gameOver && !gameState._roundEndInProgress) {
                            (async () => {
                                try {
                                    useGameStore.setState({ _roundEndInProgress: true });
                                    await processRoundEnd();
                                    useGameStore.setState(s => ({ turn: (s.turn + 1) % s.players.length, diceRolled: false }));
                                } catch (e) {
                                    console.error("Host processRoundEnd error:", e);
                                    useGameStore.setState(s => ({ turn: (s.turn + 1) % s.players.length, diceRolled: false, _roundEndInProgress: false }));
                                }
                            })();
                        }
                    }

                    if (data.type === 'CHAT') {
                        useLobbyStore.getState().addChatToQueue(data.chat);
                        const logger = document.getElementById("log");
                        if (logger) {
                            const chatHtml = `<div style="color: #007bff; margin: 4px 0;">[チャット] ${data.chat.sender}: ${data.chat.text}</div>`;
                            logger.insertAdjacentHTML('beforeend', chatHtml);
                            logger.scrollTop = logger.scrollHeight;
                        }
                        getStore().connections.forEach(c => {
                            if (c.peer !== conn.peer && c.open) c.send(data);
                        });
                    }
                });
            });
            conn.on('close', () => {
                setStore(state => ({ connections: state.connections.filter(c => c.peer !== conn.peer) }));
                const currentPlayers = getStore().lobbyPlayers.filter(p => p.userId !== conn.guestUserId);
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

        // ▼ 修正: IDのランダム化と、旧バージョンと同じSTUN設定を適用
        const peer = new Peer(peerConfig); 
        
        peer.on('error', (err) => {
            console.error("Guest Peer error:", err);
            setStore({ status: 'error' });
        });

        peer.on('open', () => {
            const conn = peer.connect(snapshot.val().hostPeerId);
            conn.on('open', () => {
                setStore({ peer, hostConnection: conn, status: 'connected' });
                conn.send({ type: 'JOIN', user: { userId: getStore().myUserId, name: playerName, charType: 'athlete', teamColor: 'none' } }); 
                
                conn.on('data', (data) => {
                    if (data.type === 'LOBBY_UPDATE') setStore({ lobbyPlayers: data.players });

                    if (data.type === 'GAME_START') {
                        useGameStore.setState({ ...data.gameState, gamePhase: 'playing' });
                    }

                    if (data.type === 'GAME_SYNC') {
                        if (data.lastUpdater !== getStore().myUserId) {
                            isReceivingNetworkData = true;
                            if (networkReceiveTimer) clearTimeout(networkReceiveTimer);
                            
                            const logger = document.getElementById("log");
                            if (logger && data.gameState.logs) {
                                logger.innerHTML = data.gameState.logs.map(msg => `<div>> ${msg}</div>`).join('');
                                logger.scrollTop = logger.scrollHeight;
                            }

                            useGameStore.setState(data.gameState);
                            networkReceiveTimer = setTimeout(() => { isReceivingNetworkData = false; }, 200);
                        }
                    }

                    if (data.type === 'CHAT') {
                        useLobbyStore.getState().addChatToQueue(data.chat);
                        const logger = document.getElementById("log");
                        if (logger) {
                            const chatHtml = `<div style="color: #007bff; margin: 4px 0;">[チャット] ${data.chat.sender}: ${data.chat.text}</div>`;
                            logger.insertAdjacentHTML('beforeend', chatHtml);
                            logger.scrollTop = logger.scrollHeight;
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

let syncTimeout = null;

useGameStore.subscribe((state) => {
    const netState = useNetworkStore.getState();
    if (netState.status !== 'connected' || isReceivingNetworkData || state.gamePhase !== 'playing') return;

    if (!netState.isHost && state._roundEndInProgress) return;

    if (syncTimeout) clearTimeout(syncTimeout);

    // ▼ 修正: ミニゲーム中は通信頻度を上げて(16ms)アニメーションを滑らかにし、本編中は負荷軽減(50ms)
    const syncDelay = state.mgActive ? 16 : 50;

    syncTimeout = setTimeout(() => {
        const localOnlyKeys = [
            'charInfoModal', 'acquiredCard', 'toastMsg', 'centerWarning', 'tooltipData',
            'settingsActive', 'rulesActive', 'tutorialActive', 'shopActive', 'shopCart',
            'layoutMode', 'autoScrollToPlayer', 'eventPopups', 'bloodAnim', 'turnBanner',
            'turnBannerActive', 'jobResult', 'volume', 'showSkipButton',
        ];

        const pureState = {};
        for (const key in state) {
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
    }, syncDelay);
});