// Presentation only. Equip flags and confirmed actions come from the original game.
export const EQUIPMENT=['shoppingCart','cart','backpack','helmet','shield','shoes','doll','bicycle','foldBike','rainGear'];
export const weaponKind=id=>({17:'brick',18:'bat',19:'nailBat',20:'pistol',21:'shotgun',22:'glove',23:'laser',48:'junkGun',49:'junkGun',50:'junkGun'}[id]||'pistol');
export function createItemModel(T,kind){
 const root=new T.Group(),geometries=new Set(),materials=new Map();root.name='item-'+kind;
 function mat(c,glow=false){const k=c+glow;if(!materials.has(k))materials.set(k,new T.MeshLambertMaterial({color:c,flatShading:true,emissive:glow?c:0,emissiveIntensity:glow?.7:0}));return materials.get(k);}
 function add(geo,c,x,y,z){geometries.add(geo);const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);m.receiveShadow=true;root.add(m);return m;}
 function box(x,y,z,w,h,d,c){return add(new T.BoxGeometry(w,h,d),c,x,y,z);}
 function cylinder(x,y,z,r,h,c){return add(new T.CylinderGeometry(r,r,h,8),c,x,y,z);}
 function bar(a,b,r,c){const v=new T.Vector3(...b).sub(new T.Vector3(...a)),m=add(new T.CylinderGeometry(r,r,v.length(),6),c,...a);m.position.addScaledVector(v,.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
 function wheel(x,y,z,r=.25){const m=cylinder(x,y,z,r,.16,'#293b3c');m.rotation.z=Math.PI/2;}
 if(kind==='shoppingCart'||kind==='cart'){
  const cart=kind==='cart',w=cart?1.9:1.5,d=cart?2.5:1.8,metal='#a4b9b1';
  box(0,.66,0,w,.14,d,cart?'#8d7554':'#536c68');
  for(const x of [-w/2,w/2]){for(const z of [-d/2,d/2]){wheel(x,.25,z);bar([x,.35,z],[x,1.55,z],.06,metal);}for(let z=-d/2;z<=d/2+.01;z+=.3)bar([x,.75,z],[x,1.55,z],.035,metal);for(const y of [.85,1.2,1.55])bar([x,y,-d/2],[x,y,d/2],.04,metal);}
  for(const z of [-d/2,d/2])for(const y of [.85,1.2,1.55])bar([-w/2,y,z],[w/2,y,z],.04,metal);
  bar([-w/2,1.55,-d/2],[ -w/2,1.85,-d/2-.4],.06,metal);bar([w/2,1.55,-d/2],[w/2,1.85,-d/2-.4],.06,metal);bar([-w/2,1.85,-d/2-.4],[w/2,1.85,-d/2-.4],.08,'#c28c53');
  box(-.3,.97,.2,.55,.5,.6,'#b79969');cylinder(.38,.95,-.24,.19,.44,'#869d8c');
 }else if(kind==='backpack'){box(0,0,0,1,.95,.5,'#85734f');box(0,-.16,.29,.7,.48,.15,'#a08c59');box(0,.45,.02,1.03,.17,.55,'#5c7058');for(const x of [-.33,.33])box(x,0,.4,.1,.8,.07,'#c8b487');}
 else if(kind==='helmet'){add(new T.SphereGeometry(.65,10,5,0,Math.PI*2,0,Math.PI/2),'#647b4f',0,0,0);cylinder(0,.01,0,.7,.12,'#87936a');box(0,.2,.59,.12,.2,.05,'#d0bd75');}
 else if(kind==='shield'){box(0,0,0,.95,1.3,.15,'#b49360');box(0,0,.09,.17,1.32,.04,'#d3bb8a');box(0,.05,.1,.96,.17,.04,'#d3bb8a');}
 else if(kind==='shoes'){for(const x of [-.32,.32]){box(x,0,0,.43,.43,.6,'#6b6453');box(x,-.12,.27,.46,.22,.47,'#adb6a4');}}
 else if(kind==='doll'){add(new T.IcosahedronGeometry(.27,0),'#c8a478',0,.42,0);box(0,0,0,.43,.5,.25,'#af7655');bar([-.48,.15,0],[.48,.15,0],.08,'#c5a57a');for(const x of [-.15,.15])box(x,-.36,0,.12,.3,.15,'#8a6a50');}
 else if(kind==='bicycle'||kind==='foldBike'){for(const z of [-.9,.9]){const m=add(new T.TorusGeometry(.64,.09,5,12),'#364746',0,.7,z);m.rotation.y=Math.PI/2;}bar([0,.7,-.9],[0,1.55,-.25],.07,'#b07753');bar([0,.7,.9],[0,1.55,.35],.07,'#b07753');bar([0,1.55,-.25],[0,1.55,.35],.07,'#b07753');bar([0,.7,-.9],[0,.7,.1],.06,'#8ba29a');bar([0,.7,.1],[0,1.55,.35],.06,'#8ba29a');box(0,1.65,-.25,.42,.13,.4,'#354a44');bar([0,1.55,.35],[0,1.95,.6],.06,'#a2b0a1');bar([-.42,1.95,.6],[.42,1.95,.6],.07,'#a2b0a1');}
 else if(kind==='rainGear'){add(new T.ConeGeometry(1.25,.55,8),'#608e91',0,0,0);bar([0,0,0],[0,-1.8,0],.04,'#b5b8a5');}
 else if(kind==='brick'){box(0,0,0,.85,.42,.5,'#a96043');for(const x of [-.22,0,.22])box(x,.22,0,.12,.02,.22,'#693f33');}
 else if(kind==='bat'||kind==='nailBat'){const m=add(new T.CylinderGeometry(.24,.1,2.15,8),kind==='bat'?'#b38c59':'#806953',0,.65,0);m.rotation.x=.24;cylinder(0,-.53,-.16,.13,.3,'#4c5147');if(kind==='nailBat')for(let i=0;i<6;i++)bar([0,.9+i*.12,.08],[Math.sin(i*2.4)*.5,.95+i*.12,.08+Math.cos(i*2.4)*.5],.035,'#c1c5b5');}
 else if(['pistol','shotgun','laser','junkGun'].includes(kind)){
  const long=kind!=='pistol',c=kind==='junkGun'?'#8a785b':kind==='laser'?'#577c79':'#3c494b';box(0,0,.25,.4,.35,long?1.6:1,c);const grip=box(0,-.36,-.1,.3,.65,.34,'#826447');grip.rotation.x=-.25;box(0,.2,.1,.18,.09,.14,'#b6bba7');
  const barrel=cylinder(0,0,long?1.18:.88,kind==='shotgun'?.15:.09,long?.8:.3,'#202f35');barrel.rotation.x=Math.PI/2;
  if(kind==='shotgun'){box(0,-.05,.65,.5,.35,.5,'#9c794e');box(0,-.08,-.8,.38,.4,.7,'#99744c');}if(kind==='laser'){box(0,0,.5,.55,.15,.7,'#8ed5b2');}if(kind==='junkGun'){cylinder(0,.26,0,.25,.5,'#a98c5d');box(.25,0,.35,.14,.45,.8,'#647f7c');}
 }else if(kind==='glove'){add(new T.IcosahedronGeometry(.65,1),'#af654d',0,0,.3);box(0,-.3,-.2,.6,.45,.6,'#665a4d');}
 else if(kind==='drink'||kind==='water'){cylinder(0,0,0,.3,.85,kind==='drink'?'#74a184':'#7ea9ae');cylinder(0,.45,0,.24,.07,'#c4cbbb');box(0,0,.3,.3,.35,.02,'#dfd4a2');}
 else if(kind==='burger'||kind==='hotdog'){const bun=add(new T.SphereGeometry(.55,8,5),'#ceaa68',0,.13,0);bun.scale.set(kind==='hotdog'?1.5:1,.5,1);cylinder(0,-.05,0,.52,.18,'#674734');cylinder(0,-.2,0,.52,.13,'#bd935a');}
 else if(kind==='fries'){box(0,-.1,0,.7,.65,.45,'#af654e');for(let i=0;i<5;i++)box(-.25+i*.12,.35+(i%2)*.12,0,.08,.65,.12,'#dfbe77');}
 else if(kind==='bar'){box(0,0,0,.9,.3,.4,'#795940');box(-.3,0,0,.3,.34,.44,'#b1b5a4');}
 else if(kind==='skateboard'){box(0,0,0,.7,.12,1.9,'#8caa83');for(const x of [-.35,.35])for(const z of [-.65,.65])wheel(x,-.17,z,.15);}
 else {box(0,0,0,.8,1.1,.12,'#d1bd88');box(0,0,.07,.61,.85,.03,'#568e78');box(0,0,.09,.12,.55,.02,'#f0dfad');box(0,0,.1,.42,.12,.02,'#f0dfad');}
 return {root,dispose(){root.removeFromParent();for(const g of geometries)g.dispose();for(const m of materials.values())m.dispose();}};
}
const slots={shoppingCart:[2.0,-.35,0],cart:[-2.4,-.35,-.8],backpack:[-.95,1.45,.25],helmet:[0,3.25,0],shield:[-1.35,1.0,.5],shoes:[0,-.15,.35],doll:[.95,1.15,.5],bicycle:[-2.1,-.35,0],foldBike:[-2.1,-.35,0],rainGear:[-.6,4.1,-.2]};
const consumableKind=id=>({15:'drink',16:'skateboard',30:'burger',31:'fries',32:'hotdog',33:'bar',34:'water'}[id]||'card');
export function createPlayerItems({T,scene,actors,squares,elevation,host,reduced}){
 const equipment=new Map(),effects=[];let aim=null,aimAngle=90,dead=false,viewYaw=0;
 const anchor=id=>actors.get('p'+id)?.sprite;
 function removeEffect(e){e.model.dispose();e.spark?.geometry.dispose();e.spark?.material.dispose();e.spark?.removeFromParent();}
 function makeEffect(id,kind,type,extra={}){if(dead||!anchor(id))return;const model=createItemModel(T,kind);scene.add(model.root);const e={id,kind,type,model,start:performance.now(),duration:type==='attack'?1150:1450,...extra};if(type==='attack'){
  e.spark=new T.Mesh(new T.IcosahedronGeometry(.35,0),new T.MeshBasicMaterial({color:kind==='laser'?'#a5f1ca':'#ffe2a0'}));scene.add(e.spark);e.spark.visible=false;
 }effects.push(e);if(effects.length>12)removeEffect(effects.shift());}
 function sync(state){
  const live=new Set();for(const p of state.players){if(p.hp<=0)continue;for(const kind of EQUIPMENT){if(kind==='bicycle'&&p.equip?.foldBike)continue;if(!(kind==='rainGear'?p.rainGear:p.equip?.[kind]))continue;const key=p.id+':'+kind;live.add(key);if(!equipment.has(key)){const model=createItemModel(T,kind);scene.add(model.root);equipment.set(key,{id:p.id,kind,model});}}}
  for(const [key,e] of equipment)if(!live.has(key)){e.model.dispose();equipment.delete(key);}
  const data=state.weaponArcData,key=data?data.attacker.id+':'+data.cardData.id+':'+data.cardData.name:null;
  if(key!==aim?.key){aim?.model.dispose();aim=null;if(data){const model=createItemModel(T,weaponKind(data.cardData.id));scene.add(model.root);aim={key,id:data.attacker.id,kind:weaponKind(data.cardData.id),model};}}
 }
 function attack({playerId,card,angle,targetPos}){
  const sprite=anchor(playerId);if(!sprite)return;const t=squares.get(targetPos),rad=angle*Math.PI/180;
  const distance=Math.min(16,Math.max(3,(card.range||1)*5));
  const from=sprite.position.clone();from.y+=1.5;from.x+=Math.cos(viewYaw)*1.1;from.z-=Math.sin(viewYaw)*1.1;
  const to=t?new T.Vector3(t.x,elevation(t.x,t.z)+1.5,t.z):from.clone().add(new T.Vector3(Math.cos(rad)*distance,0,Math.sin(rad)*distance));
  if(from.distanceTo(to)<2)to.copy(from).add(new T.Vector3(Math.cos(rad)*3,0,Math.sin(rad)*3));
  makeEffect(playerId,weaponKind(card.id),'attack',{from,to,angle:Math.atan2(to.x-from.x,to.z-from.z)});
 }
 function draw(now,yaw){viewYaw=yaw;const visible=[];
  for(const e of equipment.values()){const s=anchor(e.id),r=e.model.root;r.visible=!!s?.visible;if(!r.visible)continue;const [x,y,z]=slots[e.kind];r.position.copy(s.position).add(new T.Vector3(x*Math.cos(yaw)+z*Math.sin(yaw),y,-x*Math.sin(yaw)+z*Math.cos(yaw)));r.rotation.y=yaw+(['shoppingCart','cart'].includes(e.kind)?.65:['bicycle','foldBike'].includes(e.kind)?1.2:0);visible.push({player:e.id,kind:e.kind,x:+r.position.x.toFixed(2),z:+r.position.z.toFixed(2)});}
  if(aim){const s=anchor(aim.id),r=aim.model.root;r.visible=!!s?.visible;if(s){r.position.copy(s.position).add(new T.Vector3(Math.cos(yaw)*1.0,1.5,-Math.sin(yaw)*1.0));r.rotation.y=Math.PI/2-aimAngle*Math.PI/180;}}
  for(let i=effects.length-1;i>=0;i--){const e=effects[i],f=(now-e.start)/e.duration;if(f>=1){removeEffect(e);effects.splice(i,1);continue;}const s=anchor(e.id),r=e.model.root;r.visible=!!s?.visible;if(!r.visible){if(e.spark)e.spark.visible=false;continue;}
   if(e.type==='use'){r.position.copy(s.position).add(new T.Vector3(Math.cos(yaw)*1.25,1.7+(reduced?0:Math.sin(f*Math.PI)*.7),-Math.sin(yaw)*1.25));r.rotation.set(0,yaw,reduced?0:Math.sin(f*Math.PI)*.3);}
   else{r.position.copy(e.from);r.rotation.set(0,e.angle,0);const shot=Math.max(0,Math.min(1,(f-.2)/.5));
    if(!reduced){if(e.kind==='brick'){r.position.lerp(e.to,shot);r.position.y+=Math.sin(shot*Math.PI)*3.2;r.rotation.x=shot*Math.PI*3;r.rotation.z=shot*2;}
     else if(e.kind==='bat'||e.kind==='nailBat'){r.rotation.y+=-.9+Math.sin(Math.min(1,f/.75)*Math.PI)*2.5;r.rotation.z=.8;r.position.add(new T.Vector3(Math.sin(r.rotation.y)*1.1,0,Math.cos(r.rotation.y)*1.1));}
     else{r.position.add(new T.Vector3(-Math.sin(e.angle)*Math.sin(f*Math.PI)*.25,0,-Math.cos(e.angle)*Math.sin(f*Math.PI)*.25));}
     const impact=['brick','bat','nailBat','glove'].includes(e.kind);e.spark.visible=impact?f>.65&&f<.82:f>.22&&f<.72;e.spark.position.copy(e.from).lerp(e.to,impact?1:shot);e.spark.scale.setScalar(e.kind==='shotgun'?1.5:1);
    }
   }
  }
  host.dataset.playerEquipment=JSON.stringify(visible);host.dataset.itemEffects=JSON.stringify(effects.map(e=>({player:e.id,kind:e.kind,type:e.type})));host.dataset.aimItem=aim?.kind||'';
 }
 return {sync,draw,attack,setAim(angle){aimAngle=angle;},use(id,card){if(card.type!=='weapon'&&card.type!=='equip')makeEffect(id,consumableKind(card.id),'use');},active:()=>effects.length>0,dispose(){dead=true;for(const e of equipment.values())e.model.dispose();for(const e of effects)removeEffect(e);aim?.model.dispose();equipment.clear();effects.length=0;}};
}
