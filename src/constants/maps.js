import mediumBgDay from '../assets/images/map/48_bg_noon.jpg';
import mediumBgNight from '../assets/images/map/48_bg_night.jpg';

// ★追加: マップ全体のサイズや遠近感を一元管理する設定
export const MAP_CONFIG = {
    TILE_SIZE: 40, // ★ここの数字を変えるだけで、マス・矢印・カメラ・線の太さが全て連動します（標準は80）
    GAP: 20,        // マスとマスの隙間
    PADDING: 30     // マップ外周の余白
};

export const tileTooltipData = {
    center:    { title:"🏥 病院（スタート地点）", desc:"HPが0になると強制送還。最大15P没収・装備1つロスト。" },
    normal:    { title:"🛣️ 通常の道", desc:"特別な効果なし。移動の通過点。" },
    can:       { title:"🥫 空き缶", desc:"1APで缶を拾う（1ターン3回まで）。雨の日は雨具が必要。" },
    trash:     { title:"🗑️ ゴミ山", desc:"2APでゴミを漁る。失敗すると警察に補導されAP-2ペナルティ。" },
    exchange:  { title:"💱 買取所", desc:"拾った缶・ゴミを現在相場でP換金（0AP）。" },
    job:       { title:"💼 バイト", desc:"3APで挑戦。成功率60-80%で12P獲得。" },
    shop:      { title:"🛒 ショップ", desc:"カードを購入（4-6P）または手持ちカードを2Pで売却できる。" },
    event:     { title:"🎲 イベント", desc:"ミニゲームまたはストーリーイベントが発生！カード獲得のチャンス。" },
    shelter:   { title:"🏕️ 避難所", desc:"止まるとステルス状態になり、次の敵を1回やり過ごせる。" },
    manhole:   { title:"🕳️ マンホール", desc:"1APで別のマンホールへランダムワープ。" },
    koban:     { title:"🚓 交番", desc:"職務質問でその場に足止め。このターンは移動不可。" },
    slum:      { title:"🏚️ スラムエリア", desc:"缶・ゴミが多い。相場が低め。" },
    commercial:{ title:"🏙️ 商業エリア", desc:"バイト・ショップが充実。中程度の相場。" },
    luxury:    { title:"🏰 高級エリア", desc:"収入が高い。警察が多くパトロールする。" },
};

export function genSmallMap(){return[
    {id:0,col:2,row:2,next:[1],area:"slum",type:"center",name:"病院"},
    {id:1,col:3,row:2,next:[2,5],area:"slum",type:"normal",name:"道"},
    {id:2,col:4,row:2,next:[3],area:"commercial",type:"can",name:"空き缶"},
    {id:3,col:4,row:3,next:[4],area:"commercial",type:"job",name:"バイト"},
    {id:4,col:3,row:3,next:[6],area:"commercial",type:"event",name:"イベント"},
    {id:5,col:3,row:1,next:[6],area:"commercial",type:"shop",name:"ショップ"},
    {id:6,col:2,row:3,next:[7,9],area:"luxury",type:"exchange",name:"買取所"},
    {id:7,col:1,row:3,next:[8],area:"slum",type:"trash",name:"ゴミ山"},
    {id:8,col:1,row:2,next:[0],area:"slum",type:"event",name:"イベント"},
    {id:9,col:2,row:4,next:[10],area:"luxury",type:"manhole",name:"ﾏﾝﾎｰﾙ"},
    {id:10,col:3,row:4,next:[11],area:"luxury",type:"job",name:"バイト"},
    {id:11,col:4,row:4,next:[4],area:"luxury",type:"shelter",name:"避難所"},
]}

