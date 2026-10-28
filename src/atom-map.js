export const ATOM_BOARD={id:'atom-zero-v1',spacing:10,squares:64};
export const isAtom=s=>s?.mapData?.[0]?.boardLayout===ATOM_BOARD.id;
export const atomDistricts={slum:{name:'下層の居住ポッド',color:'#c6a170',ground:'#786d58'},commercial:{name:'原子力市場',color:'#63bdb6',ground:'#537d78'},luxury:{name:'空中庭園',color:'#d5dcb0',ground:'#8c9c79'}};
export function atomElevation(x,z){return .38+Math.max(0,Math.min(1,(65-Math.hypot(x,z*1.18))/37))*8;}
export function createAtomBoard(){
 const map=[],add=(angle,radius,id,ring,index)=>{const col=9+Math.cos(angle)*radius/10,row=8+Math.sin(angle)*radius*.85/10;map.push({id,col,row,next:[],type:'normal',name:'環状街路',area:ring==='inner'?(index%5<2?'luxury':'commercial'):['slum','commercial','slum','luxury'][Math.floor(index/9)],ring,sector:Math.floor(((angle+Math.PI*2)%(Math.PI*2))/(Math.PI/2)),boardLayout:ATOM_BOARD.id,isCustom:true});};
 for(let i=0;i<36;i++)add(i*Math.PI*2/36,65,i+1,'outer',i);
 for(let i=0;i<20;i++)add(i*Math.PI*2/20,32,i+37,'inner',i);
 for(let i=0;i<36;i++)map[i].next=[(i+1)%36+1];
 for(let i=0;i<20;i++)map[36+i].next=[37+(i+19)%20];
 for(let q=0;q<4;q++){
  const outer=map[q*9],inner=map[36+q*5];let previous=outer;
  for(let k=1;k<=2;k++){const id=map.length+1,f=k/3;const tile={id,col:outer.col+(inner.col-outer.col)*f,row:outer.row+(inner.row-outer.row)*f,next:[previous.id],type:'normal',name:'高架の接続路',area:k===1?'slum':'commercial',sector:q,ring:'ramp',boardLayout:ATOM_BOARD.id,isCustom:true};previous.next.push(id);map.push(tile);previous=tile;}
  previous.next.push(inner.id);inner.next.push(previous.id);
 }
 const set=(id,type,name,atomKind)=>Object.assign(map[id-1],{type,name,...(atomKind?{atomKind}:{})});
 set(19,'center','無料修理ポッド');
 for(const id of [1,10,28])set(id,'normal','空飛ぶ乗合タクシー','taxi');
 set(20,'normal','空飛ぶ乗合タクシー','taxi');
 for(const id of [6,23,44,54])set(id,'shelter','防護シェルター');
 for(const id of [8,26,40,50])set(id,'shop','廃品ロボット商店');
 for(const id of [3,13,31,46])set(id,'can','空き燃料缶');
 for(const id of [5,16,25,34])set(id,'trash','廃棄パーツの山');
 for(const id of [12,30,52])set(id,'exchange','資源再生カウンター');
 for(const id of [7,22,42])set(id,'job','原子炉の臨時作業');
 for(const id of [4,15,24,33,39,48])set(id,'event','未来市民サービス');
 for(const id of [11,29])set(id,'koban','住所確認ゲート');
 for(const id of [9,27])set(id,'normal','路線の配電盤','switch');
 for(const id of [37,47])set(id,'normal','非常用シュート','chute');
 for(const id of [41,51])set(id,'normal','廃熱の回収口','reclaim');
 for(const id of [43,53])set(id,'normal','原子炉の整備通路','hot');
 // Free walking always connects every square. Optional machines never strand a pawn.
 return map;
}
