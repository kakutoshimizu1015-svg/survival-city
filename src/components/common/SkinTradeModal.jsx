import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../store/useUserStore';
import { get, ref } from 'firebase/database';
import { db } from '../../lib/firebase';
import { sendTradeOffer } from '../../utils/tradeLogic';
import { ClayButton } from './ClayButton';
import { charSkins, CHARACTERS } from '../../constants/characters'; 

// ▼ マスターデータからスキンの詳細データ（名前、画像、レア度など）を取得する関数
const getSkinData = (skinId) => {
    const baseCharName = skinId.split('_')[0];
    if (charSkins[baseCharName]) {
        return charSkins[baseCharName].find(s => s.id === skinId) || null;
    }
    return null;
};

// ▼ レア度ごとのカラー設定
const RARITY_COLORS = {
    N: '#95a5a6',
    R: '#3498db',
    SR: '#9b59b6',
    SSR: '#f1c40f',
    UR: '#e74c3c'
};

// =========================================================
// ▼ 新規作成: 大画面のスキン選択カードコンポーネント
// =========================================================
const LargeSkinCard = ({ skinId, isSelected, onClick }) => {
    const [imgError, setImgError] = useState(false);
    const data = getSkinData(skinId);
    
    if (!data) return null;

    const charName = CHARACTERS.find(c => c.id === data.charKey)?.name || data.charKey;

    return (
        <div 
            onClick={onClick}
            style={{
                width: '110px',
                background: isSelected ? 'rgba(46, 204, 113, 0.2)' : '#1a1a1a',
                border: `2px solid ${isSelected ? '#2ecc71' : '#333'}`,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 0 10px rgba(46, 204, 113, 0.5)' : '0 2px 4px rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* レア度＆キャラ名バッジ */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '2px 4px', background: 'rgba(0,0,0,0.6)', zIndex: 2 }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: RARITY_COLORS[data.rarity] || '#fff' }}>{data.rarity}</span>
                <span style={{ fontSize: '9px', color: '#bdc3c7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75px' }}>{charName}</span>
            </div>

            <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px 5px 5px 5px', background: 'linear-gradient(180deg, #222, #111)' }}>
                {!imgError && data.front ? (
                    <img 
                        src={data.front} 
                        alt={data.name} 
                        style={{ width: '80%', height: '80%', objectFit: 'contain', filter: isSelected ? 'drop-shadow(0 0 5px #2ecc71)' : 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))' }}
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div style={{ fontSize: '40px' }}>👕</div>
                )}
            </div>
            
            <div style={{ 
                padding: '6px', 
                fontSize: '11px', 
                color: isSelected ? '#fff' : '#bdc3c7', 
                textAlign: 'center', 
                fontWeight: isSelected ? 'bold' : 'normal',
                background: isSelected ? '#27ae60' : '#222',
                borderTop: `1px solid ${isSelected ? '#2ecc71' : '#333'}`,
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: '1.2'
            }}>
                {data.name.replace('（デフォルト）', '')}
            </div>

            {isSelected && (
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '40px', opacity: 0.8, pointerEvents: 'none', zIndex: 3 }}>
                    ✅
                </div>
            )}
        </div>
    );
};

