import {installAtomUI} from "./atom-ui.js";
import {isAtom,atomDistricts} from "./atom-map.js";
import {installCityNotices} from "./city-notices.js";
import {viewerPlayer,NPC_INFO} from './npc-impact.js';
import {tileInfo,tileDetailHTML,tileTooltipText} from './tile-info.js';
import {tileDescriptions} from '../assets/original-city-runtime.js';
import {tileIconHTML} from './tile-visuals.js';
import {installGoldSession} from './gold-session.js';
import {installGoldUI} from './gold-ui.js';
import { tileVisual, tileIconURL } from './tile-visuals.js';
import { installMobileUI } from './mobile-ui.js';
import '../assets/original-city-runtime.js';
import { t as itemCards } from '../assets/cards-BGoWm8gy.js';
import { w as atomMove, j as atomDamage, I as gameStore, t as networkStore, k as gameLog, N as gameSound } from '../assets/useNetworkStore-CIe06z3C.js';
import { createOriginalWorld, DISTRICTS } from './original-world.js';
const goldSession=installGoldSession(gameStore,networkStore,gameLog,gameSound);
installGoldUI(gameStore,networkStore,goldSession);
installAtomUI(gameStore,networkStore,{move:atomMove,damage:atomDamage,log:gameLog});
// Read game state and project the original interactive nodes. No replacement rules.
let world=null,board=null,mapKey='',pending=false,failed=false;
function syncCameraControls(){
 const tour=world?.getCameraMode()==='tour';document.body.classList.toggle('city-touring',tour);
 for(const el of document.querySelectorAll('#action-panel,#card-panel-clay'))el.inert=tour;
 const b=document.querySelector('[data-camera=mode]');if(b){const text=tour?'プレイに戻る':'マップ巡回';if(b.textContent!==text)b.textContent=text;b.setAttribute('aria-pressed',String(tour));}
}
window.addEventListener('city-camera-change',syncCameraControls);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.cityGetTileInfo=id=>{
 const s=gameStore.getState(),t=s.mapData.find(t=>t.id===id);if(!t)return null;
 const player=viewerPlayer(s,networkStore.getState().myUserId),images=[...(document.querySelector(`[data-original-tile="${id}"]`)?.querySelectorAll('img')||[])];
 return tileInfo(s,t,tileDescriptions,{player,visibleKeys:Object.keys(NPC_INFO).filter(k=>images.some(i=>i.src.includes(k)))});
};
window.cityTileTooltip=(id,e,x=0,y=0)=>{if(window.cityMobileActive)return;const info=window.cityGetTileInfo(id);if(info)gameStore.getState().setTooltipData({title:`${id}番 ${info.title}`,desc:tileTooltipText(info),visible:true,x:e?.clientX??x,y:e?.clientY??y});};
window.cityInspectTile=id=>{
 const s=gameStore.getState(),tile=s.mapData.find(t=>t.id===id),container=document.querySelector('#board-area');if(!tile||!container)return;
 let detail=container.querySelector('.city-tile-detail');if(!detail){detail=document.createElement('aside');detail.className='city-tile-detail';detail.setAttribute('role','dialog');detail.setAttribute('aria-label','マスの説明');container.append(detail);}
 const info=window.cityGetTileInfo(id);detail.dataset.tileId=id;detail.innerHTML=`<button aria-label="マスの説明を閉じる">×</button>${tileDetailHTML(tile,info)}`;detail.querySelector('button').onclick=()=>detail.remove();
};
function routeInfo(container,state){
 let routes=container.querySelector('.city-route-options');if(!routes){routes=document.createElement('nav');routes.className='city-route-options';routes.setAttribute('aria-label','進むマスを選ぶ');routes.onclick=e=>{const b=e.target.closest('[data-city-route]');if(b&&world?.getCameraMode()!=='tour')document.querySelector(`[data-original-tile="${b.dataset.cityRoute}"]`)?.click();};container.append(routes);}
 const show=(state.isBranchPicking||state.isDashPicking)&&world?.getCameraMode()!=='tour';routes.hidden=!show;if(!show)return;
 const html=(state.currentBranchOptions||[]).map((id,i)=>{const t=state.mapData.find(t=>t.id===id);if(!t)return '';const info=tileInfo(state,t,tileDescriptions);return `<button data-city-route="${id}" title="${esc(info.desc)}"><strong>${i+1}. ${tileIconHTML(t.atomKind||t.type)}${id}番 ${esc(info.title)}</strong><span>${esc(info.short)}</span>${info.extra?`<small>${esc(info.extra)}</small>`:''}</button>`;}).join('');if(routes.innerHTML!==html)routes.innerHTML=html;
}
function controls(container){
 const existing=container.querySelector('.city-world-tools');if(existing){container.dataset.cameraMode='play';const b=existing.querySelector('[data-camera=mode]');b.textContent='マップ巡回';b.setAttribute('aria-pressed','false');return;}
 const nav=document.createElement('nav');nav.className='city-world-tools';nav.setAttribute('aria-label','立体マップの視点');
 nav.innerHTML=`<div class="city-camera-modes"><button data-camera="mode" aria-pressed="false" aria-describedby="city-gesture-help">マップ巡回</button></div><div id="city-gesture-help" class="city-tour-tools city-gesture-help"><span class="gesture-touch">1本指：移動<br>2本指：左右で回転・上下で角度<br>指の開閉：ズーム（指を離して切替）</span><span class="gesture-mouse">ドラッグ：移動 ／ ホイール：ズーム<br>右ドラッグ：回転・角度<br>ダブルクリック：全景</span></div>`;
 nav.addEventListener('click',e=>{if(!e.target.closest('[data-camera=mode]'))return;const tour=world?.getCameraMode()!=='tour';world?.setCameraMode(tour?'tour':'play');syncCameraControls();routeInfo(container,gameStore.getState());});
 container.dataset.cameraMode='play';
 container.append(nav);
 let touchStart=null,touchMoved=false;
 container.addEventListener('pointerdown',e=>{touchStart={x:e.clientX,y:e.clientY};touchMoved=false;},true);
 container.addEventListener('pointermove',e=>{if(touchStart&&Math.hypot(e.clientX-touchStart.x,e.clientY-touchStart.y)>8)touchMoved=true;},true);
 container.addEventListener('click',e=>{
  if(e.isTrusted&&(touchMoved||world?.wasCameraGesture())&&e.target.closest('#game-board')){e.stopPropagation();e.preventDefault();return;}
  // Enlarged touch targets overlap in the overview. Resolve taps to the nearest projected marker.
  if((window.cityMobileActive||world?.getCameraMode()==='tour')&&e.isTrusted&&e.target.closest('#game-board')&&world){
   const rect=document.querySelector('#game-board').getBoundingClientRect();let nearest=null,distance=32;
   for(const tile of gameStore.getState().mapData){const p=world.projectGrid(tile.col,tile.row),d=Math.hypot(e.clientX-rect.left-p.x,e.clientY-rect.top-p.y);if(d<distance){distance=d;nearest=tile;}}
   if(nearest){e.stopPropagation();e.preventDefault();if(world.getCameraMode()==='tour')window.cityInspectTile?.(nearest.id);else document.querySelector(`[data-original-tile="${nearest.id}"]`)?.click();return;}
  }
  if(world?.getCameraMode()==='tour'&&e.target.closest('[data-original-tile]')){e.stopPropagation();e.preventDefault();window.cityInspectTile?.(Number(e.target.closest('[data-original-tile]').dataset.originalTile));}
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
 for(const t of state.mapData){const el=host.querySelector(`[data-original-tile="${t.id}"]`);if(!el)continue;el.dataset.symbol='';el.dataset.tileType=t.type;el.style.setProperty('--tile-color',tileVisual(t.atomKind||t.type).color);el.style.setProperty('--tile-icon',`url("${tileIconURL(t.atomKind||t.type)}")`);const route=(state.isBranchPicking||state.isDashPicking)?state.currentBranchOptions?.indexOf(t.id):-1;el.dataset.routeNumber=route>=0?String(route+1):'';el.dataset.square=String(t.id);el.style.setProperty('--district-color',(isAtom(state)?atomDistricts:DISTRICTS)[t.area]?.color||'#b8c2a2');el.setAttribute('aria-label',`${t.id}番 ${(isAtom(state)?atomDistricts:DISTRICTS)[t.area]?.name} ${t.name}`);el.setAttribute('role','button');el.tabIndex=0;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}};}
 for(const p of state.players){const el=host.querySelector(`[data-original-player="${p.id}"]`);if(el){el.style.setProperty('--player-color',p.color);el.classList.toggle('current-player',p.id===state.turn);}}
 if((state.shopActive||state.storyActive)&&world?.getCameraMode()==='tour')world.setCameraMode('play');
 world.update({...state,viewerId:viewerPlayer(state,networkStore.getState().myUserId)?.id});syncCameraControls();routeInfo(document.querySelector('#board-area'),state);const detail=document.querySelector('.city-tile-detail');if(detail){const t=state.mapData.find(t=>t.id===Number(detail.dataset.tileId));if(t){const html=tileDetailHTML(t,window.cityGetTileInfo(t.id)),article=detail.querySelector('.city-tile-content');if(detail._content!==html){detail._content=html;article.outerHTML=html;}}}
}
function schedule(){if(pending)return;pending=true;requestAnimationFrame(refresh);}
gameStore.subscribe((next,previous)=>{
 const net=networkStore.getState();if(next.shopAccess&&next.shopAccess!==previous.shopAccess&&net.status==='connected'&&!net.isHost&&next.players[next.turn]?.userId===net.myUserId)queueMicrotask(()=>gameStore.setState({shopActive:true}));
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
installCityNotices(gameStore,networkStore,()=>world);
