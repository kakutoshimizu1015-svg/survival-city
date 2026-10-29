import {installGoldSession} from '../src/gold-session.js';
import test from 'node:test';import assert from 'node:assert/strict';
import {createCityBoard} from '../src/city-board-map.js';
import {createGoldState,goldScore,goldStandings,buyGoldPatch,goldDeathPatch,onGoldDeath,goldRoundPatch,pickupGoldPatch,routeTo,handleGoldPurchase,finishGoldGame} from '../src/gold-rules.js';
const fixture=()=>{const s={players:[0,1,2].map(id=>({id,pos:id+1,p:20,hp:100,teamColor:'none',goldCans:0,pvpKills:0})),mapData:createCityBoard(),turn:0,roundCount:1,maxRounds:20,gamePhase:'playing'};return {...s,...createGoldState(s,()=>.5)};};
test('spawn reachable by directed routes; excludes occupied/hospital tiles',()=>{const s=fixture();assert.ok(s.gold.spot);assert.ok(s.players.every(p=>p.pos!==s.gold.spot&&routeTo(s,p.pos,s.gold.spot)));assert.notEqual(s.mapData.find(t=>t.id===s.gold.spot).type,'center');});
test('purchase costs 10 once; validates turn/location/funds; next round respawn',()=>{let s=fixture();assert.equal(buyGoldPatch(s,0),null);s.players[0].pos=s.gold.spot;s.players[0].p=9;assert.equal(buyGoldPatch(s,0),null);s.players[0].p=10;assert.equal(buyGoldPatch(s,1),null);const patch=buyGoldPatch(s,0);assert.equal(patch.players[0].p,0);assert.equal(patch.players[0].goldCans,1);s={...s,...patch};assert.equal(buyGoldPatch(s,0),null);assert.equal(goldRoundPatch(s),null);s.roundCount=2;assert.ok(goldRoundPatch(s));s.roundCount=20;assert.equal(goldRoundPatch(s),null);});
test('PvP credits id zero but drops gold at the death space instead of transferring it',()=>{let s=fixture();s.players[1].goldCans=4;const p=goldDeathPatch(s,1,0,5);assert.deepEqual(p.players.map(p=>p.goldCans),[0,3,0]);assert.equal(p.gold.drops[5],1);assert.equal(p.players[0].pvpKills,1);assert.equal(p.gold.issued,0);s.players[1].goldCans=0;assert.equal(goldDeathPatch(s,1,0,5).players[0].pvpKills,1);assert.equal(goldDeathPatch(s,1,0,5).players[0].goldCans,0);});
test('environment death drops one; pickup removes it exactly once',()=>{let s=fixture();s.players[0].goldCans=2;s={...s,...goldDeathPatch(s,0,null,5)};assert.equal(s.players[0].goldCans,1);assert.equal(s.gold.drops[5],1);s.players[1].pos=5;const pick=pickupGoldPatch(s,1);assert.equal(pick.players[1].goldCans,1);assert.equal(pickupGoldPatch({...s,...pick},1),null);assert.equal(s.players[0].pvpKills,0);});
test('score ignores NPC kills and old points; money tiebreak, shared/team wins',()=>{const s=fixture();Object.assign(s.players[0],{goldCans:3,pvpKills:1,p:20});Object.assign(s.players[1],{goldCans:1,pvpKills:4,p:21});Object.assign(s.players[2],{goldCans:0,pvpKills:0,kills:100,npcKills:100,p:500});assert.equal(goldScore(s.players[0]),11);assert.deepEqual(goldStandings(s).results.map(p=>p.id),[1,0,2]);s.players[0].p=21;assert.deepEqual(goldStandings(s).winnerIds,[0,1]);s.players[0].teamColor='red';s.players[2].teamColor='red';assert.equal(goldStandings(s).sortedTeams[0].color,'red');assert.deepEqual(goldStandings(s).winnerIds,[0,2]);});
test('host purchase rejects wrong identity and guest mutation',()=>{let s=fixture();s.players[0].pos=s.gold.spot;s.players[0].userId='host';const store={getState:()=>s,setState:p=>s={...s,...p}},network={getState:()=>({status:'connected',isHost:true})};assert.equal(handleGoldPurchase(store,'guest',network,()=>{}),false);assert.equal(handleGoldPurchase(store,'host',{getState:()=>({status:'connected',isHost:false})},()=>{}),false);assert.equal(handleGoldPurchase(store,'host',network,()=>{}),true);assert.equal(s.players[0].p,10);});

