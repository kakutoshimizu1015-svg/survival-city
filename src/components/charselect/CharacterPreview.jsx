import React, { useMemo } from 'react';
import { charEmoji, charInfo, charDetailData } from '../../constants/characters';
// ▼ 修正: 波括弧 {} をつけて名前付きインポートに変更しました
import { SkinSelector } from './SkinSelector';

export const CharacterPreview = ({ charType }) => {
    const safeCharType = (charType && charDetailData[charType]) ? charType : 'survivor';

    const detail = useMemo(() => charDetailData[safeCharType] || charDetailData['survivor'], [safeCharType]);
    const name = useMemo(() => charInfo[safeCharType]?.name || '未設定', [safeCharType]);
    const emoji = useMemo(() => charEmoji[safeCharType] || '🌿', [safeCharType]);

    return (
        <div style={{ width: '100%', height: '100%', background: '#fffdf5', border: '6px solid #8d6e63', borderRadius: '15px', padding: '16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '16px', paddingBottom: '16px', borderBottom: '2px solid #e0d5c1' }}>
                
                <div style={{ fontSize: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {emoji}
                </div>
                
                <div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3e2f2a', textShadow: '2px 2px 0 rgba(0,0,0,0.1)' }}>{name}</div>
                    <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#8d6e63' }}>{detail?.tagline}</div>
                </div>
            </div>

            <div style={{ flexGrow: 1, color: '#5d4037', fontSize: '13px', lineHeight: 1.6, overflow: 'auto' }}>
                <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontWeight: 'bold', color: '#d35400', fontSize: '15px' }}>{detail?.passive?.name}</div>
                    <div style={{ background: '#f5eeda', padding: '8px 12px', borderRadius: '8px', marginTop: '4px' }}>{detail?.passive?.desc}</div>
                </div>
                <div>
                    <div style={{ fontWeight: 'bold', color: '#c0392b', fontSize: '15px' }}>{detail?.action?.name}</div>
                    <div style={{ background: '#f5eeda', padding: '8px 12px', borderRadius: '8px', marginTop: '4px' }}>{detail?.action?.desc}</div>
                </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '2px solid #e0d5c1' }}>
                <SkinSelector />
            </div>
        </div>
    );
};

export default CharacterPreview;