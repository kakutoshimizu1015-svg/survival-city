import { BOARD, CONNECTIONS } from './board.js';
import { routeChoices } from './game.js';
export function citySVG(s,icon,inspect=s.position){
 const routes=routeChoices(s);
 return `<div class="board-canvas world-host" id="board-canvas" data-world-status="loading"><div class="world-labels">${BOARD.map(t=>{
  const route=routes.find(r=>r.target===t.index),d=route?.id,caption=route?.remaining?'分岐点':t.name;
  return `<button class="board-tile world-tile ${d?'destination':''} ${t.index===s.position?'occupied':''} ${t.type==='manhole'?'manhole-tile':''} ${CONNECTIONS[t.index].length>2?'junction-tile':''}" data-tile="${t.index}" ${d?`data-direction="${d}"`:''} aria-label="${String(t.index+1).padStart(2,'0')}番 ${t.name}${d?'：ここに進む':t.index===s.position?'：現在地':''}" aria-current="${t.index===s.position?'location':'false'}" style="--tile:${t.color};left:${t.x}%;top:${t.y}%"><span class="world-tile-icon">${icon(t.icon)}${t.type==='manhole'?`<small>${t.index===2||t.index===40?'A':'B'}</small>`:''}</span>${d?`<span class="destination-label">${caption} →</span>`:''}</button>`;
 }).join('')}<span class="world-player-label">YOU</span></div><div class="world-loading">街を組み立てています…</div></div>`;
}
