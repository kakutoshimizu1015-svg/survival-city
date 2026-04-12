import React, { useState } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { acceptTrade, rejectTrade } from '../../utils/tradeLogic';
import { ClayButton } from '../common/ClayButton';

export const TradeNotificationOverlay = () => {
    const { uid, activeTrades } = useUserStore();
    const [processingId, setProcessingId] = useState(null);

    const incomingTrades = (activeTrades || []).filter(t => t.toUid === uid && t.status === 'pending');

    if (incomingTrades.length === 0) return null;

    const handleAccept = async (trade) => {
        setProcessingId(trade.id);
        const res = await acceptTrade(trade);
        setProcessingId(null);
        alert(res.message);
    };

    const handleReject = async (tradeId) => {
        setProcessingId(tradeId);
        await rejectTrade(tradeId);
        setProcessingId(null);
    };

    return (
        <div style={{ position: 'fixed', top: '60px', right: '10px', zIndex: 85000, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
            {incomingTrades.map(trade => {
                // ▼ Firebaseの仕様で消えてしまったデータを安全に復元する（クラッシュ防止）
                const offerSkins = trade.offer.skins || [];
                const requestSkins = trade.request.skins || [];
                const offerP = trade.offer.p || 0;
                const offerCans = trade.offer.cans || 0;
                const requestP = trade.request.p || 0;
                const requestCans = trade.request.cans || 0;

                return (
                    <div key={trade.id} style={{ background: 'rgba(26, 13, 0, 0.95)', border: '2px solid #f1c40f', borderRadius: '8px', padding: '15px', color: '#fdf5e6', boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>
                        <div style={{ fontWeight: 'bold', color: '#f1c40f', marginBottom: '10px', fontSize: '14px' }}>
                            🤝 {trade.fromName} からトレード提案
                        </div>
                        
                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px', marginBottom: '15px' }}>
                            <div style={{ flex: 1, background: 'rgba(52, 152, 219, 0.2)', padding: '8px', borderRadius: '6px', border: '1px solid #3498db' }}>
                                <div style={{ color: '#3498db', fontWeight: 'bold', marginBottom: '4px' }}>相手が出す</div>
                                <div>{offerP > 0 && <span>P: {offerP}<br/></span>}</div>
                                <div>{offerCans > 0 && <span>缶: {offerCans}<br/></span>}</div>
                                {offerSkins.map(s => <div key={s}>👕 {s.replace('_',' ')}</div>)}
                                {offerP === 0 && offerCans === 0 && offerSkins.length === 0 && 'なし'}
                            </div>
                            
                            <div style={{ flex: 1, background: 'rgba(231, 76, 60, 0.2)', padding: '8px', borderRadius: '6px', border: '1px solid #e74c3c' }}>
                                <div style={{ color: '#e74c3c', fontWeight: 'bold', marginBottom: '4px' }}>あなたが渡す</div>
                                <div>{requestP > 0 && <span>P: {requestP}<br/></span>}</div>
                                <div>{requestCans > 0 && <span>缶: {requestCans}<br/></span>}</div>
                                {requestSkins.map(s => <div key={s}>👕 {s.replace('_',' ')}</div>)}
                                {requestP === 0 && requestCans === 0 && requestSkins.length === 0 && 'なし'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <ClayButton onClick={() => handleAccept(trade)} disabled={processingId === trade.id} style={{ flex: 1, background: '#2ecc71', fontSize: '12px', padding: '6px' }}>
                                {processingId === trade.id ? '処理中...' : '✅ 承認'}
                            </ClayButton>
                            <ClayButton onClick={() => handleReject(trade.id)} disabled={processingId === trade.id} style={{ flex: 1, background: '#e74c3c', fontSize: '12px', padding: '6px' }}>
                                ❌ 拒否
                            </ClayButton>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};