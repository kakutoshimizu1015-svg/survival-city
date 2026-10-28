"""Reproducible, bounded hooks into the supplied engine. Classic mode remains opt-out."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
s=(root/'scripts/vendor/original-network-store.js').read_text()
def once(old,new):
 global s
 assert s.count(old)==1,(old,s.count(old))
 s=s.replace(old,new,1)
s='import {escapeChat} from "../src/chat-utils.js";\nimport {handleShopAction} from "../src/shop-session.js";\nimport {drawGoldCard,goldRewardCard} from "../src/card-balance.js";\nimport {npcWalk,pickNpcNext} from "../src/city-random.js";\nimport {onGoldDeath,finishGoldGame,handleGoldPurchase} from "../src/gold-rules.js";\n'+s
once('var _={gamePhase:', 'var _={goldMode:false,gold:null,goldShop:null,shopAccess:null,gamePhase:')
# Rest stops protect occupants before rolling a hit or consuming a doll.
once('f.push(n.id),n.equip?.doll?', 'f.push(n.id),v.getState().goldMode&&s.find(tile=>tile.id===n.pos)?.type===`shelter`?(Y(`🏕️ ${n.name}は休憩所で収集車を回避！`),v.getState().addEventPopup(n.id,`🏕️`,`休憩所で安全！`,`収集車の攻撃を必ず回避`,`good`)):n.equip?.doll?')
# Both dash paths enter the ordinary landing handler; the skill already paid its AP cost.
once('let r=v.getState(),i=r.mapData.find(e=>e.id===t),a=r.players[r.turn],o=a.pos,', 'let r=v.getState(),i=r.mapData.find(e=>e.id===t),a=r.players[r.turn];const dash=r.goldMode&&r.isDashPicking;if(!i||!a||dash&&(!r.isBranchPicking||!r.currentBranchOptions.includes(t)))return;let o=a.pos,')
once('d=s+u;if(r.updateCurrentPlayer', 'd=dash?0:s+u;if(r.updateCurrentPlayer')
once('rainGear:r.isRainy?!1:e.rainGear,nextMoveCostPenalty:0,', 'rainGear:dash?e.rainGear:r.isRainy?!1:e.rainGear,nextMoveCostPenalty:dash?e.nextMoveCostPenalty:0,')
once('Y(`🚶 「${i.name}」に移動。`)', 'Y(dash?`💨 疾風ダッシュ！「${i.name}」に着地。`:`🚶 「${i.name}」に移動。`)')
once('r.incrementGameStat(a.id,`tiles`,1),a.isCPU||e.getState().incrementStat(`totalTilesMoved`,1)', 'r.incrementGameStat(a.id,`tiles`,dash?3:1),a.isCPU||e.getState().incrementStat(`totalTilesMoved`,dash?3:1)')
once('交番・NPC・罠を飛び越える戦略移動が可能。', '途中の交番・NPC・罠は飛び越えます。着地先のマス・NPC・罠の効果は発生します。')
once('{kills:(e.kills||0)+1,p:t,hand:n}', '{kills:(e.kills||0)+1,npcKills:(e.npcKills||0)+1,p:t,hand:n}')
once('o&&i.updatePlayer(r,e=>({kills:(e.kills||0)+1}))}', 'o&&i.updatePlayer(r,e=>({kills:(e.kills||0)+1}));onGoldDeath(v,e,r,a.pos,Y)}')
# A gold-can loss replaces extra cash/equipment confiscation. Damage theft still applies.
once('let t=Math.min(15,Math.max(0,Math.floor((a.p-l)/3)));', 'let t=i.goldMode?0:Math.min(15,Math.max(0,Math.floor((a.p-l)/3)));')
once('u.length>0&&(n[u[Math.floor(Math.random()*u.length)]]=!1)', '!i.goldMode&&u.length>0&&(n[u[Math.floor(Math.random()*u.length)]]=!1)')
# Player-created traps use the normal damage path, including killer credit and shields.
a=s.index('else if(e.type===`pitfall`){');b=s.index('else if(e.type===`jamming`)',a)
old=s[a:b];body=old[len('else if(e.type===`pitfall`){'):-1]
once(old,'else if(e.type===`pitfall`){if(r.goldMode){q(a.id,20,`落とし穴`,r.traps[p].ownerId)}else{'+body+'}}')
once('q(a.id,15,`割れたビール瓶`)', 'q(a.id,15,`割れたビール瓶`,r.goldMode?r.traps[p].ownerId:null)')
# Reflected lethal hits must credit their defender, including player id 0.
once('q(r,t,`反撃`),0', 'q(r,t,`反撃`,i.goldMode?e:null),0')
once('a.charType===`sennin`&&r&&e!==r', 'a.charType===`sennin`&&r!==null&&e!==r')
once('r?(Y(`🛡️ 段ボールの盾', 'r!==null?(Y(`🛡️ 段ボールの盾')
once('q(r,10,`段ボールの盾`)', 'q(r,10,`段ボールの盾`,i.goldMode?e:null)')
# Alternate death paths (poison/pitfalls) drop gold as environmental deaths.
once('pos:t,deaths:(e.deaths||0)+1,respawnShield:2})))', 'pos:t,deaths:(e.deaths||0)+1,respawnShield:2})),onGoldDeath(v,a.id,null,a.pos,Y))')
once('pos:r,deaths:(e.deaths||0)+1,respawnShield:2})))', 'pos:r,deaths:(e.deaths||0)+1,respawnShield:2})),onGoldDeath(v,t.id,null,t.pos,Y))')
s=s.replace('p:Math.floor(e.p*.66)', 'p:e.goldCans!==undefined?e.p:Math.floor(e.p*.66)')
once('Wa=()=>{let t=v.getState();v.setState({gameOver:!0});', 'Wa=()=>{let t=v.getState();if(t.goldMode){finishGoldGame(v,{network:$,profile:e,saveWin:h,log:Y,emoji:Ra});return}v.setState({gameOver:!0});')
once('let e=v.getState(),t=e.players[e.turn];t&&t.userId===r.userId&&', 'let e=v.getState(),t=e.players[e.turn];if(r.actionType===`BUY_GOLD`){handleGoldPurchase(v,r.userId,$,Y,G);return}t&&t.userId===r.userId&&')
once('let n=!1;i&&a&&a[0].members.some(e=>s(e))&&(n=!0),!i&&s(t[0])&&(n=!0),n&&h(c.totalScore)', 'let n=r.gameState.pendingGameResult.goldMode?r.gameState.pendingGameResult.winnerIds?.includes(c.id):i?!!(a&&a[0].members.some(e=>s(e))):s(t[0]);n&&h(c.totalScore)')
once('if(r.type===`REQUEST_ACTION`){if(!n().isHost)return;', 'if(r.type===`REQUEST_ACTION`&&r.actionType?.startsWith(`SHOP_`)){if(!n().isHost)return;const actor=v.getState().players[v.getState().turn];if(e.guestUserId===r.userId&&actor?.userId===r.userId)handleShopAction(v,r.actionType.slice(5),r.payload,actor.id);return;}if(r.type===`REQUEST_ACTION`){if(!n().isHost)return;')
# Guests receive the final result directly after the category awards were removed.
assert s.count('r.gameState.pendingGameResult')==4
s=s.replace('r.gameState.pendingGameResult','(r.gameState.gameResult||r.gameState.pendingGameResult)')
# New matches randomize opening positions and route preferences. Legal road edges remain intact.
once('Ua=(e,t,n,r=-1)=>{let i=e', 'Ua=(e,t,n,r=-1)=>{if(v.getState().goldMode)return npcWalk({...v.getState(),mapData:n},e,t,r);let i=e')
once('a=e.next[Math.floor(Math.random()*e.next.length)]', 'a=v.getState().goldMode?pickNpcNext(v.getState(),a):e.next[Math.floor(Math.random()*e.next.length)]')
once('_=e.next[Math.floor(Math.random()*e.next.length)]', '_=v.getState().goldMode?pickNpcNext(v.getState(),_):e.next[Math.floor(Math.random()*e.next.length)]')
# Every reward source uses the active deck, including fixed minigame prizes.
once('a=()=>Math.random()<.05?t[Math.floor(Math.random()*t.length)]:i[Math.floor(Math.random()*i.length)]', 'a=()=>v.getState().goldMode?drawGoldCard():Math.random()<.05?t[Math.floor(Math.random()*t.length)]:i[Math.floor(Math.random()*i.length)]')
once('let t=[6,7,10,15][Math.floor(Math.random()*4)];','let t=(e.goldMode?[6,7,18,15]:[6,7,10,15])[Math.floor(Math.random()*4)];')
once('let a=v.getState(),o=a.players[a.turn];r&&Y(`🎲 ${r}`)', 'let a=v.getState(),o=a.players[a.turn];if(a.goldMode&&n!=null)n=goldRewardCard(n);r&&Y(`🎲 ${r}`)')
# The old cart description promised double income but no income multiplier existed.
once('p>0&&(a.fakeInfoDebuff>0', 't.goldMode&&a.equip?.cart&&(p*=2),p>0&&(a.fakeInfoDebuff>0')
assert s.count('[チャット] ${r.chat.sender}: ${r.chat.text}')==2
s=s.replace('[チャット] ${r.chat.sender}: ${r.chat.text}', '[チャット] ${escapeChat(r.chat.sender)}: ${escapeChat(r.chat.text)}')
# Keep chat history independently from the short-lived speech bubbles.
assert s.count('lobbyPlayers:[],chatQueue:[]')==2
s=s.replace('lobbyPlayers:[],chatQueue:[]','lobbyPlayers:[],chatQueue:[],chatHistory:[]')
once('addChatToQueue:t=>e(e=>({chatQueue:[...e.chatQueue,t]}))', 'addChatToQueue:t=>e(e=>e.chatHistory.some(m=>m.id===t.id)?e:({chatQueue:[...e.chatQueue,t],chatHistory:[...e.chatHistory,{id:t.id,sender:String(t.sender).slice(0,40),text:String(t.text).slice(0,40)}].slice(-100)}))')
import runpy
s=runpy.run_path(str(Path(__file__).resolve().with_name('build-presentation-hooks.py')))['patch_engine'](s)
(root/'assets/useNetworkStore-CIe06z3C.js').write_text(s)
print('Gold rules hooks generated; native legacy rules are conditional on goldMode.')
