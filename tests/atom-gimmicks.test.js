import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAtomBoard,isAtom} from '../src/atom-map.js';
import {canOwnTile,territoryCleanup} from '../src/territory-rules.js';
import {atomEconomyUpgrade} from '../src/atom-economy.js';
import {initialAtomState,atomActions,atomActionRequest,executeAtomAction,atomTileDescription} from '../src/atom-rules.js';
import {taxiRoutes,taxiCooldown,terminalAvailable,terminalTurn} from '../src/atom-gimmicks.js';
import {atomStories,atomCpuStoryChoice} from '../src/atom-stories.js';
import {settleAtomCpuEvent} from '../src/atom-cpu.js';
import {routeTo} from '../src/gold-rules.js';
const engine=readFileSync(new URL('../assets/useNetworkStore-CIe06z3C.js',import.meta.url),'utf8');
function extract(start,end){const a=engine.indexOf(start),b=engine.indexOf(end,a);assert.ok(a>=0&&b>a);return engine.slice(a+start.indexOf('=')+1,b);}
function fixture(){let s={gamePhase:'playing',goldMode:true,diceRolled:true,turn:0,roundCount:1,mapData:createAtomBoard(),atom:initialAtomState(),gold:{spot:20,drops:{}},territories:{},territoryCosts:{},traps:[],players:[{id:0,name:'A',pos:1,hp:100,p:20,ap:20,hand:[],equip:{},charType:'athlete',deaths:0}],incrementGameStat(){},addEventPopup(){}};const store={getState:()=>s,setState:patch=>s={...s,...(typeof patch==='function'?patch(s):patch)}};s.updatePlayer=(id,patch)=>store.setState({players:s.players.map(p=>p.id===id?{...p,...typeof patch==='function'?patch(p):patch}:p)});s.updateCurrentPlayer=patch=>s.updatePlayer(s.players[s.turn].id,patch);const moves=[],logs=[],services={move:id=>{moves.push(id);s.updateCurrentPlayer({pos:id})},damage(){},log:m=>logs.push(m)};return {store,moves,logs,services,p:()=>s.players[s.turn],set:patch=>s.updateCurrentPlayer(patch),use:id=>executeAtomAction(store,0,atomActionRequest(s,id),services)};}
const network={getState:()=>({status:'disconnected'})};
test('only ten ordinary streets can be owned; host rejects every special space, modern map unchanged',()=>{
 const f=fixture(),map=f.store.getState().mapData;assert.equal(map.filter(canOwnTile).length,10);assert.equal(map.filter(t=>t.atomKind==='reclaim').length,4);assert.equal(map.filter(t=>t.atomKind==='terminal').length,4);
 for(let sector=0;sector<4;sector++)assert.ok(map.some(t=>t.sector===sector&&t.atomKind==='reclaim'));
 const claim=new Function('$','v','Y','Lt','G','canOwnTile','return '+extract('Rt=()=>',',zt=()=>'))(network,f.store,()=>{},()=>3,()=>{},canOwnTile);
 for(const tile of map.filter(t=>!canOwnTile(t))){f.set({pos:tile.id});const money=f.p().p;claim();assert.equal(f.p().p,money);assert.deepEqual(f.store.getState().territories,{});}
 const tile=map.find(canOwnTile);f.set({pos:tile.id});claim();assert.equal(f.store.getState().territories[tile.id],0);assert.equal(f.p().p,17);
 assert.ok(canOwnTile({type:'normal'}));for(const type of ['event','shop','shelter','manhole','koban','job','exchange'])assert.ok(!canOwnTile({type}));
});
test('existing games keep routes, refund invalid land once, and preserve valid ownership',()=>{
 const f=fixture(),s=f.store.getState(),map=s.mapData.map(t=>({...t}));map[31]={...map[31],atomKind:undefined,name:'屋上の未来街路'};map[56].noTerritory=undefined;
 f.store.setState({mapData:map,territories:{1:0,57:0,17:0},territoryCosts:{1:5,57:3,17:3}});f.store.setState(atomEconomyUpgrade(f.store.getState()));const patch=territoryCleanup(f.store.getState());f.store.setState(patch);
 assert.equal(f.p().p,28);assert.deepEqual(f.store.getState().territories,{17:0});assert.deepEqual(f.store.getState().territoryCosts,{17:3});assert.equal(territoryCleanup(f.store.getState()),null);assert.equal(atomEconomyUpgrade(f.store.getState()),null);assert.deepEqual(f.store.getState().mapData.map(t=>t.next),map.map(t=>t.next));
});
test('waste heat pays 4 normally, 12 under warning, 15 in cooldown; caps, bonuses and requests are enforced',()=>{
 const f=fixture();f.set({pos:14,p:0,ap:8});assert.ok(f.use('reclaim'));assert.equal(f.p().p,4);f.set({pos:41});assert.equal(f.use('reclaim'),false,'cannot farm another outlet');
 f.store.setState({roundCount:2,atom:{...f.store.getState().atom,boss:{phase:'locked',targets:[41],cycle:0,strikeRound:3}}});f.set({atomIncomeBonus:true});assert.ok(f.use('reclaim'));assert.equal(f.p().p,21);assert.equal(f.p().ap,6);assert.equal(f.p().atomIncomeBonus,false);assert.match(atomTileDescription(f.store.getState(),f.store.getState().mapData[40]),/R3/);
 f.store.setState({atom:{...f.store.getState().atom,boss:{phase:'cooldown',targets:[],cycle:1}}});assert.ok(f.use('reclaim'));assert.equal(f.p().p,36);assert.equal(f.use('reclaim'),false);
 f.store.setState({roundCount:3});assert.equal(f.use('reclaim'),false,'cooldown cap spans turns');f.store.setState({atom:{...f.store.getState().atom,boss:{phase:'cooldown',targets:[],cycle:2}}});f.set({ap:0});assert.equal(f.use('reclaim'),false);f.set({ap:1});assert.ok(f.use('reclaim'));assert.equal(f.p().p,51);
});
test('free taxi hides its destination until host execution and can land anywhere including danger',()=>{
 const f=fixture(),s=f.store.getState(),routes=taxiRoutes(s,f.p()),free=routes.find(a=>a.random);assert.equal(free.id,'taxi:free');assert.equal(free.to,undefined);assert.ok(!/番/.test(free.label+free.detail));
 f.set({p:0});const request=atomActionRequest(f.store.getState(),free.id);assert.ok(executeAtomAction(f.store,0,request,{...f.services,random:()=>0}));assert.equal(f.p().pos,2);assert.equal(f.p().p,0);assert.equal(f.p().ap,19);assert.equal(executeAtomAction(f.store,0,request,f.services),false);
 f.set({pos:1});f.store.setState({roundCount:3,atom:{...f.store.getState().atom,boss:{phase:'locked',targets:[64],strikeRound:2}},constructionPos:2});assert.ok(executeAtomAction(f.store,0,atomActionRequest(f.store.getState(),'taxi:free'),{...f.services,random:()=>.99999}));assert.equal(f.p().pos,64);assert.equal(f.p().ap,18);
 f.set({pos:1,ap:0});assert.equal(f.use('taxi:free'),false);assert.equal(f.use('taxi:free:6'),false,'client cannot choose a free destination');
});
test('paid candidates cover the map, never land on gold, and stale/forged destinations cannot spend money',()=>{
 const f=fixture(),s=f.store.getState();const routes=taxiRoutes(s,f.p()).filter(a=>!a.random);assert.equal(routes.length,4);assert.equal(new Set(routes.map(a=>s.mapData[a.to-1].sector)).size,4);
 const [sale,drop,forecast,blocked]=routes.map(a=>a.to);f.store.setState({gold:{spot:sale,nextSpot:forecast,drops:{[drop]:1}},constructionPos:blocked});const next=taxiRoutes(f.store.getState(),f.p()).filter(a=>!a.random);assert.ok(next.length>1);assert.ok(next.every(a=>![sale,drop,forecast,blocked].includes(a.to)));assert.ok(next.every(a=>a.p===3&&a.ap===1));
 for(const id of [sale,drop,forecast,blocked,999])assert.equal(f.use('taxi:paid:'+id),false);
 const target=next[0];f.set({p:2});assert.equal(f.use(target.id),false);f.set({p:3});assert.ok(f.use(target.id));assert.equal(f.p().p,0);assert.equal(f.p().pos,target.to);assert.equal(f.p().ap,19);
});
test('terminal host choices enforce HP/AP and one job per turn; decline is free and CPU never stalls',async()=>{
 const f=fixture();f.set({pos:4,hp:15,ap:2,p:0});f.store.setState({storyActive:true,storyIndex:4});const choose=new Function('v','$','isAtom','atomStories','Wt','Y','return '+extract('Gt=e=>',',Kt=e=>'))(f.store,network,isAtom,atomStories,[],m=>f.logs.push(m));
 choose(1);assert.equal(f.p().hp,15);assert.equal(f.store.getState().storyActive,true);choose(0);assert.equal(f.p().p,6);assert.equal(f.p().ap,0);assert.equal(f.store.getState().storyActive,false);choose(0);assert.equal(f.p().p,6);
 f.set({pos:24,ap:20});assert.equal(terminalAvailable(f.store.getState(),f.p(),'repair'),false);assert.equal(f.use('terminal'),false);
 f.store.setState({roundCount:2});f.set({hp:16,atomIncomeBonus:true,equip:{helmet:true,doll:true}});assert.ok(f.use('terminal'));choose(1);assert.equal(f.p().hp,1);assert.equal(f.p().p,23);assert.equal(f.p().atomIncomeBonus,false);assert.equal(f.p().equip.doll,true);
 f.store.setState({roundCount:3,storyActive:true,storyIndex:4});f.set({ap:0,isCPU:true});assert.equal(atomCpuStoryChoice(f.store.getState()),2);await settleAtomCpuEvent(f.store,choose,async()=>{});assert.equal(f.store.getState().storyActive,false);assert.equal(f.p().p,23);
 f.set({ap:4});f.store.setState({storyActive:true});assert.equal(atomCpuStoryChoice(f.store.getState()),0);await settleAtomCpuEvent(f.store,choose,async()=>{});assert.equal(f.p().p,29);
});
test('terminal arrival is deterministic and safe from post-death dialogs, without changing modern manholes',()=>{
 const f=fixture(),profile={getState:()=>({incrementStat(){},incrementNpcEncounter(){}})};
 const move=(encounter)=>new Function('v','$','e','Y','G','J','q','y','K','Math','onGoldDeath','isAtom','return '+extract('Nt=t=>',',Pt=()=>'))(f.store,network,profile,()=>{},()=>{},encounter,()=>{},()=>false,()=>99,Object.assign(Object.create(Math),{random:()=>.8}),()=>{},isAtom);
 move(()=>{})(4);assert.equal(f.store.getState().storyIndex,4);assert.equal(f.store.getState().storyActive,true);assert.ok(!f.store.getState().mgActive);
 f.store.setState({storyActive:false});f.set({pos:3,atomTerminalTurn:terminalTurn(f.store.getState())});move(()=>{})(4);assert.equal(f.store.getState().storyActive,false);
 f.set({pos:3,atomTerminalTurn:null});move(()=>f.set({pos:19,deaths:1}))(4);assert.equal(f.store.getState().storyActive,false);
 const modern={...f.store.getState(),mapData:[{id:1,type:'manhole',next:[2]},{id:2,type:'normal',next:[1]}]};assert.deepEqual(atomActions(modern,{...f.p(),pos:1}),[]);assert.equal(isAtom(modern),false);
});

