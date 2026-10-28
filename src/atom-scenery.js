import {buildLegacyAtomScenery} from './atom-scenery-legacy.js';
// Streets sit on buildings and stepped retaining walls. Gaps remain open for
// lower passages, while the skyline is kept behind the playable board.
export function buildAtomScenery({T,scene,block,mesh,mat,cylinder,line,sign,squares,edges,elevation,nightGlow,nightStrip,animated,windowMaterials=[]}){
 if([...squares.values()][0]?.boardLayout==='atom-zero-v1')return buildLegacyAtomScenery({T,scene,block,mesh,mat,cylinder,line,sign,squares,edges,elevation,nightGlow,nightStrip,animated});
 const counts={slum:0,commercial:0,luxury:0},lots=[];
 const lit=color=>{const m=mat(color,true);if(!windowMaterials.includes(m))windowMaterials.push(m);return m;};
 const lamp=(x,y,z,w,h,d,color,ry=0)=>{lit(color);block(x,y,z,w,h,d,color,{absolute:true,glow:true,ry});};
 const geometry=(positions,indices,color)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return mesh(g,new T.MeshLambertMaterial({color,side:T.DoubleSide}),0,0,0,true);};
 function podium(points,color='#65928b'){
  const contour=points.map(p=>new T.Vector2(p.x,p.z)),triangles=T.ShapeUtils.triangulateShape(contour,[]);
  geometry(points.flatMap(p=>[p.x,p.y,p.z]),triangles.flat(),'#bdbe9e');
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length];geometry([a.x,.2,a.z,b.x,.2,b.z,a.x,a.y,a.z,b.x,b.y,b.z],[0,2,1,1,2,3],color);
   const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),ry=Math.atan2(-dz,dx);
   if((a.z+b.z)/2>5)for(let f=.2;f<.95;f+=.25)for(let y=1.7;y<Math.min(a.y,b.y)-1;y+=2.2)lamp(a.x+dx*f,y,a.z+dz*f+.11,1.1,1.2,.12,'#efc987',ry);
  }
 }
 const inner=[...squares.values()].filter(t=>t.ring==='inner');
 podium(inner.map(t=>({x:t.x,y:elevation(t.x,t.z)-.07,z:t.z})));
 // A long municipal building is also the highest, walkable rooftop street.
 podium([[-29,-55],[43,-55],[43,-39],[0,-39],[0,-45],[-16,-45],[-16,-39],[-29,-39]].map(([x,z])=>({x,z,y:14.9})),'#c18d73');
 for(let x=-26;x<=38;x+=8){if(x>=-16&&x<=0)continue;block(x,6,-38.8,1,11,.8,'#e6cea0',{absolute:true});for(let y=2;y<13;y+=3)lamp(x+2,y,-38.7,2,1.5,.15,'#efd19a');}
 sign(6,15.1-elevation(6,-38.3)+.38,-38.3,'未来は全員のもの ※住所必須','#386e70','#f4d69a',18,1.3);
 let stairs=0,bridges=0;
 for(const [a,b] of edges){
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=dz/len*3.8,nz=-dx/len*3.8,ya=elevation(a.x,a.z),yb=elevation(b.x,b.z),ry=Math.atan2(dx,dz);
  if(Math.max(ya,yb)>1.1){
   bridges++;const corners=[{x:a.x-nx,z:a.z-nz,y:ya-.1},{x:a.x+nx,z:a.z+nz,y:ya-.1},{x:b.x+nx,z:b.z+nz,y:yb-.1},{x:b.x-nx,z:b.z-nz,y:yb-.1}];
   // A thick deck gives height a readable front edge without filling alleys.
   const v=corners.flatMap(p=>[p.x,p.y,p.z]);geometry(v,[0,1,2,0,2,3],'#d7c49a');
   for(let i=0;i<4;i++){const p=corners[i],q=corners[(i+1)%4];geometry([p.x,p.y,p.z,q.x,q.y,q.z,p.x,Math.max(.2,p.y-1.8),p.z,q.x,Math.max(.2,q.y-1.8),q.z],[0,2,1,1,2,3],'#72978d');}
   const x=(a.x+b.x)/2,z=(a.z+b.z)/2,h=(ya+yb)/2;block(x,h/2,z,1.2,h,1.2,'#74948b',{absolute:true});
   for(const side of [-1,1])for(const f of [.2,.5,.8]){const x=a.x+dx*f+nx*side*.85,z=a.z+dz*f+nz*side*.85,y=ya+(yb-ya)*f;block(x,y+.6,z,.12,1.2,.12,'#d5c7a3',{absolute:true});}
  }
  if(!b.next.includes(a.id)){const arrow=mesh(new T.ConeGeometry(.48,1.35,3),mat('#efc66c',true),a.x+dx*.4,ya+(yb-ya)*.4+.5,a.z+dz*.4,true);arrow.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(dx,0,dz).normalize());}
  if(Math.abs(ya-yb)>1.2){stairs++;for(let f=.12;f<.95;f+=.12)block(a.x+dx*f,ya+(yb-ya)*f+.23,a.z+dz*f,5.9,.13,.24,'#e0cd9e',{absolute:true,ry});}
 }
 const roadDistance=(x,z)=>Math.min(...edges.map(([a,b])=>{const dx=b.x-a.x,dz=b.z-a.z,f=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a.x-dx*f,z-a.z-dz*f);}));
 // Build in the pockets between roads, not as a fence of identical outer houses.
 const candidates=[];for(let z=-30;z<=34;z+=8)for(let x=-52;x<=52;x+=8){const clearance=roadDistance(x,z);if(clearance<7||Math.hypot(x,z)<17)continue;const near=[...squares.values()].sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];candidates.push({x,z,area:near.area,clearance});}
 candidates.sort((a,b)=>b.clearance-a.clearance);
 for(const lot of candidates){if(lots.length>=25||lots.some(p=>Math.hypot(p.x-lot.x,p.z-lot.z)<11))continue;lots.push(lot);}
 for(const [index,{x,z,area}] of lots.entries()){
  const y=elevation(x,z),color=area==='slum'?'#cf997b':area==='commercial'?'#75aaa1':'#dfcda4';counts[area]++;
  if(y>1)block(x,y/2,z,5.7,y,5.7,'#718f87',{absolute:true});
  mesh(new T.CylinderGeometry(3.8,3.8,.5,8),mat('#cbb88d'),x,y-.1,z,true);
  if(area==='slum'){
   cylinder(x,1.9,z,2.5,2.5,3,color,10);mesh(new T.SphereGeometry(2.55,10,5,0,Math.PI*2,0,Math.PI/2),mat('#698f8d'),x,3.4,z);
   block(x,1.4,z+2.45,1.1,1.7,.15,'#3b5959');lamp(x-1.5,y+2,z+1.9,.8,.7,.2,'#efc987');
   block(x+2.9,.9,z+1.3,.7,1.2,1,'#b1855c');sign(x,2.8,z+2.5,'居住許可？','#7d5046','#f4d496',2.3,.5);
  }else if(area==='commercial'){
   const h=4+index%3;block(x,.38+h/2,z,5.2,h,4.6,color);block(x,.38+h,z,5.8,.4,5,'#e3c191');
   block(x,1.7,z+2.35,3.3,1.7,.15,'#315357');sign(x,3.45,z+2.5,['原子食堂','未来金融','ロボ商店','廃品市場'][index%4],'#315c61','#ffe0a0',4.6,.8);nightStrip(x,3.9,z+2.65,4.4,index%2?'#ee9b95':'#80dfca');
   for(const side of [-1,1])lamp(x+side*1.6,y+h-1.1,z+2.37,1.2,.85,.12,'#efc987');
   cylinder(x+1.4,h+1.4,z,.16,.2,2,'#d0b488');mesh(new T.SphereGeometry(.45,8,5),mat('#d5846f',true),x+1.4,h+2.5,z);
  }else{
   cylinder(x,3.5,z,1.4,1.8,6.2,'#c8bc99',10);cylinder(x,5.8,z,3.2,2.6,1.7,color,12);mesh(new T.SphereGeometry(3.2,12,6,0,Math.PI*2,0,Math.PI/2),mat('#87b6ad'),x,6.7,z);
   for(const side of [-1,1]){block(x+side*2,1.1,z+1.2,.5,1.2,.5,'#887055');mesh(new T.IcosahedronGeometry(.85,0),mat('#83a17b'),x+side*2,2,z+1.2);}
   sign(x,5.6,z+2.8,'幸福・定額制','#597e72','#f5e3b4',3.6,.6);lamp(x,y+5.8,z+2.9,2.6,.8,.12,'#a1e0c9');
  }
  nightGlow(x,z+3.6,'#efc987',3.5,'window');
 }
 for(const t of squares.values()){
  const sx=t.x-2.9,sz=t.z-2.7;
  if(t.atomKind==='taxi'){cylinder(sx,1,sz,1.1,1.1,1.2,'#deb269',10);sign(sx,3,sz,'TAXI','#3b7371','#ffe19f',2.3,.7);block(sx,2,sz,.15,2,.15,'#bbd5c0');}
  else if(t.atomKind==='switch'){block(sx,1.3,sz,1.3,1.8,.7,'#79a6a0');block(sx,1.5,sz+.4,.75,.7,.08,'#e8bd6c',{glow:true});}
  else if(t.atomKind==='reclaim'){cylinder(sx,.9,sz,1.2,1.4,1.3,'#b2895e');cylinder(sx,1.7,sz,.6,.7,.5,'#77ded0');}
  else if(t.atomKind==='chute'){cylinder(sx,1.4,sz,1,1.6,2,'#c89b6b');sign(sx,2.7,sz,'↓','#865847','#ffe0b0',1.5,.7);}
  else if(t.atomKind==='hot'){block(sx,.8,sz,1.7,.7,1.7,'#b7784e');nightStrip(sx,1.3,sz,1.8,'#f4b45f');}
  if(t.type==='koban'){block(sx,1.4,sz,1.9,2,1.7,'#d7cbaa');mesh(new T.SphereGeometry(1.1,8,5,0,Math.PI*2,0,Math.PI/2),mat('#718f95'),sx,2.4,sz);sign(sx,1.8,sz+.9,'住所確認','#425d6c','#f7daa0',1.8,.45);}
  if(t.type==='shelter'){mesh(new T.SphereGeometry(1.7,10,5,0,Math.PI*2,0,Math.PI/2),mat('#80b695'),sx,1.2,sz);block(sx,.9,sz+1.5,1,1,.2,'#345d53');sign(sx,2.5,sz,'防護','#3a705e','#d9efbd',1.8,.6);}
 }
 // The reactor stays a recognisable round landmark inside the angular plaza.
 cylinder(0,1,0,8.5,10,2,'#c2a67b',16);cylinder(0,4,0,6,7,5,'#719d95',16);cylinder(0,7,0,7,6,1,'#e1c494',16);
 sign(0,8.2,7,'明日の楽園・第0区','#375e5a','#f2d9a0',12,1.4);
 const skylineColors=['#bb8575','#8bb3a4','#d6bc92','#638f91','#ac9c79'];let tallest=0;
 for(let i=0;i<23;i++){
  const back=i>=14,index=back?i-14:i,x=back?-108+index*27:-91+index*14,z=back?-110-(index%2)*7:-78-(index%3)*6,h=back?42+(index*13)%32:24+(index*11)%27,w=6+(i%3)*1.5,c=skylineColors[i%5];tallest=Math.max(tallest,h+6);
  if(i%4===0){block(x,h*.24,z,w+3,h*.48,w+2,c,{absolute:true});block(x,h*.61,z,w,h*.26,w,'#c9b38f',{absolute:true});block(x,h*.86,z,w*.55,h*.24,w*.65,c,{absolute:true});}
  else if(i%4===1){mesh(new T.CylinderGeometry(w*.37,w*.5,h,10),mat(c),x,h/2,z,true);for(const f of [.6,.9])mesh(new T.CylinderGeometry(w*.9,w*.7,2.2,12),mat('#d6c59f'),x,h*f,z,true);mesh(new T.SphereGeometry(w*.6,12,6,0,Math.PI*2,0,Math.PI/2),mat('#87afa4'),x,h*.92,z,true);}
  else if(i%4===2){mesh(new T.CylinderGeometry(w*.42,w*.62,h-6,10),mat(c),x,(h-6)/2,z,true);mesh(new T.ConeGeometry(w*.42,9,10),mat('#d8c499'),x,h-1.5,z,true);}
  else{for(const side of [-1,1])block(x+side*w*.5,h/2,z,w*.65,h,w,c,{absolute:true});block(x,h-5,z,w*1.7,3,w,'#d9c19b',{absolute:true});}
  for(let y=5;y<h-8;y+=4)for(const side of [-1,1])lamp(x+side*w*.24,y,z+w*.52,.7,1.5,.18,i%2?'#f2ce8d':'#a2dfc6');
  block(x,h+2,z,.23,4,.23,'#bdad91',{absolute:true});lamp(x,h+4,z,.6,.8,.6,'#efac95');
 }
 // A pale planetary disc and orbital ring read like a 1950s travel poster.
 const planet=mesh(new T.SphereGeometry(17,24,12),mat('#edce9e'),-71,57,-127,true);planet.castShadow=false;
 const orbit=mesh(new T.TorusGeometry(25,.22,4,64),mat('#dec6a3'),-71,57,-127,true);orbit.rotation.x=.25;orbit.rotation.z=-.35;orbit.castShadow=false;
 for(let i=0;i<3;i++){const car=new T.Group(),body=new T.Mesh(new T.BoxGeometry(4,1.1,2),mat(['#ddaa86','#8bb9ad','#d5c58d'][i]));car.add(body);const roof=new T.Mesh(new T.BoxGeometry(2,.8,1.7),mat('#456b70'));roof.position.y=.8;car.add(roof);car.position.set(0,19+i*4,-65-i*4);scene.add(car);animated.push({kind:'train',object:car,speed:3+i,span:190,offset:i*62});}
 return {counts,lots,features:{atomPods:counts.slum,atomMarkets:counts.commercial,skyGardens:counts.luxury,terracedPlaza:true,rooftopStreet:true,stairRoutes:stairs,elevatedDecks:bridges,skylineTowers:23,tallestTower:tallest,aerialTraffic:3}};
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
