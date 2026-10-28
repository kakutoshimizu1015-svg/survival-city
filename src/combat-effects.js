// Local impact feedback: no full-screen flash, shaking camera or gameplay delay.
export function createCombatEffects({T,scene,squares,elevation,host,reduced,project}){
 const active=[];
 function dispose(e){e.label.remove();e.group.removeFromParent();e.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 function show(event){const tile=squares.get(event.pos);if(!tile)return;const group=new T.Group();scene.add(group);
  const ring=new T.Mesh(new T.RingGeometry(.9,1.15,20),new T.MeshBasicMaterial({color:'#ffe3a0',transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(tile.x,elevation(tile.x,tile.z)+1.2,tile.z);group.add(ring);
  const label=document.createElement('span');label.className='city-hit-number';label.textContent='−'+event.damage;label.setAttribute('aria-hidden','true');host.append(label);
  let can=null,to=null;if(event.goldStolen){can=new T.Mesh(new T.CylinderGeometry(.48,.55,1.3,8),new T.MeshStandardMaterial({color:'#ffcf51',metalness:.7,roughness:.25,emissive:'#a46b12',emissiveIntensity:.4}));group.add(can);to=squares.get(event.fromPos)||tile;label.textContent+='　金缶＋'+event.goldStolen;}
  active.push({event,group,ring,label,can,to,tile,start:performance.now()});if(active.length>12)dispose(active.shift());
 }
 function draw(now){for(let i=active.length-1;i>=0;i--){const e=active[i],f=(now-e.start)/1400;if(f>=1){dispose(e);active.splice(i,1);continue;}
   const y=elevation(e.tile.x,e.tile.z);e.ring.scale.setScalar(reduced?1:1+Math.min(f*2,1)*2);e.ring.material.opacity=Math.max(0,1-f*1.6);
   if(e.can){const travel=reduced?1:Math.max(0,Math.min(1,(f-.15)/.65));e.can.position.set(e.tile.x+(e.to.x-e.tile.x)*travel,y+3+(reduced?0:Math.sin(travel*Math.PI)*5),e.tile.z+(e.to.z-e.tile.z)*travel);e.can.rotation.z=reduced?0:travel*Math.PI*2;}
   const p=project(e.tile.x,y+4+(reduced?0:f*1.5),e.tile.z);e.label.style.transform=`translate(${p.x}px,${p.y}px) translate(-50%,-100%)`;e.label.style.opacity=String(Math.min(1,(1-f)*3));
  }host.dataset.combatEffects=JSON.stringify(active.map(e=>({id:e.event.id,target:e.event.target,gold:e.event.goldStolen,damage:e.event.damage})));}
 return {show,draw,active:()=>active.length>0,dispose(){for(const e of active)dispose(e);active.length=0;}};
}
