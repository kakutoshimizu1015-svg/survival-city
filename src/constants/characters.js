// =========================================================
// ▼ 基本キャラクター画像のインポート（元ヤン以外）
// =========================================================
import athleteFront from '../assets/images/athlete_front.png';
import athleteBack from '../assets/images/athlete_back.png';
import salesFront from '../assets/images/sales_front.png';
import salesBack from '../assets/images/sales_back.png';
import survivorFront from '../assets/images/survivor_front.png';
import survivorBack from '../assets/images/survivor_back.png';
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

// =========================================================
// ▼ 元ヤン スキン画像群のインポート（新フォルダ構造）
// =========================================================
import yankee_N_default from '../assets/images/skins/yankee/N_default.png';
import yankee_N_sweat_white from '../assets/images/skins/yankee/N_sweat_white.png';
import yankee_N_tokkou_red from '../assets/images/skins/yankee/N_tokkou_red.png';
import yankee_N_tokkou_red_meganenashi from '../assets/images/skins/yankee/N_tokkou_red_meganenashi.png';
import yankee_R_biker from '../assets/images/skins/yankee/R_biker.png';
import yankee_R_chain from '../assets/images/skins/yankee/R_chain.png';
import yankee_R_Jacket_ryu from '../assets/images/skins/yankee/R_Jacket_ryu.png';
import yankee_SR_can_pompadour from '../assets/images/skins/yankee/SR_can_pompadour.png';
import yankee_SR_cardboard from '../assets/images/skins/yankee/SR_cardboard.png';
import yankee_SR_cardboard_scratch from '../assets/images/skins/yankee/SR_cardboard_scratch.png';
import yankee_SR_IntellectualPresident from '../assets/images/skins/yankee/SR_IntellectualPresident.png';
import yankee_SSR_boss from '../assets/images/skins/yankee/SSR_boss.png';
import yankee_SSR_legendarypresident from '../assets/images/skins/yankee/SSR_legendarypresident.png';
import yankee_SSR_Thelegendaryyoungleader from '../assets/images/skins/yankee/SSR_Thelegendaryyoungleader.png';
import yankee_UR_Demoninaspecialattackuniform from '../assets/images/skins/yankee/UR_Demoninaspecialattackuniform.png';
import yankee_UR_Demoninaspecialattackuniform_bloodsoaked from '../assets/images/skins/yankee/UR_Demoninaspecialattackuniform_bloodsoaked.png';

// =========================================================
// ▼ NPC画像のインポート
// =========================================================
import policeImg from '../assets/images/NPC/police.png';
import truckImg from '../assets/images/NPC/truck.png';
import uncleImg from '../assets/images/NPC/uncle.png';
import yakuzaImg from '../assets/images/NPC/yakuza.png';
import loansharkImg from '../assets/images/NPC/loanshark.png';
import friendImg from '../assets/images/NPC/friend.png';
import animalImg from '../assets/images/NPC/animal.png';

// キャラクターキーと基本画像のマッピング（_backは徐々に廃止予定）
export const charImages = {
    athlete:  { front: athleteFront,  back: athleteBack },
    sales:    { front: salesFront,    back: salesBack },
    survivor: { front: survivorFront, back: survivorBack },
    yankee:   { front: yankee_N_default, back: yankee_N_default }, // ▼ デフォルトを新パスに置き換え
    hacker:   { front: hackerFront,   back: hackerBack },
    musician: { front: musicianFront, back: musicianBack },
    doctor:   { front: doctorFront,   back: doctorBack },
    gambler:  { front: gamblerFront,  back: gamblerBack },
    detective:{ front: detectiveFront,back: detectiveBack },
};

