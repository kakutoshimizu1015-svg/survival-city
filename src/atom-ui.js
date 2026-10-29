import {isAtom} from './atom-map.js';
import {atomActions,canAtomAct,atomActionRequest,executeAtomAction,atomThreatText} from './atom-rules.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function installAtomUI(store,network,services){
 let taxiOpen=false,taxiStage='fare',selected=null,taxiContext=null,taxiHTML=null,oldFocus=null,frame=0,cameraBefore='play';
 const taxi=document.createElement('div');taxi.className='atom-taxi-overlay';taxi.hidden=true;document.body.append(taxi);
 const controls=document.createElement('div');controls.className='atom-actions';
 const alert=document.createElement('aside');alert.className='atom-threat';alert.setAttribute('aria-label','第0区の予告');
 let queued=false,controlsHTML=null,alertHTML=null;
 const world=()=>globalThis.window?.cityProjection;
 function closeTaxi(){
  if(!taxiOpen)return;taxiOpen=false;taxi.hidden=true;selected=null;
  document.body.classList.remove('city-taxi-picking');if(frame)globalThis.cancelAnimationFrame?.(frame);frame=0;
  world()?.setCameraMode(cameraBefore);oldFocus?.focus?.();
 }
 function positionMarkers(){
  frame=0;if(!taxiOpen)return;
  const host=document.querySelector('#game-board'),projection=world(),s=store.getState(),rect=host?.getBoundingClientRect();
  if(rect&&projection)for(const marker of taxi.querySelectorAll('[data-taxi-position]')){
   const tile=s.mapData.find(t=>t.id===Number(marker.dataset.taxiPosition));if(!tile)continue;
   const point=projection.projectGrid(tile.col,tile.row);marker.hidden=point.x<0||point.y<0||point.x>rect.width||point.y>rect.height;
   marker.style.left=rect.left+point.x+'px';marker.style.top=rect.top+point.y+'px';
  }
  if(globalThis.requestAnimationFrame)frame=requestAnimationFrame(positionMarkers);
 }
 function update(){
  queued=false;const s=store.getState(),active=isAtom(s)&&s.gamePhase==='playing'&&!s.gameOver;
  controls.hidden=!active;alert.hidden=!active||!!s.cityBeat;if(!active){closeTaxi();return;}
  const board=document.querySelector('#board-area'),panel=document.querySelector('#action-panel');if(board&&alert.parentNode!==board)board.append(alert);if(panel&&controls.parentNode!==panel)panel.append(controls);
  const p=s.players[s.turn],net=network.getState(),mine=p&&!p.isCPU&&(net.status!=='connected'||p.userId===net.myUserId),can=mine&&canAtomAct(s,p),tour=document.body.classList.contains('city-touring');
  const actions=mine?atomActions(s,p):[],flights=actions.filter(a=>a.id.startsWith('taxi:'));
  const shown=flights.length?[{id:'taxi-menu',label:'🚕 タクシーを選ぶ',detail:'無料はランダム。有料はマップから行き先を選ぶ。',ap:1,p:0}]:actions;
  const html=shown.map(a=>`<button data-atom-action="${esc(a.id)}" title="${esc(a.detail)}" ${can&&!tour&&p.ap>=a.ap&&p.p>=a.p&&(!a.income?.hp||p.hp>a.income.hp)?'':'disabled'}>⚛ ${esc(a.label)} (${a.ap}AP${a.p?'・'+a.p+'P':''})</button>`).join('');if(controlsHTML!==html){controlsHTML=html;controls.innerHTML=html;}
  if(taxiOpen&&(!can||!flights.length||taxiContext!==`${s.roundCount}:${s.turn}:${p.pos}`))closeTaxi();
  if(taxiOpen){
   const paid=flights.filter(a=>!a.random),choice=paid.find(a=>a.to===selected);if(!choice)selected=null;
   const markers=taxiStage==='paid'?paid.map(a=>`<button hidden class="atom-taxi-marker${a.to===selected?' selected':''}" data-taxi-select="${a.to}" data-taxi-position="${a.to}" aria-pressed="${a.to===selected}" aria-label="${esc(a.label)}"><span>🚕</span><b>${a.to}番</b></button>`).join('')+`<span hidden class="atom-taxi-origin" data-taxi-position="${p.pos}">現在地</span>`:'';
   const dialog=markers+`<section class="atom-taxi-dialog" role="region" aria-label="空飛ぶ相乗りタクシー"><header><h2>🚕 空飛ぶ相乗りタクシー</h2><button data-taxi-close aria-label="タクシーを閉じる">×</button></header>${taxiStage==='fare'?`<p>所持 ${p.p}P / ${p.ap}AP</p><div class="atom-taxi-choices"><button data-taxi-flight="taxi:free" ${p.ap<1?'disabled':''}><strong>無料便 · 0P＋1AP</strong><small>行き先は乗ってからのお楽しみ。危険なマスに着くことも。</small><b>ランダムで飛ぶ →</b></button><button data-taxi-paid ${p.p<3||p.ap<1||!paid.length?'disabled':''}><strong>有料便 · 3P＋1AP</strong><small>金缶のあるマスを除き、マップ上の候補から選ぶ。</small><b>マップで選ぶ →</b></button></div>`:`<p class="atom-taxi-hint">光る🚕をタップして行き先を選ぶ · ドラッグやピンチでマップを確認</p><div class="atom-taxi-selection" aria-live="polite">${choice?`<strong>${esc(choice.label)}</strong><small>${esc(choice.detail)}</small>`:'行き先はまだ選んでいません。移動・支払いは確定後です。'}</div><footer><button data-taxi-back>便を選び直す</button><button data-taxi-confirm ${!choice||p.p<3||p.ap<1?'disabled':''}>${choice?choice.to+'番へ ':''}3P＋1APで乗る</button></footer>`}</section>`;
   if(taxiHTML!==dialog){taxiHTML=dialog;taxi.innerHTML=dialog;}
  }
  const line=atomThreatText(s),text=`<strong>${line}</strong><small>有料便：${s.atom?.power===0?'A':'B'}路線${s.atom?.power!==s.atom?.nextPower?' → 次Rに切替':''}</small><button data-atom-view>予告を見る</button>`;
  if(alertHTML!==text){alertHTML=text;alert.innerHTML=text;}alert.dataset.phase=s.atom?.boss.phase||'sleep';
 }
 function send(action){const s=store.getState(),p=s.players[s.turn],net=network.getState();if(!p||p.isCPU||!canAtomAct(s,p)||net.status==='connected'&&p.userId!==net.myUserId)return;const request=atomActionRequest(s,action);closeTaxi();if(net.status==='connected'&&!net.isHost)net.hostConnection?.send({type:'REQUEST_ACTION',actionType:'ATOM_ACTION',userId:net.myUserId,payload:request});else executeAtomAction(store,p.id,request,services);}
 function selectTile(id){if(!taxiOpen||taxiStage!=='paid')return false;const s=store.getState();if(atomActions(s,s.players[s.turn]).some(a=>!a.random&&a.id.startsWith('taxi:paid:')&&a.to===id)){selected=id;update();}return true;}
 if(globalThis.window)window.cityTaxiSelectTile=selectTile;
 controls.onclick=e=>{const b=e.target.closest('[data-atom-action]');if(!b||b.disabled)return;if(b.dataset.atomAction==='taxi-menu'){
  const s=store.getState();oldFocus=document.activeElement;taxiContext=`${s.roundCount}:${s.turn}:${s.players[s.turn].pos}`;taxiOpen=true;taxiStage='fare';selected=null;taxi.hidden=false;cameraBefore=world()?.getCameraMode()||'play';document.body.classList.add('city-taxi-picking');world()?.setCameraMode('tour');world()?.overview();update();positionMarkers();taxi.querySelector?.('button')?.focus();return;
 }send(b.dataset.atomAction);};
 taxi.onclick=e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-taxi-close'))closeTaxi();
  else if(b.hasAttribute('data-taxi-paid')){taxiStage='paid';update();}
  else if(b.hasAttribute('data-taxi-back')){taxiStage='fare';selected=null;update();}
  else if(b.dataset.taxiSelect)selectTile(Number(b.dataset.taxiSelect));
  else if(b.hasAttribute('data-taxi-confirm')){if(selected!=null)send('taxi:paid:'+selected);}
  else if(b.dataset.taxiFlight==='taxi:free')send('taxi:free');
 };
 taxi.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();closeTaxi();}};
 alert.onclick=e=>{if(!e.target.closest('[data-atom-view]'))return;const s=store.getState(),ids=s.atom?.boss.targets||[],tile=ids.find(id=>s.mapData.find(t=>t.id===id)?.type!=='shelter')||41;world()?.inspectTile(tile);globalThis.window?.cityInspectTile?.(tile);};
 function schedule(){if(!queued){queued=true;queueMicrotask(update);}}store.subscribe(schedule);network.subscribe(schedule);new MutationObserver(schedule).observe(document.querySelector('#root'),{childList:true,subtree:true});new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});update();
}
