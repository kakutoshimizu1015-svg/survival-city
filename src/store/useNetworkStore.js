import { create } from 'zustand';
import Peer from 'peerjs';
import { ref, set, get, onDisconnect, remove, onValue, off, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { useGameStore } from './useGameStore';
import { useLobbyStore } from './useLobbyStore';
import { processRoundEnd } from '../game/round';
import { useUserStore } from './useUserStore'; // ▼ 追加
import { recordWin, syncGachaData } from '../utils/userLogic'; // ▼ 追加

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
            
            // ▼ 修正: 最初から装備中のスキンを取得して設定する
            const initialChar = 'athlete';
            const initialSkin = useUserStore.getState().equippedSkins[initialChar] || 'default';
            setStore({ peer, status: 'connected', lobbyPlayers: [{ userId: getStore().myUserId, name: playerName, charType: initialChar, skinId: initialSkin, teamColor: 'none', isHost: true, isCPU: false }] });
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
                            const currentHostState = useGameStore.getState();
                            const incoming = data.gameState;
                            
                            // 進行度の計算 (ラウンド数 * 1000 + ターン)
                            const hostProgress = (currentHostState.roundCount || 0) * 1000 + (currentHostState.turn || 0);
                            const incomingProgress = (incoming.roundCount || 0) * 1000 + (incoming.turn || 0);

                            let isStale = false;

                            // 1. ラウンド処理中のパケットは無視
                            if (currentHostState._roundEndInProgress) {
                                isStale = true;
                            }
                            // 2. 過去のターンや過去のラウンドからの遅延パケットは無視
                            else if (incomingProgress < hostProgress) {
                                isStale = true;
                            }
                            // 3. ミニゲーム中以外において、手番ではないプレイヤーからの状態上書きを完全にブロック
                            else if (!currentHostState.mgActive && incomingProgress === hostProgress) {
                                const activePlayer = currentHostState.players[currentHostState.turn];
                                // 現在の手番プレイヤー（またはCPU）以外が送信したデータなら破棄
                                if (activePlayer && activePlayer.userId !== data.lastUpdater) {
                                    isStale = true;
                                }
                            }

                            if (!isStale) {
                                isReceivingNetworkData = true;
                                if (networkReceiveTimer) clearTimeout(networkReceiveTimer);
                                
                                const logger = document.getElementById("log");
                                if (logger && data.gameState.logs) {
                                    logger.innerHTML = data.gameState.logs
                                        .map(msg => `<div>> ${msg}</div>`).join('');
                                    logger.scrollTop = logger.scrollHeight;
                                }
                                
                                useGameStore.setState(data.gameState);
                                networkReceiveTimer = setTimeout(() => {
                                    isReceivingNetworkData = false;
                                }, 200);
                            }
                        }
                        // 常に他のゲストへ中継する（isStaleに関わらず）
                        getStore().connections.forEach(c => {
                            if (c.peer !== conn.peer && c.open) c.send(data);
                        });
                    }

                    if (data.type === 'REQUEST_ACTION') {
                        if (!getStore().isHost) return;
                        const gameState = useGameStore.getState();
                        const cp = gameState.players[gameState.turn];
                        
                        if (cp && cp.userId === data.userId) {
                            import('../game/actions').then(actions => {
                                if (data.actionType === 'ROLL_DICE') actions.actionRollDice();
                                else if (data.actionType === 'END_TURN') actions.actionEndTurn();
                                else if (data.actionType === 'EXECUTE_MOVE') actions.executeMove(data.payload);
                                else if (data.actionType === 'ACTION_CAN') actions.actionCan();
                                else if (data.actionType === 'ACTION_TRASH') actions.actionTrash();
                                else if (data.actionType === 'ACTION_JOB') actions.actionJob();
                                else if (data.actionType === 'ACTION_OCCUPY') actions.actionOccupy();
                                else if (data.actionType === 'ACTION_EXCHANGE') actions.actionExchange();
                                else if (data.actionType === 'ACTION_MANHOLE') actions.actionManhole();
                                else if (data.actionType === 'EXECUTE_MANHOLE') actions.executeManhole(data.payload);
                                else if (data.actionType === 'EXECUTE_END_MINIGAME') actions.executeEndMinigame(data.payload.isWin, data.payload.pts, data.payload.cardId, data.payload.msg);
                                else if (data.actionType === 'EXECUTE_STORY_CHOICE') actions.executeStoryChoice(data.payload);
                                else if (data.actionType === 'CANCEL_UI') actions.actionCancelUI(data.payload);
                                else if (data.actionType === 'EXECUTE_WEAPON_FIRE') actions.executeWeaponFire(data.payload.activeTargetId, data.payload.hitTargetIds, data.payload.cardData, data.payload.attackerId);
                            }).catch(console.error);

                            import('../game/cards').then(cards => {
                                if (data.actionType === 'USE_CARD') cards.actionUseCard(data.payload.handIndex, data.payload.cardId);
                                else if (data.actionType === 'DISCARD_CARD') cards.actionDiscardCard(data.payload);
                                else if (data.actionType === 'CANCEL_WEAPON') cards.actionCancelWeapon(data.payload);
                                else if (data.actionType === 'EXECUTE_RECYCLE') cards.executeRecycle(data.payload);
                                else if (data.actionType === 'EXECUTE_FAKE_INFO') cards.executeFakeInfo(data.payload);
                                else if (data.actionType === 'EXECUTE_SUBWAY') cards.executeSubway(data.payload);
                            }).catch(console.error);

                            import('../game/skills').then(skills => {
                                if (data.actionType === 'ACTION_DASH') skills.actionDash();
                                else if (data.actionType === 'ACTION_PUNCH') skills.actionPunch();
                                else if (data.actionType === 'ACTION_CAMP') skills.actionCamp();
                                else if (data.actionType === 'ACTION_SALES_VISIT') skills.actionSalesVisit();
                                else if (data.actionType === 'EXECUTE_SALES_VISIT') skills.executeSalesVisit(data.payload);
                                else if (data.actionType === 'ACTION_HACK') skills.actionHack();
                                else if (data.actionType === 'ACTION_CONCERT') skills.actionConcert();
                                else if (data.actionType === 'ACTION_DARK_CURE') skills.actionDarkCure();
                                else if (data.actionType === 'EXECUTE_DARK_CURE') skills.executeDarkCure(data.payload);
                                else if (data.actionType === 'ACTION_GAMBLE') skills.actionGamble();
                                else if (data.actionType === 'ACTION_NPC_MOVE') skills.actionNpcMove();
                                else if (data.actionType === 'SETUP_NPC_MOVE') skills.setupNpcMove(data.payload);
                                else if (data.actionType === 'EXECUTE_NPC_MOVE') skills.executeNpcMove(data.payload);
                                else if (data.actionType === 'ACTION_SET_TRAP') skills.actionSetTrap();
                                else if (data.actionType === 'SETUP_SET_TRAP') skills.setupSetTrap(data.payload);
                                else if (data.actionType === 'EXECUTE_SET_TRAP') skills.executeSetTrap(data.payload);
                                else if (data.actionType === 'ACTION_CHEF') skills.actionChef();
                                else if (data.actionType === 'EXECUTE_CHEF') skills.executeChef(data.payload);
                                else if (data.actionType === 'ACTION_CHEF_ATTACK') skills.actionChefAttack();
                                else if (data.actionType === 'EXECUTE_CHEF_ATTACK') skills.executeChefAttack(data.payload);
                                else if (data.actionType === 'ACTION_SCAVENGER') skills.actionScavenger();
                                else if (data.actionType === 'EXECUTE_SCAVENGER') skills.executeScavenger(data.payload);
                                else if (data.actionType === 'SETUP_JUNK_GUN') skills.setupJunkGun(data.payload.handIndex, data.payload.cardId);
                                else if (data.actionType === 'EXECUTE_JUNK_GUN_AIM') skills.executeJunkGunAim(data.payload.consumeTrash, data.payload.dmg);
                                else if (data.actionType === 'EXECUTE_JUNK_GUN_FIRE') {
                                    skills.executeJunkGunFire(data.payload.targetId, data.payload.cardData);
                                    useGameStore.setState({ weaponArcData: null });
                                }
                                else if (data.actionType === 'ACTION_BRIBE') skills.actionBribe();
                                else if (data.actionType === 'EXECUTE_BRIBE') skills.executeBribe(data.payload.targetId, data.payload.type, data.payload.pos);
                                else if (data.actionType === 'ACTION_ORACLE') skills.actionOracle();
                                else if (data.actionType === 'ACTION_CAN_BALLISTA') skills.actionCanBallista();
                                else if (data.actionType === 'SETUP_CAN_BALLISTA_AIM') skills.setupCanBallistaAim(data.payload);
                                else if (data.actionType === 'EXECUTE_CAN_BALLISTA') {
                                    skills.executeCanBallista(data.payload.hitTargets, data.payload.consumeAmount);
                                    useGameStore.setState({ weaponArcData: null });
                                }
                                else if (data.actionType === 'ACTION_TENCHI') skills.actionTenchi();
                            }).catch(console.error);
                        }
                    }

                    if (data.type === 'REQUEST_ROUND_END') {
                        // ホストのみが処理する（isHostチェックで万一の安全弁）
                        if (!getStore().isHost) return;
                        
                        const gameState = useGameStore.getState();
                        if (gameState.gamePhase === 'playing' && !gameState.gameOver && !gameState._roundEndInProgress) {
                            (async () => {
                                try {
                                    useGameStore.setState({ _roundEndInProgress: true });
                                    await processRoundEnd();
                                    useGameStore.setState(s => ({ 
                                        turn: (s.turn + 1) % s.players.length, 
                                        diceRolled: false,
                                        _roundEndInProgress: false // ◁ 明示的にfalseへ戻す処理を追加
                                    }));
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
                
                // ▼ 修正: ゲストの接続要求(JOIN)のパケットにも、初期設定としてスキンIDを含める
                const initialChar = 'athlete';
                const initialSkin = useUserStore.getState().equippedSkins[initialChar] || 'default';
                conn.send({ type: 'JOIN', user: { userId: getStore().myUserId, name: playerName, charType: initialChar, skinId: initialSkin, teamColor: 'none' } }); 
                
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

                            const prevState = useGameStore.getState(); // ▼ 追加: 更新前の状態を保持
                            useGameStore.setState(data.gameState);
                            
                            // ▼ 追加: ゲスト側でのリザルト報酬受け取り処理
                            if (!prevState.gameOver && data.gameState.gameOver && data.gameState.pendingGameResult) {
                                const { results, isTeamGame, sortedTeams } = data.gameState.pendingGameResult;
                                const myUserId = getStore().myUserId;
                                const isMe = (p) => p.userId === myUserId;
                                
                                const myResult = results.find(p => isMe(p));
                                if (myResult) {
                                    // 優勝判定
                                    let isWinner = false;
                                    if (isTeamGame && sortedTeams && sortedTeams[0].members.some(p => isMe(p))) isWinner = true;
                                    if (!isTeamGame && isMe(results[0])) isWinner = true;
                                    
                                    if (isWinner) recordWin(myResult.totalScore); // 優勝数のカウントとP加算
                                    
                                    // 参加報酬(ガチャ資産)の付与とFirebase同期
                                    useUserStore.getState().addGachaAssets(myResult.cans, myResult.totalScore);
                                    syncGachaData();
                                    console.log("[ゲスト戦績セーブ] 報酬を受信・保存しました");
                                }
                            }

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
        // ▼ 修正: CPUオブジェクトにも skinId: 'default' を明記する
        const newCpu = { userId: 'cpu-' + Math.random().toString(36).substring(2, 8), name: `CPU${state.lobbyPlayers.length + 1}`, charType: 'survivor', skinId: 'default', teamColor: 'none', isHost: false, isCPU: true };
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
        // ▼ 修正: 6色に増強
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
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

// ▼ 修正: 単純な遅延(Debounce)から、一定間隔での実行(Throttle)へ変更
let syncTimeout = null;
let lastSyncTime = 0; // 最後に同期した時間を記録

useGameStore.subscribe((state) => {
    const netState = useNetworkStore.getState();
    if (netState.status !== 'connected' || isReceivingNetworkData || state.gamePhase !== 'playing') return;

    if (!netState.isHost && state._roundEndInProgress) return;

    // ▼ 追加: ゲストはミニゲーム中以外、勝手に自分の状態を送信(GAME_SYNC)して上書きしない！
    if (!netState.isHost && !state.mgActive) return;

    const now = Date.now();
    const syncInterval = state.mgActive ? 33 : 100;

    const doSync = () => {
        lastSyncTime = Date.now();
        const localOnlyKeys = [
            'charInfoModal', 'acquiredCard', 'tooltipData',
            'settingsActive', 'rulesActive', 'tutorialActive', 'shopActive', 'shopCart',
            'layoutMode', 'autoScrollToPlayer', 'jobResult', 'volume', 'showSkipButton',
        ];

        const pureState = {};
        // 修正: 引数の古いstateではなく、送信する瞬間の「最新のstate」を取得して梱包する！
        const currentState = useGameStore.getState();
        for (const key in currentState) {
            if (typeof currentState[key] !== 'function' && !localOnlyKeys.includes(key)) {
                pureState[key] = currentState[key];
            }
        }
        
        const data = { type: 'GAME_SYNC', gameState: pureState, lastUpdater: netState.myUserId };
        
        if (netState.isHost) {
            netState.broadcast(data);
        } else if (netState.hostConnection && netState.hostConnection.open) {
            netState.hostConnection.send(data);
        }
    };

    if (now - lastSyncTime >= syncInterval) {
        if (syncTimeout) {
            clearTimeout(syncTimeout);
            syncTimeout = null;
        }
        doSync();
    } else {
        if (!syncTimeout) {
            syncTimeout = setTimeout(() => {
                syncTimeout = null;
                doSync();
            }, syncInterval - (now - lastSyncTime));
        }
    }
});
// useNetworkStore.js の末尾付近に追加
export const suppressNextSync = (ms = 500) => {
    isReceivingNetworkData = true;
    if (networkReceiveTimer) clearTimeout(networkReceiveTimer);
    networkReceiveTimer = setTimeout(() => {
        isReceivingNetworkData = false;
    }, ms);
};