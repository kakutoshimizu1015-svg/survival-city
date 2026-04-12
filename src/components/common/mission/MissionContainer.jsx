// src/components/common/mission/MissionContainer.jsx

import React from 'react';
import { useUserStore } from '../../../store/useUserStore';
import { MISSIONS } from '../../../constants/missions';
import MissionTab from './MissionTab';

export const MissionContainer = ({ isOpen, onClose }) => {
  const userState = useUserStore();
  const claimMissionReward = useUserStore(state => state.claimMissionReward);
  const claimedMissions = useUserStore(state => state.claimedMissions);

  if (!isOpen) return null;

  // スタッツから進捗を動的に計算してミッションデータを再構築
  const getProgress = (tabId) => {
    switch(tabId) {
      case 'wins': return userState.wins || 0;
      case 'money': return userState.totalEarnedP || 0;
      case 'move': return userState.totalTilesMoved || 0;
      case 'npc': return Object.values(userState.npcEncounters || {}).reduce((a, b) => a + b, 0);
      default: return 0;
    }
  };

  const dynamicMissions = Object.keys(MISSIONS).reduce((acc, tabId) => {
    acc[tabId] = MISSIONS[tabId].map(m => ({
      ...m,
      pr: getProgress(tabId)
    }));
    return acc;
  }, {});

  return (
    <MissionTab 
      winsCount={userState.wins || 0}
      missions={dynamicMissions}
      initialClaimed={claimedMissions}
      onClaimed={(id, rw) => claimMissionReward(id, rw)}
      onClose={onClose}
    />
  );
};