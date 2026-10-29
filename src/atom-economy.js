import {isAtom} from './atom-map.js';
// Resource callbacks from shared events resolve directly to credits in District Zero.
// No hidden can/trash inventory or exchange step is retained.
export const atomResource=(s,p,kind)=>isAtom(s)?Math.floor(Math.max(0,p.p)/(kind==='cans'?2:3)):(p[kind]||0);
export function atomPlayerPatch(s,p,patch){
 if(!isAtom(s))return patch;
 let bonus=0;for(const [key,value] of [['cans',2],['trash',3]])if(Object.hasOwn(patch,key))bonus+=(patch[key]-(p[key]||0))*value;
 return {...patch,...(bonus?{p:Math.max(0,(patch.p??p.p)+bonus)}:{}),cans:0,trash:0};
}
export function atomCardDescription(s,id){
 if(!isAtom(s))return null;
 return {25:'廃ロボット修理が1APになる（装備）',40:'次の専用の稼ぎ1回に＋5P。重ねがけ不可。',41:'不要な手札1枚を6Pで売る',46:'5ターン、移動時20%で2Pまたは3P獲得',47:'見えない罠。15ダメージ＆確率で被害者に2Pの補償',48:'2AP＋Pを弾代にして撃つ。3回使える',49:'2AP＋Pを弾代にして撃つ。あと2回',50:'2AP＋Pを弾代にして撃つ。あと1回'}[id]||null;
}
export function atomCharacterText(s,id,kind,fallback){
 if(!isAtom(s))return fallback;
 const text={
  scavenger:{passive:'廃ロボット修理の報酬＋3P。',action:'3AP＋9Pでランダム装備、3AP＋20Pでジャンクガンを工作。弾代もPを使う。'},
  emperor:{passive:'所持P10以上：1手番6マスまで移動AP無料。20以上：被ダメージ30%減。30以上：手番終了時HP＋5。40以上：同マスの敵に3ダメージ。',action:'2AP＋Pで電力砲。6Pで10ダメージ、12Pで25、18Pで40、24Pで広範囲60ダメージ。'},
  sales:{passive:'人体実験の報酬＋2P。ショップの商品が2P引き（最低2P）。'}
 }[id];
 return kind==='infoDesc'&&text?Object.values(text).join(' / '):text?.[kind]||fallback;
}
export const ATOM_EARNINGS={repair:{name:'廃ロボット修理',icon:'🤖',ap:2,reward:6,heat:0},siphon:{name:'盗電',icon:'⚡',ap:1,reward:5,heat:3},trial:{name:'人体実験',icon:'🧪',ap:2,reward:12,heat:0,hp:15}};
export function atomEarning(s,p,kind){const a=ATOM_EARNINGS[kind];if(!a)return null;return {...a,ap:kind==='repair'&&p.equip?.shoes?1:a.ap,reward:a.reward+(kind==='repair'&&p.charType==='scavenger'?3:kind==='trial'&&p.charType==='sales'?2:0)+(p.atomIncomeBonus?5:0)};}
export const atomEarnKey=(s,p,kind)=>`${s.roundCount}:${s.turn}:${p.id}:${kind}`;
// Hosts upgrade a running older District Zero board once; IDs and routes stay intact.
export function atomEconomyUpgrade(s){
 if(!isAtom(s))return null;
 const old={can:['normal','repair','廃ロボット修理'],trash:['normal','siphon','盗電・電力の横流し'],job:['normal','trial','新薬の人体実験'],exchange:['shop',null,'廃品ロボット商店']},patch={};
 if(s.mapData.some(t=>old[t.type]))patch.mapData=s.mapData.map(t=>{const v=old[t.type];return v?{...t,type:v[0],atomKind:v[1],name:v[2]}:t;});
 if(s.players.some(p=>p.cans||p.trash))patch.players=s.players.map(p=>({...p,p:p.p+(p.cans||0)*2+(p.trash||0)*3,cans:0,trash:0}));
 return Object.keys(patch).length?patch:null;
}