// =========================================================
// ▼ 新規作成: フルスクリーンのスキン選択モーダル
// =========================================================
const FullSkinSelectorModal = ({ title, availableSkins, initialSelected, onSave, onClose }) => {
    const [selected, setSelected] = useState([...initialSelected]);
    const [charFilter, setCharFilter] = useState('ALL');
    const [rarityFilter, setRarityFilter] = useState('ALL');

    const handleToggle = (skinId) => {
        setSelected(prev => prev.includes(skinId) ? prev.filter(s => s !== skinId) : [...prev, skinId]);
    };

    const filteredSkins = availableSkins.filter(skinId => {
        const data = getSkinData(skinId);
        if (!data) return false;
        const matchChar = charFilter === 'ALL' || data.charKey === charFilter;
        const matchRarity = rarityFilter === 'ALL' || data.rarity === rarityFilter;
        return matchChar && matchRarity;
    });

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95000, background: '#111', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            {/* ヘッダー */}
            <div style={{ background: '#2D1800', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #D4A017' }}>
                <div style={{ color: '#D4A017', fontSize: '16px', fontWeight: 'bold' }}>{title} ({selected.length}件選択中)</div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* フィルターバー */}
            <div style={{ padding: '10px', background: '#222', display: 'flex', gap: '10px', borderBottom: '1px solid #333' }}>
                <select 
                    value={charFilter} 
                    onChange={e => setCharFilter(e.target.value)}
                    style={{ flex: 1, padding: '8px', background: '#000', color: '#fff', border: '1px solid #555', borderRadius: '4px', fontSize: '12px' }}
                >
                    <option value="ALL">すべて表示 (キャラ)</option>
                    {CHARACTERS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>

                <select 
                    value={rarityFilter} 
                    onChange={e => setRarityFilter(e.target.value)}
                    style={{ flex: 1, padding: '8px', background: '#000', color: '#fff', border: '1px solid #555', borderRadius: '4px', fontSize: '12px' }}
                >
                    <option value="ALL">すべて表示 (レア度)</option>
                    {Object.keys(RARITY_COLORS).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>

            {/* スキングリッド */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignContent: 'flex-start', justifyContent: 'center' }}>
                {filteredSkins.length === 0 ? (
                    <div style={{ color: '#7f8c8d', margin: 'auto', marginTop: '50px' }}>該当するスキンがありません</div>
                ) : (
                    filteredSkins.map(skin => (
                        <LargeSkinCard 
                            key={skin} 
                            skinId={skin} 
                            isSelected={selected.includes(skin)} 
                            onClick={() => handleToggle(skin)} 
                        />
                    ))
                )}
            </div>

            {/* フッター */}
            <div style={{ padding: '15px', background: '#222', borderTop: '1px solid #444', display: 'flex', gap: '10px' }}>
                <ClayButton onClick={() => onSave(selected)} style={{ flex: 2, background: '#2ecc71', fontSize: '14px' }}>✅ 決定する ({selected.length})</ClayButton>
                <ClayButton onClick={onClose} style={{ flex: 1, background: '#95a5a6', fontSize: '14px' }}>キャンセル</ClayButton>
            </div>
        </div>
    );
};

// =========================================================
// ▼ トレード設定のメインモーダル
// =========================================================
export const SkinTradeModal = ({ targetUid, targetName, onClose }) => {
    const { gachaPoints, gachaCans, unlockedSkins } = useUserStore();
    
    const [partnerInventory, setPartnerInventory] = useState({ p: 0, cans: 0, skins: [] });
    const [isLoading, setIsLoading] = useState(true);

    const [offer, setOffer] = useState({ p: 0, cans: 0, skins: [] });
    const [request, setRequest] = useState({ p: 0, cans: 0, skins: [] });
    const [isSending, setIsSending] = useState(false);

    // フルスクリーン選択画面の表示状態 ('offer' | 'request' | null)
    const [selectingMode, setSelectingMode] = useState(null);

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

    // スキンの簡易プレビュー用コンポーネント（リスト内に小さく表示）
    const SkinMiniPreview = ({ skinIds }) => {
        if (skinIds.length === 0) return <div style={{ fontSize: '12px', color: '#7f8c8d', padding: '10px 0' }}>選択されていません</div>;
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
                {skinIds.map(id => {
                    const data = getSkinData(id);
                    return (
                        <div key={id} style={{ background: '#111', border: '1px solid #444', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: RARITY_COLORS[data?.rarity] || '#fff', fontWeight: 'bold' }}>{data?.rarity || '-'}</span>
                            <span style={{ color: '#fff' }}>{data?.name?.replace('（デフォルト）', '') || id}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            {/* ▼ フルスクリーン選択画面の呼び出し */}
            {selectingMode === 'offer' && (
                <FullSkinSelectorModal 
                    title="📤 自分が提供するスキンを選ぶ"
                    availableSkins={uniqueMySkins}
                    initialSelected={offer.skins}
                    onSave={(newSkins) => { setOffer({ ...offer, skins: newSkins }); setSelectingMode(null); }}
                    onClose={() => setSelectingMode(null)}
                />
            )}
            
            {selectingMode === 'request' && (
                <FullSkinSelectorModal 
                    title="📥 相手に要求するスキンを選ぶ"
                    availableSkins={partnerInventory.skins}
                    initialSelected={request.skins}
                    onSave={(newSkins) => { setRequest({ ...request, skins: newSkins }); setSelectingMode(null); }}
                    onClose={() => setSelectingMode(null)}
                />
            )}

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
                                    <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '10px', color: '#3498db' }}>{offer.p} P</div>

                                    <div style={labelStyle}>所持缶: {gachaCans}</div>
                                    <input type="range" min="0" max={gachaCans} value={offer.cans} onChange={e => setOffer({...offer, cans: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                    <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '15px', color: '#3498db' }}>{offer.cans} 缶</div>

                                    <div style={{ borderTop: '1px dashed #555', paddingTop: '10px' }}>
                                        <ClayButton onClick={() => setSelectingMode('offer')} style={{ background: '#2980b9', width: '100%', fontSize: '12px' }}>
                                            👕 渡すスキンを選ぶ ({offer.skins.length}件)
                                        </ClayButton>
                                        <SkinMiniPreview skinIds={offer.skins} />
                                    </div>
                                </div>

                                {/* 相手への要求 */}
                                <div style={panelStyle}>
                                    <h3 style={{ margin: '0 0 10px 0', color: '#e74c3c', fontSize: '15px', borderBottom: '1px solid #e74c3c', paddingBottom: '5px' }}>📥 相手に求めるもの</h3>
                                    
                                    <div style={labelStyle}>相手のP (推定): {partnerInventory.p}</div>
                                    <input type="range" min="0" max={partnerInventory.p} value={request.p} onChange={e => setRequest({...request, p: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                    <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '10px', color: '#e74c3c' }}>{request.p} P</div>

                                    <div style={labelStyle}>相手の缶 (推定): {partnerInventory.cans}</div>
                                    <input type="range" min="0" max={partnerInventory.cans} value={request.cans} onChange={e => setRequest({...request, cans: parseInt(e.target.value)})} style={{ width: '100%' }} />
                                    <div style={{ textAlign: 'right', fontWeight: 'bold', marginBottom: '15px', color: '#e74c3c' }}>{request.cans} 缶</div>

                                    <div style={{ borderTop: '1px dashed #555', paddingTop: '10px' }}>
                                        <ClayButton onClick={() => setSelectingMode('request')} style={{ background: '#c0392b', width: '100%', fontSize: '12px' }}>
                                            👕 貰うスキンを選ぶ ({request.skins.length}件)
                                        </ClayButton>
                                        <SkinMiniPreview skinIds={request.skins} />
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
        </>
    );
};