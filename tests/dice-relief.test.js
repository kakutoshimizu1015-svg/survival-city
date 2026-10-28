import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {diceRelief} from '../src/dice-relief.js';import {createGoldState} from '../src/gold-rules.js';import {createAtomBoard} from '../src/atom-map.js';
const source=readFileSync(new URL('../assets/useNetworkStore-CIe06z3C.js',import.meta.url),'utf8'),start=source.indexOf('jt=async'),end=source.indexOf(',Mt=',start);
function fixture(extra={}){let s={goldMode:true,diceRolled:false,turn:0,roundCount:3,territories:{},players:[{id:0,name:'A',ap:0,hp:100,p:15,hand:[],charType:'athlete',equip:{},...extra}]};let net={status:'disconnected'},numbers=[],logs=[],sent=[];const store={getState:()=>s,setState:patch=>s={...s,...patch}};s.updateCurrentPlayer=patch=>{s={...s,players:s.players.map((p,i)=>i===s.turn?{...p,...(typeof patch==='function'?patch(p):patch)}:p)}};s.addEventPopup=()=>{};const random=Object.assign(Object.create(Math),{random:()=>{assert.ok(numbers.length,'unexpected random draw');return numbers.shift()}}),roll=new Function('v','$','Y','G','q','Math','diceRelief','return '+source.slice(start+3,end))(store,{getState:()=>net},x=>logs.push(x),()=>{},()=>{},random,diceRelief);
 return {store,logs,sent,setNet:n=>net=n,async roll(faces){numbers=faces.map(n=>(n-1)/6+.001);s={...s,diceRolled:false,players:s.players.map(p=>({...p,ap:0}))};await roll();return s.players[0]},rollAgain:roll};}
test('low base dice grants exactly 2 next own roll, consumed once and kept out of explanations',async()=>{
 const f=fixture();assert.equal((await f.roll([1,2])).ap,3);assert.equal(f.store.getState().players[0]._lowRollRelief,2);assert.equal((await f.roll([3,5])).ap,10);assert.equal(f.store.getState().players[0]._lowRollRelief,0);assert.equal((await f.roll([3,5])).ap,8);const before=JSON.stringify(f.store.getState().players);await f.rollAgain();assert.equal(JSON.stringify(f.store.getState().players),before);assert.ok(!f.logs.some(x=>/救済|補正|前回|ボーナス/.test(x)));
});
test('threshold includes doubles and excludes equipment, penalties and previous relief',async()=>{
 const f=fixture({equip:{bicycle:true},penaltyAP:2});let p=await f.roll([1,1]);assert.equal(p.ap,4);assert.equal(p._lowRollRelief,2);
 p=await f.roll([2,4]);assert.equal(p.ap,10);assert.equal(p._lowRollRelief,2,'6 still qualifies even with previous +2 and equipment');
 p=await f.roll([2,2]);assert.equal(p.ap,12);assert.equal(p._lowRollRelief,0,'double 2 is 8 base AP');
 f.store.getState().updateCurrentPlayer({penaltyAP:8});p=await f.roll([3,5]);assert.equal(p.ap,2);assert.equal(p._lowRollRelief,0,'penalty cannot create a low dice roll');
});
test('guest requests do not consume relief; legacy disabled and new games reset it',async()=>{
 const f=fixture({_lowRollRelief:2});f.setNet({status:'connected',isHost:false,myUserId:'u',hostConnection:{send:x=>f.sent.push(x)}});await f.roll([]);assert.equal(f.sent[0].actionType,'ROLL_DICE');assert.equal(f.store.getState().players[0]._lowRollRelief,2);assert.deepEqual(diceRelief({goldMode:false},{_lowRollRelief:2},3),{bonus:0,next:0});
 const s={...f.store.getState(),mapData:createAtomBoard()};s.players[0].pos=19;assert.equal(createGoldState(s).players[0]._lowRollRelief,0);
});
test('third die is included in the base threshold; players do not share relief',async()=>{
 const f=fixture({charType:'gambler'});const p=await f.roll([1,2,1,5]);assert.equal(p.ap,8);assert.equal(p._lowRollRelief,0);
 assert.deepEqual(diceRelief({goldMode:true},{_lowRollRelief:0},9),{bonus:0,next:0});assert.deepEqual(diceRelief({goldMode:true},{_lowRollRelief:2},9),{bonus:2,next:0});
});
