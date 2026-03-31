import { create } from 'zustand';
import Peer from 'peerjs';
import { ref, set, get, onDisconnect, remove, onValue, off, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { useGameStore } from './useGameStore';

export const useNetworkStore = create((setStore, getStore) => ({
    // ▼ 追加：自分自身のユニークID
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
                const roomsList = Object.entries(data)
                    .map(([roomId, info]) => ({ roomId, ...info }))
                    .filter(room => room.status === 'waiting');
                setStore({ activeRooms: roomsList });
            } else {
                setStore({ activeRooms: [] });
            }
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

            setStore({ 
                peer, status: 'connected', 
                // ホスト自身もリストに追加
                lobbyPlayers: [{ userId: getStore().myUserId, name: playerName, charType: 'athlete', teamColor: 'none', isHost: true, isCPU: false }] 
            });
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
                    if (data.type === 'LOBBY_CHANGE') { // ▼ ゲストからの設定変更を受信して全員に配信
                        const updatedPlayers = getStore().lobbyPlayers.map(p => p.userId === data.user.userId ? { ...p, ...data.user } : p);
                        setStore({ lobbyPlayers: updatedPlayers });
                        getStore().broadcast({ type: 'LOBBY_UPDATE', players: updatedPlayers });
                    }
                    if (data.type === 'ACTION') {
                        useGameStore.getState().applyNetworkAction(data.action);
                        getStore().broadcastGameState();
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

        const peer = new Peer(getStore().myUserId); // peer idをuserIdと統一
        peer.on('open', () => {
            const conn = peer.connect(snapshot.val().hostPeerId);
            conn.on('open', () => {
                setStore({ peer, hostConnection: conn, status: 'connected' });
                // 参加時に初期設定を送信
                conn.send({ type: 'JOIN', user: { userId: getStore().myUserId, name: playerName, charType: 'athlete', teamColor: 'none' } }); 
                
                conn.on('data', (data) => {
                    if (data.type === 'LOBBY_UPDATE') setStore({ lobbyPlayers: data.players });
                    if (data.type === 'GAME_START') useGameStore.setState({ ...data.gameState, gamePhase: 'playing' });
                    if (data.type === 'GAME_SYNC') useGameStore.setState(data.gameState);
                });
            });
            conn.on('error', () => setStore({ status: 'error' }));
        });
    },

    // ▼ 追加：自分の設定（名前・キャラ・チーム）を変更して同期する
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

    // ▼ 追加：ホスト専用操作群
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
    broadcastGameState: () => {
        if (!getStore().isHost) return;
        const state = useGameStore.getState();
        const { setGameState, updatePlayer, updateCurrentPlayer, resetGame, applyNetworkAction, ...pureState } = state;
        getStore().broadcast({ type: 'GAME_SYNC', gameState: pureState });
    },
    sendActionToHost: (action) => {
        const conn = getStore().hostConnection;
        if (conn && conn.open) conn.send({ type: 'ACTION', action });
    },
    leaveRoom: () => {
        const { peer, isHost, roomId } = getStore();
        if (peer) peer.destroy();
        if (isHost && roomId) remove(ref(db, `rooms/${roomId}`));
        setStore({ isHost: false, roomId: null, peer: null, connections: [], hostConnection: null, lobbyPlayers: [], status: 'disconnected' });
    }
}));