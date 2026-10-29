import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAtomBoard,isAtom} from '../src/atom-map.js';
import {atomEconomyUpgrade,atomPlayerPatch,atomResource,atomCharacterText,atomCardDescription} from '../src/atom-economy.js';
import {initialAtomState,atomActions,atomActionRequest,executeAtomAction} from '../src/atom-rules.js';
import {atomCpuStep} from '../src/atom-cpu.js';
import {atomFlyoverPose} from '../src/atom-traffic.js';
function fixture(){
 let s={gamePhase:'playing',goldMode:true,diceRolled:true,roundCount:1,turn:0,mapData:createAtomBoard(),atom:initialAtomState(),gold:{spot:20},players:[{id:0,name:'A',hp:100,p:0,ap:30,pos:3,charType:'athlete',hand:[],maxHand:7,cans:0,trash:0,equip:{}},{id:1,name:'B',hp:100,p:0,ap:30,pos:3,charType:'athlete',hand:[],cans:0,trash:0,equip:{}}],showToast(){},addEventPopup(){}};
 const store={getState:()=>s,setState:patch=>{s={...s,...(typeof patch==='function'?patch(s):patch)};}};
 // Execute the generated store setters, not a separately reimplemented conversion.
 const source=readFileSync(new URL('../assets/useNetworkStore-CIe06z3C.js',import.meta.url),'utf8');
 const start=source.indexOf('updatePlayer:'),end=source.indexOf(',incrementGameStat:',start);
 Object.assign(s,new Function('e','atomPlayerPatch','return ({'+source.slice(start,end)+'})')(store.setState,atomPlayerPatch));
 const services={log(){},move:pos=>s.updateCurrentPlayer({pos}),damage(){throw Error('experiments pay HP directly without consuming shields');}};
 const use=kind=>executeAtomAction(store,s.players[s.turn].id,atomActionRequest(s,kind),services);
 return {store,services,use,p:()=>s.players[s.turn],setPlayer:patch=>s.updateCurrentPlayer(patch)};
}
test('64 spaces now include seven shops and three distinct direct-credit jobs',()=>{
 const map=createAtomBoard();assert.equal(map.length,64);assert.equal(map.filter(t=>t.type==='shop').length,7);assert.equal(map.filter(t=>['can','trash','exchange','job'].includes(t.type)).length,0);
 for(const [kind,n] of [['repair',4],['siphon',4],['trial',3]])assert.equal(map.filter(t=>t.atomKind===kind).length,n);
});
test('income is once per kind per own turn across different spaces; repeated/foreign/stale requests fail',()=>{
 const f=fixture(),request=atomActionRequest(f.store.getState(),'repair');assert.ok(f.use('repair'));assert.equal(f.p().p,6);assert.equal(f.p().ap,28);assert.equal(f.use('repair'),false);
 f.setPlayer({pos:13});assert.equal(f.use('repair'),false);assert.equal(executeAtomAction(f.store,1,request,f.services),false);
 f.store.setState({turn:1});assert.ok(f.use('repair'));assert.equal(f.p().p,6);
 f.store.setState({turn:0,roundCount:2});assert.ok(f.use('repair'));assert.equal(f.p().p,12);assert.equal(executeAtomAction(f.store,0,request,f.services),false);
 f.setPlayer({pos:5});const sector=f.store.getState().mapData[4].sector;assert.ok(f.use('siphon'));assert.equal(f.p().p,17);assert.equal(f.store.getState().atom.heat[sector],3);
});
test('gear and character bonuses apply, experiments cannot kill or consume defense gear, and bonus card pays once',()=>{
 const f=fixture();f.setPlayer({charType:'scavenger',equip:{shoes:true}});assert.ok(f.use('repair'));assert.equal(f.p().p,9);assert.equal(f.p().ap,29);
 f.setPlayer({pos:7,charType:'sales',hp:15,equip:{helmet:true,doll:true},atomIncomeBonus:true});assert.equal(f.use('trial'),false);assert.equal(f.p().p,9);assert.equal(f.p().atomIncomeBonus,true);
 f.setPlayer({hp:16});assert.ok(f.use('trial'));assert.equal(f.p().hp,1);assert.equal(f.p().p,28);assert.equal(f.p().atomIncomeBonus,false);assert.equal(f.p().equip.helmet,true);assert.equal(f.p().equip.doll,true);
 f.setPlayer({pos:41,ap:5});f.store.setState({atom:{...f.store.getState().atom,boss:{phase:'cooldown',cycle:1}}});assert.ok(f.use('reclaim'));assert.equal(f.p().p,43);assert.equal(f.use('reclaim'),false);
});
test('insufficient AP and open dialogs cannot earn; city resource updates are unchanged',()=>{
 const f=fixture();f.setPlayer({ap:1});assert.equal(f.use('repair'),false);f.setPlayer({ap:8});f.store.setState({isScavengerPicking:true});assert.equal(f.use('repair'),false);
 const modern={mapData:[]},p={p:10,cans:2,trash:1};assert.deepEqual(atomPlayerPatch(modern,p,{cans:3}),{cans:3});assert.equal(atomResource(modern,p,'cans'),2);
 f.store.setState({isScavengerPicking:false});f.setPlayer({cans:2,trash:1});assert.equal(f.p().p,7);assert.equal(f.p().cans,0);assert.equal(f.p().trash,0);
 f.setPlayer({cans:-2});assert.equal(f.p().p,3);assert.equal(atomResource(f.store.getState(),f.p(),'trash'),1);
});
function skills(f){
 let source=readFileSync(new URL('../assets/skills-CsxruNUN.js',import.meta.url),'utf8').replace(/import[^;]+;/g,'');source=source.slice(0,source.indexOf(';export'))+';return {craft:j,gun:P,ballista:B};';
 return new Function('e','t','n','r','i','atomResource','isAtom','drawGoldCard',source)(f.store,()=>{},()=>{},{getState:()=>({status:'disconnected'})},[],atomResource,isAtom,()=>18);
}
test('generated crafting and ammunition handlers use credits, not an invisible resource inventory',()=>{
 const f=fixture(),api=skills(f);f.setPlayer({charType:'scavenger',p:30});api.craft('junkgun');assert.equal(f.p().p,10);assert.deepEqual(f.p().hand,[48]);assert.equal(f.p().cans,0);
 const shot={id:48,handIndex:0,consumeTrash:3,dmg:10};api.gun(1,shot);assert.equal(f.p().p,1);assert.deepEqual(f.p().hand,[49]);assert.equal(f.p().trash,0);
 api.gun(1,shot);assert.equal(f.p().p,1,'stale weapon cannot charge or hit twice');
 f.setPlayer({charType:'emperor',p:20,ap:10,hand:[]});api.ballista([{id:1,name:'B'}],6);assert.equal(f.p().p,8);assert.equal(f.p().ap,8);assert.equal(f.p().cans,0);
 const before=f.p().p;api.ballista([{id:1}],-10);assert.equal(f.p().p,before,'invalid negative ammunition is rejected');
 assert.match(atomCharacterText(f.store.getState(),'emperor','passive',''),/所持P10/);assert.match(atomCardDescription(f.store.getState(),25),/修理/);
});
test('CPU earns with the same cap and seeks another job when poor',()=>{
 const f=fixture();f.setPlayer({isCPU:true,ap:12});assert.ok(atomCpuStep(f.store,f.services));assert.equal(f.p().p,6);assert.ok(atomCpuStep(f.store,f.services));assert.notEqual(f.p().pos,3);assert.equal(f.p().p,6);
 f.setPlayer({pos:7,hp:20,p:0});atomCpuStep(f.store,f.services);assert.equal(f.p().hp,20,'low HP CPU does not volunteer for experimentation');
});
test('flyovers cross the playable area above the roofs and leave long quiet intervals',()=>{
 assert.equal(atomFlyoverPose(0).visible,false);const p=atomFlyoverPose(15500);assert.ok(p.visible);assert.ok(Math.abs(p.x)<10&&Math.abs(p.z)<30&&p.y>25);
 assert.equal(atomFlyoverPose(28000).visible,false);assert.ok(atomFlyoverPose(36500,1).visible);assert.equal(atomFlyoverPose(50000,1).visible,false);
});