// =========================================================
// ▼ 全スキンマスターデータ（ガチャ・選択画面で共通利用）
// =========================================================
export const charSkins = {
    yankee: [
        // N (Normal)
        { id: "yankee_default", charKey: "yankee", name: "元ヤン（デフォルト）", rarity: "N", front: yankee_N_default, pieceColor: "#0A3070", ring: "#64B5F6", desc: "ツッパリ路上デビューのデフォルト姿。" },
        { id: "yankee_sweat_white", charKey: "yankee", name: "色違いの白スウェット", rarity: "N", front: yankee_N_sweat_white, pieceColor: "#D0D0D0", ring: "#9E9E9E", desc: "膝が抜け、泥がはねた白いスウェット上下。" },
        { id: "yankee_tokkou_red", charKey: "yankee", name: "色違いの赤特攻服", rarity: "N", front: yankee_N_tokkou_red, pieceColor: "#8B0000", ring: "#EF5350", desc: "汚れで黒ずんだ赤い特攻服。" },
        { id: "yankee_tokkou_red_nomegane", charKey: "yankee", name: "色違いの赤特攻服（眼鏡なし）", rarity: "N", front: yankee_N_tokkou_red_meganenashi, pieceColor: "#8B0000", ring: "#EF5350", desc: "汚れで黒ずんだ赤い特攻服の眼鏡なしバージョン。" },
        // R (Rare)
        { id: "yankee_biker", charKey: "yankee", name: "バイカー", rarity: "R", front: yankee_R_biker, pieceColor: "#5C0000", ring: "#EF5350", desc: "お金がないがバイクに乗りたい！夜露死苦。" },
        { id: "yankee_chain", charKey: "yankee", name: "チェーン巻きジャージ", rarity: "R", front: yankee_R_chain, pieceColor: "#2C3E50", ring: "#7F8C8D", desc: "威嚇のために拾った自転車のチェーンを巻いている。" },
        { id: "yankee_jacket_ryu", charKey: "yankee", name: "破れたスカジャン", rarity: "R", front: yankee_R_Jacket_ryu, pieceColor: "#1A252F", ring: "#3498DB", desc: "虎の刺繍が半分ほつれて見えなくなったスカジャン。" },
        // SR (Super Rare)
        { id: "yankee_can_pompadour", charKey: "yankee", name: "空き缶リーゼント", rarity: "SR", front: yankee_SR_can_pompadour, pieceColor: "#7F8C8D", ring: "#BDC3C7", desc: "潰した空き缶を髪に編み込んでリーゼントを維持している姿。" },
        { id: "yankee_cardboard", charKey: "yankee", name: "ダンボール将軍", rarity: "SR", front: yankee_SR_cardboard, pieceColor: "#D35400", ring: "#F39C12", desc: "ダンボールで武装！ツッパリの肩パッドを再現した姿。" },
        { id: "yankee_cardboard_scratch", charKey: "yankee", name: "傷ついたダンボール将軍", rarity: "SR", front: yankee_SR_cardboard_scratch, pieceColor: "#A04000", ring: "#E67E22", desc: "ダンボールで武装！しかしぼろぼろに、ツッパリの肩パッドを再現した姿。" },
        { id: "yankee_intellectual", charKey: "yankee", name: "別世界線のインテリヤンキー", rarity: "SR", front: yankee_SR_IntellectualPresident, pieceColor: "#1abc9c", ring: "#16a085", desc: "頭脳を高め成り上がった姿！拳でなく脳。" },
        // SSR (Double Super Rare)
        { id: "yankee_boss", charKey: "yankee", name: "ヤクザの組長", rarity: "SSR", front: yankee_SSR_boss, pieceColor: "#000000", ring: "#FFD700", desc: "ホームレスにならなければこうなっていたかも、、、" },
        { id: "yankee_legendary_president", charKey: "yankee", name: "伝説の総長", rarity: "SSR", front: yankee_SSR_legendarypresident, pieceColor: "#FFFFFF", ring: "#FFD700", desc: "高級ヤクザ顔負けの白スーツに和柄のシャツ。" },
        { id: "yankee_legendary_young", charKey: "yankee", name: "若き日の伝説の総長", rarity: "SSR", front: yankee_SSR_Thelegendaryyoungleader, pieceColor: "#FDF5E6", ring: "#F39C12", desc: "高級ヤクザ顔負けの白スーツに和柄のシャツ。" },
        // UR (Ultimate Rare)
        { id: "yankee_ur_demon", charKey: "yankee", name: "特攻服の鬼", rarity: "UR", front: yankee_UR_Demoninaspecialattackuniform, pieceColor: "#1A0033", ring: "#D500F9", desc: "刺繍が輝く完全無欠の豪華な特攻服。" },
        { id: "yankee_ur_demon_blood", charKey: "yankee", name: "血濡れ特攻服の鬼", rarity: "UR", front: yankee_UR_Demoninaspecialattackuniform_bloodsoaked, pieceColor: "#330000", ring: "#FF0044", desc: "返り血を浴び続けた刺繍が輝く完全無欠の豪華な特攻服。" }
    ],
    // 他キャラクターの拡張枠
    hacker: [], athlete: [], sales: [], survivor: [], musician: [], doctor: [], gambler: [], detective: []
};

