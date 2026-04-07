import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { useGameStore } from '../../store/useGameStore';
import { deleteInvite } from '../../utils/userLogic';

export const GlobalInviteModal = () => {
    const invites = useUserStore((state) => state.invites) || [];
    const playerName = useUserStore((state) => state.playerName);
    const { joinRoom, status } = useNetworkStore();
    const setGameState = useGameStore((state) => state.setGameState);

    if (invites.length === 0) return null;

    // 複数の招待が来ている場合は最初のものを表示
    const currentInvite = invites[0];

    const handleJoin = () => {
        // 現在の画面を強制的にオンラインロビーへ切り替え、部屋に参加する
        setGameState({ gamePhase: 'online_lobby' });
        joinRoom(currentInvite.roomId, playerName);
        deleteInvite(currentInvite.id);
    };

    const handleDecline = () => {
        deleteInvite(currentInvite.id);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', zIndex: 100000, // どの画面よりも手前に出す
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Noto Sans JP", sans-serif', animation: 'fadeIn 0.2s ease'
        }}>
            <div style={{
                background: '#1E0E00', border: '3px solid #D4A017',
                borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '350px',
                textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(212,160,23,0.3)',
                animation: 'zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <div style={{ fontSize: '40px', marginBottom: '10px', animation: 'canBounce 1s infinite' }}>💌</div>
                <h3 style={{ color: '#FFD700', margin: '0 0 10px 0', fontSize: '18px' }}>オンライン招待が届きました！</h3>
                
                <div style={{ background: '#0C0600', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #5C3015' }}>
                    <div style={{ color: '#EDE0C4', fontSize: '15px', fontWeight: 'bold' }}>
                        {currentInvite.fromName} さん
                    </div>
                    <div style={{ color: '#7A5A35', fontSize: '12px', marginTop: '5px' }}>
                        ルームコード: {currentInvite.roomId}
                    </div>
                </div>

                {status === 'connecting' ? (
                    <div style={{ color: '#3498db', fontWeight: 'bold' }}>接続中...</div>
                ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleJoin} style={{
                            flex: 1, padding: '12px', background: 'linear-gradient(180deg, #2ecc71, #27ae60)',
                            color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold',
                            fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                        }}>参 加</button>
                        <button onClick={handleDecline} style={{
                            flex: 1, padding: '12px', background: '#3D1F00',
                            color: '#bdc3c7', border: '1px solid #5C3015', borderRadius: '8px', fontWeight: 'bold',
                            fontSize: '15px', cursor: 'pointer'
                        }}>あとで</button>
                    </div>
                )}
            </div>
        </div>
    );
};