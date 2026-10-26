import test from 'node:test';import assert from 'node:assert/strict';
import {createCityBoard} from '../src/city-board-map.js';
import {randomCityState,npcWalk,NPC_KEYS} from '../src/city-random.js';
const state={mapData:createCityBoard(),players:[{pos:1},{pos:24}],gold:{spot:12}};
const seeded=seed=>()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
test('opening enemies vary between games and avoid players and each other',()=>{
 const starts=new Set();for(let seed=1;seed<=60;seed++){const s=randomCityState(state,seeded(seed));const positions=NPC_KEYS.map(k=>s[k+'Pos']);starts.add(positions.join(','));assert.equal(new Set(positions).size,7);assert.ok(positions.every(id=>state.mapData.some(t=>t.id===id)&&!state.players.some(p=>p.pos===id)&&id!==12));}
 assert.ok(starts.size>40);
});
test('patrols vary at forks, follow road arrows and avoid immediate return where possible',()=>{
 const start=state.mapData.find(t=>t.next.length===4).id,paths=new Set();for(let seed=1;seed<=100;seed++){const s={...state,...randomCityState(state,seeded(seed))},walk=npcWalk(s,start,12,-1,seeded(seed*7919));paths.add(walk.hitList.join(','));let previous=-1,pos=start;for(const next of walk.hitList){const choices=state.mapData.find(t=>t.id===pos).next;assert.ok(choices.includes(next));if(choices.some(id=>id!==previous))assert.notEqual(next,previous);previous=pos;pos=next;}}
 assert.ok(paths.size>=6);
});
