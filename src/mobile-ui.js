import { tileIconHTML } from './tile-visuals.js';
import { t as itemCards } from '../assets/cards-BGoWm8gy.js';
import { itemArt } from './pixel-item-art.js';
import { c as characterTypes } from '../assets/useNetworkStore-CIe06z3C.js';
import { tileDescriptions } from '../assets/original-city-runtime.js';
// Compact presentation only: all actions and route choices still use the native controls.
export function installMobileUI(store){
 const media=matchMedia('(max-width:768px)'),root=document.createElement('section');root.id='city-mobile-ui';root.setAttribute('aria-label','ゲーム操作');document.body.append(root);
 root.innerHTML=`<header class="mobile-status"></header><section class="mobile-dock"><button class="mobile-result" aria-label="結果とログを見る" aria-live="polite"></button><div class="mobile-actions"></div><nav class="mobile-tabs" aria-label="ゲーム情報"><button data-panel="cards">🎴 手札</button><button data-panel="players">🏆 ランキング</button><button data-panel="logs">📜 ログ</button></nav></section><div class="mobile-sheet" hidden><header><h2></h2><button class="mobile-close" aria-label="情報を閉じる">閉じる ×</button></header><div class="mobile-sheet-content"></div></div>`;
 let panel='',selectedTile=null,signature='',pending=false,wasPlaying=false;
 const plain=s=>{const el=document.createElement('div');el.innerHTML=String(s||'');return el.textContent||'';};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rendered=new WeakMap();const set=(el,html)=>{if(rendered.get(el)!==html){rendered.set(el,html);el.innerHTML=html;}};
 const sheet=root.querySelector('.mobile-sheet'),content=root.querySelector('.mobile-sheet-content');
 const close=()=>open('');
 function open(next){panel=next;document.querySelectorAll('.tile-inspected').forEach(e=>e.classList.remove('tile-inspected'));if(next==='tiles')document.querySelector(`[data-original-tile="${selectedTile}"]`)?.classList.add('tile-inspected');signature='';document.body.dataset.mobilePanel=panel;sheet.hidden=!panel;root.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.panel===panel)));update();if(panel)root.querySelector('.mobile-close').focus({preventScroll:true});}
 root.querySelector('.mobile-close').onclick=close;
 root.querySelector('.mobile-tabs').onclick=e=>{const b=e.target.closest('[data-panel]');if(b){selectedTile=null;open(panel===b.dataset.panel?'':b.dataset.panel);}};
 root.querySelector('.mobile-result').onclick=()=>open('logs');
 function performAction(button){if(button.disabled||document.body.classList.contains('city-touring'))return;const original=[...document.querySelectorAll('#action-panel button')].find(x=>x.textContent===button.dataset.action);if(original&&!original.disabled){if(panel==='actions')close();original.click();}queue();}
 root.querySelector('.mobile-actions').onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.hasAttribute('data-more-actions')){open('actions');return;}if(document.body.classList.contains('city-touring'))return;if(b.dataset.route){document.querySelector(`[data-original-tile="${b.dataset.route}"]`)?.click();}else performAction(b);queue();};

 content.onclick=e=>{const nativeAction=e.target.closest('[data-action]');if(nativeAction){performAction(nativeAction);return;}const action=e.target.closest('[data-card-action]');if(action&&!action.disabled){const card=document.querySelector('#card-panel-clay')?.children[Number(action.dataset.cardIndex)],button=card?.querySelectorAll('button')[Number(action.dataset.cardAction)];if(button&&!button.disabled&&!document.body.classList.contains('city-touring')){button.click();if(/使用|売却|渡す/.test(button.textContent))close();}queue();return;}};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel)close();});
 window.cityMobileTile=id=>{if(!window.cityMobileActive)return;selectedTile=id;open('tiles');};
 function tileInfo(s,t){const info=tileDescriptions[t.type==='normal'?'normal_'+t.area:t.type]||tileDescriptions.normal;const owner=s.players.find(p=>p.id===s.territories?.[t.id]);return `<article class="mobile-tile-detail"><h3>${tileIconHTML(t.type)}${esc(t.id+'番 '+(t.name||info.title))}</h3><p>${esc(info.desc)}</p>${owner?'<p>所有者：'+esc(owner.name)+'</p>':''}</article>`;}
 function portrait(a){const img=document.querySelector(`[data-original-player="${a.id}"] img`);return img?`<img src="${esc(img.src)}" alt="${esc(a.name)}のキャラクター" draggable="false">`:'<span aria-hidden="true">👤</span>';}
 function hpBar(a){return `<span class="mobile-hp-track" role="meter" aria-label="${esc(a.name)}のHP" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${a.hp}"><i style="width:${Math.max(0,Math.min(100,a.hp))}%;background:${a.hp>50?'#79b96a':a.hp>20?'#dda648':'#d66c56'}"></i></span>`;}

 function territories(s,a){return Object.values(s.territories||{}).filter(id=>id===a.id).length;}
 root.addEventListener('click',e=>{const b=e.target.closest('[data-character]');if(b){close();store.setState({charInfoModal:Number(b.dataset.character)});}});
 function actionButton(b,tour){return `<button data-action="${esc(b.textContent)}" ${b.disabled||tour?'disabled':''}>${esc(b.textContent)}</button>`;}
 function update(){
  pending=false;const s=store.getState(),active=media.matches&&s.gamePhase==='playing';window.cityMobileActive=active;root.hidden=!active;document.body.classList.toggle('city-mobile',active);
  if(!active){if(wasPlaying){panel='';document.body.dataset.mobilePanel='';sheet.hidden=true;}wasPlaying=false;return;}
  if(!wasPlaying){window.scrollTo(0,0);wasPlaying=true;}
  const p=s.players[s.turn];if(!p)return;
  set(root.querySelector('.mobile-status'),`<div class="mobile-active-player"><button class="mobile-portrait" data-character="${p.id}" aria-label="${esc(p.name)}のキャラ詳細" style="--player-color:${esc(p.color)}">${portrait(p)}</button><div class="mobile-active-stats"><div class="mobile-name-row"><strong>${esc(p.name)}${p.isCPU?' (CPU)':''}</strong><small>★ ${esc(characterTypes[p.charType]?.name||'')}</small></div><div class="mobile-stats"><b>❤️ ${p.hp}</b><b>⚡ ${p.ap}</b><b>💰 ${p.p}P</b></div>${hpBar(p)}<div class="mobile-resources"><span>🥫 ${p.cans||0}</span><span>🗑️ ${p.trash||0}</span><span>🎴 ${p.hand?.length||0}/${p.maxHand||7}</span><span>🚩 ${territories(s,p)}</span><span>⚔️ ${p.kills||0} / 💀 ${p.deaths||0}</span></div></div></div><div class="mobile-opponents" aria-label="全プレイヤー">${s.players.filter(a=>a.id!==p.id).map(a=>`<button data-character="${a.id}" class="mobile-rival" style="--player-color:${esc(a.color)}" aria-label="${esc(a.name)}のキャラ詳細"><span class="mobile-rival-portrait">${portrait(a)}</span><span><strong>${esc(a.name)}${a.isCPU?' (CPU)':''}</strong><small>❤️ ${a.hp}　💰 ${a.p}P</small></span></button>`).join('')||'<span>ひとりでサバイバル</span>'}</div>`);

  const logs=s.logs||[],recent=plain(logs.at(-1));const result=root.querySelector('.mobile-result');const resultText=recent||'結果はここに表示されます。タップで履歴';if(result.textContent!==resultText)result.textContent=resultText;
  const tour=document.body.classList.contains('city-touring');const branch=s.isBranchPicking||s.isDashPicking;
  root.classList.toggle('choosing-route',branch);document.body.classList.toggle('mobile-branch',branch);
  const actions=root.querySelector('.mobile-actions');
  if(branch){const ids=s.currentBranchOptions||[];const html=ids.map((id,i)=>{const t=s.mapData.find(t=>t.id===id);return `<button data-route="${id}" ${tour?'disabled':''}><b><em>${i+1}</em>${tileIconHTML(t?.type)}${esc(t?.name||'進む')}</b><span>${id}番 · ${esc(t?.name||tileDescriptions[t?.type]?.title||'進む')}</span></button>`;}).join('');set(actions,html);}
  else{const buttons=[...document.querySelectorAll('#action-panel button')],primary=buttons.filter(b=>/サイコロを振る|移動 \(1AP\)|ターン終了/.test(b.textContent)),compact=buttons.length>4;
   const html=(compact?(primary.length?primary:buttons.slice(0,3)):buttons).map(b=>actionButton(b,tour)).join('')+(compact?'<button data-more-actions>その他の行動</button>':'');set(actions,html||'<p>進行中…</p>');}

  const cardTab=root.querySelector('[data-panel=cards]');const cardText=`🎴 手札 ${p.hand?.length||0}`;if(cardTab.textContent!==cardText)cardTab.textContent=cardText;
  const key=JSON.stringify([panel,selectedTile,logs,p,s.players,s.isBranchPicking,panel==='cards'?document.querySelector('#card-panel-clay')?.innerHTML:panel==='actions'?document.querySelector('#action-panel')?.innerHTML:'']);if(key===signature)return;signature=key;
  sheet.hidden=!panel;if(!panel)return;root.querySelector('.mobile-sheet h2').textContent={cards:'手札・アイテム',tiles:'マスの説明',players:'ランキング · 所持P順',logs:'結果・ログ',actions:'行動を選ぶ'}[panel];
  if(panel==='cards'){const cards=[...(document.querySelector('#card-panel-clay')?.children||[])];set(content,'<div class="mobile-hand">'+cards.map((card,index)=>{const buttons=[...card.querySelectorAll('button')],item=itemCards.find(c=>c.id===p.hand?.[index]);return `<article>${buttons.length&&item?`<img src="${itemArt(item.id)}" alt=""><h3>${esc(item.name)}</h3><p>${esc(item.desc||item.description||'')}</p>`:`<p>${esc(card.textContent)}</p>`}<div>${buttons.map((b,i)=>`<button data-card-index="${index}" data-card-action="${i}" ${b.disabled||tour?'disabled':''}>${esc(b.textContent)}</button>`).join('')}</div></article>`;}).join('')+'</div>');return;}
  if(panel==='logs')set(content,logs.length?`<ol class="mobile-log">${logs.slice().reverse().map(l=>`<li>${esc(plain(l))}</li>`).join('')}</ol>`:'<p>まだログはありません。</p>');
  if(panel==='actions')set(content,'<div class="mobile-all-actions">'+[...document.querySelectorAll('#action-panel button')].map(b=>actionButton(b,tour)).join('')+'</div>');
  if(panel==='players'){const ranked=s.players.slice().sort((a,b)=>b.p-a.p);set(content,'<ol class="mobile-ranking">'+ranked.map((a,i)=>`<li class="mobile-rank-row" data-ranked-player="${a.id}"><b class="mobile-rank-number">${i<3?['🥇','🥈','🥉'][i]:i+1}</b><button class="mobile-portrait" data-character="${a.id}" aria-label="${esc(a.name)}のキャラ詳細" style="--player-color:${esc(a.color)}">${portrait(a)}</button><div><h3>${esc(a.name)}${a.isCPU?' (CPU)':''}</h3><strong>💰 ${a.p}P</strong><p>❤️ ${a.hp}　🚩 ${territories(s,a)}　🎴 ${a.hand?.length||0}</p><small>⚔️ ${a.kills||0} / 💀 ${a.deaths||0}</small></div></li>`).join('')+'</ol>');}
  if(panel==='tiles'){const t=s.mapData.find(t=>t.id===selectedTile);set(content,t?tileInfo(s,t):'');}

 }
 function queue(){if(!pending){pending=true;requestAnimationFrame(update);}}
 store.subscribe(queue);new MutationObserver(queue).observe(document.querySelector('#root'),{childList:true,subtree:true});media.addEventListener('change',queue);
 new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class']});
 // CSS dvh follows Safari's browser bars; this also handles older visual viewports.
 function viewport(){document.documentElement.style.setProperty('--city-vh',(window.visualViewport?.height||innerHeight)+'px');queue();}
 window.visualViewport?.addEventListener('resize',viewport);window.addEventListener('resize',viewport);viewport();
}
