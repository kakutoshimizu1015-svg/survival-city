import { useGameStore } from '../store/useGameStore';
import { genSmallMap } from '../constants/maps';

export const startTutorialSandbox = (scenarioId) => {
    useGameStore.setState({ sandboxActive: true, sandboxScenario: scenarioId, sandboxStep: 0, tutorialActive: false, gamePhase: 'playing' });
};

export const exitTutorialSandbox = () => {
    useGameStore.getState().resetGame();
    useGameStore.setState({ sandboxActive: false, tutorialActive: true, gamePhase: 'title' });
};

export const tutSandboxNextStep = () => {
    useGameStore.setState(state => ({ sandboxStep: state.sandboxStep + 1 }));
};

export const initSandboxGame = (opts = {}) => {
    const mapData = genSmallMap();
    const players = [
        { id: 0, name: 'あなた', isCPU: false, charType: opts.p1char || 'athlete', pos: opts.p1pos ?? 0, hp: opts.p1hp ?? 100, p: opts.p1p ?? 10, ap: opts.p1ap ?? 0, cans: opts.p1cans ?? 0, trash: opts.p1trash ?? 0, hand: opts.p1hand ? [...opts.p1hand] : [], maxHand: 7, equip: opts.p1equip ? {...opts.p1equip} : {}, deaths: opts.p1deaths ?? 0, kills: opts.p1kills ?? 0, teamColor: 'none', color: '#e74c3c' },
        { id: 1, name: 'CPU', isCPU: true, charType: opts.p2char || 'yankee', pos: opts.p2pos ?? 6, hp: opts.p2hp ?? 80, p: opts.p2p ?? 5, ap: 0, cans: 0, trash: 0, hand: [], maxHand: 7, equip: {}, deaths: opts.p2deaths ?? 0, kills: opts.p2kills ?? 0, teamColor: 'none', color: '#3498db' }
    ];

    useGameStore.setState({
        mapData, players, turn: 0, diceRolled: opts.diceRolled ?? false, canPickedThisTurn: 0,
        territories: opts.territories ? {...opts.territories} : {}, roundCount: opts.round || 1, maxRounds: opts.maxRounds || 5, destTile: 4,
        isNight: opts.night || false, isRainy: false, weatherState: opts.night ? 'night' : 'sunny',
        truckPos: opts.truckPos ?? 99, policePos: opts.policePos ?? 99, unclePos: opts.unclePos ?? 99, animalPos: opts.animalPos ?? 99, yakuzaPos: opts.yakuzaPos ?? 99, loansharkPos: opts.loansharkPos ?? 99, friendPos: opts.friendPos ?? 99,
        canPrice: opts.canPrice || 1, trashPrice: opts.trashPrice || 2, shopStockTurn: -1, shopCart: [], mgActive: false, isBranchPicking: false, gameOver: false
    });
};

