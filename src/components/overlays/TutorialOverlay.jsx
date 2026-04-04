import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { startTutorialSandbox } from '../../game/sandbox';

const CharCard = ({ emoji, name, role, passive, action, strategy, color }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className={`tut-char-card ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(!expanded)}>
            <div className="tut-char-head">
                <div className="tut-char-emoji" style={{ borderColor: color }}>{emoji}</div>
                <div className="tut-char-meta"><div className="tut-char-name">{name}</div><div className="tut-char-role">{role}</div></div>
            </div>
            <div className="tut-char-skills">
                <div className="tut-skill-row"><span className="tut-skill-badge passive">パッシブ</span><span>{passive}</span></div>
                <div className="tut-skill-row"><span className="tut-skill-badge action">アクション</span><span>{action}</span></div>
            </div>
            <div className="tut-char-strategy" style={{ display: expanded ? 'block' : 'none' }}>
                <div className="tut-strat-title">📋 攻略・定石</div><div className="tut-strat-text">{strategy}</div>
            </div>
            <div className="tut-char-expand" style={{ display: expanded ? 'none' : 'block' }}>▼ タップして定石を表示</div>
            <div className="tut-char-expand" style={{ display: expanded ? 'block' : 'none' }}>▲ 閉じる</div>
        </div>
    );
};

export const TutorialOverlay = () => {
    const { tutorialActive, setGameState } = useGameStore();
    const [currentTab, setCurrentTab] = useState(0);

    if (!tutorialActive) return null;

    const tabs = ['🎯 目的', '🎮 ターンの流れ', '📊 画面の見方', '🗺️ マスの種類', '🃏 カード＆装備', '👥 NPCと危険', '🎯 ミニゲーム', '🏆 キャラ攻略'];
    const sandboxLabels = ['🎮 スコア計算を体験する', '🎮 1ターンをプレイしてみる', '🎮 画面の各要素を確認する', '🎮 いろんなマスを巡ってみる', '🎮 カードを使ってみる', '🎮 NPCに遭遇してみる', '🎮 ミニゲームを遊んでみる', '🎮 キャラスキルを試す'];

    const handleNext = () => {
        if (currentTab < tabs.length - 1) setCurrentTab(prev => prev + 1);
    };
    const handlePrev = () => {
        if (currentTab > 0) setCurrentTab(prev => prev - 1);
    };

    return (
        <div className="tut-overlay">
            <style>{`
                .tut-overlay { position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(10,10,25,0.97); z-index:30000; display:flex; flex-direction:column; color:#fff; font-family:'Hiragino Maru Gothic ProN','Meiryo',sans-serif; }
                .tut-header { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; background:linear-gradient(135deg, #1a1a3e 0%, #2c1e3e 100%); border-bottom:3px solid #f1c40f; flex-shrink:0; }
                .tut-header-title { font-size:20px; font-weight:900; color:#f1c40f; text-shadow:0 0 12px rgba(241,196,15,0.4); display:flex; align-items:center; gap:8px; }
                .tut-close-btn { background:rgba(231,76,60,0.15); border:2px solid #e74c3c; color:#e74c3c; border-radius:8px; padding:6px 14px; font-weight:bold; cursor:pointer; font-size:14px; transition:all 0.2s; }
                .tut-tabs { display:flex; overflow-x:auto; gap:0; background:#1a1a2e; border-bottom:2px solid #2c2c4e; flex-shrink:0; scrollbar-width:thin; }
                .tut-tab { padding:10px 16px; font-size:13px; font-weight:bold; color:#7f8c8d; background:transparent; border:none; cursor:pointer; white-space:nowrap; border-bottom:3px solid transparent; transition:all 0.25s; flex-shrink:0; }
                .tut-tab.active { color:#f1c40f; border-bottom-color:#f1c40f; background:rgba(241,196,15,0.06); }
                .tut-content { flex:1; overflow-y:auto; padding:20px; scrollbar-width:thin; }
                .tut-card { background:linear-gradient(145deg, rgba(40,40,65,0.95), rgba(30,30,50,0.95)); border:2px solid rgba(255,255,255,0.08); border-radius:14px; padding:20px; margin-bottom:18px; box-shadow:0 4px 20px rgba(0,0,0,0.4); }
                .tut-card h3 { margin:0 0 12px 0; font-size:18px; color:#f1c40f; border-bottom:1px dashed rgba(241,196,15,0.3); padding-bottom:8px; }
                .tut-card p, .tut-card li { color:#d5d5e0; font-size:14px; line-height:1.75; margin:6px 0; }
                .tut-card ul { padding-left:18px; margin:8px 0; }
                .tut-card b { color:#fdf5e6; }
                .tut-card em { color:#f39c12; font-style:normal; font-weight:bold; }
                .tut-steps { display:flex; flex-direction:column; gap:0; margin:12px 0; }
                .tut-step { display:flex; gap:14px; align-items:flex-start; position:relative; padding:14px 0; }
                .tut-step:not(:last-child)::after { content:''; position:absolute; left:19px; top:44px; bottom:-2px; width:2px; background:linear-gradient(180deg, #f1c40f, rgba(241,196,15,0.1)); }
                .tut-step-num { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, #f1c40f, #e67e22); display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; color:#1a1a2e; flex-shrink:0; box-shadow:0 0 14px rgba(241,196,15,0.3); z-index:1; }
                .tut-step-body { flex:1; }
                .tut-step-title { font-size:16px; font-weight:900; color:#fdf5e6; margin-bottom:4px; }
                .tut-step-desc { font-size:13px; color:#b0b0c0; line-height:1.6; }
                .tut-highlight { background:rgba(241,196,15,0.08); border-left:4px solid #f1c40f; padding:12px 16px; border-radius:0 8px 8px 0; margin:12px 0; }
                .tut-highlight p { color:#e0d5a0; margin:0; }
                .tut-ui-mock { background:rgba(92,74,68,0.6); border:2px solid #8d6e63; border-radius:12px; padding:14px; margin:12px 0; position:relative; }
                .tut-ui-label { position:absolute; top:-10px; left:14px; background:#f1c40f; color:#1a1a2e; padding:2px 10px; border-radius:4px; font-size:11px; font-weight:900; }
                .tut-mock-row { display:flex; gap:8px; flex-wrap:wrap; margin:6px 0; }
                .tut-mock-stat { background:#8d7b68; padding:6px 10px; border-radius:6px; font-size:12px; font-weight:bold; color:#fdf5e6; border:1px solid #4a3b32; }
                .tut-mock-btn { background:#e07a5f; color:#fff; padding:8px 14px; border-radius:6px; font-size:12px; font-weight:bold; border:2px solid #3e2f2a; }
                .tut-mock-btn.highlight { box-shadow:0 0 12px rgba(241,196,15,0.6); border-color:#f1c40f; }
                .tut-mock-btn.disabled { opacity:0.4; }
                .tut-arrow-label { font-size:12px; color:#f1c40f; font-weight:bold; margin:6px 0; }
                .tut-tile-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px; margin:12px 0; }
                .tut-tile-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); }
                .tut-tile-dot { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; box-shadow:0 2px 8px rgba(0,0,0,0.4); border:2px solid rgba(255,255,255,0.3); }
                .tut-tile-info { flex:1; }
                .tut-tile-name { font-size:13px; font-weight:bold; color:#fdf5e6; }
                .tut-tile-desc { font-size:11px; color:#95a5a6; line-height:1.4; }
                .tut-npc-list { display:flex; flex-direction:column; gap:8px; margin:10px 0; }
                .tut-npc-item { display:flex; align-items:center; gap:10px; padding:10px; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); }
                .tut-npc-icon { font-size:28px; width:42px; text-align:center; flex-shrink:0; }
                .tut-npc-name { font-size:13px; font-weight:bold; color:#fdf5e6; }
                .tut-npc-desc { font-size:11px; color:#95a5a6; line-height:1.4; margin-top:2px; }
                .tut-char-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:14px; margin:12px 0; }
                .tut-char-card { background:linear-gradient(145deg, rgba(50,50,75,0.9), rgba(35,35,55,0.9)); border:2px solid rgba(255,255,255,0.08); border-radius:12px; padding:16px; cursor:pointer; }
                .tut-char-head { display:flex; align-items:center; gap:12px; }
                .tut-char-emoji { font-size:38px; width:56px; height:56px; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.3); border-radius:12px; border:2px solid; flex-shrink:0; }
                .tut-char-meta { flex:1; }
                .tut-char-name { font-size:16px; font-weight:900; color:#fdf5e6; }
                .tut-char-role { font-size:11px; color:#95a5a6; margin-top:2px; }
                .tut-char-skills { margin-top:10px; }
                .tut-skill-row { display:flex; gap:8px; align-items:flex-start; margin:6px 0; font-size:12px; color:#c0c0d0; }
                .tut-skill-badge { font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px; flex-shrink:0; margin-top:1px; }
                .tut-skill-badge.passive { background:rgba(46,204,113,0.2); color:#2ecc71; border:1px solid rgba(46,204,113,0.3); }
                .tut-skill-badge.action { background:rgba(231,76,60,0.2); color:#e74c3c; border:1px solid rgba(231,76,60,0.3); }
                .tut-strat-title { font-size:12px; font-weight:bold; color:#f1c40f; margin-bottom:6px; margin-top:12px; padding-top:12px; border-top:1px dashed rgba(255,255,255,0.1); }
                .tut-strat-text { font-size:12px; color:#a0a0b8; line-height:1.65; }
                .tut-char-expand { font-size:11px; color:#7f8c8d; text-align:center; margin-top:8px; transition:color 0.2s; }
                .tut-footer { display:flex; justify-content:space-between; align-items:center; padding:12px 20px; background:#1a1a2e; border-top:2px solid #2c2c4e; flex-shrink:0; }
                .tut-footer-btn { padding:8px 20px; border-radius:8px; font-weight:bold; font-size:14px; cursor:pointer; border:2px solid; transition:all 0.2s; }
                .tut-footer-btn.prev { background:transparent; border-color:#7f8c8d; color:#7f8c8d; }
                .tut-footer-btn.next { background:#f1c40f; border-color:#f1c40f; color:#1a1a2e; }
                .tut-try-btn { display:inline-flex; align-items:center; gap:6px; padding:10px 20px; margin-bottom:16px; background:linear-gradient(135deg,#f1c40f,#e67e22); color:#1a1a2e; font-weight:900; font-size:14px; border:none; border-radius:10px; cursor:pointer; box-shadow:0 4px 16px rgba(241,196,15,0.4); transition:all 0.2s; }
            `}</style>

            <div className="tut-header">
                <div className="tut-header-title">📚 チュートリアル</div>
                <button className="tut-close-btn" onClick={() => setGameState({ tutorialActive: false })}>✕ 閉じる</button>
            </div>

            <div className="tut-tabs">
                {tabs.map((tab, idx) => (
                    <button key={idx} className={`tut-tab ${currentTab === idx ? 'active' : ''}`} onClick={() => setCurrentTab(idx)}>{tab}</button>
                ))}
            </div>

            <div className="tut-content">
                {currentTab < sandboxLabels.length && (
                    <div style={{ textAlign: 'center' }}>
                        <button className="tut-try-btn" onClick={() => startTutorialSandbox(currentTab)}>
                            {sandboxLabels[currentTab]}
                        </button>
                    </div>
                )}

                {/* 1. 目的 */}
                {currentTab === 0 && (
                    <div className="tut-page active">
                        <div className="tut-card">
                            <h3>🏆 勝利条件</h3>
                            <p>このゲームは<b>指定ラウンド数</b>が終わった時点で、<em>最も高い総合スコア</em>を持つプレイヤーの勝利です。</p>
                            <div className="tut-highlight"><p><strong>スコア計算式</strong><br/>スコア ＝ 所持P × 2 ＋ 陣地の価値(スラム3/商業6/高級10) ＋ 資源価値 ＋ キル×3 − デス×5</p></div>
                            <p>つまり、<b>お金（P）</b>を稼ぐだけでなく、<b>陣地の確保</b>や<b>他プレイヤーとの戦闘</b>も重要です。死亡回数が多いと大きく減点されるので注意！</p>
                        </div>
                        <div className="tut-card">
                            <h3>💡 基本の稼ぎ方</h3>
                            <ul>
                                <li>🥫 <b>空き缶拾い</b> → 買取所で換金してPを稼ぐ（最も安定）</li>
                                <li>💼 <b>バイト</b> → バイトマスで働いてPを直接獲得</li>
                                <li>🚩 <b>陣地占領</b> → マスを占領して毎ターン家賃収入をゲット</li>
                                <li>🃏 <b>カード</b> → ミニゲームやイベントで手に入るカードを活用</li>
                                <li>⚔️ <b>PvP</b> → 武器カードで他プレイヤーを倒してPを奪う</li>
                            </ul>
                        </div>
                        <div className="tut-card">
                            <h3>⚠️ よくある負けパターン</h3>
                            <ul>
                                <li>💀 死亡を繰り返してデス数が増えすぎる（−5P/回）</li>
                                <li>🗑️ 缶やゴミを大量に持ったまま倒されて全てドロップしてしまう</li>
                                <li>🚩 陣地を取らず固定収入がないまま後半に入る</li>
                                <li>💸 陣地の維持費が払えず、最も価値の高い陣地を没収される</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* 2. ターンの流れ */}
                {currentTab === 1 && (
                    <div className="tut-page active">
                        <div className="tut-card">
                            <h3>🔄 1ターンの流れ</h3>
                            <p>各プレイヤーは1ターンに以下の流れでプレイします。</p>
                            <div className="tut-steps">
                                <div className="tut-step"><div className="tut-step-num">1</div><div className="tut-step-body"><div className="tut-step-title">🎲 サイコロを振る</div><div className="tut-step-desc">2つのサイコロの合計が<b>AP（行動力）</b>になります。<br/><em>ゾロ目</em>が出るとAPが2倍！自転車装備なら+2AP追加。</div></div></div>
                                <div className="tut-step"><div className="tut-step-num">2</div><div className="tut-step-body"><div className="tut-step-title">🚶 移動＆アクション</div><div className="tut-step-desc">APを消費して自由に行動します。<br/>移動は1AP（雨の日は2AP）、各マスのアクション（缶拾い、バイト等）を実行できます。<br/><em>APが続く限り何度でも行動OK！</em></div></div></div>
                                <div className="tut-step"><div className="tut-step-num">3</div><div className="tut-step-body"><div className="tut-step-title">🃏 カード使用</div><div className="tut-step-desc">手札のカードを<b>2AP</b>で使用可能。回復、攻撃、バフなど多彩。<br/>APがあれば1ターンに何枚でも使えます。</div></div></div>
                                <div className="tut-step"><div className="tut-step-num">4</div><div className="tut-step-body"><div className="tut-step-title">🛑 ターン終了</div><div className="tut-step-desc">やることが終わったら「ターン終了」ボタンを押します。<br/><em>残ったAPは全て消滅します！</em>なるべく使い切りましょう。</div></div></div>
                            </div>
                        </div>
                        <div className="tut-card">
                            <h3>🔁 ラウンドと環境変化</h3>
                            <p>全員が1ターンずつ終えると<b>1ラウンド</b>終了です。ラウンド切替時に：</p>
                            <ul>
                                <li>🌤️ <b>天候が変化</b>する場合がある（晴れ→曇り→雨）</li>
                                <li>🌙 <b>昼夜が切り替わる</b>ことがある（夜は視界制限あり）</li>
                                <li>📈 <b>缶・ゴミの相場</b>がランダムに変動</li>
                                <li>🛻 <b>ゴミ収集車</b>が暴走し、同じエリアのプレイヤーにダメージ！</li>
                                <li>💸 <b>維持費徴収</b>（3ラウンドごと）</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* 3. 画面の見方 */}
                {currentTab === 2 && (
                    <div className="tut-page active">
                        <div className="tut-card">
                            <h3>📊 ステータスパネル（左上）</h3>
                            <p>現在のターンプレイヤーの情報が表示されます。タップするとキャラの詳細スキルが見れます。</p>
                            <div className="tut-ui-mock">
                                <div className="tut-ui-label">ステータス表示</div>
                                <div className="tut-mock-row" style={{ marginTop: '12px' }}><div className="tut-mock-stat">❤️ HP: 100</div><div className="tut-mock-stat" style={{ background: '#4a6b5d' }}>⚡ AP: 8</div></div>
                                <div className="tut-mock-row"><div className="tut-mock-stat">💰 P: 15</div><div className="tut-mock-stat">🚩 領土: 3</div></div>
                                <div className="tut-mock-row"><div className="tut-mock-stat" style={{ background: '#4a3b32' }}>⚔️ 2K / 💀1D</div></div>
                                <div className="tut-mock-row"><div className="tut-mock-stat" style={{ background: '#6d5c4e' }}>🥫3 🗑️2 🎴4/7</div></div>
                            </div>
                            <div className="tut-arrow-label">👆 各項目の意味</div>
                            <ul>
                                <li><b>❤️ HP</b> — 体力。0になると死亡（病院に戻される）</li>
                                <li><b>⚡ AP</b> — 行動力。移動やアクションに消費。サイコロで獲得</li>
                                <li><b>💰 P</b> — ポイント（お金）。スコア計算のメイン要素</li>
                                <li><b>🚩 領土</b> — 占領中のマス数。毎ターン家賃収入が入る</li>
                                <li><b>⚔️ K/💀D</b> — キル数とデス数。スコアに加減算される</li>
                                <li><b>🥫🗑️🎴</b> — 缶の数、ゴミの数、手札数/上限</li>
                            </ul>
                        </div>
                        <div className="tut-card">
                            <h3>🌤️ 環境パネル（左上）</h3>
                            <div className="tut-ui-mock">
                                <div className="tut-ui-label">環境情報</div>
                                <div style={{ textAlign: 'center', padding: '8px', marginTop: '10px' }}>
                                    <div style={{ background: '#3498db', padding: '6px', borderRadius: '6px', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>☀️ 晴れ</div>
                                    <div style={{ fontSize: '11px', color: '#bdc3c7', marginTop: '4px' }}>R: 3/20</div>
                                    <div style={{ fontSize: '11px', color: '#bdc3c7' }}>☀️ 昼</div>
                                    <div style={{ fontSize: '10px', color: '#f1c40f', marginTop: '4px', background: '#3e2f2a', padding: '3px', borderRadius: '4px' }}>缶:1P ゴミ:2P</div>
                                </div>
                            </div>
                            <ul>
                                <li><b>天候</b> — 雨の日は移動コスト2倍＆缶拾い/ゴミ漁り不可</li>
                                <li><b>ラウンド</b> — 現在のラウンド / 最大ラウンド</li>
                                <li><b>昼夜</b> — 夜は視界が前後3マスに制限される</li>
                                <li><b>相場</b> — 缶とゴミの換金レート。毎ラウンド変動</li>
                            </ul>
                        </div>
                        <div className="tut-card">
                            <h3>🎮 アクションボタン（右側）</h3>
                            <div className="tut-ui-mock">
                                <div className="tut-ui-label">アクション</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', marginTop: '10px' }}>
                                    <div className="tut-mock-btn highlight">🎲 サイコロを振る</div>
                                    <div className="tut-mock-btn disabled">🚶 移動 (1AP)</div>
                                    <div className="tut-mock-btn disabled">🥫 缶拾い (1AP)</div>
                                    <div className="tut-mock-btn disabled">🗑️ ゴミ漁り (2AP)</div>
                                    <div className="tut-mock-btn disabled">🚩 陣地占領 (3P)</div>
                                    <div className="tut-mock-btn disabled">💼 バイト (3AP)</div>
                                </div>
                            </div>
                            <div className="tut-highlight"><p><strong>ポイント：</strong>ボタンが明るく光っている＝今使えるアクション。<br/>灰色の半透明＝条件未達（APが足りない、現在のマスでは使えない等）。<br/>まずサイコロを振り、APを確保してから他のアクションを行います。</p></div>
                        </div>
                        <div className="tut-card">
                            <h3>🗺️ マップエリア（中央）</h3>
                            <p>ゲームボードが表示されます。丸いタイル上にプレイヤーのコマやNPCが配置されています。</p>
                            <ul>
                                <li>🔍 <b>ズーム</b> — マウスホイール/ピンチ操作でズーム</li>
                                <li>🖐️ <b>パン(スクロール)</b> — 画面をドラッグ/スワイプして視点移動</li>
                                <li>👆 <b>タイルタップ</b> — 分岐点で進む方向を選択する時に使用</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* 4. マスの種類 */}
                {currentTab === 3 && (
                    <div className="tut-page active">
                        <div className="tut-card">
                            <h3>🗺️ マスの種類一覧</h3>
                            <p>マップ上の各タイルは色と形で種類を判別できます。</p>
                            <div className="tut-tile-grid">
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: 'radial-gradient(circle,#78c6ff,#1565c0)' }}>🔵</div><div className="tut-tile-info"><div className="tut-tile-name">道（通常マス）</div><div className="tut-tile-desc">通過するだけ。分岐点になることも</div></div></div>
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: 'radial-gradient(circle,#4dd0e1,#006064)' }}>🥫</div><div className="tut-tile-info"><div className="tut-tile-name">空き缶マス</div><div className="tut-tile-desc">1APで缶を拾える（1ターン3回まで）</div></div></div>
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: 'radial-gradient(circle,#ef9a9a,#b71c1c)' }}>🗑️</div><div className="tut-tile-info"><div className="tut-tile-name">ゴミ山マス</div><div className="tut-tile-desc">2APでゴミ漁り。約16%で補導(次AP-2&終了)。夜にボーナス</div></div></div>
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: 'radial-gradient(circle,#ce93d8,#6a1b9a)' }}>❓</div><div className="tut-tile-info"><div className="tut-tile-name">イベントマス</div><div className="tut-tile-desc">到着時にランダムイベント発生</div></div></div>
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: 'radial-gradient(circle,#81c784,#1b5e20)' }}>💼</div><div className="tut-tile-info"><div className="tut-tile-name">バイトマス</div><div className="tut-tile-desc">3APで働いてPを稼ぐ</div></div></div>
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: 'radial-gradient(circle,#ffee58,#f9a825)' }}>🛒</div><div className="tut-tile-info"><div className="tut-tile-name">ショップマス</div><div className="tut-tile-desc">Pを払ってカードを購入・売却</div></div></div>
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: 'radial-gradient(circle,#ffa726,#bf360c)' }}>💱</div><div className="tut-tile-info"><div className="tut-tile-name">買取所マス</div><div className="tut-tile-desc">缶やゴミを換金できる（0AP）</div></div></div>
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: 'radial-gradient(circle,#80deea,#00838f)' }}>🏠</div><div className="tut-tile-info"><div className="tut-tile-name">避難所マス</div><div className="tut-tile-desc">通過時にHP回復</div></div></div>
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: 'radial-gradient(circle,#ff7043,#b71c1c)' }}>🚓</div><div className="tut-tile-info"><div className="tut-tile-name">交番マス</div><div className="tut-tile-desc">通過で強制足止め（ターン終了）</div></div></div>
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: 'radial-gradient(circle,#fff59d,#f9a825)', border: '2px solid #f1c40f', boxShadow: '0 0 8px #f1c40f' }}>🏥</div><div className="tut-tile-info"><div className="tut-tile-name">病院（中央）</div><div className="tut-tile-desc">到着・通過でHP最大30無料回復！</div></div></div>
                            </div>
                        </div>
                        <div className="tut-card">
                            <h3>🌍 エリアと陣地の価値</h3>
                            <p>マップは3つのエリアに分かれています。占領時の<b>収入とコスト</b>が異なります。</p>
                            <div className="tut-tile-grid">
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: '#796859' }}>🏚️</div><div className="tut-tile-info"><div className="tut-tile-name">スラム街</div><div className="tut-tile-desc">維持費0P。収入1P/ターン</div></div></div>
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: '#a89481' }}>🏢</div><div className="tut-tile-info"><div className="tut-tile-name">商業地区</div><div className="tut-tile-desc">維持費1P。収入2P/ターン</div></div></div>
                                <div className="tut-tile-item"><div className="tut-tile-dot" style={{ background: '#d1c4b9', color: '#333' }}>💎</div><div className="tut-tile-info"><div className="tut-tile-name">高級住宅街</div><div className="tut-tile-desc">維持費2P。収入3P/ターン</div></div></div>
                            </div>
                            <div className="tut-highlight"><p><strong>定石：</strong>序盤はスラム街の安いマスを2〜3個確保し、安定した固定収入を作ることが重要です。<br/>3ラウンドごとの維持費が払えないと、一番高い陣地が没収されてしまうので注意！<br/>他人の陣地を奪う（上書き）には<b>6P</b>必要です。</p></div>
                        </div>
                    </div>
                )}

                {/* 5. カード＆装備 */}
                {currentTab === 4 && (
                    <div className="tut-page active">
                        <div className="tut-card">
                            <h3>🃏 カードの基本</h3>
                            <ul>
                                <li>使用コスト：すべてのカード使用に<em>2AP</em>必要</li>
                                <li>手札上限：通常7枚（リュックで+2）</li>
                                <li>入手方法：イベントマス、ショップ購入、ゴミ漁りドロップなど</li>
                            </ul>
                        </div>
                        <div className="tut-card">
                            <h3>⚔️ 戦闘とPのドロップ（重要）</h3>
                            <p>武器カードやスキルで他プレイヤーにダメージを与えると、<b>ダメージの1/5にあたるP</b>を相手はその場にドロップします。</p>
                            <ul>
                                <li>近接攻撃で倒せばそのまま自分がPを奪えます。</li>
                                <li>遠距離攻撃の場合、ドロップしたPは周囲のプレイヤーに「ハイエナ（横取り）」される可能性があります。</li>
                                <li>HP0で死亡させた場合、相手の持っていた「缶」と「ゴミ」も全てその場にドロップします！</li>
                            </ul>
                        </div>
                        <div className="tut-card">
                            <h3>🔴 攻撃・妨害系カード</h3>
                            <p>他プレイヤーを攻撃したり妨害するカード。</p>
                            <ul>
                                <li><b>レンガ（射程2）</b> — 10ダメージ。序盤の牽制に</li>
                                <li><b>バット（射程1）</b> — 20ダメージ。同マス/隣接で</li>
                                <li><b>拳銃（射程3）</b> — 40ダメージ。遠距離攻撃の主力</li>
                                <li><b>ショットガン（射程2）</b> — 範囲内全員に30ダメ。逆転要素</li>
                                <li><b>通報</b> — 相手の次AP-2。地味に強い妨害</li>
                            </ul>
                            <div className="tut-highlight"><p><strong>武器の射程について：</strong>使用すると<em>扇形の照準UI</em>が出るので、スライダーで角度を調整してハイライトされたマスを攻撃します。</p></div>
                        </div>
                        <div className="tut-card">
                            <h3>🛡️ 装備品・リアクションカード</h3>
                            <ul>
                                <li>🚲 <b>ボロボロの自転車</b> — 毎ターンAP+2。最重要装備</li>
                                <li>🛒 <b>大きなリヤカー</b> — 陣地収入2倍。不動産プレイの核</li>
                                <li><b>弁護士の盾</b> — 次の攻撃/カツアゲを完全無効化（使用して予約しておく）</li>
                                <li><b>裏取引</b> — 「下剋上」「大暴落」などの全体魔法を相手に反射</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* 6. NPCと危険 */}
                {currentTab === 5 && (
                    <div className="tut-page active">
                        <div className="tut-card">
                            <h3>👥 マップ上のNPC</h3>
                            <p>マップには複数のNPCが巡回しています。近づくと自動的にイベントが発生します。</p>
                            <div className="tut-npc-list">
                                <div className="tut-npc-item"><div className="tut-npc-icon">🚓</div><div className="tut-npc-info"><div className="tut-npc-name">警察</div><div className="tut-npc-desc">同マスに止まると<b>次回AP-2 ＆ ターン強制終了！</b><br/>偶数ラウンド終了時には広範囲をパトロール巡回します。</div></div></div>
                                <div className="tut-npc-item"><div className="tut-npc-icon">🛻</div><div className="tut-npc-info"><div className="tut-npc-name">ごみ収集車（ホラー）</div><div className="tut-npc-desc">毎ラウンド終了時にランダムでエリアを暴走。<br/>轢かれると<b>55%の確率で50の大ダメージ！</b>事前に危険エリアが予告されます。</div></div></div>
                                <div className="tut-npc-item"><div className="tut-npc-icon">👴</div><div className="tut-npc-info"><div className="tut-npc-name">厄介なおじさん</div><div className="tut-npc-desc">絡まれると<b>カード1枚破棄 ＆ ターン強制終了！</b></div></div></div>
                                <div className="tut-npc-item"><div className="tut-npc-icon">😎</div><div className="tut-npc-info"><div className="tut-npc-name">ヤクザ</div><div className="tut-npc-desc">遭遇すると30ダメージ＋手札1枚ランダム強奪。</div></div></div>
                                <div className="tut-npc-item"><div className="tut-npc-icon">💰</div><div className="tut-npc-info"><div className="tut-npc-name">闇金</div><div className="tut-npc-desc">遭遇すると所持金から最大10P強制没収。</div></div></div>
                                <div className="tut-npc-item"><div className="tut-npc-icon">🤝</div><div className="tut-npc-info"><div className="tut-npc-name">仲間</div><div className="tut-npc-desc">同マスに止まると空き缶を1つもらえる有益なNPC。</div></div></div>
                            </div>
                            <div className="tut-highlight"><p><strong>回避方法：</strong>「身代わり人形」を装備していれば1回だけNPCの妨害を無効化できます。警察は「身分証明書」「ステルス行動」等のカードでも回避可能です。</p></div>
                        </div>
                        <div className="tut-card">
                            <h3>💀 死亡とリスポーン</h3>
                            <p>HPが0になると<b>死亡</b>します。死亡時の影響：</p>
                            <ul>
                                <li>病院マス（中央）に強制転送</li>
                                <li>所持Pの約1/3を没収（最大15P）</li>
                                <li>装備品をランダムで1つ落とす</li>
                                <li>持っていた缶・ゴミをすべてその場にドロップ（他人が拾える）</li>
                                <li>デス数+1（スコアに−5）</li>
                                <li>復活後<em>2ターン無敵</em></li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* 7. ミニゲーム */}
                {currentTab === 6 && (
                    <div className="tut-page active">
                        <div className="tut-card">
                            <h3>🎲 ミニゲームとは</h3>
                            <p>イベントマスに止まると、ランダムでミニゲームが発生します。<br/><em>勝つとカードが確定で手に入ります！</em></p>
                            <div className="tut-highlight"><p><strong>逆転要素：</strong>順位が低いプレイヤーほど、ミニゲーム勝利時に<em>強力なカード</em>が出やすくなります。<br/>負けている時こそイベントマスに積極的に止まりましょう！</p></div>
                        </div>
                        <div className="tut-card">
                            <h3>📊 ハイ＆ロー</h3>
                            <p>基準の数字（0〜13）が表示され、次に出る数字がHighかLowかを当てます。</p>
                            <ul><li>基準が<b>0〜5</b>の時 → Highを選ぶのが有利</li><li>基準が<b>8〜13</b>の時 → Lowを選ぶのが有利</li><li>基準が<b>6〜7</b>の時 → ほぼ半々。直感で！</li></ul>
                        </div>
                        <div className="tut-card">
                            <h3>📦 宝箱ゲーム</h3>
                            <p>3つの宝箱から1つを選びます。1つが当たり。</p>
                            <ul><li>単純な1/3の運ゲーです</li><li>どれを選んでも確率は同じなので、直感で選びましょう</li></ul>
                        </div>
                        <div className="tut-card">
                            <h3>🎰 スロット</h3>
                            <p>3つのリールをSTOPして、絵柄を揃えます。</p>
                            <ul><li>各リールを1つずつ止めていきます</li><li>3つ揃えば大当たり（確率は低め）</li><li>2つ揃いでも小当たりになることがあります</li></ul>
                        </div>
                    </div>
                )}

                {/* 8. キャラ攻略 */}
                {currentTab === 7 && (
                    <div className="tut-page active">
                        <div className="tut-card">
                            <h3>🏆 キャラクター選びのコツ</h3>
                            <p>各キャラクターには<b>パッシブスキル</b>（常時発動）と<b>アクションスキル</b>（APを消費して任意発動）があります。<br/>プレイスタイルに合ったキャラを選びましょう。カードをタップすると定石が表示されます。</p>
                        </div>
                        <div className="tut-char-grid">
                            <CharCard emoji="🏃" name="元アスリート" role="機動力特化型" passive="移動が常に1AP＆雨の影響なし" action="疾風ダッシュ（3AP）:3マス先へ跳躍。候補が白く光る" strategy="序盤から積極的に動き回り、缶拾い→換金のサイクルを素早く回すのが基本。雨の日は他プレイヤーが動けない中で独走できるため、雨の日にイベントマスや遠方の買取所を狙う。疾風ダッシュは危険なNPCからの脱出にも有効。陣地は通り道沿いに確保し、高回転の移動で稼ぐスタイル。" color="#e74c3c" />
                            <CharCard emoji="💼" name="元営業マン" role="金策特化型" passive="バイト成功率80%＆ショップ2P割引" action="訪問販売（2AP）:手札を1枚選んで相手に押し付け3P徴収" strategy="バイトマスに居座って安定収入を稼ぐのが基本。ショップも2P割引で使えるため、装備品を早めに揃えやすい。訪問販売は「不要カード→3P」に変換するスキルとして非常に強力。手札をあえて多く持ち、不要カードを押し付けて稼ぐ「カード回転型」の立ち回りが強い。" color="#3498db" />
                            <CharCard emoji="🌿" name="サバイバー" role="耐久型" passive="ゴミ漁り失敗の警察ペナ無効" action="野宿（2AP）:HP+15回復" strategy="ゴミ山マスでノーリスクにゴミを集めて換金する。ゴミ漁りは通常リスクがあるが、サバイバーなら失敗してもダメージなし。野宿でHP管理も容易なので、前線に出続けられる。安全靴を装備するとゴミ漁り1APになり、効率が劇的に向上。序盤はゴミ漁り→換金→陣地確保のルートが安定。" color="#2ecc71" />
                            <CharCard emoji="👊" name="元ヤン" role="PvP特化型" passive="同マス/すれ違いで自動1Pカツアゲ（1ターン2P上限）" action="殴る（2AP）:同マスの相手に10ダメージ" strategy="他プレイヤーの多いルートを歩き回り、すれ違いカツアゲで稼ぐ。序盤は移動しながらカツアゲ→中盤以降は武器カードで本格PvP。殴るスキルは低コストで使えるため、HPの減った相手を仕留めてキルポイントを稼ぐのも有効。ただし集中攻撃されやすいため、段ボールの盾やヘルメットの装備が重要。" color="#e67e22" />
                            <CharCard emoji="💻" name="元ハッカー" role="戦略型" passive="手札上限+2（9枚）" action="遠隔ハッキング（3AP）:どこからでもショップ入替え＆1枚購入" strategy="手札上限9枚を活かし、多種多様なカードをストック。遠隔ハッキングでショップ品を吟味し、最適なカードだけ購入する。大量のカードを持てるため、攻撃カード+リアクションカード+装備を同時に保持可能。状況に応じたカードを選んで使い分ける戦略的プレイが求められる。" color="#3498db" />
                            <CharCard emoji="🎸" name="ストリートミュージシャン" role="支援＆制圧型" passive="他者が同マスor隣接にいると銀行+3P" action="路上ライブ（4AP）:周囲2マスの全員を自分のマスに引き寄せ" strategy="人が集まりやすい交差点や中央付近に陣取り、投げ銭パッシブで稼ぐのが基本。路上ライブで強制的にプレイヤーを集めることで、投げ銭の機会を作りつつ、元ヤンなどの戦闘キャラと組み合わせると凶悪。ただしAPコストが重いので、自転車装備やスケボーカードとの併用が重要。" color="#9b59b6" />
                            <CharCard emoji="🩺" name="闇医者" role="持久＆金策型" passive="毎ターン開始時HP+5自動回復" action="闇診療（2AP）:同マスの相手HP+30→5P強制徴収" strategy="自己回復で常にHP満タン近くを維持し、長期戦に強い。闇診療は「相手を回復させて5P奪う」という独特なスキル。HPの減った味方を見つけたら近寄って闇診療→5P稼ぎつつ、お互いにWin-Win（相手はHP回復するが金は失う）。前線で戦う元ヤンの近くに居座ると、診療の機会が増える。" color="#1abc9c" />
                            <CharCard emoji="🎲" name="ギャンブラー" role="ハイリスク・ハイリターン型" passive="ゾロ目でAP2倍＋HP+10回復。25%の確率で3ダイス発動" action="イカサマ勝負（2AP）:1d6対決・勝者が5P奪取" strategy="ゾロ目パッシブが発動すると爆発的なAPで一気に行動可能。25%でサイコロが3つに増えるため、上振れたときの行動量は圧倒的。イカサマ勝負は期待値的にはイーブンだが、スキルとして常時使えるため、Pが少ない相手に仕掛けるとローリスク。安定感には欠けるが爆発力はNo.1。" color="#f1c40f" />
                            <CharCard emoji="🕵️" name="元探偵" role="防衛＆コントロール型" passive="自陣地に相手が完全に止まると30%の確率で手札1枚没収" action="情報操作（3AP）:好きなNPC1体を任意のマスへ移動(CD:3R)" strategy="陣地を多めに確保し、張り込みパッシブで他プレイヤーのカードを奪う防衛型。人気ルート上の陣地を取ると、止まった相手からカードを没収できる。情報操作はヤクザや警察を他プレイヤーのマスに送り込む妨害技。守りを固めつつ、NPCで遠隔から嫌がらせする陰湿プレイが真骨頂。" color="#95a5a6" />
                        </div>
                    </div>
                )}
            </div>

            <div className="tut-footer">
                <button className="tut-footer-btn prev" disabled={currentTab === 0} onClick={handlePrev}>◀ 前へ</button>
                <span className="tut-progress">{currentTab + 1} / {tabs.length}</span>
                {currentTab < tabs.length - 1 ? (
                    <button className="tut-footer-btn next" onClick={handleNext}>次へ ▶</button>
                ) : (
                    <button className="tut-footer-btn next" onClick={() => setGameState({ tutorialActive: false })}>✕ 閉じる</button>
                )}
            </div>
        </div>
    );
};