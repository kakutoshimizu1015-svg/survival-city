"""Atom world and host-owned dice arithmetic. Applied after paced-round hooks."""
def patch_engine(s):
 def once(old,new):
  nonlocal s
  assert s.count(old)==1,(old,s.count(old))
  s=s.replace(old,new,1)
 s='import {diceRelief} from "../src/dice-relief.js";\nimport {isAtom} from "../src/atom-map.js";\nimport {advanceAtomThreat,executeAtomAction,atomText} from "../src/atom-rules.js";\nimport {atomStories,atomCpuStoryChoice} from "../src/atom-stories.js";\n'+s
 once('goldMode:false,gold:null,','goldMode:false,gold:null,atom:null,atomLanding:null,')
 once('if(f&&(d*=2),a.equip?.bicycle', 'f&&(d*=2);const relief=diceRelief(t,a,d);d+=relief.bonus;t.goldMode&&t.updateCurrentPlayer({_lowRollRelief:relief.next});if(a.equip?.bicycle')
 once('const dash=r.goldMode&&r.isDashPicking;', 'const atomLanding=r.goldMode&&r.atomLanding?.playerId===a?.id&&r.atomLanding?.to===t;const dash=r.goldMode&&r.isDashPicking;')
 once('d=dash?0:s+u;', 'd=dash||atomLanding?0:s+u;')
 once('rainGear:dash?e.rainGear', 'rainGear:dash||atomLanding?e.rainGear')
 once('freeMovesThisTurn:l?c+1:c', 'freeMovesThisTurn:l&&!atomLanding?c+1:c')
 once('i.type===`event`&&!a.isCPU', 'i.type===`event`&&v.getState().players[r.turn]?.pos===t&&(v.getState().players[r.turn]?.deaths||0)===(a.deaths||0)&&(!a.isCPU||isAtom(r))')
 once('if(Math.random()<.3)v.setState({storyActive:!0,storyIndex:Math.floor(Math.random()*4)})', 'if(isAtom(r)&&i.atomKind===`terminal`){if(v.getState().players[r.turn].atomTerminalTurn!==r.roundCount+`:`+r.turn)v.setState({storyActive:!0,storyIndex:4});}else if(Math.random()<.3)v.setState({storyActive:!0,storyIndex:Math.floor(Math.random()*4)})')
 once('nextMoveCostPenalty:dash?e.nextMoveCostPenalty:0', 'nextMoveCostPenalty:dash||atomLanding?e.nextMoveCostPenalty:0')
 once('i=Wt[n.storyIndex];i&&', 'i=(isAtom(n)?atomStories:Wt)[n.storyIndex];if(!n.storyActive||!Number.isInteger(e)||!i?.choices[e]||i.choices[e].available?.(n,r)===false)return;i&&')
 once('title:r,detail:i,type:a,createdAt:Date.now()', 'title:atomText(e,r),detail:atomText(e,i),type:a,createdAt:Date.now()')
 once('Y=e=>{v.setState', 'Y=e=>{e=atomText(v.getState(),e);v.setState')
 once('if(r.type===`REQUEST_ACTION`&&r.actionType?.startsWith(`SHOP_`))', 'if(r.type===`REQUEST_ACTION`&&r.actionType===`ATOM_ACTION`){if(!n().isHost)return;const actor=v.getState().players[v.getState().turn];if(e.guestUserId===r.userId&&actor?.userId===r.userId)executeAtomAction(v,actor.id,r.payload,{move:Nt,damage:q,log:Y});return;}if(r.type===`REQUEST_ACTION`&&r.actionType?.startsWith(`SHOP_`))')
 start=s.index('Ga=async()=>');end=s.index(',Z=!1',start);part=s[start:end]
 a=part.index('Y(`<span style="color:#c0392b">🛻 ごみ収集車が暴走！</span>`)');b=part.index('let m=[`police`',a)
 assert part[a-1]==','
 truck=part[a:b]
 part=part[:a-1]+';if(isAtom(e)){await advanceAtomThreat(v,t,{beat:(...args)=>roundBeat(v,roundId,...args,X),damage:q,wait,log:Y});}else{'+truck+'}'+part[b:]
 a=part.index('let y=Math.floor(');b=part.index('v.setState({roundCount:t',a)
 forecast=part[a:b].replace('Ua(d.finalPos,y,s)','Ua(v.getState().truckPos,y,s)')
 part=part[:a]+'if(!isAtom(e)){'+forecast+'}'+part[b:]
 s=s[:start]+part+s[end:]
 from runpy import run_path
 from pathlib import Path
 return run_path(str(Path(__file__).with_name('build-atom-economy.py')))['patch_engine'](s)

def patch_runtime(s):
 def once(old,new):
  nonlocal s
  assert s.count(old)==1,(old,s.count(old))
  s=s.replace(old,new,1)
 s='import {settleAtomCpuEvent} from "../src/atom-cpu.js";\nimport {createAtomBoard,isAtom} from "../src/atom-map.js";\nimport {atomStories,atomCpuStoryChoice} from "../src/atom-stories.js";\n'+s
 once('a===`midtown`?It():Pt()', 'a===`atom`?createAtomBoard():a===`midtown`?It():Pt()')
 once('s===`midtown`?It():Pt()', 's===`atom`?createAtomBoard():s===`midtown`?It():Pt()')
 option='children:(0,G.jsx)(`option`,{value:`midtown`,style:{backgroundColor:`#2a221a`,color:`#fdf5e6`},children:`街めぐり (48・路地と噴水広場)`})'
 assert s.count(option)==2
 s=s.replace(option,'children:[(0,G.jsx)(`option`,{value:`midtown`,children:`現代都市 (48マス)`}),(0,G.jsx)(`option`,{value:`atom`,children:`明日の楽園・第0区 (64マス)`})]')
 once('w=r?I[i||0]:null', 'w=r?(isAtom(T.getState())?atomStories:I)[i||0]:null')
 # The boss is fixed scenery; detective relocation applies only to ordinary NPCs.
 once('(0,G.jsx)(q,{onClick:()=>Ze(`truckPos`)', '!isAtom(T.getState())&&(0,G.jsx)(q,{onClick:()=>Ze(`truckPos`)')
 once('e.storyActive&&(T.setState({storyActive:!1}),T.getState().updateCurrentPlayer(e=>({p:e.p+5})),H(`📖 ${n.name}はイベントで5P獲得した！`),await Kn(400))', 'e.storyActive&&(isAtom(e)?j(atomCpuStoryChoice(e)):(T.setState({storyActive:!1}),T.getState().updateCurrentPlayer(e=>({p:e.p+5})),H(`📖 ${n.name}はイベントで5P獲得した！`)),await Kn(400))')
 once('network:oe,log:H,sound:D})){await Kn(500);continue}', 'network:oe,log:H,sound:D})){await Kn(500);await settleAtomCpuEvent(T,j,Kn);continue}')
 once('react:W,story:w,index:i||0,canAct:g,onChoose:j','react:W,story:w,index:i||0,canAct:g,onChoose:j,state:T.getState()')
 from runpy import run_path
 from pathlib import Path
 return run_path(str(Path(__file__).with_name('build-atom-economy.py')))['patch_runtime'](s)
