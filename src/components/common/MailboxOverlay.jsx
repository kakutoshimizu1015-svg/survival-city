import React, { useState } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { claimMail } from '../../utils/userLogic';

export const MailboxOverlay = ({ onClose }) => {
    const inbox = useUserStore((state) => state.inbox) || [];
    const claimedMails = useUserStore((state) => state.claimedMails) || [];
    const [claimingId, setClaimingId] = useState(null);
    const [toastMsg, setToastMsg] = useState('');

    // 未読・既読の仕分け
    const unreadMails = inbox.filter(mail => !claimedMails.includes(mail.id));
    const readMails = inbox.filter(mail => claimedMails.includes(mail.id));

    // 未読を上に表示する結合リスト
    const displayMails = [...unreadMails, ...readMails];

    const handleClaim = async (mail) => {
        if (claimingId) return;
        setClaimingId(mail.id);

        const success = await claimMail(mail);
        if (success) {
            const rewardText = [
                mail.p ? `${mail.p}P` : '',
                mail.cans ? `${mail.cans}缶` : ''
            ].filter(Boolean).join(' と ');
            
            setToastMsg(`🎁 ${rewardText} を受け取りました！`);
            setTimeout(() => setToastMsg(''), 2500);
        }
        setClaimingId(null);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)', zIndex: 30000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Noto Sans JP", sans-serif'
        }} onClick={onClose}>
            
            <div style={{
                background: '#1a0e08', border: '3px solid #5c3015',
                borderRadius: '16px', width: '90%', maxWidth: '450px',
                maxHeight: '80vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,100,0,0.1)',
                position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>

                {/* トースト通知 */}
                {toastMsg && (
                    <div style={{
                        position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)',
                        background: '#2ecc71', color: 'white', padding: '10px 20px', borderRadius: '8px',
                        fontWeight: 'bold', border: '2px solid #27ae60', animation: 'cardAppear 0.3s ease',
                        whiteSpace: 'nowrap', zIndex: 10001, boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                    }}>
                        {toastMsg}
                    </div>
                )}

                {/* ヘッダー */}
                <div style={{
                    padding: '15px 20px', borderBottom: '2px solid #3d1f0a',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(180deg, #2d180a 0%, #1a0e08 100%)',
                    borderRadius: '13px 13px 0 0'
                }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffd700', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                        📮 プレゼントボックス
                        {unreadMails.length > 0 && (
                            <span style={{ marginLeft: '10px', background: '#e74c3c', color: 'white', fontSize: '12px', padding: '2px 8px', borderRadius: '12px' }}>
                                {unreadMails.length} 件未読
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} style={{
                        background: 'transparent', border: 'none', color: '#bdc3c7', fontSize: '24px', cursor: 'pointer', fontWeight: 'bold'
                    }}>✕</button>
                </div>

                {/* リスト領域 */}
                <div style={{ padding: '15px', overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {displayMails.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#7a5a35' }}>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                            <div>現在、届いているメールはありません</div>
                        </div>
                    ) : (
                        displayMails.map((mail) => {
                            const isClaimed = claimedMails.includes(mail.id);
                            const dateStr = new Date(mail.timestamp).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={mail.id} style={{
                                    background: isClaimed ? '#150800' : 'linear-gradient(135deg, #2a1100, #3d1500)',
                                    border: `2px solid ${isClaimed ? '#3d1f0a' : '#d4a017'}`,
                                    borderRadius: '10px', padding: '12px',
                                    display: 'flex', flexDirection: 'column', gap: '8px',
                                    opacity: isClaimed ? 0.6 : 1, transition: 'all 0.2s',
                                    boxShadow: isClaimed ? 'none' : '0 4px 10px rgba(0,0,0,0.5)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 'bold', color: isClaimed ? '#bdc3c7' : '#fff', fontSize: '15px' }}>
                                            {!isClaimed && <span style={{ color: '#e74c3c', marginRight: '5px' }}>●</span>}
                                            {mail.title || '運営からの手紙'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#7a5a35' }}>{dateStr}</div>
                                    </div>
                                    
                                    <div style={{ fontSize: '13px', color: '#ede0c4', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                        {mail.text}
                                    </div>

                                    {(mail.p > 0 || mail.cans > 0) && (
                                        <div style={{
                                            marginTop: '5px', padding: '10px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            border: `1px dashed ${isClaimed ? '#5c3015' : '#7a5400'}`
                                        }}>
                                            <div style={{ display: 'flex', gap: '15px', fontWeight: 'bold', fontSize: '14px', color: isClaimed ? '#7a5a35' : '#ffd700' }}>
                                                {mail.p > 0 && <span>💰 {mail.p} P</span>}
                                                {mail.cans > 0 && <span>🥫 {mail.cans} 缶</span>}
                                            </div>
                                            <button 
                                                disabled={isClaimed || claimingId === mail.id}
                                                onClick={() => handleClaim(mail)}
                                                style={{
                                                    background: isClaimed ? '#2a1100' : 'linear-gradient(180deg, #ff8c00, #d35400)',
                                                    border: `1px solid ${isClaimed ? '#3d1f0a' : '#ffb74d'}`,
                                                    color: isClaimed ? '#5c3015' : '#fff',
                                                    padding: '6px 16px', borderRadius: '6px', fontWeight: 'bold',
                                                    cursor: isClaimed ? 'default' : 'pointer', fontSize: '12px',
                                                    boxShadow: isClaimed ? 'none' : '0 2px 4px rgba(0,0,0,0.5)'
                                                }}
                                            >
                                                {claimingId === mail.id ? '処理中...' : isClaimed ? '受取済' : '受け取る'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};