test('taxi details render before the host initializes the new game',()=>{const s={mapData:createAtomBoard(),atom:null,players:[]};assert.match(atomTileDescription(s,s.mapData[0]),/無料便/);assert.equal(taxiRoutes(s,{pos:1}).filter(a=>!a.random).length,4);});

test('stand cooldown blocks both fares for everyone until exactly two circuits, not other stands',()=>{
 for(const fare of ['free','paid']){
  const f=fixture(),s=f.store.getState();f.store.setState({players:[s.players[0],{...s.players[0],id:1,isCPU:true},{...s.players[0],id:2}],turn:1});
  const action=taxiRoutes(f.store.getState(),f.p()).find(a=>fare==='free'?a.random:!a.random),request=atomActionRequest(f.store.getState(),action.id);
  assert.ok(executeAtomAction(f.store,1,request,f.services));assert.deepEqual(f.store.getState().atom.taxiCooldowns[1],{round:3,turn:1});
  for(const [round,turn,remaining] of [[1,1,2],[1,2,2],[2,0,2],[2,1,1],[2,2,1],[3,0,1]]){
   f.store.setState({roundCount:round,turn});f.set({pos:1});assert.equal(taxiCooldown(f.store.getState(),1).remaining,remaining);assert.deepEqual(taxiRoutes(f.store.getState(),f.p()),[]);
   const before={ap:f.p().ap,p:f.p().p};for(const id of ['taxi:free',action.id])assert.equal(executeAtomAction(f.store,f.p().id,atomActionRequest(f.store.getState(),id),f.services),false);assert.deepEqual({ap:f.p().ap,p:f.p().p},before);
   assert.match(atomTileDescription(f.store.getState(),s.mapData[0]),/全員/);
  }
  f.set({pos:10});assert.ok(taxiRoutes(f.store.getState(),f.p()).length>0);assert.equal(taxiCooldown(f.store.getState(),10),null);
  f.store.setState({roundCount:3,turn:1});f.set({pos:1});assert.equal(taxiCooldown(f.store.getState(),1),null);assert.ok(taxiRoutes(f.store.getState(),f.p()).length>0);
  const second=atomActionRequest(f.store.getState(),'taxi:free');assert.ok(executeAtomAction(f.store,1,second,f.services));assert.deepEqual(f.store.getState().atom.taxiCooldowns[1],{round:5,turn:1});
 }
});
test('failed bookings do not start a cooldown, old saves remain usable and fresh matches reset it',()=>{
 const f=fixture();f.set({ap:0});assert.equal(f.use('taxi:free'),false);assert.deepEqual(f.store.getState().atom.taxiCooldowns,{});
 f.set({ap:5,p:0});const paid=taxiRoutes(f.store.getState(),f.p()).find(a=>!a.random);assert.equal(f.use(paid.id),false);assert.equal(taxiCooldown(f.store.getState(),1),null);
 f.store.setState({atom:{...f.store.getState().atom,taxiCooldowns:undefined}});assert.ok(f.use('taxi:free'));f.store.setState({atom:initialAtomState()});assert.equal(taxiCooldown(f.store.getState(),1),null);
});
