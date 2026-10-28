// One stable, non-modal notice at a time. Actual choices still use their own dialogs.
export function installCityNotices(store,network,getWorld){
 const panel=document.createElement('aside');panel.className='city-notice';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');panel.hidden=true;
 let current=null,queue=[],timer=null,queued=false,last=store.getState(),pending=[],signature='',seenCombat=new Set((last.cityCombat||[]).map(e=>e.id));
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const plain=s=>{const el=document.createElement('div');el.innerHTML=String(s??'');return el.textContent||'';};
 function add(notice){if(!notice.title)return;const key=JSON.stringify([notice.title,notice.lines]);if(current?.key===key||queue.some(n=>n.key===key))return;queue.push({...notice,key});if(queue.length>12)queue.splice(0,queue.length-12);}
 function next(){clearTimeout(timer);timer=null;current=queue.shift()||null;if(current)timer=setTimeout(()=>{current=null;next();render();},Math.min(4200,2100+(current.lines?.join('').length||0)*20));}
 function render(){
  const s=store.getState(),board=document.querySelector('#board-area');if(board&&panel.parentNode!==board)board.append(panel);
  const busy=s.settingsActive||s.rulesActive||s.tutorialActive||s.shopActive||s.mgActive||s.storyActive||s.turnOrderActive||s.weaponArcData||s.isBranchPicking||s.isDashPicking||document.body?.classList.contains('city-touring')||s.charInfoModal!=null||s.gameOver;
  if(!s.goldMode||s.gamePhase!=='playing'){queue=[];current=null;clearTimeout(timer);timer=null;panel.hidden=true;return;}
  if(busy){panel.hidden=true;if(timer){clearTimeout(timer);timer=null;}return;}
  const beat=s.cityBeat;
  if(beat){if(timer){clearTimeout(timer);timer=null;}current=null;queue=[];}
  else if(!timer){if(current)queue.unshift(current);next();}
  const n=beat||current;panel.hidden=!n;if(!n)return;
  panel.dataset.phase=beat?.phase||'notice';
  const label=beat?(beat.phase==='report'?'街の時間 · 1/4':beat.phase.startsWith('truck')?'街の時間 · 2/4':beat.phase.startsWith('police')?'街の時間 · 3/4':'街の時間 · 4/4'):(n.label||'できごと');
  const html=`<small>${esc(label)}</small><strong>${esc(plain(n.title))}</strong><div>${(n.lines||[]).map(line=>`<p>${esc(plain(line))}</p>`).join('')}</div>`;
  if(signature!==html){signature=html;panel.innerHTML=html;}
 }
 function flush(){queued=false;const s=store.getState(),batch=pending;pending=[];
  const combats=batch.filter(n=>n.combat).map(n=>n.combat),grouped=new Map();
  for(const n of batch){
   if(n.combat){const e=n.combat;getWorld()?.showCombat(e);if(!n.round)add({title:e.defeated?e.name+'が倒れた！':e.name+'に命中！',lines:[`HP −${e.damage}`,...(e.goldStolen?[`${e.attackerName||'相手'}が金缶を${e.goldStolen}個うばった！ ＋2点`]:e.killPoints>0?[`${e.attackerName||'相手'}に ＋2点`]:[])],label:e.attackerName?e.attackerName+'の攻撃 · '+e.source:e.source});continue;}
   if(n.round)continue;
   if(n.playerId!=null){if(combats.some(c=>c.target===n.playerId))continue;const old=grouped.get(n.playerId);if(old){old.lines.push(...n.lines);if(n.title.includes('死亡'))old.title=n.title;}else grouped.set(n.playerId,n);}
   else add(n);
  }
  for(const n of grouped.values())add({...n,lines:[...new Set(n.lines)]});
  if(!current&&!s.cityBeat)next();render();
 }
 store.subscribe(s=>{
  if(s.gamePhase!=='playing'||s.gameOver){pending=[];seenCombat.clear();}
  else{
   const round=!!s._roundEndInProgress;if(last.gamePhase!=='playing')seenCombat=new Set((s.cityCombat||[]).map(e=>e.id));
   const ids=new Set((last.eventPopups||[]).map(e=>e.id));for(const e of s.eventPopups||[])if(!ids.has(e.id)){
    const p=s.players.find(p=>p.id===e.playerId);pending.push({playerId:e.playerId,title:(p?.name?p.name+' · ':'')+e.title,lines:e.detail?[e.detail]:[],round:round&&s.cityBeat?.phase!=='forecast'});
   }
   for(const e of s.cityCombat||[])if(!seenCombat.has(e.id)){seenCombat.add(e.id);pending.push({combat:e,round});}
   if(seenCombat.size>80)seenCombat=new Set((s.cityCombat||[]).map(e=>e.id));
   for(const key of ['toastMsg','centerWarning','acquiredCard'])if(s[key]?.id&&s[key]?.id!==last[key]?.id)pending.push({title:s[key].text||s[key].name||'カードを手に入れた！',lines:key==='acquiredCard'&&s[key].desc?[s[key].desc]:[],round});
   if(s.turnBanner&&s.turnBanner!==last.turnBanner)pending.push({title:s.turnBanner.name+'の番です',lines:[],round});
  }
  last=s;if(!queued){queued=true;queueMicrotask(flush);}
 });
 new MutationObserver(render).observe(document.querySelector('#root'),{childList:true,subtree:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});render();
 return {panel,dispose(){clearTimeout(timer);panel.remove();}};
}
