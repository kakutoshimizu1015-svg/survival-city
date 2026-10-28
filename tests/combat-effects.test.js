import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const THREE=new Function(readFileSync(new URL('../src/vendor/three.min.js',import.meta.url),'utf8')+';return THREE;')();import {createCombatEffects} from '../src/combat-effects.js';
test('impact and stolen gold stay on the board and clean up, including reduced motion',()=>{
 const saved=globalThis.document;globalThis.document={createElement:()=>({style:{},setAttribute(){},remove(){this.removed=true}})};
 try{for(const reduced of [false,true]){
  const T=THREE,scene=new T.Scene(),labels=[],host={dataset:{},append:el=>labels.push(el)},squares=new Map([[1,{x:10,z:10}],[2,{x:0,z:0}]]);
  const effects=createCombatEffects({T,scene,squares,elevation:()=>0,host,reduced,project:(x,y,z)=>({x:x*10,y:y*10+z})});
  effects.show({id:1,pos:1,fromPos:2,target:4,damage:30,goldStolen:1});assert.equal(effects.active(),true);assert.equal(scene.children.length,1);assert.equal(scene.children[0].children.length,2);
  effects.draw(performance.now()+700);assert.match(labels[0].textContent,/金缶＋1/);assert.match(labels[0].style.transform,/translate/);assert.equal(JSON.parse(host.dataset.combatEffects)[0].damage,30);
  const can=scene.children[0].children[1];assert.ok(can.position.x>=0&&can.position.x<=10);if(reduced)assert.equal(can.position.x,0);
  effects.draw(performance.now()+2000);assert.equal(effects.active(),false);assert.equal(scene.children.length,0);assert.equal(labels[0].removed,true);effects.dispose();
 }}finally{globalThis.document=saved;}
});
