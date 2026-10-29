// A compact result strip with the same history as the mobile log sheet.
export function installDesktopLog(store){
 const root=document.querySelector('#root'),panel=document.createElement('details');
 panel.className='city-desktop-log';panel.hidden=true;
 const summary=document.createElement('summary'),heading=document.createElement('strong'),latest=document.createElement('span'),history=document.createElement('ol');
 heading.textContent='📜 ログ';latest.className='city-desktop-result';latest.setAttribute('aria-live','polite');history.setAttribute('aria-label','ログ（新しい順）');history.tabIndex=0;
 summary.append(heading,latest);panel.append(summary,history);
 const parser=document.createElement('template');
 const plain=value=>{parser.innerHTML=String(value??'');return parser.content.textContent||'';};
 let queued=false,signature=null,wasPlaying=false;
 function render(){
  queued=false;const s=store.getState(),playing=s.gamePhase==='playing',host=document.querySelector('#right-side-area');
  panel.hidden=!playing;if(!playing){panel.open=false;wasPlaying=false;return;}
  if(host&&panel.parentNode!==host)host.prepend(panel);
  if(!wasPlaying){panel.open=false;signature=null;}wasPlaying=true;
  const lines=(s.logs||[]).map(plain),key=JSON.stringify(lines);
  // Source cache prevents a MutationObserver loop on browser HTML normalization.
  if(key===signature)return;signature=key;
  const text=lines.at(-1)||'結果はここに表示されます。クリックで履歴';
  if(latest.textContent!==text)latest.textContent=text;
  const scroll=history.scrollTop,height=history.scrollHeight;
  const entries=(lines.length?lines.slice().reverse():['まだログはありません。']).map(line=>{const li=document.createElement('li');li.textContent=line;return li;});
  history.replaceChildren(...entries);history.scrollTop=scroll>0?scroll+history.scrollHeight-height:0;
 }
 function schedule(){if(!queued){queued=true;queueMicrotask(render);}}
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.open){e.preventDefault();panel.open=false;summary.focus();}});
 store.subscribe(schedule);if(root)new MutationObserver(schedule).observe(root,{childList:true,subtree:true});render();
}
