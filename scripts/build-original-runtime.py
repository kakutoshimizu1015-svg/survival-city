"""Retain the original rules, replace the default board, and add projection hooks."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
if not (root/'assets').exists():root=root/'dist'
s=(root/'assets/index-CRnOnW6E.js').read_text()
def replace_once(old,new):
 global s
 assert s.count(old)==1,(old,s.count(old))
 s=s.replace(old,new,1)
# The main city UI and CPU use the same 2 AP dash as the host skill handler.
replace_once('action:Ge,condition:F(3)&&j&&!N', 'action:Ge,condition:F(2)&&j&&!N')
s=s.replace('疾風ダッシュ (3AP)', '疾風ダッシュ (2AP)').replace('疾風ダッシュ（3AP）', '疾風ダッシュ（2AP）').replace('`3AP: ピッタリ3マス先へ跳躍`','`2AP: ピッタリ3マス先へ跳躍`')
replace_once('children:E.action.name', 'children:E.id===`athlete`?E.action.name.replace(`3AP`,`2AP`):E.action.name')
replace_once('n.charType===`athlete`&&n.ap>=3&&', 'n.charType===`athlete`&&n.ap>=(e.goldMode?2:3)&&!n.cannotMove&&')
replace_once('i&&i.score>0&&(T.getState().updateCurrentPlayer(e=>({ap:e.ap-3,pos:i.tileId})),H(`🏃 ${n.name}が【疾風ダッシュ】！(評価:${i.score})`),x(n.id),d=!0)', 'i&&i.score>0&&(e.goldMode?(Ge(),T.getState().isDashPicking&&T.getState().currentBranchOptions.includes(i.tileId)&&le(i.tileId)):(T.getState().updateCurrentPlayer(e=>({ap:e.ap-3,pos:i.tileId})),H(`🏃 ${n.name}が【疾風ダッシュ】！(評価:${i.score})`),x(n.id)),d=!0)')
replace_once('id:`tile-${t.id}`,','id:`tile-${t.id}`,"data-original-tile":t.id,')
replace_once('style:{gridColumn:A.col,gridRow:A.row,position:`relative`','"data-original-player":t.id,style:{gridColumn:A.col,gridRow:A.row,position:`relative`')
replace_once('onClick:a?s:void 0,onMouseEnter:F', 'onClick:a?s:e=>window.cityInspectTile?.(t.id),onMouseEnter:F')
replace_once('F=(e,r=0,i=0)=>{let o=document.getElementById(`game-board-wrapper`)', 'F=(e,r=0,i=0)=>{if(window.cityTileTooltip){window.cityTileTooltip(t.id,e,r,i);return}let o=document.getElementById(`game-board-wrapper`)')
replace_once('d:O,fill:`url(#arcGradient)`','d:window.cityProjection?.weaponArc(g,p.range+.5,i)||O,"data-weapon-arc":true,fill:`url(#arcGradient)`')
replace_once('x2:o.x+c*Math.cos(i*Math.PI/180),y2:o.y+c*Math.sin(i*Math.PI/180)', 'x2:window.cityProjection?.aimEnd(g,p.range+.5,i)?.x??o.x+c*Math.cos(i*Math.PI/180),y2:window.cityProjection?.aimEnd(g,p.range+.5,i)?.y??o.y+c*Math.sin(i*Math.PI/180)')
replace_once('onClick:()=>t(e.id),style:{background:`#1a1309`', '"data-minigame":e.id,role:`button`,tabIndex:0,onKeyDown:r=>{if(r.key===`Enter`||r.key===` `){r.preventDefault();t(e.id)}},onClick:()=>t(e.id),style:{background:`#1a1309`')
# Keep the aiming pawn visible while retaining the native draggable controls.
replace_once('k=(0,G.jsxs)(`div`,{ref:f,style:{position:`fixed`,top:`50%`,left:`50%`,transform:`translate(-50%, -50%)`,', 'k=(0,G.jsxs)(`div`,{ref:f,"data-weapon-panel":true,style:{position:`fixed`,top:`auto`,left:`auto`,right:`16px`,bottom:`16px`,transform:`none`,maxWidth:`calc(100vw - 32px)`,maxHeight:`45vh`,overflowY:`auto`,')
replace_once('children:`✕ ｷｬンｾﾙ`','children:`✕ キャンセル`')
# Presentation hooks at the confirmed attack and current aiming direction. Cancels never fire this event.
replace_once('b=()=>{if(_){if(v.length===0)', 'b=()=>{if(_){window.cityProjection?.playAttack({playerId:h.id,card:p,angle:i,targetPos:v.find(t=>t.id===y)?.pos});if(v.length===0)')
replace_once('if(!g)return null;let _=r===`connected`', 'if(!g)return null;window.cityProjection?.setWeaponAim(i);let _=r===`connected`')
# Pixel presentation for shops; the gold-mode transaction handler is substituted below.
replace_once('return!e||!a?null:(0,G.jsx)(`div`,{style:ea.overlay,', 'if(e&&a)return(0,G.jsx)(PixelShop,{react:W,player:a,mode:o,setMode:s,catalog:c,owned:k,cart:x,add:S,decrement:C,clear:w,total:E,count:O,canPay:P,capacity:F,buy:L,sell:z,selection:A,toggleSell:j,clearSell:M,sellTotal:N,shuffle:R,shuffled:g,shuffling:u,toast:y,close:I});return!e||!a?null:(0,G.jsx)(`div`,{style:ea.overlay,')
start=s.index('r&&w&&(0,G.jsx)(`div`,{className:`modal-overlay`')
end=s.index(',s?.active&&',start)
old=s[start:end]
assert 'w.choices.map' in old and 'g&&j(t)' in old
replace_once(old,'r&&w&&(0,G.jsx)(PixelEvent,{key:i,react:W,story:w,index:i||0,canAct:g,onChoose:j})')
replace_once('function It(){return[','function legacyMidtownMap(){return[')
assert s.count('midtown (46)')==2
s=s.replace('midtown (46)','街めぐり (48・路地と噴水広場)')
# Gold-can competition: generated runtime only; classic.html keeps the original UI.
replace_once('ie({type:`GAME_START`,gameState:m})','Object.assign(m,createGoldState(m));ie({type:`GAME_START`,gameState:m})')
replace_once('let r=n.cpuDifficulty||`normal`;if(r===`easy`)', 'let remaining=e.maxRounds-e.roundCount+1,r=n.cpuDifficulty||`normal`;if(r===`easy`&&!e.goldMode)')
replace_once('){let t=e.mapData.find(e=>e.id===n.pos);if(!t)break;', '){if(e.goldMode&&goldCpuStep(T,{cards:Ce,useCard:Oe,damage:V,move:le,exchange:z,job:R,network:oe,log:H,sound:D})){await Kn(500);continue}let t=e.mapData.find(e=>e.id===n.pos);if(!t)break;')
start=s.index('f&&(0,G.jsxs)(`div`,{className:`modal-overlay`',s.index('Ei=()=>'))
end=s.index(',_&&(0,G.jsx)',start)
replace_once(s[start:end], 'f&&(f.goldMode?(0,G.jsx)(GoldResults,{react:W,result:f,message:S,onEnter:()=>D(`win`),onExit:()=>T.getState().resetGame()}):'+s[start+3:end]+')')
replace_once('children:`✨ ボーナス +50P 獲得!! ✨`', 'children:T.getState().goldMode?`称号獲得！ 得点加算なし`:`✨ ボーナス +50P 獲得!! ✨`')
replace_once('if(r){let e=[...i].sort((e,t)=>t.p-e.p);return', 'if(r&&!T.getState().goldMode){let e=[...i].sort((e,t)=>t.p-e.p);return')
replace_once('qn=(e,t)=>{let n=', 'qn=(e,t)=>{if(t.goldMode)return goldScore(e);let n=')
replace_once('r===`rank`?t.sort((e,t)=>t.p-e.p)', 'r===`rank`?t.sort(T.getState().goldMode?goldCompare:(e,t)=>t.p-e.p)')
replace_once('children:[`⚔️ `,r.kills,`K / 💀`,r.deaths,`D`]', 'children:T.getState().goldMode?(0,G.jsx)(GoldBadge,{react:W,player:r}):[`⚔️ `,r.kills,`K / 💀`,r.deaths,`D`]')
replace_once('children:[`❤️`,e.hp,` 💰`,e.p,`P 🎴`,e.hand?.length||0,` 🚩`,o]', 'children:T.getState().goldMode?[(0,G.jsx)(GoldBadge,{react:W,player:e}),(0,G.jsxs)(`div`,{className:`city-player-vitals`,children:[(0,G.jsxs)(`span`,{children:[`❤️ `,e.hp]}),(0,G.jsxs)(`span`,{children:[`💰 `,e.p,`P`]}),(0,G.jsxs)(`span`,{children:[`🎴 `,e.hand?.length||0]}),(0,G.jsxs)(`span`,{children:[`🚩 `,o]})]})]:[`❤️`,e.hp,` 💰`,e.p,`P 🎴`,e.hand?.length||0,` 🚩`,o]')
replace_once('if(r===`rank`){let t=a.indexOf(e);', 'if(r===`rank`){let t=T.getState().goldMode?goldRankOf(a,e)-1:a.indexOf(e);')
# Include the carried equipment that was missing from the original compact status bar.
replace_once('tr=[{key:`stealth`', 'tr=[{key:`shoppingCart`,field:`equip.shoppingCart`,emoji:`🛒`,title:`買い物カート`},{key:`foldBike`,field:`equip.foldBike`,emoji:`🚲`,title:`折りたたみ自転車`},{key:`backpack`,field:`equip.backpack`,emoji:`🎒`,title:`リュック`},{key:`stealth`')
# Use the same item illustrations in the original desktop hand and the pixel shop.
replace_once('children:[a.icon,` `,a.name]', 'children:[(0,G.jsx)(PixelItemIcon,{react:W,id:a.id,className:`city-hand-item-art`}),` `,a.name]')
replace_once('title:e.title,children:e.emoji', 'title:e.title,children:(0,G.jsx)(PixelItemIcon,{react:W,id:EQUIPMENT_ITEM_IDS[e.key],className:`city-equipped-item-art`,alt:e.title})')
# The full tutorial and rules must agree with the new result screen.
start=s.index('`スコア ＝ `')
end=s.index('})',s.index('※ゲーム終了時の陣地の価値：',start))+2
replace_once(s[start:end], '`金缶×3 ＋ 対人キル×2。同点は所持P。金缶は現地で10P、対人キルで2点。金缶は倒れた場所に最大1個落下し、到着で無料回収。NPC討伐は加点なし。`')
s=s.replace('スコア ＝ 所持P × 2 ＋ 陣地の価値(スラム3/商業6/高級10) ＋ 資源価値 ＋ キル×3 − デス×5','スコア ＝ 金缶×3 ＋ 対人キル×2。同点は所持P。金缶は現地で10P、倒れると金缶を最大1個落とし、到着した人が無料回収。')
s=s.replace('死亡回数が多いと大きく減点されるので注意！','倒れると、その場に金缶を最大1個落とします。拾うにはそのマスへ移動しよう。')
# Gold deck, predictable basic stock, and one shared rulebook for help/tutorial.
replace_once('Li=()=>{let e=Ce.map', 'Li=()=>{if(T.getState().goldMode)return goldShopIds(Ce);let e=Ce.map')
replace_once('let r=n?.[e.id]||0,i=e.type===`weapon`?', 'let r=n?.[shopPurchaseKey(T.getState(),t,e.id)]||0,i=e.type===`weapon`?')
replace_once('price:Math.max(0,i-a),desc:e.desc', 'price:T.getState().goldMode?goldShopPrice(e,t):Math.max(0,i-a),desc:e.desc')
replace_once('purchasedCards:i}=T(),a=t[n]', 'purchasedCards:i,roundCount:Q}=T(),a=t[n]')
replace_once('g=m===n,[_,v]', 'g=m===`${Q}:${n}`,[_,v]')
replace_once('e&&_!==n&&(v(n),l(Li()', 'e&&_!==`${Q}:${n}`&&(v(`${Q}:${n}`),l(Li()')
replace_once('},[e,n,_,a,i,w]);let k=', '},[e,n,Q,_,a,i,w]);let k=')
replace_once('t[i]=(t[i]||0)+r});let n=a.charType', 'const key=shopPurchaseKey(T.getState(),a,i);t[key]=(t[key]||0)+r});let n=a.charType')
replace_once('h(n),d(!0),p(e=>e+720)', 'h(`${Q}:${n}`),d(!0),p(e=>e+720)')
replace_once('},[g,u,a,n,w,b,i]),z=', '},[g,u,a,n,Q,w,b,i]),z=')
# CPU hacking uses the active deck too; selected cards keep their original IDs.
replace_once('let t=e.filter(e=>!n.hand.includes(e)),r=t.length>0?t:e,i=r[Math.floor(Math.random()*r.length)];', 'e=e.filter(id=>!T.getState().goldMode||cardAvailable(id));let t=e.filter(e=>!n.hand.includes(e)),r=t.length>0?t:e,i=r[Math.floor(Math.random()*r.length)];')
replace_once('t&&[`下剋上`,`大暴落`].includes(t.name)&&(t.ap??0)<=n.ap', 't&&[`下剋上`,`大暴落`].includes(t.name)&&!goldCardBlock(T.getState(),n,t.id)&&(t.id===13?1:0)<=n.ap')
# Main help is also available before a match has initialized goldMode.
replace_once('U=N===`DEV_MAIL_2026`;return n?', 'U=N===`DEV_MAIL_2026`;if(n)return(0,G.jsx)(GoldRulebook,{react:W,cards:Ce,miniGames:Ci,onClose:()=>r({rulesActive:!1})});return n?')
replace_once('if(!e)return null;let i=[`🎯 目的`', 'if(!e)return null;return(0,G.jsx)(GoldRulebook,{react:W,cards:Ce,miniGames:Ci,onClose:()=>t({tutorialActive:!1})});let i=[`🎯 目的`')
replace_once('if(e&&a)return(0,G.jsx)(PixelShop,', 'if(e&&a&&T.getState().goldMode)return(0,G.jsx)(GoldShop,{react:W,store:T,network:oe,cards:Ce,close:I});if(e&&a)return(0,G.jsx)(PixelShop,')
# Open the guest hacker shop only after the host has granted paid remote access.
replace_once('e&&_!==`${Q}:${n}`', 'e&&!T.getState().goldMode&&_!==`${Q}:${n}`')
replace_once('k={bicycle:`🚲自転車`,', 'k={shoppingCart:`🛒買い物カート`,foldBike:`🚲折りたたみ自転車`,bicycle:`🚲自転車`,')
replace_once('return n===`connected`?(0,G.jsx)(`div`,{style:{width:`100%`,padding:`0 5px`', 'return n===`connected`?(0,G.jsx)(`div`,{"data-desktop-chat":true,style:{width:`100%`,padding:`0 5px`')
replace_once('[チャット] ${u}: ${d.text}', '[チャット] ${escapeChat(u)}: ${escapeChat(d.text)}')
# Make every turn-order wait cancellable without changing the predetermined rolls.
start=s.index('ta=()=>');end=s.index('na=()=>',start)
part=s[start:end]
part=part.replace('[a,o]=(0,W.useState)(null);','[a,o]=(0,W.useState)(null),skipWait=(0,W.useRef)(null);')
part=part.replace('let n=!0;return(async()=>','let n=!0;const wait=ms=>new Promise(resolve=>{let timer;const done=()=>{clearTimeout(timer);if(skipWait.current===done)skipWait.current=null;resolve()};timer=setTimeout(done,ms);skipWait.current=done});return(async()=>')
for ms in [800,2800,600]:part=part.replace(f'new Promise(e=>setTimeout(e,{ms}))',f'wait({ms})')
part=part.replace('()=>{n=!1}', '()=>{n=!1;skipWait.current?.()}')
part=part.replace('if(!r.showResult)return;', 'if(!r.showResult){skipWait.current?.();return}if(oe.getState().status===`connected`&&!oe.getState().isHost)return;')
part=part.replace('className:`modal-overlay`,','className:`modal-overlay`,"data-turn-order":r.step,"data-order-result":r.showResult,',1)
part=part.replace('onClick:e=>e.stopPropagation(),children:', 'onClick:e=>{e.stopPropagation();if(!r.showResult)s()},children:')
part=part.replace('children:`タップしてゲーム開始！`','disabled:oe.getState().status===`connected`&&!oe.getState().isHost,children:oe.getState().status===`connected`&&!oe.getState().isHost?`ホストの開始を待っています`:`タップしてゲーム開始！`')
part=part.replace('(0,G.jsx)(`div`,{style:{textAlign:`center`,marginTop:`15px`,color:`#bdc3c7`,fontWeight:`bold`},children:r.step===-1?`まもなくダイスロールが始まります...`:`順番を決定中...`})','(0,G.jsx)(`button`,{type:`button`,style:{width:`100%`,minHeight:44,marginTop:15},onClick:e=>{e.stopPropagation();s()},children:`タップでこの演出をスキップ`})')
replace_once(s[start:end],part)
# Keep the close control outside the settings scroll area, including Safari's dynamic viewport.
old='className:`modal-overlay`,style:{display:`flex`,zIndex:3e4},onClick:()=>r({settingsActive:!1}),children:(0,G.jsxs)(`div`,{className:`modal-box`,style:{background:`#fdf5e6`,color:`#3e2723`,padding:`15px`,maxHeight:`90vh`,overflowY:`auto`},onClick:e=>e.stopPropagation(),children:['
new='className:`modal-overlay city-settings-overlay`,style:{display:`flex`,zIndex:3e4},onClick:()=>r({settingsActive:!1}),children:(0,G.jsxs)(`div`,{className:`modal-box city-settings-dialog`,style:{background:`#fdf5e6`,color:`#3e2723`},onClick:e=>e.stopPropagation(),children:[(0,G.jsxs)(`div`,{className:`city-settings-content`,children:['
replace_once(old,new)
replace_once('children:`🏠 タイトルに戻る`}),(0,G.jsx)(q,{onClick:()=>r({settingsActive:!1})', 'children:`🏠 タイトルに戻る`})]}),(0,G.jsx)(q,{onClick:()=>r({settingsActive:!1})')
s='import {escapeChat} from "../src/chat-utils.js";\nimport {GoldShop} from "../src/gold-shop.js";\nimport {GoldRulebook} from "../src/gold-rulebook.js";\nimport {goldShopIds,goldShopPrice,shopPurchaseKey,cardAvailable,goldCardBlock} from "../src/card-balance.js";\nimport {EQUIPMENT_ITEM_IDS} from "../src/player-info.js";\nimport {PixelItemIcon} from "../src/pixel-item-art.js";\nimport {createGoldState,goldScore,goldCompare,goldRankOf} from "../src/gold-rules.js";\nimport {goldCpuStep} from "../src/gold-cpu.js";\nimport {GoldResults,GoldBadge} from "../src/gold-ui.js";\nimport {PixelShop,PixelEvent} from "../src/pixel-scenes.js";\nimport {createCityBoard} from "../src/city-board-map.js";\nfunction It(){return createCityBoard()}\n'+s
s+='\nexport {Mt as smallMap,Nt as mediumMap,Pt as largeMap,It as originalMap,Ti as miniGames,mr as tileDescriptions,tr as statusEquipment,nr as hasStatusEquipment};\n'
import runpy
s=runpy.run_path(str(Path(__file__).resolve().with_name('build-presentation-hooks.py')))['patch_runtime'](s)
s=runpy.run_path(str(Path(__file__).resolve().with_name('build-atom-hooks.py')))['patch_runtime'](s)
(root/'assets/original-city-runtime.js').write_text(s)
print('48-square district board, gold competition and presentation hooks generated.')
