import {t as cards} from '../assets/cards-BGoWm8gy.js';
import {shopTransaction} from './shop-rules.js';
export function handleShopAction(store,action,payload,actorId){
 const result=shopTransaction(store.getState(),cards,action,payload,actorId);
 if(result.patch)store.setState(result.patch);
 return result;
}
export function requestShopAction(store,network,action,payload){
 const net=network.getState(),s=store.getState(),p=s.players[s.turn];
 if(net.status==='connected'){
  if(!p||p.userId!==net.myUserId)return {ok:false,message:'自分の手番で操作してください。'};
  if(!net.isHost){if(!net.hostConnection?.open)return {ok:false,message:'接続を確認してください。'};net.hostConnection.send({type:'REQUEST_ACTION',actionType:'SHOP_'+action,payload,userId:net.myUserId});return null;}
 }
 return handleShopAction(store,action,payload,p?.id);
}
