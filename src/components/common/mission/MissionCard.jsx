import React, { useRef } from 'react';
import { MISSION_COLORS } from '../../../constants/missions';
import { claimAnimate } from './missionEffects';

export const MissionCard = ({ mission, progress, isClaimed, onClaim }) => {
  const { id, th, label, desc, rw } = mission;
  const cardRef = useRef(null);
  const btnRef = useRef(null);

  const isDone = progress >= th;
  const pct = Math.min(Math.round((progress / th) * 100), 100);
  const col = MISSION_COLORS[rw.g] || MISSION_COLORS[""];
  
  // フォーマット関数（1k, 1Mなど）
  const fmt = (n) => n >= 1000000 ? `${(n / 1e6).toFixed(1)}M` : n >= 10000 ? `${(n / 1e3).toFixed(0)}k` : n >= 1000 ? `${(n / 1e3).toFixed(1)}k` : String(n);

  const handleClaim = (e) => {
    e.stopPropagation();
    if (isClaimed || !isDone) return;
    
    // エフェクトを発火
    if (cardRef.current && btnRef.current) {
      claimAnimate(cardRef.current, btnRef.current, rw, col);
    }
    // 少し遅らせてStoreを更新（演出を見せるため）
    setTimeout(() => onClaim(id, rw), 300);
  };

  return (
    <div className="m-card" ref={cardRef} style={{
      borderRadius: '18px', display: 'flex', flexDirection: 'column',
      padding: '14px', border: `1.5px solid ${isDone && !isClaimed ? '#c8782a' : '#3a2200'}`,
      background: 'linear-gradient(158deg, #201200, #160c00)', position: 'relative',
      width: '100%', height: '100%', overflow: 'hidden',
      boxShadow: isDone && !isClaimed ? '0 0 16px #c8782a44' : 'none'
    }}>
      {rw.g && <div style={{ alignSelf: 'flex-start', fontSize: '8px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '5px', border: `1px solid ${col}55`, color: col, marginBottom: '6px' }}>{rw.g === "CHAR" ? "NEW CHAR" : rw.g}</div>}
      {isClaimed && <div style={{ position: 'absolute', top: '11px', right: '11px', fontSize: '7px', fontWeight: 'bold', letterSpacing: '2px', color: '#3a2200', border: '1.5px solid #3a2200', borderRadius: '3px', padding: '1px 5px', transform: 'rotate(12deg)' }}>CLAIMED</div>}
      
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '4px', height: '32%', minHeight: '88px', borderRadius: '12px', background: '#0d0700',
        border: '1px solid #4a3010', marginBottom: '9px',
        ...(isDone && !isClaimed ? { background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${col}1e, #0d0700 70%)` } : {})
      }}>
        <div style={{ fontSize: '46px', lineHeight: 1, filter: isDone ? `drop-shadow(0 0 14px ${isClaimed ? 'none' : col})` : 'brightness(0) opacity(0.3) blur(1px)' }}>{rw.ic}</div>
        <div style={{ fontSize: isDone ? '11px' : '13px', fontWeight: 'bold', color: isDone ? (isClaimed ? '#3a2200' : col) : '#4a3018' }}>{isDone ? rw.nm : '？？？'}</div>
      </div>

      <div style={{ fontSize: '15px', fontWeight: '900', color: '#e8d5b0', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '9px', color: '#4a3018', flex: '0 0 auto' }}>{desc}</div>
      <div style={{ flex: '1 1 0', minHeight: '6px' }}></div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '9px' }}>
        <div style={{ height: '5px', borderRadius: '3px', background: '#1e1000', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: isDone ? `linear-gradient(90deg, ${col}77, ${col})` : 'linear-gradient(90deg, #2e1a00, #3a2400)' }}></div>
        </div>
        <div style={{ fontSize: '9px', textAlign: 'right', color: '#7a5a30' }}>
          <span style={{ color: isDone ? col : '#5a3a18', fontWeight: 'bold' }}>{fmt(progress)}</span> / {fmt(th)}
        </div>
      </div>

      <button
        ref={btnRef}
        onClick={handleClaim}
        style={{
          width: '100%', padding: '10px 0', borderRadius: '11px', border: isDone && !isClaimed ? 'none' : '1px solid #4a3010',
          fontSize: '13px', fontWeight: 'bold', cursor: isDone && !isClaimed ? 'pointer' : 'default',
          background: isClaimed ? '#150900' : isDone ? `linear-gradient(135deg, #e8972a, #c8782a)` : '#1e1000',
          color: isClaimed ? '#3a2200' : isDone ? '#fff' : '#4a3018',
          boxShadow: isDone && !isClaimed ? '0 4px 16px #c8782a55' : 'none'
        }}
      >
        {isClaimed ? '✓ 受け取り済み' : isDone ? '🎁 受け取る！' : `あと ${fmt(th - progress)}`}
      </button>
    </div>
  );
};