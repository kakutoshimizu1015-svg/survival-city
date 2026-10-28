import {cardAvailable,goldShopIds,goldShopPrice,shopPurchaseKey,shopVisitKey} from './card-balance.js';
export function shopCatalog(s,p,cards,offer=s.goldShop){return (offer?.ids||[]).filter(id=>cardAvailable(id)&&cards.some(c=>c.id===id)).map(id=>{const c=cards.find(c=>c.id===id);return {...c,price:goldShopPrice(c,p),stock:Math.max(0,4-(s.purchasedCards?.[shopPurchaseKey(s,p,id)]||0))};});}
// All prices, stock and inventory changes are computed from the host's current state.
export function shopTransaction(s,cards,action,request={},actorId,random=Math.random){
 const p=s.players[s.turn],key=shopVisitKey(s),offer=s.goldShop?.key===key?s.goldShop:null;
 const fail=message=>({ok:false,message});
 if(!s.goldMode||s.gamePhase!=='playing'||s.gameOver||s._roundEndInProgress||!p||p.id!==actorId)return fail('自分の手番で購入してください。');
 if(s.mapData.find(t=>t.id===p.pos)?.type!=='shop'&&s.shopAccess!==key)return fail('ショップに移動してから開いてください。');
 if(action==='OPEN')return {ok:true,patch:offer?{}:{goldShop:{key,ids:goldShopIds(cards,random),revision:0,shuffled:false,receipts:[]}},message:''};
 if(!offer||request.key!==key)return fail('ショップを開き直してください。');
 const past=offer.receipts.find(r=>r.id===request.id);if(past)return {ok:past.ok,message:past.message,duplicate:true};
 if(typeof request.id!=='string'||request.id.length>100)return fail('購入情報を確認できませんでした。');
 const finish=(ok,message,patch={})=>({ok,message,patch:{...patch,goldShop:{...(patch.goldShop||offer),receipts:[...offer.receipts,{id:request.id,ok,message}].slice(-80)}}});
 if(request.revision!==offer.revision)return finish(false,'品揃えが更新されました。選び直してください。');
 const update=(patch,extra={})=>({...extra,players:s.players.map(a=>a.id===p.id?{...a,...patch}:a),goldShop:{...offer,revision:offer.revision+1}});
 if(action==='BUY'){
  const entries=Object.entries(request.cart||{});if(!entries.length||entries.length>6)return finish(false,'商品を選んでください。');
  const catalog=shopCatalog(s,p,cards,offer),added=[],stock={...s.purchasedCards};let total=0;
  for(const [raw,qty] of entries){const id=Number(raw),c=catalog.find(c=>c.id===id);if(String(id)!==raw||!c||!Number.isInteger(qty)||qty<1||qty>c.stock)return finish(false,'商品の在庫が足りません。');total+=c.price*qty;added.push(...Array(qty).fill(id));const k=shopPurchaseKey(s,p,id);stock[k]=(stock[k]||0)+qty;}
  if(p.hand.length+added.length>(p.maxHand||7))return finish(false,'手札の空きが足りません。');
  if(total>p.p)return finish(false,'所持Pが足りません。');
  const paid=total-(p.charType==='billionaire'?Math.floor(total*.1):0);
  return finish(true,`購入完了：${added.length}枚を手札に追加しました。装備品は手札から使用すると装備されます。`,update({p:p.p-paid,hand:[...p.hand,...added],gameStats:{...p.gameStats,shopP:(p.gameStats?.shopP||0)+paid}},{purchasedCards:stock}));
 }
 if(action==='SELL'){
  const selected=request.selection;if(!Array.isArray(selected)||!selected.length||new Set(selected).size!==selected.length||selected.some(token=>!p.hand.some((id,index)=>token===`${index}_${id}`)))return finish(false,'手札が変わりました。売るカードを選び直してください。');
  const hand=p.hand.filter((id,index)=>!selected.includes(`${index}_${id}`));return finish(true,`${selected.length}枚を売却し、${selected.length*2}P獲得しました。`,update({hand,p:p.p+selected.length*2}));
 }
 if(action==='SHUFFLE'){
  if(offer.shuffled||p.p<3)return finish(false,offer.shuffled?'このターンは品替え済みです。':'所持Pが足りません。');
  const patch=update({p:p.p-3});patch.goldShop={...patch.goldShop,ids:goldShopIds(cards,random),shuffled:true};return finish(true,'商品を入れ替えました。',patch);
 }
 return fail('この操作はできません。');
}
