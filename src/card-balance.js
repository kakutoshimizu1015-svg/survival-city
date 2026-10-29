import {goldCompare,sameTeam} from './gold-rules.js';

// Stable IDs preserve saves, equipment models and the classic game.
export const RETIRED_CARD_IDS=Object.freeze([4,5,9,10,11,14,43]);
export const BASIC_WEAPONS=Object.freeze([17,18]);
export const GOLD_COMMON_CARDS=Object.freeze([0,1,2,3,6,7,8,15,16,17,18,19,20,24,25,26,27,28,29,30,31,32,33,34]);
export const GOLD_RARE_CARDS=Object.freeze([12,13,35,36,37]);
export const cardAvailable=id=>Number.isInteger(id)&&id>=0&&id<=50&&!RETIRED_CARD_IDS.includes(id);
// Hosts also clean older/mixed-version state; guests receive the authoritative result.
export function retiredCardCleanupPatch(s){
 if(!s.goldMode)return null;
 const patch={};
 if(s.players.some(p=>p.hand?.some(id=>!cardAvailable(id))))patch.players=s.players.map(p=>p.hand?.some(id=>!cardAvailable(id))?{...p,hand:p.hand.filter(cardAvailable)}:p);
 if(s.goldShop?.ids?.some(id=>!cardAvailable(id)))patch.goldShop={...s.goldShop,ids:s.goldShop.ids.filter(cardAvailable),revision:(s.goldShop.revision||0)+1};
 return Object.keys(patch).length?patch:null;
}
const pick=(ids,random)=>ids[Math.min(ids.length-1,Math.floor(random()*ids.length))];
export function drawGoldCard(random=Math.random,rareChance=.05){return pick(random()<rareChance?GOLD_RARE_CARDS:GOLD_COMMON_CARDS,random);}
export function goldRewardCard(id,random=Math.random){return cardAvailable(id)?id:drawGoldCard(random);}
export function goldOpeningHand(hand=[],random=Math.random){
 if(hand.length>3)return hand.filter(cardAvailable); // Creative mode retains its full active catalogue.
 const next=hand.map(id=>goldRewardCard(id,random));next[0]=18;return next;
}
export function lastGoldRank(s,p){return !!p&&s.players.filter(a=>a.hp>0).every(a=>goldCompare(p,a)>=0);}
export function goldComebackTarget(s,p){
 return s.players.filter(a=>a.id!==p.id&&a.hp>0&&!sameTeam(a,p)&&goldCompare(a,p)<0).sort(goldCompare)[0]||null;
}
export function goldCardBlock(s,p,id){
 if(!s.goldMode)return '';
 if(!cardAvailable(id))return 'このカードは金缶争奪戦の出現対象から外れました。';
 if(id===40&&s.atom&&p.atomIncomeBonus)return '次の稼ぎの＋5Pが残っています。先に専用の稼ぎを使ってください。';
 if([12,13,42].includes(id)&&!lastGoldRank(s,p))return '得点順位が最下位のときだけ使えます（金缶×3＋対人キル×2、同点は所持P）。';
 if(id===13){const target=goldComebackTarget(s,p);if(!target)return '自分より上位の相手がいません。';if(target.p<=0)return '最上位の相手に奪えるPがありません。';}
 return '';
}
export function goldShopIds(cards,random=Math.random){
 const available=cards.filter(c=>cardAvailable(c.id)&&c.id<48&&!BASIC_WEAPONS.includes(c.id)).map(c=>c.id);
 const selected=[...BASIC_WEAPONS];
 while(selected.length<6&&available.length){const common=available.filter(id=>!GOLD_RARE_CARDS.includes(id)),rare=available.filter(id=>GOLD_RARE_CARDS.includes(id));const pool=random()<.02&&rare.length?rare:common.length?common:rare;const id=pick(pool,random);selected.push(id);available.splice(available.indexOf(id),1);}
 return selected;
}
export function goldShopPrice(card,player){const base=card.id===17?3:card.id===18?4:card.type==='weapon'?Math.max(5,(card.dmg||5)/5):card.type==='equip'?6:4;return Math.max(2,base-(player?.charType==='sales'?2:0));}
export function shopPurchaseKey(s,p,id){return s.goldMode&&BASIC_WEAPONS.includes(id)?`basic:${s.roundCount}:${p.id}:${id}`:String(id);}
export function shopVisitKey(s){return `${s.roundCount}:${s.turn}`;}
export function basicWeaponStock(s,p,id){return Math.max(0,4-(s.purchasedCards?.[shopPurchaseKey(s,p,id)]||0));}
export function basicWeaponPurchasePatch(s,p,cards){
 if(!s.goldMode||!p||p.id!==s.players[s.turn]?.id||s.mapData.find(t=>t.id===p.pos)?.type!=='shop'||p.hand.length>=(p.maxHand||7))return null;
 const card=[18,17].map(id=>cards.find(c=>c.id===id)).find(c=>c&&p.p>=goldShopPrice(c,p)&&basicWeaponStock(s,p,c.id)>0);
 if(!card)return null;
 const price=goldShopPrice(card,p),key=shopPurchaseKey(s,p,card.id);
 return {card,price,patch:{players:s.players.map(a=>a.id===p.id?{...a,p:a.p-price,hand:[...a.hand,card.id]}:a),purchasedCards:{...s.purchasedCards,[key]:(s.purchasedCards?.[key]||0)+1}}};
}
export function goldCardDescription(card){
 const descriptions={
  12:'得点順位が最下位限定。HPを半分消費し、敵全員の所持Pを半分にする（0AP）',
  13:'得点順位が最下位限定。自分より上位の敵のうち最上位から最大10P奪う（1AP）',
  42:'得点順位が最下位限定。8P獲得（0AP）',
  19:'射程1：30ダメージ＆次回AP−1（2AP・使い切り）',
  30:'50%でHP+20、50%で10ダメージ（HPは1未満にならない）',
  32:'50%でHP+30、50%で25ダメージ（HPは1未満にならない）',
  46:'5ターン、移動時20%で空き缶かゴミを1個獲得',
 };
 if(descriptions[card.id])return descriptions[card.id];
 if(card.type==='weapon'&&!card.isJunkGun)return `射程${card.range}：${card.aoe?'範囲内の敵全員に':''}${card.dmg}ダメージ（2AP・使い切り）`;
 return card.desc;
}