export function genMediumMap(){return[{id:0,col:3,row:4,next:[1],area:"slum",type:"center",name:"病院"},{id:1,col:4,row:4,next:[2],area:"slum",type:"trash",name:"ゴミ山"},{id:2,col:5,row:4,next:[3,10],area:"slum",type:"can",name:"空き缶"},{id:3,col:6,row:3,next:[4],area:"slum",type:"normal",name:"道"},{id:4,col:7,row:2,next:[5],area:"slum",type:"event",name:"イベント"},{id:5,col:6,row:1,next:[6],area:"slum",type:"can",name:"空き缶"},{id:6,col:5,row:1,next:[7],area:"slum",type:"manhole",name:"ﾏﾝﾎｰﾙ"},{id:7,col:4,row:2,next:[8],area:"slum",type:"trash",name:"ゴミ山"},{id:8,col:3,row:3,next:[9],area:"slum",type:"normal",name:"道"},{id:9,col:2,row:4,next:[0],area:"slum",type:"event",name:"イベント"},{id:10,col:6,row:5,next:[11],area:"commercial",type:"normal",name:"道"},{id:11,col:7,row:6,next:[12],area:"commercial",type:"job",name:"バイト"},{id:12,col:8,row:6,next:[13],area:"commercial",type:"koban",name:"交番"},{id:13,col:9,row:5,next:[14,20],area:"commercial",type:"event",name:"イベント"},{id:14,col:9,row:4,next:[15],area:"commercial",type:"shop",name:"ショップ"},{id:15,col:8,row:3,next:[16],area:"commercial",type:"exchange",name:"買取所"},{id:16,col:7,row:4,next:[3],area:"commercial",type:"event",name:"イベント"},{id:17,col:10,row:4,next:[18],area:"commercial",type:"shelter",name:"避難所"},{id:18,col:11,row:5,next:[13],area:"commercial",type:"normal",name:"道"},{id:19,col:10,row:6,next:[17],area:"commercial",type:"job",name:"バイト"},{id:20,col:10,row:7,next:[21],area:"commercial",type:"job",name:"バイト"},{id:21,col:11,row:8,next:[22],area:"luxury",type:"normal",name:"高級住宅"},{id:22,col:12,row:8,next:[23,29],area:"luxury",type:"event",name:"イベント"},{id:23,col:13,row:7,next:[24],area:"luxury",type:"shop",name:"高級店"},{id:24,col:13,row:6,next:[25],area:"luxury",type:"job",name:"バイト"},{id:25,col:12,row:5,next:[26],area:"luxury",type:"koban",name:"交番"},{id:26,col:11,row:6,next:[14],area:"commercial",type:"normal",name:"道"},{id:27,col:12,row:4,next:[28],area:"luxury",type:"event",name:"イベント"},{id:28,col:13,row:5,next:[25],area:"luxury",type:"exchange",name:"買取所"},{id:29,col:13,row:9,next:[30],area:"luxury",type:"manhole",name:"ﾏﾝﾎｰﾙ"},{id:30,col:14,row:9,next:[31],area:"luxury",type:"normal",name:"道"},{id:31,col:15,row:8,next:[32],area:"luxury",type:"event",name:"イベント"},{id:32,col:15,row:7,next:[33],area:"luxury",type:"normal",name:"高級住宅"},{id:33,col:16,row:6,next:[34],area:"luxury",type:"job",name:"バイト"},{id:34,col:17,row:5,next:[35],area:"luxury",type:"normal",name:"高級住宅"},{id:35,col:16,row:4,next:[36],area:"luxury",type:"shelter",name:"避難所"},{id:36,col:15,row:3,next:[37],area:"luxury",type:"event",name:"イベント"},{id:37,col:14,row:4,next:[23],area:"luxury",type:"normal",name:"道"},{id:38,col:18,row:4,next:[39],area:"luxury",type:"normal",name:"道"},{id:39,col:19,row:5,next:[40],area:"luxury",type:"event",name:"イベント"},{id:40,col:18,row:6,next:[41],area:"luxury",type:"can",name:"空き缶"},{id:41,col:17,row:7,next:[31],area:"luxury",type:"normal",name:"道"},{id:42,col:16,row:9,next:[43],area:"luxury",type:"trash",name:"ゴミ"},{id:43,col:17,row:9,next:[44],area:"luxury",type:"normal",name:"高級住宅"},{id:44,col:18,row:8,next:[45],area:"luxury",type:"shop",name:"高級店"},{id:45,col:19,row:7,next:[46],area:"luxury",type:"event",name:"イベント"},{id:46,col:20,row:8,next:[47],area:"luxury",type:"exchange",name:"買取所"},{id:47,col:21,row:9,next:[20],area:"luxury",type:"normal",name:"道"},]}

