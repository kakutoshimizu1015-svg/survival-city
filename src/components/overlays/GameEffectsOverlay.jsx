import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { deckData } from '../../constants/cards';
import { charEmoji, charInfo, charDetailData } from '../../constants/characters';
import { playSfx } from '../../utils/audio';
import { logMsg } from '../../game/actions';

export const GameEffectsOverlay = () => {
    const { turnBanner, eventPopups, disasterWarning, bloodAnim, players, toastMsg, centerWarning, turn } = useGameStore();
    const { myUserId, status } = useNetworkStore();
    const cp = players[turn];
    
    // ▼ 追加: ストアからステートを取得
    const { charInfoModal, roundSummary, acquiredCard, territorySelectOptions, mapData, territories } = useGameStore();

    // キャラ詳細モーダル用のデータ準備
    const targetPlayer = charInfoModal !== null ? players.find(p => p.id === charInfoModal) : null;
    const detail = targetPlayer ? charDetailData[targetPlayer.charType] : null;
    const cInfo = targetPlayer ? charInfo[targetPlayer.charType] : null;

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

            {/* ▼ 追加: キャラ詳細モーダル */}
            {targetPlayer && detail && cInfo && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 1100 }} onClick={(e) => { if(e.target === e.currentTarget) useGameStore.setState({ charInfoModal: null }); }}>
                    <div className="modal-box" style={{ maxWidth: '420px', background: '#1a1a2e', color: '#fdf5e6', border: `3px solid ${targetPlayer.color}`, padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', gap: '12px', background: `linear-gradient(135deg,${targetPlayer.color}22 0%,rgba(26,26,46,0.95) 100%)`, borderBottom: `2px solid ${targetPlayer.color}44` }}>
                            <div style={{ fontSize: '52px', lineHeight: 1 }}>{charEmoji[targetPlayer.charType]}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '19px', fontWeight: 900, color: '#f1c40f' }}>{cInfo.name}</div>
                                <div style={{ fontSize: '12px', color: '#bdc3c7', marginTop: '3px', fontStyle: 'italic' }}>{detail.tagline}</div>
                            </div>
                            <button onClick={() => useGameStore.setState({ charInfoModal: null })} style={{ background: 'none', border: 'none', color: '#bdc3c7', fontSize: '22px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ padding: '14px 18px' }}>
                            <div style={{ background: 'rgba(46,204,113,0.12)', border: '2px solid #2ecc71', borderRadius: '10px', padding: '11px 13px', marginBottom: '9px', textAlign: 'left' }}>
                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#2ecc71', marginBottom: '5px' }}>⭐ パッシブスキル</div>
                                <div style={{ fontSize: '14px', fontWeight: 900, marginBottom: '3px' }}>{detail.passive.name}</div>
                                <div style={{ fontSize: '12px', color: '#bdc3c7', lineHeight: 1.6 }}>{detail.passive.desc}</div>
                            </div>
                            <div style={{ background: 'rgba(231,76,60,0.12)', border: '2px solid #e74c3c', borderRadius: '10px', padding: '11px 13px', textAlign: 'left' }}>
                                <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '5px' }}>⚡ アクションスキル</div>
                                <div style={{ fontSize: '14px', fontWeight: 900, marginBottom: '3px' }}>{detail.action.name}</div>
                                <div style={{ fontSize: '12px', color: '#bdc3c7', lineHeight: 1.6 }}>{detail.action.desc}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ▼ 追加: ラウンドサマリー */}
            {roundSummary && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(92,74,68,0.98)', border: '6px solid #f1c40f', borderRadius: '15px', padding: '25px 40px', zIndex: 280, display: 'flex', flexDirection: 'column', color: '#fdf5e6', boxShadow: '0 0 40px rgba(0,0,0,0.8)', minWidth: '350px' }}>
                    <h2 style={{ margin: '0 0 15px 0', color: '#f1c40f', textAlign: 'center', borderBottom: '2px dashed #f1c40f', paddingBottom: '10px' }}>🌙 ラウンド終了レポート</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {roundSummary.map((item, i) => (
                            <div key={i} style={{ fontSize: '16px', fontWeight: 'bold', animation: `slide-down 0.3s forwards ${i * 0.4}s`, opacity: 0 }}>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ▼ 追加: カード獲得演出 */}
            {acquiredCard && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 5000, display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ background: '#5c4a44', border: '8px solid #f1c40f', borderRadius: '20px', padding: '40px', color: '#fff', boxShadow: '0 0 50px rgba(241,196,15,0.8)', animation: 'card-get-anim 2.5s forwards' }}>
                        <style>{`@keyframes card-get-anim { 0%{transform:scale(0.1) rotate(-20deg); opacity:0;} 20%{transform:scale(1.2) rotate(10deg); opacity:1;} 40%{transform:scale(1) rotate(0deg); opacity:1;} 80%{transform:scale(1) rotate(0deg); opacity:1;} 100%{transform:scale(1.5); opacity:0;} }`}</style>
                        <h2 style={{ color: '#f1c40f', marginTop: 0 }}>✨ カードGET! ✨</h2>
                        <div style={{ fontSize: '80px' }}>{acquiredCard.icon}</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', margin: '15px 0', color: acquiredCard.color, textShadow: '2px 2px 4px #000' }}>{acquiredCard.name}</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{acquiredCard.desc}</div>
                    </div>
                </div>
            )}

            {/* ▼ 追加: 陣地選択UI */}
            {territorySelectOptions && territorySelectOptions.length > 0 && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 10002 }}>
                    <div className="modal-box" style={{ maxWidth: '500px' }}>
                        <h3 style={{ marginTop: 0 }}>🚩 奪う陣地を選択</h3>
                        <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                            {territorySelectOptions.map(tId => {
                                const tile = mapData.find(t => t.id == tId);
                                const ownerId = territories[tId];
                                const owner = players.find(p => p.id == ownerId);
                                return (
                                    <button key={tId} onClick={() => {
                                        useGameStore.setState(s => ({ territories: { ...s.territories, [tId]: cp.id }, territorySelectOptions: null }));
                                        logMsg(`🚩 マス${tId}「${tile?.name}」を奪取！（${owner?.name}から）`);
                                        useGameStore.getState().addEventPopup(cp.id, "🚩", "陣地奪取！", `${tile?.name}を乗っ取った`, "good");
                                    }} style={{ width: '100%', margin: '4px 0', textAlign: 'left', padding: '8px', cursor: 'pointer', borderRadius: '8px', border: '2px solid #8d6e63' }}>
                                        🚩 マス{tId}「{tile?.name}」<br/>
                                        <span style={{ fontSize: '10px', color: '#e74c3c' }}>所有者: {owner?.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <button className="btn-large" style={{ width: '100%', marginTop: '15px', background: '#7f8c8d', borderColor: '#2c3e50' }} onClick={() => useGameStore.setState({ territorySelectOptions: null })}>キャンセル</button>
                    </div>
                </div>
            )}
        </>
    );
};