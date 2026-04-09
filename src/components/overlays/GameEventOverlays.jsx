import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { ClayButton } from '../common/ClayButton';
import { logMsg } from '../../game/actions';
import { deckData } from '../../constants/cards'; 
import { dealDamage } from '../../game/combat';
import { setupNpcMove } from '../../game/skills'; 

// ▼ 追加: 15種類のミニゲームコンポーネントをすべてインポート
import { BoxGame, VendGame, ScratchGame, HLGame } from '../../features/minigames/MiniGamesPart1';
import { SlotGame, OxoGame, TetrisGame, FlyGame } from '../../features/minigames/MiniGamesPart2';
import { RatGame, DrunkGame, RainGame, KashiGame } from '../../features/minigames/MiniGamesPart3';
import { BegGame, MusicGame, NegoGame } from '../../features/minigames/MiniGamesPart4';

// ▼ 追加: ルール説明文を呼び出すためのインポート
import { ALL_GAMES } from '../../features/minigames/MinigamesApp';

// ▼ 追加: コンポーネントのマッピング
const MINIGAME_COMPONENTS = {
    box: BoxGame, vend: VendGame, scratch: ScratchGame, hl: HLGame,
    slot: SlotGame, oxo: OxoGame, tetris: TetrisGame, fly: FlyGame,
    rat: RatGame, drunk: DrunkGame, rain: RainGame, kashi: KashiGame,
    beg: BegGame, music: MusicGame, nego: NegoGame
};

