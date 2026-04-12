import React from 'react';

export const MissionTabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div style={{ display: 'flex', background: '#1c1000', borderBottom: '1.5px solid #4a3010', zIndex: 20 }}>
      {tabs.map((t) => {
        const isActive = t.id === activeTab;
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: '8px 2px 7px', background: 'none', cursor: 'pointer',
              border: 'none', borderBottom: `2px solid ${isActive ? '#e8972a' : 'transparent'}`,
              color: isActive ? '#e8972a' : '#7a5a30',
              transition: 'color 0.2s, border-color 0.2s'
            }}
          >
            <span style={{ fontSize: '14px' }}>{t.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};