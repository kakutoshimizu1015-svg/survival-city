const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const p=await browser.newPage({viewport:{width:1400,height:950},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.BASE_URL||'http://localhost:8000');
 await p.evaluate(async()=>{const {I:s}=await import('./assets/useNetworkStore-CIe06z3C.js'),{originalMap}=await import('./assets/original-city-runtime.js'),{r:use}=await import('./assets/cards-C7BZxg2n.js');window.itemStore=s;window.useTestCard=id=>use(s.getState().players[0].hand.indexOf(id),id);s.setState({gamePhase:'playing',mapData:originalMap(),players:[0,1].map(id=>({id,name:id?'相手':'装備テスト',charType:id?'sales':'athlete',color:id?'#71bce1':'#dfbd77',isCPU:false,teamColor:'none',skinId:'default',pos:24,hp:id?100:60,p:30,ap:100,hand:id?[]:[46,8,28,27,17,18,19,20,21,23,30,34,15],maxHand:20,cans:0,trash:0,kills:0,deaths:0,equip:{}})),turn:0,diceRolled:true,turnOrderActive:false,turnBannerActive:false,truckPos:-1,policePos:-1,unclePos:-1,animalPos:-1,yakuzaPos:-1,loansharkPos:-1,friendPos:-1});});
 await p.waitForFunction(()=>document.querySelector('#game-board')?.dataset.worldStatus==='ready');await p.waitForTimeout(2700);await p.evaluate(()=>itemStore.setState({turnBannerActive:false,turnBanner:null}));
 const equip=()=>p.locator('#game-board').evaluate(e=>JSON.parse(e.dataset.playerEquipment||'[]'));
 for(const id of [46,8,28,27])await p.evaluate(id=>useTestCard(id),id);
 await p.waitForFunction(()=>JSON.parse(document.querySelector('#game-board').dataset.playerEquipment||'[]').length===4);
 let eq=await equip();assert.deepEqual(eq.map(x=>x.kind).sort(),['backpack','helmet','shield','shoppingCart']);const initial=eq.find(x=>x.kind==='shoppingCart');
 await p.evaluate(()=>itemStore.getState().updatePlayer(1,{pos:22}));await p.waitForTimeout(3000);await p.locator('[data-camera=mode]').click();await p.evaluate(()=>cityProjection.center());await p.evaluate(()=>cityProjection.zoom(1.2));await p.screenshot({path:'docs/player-equipment.png'});await p.locator('[data-camera=mode]').click();await p.evaluate(()=>itemStore.getState().updatePlayer(1,{pos:24}));
 await p.evaluate(()=>itemStore.getState().updatePlayer(0,{pos:25}));await p.waitForTimeout(550);eq=await equip();const moved=eq.find(x=>x.kind==='shoppingCart');assert.notEqual(initial.x+','+initial.z,moved.x+','+moved.z);
 // Native damage consumes helmet/shield, and their geometry must disappear.
 await p.evaluate(async()=>{const {j:damage}=await import('./assets/useNetworkStore-CIe06z3C.js');damage(0,10,'テスト',1);});
 await p.waitForFunction(()=>!JSON.parse(document.querySelector('#game-board').dataset.playerEquipment).some(x=>['helmet','shield'].includes(x.kind)));
 await p.evaluate(()=>itemStore.getState().updatePlayer(0,{pos:24}));
 // Cancel only removes the aiming prop, never starts an attack.
 await p.evaluate(()=>useTestCard(20));await p.waitForFunction(()=>document.querySelector('#game-board').dataset.aimItem==='pistol');await p.screenshot({path:'docs/player-weapon-aim.png'});
 await p.getByRole('button',{name:/キャンセル/}).last().click();await p.waitForFunction(()=>!document.querySelector('#game-board').dataset.aimItem);assert.equal(await p.locator('#game-board').evaluate(e=>JSON.parse(e.dataset.itemEffects).some(x=>x.type==='attack')),false);
 for(const [id,kind,damage] of [[20,'pistol',40],[17,'brick',10],[18,'bat',20],[19,'nailBat',30],[21,'shotgun',30],[23,'laser',40]]){
  await p.evaluate(()=>itemStore.getState().updatePlayer(1,{hp:100,pos:24}));await p.evaluate(id=>useTestCard(id),id);await p.waitForFunction(kind=>document.querySelector('#game-board').dataset.aimItem===kind,kind);
  await p.getByRole('button',{name:/攻撃！/}).click();await p.waitForFunction(kind=>JSON.parse(document.querySelector('#game-board').dataset.itemEffects).some(x=>x.type==='attack'&&x.kind===kind),kind);
  await p.waitForFunction(damage=>itemStore.getState().players[1].hp===100-damage,damage);await p.waitForFunction(()=>JSON.parse(document.querySelector('#game-board').dataset.itemEffects).length===0);
 }
 await p.evaluate(()=>useTestCard(34));await p.waitForFunction(()=>JSON.parse(document.querySelector('#game-board').dataset.itemEffects).some(x=>x.kind==='water'));await p.waitForFunction(()=>JSON.parse(document.querySelector('#game-board').dataset.itemEffects).length===0);
 // A failed AP check and hand changes must not look like successful uses.
 await p.evaluate(()=>{itemStore.getState().updatePlayer(0,{ap:0,hand:[20]});useTestCard(20);});await p.waitForTimeout(150);assert.equal(await p.locator('#game-board').getAttribute('data-aim-item'),'');
 await p.evaluate(()=>itemStore.getState().updatePlayer(0,{equip:{},hand:[]}));await p.waitForFunction(()=>JSON.parse(document.querySelector('#game-board').dataset.playerEquipment).length===0);
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'docs/player-items-mobile.png'});assert.deepEqual(errors,[]);
 console.log('PASS: native cart/backpack/helmet/shield use, movement tracking, consumed equipment removal, aim/cancel, six attacks and original damage, water use, failed AP, cleanup, mobile.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
