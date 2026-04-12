import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { get, ref } from 'firebase/database';
import { db } from '../../lib/firebase';
import { sendTradeOffer } from '../../utils/tradeLogic';
import { ClayButton } from './ClayButton';

export const SkinTradeModal = ({ targetUid, targetName, onClose }) => {
    const { gachaPoints, gachaCans, unlockedSkins } = useUserStore();
    
    const [partnerInventory, setPartnerInventory] = useState({ p: 0, cans: 0, skins: [] });
    const [isLoading, setIsLoading] = useState(true);

    const [offer, setOffer] = useState({ p: 0, cans: 0, skins: [] });
    const [request, setRequest] = useState({ p: 0, cans: 0, skins: [] });
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const fetchPartnerData = async () => {
            try {
                const snap = await get(ref(db, `users/${targetUid}`));
                if (snap.exists()) {
                    const val = snap.val();
                    setPartnerInventory({
                        p: val.gachaPoints || 0,
                        cans: val.gachaCans || 0,
                        skins: val.unlockedSkins || []
                    });
                }
            } catch (e) {
                console.error("相手のデータ取得失敗:", e);
            }
            setIsLoading(false);
        };
        fetchPartnerData();
    }, [targetUid]);

    const handleToggleSkin = (skinId, isOffer) => {
        if (isOffer) {
            setOffer(prev => ({
                ...prev,
                skins: prev.skins.includes(skinId) ? prev.skins.filter(s => s !== skinId) : [...prev.skins, skinId]
            }));
        } else {
            setRequest(prev => ({
                ...prev,
                skins: prev.skins.includes(skinId) ? prev.skins.filter(s => s !== skinId) : [...prev.skins, skinId]
            }));
        }
    };

    const handleSend = async () => {
        if (offer.p === 0 && offer.cans === 0 && offer.skins.length === 0 && 
            request.p === 0 && request.cans === 0 && request.skins.length === 0) {
            alert("条件が設定されていません");
            return;
        }
        
        setIsSending(true);
        const result = await sendTradeOffer(targetUid, targetName, offer, request);
        setIsSending(false);
        
        if (result.success) {
            alert(result.message);
            onClose();
        } else {
            alert(result.message);
        }
    };

    const panelStyle = { flex: 1, background: '#2c1e16', padding: '15px', borderRadius: '8px', border: '2px solid #5c4a44' };
    const labelStyle = { fontSize: '12px', color: '#bdc3c7', marginBottom: '5px' };

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 90000, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }} onClick={onClose}>
            <div style={{ background: '#1A0D00', border: '3px solid #D4A017', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#fdf5e6' }} onClick={e => e.stopPropagation()}>
                
                <div style={{ padding: '15px', background: 'linear-gradient(180deg, #2D1800, #1A0D00)', textAlign: 'center', borderBottom: '2px solid #3D1F00' }}>
                    <h2 style={{ margin: 0, color: '#D4A017', fontSize: '18px' }}>🤝 トレード交渉: {targetName}</h2>
                </div>

                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>相手のインベントリを確認中...</div>
                ) : (
                    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <div style={panelStyle}>
                                <h3 style={{ margin: '0 0 10px 0', color: '#3498db', fontSize: '15px', borderBottom: '1px solid #3498db', paddingBottom: '5px' }}>📤 あなたが出すもの</h3>
                                
                                <div style={labelStyle}>所持P: {gachaPoints}</div>
                                <input type="range" min="0" max={gachaPoints} value={offer.p} onChange={e => setOffer({...offer, p: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '10px' }}>{offer.p} P</div>

                                <div style={labelStyle}>所持缶: {gachaCans}</div>
                                <input type="range" min="0" max={gachaCans} value={offer.cans} onChange={e => setOffer({...offer, cans: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '10px' }}>{offer.cans} 缶</div>

                                <div style={labelStyle}>スキン提供</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '100px', overflowY: 'auto', background: '#111', padding: '5px', borderRadius: '4px' }}>
                                    {unlockedSkins.length === 0 ? <div style={{ fontSize: '11px', color: '#7f8c8d' }}>所持スキンなし</div> :
                                        unlockedSkins.map(skin => (
                                            <div key={skin} onClick={() => handleToggleSkin(skin, true)} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', background: offer.skins.includes(skin) ? '#3498db' : '#333', color: '#fff' }}>
                                                {skin.replace('_', ' ')}
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>

                            <div style={panelStyle}>
                                <h3 style={{ margin: '0 0 10px 0', color: '#e74c3c', fontSize: '15px', borderBottom: '1px solid #e74c3c', paddingBottom: '5px' }}>📥 相手に求めるもの</h3>
                                
                                <div style={labelStyle}>相手のP (推定): {partnerInventory.p}</div>
                                <input type="range" min="0" max={partnerInventory.p} value={request.p} onChange={e => setRequest({...request, p: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '10px' }}>{request.p} P</div>

                                <div style={labelStyle}>相手の缶 (推定): {partnerInventory.cans}</div>
                                <input type="range" min="0" max={partnerInventory.cans} value={request.cans} onChange={e => setRequest({...request, cans: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '10px' }}>{request.cans} 缶</div>

                                <div style={labelStyle}>スキン要求</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxHeight: '100px', overflowY: 'auto', background: '#111', padding: '5px', borderRadius: '4px' }}>
                                    {partnerInventory.skins.length === 0 ? <div style={{ fontSize: '11px', color: '#7f8c8d' }}>所持スキンなし</div> :
                                        partnerInventory.skins.map(skin => (
                                            <div key={skin} onClick={() => handleToggleSkin(skin, false)} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', background: request.skins.includes(skin) ? '#e74c3c' : '#333', color: '#fff' }}>
                                                {skin.replace('_', ' ')}
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <ClayButton onClick={handleSend} disabled={isSending} style={{ flex: 2, background: '#2ecc71' }}>
                                {isSending ? '送信中...' : '📨 この条件で提案する'}
                            </ClayButton>
                            <ClayButton onClick={onClose} style={{ flex: 1, background: '#95a5a6' }}>キャンセル</ClayButton>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};