import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { ClayButton } from '../common/ClayButton';
import { useUserStore } from '../../store/useUserStore';
import { savePlayerName, syncGachaData } from '../../utils/userLogic';
import { sendGlobalMail } from '../../utils/adminLogic';
import { linkGoogleAccount } from '../../utils/authLogic'; // ▼ 追加

// ▼ 追加：お詫びメール・お知らせのテンプレート定義
const TEMPLATES = {
    A: { 
        name: "【A】重大なバグ・進行不能",
        title: "【重要】不具合のお詫びとアイテム補填について", 
        body: "いつも『ホームレスサバイバルシティ』をプレイしていただきありがとうございます。運営チームです。\n\n下記の期間において、ゲームの進行やスコアに重大な影響を与える不具合が発生しておりました。\n\n【修正内容】\n{{DETAIL}}\n\n本件の対象期間中にプレイされていた皆様には、多大なるご迷惑をおかけしましたことを深くお詫び申し上げます。\nお詫びとして、ささやかではございますが本メールにアイテムを添付いたしました。お受け取りいただけますと幸いです。\n\n引き続き、本作をよろしくお願いいたします。" 
    },
    B: { 
        name: "【B】軽微なバグ・表示修正",
        title: "不具合修正のお知らせとプレゼント", 
        body: "いつもプレイしていただきありがとうございます！\n本日のアップデートにて、以下の不具合を修正いたしました。\n\n【修正内容】\n{{DETAIL}}\n\nご不便をおかけしたお詫びとして、アイテムをお送りいたします。\n今後とも『ホームレスサバイバルシティ』をお楽しみください！" 
    },
    C: { 
        name: "【C】サーバー障害・メンテ",
        title: "サーバー障害（緊急メンテナンス）のお詫び", 
        body: "いつも本作をお楽しみいただきありがとうございます。\n\n先ほど、ネットワーク接続が不安定になる問題が発生したため、緊急の修正対応を実施いたしました。\n\n【対応内容】\n{{DETAIL}}\n\nプレイ中に通信が切断されてしまった皆様へ、心よりお詫び申し上げます。\nお詫びの品を添付いたしましたので、次回プレイ時にお役立てください。" 
    },
    D: { 
        name: "【D】アップデート・新機能追加",
        title: "アップデートのお知らせとプレゼント", 
        body: "いつも『ホームレスサバイバルシティ』をプレイしていただきありがとうございます。運営チームです。\n\n本日のアップデートにて、以下の新機能を追加いたしました！\n\n【アップデート内容】\n{{DETAIL}}\n\n皆様により一層楽しんでいただけるよう、ささやかながら記念のアイテムをお送りいたします。\n引き続き、本作をよろしくお願いいたします。" 
    },
    E: { 
        name: "【E】新スキン追加のお知らせ",
        title: "【新スキン登場】ガチャ更新のお知らせ", 
        body: "いつもプレイしていただきありがとうございます！\n路上ガチャ屋台に新しいスキンが追加されました。\n\n【追加スキン詳細】\n{{DETAIL}}\n\n新スキンの登場を記念して、ガチャに使えるアイテムをプレゼントいたします。\nぜひ新しいスキンをゲットして、ゲームをお楽しみください！" 
    }
};

