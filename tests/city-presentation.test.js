import {isAtom} from "../src/atom-map.js";
import {advanceAtomThreat} from "../src/atom-rules.js";
import {pickNpcNext} from '../src/city-random.js';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {beginRound,roundWait,roundBeat,movingBeat,encounterBeat,finishRound,withCombat} from '../src/city-presentation.js';
import {createCityBoard} from '../src/city-board-map.js';
import {createGoldState,buyGoldPatch,goldRoundPatch,goldChase,goldDeathPatch} from '../src/gold-rules.js';
function memory(initial,onChange=()=>{}){let s=initial;const store={getState:()=>s,setState:patch=>{s={...s,...(typeof patch==='function'?patch(s):patch)};onChange(s);}};s={...s,updatePlayer:(id,patch)=>store.setState({players:s.players.map(p=>p.id===id?{...p,...(typeof patch==='function'?patch(p):patch)}:p)}),addEventPopup:()=>{}};return store;}
const fixture=()=>{const s={gamePhase:'playing',roundCount:1,maxRounds:20,mapData:createCityBoard(),players:[0,1,2].map(id=>({id,userId:'u'+id,pos:id+1,hp:100,p:30,hand:[],teamColor:'none'})),turn:0};return {...s,...createGoldState(s,()=>.25)};};
test('purchased gold reserves a public location; arriving early never rerolls it',()=>{let s=fixture();s.players[0].pos=s.gold.spot;s={...s,...buyGoldPatch(s,0,()=>.3)};const predicted=s.gold.nextSpot;assert.notEqual(predicted,null);assert.notEqual(predicted,s.gold.lastSpot);assert.equal(goldRoundPatch(s),null);s.players.forEach(p=>p.pos=predicted);s.roundCount++;assert.equal(goldRoundPatch({...s,_roundEndInProgress:true}),null);const patch=goldRoundPatch(s,()=>.99);assert.equal(patch.gold.spot,predicted);assert.equal(patch.gold.nextSpot,null);s.roundCount=19;s.gold.spot=predicted;s={...s,...buyGoldPatch(s,0)};assert.equal(s.gold.nextSpot,null);s.roundCount=20;assert.equal(goldRoundPatch(s),null);});
test('chase includes the P tiebreak and uses team scores in team games',()=>{let s=fixture();s.players[0]={...s.players[0],goldCans:1,p:10};s.players[1]={...s.players[1],goldCans:2,p:20};assert.equal(goldChase(s,s.players[0]).points,4);s.players[0].p=20;assert.equal(goldChase(s,s.players[0]).points,3);s.players[0].goldCans=2;assert.match(goldChase(s,s.players[0]).text,/同率首位/);s.players[0].p=19;assert.equal(goldChase(s,s.players[0]).points,1);assert.match(goldChase(s,s.players[0]).detail,/あと1P/);s.players[0].teamColor='red';s.players[2].teamColor='red';s.players[2].goldCans=1;assert.equal(goldChase(s,s.players[0]).team,true);assert.match(goldChase(s,s.players[0]).text,/いま首位/);});
test('combat reports only confirmed hits, captures death position and transferred gold',()=>{const s=fixture();s.players[1].goldCans=2;const store=memory(s);assert.equal(withCombat(store,()=>0,1,20,'バット',0),0);assert.equal(store.getState().cityCombat,undefined);const beforePos=s.players[1].pos;withCombat(store,()=>{store.setState(goldDeathPatch(store.getState(),1,0,beforePos));store.getState().updatePlayer(1,{deaths:1,pos:0,hp:100});return 120;},1,120,'バット',0);const event=store.getState().cityCombat[0];assert.equal(event.pos,beforePos);assert.equal(event.defeated,true);assert.equal(event.goldStolen,1);assert.equal(event.attacker,0);});
test('long reports show at most three facts, in order; reset cancels safely',async()=>{const beats=[],store=memory({...fixture(),goldMode:true},s=>{if(s.cityBeat)beats.push(s.cityBeat)}),id=beginRound(store);await roundBeat(store,id,'report','準備',['1','2','3','4','5'],null,2500,async()=>{});assert.deepEqual(beats.map(b=>b.lines),[['1','2','3'],['4','5']]);await assert.rejects(roundWait(store,id,1,async()=>store.setState({gamePhase:'title',cityRoundId:null})),{name:'RoundCancelled'});store.setState({_roundEndInProgress:true,cityRoundId:'new'});finishRound(store,id);assert.equal(store.getState()._roundEndInProgress,true);});
test('actual generated round: reports precede movement, collisions wait for arrival, vehicle results precede forecast',async()=>{
 const source=readFileSync(new URL('../assets/useNetworkStore-CIe06z3C.js',import.meta.url),'utf8'),start=source.indexOf('Ga=async()=>'),end=source.indexOf(',Z=!1',start);assert.ok(start>0&&end>start);
 let clock=0;const history=[],damageTimes=[];
 const s={...fixture(),truckPos:0,policePos:3,policeHp:10,policeCd:0,territories:{},players:[{...fixture().players[0],name:'自分',pos:1,equip:{},hp:100,penaltyAP:0}],gold:{spot:null,nextSpot:12,nextRound:2},animalPos:999,unclePos:999,yakuzaPos:999,loansharkPos:999,friendPos:999};
 const store=memory(s,state=>history.push({time:clock,phase:state.cityBeat?.phase,focus:state.cityBeat?.focus,pos:state.truckPos,police:state.policePos,round:state.roundCount,busy:state._roundEndInProgress}));
 const wait=async ms=>{clock+=ms},damage=(id,n)=>{damageTimes.push(clock);store.getState().updatePlayer(id,p=>({hp:p.hp-n}));};
 const names=['v','X','Y','G','Ua','q','J','Wa','Math','beginRound','roundWait','roundBeat','movingBeat','encounterBeat','finishRound','pickNpcNext','isAtom','advanceAtomThreat'];
 const run=new Function(...names,'return '+source.slice(start+3,end));
 const walk=(pos,n)=>({finalPos:pos===3?1:2,hitList:pos===3?[1]:[1,2],finalPrevPos:1});
 await run(store,wait,()=>{},()=>{},walk,damage,()=>{},()=>{},Object.assign(Object.create(Math),{random:()=>.1}),beginRound,roundWait,roundBeat,movingBeat,encounterBeat,finishRound,pickNpcNext,isAtom,advanceAtomThreat)();
 const stages=history.map(x=>x.phase).filter((p,i,a)=>p&&p!==a[i-1]);
 for(const name of ['report','truck-intro','truck-result','truck-end','police-intro','police-result','forecast'])assert.ok(stages.includes(name),name);
 assert.ok(stages.indexOf('report')<stages.indexOf('truck-intro'));assert.ok(stages.indexOf('truck-end')<stages.indexOf('police-intro'));assert.ok(stages.indexOf('police-result')<stages.indexOf('forecast'));
 const arrival=history.find(x=>x.phase==='truck-move'&&x.pos===1);assert.ok(damageTimes[0]-arrival.time>=500,'collision waits for the mesh to arrive');
 assert.equal(store.getState().players[0].hp,50);assert.equal(store.getState().players[0].penaltyAP,2);assert.equal(store.getState().roundCount,2);assert.equal(store.getState()._roundEndInProgress,false);assert.equal(store.getState().cityBeat,null);assert.equal(store.getState().disasterWarning,undefined);
});
test('classic mode keeps native round timing and outcomes; cancelling a paced round cannot resume in the title',async()=>{
 const patched=readFileSync(new URL('../assets/useNetworkStore-CIe06z3C.js',import.meta.url),'utf8'),original=readFileSync(new URL('../scripts/vendor/original-network-store.js',import.meta.url),'utf8');
 async function run(source,goldMode,cancel=false){
  const start=source.indexOf('Ga=async()=>'),end=source.indexOf(',Z=!1',start),names=['v','X','Y','G','Ua','q','J','Wa','Math','beginRound','roundWait','roundBeat','movingBeat','encounterBeat','finishRound','pickNpcNext','isAtom','advanceAtomThreat'];
  const factory=new Function(...names,'return '+source.slice(start+3,end));let clock=0,hits=0;
  const store=memory({...fixture(),goldMode,truckPos:0,policePos:3,policeHp:10,policeCd:0,territories:{},players:[{id:0,name:'自分',pos:1,p:20,hp:100,equip:{},penaltyAP:0}]});
  const wait=async ms=>{clock+=ms;if(cancel)store.setState({gamePhase:'title',cityRoundId:null,cityBeat:null,_roundEndInProgress:false});};
  await factory(store,wait,()=>{},()=>{},(pos,n)=>({finalPos:pos===3?1:2,hitList:pos===3?[1]:[1,2],finalPrevPos:1}),(id,n)=>{hits++;store.getState().updatePlayer(id,p=>({hp:p.hp-n}))},()=>{},()=>{},Object.assign(Object.create(Math),{random:()=>.1}),beginRound,roundWait,roundBeat,movingBeat,encounterBeat,finishRound,pickNpcNext,isAtom,advanceAtomThreat)();
  return {clock,hits,state:store.getState()};
 }
 const a=await run(original,false),b=await run(patched,false);assert.equal(a.clock,b.clock);assert.deepEqual(a.state.players,b.state.players);assert.equal(a.state.roundCount,b.state.roundCount);
 const cancelled=await run(patched,true,true);assert.equal(cancelled.hits,0);assert.equal(cancelled.state.gamePhase,'title');assert.equal(cancelled.state.roundCount,1);assert.equal(cancelled.state.cityBeat,null);
});
