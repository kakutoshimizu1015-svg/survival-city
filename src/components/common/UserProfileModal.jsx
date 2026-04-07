import React, { useEffect, useState } from 'react';
import { fetchUserProfile } from '../../utils/userLogic';
import { CharImage } from './CharImage';

export const UserProfileModal = ({ uid, onClose }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const data = await fetchUserProfile(uid);
            setProfile(data);
            setLoading(false);
        };
        loadData();
    }, [uid]);

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 90000, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={onClose}>
            
            <div style={{
                background: 'linear-gradient(135deg, #1E0E00, #0C0600)',
                border: '3px solid #7A5400', borderRadius: '16px', padding: '20px',
                width: '100%', maxWidth: '340px', position: 'relative',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
            }} onClick={e => e.stopPropagation()}>
                
                <button onClick={onClose} style={{
                    position: 'absolute', top: '10px', right: '10px', background: 'transparent',
                    border: 'none', color: '#bdc3c7', fontSize: '20px', cursor: 'pointer'
                }}>✕</button>

                {loading ? (
                    <div style={{ color: '#D4A017', textAlign: 'center', padding: '40px 0' }}>読み込み中...</div>
                ) : !profile ? (
                    <div style={{ color: '#e74c3c', textAlign: 'center', padding: '40px 0' }}>データが見つかりません</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ textAlign: 'center', borderBottom: '2px solid #3D1F00', paddingBottom: '15px' }}>
                            <div style={{ fontSize: '11px', color: '#7A5A35', marginBottom: '4px' }}>フレンドコード: {profile.friendCode || '不明'}</div>
                            <h2 style={{ color: '#FFF', margin: 0, fontSize: '22px' }}>{profile.playerName}</h2>
                        </div>

                        <div style={{ background: '#150800', borderRadius: '10px', padding: '12px', border: '1px solid #3D1F00' }}>
                            <div style={{ fontSize: '12px', color: '#D4A017', fontWeight: 'bold', marginBottom: '8px' }}>🏆 やり込み戦績</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px', color: '#EDE0C4' }}>
                                <div>優勝回数: <span style={{ fontWeight: 'bold', color: '#2ecc71' }}>{profile.wins || 0}</span></div>
                                <div>累計獲得P: <span style={{ fontWeight: 'bold', color: '#3498db' }}>{profile.totalEarnedP || 0}</span></div>
                                <div>総移動マス: <span>{profile.totalTilesMoved || 0}</span></div>
                                <div>空き缶収集: <span>{profile.totalCansCollected || 0}</span></div>
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '12px', color: '#D4A017', fontWeight: 'bold', marginBottom: '8px' }}>👕 お気に入りスキン (一部)</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {Object.keys(profile.equippedSkins || {}).length === 0 ? (
                                    <div style={{ fontSize: '12px', color: '#7A5A35' }}>スキン未設定</div>
                                ) : (
                                    // 装備中のスキンから最初の4つだけアイコン表示
                                    Object.entries(profile.equippedSkins).slice(0, 4).map(([charKey, skinId]) => (
                                        <div key={charKey} style={{ background: '#000', borderRadius: '8px', padding: '5px', border: '1px solid #5C3015' }}>
                                            <CharImage charType={charKey} skinId={skinId} size={40} />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};