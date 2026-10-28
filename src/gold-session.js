import {createGoldState,goldRoundPatch,pickupGoldPatch,handleGoldPurchase} from './gold-rules.js';
import {retiredCardCleanupPatch} from './card-balance.js';
// Native movement/warps finish synchronously before arrival processing. Guests only render host state.
export function installGoldSession(store,network,log,sound){
 let queued=false,previous=store.getState();const blocked=new Map();
 const host=()=>network.getState().status!=='connected'||network.getState().isHost;
 function update(){queued=false;let s=store.getState();if(!host()||s.gamePhase!=='playing'||s.gameOver||!s.players.length)return;
  if(!s.goldMode){store.setState(createGoldState(s));log('🥫 金缶争奪戦！ 金缶×3＋対人キル×2。金缶は現地で10P！');s=store.getState();}
  const cleaned=retiredCardCleanupPatch(s);if(cleaned){store.setState(cleaned);log('🎴 廃止済みカードを手札・ショップから除外しました。');s=store.getState();}
  const round=goldRoundPatch(s);if(round){store.setState(round);log(`🥫 富豪が金缶をポイ捨て！ ${round.gold.spot}番で回収屋が10Pで売り出した！`);s=store.getState();}
  const p=s.players[s.turn];if(p?.isCPU)handleGoldPurchase(store,p.userId,network,log,sound);s=store.getState();if(!p||blocked.get(p.id)===p.pos)return;const pickup=pickupGoldPatch(s,p.id);if(pickup){store.setState(pickup);log('🥫 落ちていた金缶を拾った！');}
 }
 store.subscribe(s=>{if(s.gamePhase!=='playing')blocked.clear();for(const p of s.players){const old=previous.players.find(a=>a.id===p.id);if(old&&(p.deaths||0)>(old.deaths||0))blocked.set(p.id,p.pos);else if(old&&old.pos!==p.pos)blocked.delete(p.id);}previous=s;if(!queued){queued=true;queueMicrotask(update);}});
 update();
 return {buy(){const s=store.getState(),p=s.players[s.turn],net=network.getState();if(!p||p.isCPU)return false;if(net.status==='connected'&&!net.isHost){if(p.userId!==net.myUserId)return false;net.hostConnection?.send({type:'REQUEST_ACTION',actionType:'BUY_GOLD',userId:net.myUserId});return true;}return handleGoldPurchase(store,net.status==='connected'?net.myUserId:undefined,network,log,sound);}};
}
