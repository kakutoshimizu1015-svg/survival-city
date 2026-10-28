export function createAtomNpcModel(T,key){
 const root=new T.Group(),colors={police:'#719ab9',uncle:'#b99869',animal:'#987e69',yakuza:'#8c6261',loanshark:'#907ca6',friend:'#79bba6'},base=colors[key]||'#afaa88';
 function part(g,color,x,y,z,glow=false){const m=new T.Mesh(g,new T.MeshLambertMaterial({color,emissive:glow?color:0,emissiveIntensity:glow?.6:0}));m.position.set(x,y,z);m.castShadow=true;root.add(m);return m;}
 const box=(w,h,d,c,x,y,z)=>part(new T.BoxGeometry(w,h,d),c,x,y,z);
 if(key==='animal'){box(1,.7,1.5,base,0,.55,0);box(.7,.5,.7,'#c1b298',0,.7,.95);for(const x of [-.6,.6])for(const z of [-.5,.5])part(new T.CylinderGeometry(.3,.3,.2,8),'#475052',x,.3,z).rotation.z=Math.PI/2;part(new T.CylinderGeometry(.08,.08,1.7,6),'#b4ad91',0,.8,-1.1).rotation.x=1;}
 else if(key==='police'){part(new T.CylinderGeometry(1.6,1.3,.65,12),base,0,1.8,0);part(new T.SphereGeometry(.9,10,6),'#c6ccb9',0,2.2,0);for(const x of [-.7,.7])box(.4,.25,.3,x<0?'#d6725d':'#73b9d0',x,2.1,1);part(new T.CylinderGeometry(.5,.8,.5,8),'#dcb768',0,1.3,0);}
 else{
  const broad=key==='yakuza'?1.5:1;
  box(broad,1.35,.8,base,0,1.65,0);part(new T.SphereGeometry(.65,10,6),'#d0c4a3',0,2.8,0);box(.95,.3,.1,'#354e51',0,2.85,.6);for(const x of [-.25,.25])box(.15,.15,.05,key==='friend'?'#bce9c5':'#edbb78',x,2.85,.68);
  for(const side of [-1,1]){box(.25,1,.3,'#626f6b',side*.35,.65,0);box(.4,.3,.6,base,side*.35,.17,.15);box(.26,1,.35,base,side*(broad/2+.3),1.6,0);}
  if(key==='friend'){box(.9,.7,.7,'#dbc78e',.9,1.1,.5);box(.35,.5,.35,'#c7c3ab',.9,1.65,.5);}
  if(key==='loanshark'){box(.9,.7,.25,'#494451',.9,.9,.2);box(.65,.15,.3,'#cfad76',0,2.1,.5);}
  if(key==='uncle'){box(.7,.8,.3,'#715942',0,1.6,.5);part(new T.CylinderGeometry(.07,.07,.7,5),'#e9b86c',.3,3.55,0).rotation.z=.3;}
  if(key==='yakuza'){box(.3,1.6,.3,'#454c4b',1.2,1,.4);box(1.6,.3,1,'#544f50',0,2.35,0);}
 }
 root.userData.features=['retro-robot',key];return {root,animate(now,moving,reduced){if(!reduced)root.position.y+=Math.sin(now*.003)*(key==='police'?.18:moving?.06:0);}};
}
