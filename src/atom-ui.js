import {isAtom} from './atom-map.js';
import {atomActions,canAtomAct,atomActionRequest,executeAtomAction,atomThreatText} from './atom-rules.js';
export function installAtomUI(store,network,services){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let taxiOpen=false,taxiContext=null,taxiHTML=null,oldFocus=null;
 const taxi=document.createElement('div');taxi.className='atom-taxi-overlay';taxi.hidden=true;document.body.append(taxi);
 const controls=document.createElement('div');controls.className='atom-actions';
 const alert=document.createElement('aside');alert.className='atom-threat';alert.setAttribute('aria-label','第0区の予告');
 // Compare render inputs, not browser-normalized innerHTML. Empty attributes
 // (e.g. data-atom-view and disabled) serialize differently and would make
 // our MutationObserver rewrite its own children forever.
 let queued=false,controlsHTML=null,alertHTML=null;
 function update(){queued=false;const s=store.getState(),active=isAtom(s)&&s.gamePhase==='playing'&&!s.gameOver;controls.hidden=!active;alert.hidden=!active||!!s.cityBeat;if(!active){taxiOpen=false;taxi.hidden=true;return;}
  const board=document.querySelector('#board-area'),panel=document.querySelector('#action-panel');if(board&&alert.parentNode!==board)board.append(alert);if(panel&&controls.parentNode!==panel)panel.append(controls);
  const p=s.players[s.turn],net=network.getState(),mine=p&&!p.isCPU&&(net.status!=='connected'||p.userId===net.myUserId),can=mine&&canAtomAct(s,p)&&!document.body.classList.contains('city-touring');
  const actions=mine?atomActions(s,p):[],flights=actions.filter(a=>a.id.startsWith('taxi:')),shown=flights.length?[{id:'taxi-menu',label:'🚕 タクシーを選ぶ',detail:'行き先・料金を見て、無料便か有料便を選ぶ',ap:1,p:0}]:actions,html=shown.map(a=>`<button data-atom-action="${esc(a.id)}" title="${esc(a.detail)}" ${can&&p.ap>=a.ap&&p.p>=a.p&&(!a.income?.hp||p.hp>a.income.hp)?'':'disabled'}>⚛ ${esc(a.label)} (${a.ap}AP${a.p?'・'+a.p+'P':''})</button>`).join('');if(controlsHTML!==html){controlsHTML=html;controls.innerHTML=html;}
  if(taxiOpen&&(!can||!flights.length||taxiContext!==`${s.roundCount}:${s.turn}:${p.pos}`))taxiOpen=false;
  taxi.hidden=!taxiOpen;
  if(taxiOpen){const dialog=`<section class="atom-taxi-dialog" role="dialog" aria-modal="true" aria-label="空飛ぶ相乗りタクシー"><header><h2>🚕 空飛ぶ相乗りタクシー</h2><button data-taxi-close aria-label="閉じる">×</button></header><p>行き先を選んで乗る · 所持 ${p.p}P / ${p.ap}AP</p><div class="atom-taxi-choices">${flights.map(a=>`<button data-taxi-flight="${esc(a.id)}" ${p.ap<a.ap||p.p<a.p?'disabled':''}><strong>${esc(a.label)}</strong><span>${esc(s.mapData.find(t=>t.id===a.to)?.name)}</span><small>${esc(a.detail)}</small><b>${a.p===0?'無料':a.p+'P'}・${a.ap}APで乗る →</b></button>`).join('')}</div><p class="atom-taxi-note">無料便は照射に強いシェルターへ。有料便は金缶や仕事へ直行。到着先のNPCや罠の効果も受けます。</p></section>`;if(taxiHTML!==dialog){taxiHTML=dialog;taxi.innerHTML=dialog;}}
  const line=atomThreatText(s),text=`<strong>${line}</strong><small>無料便：${s.atom?.power===0?'A':'B'}路線${s.atom?.power!==s.atom?.nextPower?' → 次Rに切替':''}</small><button data-atom-view>予告を見る</button>`;if(alertHTML!==text){alertHTML=text;alert.innerHTML=text;}alert.dataset.phase=s.atom?.boss.phase||'sleep';
 }
 function closeTaxi(){taxiOpen=false;taxi.hidden=true;oldFocus?.focus?.();}
 function send(action){const s=store.getState(),p=s.players[s.turn],net=network.getState();if(!p||p.isCPU||!canAtomAct(s,p)||net.status==='connected'&&p.userId!==net.myUserId)return;const request=atomActionRequest(s,action);if(net.status==='connected'&&!net.isHost)net.hostConnection?.send({type:'REQUEST_ACTION',actionType:'ATOM_ACTION',userId:net.myUserId,payload:request});else executeAtomAction(store,p.id,request,services);}
 controls.onclick=e=>{const b=e.target.closest('[data-atom-action]');if(!b||b.disabled)return;if(b.dataset.atomAction==='taxi-menu'){const s=store.getState();oldFocus=document.activeElement;taxiContext=`${s.roundCount}:${s.turn}:${s.players[s.turn].pos}`;taxiOpen=true;update();taxi.querySelector?.('button')?.focus();return;}send(b.dataset.atomAction);};
 taxi.onclick=e=>{if(e.target===taxi||e.target.closest('[data-taxi-close]')){closeTaxi();return;}const b=e.target.closest('[data-taxi-flight]');if(b&&!b.disabled){send(b.dataset.taxiFlight);closeTaxi();}};
 taxi.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();closeTaxi();}if(e.key==='Tab'){const buttons=[...taxi.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};
 alert.onclick=e=>{if(!e.target.closest('[data-atom-view]'))return;const s=store.getState(),ids=s.atom?.boss.targets||[],tile=ids.find(id=>s.mapData.find(t=>t.id===id)?.type!=='shelter')||41;window.cityProjection?.inspectTile(tile);window.cityInspectTile?.(tile);};
 function schedule(){if(!queued){queued=true;queueMicrotask(update);}}store.subscribe(schedule);network.subscribe(schedule);new MutationObserver(schedule).observe(document.querySelector('#root'),{childList:true,subtree:true});new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});update();
}
