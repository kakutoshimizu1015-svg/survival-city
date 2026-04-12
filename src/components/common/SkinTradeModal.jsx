import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { get, ref } from 'firebase/database';
import { db } from '../../lib/firebase';
import { sendTradeOffer } from '../../utils/tradeLogic';
import { ClayButton } from './ClayButton';

// ▼ 修正: コンポーネントの「外」に切り出して独立させることで、複数選択バグ（再マウントの誤作動）を完全に防ぎます。
const SkinItem = ({ skin, isSelected, onClick, highlightColor }) => {
    const [imgError, setImgError] = useState(false);
    
    // スキンID (例: 'athlete_default') からベースキャラ名 ('athlete') を抽出して画像を読み込む
    const baseCharName = skin.split('_')[0];
    const imagePath = `/assets/characters/${baseCharName}.png`;
    
    return (
        <div 
            onClick={onClick}
            style={{
                width: '65px',
                height: '85px',
                background: isSelected ? highlightColor : '#1a1a1a',
                border: `2px solid ${isSelected ? '#fff' : '#333'}`,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '4px',
                transition: 'all 0.2s',
                boxShadow: isSelected ? `0 0 8px ${highlightColor}` : 'none'
            }}
        >
            {!imgError ? (
                <img 
                    src={imagePath} 
                    alt={skin} 
                    style={{ width: '40px', height: '40px', objectFit: 'contain', marginBottom: '4px' }}
                    onError={() => setImgError(true)}
                />
            ) : (
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>👕</div>
            )}
            
            <div style={{ 
                fontSize: '9px', 
                color: isSelected ? '#fff' : '#bdc3c7', 
                textAlign: 'center', 
                lineHeight: '1.2', 
                wordBreak: 'break-word',
                fontWeight: isSelected ? 'bold' : 'normal'
            }}>
                {skin.split('_').join('\n')}
            </div>
        </div>
    );
};

export const SkinTradeModal = ({ targetUid, targetName, onClose }) => {
    const { gachaPoints, gachaCans, unlockedSkins } = useUserStore();
    
    const [partnerInventory, setPartnerInventory] = useState({ p: 0, cans: 0, skins: [] });
    const [isLoading, setIsLoading] = useState(true);

    const [offer, setOffer] = useState({ p: 0, cans: 0, skins: [] });
    const [request, setRequest] = useState({ p: 0, cans: 0, skins: [] });
    const [isSending, setIsSending] = useState(false);

    // ▼ 念のため、スキンリストの重複を排除して表示バグを防ぐ
    const uniqueMySkins = Array.from(new Set(unlockedSkins || []));

    useEffect(() => {
        const fetchPartnerData = async () => {
            try {
                const snap = await get(ref(db, `users/${targetUid}`));
                if (snap.exists()) {
                    const val = snap.val();
                    setPartnerInventory({
                        p: val.gachaPoints || 0,
                        cans: val.gachaCans || 0,
                        skins: Array.from(new Set(val.unlockedSkins || []))
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
            <div style={{ background: '#1A0D00', border: '3px solid #D4A017', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#fdf5e6' }} onClick={e => e.stopPropagation()}>
                
                <div style={{ padding: '15px', background: 'linear-gradient(180deg, #2D1800, #1A0D00)', textAlign: 'center', borderBottom: '2px solid #3D1F00' }}>
                    <h2 style={{ margin: 0, color: '#D4A017', fontSize: '18px' }}>🤝 トレード交渉: {targetName}</h2>
                </div>

                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>相手のインベントリを確認中...</div>
                ) : (
                    <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            {/* あなたの提示 */}
                            <div style={panelStyle}>
                                <h3 style={{ margin: '0 0 10px 0', color: '#3498db', fontSize: '15px', borderBottom: '1px solid #3498db', paddingBottom: '5px' }}>📤 あなたが出すもの</h3>
                                
                                <div style={labelStyle}>所持P: {gachaPoints}</div>
                                <input type="range" min="0" max={gachaPoints} value={offer.p} onChange={e => setOffer({...offer, p: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '10px' }}>{offer.p} P</div>

                                <div style={labelStyle}>所持缶: {gachaCans}</div>
                                <input type="range" min="0" max={gachaCans} value={offer.cans} onChange={e => setOffer({...offer, cans: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '10px' }}>{offer.cans} 缶</div>

                                <div style={labelStyle}>スキン提供</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '180px', overflowY: 'auto', background: '#0a0a0a', padding: '8px', borderRadius: '6px', border: '1px inset #333' }}>
                                    {uniqueMySkins.length === 0 ? <div style={{ fontSize: '11px', color: '#7f8c8d', margin: 'auto' }}>所持スキンなし</div> :
                                        uniqueMySkins.map(skin => (
                                            <SkinItem 
                                                key={skin} 
                                                skin={skin} 
                                                isSelected={offer.skins.includes(skin)} 
                                                onClick={() => handleToggleSkin(skin, true)} 
                                                highlightColor="#2980b9" 
                                            />
                                        ))
                                    }
                                </div>
                            </div>

                            {/* 相手への要求 */}
                            <div style={panelStyle}>
                                <h3 style={{ margin: '0 0 10px 0', color: '#e74c3c', fontSize: '15px', borderBottom: '1px solid #e74c3c', paddingBottom: '5px' }}>📥 相手に求めるもの</h3>
                                
                                <div style={labelStyle}>相手のP (推定): {partnerInventory.p}</div>
                                <input type="range" min="0" max={partnerInventory.p} value={request.p} onChange={e => setRequest({...request, p: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '10px' }}>{request.p} P</div>

                                <div style={labelStyle}>相手の缶 (推定): {partnerInventory.cans}</div>
                                <input type="range" min="0" max={partnerInventory.cans} value={request.cans} onChange={e => setRequest({...request, cans: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '10px' }}>{request.cans} 缶</div>

                                <div style={labelStyle}>スキン要求</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '180px', overflowY: 'auto', background: '#0a0a0a', padding: '8px', borderRadius: '6px', border: '1px inset #333' }}>
                                    {partnerInventory.skins.length === 0 ? <div style={{ fontSize: '11px', color: '#7f8c8d', margin: 'auto' }}>所持スキンなし</div> :
                                        partnerInventory.skins.map(skin => (
                                            <SkinItem 
                                                key={skin} 
                                                skin={skin} 
                                                isSelected={request.skins.includes(skin)} 
                                                onClick={() => handleToggleSkin(skin, false)} 
                                                highlightColor="#c0392b" 
                                            />
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