export function genLargeMap(){return[{id:0,col:2,row:6,next:[1],area:"slum",type:"center",name:"病院"},{id:1,col:3,row:6,next:[2],area:"slum",type:"trash",name:"ゴミ山"},{id:2,col:4,row:5,next:[3,19],area:"slum",type:"can",name:"空き缶"},{id:3,col:5,row:4,next:[4],area:"slum",type:"normal",name:"道"},{id:4,col:6,row:3,next:[5],area:"slum",type:"event",name:"イベント"},{id:5,col:7,row:3,next:[6],area:"slum",type:"can",name:"空き缶"},{id:6,col:8,row:4,next:[7,25],area:"slum",type:"manhole",name:"ﾏﾝﾎｰﾙ"},{id:7,col:8,row:5,next:[8],area:"slum",type:"normal",name:"道"},{id:8,col:7,row:6,next:[9],area:"slum",type:"trash",name:"ゴミ山"},{id:9,col:6,row:7,next:[10],area:"slum",type:"normal",name:"道"},{id:10,col:5,row:8,next:[11],area:"slum",type:"event",name:"イベント"},{id:11,col:4,row:8,next:[12],area:"slum",type:"can",name:"空き缶"},{id:12,col:3,row:8,next:[13],area:"slum",type:"trash",name:"ゴミ山"},{id:13,col:2,row:7,next:[0],area:"slum",type:"normal",name:"道"},{id:14,col:2,row:5,next:[15],area:"slum",type:"can",name:"空き缶"},{id:15,col:2,row:4,next:[16],area:"slum",type:"normal",name:"道"},{id:16,col:3,row:3,next:[17],area:"slum",type:"trash",name:"ゴミ山"},{id:17,col:4,row:3,next:[18],area:"slum",type:"event",name:"イベント"},{id:18,col:5,row:3,next:[4],area:"slum",type:"exchange",name:"買取所"},{id:19,col:5,row:6,next:[20],area:"slum",type:"normal",name:"裏路地"},{id:20,col:6,row:6,next:[21],area:"slum",type:"can",name:"空き缶"},{id:21,col:7,row:5,next:[22],area:"slum",type:"trash",name:"ゴミ山"},{id:22,col:7,row:4,next:[6],area:"slum",type:"normal",name:"裏路地"},{id:23,col:3,row:7,next:[24],area:"slum",type:"shelter",name:"避難所"},{id:24,col:4,row:7,next:[10],area:"slum",type:"normal",name:"裏路地"},{id:25,col:9,row:4,next:[26],area:"commercial",type:"koban",name:"交番"},{id:26,col:10,row:4,next:[27],area:"commercial",type:"job",name:"バイト"},{id:27,col:11,row:3,next:[28,43],area:"commercial",type:"normal",name:"商業通り"},{id:28,col:12,row:3,next:[29],area:"commercial",type:"shop",name:"ショップ"},{id:29,col:13,row:4,next:[30],area:"commercial",type:"event",name:"イベント"},{id:30,col:14,row:5,next:[31,50],area:"commercial",type:"manhole",name:"ﾏﾝﾎｰﾙ"},{id:31,col:14,row:6,next:[32],area:"commercial",type:"job",name:"バイト"},{id:32,col:13,row:7,next:[33],area:"commercial",type:"exchange",name:"買取所"},{id:33,col:12,row:8,next:[34],area:"commercial",type:"event",name:"イベント"},{id:34,col:11,row:8,next:[35],area:"commercial",type:"shop",name:"ショップ"},{id:35,col:10,row:8,next:[36],area:"commercial",type:"normal",name:"商業通り"},{id:36,col:9,row:7,next:[37],area:"commercial",type:"job",name:"バイト"},{id:37,col:9,row:6,next:[38],area:"commercial",type:"normal",name:"商業通り"},{id:38,col:9,row:5,next:[26],area:"commercial",type:"event",name:"イベント"},{id:39,col:10,row:7,next:[40],area:"commercial",type:"shelter",name:"避難所"},{id:40,col:11,row:6,next:[41],area:"commercial",type:"normal",name:"商業通り"},{id:41,col:12,row:6,next:[42],area:"commercial",type:"job",name:"バイト"},{id:42,col:13,row:5,next:[30],area:"commercial",type:"normal",name:"商業通り"},{id:43,col:11,row:2,next:[44],area:"commercial",type:"job",name:"裏バイト"},{id:44,col:12,row:2,next:[45],area:"commercial",type:"normal",name:"裏通り"},{id:45,col:13,row:2,next:[46],area:"commercial",type:"event",name:"イベント"},{id:46,col:14,row:3,next:[47],area:"commercial",type:"normal",name:"裏通り"},{id:47,col:15,row:4,next:[48],area:"commercial",type:"shop",name:"闇市"},{id:48,col:15,row:5,next:[49],area:"commercial",type:"normal",name:"裏通り"},{id:49,col:14,row:6,next:[32],area:"commercial",type:"event",name:"イベント"},{id:50,col:16,row:5,next:[51],area:"luxury",type:"koban",name:"交番"},{id:51,col:17,row:5,next:[52],area:"luxury",type:"normal",name:"高級住宅"},{id:52,col:18,row:4,next:[53,67],area:"luxury",type:"event",name:"イベント"},{id:53,col:19,row:3,next:[54],area:"luxury",type:"normal",name:"高級住宅"},{id:54,col:20,row:3,next:[55],area:"luxury",type:"shop",name:"高級店"},{id:55,col:21,row:4,next:[56],area:"luxury",type:"exchange",name:"買取所"},{id:56,col:22,row:5,next:[57,72],area:"luxury",type:"manhole",name:"ﾏﾝﾎｰﾙ"},{id:57,col:22,row:6,next:[58],area:"luxury",type:"job",name:"バイト"},{id:58,col:21,row:7,next:[59],area:"luxury",type:"normal",name:"高級住宅"},{id:59,col:20,row:8,next:[60],area:"luxury",type:"event",name:"イベント"},{id:60,col:19,row:8,next:[61],area:"luxury",type:"normal",name:"高級住宅"},{id:61,col:18,row:8,next:[62],area:"luxury",type:"shelter",name:"避難所"},{id:62,col:17,row:7,next:[63],area:"luxury",type:"normal",name:"高級住宅"},{id:63,col:16,row:6,next:[64],area:"luxury",type:"job",name:"バイト"},{id:64,col:17,row:4,next:[65],area:"luxury",type:"event",name:"イベント"},{id:65,col:18,row:3,next:[54],area:"luxury",type:"normal",name:"高級住宅"},{id:66,col:18,row:5,next:[56],area:"luxury",type:"normal",name:"近道"},{id:67,col:19,row:5,next:[68],area:"luxury",type:"event",name:"イベント"},{id:68,col:20,row:6,next:[69],area:"luxury",type:"normal",name:"高級住宅"},{id:69,col:21,row:6,next:[58],area:"luxury",type:"shop",name:"高級店"},{id:70,col:19,row:7,next:[71],area:"luxury",type:"normal",name:"高級住宅"},{id:71,col:18,row:7,next:[61],area:"luxury",type:"job",name:"バイト"},{id:72,col:23,row:5,next:[73],area:"luxury",type:"koban",name:"交番"},{id:73,col:24,row:5,next:[74],area:"luxury",type:"can",name:"空き缶"},{id:74,col:25,row:5,next:[52],area:"luxury",type:"exchange",name:"買取所"},]}

