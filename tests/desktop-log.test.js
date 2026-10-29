import test from 'node:test';
import assert from 'node:assert/strict';
import {installDesktopLog} from '../src/desktop-log.js';
function fixture(){
 const pending=[],observers=[],nodes=[];
 function notify(target){for(const observer of observers)for(let n=target;n;n=n.parentNode)if(n===observer.target){pending.push(observer.callback);break;}}
 class Element{
  constructor(tag){this.tag=tag;this.children=[];this.parentNode=null;this._text='';this.writes=0;this.scrollTop=0;this.scrollHeight=0;this.events={};nodes.push(this);}
  setAttribute(){} addEventListener(type,fn){this.events[type]=fn;} focus(){this.focused=true;}
  set textContent(s){this._text=s;this.writes++;notify(this);} get textContent(){return this._text;}
  set innerHTML(s){this.content={textContent:s.replace(/<[^>]*>/g,'')};}
  append(...children){for(const child of children){child.parentNode=this;this.children.push(child);}notify(this);}
  prepend(child){if(child.parentNode)child.parentNode.children=child.parentNode.children.filter(n=>n!==child);child.parentNode=this;this.children.unshift(child);notify(this);}
  replaceChildren(...children){this.children=[];this.writes++;this.append(...children);}
 }
 const root=new Element('root');let host=new Element('aside');root.append(host);
 let state={gamePhase:'title',logs:[]};const subscribers=[],store={getState:()=>state,subscribe:fn=>subscribers.push(fn)};
 const old=new Map();for(const [key,value] of Object.entries({document:{querySelector:s=>s==='#root'?root:s==='#right-side-area'?host:null,createElement:t=>new Element(t)},MutationObserver:class{constructor(fn){this.callback=fn;}observe(target){this.target=target;observers.push(this);}},queueMicrotask:fn=>pending.push(fn)})){old.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});}
 function flush(){let count=0;while(pending.length){assert.ok(++count<50,'DOM observer must settle');pending.shift()();}}
 installDesktopLog(store);flush();
 return {nodes,flush,set(patch){state={...state,...patch};subscribers.forEach(fn=>fn());flush();},remount(){host=new Element('aside');root.append(host);flush();return host;},restore(){for(const [key,d] of old)if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key];}};
}
test('desktop history updates once, preserves reading position, remounts and resets on exit',()=>{
 const f=fixture();try{
  const panel=f.nodes.find(n=>n.className==='city-desktop-log'),latest=f.nodes.find(n=>n.className==='city-desktop-result'),history=f.nodes.find(n=>n.tag==='ol');
  assert.equal(panel.hidden,true);f.set({gamePhase:'playing',logs:['first','<b>second</b>']});
  assert.equal(panel.hidden,false);assert.equal(latest.textContent,'second');assert.deepEqual(history.children.map(x=>x.textContent),['second','first']);
  const writes=history.writes;f.set({ap:8});assert.equal(history.writes,writes);
  panel.open=true;history.scrollTop=74;f.set({logs:['first','second','third']});assert.equal(panel.open,true);assert.equal(history.scrollTop,74);assert.equal(latest.textContent,'third');
  const remounted=f.remount();assert.equal(panel.parentNode,remounted);assert.equal(history.writes,writes+1);
  panel.events.keydown({key:'Escape',preventDefault(){}});assert.equal(panel.open,false);assert.equal(panel.children[0].focused,true);
  f.set({gamePhase:'title'});assert.equal(panel.hidden,true);f.set({gamePhase:'playing',logs:[]});assert.equal(panel.open,false);assert.ok(history.children[0].textContent.includes('まだログ'));
 }finally{f.restore();}
});
