import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
const {createCityBoard,CITY_BOARD}=await import(existsSync(new URL('../src/city-board-map.js',import.meta.url))?'../src/city-board-map.js':'../dist/src/city-board-map.js');
test('48 squares connect optional alleys and a four-way park with evenly spaced steps',()=>{
 const map=createCityBoard(),lookup=new Map(map.map(t=>[t.id,t]));
 assert.equal(map.length,48);assert.equal(new Set(map.map(t=>`${t.col}:${t.row}` )).size,48);
 assert.equal(map.filter(t=>t.next.length>1).length,9);
 for(const start of map){const visited=new Set(),queue=[start.id];while(queue.length){const id=queue.shift();if(visited.has(id))continue;visited.add(id);const tile=lookup.get(id);assert.ok(tile,`destination ${id} exists`);queue.push(...tile.next);}assert.equal(visited.size,map.length,`all squares reachable from ${start.id}`);}
 for(const tile of map){assert.ok(tile.next.length>=1&&tile.next.length<=4);for(const id of tile.next){const to=lookup.get(id);assert.equal(Math.hypot(to.col-tile.col,to.row-tile.row),1,'all steps have identical length');}}
 // The main circuit closes after 26 steps; its original forward exits are preserved.
 let current=map[0],steps=0;do{current=lookup.get(current.next[0]);steps++;assert.ok(steps<=map.length);}while(current!==map[0]);assert.equal(steps,26);
 assert.ok((Math.max(...map.map(t=>t.col))-Math.min(...map.map(t=>t.col)))*CITY_BOARD.spacing>=96);
 assert.ok((Math.max(...map.map(t=>t.row))-Math.min(...map.map(t=>t.row)))*CITY_BOARD.spacing>=60);
});
test('all original action-space types and six district warps remain usable',()=>{
 const map=createCityBoard();for(const type of ['center','can','trash','shop','job','exchange','event','shelter','manhole','koban','normal'])assert.ok(map.some(t=>t.type===type),type);
 const holes=map.filter(t=>t.type==='manhole');assert.equal(holes.length,6);assert.equal(new Set(holes.map(t=>t.area)).size,3);
 const hub=map.find(t=>t.name==='噴水広場');assert.equal(hub.next.length,4);
 const dirs=hub.next.map(id=>{const t=map.find(t=>t.id===id);return [t.col-hub.col,t.row-hub.row].join(',')}).sort();assert.deepEqual(dirs,['-1,0','0,-1','0,1','1,0']);
 for(const lane of ['camp','alley','park'])assert.ok(map.filter(t=>t.lane===lane).length>=3,lane);
 assert.ok(map.filter(t=>t.next.length===1).length/map.length>.8,'most spaces remain uninterrupted');
 const fresh=createCityBoard();map[0].next.length=0;assert.ok(fresh[0].next.length>0,'games do not share mutable map arrays');
});