export const mapBackgrounds = {
    48: {
        day: mediumBgDay,
        night: mediumBgNight
    }
};

export function genCustomMap() {
    return [
        { id: 1, col: 13, row: 7, next: [2, 20, 41], area: "slum", type: "center", name: "病院", isCustom: true },
        { id: 2, col: 11, row: 9, next: [3, 7], area: "slum", type: "normal", name: "スラムの道", isCustom: true },
        { id: 3, col: 10, row: 11, next: [4], area: "slum", type: "trash", name: "ゴミ山", isCustom: true },
        { id: 4, col: 7, row: 13, next: [5], area: "slum", type: "event", name: "イベント", isCustom: true },
        { id: 5, col: 4, row: 13, next: [6], area: "slum", type: "trash", name: "ゴミ山", isCustom: true },
        { id: 6, col: 2, row: 11, next: [9], area: "slum", type: "can", name: "空き缶", isCustom: true },
        { id: 7, col: 7, row: 9, next: [8], area: "slum", type: "normal", name: "スラムの道", isCustom: true },
        { id: 8, col: 5, row: 9, next: [4, 9, 12], area: "slum", type: "can", name: "空き缶", isCustom: true },
        { id: 9, col: 2, row: 9, next: [10], area: "slum", type: "exchange", name: "買取所", isCustom: true },
        { id: 10, col: 2, row: 6, next: [13, 14], area: "slum", type: "event", name: "イベント", isCustom: true },
        { id: 11, col: 10, row: 6, next: [1, 12], area: "slum", type: "normal", name: "スラムの道", isCustom: true },
        { id: 12, col: 7, row: 6, next: [13], area: "slum", type: "event", name: "イベント", isCustom: true },
        { id: 13, col: 4, row: 6, next: [10, 19], area: "slum", type: "normal", name: "スラムの道", isCustom: true },
        { id: 14, col: 3, row: 4, next: [15], area: "slum", type: "shelter", name: "避難所", isCustom: true },
        { id: 15, col: 5, row: 2, next: [16, 45], area: "slum", type: "event", name: "イベント", isCustom: true },
        { id: 16, col: 7, row: 2, next: [17], area: "slum", type: "normal", name: "スラムの道", isCustom: true },
        { id: 17, col: 9, row: 2, next: [18], area: "slum", type: "normal", name: "スラムの道", isCustom: true },
        { id: 18, col: 11, row: 4, next: [1, 11], area: "slum", type: "exchange", name: "買取所", isCustom: true },
        { id: 19, col: 7, row: 4, next: [17], area: "slum", type: "trash", name: "ゴミ山", isCustom: true },
        { id: 20, col: 14, row: 8, next: [21], area: "commercial", type: "job", name: "バイト", isCustom: true },
        { id: 21, col: 16, row: 10, next: [22, 24], area: "commercial", type: "normal", name: "商業通り", isCustom: true },
        { id: 22, col: 14, row: 11, next: [21, 23], area: "commercial", type: "job", name: "バイト", isCustom: true },
        { id: 23, col: 12, row: 13, next: [4], area: "commercial", type: "manhole", name: "ﾏﾝﾎｰﾙ", isCustom: true },
        { id: 24, col: 18, row: 11, next: [25, 27], area: "commercial", type: "event", name: "イベント", isCustom: true },
        { id: 25, col: 19, row: 13, next: [26], area: "commercial", type: "koban", name: "交番", isCustom: true },
        { id: 26, col: 22, row: 12, next: [46], area: "luxury", type: "normal", name: "高級住宅", isCustom: true },
        { id: 27, col: 19, row: 9, next: [28], area: "luxury", type: "normal", name: "高級住宅", isCustom: true },
        { id: 28, col: 21, row: 9, next: [29, 30], area: "luxury", type: "event", name: "イベント", isCustom: true },
        { id: 29, col: 23, row: 7, next: [31], area: "luxury", type: "normal", name: "高級住宅", isCustom: true },
        { id: 30, col: 19, row: 7, next: [31, 36], area: "luxury", type: "shelter", name: "避難所", isCustom: true },
        { id: 31, col: 21, row: 6, next: [32, 35], area: "luxury", type: "event", name: "イベント", isCustom: true },
        { id: 32, col: 23, row: 4, next: [33], area: "luxury", type: "normal", name: "高級住宅", isCustom: true },
        { id: 33, col: 21, row: 2, next: [34], area: "luxury", type: "manhole", name: "ﾏﾝﾎｰﾙ", isCustom: true },
        { id: 34, col: 19, row: 3, next: [35, 37], area: "luxury", type: "event", name: "イベント", isCustom: true },
        { id: 35, col: 18, row: 5, next: [36], area: "luxury", type: "normal", name: "高級住宅", isCustom: true },
        { id: 36, col: 16, row: 6, next: [1, 40], area: "luxury", type: "koban", name: "交番", isCustom: true },
        { id: 37, col: 16, row: 2, next: [38], area: "luxury", type: "normal", name: "高級住宅", isCustom: true },
        { id: 38, col: 14, row: 2, next: [39, 42], area: "luxury", type: "normal", name: "高級住宅", isCustom: true },
        { id: 39, col: 16, row: 4, next: [35], area: "luxury", type: "shop", name: "ショップ", isCustom: true },
        { id: 40, col: 14, row: 4, next: [35, 41, 42], area: "luxury", type: "job", name: "バイト", isCustom: true },
        { id: 41, col: 13, row: 5, next: [40], area: "luxury", type: "job", name: "バイト", isCustom: true },
        { id: 42, col: 12, row: 3, next: [38, 43], area: "luxury", type: "event", name: "イベント", isCustom: true },
        { id: 43, col: 10, row: 2, next: [42, 44], area: "luxury", type: "job", name: "バイト", isCustom: true },
        { id: 44, col: 8, row: 1, next: [43], area: "luxury", type: "manhole", name: "ﾏﾝﾎｰﾙ", isCustom: true },
        { id: 45, col: 2, row: 1, next: [], area: "slum", type: "manhole", name: "ﾏﾝﾎｰﾙ", isCustom: true },
        { id: 46, col: 23, row: 10, next: [28], area: "luxury", type: "shop", name: "ショップ", isCustom: true }
    ];
}