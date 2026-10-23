"""Retain the original rules, replace the default board, and add projection hooks."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
if not (root/'assets').exists():root=root/'dist'
s=(root/'assets/index-CRnOnW6E.js').read_text()
def replace_once(old,new):
 global s
 assert s.count(old)==1,(old,s.count(old))
 s=s.replace(old,new,1)
replace_once('id:`tile-${t.id}`,','id:`tile-${t.id}`,"data-original-tile":t.id,')
replace_once('style:{gridColumn:A.col,gridRow:A.row,position:`relative`','"data-original-player":t.id,style:{gridColumn:A.col,gridRow:A.row,position:`relative`')
replace_once('onClick:a?s:void 0,onMouseEnter:F', 'onClick:a?s:e=>window.cityMobileTile?.(t.id),onMouseEnter:F')
replace_once('F=(e,r=0,i=0)=>{let o=document.getElementById(`game-board-wrapper`)', 'F=(e,r=0,i=0)=>{if(window.cityMobileActive)return;let o=document.getElementById(`game-board-wrapper`)')
replace_once('d:O,fill:`url(#arcGradient)`','d:window.cityProjection?.weaponArc(g,p.range+.5,i)||O,"data-weapon-arc":true,fill:`url(#arcGradient)`')
replace_once('x2:o.x+c*Math.cos(i*Math.PI/180),y2:o.y+c*Math.sin(i*Math.PI/180)', 'x2:window.cityProjection?.aimEnd(g,p.range+.5,i)?.x??o.x+c*Math.cos(i*Math.PI/180),y2:window.cityProjection?.aimEnd(g,p.range+.5,i)?.y??o.y+c*Math.sin(i*Math.PI/180)')
replace_once('onClick:()=>t(e.id),style:{background:`#1a1309`', '"data-minigame":e.id,role:`button`,tabIndex:0,onKeyDown:r=>{if(r.key===`Enter`||r.key===` `){r.preventDefault();t(e.id)}},onClick:()=>t(e.id),style:{background:`#1a1309`')
# Keep the aiming pawn visible while retaining the native draggable controls.
replace_once('k=(0,G.jsxs)(`div`,{ref:f,style:{position:`fixed`,top:`50%`,left:`50%`,transform:`translate(-50%, -50%)`,', 'k=(0,G.jsxs)(`div`,{ref:f,"data-weapon-panel":true,style:{position:`fixed`,top:`auto`,left:`auto`,right:`16px`,bottom:`16px`,transform:`none`,maxWidth:`calc(100vw - 32px)`,maxHeight:`45vh`,overflowY:`auto`,')
replace_once('children:`✕ ｷｬンｾﾙ`','children:`✕ キャンセル`')
# Presentation hooks at the confirmed attack and current aiming direction. Cancels never fire this event.
replace_once('b=()=>{if(_){if(v.length===0)', 'b=()=>{if(_){window.cityProjection?.playAttack({playerId:h.id,card:p,angle:i,targetPos:v.find(t=>t.id===y)?.pos});if(v.length===0)')
replace_once('if(!g)return null;let _=r===`connected`', 'if(!g)return null;window.cityProjection?.setWeaponAim(i);let _=r===`connected`')
# Replace only the presentation; all shop state, pricing, inventory and callbacks stay native.
replace_once('return!e||!a?null:(0,G.jsx)(`div`,{style:ea.overlay,', 'if(e&&a)return(0,G.jsx)(PixelShop,{react:W,player:a,mode:o,setMode:s,catalog:c,owned:k,cart:x,add:S,decrement:C,clear:w,total:E,count:O,canPay:P,capacity:F,buy:L,sell:z,selection:A,toggleSell:j,clearSell:M,sellTotal:N,shuffle:R,shuffled:g,shuffling:u,toast:y,close:I});return!e||!a?null:(0,G.jsx)(`div`,{style:ea.overlay,')
start=s.index('r&&w&&(0,G.jsx)(`div`,{className:`modal-overlay`')
end=s.index(',s?.active&&',start)
old=s[start:end]
assert 'w.choices.map' in old and 'g&&j(t)' in old
replace_once(old,'r&&w&&(0,G.jsx)(PixelEvent,{key:i,react:W,story:w,index:i||0,canAct:g,onChoose:j})')
replace_once('function It(){return[','function legacyMidtownMap(){return[')
assert s.count('midtown (46)')==2
s=s.replace('midtown (46)','街めぐり (48・路地と噴水広場)')
s='import {PixelShop,PixelEvent} from "../src/pixel-scenes.js";\nimport {createCityBoard} from "../src/city-board-map.js";\nfunction It(){return createCityBoard()}\n'+s
s+='\nexport {Mt as smallMap,Nt as mediumMap,Pt as largeMap,It as originalMap,Ti as miniGames,mr as tileDescriptions};\n'
(root/'assets/original-city-runtime.js').write_text(s)
print('Original rules preserved; 48-square district board and presentation hooks added.')
