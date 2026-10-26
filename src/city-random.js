// Random decisions are made by the host and the resulting state is shared with guests.
export const NPC_KEYS=['truck','police','uncle','animal','yakuza','loanshark','friend'];
const pick=(xs,random)=>xs[Math.min(xs.length-1,Math.floor(random()*xs.length))];
export function randomCityState(s,random=Math.random){
 const occupied=new Set(s.players.map(p=>p.pos)),near=new Set(occupied);
 // Keep the opening safe even on roads whose arrows point toward a starting pawn.
 for(const t of s.mapData)if(occupied.has(t.id)||t.next.some(id=>occupied.has(id))){near.add(t.id);for(const id of t.next)near.add(id);}
 const free=s.mapData.filter(t=>!near.has(t.id)&&t.id!==s.gold?.spot&&t.type!=='center');
 const fallback=s.mapData.filter(t=>!occupied.has(t.id)&&t.type!=='center');
 const used=new Set(),patch={npcRouteBias:{}};
 for(const key of NPC_KEYS){const choices=(free.filter(t=>!used.has(t.id)).length?free:fallback).filter(t=>!used.has(t.id));const tile=pick(choices,random);patch[key+'Pos']=tile?.id??999;if(tile)used.add(tile.id);patch[key+'PrevPos']=-1;}
 for(const t of s.mapData)patch.npcRouteBias[t.id]=Object.fromEntries(t.next.map(id=>[id,.5+random()*1.5]));
 return patch;
}
export function pickNpcNext(s,pos,previous=-1,random=Math.random,visits={}){
 const tile=s.mapData.find(t=>t.id===pos);if(!tile?.next.length)return pos;
 let options=tile.next.filter(id=>id!==previous&&id!==s.constructionPos);
 if(!options.length)options=tile.next.filter(id=>id!==s.constructionPos);
 if(!options.length)return pos;
 const weights=options.map(id=>(s.npcRouteBias?.[pos]?.[id]||1)/(1+(visits[id]||0)*2));
 let roll=random()*weights.reduce((a,b)=>a+b,0);for(let i=0;i<options.length;i++){roll-=weights[i];if(roll<0)return options[i];}return options.at(-1);
}
export function npcWalk(s,pos,steps,previous=-1,random=Math.random){
 let current=pos,prev=previous;const hitList=[],visits={[pos]:1};
 for(let i=0;i<steps;i++){const next=pickNpcNext(s,current,prev,random,visits);if(next===current)break;prev=current;current=next;hitList.push(next);visits[next]=(visits[next]||0)+1;}
 return {finalPos:current,finalPrevPos:prev,hitList};
}
