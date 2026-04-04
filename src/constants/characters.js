// 全キャラクターの画像をインポート
import athleteFront from '../assets/images/athlete_front.png';
import athleteBack from '../assets/images/athlete_back.png';
import salesFront from '../assets/images/sales_front.png';
import salesBack from '../assets/images/sales_back.png';
import survivorFront from '../assets/images/survivor_front.png';
import survivorBack from '../assets/images/survivor_back.png';
import yankeeFront from '../assets/images/yankee_front.png';
import yankeeBack from '../assets/images/yankee_back.png';
import hackerFront from '../assets/images/hacker_front.png';
import hackerBack from '../assets/images/hacker_back.png';
import musicianFront from '../assets/images/musician_front.png';
import musicianBack from '../assets/images/musician_back.png';
import doctorFront from '../assets/images/doctor_front.png';
import doctorBack from '../assets/images/doctor_back.png';
import gamblerFront from '../assets/images/gambler_front.png';
import gamblerBack from '../assets/images/gambler_back.png';
import detectiveFront from '../assets/images/detective_front.png';
import detectiveBack from '../assets/images/detective_back.png';

// NPC画像のインポート
import policeImg from '../assets/images/NPC/police.png';
import truckImg from '../assets/images/NPC/truck.png';
import uncleImg from '../assets/images/NPC/uncle.png';
import yakuzaImg from '../assets/images/NPC/yakuza.png';
import loansharkImg from '../assets/images/NPC/loanshark.png';
import friendImg from '../assets/images/NPC/friend.png';
import animalImg from '../assets/images/NPC/animal.png';

// キャラクターキーと画像のマッピング
export const charImages = {
    athlete:  { front: athleteFront,  back: athleteBack },
    sales:    { front: salesFront,    back: salesBack },
    survivor: { front: survivorFront, back: survivorBack },
    yankee:   { front: yankeeFront,   back: yankeeBack },
    hacker:   { front: hackerFront,   back: hackerBack },
    musician: { front: musicianFront, back: musicianBack },
    doctor:   { front: doctorFront,   back: doctorBack },
    gambler:  { front: gamblerFront,  back: gamblerBack },
    detective:{ front: detectiveFront,back: detectiveBack },
};

// NPC画像のマッピング
export const npcImages = {
    police:    policeImg,
    truck:     truckImg,
    uncle:     uncleImg,
    yakuza:    yakuzaImg,
    loanshark: loansharkImg,
    friend:    friendImg,
    animal:    animalImg,
};

// =========================================================
// ▼ 駒とNPCのサイズ調整用パラメータ（開発者用一括管理）
// =========================================================
export const TOKEN_CONFIG = {
    player: {
        scaleMultiplier: 1.15, // 遠近法に乗算するベース倍率
        imageSize: 125,        // スキン画像使用時のサイズ (px)
        emojiBgSize: 64,       // 絵文字使用時の丸枠サイズ (px)
        emojiFontSize: 34,     // 絵文字のフォントサイズ (px)
        nameFontSize: 12       // プレイヤー名のフォントサイズ (px)
    },
    npc: {
        baseSize: 120,         // デフォルトの基本サイズ (px)
        truckSize: 250,        // ゴミ収集車のサイズ (px)
        truckOpacity: 0.65,    // 【新規】通常時の透過度
        policeSize: 200,       // 警察のサイズ (px)
        uncleSize: 130,        // 厄介なおじさんのサイズ (px)
        yakuzaSize: 130,       // ヤクザのサイズ (px)
        loansharkSize: 130,    // 闇金のサイズ (px)
        friendSize: 130,       // 仲間のサイズ (px)
        animalSize: 120        // 野良動物のサイズ (px)
    }
};
// =========================================================

// 画像がない場合のフォールバック用絵文字（ログテキスト等でも使用）
export const charEmoji = { athlete:'🏃', sales:'💼', survivor:'🌿', yankee:'👊', hacker:'💻', musician:'🎸', doctor:'🩺', gambler:'🎲', detective:'🕵️' };

export const charInfo = {
    athlete:  { name:'元アスリート',           desc:'【健脚】移動常1AP・雨無効 / 【疾風ダッシュ】3AP:3マス先へ跳躍' },
    sales:    { name:'元営業マン',             desc:'【コミュ力】バイト80%・ショップ1P割引 / 【訪問販売】2AP:カード押付けて3P徴収' },
    survivor: { name:'サバイバー',             desc:'【危機察知】ゴミ漁り失敗ペナ無効 / 【野宿】2AP:HP+15回復' },
    yankee:   { name:'元ヤン',                desc:'【威圧】同マス/すれ違いで自動1Pカツアゲ(1ターン2P上限) / 【殴る】2AP:同マス相手に10ダメ' },
    hacker:   { name:'元ハッカー',             desc:'【クラウドストレージ】手札上限+2 / 【遠隔ハッキング】3AP:どこからでもショップ強制入替え・1枚購入' },
    musician: { name:'ストリートミュージシャン',  desc:'【投げ銭】他者が同マスor隣接で銀行+3P / 【路上ライブ】4AP:周囲2マス全員を強制引き寄せ' },
    doctor:   { name:'闇医者',                desc:'【自己治癒】ターン開始時HP+5 / 【闇診療】2AP:同マス相手HP+30→5P強制徴収' },
    gambler:  { name:'ギャンブラー',            desc:'【アドレナリン】ゾロ目でAP倍+HP10回復 / 【イカサマ勝負】2AP:1d6対決・勝者が5P奪取' },
    detective:{ name:'元探偵',                desc:'【張り込み】自陣地侵入者の手札1枚没収 / 【情報操作】3AP:NPC1体を任意マスへ移動' },
};