// ▼ ガチャ排出プール（"default" を含むスキンを除外）
export const GACHA_POOL = Object.values(charSkins).flat().filter(skin => !skin.id.includes("default"));

export const npcImages = {
    police:    policeImg,
    truck:     truckImg,
    uncle:     uncleImg,
    yakuza:    yakuzaImg,
    loanshark: loansharkImg,
    friend:    friendImg,
    animal:    animalImg,
};

export const TOKEN_CONFIG = {
    player: { scaleMultiplier: 1.15, imageSize: 125, emojiBgSize: 64, emojiFontSize: 34, nameFontSize: 12 },
    npc: { baseSize: 120, truckSize: 250, truckOpacity: 0.65, policeSize: 200, uncleSize: 130, yakuzaSize: 130, loansharkSize: 130, friendSize: 130, animalSize: 120 }
};

export const charEmoji = { athlete:'🏃', sales:'💼', survivor:'🌿', yankee:'👊', hacker:'💻', musician:'🎸', doctor:'🩺', gambler:'🎲', detective:'🕵️' };

export const charInfo = {
    athlete:  { name:'元アスリート',           desc:'【健脚】移動常1AP・雨無効 / 【疾風ダッシュ】3AP:3マス先へ跳躍' },
    sales:    { name:'元営業マン',             desc:'【コミュ力】バイト80%・ショップ2P割引 / 【訪問販売】2AP:手札を選んで押付け3P徴収' },
    survivor: { name:'サバイバー',             desc:'【危機察知】ゴミ漁り失敗ペナ無効 / 【野宿】2AP:HP+15回復' },
    yankee:   { name:'元ヤン',                desc:'【威圧】同マス/すれ違いで自動1Pカツアゲ(1ターン2P上限) / 【殴る】2AP:同マス相手に10ダメ' },
    hacker:   { name:'元ハッカー',             desc:'【クラウドストレージ】手札上限+2 / 【遠隔ハッキング】3AP:どこからでもショップ強制入替え・1枚購入' },
    musician: { name:'ストリートミュージシャン',  desc:'【投げ銭】他者が同マスor隣接で銀行+3P / 【路上ライブ】4AP:周囲2マス全員を強制引き寄せ' },
    doctor:   { name:'闇医者',                desc:'【自己治癒】ターン開始時HP+5 / 【闇診療】2AP:同マス相手HP+30→5P強制徴収' },
    gambler:  { name:'ギャンブラー',            desc:'【アドレナリン】ゾロ目でAP倍+HP10回復＆25%で3ダイス / 【イカサマ勝負】2AP:1d6対決・勝者が5P奪取' },
    detective:{ name:'元探偵',                desc:'【張り込み】自陣地侵入者の手札を30%で没収 / 【情報操作】3AP:好きなNPC1体を任意マスへ移動(CD:3R)' },
};

