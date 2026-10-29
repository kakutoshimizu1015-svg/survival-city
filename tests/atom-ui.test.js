import test from 'node:test';
import assert from 'node:assert/strict';
import {installAtomUI} from '../src/atom-ui.js';
import {createAtomBoard} from '../src/atom-map.js';
import {initialAtomState} from '../src/atom-rules.js';

// Simulate the DOM's HTML serialization and MutationObserver delivery, including
// empty attributes normalized to ="". Stop a feedback loop before it blocks Node.
function fixture(){
 const pending=[],observers=[],nodes=[];
 class Element {
  constructor(){this.parentNode=null;this.children=[];this._html='';this.writes=0;this.dataset={};this.classList={contains:()=>false};nodes.push(this);}
  setAttribute(){}
  set innerHTML(value){this._html=value.replace(/\b(data-[\w-]+|disabled)(?=[\s>])/g,'$1=""');this.writes++;notify(this);}
  get innerHTML(){return this._html;}
  append(child){if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(n=>n!==child);child.parentNode=this;this.children.push(child);notify(this);}
 }
 const root=new Element(),body=new Element(),board=new Element(),panel=new Element();root.parentNode=body;board.parentNode=panel.parentNode=root;
 function notify(target){for(const observer of observers)for(let node=target;node;node=node.parentNode)if(node===observer.target&&observer.options.childList){pending.push(()=>observer.callback([{type:'childList',target}]));break;}}
 const document={body,createElement:()=>new Element(),querySelector:selector=>({'#root':root,'#board-area':board,'#action-panel':panel}[selector]||null)};
 class Observer{constructor(callback){this.callback=callback;}observe(target,options){this.target=target;this.options=options;observers.push(this);}}
 const old=new Map();for(const [key,value] of Object.entries({document,MutationObserver:Observer,queueMicrotask:fn=>pending.push(fn)})){old.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});}
 const subscribers=[],networkSubscribers=[];let s={gamePhase:'playing',goldMode:true,roundCount:1,turn:0,diceRolled:false,turnOrderActive:true,mapData:createAtomBoard(),atom:initialAtomState(),players:[{id:0,userId:'human',pos:19,hp:100,ap:0,p:15,isCPU:false}]},net={status:'disconnected',isHost:true};
 const store={getState:()=>s,subscribe:fn=>subscribers.push(fn),setState:patch=>{s={...s,...patch};subscribers.forEach(fn=>fn(s));}},network={getState:()=>net,subscribe:fn=>networkSubscribers.push(fn)};
 return {store,network,panel,board,subscribers,nodes,install:()=>installAtomUI(store,network,{move(){},damage(){},log(){}}),
  setNet(patch){net={...net,...patch};networkSubscribers.forEach(fn=>fn(net));},
  flush(){let deliveries=0;while(pending.length){if(++deliveries>50)throw new Error('UI mutation feedback loop prevents the next animation frame');pending.shift()();}return deliveries;},
  changePlayer(patch){store.setState({players:store.getState().players.map(p=>({...p,...patch}))});},
  restore(){for(const [key,descriptor] of old)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
 };
}
test('starting District Zero settles the forecast DOM before the next animation frame',()=>{
 const f=fixture();try{f.install();f.flush();const alert=f.nodes.find(n=>n.className==='atom-threat');assert.ok(alert.innerHTML.includes('熱源を観測中'));assert.equal(alert.writes,1);
  for(let i=0;i<4;i++){f.store.setState({turnOrderActive:false});f.flush();}assert.equal(alert.writes,1,'unchanged state must not rewrite HTML');
 }finally{f.restore();}
});
test('equipment buttons settle when disabled and after becoming enabled; actual forecast changes still render',()=>{
 const f=fixture();try{f.install();f.flush();f.changePlayer({pos:1});f.flush();const controls=f.nodes.find(n=>n.className==='atom-actions'),alert=f.nodes.find(n=>n.className==='atom-threat');assert.ok(controls.innerHTML.includes('disabled=""'));
  f.store.setState({diceRolled:true,turnOrderActive:false});f.changePlayer({ap:8});f.flush();assert.ok(!controls.innerHTML.includes('disabled'));assert.ok(controls.innerHTML.includes('taxi-menu'));controls.onclick({target:{closest:()=>({dataset:{atomAction:'taxi-menu'}})}});f.flush();const taxi=f.nodes.find(n=>n.className==='atom-taxi-overlay');assert.equal(taxi.hidden,false);assert.match(taxi.innerHTML,/無料便/);assert.match(taxi.innerHTML,/有料便/);assert.match(taxi.innerHTML,/3P・1AP/);taxi.onclick({target:{closest:selector=>selector==='[data-taxi-close]'?{}:null}});f.flush();assert.equal(taxi.hidden,true);const writes=controls.writes;f.store.setState({logs:['unrelated log']});f.flush();assert.equal(controls.writes,writes);
  f.store.setState({atom:{...initialAtomState(),boss:{phase:'locked',strikeRound:3,targets:[1,2,3]}}});f.flush();assert.ok(alert.innerHTML.includes('R3'));assert.equal(alert.writes,2);
  f.setNet({status:'connected',myUserId:'spectator'});f.flush();assert.equal(controls.innerHTML,'');
  f.store.setState({cityBeat:{phase:'atom-warning'}});f.flush();assert.equal(alert.hidden,true);
  f.store.setState({gamePhase:'title'});f.flush();assert.equal(controls.hidden,true);
 }finally{f.restore();}
});

test('online guest chooses a visible fare through the host endpoint without changing local state',()=>{
 const f=fixture(),sent=[];try{f.install();f.store.setState({diceRolled:true,turnOrderActive:false});f.changePlayer({pos:1,ap:5,p:0});f.setNet({status:'connected',myUserId:'human',isHost:false,hostConnection:{send:message=>sent.push(message)}});f.flush();
 const controls=f.nodes.find(n=>n.className==='atom-actions');controls.onclick({target:{closest:()=>({dataset:{atomAction:'taxi-menu'}})}});f.flush();
 const taxi=f.nodes.find(n=>n.className==='atom-taxi-overlay'),free=taxi.innerHTML.match(/data-taxi-flight="(taxi:free:\d+)"/)[1];assert.match(taxi.innerHTML,/taxi:paid:[\d]+" disabled/);
 taxi.onclick({target:{closest:selector=>selector==='[data-taxi-flight]'?{dataset:{taxiFlight:free}}:null}});
 assert.equal(sent.length,1);assert.equal(sent[0].actionType,'ATOM_ACTION');assert.equal(sent[0].payload.action,free);assert.equal(sent[0].payload.pos,1);assert.equal(f.store.getState().players[0].pos,1);assert.equal(taxi.hidden,true);
 }finally{f.restore();}
});
