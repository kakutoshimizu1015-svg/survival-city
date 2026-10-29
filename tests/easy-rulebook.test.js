import {atomCardDescription} from '../src/atom-economy.js';
import {isAtom} from "../src/atom-map.js";
import {ATOM_NPCS} from "../src/atom-rules.js";
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {GOLD_TILE_RULES,WORLD_RULES} from '../src/rule-details.js';import {NPC_INFO,npcImpact} from '../src/npc-impact.js';import {cardAvailable,goldCardDescription} from '../src/card-balance.js';
test('help renders a short overview and retains detailed cards, NPCs and minigames under disclosures',()=>{
 const source=readFileSync(new URL('../src/gold-rulebook.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function GoldRulebook','function GoldRulebook');
 const component=new Function('GOLD_TILE_RULES','WORLD_RULES','NPC_INFO','npcImpact','characters','cardAvailable','goldCardDescription','PixelItemIcon','isAtom','ruleStore','ATOM_NPCS','atomCardDescription',source+';return GoldRulebook;')(GOLD_TILE_RULES,WORLD_RULES,NPC_INFO,npcImpact,[],cardAvailable,goldCardDescription,'pixel-icon',isAtom,{getState:()=>({})},ATOM_NPCS,atomCardDescription);
 const R={createElement:(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),useRef:()=>({}),useEffect:()=>{}};
 const catalog=readFileSync(new URL('../scripts/vendor/original-card-catalog.js',import.meta.url),'utf8');const cards=new Function('return '+catalog.slice(catalog.indexOf('var e=')+6,catalog.lastIndexOf(';export')))();
 const tree=component({react:R,cards,miniGames:[{name:'箱選び',desc:'当たりの箱をタッチ。'}],onClose:()=>{}}),nodes=[];
 const walk=n=>{if(!n||typeof n!=='object')return;assert.ok(n.type,'all children are valid React nodes');nodes.push(n);n.children.forEach(walk)};walk(tree);
 assert.equal(nodes.filter(n=>n.props['data-rule-card']!==undefined).length,44);assert.ok(nodes.find(n=>n.props['data-rule-section']==='NPC'));assert.ok(nodes.find(n=>n.props['data-rule-section']==='ミニゲーム'));
 const body=nodes.find(n=>n.props.className==='gold-rulebook-body');assert.equal(body.children.filter(n=>n.type==='p').length,1);assert.equal(nodes.find(n=>n.props.className==='easy-rule-steps').children.length,3);
 const runtime=readFileSync(new URL('../assets/original-city-runtime.js',import.meta.url),'utf8');assert.equal(runtime.match(/children:`📖 あそびかた`/g)?.length,2);assert.ok(!runtime.includes('children:`🎓 チュートリアル`'));assert.ok(!runtime.includes('onClick:()=>r({tutorialActive:!0,settingsActive:!1})'));
});
