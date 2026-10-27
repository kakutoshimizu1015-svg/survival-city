"""Apply bounded gold-only hooks to the original card catalogue and actions."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def generate(source,target,transform):
 s=(root/'scripts/vendor'/source).read_text()
 def once(old,new):
  nonlocal s
  assert s.count(old)==1,(source,old,s.count(old))
  s=s.replace(old,new,1)
 transform(once)
 (root/'assets'/target).write_text(s)
def catalog(once):
 once('var e=[','import {I as gameStore} from "./useNetworkStore-CIe06z3C.js";\nimport {goldCardDescription} from "../src/card-balance.js";\nvar e=[')
 once('export{e as t};','for(const card of e){const original={...card};Object.defineProperty(card,"desc",{enumerable:true,get(){return gameStore.getState().goldMode?goldCardDescription(original):original.desc;}})}export{e as t};')
generate('original-card-catalog.js','cards-BGoWm8gy.js',catalog)
def actions(once):
 once('var a=(a,o)=>{','import {goldCardBlock,lastGoldRank,goldComebackTarget} from "../src/card-balance.js";\nimport {sameTeam} from "../src/gold-rules.js";\nvar a=(a,o)=>{')
 once('if(!m)return;let h=', 'if(!m)return;if(c.goldMode){if(!p||p.hand?.[a]!==o)return;const reason=goldCardBlock(c,p,o);if(reason&&!f){n(`❌ ${reason}`);c.showToast(reason);return}}let h=')
 once('_=g.every(e=>p.p<=e.p)', '_=c.goldMode?lastGoldRank(c,p):g.every(e=>p.p<=e.p)')
 once('if(o===13&&!f){', 'if(o===13&&!f&&!c.goldMode){')
 once('u.forEach(e=>{e.id!==p.id&&(e.reaction===`reflect`?', 'u.forEach(e=>{e.id!==p.id&&(!c.goldMode||!sameTeam(e,p))&&(e.reaction===`reflect`?')
 once('case 13:let a=u.filter(e=>e.id!==p.id&&e.p>p.p);', 'case 13:let a=c.goldMode?[goldComebackTarget(c,p)].filter(Boolean):u.filter(e=>e.id!==p.id&&e.p>p.p);')
 once('let t=Math.min(15,Math.floor((e.p-p.p)*.3));', 'let t=c.goldMode?Math.min(10,Math.max(0,e.p)):Math.min(15,Math.floor((e.p-p.p)*.3));')
 once('case 42:g.every(e=>p.p<=e.p)||f?', 'case 42:(c.goldMode?lastGoldRank(c,p):g.every(e=>p.p<=e.p))||f?')
 once('y.p+=8,n(`🏦 行政の見落とし！', 'y.p=p.p+8,n(`🏦 行政の見落とし！')
generate('original-card-actions.js','cards-C7BZxg2n.js',actions)
def skills(once):
 once('e.setState({shopStockTurn:-1,shopActive:!0})', 'e.setState({shopStockTurn:-1,shopActive:!0,shopAccess:`${i.roundCount}:${i.turn}`})')
 once('l=Math.random()<.1?s[Math.floor(Math.random()*s.length)]:c[Math.floor(Math.random()*c.length)];', 'l=i.goldMode?drawGoldCard(Math.random,.1):Math.random()<.1?s[Math.floor(Math.random()*s.length)]:c[Math.floor(Math.random()*c.length)];')
generate('original-skills.js','skills-CsxruNUN.js',skills)
p=root/'assets/skills-CsxruNUN.js';p.write_text('import {drawGoldCard} from "../src/card-balance.js";\n'+p.read_text())
print('Card catalogue, comeback eligibility and draw skills generated.')
