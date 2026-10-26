import {npcImpact,impactTone,viewerPlayer} from './npc-impact.js';
export function createNpcSignals({T,scene,squares,elevation,host,reduced,isCityBoard}){
 const rings=new Map();let signals=new Map();
 const colors={bad:'#ff5149',good:'#62ec8b',neutral:'#b8c8c8'};
 function sync(state,visible){
  const groups=new Map(),p=state.players.find(p=>p.id===state.viewerId)||viewerPlayer(state);
  for(const {key,pos} of visible){const tile=state.mapData.find(t=>t.id===pos);if(!tile)continue;const effect=npcImpact(state,key,p,tile);if(effect){if(!groups.has(pos))groups.set(pos,[]);groups.get(pos).push(effect);}}
  signals=new Map([...groups].map(([pos,effects])=>[pos,{tone:impactTone(effects),effects}]));
  for(const [id,signal] of signals){if(signal.tone==='neutral')continue;let item=rings.get(id);if(!item){const tile=squares.get(id);if(!tile)continue;const radius=isCityBoard?2.2:1.15,group=new T.Group();group.position.set(tile.x,elevation(tile.x,tile.z)+.59,tile.z);scene.add(group);const materials=[];for(const [a,b,opacity] of [[radius-.18,radius,.85],[radius,radius+.65,.22]]){const material=new T.MeshBasicMaterial({color:colors[signal.tone],transparent:true,opacity,depthWrite:false,side:T.DoubleSide});const ring=new T.Mesh(new T.RingGeometry(a,b,40),material);ring.rotation.x=-Math.PI/2;group.add(ring);materials.push(material);}item={group,materials};rings.set(id,item);}item.tone=signal.tone;item.materials.forEach(m=>m.color.set(colors[signal.tone]));}
  for(const [id,item] of rings)item.group.visible=signals.has(id)&&signals.get(id).tone!=='neutral';
  for(const tile of state.mapData){const el=host.querySelector(`[data-original-tile="${tile.id}"]`);if(!el)continue;const signal=signals.get(tile.id);if(signal){el.dataset.npcTone=signal.tone;el.style.setProperty('--npc-color',colors[signal.tone]);let badge=el.querySelector('.npc-effect-mark');if(!badge){badge=document.createElement('i');badge.className='npc-effect-mark';badge.setAttribute('aria-hidden','true');el.append(badge);}const text=signal.tone==='bad'?'!':signal.tone==='good'?'+':'·';if(badge.textContent!==text)badge.textContent=text;el.setAttribute('aria-description',signal.effects.map(e=>e.name+'：'+e.desc).join('。'));}else{delete el.dataset.npcTone;el.querySelector('.npc-effect-mark')?.remove();el.removeAttribute('aria-description');}}
  host.dataset.npcSignals=JSON.stringify([...signals].map(([pos,s])=>({pos,tone:s.tone,kinds:s.effects.map(e=>e.key)})));
 }
 return {sync,draw(now){for(const item of rings.values())if(item.group.visible){const pulse=reduced?1:.88+Math.sin(now*.003)*.12;item.materials[0].opacity=.85*pulse;item.materials[1].opacity=.25*pulse;}},get:id=>signals.get(id)};
}
