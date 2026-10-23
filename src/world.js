import { BOARD, CHARACTER_ART, TRACK, ROAD_EDGES, CONNECTIONS, WARP_LINKS } from './board.js';
import { routeChoices } from './game.js';

// Real X/Y/Z scene coordinates. X/Z locate a square; Y is height above the street.
export const WORLD_TRACK = TRACK;
export function createCityWorld(){
 const T=window.THREE;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const renderer=new T.WebGLRenderer({antialias:false,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x182e36,0);
 renderer.domElement.className='world-canvas';renderer.domElement.setAttribute('aria-label','高さのある建物、道路、水路で構成された立体の街');
 const scene=new T.Scene();scene.fog=new T.FogExp2(0x586a70,.006);
 const camera=new T.OrthographicCamera(-30,30,25,-25,.1,240);
 const skyLight=new T.HemisphereLight(0xb8d9dc,0x494431,2.0);scene.add(skyLight);
 const sun=new T.DirectionalLight(0xffd59c,3.0);sun.position.set(-22,36,18);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:50,bottom:-50,near:1,far:140});sun.shadow.bias=-.0006;sun.shadow.normalBias=.08;scene.add(sun);
 const materialCache=new Map(),batches=new Map(),boxGeometry=new T.BoxGeometry(1,1,1),dummy=new T.Object3D();
 const groundY=.38, animated=[], assets=[];
 function mat(color,emissive=false){const key=color+':'+emissive;if(!materialCache.has(key))materialCache.set(key,new T.MeshLambertMaterial({color,emissive:emissive?color:0,emissiveIntensity:emissive?.65:0}));return materialCache.get(key);}
 function block(x,y,z,w,h,d,color,opts={}){
  const material=mat(color,opts.glow),key=material.uuid;
  if(!batches.has(key))batches.set(key,{material,matrices:[]});
  dummy.position.set(x,y,z);dummy.scale.set(w,h,d);dummy.rotation.set(opts.rx||0,opts.ry||0,opts.rz||0);dummy.updateMatrix();batches.get(key).matrices.push(dummy.matrix.clone());
 }
 function mesh(geometry,material,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
 function cylinder(x,y,z,rt,rb,h,color,sides=8){return mesh(new T.CylinderGeometry(rt,rb,h,sides),mat(color),x,y,z);}
 function line(a,b,width,color){const A=new T.Vector3(...a),B=new T.Vector3(...b),delta=B.clone().sub(A);const m=mesh(new T.CylinderGeometry(width,width,delta.length(),5),mat(color));m.position.copy(A.add(B).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
 let randomSeed=19424;function rnd(){randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;}
 function texture(draw,w=128,h=128){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw(ctx,w,h);const tex=new T.CanvasTexture(c);tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestFilter;tex.colorSpace=T.SRGBColorSpace;assets.push(tex);return tex;}
 function wallTexture(color,cols,rows,shop=false){return texture((c,w,h)=>{
  c.fillStyle=color;c.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=5)for(let x=(y%10?0:-5);x<w;x+=12){c.fillStyle=(x+y)%3?'#00000017':'#ffe3b212';c.fillRect(x,y,11,1);c.fillRect(x,y,1,5);}
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const px=8+x*(112/cols),py=8+y*(104/rows),ww=112/cols-10,hh=104/rows-12;
   c.fillStyle='#172e33';c.fillRect(px-2,py-2,ww+4,hh+5);c.fillStyle=rnd()>.22?'#d9ad69':'#41616a';c.fillRect(px,py,ww,hh);c.fillStyle='#f7dc92';if(rnd()>.35)c.fillRect(px+1,py+1,ww-2,2);c.fillStyle='#536153';c.fillRect(px+ww/2,py,2,hh);c.fillRect(px,py+hh/2,ww,1);c.fillStyle='#b8b298';c.fillRect(px-3,py+hh+2,ww+6,2);
  }
  if(shop){c.fillStyle='#203a3c';c.fillRect(43,92,25,36);c.fillStyle='#e4bd7a';c.fillRect(46,95,19,22);c.fillStyle='#354943';c.fillRect(54,95,2,33);c.fillStyle='#c5ac7e';c.fillRect(5,122,118,4);}
 });}
 function windowGlow(cols,rows){return texture((c,w,h)=>{
  c.fillStyle='#000';c.fillRect(0,0,w,h);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if((x+y)%3!==0){const px=8+x*(112/cols),py=8+y*(104/rows),ww=112/cols-10,hh=104/rows-12;c.fillStyle='#d7a463';c.fillRect(px,py,ww,hh);c.fillStyle='#000';c.fillRect(px+ww/2,py,2,hh);c.fillRect(px,py+hh/2,ww,1);}
 });}
 function sign(x,y,z,text,bg='#294d43',fg='#ffe9aa',width=2.6,height=.6,rotation=0){
  const map=texture((c,w,h)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.strokeStyle=fg;c.lineWidth=3;c.strokeRect(2,2,w-4,h-4);c.fillStyle=fg;c.font='bold 26px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2,w-12);},192,48);
  const m=mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map,side:T.DoubleSide}),x,y,z);m.rotation.y=rotation;m.castShadow=false;return m;
 }
 function building(x,z,w,d,h,color,type='shop',name=''){
  const facade=wallTexture(color,Math.max(2,Math.round(w)),Math.max(1,Math.round(h/1.7)),type==='shop');
  const side=wallTexture(color,Math.max(2,Math.round(d)),Math.max(1,Math.round(h/1.7)));
  const frontMat=new T.MeshLambertMaterial({map:facade,emissiveMap:windowGlow(Math.max(2,Math.round(w)),Math.max(1,Math.round(h/1.7))),emissive:0xffcc88,emissiveIntensity:.9}),sideMat=new T.MeshLambertMaterial({map:side,emissiveMap:windowGlow(Math.max(2,Math.round(d)),Math.max(1,Math.round(h/1.7))),emissive:0xffcc88,emissiveIntensity:.75});
  const roof=mat(type==='tower'?'#577276':'#7a7867');
  mesh(new T.BoxGeometry(w,h,d),[sideMat,sideMat,roof,roof,frontMat,sideMat],x,groundY+h/2,z);
  block(x,groundY+.08,z,w+.35,.22,d+.35,'#a2a28c');
  block(x,groundY+h+.08,z,w+.25,.18,d+.25,'#666e62');
  for(const side of [-1,1]){block(x+side*w/2,groundY+h+.24,z,.12,.35,d+.25,'#8b8874');block(x,groundY+h+.24,z+side*d/2,w,.35,.12,'#8b8874');}
  block(x-.6,groundY+h+.36,z,.85,.5,.7,'#76877d');block(x-.6,groundY+h+.63,z,.65,.06,.5,'#445654');
  block(x+.65,groundY+h+.23,z-.5,.55,.2,.55,'#404f4b');
  if(type==='shop'){
   const awningY=groundY+1.8;block(x,awningY,z+d/2+.45,w+.2,.12,.9,'#b96d49',{rx:.12});
   for(let i=0;i<Math.floor(w/.38);i++)if(i%2===0)block(x-w/2+i*.38+.2,awningY+.07,z+d/2+.45,.25,.05,.92,'#d8cda2',{rx:.12});
   sign(x,groundY+2.35,z+d/2+.03,name||'今日の日銭','#633c32','#ffe0a1',w-.25,.62);
   block(x-w/2+.2,.98,z+d/2+.9,.12,1.2,.12,'#595c48');block(x+w/2-.2,.98,z+d/2+.9,.12,1.2,.12,'#595c48');
  }
  if(type==='tower')for(let y=2;y<h;y+=2)block(x,groundY+y,z,w+.12,.1,d+.12,'#86a6a0');
 }
 // A raised, three-dimensional island with stone embankments and a real water plane.
 block(0,-1.4,0,104,2.9,46,'#354e4c');block(0,.08,0,104,.5,46,'#8b8c6b');block(0,.35,0,102.5,.08,44.5,'#65735a');
 const turfMap=texture((c,w,h)=>{c.fillStyle='#65735a';c.fillRect(0,0,w,h);for(let i=0;i<18000;i++){c.fillStyle=['#718060','#5a6c54','#80906b','#4f6651'][i%4];c.fillRect(Math.floor(rnd()*w),Math.floor(rnd()*h),1+rnd()*2,1);}},512,512);
 const turf=mesh(new T.PlaneGeometry(102.5,44.5),new T.MeshLambertMaterial({map:turfMap}),0,.397,0);turf.rotation.x=-Math.PI/2;turf.castShadow=false;
 const waterMaterial=new T.MeshPhongMaterial({color:0x2c7379,specular:0xc9b489,shininess:45,transparent:true,opacity:.94});
 const water=mesh(new T.PlaneGeometry(260,260),waterMaterial,0,-1.0,0);water.rotation.x=-Math.PI/2;water.castShadow=false;water.receiveShadow=true;
 // Pixel-sized masonry on the embankment.
 for(let x=-52;x<53;x+=1.4)for(let y=-1.8;y<0;y+=.65){block(x,y,23.06,1.25,.54,.14,y<-.6?'#4e6460':'#78836d');block(x,y,-23.06,1.25,.54,.14,'#677c6c');}
 for(let z=-22;z<23;z+=1.4)for(let y=-1.8;y<0;y+=.65){block(-52.06,y,z,.14,.54,1.25,'#63776a');block(52.06,y,z,.14,.54,1.25,'#5b7067');}
 // Continuous street loop, actual slabs rather than image-space annotations.
 ROAD_EDGES.forEach(([a,b])=>{const [x,z]=WORLD_TRACK[a],[nx,nz]=WORLD_TRACK[b],len=Math.hypot(nx-x,nz-z),angle=Math.atan2(nx-x,nz-z);
  block((x+nx)/2,.43,(z+nz)/2,4.5,.16,len+1.25,'#a3a38a',{ry:angle});
  block((x+nx)/2,.53,(z+nz)/2,3.8,.08,len+1.3,'#454f4c',{ry:angle});
 });
 block(-2,.42,0,2.8,.12,19,'#505a52');block(3,.42,3,25,.12,2.4,'#535d51');
 // Slum: uneven tin shacks, tents, junk and a barrel fire.
 building(-11,-5,3.8,3.3,2.7,'#776f51','shack');building(-6.5,-6,3.2,3.2,3.8,'#686c4f','shack');
 for(const [x,z,w] of [[-11,-5,4.2],[-6.5,-6,3.6]])for(let i=0;i<14;i++)block(x-w/2+i*w/14,groundY+(x===-11?2.7:3.8)+.4,z,.14,.16,3.9,i%3?'#667673':'#a78a62',{rx:.06});
 function tent(x,z,color){const g=new T.CylinderGeometry(1.55,1.55,2.6,3,1);const roof=mesh(g,mat(color),x,1.15,z);roof.rotation.z=Math.PI/2;roof.rotation.y=Math.PI/2;block(x,.52,z,2.8,.12,2.4,'#a5946e');block(x,.93,z+1.31,.8,.9,.04,'#243e40');line([x-1.8,.5,z+1.8],[x,2.5,z],.025,'#d9c8a0');}
 tent(-11,4,'#416773');tent(-7.4,5.9,'#477b7a');tent(-12.1,-.1,'#5c7773');
 for(let i=0;i<26;i++){const x=-14+rnd()*8,z=-2+rnd()*10;block(x,.58,z,.22+rnd()*.25,.15+rnd()*.3,.25,['#8d8261','#9ca48c','#506b65'][i%3],{ry:rnd()*3});}
 for(const [x,z] of [[-5.7,7],[-5.1,6.5],[-13,6.8]]){block(x,.85,z,.8,.9,.7,'#a28d60');block(x,.88,z+.36,.07,.7,.02,'#6e674c');}
 cylinder(-8.8,1.05,1.4,.45,.45,1.2,'#765641');cylinder(-8.8,1.65,1.4,.43,.43,.08,'#e9a04f');
 const flame=mesh(new T.ConeGeometry(.36,1.1,5),new T.MeshBasicMaterial({color:0xffc45b}),-8.8,2.13,1.4);animated.push({kind:'fire',object:flame});
 const firelight=new T.PointLight(0xffa33e,8,8,1.5);firelight.position.set(-8.8,2.4,1.4);scene.add(firelight);
 const smokeTexture=texture((c,w,h)=>{c.fillStyle='#c4c1a970';for(let i=0;i<15;i++){const sz=10+rnd()*15;c.fillRect(20+rnd()*50,20+rnd()*50,sz,sz);}},96,96);
 for(let i=0;i<5;i++){const sp=new T.Sprite(new T.SpriteMaterial({map:smokeTexture,transparent:true,opacity:.4,depthWrite:false}));sp.position.set(-8.8,3+i*.7,1.4);sp.scale.setScalar(1.3+i*.13);scene.add(sp);animated.push({kind:'smoke',object:sp,offset:i*.8});}
 // Dense central shopping streets: warm shop windows, patched roofs, AC units.
 building(-1.8,-5.2,3.4,3,4.3,'#8d765d','shop','善意食堂');
 building(2.5,-5.2,3.3,3.2,5.3,'#92765d','shop','保証なし');
 building(-1.1,1,3,2.8,3.6,'#938167','shop','日雇い');
 building(3.1,1,3.5,2.8,4.8,'#6d7c72','shop','ゲーム');
 building(2.2,6.6,4.2,2.9,2.5,'#8d9781','shop','コンビニ');
 building(8.1,-5.5,4.0,3.2,7.0,'#6e8b8c','tower');
 building(12.3,-5.6,2.5,3.1,9.2,'#4a717b','tower');
 building(10.1,-.2,4.2,3.0,5.5,'#b8ab89','tower');
 sign(8.1,5,-3.86,'再開発','#284b57','#d3deb0',3,.7);
 // Fountain park, sidewalks and carefully clipped trees in the rich district.
 block(10,.55,6.1,5.5,.22,4.5,'#aab09a');block(10,.69,6.1,4.9,.1,3.9,'#5e8159');
 cylinder(10,.88,6.1,1.15,1.3,.35,'#b0b3a0',12);cylinder(10,1.08,6.1,1.02,1.02,.12,'#57a6a6',12);cylinder(10,1.6,6.1,.13,.22,1.1,'#b9c3ac');cylinder(10,2.12,6.1,.6,.35,.18,'#c8c7ab',10);
 for(let i=0;i<6;i++){const angle=i*Math.PI/3;const sp=mesh(new T.SphereGeometry(.07,4,4),new T.MeshBasicMaterial({color:0xa2e0d1}),10+Math.cos(angle)*.48,1.5,6.1+Math.sin(angle)*.48);animated.push({kind:'waterdrop',object:sp,offset:i});}
 function tree(x,z,scale=1){block(x,.4+scale*.9,z,.25,scale*1.8,.25,'#6d6750');for(let i=0;i<8;i++){const angle=i*2.4,rad=i<3?.3:.7;block(x+Math.sin(angle)*rad*scale,.5+scale*(1.8+rnd()*.8),z+Math.cos(angle)*rad*scale,scale*(.9+rnd()*.5),scale*(.8+rnd()*.6),scale*(.9+rnd()*.4),['#335e4d','#487854','#5c8c60','#79966a'][i%4]);}}
 for(const [x,z,scale] of [[-20,12,1.3],[-20,-12,1.6],[19,12,1.2],[19,-11,1.4],[-19,8,.8],[-19,-8,1],[-14,-14,1.2],[-8,-14,1.0],[0,-14,1.4],[6,-14,1.2],[18,-6,.8],[19,1,.9],[13,7,.65],[7,7,.65],[12,4,.6],[7,4,.6],[-4,7,.7],[-5,-2,.7]])tree(x,z,scale);
 // Lamps have height, cast light, and throw shadows onto the road.
 for(const [x,z] of [[-14,8],[-15,-6],[-4,13],[6,13],[18,6],[18,-6],[3,-13],[-11,-12]]){
  block(x,2.15,z,.10,3.4,.10,'#3e5049');block(x+.28,3.8,z,.65,.10,.1,'#3e5049');block(x+.55,3.68,z,.3,.22,.3,'#ffce76',{glow:true});
  const pool=mesh(new T.CircleGeometry(1.2,16),new T.MeshBasicMaterial({color:0xffd17b,transparent:true,opacity:.09,depthWrite:false}),x+.55,.61,z);pool.rotation.x=-Math.PI/2;pool.castShadow=false;
 }
 // Vending machines, benches, fences, drains and roadside weeds.
 for(const [x,z,color] of [[-4,4,'#9b4d39'],[-3.3,4,'#4c8580'],[5.3,-2.5,'#b6b69a']]){block(x,1.15,z,.6,1.5,.6,color);block(x,1.4,z+.31,.43,.63,.03,'#b2d0b4',{glow:true});block(x,.8,z+.32,.35,.15,.03,'#243b3c');}
 for(const [x,z] of [[8,8.5],[12,8.5],[-14,2]]){block(x,.9,z,1.5,.15,.5,'#9c8e65');block(x,1.3,z-.24,1.5,.55,.08,'#847a55');block(x-.5,.66,z,.1,.5,.4,'#3e5045');block(x+.5,.66,z,.1,.5,.4,'#3e5045');}
 for(let x=-20;x<21;x+=2){block(x,.98,15.6,.1,1.1,.1,'#657664');block(x,1.34,15.6,2,.08,.08,'#8b8d70');}
 for(let i=0;i<120;i++){const x=-21+rnd()*42,z=rnd()>.5?-15.3:14.2;block(x,.55+rnd()*.12,z,.12,.22,.15,['#739367','#53765b','#97a475'][i%3]);}
 // Pedestrian bridge and distant elevated rail establish separate height planes.
 block(-7,-.05,22,5,.4,12,'#6f8177');for(const x of [-9.3,-4.7]){block(x,.5,22,.12,1.0,12,'#5d776c');block(x,1.05,22,.18,.10,12,'#a2ad8c');}
 for(let x=-40;x<42;x+=7){block(x,1.6,-25,1,6,1.3,'#6b8178');block(x,4.7,-25,7.2,.65,3.2,'#849287');}
 for(const z of [-24.5,-25.6])block(0,5.1,z,86,.08,.08,'#b4b39b');
 const train=new T.Group();for(let i=0;i<3;i++){const carriage=new T.Mesh(new T.BoxGeometry(4.3,1.2,1.5),mat('#b9c5aa'));carriage.position.set(i*4.7,0,0);train.add(carriage);for(let j=0;j<5;j++){const win=new T.Mesh(new T.BoxGeometry(.45,.45,.03),mat('#f4d48a',true));win.position.set(i*4.7-1.6+j*.78,.15,.77);train.add(win);}}train.position.set(-20,5.9,-25);scene.add(train);animated.push({kind:'train',object:train});
 for(let i=0;i<25;i++){const x=-52+i*4.3,z=-39-rnd()*10,h=4+rnd()*13;building(x,z,2.6+rnd()*2,3,h,['#68838a','#728c8e','#5c7985'][i%3],'tower');}
 const rippleMaterial=new T.MeshBasicMaterial({color:0xd7c993,transparent:true,opacity:.20,depthWrite:false});
 const ripple=new T.InstancedMesh(new T.PlaneGeometry(1,1),rippleMaterial,70);for(let i=0;i<70;i++){dummy.position.set(-35+rnd()*70,-.94,18+rnd()*35);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(.3+rnd()*1.3,.06+rnd()*.08,1);dummy.updateMatrix();ripple.setMatrixAt(i,dummy.matrix);}scene.add(ripple);animated.push({kind:'ripple',object:ripple});
 // New river district: patched housing, scrapyard, allotments and a cargo quay.
 building(-30,2,5.8,4.3,3.2,'#767b61','shack');building(-35,4,3.2,3.3,2.6,'#807859','shack');
 building(-24,3,4.1,4,4.5,'#738275','shop','空缶銀行');
 building(-32,9,3.2,2.8,2.3,'#8a7d60','shop','寝床相談');
 sign(-30,3.7,4.2,'資源回収','#374d43','#ead49c',4,.8);
 tent(-25,-2,'#527f7b');tent(-35,-2,'#3c6672');tent(-18,18,'#708478');
 for(let i=0;i<18;i++){const x=-32+rnd()*7,z=5+rnd()*2;block(x,.7+rnd()*.4,z,.55,.7,.55,['#8b8d73','#b4a17b','#557b77'][i%3],{ry:rnd()*2});}
 for(const z of [18.4,20.0]){block(-34,.52,z,9,.22,.9,'#827a4f');for(let x=-38;x<-30;x+=.7)block(x,.78,z,.3,.4,.35,'#7c995c');}
 for(const x of [-47,-43]){block(x,.85,17,3,1.1,5,'#526e6d');for(let z=15;z<20;z+=.6)block(x,1.46,z,3.05,.08,.1,'#94a69a');}
 // Night market: warm lanterns, neon signs, apartments and an unfriendly hotel.
 building(29,-2,4.1,4,7.2,'#7e7471','shop','裏口酒場');building(35,1,4.2,3.8,8.1,'#657e80','tower');
 building(28,5,4.4,3.5,4.2,'#9c8067','shop','現金のみ');building(34,8,4,3.1,5.8,'#807a65','shop','闇市');
 building(23,2,3.2,3.2,3.3,'#7c8d7a','shop','日雇い');
 sign(35,6,2.94,'HOTEL','#603e49','#e4b393',3,.9);
 for(const x of [25,28,31,34,37]){line([x,3.4,11],[x+3,3.4,11],.025,'#494f44');cylinder(x,3.1,11,.22,.22,.5,'#e6b56e');}
 for(const [x,z] of [[-46,-10],[-46,7],[-38,-14],[-29,-14],[-20,21],[-10,21],[23,-13],[34,-14],[47,-8],[47,5],[44,17],[32,20],[21,19]])tree(x,z,1.1+rnd()*.7);
 for(const [x,z] of [[-28,-5],[-41,7],[-25,14],[26,-6],[41,3],[37,17]]){
  block(x,2.3,z,.12,3.8,.12,'#42554e');block(x+.3,4.2,z,.75,.12,.12,'#42554e');block(x+.6,4.05,z,.4,.23,.4,'#ffd18a',{glow:true});
 }
 // Tall fingerposts make actual junctions legible in the world.
 for(const i of [3,7,10,20]){const [x,z]=WORLD_TRACK[i];block(x-1.8,1.55,z,.13,2.4,.13,'#625e48');sign(x-1.8,2.7,z,'分岐 ↔','#465b43','#ffe1a2',1.8,.5);}
 // Flush static colored geometry into a small number of GPU instance batches.
 for(const {material,matrices} of batches.values()){const inst=new T.InstancedMesh(boxGeometry,material,matrices.length);matrices.forEach((m,i)=>inst.setMatrixAt(i,m));inst.castShadow=true;inst.receiveShadow=true;scene.add(inst);}
 const tiles=WORLD_TRACK.map(([x,z],i)=>{
  const material=new T.MeshLambertMaterial({color:BOARD[i].color,emissive:BOARD[i].color,emissiveIntensity:.03});
  const isHole=BOARD[i].type==='manhole';
  const m=mesh(isHole?new T.CylinderGeometry(.95,.95,.22,24):new T.BoxGeometry(1.55,.22,1.55),material,x,.73,z);m.userData.square=i;
  if(isHole){const rim=mesh(new T.TorusGeometry(1.05,.06,6,28),new T.MeshBasicMaterial({color:0x8be6d8}),x,.86,z);rim.rotation.x=-Math.PI/2;rim.castShadow=false;}
  const top=texture((c,w,h)=>{c.fillStyle='#203b32';c.fillRect(0,0,w,h);c.strokeStyle=BOARD[i].color;c.lineWidth=4;c.strokeRect(2,2,w-4,h-4);c.fillStyle='#f5e5b9';c.font='bold 25px monospace';c.textAlign='center';c.textBaseline='middle';if(isHole){c.strokeStyle='#95c9bb';c.lineWidth=3;for(let y=10;y<45;y+=8){c.beginPath();c.moveTo(7,y);c.lineTo(41,y);c.stroke();}c.fillStyle='#203b32';c.fillRect(15,15,19,20);c.fillStyle='#b1f1db';c.fillText(i===2||i===40?'A':'B',w/2,h/2);}else c.fillText(i===0?'GO':CONNECTIONS[i].length>2?'↔':String(i+1).padStart(2,'0'),w/2,h/2);},48,48);
  const cap=mesh(new T.PlaneGeometry(1.47,1.47),new T.MeshBasicMaterial({map:top}),x,.847,z);cap.rotation.x=-Math.PI/2;cap.castShadow=false;
  return m;
 });
 const player=new T.Sprite(new T.SpriteMaterial({transparent:true,alphaTest:.15,depthWrite:true,depthTest:true}));player.center.set(.5,.16);player.scale.set(5,5,1);scene.add(player);
 const ring=mesh(new T.RingGeometry(.9,1.08,32),new T.MeshBasicMaterial({color:0xffdf91,side:T.DoubleSide}),0,.9,0);ring.rotation.x=-Math.PI/2;ring.castShadow=false;
 const characterMaps={};let role='';
 const cameraState={yaw:.55,pitch:.71,zoom:1,target:new T.Vector3(0,0,0)};
 let host,overlay,state,frame,viewWidth=1,viewHeight=1,flight=null,lastTime=0,paused=false,presentationPaused=false,dead=false,dirty=true,lastChoiceKey='';
 const raycaster=new T.Raycaster(),pointer=new T.Vector2();
 function syncCamera(){
  dirty=true;if(!host)return;const rect=host.getBoundingClientRect();viewWidth=Math.max(1,rect.width);viewHeight=Math.max(1,rect.height);
  const aspect=viewWidth/viewHeight,span=(viewWidth<700?34/aspect:Math.max(40,57/aspect))/cameraState.zoom;
  camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span*.44;camera.bottom=-span*.56;camera.updateProjectionMatrix();
  const p=cameraState.pitch,y=cameraState.yaw,t=cameraState.target;camera.position.set(t.x+Math.sin(y)*70*Math.cos(p),t.y+Math.sin(p)*70,t.z+Math.cos(y)*70*Math.cos(p));camera.lookAt(t);camera.updateMatrixWorld();
  const res=Math.min(1,1150/viewWidth);renderer.setSize(Math.round(viewWidth*res),Math.round(viewHeight*res),false);renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';
  host.dataset.overview=String(cameraState.zoom<.5);host.dataset.yaw=cameraState.yaw.toFixed(3);host.dataset.pitch=cameraState.pitch.toFixed(3);host.dataset.worldStatus='ready';
 }
 function project(x,y,z){const p=new T.Vector3(x,y,z).project(camera);return {x:(p.x+1)*viewWidth/2,y:(1-p.y)*viewHeight/2,visible:p.z>-1&&p.z<1};}
 function frameChoice(){
  const key=state?.turn==='choose'?`${state.seed}:${state.rollCount}:${state.position}:${state.remaining}`:'';
  if(!key||key===lastChoiceKey)return;lastChoiceKey=key;cameraState.zoom=1;
  fitPoints([state.position,...routeChoices(state).map(r=>r.target)]);
 }
 function fitPoints(indices){
  const points=indices.map(i=>WORLD_TRACK[i]);cameraState.target.set(points.reduce((a,p)=>a+p[0],0)/points.length,0,points.reduce((a,p)=>a+p[1],0)/points.length);syncCamera();
  let projected=points.map(p=>project(p[0],1,p[1]));
  const minX=Math.min(...projected.map(p=>p.x)),maxX=Math.max(...projected.map(p=>p.x)),minY=Math.min(...projected.map(p=>p.y)),maxY=Math.max(...projected.map(p=>p.y));
  const dockTop=document.querySelector('.command-dock')?.getBoundingClientRect().top||viewHeight*.7;
  const factor=Math.min(1,(viewWidth-110)/Math.max(1,maxX-minX),Math.max(100,dockTop-260)/Math.max(1,maxY-minY));cameraState.zoom=Math.max(.18,cameraState.zoom*factor);syncCamera();
  projected=points.map(p=>project(p[0],1,p[1]));
  const middleX=(Math.min(...projected.map(p=>p.x))+Math.max(...projected.map(p=>p.x)))/2,middleY=(Math.min(...projected.map(p=>p.y))+Math.max(...projected.map(p=>p.y)))/2;
  const scale=viewHeight/(camera.top-camera.bottom),dx=(middleX-viewWidth/2)/scale,dy=(middleY-(200+dockTop-65)/2)/scale/Math.sin(cameraState.pitch);
  cameraState.target.x+=Math.cos(cameraState.yaw)*dx+Math.sin(cameraState.yaw)*dy;cameraState.target.z+=-Math.sin(cameraState.yaw)*dx+Math.cos(cameraState.yaw)*dy;syncCamera();
 }
 function labels(){if(!overlay)return;overlay.querySelectorAll('[data-tile]').forEach(el=>{const i=Number(el.dataset.tile),[x,z]=WORLD_TRACK[i],p=project(x,1.04,z);el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.visibility=p.visible?'visible':'hidden';});const you=overlay.querySelector('.world-player-label');if(you){const p=project(player.position.x,player.position.y+3.4,player.position.z);you.style.left=p.x+'px';you.style.top=p.y+'px';}}
 function draw(now=0){if(dead)return;frame=requestAnimationFrame(draw);if(paused||presentationPaused||document.hidden||now-lastTime<32||(reduced&&!dirty&&!flight))return;lastTime=now;dirty=false;
  const time=reduced?0:now/1000;
  if(flight?.kind==='warp'){const f=Math.min(1,(now-flight.start)/900),p=f<.5?flight.from:flight.to,scale=Math.abs(f*2-1);if(f>=.5&&!flight.switched){flight.switched=true;cameraState.target.set(p[0],0,p[1]);syncCamera();}player.position.set(p[0],1-(1-scale)*1.6,p[1]);player.scale.set(5*scale,5*scale,1);player.material.opacity=scale;ring.material.color.set('#92ead5');if(f>=1){player.scale.set(5,5,1);player.material.opacity=1;ring.material.color.set('#ffdf91');const resolve=flight.resolve;flight=null;resolve();}}
  else if(flight){const elapsed=Math.min(1,(now-flight.start)/flight.duration),segment=elapsed*(flight.points.length-1),index=Math.min(flight.points.length-2,Math.floor(segment)),f=segment-index,a=flight.points[index],b=flight.points[index+1];player.position.set(a[0]+(b[0]-a[0])*f,1+Math.sin(f*Math.PI)*.2,a[1]+(b[1]-a[1])*f);if(elapsed>=1){const resolve=flight.resolve;flight=null;resolve();}}
  ring.position.set(player.position.x,.9,player.position.z);
  if(!reduced)for(const a of animated){const o=a.object;if(a.kind==='fire'){o.scale.setScalar(.94+Math.sin(time*7)*.08);firelight.intensity=7.5+Math.sin(time*11);}
   else if(a.kind==='smoke'){const f=(time*.45+a.offset)%4;o.position.y=2+f;o.position.x=-8.8+f*.16;o.material.opacity=(1-f/4)*.38;}
   else if(a.kind==='waterdrop')o.position.y=1.3+Math.abs(Math.sin(time*2+a.offset))*.65;
   else if(a.kind==='train')o.position.x=(time*1.3)%90-45;
   else if(a.kind==='ripple')o.position.x=Math.sin(time*.25)*.2;
  }
  renderer.render(scene,camera);if(host){host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);host.dataset.playerPosition=[player.position.x,player.position.y,player.position.z].map(v=>v.toFixed(2)).join(',');}labels();
 }
 function attachEvents(){
  const canvas=renderer.domElement;let dragging=null,travelled=false;const fingers=new Map();
  canvas.onpointerdown=e=>{canvas.setPointerCapture(e.pointerId);fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});dragging={x:e.clientX,y:e.clientY};travelled=false;};
  canvas.onpointermove=e=>{if(!fingers.has(e.pointerId))return;const old=fingers.get(e.pointerId);fingers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(fingers.size===2){const other=[...fingers.entries()].find(([id])=>id!==e.pointerId)[1];const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);cameraState.zoom=Math.max(.3,Math.min(1.8,cameraState.zoom*after/Math.max(before,1)));travelled=true;syncCamera();return;}
   if(!dragging)return;const dx=e.clientX-dragging.x,dy=e.clientY-dragging.y;if(Math.abs(dx)+Math.abs(dy)>2){cameraState.yaw-=dx*.006;cameraState.pitch=Math.max(.42,Math.min(1.15,cameraState.pitch+dy*.004));travelled=true;dragging={x:e.clientX,y:e.clientY};syncCamera();}};
  canvas.onpointerup=e=>{fingers.delete(e.pointerId);if(!travelled){const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(tiles)[0];if(hit)overlay.querySelector(`[data-tile="${hit.object.userData.square}"]`)?.click();}dragging=null;};
  canvas.onpointercancel=e=>{fingers.delete(e.pointerId);dragging=null;};
  canvas.onwheel=e=>{e.preventDefault();cameraState.zoom=Math.max(.3,Math.min(1.8,cameraState.zoom*(e.deltaY>0?.92:1.08)));syncCamera();};
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;host.dataset.worldStatus='lost';host.querySelector('.world-context-note')?.remove();const note=document.createElement('p');note.className='world-context-note';note.textContent='立体表示を再接続しています…';host.append(note);});
  canvas.addEventListener('webglcontextrestored',()=>{paused=false;host.querySelector('.world-context-note')?.remove();syncCamera();});
 }
 attachEvents();frame=requestAnimationFrame(draw);
 return {
  mount(node,next){host=node;overlay=node.querySelector('.world-labels');node.prepend(renderer.domElement);this.update(next);syncCamera();frameChoice();labels();},
  update(next){dirty=true;state=next;const [x,z]=WORLD_TRACK[state.position];if(!flight)player.position.set(x,1,z);
   if(role!==state.role){role=state.role;if(!characterMaps[role]){characterMaps[role]=new T.TextureLoader().load(CHARACTER_ART[role],()=>{dirty=true;if(host)host.dataset.characterLoaded='true';});characterMaps[role].colorSpace=T.SRGBColorSpace;characterMaps[role].magFilter=T.NearestFilter;characterMaps[role].minFilter=T.NearestFilter;}player.material.map=characterMaps[role];player.material.needsUpdate=true;}
   const destinations=routeChoices(state).map(r=>r.target);
   tiles.forEach((tile,i)=>{tile.material.color.set(destinations.includes(i)?'#f4d487':i===state.position?'#daba78':BOARD[i].color);tile.material.emissiveIntensity=destinations.includes(i)?.6:.03;});
   const night=state.actions===1||state.phase!=='playing';sun.intensity=night?1.15:3;skyLight.intensity=night?1.25:2;scene.fog.color.set(night?0x344e5b:0x697d7a);renderer.domElement.dataset.light=night?'night':'dusk';
  },
  pauseAnimation(value){presentationPaused=value;dirty=true;},
  resize(){syncCamera();},
  zoom(value){cameraState.zoom=value;syncCamera();},
  rotate(direction){cameraState.yaw+=direction*Math.PI/8;syncCamera();labels();},
  center(index=state.position){const [x,z]=WORLD_TRACK[index];cameraState.target.set(x,0,z);cameraState.zoom=1;cameraState.yaw=.55;cameraState.pitch=.71;syncCamera();labels();},
  overview(){cameraState.yaw=.35;cameraState.pitch=.92;cameraState.zoom=1;fitPoints(BOARD.map(t=>t.index));labels();},
  async teleport(from,to){if(flight){flight.resolve();flight=null;}if(reduced){const [x,z]=WORLD_TRACK[to];player.position.set(x,1,z);dirty=true;return;}await new Promise(resolve=>{flight={kind:'warp',from:WORLD_TRACK[from],to:WORLD_TRACK[to],start:performance.now(),resolve};});},
  async walk(indices){if(flight){flight.resolve();flight=null;}if(reduced){const [x,z]=WORLD_TRACK[indices.at(-1)];player.position.set(x,1,z);dirty=true;return;}await new Promise(resolve=>{flight={points:indices.map(i=>WORLD_TRACK[i]),start:performance.now(),duration:(indices.length-1)*220,resolve};});},
  inspect(index){const p=project(...[WORLD_TRACK[index][0],1,WORLD_TRACK[index][1]]);return p;},
  diagnostics(){return {camera:{yaw:cameraState.yaw,pitch:cameraState.pitch,zoom:cameraState.zoom},meshes:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,worldTrack:WORLD_TRACK,player:[player.position.x,player.position.y,player.position.z]};},
  dispose(){dead=true;cancelAnimationFrame(frame);flight?.resolve();scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});for(const tex of [...assets,...Object.values(characterMaps)])tex.dispose();renderer.dispose();}
 };
}
