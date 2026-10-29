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
  constructor(){this.parentNode=null;this.children=[];this._html='';this.writes=0;this.dataset={};const classes=new Set();this.classList={contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c)};nodes.push(this);}
  setAttribute(){}
  querySelectorAll(selector){if(selector!=='[data-taxi-position]')return [];if(!this.markers)this.markers=[...this._html.matchAll(/data-taxi-position="(\d+)"/g)].map(m=>({dataset:{taxiPosition:m[1]},style:{},hidden:true}));return this.markers;}
  set innerHTML(value){this.markers=null;this._html=value.replace(/\b(data-[\w-]+|disabled)(?=[\s>])/g,'$1=""');this.writes++;notify(this);}
  get innerHTML(){return this._html;}
  append(child){if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(n=>n!==child);child.parentNode=this;this.children.push(child);notify(this);}
 }
 const root=new Element(),body=new Element(),board=new Element(),panel=new Element();root.parentNode=body;board.parentNode=panel.parentNode=root;
 function notify(target){for(const observer of observers)for(let node=target;node;node=node.parentNode)if(node===observer.target&&observer.options.childList){pending.push(()=>observer.callback([{type:'childList',target}]));break;}}
 const host={getBoundingClientRect:()=>({left:10,top:20,width:400,height:400})};
 const document={body,createElement:()=>new Element(),querySelector:selector=>({'#root':root,'#board-area':board,'#action-panel':panel,'#game-board':host}[selector]||null)};
 class Observer{constructor(callback){this.callback=callback;}observe(target,options){this.target=target;this.options=options;observers.push(this);}}
 let animation=null,offset=0;const old=new Map();for(const [key,value] of Object.entries({requestAnimationFrame:fn=>{animation=fn;return 1},cancelAnimationFrame:()=>{animation=null},window:{cityProjection:{setCameraMode(){},overview(){},getCameraMode:()=> 'play',projectGrid:(col,row)=>({x:col*10+offset,y:row*10})}},document,MutationObserver:Observer,queueMicrotask:fn=>pending.push(fn)})){old.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});}
 const subscribers=[],networkSubscribers=[];let s={gamePhase:'playing',goldMode:true,roundCount:1,turn:0,diceRolled:false,turnOrderActive:true,mapData:createAtomBoard(),atom:initialAtomState(),players:[{id:0,userId:'human',pos:19,hp:100,ap:0,p:15,isCPU:false}]},net={status:'disconnected',isHost:true};
 const store={getState:()=>s,subscribe:fn=>subscribers.push(fn),setState:patch=>{s={...s,...patch};subscribers.forEach(fn=>fn(s));}},network={getState:()=>net,subscribe:fn=>networkSubscribers.push(fn)};
 return {store,network,panel,board,subscribers,nodes,install:()=>installAtomUI(store,network,{move(){},damage(){},log(){}}),
  tick(delta=0){offset=delta;animation?.();},
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
  f.store.setState({diceRolled:true,turnOrderActive:false});f.changePlayer({ap:8});f.flush();assert.ok(!controls.innerHTML.includes('disabled'));assert.ok(controls.innerHTML.includes('taxi-menu'));controls.onclick({target:{closest:()=>({dataset:{atomAction:'taxi-menu'}})}});f.flush();const taxi=f.nodes.find(n=>n.className==='atom-taxi-overlay');assert.equal(taxi.hidden,false);assert.match(taxi.innerHTML,/無料便/);assert.match(taxi.innerHTML,/有料便/);assert.match(taxi.innerHTML,/3P＋1AP/);taxi.onclick({target:{closest:()=>({hasAttribute:key=>key==='data-taxi-close'})}});f.flush();assert.equal(taxi.hidden,true);const writes=controls.writes;f.store.setState({logs:['unrelated log']});f.flush();assert.equal(controls.writes,writes);
  f.store.setState({atom:{...initialAtomState(),boss:{phase:'locked',strikeRound:3,targets:[1,2,3]}}});f.flush();assert.ok(alert.innerHTML.includes('R3'));assert.equal(alert.writes,2);
  f.setNet({status:'connected',myUserId:'spectator'});f.flush();assert.equal(controls.innerHTML,'');
  f.store.setState({cityBeat:{phase:'atom-warning'}});f.flush();assert.equal(alert.hidden,true);
  f.store.setState({gamePhase:'title'});f.flush();assert.equal(controls.hidden,true);
 }finally{f.restore();}
});

test('free guest sends no destination and paid map taps preview before confirmation',()=>{
 const f=fixture(),sent=[];try{f.install();f.store.setState({diceRolled:true,turnOrderActive:false});f.changePlayer({pos:1,ap:5,p:15});f.setNet({status:'connected',myUserId:'human',isHost:false,hostConnection:{send:message=>sent.push(message)}});f.flush();
 const controls=f.nodes.find(n=>n.className==='atom-actions'),open=()=>{controls.onclick({target:{closest:()=>({dataset:{atomAction:'taxi-menu'}})}});f.flush();},click=(attrs={},dataset={})=>taxi.onclick({target:{closest:()=>({hasAttribute:k=>!!attrs[k],dataset})}});open();
 const taxi=f.nodes.find(n=>n.className==='atom-taxi-overlay');assert.ok(!taxi.innerHTML.includes('data-taxi-position'));click({}, {taxiFlight:'taxi:free'});assert.equal(sent[0].payload.action,'taxi:free');assert.equal(taxi.hidden,true);assert.equal(f.store.getState().players[0].pos,1);
 open();click({'data-taxi-paid':true});f.flush();const ids=[...taxi.innerHTML.matchAll(/data-taxi-select="(\d+)"/g)].map(m=>Number(m[1]));assert.equal(ids.length,4);f.tick();const marker=taxi.querySelectorAll('[data-taxi-position]')[0],tile=f.store.getState().mapData.find(t=>t.id===ids[0]);assert.equal(marker.style.left,10+tile.col*10+'px');const writes=taxi.writes;f.tick(25);assert.equal(marker.style.left,35+tile.col*10+'px');assert.equal(taxi.writes,writes,'camera movement only repositions the markers');assert.ok(taxi.innerHTML.includes('data-taxi-position="1"'));
 assert.equal(window.cityTaxiSelectTile(ids[0]),true);f.flush();assert.equal(sent.length,1,'tap only previews');assert.match(taxi.innerHTML,new RegExp(ids[0]+'番へ'));
 click({'data-taxi-confirm':true});assert.equal(sent.length,2);assert.equal(sent[1].payload.action,'taxi:paid:'+ids[0]);assert.equal(taxi.hidden,true);assert.equal(f.store.getState().players[0].pos,1);
 open();click({'data-taxi-paid':true});window.cityTaxiSelectTile(ids[0]);f.store.setState({gold:{spot:ids[0],drops:{}}});f.flush();click({'data-taxi-confirm':true});assert.equal(sent.length,2,'a newly occupied gold space loses its selection');click({'data-taxi-close':true});assert.equal(window.cityTaxiSelectTile(ids[1]),false);
 }finally{f.restore();}
});
