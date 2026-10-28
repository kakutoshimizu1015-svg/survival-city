import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {beginRound,roundWait,roundBeat,movingBeat,encounterBeat,finishRound} from '../src/city-presentation.js';
import {pickNpcNext} from '../src/city-random.js';import {npcImpact} from '../src/npc-impact.js';
const engine=readFileSync(new URL('../assets/useNetworkStore-CIe06z3C.js',import.meta.url),'utf8'),skills=readFileSync(new URL('../assets/skills-CsxruNUN.js',import.meta.url),'utf8');
function extract(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a);return source.slice(a+start.indexOf('=')+1,b);}
function fixture(type='normal',fork=false){
 let state={goldMode:true,gamePhase:'playing',turn:0,roundCount:1,maxRounds:20,territories:{},traps:[],constructionPos:999,isRainy:true,players:[{id:0,name:'自分',userId:'human',charType:'athlete',hp:50,ap:8,p:10,pos:0,hand:[],cans:0,trash:0,equip:{},gameStats:{},respawnShield:0,nextMoveCostPenalty:2}],mapData:[{id:0,type:'normal',next:[1]},{id:1,type:'koban',next:[2]},{id:2,type:'event',next:fork?[3,4]:[3]},{id:3,type,next:[0]},{id:4,type:'normal',next:[0]}].map(t=>({...t,name:t.type,area:'slum'})),isBranchPicking:false,isDashPicking:false,currentBranchOptions:[]};
 for(const k of ['police','uncle','yakuza','loanshark','friend','animal'])Object.assign(state,{[k+'Pos']:999,[k+'Hp']:10,[k+'Cd']:0});
 const log=[],popups=[],stats=[],sent=[];let network={status:'disconnected',isHost:true};
 const store={getState:()=>state,setState:patch=>{state={...state,...(typeof patch==='function'?patch(state):patch)};}};
 const updatePlayer=(id,patch)=>store.setState({players:state.players.map(p=>p.id===id?{...p,...(typeof patch==='function'?patch(p):patch)}:p)});
 state={...state,updatePlayer,updateCurrentPlayer:patch=>updatePlayer(state.players[state.turn].id,patch),incrementGameStat:(id,key,n)=>stats.push([key,n]),addEventPopup:(...args)=>popups.push(args),showToast:text=>log.push(text)};
 const profile={getState:()=>({incrementStat:()=>{},incrementNpcEncounter:()=>{}})},net={getState:()=>network},sound=()=>{},say=x=>log.push(x),random=Object.assign(Object.create(Math),{random:()=>.1}),damage=(id,n)=>updatePlayer(id,p=>({hp:p.hp-n}));
 const encounter=new Function('v','e','q','Y','G','Math','return '+extract(engine,'J=t=>',',Y=e=>'))(store,profile,damage,say,sound,random);
 const move=new Function('v','$','e','Y','G','J','q','y','K','Math','onGoldDeath','return '+extract(engine,'Nt=t=>',',Pt=()=>'))(store,net,profile,say,sound,encounter,damage,()=>false,()=>99,random,()=>{});
 const dash=new Function('e','r','n','landDash','return '+extract(skills,'d=()=>',',f=()=>'))(store,net,say,move);
 return {store,move,dash,log,popups,stats,random,damage,net,setNet:value=>network=value,sent};
}
test('automatic dash lands on events and friendly NPCs, pays exactly 3 AP, skips intermediate squares',()=>{
 const f=fixture('event');f.store.setState({friendPos:3,yakuzaPos:1,traps:[{tileId:2,ownerId:9,type:'bottle'}]});f.dash();const s=f.store.getState(),p=s.players[0];
 assert.equal(p.pos,3);assert.equal(p.ap,5);assert.equal(p.hp,50);assert.equal(p.cannotMove,undefined);assert.equal(p.cans,1);assert.equal(p.nextMoveCostPenalty,2);assert.equal(s.friendCd,2);assert.equal(s.storyActive,true);assert.equal(s.traps.length,1);assert.deepEqual(f.stats,[['tiles',3]]);assert.equal(s.isDashPicking,false);
});
test('chosen dash landing triggers hospital, police box, traps and NPC effects exactly once',()=>{
 for(const type of ['center','koban','normal']){
  const f=fixture(type,true);f.store.setState({friendPos:3,traps:type==='normal'?[{tileId:3,ownerId:9,type:'bottle'}]:[]});f.dash();assert.equal(f.store.getState().players[0].pos,0);assert.equal(f.store.getState().isDashPicking,true);f.move(999);assert.equal(f.store.getState().isDashPicking,true);f.move(3);
  const s=f.store.getState(),p=s.players[0];assert.equal(p.cans,1);assert.equal(s.friendCd,2);assert.equal(s.isDashPicking,false);assert.equal(p.ap,type==='koban'?0:5);
  if(type==='center')assert.equal(p.hp,80);if(type==='koban')assert.equal(p.cannotMove,true);if(type==='normal'){assert.equal(p.hp,35);assert.equal(s.traps.length,0);}
 }
});
test('guest dash requests resolve on host through the same landing function',()=>{
 const host=fixture('event',true),guest=fixture('event',true);const sent=[];
 guest.setNet({status:'connected',isHost:false,myUserId:'human',hostConnection:{send:msg=>sent.push(msg)}});guest.dash();assert.equal(sent[0].actionType,'ACTION_DASH');assert.equal(guest.store.getState().players[0].ap,8);
 host.store.setState({friendPos:3});host.dash();guest.store.setState({players:host.store.getState().players,isDashPicking:true,isBranchPicking:true,currentBranchOptions:[3,4]});guest.move(3);
 assert.equal(sent[1].actionType,'EXECUTE_MOVE');assert.equal(guest.store.getState().players[0].pos,0);host.move(sent[1].payload);assert.equal(host.store.getState().players[0].ap,5);assert.equal(host.store.getState().players[0].cans,1);assert.equal(host.store.getState().storyActive,true);
});
test('truck route cannot damage resting players or consume dolls; exposed players still take damage',async()=>{
 const f=fixture('shelter');f.store.setState({truckPos:0,policeHp:0,players:[{...f.store.getState().players[0],pos:3,hp:100,equip:{doll:true}},{...f.store.getState().players[0],id:1,name:'相手',pos:0,hp:100}],gold:{},cityBeat:null});
 const factory=new Function('v','X','Y','G','Ua','q','J','Wa','Math','beginRound','roundWait','roundBeat','movingBeat','encounterBeat','finishRound','pickNpcNext','return '+extract(engine,'Ga=async()=>',',Z=!1'));
 const beats=[];await factory(f.store,async()=>{const beat=f.store.getState().cityBeat;if(beat)beats.push(beat);},()=>{},()=>{},()=>({finalPos:0,hitList:[3,0,3],finalPrevPos:3}),f.damage,()=>{},()=>{},f.random,beginRound,roundWait,roundBeat,movingBeat,encounterBeat,finishRound,pickNpcNext)();
 const [safe,exposed]=f.store.getState().players;assert.equal(safe.hp,100);assert.equal(safe.equip.doll,true);assert.equal(exposed.hp,50);assert.ok(beats.some(b=>b.lines?.some(l=>l.includes('休憩所'))));assert.equal(npcImpact(f.store.getState(),'truck',safe,{type:'shelter'}).tone,'good');
});