export const charDetailData = {
    athlete:  { tagline:'雨も夜も止まらない、鍛え抜かれた肉体', passive:{name:'【健脚】',desc:'移動コストが常に1AP固定。雨の日の移動ペナルティを完全無効化。'}, action:{name:'【疾風ダッシュ】 (3AP)',desc:'ダイス後でも使用可。3マス先の到達点を列挙し、選んだ地点へ即時跳躍。交番・NPC・罠を飛び越える戦略移動が可能。'} },
    sales:    { tagline:'口八丁で金を生み出す、元・敏腕セールスマン', passive:{name:'【コミュ力】',desc:'バイト成功率80%（通常60%）。ショップの全カード購入価格が常に1P割引。'}, action:{name:'【訪問販売】 (2AP)',desc:'同マスの相手にランダムな手札1枚を強制的に押し付け、3Pを徴収する。要らないカードで荒稼ぎ。'} },
    survivor: { tagline:'過酷な路上生活を生き抜いてきた、不死身のホームレス', passive:{name:'【危機察知】',desc:'ゴミ漁り失敗時の「警察ペナルティ（次回AP-2）」を完全無効化。'}, action:{name:'【野宿】 (2AP)',desc:'その場でHP15を即時回復。回復カードなしでも長期戦を生き残れる持久戦型スキル。'} },
    yankee:   { tagline:'一度睨まれたら誰でも縮み上がる、元不良の威圧感', passive:{name:'【威圧】',desc:'同マスに止まった・すれ違った他プレイヤーから自動で1Pをカツアゲ（1ターン最大2Pまで）。移動するだけで収入になる。'}, action:{name:'【殴る】 (2AP)',desc:'同マスの相手に10ダメージ。ダメージの一部はPとして落とさせる直接攻撃。'} },
    hacker:   { tagline:'情報の海を泳ぐ、孤高のデジタル浮浪者', passive:{name:'【クラウドストレージ】',desc:'手札の上上限が+2枚（デフォルト9枚）。リュック装備と重複可能。'}, action:{name:'【遠隔ハッキング】 (3AP)',desc:'どこにいてもショップの品揃えを強制入替えし、その場で1枚購入できる。他プレイヤーが狙うカードを潰すことも可。'} },
    musician: { tagline:'路上ライブで人々を引き寄せる、カリスマ流浪のアーティスト', passive:{name:'【投げ銭】',desc:'他のプレイヤーが自分と同じマスまたは隣接マスに止まる/通過するたびに、銀行から3Pを自動獲得。'}, action:{name:'【路上ライブ】 (4AP)',desc:'周囲2マス以内の全プレイヤーを自分のマスに強制引き寄せ。ヤクザ横や元ヤンのカツアゲコンボなどに応用可。'} },
    doctor:   { tagline:'闇の診療所を開く、危うい善意の医者', passive:{name:'【自己治癒】',desc:'毎ターン開始時に自動でHP5を回復。長期戦で確実に真価を発揮する持久型パッシブ。'}, action:{name:'【闇診療】 (2AP)',desc:'同マスの相手のHPを30回復する代わりに5Pを強制徴収。助けるフリをしたカツアゲ。'} },
    gambler:  { tagline:'運命を賭けることに喜びを感じる、無一文の賭博師', passive:{name:'【アドレナリン】',desc:'ゾロ目が出た時、APが倍になるだけでなくHPも10回復。高リスク高リターンの勝負師スタイル。'}, action:{name:'【イカサマ勝負】 (2AP)',desc:'同マスの相手と1〜6のサイコロ対決。勝者が負けた方から5Pを奪う。同点は仕掛けた側の負け。'} },
    detective:{ tagline:'陰からすべてを見通す、元・辣腕探偵', passive:{name:'【張り込み】',desc:'自分の陣地に他プレイヤーが止まった時、通常の陣地収入に加えて相手の手札を1枚没収する。'}, action:{name:'【情報操作】 (3AP)',desc:'マップ上のNPC（警察・ヤクザなど）を1体選び、任意のマスへ瞬間移動させる。'} },
};

export const pIdColors = ["#e74c3c", "#3498db", "#2ecc71", "#f1c40f", "#e67e22", "#9b59b6", "#1abc9c", "#e91e8c"];

export const teamColors = {
    none:   { label:'ソロ',  color:'transparent', icon:'⚪' },
    red:    { label:'赤',    color:'#e74c3c',     icon:'🔴' },
    blue:   { label:'青',    color:'#3498db',     icon:'🔵' },
    green:  { label:'緑',    color:'#2ecc71',     icon:'🟢' },
    yellow: { label:'黄',    color:'#f1c40f',     icon:'🟡' },
    orange: { label:'橙',    color:'#e67e22',     icon:'🟠' },
    purple: { label:'紫',    color:'#9b59b6',     icon:'🟣' },
    cyan:   { label:'水',    color:'#1abc9c',     icon:'🩵' },
    pink:   { label:'桃',    color:'#e91e8c',     icon:'🩷' },
};