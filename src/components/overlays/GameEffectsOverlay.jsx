import React from 'react';
import { useGameStore } from '../../store/useGameStore';

export const GameEffectsOverlay = () => {
    const { turnBanner, eventPopups, disasterWarning, bloodAnim, players } = useGameStore();

    return (
        <>
            <style>{`
                @keyframes banner-anim { 0%{opacity:0;transform:scale(0.8);} 10%{opacity:1;transform:scale(1);} 90%{opacity:1;transform:scale(1);} 100%{opacity:0;transform:scale(1.2);} }
                @keyframes event-popup-anim { 0%{opacity:0;transform:scale(0.6) translateY(10px);} 13%{opacity:1;transform:scale(1.04) translateY(0);} 22%{transform:scale(1);} 74%{opacity:0.9;transform:scale(1) translateY(-8px);} 100%{opacity:0;transform:scale(0.9) translateY(-24px);} }
                @keyframes warningPulse { 0%{box-shadow:0 0 40px #e74c3c,0 0 80px rgba(231,76,60,0.4);} 100%{box-shadow:0 0 80px #ff0000,0 0 160px rgba(255,0,0,0.7),0 0 240px rgba(255,0,0,0.2);} }
                @keyframes warningBg { 0%,100%{background:rgba(0,0,0,0);} 10%,90%{background:rgba(60,0,0,0.85);} }
                @keyframes blood-splash { 0%{transform:scale(0.1); opacity:0;} 50%{transform:scale(1.5); opacity:1;} 100%{transform:scale(1); opacity:0.8;} }
                @keyframes pulse-banner { 0%,100%{opacity:0.9; box-shadow:0 0 10px rgba(241,196,15,0.5);} 50%{opacity:1; box-shadow:0 0 30px rgba(241,196,15,1);} }
                @keyframes shake-btn { 0%,100%{transform:scale(1.05) translateX(0);} 25%,75%{transform:scale(1.05) translateX(-3px);} 50%{transform:scale(1.05) translateX(3px);} }
                .btn-end-highlight { background-color:#f1c40f !important; color:#c0392b !important; border-color:#e67e22 !important; box-shadow:0 0 20px #f1c40f !important; animation:shake-btn 0.5s infinite !important; transform:scale(1.05); }
                body.horror-mode { background-color: #000 !important; background-image: none !important; }
                body.horror-mode #game-board-container { background:rgba(0,0,0,0.99) !important; border-color:#220000 !important; box-shadow:0 0 80px rgba(255,0,0,0.2) inset, 0 0 40px rgba(255,0,0,0.1) !important; }
                body.horror-mode #game-board .tile { filter:brightness(0.45) saturate(0.3) !important; }
                body.horror-mode #game-board .tile.truck-highlight { filter:none !important; }
                body.horror-mode .truck-token { box-shadow:0 0 60px #ff0000, 0 0 120px rgba(255,0,0,1) !important; z-index:200 !important; filter:none !important; border-color:#ff0000 !important; opacity: 1 !important; background:radial-gradient(circle,#5a0000,#1a0000) !important; }
            `}</style>

            {/* ターンバナー */}
            {turnBanner && (
                <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', zIndex:300, display:'flex', justifyContent:'center', alignItems:'center', pointerEvents:'none', animation:'banner-anim 1.5s forwards' }}>
                    <div style={{ fontSize:'50px', fontWeight:'bold', padding:'20px 50px', color:'#fff', background:'rgba(44,62,80,0.95)', borderRadius:'20px', border:`8px solid ${turnBanner.color}`, textAlign:'center', textShadow:`0 0 20px ${turnBanner.color}, 2px 2px 4px rgba(0,0,0,0.8)` }}>
                        {turnBanner.name} のターン
                    </div>
                </div>
            )}

            {/* イベントポップアップ */}
            <div style={{ position:'fixed', bottom:'18%', left:'50%', transform:'translateX(-50%)', zIndex:9500, pointerEvents:'none', display:'flex', flexDirection:'column', alignItems:'center', gap:'5px' }}>
                {eventPopups.map(p => {
                    const player = players.find(pl => pl.id === p.playerId);
                    const colorMap = { damage:"#e74c3c", good:"#2ecc71", bad:"#e67e22", neutral:"#3498db", card:"#9b59b6" };
                    const bColor = player?.color || colorMap[p.type] || "#888";
                    const bgMap = { damage:"rgba(40,5,5,0.62)", good:"rgba(5,35,15,0.62)", bad:"rgba(40,20,0,0.62)", card:"rgba(25,5,40,0.62)", neutral:"rgba(12,12,22,0.62)" };
                    return (
                        <div key={p.id} style={{ background:bgMap[p.type], padding:'7px 18px', borderRadius:'12px', border:`2px solid ${bColor}`, textAlign:'center', fontWeight:'bold', color:'white', animation:'event-popup-anim 2.8s forwards', boxShadow:`0 4px 16px rgba(0,0,0,0.5), 0 0 12px ${bColor}44`, minWidth:'140px', maxWidth:'240px', backdropFilter:'blur(6px)' }}>
                            <div style={{ fontSize:'24px', lineHeight:'1.1' }}>{p.icon}</div>
                            {player && <div style={{ color:player.color, fontSize:'11px', fontWeight:'bold', margin:'2px 0' }}>{player.name}</div>}
                            <div style={{ fontSize:'13px', margin:'2px 0', lineHeight:'1.3' }}>{p.title}</div>
                            {p.detail && <div style={{ fontSize:'10px', color:'#bdc3c7', marginTop:'3px' }}>{p.detail}</div>}
                        </div>
                    );
                })}
            </div>

            {/* 災害予兆 */}
            {disasterWarning && (
                <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none', animation:'warningBg 3.5s forwards' }}>
                    <div style={{ textAlign:'center', padding:'30px 40px', border:'3px solid #e74c3c', borderRadius:'16px', background:'rgba(20,0,0,0.92)', animation:'warningPulse 0.4s ease-in-out infinite alternate' }}>
                        <div style={{ fontSize:'52px', marginBottom:'10px' }}>🛻⚠️</div>
                        <div style={{ fontSize:'22px', fontWeight:900, color:'#ff3333', textShadow:'0 0 20px #ff0000', letterSpacing:'2px', marginBottom:'12px' }}>【 予 兆 】</div>
                        <div style={{ fontSize:'16px', color:'#ffaa88', maxWidth:'340px', lineHeight:1.7 }}>{disasterWarning}</div>
                    </div>
                </div>
            )}

            {/* 血しぶき */}
            {bloodAnim && (
                <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', zIndex:9000, pointerEvents:'none', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', backgroundColor:'rgba(150,0,0,0.4)' }}>
                    <div style={{ fontSize:'120px', animation:'blood-splash 0.5s forwards' }}>🩸</div>
                    <h1 style={{ color:'red', textShadow:'2px 2px 0px #fff,-2px -2px 0px #fff,2px -2px 0px #fff,-2px 2px 0px #fff', fontSize:'50px', marginTop:'20px', textAlign:'center' }}>{bloodAnim}が轢かれた！</h1>
                </div>
            )}
        </>
    );
};