export const getScenarioSteps = (id) => {
    const s = () => useGameStore.getState();
    switch(id) {
        case 0: return [
            { title:'🏆 スコア計算', icon:'📊', text:'ゲームが始まりました。<b>あなた</b>は10P持っていて、陣地も確保済みです。<br>画面左上の<b>ステータスパネル</b>を見てみましょう。', setup: () => initSandboxGame({ p1p:10, p1cans:3, p1trash:1, p1pos:2, territories:{3:0, 4:0}, maxRounds:5, round:5, p1kills:2, p1deaths:1, p2p:8, p2kills:1, p2deaths:0 }), highlight: '#left-status-area' },
            { title:'🏆 スコア計算', icon:'🧮', text:'あなたのスコアを計算してみましょう：<br><br>• <b>所持P × 2</b> = 10 × 2 = <em>20点</em><br>• <b>陣地の価値</b> = 商業2マス(3×2) = <em>6点</em><br>• <b>資源価値</b> = 缶3個 + ゴミ1個 = <em>5点</em><br>• <b>キル×3</b> = 2 × 3 = <em>+6点</em><br>• <b>デス×5</b> = 1 × 5 = <em>−5点</em><br>• <b>合計: 32点</b>', highlight: '#left-status-area' },
            { title:'🏆 スコア計算', icon:'💡', text:'<b>高スコアのコツ：</b><br>• Pを稼ぐのが最優先（2倍でスコアに反映）<br>• 陣地は毎ターン家賃収入も生むので一石二鳥<br>• むやみに死なない（デスは−5と重い）<br>• 缶やゴミは早めに換金してPに変換しよう' }
        ];
        case 1: return [
            { title:'🎮 ターンの流れ', icon:'🎲', text:'1ターンの流れを体験します。<br>まず<b>「サイコロを振る」</b>ボタンを押してAPを獲得しましょう！', setup: () => initSandboxGame({ p1pos:0, p1p:5, p1ap:0 }), highlight: '#btn-roll', waitMode: '👆 サイコロを振ってください', watchCondition: () => s().diceRolled === true },
            { title:'🎮 ターンの流れ', icon:'⚡', text:'APを獲得しました！<b>AP(行動力)</b>が画面に表示されています。<br>APを消費して<b>「移動」</b>ボタンを押してみましょう。<br>移動は通常<em>1AP</em>消費します。', highlight: '#btn-move', waitMode: '👆 移動してください', watchCondition: () => s().players[0].pos !== 0 },
            { title:'🎮 ターンの流れ', icon:'🚶', text:'移動できました！新しい2.5Dマップでは、コマが<b>放物線を描いてジャンプ</b>します。<br>APが残っている限り、<b>何度でも行動</b>できます。<br>もう一度移動するか、他のアクションを試してみてください。', nextLabel: '理解した ▶' },
            { title:'🎮 ターンの流れ', icon:'🛑', text:'やることが終わったら<b>「ターン終了」</b>ボタンを押します。<br><em>残ったAPは次のターンに持ち越せません！</em><br>使い切ってからターンを終えましょう。', highlight: '#btn-end' }
        ];
        case 2: return [
            { title:'📊 画面ガイド', icon:'🌤️', text:'まず左上の<b>環境パネル</b>です。<br>天候（晴/曇/雨）、現在のラウンド数、昼夜、そして<b>缶・ゴミの相場</b>がここに表示されます。', setup: () => initSandboxGame({ p1pos:2, p1p:15, p1cans:5, p1trash:2, p1ap:8, p1hand:[6,17,24], diceRolled:true, territories:{3:0}, p1kills:1 }), highlight: '#left-status-area' },
            { title:'📊 画面ガイド', icon:'🃏', text:'上部中央〜右に<b>手札カード</b>が並びます。<br>各カードの「使う」「捨てる」ボタンで操作します。<br>現在3枚持っていますね。', highlight: '#hand-cards-area' },
            { title:'📊 画面ガイド', icon:'🎮', text:'右側の<b>アクションパネル</b>です。<br>明るいボタン＝今使える、暗いボタン＝条件未達です。<br>マスの種類に応じて使えるアクションが変わります。', highlight: '#action-panel' },
            { title:'📊 画面ガイド', icon:'🗺️', text:'中央の<b>マップエリア</b>です。<br>背景を<b>ドラッグして視点移動（パン）</b>、ホイールやピンチで<b>ズーム操作</b>が可能です。<br>自由に動かして、疑似3Dの建物を観察してみてください！', highlight: '#board-area' }
        ];
        case 3: return [
            { title:'🗺️ マス体験', icon:'🏥', text:'あなたはHPが半分に減っています。<br>まずは<b>病院マス(id:0)</b>に移動しましょう。<br>病院マスに立ち寄ると、<b>HPが無料で最大30回復</b>します！', setup: () => initSandboxGame({ p1pos:1, p1hp: 50, p1ap:10, p1p:3, diceRolled:true }), highlight: '#btn-move', waitMode: '👆 病院マスへ移動してください', watchCondition: () => s().players[0].pos === 0 },
            { title:'🗺️ マス体験', icon:'✅', text:'HPが回復しました！<br>次は移動して<b>ゴミ山マス</b>(🗑️)を目指しましょう。<br>「移動」ボタンで進んでください。', nextLabel: '次へ ▶' },
            { title:'🗺️ マス体験', icon:'🗑️', text:'<b>ゴミ山マス</b>では2APを使って漁ることができます。<br>しかし、約16%の確率で失敗し、<b>警察に見つかって次回AP-2ペナルティ</b>を受けます。<br>夜は発見量にボーナスがつきます。試してみましょう。', waitMode: '👆 ゴミ山で「漁る」を実行', watchCondition: () => { const tile = s().mapData.find(t => t.id === s().players[0].pos); return tile && tile.type === 'trash' && s().players[0].trash > 0; }},
        ];
        case 4: return [
            { title:'🃏 カード体験', icon:'🃏', text:'手札に<b>3枚のカード</b>を持った状態でスタートです。<br>上部のカードエリアを確認してください。<br>カードの使用には<b>2AP</b>必要です。', setup: () => initSandboxGame({ p1pos:1, p1ap:12, p1p:10, p1hp:60, p1hand:[7, 15, 17], diceRolled:true, p2pos:3 }), highlight: '#hand-cards-area' },
            { title:'🃏 カード体験', icon:'🟢', text:'まず<b>「炊き出し」</b>カードを使ってみましょう。<br>カードの「使う」ボタンを押すと<b>+3P</b>が確定で入ります。<br>安定した収入カードです。', waitMode: '👆 炊き出しカードを使用', watchCondition: () => !s().players[0].hand.includes(7) },
            { title:'🃏 カード体験', icon:'⚡', text:'次は<b>「エナジードリンク」</b>です。<br>使うと即座に<b>AP+5</b>！行動量を増やせます。<br>サイコロの目が悪かった時の救済カードです。', waitMode: '👆 エナジードリンクを使用', watchCondition: () => !s().players[0].hand.includes(15) },
            { title:'🃏 カード体験', icon:'🔴', text:'最後は<b>「レンガ」</b>（武器カード・射程2）です。<br>ダメージを与えると、相手は<b>ダメージの1/5にあたるPをその場にドロップ</b>します！<br>CPUが射程2以内にいるので試してみてください。', waitMode: '👆 レンガカードを使用', watchCondition: () => !s().players[0].hand.includes(17) }
        ];
        case 5: return [
            { title:'👥 NPCとホラー体験', icon:'🗺️', text:'マップ上にNPCが配置されています。<br>移動してNPCがいるマスに入ると<b>自動でイベント</b>が発生します。<br>まずはマップを確認してみましょう。', setup: () => initSandboxGame({ p1pos:0, p1ap:10, p1p:8, p1hp:80, p1hand:[0], diceRolled:true, policePos:5, friendPos:4, p2pos:9 }), highlight: '#board-area' },
            { title:'👥 NPCとホラー体験', icon:'🤝', text:'マス4に<b>🤝 仲間NPC</b>がいます。<br>仲間のマスに止まると<b>空き缶が1つ</b>もらえるなど良い効果が得られます。<br>移動してマス4まで行ってみてください。', waitMode: '👆 仲間NPCのマスへ移動', watchCondition: () => s().players[0].pos === 4 },
            { title:'👥 NPCとホラー体験', icon:'🚓', text:'マス5に<b>🚓 警察</b>がいます。<br>止まると補導され<b>「次回AP-2 ＆ ターン強制終了」</b>という重いペナルティ！<br>「ステルス行動」等のカードで回避可能です。試しに近づいてみましょう。', waitMode: '👆 警察のマスへ移動', watchCondition: () => s().players[0].pos === 5 },
            { title:'👥 NPCとホラー体験', icon:'🛻', text:'毎ラウンド終了時には、一定確率で<b>ごみ収集車</b>が暴走します。<br>轢かれると<b>50の大ダメージ</b>を受けます！<br>事前に危険エリアが予告されるので、そのエリアから離れることが重要です。', nextLabel: '理解した ▶' }
        ];
        case 6: return [
            { title:'🎯 ミニゲーム', icon:'❓', text:'<b>イベントマスに止まる</b>とミニゲームが発生します。<br>勝つとカードが確定で手に入ります！<br>マップ上のイベントマス(紫色)まで移動してみましょう。', setup: () => initSandboxGame({ p1pos:3, p1ap:8, p1p:5, diceRolled:true, p2pos:9 }), nextLabel: 'イベントマスへ移動 ▶' },
            { title:'🎯 ミニゲーム', icon:'🎲', text:'イベントマス(id:4)に移動して止まると、<b>ミニゲーム</b>が自動的に始まります。<br>移動ボタンでマス4へ進んでください。<br><b>3種類</b>のミニゲームがランダムで出現します。', highlight: '#btn-move', waitMode: '👆 イベントマスへ移動', watchCondition: () => s().players[0].pos === 4 || s().mgActive },
            { title:'🎯 ミニゲーム', icon:'🎮', text:'ミニゲームが始まったら、画面の指示に従ってプレイしてください！<br><br>• <b>ハイ&ロー</b>：数字の大小を当てる<br>• <b>宝箱</b>：3つから1つ選ぶ<br>• <b>スロット</b>：リールを止めて揃える', waitMode: '🎮 ミニゲームをプレイ中...', watchCondition: () => !s().mgActive && s().players[0].pos === 4 }
        ];
        case 7: return [
            { title:'🏆 キャラスキル', icon:'🏃', text:'<b>元アスリート</b>でプレイ中です。<br>パッシブ：移動が常に<em>1AP</em>（雨でも！）<br>アクションスキル：<b>💨 疾風ダッシュ（3AP）</b>で3マス先へジャンプ！<br>「疾風ダッシュ」ボタンを試してみましょう。', setup: () => initSandboxGame({ p1pos:0, p1ap:12, p1p:8, p1char:'athlete', diceRolled:true, p2pos:9 }), highlight: '#btn-dash', waitMode: '👆 疾風ダッシュを使用', watchCondition: () => s().players[0].pos !== 0 },
            { title:'🏆 キャラスキル', icon:'👊', text:'次は<b>元ヤン</b>のスキルを試します。<br>パッシブ：同マスの相手から<b>自動で1Pカツアゲ</b>！<br>アクション：<b>👊 殴る（2AP）</b>で10ダメージ。<br>CPUのいるマスへ移動してみましょう。', setup: () => initSandboxGame({ p1pos:0, p1ap:12, p1p:5, p1char:'yankee', diceRolled:true, p2pos:1, p2p:10 }), waitMode: '👆 CPUのマスへ移動→殴る', watchCondition: () => s().players[0].pos === s().players[1].pos },
            { title:'🏆 キャラスキル', icon:'✅', text:'カツアゲが発動しましたか？同じマスにいるので「👊 殴る」も試してみてください。<br><br>他のキャラも個性的なスキルを持っています：<br>• 💼 <b>営業マン</b>：カードを押し付けて3P稼ぐ<br>• 🌿 <b>サバイバー</b>：ゴミ漁りノーリスク<br>• 💻 <b>ハッカー</b>：遠隔ショップ購入<br>• 🎸 <b>ミュージシャン</b>：人を集めて投げ銭', nextLabel: '理解した！ ▶' }
        ];
        default: return [];
    }
};