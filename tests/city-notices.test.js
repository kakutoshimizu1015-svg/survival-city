import test from 'node:test';import assert from 'node:assert/strict';import {installCityNotices} from '../src/city-notices.js';
test('notices are serial, round beats take priority, choices hide notices, confirmed combat renders once',async()=>{
 const saved={document:globalThis.document,MutationObserver:globalThis.MutationObserver,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
 class Element{constructor(){this.dataset={};this.children=[];this.attrs={};this.hidden=false;this.innerHTML='';}setAttribute(k,v){this.attrs[k]=v;}append(el){el.parentNode=this;this.children.push(el);}remove(){}get textContent(){return this.innerHTML.replace(/<[^>]*>/g,'');}}
 const board=new Element(),root=new Element(),timers=new Map();let nextId=0;
 globalThis.document={createElement:()=>new Element(),querySelector:q=>q==='#board-area'?board:root,addEventListener:()=>{}};globalThis.MutationObserver=class{observe(){}};
 globalThis.setTimeout=fn=>{timers.set(++nextId,fn);return nextId};globalThis.clearTimeout=id=>timers.delete(id);
 let s={gamePhase:'playing',goldMode:true,players:[{id:0,name:'自分'}],eventPopups:[],cityCombat:[],turn:0},listeners=[];const store={getState:()=>s,subscribe:fn=>listeners.push(fn),setState:patch=>{s={...s,...patch};listeners.forEach(fn=>fn(s));}};
 const effects=[];let notices;
 try{
  notices=installCityNotices(store,null,()=>({showCombat:e=>effects.push(e.id)}));const panel=notices.panel;
  store.setState({eventPopups:[{id:1,playerId:0,title:'缶を拾った',detail:'1個'},{id:2,playerId:1,title:'カード獲得',detail:'バット'}]});await Promise.resolve();assert.match(panel.innerHTML,/缶を拾った/);assert.doesNotMatch(panel.innerHTML,/カード獲得/);
  const fn=[...timers.values()][0];fn();assert.match(panel.innerHTML,/カード獲得/);
  store.setState({_roundEndInProgress:true,cityBeat:{phase:'truck-move',title:'収集車が通ります',lines:['待とう'],focus:'truck'}});await Promise.resolve();assert.equal(panel.dataset.phase,'truck-move');assert.doesNotMatch(panel.innerHTML,/カード獲得/);
  store.setState({cityCombat:[{id:'hit',name:'自分',damage:50,pos:1,source:'収集車'}]});await Promise.resolve();assert.deepEqual(effects,['hit']);assert.match(panel.innerHTML,/収集車が通ります/);
  store.setState({settingsActive:true});await Promise.resolve();assert.equal(panel.hidden,true);store.setState({settingsActive:false});await Promise.resolve();assert.equal(panel.hidden,false);
  store.setState({cityBeat:null,_roundEndInProgress:false,cityCombat:[...s.cityCombat,{id:'attack',name:'相手',damage:20,pos:2,source:'バット',killPoints:0}]});await Promise.resolve();assert.match(panel.innerHTML,/相手に命中/);assert.doesNotMatch(panel.innerHTML,/＋2点/);assert.deepEqual(effects,['hit','attack']);
  store.setState({cityCombat:s.cityCombat});await Promise.resolve();assert.deepEqual(effects,['hit','attack']);
  store.setState({gamePhase:'title'});await Promise.resolve();assert.equal(panel.hidden,true);
 }finally{notices?.dispose();Object.assign(globalThis,saved);}
});
