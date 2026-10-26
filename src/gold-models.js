// A deliberately dented, eight-sided gold can: visibly different from ordinary resources.
export function createGoldModels({T,scene,squares,elevation,reduced}){
 const models=new Map();
 function make(){const root=new T.Group(),gold=new T.MeshStandardMaterial({color:'#ffca45',metalness:.7,roughness:.28,emissive:'#9d5b00',emissiveIntensity:.3}),rim=new T.MeshStandardMaterial({color:'#fff0ae',metalness:.55,roughness:.3});
  const add=(g,m,y)=>{const mesh=new T.Mesh(g,m);mesh.position.y=y;mesh.castShadow=true;root.add(mesh);return mesh;};
  const body=add(new T.CylinderGeometry(.67,.78,1.8,8,3),gold,1.25);body.rotation.z=.16;body.scale.x=.85;
  add(new T.CylinderGeometry(.66,.66,.12,12),rim,2.2);add(new T.CylinderGeometry(.75,.75,.13,12),rim,.35);
  const tab=add(new T.TorusGeometry(.2,.055,4,8),rim,2.29);tab.rotation.x=-Math.PI/2;
  const band=add(new T.CylinderGeometry(.73,.73,.22,8),new T.MeshBasicMaterial({color:'#fff4bd'}),1.2);band.scale.x=.86;
  const halo=add(new T.TorusGeometry(1.45,.1,4,24),new T.MeshBasicMaterial({color:'#ffe17c'}),.1);halo.rotation.x=-Math.PI/2;
  const sparkles=[];for(let i=0;i<4;i++){const star=add(new T.OctahedronGeometry(.15),new T.MeshBasicMaterial({color:'#fff5b2'}),1+i*.5);sparkles.push(star);}
  scene.add(root);return {root,sparkles,body};
 }
 return {draw(state,now){const targets=[];if(state.goldMode&&state.gold&&!state.gameOver){if(state.gold.spot!=null)targets.push({id:state.gold.spot,kind:'sale',count:1});for(const [id,n] of Object.entries(state.gold.drops))if(n>0)targets.push({id:Number(id),kind:'drop',count:n});}
  for(const model of models.values())model.root.visible=false;
  for(const target of targets){const key=target.kind+target.id,tile=squares.get(target.id);if(!tile)continue;let model=models.get(key);if(!model){model=make();models.set(key,model);}model.root.visible=true;model.root.position.set(tile.x,elevation(tile.x,tile.z)+1.1,tile.z);model.root.rotation.y=reduced?.3:now*.0005;model.body.position.y=1.25+(reduced?0:Math.sin(now*.002)*.08);model.sparkles.forEach((s,i)=>{const a=i*Math.PI/2+(reduced?0:now*.0008);s.position.x=Math.cos(a)*1.1;s.position.z=Math.sin(a)*1.1;});}return targets;
 }};
}
