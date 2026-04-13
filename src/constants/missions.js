// src/constants/missions.js

// レアリティごとのテーマカラー
export const MISSION_COLORS = {
  UR: "#ffd700",
  SSR: "#ff6aff",
  SR: "#c084fc",
  R: "#60a5fa",
  N: "#9ca3af",
  CHAR: "#fb923c",
  "": "#fb923c"
};

// ミッションのタブ定義
export const MISSION_TABS = [
  { id: "wins", icon: "🏆", label: "優勝" },
  { id: "money", icon: "💰", label: "累計P" },
  { id: "move", icon: "👟", label: "移動" },
  { id: "npc", icon: "👥", label: "NPC" }
];

// ミッションのマスターデータ
// th: 目標値 (threshold)
// rw: 報酬内容 (g: グレード, nm: 名前/内容, ic: アイコン, charId: キャラ解放用キー)
export const MISSIONS = {
  wins: [
    { id: "w01", th: 1, label: "初勝利", desc: "最初の優勝を掴め", rw: { g: "N", nm: "ボロ服N", ic: "👕" } },
    { id: "w02", th: 2, label: "2連勝", desc: "もう一度証明せよ", rw: { g: "", nm: "+100缶", ic: "🥫" } },
    { id: "w03", th: 3, label: "3連覇", desc: "常連の証", rw: { g: "", nm: "+200缶", ic: "🥫" } },
    { id: "w04", th: 5, label: "5勝達成", desc: "生き残りの実力", rw: { g: "R", nm: "ストリートR", ic: "🧢" } },
    { id: "w05", th: 7, label: "7勝", desc: "週の覇者", rw: { g: "", nm: "+300缶", ic: "🥫" } },
    { id: "w06", th: 10, label: "10勝", desc: "本物の強者", rw: { g: "CHAR", nm: "元シェフ（解放）", ic: "🍳", charId: "chef" } }, // ▼ 新キャラ
    { id: "w07", th: 15, label: "15勝", desc: "路上の支配者", rw: { g: "", nm: "+500缶", ic: "🥫" } },
    { id: "w08", th: 20, label: "20勝", desc: "常勝の男", rw: { g: "R", nm: "ガラクタR", ic: "🔧" } },
    { id: "w09", th: 30, label: "30勝", desc: "伝説の始まり", rw: { g: "CHAR", nm: "闇医者（解放）", ic: "🩺" } },
    { id: "w10", th: 40, label: "40勝", desc: "無敵の称号", rw: { g: "SR", nm: "シャドウSR", ic: "🕶️" } },
    { id: "w11", th: 50, label: "50勝", desc: "半世紀の勝利", rw: { g: "", nm: "+1000缶", ic: "🥫" } },
    { id: "w12", th: 60, label: "60勝", desc: "街の王", rw: { g: "SSR", nm: "アンダーキングSSR", ic: "👑" } },
    { id: "w13", th: 75, label: "75勝", desc: "四半世紀の超人", rw: { g: "", nm: "+1500缶", ic: "🥫" } },
    { id: "w14", th: 100, label: "100勝", desc: "サバイバー王", rw: { g: "CHAR", nm: "路上の神様（解放）", ic: "👼", charId: "god" } }, // ▼ 新キャラ
    { id: "w15", th: 150, label: "150勝", desc: "都市の神話", rw: { g: "CHAR", nm: "ギャンブラー（解放）", ic: "🎰" } },
    { id: "w16", th: 200, label: "200勝", desc: "無敗の伝説", rw: { g: "SSR", nm: "ゴーストSSR", ic: "👻" } },
    { id: "w17", th: 300, label: "300勝", desc: "路上の帝王", rw: { g: "", nm: "+3000缶", ic: "🥫" } },
    { id: "w18", th: 500, label: "500勝", desc: "半千の覇者", rw: { g: "UR", nm: "デビルUR", ic: "😈" } },
    { id: "w19", th: 750, label: "750勝", desc: "伝説を超えた者", rw: { g: "CHAR", nm: "元探偵（解放）", ic: "🔍" } },
    { id: "w20", th: 1000, label: "1000勝", desc: "最後のサバイバー", rw: { g: "UR", nm: "ロード・オブ・ストリートUR", ic: "🌟" } }
  ],
  money: [
    { id: "m01", th: 100, label: "P入門", desc: "累計100P", rw: { g: "", nm: "+50缶", ic: "🥫" } },
    { id: "m02", th: 300, label: "P見習い", desc: "累計300P", rw: { g: "", nm: "+100缶", ic: "🥫" } },
    { id: "m03", th: 500, label: "P稼ぎ頭", desc: "累計500P", rw: { g: "N", nm: "ワークN", ic: "👔" } },
    { id: "m04", th: 1000, label: "P長者", desc: "累計1,000P", rw: { g: "", nm: "+200缶", ic: "🥫" } },
    { id: "m05", th: 2000, label: "路上の商人", desc: "累計2,000P", rw: { g: "R", nm: "マーチャントR", ic: "💼" } },
    { id: "m06", th: 3000, label: "投資家", desc: "累計3,000P", rw: { g: "", nm: "+300缶", ic: "🥫" } },
    { id: "m07", th: 5000, label: "実業家", desc: "累計5,000P", rw: { g: "CHAR", nm: "スカベンジャー（解放）", ic: "🛠️", charId: "scavenger" } }, // ▼ 新キャラ
    { id: "m08", th: 8000, label: "資産家", desc: "累計8,000P", rw: { g: "", nm: "+500缶", ic: "🥫" } },
    { id: "m09", th: 10000, label: "億万長者", desc: "累計10,000P", rw: { g: "SR", nm: "リッチSR", ic: "💎" } },
    { id: "m10", th: 15000, label: "財界人", desc: "累計15,000P", rw: { g: "", nm: "+800缶", ic: "🥫" } },
    { id: "m11", th: 20000, label: "大富豪", desc: "累計20,000P", rw: { g: "SR", nm: "ゴールドSR", ic: "🌟" } },
    { id: "m12", th: 30000, label: "P帝王", desc: "累計30,000P", rw: { g: "", nm: "+1000缶", ic: "🥫" } },
    { id: "m13", th: 50000, label: "投資の神", desc: "累計50,000P", rw: { g: "SSR", nm: "マネーSSR", ic: "💰" } },
    { id: "m14", th: 75000, label: "財閥総帥", desc: "累計75,000P", rw: { g: "", nm: "+2000缶", ic: "🥫" } },
    { id: "m15", th: 100000, label: "P神話", desc: "累計10万P", rw: { g: "CHAR", nm: "億万長者（解放）", ic: "💴", charId: "billionaire" } }, // ▼ 新キャラ
    { id: "m16", th: 150000, label: "超富裕層", desc: "累計15万P", rw: { g: "", nm: "+3000缶", ic: "🥫" } },
    { id: "m17", th: 200000, label: "P伝説", desc: "累計20万P", rw: { g: "SSR", nm: "プラチナSSR", ic: "💠" } },
    { id: "m18", th: 300000, label: "億の男", desc: "累計30万P", rw: { g: "", nm: "+5000缶", ic: "🥫" } },
    { id: "m19", th: 500000, label: "P覇者", desc: "累計50万P", rw: { g: "UR", nm: "ミリオンUR", ic: "👑" } },
    { id: "m20", th: 1000000, label: "P最強", desc: "累計100万P", rw: { g: "UR", nm: "インフィニティUR", ic: "♾️" } }
  ],
  move: [
    { id: "v01", th: 50, label: "初歩き", desc: "50マス移動", rw: { g: "", nm: "+50缶", ic: "🥫" } },
    { id: "v02", th: 100, label: "散歩", desc: "100マス移動", rw: { g: "", nm: "+100缶", ic: "🥫" } },
    { id: "v03", th: 200, label: "街歩き", desc: "200マス移動", rw: { g: "N", nm: "スニーカーN", ic: "👟" } },
    { id: "v04", th: 300, label: "路地裏の民", desc: "300マス移動", rw: { g: "", nm: "+150缶", ic: "🥫" } },
    { id: "v05", th: 500, label: "放浪者", desc: "500マス移動", rw: { g: "R", nm: "ランナーR", ic: "🏃" } },
    { id: "v06", th: 750, label: "路上の風", desc: "750マス移動", rw: { g: "", nm: "+200缶", ic: "🥫" } },
    { id: "v07", th: 1000, label: "都市の旅人", desc: "1,000マス移動", rw: { g: "R", nm: "トレイルR", ic: "🧭" } },
    { id: "v08", th: 1500, label: "さすらい人", desc: "1,500マス移動", rw: { g: "", nm: "+300缶", ic: "🥫" } },
    { id: "v09", th: 2000, label: "街の流れ者", desc: "2,000マス移動", rw: { g: "SR", nm: "ワンダラーSR", ic: "🌆" } },
    { id: "v10", th: 3000, label: "無休の歩者", desc: "3,000マス移動", rw: { g: "", nm: "+500缶", ic: "🥫" } },
    { id: "v11", th: 5000, label: "都市横断者", desc: "5,000マス移動", rw: { g: "SR", nm: "ダッシュSR", ic: "⚡" } },
    { id: "v12", th: 7500, label: "永遠の歩者", desc: "7,500マス移動", rw: { g: "", nm: "+800缶", ic: "🥫" } },
    { id: "v13", th: 10000, label: "都市の亡命者", desc: "10,000マス移動", rw: { g: "SSR", nm: "ノマドSSR", ic: "🗺️" } },
    { id: "v14", th: 15000, label: "超長距離走者", desc: "15,000マス移動", rw: { g: "", nm: "+1200缶", ic: "🥫" } },
    { id: "v15", th: 20000, label: "移動の神", desc: "2万マス移動", rw: { g: "CHAR", nm: "缶コレクターの帝王（解放）", ic: "🥫", charId: "emperor" } }, // ▼ 新キャラ
    { id: "v16", th: 30000, label: "路上の怪物", desc: "3万マス移動", rw: { g: "", nm: "+2000缶", ic: "🥫" } },
    { id: "v17", th: 50000, label: "距離の帝王", desc: "5万マス移動", rw: { g: "SSR", nm: "フリーダムSSR", ic: "🦅" } },
    { id: "v18", th: 75000, label: "無限の旅人", desc: "7.5万マス移動", rw: { g: "", nm: "+3000缶", ic: "🥫" } },
    { id: "v19", th: 100000, label: "歩行伝説", desc: "10万マス移動", rw: { g: "UR", nm: "インフィニットUR", ic: "∞" } },
    { id: "v20", th: 200000, label: "宇宙の歩者", desc: "20万マス移動", rw: { g: "UR", nm: "ウォーカーゴッドUR", ic: "🌌" } }
  ],
  npc: [
    { id: "n01", th: 3, label: "パト入門", desc: "パトカーに3回遭遇", rw: { g: "", nm: "+50缶", ic: "🥫" } },
    { id: "n02", th: 5, label: "パト慣れ", desc: "パトカーに5回", rw: { g: "", nm: "+100缶", ic: "🥫" } },
    { id: "n03", th: 10, label: "パト常連", desc: "パトカーに10回", rw: { g: "N", nm: "変装N", ic: "🎭" } },
    { id: "n04", th: 3, label: "闇金入門", desc: "闇金に3回遭遇", rw: { g: "", nm: "+80缶", ic: "🥫" } },
    { id: "n05", th: 5, label: "闇金生存", desc: "闇金に5回生き残る", rw: { g: "", nm: "+150缶", ic: "🥫" } },
    { id: "n06", th: 10, label: "闇金無双", desc: "闇金に10回", rw: { g: "R", nm: "スリックR", ic: "💸" } },
    { id: "n07", th: 5, label: "ヤクザ遭遇", desc: "ヤクザに5回遭遇", rw: { g: "", nm: "+120缶", ic: "🥫" } },
    { id: "n08", th: 10, label: "ヤクザ生存", desc: "ヤクザに10回", rw: { g: "R", nm: "タフガイR", ic: "💪" } },
    { id: "n09", th: 5, label: "厄介なおじ", desc: "厄介なおじさんに5回", rw: { g: "", nm: "+100缶", ic: "🥫" } },
    { id: "n10", th: 10, label: "おじ免疫", desc: "厄介なおじさんに10回", rw: { g: "R", nm: "スルーR", ic: "🙄" } },
    { id: "n11", th: 5, label: "野良動物", desc: "野良動物に5回遭遇", rw: { g: "", nm: "+80缶", ic: "🥫" } },
    { id: "n12", th: 5, label: "仲間遭遇", desc: "仲間のホームレス5回", rw: { g: "", nm: "+200缶", ic: "🥫" } },
    { id: "n13", th: 3, label: "収集車回避", desc: "ごみ収集車を3回回避", rw: { g: "", nm: "+150缶", ic: "🥫" } },
    { id: "n14", th: 10, label: "NPC10回", desc: "NPC合計10回遭遇", rw: { g: "SR", nm: "ストリートSR", ic: "🌃" } },
    { id: "n15", th: 20, label: "NPC20回", desc: "NPC合計20回遭遇", rw: { g: "", nm: "+300缶", ic: "🥫" } },
    { id: "n16", th: 30, label: "NPC30回", desc: "NPC合計30回遭遇", rw: { g: "SR", nm: "サバイバルSR", ic: "🎯" } },
    { id: "n17", th: 50, label: "NPC50回", desc: "NPC合計50回遭遇", rw: { g: "", nm: "+500缶", ic: "🥫" } },
    { id: "n18", th: 5, label: "全NPC制覇", desc: "全種NPCに遭遇", rw: { g: "SSR", nm: "アンダーワールドSSR", ic: "😈" } },
    { id: "n19", th: 100, label: "NPC100回", desc: "NPC合計100回遭遇", rw: { g: "CHAR", nm: "路上の仙人（解放）", ic: "☁️", charId: "sennin" } }, // ▼ 新キャラ
    { id: "n20", th: 200, label: "NPC200回", desc: "NPC合計200回遭遇", rw: { g: "UR", nm: "NPCキラーUR", ic: "☠️" } }
  ]
};