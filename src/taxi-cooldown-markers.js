import {taxiCooldown} from './atom-gimmicks.js';

// Screen-sized badges stay readable at every zoom level without intercepting taps.
export function createTaxiCooldownMarkers(host,map){
 const stands=map.filter(t=>t.atomKind==='taxi');
 if(!stands.length)return {update(){},dispose(){}};
 const layer=document.createElement('div');layer.className='taxi-cooldown-markers';layer.hidden=true;
 const markers=stands.map(tile=>{
  const badge=document.createElement('span');badge.className='taxi-cooldown-marker';badge.dataset.taxiCooldown=String(tile.id);badge.hidden=true;badge.setAttribute('role','img');
  const cross=document.createElement('span');cross.className='taxi-cooldown-cross';cross.textContent='×';cross.setAttribute('aria-hidden','true');
  const counter=document.createElement('span');counter.className='taxi-cooldown-count';counter.setAttribute('aria-hidden','true');
  badge.append(cross,counter);layer.append(badge);return {tile,badge,counter,last:''};
 });
 host.append(layer);
 return {
  update(state,project){
   let active=false;
   for(const marker of markers){
    const cooldown=state&&taxiCooldown(state,marker.tile.id);marker.badge.hidden=!cooldown;
    if(!cooldown)continue;
    active=true;const point=project(marker.tile.col,marker.tile.row);
    marker.badge.style.left=point.x+'px';marker.badge.style.top=point.y+'px';
    const label=`${marker.tile.id}番のタクシーは休止中。${cooldown.text}`;
    if(marker.last!==label){marker.last=label;marker.counter.textContent=`あと${cooldown.remaining}`;marker.badge.setAttribute('aria-label',label);}
   }
   layer.hidden=!active;
  },
  dispose(){layer.remove();}
 };
}
