import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shopTransaction,shopCatalog} from '../src/shop-rules.js';
const cards=[17,18,24,25,26,46,6,8].map(id=>({id,type:[17,18].includes(id)?'weapon':'equip',dmg:20}));
function setup(){let s={goldMode:true,gamePhase:'playing',roundCount:1,turn:0,mapData:[{id:11,type:'shop'},{id:12,type:'normal'}],players:[{id:0,pos:11,charType:'athlete',p:50,hand:[],maxHand:7}],purchasedCards:{}};s={...s,...shopTransaction(s,cards,'OPEN',{},0,()=>.1).patch};return s;}
function request(s,more={}){return {id:'request1',key:'1:0',revision:s.goldShop.revision,cart:{18:2},...more};}
test('purchase atomically updates hand, wallet and stock; retries never charge twice',()=>{let s=setup(),q=request(s),r=shopTransaction(s,cards,'BUY',q,0);assert.equal(r.ok,true);s={...s,...r.patch};assert.deepEqual(s.players[0].hand,[18,18]);assert.equal(s.players[0].p,42);assert.equal(shopCatalog(s,s.players[0],cards).find(c=>c.id===18).stock,2);assert.equal(shopTransaction(s,cards,'BUY',q,0).duplicate,true);assert.equal(shopTransaction(s,cards,'BUY',request(s,{id:'new',revision:0}),0).ok,false);});
test('reject offturn, offshop, unavailable, invalid quantity, funds, and capacity',()=>{const s=setup();assert.equal(shopTransaction(s,cards,'BUY',request(s),1).ok,false);for(const cart of [{18:0},{18:-1},{18:1.5},{18:5},{999:1},{'018':1}])assert.equal(shopTransaction(s,cards,'BUY',request(s,{cart}),0).ok,false);for(const patch of [{pos:12},{p:1},{maxHand:1}])assert.equal(shopTransaction({...s,players:[{...s.players[0],...patch}]},cards,'BUY',request(s),0).ok,false);});
test('selling removes only selected instances; invalid and duplicated tokens fail',()=>{let s=setup();s.players[0].hand=[18,18,24];for(const selection of [['0_18','0_18'],['2_18']])assert.equal(shopTransaction(s,cards,'SELL',request(s,{selection}),0).ok,false);const r=shopTransaction(s,cards,'SELL',request(s,{selection:['1_18']}),0);assert.deepEqual(r.patch.players[0].hand,[18,24]);assert.equal(r.patch.players[0].p,52);});
test('shuffle costs 3P once, opening again keeps stock, next round resets basics',()=>{let s=setup();s={...s,...shopTransaction(s,cards,'BUY',request(s,{cart:{18:4}}),0).patch};const r=shopTransaction(s,cards,'SHUFFLE',request(s,{id:'shuffle'}),0);s={...s,...r.patch};assert.equal(s.players[0].p,31);assert.equal(shopTransaction(s,cards,'SHUFFLE',request(s,{id:'second'}),0).ok,false);assert.deepEqual(shopTransaction(s,cards,'OPEN',{},0).patch,{});assert.equal(shopCatalog(s,s.players[0],cards).find(c=>c.id===18).stock,0);s.roundCount++;s={...s,...shopTransaction(s,cards,'OPEN',{},0).patch};assert.equal(shopCatalog(s,s.players[0],cards).find(c=>c.id===18).stock,4);});
test('hacker requires paid turn access; salesperson prices and billionaire rebate survive',()=>{let s=setup();s.players[0].pos=12;s.players[0].charType='hacker';assert.equal(shopTransaction(s,cards,'OPEN',{},0).ok,false);s.shopAccess='1:0';assert.equal(shopTransaction(s,cards,'OPEN',{},0).ok,true);s=setup();s.players[0].charType='sales';assert.equal(shopTransaction(s,cards,'BUY',request(s),0).patch.players[0].p,46);s.players[0].charType='billionaire';assert.equal(shopTransaction(s,cards,'BUY',request(s,{cart:{18:4}}),0).patch.players[0].p,35);});

// Exercise the generated receive hook with the real lexical scope of the peer callback.
test('host receive hook binds SHOP requests to the actual peer before the legacy local scope',async()=>{
 const {readFileSync}=await import('node:fs');const source=readFileSync(new URL('../assets/useNetworkStore-CIe06z3C.js',import.meta.url),'utf8');
 const start=source.indexOf('if(r.type===`REQUEST_ACTION`&&r.actionType?.startsWith(`SHOP_`))');assert.ok(start>0);
 const end=source.indexOf('if(r.type===`REQUEST_ACTION`){',start+1);assert.ok(end>start);
 const hook=source.slice(start,end);const receive=new Function('r','e','n','v','handleShopAction',hook+'if(r.type===`REQUEST_ACTION`){let e=v.getState();return e;}');
 const state=setup();state.players[0].userId='guest';let called=0;
 const handler=(store,action,payload,id)=>{called++;assert.equal(action,'BUY');assert.equal(id,0);};
 const packet={type:'REQUEST_ACTION',actionType:'SHOP_BUY',userId:'guest',payload:request(state)};
 receive(packet,{guestUserId:'guest'},()=>({isHost:true}),{getState:()=>state},handler);assert.equal(called,1);
 receive(packet,{guestUserId:'other'},()=>({isHost:true}),{getState:()=>state},handler);
 receive(packet,{guestUserId:'guest'},()=>({isHost:false}),{getState:()=>state},handler);assert.equal(called,1);
});
test('stale offers cannot display or sell retired cards, even before host cleanup',()=>{
 const s=setup(),catalog=[...cards,{id:5,type:'action'},{id:43,type:'action'}];s.goldShop.ids=[17,18,5,43,999];
 assert.deepEqual(shopCatalog(s,s.players[0],catalog).map(c=>c.id),[17,18]);
 for(const id of [5,43,999]){const result=shopTransaction(s,catalog,'BUY',request(s,{cart:{[id]:1}}),0);assert.equal(result.ok,false);assert.equal(result.patch?.players,undefined);}
});
