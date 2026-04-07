import React, { useState } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { sendFriendRequestByCode, acceptFriendRequest, removeFriendRequest } from '../../utils/userLogic';
import { ref, push, set } from 'firebase/database'; // ▼ 追加
import { db } from '../../lib/firebase'; // ▼ 追加

export const FriendListModal = ({ onClose, onSelectFriend, currentRoomId }) => { // ▼ currentRoomId を受け取る
    const { friendCode, friends, friendRequests, playerName } = useUserStore();
    const [tab, setTab] = useState('list'); // 'list', 'add', 'requests'
    const [codeInput, setCodeInput] = useState('');
    const [searchMsg, setSearchMsg] = useState({ text: '', type: '' });
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async () => {
        if (!codeInput) return;
        setIsSearching(true);
        setSearchMsg({ text: '検索中...', type: 'info' });
        
        const result = await sendFriendRequestByCode(codeInput);
        setSearchMsg({ text: result.message, type: result.success ? 'success' : 'error' });
        if (result.success) setCodeInput('');
        setIsSearching(false);
    };

    // ▼ 追加: フレンドへ招待を送信するロジック
    const handleSendInvite = async (e, friend) => {
        e.stopPropagation(); // プロフィールが開くのを防ぐ
        if (!currentRoomId) return;

        try {
            // 相手の uid の下にある invites ノードへ招待データを書き込む
            const inviteRef = push(ref(db, `users/${friend.uid}/invites`));
            await set(inviteRef, {
                id: inviteRef.key,
                roomId: currentRoomId,
                fromName: playerName,
                timestamp: Date.now()
            });
            alert(`${friend.name} さんに招待を送信しました！`);
        } catch (error) {
            console.error("招待送信エラー:", error);
            alert('招待の送信に失敗しました。');
        }
    };

    const tabStyle = (isActive) => ({
        flex: 1, padding: '10px 0', textAlign: 'center', background: isActive ? '#3D1F00' : 'transparent',
        borderBottom: `3px solid ${isActive ? '#D4A017' : 'transparent'}`, color: isActive ? '#D4A017' : '#7A5A35',
        fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s'
    });

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 80000, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }} onClick={onClose}>
            
            <div style={{
                background: '#1A0D00', border: '3px solid #5C3015', borderRadius: '16px',
                width: '100%', maxWidth: '400px', height: '80vh', maxHeight: '600px',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
            }} onClick={e => e.stopPropagation()}>
                
                {/* ヘッダー */}
                <div style={{ padding: '15px 20px', background: 'linear-gradient(180deg, #2D1800, #1A0D00)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3D1F00' }}>
                    <div style={{ color: '#D4A017', fontSize: '18px', fontWeight: 'bold' }}>👥 フレンド管理</div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#bdc3c7', fontSize: '24px', cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ background: '#0C0600', padding: '10px 20px', textAlign: 'center', borderBottom: '2px solid #3D1F00' }}>
                    <div style={{ fontSize: '11px', color: '#7A5A35' }}>あなたのフレンドコード</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#FFF', letterSpacing: '2px', userSelect: 'all' }}>{friendCode || '読込中...'}</div>
                </div>

                {/* タブ */}
                <div style={{ display: 'flex', borderBottom: '2px solid #3D1F00' }}>
                    <div onClick={() => setTab('list')} style={tabStyle(tab === 'list')}>一覧 ({friends.length})</div>
                    <div onClick={() => setTab('add')} style={tabStyle(tab === 'add')}>追加</div>
                    <div onClick={() => setTab('requests')} style={tabStyle(tab === 'requests')}>
                        申請 {friendRequests.length > 0 && <span style={{ background: '#e74c3c', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>{friendRequests.length}</span>}
                    </div>
                </div>

                {/* コンテンツ領域 */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                    
                    {tab === 'list' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {friends.length === 0 ? (
                                <div style={{ color: '#7A5A35', textAlign: 'center', marginTop: '40px' }}>フレンドがいません</div>
                            ) : (
                                friends.map(f => (
                                    <div key={f.uid} onClick={() => onSelectFriend(f.uid)} style={{
                                        background: '#150800', border: '1px solid #3D1F00', borderRadius: '8px', padding: '12px',
                                        color: '#EDE0C4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                                    }}>
                                        <div style={{ fontWeight: 'bold' }}>{f.name}</div>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {/* ▼ 追加: 部屋IDがある場合のみ招待ボタンを表示 */}
                                            {currentRoomId && (
                                                <button 
                                                    onClick={(e) => handleSendInvite(e, f)}
                                                    style={{ 
                                                        background: '#2ecc71', color: '#fff', border: 'none', 
                                                        padding: '6px 12px', borderRadius: '6px', fontSize: '11px', 
                                                        fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
                                                    }}
                                                >
                                                    ✉️ 招待
                                                </button>
                                            )}
                                            <div style={{ fontSize: '11px', color: '#D4A017' }}>プロフを見る ▶</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {tab === 'add' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '20px', gap: '15px' }}>
                            <div style={{ color: '#EDE0C4', fontSize: '13px' }}>相手の8桁のコードを入力してください</div>
                            <input 
                                type="text" placeholder="例: A1B2C3D4" value={codeInput} 
                                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                                maxLength={9}
                                style={{
                                    padding: '12px', borderRadius: '8px', border: '2px solid #D4A017', background: '#0C0600',
                                    color: '#FFF', fontSize: '18px', textAlign: 'center', width: '80%', letterSpacing: '2px', fontWeight: 'bold'
                                }}
                            />
                            <button disabled={isSearching || codeInput.length < 8} onClick={handleSearch} style={{
                                background: 'linear-gradient(180deg, #D4A017, #B8860B)', color: '#000', border: 'none',
                                padding: '12px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: isSearching || codeInput.length < 8 ? 'not-allowed' : 'pointer',
                                opacity: isSearching || codeInput.length < 8 ? 0.5 : 1
                            }}>
                                🔍 検索して申請
                            </button>
                            {searchMsg.text && (
                                <div style={{ color: searchMsg.type === 'success' ? '#2ecc71' : '#e74c3c', fontSize: '13px', fontWeight: 'bold' }}>
                                    {searchMsg.text}
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'requests' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {friendRequests.length === 0 ? (
                                <div style={{ color: '#7A5A35', textAlign: 'center', marginTop: '40px' }}>届いている申請はありません</div>
                            ) : (
                                friendRequests.map(req => (
                                    <div key={req.uid} style={{
                                        background: '#150800', border: '1px solid #3D1F00', borderRadius: '8px', padding: '12px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <div style={{ color: '#EDE0C4', fontWeight: 'bold' }}>{req.name}</div>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button onClick={() => acceptFriendRequest(req.uid, req.name)} style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>承認</button>
                                            <button onClick={() => removeFriendRequest(req.uid)} style={{ background: '#c0392b', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>拒否</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};