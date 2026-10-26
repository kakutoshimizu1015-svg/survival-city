// Geometry-only NPCs. Gameplay, encounters and visibility stay in the original store.
export const NPC_KEYS = ['truck','police','uncle','animal','yakuza','loanshark','friend'];
export function createNpcModel(T, kind) {
 const root=new T.Group(), body=new T.Group();root.name=`npc-${kind}`;root.add(body);
 const materials=new Map(), box=new T.BoxGeometry(1,1,1), wheels=[], limbs=[], lamps=[];
 const material=(color,glow=false)=>{const key=color+glow;if(!materials.has(key))materials.set(key,new T.MeshLambertMaterial({color,flatShading:true,emissive:glow?color:0,emissiveIntensity:glow?.65:0}));return materials.get(key);};
 function mesh(parent,geometry,color,x,y,z,glow=false){const m=new T.Mesh(geometry,material(color,glow));m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
 function cube(p,x,y,z,w,h,d,c){const m=mesh(p,box,c,x,y,z);m.scale.set(w,h,d);return m;}
 function cyl(p,x,y,z,r,h,c,sides=8){return mesh(p,new T.CylinderGeometry(r,r,h,sides),c,x,y,z);}
 function ball(p,x,y,z,r,c,sx=1,sy=1,sz=1){const m=mesh(p,new T.IcosahedronGeometry(r,0),c,x,y,z);m.scale.set(sx,sy,sz);return m;}
 function bar(p,a,b,r,c){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const m=mesh(p,new T.CylinderGeometry(r,r,v.length(),5),c,...a);m.position.addScaledVector(v,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
 function lamp(p,x,y,z,c){const m=mesh(p,new T.BoxGeometry(.38,.25,.3),c,x,y,z,true);lamps.push(m);return m;}
 function wheel(x,z,r){const g=new T.Group();g.position.set(x,r+.08,z);body.add(g);const tire=cyl(g,0,0,0,r,.36,'#242b2c',10);tire.rotation.z=Math.PI/2;const hub=cyl(g,Math.sign(x)*.2,0,0,r*.53,.08,'#8c8270',8);hub.rotation.z=Math.PI/2;cube(g,Math.sign(x)*.25,0,0,.03,r*.15,r*.85,'#514c42');wheels.push(g);}
 function human(parent,type,x=0,z=0,scale=1){
  const g=new T.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);
  const officer=type==='officer',uncle=type==='uncle',friend=type==='friend',shark=type==='loanshark';
  const coat=officer?'#344c69':uncle?'#806046':friend?'#527b70':shark?'#51415d':'#a2733e';
  const pants=officer?'#293f58':friend?'#65604c':uncle?'#514d43':'#343640',skin='#ba8b68';
  const arms=new Map();
  const torso=cube(g,0,1.85,0,uncle?1.14:1,.95,.62,coat);if(uncle)torso.rotation.x=-.09;
  cube(g,0,1.37,0,1,.15,.65,'#363b36');cube(g,.08,1.4,.34,.18,.14,.07,'#bda165');
  for(const side of [-1,1]){
   const leg=new T.Group();leg.position.set(side*.27,1.3,0);g.add(leg);cube(leg,0,-.49,0,.38,.98,.4,pants);cube(leg,0,-1.12,.16,.43,.24,.68,'#2f3431');limbs.push({part:leg,phase:side,amount:.5});
   const arm=new T.Group();arm.position.set(side*.64,2.22,0);g.add(arm);arms.set(side,arm);cube(arm,0,-.36,0,.32,.8,.4,uncle?'#66777b':coat);cube(arm,0,-.85,.02,.3,.28,.32,skin);limbs.push({part:arm,phase:-side,amount:.36});
   if(uncle&&side===-1){arm.rotation.x=-.45;bar(arm,[0,-.84,.12],[0,-2.1,.36],.07,'#684d36');bar(arm,[0,-.84,.12],[.2,-.84,.12],.08,'#684d36');}
   if(shark&&side===1){cube(arm,0,-1.18,0,.25,.52,.73,'#342e2b');cube(arm,0,-.94,0,.12,.18,.26,'#a7976b');}
  }
  cube(g,0,2.45,0,.32,.3,.3,skin);ball(g,0,2.93,0,.58,skin,.85,1.03,.83);cube(g,0,2.88,.49,.19,.21,.18,skin);
  for(const side of [-1,1]){cube(g,side*.23,3.02,.43,.16,.08,.06,'#272e2c');cube(g,side*.22,3.12,.42,.24,.08,.07,'#464139');}
  if(officer){cyl(g,0,3.35,0,.49,.18,'#283e57');cube(g,0,3.28,.37,.72,.08,.45,'#253440');cube(g,0,3.37,.46,.15,.14,.06,'#d6bb68');cube(g,-.27,2.07,.33,.17,.22,.05,'#c7b36b');cube(g,.32,1.65,.37,.18,.3,.12,'#222f38');}
  else if(uncle){cube(g,-.43,3.04,-.07,.12,.4,.48,'#777b72');cube(g,.43,3.04,-.07,.12,.4,.48,'#777b72');cube(g,0,2.7,.45,.24,.14,.08,'#4c302a');cube(g,0,1.96,.33,.17,.67,.04,'#b79c78');}
  else if(friend){cyl(g,0,3.34,0,.5,.3,'#8b7755');cube(g,0,2.62,.33,.58,.35,.25,'#77746a');cube(g,0,1.96,-.49,1.0,1.1,.5,'#827056');cube(g,-.27,1.64,.33,.33,.22,.04,'#bda47d');}
  else{cube(g,0,3.32,-.02,.83,.24,.78,'#282f31');cube(g,0,3.02,.49,.74,.17,.07,'#1c2b30');cube(g,0,2.09,.33,.3,.6,.04,'#d3cbb4');cube(g,0,2.08,.37,.1,.46,.04,shark?'#be9872':'#965249');}
  // Large recognizable accessories first; small tailoring details reinforce the silhouette.
  const features=[];function detail(name,build){const part=new T.Group();part.name=name;g.add(part);features.push(name);build(part);return part;}
  if(friend){
   torso.rotation.x=.1;
   detail('patched-coat',p=>{for(const [x,y,c] of [[-.32,1.68,'#bd9d67'],[.25,2.1,'#6e5360'],[-.32,2.23,'#a8a07e']]){cube(p,x,y,.34,.28,.25,.06,c);for(const sx of [-1,1])cube(p,x+sx*.1,y,.38,.025,.2,.02,'#ded0aa');}for(const x of [-.36,-.12,.12,.36])cube(p,x,1.28,.06,.19,.25,.62,'#527b70');});
   detail('wool-cap-and-scarf',p=>{cyl(p,0,3.4,0,.52,.2,'#a08c60');for(let i=0;i<7;i++)cube(p,-.36+i*.12,3.43,.4,.04,.17,.08,'#6c6046');cube(p,0,2.46,.14,.69,.23,.59,'#b0814a');cube(p,.25,2.14,.38,.2,.55,.12,'#b0814a');for(let i=0;i<3;i++)cube(p,.19+i*.06,1.84,.38,.025,.12,.13,'#d7b67c');});
   detail('bedroll-backpack',p=>{const roll=cyl(p,0,2.65,-.72,.32,1.35,'#659294',10);roll.rotation.z=Math.PI/2;for(const x of [-.4,.4]){const strap=cyl(p,x,2.65,-.72,.335,.1,'#3c5655',10);strap.rotation.z=Math.PI/2;bar(p,[x,2.27,.36],[x,1.46,.36],.065,'#a28a5c');}cube(p,.2,1.85,-.78,.35,.38,.1,'#bdab87');});
   const bag=detail('salvage-bag-and-cans',p=>{ball(p,-.88,.72,.18,.52,'#b6bb9d',.8,1.1,.7);bar(p,[-.88,1.16,.18],[-.65,1.43,.12],.065,'#a3ad92');for(const [x,y,z] of [[-.98,1.03,.37],[-.72,.89,.48],[-.8,1.14,.1]]){cyl(p,x,y,z,.11,.27,'#b9c7b4');cyl(p,x,y+.14,z,.1,.025,'#e0dfc0');}});
   detail('scruffy-beard',p=>{for(const x of [-.25,-.1,.05,.2])ball(p,x,2.57,.4,.16,'#989281',.7,1.2,.6);});
  }else if(shark){
   detail('pinstripe-suit',p=>{for(const x of [-.36,-.18,.18,.36])cube(p,x,1.86,.327,.025,.78,.015,'#9d8496');const a=cube(p,-.17,2.15,.36,.19,.52,.06,'#88758b');a.rotation.z=-.35;const b=cube(p,.17,2.15,.36,.19,.52,.06,'#88758b');b.rotation.z=.35;for(const y of [1.72,1.9])ball(p,.09,y,.38,.045,'#c8ae67');cube(p,-.3,2.12,.39,.16,.11,.04,'#c6b9a3');});
   detail('gold-rim-glasses',p=>{for(const x of [-.22,.22]){cube(p,x,3.02,.535,.31,.2,.055,'#d9b35b');cube(p,x,3.03,.568,.24,.13,.025,'#293739');}bar(p,[-.08,3.03,.56],[.08,3.03,.56],.025,'#d9b35b');});
   detail('slick-hair',p=>{for(let i=0;i<4;i++)cube(p,0,3.38+i*.035,-.13+i*.09,.76-i*.045,.07,.16,'#2b2932');});
   detail('loan-ledger-and-cash',p=>{const book=cube(p,-.67,1.58,.47,.48,.67,.19,'#284c48');book.rotation.z=-.12;cube(p,-.67,1.58,.575,.39,.54,.04,'#bdad81');for(let i=0;i<4;i++)cube(p,-.67,1.75-i*.11,.605,.28,.025,.02,'#6b7357');cube(p,.67,1.26,.36,.3,.14,.48,'#7d9976');cube(p,.67,1.34,.36,.33,.025,.48,'#d0d5ac');cube(p,.67,1.36,.36,.12,.02,.5,'#d4bd81');});
   detail('leather-case',p=>{cube(p,.74,.79,.02,.38,.68,.91,'#3c2b30');cube(p,.95,.79,.02,.03,.54,.77,'#69444c');for(const z of [-.27,.27])cube(p,.97,.92,z,.04,.12,.1,'#c6a45a');});
  }else if(uncle){
   detail('bald-head-and-moustache',p=>{ball(p,0,3.27,.02,.34,skin,1,.45,1);for(const x of [-.13,.13])cube(p,x,2.78,.51,.22,.1,.08,'#78716a');for(const x of [-.24,.24]){const brow=cube(p,x,3.15,.48,.3,.09,.07,'#6c6358');brow.rotation.z=x<0?-.2:.2;}});
   detail('argyle-cardigan',p=>{for(const x of [-.3,.3])for(const y of [1.7,1.95,2.2]){const patch=cube(p,x,y,.35,.17,.17,.04,'#b29872');patch.rotation.z=Math.PI/4;}for(const y of [1.63,1.83,2.03])ball(p,0,y,.4,.045,'#44382e');});
   detail('towel-and-bag',p=>{cube(p,.35,2.22,.39,.22,.64,.08,'#d4ccb0');for(let i=0;i<3;i++)cube(p,.29+i*.06,1.85,.39,.025,.12,.08,'#bfb494');ball(p,.82,.75,.2,.36,'#ddd6b5',.85,1,.7);bar(p,[.82,1.04,.2],[.64,1.4,.08],.04,'#c2bca1');cube(p,.84,1.11,.16,.1,.27,.11,'#6b8979');});
  }else if(officer){
   detail('uniform-equipment',p=>{for(const x of [-.47,.47])cube(p,x,2.32,0,.24,.09,.52,'#b3b8a3');cube(p,-.4,1.6,.37,.24,.4,.15,'#27353c');bar(p,[-.43,1.81,.4],[-.43,2.14,.4],.025,'#303536');cube(p,.52,1.25,.1,.21,.48,.2,'#2b3034');for(const x of [-.1,.1]){const cuff=mesh(p,new T.TorusGeometry(.1,.025,4,8),'#adb5a8',x,1.35,.38);}});
   detail('cap-badge-and-tie',p=>{ball(p,0,3.39,.5,.1,'#e2c56d',.75,1,.3);cube(p,0,2.08,.35,.09,.49,.04,'#1e2a3b');for(const y of [1.74,1.92,2.1])ball(p,.15,y,.35,.025,'#bab58f');});
  }else{
   detail('pompadour-hair',p=>{cube(p,0,3.43,.13,.79,.23,.72,'#22262b');cube(p,0,3.55,.31,.69,.12,.4,'#30343c');cube(p,0,3.6,.43,.5,.08,.18,'#40454b');});
   detail('patterned-open-shirt',p=>{cube(p,0,2.15,.365,.3,.55,.06,skin);for(const x of [-.32,.32])for(const y of [1.58,1.85,2.14]){cube(p,x,y,.35,.12,.09,.03,'#48352d');cube(p,x+.06,y+.08,.35,.07,.06,.03,'#e1ba73');}bar(p,[-.18,2.37,.41],[0,2.03,.43],.04,'#d6b45b');bar(p,[0,2.03,.43],[.18,2.37,.41],.04,'#d6b45b');ball(p,0,2.02,.44,.085,'#e2bd59');});
   detail('tattoo-and-watch',p=>{cube(p,-.68,1.47,.2,.31,.28,.13,skin);for(let i=0;i<3;i++)cube(p,-.68,1.4+i*.09,.28,.24,.035,.04,'#46685e');cube(p,.67,1.5,.15,.34,.12,.39,'#c9a455');cube(p,.67,1.51,.37,.2,.14,.04,'#ead6a0');});
   detail('pointed-loafers',p=>{for(const x of [-.27,.27]){cube(p,x,.17,.25,.44,.18,.79,'#6a3034');cube(p,x,.26,.4,.27,.05,.11,'#d3ab56');}});
  }
  root.userData.features=features;g.name=type+'-character';
  return g;
 }
 let companion=null,tail=null;
 if(kind==='truck'){
  // Front points along +Z. Tall compactor, six wheels and a deep rear hopper.
  cube(body,0,1.1,0,3.7,.48,7.9,'#303c3d');cube(body,0,3.0,-1.2,3.9,3.35,4.7,'#42698a');
  cube(body,0,2.35,2.58,3.65,2.45,2.55,'#d2c9a9');cube(body,0,3.69,2.52,3.85,.18,2.7,'#c0b99c');
  cube(body,0,2.94,3.88,3.13,.95,.08,'#31494e');cube(body,0,2.94,3.94,.13,1.02,.08,'#a6a68e');
  cube(body,0,1.75,3.94,2.1,.71,.12,'#303e40');for(let i=0;i<4;i++)cube(body,0,1.48+i*.18,4.02,2.04,.065,.09,'#8a938a');
  cube(body,0,1.04,4.02,4.0,.38,.35,'#827c65');
  for(const side of [-1,1]){
   cube(body,side*1.84,2.99,2.57,.07,.86,1.8,'#314e55');cube(body,side*2.13,2.9,3.45,.25,.5,.34,'#343f3b');
   bar(body,[side*1.8,2.7,3.1],[side*2.12,2.7,3.45],.06,'#9c9c85');
   lamp(body,side*1.43,1.87,4.0,'#ffd995');lamp(body,side*1.24,3.92,2.45,'#e59747');
   for(const z of [-2.45,-.8,2.7])wheel(side*1.93,z,.79);
   for(const z of [-3.25,-1.75,-.25])cube(body,side*1.98,3.05,z,.13,3.32,.17,'#74919d');
   cube(body,side*1.98,2.76,-1.28,.05,.82,2.55,'#c0cab9');
   for(let i=0;i<3;i++)cube(body,side*2.02,2.8,-2+i*.64,.06,.32,.42,'#395a70');
   cube(body,side*1.99,1.8,-2.7,.09,.43,.6,'#986342');cube(body,side*1.99,4.28,-.5,.09,.36,.88,'#936743');
   bar(body,[side*1.62,3.8,-3.43],[side*1.62,1.8,-4.12],.16,'#9d9b83');
  }
  cube(body,0,2.35,-3.63,3.4,1.85,.2,'#202f36');cube(body,0,1.48,-3.87,3.9,.24,1.1,'#6f7d79');
  for(const side of [-1,1])cube(body,side*1.85,2,-3.86,.22,1.25,1.1,'#42617a');
  for(let i=0;i<7;i++){const stripe=cube(body,-1.5+i*.5,1.4,-4.44,.29,.33,.07,i%2?'#303c39':'#dbb961');stripe.rotation.z=-.24;}
  cube(body,0,4.73,-1.2,3.76,.18,4.6,'#657f8c');
  for(let i=0;i<3;i++)ball(body,-1+i*.85,2,-3.92,.42,'#34453e');
 }else if(kind==='police'){
  cube(body,0,.91,0,2.65,.66,5.2,'#e2ddc5');cube(body,0,.69,0,2.69,.31,5.25,'#293c42');
  cube(body,0,1.59,-.2,2.23,.92,2.7,'#e1dfcd');cube(body,0,1.64,1.17,1.98,.63,.07,'#3c626b');cube(body,0,1.64,-1.57,1.98,.59,.07,'#3c626b');
  for(const side of [-1,1]){cube(body,side*1.13,1.66,-.18,.07,.58,2.2,'#3c626b');cube(body,side*1.17,1.64,-.23,.05,.69,.14,'#d6d4bb');cube(body,side*1.35,1.03,0,.06,.45,1.6,'#293d45');cube(body,side*1.39,1.05,0,.07,.25,.27,'#c6ae65');for(const z of [-1.65,1.63])wheel(side*1.32,z,.46);lamp(body,side*.91,1.04,2.65,'#fce4a3');}
  cube(body,0,2.13,-.15,1.8,.12,.48,'#b9b8a6');lamp(body,-.58,2.3,-.15,'#d65b48');lamp(body,.58,2.3,-.15,'#d65b48');cube(body,0,.95,2.66,.85,.3,.06,'#35454a');
  companion=human(body,'officer',2.35,-.6,.92);
 }else if(kind==='animal'){
  for(let i=0;i<3;i++){
   const rat=new T.Group();rat.position.set((i-1)*.85,0,i===1?.55:-.35);rat.rotation.y=(i-1)*.3;body.add(rat);
   ball(rat,0,.52,0,.66,i===1?'#6a6654':'#7d7561',.65,.66,1.15);ball(rat,0,.54,.65,.35,'#827864',.8,.8,1.2);
   for(const s of [-1,1]){ball(rat,s*.23,.79,.47,.18,'#a28b78',1,1,.4);cube(rat,s*.17,.62,.88,.08,.09,.07,'#202e2c');for(const z of [-.35,.36])cube(rat,s*.33,.14,z,.16,.17,.26,'#b6987c');}
   ball(rat,0,.48,1.0,.1,'#b79784');const t=new T.Group();t.position.set(0,.32,-.55);rat.add(t);bar(t,[0,0,0],[.3,-.12,-.65],.05,'#ad8d78');bar(t,[.3,-.12,-.65],[.6,-.12,-.92],.04,'#ad8d78');if(i===1)tail=t;
  }
 }else human(body,kind);
 // Moving contact shadows avoid ghost shadows in the cached scenery shadow map.
 const shadow=new T.Mesh(new T.CircleGeometry(1,20),new T.MeshBasicMaterial({color:'#152c2b',transparent:true,opacity:.29,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;shadow.scale.set(kind==='truck'?2.7:kind==='police'?2.5:1.05,kind==='truck'?4.8:kind==='police'?3:1.1,1);root.add(shadow);
 root.userData.kind=kind;root.userData.modelType='low-poly-mesh';
 return {root,animate(now,moving,reduced,horror=false){
  const time=now*.001,walk=reduced?0:Math.sin(time*11);
  body.position.y=!reduced&&moving?(kind==='animal'?Math.abs(walk)*.1:kind==='truck'||kind==='police'?Math.sin(time*17)*.025:Math.abs(walk)*.055):0;
  for(const w of wheels)if(moving&&!reduced)w.rotation.x=time*7;
  for(const l of limbs)l.part.rotation.x=(kind==='uncle'&&l.phase===1?-.35:0)+(moving?walk*l.amount*l.phase:0);
  if(companion)companion.visible=!moving||reduced;
  if(tail)tail.rotation.y=reduced?0:Math.sin(time*3)*.2;
  for(const [i,l] of lamps.entries())l.material.emissiveIntensity=reduced?.65:.55+Math.max(0,Math.sin(time*(horror?4:2)+i*Math.PI))*.55;
 }};
}
