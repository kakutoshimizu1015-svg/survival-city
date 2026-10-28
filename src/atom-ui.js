import {isAtom} from './atom-map.js';
import {atomActions,canAtomAct,atomActionRequest,executeAtomAction,atomThreatText} from './atom-rules.js';
export function installAtomUI(store,network,services){
 const controls=document.createElement('div');controls.className='atom-actions';
 const alert=document.createElement('aside');alert.className='atom-threat';alert.setAttribute('aria-label','第0区の予告');
 // Compare render inputs, not browser-normalized innerHTML. Empty attributes
 // (e.g. data-atom-view and disabled) serialize differently and would make
 // our MutationObserver rewrite its own children forever.
 let queued=false,controlsHTML=null,alertHTML=null;
 function update(){queued=false;const s=store.getState(),active=isAtom(s)&&s.gamePhase==='playing'&&!s.gameOver;controls.hidden=!active;alert.hidden=!active||!!s.cityBeat;if(!active)return;
  const board=document.querySelector('#board-area'),panel=document.querySelector('#action-panel');if(board&&alert.parentNode!==board)board.append(alert);if(panel&&controls.parentNode!==panel)panel.append(controls);
  const p=s.players[s.turn],net=network.getState(),mine=p&&!p.isCPU&&(net.status!=='connected'||p.userId===net.myUserId),can=mine&&canAtomAct(s,p)&&!document.body.classList.contains('city-touring');
  const actions=mine?atomActions(s,p):[],html=actions.map(a=>`<button data-atom-action="${a.id}" title="${a.detail}" ${can&&p.ap>=a.ap&&p.p>=a.p?'':'disabled'}>⚛ ${a.label} (${a.ap}AP${a.p?'・'+a.p+'P':''})</button>`).join('');if(controlsHTML!==html){controlsHTML=html;controls.innerHTML=html;}
  const line=atomThreatText(s),text=`<strong>${line}</strong><small>給電：${s.atom?.power===0?'東西':'南北'}線${s.atom?.power!==s.atom?.nextPower?' → 次Rに切替':''}</small><button data-atom-view>予告を見る</button>`;if(alertHTML!==text){alertHTML=text;alert.innerHTML=text;}alert.dataset.phase=s.atom?.boss.phase||'sleep';
 }
 controls.onclick=e=>{const b=e.target.closest('[data-atom-action]');if(!b||b.disabled)return;const s=store.getState(),p=s.players[s.turn],net=network.getState(),request=atomActionRequest(s,b.dataset.atomAction);if(net.status==='connected'&&!net.isHost)net.hostConnection?.send({type:'REQUEST_ACTION',actionType:'ATOM_ACTION',userId:net.myUserId,payload:request});else executeAtomAction(store,p.id,request,services);};
 alert.onclick=e=>{if(!e.target.closest('[data-atom-view]'))return;const s=store.getState(),ids=s.atom?.boss.targets||[],tile=ids.find(id=>s.mapData.find(t=>t.id===id)?.type!=='shelter')||41;window.cityProjection?.inspectTile(tile);window.cityInspectTile?.(tile);};
 function schedule(){if(!queued){queued=true;queueMicrotask(update);}}store.subscribe(schedule);network.subscribe(schedule);new MutationObserver(schedule).observe(document.querySelector('#root'),{childList:true,subtree:true});new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});update();
}
