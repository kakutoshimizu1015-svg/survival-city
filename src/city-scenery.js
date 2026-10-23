// Deliberately placed neighborhoods inside the circuit, not random perimeter lots.
export function buildDistrictScenery(api){
 const {T,block,mesh,mat,cylinder,line,texture,sign,building,tree,mansion,worldPoint,animated,rnd,nightGlow,nightStrip}=api;
 const counts={slum:0,commercial:0,luxury:0},features={},lots=[];
 const point=(col,row)=>worldPoint(col+1,row+1);
 const mark=(name)=>features[name]=(features[name]||0)+1;
 function place(area,col,row,name,fn){const [x,z]=point(col,row);counts[area]++;mark(name);lots.push({area,col,row,name,x,z});fn(x,z);}
 function prop(col,row,fn){fn(...point(col,row));}
 function tarp(x,z,w=5,d=4,h=2.5){
  const shape=new T.BufferGeometry();shape.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,d/2,0,h,d/2,w/2,0,d/2,-w/2,0,-d/2,0,h,-d/2,w/2,0,-d/2],3));shape.setIndex([0,1,4,0,4,3,1,2,5,1,5,4,3,4,5]);shape.computeVertexNormals();
  mesh(shape,new T.MeshLambertMaterial({color:'#247ca5',side:T.DoubleSide,flatShading:true}),x,.42,z);
  // Rope ridge, seams and folded plastic sheets make these read as tarps.
  line([x,.48+h,z-d/2-.4],[x,.48+h,z+d/2+.4],.045,'#d0bb85');
  for(const side of [-1,1]){line([x,.45+h,z+side*d/2],[x+side*(w/2+.7),.42,z+side*(d/2+.5)],.025,'#ceb98c');block(x+side*(w/2+.7),.55,z+side*(d/2+.5),.12,.3,.12,'#786444');}
  const entrance=mesh(new T.PlaneGeometry(w*.48,h*.68),mat('#153b44'),x,.45+h*.34,z+d/2+.02);entrance.rotation.z=Math.PI/24;
  block(x-w*.3,.5,z+d/2+.5,1.1,.15,.85,'#a88f61');block(x+w*.32,.63,z+d/2+.45,.8,.4,.65,'#93784e');
  mark('blueTarpTent');
 }
 function rubbish(x,z){
  for(let i=0;i<15;i++){const a=i*2.4,r=i<4?.3:1.1+rnd()*.4;const bag=mesh(new T.IcosahedronGeometry(.4+rnd()*.35,0),mat(['#3d4942','#6b7363','#bbb494','#4f5e62'][i%4]),x+Math.cos(a)*r,.7+(i<4?.65:0),z+Math.sin(a)*r);bag.scale.y=.8;}
  for(let i=0;i<4;i++)block(x-1.3+i*.7,.57,z+.9,.6,.32,.5,i%2?'#a89567':'#82704b',{ry:i*.7});mark('rubbishHeap');
 }
 function fireCan(x,z){
  nightGlow(x,z,'#ff923b',5,'fire');
  block(x,.88,z,.65,1,.65,'#806047');for(const y of [.47,1.22])block(x,y,z,.72,.09,.72,'#453f36');block(x,1.4,z,.51,.04,.51,'#2d3029');
  const flame=mesh(new T.ConeGeometry(.32,1.05,5),new T.MeshBasicMaterial({color:'#ffc568'}),x,1.8,z);animated.push({kind:'fire',object:flame});mesh(new T.ConeGeometry(.18,.65,5),new T.MeshBasicMaterial({color:'#fff1a6'}),x,1.66,z+.03);mark('fireCan');
 }
 function fence(x,z,length,angle=0){
  const dx=Math.cos(angle),dz=Math.sin(angle);for(let p=-length/2;p<=length/2+.01;p+=1.3){block(x+dx*p,1.1,z+dz*p,.1,1.5,.1,'#81553b');}
  for(const y of [.7,1.65])line([x-dx*length/2,y,z-dz*length/2],[x+dx*length/2,y,z+dz*length/2],.055,'#916344');
  for(let p=-length/2;p<length/2;p+=.55){line([x+dx*p,.75,z+dz*p],[x+dx*(p+.5),1.6,z+dz*(p+.5)],.015,'#826849');line([x+dx*p,1.6,z+dz*p],[x+dx*(p+.5),.75,z+dz*(p+.5)],.015,'#826849');}mark('rustFence');
 }
 function tin(x,z){for(let k=0;k<12;k++)block(x-1.4+k*.25,1.1,z, .24,1.7,.13,k%4?'#857e66':'#9d5d39',{rx:-.25});mark('rustTin');}
 // Lanes weave through the camp. Tents sit in the small blocks between them.
 for(const [col,row,w,d] of [[.7,.8,5,4],[1.35,.65,4.5,3.6],[2.55,.85,4.6,3.5],[.55,2.65,4,3.5],[1.5,2.5,4.3,3.4],[2.5,3.5,4.8,3.6],[2.5,4.45,4.5,3.4],[3.55,1.0,4.8,3.8]])place('slum',col,row,'camp',(x,z)=>tarp(x,z,w,d));
 place('slum',1.25,1.4,'salvage',(x,z)=>{rubbish(x,z);tin(x-2.4,z-1);});
 place('slum',1.35,3.6,'salvage',(x,z)=>{rubbish(x+1,z);fireCan(x-2,z+.6);});
 prop(.4,3.45,(x,z)=>{fireCan(x,z);block(x+1,.6,z+1,1.6,.4,.65,'#806f4f');});
 prop(2.5,2.7,(x,z)=>{tin(x,z);});
 prop(.95,.27,(x,z)=>fence(x,z,12));prop(.3,3.7,(x,z)=>fence(x,z,8,Math.PI/2));prop(2.55,1.25,(x,z)=>fence(x,z,7,Math.PI/2));
 place('slum',.65,1.45,'supply',(x,z)=>{block(x,1.2,z,3.6,1.6,2.5,'#77765d');for(let k=0;k<14;k++)block(x-1.8+k*.28,2.08,z,.24,.15,3.1,k%3?'#78817b':'#a76b47',{rx:.08});sign(x,1.6,z+1.28,'再利用','#52483a','#f1d39a',3,.6);});
 // Middle block: six different destinations, each with a recognizable silhouette.
 function shop(x,z,kind){
  const styles={convenience:['#e1d6ac','#3b8565','コンビニ',3.2],arcade:['#594f67','#cf6f86','GAME',5.5],restaurant:['#b77452','#ac4939','食堂',3.7],department:['#bba283','#c4a36b','百貨店',8.4],weapons:['#5c6961','#596d4b','武器屋',4],cards:['#8e7b9e','#85669f','カード',4.8]};
  const [wall,accent,title,h]=styles[kind],w=kind==='department'?6.6:6.2,d=kind==='department'?6.7:5.8;
  building(x,z,w,d,h,wall,'block');
  const neon=kind==='arcade'?'#ff6bc7':kind==='cards'?'#aa86ff':kind==='convenience'?'#67ffcd':'#ffc278';
  nightStrip(x,3.45,z+d/2+.6,w+.4,neon);nightGlow(x,z+d/2+2.2,neon,4.8,'neon');
  if(kind==='arcade'||kind==='cards'){for(const dx of [-w/2,w/2]){const strip=nightStrip(x+dx,2,z+d/2+.65,2.8,neon);strip.rotation.z=Math.PI/2;}}block(x,.6,z,w+1.1,.3,d+1.2,'#a7977b');
  block(x,1.8,z+d/2+.04,w-.7,2.2,.1,'#33525a');for(const dx of [-w/3,0,w/3])block(x+dx,1.8,z+d/2+.12,.1,2.2,.12,'#cec8ae');
  block(x,3.05,z+d/2+.45,w+.4,.35,1.25,accent);sign(x,3.05,z+d/2+1.1,title,accent,'#fff0c6',w-.2,.75);
  if(kind==='convenience'){for(const yy of [2.68,3.36])block(x,yy,z+d/2+.49,w+.4,.14,1.28,'#eee2ba');block(x+w/2+.65,1.4,z+d/2,.8,1.9,.75,'#be5651');sign(x+w/2+.65,1.7,z+d/2+.39,'24','#3c6857','#f5edc7',.65,.5);}
  if(kind==='arcade'){sign(x,h+1.15,z+d/2+.05,'GAME','#4b405b','#f6b6d0',5,1.15);for(const dx of [-1.8,1.8]){block(x+dx,1.25,z+d/2+1.3,1.1,1.6,1,'#656098');block(x+dx,1.65,z+d/2+1.83,.8,.6,.06,'#83ddd1',{glow:true});block(x+dx,1.16,z+d/2+1.9,1.1,.2,.4,'#c38ca1');}}
  if(kind==='restaurant'){for(const dx of [-2.1,-.7,.7,2.1]){cylinder(x+dx,2.1,z+d/2+1,.22,.22,.45,'#d99e6a');block(x+dx,1.5,z+d/2+1,.5,.65,.06,'#aa493d');}cylinder(x-2,h+1.3,z-1,.3,.3,1.8,'#797d70');block(x+.5,.7,z+d/2+1.6,2,.6,.8,'#8e6846');}
  if(kind==='department'){block(x,4.9,z+d/2+.25,w+.4,.18,.8,'#dfd2ae');block(x,7,z+d/2+.25,w+.4,.18,.8,'#dfd2ae');for(const dx of [-w/2+.3,w/2-.3])block(x+dx,2.1,z+d/2+.65,.4,3.3,.4,'#eee2bf');sign(x,h+.95,z+d/2,'DEPT.','#625847','#ead3a0',5.7,1.15);}
  if(kind==='weapons'){block(x,1.2,z+d/2+1.5,3.7,1,.75,'#626b4d');for(const dx of [-1.2,0,1.2]){block(x+dx,1.85,z+d/2+1.5,.25,.9,.2,'#353f3b',{rz:-.5});block(x+dx-.15,1.52,z+d/2+1.5,.45,.15,.2,'#916448');}sign(x+2.4,h+.5,z+d/2,'ARMORY','#434b3d','#d6c58b',2.1,.8);}
  if(kind==='cards'){for(const dx of [-1.5,0,1.5]){block(x+dx,1.6,z+d/2+.25,.85,1.35,.15,['#8f698f','#b88b5e','#658e8b'][Math.round(dx+1.5)%3]);sign(x+dx,1.65,z+d/2+.34,'★','#5c4c6a','#ffe0a3',.7,.9);}sign(x,h+.7,z+d/2,'TCG','#67527c','#e3caef',3.8,1);}
  mark(kind);
 }
 for(const [col,row,kind] of [[1.0,4.15,'convenience'],[4.45,.85,'arcade'],[3.55,1.95,'restaurant'],[4.45,1.95,'department'],[3.6,4.1,'weapons'],[4.45,4.1,'cards']])place('commercial',col,row,'shop',(x,z)=>shop(x,z,kind));
 // The raised right block has towers behind the park, detached villas in front.
 function tower(x,z,h,w=7){building(x,z,w,7,h,'#a5bdba','tower');block(x,1.65,z+3.9,w+1.8,2.5,2,'#d5d9c5');block(x,1.75,z+4.94,w-.7,1.9,.1,'#658a91');for(let y=4;y<h;y+=2.1){block(x,y,z+3.6,w+.4,.16,1,'#e3e3cb');for(const side of [-1,1])block(x+side*(w/2+.15),y,z,.5,.16,7.1,'#d3ddd0');}block(x,h+.85,z,w*.8,1.2,5.5,'#c5d2c9');sign(x,2.7,z+5,'RESIDENCE','#5d7979','#ede5c4',w, .6);mark('residentialTower');}
 place('luxury',6.05,.85,'tower',(x,z)=>tower(x,z,17.5));place('luxury',4.75,-.68,'tower',(x,z)=>tower(x,z,20,7.2));
 function villa(x,z,variant){mansion(x,z,7.5,variant);block(x, .55,z+4.7,8,.22,4.3,'#c9c6ad');block(x-3.1,1.15,z+5,.5,1.5,2.3,'#447252');for(const side of [-1,1]){block(x+side*4.1,1.05,z, .45,1.3,7.8,'#d7d4bc');block(x+side*4.1,1.75,z+3.9,.7,.25,.7,'#e5debf');}mark('luxuryVilla');}
 place('luxury',6.0,4.05,'villa',(x,z)=>villa(x,z,1));place('luxury',3.75,5.58,'villa',(x,z)=>villa(x,z,0));
 function car(x,z,color,angle=0){
  // Individual primitives share a fixed north/south parking direction.
  block(x,.94,z,1.65,.65,3.7,color,{ry:angle});block(x,1.46,z-.2,1.35,.65,1.95,'#526e77',{ry:angle});block(x,1.84,z-.2,1.4,.12,1.65,color,{ry:angle});
  for(const dx of [-.86,.86])for(const dz of [-1.13,1.13]){const wheel=cylinder(x+dx,.72,z+dz,.34,.34,.22,'#273c3e',12);wheel.rotation.z=Math.PI/2;}
  for(const dx of [-.54,.54]){block(x+dx,.96,z+1.9,.4,.18,.08,'#f7e8bd',{glow:true});block(x+dx,.96,z-1.9,.4,.16,.08,'#bb6055');}mark('luxuryCar');
 }
 prop(6.0,4.45,(x,z)=>car(x+1.8,z+.3,'#d9d7c6'));prop(3.75,5.88,(x,z)=>car(x+1.7,z+.7,'#263d49'));
 function lamp(x,z){block(x,.55,z,.7,.3,.7,'#9f9b7f');cylinder(x,2.2,z,.09,.15,3.5,'#3f5148');cylinder(x,3.85,z,.16,.12,.3,'#c3af75');for(const side of [-1,1]){line([x,3.75,z],[x+side*.65,4.05,z],.06,'#465849');cylinder(x+side*.65,4.08,z,.24,.17,.6,'#e9d9ab');mesh(new T.ConeGeometry(.34,.3,4),mat('#42584c'),x+side*.65,4.52,z);}mark('ornateLamp');}
 // The playable cross is centered at (7,3); the fountain occupies its NW garden.
 // Garden beds and hedges leave all four arms unobstructed.
 place('luxury',6.65,2.65,'fountainPark',(x,z)=>{
  const [cx,cz]=point(7,3);block(cx,.435,cz,25,.1,26,'#b9c6a4');
  for(const sx of [-1,1])for(const sz of [-1,1]){block(cx+sx*6.9,.49,cz+sz*7,8.5,.08,8.3,'#779b72');}
  cylinder(cx,.54,cz,3.3,3.3,.06,'#d8d6b9',24);
  cylinder(x,.76,z,2.25,2.45,.48,'#e2ddbe',24);cylinder(x,1.03,z,1.94,1.94,.1,'#72bdbb',32);cylinder(x,1.5,z,.24,.4,1.3,'#cbd3bc',12);cylinder(x,2.06,z,1,.6,.25,'#e6dfc0',20);cylinder(x,2.2,z,.83,.83,.06,'#83d2cb',24);cylinder(x,2.55,z,.1,.16,.65,'#b8cfc3');
  const waterMat=new T.MeshBasicMaterial({color:'#c1eee0',transparent:true,opacity:.7});
  for(let i=0;i<8;i++){const a=i*Math.PI/4,pts=[];for(let j=0;j<=12;j++){const f=j/12;pts.push(new T.Vector3(x+Math.cos(a)*f*1.6,2.55+Math.sin(f*Math.PI)*1.1-f*1.4,z+Math.sin(a)*f*1.6));}const jet=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),12,.035,4,false),waterMat);jet.position.y=api.elevation(x,z)-.38;}
  for(const [col,row] of [[7.55,2.45],[7.55,3.55],[6.35,3.5],[6.25,2.05]])prop(col,row,(xx,zz)=>{tree(xx,zz,.8,true);lamp(xx-1.5,zz+1.8);});
  for(const [col,row] of [[7.5,2.6],[7.5,3.5]])prop(col,row,(xx,zz)=>{block(xx,1.0,zz,2.3,.22,.7,'#9a8158');block(xx,1.45,zz+.32,2.3,.8,.13,'#9a8158');});
  // Segmented hedges frame beds without closing the playable paths.
  for(const [col,row] of [[6.35,2.3],[7.55,2.15],[6.45,3.65],[7.55,3.85]])prop(col,row,(xx,zz)=>block(xx,.92,zz,4.8,.9,.55,'#3e7452'));
  mark('fountain');mark('parkCross');
 });
 for(const [c,r] of [[5.48,.3],[7.55,1.55],[7.65,4.6],[5.45,4.65],[6.65,4.65]])prop(c,r,lamp);
 for(const [c,r] of [[5.5,1.8],[7.55,.6],[7.55,4.15],[6.65,5.55],[2.9,5.6]])prop(c,r,(x,z)=>tree(x,z,.85,true));
 return {counts,features,lots};
}