export const charDetailData = {
    athlete:  { tagline:'雨も夜も止まらない、鍛え抜かれた肉体', passive:{name:'【健脚】',desc:'移動コストが常に1AP固定。雨の日の移動ペナルティを完全無効化。'}, action:{name:'【疾風ダッシュ】 (3AP)',desc:'ダイス後でも使用可。3マス先の到達点を列挙し（白く光ります）、選んだ地点へ即時跳躍。交番・NPC・罠を飛び越える戦略移動が可能。'} },
    sales:    { tagline:'口八丁で金を生み出す、元・敏腕セールスマン', passive:{name:'【コミュ力】',desc:'バイト成功率80%（通常60%）。ショップの全カード購入価格が常に2P割引。'}, action:{name:'【訪問販売】 (2AP)',desc:'手札から好きなカードを1枚選び、同マスの相手に強制的に押し付けて3Pを徴収する。要らないカードで荒稼ぎ。'} },
    survivor: { tagline:'過酷な路上生活を生き抜いてきた、不死身のホームレス', passive:{name:'【危機察知】',desc:'ゴミ漁り失敗時の「警察ペナルティ（次回AP-2）」を完全無効化。'}, action:{name:'【野宿】 (2AP)',desc:'その場でHP15を即時回復。回復カードなしでも長期戦を生き残れる持久戦型スキル。'} },
    yankee:   { tagline:'一度睨まれたら誰でも縮み上がる、元不良の威圧感', passive:{name:'【威圧】',desc:'同マスに止まった・すれ違った他プレイヤーから自動で1Pをカツアゲ（1ターン最大2Pまで）。移動するだけで収入になる。'}, action:{name:'【殴る】 (2AP)',desc:'同マスの相手に10ダメージ。ダメージの一部はPとして落とさせる直接攻撃。'} },
    hacker:   { tagline:'情報の海を泳ぐ、孤高のデジタル浮浪者', passive:{name:'【クラウドストレージ】',desc:'手札の上限が+2枚（デフォルト9枚）。リュック装備と重複可能。'}, action:{name:'【遠隔ハッキング】 (3AP)',desc:'どこにいてもショップの品揃えを強制入替えし、その場で1枚購入できる。他プレイヤーが狙うカードを潰すことも可。'} },
    musician: { tagline:'路上ライブで人々を引き寄せる、カリスマ流浪のアーティスト', passive:{name:'【投げ銭】',desc:'他のプレイヤーが自分と同じマスまたは隣接マスに止まる/通過するたびに、銀行から3Pを自動獲得。'}, action:{name:'【路上ライブ】 (4AP)',desc:'周囲2マス以内の全プレイヤーを自分のマスに強制引き寄せ。ヤクザ横や元ヤンのカツアゲコンボなどに応用可。'} },
    doctor:   { tagline:'闇の診療所を開く、危うい善意の医者', passive:{name:'【自己治癒】',desc:'毎ターン開始時に自動でHP5を回復。長期戦で確実に真価を発揮する持久型パッシブ。'}, action:{name:'【闇診療】 (2AP)',desc:'同マスの相手のHPを30回復する代わりに5Pを強制徴収。助けるフリをしたカツアゲ。'} },
    gambler:  { tagline:'運命を賭けることに喜びを感じる、無一文の賭博師', passive:{name:'【アドレナリン】',desc:'ゾロ目が出た時、APが倍になるだけでなくHPも10回復。さらに毎ターン25%の確率で3つ目のサイコロが追加で振られる高リスク高リターン型。'}, action:{name:'【イカサマ勝負】 (2AP)',desc:'同マスの相手と1〜6のサイコロ対決。勝者が負けた方から5Pを奪う。同点は仕掛けた側の負け。'} },
    detective:{ tagline:'陰からすべてを見通す、元・辣腕探偵', passive:{name:'【張り込み】',desc:'自分の陣地に他プレイヤーが完全に止まった時、30%の確率で相手の手札を1枚没収する。'}, action:{name:'【情報操作】 (3AP)',desc:'マップ上の好きなNPC（警察・ヤクザ・収集車など）を1体選び、任意のマスへ瞬間移動させる。一度使うと3ラウンドのクールタイムが必要。'} },
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