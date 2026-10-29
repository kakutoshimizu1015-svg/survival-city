export const ATOM_BOARD={id:'atom-zero-v2',legacyId:'atom-zero-v1',spacing:10,squares:64};
export const isAtom=s=>[ATOM_BOARD.id,ATOM_BOARD.legacyId].includes(s?.mapData?.[0]?.boardLayout);
export const atomDistricts={slum:{name:'継ぎ足し居住区',color:'#ce9277',ground:'#a18a6e'},commercial:{name:'原子力市場',color:'#68ada7',ground:'#8f9b87'},luxury:{name:'屋上の未来街',color:'#e4ce93',ground:'#b7ab85'}};
export const ATOM_LIGHT={day:{sky:'#ddbb9c',fog:'#d5b998',water:'#819f98',sun:'#ffe3ae',ambient:'#b9e1ce'},night:{sky:'#242e50',fog:'#303e5c',water:'#344862',sun:'#a8bbee',ambient:'#94bfd0'}};
// Legacy saves retain the old radial elevation. New boards carry explicit heights.
export function atomElevation(x,z){return .38+Math.max(0,Math.min(1,(65-Math.hypot(x,z*1.18))/37))*8;}
export function createAtomElevation(map){
 if(!map.some(t=>Number.isFinite(t.height)))return atomElevation;
 const cx=(Math.min(...map.map(t=>t.col))+Math.max(...map.map(t=>t.col)))/2,cz=(Math.min(...map.map(t=>t.row))+Math.max(...map.map(t=>t.row)))/2;
 const points=new Map(map.map(t=>[t.id,{x:(t.col-cx)*10,z:(t.row-cz)*10,y:t.height}])),edges=[],seen=new Set();
 for(const t of map)for(const id of t.next){const key=[t.id,id].sort((a,b)=>a-b).join(':');if(!seen.has(key)&&points.has(id)){seen.add(key);edges.push([points.get(t.id),points.get(id)]);}}
 return (x,z)=>{let best=Infinity,height=.38;for(const [a,b] of edges){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));const distance=(x-a.x-t*dx)**2+(z-a.z-t*dz)**2;if(distance<best){best=distance;height=a.y+(b.y-a.y)*t;}}return height;};
}
export function createAtomBoard(){
 // Hand-authored streets: stepped corners, an off-centre plaza and rooftop lanes.
 // Coordinates are world units. Heights are also used by pawns, markers and cameras.
 const outer=[[-60,0,4],[-64,10,2],[-64,20,.38],[-60,30,.38],[-52,38,.38],[-42,42,.38],[-31,45,.38],[-20,46,.38],[-10,46,.38],[0,46,.38],[10,46,.38],[20,48,.38],[30,50,.38],[40,48,.38],[50,44,.38],[60,38,.38],[64,28,1],[60,18,3],[50,14,5],[44,6,7],[48,-4,9],[58,-12,11],[60,-24,13],[52,-34,15],[40,-38,16],[30,-38,16],[20,-40,16],[14,-50,16],[4,-50,16],[-6,-50,16],[-16,-50,16],[-28,-46,15],[-40,-42,13],[-50,-32,10],[-54,-24,8],[-62,-12,6]];
 const plaza=[[-32,-14,10],[-24,-20,10],[-14,-22,10],[-4,-22,10],[6,-22,10],[16,-20,10],[26,-14,9],[30,-4,8],[24,4,7],[24,14,6],[16,20,6],[6,20,6],[-4,20,6],[-14,24,6],[-24,20,6],[-34,14,6],[-38,4,7],[-34,-6,8],[-44,-4,8],[-44,-14,10]];
 const ramps=[[-44,30,2.4],[-34,24,4.4],[34,39,2.4],[24,30,4.4],[32,-34,14],[28,-24,11.5],[-42,-28,11.5],[-10,-36,13]];
 const map=[...outer,...plaza,...ramps].map(([x,z,height],index)=>{const id=index+1,ring=id<=36?'outer':id<=56?'inner':'ramp',sector=Math.floor(((Math.atan2(z,x)+Math.PI*2)%(Math.PI*2))/(Math.PI/2));const area=id<=36?(id<=6||id>=14&&id<=19||id>=33?'slum':id>=27&&id<=31?'luxury':'commercial'):id<=56?(['commercial','slum','luxury','commercial'][Math.floor((id-37)/3)%4]):'commercial';return {id,col:9+x/10,row:8+z/10,height,next:[],type:'normal',name:ring==='ramp'?'段差をつなぐ坂道':height>=13?'屋上の未来街路':height>=6?'原子炉広場の通り':'下層の市場通り',area,ring,sector,boardLayout:ATOM_BOARD.id,isCustom:true};});
 for(let i=0;i<36;i++)map[i].next=[(i+1)%36+1];
 for(let i=0;i<20;i++)map[36+i].next=[37+(i+19)%20];
 const path=(ids,both=true)=>{for(let i=0;i<ids.length-1;i++){map[ids[i]-1].next.push(ids[i+1]);if(both)map[ids[i+1]-1].next.push(ids[i]);}};
 // Five two-way streets connect the blocks; two directed service lanes offer shortcuts.
 path([5,57,58,52]);path([14,59,60,47]);path([25,61,62,43]);path([33,63,56]);path([30,64,39]);
 path([35,56],false);path([42,62],false);path([51,58],false);
 const set=(id,type,name,atomKind)=>Object.assign(map[id-1],{type,name,...(atomKind?{atomKind}:{})});
 set(19,'center','無料修理ポッド');
 for(const id of [1,10,28])set(id,'normal','空飛ぶ乗合タクシー','taxi');
 set(20,'normal','空飛ぶ乗合タクシー','taxi');
 for(const id of [6,23,46,54])set(id,'shelter','防護シェルター');
 for(const id of [8,26,40,50])set(id,'shop','廃品ロボット商店');
 for(const id of [3,13,31,44])set(id,'normal','廃ロボット修理','repair');
 for(const id of [5,16,25,34])set(id,'normal','盗電・電力の横流し','siphon');
 for(const id of [12,30,52])set(id,'shop','廃品ロボット商店');
 for(const id of [7,22,42])set(id,'normal','新薬の人体実験','trial');
 for(const id of [4,15,24,33,39,48])set(id,'event','未来市民サービス');
 for(const id of [11,29])set(id,'koban','住所確認ゲート');
 for(const id of [9,27])set(id,'normal','路線の配電盤','switch');
 for(const id of [32,37,47])set(id,'normal','非常滑り台','chute');
 for(const id of [14,36,41,51])set(id,'normal','廃熱の回収口','reclaim');
 for(const id of [43,53])set(id,'normal','原子炉の整備通路','hot');
 for(const id of [4,24,39,48])set(id,'event','市民サービス端末','terminal');
 for(const t of map.filter(t=>t.ring==='ramp'))t.noTerritory=true;
 map[31].atomExit=35;map[36].atomExit=2;map[46].atomExit=14;
 // Free walking always connects every square. Optional machines never strand a pawn.
 return map;
}
