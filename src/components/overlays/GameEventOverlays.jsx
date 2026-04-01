import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { ClayButton } from '../common/ClayButton';
import { logMsg } from '../../game/actions';
import { deckData } from '../../constants/cards'; 
import { dealDamage } from '../../game/combat';

export const GameEventOverlays = () => {
    const { mgActive, mgType, mgValue, mgResult, storyActive, storyIndex, players, turn, jobResult } = useGameStore();
    const { myUserId, status } = useNetworkStore();
    const cp = players[turn];

    const [slotReels, setSlotReels] = useState([0, 0, 0]);
    const [slotStopped, setSlotStopped] = useState([false, false, false]);
    const slotReelsRef = useRef([0, 0, 0]);
    const marks = ["🍒", "🔔", "🍇"];

    const isMyTurn = status === 'connected' ? (cp?.userId === myUserId) : true;

    // ▼ 追加：ストーリーイベントの定義（HTML版と同一内容）
    const storyEvents = [
        {
            title: "💰 怪しい男の投資話", 
            text: "怪しい男が近づいてきた。「確実に儲かる投資がある」と言うが...", 
            choices: [
                { label: "乗る(50%で+8P/失敗-5P)", action: (cp, s) => { if(Math.random() > 0.5) { s.updateCurrentPlayer(p=>({p:p.p+8})); logMsg("💰 投資大成功！+8P"); s.addEventPopup(cp.id, "✨", "投資大成功！", "+8P", "good"); } else { s.updateCurrentPlayer(p=>({p: Math.max(0, p.p-5)})); logMsg("💰 投資詐欺！-5P"); s.addEventPopup(cp.id, "💥", "投資詐欺！", "-5P", "bad"); } } },
                { label: "断る", action: (cp, s) => { logMsg("💰 怪しい話は断った。"); s.addEventPopup(cp.id, "📖", "断った", "", "neutral"); } }
            ]
        },
        {
            title: "🪙 自販機の下", 
            text: "自動販売機の下に手を入れてみると...", 
            choices: [
                { label: "探す", action: (cp, s) => { let g = Math.floor(Math.random()*5); s.updateCurrentPlayer(p=>({p:p.p+g})); logMsg(`🪙 ${g}P見つけた！`); s.addEventPopup(cp.id, "✨", "小銭発見", `+${g}P`, "good"); } },
                { label: "やめる", action: (cp, s) => { logMsg("🪙 やめておいた。"); s.addEventPopup(cp.id, "📖", "やめた", "", "neutral"); } }
            ]
        },
        {
            title: "🎁 見知らぬ人の贈り物", 
            text: "親切そうな人がカバンをくれた！", 
            choices: [
                { label: "受け取る", action: (cp, s) => { if(Math.random() > 0.3) { let cid = [6,7,10,15][Math.floor(Math.random()*4)]; s.updateCurrentPlayer(p=>({hand:[...p.hand, cid]})); logMsg(`🎁 カードを獲得！`); s.addEventPopup(cp.id, "🎁", "贈り物", "カード獲得", "card"); } else { dealDamage(cp.id, 15, "罠"); logMsg("🎁 罠だった！15ダメージ！"); s.addEventPopup(cp.id, "💥", "罠だった！", "-15HP", "damage"); } } },
                { label: "無視する", action: (cp, s) => { logMsg("🎁 無視した。"); s.addEventPopup(cp.id, "📖", "無視した", "", "neutral"); } }
            ]
        },
        {
            title: "🐕 野良犬に追われた！", 
            text: "突然野良犬が襲ってきた！", 
            choices: [
                { label: "戦う(50%で勝利→+3P)", action: (cp, s) => { if(Math.random() > 0.5) { s.updateCurrentPlayer(p=>({p:p.p+3})); logMsg("🐕 野良犬を撃退！+3P"); s.addEventPopup(cp.id, "✨", "撃退成功", "+3P", "good"); } else { dealDamage(cp.id, 10, "野良犬"); logMsg("🐕 噛まれた！10ダメージ！"); s.addEventPopup(cp.id, "💥", "噛まれた", "-10HP", "damage"); } } },
                { label: "逃げる(AP-2)", action: (cp, s) => { s.updateCurrentPlayer(p=>({ap: Math.max(0, p.ap-2)})); logMsg("🐕 全力で逃げた！AP-2"); s.addEventPopup(cp.id, "💨", "逃げた", "AP-2", "neutral"); } }
            ]
        }
    ];
    const activeStory = storyActive ? storyEvents[storyIndex || 0] : null;

    useEffect(() => {
        if (mgActive && !mgResult) {
            setSlotStopped([false, false, false]);
            setSlotReels([0, 0, 0]);
            slotReelsRef.current = [0, 0, 0];
        }
    }, [mgActive, mgResult]);

    useEffect(() => {
        if (mgActive && mgType === 'slot' && !mgResult) {
            const interval = setInterval(() => {
                setSlotReels(prev => {
                    const next = prev.map((r, i) => slotStopped[i] ? r : Math.floor(Math.random() * 3));
                    slotReelsRef.current = next; 
                    return next;
                });
            }, 100);
            return () => clearInterval(interval);
        }
    }, [mgActive, mgType, mgResult, slotStopped]);

    const handleResult = (isWin, msg) => {
        if (!isMyTurn) return;
        useGameStore.setState({ mgResult: isWin ? '大成功！' : '失敗...' });
        logMsg(`🎲 ${msg}`);
        
        if (isWin) {
            const cardId = Math.floor(Math.random() * 38);
            useGameStore.getState().updateCurrentPlayer(p => ({ hand: [...p.hand, cardId] }));
            
            const cardData = deckData.find(c => c.id === cardId) || { name: '謎のカード', icon: '🃏', color: '#fff', desc: '詳細不明' };
            // ▼ 修正: カード獲得演出の発火
            useGameStore.setState({ acquiredCard: cardData });
            setTimeout(() => useGameStore.setState({ acquiredCard: null }), 2500); // 2.5秒後に消す
            logMsg(`🎁 ${cp.name}は「${cardData.name}」を手に入れた！`);
        }
        
        setTimeout(() => useGameStore.setState({ mgActive: false, mgResult: null }), 2000);
    };

    return (
        <>
            {/* ▼ 追加：ストーリーイベントの表示 */}
            {storyActive && activeStory && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
                    <div className="modal-box" style={{ background: '#2c3e50', color: 'white', maxWidth: '450px' }}>
                        <h2 style={{ color: '#f1c40f' }}>📖 {activeStory.title}</h2>
                        <p style={{ fontSize: '15px', fontWeight: 'bold' }}>{activeStory.text}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                            {activeStory.choices.map((c, i) => (
                                <ClayButton key={i} onClick={() => {
                                    if (isMyTurn) {
                                        c.action(cp, useGameStore.getState());
                                        useGameStore.setState({ storyActive: false });
                                    }
                                }}>{c.label}</ClayButton>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {jobResult?.active && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }} onClick={() => useGameStore.setState({ jobResult: null })}>
                    <div className="modal-box" style={{ background: jobResult.isSuccess ? '#f1c40f' : '#2c3e50', color: jobResult.isSuccess ? '#333' : 'white', borderColor: jobResult.isSuccess ? '#f39c12' : '#1a252f' }}>
                        <div style={{ fontSize: '60px' }}>{jobResult.isSuccess ? '💼🎉' : '😭'}</div>
                        <h2 style={{ marginTop: '10px' }}>{jobResult.isSuccess ? 'バイト大成功！' : 'バイト失敗...'}</h2>
                        <p style={{ fontWeight: 'bold', fontSize: '18px' }}>{jobResult.isSuccess ? `${jobResult.points}P獲得！` : '報酬なし。'}</p>
                        <p style={{ fontSize: '12px', color: '#bdc3c7', marginTop: '20px' }}>(タップして戻る)</p>
                    </div>
                </div>
            )}

            {mgActive && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
                    <div className="modal-box" style={{ background: '#2c3e50', color: 'white' }}>
                        <h2>🎲 ミニゲーム {!isMyTurn && "(待機中...)"}</h2>
                        {!mgResult ? (
                            <div style={{ pointerEvents: isMyTurn ? 'auto' : 'none', opacity: isMyTurn ? 1 : 0.7 }}>
                                {mgType === 'highlow' && (
                                    <>
                                        <p>基準：<span style={{ fontSize: '36px', color: '#f1c40f' }}>{mgValue}</span></p>
                                        <p style={{ fontSize: '14px' }}>次の数(0〜13)はHighかLowか？</p> {/* ▼ 追加: ルール説明 */}
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button className="mg-btn high" onClick={() => {
                                                const result = Math.floor(Math.random() * 14); // ▼ 追加: 乱数生成
                                                handleResult(result >= mgValue, `出目【${result}】${result >= mgValue ? "正解！" : "ハズレ..."}`);
                                            }}>High</button>
                                            <button className="mg-btn low" onClick={() => {
                                                const result = Math.floor(Math.random() * 14); // ▼ 追加: 乱数生成
                                                handleResult(result < mgValue, `出目【${result}】${result < mgValue ? "正解！" : "ハズレ..."}`);
                                            }}>Low</button>
                                        </div>
                                    </>
                                )}
                                {mgType === 'boxes' && (
                                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', fontSize: '40px' }}>
                                        {[0,1,2].map(i => <div key={i} onClick={() => handleResult(Math.random()>0.6, "宝箱判定")} style={{cursor:'pointer'}}>📦</div>)}
                                    </div>
                                )}
                                {mgType === 'slot' && (
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                        {[0,1,2].map(i => (
                                            <div key={i}>
                                                <div style={{ fontSize: '40px', background: '#fff', color: '#000', padding: '10px', borderRadius: '10px' }}>{marks[slotReels[i]]}</div>
                                                <ClayButton disabled={slotStopped[i]} onClick={() => {
                                                    const ns = [...slotStopped]; 
                                                    ns[i] = true; 
                                                    setSlotStopped(ns);
                                                    if(ns.every(s => s)) {
                                                        setTimeout(() => {
                                                            const finalReels = slotReelsRef.current;
                                                            const isWin = finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2];
                                                            handleResult(isWin, "スロット判定");
                                                        }, 150);
                                                    }
                                                }}>STOP</ClayButton>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : <h2>{mgResult}</h2>}
                    </div>
                </div>
            )}
        </>
    );
};