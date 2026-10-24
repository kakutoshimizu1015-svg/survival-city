import { createPlayerItems } from './player-items.js';
import { createNpcModel, NPC_KEYS } from './npc-models.js';
import { buildCityBackdrop } from './city-backdrop.js';
import { CITY_BOARD, cityDistrictAt } from './city-board-map.js';
import { buildDistrictScenery } from './city-scenery.js';
// Presentation only: the original store remains the sole source of game rules.
export const DISTRICTS={slum:{name:'スラム街',color:'#aa8665',ground:'#675f4e'},commercial:{name:'商業地区',color:'#df9c54',ground:'#907956'},luxury:{name:'高級住宅街',color:'#b3d7c0',ground:'#7b9876'}};
export function createOriginalWorld(host,map){
 const isCityBoard=map[0]?.boardLayout===CITY_BOARD.id;
 const T=window.THREE,reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const renderer=new T.WebGLRenderer({antialias:false,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 renderer.domElement.className='original-world-canvas';host.prepend(renderer.domElement);
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-60,60,40,-40,.1,500);
 scene.fog=new T.FogExp2(0x647c79,.0035);
 const skyLight=new T.HemisphereLight(0xc5e2e0,0x51472f,2.1);scene.add(skyLight);
 const sun=new T.DirectionalLight(0xffd7a1,3);sun.position.set(-35,80,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-110,right:110,top:85,bottom:-85,near:1,far:240});sun.shadow.bias=-.0008;scene.add(sun);
 const materialCache=new Map(),batches=new Map(),boxGeometry=new T.BoxGeometry(1,1,1),dummy=new T.Object3D();
 const groundY=.38, animated=[], assets=[], nightEffects=[], windowMaterials=[];let raised=false;
 const elevation=(x,z=0)=>!isCityBoard?groundY:groundY+1.2*Math.max(0,Math.min(1,(x+24)/12))+1.6*Math.max(0,Math.min(1,(x-12)/12));
 const offset=(x,z)=>raised?elevation(x,z)-groundY:0;
 function mat(color,emissive=false){const key=color+':'+emissive;if(!materialCache.has(key))materialCache.set(key,new T.MeshLambertMaterial({color,emissive:emissive?color:0,emissiveIntensity:emissive?.65:0}));return materialCache.get(key);}
 function block(x,y,z,w,h,d,color,opts={}){
  const material=mat(color,opts.glow),key=material.uuid;
  if(!batches.has(key))batches.set(key,{material,matrices:[]});
  dummy.position.set(x,y+(opts.absolute?0:offset(x,z)),z);dummy.scale.set(w,h,d);dummy.rotation.set(opts.rx||0,opts.ry||0,opts.rz||0);dummy.updateMatrix();batches.get(key).matrices.push(dummy.matrix.clone());
 }
 function mesh(geometry,material,x=0,y=0,z=0,absolute=false){const m=new T.Mesh(geometry,material);m.position.set(x,y+(absolute?0:offset(x,z)),z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
 function cylinder(x,y,z,rt,rb,h,color,sides=8){return mesh(new T.CylinderGeometry(rt,rb,h,sides),mat(color),x,y,z);}
 function line(a,b,width,color){const A=new T.Vector3(a[0],a[1]+offset(a[0],a[2]),a[2]),B=new T.Vector3(b[0],b[1]+offset(b[0],b[2]),b[2]),delta=B.clone().sub(A);const m=mesh(new T.CylinderGeometry(width,width,delta.length(),5),mat(color),0,0,0,true);m.position.copy(A.add(B).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
 let randomSeed=19424;function rnd(){randomSeed=(Math.imul(randomSeed,1664525)+1013904223)>>>0;return randomSeed/4294967296;}
 function texture(draw,w=128,h=128){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');draw(ctx,w,h);const tex=new T.CanvasTexture(c);tex.magFilter=T.NearestFilter;tex.minFilter=T.NearestFilter;tex.colorSpace=T.SRGBColorSpace;assets.push(tex);return tex;}
 // Low-cost pools of light retain the pixel/low-poly look without full-screen bloom.
 const glowMap=texture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,.85)');g.addColorStop(.4,'rgba(255,255,255,.4)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h);},64,64);
 function nightGlow(x,z,color,radius=4,kind='window'){
  if(kind==='fire'){const light=new T.PointLight(color,9,10,1.4);light.position.set(x,elevation(x,z)+1.6,z);light.visible=false;scene.add(light);nightEffects.push({object:light,kind:'firelight'});}
  const m=mesh(new T.PlaneGeometry(radius*2,radius*2),new T.MeshBasicMaterial({map:glowMap,color,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}),x,elevation(x,z)+.08,z,true);m.rotation.x=-Math.PI/2;m.castShadow=false;m.receiveShadow=false;m.visible=false;nightEffects.push({object:m,kind});return m;
 }
 function nightStrip(x,y,z,w,color){const m=mesh(new T.BoxGeometry(w,.12,.12),new T.MeshBasicMaterial({color}),x,y,z);m.visible=false;nightEffects.push({object:m,kind:'neon'});return m;}
 function updateNight(){
  const night=!!state.isNight;sun.intensity=night?.65:3;sun.color.set(night?'#9eb6ed':'#ffd7a1');skyLight.intensity=night?.65:2.1;scene.fog.color.set(night?0x263b53:0x647c79);
  for(const m of windowMaterials)m.emissiveIntensity=night?2.4:.18;
  for(const e of nightEffects){e.object.visible=night;if(e.object.material?.transparent)e.object.material.opacity=e.kind==='fire'?.68:.5;}
  host.dataset.nightLighting=JSON.stringify({active:night,windows:windowMaterials.length,fire:nightEffects.filter(e=>e.kind==='fire').length,neon:nightEffects.filter(e=>e.kind==='neon').length});
 }
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
  windowMaterials.push(frontMat,sideMat);nightGlow(x,z+d/2+1.7,'#ffc477',Math.min(4,w*.65));
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
 const minCol=Math.min(...map.map(t=>t.col)),maxCol=Math.max(...map.map(t=>t.col)),minRow=Math.min(...map.map(t=>t.row)),maxRow=Math.max(...map.map(t=>t.row));
 const midCol=(minCol+maxCol)/2,midRow=(minRow+maxRow)/2,step=isCityBoard?CITY_BOARD.spacing:4;
 const worldPoint=(col,row)=>[(col-midCol)*step,(row-midRow)*step];
 const squares=new Map(map.map(t=>[t.id,{...t,x:worldPoint(t.col,t.row)[0],z:worldPoint(t.col,t.row)[1]}]));
 const width=(maxCol-minCol)*step+24,depth=(maxRow-minRow)*step+(isCityBoard?32:24);
 const edges=[];const seen=new Set();for(const t of map)for(const next of t.next){const key=[t.id,next].sort((a,b)=>a-b).join(':');if(squares.has(next)&&!seen.has(key)){seen.add(key);edges.push([squares.get(t.id),squares.get(next)]);}}
 const nearest=(x,z)=>{let best=Infinity,result;for(const t of squares.values()){const d=(t.x-x)**2+(t.z-z)**2;if(d<best){best=d;result=t;}}return result;};
 const districtAt=(x,z)=>isCityBoard?cityDistrictAt(x/step+midCol-1,z/step+midRow-1):nearest(x,z).area;
 function roadDistance(x,z){let result=Infinity;for(const [a,b] of edges){const dx=b.x-a.x,dz=b.z-a.z,f=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));result=Math.min(result,Math.hypot(x-a.x-dx*f,z-a.z-dz*f));}return result;}
 block(0,-1.4,0,width,2.9,depth,'#354e4c');
 const terrain=texture((c,w,h)=>{for(let y=0;y<h;y+=4)for(let x=0;x<w;x+=4){const area=districtAt((x/w-.5)*width,(y/h-.5)*depth);c.fillStyle=DISTRICTS[area]?.ground||'#6b7c60';c.fillRect(x,y,4,4);c.fillStyle=['#00000008','#fff5d716','#0000000d'][Math.floor(rnd()*3)];c.fillRect(x,y,3,1);}},512,256);
 const groundGeo=new T.PlaneGeometry(width,depth,isCityBoard?100:1,1);groundGeo.rotateX(-Math.PI/2);const vertices=groundGeo.attributes.position;for(let i=0;i<vertices.count;i++)vertices.setY(i,elevation(vertices.getX(i),vertices.getZ(i)));groundGeo.computeVertexNormals();mesh(groundGeo,new T.MeshLambertMaterial({map:terrain}),0,0,0);
 const water=mesh(new T.PlaneGeometry(600,600),new T.MeshPhongMaterial({color:0x356f77,shininess:35,specular:0xbaa982}),0,-1,0);water.rotation.x=-Math.PI/2;
 // Retaining walls make the three terraces visible at the waterfront.
 for(let x=-width/2;x<width/2;x+=1.6)for(const z of [-depth/2,depth/2]){const top=elevation(x);block(x,(top-2.6)/2,z,1.6,top+2.6,.4,'#6b7c69');for(let y=-1.7;y<top;y+=.65)block(x,y,z+Math.sign(z)*.23,1.4,.48,.12,'#92a18a');}
 for(let z=-depth/2;z<depth/2;z+=1.6)for(const x of [-width/2,width/2]){const top=elevation(x);block(x,(top-2.6)/2,z,.4,top+2.6,1.6,'#6b7c69');for(let y=-1.7;y<top;y+=.65)block(x+Math.sign(x)*.23,y,z,.12,.48,1.4,'#92a18a');}
 raised=true;
 function ribbon(a,b,roadWidth,color,lift){const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz),nx=dz/len*roadWidth/2,nz=-dx/len*roadWidth/2;const v=[];for(const [p,side] of [[a,-1],[a,1],[b,-1],[b,1]])v.push(p.x+nx*side,elevation(p.x)+lift,p.z+nz*side);const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex([0,1,2,1,3,2]);g.computeVertexNormals();const m=mesh(g,new T.MeshLambertMaterial({color,side:T.DoubleSide}),0,0,0,true);m.castShadow=false;}
 for(const [a,b] of edges){const len=Math.hypot(b.x-a.x,b.z-a.z),ry=Math.atan2(b.x-a.x,b.z-a.z),lane=a.lane||b.lane,roadWidth=isCityBoard?(lane==='alley'?3.0:lane==='camp'?3.6:lane==='park'?4.2:5.5):3.1;const luxury=a.area==='luxury'&&b.area==='luxury';ribbon(a,b,roadWidth,luxury?'#e1d4b4':'#a99d7e',.12);ribbon(a,b,roadWidth-.65,luxury?'#a5b4ac':a.area==='slum'&&b.area==='slum'?'#81765b':'#596e68',.18);
  if(!b.next.includes(a.id)){const dx=(b.x-a.x)/len,dz=(b.z-a.z)/len,mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;for(const side of [-1,1])line([mx-dx*.6+dz*.5*side,.64,mz-dz*.6-dx*.5*side],[mx+dx*.35,.64,mz+dz*.35],.075,'#e5d49b');}
  if(isCityBoard&&luxury){for(let f=.2;f<.9;f+=.15){const x=a.x+(b.x-a.x)*f,z=a.z+(b.z-a.z)*f;block(x,.59,z,roadWidth-.7,.035,.055,'#d9d6bb',{ry});}}
 }
 function tree(x,z,scale=1,formal=false){block(x,.4+scale*.9,z,.25,scale*1.8,.25,'#6d6750');if(formal){block(x,2*scale,z,scale*1.4,scale*2,scale*1.4,'#315d48');block(x,3*scale,z,scale,scale,scale,'#507f5e');return;}for(let i=0;i<8;i++){const angle=i*2.4,rad=i<3?.3:.7;block(x+Math.sin(angle)*rad*scale,.5+scale*(1.8+rnd()*.8),z+Math.cos(angle)*rad*scale,scale*(.9+rnd()*.5),scale*(.8+rnd()*.6),scale*(.9+rnd()*.4),['#335e4d','#487854','#5c8c60','#79966a'][i%4]);}}
 function mansion(x,z,w=4,variant=0){
  const h=(isCityBoard?3.7:2.7)+rnd()*.6,d=isCityBoard?5.4:3.4;
  const face=texture((c,w,h)=>{c.fillStyle='#dfdfcb';c.fillRect(0,0,w,h);for(const x of [13,77]){c.fillStyle='#658c93';c.fillRect(x,22,31,55);c.strokeStyle='#fbf0ce';c.lineWidth=5;c.strokeRect(x,22,31,55);c.fillStyle='#f7e7bb';c.fillRect(x+14,22,3,55);c.fillRect(x,47,31,3);}c.fillStyle='#4e6868';c.fillRect(53,65,23,63);});
  mesh(new T.BoxGeometry(w,h,d),new T.MeshLambertMaterial({map:face}),x,.4+h/2,z);
  block(x,.5,z,w+.4,.24,d+.4,'#e5dfc3');block(x,h+.45,z,w+.6,.22,d+.6,'#f1e6c9');
  if(variant%3===0){block(x,h+.65,z,w+.25,.2,d+.25,'#d4ddcd');for(const side of [-1,1])block(x+side*w/2,h+.9,z,.1,.5,d,'#a8c7bf');block(x+.6,.55,z+2.4,1.5,.12,1.2,'#75b6b4');}else{const roof=mesh(new T.ConeGeometry(w*.83,1.5,4),mat(variant%3===1?'#47767a':'#536574'),x,h+1.23,z);roof.rotation.y=Math.PI/4;roof.scale.z=d/w;}
  for(const side of [-1,1])cylinder(x+side*.65,1.4,z+d/2+.25,.13,.16,2,'#ede8d1');
  block(x,.5,z+d/2+.8,1.8,.15,1.6,'#d8d2b2');
  for(const side of [-1,1]){block(x+side*(w/2+.5),.9,z,.4,.8,d+1,'#38664a');tree(x+side*(w/2+.2),z-d/2-.8,.6,true);}
 }
 let counts={slum:0,commercial:0,luxury:0},features={},sceneryLots=[];
 if(isCityBoard){const scenery=buildDistrictScenery({T,block,mesh,mat,cylinder,line,texture,sign,building,tree,mansion,worldPoint,animated,rnd,elevation,nightGlow,nightStrip});counts=scenery.counts;features={...scenery.features,...buildCityBackdrop({T,scene,block,mesh,mat,animated,width,depth,rnd})};sceneryLots=scenery.lots;}else{
 const lots=[],builtLots=[];
 for(let z=-depth/2+5;z<depth/2-4;z+=6.5)for(let x=-width/2+5;x<width/2-4;x+=6.5){const area=districtAt(x,z),clearance=area==='luxury'?4.8:3.7;if(roadDistance(x,z)<clearance)continue;lots.push({x,z,area,distance:Math.hypot(x,z)});}
 lots.sort((a,b)=>a.distance-b.distance);
 for(const {x,z,area} of lots){if(counts[area]>=16)continue;const n=counts[area]++;builtLots.push({x,z,area});
  if(area==='slum'){
   const h=1.6+rnd()*1.2,w=3+rnd()*.8;building(x,z,w,2.9,h,['#7b6a51','#666c60','#827457'][n%3],'shack');
   for(let k=0;k<12;k++)block(x-w/2+k*w/12,h+.7,z,.12,.18,3.5,k%4?'#607575':'#a76a47',{rx:.09});
   block(x+.6,.75,z+2.3,.8,.7,.7,'#9a8053');
   if(n%3===0){const roof=mesh(new T.ConeGeometry(1.7,1.4,4),mat('#406f7c'),x-1.9,1.1,z+1.8);roof.rotation.y=Math.PI/4;roof.scale.z=.75;}
   if(n%4===0){cylinder(x+1.8,.9,z+2,.3,.3,1,'#70523f');const flame=mesh(new T.ConeGeometry(.25,.8,5),new T.MeshBasicMaterial({color:0xffc979}),x+1.8,1.7,z+2);animated.push({kind:'fire',object:flame});}
  }else if(area==='commercial'){
   building(x,z,3.4+rnd()*.5,3.2,4+rnd()*3,['#ac7956','#9e694b','#b28b5d','#927c63'][n%4],'shop',['日雇い','闇市場','保証なし','食堂','貸金','現金のみ'][n%6]);
   sign(x+1.6,4.1,z+1.7,['営業中','24h','SALE'][n%3],'#693e38','#ffdb85',.7,1.5);
  }else mansion(x,z,3.7+rnd()*.7,n);
 }
 // Parkland, boundary avenues and district-specific street furniture.
 for(let z=-depth/2+2;z<depth/2-1;z+=3.8)for(let x=-width/2+2;x<width/2-1;x+=3.8){if(rnd()>.3||roadDistance(x,z)<2.6||builtLots.some(p=>Math.hypot(x-p.x,z-p.z)<3.8))continue;const area=districtAt(x,z);tree(x,z,.7+rnd()*.4,area==='luxury');}
 for(const t of squares.values())if(t.id%4===0){const x=t.x-1.7,z=t.z+1.7;block(x,2.1,z,.11,3.3,.11,t.area==='slum'?'#675d4b':'#43645b');block(x+.3,3.8,z,.7,.1,.1,'#526451');block(x+.6,3.65,z,.3,.23,.3,'#ffd186',{glow:true});}
 // Skyline and a raised railway remain real geometry behind all three districts.
 for(let x=-width/2-6;x<width/2+6;x+=8){block(x,1.6,-depth/2-7,1,6,1.2,'#6b8178');block(x,4.7,-depth/2-7,8.1,.65,3,'#849287');}
 for(let i=0;i<16;i++){const x=-width/2+i*width/15;building(x,-depth/2-20-rnd()*6,3+rnd()*2,3,5+rnd()*10,'#69858a','tower');}
 }
 for(const {material,matrices} of batches.values()){const inst=new T.InstancedMesh(boxGeometry,material,matrices.length);matrices.forEach((m,i)=>inst.setMatrixAt(i,m));inst.castShadow=true;inst.receiveShadow=true;scene.add(inst);}
 const tileMeshes=new Map(),tileNames={center:'医',can:'缶',trash:'屑',shop:'店',job:'職',exchange:'換',event:'?',shelter:'休',manhole:'◎',koban:'警',normal:'·'};
 for(const t of squares.values()){
  const color=DISTRICTS[t.area]?.color||'#a7bb8d',hole=t.type==='manhole';
  const slab=mesh(hole?new T.CylinderGeometry(isCityBoard?1.65:.9,isCityBoard?1.65:.9,.24,24):isCityBoard?new T.CylinderGeometry(1.7,1.85,.26,24):new T.BoxGeometry(1.6,.2,1.6),new T.MeshLambertMaterial({color,emissive:color,emissiveIntensity:.03}),t.x,.74,t.z);tileMeshes.set(t.id,slab);
  const top=texture((c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle=hole?'#324d4c':t.type==='event'?'#715774':t.type==='normal'?color:'#344d43';c.beginPath();c.arc(w/2,h/2,w/2-2,0,Math.PI*2);c.fill();c.strokeStyle=hole?'#afc1b3':'#f6e5b9';c.lineWidth=3;c.stroke();c.fillStyle=t.type==='normal'?'#394e43':'#fff0c8';c.font='bold 26px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(isCityBoard&&t.next.length>1?'分':tileNames[t.type]||'·',w/2,h/2);},64,64);
  const cap=mesh(new T.PlaneGeometry(isCityBoard?3.25:1.5,isCityBoard?3.25:1.5),new T.MeshBasicMaterial({map:top,transparent:true,alphaTest:.1}),t.x,.93,t.z);cap.rotation.x=-Math.PI/2;cap.castShadow=false;
 }
 const textureCache=new Map(),actors=new Map(),npcActors=new Map();
 const playerItems=createPlayerItems({T,scene,actors,squares,elevation,host,reduced});
 const routeOccluders=scene.children.filter(o=>o.geometry?.type==='BoxGeometry'),routeRay=new T.Raycaster();
 const cam={yaw:.3,pitch:isCityBoard?.65:.8,zoom:1,target:new T.Vector3(0,0,0)};let state=null,raf,dead=false,dirty=true,w=1,h=1,last=0,followKey='',cameraChanged=true,cameraMode='play';const vehicleShots=[];let vehicleShot=null;
 function sync(){cameraChanged=true;const r=host.getBoundingClientRect();w=Math.max(1,r.width);h=Math.max(1,r.height);const aspect=w/h,span=cameraMode==='play'?Math.max(30,Math.min(42,h/15),24/aspect):Math.max(48,(width+(isCityBoard?30:10))/aspect)/cam.zoom;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();const t=cam.target;camera.position.set(t.x+Math.sin(cam.yaw)*120*Math.cos(cam.pitch),Math.sin(cam.pitch)*120,t.z+Math.cos(cam.yaw)*120*Math.cos(cam.pitch));camera.lookAt(t);camera.updateMatrixWorld();const ratio=Math.min(window.devicePixelRatio||1,2,1800/w,1400/h);if(renderer.getPixelRatio()!==ratio)renderer.setPixelRatio(ratio);if(renderer.domElement.width!==Math.floor(w*ratio)||renderer.domElement.height!==Math.floor(h*ratio))renderer.setSize(w,h,false);host.dataset.renderScale=ratio.toFixed(2);renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';dirty=true;host.dataset.yaw=cam.yaw.toFixed(3);host.dataset.cameraMode=cameraMode;host.dataset.cameraPose=JSON.stringify({yaw:cam.yaw,pitch:cam.pitch,zoom:cam.zoom,x:cam.target.x,z:cam.target.z});host.dataset.worldStatus='ready';}
 function project(x,y,z){const p=new T.Vector3(x,y,z).project(camera);return {x:(p.x+1)*w/2,y:(1-p.y)*h/2};}
 function projectGrid(col,row){const [x,z]=worldPoint(col,row);return project(x,elevation(x,z)+.62,z);}
 function focus(ids,zoom=true){const pts=ids.map(id=>squares.get(id)).filter(Boolean);if(!pts.length)return;cam.target.set(pts.reduce((a,p)=>a+p.x,0)/pts.length,0,pts.reduce((a,p)=>a+p.z,0)/pts.length);if(zoom)cam.zoom=1.8;sync();let ps=pts.map(t=>project(t.x,elevation(t.x,t.z)+.62,t.z));const dx=Math.max(...ps.map(p=>p.x))-Math.min(...ps.map(p=>p.x)),dy=Math.max(...ps.map(p=>p.y))-Math.min(...ps.map(p=>p.y));cam.zoom*=Math.min(1,(w-95)/Math.max(1,dx),(h-160)/Math.max(1,dy));sync();}
 function actor(id,url,pos,color,visible=true){const tile=squares.get(pos);if(!tile||!url)return;let a=actors.get(id);if(!a){const sprite=new T.Sprite(new T.SpriteMaterial({transparent:true,alphaTest:.15,depthWrite:true}));sprite.center.set(.5,.12);sprite.scale.setScalar(4.2);sprite.position.set(tile.x,elevation(tile.x,tile.z)+.62,tile.z);scene.add(sprite);a={sprite,url:'',pos,start:0,from:[tile.x,tile.z],to:[tile.x,tile.z]};actors.set(id,a);}a.sprite.visible=visible;if(a.url!==url){a.url=url;if(!textureCache.has(url)){const tex=new T.TextureLoader().load(url,()=>{dirty=true;});tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearFilter;tex.generateMipmaps=false;textureCache.set(url,tex);}a.sprite.material.map=textureCache.get(url);a.sprite.material.needsUpdate=true;}
  if(a.pos!==pos){a.from=[a.sprite.position.x,a.sprite.position.z];a.to=[tile.x,tile.z];a.start=performance.now();a.pos=pos;}
  a.sprite.material.color.set(color||'#ffffff');return a;
 }
 function projectDOM(){
  for(const t of squares.values()){const el=host.querySelector(`[data-original-tile="${t.id}"]`);if(!el)continue;const p=project(t.x,elevation(t.x,t.z)+.62,t.z);el.style.setProperty('--world-x',(p.x-el.offsetWidth/2)+'px');el.style.setProperty('--world-y',(p.y-el.offsetHeight/2)+'px');
   if(isCityBoard&&cameraChanged){const target=new T.Vector3(t.x,elevation(t.x,t.z)+.62,t.z),direction=camera.getWorldDirection(new T.Vector3());routeRay.set(target.clone().addScaledVector(direction,-200),direction);routeRay.far=198.5;el.classList.toggle('tile-obscured',routeRay.intersectObjects(routeOccluders,false).length>0);}
   const target=el.classList.contains('tile-highlight-branch')||el.classList.contains('tile-highlight-dash'),slab=tileMeshes.get(t.id);slab.material.emissiveIntensity=target?.7:.03;const owner=state?.players.find(p=>p.id===state?.territories[t.id]);slab.material.color.set(target?'#ffe7a0':owner?.color||DISTRICTS[t.area]?.color||'#a7bb8d');
  }
  for(const el of host.querySelectorAll('[data-original-player]')){const a=actors.get('p'+el.dataset.originalPlayer);if(!a)continue;const p=project(a.sprite.position.x,a.sprite.position.y+2.7,a.sprite.position.z);el.style.setProperty('--world-x',p.x+'px');el.style.setProperty('--world-y',p.y+'px');}
  if(cameraChanged){cameraChanged=false;if(state?.weaponArcData)window.dispatchEvent(new Event('resize'));}
 }
 function update(next){state=next;dirty=true;
  for(const a of actors.values())a.sprite.visible=false;
  const occupied=new Map();for(const p of state.players){const el=host.querySelector(`[data-original-player="${p.id}"]`),img=el?.querySelector('img');if(!el||!img)continue;const a=actor('p'+p.id,img.src,p.pos,p.statusEffects?.poison>0?'#c9a5e4':'#ffffff',p.hp>0);if(a){const offset=occupied.get(p.pos)||0;occupied.set(p.pos,offset+1);a.offset=offset*.7;a.frontOffset=[state.truckPos,state.policePos].includes(p.pos)?3.4:0;a.name=p.name;el.setAttribute('aria-label',p.name+(p.statusEffects?.poison>0?'（毒）':''));}}
  const npcOccupied=new Map();
  for(const key of NPC_KEYS){
   const pos=state[key+'Pos'],tile=host.querySelector(`[data-original-tile="${pos}"]`),point=squares.get(pos);
   // Native images are also removed on defeat and in fog: retain those exact rules.
   const present=!!point&&[...(tile?.querySelectorAll('img')||[])].some(i=>i.src.includes(key));
   let a=npcActors.get(key);const wasVisible=a?.model.root.visible;
   if(!present){if(a)a.model.root.visible=false;continue;}
   if(!a){const model=createNpcModel(T,key);model.root.scale.setScalar(isCityBoard?1:.58);scene.add(model.root);a={model,pos:null,start:0,from:[point.x,point.z],to:[point.x,point.z],angle:.3,targetAngle:.3};npcActors.set(key,a);}
   a.model.root.visible=true;
   const crowd=npcOccupied.get(pos)||0;npcOccupied.set(pos,crowd+1);
   const ox=crowd?Math.cos(crowd*2.4)*2.3:0,oz=crowd?Math.sin(crowd*2.4)*2.3:0;
   const destination=[point.x+ox,point.z+oz];
   if(!wasVisible){a.from=destination;a.to=destination;a.start=0;a.pos=pos;}
   else if(a.pos!==pos||a.to[0]!==destination[0]||a.to[1]!==destination[1]){
    a.from=[a.model.root.position.x,a.model.root.position.z];a.to=destination;a.start=performance.now();a.pos=pos;
    a.targetAngle=Math.atan2(a.to[0]-a.from[0],a.to[1]-a.from[1]);
    if(cameraMode==='play'&&(key==='truck'||key==='police')){if(vehicleShot?.key===key)vehicleShot.until=performance.now()+1000;else if(!vehicleShots.includes(key))vehicleShots.push(key);}
   }
  }
  playerItems.sync(state);
  if(!followKey){playView();followKey='initialized';}
  updateNight();projectDOM();
 }
 function draw(now){if(dead)return;raf=requestAnimationFrame(draw);if(document.hidden||now-last<40)return;const moving=[...actors.values(),...npcActors.values()].some(a=>a.start&&now-a.start<400);if(reduced&&!dirty&&!moving&&!playerItems.active()&&!vehicleShot&&!vehicleShots.length)return;last=now;dirty=false;for(const a of actors.values()){const f=reduced?1:Math.min(1,(now-a.start)/400),x=a.from[0]+(a.to[0]-a.from[0])*f,z=a.from[1]+(a.to[1]-a.from[1])*f;a.sprite.position.set(x+(a.offset||0)+Math.sin(cam.yaw)*(a.frontOffset||0),elevation(x,z)+.62+(f<1?Math.sin(f*Math.PI)*.35:0),z+Math.cos(cam.yaw)*(a.frontOffset||0));}if(!reduced&&state?.isNight)for(const e of nightEffects)if(e.kind==='fire')e.object.material.opacity=.62+Math.sin(now*.007+e.object.position.x)*.06; if(!reduced)for(const a of animated){if(a.kind==='fire')a.object.scale.y=.9+Math.sin(now*.008)*.12;else if(a.kind==='train'){a.object.position.x=((now*.001*a.speed+a.span/2+a.offset)%a.span)-a.span/2;host.dataset.trainX=a.object.position.x.toFixed(2);}}
  const npcStatus=[];
  for(const [key,a] of npcActors){
   if(!a.model.root.visible)continue;
   const f=reduced?1:Math.min(1,(now-a.start)/400),moving=!!a.start&&f<1,eased=f*f*(3-2*f);
   const x=a.from[0]+(a.to[0]-a.from[0])*eased,z=a.from[1]+(a.to[1]-a.from[1])*eased;
   const delta=Math.atan2(Math.sin(a.targetAngle-a.angle),Math.cos(a.targetAngle-a.angle));a.angle+=delta*(reduced?1:.35);
   a.model.root.position.set(x,elevation(x,z)+.58-(moving&&(key==='truck'||key==='police')?Math.sin(f*Math.PI)*.32:0),z);a.model.root.rotation.y=a.angle;
   a.model.animate(now,moving,reduced,state?.horrorMode);
   npcStatus.push({kind:key,pos:a.pos,x:+x.toFixed(2),z:+z.toFixed(2),heading:+a.angle.toFixed(2),moving,model:'mesh'});
  }
  if(cameraMode==='play')followAction(now);
  playerItems.draw(now,cam.yaw);
  host.dataset.npcModels=JSON.stringify(npcStatus);
  projectDOM();renderer.render(scene,camera);host.dataset.triangles=String(renderer.info.render.triangles);host.dataset.districts=JSON.stringify(counts);host.dataset.scenery=JSON.stringify(features);host.dataset.interiorLots=String(sceneryLots.filter(p=>p.col>0&&p.col<8&&p.row>0&&p.row<5).length);host.dataset.boardLayout=isCityBoard?CITY_BOARD.id:'legacy';host.dataset.actorCount=String([...actors.values()].filter(a=>a.sprite.visible).length+npcStatus.length);
 }
 // Vehicle moves take temporary priority; otherwise show the current turn, human or CPU.
 function followTarget(x,z,y,snap=false){
  const distance=Math.hypot(x-cam.target.x,z-cam.target.z),amount=snap||reduced||distance>30?1:.22;
  if(Math.abs(x-cam.target.x)+Math.abs(z-cam.target.z)+Math.abs(y-cam.target.y)<.015)return;
  cam.target.lerp(new T.Vector3(x,y,z),amount);sync();
 }
 function followPlayer(snap=false){
  const p=state?.players[state.turn],a=p&&actors.get('p'+p.id),tile=p&&squares.get(p.pos);if(!tile)return;
  const x=a?.sprite.position.x??tile.x,z=a?.sprite.position.z??tile.z;
  host.dataset.cameraSubject='player:'+p.id;followTarget(x,z,elevation(x,z)+1.5,snap);
 }
 function followAction(now){
  if(vehicleShot&&((now>=vehicleShot.until&&(!state?._roundEndInProgress||vehicleShots.length))||(!npcActors.get(vehicleShot.key)?.model.root.visible&&!state?._roundEndInProgress)))vehicleShot=null;
  while(!vehicleShot&&vehicleShots.length){const key=vehicleShots.shift();if(npcActors.get(key)?.model.root.visible)vehicleShot={key,until:now+1000};}
  if(vehicleShot){const actor=npcActors.get(vehicleShot.key);if(!actor?.model.root.visible)return;const pos=actor.model.root.position;host.dataset.cameraSubject=vehicleShot.key;followTarget(pos.x,pos.z,pos.y+2.5);}
  else followPlayer();
 }
 function playView(){cam.yaw=.3;cam.pitch=isCityBoard?.65:.92;cam.zoom=1;followPlayer(true);sync();}
 function fixedView(){cam.target.set(0,0,0);cam.yaw=.3;cam.pitch=isCityBoard?.65:.92;cam.zoom=1;sync();focus(map.map(t=>t.id),false);if(isCityBoard){cam.target.z-=5;cam.zoom*=.96;sync();}}
 function setCameraMode(mode){cameraMode=mode==='tour'?'tour':'play';pointers.clear();drag=null;vehicleShots.length=0;vehicleShot=null;if(cameraMode==='play')playView();else fixedView();host.closest('#board-area')?.setAttribute('data-camera-mode',cameraMode);}
 const canvas=renderer.domElement;let drag=null;const pointers=new Map();let travelled=false;
 canvas.addEventListener('pointerdown',e=>{e.stopPropagation();if(cameraMode!=='tour')return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY};travelled=false;});
 canvas.addEventListener('pointermove',e=>{if(cameraMode!=='tour'||!pointers.has(e.pointerId))return;const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2){const other=[...pointers.entries()].find(([id])=>id!==e.pointerId)[1];cam.zoom=Math.max(.4,Math.min(5,cam.zoom*Math.hypot(e.clientX-other.x,e.clientY-other.y)/Math.max(1,Math.hypot(old.x-other.x,old.y-other.y))));travelled=true;sync();return;}if(drag){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>2){const units=(camera.right-camera.left)/w;cam.target.x-=dx*units*Math.cos(cam.yaw)+dy*units*Math.sin(cam.yaw)/Math.sin(cam.pitch);cam.target.z+=dx*units*Math.sin(cam.yaw)-dy*units*Math.cos(cam.yaw)/Math.sin(cam.pitch);cam.target.x=Math.max(-width/2,Math.min(width/2,cam.target.x));cam.target.z=Math.max(-depth/2,Math.min(depth/2,cam.target.z));drag={x:e.clientX,y:e.clientY};travelled=true;sync();}}});
 canvas.addEventListener('pointerup',e=>{pointers.delete(e.pointerId);drag=null;});canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);drag=null;});
 for(const name of ['mousedown','touchstart','touchmove','wheel'])canvas.addEventListener(name,e=>{e.stopPropagation();if(name==='wheel'&&cameraMode==='tour'){e.preventDefault();cam.zoom=Math.max(.4,Math.min(5,cam.zoom*(e.deltaY>0?.9:1.1)));sync();}},{passive:false});
 const resize=new ResizeObserver(()=>{sync();projectDOM();});resize.observe(host);sync();raf=requestAnimationFrame(draw);
 return {update,setCameraMode,getCameraMode:()=>cameraMode,useItem(id,card){playerItems.use(id,card);dirty=true;},playAttack(data){playerItems.attack(data);dirty=true;},setWeaponAim(angle){playerItems.setAim(angle);dirty=true;},tilt(d){if(cameraMode!=='tour')return;cam.pitch=Math.max(.38,Math.min(1.15,cam.pitch+d*.1));sync();},rotate(d){if(cameraMode!=='tour')return;cam.yaw+=d*Math.PI/8;sync();},zoom(d){if(cameraMode!=='tour')return;cam.zoom=Math.max(.4,Math.min(5,cam.zoom*d));sync();},center(){if(cameraMode!=='tour')return;focus([state?.players[state.turn]?.pos]);},overview(){if(cameraMode==='tour')fixedView();},district(area){if(cameraMode!=='tour')return;focus(map.filter(t=>t.area===area).map(t=>t.id));if(isCityBoard&&area==='luxury'){cam.target.y=5;cam.zoom*=.78;sync();}},projectGrid,
  aimEnd(t,range,angle){return projectGrid(t.col+Math.cos(angle*Math.PI/180)*range,t.row+Math.sin(angle*Math.PI/180)*range);},
  weaponArc(t,range,angle){const points=[projectGrid(t.col,t.row)];for(let d=angle-75;d<=angle+75;d+=5)points.push(projectGrid(t.col+Math.cos(d*Math.PI/180)*range,t.row+Math.sin(d*Math.PI/180)*range));return points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ')+' Z';},
  dispose(){dead=true;playerItems.dispose();cancelAnimationFrame(raf);resize.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});for(const tex of [...assets,...textureCache.values()])tex.dispose();renderer.dispose();canvas.remove();}
 };
}
