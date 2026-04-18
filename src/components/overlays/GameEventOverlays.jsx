import React, { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useNetworkStore } from '../../store/useNetworkStore';
import { ClayButton } from '../common/ClayButton';
import { deckData } from '../../constants/cards'; 
import { dealDamage } from '../../game/combat';
// ▼ 修正: ホスト権威のアクションをインポート
import { logMsg, STORY_EVENTS, executeStoryChoice, executeEndMinigame, actionCancelUI } from '../../game/actions';
import { setupNpcMove } from '../../game/skills';

// ▼ ミニゲームコンポーネントのインポート
import { BoxGame, VendGame, ScratchGame, HLGame } from '../../features/minigames/MiniGamesPart1';
import { SlotGame, OxoGame, TetrisGame, FlyGame } from '../../features/minigames/MiniGamesPart2';
import { RatGame, DrunkGame, RainGame, KashiGame } from '../../features/minigames/MiniGamesPart3';
import { BegGame, MusicGame, NegoGame } from '../../features/minigames/MiniGamesPart4';

// ▼ ルール説明文を呼び出すためのインポート
import { ALL_GAMES } from '../../features/minigames/MinigamesApp';

// コンポーネントのマッピング
const MINIGAME_COMPONENTS = {
    box: BoxGame, vend: VendGame, scratch: ScratchGame, hl: HLGame,
    slot: SlotGame, oxo: OxoGame, tetris: TetrisGame, fly: FlyGame,
    rat: RatGame, drunk: DrunkGame, rain: RainGame, kashi: KashiGame,
    beg: BegGame, music: MusicGame, nego: NegoGame
};

export const GameEventOverlays = () => {
    // Storeから状態を取得
    const { 
        mgActive, mgType, mgStarted, storyActive, storyIndex, 
        players, turn, jobResult, npcSelectActive,
        territorySelectOptions, mapData, territories, gameResult 
    } = useGameStore();
    
    const { myUserId, status } = useNetworkStore();
    const cp = players[turn];

    // 自分のターンかどうかの判定
    const isMyTurn = status === 'connected' ? (cp?.userId === myUserId) : true;
    
    const [confirmEnd, setConfirmEnd] = useState(false);
    const [mgRewardGiven, setMgRewardGiven] = useState(false);

    useEffect(() => {
        // ミニゲーム起動時に状態をリセット
        if (mgActive) {
            setMgRewardGiven(false);
            if (isMyTurn) {
                useGameStore.setState({ mgStarted: false });
            }
        }
    }, [mgActive, isMyTurn]);

    // 勝利フレーズの定義
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

    // 現在進行中のストーリーイベントを取得（actions.jsで定義された共有データを使用）
    const activeStory = storyActive ? STORY_EVENTS[storyIndex || 0] : null;

    return (
        <>
            {/* NPC移動選択モーダル */}
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
                        <ClayButton onClick={() => actionCancelUI('npcSelectActive')} style={{ width: '100%', marginTop: '20px', background: '#7f8c8d' }}>キャンセル</ClayButton>
                    </div>
                </div>
            )}

            {/* ストーリーイベントモーダル */}
            {storyActive && activeStory && (
                <div className="modal-overlay" style={{ display: 'flex', zIndex: 1000 }}>
                    <div className="modal-box" style={{ background: '#2c3e50', color: 'white', maxWidth: '450px' }}>
                        <h2 style={{ color: '#f1c40f' }}>📖 {activeStory.title}</h2>
                        <p style={{ fontSize: '15px', fontWeight: 'bold' }}>{activeStory.text}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                            {activeStory.choices.map((c, i) => (
                                <ClayButton key={i} onClick={() => {
                                    if (isMyTurn) {
                                        // ▼ 修正: ホスト側で結果を計算・同期させる
                                        executeStoryChoice(i);
                                    }
                                }}>{c.label}</ClayButton>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* バイト結果モーダル */}
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

            {/* ミニゲームコンテナ */}
            {mgActive && mgType && MINIGAME_COMPONENTS[mgType] && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: '#0c0a07', pointerEvents: isMyTurn ? 'auto' : 'none' }}>
                    {!isMyTurn && (
                        <div style={{ position: 'absolute', top: 20, width: '100%', textAlign: 'center', color: 'white', zIndex: 10001, fontSize: '1.2rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                            (他プレイヤーがミニゲーム中...)
                        </div>
                    )}
                    
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
                            isEventMode: true, 
                            isObserver: !isMyTurn, 
                            pts: cp?.p || 0,
                            addPts: (pts) => {
                                if (!isMyTurn || mgRewardGiven) return;
                                setMgRewardGiven(true); 
                                const cardId = Math.floor(Math.random() * 38);
                                // ▼ 修正: ホスト側で報酬付与と終了処理を一括管理
                                executeEndMinigame(true, pts, cardId, `ミニゲーム大成功！ +${pts}P とカードを獲得！`);
                            },
                            subPts: (pts) => {
                                if (!isMyTurn) return;
                                // ▼ 修正: ホスト側でポイント減少と終了処理を一括管理
                                executeEndMinigame(false, pts, null, `ミニゲームで ${pts}P 失った...`);
                            },
                            onBack: () => {
                                if (!isMyTurn) return;
                                // ▼ 修正: ホスト側へ終了を依頼（報酬なし）
                                executeEndMinigame(false, 0, null, null);
                            }
                        })
                    )}
                </div>
            )}

            {/* 陣地奪取選択モーダル */}
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
                        <button className="btn-large" style={{ width: '100%', marginTop: '15px', background: '#7f8c8d', borderColor: '#2c3e50' }} onClick={() => actionCancelUI('territorySelectOptions')}>キャンセル</button>
                    </div>
                </div>
            )}

            {/* 最終リザルト画面 */}
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

            {/* ゲーム終了確認モーダル */}
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