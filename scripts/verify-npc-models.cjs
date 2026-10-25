const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
  const p=await b.newPage({viewport:{width:1600,height:1050}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.BASE_URL||'http://localhost:8000');
  await p.evaluate(async()=>{const {I:s}=await import('./assets/useNetworkStore-CIe06z3C.js');window.npcStore=s;s.setState({gamePhase:'setup_offline'});});
  await p.getByRole('button',{name:'🎲 ゲームを開始する',exact:true}).click();
  await p.waitForFunction(()=>document.querySelector('#game-board')?.dataset.worldStatus==='ready');
  await p.evaluate(()=>{const s=window.npcStore;s.setState({turnOrderActive:false,turnOrderData:null,turnBannerActive:false,turnBanner:null,isNight:false,truckPos:25,policePos:24,unclePos:23,animalPos:22,yakuzaPos:21,loansharkPos:20,friendPos:19,policeHp:100,uncleHp:100,yakuzaHp:100,loansharkHp:100,friendHp:100,players:s.getState().players.map(p=>({...p,isCPU:false}))});});
  await p.waitForFunction(()=>JSON.parse(document.querySelector('#game-board').dataset.npcModels||'[]').length===7);
  await p.locator('[data-camera=mode]').click();await p.evaluate(()=>cityProjection.overview());await p.screenshot({path:'docs/npc-overview.png'});
  const status=()=>p.locator('#game-board').evaluate(e=>JSON.parse(e.dataset.npcModels));
  const before=(await status()).find(x=>x.kind==='truck');
  await p.evaluate(()=>window.npcStore.setState({truckPos:26}));
  await p.waitForFunction(()=>JSON.parse(document.querySelector('#game-board').dataset.npcModels).some(x=>x.kind==='truck'&&x.pos===26));
  await p.waitForTimeout(650);const after=(await status()).find(x=>x.kind==='truck');assert.notEqual(before.x+','+before.z,after.x+','+after.z);assert.equal(after.moving,false);
  await p.evaluate(()=>window.npcStore.setState({policePos:999,policeHp:0}));
  await p.waitForFunction(()=>!JSON.parse(document.querySelector('#game-board').dataset.npcModels).some(x=>x.kind==='police'));
  await p.evaluate(()=>window.npcStore.setState({policePos:24,policeHp:100}));
  await p.waitForFunction(()=>JSON.parse(document.querySelector('#game-board').dataset.npcModels).some(x=>x.kind==='police'));
  // Group the models in the foreground for a visual check; this fixture does not ship in the game.
  await p.evaluate(()=>{const s=window.npcStore;s.setState({truckPos:25,players:s.getState().players.map((p,i)=>({...p,pos:i?21:24}))});});
  await p.waitForTimeout(700);await p.evaluate(()=>cityProjection.center());await p.screenshot({path:'docs/npc-closeup.png'});
  await p.evaluate(()=>cityProjection.rotate(1));await p.screenshot({path:'docs/npc-rotated.png'});
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:'docs/npc-mobile.png'});
  // Verify visibility against the native UI, including the horror truck's fog exception.
  await p.evaluate(()=>window.npcStore.setState({isNight:true,horrorMode:true,truckPos:8,policePos:10,unclePos:12,animalPos:14}));
  await p.waitForTimeout(700);
  const visibility=await p.evaluate(()=>{const keys=['truck','police','uncle','animal','yakuza','loanshark','friend'],s=window.npcStore.getState();return {expected:keys.filter(k=>[...(document.querySelector(`[data-original-tile="${s[k+'Pos']}"]`)?.querySelectorAll('img')||[])].some(i=>i.src.includes(k))).sort(),actual:JSON.parse(document.querySelector('#game-board').dataset.npcModels).map(x=>x.kind).sort()};});
  assert.deepEqual(visibility.actual,visibility.expected);assert.ok(visibility.actual.includes('truck'));assert.ok(visibility.actual.length<7,'night fog hides distant NPCs');
  await p.emulateMedia({reducedMotion:'reduce'});
  // A changed map signature recreates the presentation, picking up the new motion preference.
  await p.evaluate(()=>{const s=window.npcStore;s.setState({isNight:false,horrorMode:false,mapData:s.getState().mapData.map((t,i)=>i?t:{...t,type:'normal'})});});
  await p.waitForTimeout(600);await p.evaluate(()=>window.npcStore.setState({truckPos:25}));await p.waitForTimeout(400);
  assert.equal((await status()).find(x=>x.kind==='truck').moving,false);
  const meshes=await p.evaluate(async()=>{const {createNpcModel,NPC_KEYS}=await import('./src/npc-models.js');return NPC_KEYS.map(k=>{const model=createNpcModel(window.THREE,k);model.root.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(model.root).getSize(new THREE.Vector3());let mesh=0,sprite=0;model.root.traverse(o=>{mesh+=!!o.isMesh;sprite+=!!o.isSprite;o.geometry?.dispose();o.material?.dispose();});return {kind:k,mesh,sprite,size:size.toArray()};});});
  assert.ok(meshes.every(x=>x.mesh>10&&x.sprite===0));assert.ok(meshes.find(x=>x.kind==='truck').size[1]>meshes.find(x=>x.kind==='police').size[1]);

  assert.deepEqual(errors,[]);console.log('PASS: 7 mesh NPCs, truck movement, police despawn/respawn, night fog/horror visibility, reduced motion, real mesh geometry, desktop/mobile views; no runtime errors.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
