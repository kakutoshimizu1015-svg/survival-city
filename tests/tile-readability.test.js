import test from 'node:test';
import assert from 'node:assert/strict';
import {createAtomBoard} from '../src/atom-map.js';
import {taxiRoutes} from '../src/atom-gimmicks.js';
import {initialAtomState} from '../src/atom-rules.js';
import {tileVisualKey,tileVisual} from '../src/tile-visuals.js';
import {tileInfo,tileDetailHTML} from '../src/tile-info.js';
const map=createAtomBoard(),state={goldMode:true,mapData:map,atom:initialAtomState(),players:[]};
test('future city uses its own physical-space icons while modern city keeps its signs',()=>{
 for(const type of ['can','trash','shop','center','shelter','job','exchange','event','koban']){
  const atom=map.find(t=>t.type===type);assert.notEqual(tileVisual(tileVisualKey(atom)).path,tileVisual(type).path);assert.equal(tileVisualKey({type}),type);
 }
 for(const t of map.filter(t=>t.atomKind))assert.equal(tileVisualKey(t),t.atomKind);
});
test('tile instructions show actual destinations and retain advanced conditions as optional detail',()=>{
 const taxi=map.find(t=>t.id===1),info=tileInfo(state,taxi,{});assert.match(info.desc,/無料便/);assert.match(info.desc,/有料便/);assert.match(info.desc,/3P・1AP/);assert.match(info.notes,/行き先不明/);
 const switched=tileInfo({...state,atom:{...state.atom,power:1}},taxi,{});const routes=taxiRoutes({...state,atom:{...state.atom,power:1}},{pos:1});for(const route of routes.filter(a=>!a.random))assert.ok(switched.desc.includes(route.to+'番'));assert.ok(!switched.desc.includes('無料便 →'));assert.notEqual(switched.desc,info.desc);
 const chute=tileInfo(state,map.find(t=>t.id===47),{});assert.match(chute.desc,/14番/);
 const shop=tileInfo(state,map.find(t=>t.type==='shop'),{});assert.ok(shop.desc.length<shop.notes.length);assert.match(shop.notes,/手札/);
 const html=tileDetailHTML(taxi,{...info,title:'<img src=x>',notes:'<script>unsafe</script>'});assert.ok(!html.includes('<script>'));assert.match(html,/<details class="city-tile-notes">/);assert.ok(!html.includes('<details open'));
});
