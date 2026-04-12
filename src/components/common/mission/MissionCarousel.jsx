import React, { useEffect, useState } from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { MISSIONS } from '../../../constants/missions';
import { useCarouselSpring } from './useCarouselSpring';
import { MissionCard } from './MissionCard';

export const MissionCarousel = ({ activeTab }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const missions = MISSIONS[activeTab] || [];
  
  const userState = useUserStore();
  const claimMissionReward = useUserStore(state => state.claimMissionReward);
  const claimedMissions = useUserStore(state => state.claimedMissions);

  // ウィンドウサイズからカード幅を計算（モバイル対応）
  const [itemWidth, setItemWidth] = useState(Math.round(window.innerWidth * 0.74));
  useEffect(() => {
    const handleResize = () => setItemWidth(Math.round(window.innerWidth * 0.74));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const gap = 12;
  const { outerRef, railRef } = useCarouselSpring(missions.length, itemWidth, gap, activeIndex, setActiveIndex);

  // タブ変更時にインデックスをリセット
  useEffect(() => { setActiveIndex(0); }, [activeTab]);

  // スタッツから現在の進捗を計算するヘルパー
  const getProgress = (tabId) => {
    switch(tabId) {
      case 'wins': return userState.wins || 0;
      case 'money': return userState.totalEarnedP || 0;
      case 'move': return userState.totalTilesMoved || 0;
      case 'npc': return Object.values(userState.npcEncounters || {}).reduce((a, b) => a + b, 0);
      default: return 0;
    }
  };

  const progressValue = getProgress(activeTab);

  return (
    <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
      <div
        ref={outerRef}
        style={{ flex: '1 1 0', width: '100%', position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', overflow: 'hidden', touchAction: 'none', perspective: '900px' }}
      >
        <div ref={railRef} style={{ display: 'flex', alignItems: 'center', height: '100%', willChange: 'transform', transformStyle: 'preserve-3d', gap: `${gap}px` }}>
          {missions.map((m) => (
            <div key={m.id} className="card-wrap" style={{ width: `${itemWidth}px`, height: '80%', maxHeight: '420px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform, opacity', transformStyle: 'preserve-3d' }}>
              <MissionCard 
                mission={m} 
                progress={progressValue} 
                isClaimed={claimedMissions.includes(m.id)} 
                onClaim={claimMissionReward} 
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* ページネーションドット */}
      <div style={{ flex: '0 0 auto', display: 'flex', gap: '5px', padding: '10px 0' }}>
        {missions.map((_, i) => (
          <div key={i} style={{ height: '4px', width: i === activeIndex ? '14px' : '4px', borderRadius: '2px', background: i === activeIndex ? '#e8972a' : '#4a3010', transition: 'width 0.2s', boxShadow: i === activeIndex ? '0 0 6px #e8972a' : 'none' }}></div>
        ))}
      </div>
    </div>
  );
};