test('older ongoing atom games migrate once, keeping routes and cashing out existing inventory',()=>{
 const f=fixture(),s=f.store.getState();s.mapData[2]={...s.mapData[2],type:'can',atomKind:null};s.mapData[11]={...s.mapData[11],type:'exchange',atomKind:null};s.players[0]={...s.players[0],p:10,cans:3,trash:2};
 const patch=atomEconomyUpgrade(s);assert.equal(patch.players[0].p,22);assert.equal(patch.mapData[2].atomKind,'repair');assert.equal(patch.mapData[11].type,'shop');assert.deepEqual(patch.mapData[2].next,s.mapData[2].next);
 assert.equal(atomEconomyUpgrade({...s,...patch}),null);assert.equal(atomEconomyUpgrade({...s,mapData:[{type:'can'}]}),null);
});

test('generated market card becomes a single next-income bonus, while modern market and crafting stay unchanged',async()=>{
 const {goldCardBlock,cardAvailable,lastGoldRank}=await import('../src/card-balance.js');
 const f=fixture();f.store.setState({incrementGameStat(){}});f.setPlayer({hand:[40,40],p:3,isCPU:true});
 const source=readFileSync(new URL('../assets/cards-C7BZxg2n.js',import.meta.url),'utf8'),start=source.indexOf('var a='),end=source.indexOf(',o=e=>',start);
 const useCard=new Function('r','t','i','n','goldCardBlock','cardAvailable','lastGoldRank','isAtom','return '+source.slice(start+6,end))({getState:()=>({status:'disconnected'})},f.store,[{id:40,type:'action',name:'相場操作'}],()=>{},goldCardBlock,cardAvailable,lastGoldRank,isAtom);
 useCard(0,40);assert.equal(f.p().atomIncomeBonus,true);assert.equal(f.store.getState().fixedMarket,undefined);assert.equal(f.p().hand.length,1);
 useCard(0,40);assert.equal(f.p().hand.length,1,'cannot waste/stack a second bonus');assert.ok(f.use('repair'));assert.equal(f.p().p,14);assert.equal(f.p().atomIncomeBonus,false);
 f.store.setState({mapData:[{id:1,type:'normal'}]});useCard(0,40);assert.equal(f.store.getState().fixedMarket,true);
 f.setPlayer({charType:'scavenger',p:20,trash:3,cans:10,hand:[],ap:20});const api=skills(f);api.craft('equip');assert.equal(f.p().trash,0);assert.equal(f.p().p,20);api.craft('junkgun');assert.equal(f.p().cans,0);assert.equal(f.p().p,20);
});
