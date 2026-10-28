// A recognizable police box beside each police square, leaving the token and road open.
export function buildKobanLandmarks({T,squares,block,mesh,mat,sign,nightGlow,nightStrip,scale=1}){
 const landmarks=[],offsetScale=scale;scale*=.5;
 for(const tile of squares.values()){
  if(tile.type!=='koban')continue;
  // Upper-left of the marker in the fixed play camera (yaw .3), at half size.
  const site={x:tile.x-3*offsetScale,z:tile.z-3.2*offsetScale,angle:Math.atan2(3,3.2)};
  const {x,z,angle}=site,c=Math.cos(angle),s=Math.sin(angle);
  const point=(u,v)=>[x+(u*c+v*s)*scale,z+(-u*s+v*c)*scale];
  const box=(u,y,v,w,h,d,color,glow=false)=>{const [xx,zz]=point(u,v);block(xx,.38+(y-.38)*scale,zz,w*scale,h*scale,d*scale,color,{ry:angle,glow});};
  const label=(u,y,v,text,bg,fg,w,h)=>{const [xx,zz]=point(u,v);sign(xx,.38+(y-.38)*scale,zz,text,bg,fg,w*scale,h*scale,angle);};
  box(0,.52,0,5.7,.28,5.2,'#adb4a5');
  box(0,2.35,0,5,3.6,4.5,'#e0dfc9');
  box(0,.96,0,5.08,.72,4.56,'#435f76');
  box(0,4.25,0,5.55,.3,4.95,'#344d65');
  box(0,4.48,0,5.05,.18,4.45,'#658396');
  // Glass door, staffed window, awning and blue police sign face the playable square.
  box(.95,1.89,2.29,1.25,2.55,.1,'#314a5b');box(.95,2.15,2.36,1.02,1.8,.05,'#79afb1');
  box(.58,1.7,2.42,.06,.35,.06,'#e6ce89');
  box(-1.05,2.18,2.3,1.9,1.7,.12,'#435967');box(-1.05,2.18,2.38,1.65,1.42,.06,'#e9c787');
  box(-1.05,2.18,2.43,.07,1.5,.05,'#f1ecce');box(-1.05,2.18,2.43,1.7,.07,.05,'#f1ecce');
  box(0,3.33,2.65,5.4,.22,1.1,'#385d7f');label(0,3.7,2.34,'交番  KOBAN','#294c72','#f7e8b9',4.5,.64);
  box(.95,.63,2.85,1.8,.23,1.2,'#d6d0b4');
  // Faceted gold badge and red emergency lamp distinguish it from the shops.
  const badge=mesh(new T.CylinderGeometry(.33*scale,.33*scale,.09*scale,5),mat('#dcb759'),x,.38+4.53*scale,z);
  badge.rotation.x=Math.PI/2;badge.rotation.z=-angle;
  const [bx,bz]=point(-1.6,2.36);badge.position.x=bx;badge.position.z=bz;
  box(1.78,4.7,.5,.85,.25,.75,'#334a55');box(1.78,5.02,.5,.58,.48,.55,'#e46e54',true);
  const [gx,gz]=point(0,3.8);nightGlow(gx,gz,'#ffd68c',3.2*scale);
  const [lx,lz]=point(0,3);const strip=nightStrip(lx,.38+2.87*scale,lz,4.8*scale,'#b2e0dc');strip.rotation.y=angle;
  // Notice board and short bollards sit beside the entrance, not on the route.
  box(-2.1,1.5,3.1,.1,2,.1,'#40586a');label(-2.1,2.02,3.15,'巡回中','#edf0d4','#34566f',.85,1.05);
  for(const u of [-2.5,2.5]){box(u,.9,2.9,.18,1,.18,'#d3d4c0');box(u,1.2,2.9,.2,.15,.2,'#43657a');}
  landmarks.push({...site,tileId:tile.id,kind:'koban'});
 }
 return landmarks;
}
