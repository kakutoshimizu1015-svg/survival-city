import { tileVisual, tileIconURL } from './tile-visuals.js';
import { installMobileUI } from './mobile-ui.js';
import '../assets/original-city-runtime.js';
import { t as itemCards } from '../assets/cards-BGoWm8gy.js';
import { I as gameStore } from '../assets/useNetworkStore-CIe06z3C.js';
import { createOriginalWorld, DISTRICTS } from './original-world.js';
// Read game state and project the original interactive nodes. No replacement rules.
let world=null,board=null,mapKey='',pending=false,failed=false;
function syncCameraControls(){
 const tour=world?.getCameraMode()==='tour';document.body.classList.toggle('city-touring',tour);
 for(const el of document.querySelectorAll('#action-panel,#card-panel-clay'))el.inert=tour;
 const b=document.querySelector('[data-camera=mode]');if(b){const text=tour?'プレイに戻る':'マップ巡回';if(b.textContent!==text)b.textContent=text;b.setAttribute('aria-pressed',String(tour));}
}
function controls(container){
 const existing=container.querySelector('.city-world-tools');if(existing){container.dataset.cameraMode='play';const b=existing.querySelector('[data-camera=mode]');b.textContent='マップ巡回';b.setAttribute('aria-pressed','false');return;}
 const nav=document.createElement('nav');nav.className='city-world-tools';nav.setAttribute('aria-label','立体マップの視点');
 nav.innerHTML=`<div class="city-camera-modes"><button data-camera="mode" aria-pressed="false" aria-describedby="city-gesture-help">マップ巡回</button></div><div id="city-gesture-help" class="city-tour-tools city-gesture-help"><span class="gesture-touch">1本指：移動<br>2本指：開閉でズーム・ひねって回転<br>2本指を上下：角度（指を離して切替）</span><span class="gesture-mouse">ドラッグ：移動 ／ ホイール：ズーム<br>右ドラッグ：回転・角度<br>ダブルクリック：全景</span></div>`;
 nav.addEventListener('click',e=>{if(!e.target.closest('[data-camera=mode]'))return;const tour=world?.getCameraMode()!=='tour';world?.setCameraMode(tour?'tour':'play');syncCameraControls();});
 container.dataset.cameraMode='play';
 container.append(nav);
 let touchStart=null,touchMoved=false;
 container.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};touchMoved=false;},true);
 container.addEventListener('pointermove',e=>{if(touchStart&&Math.hypot(e.clientX-touchStart.x,e.clientY-touchStart.y)>8)touchMoved=true;},true);
 container.addEventListener('click',e=>{
  if(e.isTrusted&&(touchMoved||world?.wasCameraGesture())&&e.target.closest('#game-board')){e.stopPropagation();e.preventDefault();return;}
  // Enlarged touch targets overlap in the overview. Resolve taps to the nearest projected marker.
  if(window.cityMobileActive&&e.isTrusted&&e.target.closest('#game-board')&&world){
   const rect=document.querySelector('#game-board').getBoundingClientRect();let nearest=null,distance=32;
   for(const tile of gameStore.getState().mapData){const p=world.projectGrid(tile.col,tile.row),d=Math.hypot(e.clientX-rect.left-p.x,e.clientY-rect.top-p.y);if(d<distance){distance=d;nearest=tile;}}
   if(nearest){e.stopPropagation();e.preventDefault();if(world.getCameraMode()==='tour')window.cityMobileTile?.(nearest.id);else document.querySelector(`[data-original-tile="${nearest.id}"]`)?.click();return;}
  }
  if(world?.getCameraMode()==='tour'&&e.target.closest('[data-original-tile]')){e.stopPropagation();e.preventDefault();}
 },true);
 container.addEventListener('keydown',e=>{if(e.key==='Escape'&&world?.getCameraMode()==='tour')nav.querySelector('[data-camera=mode]').click();},true);
}
function refresh(){pending=false;const state=gameStore.getState();document.body.dataset.cityPhase=state.gamePhase;
 const host=document.querySelector('#game-board');
 if(!host||state.gamePhase!=='playing'){world?.dispose();world=null;board=null;mapKey='';document.body.classList.remove('city-3d');syncCameraControls();return;}
 const signature=state.mapData.map(t=>[t.id,t.col,t.row,t.area,t.type,t.next.join('.')].join(':')).join('|');
 if(failed&&board===host)return;
 if(board!==host||mapKey!==signature){world?.dispose();world=null;board=host;mapKey=signature;failed=false;
  try{document.body.classList.add('city-3d');world=createOriginalWorld(host,state.mapData);window.cityProjection=world;controls(document.querySelector('#board-area'));}
  catch(error){console.warn('3D world unavailable; original board remains playable.',error);failed=true;document.body.classList.remove('city-3d');window.cityProjection=null;return;}
 }
 for(const t of state.mapData){const el=host.querySelector(`[data-original-tile="${t.id}"]`);if(!el)continue;el.dataset.symbol='';el.dataset.tileType=t.type;el.style.setProperty('--tile-color',tileVisual(t.type).color);el.style.setProperty('--tile-icon',`url("${tileIconURL(t.type)}")`);const route=(state.isBranchPicking||state.isDashPicking)?state.currentBranchOptions?.indexOf(t.id):-1;el.dataset.routeNumber=route>=0?String(route+1):'';el.dataset.square=String(t.id);el.style.setProperty('--district-color',DISTRICTS[t.area]?.color||'#b8c2a2');el.setAttribute('aria-label',`${t.id}番 ${DISTRICTS[t.area]?.name} ${t.name}`);el.setAttribute('role','button');el.tabIndex=0;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}};}
 for(const p of state.players){const el=host.querySelector(`[data-original-player="${p.id}"]`);if(el){el.style.setProperty('--player-color',p.color);el.classList.toggle('current-player',p.id===state.turn);}}
 if((state.shopActive||state.storyActive)&&world?.getCameraMode()==='tour')world.setCameraMode('play');
 world.update(state);syncCameraControls();
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(refresh);}
gameStore.subscribe((next,previous)=>{
 // Accepted uses increment the native cards statistic before applying their effect.
 // Discarding, buying, failed attempts and hand transfers do not increment it.
 if(next.gamePhase==='playing'&&previous.gamePhase==='playing')for(const p of next.players){
  const old=previous.players.find(o=>o.id===p.id);
  if(old&&(p.gameStats?.cards||0)===(old.gameStats?.cards||0)+1){
   const used=next.logs?.at(-1)?.match(/^🎴 「(.+)」を使用！$/),card=used&&itemCards.find(c=>c.name===used[1]);
   if(card)world?.useItem(p.id,card);
  }
 }
 schedule();
});
// React commits after store notifications. Watch only child changes, never projected styles.
new MutationObserver(schedule).observe(document.querySelector('#root'),{childList:true,subtree:true});
window.addEventListener('pagehide',e=>{if(!e.persisted)world?.dispose();});schedule();

installMobileUI(gameStore);
