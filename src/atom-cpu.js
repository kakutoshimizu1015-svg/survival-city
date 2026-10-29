import {atomCpuStoryChoice} from './atom-stories.js';
import {atomResource} from './atom-economy.js';
import {isAtom} from './atom-map.js';
import {atomActions,atomActionRequest,executeAtomAction,canAtomAct} from './atom-rules.js';
import {routeTo} from './gold-rules.js';
export function atomCpuStep(store,services){
 const s=store.getState(),p=s.players[s.turn];if(!isAtom(s)||!p?.isCPU||!canAtomAct(s,p))return false;
 const boss=s.atom.boss,unsafe=id=>boss.phase==='locked'&&boss.targets.includes(id)&&s.mapData.find(t=>t.id===id)?.type!=='shelter';
 const actions=atomActions(s,p).filter(a=>p.ap>=a.ap&&p.p>=a.p);
 if(unsafe(p.pos)){
  const exit=actions.find(a=>a.to!=null&&!unsafe(a.to)&&!(a.id==='hot'&&p.hp<=10));if(exit)return executeAtomAction(store,p.id,atomActionRequest(s,exit.id),services);
  const routes=s.mapData.filter(t=>!unsafe(t.id)).map(t=>routeTo(s,p.pos,t.id)).filter(r=>r?.path.length).sort((a,b)=>a.cost-b.cost);
  const cost=(s.isRainy&&!p.rainGear&&p.charType!=='athlete'&&!p.equip?.foldBike?2:1)+(p.nextMoveCostPenalty||0);if(routes[0]&&p.ap>=cost){services.move(routes[0].path[0]);return true;}
 }
 const reclaim=actions.find(a=>a.id==='reclaim'&&(!unsafe(p.pos)||p.hp>60&&p.ap>=4));if(reclaim)return executeAtomAction(store,p.id,atomActionRequest(s,reclaim.id),services);
 const terminal=actions.find(a=>a.id==='terminal');if(terminal&&p.p<20)return executeAtomAction(store,p.id,atomActionRequest(s,terminal.id),services);
 const income=actions.find(a=>a.income&&(!a.income.hp||p.hp>45));
 if(income&&p.p<20)return executeAtomAction(store,p.id,atomActionRequest(s,income.id),services);
 if(p.p<10&&p.hp>=35){
  const routes=s.mapData.filter(t=>!unsafe(t.id)).map(t=>({t,action:atomActions(s,{...p,pos:t.id}).find(a=>a.income&&(!a.income.hp||p.hp>45)),route:routeTo(s,p.pos,t.id)})).filter(x=>x.action&&x.route?.path.length).sort((a,b)=>a.route.cost+a.action.ap-(b.route.cost+b.action.ap));
  const moveCost=(p.charType==='emperor'&&atomResource(s,p,'cans')>=5&&(p.freeMovesThisTurn||0)<6?0:s.isRainy&&!p.rainGear&&p.charType!=='athlete'&&!p.equip?.foldBike?2:1)+(p.nextMoveCostPenalty||0);
  const best=routes.find(x=>x.route.cost+x.action.ap<=p.ap)||routes[0];
  if(best&&p.ap>=moveCost){services.move(best.route.path[0]);return true;}
 }
 const goal=s.gold?.spot??s.gold?.nextSpot,walk=goal!=null?routeTo(s,p.pos,goal):null;
 if(walk){const shortcuts=actions.filter(a=>a.to!=null&&!unsafe(a.to)&&!(a.id==='hot'&&p.hp<=25)).map(a=>({a,cost:(routeTo(s,a.to,goal)?.cost??Infinity)+a.ap})).filter(x=>x.cost+1<walk.cost).sort((a,b)=>a.cost-b.cost);if(shortcuts[0])return executeAtomAction(store,p.id,atomActionRequest(s,shortcuts[0].a.id),services);}
 return false;
}
// Gold pathfinding returns early from the native CPU loop. Resolve its arrival
// dialog here as well, so the next loop check cannot strand a CPU in a choice.
export async function settleAtomCpuEvent(store,choose,wait,random=Math.random){
 const before=store.getState(),actor=before.players[before.turn];if(!isAtom(before)||!actor?.isCPU||(!before.storyActive&&!before.mgActive))return;
 await wait(800);const s=store.getState();if(s.gamePhase!=='playing'||s.gameOver||s.roundCount!==before.roundCount||s.players[s.turn]?.id!==actor.id)return;
 if(s.storyActive)choose(atomCpuStoryChoice(s));
 else if(s.mgActive)store.setState({mgResult:random()>.5?'大成功！':'失敗...',mgActive:false});
 await wait(400);
}
