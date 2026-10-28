import {isAtom} from "./atom-map.js";
import {atomTileDescription,atomText} from "./atom-rules.js";
import {GOLD_TILE_RULES} from "./rule-details.js";
import {tileNpcEffects,viewerPlayer} from './npc-impact.js';
import {tileIconHTML} from './tile-visuals.js';
export function tileInfo(s,t,descriptions,context={}){
 const key=t.type==='normal'?'normal_'+t.area:t.type,base=(s.goldMode&&GOLD_TILE_RULES[key])||descriptions[key]||descriptions.normal;
 const desc=(isAtom(s)&&atomTileDescription(s,t))|| (s.goldMode&&t.type==='center'?'HPが0になるとここで復活。金缶は1個まで奪われるか、倒れた場所に落ちます。':base.desc);
 const short=(isAtom(s)&&atomTileDescription(s,t))||{center:'倒れるとここで復活',normal:'陣地化3P · 収入'+({slum:1,commercial:2,luxury:3}[t.area]||1)+'P',can:'1APで缶拾い · 1ターン3回',trash:'2APでゴミ漁り · 失敗で補導',exchange:'缶・ゴミを換金 · 0AP',job:'3APでバイト · 成功で12P',shop:'カードの購入・売却',event:'イベント・ミニゲームが発生',shelter:'滞在中は収集車を必ず回避',manhole:'1APで別の穴へワープ',koban:'このターンは移動不可'}[t.type]||desc;
 const owner=s.players.find(p=>p.id===s.territories?.[t.id]);
 return {title:t.name||base.title,typeTitle:base.title,desc:atomText(s,desc),short:atomText(s,short),npcs:tileNpcEffects(s,t,context.player||viewerPlayer(s),context.visibleKeys),extra:[s.gold?.nextSpot===t.id?`金缶の予告：${s.gold.nextRound}ラウンドに登場（10P）`:'',s.gold?.spot===t.id?'金缶を10Pで購入可能':'',s.gold?.drops?.[t.id]?`落ちている金缶：${s.gold.drops[t.id]}個`:'',owner?`所有者：${owner.name}`:''].filter(Boolean).join(' ／ ')};
}

const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function tileDetailHTML(t,info){return `<article class="city-tile-content"><h3>${tileIconHTML(t.atomKind||t.type)}${t.id}番 ${escapeHTML(info.title)}</h3><p class="city-tile-description">${escapeHTML(info.desc)}</p>${info.npcs.length?`<ul class="city-tile-npcs">${info.npcs.map(n=>`<li data-npc-effect="${n.tone}"><strong>${n.icon} ${escapeHTML(n.name)}</strong><span>${n.tone==='bad'?'⚠ ':n.tone==='good'?'+ ':''}${escapeHTML(n.desc)}</span></li>`).join('')}</ul>`:''}${info.extra?`<p class="city-tile-extra">${escapeHTML(info.extra)}</p>`:''}</article>`;}
export function tileTooltipText(info){return [info.desc,...info.npcs.map(n=>`${n.icon} ${n.name}: ${n.desc}`),info.extra].filter(Boolean).join('\n─────\n');}
