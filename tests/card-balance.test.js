import test from 'node:test';
import assert from 'node:assert/strict';
import {goldScore,goldCompare,goldRankOf} from '../src/gold-rules.js';
import {goldCpuStep} from '../src/gold-cpu.js';
import {RETIRED_CARD_IDS,cardAvailable,drawGoldCard,goldOpeningHand,lastGoldRank,goldComebackTarget,goldCardBlock,goldShopIds,goldShopPrice,shopPurchaseKey,basicWeaponStock,basicWeaponPurchasePatch} from '../src/card-balance.js';
const player=(id,score=0,p=10)=>({id,p,hp:100,goldCans:score,pvpKills:0,hand:[],maxHand:7,pos:1,teamColor:'none'});
const state=players=>({players,goldMode:true,turn:0,roundCount:1,mapData:[{id:1,type:'shop'}],purchasedCards:{}});
const cards=[{id:17,type:'weapon',dmg:10},{id:18,type:'weapon',dmg:20},...Array.from({length:51},(_,id)=>({id,type:'action'})).filter(c=>c.id!==17&&c.id!==18)];
test('comeback eligibility follows exactly the score then money ranking, including ties',()=>{
 const s=state([player(0,5,0),player(1,0,90),player(2,1,20)]);
 assert.equal(lastGoldRank(s,s.players[0]),false);assert.equal(lastGoldRank(s,s.players[1]),true);
 for(const id of [12,13,42])assert.match(goldCardBlock(s,s.players[0],id),/得点順位/);
 s.players[0].p=7;assert.equal(goldCardBlock(s,s.players[1],13),'');assert.equal(goldComebackTarget(s,s.players[1]).id,0);
 s.players=[player(0,0,4),player(1,0,4),player(2,0,8)];assert.ok(lastGoldRank(s,s.players[0])&&lastGoldRank(s,s.players[1]));assert.equal(lastGoldRank(s,s.players[2]),false);
 for(const p of s.players)assert.equal(lastGoldRank(s,p),s.players.every(q=>goldCompare(p,q)>=0));
 assert.deepEqual(s.players.map(p=>goldRankOf(s.players,p)),[2,2,1]);s.players[0].pvpKills=1;assert.equal(goldScore(s.players[0]),2);assert.equal(lastGoldRank(s,s.players[0]),false);
});
test('usurp targets highest-ranked enemy, never an ally or an easier rich second place',()=>{
 const s=state([player(0),player(1,3,0),player(2,1,100)]);assert.match(goldCardBlock(s,s.players[0],13),/奪えるP/);
 s.players[0].teamColor=s.players[1].teamColor='red';assert.equal(goldComebackTarget(s,s.players[0]).id,2);
 s.players=[player(0),player(1)];assert.match(goldCardBlock(s,s.players[0],13),/上位/);
});
test('all reward rolls omit retired cards; initial hands retain size and guarantee a bat',()=>{
 for(let i=0;i<1000;i++)assert.ok(cardAvailable(drawGoldCard(()=>i/1000)));
 const hand=goldOpeningHand([4,5,14],()=>.5);assert.equal(hand.length,3);assert.equal(hand[0],18);assert.ok(hand.every(cardAvailable));
 assert.ok(goldOpeningHand(Array.from({length:51},(_,id)=>id)).every(cardAvailable));
});
test('shop always has unique basic weapons, no retired cards or spent junk guns',()=>{
 for(let i=0;i<100;i++){const ids=goldShopIds(cards,()=>i/100);assert.deepEqual(ids.slice(0,2),[17,18]);assert.equal(ids.length,6);assert.equal(new Set(ids).size,6);assert.ok(ids.every(id=>cardAvailable(id)&&id<48));}
 for(const id of RETIRED_CARD_IDS)assert.match(goldCardBlock(state([]),player(0),id),/出現対象/);
});
test('basic weapon stock is shared by purchase paths, individual, and replenishes next round',()=>{
 let s=state([player(0,0,40),player(1)]);for(let i=0;i<4;i++){const buy=basicWeaponPurchasePatch(s,s.players[0],cards);assert.equal(buy.card.id,18);s={...s,...buy.patch};}
 assert.equal(basicWeaponStock(s,s.players[0],18),0);assert.equal(basicWeaponStock(s,s.players[1],18),4);assert.equal(s.players[0].p,24);
 assert.equal(s.purchasedCards[shopPurchaseKey(s,s.players[0],18)],4);
 s.roundCount++;assert.equal(basicWeaponStock(s,s.players[0],18),4);
 s.players[0].p=0;assert.equal(basicWeaponPurchasePatch(s,s.players[0],cards),null);
 s.players[0].p=20;s.players[0].maxHand=4;assert.equal(basicWeaponPurchasePatch(s,s.players[0],cards),null);
});
test('discounted basics cannot be bought below their resale value',()=>{
 for(const charType of ['sales','billionaire','athlete'])for(const c of cards.slice(0,2))assert.ok(goldShopPrice(c,{charType})>=2);
 assert.equal(goldShopPrice(cards[0],{}),3);assert.equal(goldShopPrice(cards[1],{}),4);
});
test('CPU buys basic weapons through the same price and stock rules',()=>{
 let s=state([{...player(0,0,10),isCPU:true,charType:'sales',ap:3}]);const store={getState:()=>s,setState:patch=>{s={...s,...patch};}};
 const services={cards,network:{getState:()=>({status:'disconnected'})},log:()=>{},sound:()=>{}};
 assert.equal(goldCpuStep(store,services),true);assert.deepEqual(s.players[0].hand,[18]);assert.equal(s.players[0].p,8);assert.equal(basicWeaponStock(s,s.players[0],18),3);
});
