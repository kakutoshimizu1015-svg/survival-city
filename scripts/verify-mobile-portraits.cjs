const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
const p=await b.newPage({viewport:{width:390,height:750},isMobile:true,hasTouch:true,deviceScaleFactor:3,reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(process.env.BASE_URL||'http://localhost:8003/');await p.evaluate(async()=>{const {I:s}=await import('./assets/useNetworkStore-CIe06z3C.js'),{originalMap}=await import('./assets/original-city-runtime.js');window.mobileStore=s;s.setState({gamePhase:'playing',mapData:originalMap(),players:[0,1,2,3].map(id=>({id,name:id?'相手'+id:'サバイバー',charType:['athlete','sales','hacker','survivor'][id],color:'#dfbd77',isCPU:false,teamColor:'none',skinId:'default',pos:id?20:24,hp:80,p:25,ap:6,hand:[17,8,6],maxHand:7,cans:3,trash:1,kills:0,deaths:0,equip:{}})),turn:0,diceRolled:true,turnOrderActive:false,turnOrderData:null,turnBannerActive:false,turnBanner:null,truckPos:999,policePos:999,unclePos:999,animalPos:999,yakuzaPos:999,loansharkPos:999,friendPos:999});});
await p.waitForFunction(()=>document.querySelector('#game-board')?.dataset.worldStatus==='ready'&&document.body.classList.contains('city-mobile'));await p.waitForTimeout(1500);await p.evaluate(()=>mobileStore.setState({turnBannerActive:false,turnBanner:null}));
await p.screenshot({path:"docs/mobile-cockpit.png"});

await p.waitForFunction(()=>[...document.querySelectorAll('.mobile-status img')].length===4&&[...document.querySelectorAll('.mobile-status img')].every(i=>i.complete&&i.naturalWidth>0));
assert.equal(await p.locator('.mobile-status img').count(),4);assert.equal(await p.locator('.mobile-rival').count(),3);assert.equal(await p.locator('.mobile-hp-track').first().getAttribute('aria-valuenow'),'80');
assert.ok(await p.locator('.original-world-canvas').evaluate(e=>e.width>=e.getBoundingClientRect().width*1.9),'map renders at 2x phone resolution');
const urls=await p.locator('.mobile-status img').evaluateAll(xs=>xs.map(i=>i.src));assert.ok(new Set(urls).size>=3,'uses each original character image');
await p.screenshot({path:'docs/mobile-restored-portraits.png'});
await p.locator('.mobile-rival[data-character="1"]').tap();await p.waitForFunction(()=>mobileStore.getState().charInfoModal===1);await p.evaluate(()=>mobileStore.setState({charInfoModal:null}));
await p.locator('[data-panel=players]').tap();assert.equal(await p.locator('.mobile-rank-row').count(),4);assert.match(await p.locator('.mobile-sheet h2').textContent(),/ランキング/);await p.screenshot({path:'docs/mobile-restored-status.png'});await p.getByRole('button',{name:'情報を閉じる'}).tap();
await p.setViewportSize({width:320,height:568});await p.waitForTimeout(300);assert.ok(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight+1&&document.documentElement.scrollWidth<=innerWidth));assert.ok((await p.locator('#board-area').boundingBox()).height>=230);assert.ok(await p.locator('.mobile-portrait').first().isVisible());await p.screenshot({path:'docs/mobile-restored-small.png'});assert.deepEqual(errors,[]);
console.log('PASS: original portraits for all four players, HP bar, native character details, ranking, 2x rendering, and 320px fixed layout.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