export const SettingsAndRules = () => {
    const { settingsActive, rulesActive, setGameState, resetGame } = useGameStore();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const { 
        playerName, wins, totalEarnedP, showSmoke, setShowSmoke,
        totalTilesMoved, totalCardsUsed, totalCansCollected, totalTrashCollected, totalPSpentAtShop, npcEncounters,
        liteMode, volume, layoutMode, showSkipButton, autoScrollToPlayer, showTileLabels, setUserData, // ▼ showTileLabelsを追加
        addGachaAssets
    } = useUserStore();
    
    const [activeTab, setActiveTab] = useState('player');
    const [editingName, setEditingName] = useState(playerName);

    // ▼ 開発者用ステート（テンプレート対応）
    const [devCode, setDevCode] = useState("");
    const [templateType, setTemplateType] = useState("A"); // テンプレート種類
    const [mailDetail, setMailDetail] = useState("");      // 修正内容（詳細）
    const [mailP, setMailP] = useState("");
    const [mailCans, setMailCans] = useState("");
    const [isSendingMail, setIsSendingMail] = useState(false);

    useEffect(() => {
        if (playerName) {
            setEditingName(playerName);
        }
    }, [playerName]);

    if (!settingsActive && !rulesActive && !confirmOpen) return null;

    const handleReturnTitle = () => {
        resetGame();
        setConfirmOpen(false);
    };

    const handleNameUpdate = () => {
        if (editingName && editingName.trim() !== '' && editingName !== playerName) {
            savePlayerName(editingName);
        }
    };

    // ▼ 開発者用ロジック（テンプレート対応）
    const isDevAuthenticated = devCode === "DEV_MAIL_2026";

    const handleSendGlobalMail = async () => {
        if (!mailDetail) return alert("詳細（修正内容）を入力してください");
        setIsSendingMail(true);
        
        const selectedTpl = TEMPLATES[templateType];
        const finalBodyText = selectedTpl.body.replace('{{DETAIL}}', mailDetail);

        const result = await sendGlobalMail(devCode, { 
            title: selectedTpl.title, text: finalBodyText, p: mailP, cans: mailCans 
        });
        
        setIsSendingMail(false);
        if (result.success) {
            alert(result.message);
            setMailDetail(""); setMailP(""); setMailCans(""); 
        } else {
            alert(result.message);
        }
    };

    if (rulesActive) {
        return (
            <div className="modal-overlay" style={{ display: 'flex', zIndex: 25000 }} onClick={() => setGameState({ rulesActive: false })}>
                <div className="modal-box" style={{ maxWidth: '660px', width: '95%', background: '#fdf5e6', color: '#3e2723' }} onClick={(e) => e.stopPropagation()}>
                    <h2 style={{ marginTop: 0, textAlign: 'center', color: '#c0392b' }}>📖 遊び方・ルール</h2>
                    
                    <div style={{ textAlign: 'left', padding: '10px', maxHeight: '70vh', overflowY: 'auto', border: '2px solid #8d6e63', borderRadius: '8px', background: '#fff' }}>
                        
                        <div style={{ background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#c0392b', borderBottom: '2px dashed #e07a5f', paddingBottom: '4px' }}>🏆 ゲームの目的</h3>
                            <p style={{ fontSize: '14px', lineHeight: '1.5', margin: '5px 0', color: '#333' }}>
                                指定のラウンド数終了時に、最も多くの<b>総合スコア</b>を獲得したプレイヤーが優勝！<br/>
                                スコア ＝ <b>所持P × 2</b> ＋ 陣地の価値(※) ＋ 資源価値 ＋ (キル数×3) − (デス数×5)<br/>
                                <span style={{ fontSize: '12px', color: '#e74c3c' }}>※ゲーム終了時の陣地の価値：スラム 3 / 商業 6 / 高級 10</span>
                            </p>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#c0392b', borderBottom: '2px dashed #e07a5f', paddingBottom: '4px' }}>🎮 ターンの流れ</h3>
                            <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.5', color: '#333' }}>
                                <li><b>① サイコロ:</b> 出た目の合計分 <b>AP(行動力)</b> を獲得。ゾロ目は2倍！</li>
                                <li><b>② 移動 & アクション:</b> APを消費して移動・缶拾い・バイトなど好きに行動。</li>
                                <li><b>③ カード使用:</b> 手札のカードを <b>2AP</b> で使用可能（自分のターン中なら何枚でも）。</li>
                                <li><b>④ ターン終了:</b> APが切れたら「ターン終了」ボタンを押す。APは翌ターンに持ち越せません。</li>
                            </ul>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#c0392b', borderBottom: '2px dashed #e07a5f', paddingBottom: '4px' }}>📊 ステータス</h3>
                            <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.5', color: '#333' }}>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>⚡</span><b>AP:</b> 行動力。移動・アクション・カード使用に消費。ターン終了で0になる。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>❤️</span><b>HP:</b> 体力。0になると病院送り → 所持Pから最大15P没収、装備1つランダム喪失、缶・ゴミをその場にドロップ。復活後HP100で再開。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>💰</span><b>P:</b> お金。陣地化・カード購入などに使用。スコアの最大比重。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🚩</span><b>陣地:</b> 占領したマスから毎ターンのダイスロール時に収入（スラム1P/商業2P/高級3P）。3ラウンドに1回、維持費が徴収される（スラム0P/商業1P/高級2P）。</li>
                            </ul>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #c0392b' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#c0392b', borderBottom: '2px dashed #e07a5f', paddingBottom: '4px' }}>⚔️ 戦闘とPのドロップ</h3>
                            <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '14px', lineHeight: '1.5', color: '#333' }}>
                                <li>武器カードやスキルでダメージを受けると、<b>ダメージの1/5にあたるPをその場に落とします。</b></li>
                                <li>落としたPは攻撃者が奪いますが、遠距離攻撃などの場合は周囲2マスにいる他プレイヤーが「ハイエナ（横取り）」できます。</li>
                                <li>死亡時（HP0）は、所持している「空き缶」と「ゴミ」をすべてそのマスに落とします。落としたアイテムは後からそのマスを通った人が拾えます。</li>
                            </ul>
                        </div>

                        <div style={{ background: '#f0fff4', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #2ecc71' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#27ae60', borderBottom: '2px dashed #e07a5f', paddingBottom: '4px' }}>🎭 キャラクター一覧（全9種）</h3>
                            <p style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>各キャラは <b>パッシブ（自動発動）</b> と <b>アクションスキル（AP消費）</b> を1つずつ持ちます。<br/>キャラアイコンをクリックすると詳細を確認できます。</p>
                            <ul style={{ fontSize: '13px', lineHeight: '1.7', paddingLeft: '20px', margin: '5px 0', color: '#333' }}>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🏃</span><b>元アスリート —【健脚】</b>移動常に1AP・雨無効 ／ <b>【疾風ダッシュ】</b>3AP: ピッタリ3マス先へ跳躍（候補マスが白く光ります）</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>💼</span><b>元営業マン —【コミュ力】</b>バイト成功率80%・ショップ<b>2P割引</b> ／ <b>【訪問販売】</b>2AP: 手札を1枚選んで相手に強制購入させ3P徴収</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🌿</span><b>サバイバー —【危機察知】</b>ゴミ漁り失敗のパトカーペナ無効 ／ <b>【野宿】</b>2AP: その場でHP+15回復</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>👊</span><b>元ヤン —【威圧】</b>同マス/すれ違いで自動1Pカツアゲ（1ターン2P上限）／ <b>【殴る】</b>2AP: 同マス相手に10ダメージ</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>💻</span><b>元ハッカー —【クラウドストレージ】</b>手札上限+2（デフォルト9枚）／ <b>【遠隔ハッキング】</b>3AP: どこからでもショップ在庫を強制入替え＆1枚購入</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🎸</span><b>ストリートミュージシャン —【カリスマ】</b>他者が同マスor隣接に来るたび+3P ＆ 自身のいるマスは陣地コスト-2P・攻撃無効 ／ <b>【アンコール】</b>3AP: 周囲2マス以内の全員を強制引き寄せ＆人数×2P獲得＆相手の次移動AP+1</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🩺</span><b>闇医者 —【再生能力】</b>ターン開始時に自動HP+8（HP50以下なら+16） ／ <b>【毒入り治療】</b>2AP: 同マスの相手HP+30の代わりに5P強制徴収＆3ターン毒状態（毎ターン8ダメ）にする</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🎲</span><b>ギャンブラー —【アドレナリン】</b>ゾロ目でAP倍＋HP+10回復。<b>さらに25%の確率で3つ目のサイコロが追加！</b> ／ <b>【ドロー勝負】</b>3AP: 山札からカードを1枚引く（1ターン最大3回まで）</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🕵️</span><b>元探偵 —【張り込み】</b>自陣地に相手が完全に止まると<b>50%の確率で</b>手札1枚没収 ／ <b>【情報操作/罠の設置】</b>3AP: 好きなNPCを強制移動(CD:3R) ／ 2AP: 自分にしか見えない罠(警察/落とし穴/情報撹乱)を設置</li>
                            </ul>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#c0392b', borderBottom: '2px dashed #e07a5f', paddingBottom: '4px' }}>🗺️ マスの種類と効果</h3>
                            <ul style={{ fontSize: '13px', lineHeight: '1.6', paddingLeft: '20px', margin: '5px 0', color: '#333' }}>
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🏥</span><b>病院(開始地点):</b> 通過・停止すると<b>無料でHPが最大30回復</b>する。HP0で搬送されると、最大15P没収・装備1つ喪失・所持資源をその場に全ドロップする。</li>
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🛣️</span><b>通常の道:</b> 特別な効果なし。</li>
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🥫</span><b>空き缶:</b> 1APで缶を拾う（1ターン3回まで）。雨の日は雨具が必要。</li>
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🗑️</span><b>ゴミ山:</b> 2APでゴミを漁る。約16%の確率で失敗し<b>パトカー</b>に見つかり次回AP-2ペナルティ。<b>夜に漁ると発見量にボーナス</b>がつく。</li>
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>💱</span><b>買取所:</b> 缶・ゴミを現在の相場でP換金（0AP）。相場はラウンドごとに変動。</li>
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>💼</span><b>バイト:</b> 3APで挑戦。成功率60%（営業マンは80%）で12P獲得。</li>
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🛒</span><b>ショップ:</b> カード購入（毎ターン在庫が刷新）や手札の売却（2P）ができる。</li>
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🎲</span><b>イベント:</b> ミニゲームかストーリーイベントが発生。カード獲得のチャンス。</li>
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🏕️</span><b>避難所:</b> 止まると「ステルス」状態になり、次の敵を1回やり過ごせる。</li>
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🕳️</span><b>マンホール:</b> 1APで別のマンホールへランダムワープ。</li>
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🚓</span><b>交番:</b> 職務質問で足止め、そのターンは移動不可。</li>
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🎯</span><b>目的地(的):</b> 到達するとボーナスP（ラウンド×2+5P）獲得。的は別の場所へ移動。</li>
                                <hr style={{ border: 0, borderTop: '1px dashed #ccc', margin: '8px 0' }} />
                                <li><span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🚩</span><b>陣地と維持費:</b> 陣地にすると毎ターンダイス時に収入（スラム1P/商業2P/高級3P）。3ラウンドに1回、維持費（スラム0P/商業1P/高級2P）が引き落とされる。<b>払えないと所持Pが0になり、最も価値の高い陣地を没収される。</b><br/>※空き地を陣地にするのは3P、<b>他人の陣地を上書きして奪う場合は6P</b>必要です。</li>
                            </ul>
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #e74c3c' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#e74c3c', borderBottom: '2px dashed #e07a5f', paddingBottom: '4px' }}>⚠️ NPC（敵）と危険なイベント</h3>
                            <p style={{ fontSize: '12px', color: '#555', marginBottom: '8px' }}>「身代わり人形」を装備していると1回だけ無効化可能。探偵の【情報操作】でNPCを移動させることもできます。</p>
                            
                            <div style={{ background: '#fce4ec', borderLeft: '4px solid #e91e63', padding: '10px', borderRadius: '0 8px 8px 0', marginBottom: '10px' }}>
                                <p style={{ margin: 0, fontSize: '12px', color: '#880e4f', fontWeight: 'bold' }}>【NPCの行動ルール】</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#333' }}>各NPC（収集車以外）は、毎ラウンド<b>隣接するマスへ1歩ずつ移動</b>します。また、プレイヤーに効果を発動したNPCは<b>1ラウンドの間マップから消滅</b>し、その後ランダムな場所に再出現します。</p>
                            </div>

                            <ul style={{ fontSize: '13px', paddingLeft: '20px', margin: '5px 0', color: '#333' }}>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🚓</span><b>パトカー:</b> 遭遇すると補導され<b>「次回AP-2」</b>（ターンは継続）。偶数ラウンド終了時には広範囲をパトロール巡回します。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>😎</span><b>ヤクザ:</b> 遭遇すると<b>15〜20のランダムダメージ</b>＋手札1枚ランダム強奪。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>💀</span><b>闇金:</b> 遭遇すると<b>所持Pの20%（最大20P）</b>を強制没収。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🧓</span><b>厄介なおじさん:</b> 絡まれると<b>手札をランダムに1枚破棄</b>（ターンは継続）。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🐀</span><b>野良動物:</b> 同マスにいる間、缶拾い・ゴミ漁りが不可能になる。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🤝</span><b>仲間のホームレス:</b> 出会うと空き缶を1つもらえる有益なNPC。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🛻</span><b>ごみ収集車（毎ラウンド末）:</b> マップを暴走。轢かれると<b>50の大ダメージ</b>（55%の確率で命中）。次のラウンド開始前に「予兆」として危険エリアが予告される。</li>
                            </ul>
                        </div>

                        <div style={{ background: '#fffaf0', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #8e44ad' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#8e44ad', borderBottom: '2px dashed #e07a5f', paddingBottom: '4px' }}>🃏 全カード一覧と効果</h3>
                            <p style={{ fontSize: '12px', color: '#555', marginBottom: '10px' }}>カードはターン中に <b>2AP</b> で使用可能。手札上限は <b>7枚</b>（リュック+2、ハッカー+2）。ショップで購入またはイベントマスで獲得できます。</p>

                            <h4 style={{ margin: '8px 0 4px 0', fontSize: '14px', color: '#2ecc71', borderBottom: '1px solid #ccc' }}>【バフ・収入系】</h4>
                            <ul style={{ fontSize: '12px', marginTop: 0, paddingLeft: '20px', color: '#333' }}>
                                <li><b>支援面談:</b> +5P ＆ 次回ターンAP+2</li>
                                <li><b>炊き出し:</b> +3P確定</li>
                                <li><b>野良猫の導き:</b> +2P確定</li>
                                <li><b>今日の運勢:</b> 50%で+3P / -3P（ギャンブル）</li>
                                <li><b>密かなバイト:</b> 50%で+6P / -3P（高リスク）</li>
                                <li><b>宝くじ当選:</b> 10%で+15Pの大当たり</li>
                                <li><b>エナジードリンク:</b> 即座にAP+5</li>
                                <li><b>スケボー:</b> 次回ダイスロールの結果にAP+5ボーナス</li>
                            </ul>

                            <h4 style={{ margin: '12px 0 4px 0', fontSize: '14px', color: '#3498db', borderBottom: '1px solid #ccc' }}>【装備品（期間限定 or 使い切り）】</h4>
                            <ul style={{ fontSize: '12px', marginTop: 0, paddingLeft: '20px', color: '#333' }}>
                                <li>🚲 <b>ボロボロの自転車:</b> 毎ターン獲得AP+2（<em>5ターン限定</em>）</li>
                                <li>👢 <b>安全靴:</b> ゴミ漁りのAPコストが1に（永続）</li>
                                <li>🛒 <b>大きなリヤカー:</b> 陣地収入が2倍に（<em>5ターン限定</em>）</li>
                                <li>🎒 <b>リュック:</b> 手札上限+2（永続）</li>
                                <li>☂️ <b>雨具ゲット:</b> 雨の日のペナルティを<em>1回だけ</em>無効化（1回消費）</li>
                                <li>🛡️ <b>段ボールの盾:</b> 次のダメージを<em>50%の確率で半減</em>（1回で消費）</li>
                                <li>🪖 <b>ヘルメット:</b> 次のダメージを<em>半減</em>（1回で消費）</li>
                                <li>🎎 <b>身代わり人形:</b> NPC・収集車などの妨害を1回無効（1回で消費）</li>
                            </ul>

                            <h4 style={{ margin: '12px 0 4px 0', fontSize: '14px', color: '#27ae60', borderBottom: '1px solid #ccc' }}>【回復系】<span style={{ fontSize: '11px', color: '#2ecc71' }}> ※すべて0AP</span></h4>
                            <ul style={{ fontSize: '12px', marginTop: 0, paddingLeft: '20px', color: '#333' }}>
                                <li><b>腐ったバーガー:</b> HP+20回復（50%で食中毒10ダメージのリスクあり）</li>
                                <li><b>落ちてたポテト:</b> HP+15確定回復</li>
                                <li><b>拾ったホットドッグ:</b> HP+30回復（50%で食中毒25ダメージのリスクあり）</li>
                                <li><b>謎のエネルギーバー:</b> HP+10 ＆ AP+3</li>
                                <li><b>水道水:</b> HP+5確定回復</li>
                            </ul>

                            <h4 style={{ margin: '12px 0 4px 0', fontSize: '14px', color: '#e74c3c', borderBottom: '1px solid #ccc' }}>【攻撃・妨害系】</h4>
                            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 4px 0' }}>※ 武器カードは使用に2AP必要。その他のカード（バフ・回復・装備・リアクション等）はAP消費なしで使用可能。</p>
                            <ul style={{ fontSize: '12px', marginTop: 0, paddingLeft: '20px', color: '#333' }}>
                                <li><b>ステルス行動:</b> 次に遭遇する敵・NPCを回避 <span style={{ color: '#2ecc71' }}>[0AP]</span></li>
                                <li><b>身分証明書:</b> +1P ＆ 次のパトカーを回避 <span style={{ color: '#2ecc71' }}>[0AP]</span></li>
                                <li><b>通報:</b> 他のプレイヤー1人に次回AP-2 <span style={{ color: '#2ecc71' }}>[0AP]</span></li>
                                <li><b>缶泥棒:</b> 他人から最大2Pを奪う <span style={{ color: '#2ecc71' }}>[0AP]</span></li>
                                <li><b>領土挑戦状:</b> サイコロ4以上で他人の陣地を<em>選んで</em>乗っ取る <span style={{ color: '#2ecc71' }}>[0AP]</span></li>
                                <li><b>レンガ(射程2):</b> 10ダメージ <span style={{ color: '#e74c3c' }}>[2AP]</span></li>
                                <li><b>バット(射程1):</b> 20ダメージ <span style={{ color: '#e74c3c' }}>[2AP]</span></li>
                                <li><b>釘バット(射程1):</b> 30ダメージ <span style={{ color: '#e74c3c' }}>[2AP]</span></li>
                                <li><b>拳銃(射程3):</b> 40ダメージ <span style={{ color: '#e74c3c' }}>[2AP]</span></li>
                                <li><b>ショットガン(射程2・広域):</b> 射程内の全員に50ダメージ <span style={{ color: '#e74c3c' }}>[2AP]</span></li>
                                <li><b>パンチングマシン(同マスのみ):</b> 80ダメージ <span style={{ color: '#e74c3c' }}>[2AP]</span></li>
                                <li><b>レーザー銃(射程5・広域):</b> 射程内の全員に100ダメージ <span style={{ color: '#e74c3c' }}>[2AP]</span></li>
                            </ul>

                            <h4 style={{ margin: '12px 0 4px 0', fontSize: '14px', color: '#8e44ad', borderBottom: '1px solid #ccc' }}>【強力な全体効果（逆転用）】</h4>
                            <ul style={{ fontSize: '12px', marginTop: 0, paddingLeft: '20px', color: '#333' }}>
                                <li><b>大暴落:</b> 自分以外全員の所持Pが半分になる（チームメイトは効果を受けない） <span style={{ color: '#2ecc71' }}>[0AP]</span></li>
                                <li><b>下剋上:</b> 1位プレイヤーと自分の所持Pをそっくり入れ替える <span style={{ color: '#2ecc71' }}>[0AP]</span></li>
                            </ul>

                            <h4 style={{ margin: '12px 0 4px 0', fontSize: '14px', color: '#16a085', borderBottom: '1px solid #ccc' }}>【リアクション系（相手の効果を無効・反射）】</h4>
                            <ul style={{ fontSize: '12px', marginTop: 0, paddingLeft: '20px', color: '#333' }}>
                                <li><b>弁護士の盾:</b> 次に受ける攻撃・カツアゲを完全無効化（1回） <span style={{ color: '#2ecc71' }}>[0AP]</span></li>
                                <li><b>裏取引:</b> 次の「下剋上」「大暴落」を使った相手に反射（1回） <span style={{ color: '#2ecc71' }}>[0AP]</span></li>
                                <li><b>反撃の一撃:</b> 次にダメージを受けた時、同量を相手に返す（1回） <span style={{ color: '#2ecc71' }}>[0AP]</span></li>
                            </ul>
                        </div>

                        <div style={{ background: '#f0f8ff', padding: '12px', borderRadius: '8px', marginBottom: '12px', border: '1px solid #3498db' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#2980b9', borderBottom: '2px dashed #e07a5f', paddingBottom: '4px' }}>🌤️ 天候・昼夜・特殊イベント</h3>
                            <ul style={{ fontSize: '13px', paddingLeft: '20px', margin: '5px 0', color: '#333' }}>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🌧️</span><b>雨:</b> 移動コスト2AP・缶拾い/ゴミ漁り不可（雨具・元アスリートで無効）。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🌙</span><b>夜:</b> 視界が自分の前後3マスに制限される。ゴミ漁りにボーナスあり。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🚧</span><b>道路工事:</b> 一定確率で発生。そのマスは2ラウンド通行不可になる。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>📈</span><b>相場変動:</b> 缶とゴミの換金相場がラウンドごとにランダムに変わる。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🎯</span><b>目的地ボーナス:</b> 的のマスに止まるとボーナスP獲得。的は移動後に別の場所へ。</li>
                                <li><span style={{ fontSize: '16px', marginRight: '4px' }}>🛻</span><b>収集車の予兆:</b> 次ラウンド開始前に「どのエリアが危険か」が告知される。</li>
                            </ul>
                        </div>

                    </div>
                    <ClayButton onClick={() => setGameState({ rulesActive: false })} style={{ width: '100%', marginTop: '10px', background: '#95a5a6' }}>✖ 閉じる</ClayButton>
                </div>
            </div>
        );
    }

    if (confirmOpen) {
        return (
            <div className="modal-overlay" style={{ display: 'flex', zIndex: 30000 }}>
                <div className="modal-box" style={{ background: '#fdf5e6', color: '#3e2723' }}>
                    <h3 style={{ marginTop: 0, color: '#e74c3c' }}>⚠️ 確認</h3>
                    <p style={{ fontWeight: 'bold' }}>現在のゲームは破棄されます。<br/>タイトルに戻りますか？</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <ClayButton onClick={handleReturnTitle} style={{ flex: 1, background: '#e74c3c' }}>はい</ClayButton>
                        <ClayButton onClick={() => setConfirmOpen(false)} style={{ flex: 1, background: '#95a5a6' }}>いいえ</ClayButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay" style={{ display: 'flex', zIndex: 30000 }} onClick={() => setGameState({ settingsActive: false })}>
            <div className="modal-box" style={{ background: '#fdf5e6', color: '#3e2723', padding: '15px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', borderBottom: '2px solid #8d6e63', paddingBottom: '10px' }}>
                    <ClayButton 
                        onClick={() => setActiveTab('player')} 
                        style={{ flex: 1, padding: '10px', background: activeTab === 'player' ? '#8d6e63' : '#d7ccc8', opacity: activeTab === 'player' ? 1 : 0.7 }}
                    >
                        👤 プレイヤー
                    </ClayButton>
                    <ClayButton 
                        onClick={() => setActiveTab('settings')} 
                        style={{ flex: 1, padding: '10px', background: activeTab === 'settings' ? '#8d6e63' : '#d7ccc8', opacity: activeTab === 'settings' ? 1 : 0.7 }}
                    >
                        ⚙️ 設定
                    </ClayButton>
                </div>

                {activeTab === 'player' && (
                    <div style={{ textAlign: 'center', background: '#5c4a44', color: '#fdf5e6', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                        <h3 style={{ marginTop: 0, color: '#fdf5e6', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '10px' }}>プレイヤープロフィール</h3>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '14px', color: '#bdc3c7', marginBottom: '5px' }}>プレイヤー名</div>
                            <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onBlur={handleNameUpdate}
                                maxLength={10}
                                style={{ fontSize: '20px', fontWeight: 'bold', padding: '10px', textAlign: 'center', width: '80%', borderRadius: '6px', border: 'none' }}
                            />
                            <div style={{ fontSize: '11px', color: '#95a5a6', marginTop: '5px' }}>変更後、枠外をタップで保存</div>
                        </div>

                       <div style={{ display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px' }}>
                            <div>
                                <div style={{ fontSize: '13px', color: '#bdc3c7' }}>🏆 優勝回数</div>
                                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#f1c40f' }}>{wins} <span style={{fontSize: '14px', color: '#fdf5e6'}}>回</span></div>
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', color: '#bdc3c7' }}>💰 累計稼いだP</div>
                                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#f1c40f' }}>{totalEarnedP} <span style={{fontSize: '14px', color: '#fdf5e6'}}>P</span></div>
                            </div>
                        </div>

                        {/* ▼ 追加: Googleアカウント連携セクション */}
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', marginTop: '15px', textAlign: 'center' }}>
                            <div style={{ fontSize: '13px', color: '#bdc3c7', marginBottom: '8px' }}>🔐 データの保護・引き継ぎ</div>
                            {useUserStore.getState().isLinked ? (
                                <div style={{ background: 'rgba(46, 204, 113, 0.2)', border: '1px solid #2ecc71', color: '#2ecc71', padding: '10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                                    ✅ Googleアカウント連携済み<br/>
                                    <span style={{ fontSize: '11px', color: '#bdc3c7', fontWeight: 'normal' }}>{useUserStore.getState().linkedEmail}</span>
                                </div>
                            ) : (
                                <div>
                                    <p style={{ fontSize: '11px', color: '#e74c3c', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                                        現在ゲストプレイ中です。ブラウザの履歴を消去するとデータが失われます。<br/>連携してデータを保護してください。（トレード機能の利用にも必須です）
                                    </p>
                                    <ClayButton 
                                        onClick={async () => {
                                            const res = await linkGoogleAccount();
                                            alert(res.message);
                                        }} 
                                        style={{ background: '#4285F4', color: '#fff', width: '100%', padding: '12px' }}
                                    >
                                        <span style={{ background: '#fff', borderRadius: '50%', padding: '2px 6px', marginRight: '8px', color: '#4285F4' }}>G</span>
                                        Googleアカウントと連携する
                                    </ClayButton>
                                </div>
                            )}
                        </div>

                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px', marginTop: '15px' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#bdc3c7', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '5px' }}>📊 累計スタッツ</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', textAlign: 'left' }}>
                                <div>🚶 移動マス: <span style={{color:'#f1c40f', fontWeight:'bold'}}>{totalTilesMoved}</span></div>
                                <div>🎴 使用カード: <span style={{color:'#f1c40f', fontWeight:'bold'}}>{totalCardsUsed}</span></div>
                                <div>🥫 集めた缶: <span style={{color:'#f1c40f', fontWeight:'bold'}}>{totalCansCollected}</span></div>
                                <div>🗑️ 漁ったゴミ: <span style={{color:'#f1c40f', fontWeight:'bold'}}>{totalTrashCollected}</span></div>
                                <div>🛒 Shop消費P: <span style={{color:'#f1c40f', fontWeight:'bold'}}>{totalPSpentAtShop}</span></div>
                            </div>
                            
                            <h4 style={{ margin: '15px 0 10px 0', color: '#bdc3c7', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '5px' }}>⚠️ NPC遭遇回数</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', textAlign: 'left' }}>
                                <div>🚓 パトカー: <span style={{color:'#f1c40f', fontWeight:'bold'}}>{npcEncounters?.police || 0}</span></div>
                                <div>😎 ヤクザ: <span style={{color:'#f1c40f', fontWeight:'bold'}}>{npcEncounters?.yakuza || 0}</span></div>
                                <div>💀 闇金: <span style={{color:'#f1c40f', fontWeight:'bold'}}>{npcEncounters?.loanshark || 0}</span></div>
                                <div>🧓 おじさん: <span style={{color:'#f1c40f', fontWeight:'bold'}}>{npcEncounters?.uncle || 0}</span></div>
                                <div>🤝 仲間: <span style={{color:'#f1c40f', fontWeight:'bold'}}>{npcEncounters?.friend || 0}</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <>
                        <div style={{ marginBottom: '20px', textAlign: 'left', background: '#5c4a44', color: '#fdf5e6', padding: '10px', borderRadius: '8px', border: '2px solid #e74c3c' }}>
                            <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input type="checkbox" checked={liteMode} onChange={(e) => setUserData({ liteMode: e.target.checked })} style={{ marginRight: '10px', width: '18px', height: '18px' }} />
                                🍃 軽量モード（発熱・バッテリー消費を抑える）
                            </label>
                            <div style={{ fontSize: '11px', color: '#bdc3c7', marginTop: '6px', marginLeft: '28px', lineHeight: 1.4 }}>
                                ONにすると、影や発光エフェクト、一部のアニメーションを無効化し、スマホやPCの動作を軽くします。
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px', textAlign: 'left', background: '#5c4a44', color: '#fdf5e6', padding: '10px', borderRadius: '8px' }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>🔊 音量: {Math.round(volume * 100)}%</label>
                            <input type="range" min="0" max="2" step="0.1" value={volume} onChange={(e) => setUserData({ volume: parseFloat(e.target.value) })} style={{ width: '100%' }} />
                        </div>
                        
                        <div style={{ marginBottom: '20px', textAlign: 'left', background: '#5c4a44', color: '#fdf5e6', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📱 レイアウト切替</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <ClayButton onClick={() => setUserData({ layoutMode: 'auto' })} style={{ flex: 1, padding: '7px', fontSize: '12px', background: '#2ecc71', opacity: layoutMode === 'auto' ? 1 : 0.5 }}>🔄 自動</ClayButton>
                                <ClayButton onClick={() => setUserData({ layoutMode: 'pc' })} style={{ flex: 1, padding: '7px', fontSize: '12px', background: '#3498db', opacity: layoutMode === 'pc' ? 1 : 0.5 }}>🖥️ PC</ClayButton>
                                <ClayButton onClick={() => setUserData({ layoutMode: 'sp' })} style={{ flex: 1, padding: '7px', fontSize: '12px', background: '#8e44ad', opacity: layoutMode === 'sp' ? 1 : 0.5 }}>📱 スマホ</ClayButton>
                            </div>
                            <div style={{ fontSize: '11px', color: '#bdc3c7', marginTop: '6px', textAlign: 'center' }}>
                                現在: {layoutMode === 'auto' ? '自動（画面幅で切替）' : layoutMode === 'pc' ? 'PCレイアウト固定' : 'スマホレイアウト固定'}
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px', textAlign: 'left', background: '#5c4a44', color: '#fdf5e6', padding: '10px', borderRadius: '8px' }}>
                            <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input type="checkbox" checked={showSkipButton} onChange={(e) => setUserData({ showSkipButton: e.target.checked })} style={{ marginRight: '10px', width: '18px', height: '18px' }} />
                                ⏭️ 強制スキップボタンを表示する（誤タップ注意）
                            </label>
                        </div>

                        <div style={{ marginBottom: '20px', textAlign: 'left', background: '#5c4a44', color: '#fdf5e6', padding: '10px', borderRadius: '8px' }}>
                            <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input type="checkbox" checked={autoScrollToPlayer} onChange={(e) => setUserData({ autoScrollToPlayer: e.target.checked })} style={{ marginRight: '10px', width: '18px', height: '18px' }} />
                                🗺️ ターン開始時にマップを自動スクロール
                            </label>
                            <div style={{ fontSize: '11px', color: '#bdc3c7', marginTop: '4px', marginLeft: '28px' }}>
                                ONにすると、各プレイヤーのターン開始時にマップがそのプレイヤーの位置へ自動で移動します
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px', textAlign: 'left', background: '#5c4a44', color: '#fdf5e6', padding: '10px', borderRadius: '8px' }}>
                            <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input type="checkbox" checked={showSmoke} onChange={(e) => setShowSmoke(e.target.checked)} style={{ marginRight: '10px', width: '18px', height: '18px' }} />
                                💨 煙（土埃）エフェクトを表示する
                            </label>
                            <div style={{ fontSize: '11px', color: '#bdc3c7', marginTop: '4px', marginLeft: '28px' }}>
                                ONにするとプレイヤー移動時に煙が出ます。動作が重い場合はOFFにしてください。
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px', textAlign: 'left', background: '#5c4a44', color: '#fdf5e6', padding: '10px', borderRadius: '8px' }}>
                            <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input type="checkbox" checked={showTileLabels} onChange={(e) => setUserData({ showTileLabels: e.target.checked })} style={{ marginRight: '10px', width: '18px', height: '18px' }} />
                                🔢 マス目に番号と分岐ラベルを表示する
                            </label>
                            <div style={{ fontSize: '11px', color: '#bdc3c7', marginTop: '4px', marginLeft: '28px' }}>
                                ONにすると、マップ上の各マスに番号と「分岐」の文字が表示され、ルートが分かりやすくなります。
                            </div>
                        </div>

                        {/* ▼ 開発者隠しメニュー（テンプレート送信対応） */}
                        <div style={{ marginBottom: '20px', textAlign: 'left', background: '#3e2723', color: '#fdf5e6', padding: '10px', borderRadius: '8px', border: '1px solid #5c4a44' }}>
                            <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '5px' }}>開発者オプション</div>
                            <input 
                                type="password" placeholder="コードを入力..." 
                                value={devCode} onChange={e => setDevCode(e.target.value)} 
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#000', border: '1px solid #8d6e63', color: '#FFF', fontSize: '12px' }} 
                            />
                            
                            {isDevAuthenticated && (
                                <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', border: '1px dashed #e74c3c' }}>
                                    <div style={{ fontSize: '12px', color: '#e74c3c', fontWeight: 'bold', marginBottom: '8px' }}>🔧 全体メール配布（テンプレート式）</div>
                                    <select 
                                        value={templateType} onChange={e => setTemplateType(e.target.value)}
                                        style={{ width: '100%', marginBottom: '5px', padding: '6px', fontSize: '12px', background: '#2f3640', color: 'white', border: '1px solid #718093' }}
                                    >
                                        {Object.entries(TEMPLATES).map(([key, tpl]) => (
                                            <option key={key} value={key}>{tpl.name}</option>
                                        ))}
                                    </select>
                                    <textarea 
                                        placeholder="詳細（修正内容や対応内容のみを記入）" 
                                        value={mailDetail} onChange={e => setMailDetail(e.target.value)} 
                                        style={{ width: '100%', marginBottom: '5px', padding: '6px', fontSize: '12px', minHeight: '50px', background: '#2f3640', color: 'white', border: '1px solid #718093' }} 
                                    />
                                    <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                                        <input type="number" placeholder="付与 P" value={mailP} onChange={e => setMailP(e.target.value)} style={{ flex: 1, padding: '6px', fontSize: '12px' }} />
                                        <input type="number" placeholder="付与 缶" value={mailCans} onChange={e => setMailCans(e.target.value)} style={{ flex: 1, padding: '6px', fontSize: '12px' }} />
                                    </div>
                                    <button onClick={handleSendGlobalMail} disabled={isSendingMail} style={{ width: '100%', background: '#c0392b', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                                        {isSendingMail ? "送信中..." : "🚀 メールを送信"}
                                    </button>
                                    
                                    <button onClick={async () => { 
                                        addGachaAssets(500, 500); 
                                        await syncGachaData(); 
                                        alert("個人用: 資産+500追加しました"); 
                                    }} style={{ width: '100%', marginTop: '15px', background: 'transparent', color: '#bdc3c7', border: '1px dashed #bdc3c7', padding: '6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                                        [デバッグ] 資産+500
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
                
                <ClayButton onClick={() => setGameState({ rulesActive: true, settingsActive: false })} style={{ width: '100%', marginBottom: '10px', background: '#3498db' }}>📖 遊び方・ルールを見る</ClayButton>
                <ClayButton onClick={() => setGameState({ tutorialActive: true, settingsActive: false })} style={{ width: '100%', marginBottom: '10px', background: '#8e44ad', color: '#f1c40f' }}>📚 チュートリアル</ClayButton>
                
                <ClayButton onClick={() => setConfirmOpen(true)} style={{ width: '100%', marginBottom: '15px', background: '#e74c3c' }}>🏠 タイトルに戻る</ClayButton>
                
                <ClayButton onClick={() => setGameState({ settingsActive: false })} style={{ width: '100%', background: '#95a5a6' }}>✖ 閉じる</ClayButton>
            </div>
        </div>
    );
};