// Ambient city beyond the playable streets: a real viaduct, moving train and skyline.
export function buildCityBackdrop({T,scene,block,mesh,mat,animated,width,depth,rnd}){
 const z=-depth/2-12,span=width+66;
 const box=(x,y,z,w,h,d,color,opts={})=>block(x,y,z,w,h,d,color,{...opts,absolute:true});
 box(0,-.6,z-15,span+35,1.1,42,'#536e65');
 for(let x=-span/2;x<=span/2;x+=12){box(x,2.5,z,1.15,6.3,2.2,'#74877b');box(x,5.35,z,12.1,.9,4.4,'#9b9d83');box(x,5.9,z-2.1,12.1,.4,.23,'#b8b69b');box(x,5.9,z+2.1,12.1,.4,.23,'#b8b69b');}
 for(const dz of [-.78,.78])box(0,5.91,z+dz,span,.12,.12,'#344d4e');
 for(let x=-span/2;x<span/2;x+=1.8)box(x,5.78,z,.17,.1,2.25,'#6b6858');
 for(let x=-span/2;x<=span/2;x+=24){box(x,8.5,z-1.8,.12,5.2,.12,'#5b7774');box(x,10.9,z,.12,.12,4.1,'#5b7774');}
 box(0,10.84,z,span,.04,.04,'#4d6d6b');
 const train=new T.Group();train.position.set(-20,0,z);scene.add(train);
 function part(x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=false;m.receiveShadow=true;train.add(m);}
 for(let i=0;i<3;i++){const x=(i-1)*8.3;part(x,6.94,0,7.7,1.75,2.3,'#d2d5bf');part(x,7.93,0,7.8,.2,2.4,'#78908b');part(x,6.45,0,7.8,.22,2.34,'#c38b54');part(x,5.98,0,6.4,.35,1.9,'#364f4e');
  for(const side of [-1,1])for(let j=0;j<5;j++){part(x-2.8+j*1.4,7.18,side*1.16,.88,.72,.035,j%3?'#50757b':'#ecd494');}
  if(i===2){part(x+3.88,7.15,0,.04,.9,1.55,'#456875');part(x+3.92,6.68,-.7,.05,.17,.24,'#f8e7b5');part(x+3.92,6.68,.7,.05,.17,.24,'#f8e7b5');}
 }
 animated.push({kind:'train',object:train,span:span+35,speed:4,offset:-20});
 // Two depth layers, with subdued colors so the playable buildings stay prominent.
 for(let layer=0;layer<2;layer++)for(let i=0;i<13;i++){const x=-span/2+9+i*14+(layer?5:0),zz=z-16-layer*19,h=7+rnd()*(layer?18:11),w=5+rnd()*4,d=5+rnd()*3,color=layer?'#73918c':'#577c7c';
  box(x,h/2,zz,w,h,d,color);box(x,h+.2,zz,w+.25,.35,d+.25,layer?'#89a096':'#78958c');
  if(i%3===0)box(x-1,h+1.2,zz,1.8,2,1.8,'#70877c');
  for(let y=2;y<h-1;y+=2.1)for(let k=-w/2+1;k<w/2-.5;k+=1.65)box(x+k,y,zz+d/2+.02,.7,.85,.06,(i+layer)%4===0?'#a9a981':'#3e6266');
 }
 for(let i=0;i<7;i++){const hill=mesh(new T.ConeGeometry(20+rnd()*16,12+rnd()*12,6),mat('#79938a'),-95+i*31,3,z-65,true);hill.scale.z=.65;hill.castShadow=false;}
 return {viaduct:1,train:1,skyline:26};
}
