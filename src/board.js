// A shared track definition keeps the painted board and the movement rules in sync.
export const TILE_TYPES = {
 shelter: {name:'避難所',icon:'bowl',color:'#83b0a0'},
 park: {name:'空き缶',icon:'can',color:'#b7bb73'},
 alley: {name:'イベント',icon:'spark',color:'#b19bc4'},
 shop: {name:'バイト',icon:'case',color:'#d7a05b'},
 recycle: {name:'買取所',icon:'recycle',color:'#80b9c7'},
 station: {name:'取り立て屋',icon:'gun',color:'#cf846b'},
 manhole: {name:'マンホール',icon:'warp',color:'#7fd3cf'}
};
// Keep the original 24 square IDs so ongoing runs survive the expansion.
export const TRACK = [[-13,9],[-9,11],[-5,11],[-1,11],[3,11],[7,11],[11,11],[15,9],[16,5],[16,1],[16,-3],[15,-7],[12,-10],[8,-11],[4,-11],[0,-11],[-4,-11],[-8,-11],[-12,-10],[-16,-7],[-17,-3],[-17,1],[-17,5],[-16,8],
 [-22,-5],[-26,-8],[-32,-10],[-38,-8],[-42,-3],[-42,3],[-39,9],[-34,14],[-27,17],[-20,18],[-13,17],[-6,16],
 [22,-6],[27,-9],[33,-9],[39,-6],[43,-1],[43,5],[41,10],[37,14],[32,16],[27,15],[23,12],[19,11]];
const types=['shelter','park','manhole','shop','recycle','alley','station','shop','park','shelter','station','alley','recycle','shop','manhole','shop','park','shelter','park','alley','station','park','recycle','shop',
 'park','recycle','alley','shelter','manhole','park','alley','shop','recycle','park','shelter','alley',
 'shop','alley','station','recycle','manhole','shop','alley','shelter','park','station','recycle','shop'];
export const BOARD=TRACK.map(([wx,wz],index)=>({index,wx,wz,x:8+(wx+43)/86*84,y:18+(wz+11)/29*64,type:types[index],...TILE_TYPES[types[index]],area:index>=36?'歓楽街':index>=24?'河川敷':wx<-5?'スラム街':wx>7?'高級住宅街':'商業地区'}));
export const CONNECTIONS=BOARD.map((_,i)=>i<24?[(i+1)%24,(i+23)%24]:[]);
for(const route of [[20,...Array.from({length:12},(_,i)=>24+i),3],[10,...Array.from({length:12},(_,i)=>36+i),7]]){
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i];CONNECTIONS[a].push(b);CONNECTIONS[b].push(a);
 }
}
export const WARP_LINKS={2:40,40:2,14:28,28:14};
export const ROAD_EDGES=CONNECTIONS.flatMap((neighbors,a)=>neighbors.filter(b=>b>a).map(b=>[a,b]));
export const CHARACTER_ART={walker:'./assets/N_default-vJsgtj8j.png',worker:'./assets/N_default-DREVbKsi.png',dreamer:'./assets/N_default-DoPaqDvO.png'};
export const ENEMY_ART='./assets/loanshark-9VOcKl6S.png';
