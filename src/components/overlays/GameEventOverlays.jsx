import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    
    const { charInfoModal, roundSummary, acquiredCard, territorySelectOptions, mapData, territories, gameResult } = useGameStore();
    const [confirmEnd, setConfirmEnd] = useState(false);

    // ▼ 追加：優勝文言のリストと、1度だけランダム抽出する処理
    const victoryPhrases = [
        "優勝！",
        "空き缶拾って成り上がり！見事、人生カンストだ！！",
        "過酷なサバイバル完了！見事、路上卒業（路卒）だ！！",
        "勝った！勝った！今日の炊き出しは特上ステーキだ！",
        "段ボールハウス、本日解体！今夜はタワマン最上階だ！"
    ];
    const randomVictoryPhrase = useMemo(() => {
        if (!gameResult) return "";
        return victoryPhrases[Math.floor(Math.random() * victoryPhrases.length)];
    }, [gameResult]);

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
            useGameStore.setState({ acquiredCard: cardData });
            setTimeout(() => useGameStore.setState({ acquiredCard: null }), 2500); 
            logMsg(`🎁 ${cp.name}は「${cardData.name}」を手に入れた！`);
        }
        
        setTimeout(() => useGameStore.setState({ mgActive: false, mgResult: null }), 2000);
    };

    return (
        <>
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
                                        <p style={{ fontSize: '14px' }}>次の数(0〜13)はHighかLowか？</p> 
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button className="mg-btn high" onClick={() => {
                                                const result = Math.floor(Math.random() * 14); 
                                                handleResult(result >= mgValue, `出目【${result}】${result >= mgValue ? "正解！" : "ハズレ..."}`);
                                            }}>High</button>
                                            <button className="mg-btn low" onClick={() => {
                                                const result = Math.floor(Math.random() * 14); 
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

            {gameResult && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 9998, background: 'radial-gradient(circle,#f1c40f,#e67e22,#c0392b)', flexDirection: 'column', alignItems: 'center', color: 'white', textAlign: 'center', animation: 'win-bg-anim 2s infinite alternate', cursor: 'pointer' }} onClick={() => setConfirmEnd(true)}>
                    <div style={{ fontSize: '80px', marginBottom: '15px' }}>🏆</div>
                    <h1 style={{ fontSize: gameResult.isTeamGame ? '28px' : '26px', textShadow: '2px 2px 10px #000', margin: 0, lineHeight: '1.4' }}>
                        {gameResult.isTeamGame 
                            ? (gameResult.sortedTeams[0].color !== 'none' ? `${gameResult.sortedTeams[0].color}チーム` : `${gameResult.sortedTeams[0].members[0].emoji} ${gameResult.sortedTeams[0].members[0].name}`)
                            : `${gameResult.results[0].emoji} ${gameResult.results[0].name}`}
                        <br />
                        <span style={{ fontSize: '32px', color: '#f1c40f' }}>{randomVictoryPhrase}</span>
                    </h1>
                    
                    <div style={{ fontSize: '18px', marginTop: '20px', textAlign: 'left', background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px', maxHeight: '50vh', overflowY: 'auto' }}>
                        {gameResult.isTeamGame ? (
                            <>
                                <div style={{ marginBottom:'12px', fontSize:'14px', color:'#f1c40f', borderBottom:'1px dashed #f1c40f', paddingBottom:'6px' }}>🏆 チーム順位</div>
                                {gameResult.sortedTeams.map((team, i) => (
                                    <div key={i}>
                                        <div style={{ margin:'8px 0', fontSize: i===0?20:15 }}>
                                            {i===0?'🥇':i===1?'🥈':i===2?'🥉':'4️⃣'} {team.color !== 'none' ? `${team.color}チーム` : `${team.members[0].emoji}${team.members[0].name}(ソロ)`}: <b>{team.total}pt</b>
                                        </div>
                                        {team.members.map(r => (
                                            <div key={r.id} style={{ margin:'2px 0 2px 20px', fontSize:'12px', color:'#bdc3c7' }}>
                                                {r.emoji}{r.name}: {r.totalScore}pt (💰{r.scaledP} 🚩{r.terrValue} ⚔️{r.killBonus} 💀-{r.deathPenalty})
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </>
                        ) : (
                            gameResult.results.map((r, i) => (
                                <div key={i} style={{ margin:'8px 0', fontSize: i===0?22:16 }}>
                                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':'4️⃣'} <span style={{ color: r.color }}>{r.emoji}{r.name}</span>: <b>{r.totalScore}pt</b><br/>
                                    <span style={{ fontSize:'11px', color:'#bdc3c7' }}>
                                        (💰P×2=<b style={{ color:'#f1c40f' }}>{r.scaledP}</b> 🚩{r.terrValue} 資源{r.resourceValue} ⚔️{r.kills}K<span style={{ color:'#2ecc71' }}>+{r.killBonus}</span> 💀{r.deaths}D<span style={{ color:'#e74c3c' }}>-{r.deathPenalty}</span>)
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                    <p style={{ fontSize: '16px', marginTop: '20px' }}>(画面タップで終了確認)</p>
                </div>
            )}

            {confirmEnd && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 10000 }}>
                     <div className="modal-box" style={{ background: '#fdf5e6', color: '#3e2723' }} onClick={e => e.stopPropagation()}>
                         <h3 style={{ color: '#e74c3c', marginTop: 0 }}>⚠️ ゲーム終了確認</h3>
                         <p style={{ fontWeight: 'bold' }}>本当にゲームを終えてタイトルに戻りますか？</p>
                         <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                             <button className="btn-clay" onClick={() => { setConfirmEnd(false); useGameStore.getState().resetGame(); }} style={{ flex: 1, background: '#e74c3c', color: '#fff', border: '2px solid #c0392b', padding: '10px' }}>はい</button>
                             <button className="btn-clay" onClick={() => setConfirmEnd(false)} style={{ flex: 1, background: '#95a5a6', color: '#fff', border: '2px solid #7f8c8d', padding: '10px' }}>いいえ</button>
                         </div>
                     </div>
                </div>
            )}
        </>
    );
};