import {routeTo,sameTeam,handleGoldPurchase,goldScore} from './gold-rules.js';
// Gold-aware decisions use the same AP, cards, damage and movement functions as human play.
export function goldCpuStep(store,{cards,useCard,damage,move,exchange,job,network,log,sound}){
 const s=store.getState(),p=s.players[s.turn];if(!s.goldMode||!p?.isCPU||s.gameOver||s._roundEndInProgress)return false;
 if(handleGoldPurchase(store,p.userId,network,log,sound))return true;
 const tile=s.mapData.find(t=>t.id===p.pos);if(!tile)return false;
 if(tile.type==='exchange'&&(p.cans||p.trash)){exchange();return true;}
 if(p.hp<45){const heal=p.hand.findIndex(id=>cards.find(c=>c.id===id)?.type==='heal');if(heal>=0){useCard(heal,p.hand[heal]);return true;}}
 const enemies=s.players.filter(t=>t.id!==p.id&&!sameTeam(p,t)&&t.hp>0&&!t.respawnShield);
 const weapons=p.hand.map((id,index)=>({card:cards.find(c=>c.id===id),index})).filter(w=>w.card?.type==='weapon'&&w.card.dmg>0);
 if(p.ap>=2){const attacks=weapons.flatMap(w=>enemies.filter(t=>(routeTo(s,p.pos,t.pos)?.path.length??Infinity)<=w.card.range).map(t=>({...w,target:t,value:(t.hp<=w.card.dmg?100:0)+(t.goldCans||0)*12+goldScore(t)*2-w.card.range}))).sort((a,b)=>b.value-a.value);
  if(attacks.length){const {card,index,target}=attacks[0];useCard(index,card.id);if(store.getState().weaponArcData){store.setState({weaponArcData:null});window.cityProjection?.playAttack({playerId:p.id,card,targetPos:target.pos});const hit=card.aoe?enemies.filter(t=>(routeTo(s,p.pos,t.pos)?.path.length??Infinity)<=card.range):[target];for(const t of hit)damage(t.id,card.dmg,card.name,p.id);return true;}}
 }
 if(tile.type==='job'&&p.p<10&&p.ap>=3){job();return true;}
 // Fall back to native survival/economic actions when already at a useful space.
 if((p.hp<45&&tile.type==='center')||(p.p<10&&['job','can','trash','exchange'].includes(tile.type))||(weapons.length===0&&tile.type==='shop'))return false;
 const goals=[];
 if(p.hp<35)for(const t of s.mapData.filter(t=>t.type==='center'))goals.push({id:t.id,value:100});
 for(const [id,n] of Object.entries(s.gold.drops))if(n>0)goals.push({id:Number(id),value:70});
 if(s.gold.spot!=null&&p.p>=10)goals.push({id:s.gold.spot,value:50});
 if(weapons.length)for(const t of enemies)if(t.goldCans>0||t.hp<=weapons[0].card.dmg)goals.push({id:t.pos,value:35+(t.goldCans||0)*8});
 if(p.p<10)for(const t of s.mapData.filter(t=>t.type==='job'||t.type==='exchange'&&(p.cans||p.trash)))goals.push({id:t.id,value:45});
 const routes=goals.map(g=>({...g,route:routeTo(s,p.pos,g.id)})).filter(g=>g.route?.path.length).sort((a,b)=>b.value/(b.route.cost+2)-a.value/(a.route.cost+2));
 if(!routes.length||p.cannotMove)return false;const next=routes[0].route.path[0];const cost=(s.isRainy&&!p.rainGear&&p.charType!=='athlete'&&!p.equip?.foldBike?2:1)+(p.nextMoveCostPenalty||0);if(p.ap<cost)return false;
 move(next);return true;
}