test('fresh games draw from multiple fair gold locations, recent locations are excluded',()=>{
 const spots=new Set();for(let i=0;i<100;i++){const s=fixture();const next=createGoldState(s,()=>i/100);spots.add(next.gold.spot);assert.ok(s.players.every(p=>routeTo(s,p.pos,next.gold.spot)));}
 assert.ok(spots.size>=5,`only ${spots.size} distinct gold locations`);
 let s=fixture();s.gold={...s.gold,spot:null,nextRound:1,history:[4,5,6],lastSpot:6};for(let i=0;i<50;i++)assert.ok(!s.gold.history.includes(goldRoundPatch(s,()=>i/50).gold.spot));
});
test('finish goes directly to results with no awards and grants rewards once',()=>{
 let s=fixture();s.players[0]={...s.players[0],name:'自分',goldCans:3,pvpKills:1,cans:4};const money=s.players.map(p=>p.p),wins=[],rewards=[];
 const store={getState:()=>s,setState:patch=>{s={...s,...patch};}},services={network:{getState:()=>({status:'disconnected'})},profile:{getState:()=>({playerName:'自分',addGachaAssets:(...args)=>rewards.push(args)})},saveWin:score=>wins.push(score),log:()=>{},emoji:{}};
 finishGoldGame(store,services);assert.equal(s.gameOver,true);assert.equal(s.awardsActive,false);assert.equal(s.awardsData,null);assert.equal(s.pendingGameResult,null);assert.equal(s.gameResult.results[0].totalScore,11);assert.deepEqual(s.players.map(p=>p.p),money);assert.deepEqual(wins,[11]);assert.deepEqual(rewards,[[4,11]]);
 finishGoldGame(store,services);assert.equal(wins.length,1);assert.equal(rewards.length,1);
});
function liveSession(initial,net={status:'disconnected'}){
 let s=initial;const listeners=[],logs=[];
 const store={getState:()=>s,setState:patch=>{s={...s,...patch};for(const fn of listeners)fn(s);},subscribe:fn=>listeners.push(fn)};
 const network={getState:()=>net},log=t=>logs.push(t);
 installGoldSession(store,network,log,()=>{});
 return {store,logs,log,move(id,pos,extra={}){store.setState({players:s.players.map(p=>p.id===id?{...p,pos,...extra}:p)});},async flush(){for(let i=0;i<8;i++)await Promise.resolve();}};
}
test('ranged kills leave one free can; a third party can reach it first, with no P or AP fee',async()=>{
 const s=fixture();Object.assign(s.players[0],{name:'killer',ap:8});Object.assign(s.players[1],{name:'victim',goldCans:3,deaths:1,pos:19});s.gold.drops[8]=1;
 const f=liveSession(s);onGoldDeath(f.store,1,0,8,f.log);await f.flush();let now=f.store.getState();assert.equal(now.players[0].goldCans,0);assert.equal(now.players[0].pvpKills,1);assert.equal(now.players[1].goldCans,2);assert.equal(now.gold.drops[8],2);
 const p=now.players[2].p;f.move(2,8,{ap:5});await f.flush();now=f.store.getState();assert.equal(now.players[2].goldCans,2);assert.equal(now.players[2].p,p);assert.equal(now.players[2].ap,5);assert.equal(now.gold.drops[8],undefined);
 f.move(0,8);await f.flush();assert.equal(f.store.getState().players[0].goldCans,0);assert.ok(f.logs.some(t=>t.includes('無料で拾った')));
});
test('same-space kills collect immediately even outside the killer turn, while allies award no kill points',()=>{
 let s=fixture();s.turn=2;s.players[0].pos=8;s.players[1].goldCans=2;const store={getState:()=>s,setState:patch=>s={...s,...patch}};
 onGoldDeath(store,1,0,8,()=>{});assert.equal(s.players[0].goldCans,1);assert.equal(s.players[0].pvpKills,1);assert.equal(s.players[1].goldCans,1);assert.equal(s.gold.drops[8],undefined);
 s.players[0].teamColor=s.players[1].teamColor='red';onGoldDeath(store,1,0,8,()=>{});assert.equal(s.players[0].pvpKills,1);assert.equal(s.players[0].goldCans,2);
});
test('a respawn on a dropped can does not recover it; leaving and returning does',async()=>{
 const s=fixture();Object.assign(s.players[0],{pos:8,goldCans:2,deaths:0});const f=liveSession(s);
 f.move(0,8,{deaths:1,hp:100});onGoldDeath(f.store,0,null,8,f.log);await f.flush();assert.equal(f.store.getState().players[0].goldCans,1);assert.equal(f.store.getState().gold.drops[8],1);
 f.move(0,9);await f.flush();f.move(0,8);await f.flush();assert.equal(f.store.getState().players[0].goldCans,2);assert.equal(f.store.getState().gold.drops[8],undefined);
});
test('host resolves arrival order once; guests never mutate a synced drop',async()=>{
 const s=fixture();s.gold.drops[8]=1;s.players[0].isCPU=true;const f=liveSession(s,{status:'connected',isHost:true});
 f.move(2,8);f.move(0,8);await f.flush();assert.equal(f.store.getState().players[2].goldCans,1);assert.equal(f.store.getState().players[0].goldCans,0);
 const guestState=fixture();guestState.gold.drops[8]=1;const guest=liveSession(guestState,{status:'connected',isHost:false});guest.move(0,8);await guest.flush();assert.equal(guest.store.getState().gold.drops[8],1);assert.equal(guest.store.getState().players[0].goldCans,0);
});
test('a landing that kills the arriving pawn cannot award ground loot after respawn',async()=>{
 const s=fixture();s.gold.drops[8]=2;s.players[0].deaths=0;const f=liveSession(s);
 f.move(0,8);f.move(0,19,{deaths:1});await f.flush();assert.equal(f.store.getState().gold.drops[8],2);assert.equal(f.store.getState().players[0].goldCans,0);
});
