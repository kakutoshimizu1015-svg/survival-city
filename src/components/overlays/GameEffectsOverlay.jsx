import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { deckData } from '../../constants/cards';
import { playSfx } from '../../utils/audio';
import { logMsg } from '../../game/actions';

export const GameEffectsOverlay = () => {
    const { turnBanner, eventPopups, disasterWarning, bloodAnim, players, toastMsg, centerWarning, turn } = useGameStore();
    const { myUserId, status } = useNetworkStore();
    const cp = players[turn];

    // 自分のターンかどうかの判定（カード捨てプロンプト用）
    const isMyTurn = status === 'connected' ? (cp?.userId === myUserId) : !cp?.isCPU;
    const isHandOverLimit = cp && cp.hand.length > cp.maxHand;

    return (
        <>
            <style>{`
                @keyframes banner-anim { 0%{opacity:0;transform:scale(0.8);} 10%{opacity:1;transform:scale(1);} 90%{opacity:1;transform:scale(1);} 100%{opacity:0;transform:scale(1.2);} }
                @keyframes event-popup-anim { 0%{opacity:0;transform:scale(0.6) translateY(10px);} 13%{opacity:1;transform:scale(1.04) translateY(0);} 22%{transform:scale(1);} 74%{opacity:0.9;transform:scale(1) translateY(-8px);} 100%{opacity:0;transform:scale(0.9) translateY(-24px);} }
                @keyframes warningPulse { 0%{box-shadow:0 0 40px #e74c3c,0 0 80px rgba(231,76,60,0.4);} 100%{box-shadow:0 0 80px #ff0000,0 0 160px rgba(255,0,0,0.7),0 0 240px rgba(255,0,0,0.2);} }
                @keyframes warningBg { 0%,100%{background:rgba(0,0,0,0);} 10%,90%{background:rgba(60,0,0,0.85);} }
                @keyframes blood-splash { 0%{transform:scale(0.1); opacity:0;} 50%{transform:scale(1.5); opacity:1;} 100%{transform:scale(1); opacity:0.8;} }
                @keyframes slide-down { 0%{transform:translate(-50%, -20px); opacity:0;} 100%{transform:translate(-50%, 0); opacity:1;} }
                @keyframes pop-in { 0%{transform:translate(-50%, -50%) scale(0.8); opacity:0;} 100%{transform:translate(-50%, -50%) scale(1); opacity:1;} }
            `}</style>

            {/* ▼ 修正：トーストメッセージ（AP不足など） */}
            {toastMsg && (
                <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(231,76,60,0.95)', color: 'white', padding: '15px 30px', borderRadius: '10px', zIndex: 10010, fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', fontSize: '16px', border: '2px solid #fff', animation: 'slide-down 0.3s forwards' }}>
                    ⚠️ {toastMsg}
                </div>
            )}

            {/* ▼ 修正：画面中央の警告メッセージ（ショップ満杯、30秒放置など） */}
            {centerWarning && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(241,196,15,0.95)', color: '#c0392b', padding: '20px 40px', borderRadius: '15px', zIndex: 10005, fontWeight: 'bold', boxShadow: '0 0 40px rgba(241,196,15,0.8)', fontSize: '24px', border: '4px dashed #c0392b', animation: 'pop-in 0.3s forwards', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {centerWarning}
                </div>
            )}

            {/* ▼ 修正：手札上限オーバー時のカード捨てプロンプト */}
            {isHandOverLimit && isMyTurn && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 9999 }}>
                    <div className="modal-box" style={{ border: '4px solid #e74c3c' }}>
                        <h2 style={{ color: '#e74c3c', marginTop: 0 }}>⚠️ 手札が上限を超えました</h2>
                        <p style={{ fontWeight: 'bold' }}>捨てるカードを1枚選んでください（上限: {cp.maxHand}枚）</p>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '15px' }}>
                            {cp.hand.map((cardId, idx) => {
                                const cd = deckData.find(d => d.id === cardId);
                                if (!cd) return null;
                                return (
                                    <button key={idx} onClick={() => {
                                        useGameStore.getState().updateCurrentPlayer(p => {
                                            const h = [...p.hand]; h.splice(idx, 1); return { hand: h };
                                        });
                                        logMsg(`🗑️ 手札整理：「${cd.name}」を捨てた。`);
                                        playSfx('coin');
                                    }} style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', border: `2px solid ${cd.color}`, background: '#fff', fontWeight: 'bold', boxShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                                        {cd.icon} {cd.name} を捨てる
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

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