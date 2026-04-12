import React, { useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { MISSION_TABS } from '../../../constants/missions';
import { MissionTabs } from './MissionTabs';
import { MissionCarousel } from './MissionCarousel';

export const MissionModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('wins');
  const wins = useUserStore(state => state.wins);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000, 
      display: 'flex', flexDirection: 'column', 
      background: '#120900', fontFamily: '"Noto Sans JP", sans-serif'
    }}>
      {/* ── Header ── */}
      <div style={{
        flex: '0 0 auto', padding: '14px 20px 11px', borderBottom: '1px solid #3a2200',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(30,20,0,0.6), rgba(18,9,0,0.4))'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '10px', color: '#7a5a30', letterSpacing: '2px' }}>路上サバイバルシティ</span>
          <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '2px', color: '#e8972a', textShadow: '0 0 20px rgba(200,120,42,0.4), 0 2px 4px rgba(0,0,0,0.4)' }}>
            🏆 ミッション
          </span>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{
            background: '#1c1000', border: '1.5px solid #c8782a', borderRadius: '14px',
            padding: '4px 13px', display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>
            <span style={{ fontSize: '9px', color: '#7a5a30', letterSpacing: '1px' }}>優勝</span>
            <span style={{ fontSize: '20px', fontWeight: '900', color: '#e8d5b0', lineHeight: '1.1' }}>
              {wins}<span style={{ fontSize: '12px' }}>回</span>
            </span>
          </div>
          <button 
            onClick={onClose} 
            style={{
              background: '#3a2200', color: '#e8d5b0', border: 'none', borderRadius: '50%',
              width: '36px', height: '36px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <MissionTabs tabs={MISSION_TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Body (Carousel) ── */}
      <MissionCarousel activeTab={activeTab} />
    </div>
  );
};