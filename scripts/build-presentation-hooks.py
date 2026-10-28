"""Bounded hooks: authoritative results, paced round beats, and a single notice surface."""
def patch_engine(s):
 def once(old,new):
  nonlocal s
  assert s.count(old)==1,(old,s.count(old))
  s=s.replace(old,new,1)
 s='import {beginRound,roundWait,roundBeat,movingBeat,encounterBeat,finishRound,withCombat} from "../src/city-presentation.js";\n'+s
 once('goldMode:false,gold:null,','goldMode:false,gold:null,cityBeat:null,cityRoundId:null,cityCombat:[],truckForecast:null,')
 once('q=(e,t,n,r=null)=>{let i=v.getState();','nativeDamage=(e,t,n,r=null)=>{let i=v.getState();')
 once('return s},J=t=>','return s},q=(...args)=>withCombat(v,nativeDamage,...args),J=t=>')
 start=s.index('Ga=async()=>');end=s.index(',Z=!1',start);part=s[start:end]
 def change(old,new):
  nonlocal part
  assert part.count(old)==1,(old,part.count(old))
  part=part.replace(old,new,1)
 change('v.setState({_roundEndInProgress:!0});try{','v.setState({_roundEndInProgress:!0});const roundId=beginRound(v),wait=ms=>roundWait(v,roundId,ms,X);try{')
 part=part.replace('await X(', 'await wait(')
 change('v.setState({roundSummary:{id:Date.now(),data:n,createdAt:Date.now()}}),await wait(500)', 'roundId?await roundBeat(v,roundId,`report`,`ラウンド${t}の準備`,n,null,2800,X):(v.setState({roundSummary:{id:Date.now(),data:n,createdAt:Date.now()}}),await wait(500))')
 change('v.setState({horrorMode:!0}),G(`hit`),await wait(800)', 'v.setState({horrorMode:!0}),roundId?await roundBeat(v,roundId,`truck-intro`,`収集車が来ます`,[`通る道を見てみよう`],`truck`,1400,X):(G(`hit`),await wait(800))')
 change('for(let e of p){v.setState({truckPos:e});let t=!1;', 'for(let e of p){const beforeContact=v.getState().players;movingBeat(v,roundId,`truck`);v.setState({truckPos:e});if(roundId)await wait(500);let t=!1;')
 change('t?(await wait(1500),v.setState({bloodAnim:null})):await wait(300)', 'roundId?(await encounterBeat(v,roundId,`truck`,beforeContact,e,X),v.setState({bloodAnim:null})):(t?(await wait(1500),v.setState({bloodAnim:null})):await wait(300))')
 # Only the first encounter at a repeated square should produce a result.
 change('const beforeContact=v.getState().players;', 'const beforeContact=v.getState().players.filter(n=>!f.includes(n.id));')
 change('await wait(800),v.setState({horrorMode:!1});', 'roundId?await roundBeat(v,roundId,`truck-end`,`収集車が通りすぎました`,[],`truck`,900,X):await wait(800),v.setState({horrorMode:!1});')
 change('await wait(1e3);let t=', 'roundId||await wait(1e3);let t=')
 change('await wait(800);let n=Ua(_,t,s,e.policePrevPos);', 'roundId?await roundBeat(v,roundId,`police-intro`,`次はパトカー`,[`${t}マスを巡回します`],`police`,1400,X):await wait(800);let n=Ua(_,t,s,e.policePrevPos);')
 change('for(let e of n.hitList){_=e,v.setState({policePos:_});let t=v.getState();', 'for(let e of n.hitList){_=e;movingBeat(v,roundId,`police`);v.setState({policePos:_});if(roundId)await wait(500);let t=v.getState();const beforePolice=t.players;')
 change('}),r)break;await wait(300)', '}),roundId&&await encounterBeat(v,roundId,`police`,beforePolice,_,X),r)break;if(!roundId)await wait(300)')
 change('v.setState({disasterWarning:t}),await wait(3500),v.setState({disasterWarning:null}),await wait(300)', 'roundId?v.setState({truckForecast:t}):(v.setState({disasterWarning:t}),await wait(3500),v.setState({disasterWarning:null}),await wait(300))')
 old='v.setState({roundCount:t,weatherState:r,isRainy:r===`rainy`,isNight:i,canPrice:a,trashPrice:o,...c}),v.getState().players.forEach(e=>{e.hp>0&&J(e.id)})'
 new='v.setState({roundCount:t,weatherState:r,isRainy:r===`rainy`,isNight:i,canPrice:a,trashPrice:o,...c});if(roundId){const gs=v.getState(),next=gs.gold?.nextSpot;await roundBeat(v,roundId,`forecast`,`次の手番へ`,[gs.truckForecast,...(next!=null?[`金缶は${next}番に登場します`]:[])].filter(Boolean),`hold`,2600,X);}v.getState().players.forEach(e=>{e.hp>0&&J(e.id)})'
 change(old,new)
 change('}finally{v.setState({_roundEndInProgress:!1})}', '}catch(error){if(error.name!==`RoundCancelled`)throw error;}finally{finishRound(v,roundId)}')
 s=s[:start]+part+s[end:]
 return s

def patch_runtime(s):
 def once(old,new):
  nonlocal s
  assert s.count(old)==1,(old,s.count(old))
  s=s.replace(old,new,1)
 # Only one entry for the shared help screen at the title and in settings.
 once(',(0,G.jsx)(`button`,{onClick:t=>{t.stopPropagation(),e({tutorialActive:!0})},style:{background:`none`,border:`none`,cursor:`pointer`,fontSize:12,color:`var(--dt-text-muted)`,borderBottom:`1px solid var(--dt-text-muted)`,paddingBottom:2,fontFamily:`inherit`},children:`🎓 チュートリアル`})','')
 once(',(0,G.jsx)(q,{onClick:()=>r({tutorialActive:!0,settingsActive:!1}),style:{width:`100%`,marginBottom:`10px`,background:`#8e44ad`,color:`#f1c40f`},children:`📚 チュートリアル`})','')
 s=s.replace('children:`📖 ルール`','children:`📖 あそびかた`').replace('children:`📖 遊び方・ルールを見る`','children:`📖 あそびかた`')
 # The calm sequence keeps the vehicle state without blacking out the page.
 once('a&&document.body.classList.add(`horror-mode`)', 'a&&!T.getState().goldMode&&document.body.classList.add(`horror-mode`)')
 # Replace presentation only; hand-limit decisions and character details remain native.
 start=s.index('na=()=>');end=s.index('ra=()=>',start);part=s[start:end]
 for old,new in [('g&&(0,G.jsxs)', '!T.getState().goldMode&&g&&(0,G.jsxs)'),('v&&(0,G.jsx)', '!T.getState().goldMode&&v&&(0,G.jsx)'),('e&&(0,G.jsx)', '!T.getState().goldMode&&e&&(0,G.jsx)'),('children:t.map(e=>', 'children:(T.getState().goldMode?[]:t).map(e=>'),('n&&(0,G.jsx)', '!T.getState().goldMode&&n&&(0,G.jsx)'),('r&&(0,G.jsxs)', '!T.getState().goldMode&&r&&(0,G.jsxs)'),('b&&b.data&&', '!T.getState().goldMode&&b&&b.data&&'),('S&&(0,G.jsx)', '!T.getState().goldMode&&S&&(0,G.jsx)')]:
  assert old in part,old
  part=part.replace(old,new,1)
 s=s[:start]+part+s[end:]
 return s
