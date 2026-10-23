import { t as itemCards } from '../assets/cards-BGoWm8gy.js';
import { itemArt } from './pixel-item-art.js';
import { tileDescriptions } from '../assets/original-city-runtime.js';
// Compact presentation only: all actions and route choices still use the native controls.
export function installMobileUI(store){
 const media=matchMedia('(max-width:768px)'),root=document.createElement('section');root.id='city-mobile-ui';root.setAttribute('aria-label','ゲーム操作');document.body.append(root);
 root.innerHTML=`<header class="mobile-status"></header><section class="mobile-dock"><button class="mobile-result" aria-label="結果とログを見る" aria-live="polite"></button><div class="mobile-actions"></div><nav class="mobile-tabs" aria-label="ゲーム情報"><button data-panel="cards">手札</button><button data-panel="tiles">マス情報</button><button data-panel="players">状態</button><button data-panel="logs">ログ</button></nav></section><div class="mobile-sheet" hidden><header><h2></h2><button class="mobile-close" aria-label="情報を閉じる">閉じる ×</button></header><div class="mobile-sheet-content"></div></div>`;
 let panel='',selectedTile=null,signature='',pending=false,wasPlaying=false;
 const plain=s=>{const el=document.createElement('div');el.innerHTML=String(s||'');return el.textContent||'';};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rendered=new WeakMap();const set=(el,html)=>{if(rendered.get(el)!==html){rendered.set(el,html);el.innerHTML=html;}};
 const sheet=root.querySelector('.mobile-sheet'),content=root.querySelector('.mobile-sheet-content');
 const close=()=>open('');
 function open(next){panel=next;signature='';document.body.dataset.mobilePanel=panel;sheet.hidden=!panel;root.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.panel===panel)));update();if(panel)root.querySelector('.mobile-close').focus({preventScroll:true});}
 root.querySelector('.mobile-close').onclick=close;
 root.querySelector('.mobile-tabs').onclick=e=>{const b=e.target.closest('[data-panel]');if(b){selectedTile=null;open(panel===b.dataset.panel?'':b.dataset.panel);}};
 root.querySelector('.mobile-result').onclick=()=>open('logs');
 root.querySelector('.mobile-actions').onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled||document.body.classList.contains('city-touring'))return;if(b.dataset.route){document.querySelector(`[data-original-tile="${b.dataset.route}"]`)?.click();}else{const original=[...document.querySelectorAll('#action-panel button')].find(x=>x.textContent===b.dataset.action);if(original&&!original.disabled)original.click();}queue();};
 content.onclick=e=>{const action=e.target.closest('[data-card-action]');if(action&&!action.disabled){const card=document.querySelector('#card-panel-clay')?.children[Number(action.dataset.cardIndex)],button=card?.querySelectorAll('button')[Number(action.dataset.cardAction)];if(button&&!button.disabled&&!document.body.classList.contains('city-touring')){button.click();if(/使用|売却|渡す/.test(button.textContent))close();}queue();return;}const b=e.target.closest('[data-tile-info]');if(b){selectedTile=Number(b.dataset.tileInfo);signature='';update();}};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel)close();});
 window.cityMobileTile=id=>{if(!window.cityMobileActive)return;selectedTile=id;open('tiles');};
 function tileInfo(s,t){const info=tileDescriptions[t.type==='normal'?'normal_'+t.area:t.type]||tileDescriptions.normal;const owner=s.players.find(p=>p.id===s.territories?.[t.id]);return `<article class="mobile-tile-detail"><h3>${esc(t.id+'番 '+(t.name||info.title))}</h3><p>${esc(info.desc)}</p>${owner?'<p>所有者：'+esc(owner.name)+'</p>':''}</article>`;}
 function update(){
  pending=false;const s=store.getState(),active=media.matches&&s.gamePhase==='playing';window.cityMobileActive=active;root.hidden=!active;document.body.classList.toggle('city-mobile',active);
  if(!active){if(wasPlaying){panel='';document.body.dataset.mobilePanel='';sheet.hidden=true;}wasPlaying=false;return;}
  if(!wasPlaying){window.scrollTo(0,0);wasPlaying=true;}
  const p=s.players[s.turn];if(!p)return;
  set(root.querySelector('.mobile-status'),`<div><strong>${esc(p.name)}${p.isCPU?'（CPU）':''}</strong><span>R ${s.roundCount}/${s.maxRounds} · ${s.isNight?'夜':'昼'}</span></div><div class="mobile-stats"><b>HP ${p.hp}</b><b>AP ${p.ap}</b><b>${p.p}P</b><span>缶 ${p.cans||0} / ゴミ ${p.trash||0}</span></div>`);
  const logs=s.logs||[],recent=plain(logs.at(-1));const result=root.querySelector('.mobile-result');const resultText=recent||'結果はここに表示されます。タップで履歴';if(result.textContent!==resultText)result.textContent=resultText;
  const tour=document.body.classList.contains('city-touring');const branch=s.isBranchPicking||s.isDashPicking;
  root.classList.toggle('choosing-route',branch);document.body.classList.toggle('mobile-branch',branch);
  const actions=root.querySelector('.mobile-actions');
  if(branch){const ids=s.currentBranchOptions||[];const html=ids.map((id,i)=>{const t=s.mapData.find(t=>t.id===id);return `<button data-route="${id}" ${tour?'disabled':''}><b>道 ${i+1} → ${id}番</b><span>${esc(t?.name||tileDescriptions[t?.type]?.title||'進む')}</span></button>`;}).join('');set(actions,html);}
  else{const buttons=[...document.querySelectorAll('#action-panel button')];const html=buttons.map(b=>`<button data-action="${esc(b.textContent)}" ${b.disabled||tour?'disabled':''}>${esc(b.textContent)}</button>`).join('');set(actions,html||'<p>進行中…</p>');}
  const cardTab=root.querySelector('[data-panel=cards]');const cardText=`手札 ${p.hand?.length||0}`;if(cardTab.textContent!==cardText)cardTab.textContent=cardText;
  const key=JSON.stringify([panel,selectedTile,logs,p,s.players,s.isBranchPicking,panel==='cards'?document.querySelector('#card-panel-clay')?.innerHTML:'']);if(key===signature)return;signature=key;
  sheet.hidden=!panel;if(!panel)return;root.querySelector('.mobile-sheet h2').textContent={cards:'手札・アイテム',tiles:'マスの説明',players:'プレイヤーの状態',logs:'結果・ログ'}[panel];
  if(panel==='cards'){const cards=[...(document.querySelector('#card-panel-clay')?.children||[])];set(content,'<div class="mobile-hand">'+cards.map((card,index)=>{const buttons=[...card.querySelectorAll('button')],item=itemCards.find(c=>c.id===p.hand?.[index]);return `<article>${buttons.length&&item?`<img src="${itemArt(item.id)}" alt=""><h3>${esc(item.name)}</h3><p>${esc(item.desc||item.description||'')}</p>`:`<p>${esc(card.textContent)}</p>`}<div>${buttons.map((b,i)=>`<button data-card-index="${index}" data-card-action="${i}" ${b.disabled||tour?'disabled':''}>${esc(b.textContent)}</button>`).join('')}</div></article>`;}).join('')+'</div>');return;}
  if(panel==='logs')set(content,logs.length?`<ol class="mobile-log">${logs.slice().reverse().map(l=>`<li>${esc(plain(l))}</li>`).join('')}</ol>`:'<p>まだログはありません。</p>');
  if(panel==='players')set(content,s.players.map(a=>`<article><h3>${esc(a.name)}${a.isCPU?'（CPU）':''}</h3><p>HP ${a.hp}　AP ${a.ap}　${a.p}P</p><p>缶 ${a.cans||0}　ゴミ ${a.trash||0}　手札 ${a.hand?.length||0}/${a.maxHand||7}</p><p>撃破 ${a.kills||0}　死亡 ${a.deaths||0}</p><p>装備：${esc(Object.entries(a.equip||{}).filter(([,v])=>v).map(([k])=>({shoppingCart:'買い物かご',cart:'リヤカー',foldBike:'折りたたみ自転車',rainGear:'雨具',backpack:'リュック',helmet:'ヘルメット',shield:'盾',doll:'身代わり人形',bicycle:'自転車',shoes:'安全靴',rearcar:'リヤカー'}[k]||'特殊装備')).join('・')||'なし')}</p></article>`).join(''));
  if(panel==='tiles'){const t=s.mapData.find(t=>t.id===(selectedTile??p.pos));set(content,(t?tileInfo(s,t):'')+'<p>確認するマスを選択</p><div class="mobile-tile-list">'+s.mapData.map(t=>`<button data-tile-info="${t.id}" aria-pressed="${t.id===(selectedTile??p.pos)}">${esc(t.id+' '+t.name)}</button>`).join('')+'</div>');}
 }
 function queue(){if(!pending){pending=true;requestAnimationFrame(update);}}
 store.subscribe(queue);new MutationObserver(queue).observe(document.querySelector('#root'),{childList:true,subtree:true});media.addEventListener('change',queue);
 new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class']});
 // CSS dvh follows Safari's browser bars; this also handles older visual viewports.
 function viewport(){document.documentElement.style.setProperty('--city-vh',(window.visualViewport?.height||innerHeight)+'px');queue();}
 window.visualViewport?.addEventListener('resize',viewport);window.addEventListener('resize',viewport);viewport();
}
