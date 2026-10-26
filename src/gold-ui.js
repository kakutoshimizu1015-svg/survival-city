import {goldScore,goldCompare,canBuyGold,GOLD_PRICE} from './gold-rules.js';
export const GOLD_ICON='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 40"><path fill="#704517" d="M7 4h18v5l3 6-3 6 2 14-5 3H9l-5-5 3-14-3-5 3-5z"/><path fill="#e3ab32" d="M9 6h14v5l3 5-5 6 3 12-4 2H10l-4-4 4-14-4-4 3-3z"/><path fill="#fff1a2" d="M10 9h4v8l-3 10v5H8l3-14zM8 5h16v3H8zM9 33h13v3H9z"/><path fill="#98600f" d="M18 11h4l-3 9 3 12h-4l-2-12z"/><path fill="#fff5c0" d="M25 1h2v3h3v2h-3v3h-2V6h-3V4h3z"/></svg>');
export const goldIconHTML=()=>`<img class="gold-can-icon" src="${GOLD_ICON}" alt="金缶">`;
export function GoldBadge({react:R,player:p}){return R.createElement('span',{className:'gold-badge'},R.createElement('img',{src:GOLD_ICON,alt:'金缶',className:'gold-can-icon'}),` ${p.goldCans||0} · ⚔️ ${p.pvpKills||0} · ${goldScore(p)}点`);}
export function GoldResults({react:R,result,onExit}){
 const h=R.createElement;const rows=result.isTeamGame?result.sortedTeams.map(t=>({name:t.color==='none'?t.members[0].name:t.color+'チーム',totalScore:t.total,p:t.p,goldCans:t.members.reduce((n,p)=>n+(p.goldCans||0),0),pvpKills:t.members.reduce((n,p)=>n+(p.pvpKills||0),0)})):result.results;
 return h('div',{className:'gold-results',role:'dialog','aria-label':'金缶争奪戦の結果'},h('section',null,h('img',{src:GOLD_ICON,alt:'金缶',className:'gold-result-can'}),h('h1',null,'金缶争奪戦 結果'),h('p',null,'金缶 × 3 ＋ 対人キル × 2｜同点は所持P'),h('ol',null,rows.map((p,i)=>h('li',{key:i},h('strong',null,`${i&&p.totalScore===rows[i-1].totalScore&&p.p===rows[i-1].p?'同順位':i+1+'位'} ${p.name}`),h('b',null,p.totalScore+'点'),h('small',null,`金缶 ${p.goldCans||0}　⚔️ ${p.pvpKills||0}　💰 ${p.p}P`)))),h('button',{onClick:onExit},'タイトルへ戻る')));
}
export function installGoldUI(store,network,session){
 const box=document.createElement('aside');box.className='gold-objective';box.setAttribute('aria-label','金缶の目的地');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let html='';
 function update(){const s=store.getState(),board=document.querySelector('#board-area');if(board&&box.parentNode!==board)board.append(box);box.hidden=!s.goldMode||s.gamePhase!=='playing'||s.gameOver;if(box.hidden)return;
  const p=s.players[s.turn],tile=s.mapData.find(t=>t.id===s.gold?.spot),net=network.getState(),mine=p&&!p.isCPU&&(net.status!=='connected'||p.userId===net.myUserId),can=mine&&canBuyGold(s,p.id)&&!s.shopActive&&!s.mgActive&&!s.storyActive&&!s.weaponArcData&&!s.turnBannerActive&&!document.body.classList.contains('city-touring');
  const text=`${goldIconHTML()}<div><strong>${tile?'金缶 · '+tile.id+'番':s.roundCount>=s.maxRounds?'最終ラウンド · 金缶を守れ！':'次の金缶は次ラウンド'}</strong><small>${tile?esc(tile.name)+' · 10Pで獲得':'金缶×3 ＋ 対人キル×2'}</small></div>${tile?`<button data-gold-focus aria-label="金缶の場所を見る">場所</button>`:''}${p?.pos===tile?.id&&mine?`<button data-buy-gold ${can?'':'disabled'}>${p.p<GOLD_PRICE?'10P必要':'金缶を買う'}</button>`:''}`;
  if(text!==html){html=text;box.innerHTML=text;}
 }
 box.addEventListener('click',e=>{if(e.target.closest('[data-buy-gold]'))session.buy();if(e.target.closest('[data-gold-focus]'))window.cityProjection?.inspectTile(store.getState().gold.spot);});
 store.subscribe(()=>queueMicrotask(update));new MutationObserver(update).observe(document.querySelector('#root'),{childList:true,subtree:true});new MutationObserver(update).observe(document.body,{attributes:true,attributeFilter:['class']});update();
}
