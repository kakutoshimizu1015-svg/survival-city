import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {buildKobanLandmarks} from '../src/koban-landmark.js';import {createCityBoard} from '../src/city-board-map.js';
const T=new Function(readFileSync(new URL('../src/vendor/three.min.js',import.meta.url),'utf8')+';return THREE;')();
test('every police square has a 3D police box beside the road with a sign, red lamp and night lighting',()=>{
 const map=createCityBoard(),squares=new Map(map.map(t=>[t.id,{...t,x:(t.col-5)*12,z:(t.row-3.5)*12}])),edges=map.flatMap(t=>t.next.map(id=>[squares.get(t.id),squares.get(id)]));
 const roadDistance=(x,z)=>Math.min(...edges.map(([a,b])=>{const dx=b.x-a.x,dz=b.z-a.z,f=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-a.x-dx*f,z-a.z-dz*f)}));
 const scene=new T.Scene(),signs=[],glows=[],blocks=[];
 const mesh=(g,m,x,y,z)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);scene.add(o);return o};
 const models=buildKobanLandmarks({T,squares,roadDistance,width:120,depth:92,mat:c=>new T.MeshLambertMaterial({color:c}),mesh,
  block:(x,y,z,w,h,d,color,opts)=>{const o=mesh(new T.BoxGeometry(w,h,d),new T.MeshLambertMaterial({color}),x,y,z);o.rotation.y=opts?.ry||0;blocks.push({o,color,opts})},
  sign:(x,y,z,text,bg,fg,w,h,angle)=>{signs.push({x,z,text,angle});return mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial(),x,y,z)},
  nightGlow:(...args)=>glows.push(args),nightStrip:(x,y,z,w)=>mesh(new T.BoxGeometry(w,.1,.1),new T.MeshBasicMaterial(),x,y,z)
 });
 assert.equal(models.length,map.filter(t=>t.type==='koban').length);assert.ok(signs.some(s=>s.text.includes('KOBAN')));assert.ok(signs.some(s=>s.text==='巡回中'));assert.equal(glows.length,models.length);assert.ok(blocks.some(b=>b.opts.glow&&b.color==='#e46e54'));
 for(const m of models){assert.ok(roadDistance(m.x,m.z)>5,'building clears the road');const t=squares.get(m.tileId);assert.ok(Math.hypot(m.x-t.x,m.z-t.z)>6);assert.ok(Math.abs(m.x)+3<60);}
 scene.updateMatrixWorld(true);for(const b of blocks){const bounds=new T.Box3().setFromObject(b.o);assert.ok(bounds.min.y>=.3);assert.ok(Number.isFinite(bounds.max.x));}
 const bounds=new T.Box3().setFromObject(scene);assert.ok(bounds.max.y>5);
});
