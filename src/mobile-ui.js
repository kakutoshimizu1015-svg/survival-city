import {goldScore,goldCompare,goldRankOf} from './gold-rules.js';
import {goldIconHTML} from './gold-ui.js';
import { tileIconHTML, tileVisualKey } from './tile-visuals.js';
import { t as itemCards } from '../assets/cards-BGoWm8gy.js';
import { itemArt } from './pixel-item-art.js';
import { c as characterTypes,P as chatStore,t as networkStore } from '../assets/useNetworkStore-CIe06z3C.js';
import {tileInfo as getTileInfo,tileDetailHTML} from './tile-info.js';
import { equipmentHTML } from './player-info.js';
import { tileDescriptions } from '../assets/original-city-runtime.js';
// Compact presentation only: all actions and route choices still use the native controls.
export function installMobileUI(store){
 const media=matchMedia('(max-width:768px)'),root=document.createElement('section');root.id='city-mobile-ui';root.setAttribute('aria-label','ゲーム操作');document.body.append(root);
 root.innerHTML=`<header class="mobile-status"></header><nav class="mobile-tabs" aria-label="ゲーム情報"><button data-panel="cards">🎴 手札</button><button data-panel="players">🏆 ランキング</button><button data-panel="logs">📜 ログ</button><button data-panel="chat" hidden>💬 チャット</button></nav><section class="mobile-dock"><button class="mobile-result" aria-label="結果とログを見る" aria-live="polite"></button><div class="mobile-actions"></div></section><div class="mobile-sheet" hidden><header><h2></h2><button class="mobile-close" aria-label="情報を閉じる">閉じる ×</button></header><div class="mobile-sheet-content"></div></div>`;
 let playerSort='rank',chatSeen=0;let panel='',selectedTile=null,signature='',pending=false,wasPlaying=false,selfId=null;
 const plain=s=>{const el=document.createElement('div');el.innerHTML=String(s||'');return el.textContent||'';};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rendered=new WeakMap();const set=(el,html)=>{if(rendered.get(el)!==html){rendered.set(el,html);el.innerHTML=html;}};
 const sheet=root.querySelector('.mobile-sheet'),content=root.querySelector('.mobile-sheet-content');
 const close=()=>open('');
 function open(next){document.querySelector('.city-tile-detail')?.remove();panel=next;if(next==='chat')chatSeen=chatStore.getState().chatHistory?.length||0;document.querySelectorAll('.tile-inspected').forEach(e=>e.classList.remove('tile-inspected'));if(next==='tiles')document.querySelector(`[data-original-tile="${selectedTile}"]`)?.classList.add('tile-inspected');signature='';document.body.dataset.mobilePanel=panel;sheet.hidden=!panel;root.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.panel===panel)));update();if(panel)root.querySelector('.mobile-close').focus({preventScroll:true});}
 root.querySelector('.mobile-close').onclick=close;
 root.querySelector('.mobile-tabs').onclick=e=>{const b=e.target.closest('[data-panel]');if(b){selectedTile=null;open(panel===b.dataset.panel?'':b.dataset.panel);}};
 root.querySelector('.mobile-result').onclick=()=>open('logs');
 function performAction(button){if(button.disabled||document.body.classList.contains('city-touring'))return;const original=[...document.querySelectorAll('#action-panel button')].find(x=>x.textContent===button.dataset.action);if(original&&!original.disabled){if(panel==='actions')close();original.click();}queue();}
 root.querySelector('.mobile-actions').onclick=e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(document.body.classList.contains('city-touring'))return;if(b.dataset.route){document.querySelector(`[data-original-tile="${b.dataset.route}"]`)?.click();}else performAction(b);queue();};

 content.onclick=e=>{const sort=e.target.closest('[data-player-sort]');if(sort){playerSort=sort.dataset.playerSort;signature='';update();return;}const nativeAction=e.target.closest('[data-action]');if(nativeAction){performAction(nativeAction);return;}const action=e.target.closest('[data-card-action]');if(action&&!action.disabled){const card=document.querySelector('#card-panel-clay')?.children[Number(action.dataset.cardIndex)],button=card?.querySelectorAll('button')[Number(action.dataset.cardAction)];if(button&&!button.disabled&&!document.body.classList.contains('city-touring')){button.click();if(/使用|売却|渡す/.test(button.textContent))close();}queue();return;}};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel)close();});
 window.cityMobileTile=id=>{if(!window.cityMobileActive)return;close();window.cityInspectTile?.(id);};
 function tileInfo(s,t){return `<div class="mobile-tile-detail">${tileDetailHTML(t,window.cityGetTileInfo?.(t.id)||getTileInfo(s,t,tileDescriptions))}</div>`;}
 function portrait(a){const img=document.querySelector(`[data-original-player="${a.id}"] img`);return img?`<img src="${esc(img.src)}" alt="${esc(a.name)}のキャラクター" draggable="false">`:'<span aria-hidden="true">👤</span>';}
 function hpBar(a){return `<span class="mobile-hp-track" role="meter" aria-label="${esc(a.name)}のHP" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${a.hp}"><i style="width:${Math.max(0,Math.min(100,a.hp))}%;background:${a.hp>50?'#79b96a':a.hp>20?'#dda648':'#d66c56'}"></i></span>`;}

 function territories(s,a){return Object.values(s.territories||{}).filter(id=>id===a.id).length;}
 root.addEventListener('click',e=>{const b=e.target.closest('[data-character]');if(b){close();store.setState({charInfoModal:Number(b.dataset.character)});}});
 function actionButton(b,tour){return `<button data-action="${esc(b.textContent)}" ${b.disabled||tour?'disabled':''}>${esc(b.textContent)}</button>`;}
 function update(){
  pending=false;const s=store.getState(),active=media.matches&&s.gamePhase==='playing';window.cityMobileActive=active;root.hidden=!active;document.body.classList.toggle('city-mobile',active);
  if(!active){if(wasPlaying){panel='';document.body.dataset.mobilePanel='';sheet.hidden=true;}wasPlaying=false;return;}
  if(!wasPlaying){window.scrollTo(0,0);selfId=s.players.find(p=>!p.isCPU)?.id;wasPlaying=true;}
  const p=s.players[s.turn];if(!p)return;const me=s.players.find(a=>networkStore.getState().status==='connected'?a.userId===networkStore.getState().myUserId:a.id===selfId)||s.players.find(a=>!a.isCPU)||p;
  set(root.querySelector('.mobile-status'),`<div class="mobile-active-player"><button class="mobile-portrait" data-character="${me.id}" aria-label="${esc(me.name)}のキャラ詳細" style="--player-color:${esc(me.color)}">${portrait(me)}</button><div class="mobile-active-stats"><div class="mobile-name-row"><strong>${esc(me.name)}${me.isCPU?' (CPU)':''}</strong><small>★ ${esc(characterTypes[me.charType]?.name||'')}</small></div><div class="mobile-stats"><b>❤️ ${me.hp}</b><b>⚡ ${me.ap}</b><b>💰 ${me.p}P</b></div>${hpBar(me)}<div class="mobile-resources"><span>🥫 ${me.cans||0}</span><span>🗑️ ${me.trash||0}</span><span>🎴 ${me.hand?.length||0}/${me.maxHand||7}</span><span>🚩 ${territories(s,me)}</span>${s.goldMode?`<span class="gold-player-count">${goldIconHTML()} ${me.goldCans||0}</span><span>⚔️ ${me.pvpKills||0} · ${goldScore(me)}点</span>`:`<span>⚔️ ${me.kills||0} / 💀 ${me.deaths||0}</span>`}</div><div class="mobile-equipment" aria-label="装備アイテム">${equipmentHTML(me)}</div></div></div>`);

  const logs=s.logs||[],recent=plain(logs.at(-1));const result=root.querySelector('.mobile-result');const resultText=recent||'結果はここに表示されます。タップで履歴';if(result.textContent!==resultText)result.textContent=resultText;
  const tour=document.body.classList.contains('city-touring');const branch=s.isBranchPicking||s.isDashPicking;
  root.classList.toggle('choosing-route',branch);document.body.classList.toggle('mobile-branch',branch);
  const actions=root.querySelector('.mobile-actions');
  if(branch){const ids=s.currentBranchOptions||[];const html=ids.map((id,i)=>{const t=s.mapData.find(t=>t.id===id),info=t&&getTileInfo(s,t,tileDescriptions);return `<button data-route="${id}" ${tour?'disabled':''}><b><em>${i+1}</em>${tileIconHTML(tileVisualKey(t))}${esc(t?.name||'進む')}</b><span>${esc(info?.short||'進む')}</span>${info?.extra?`<small>${esc(info.extra)}</small>`:''}</button>`;}).join('');set(actions,html);}
  else{const buttons=[...document.querySelectorAll('#action-panel button')];set(actions,buttons.map(b=>actionButton(b,tour)).join('')||`<p>${esc(p.name)}の手番です</p>`);}
  const rows=Math.max(2,Math.ceil(actions.querySelectorAll('button').length/(branch?2:4)));document.body.style.setProperty('--mobile-action-rows',rows);


  const online=networkStore.getState().status==='connected',history=chatStore.getState().chatHistory||[],chatTab=root.querySelector('[data-panel=chat]');
  chatTab.hidden=!online;root.querySelector('.mobile-tabs').classList.toggle('has-chat',online);
  if(panel==='chat')chatSeen=history.length;
  chatTab.textContent='💬 チャット'+(history.length>chatSeen?` (${history.length-chatSeen})`:'');
  if(!online&&panel==='chat'){close();return;}
  const cardTab=root.querySelector('[data-panel=cards]');const cardText=`🎴 手札 ${me.hand?.length||0}`;if(cardTab.textContent!==cardText)cardTab.textContent=cardText;
  const key=JSON.stringify([panel,playerSort,history,online,selectedTile,logs,p,me,s.players,s.isBranchPicking,panel==='tiles'?window.cityGetTileInfo?.(selectedTile):null,panel==='cards'?document.querySelector('#card-panel-clay')?.innerHTML:panel==='actions'?document.querySelector('#action-panel')?.innerHTML:'']);if(key===signature)return;signature=key;
  sheet.hidden=!panel;if(!panel)return;root.querySelector('.mobile-sheet h2').textContent={cards:'手札・アイテム',tiles:'マスの説明',players:s.goldMode?'ランキング · 金缶×3＋対人キル×2':'ランキング · 所持P順',logs:'結果・ログ',chat:'オンラインチャット',actions:'行動を選ぶ'}[panel];
  if(panel==='cards'&&me.id!==p.id){set(content,'<p>自分の手札 · 使用は自分の手番でできます</p><div class="mobile-hand">'+(me.hand||[]).map(id=>{const item=itemCards.find(c=>c.id===id);return item?`<article><img src="${itemArt(id)}" alt=""><h3>${esc(item.name)}</h3><p>${esc(item.desc)}</p></article>`:'';}).join('')+'</div>');return;}
  if(panel==='cards'){const cards=[...(document.querySelector('#card-panel-clay')?.children||[])];set(content,'<div class="mobile-hand">'+cards.map((card,index)=>{const buttons=[...card.querySelectorAll('button')],item=itemCards.find(c=>c.id===p.hand?.[index]);return `<article>${buttons.length&&item?`<img src="${itemArt(item.id)}" alt=""><h3>${esc(item.name)}</h3><p>${esc(item.desc||item.description||'')}</p>`:`<p>${esc(card.textContent)}</p>`}<div>${buttons.map((b,i)=>`<button data-card-index="${index}" data-card-action="${i}" ${b.disabled||tour?'disabled':''}>${esc(b.textContent)}</button>`).join('')}</div></article>`;}).join('')+'</div>');return;}
  if(panel==='chat'){
   if(!content.querySelector('.mobile-chat-form')){
    content.innerHTML='<ol class="mobile-chat-history" aria-live="polite"></ol><form class="mobile-chat-form"><input aria-label="チャットメッセージ" placeholder="メッセージを入力…" maxlength="40" autocomplete="off"><button type="submit">送信</button></form>';rendered.delete(content);
    content.querySelector('form').onsubmit=e=>{e.preventDefault();const input=content.querySelector('input'),text=input.value.trim(),net=networkStore.getState();if(!text||net.status!=='connected')return;if(!net.isHost&&!net.hostConnection?.open)return;
     const sender=net.lobbyPlayers.find(p=>p.userId===net.myUserId)?.name||me.name,chat={id:Date.now()+Math.random(),sender,text},packet={type:'CHAT',chat};
     chatStore.getState().addChatToQueue(chat);if(net.isHost)net.connections.forEach(c=>{if(c.open)c.send(packet)});else net.hostConnection.send(packet);input.value='';queue();};
   }
   const list=content.querySelector('.mobile-chat-history'),bottom=list.scrollHeight-list.scrollTop-list.clientHeight<48;
   set(list,history.length?history.map(m=>`<li><strong>${esc(m.sender)}</strong>${esc(m.text)}</li>`).join(''):'<li>参加者にメッセージを送れます。</li>');if(bottom)list.scrollTop=list.scrollHeight;return;
  }
  if(panel==='logs')set(content,logs.length?`<ol class="mobile-log">${logs.slice().reverse().map(l=>`<li>${esc(plain(l))}</li>`).join('')}</ol>`:'<p>まだログはありません。</p>');
  if(panel==='actions')set(content,'<div class="mobile-all-actions">'+[...document.querySelectorAll('#action-panel button')].map(b=>actionButton(b,tour)).join('')+'</div>');
  if(panel==='players'){const teams={red:0,blue:1,green:2,yellow:3,none:99},ranked=s.players.slice();if(playerSort==='rank')ranked.sort(s.goldMode?goldCompare:(a,b)=>b.p-a.p);if(playerSort==='team')ranked.sort((a,b)=>(teams[a.teamColor]??50)-(teams[b.teamColor]??50));set(content,'<nav class="mobile-sort-tabs" aria-label="プレイヤーの並べ替え">'+[['order','順番'],['rank','ランク'],['team','チーム']].map(([key,label])=>`<button data-player-sort="${key}" aria-pressed="${playerSort===key}">${label}</button>`).join('')+'</nav><ol class="mobile-ranking">'+ranked.map((a,i)=>`<li class="mobile-rank-row" data-ranked-player="${a.id}"><b class="mobile-rank-number">${playerSort!=='rank'?s.players.indexOf(a)+1:s.goldMode?(['🥇','🥈','🥉'][goldRankOf(ranked,a)-1]||goldRankOf(ranked,a)):i<3?['🥇','🥈','🥉'][i]:i+1}</b><button class="mobile-portrait" data-character="${a.id}" aria-label="${esc(a.name)}のキャラ詳細" style="--player-color:${esc(a.color)}">${portrait(a)}</button><div><h3>${playerSort==='team'?({red:'🔴 ',blue:'🔵 ',green:'🟢 ',yellow:'🟡 ',none:''}[a.teamColor]||''):''}${esc(a.name)}${a.isCPU?' (CPU)':''}${a.id===p.id?' · 手番':''}</h3><strong>${s.goldMode?`${goldIconHTML()} ${a.goldCans||0} · ⚔️ ${a.pvpKills||0} · ${goldScore(a)}点`:`💰 ${a.p}P`}</strong><p>💰 ${a.p}P　❤️ ${a.hp}　🚩 ${territories(s,a)}　🎴 ${a.hand?.length||0}</p><div class="mobile-equipment">${equipmentHTML(a)}</div><small>${s.goldMode?`NPC討伐 ${a.npcKills||0} / 💀 ${a.deaths||0}`:`⚔️ ${a.kills||0} / 💀 ${a.deaths||0}`}</small></div></li>`).join('')+'</ol>');}
  if(panel==='tiles'){const t=s.mapData.find(t=>t.id===selectedTile);set(content,t?tileInfo(s,t):'');}

 }
 function queue(){if(!pending){pending=true;requestAnimationFrame(update);}}
 window.addEventListener('city-item-art-ready',()=>{signature='';queue();});
 store.subscribe(queue);networkStore.subscribe(queue);chatStore.subscribe(queue);new MutationObserver(queue).observe(document.querySelector('#root'),{childList:true,subtree:true});media.addEventListener('change',queue);
 new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['class']});
 // CSS dvh follows Safari's browser bars; this also handles older visual viewports.
 function viewport(){document.documentElement.style.setProperty('--city-vh',(window.visualViewport?.height||innerHeight)+'px');queue();}
 window.visualViewport?.addEventListener('resize',viewport);window.addEventListener('resize',viewport);viewport();
}
