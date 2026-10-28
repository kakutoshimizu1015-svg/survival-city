// Retrofuture architecture follows concentric decks, not horizontal district strips.
export function buildAtomScenery({T,scene,block,mesh,mat,cylinder,line,sign,squares,edges,elevation,nightGlow,nightStrip,animated}){
 const counts={slum:0,commercial:0,luxury:0},lots=[];
 for(const [a,b] of edges){
  const x=(a.x+b.x)/2,z=(a.z+b.z)/2,h=(elevation(a.x,a.z)+elevation(b.x,b.z))/2;
  if(h>1.2){block(x,h/2,z,.8,h,.8,'#8b9e96',{absolute:true});const cap=mesh(new T.CylinderGeometry(2.7,2.7,.7,8),mat('#c9b58e'),x,h-.5,z,true);}
 }
 for(const t of squares.values()){
  if(t.ring==='ramp')continue;
  const outward=t.ring==='outer'?1:-1,theta=Math.atan2(t.z/.85,t.x),distance=t.ring==='outer'?7:8;
  const x=t.x+Math.cos(theta)*distance*outward,z=t.z+Math.sin(theta)*distance*outward,y=elevation(x,z),color=t.area==='slum'?'#bc9871':t.area==='commercial'?'#69a9a2':'#ded9b3';counts[t.area]++;lots.push({x,z,area:t.area});
  // A deck and its visible stilts expose the gap below the inner ring.
  mesh(new T.CylinderGeometry(3.8,3.8,.65,8),mat('#596e68'),x,y-.25,z,true);
  if(y>1)for(const side of [-1,1])block(x+side*2.3,y/2,z,.5,y,.5,'#94a097',{absolute:true});
  if(t.area==='slum'){
   cylinder(x,.38+1.5,z,2.4,2.4,2.8,color,10);const dome=mesh(new T.SphereGeometry(2.5,10,5,0,Math.PI*2,0,Math.PI/2),mat('#73a7a2'),x,3.25,z);
   block(x,1.4,z+2.4,1.1,1.7,.15,'#344d50');block(x-1.5,2,z+1.8,.8,.7,.2,'#efcf86',{glow:true});
   block(x+2.8,.9,z+1.5,.7,1.2,1,'#a97c53');sign(x,2.8,z+2.45,'居住許可？','#705041','#f4d496',2,.45);
  }else if(t.area==='commercial'){
   cylinder(x,2.1,z,2.5,2.7,3.5,color,8);cylinder(x,4.1,z,3.1,2.7,.5,'#e2bf89',12);
   block(x,1.7,z+2.5,2.8,1.7,.15,'#253f48');sign(x,3.45,z+2.65,t.type==='shop'?'ロボ商店':['原子食堂','未来金融','廃品市場'][t.id%3],'#355f61','#ffe09d',4,.7);nightStrip(x,3.9,z+2.7,4,'#76e5c9');
   cylinder(x+1.3,5,z,.18,.18,1.5,'#c9b997');mesh(new T.SphereGeometry(.45,8,5),mat('#df875b',true),x+1.3,5.9,z);
  }else{
   cylinder(x,3.5,z,1.3,1.5,6.2,'#c6c6a7',10);cylinder(x,5.8,z,3.1,2.4,1.7,color,12);
   mesh(new T.SphereGeometry(3.1,12,6,0,Math.PI*2,0,Math.PI/2),mat('#78aaa7'),x,6.7,z);
   for(const side of [-1,1]){block(x+side*2,1.1,z+1.2,.5,1.2,.5,'#766d54');mesh(new T.IcosahedronGeometry(1,0),mat('#76996b'),x+side*2,2,z+1.2);}
   sign(x,5.6,z+2.7,'幸福・定額制','#56726c','#f5e3b4',3,.55);
  }
  nightGlow(x,z+3.5,'#82e4d2',3.5,'window');
  // Machinery sits beside its own tile, leaving the pawn marker readable.
  const sx=t.x-2.9,sz=t.z-2.7;
  if(t.atomKind==='taxi'){
   cylinder(sx,1,sz,1.1,1.1,1.2,'#e0b769',10);sign(sx,3,sz,'TAXI','#3b7371','#ffe19f',2.3,.7);block(sx,2,sz,.15,2,.15,'#bbd5c0');
  }else if(t.atomKind==='switch'){block(sx,1.3,sz,1.3,1.8,.7,'#79a6a0');block(sx,1.5,sz+.4,.75,.7,.08,'#e8bd6c',{glow:true});}
  else if(t.atomKind==='reclaim'){cylinder(sx,.9,sz,1.2,1.4,1.3,'#b2895e');cylinder(sx,1.7,sz,.6,.7,.5,'#77ded0');}
  else if(t.atomKind==='chute'){cylinder(sx,1.4,sz,1,1.6,2,'#c89b6b');sign(sx,2.7,sz,'↓','#865847','#ffe0b0',1.5,.7);}
  else if(t.atomKind==='hot'){block(sx,.8,sz,1.7,.7,1.7,'#b7784e');nightStrip(sx,1.3,sz,1.8,'#f4b45f');}
  if(t.type==='koban'){block(sx,1.4,sz,1.9,2,1.7,'#d7cbaa');mesh(new T.SphereGeometry(1.1,8,5,0,Math.PI*2,0,Math.PI/2),mat('#718f95'),sx,2.4,sz);sign(sx,1.8,sz+.9,'住所確認','#425d6c','#f7daa0',1.8,.45);}
  if(t.type==='shelter'){mesh(new T.SphereGeometry(1.7,10,5,0,Math.PI*2,0,Math.PI/2),mat('#80b695'),sx,1.2,sz);block(sx,.9,sz+1.5,1,1,.2,'#345d53');sign(sx,2.5,sz,'防護','#3a705e','#d9efbd',1.8,.6);}
 }
 // Central reactor under the suspended city administrator.
 cylinder(0,1,0,10,12,2,'#b09b75',16);cylinder(0,5,0,7,8,7,'#729991',16);cylinder(0,9,0,8,7,1,'#dac494',16);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;block(Math.cos(a)*7,5,Math.sin(a)*7,.6,5,.6,'#cfe1b7',{absolute:true});}
 sign(0,10,8,'明日の楽園・第0区','#375e5a','#f2d9a0',13,1.7);
 // Distant saucer towers and a moving aerial transit loop restore a lived-in skyline.
 for(let i=0;i<13;i++){const x=-90+i*15,z=-92-(i%3)*5,h=12+(i%4)*4;block(x,h/2,z,3,h,3,'#688b87',{absolute:true});mesh(new T.CylinderGeometry(6,4,2,12),mat('#a8b8a5'),x,h,z,true);mesh(new T.SphereGeometry(4,10,5,0,Math.PI*2,0,Math.PI/2),mat('#91aaa0'),x,h+1,z,true);}
 for(let i=0;i<3;i++){const car=new T.Group(),body=new T.Mesh(new T.BoxGeometry(4,1.1,2),mat(['#d9bc8b','#7aa6a3','#b68669'][i]));car.add(body);const roof=new T.Mesh(new T.BoxGeometry(2,.8,1.7),mat('#476971'));roof.position.y=.8;car.add(roof);car.position.set(0,13+i*3,-78-i*4);scene.add(car);animated.push({kind:'train',object:car,speed:3+i,span:190,offset:i*62});}
 return {counts,lots,features:{atomPods:counts.slum,atomMarkets:counts.commercial,skyGardens:counts.luxury,raisedRing:true,aerialTraffic:3}};
}
export function createAtomThreatModel({T,scene,squares,elevation,reduced}){
 const root=new T.Group();root.position.set(0,22,0);scene.add(root);
 const material=(color,glow=false)=>new T.MeshLambertMaterial({color,emissive:glow?color:0,emissiveIntensity:glow?.9:0});
 const add=(g,m,x,y,z)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;root.add(o);return o;};
 add(new T.SphereGeometry(6.5,16,8),material('#c3b78e'),0,0,0).scale.y=.65;
 add(new T.CylinderGeometry(8.6,7.8,.65,16),material('#718f87'),0,0,0);
 add(new T.CylinderGeometry(3.8,1.2,4,12),material('#50676a'),0,-3,0);
 const eye=add(new T.SphereGeometry(2.5,12,8),material('#f4b66a',true),0,0,5.4);eye.scale.z=.32;
 const iris=add(new T.SphereGeometry(1.2,10,8),material('#4b3435'),0,0,6.2);iris.scale.z=.2;
 for(let i=0;i<4;i++){const a=i*Math.PI/2;add(new T.CylinderGeometry(.25,.35,6,6),material('#cfba89'),Math.cos(a)*7,-3,Math.sin(a)*7);}
 const ring=add(new T.TorusGeometry(10,.16,4,32),material('#b4d9c0',true),0,1,0);ring.rotation.x=.7;
 const markers=new Map(),beams=new Map();
 for(const t of squares.values()){
  const m=new T.Mesh(new T.RingGeometry(2,2.65,24),new T.MeshBasicMaterial({color:'#ed6956',transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(t.x,elevation(t.x,t.z)+.65,t.z);m.visible=false;scene.add(m);markers.set(t.id,m);
  if(t.type!=='center'){
   const a=new T.Vector3(0,18,0),b=new T.Vector3(t.x,elevation(t.x,t.z)+1,t.z),delta=b.clone().sub(a);
   const beam=new T.Mesh(new T.CylinderGeometry(.18,1.8,delta.length(),8),new T.MeshBasicMaterial({color:'#f7ad6d',transparent:true,opacity:.5,depthWrite:false}));beam.position.copy(a.add(b).multiplyScalar(.5));beam.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());beam.visible=false;scene.add(beam);beams.set(t.id,beam);
  }
 }
 return {root,markers,beams,draw(s,now){const b=s?.atom?.boss,locked=b?.phase==='locked',firing=s?.cityBeat?.phase==='atom-fire',color=locked?'#ef7456':b?.phase==='cooldown'?'#81d4bb':'#e5bd75';eye.material.color.set(color);eye.material.emissive.set(color);root.position.y=22+(reduced?0:Math.sin(now*.0005)*.45);ring.rotation.z=reduced?0:now*.00008;
  for(const [id,m] of markers){m.visible=locked&&b.targets.includes(id);m.material.color.set(s?.mapData?.find(t=>t.id===id)?.type==='shelter'?'#79e2b1':'#ed6956');}
  for(const [id,m] of beams)m.visible=firing&&b?.targets.includes(id);
 }};
}
