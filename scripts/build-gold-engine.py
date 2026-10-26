"""Reproducible, bounded hooks into the supplied engine. Classic mode remains opt-out."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
s=(root/'scripts/vendor/original-network-store.js').read_text()
def once(old,new):
 global s
 assert s.count(old)==1,(old,s.count(old))
 s=s.replace(old,new,1)
s='import {onGoldDeath,finishGoldGame,handleGoldPurchase} from "../src/gold-rules.js";\n'+s
once('var _={gamePhase:', 'var _={goldMode:false,gold:null,gamePhase:')
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
(root/'assets/useNetworkStore-CIe06z3C.js').write_text(s)
print('Gold rules hooks generated; native legacy rules are conditional on goldMode.')
