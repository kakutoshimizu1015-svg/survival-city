import { installMobileUI } from './mobile-ui.js';
import '../assets/original-city-runtime.js';
import { t as itemCards } from '../assets/cards-BGoWm8gy.js';
import { I as gameStore } from '../assets/useNetworkStore-CIe06z3C.js';
import { createOriginalWorld, DISTRICTS } from './original-world.js';
// Read game state and project the original interactive nodes. No replacement rules.
let world=null,board=null,mapKey='',pending=false,failed=false;
const symbols={center:'医',can:'缶',trash:'屑',shop:'店',job:'職',exchange:'換',event:'?',shelter:'休',manhole:'◎',koban:'警',normal:'·'};
function syncCameraControls(){
 const tour=world?.getCameraMode()==='tour';document.body.classList.toggle('city-touring',tour);
 for(const el of document.querySelectorAll('#action-panel,#card-panel-clay'))el.inert=tour;
 const b=document.querySelector('[data-camera=mode]');if(b){const text=tour?'プレイに戻る':'マップ巡回';if(b.textContent!==text)b.textContent=text;b.setAttribute('aria-pressed',String(tour));}
}
function controls(container){
 const existing=container.querySelector('.city-world-tools');if(existing){container.dataset.cameraMode='play';const b=existing.querySelector('[data-camera=mode]');b.textContent='マップ巡回';b.setAttribute('aria-pressed','false');return;}
 const nav=document.createElement('nav');nav.className='city-world-tools';nav.setAttribute('aria-label','立体マップの視点');
 nav.innerHTML=`<div class="city-camera-modes"><button data-camera="mode" aria-pressed="false">マップ巡回</button><span class="tour-help">ドラッグで移動</span></div><div class="city-tour-tools"><div class="city-districts">${Object.entries(DISTRICTS).map(([id,d])=>`<button data-district="${id}" style="--district-color:${d.color}"><i></i>${d.name}</button>`).join('')}</div><div class="city-camera"><button data-camera="overview">全景</button><button data-camera="left" aria-label="左へ回転">↶</button><button data-camera="right" aria-label="右へ回転">↷</button><button data-camera="out" aria-label="縮小">−</button><button data-camera="center">現在地</button><button data-camera="in" aria-label="拡大">＋</button></div>`;
 nav.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.camera==='mode'){const tour=world?.getCameraMode()!=='tour';world?.setCameraMode(tour?'tour':'play');syncCameraControls();return;}if(b.dataset.district)world?.district(b.dataset.district);else switch(b.dataset.camera){case 'overview':world?.overview();break;case 'center':world?.center();break;case 'left':world?.rotate(-1);break;case 'right':world?.rotate(1);break;case 'in':world?.zoom(1.2);break;case 'out':world?.zoom(.8);break;}});
 container.dataset.cameraMode='play';
 container.append(nav);
 let touchStart=null,touchMoved=false;
 container.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};touchMoved=false;},true);
 container.addEventListener('pointermove',e=>{if(touchStart&&Math.hypot(e.clientX-touchStart.x,e.clientY-touchStart.y)>8)touchMoved=true;},true);
 container.addEventListener('click',e=>{
  if(window.cityMobileActive&&e.isTrusted&&touchMoved&&e.target.closest('#game-board')){e.stopPropagation();e.preventDefault();return;}
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
 for(const t of state.mapData){const el=host.querySelector(`[data-original-tile="${t.id}"]`);if(!el)continue;el.dataset.symbol=symbols[t.type]||'·';el.dataset.square=String(t.id);el.style.setProperty('--district-color',DISTRICTS[t.area]?.color||'#b8c2a2');el.setAttribute('aria-label',`${t.id}番 ${DISTRICTS[t.area]?.name} ${t.name}`);el.setAttribute('role','button');el.tabIndex=0;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}};}
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
