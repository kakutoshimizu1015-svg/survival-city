// A fast outer circuit with optional camp lanes, shop alleys and a four-way park.
// Every playable edge still spans exactly one grid unit.
export const CITY_BOARD = Object.freeze({id:'district-board-v3',spacing:12,columns:9,rows:6,squares:48,forks:9});
export function cityDistrictAt(col,row){
 if(row>3.4&&Math.hypot((col-1.0)*1.2,row-4.15)<.92)return 'commercial';
 if(row<.3&&col>4.25&&col<5.25)return 'luxury';
 if(row>4.65&&col>3.3&&col<4.25)return 'luxury';
 if(Math.hypot((col-3.5)*1.5,row-1.05)<.55)return 'slum';
 const west=2.6+.38*Math.sin(row*1.4)+.17*Math.cos(row*2.3);
 const east=5.55+.5*Math.sin(row*1.05+.8);
 return col<west?'slum':col>east?'luxury':'commercial';
}
const names={center:'路上クリニック',can:'空き缶',trash:'ごみ置き場',shop:'ショップ',job:'バイト',exchange:'買取所',event:'イベント',shelter:'休憩所',manhole:'マンホール',koban:'交番',normal:'街路'};
export function createCityBoard(){
 const points=[];
 for(let row=5;row>=0;row--)points.push([0,row]);
 for(let col=1;col<=8;col++)points.push([col,0]);
 for(let row=1;row<=5;row++)points.push([8,row]);
 for(let col=7;col>=1;col--)points.push([col,5]);
 const map=points.map(([x,y],i)=>({id:i+1,col:x+1,row:y+1,next:[(i+1)%points.length+1],area:cityDistrictAt(x,y),type:'normal',name:names.normal,isCustom:true,boardLayout:CITY_BOARD.id}));
 const at=(x,y)=>map.find(t=>t.col===x+1&&t.row===y+1);
 function crossStreet(x,start,end){const from=at(x,start),to=at(x,end),direction=Math.sign(end-start);let previous=from;for(let y=start+direction;y!==end;y+=direction){const tile={id:map.length+1,col:x+1,row:y+1,next:[],area:'commercial',type:'normal',name:names.normal,isCustom:true,boardLayout:CITY_BOARD.id};previous.next.push(tile.id);map.push(tile);previous=tile;}previous.next.push(to.id);}
 crossStreet(3,0,5);crossStreet(5,5,0);
 const spaces=[
  [0,5,'center'],[0,4,'can'],[0,3,'trash'],[0,2,'event'],[0,1,'shelter'],[0,0,'manhole'],[1,0,'can'],[2,0,'exchange'],
  [3,0,'normal'],[4,0,'job'],[5,0,'shop'],[6,0,'event'],[7,0,'normal'],[8,0,'manhole'],[8,1,'job'],[8,2,'koban'],[8,3,'normal'],[8,4,'shelter'],[8,5,'event'],
  [7,5,'normal'],[6,5,'exchange'],[5,5,'normal'],[4,5,'shop'],[3,5,'job'],[2,5,'trash'],[1,5,'can'],
  [3,1,'shop'],[3,2,'event'],[3,3,'normal'],[3,4,'manhole'],[5,4,'shop'],[5,3,'normal'],[5,2,'event'],[5,1,'job']
 ];
 for(const [x,y,type] of spaces){const tile=at(x,y);tile.type=type;tile.name=names[type];}
 // Add only the streets chosen here: adjacent visual cells are not implicit links.
 function route(points,kind){let previous=null;for(const [x,y] of points){let tile=at(x,y);if(!tile){tile={id:map.length+1,col:x+1,row:y+1,next:[],area:cityDistrictAt(x,y),type:'normal',name:names.normal,isCustom:true,boardLayout:CITY_BOARD.id,lane:kind};map.push(tile);}if(previous&&!previous.next.includes(tile.id))previous.next.push(tile.id);previous=tile;}}
 route([[0,2],[1,2],[2,2],[3,2]],'camp');
 route([[1,2],[1,3],[2,3],[2,4],[2,5]],'camp');
 route([[2,2],[2,1],[2,0]],'camp');
 route([[4,0],[4,1],[4,2],[4,3],[5,3]],'alley');
 route([[3,3],[4,3]],'alley');
 // One entrance from the east; the fountain junction offers N/E/S/W exits.
 // The western arm flows out to the shops, avoiding a backtrack prompt on every step.
 route([[7,3],[6,3],[5,3]],'park');
 route([[8,3],[7,3],[8,3]],'park');
 route([[7,3],[7,2],[7,1],[7,0]],'park');
 route([[7,3],[7,4],[7,5]],'park');
 for(const [x,y,type] of [[2,4,'manhole'],[4,2,'manhole'],[7,2,'manhole'],[1,2,'normal'],[2,2,'normal'],[1,3,'can'],[2,3,'trash'],[2,1,'shelter'],[4,1,'shop'],[4,3,'event'],[6,3,'shelter'],[7,3,'normal'],[7,1,'normal'],[7,4,'normal']]){const t=at(x,y);t.type=type;t.name=x===7&&y===3?'噴水広場':names[type];}
 for(const tile of map)tile.area=cityDistrictAt(tile.col-1,tile.row-1);
 return map;
}