export const GameEventOverlays = () => {
    // ▼ 修正: この行に「mgStarted」を追加して、Storeから引っ張り出します！
    const { mgActive, mgType, mgStarted, storyActive, storyIndex, players, turn, jobResult, npcSelectActive } = useGameStore();
    const { myUserId, status } = useNetworkStore();
    const cp = players[turn];

    const isMyTurn = status === 'connected' ? (cp?.userId === myUserId) : true;
    
    const { charInfoModal, roundSummary, acquiredCard, territorySelectOptions, mapData, territories, gameResult } = useGameStore();
    const [confirmEnd, setConfirmEnd] = useState(false);
    
    // ▼ 追加: リトライ等で何度も報酬を受け取れないようにするためのフラグ
        const [mgRewardGiven, setMgRewardGiven] = useState(false);
        
        // 修正: useStateでの管理を削除し、上記で追加した useGameStore から mgStarted を読み込むように、
        // 22行目付近の const { mgActive, mgType... } の中に mgStarted を追加してください。
        // 例: const { mgActive, mgType, mgStarted, storyActive... } = useGameStore();

        useEffect(() => {
            // ミニゲーム起動時に状態をリセット
            if (mgActive) {
                setMgRewardGiven(false);
                // ▼ 修正: プレイヤー本人だけが全体のルール画面状態をリセットする通信を送る
                if (isMyTurn) {
                    useGameStore.setState({ mgStarted: false });
                }
            }
        }, [mgActive, isMyTurn]);

    const victoryPhrases = [
        
        "空き缶拾って成り上がり！見事、人生カンストだ！！",
        "過酷なサバイバル完了！見事、路上卒業（路卒）だ！！",
        "勝った！勝った！今日の炊き出しは特上ステーキだ！",
        "段ボールハウス、本日解体！今夜はタワマン最上階だ！"
    ];
    const randomVictoryPhrase = useMemo(() => {
        if (!gameResult) return "";
        return victoryPhrases[Math.floor(Math.random() * victoryPhrases.length)];
    }, [gameResult]);

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

    return (
        <>
            {npcSelectActive && isMyTurn && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
                    <div className="modal-box" style={{ background: '#2c3e50', color: 'white', maxWidth: '400px' }}>
                        <h2 style={{ color: '#f1c40f', marginTop: 0 }}>🕵️ 情報操作</h2>
                        <p style={{ fontSize: '14px', marginBottom: '15px' }}>動かしたいNPCを選んでください</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                            <ClayButton onClick={() => setupNpcMove('policePos')} style={{ width: '130px', padding: '10px' }}>🚓 警察</ClayButton>
                            <ClayButton onClick={() => setupNpcMove('truckPos')} style={{ width: '130px', padding: '10px' }}>🛻 収集車</ClayButton>
                            <ClayButton onClick={() => setupNpcMove('unclePos')} style={{ width: '130px', padding: '10px' }}>🧓 おじさん</ClayButton>
                            <ClayButton onClick={() => setupNpcMove('yakuzaPos')} style={{ width: '130px', padding: '10px' }}>😎 ヤクザ</ClayButton>
                            <ClayButton onClick={() => setupNpcMove('loansharkPos')} style={{ width: '130px', padding: '10px' }}>💀 闇金</ClayButton>
                            <ClayButton onClick={() => setupNpcMove('animalPos')} style={{ width: '130px', padding: '10px' }}>🐀 野良動物</ClayButton>
                            <ClayButton onClick={() => setupNpcMove('friendPos')} style={{ width: '130px', padding: '10px' }}>🤝 仲間</ClayButton>
                        </div>
                        <ClayButton onClick={() => useGameStore.setState({ npcSelectActive: false })} style={{ width: '100%', marginTop: '20px', background: '#7f8c8d' }}>キャンセル</ClayButton>
                    </div>
                </div>
            )}

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

            {/* ▼ 修正: 古いHTML版ミニゲーム用UIを完全に削除し、新コンポーネントをフルスクリーンで呼び出す */}
            {mgActive && mgType && MINIGAME_COMPONENTS[mgType] && (
                // ▼ 修正: 観戦モード時はコンテナ全体でpointerEventsを無効化し、操作貫通を完全に防ぐ
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#0c0a07', pointerEvents: isMyTurn ? 'auto' : 'none' }}>
                    {!isMyTurn && (
                        <div style={{ position: 'absolute', top: 20, width: '100%', textAlign: 'center', color: 'white', zIndex: 10001, fontSize: '1.2rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                            (他プレイヤーがミニゲーム中...)
                        </div>
                    )}
                    
                    {/* ▼ 追加: スタートボタンが押される前ならルール画面を表示 */}
                    {!mgStarted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#f0e8d0', padding: '20px', textAlign: 'center' }}>
                            <div style={{ background: '#241a0e', border: '2px solid #c97b2a', borderRadius: '15px', padding: '30px', maxWidth: '400px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                                <h2 style={{ fontSize: '1.8rem', color: '#e8b84b', margin: '0 0 15px 0' }}>
                                    {ALL_GAMES.find(g => g.id === mgType)?.icon} {ALL_GAMES.find(g => g.id === mgType)?.name}
                                </h2>
                                <p style={{ fontSize: '1.1rem', color: '#d4c4a0', marginBottom: '25px', lineHeight: '1.6' }}>
                                    {ALL_GAMES.find(g => g.id === mgType)?.desc}
                                </p>
                                {isMyTurn ? (
                                    // ▼ 修正: プレイヤーが押したとき、Storeに書き込んで全員の画面を切り替える
                                    <ClayButton onClick={() => useGameStore.setState({ mgStarted: true })} style={{ width: '100%', fontSize: '1.2rem', padding: '15px' }}>
                                        🎮 ゲームスタート！
                                    </ClayButton>
                                ) : (
                                    <p style={{ color: '#7a6a4a', fontWeight: 'bold' }}>プレイヤーの操作を待っています...</p>
                                )}
                            </div>
                        </div>
                    ) : (
                    React.createElement(MINIGAME_COMPONENTS[mgType], {
                        isEventMode: true, // イベントモードであることを伝えるフラグ
                        isObserver: !isMyTurn, // ▼ 追加: ミニゲーム内部にも観戦者であることを伝える
                        pts: cp?.p || 0,
                        addPts: (pts) => {
                            if (!isMyTurn || mgRewardGiven) return;
                            setMgRewardGiven(true); // 報酬は1マスにつき1回のみ付与
                            
                            useGameStore.getState().updateCurrentPlayer(p => ({ p: p.p + pts }));
                            useGameStore.getState().incrementGameStat(cp.id, 'minigames', 1);
                            
                            // ボードゲーム本編のボーナス: 勝ったらカードを引く
                            const cardId = Math.floor(Math.random() * 38);
                            useGameStore.getState().updateCurrentPlayer(p => ({ hand: [...p.hand, cardId] }));
                            
                            const cardData = deckData.find(c => c.id === cardId) || { name: '謎のカード', icon: '🃏', color: '#fff', desc: '詳細不明' };
                            useGameStore.setState({ acquiredCard: cardData });
                            setTimeout(() => useGameStore.setState({ acquiredCard: null }), 2500); 
                            
                            logMsg(`🎲 ミニゲーム大成功！ +${pts}P と「${cardData.name}」を獲得！`);
                        },
                        subPts: (pts) => {
                            if (!isMyTurn) return;
                            useGameStore.getState().updateCurrentPlayer(p => ({ p: Math.max(0, p.p - pts) }));
                            logMsg(`🎲 ミニゲームで ${pts}P 失った...`);
                        },
                        onBack: () => {
                            // ミニゲーム画面を終了してマップへ戻る
                            useGameStore.setState({ mgActive: false, mgType: null });
                        }
                    })
                    )} {/* ← 修正: 三項演算子を閉じるためのカッコ「 ) 」を追加しました */}
                </div>
            )}

            {roundSummary && (
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(92,74,68,0.98)', border: '6px solid #f1c40f', borderRadius: '15px', padding: '25px 40px', zIndex: 280, display: 'flex', flexDirection: 'column', color: '#fdf5e6', boxShadow: '0 0 40px rgba(0,0,0,0.8)', minWidth: '350px', overflow: 'hidden' }}>
                    <h2 style={{ margin: '0 0 15px 0', color: '#f1c40f', textAlign: 'center', borderBottom: '2px dashed #f1c40f', paddingBottom: '10px' }}>🌙 ラウンド終了レポート</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', width: 'fit-content', margin: '0 auto' }}>
                        {roundSummary.map((item, i) => (
                            <div key={i} style={{ fontSize: '16px', fontWeight: 'bold', animation: `fade-in-right 0.3s forwards ${i * 0.4}s`, opacity: 0, textAlign: 'left' }} dangerouslySetInnerHTML={{ __html: item }} />
                        ))}
                    </div>
                </div>
            )}

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