import {PixelShop} from './pixel-scenes.js';
import {shopCatalog} from './shop-rules.js';
import {shopVisitKey} from './card-balance.js';
import {requestShopAction} from './shop-session.js';
export function GoldShop({react:R,store,network,cards,close}){
 const h=R.createElement,s=store(),net=network(),p=s.players[s.turn],key=shopVisitKey(s),offer=s.goldShop?.key===key?s.goldShop:null;
 const [mode,setMode]=R.useState('buy'),[cart,setCart]=R.useState({}),[selection,setSelection]=R.useState(new Set()),[pending,setPending]=R.useState(null),[notice,setNotice]=R.useState(''),[retry,setRetry]=R.useState(0);
 const canAct=net.status!=='connected'||p?.userId===net.myUserId;
 R.useEffect(()=>{setCart({});setSelection(new Set());setPending(null);setNotice('');if(canAct){const r=requestShopAction(store,network,'OPEN',{});if(r&&!r.ok)setNotice(r.message);}},[key,canAct,retry]);
 R.useEffect(()=>{if(!pending)return;const receipt=offer?.receipts.find(r=>r.id===pending);if(receipt){setPending(null);setNotice(receipt.message);if(receipt.ok){setCart({});setSelection(new Set());}}},[offer,pending]);
 R.useEffect(()=>{if(!pending)return;const timer=setTimeout(()=>{setPending(null);setNotice('応答を確認できませんでした。現在の手札と所持Pを確認してから操作してください。');},10000);return()=>clearTimeout(timer);},[pending]);
 if(!p)return null;
 if(!canAct||!offer)return h('div',{className:'pixel-scene-overlay'},h('section',{className:'city-shop-loading',role:'dialog','aria-label':'ショップ'},h('p',null,notice||(!canAct?'相手の買い物を待っています…':'ショップの情報を確認中…')),canAct&&h('button',{onClick:()=>setRetry(n=>n+1)},'再接続'),h('button',{onClick:close},'店を出る')));
 const catalog=shopCatalog(s,p,cards),owned=p.hand.map((id,index)=>({...cards.find(c=>c.id===id),uniqueId:`${index}_${id}`,sellPrice:2}));
 const count=Object.values(cart).reduce((a,b)=>a+b,0),total=catalog.reduce((sum,c)=>sum+c.price*(cart[c.id]||0),0);
 function send(action,extra={}){if(pending)return;const id=globalThis.crypto.randomUUID(),payload={id,key,revision:offer.revision,...extra};setPending(id);setNotice('ホストに確認中…');const result=requestShopAction(store,network,action,payload);if(result){setPending(null);setNotice(result.message);if(result.ok){setCart({});setSelection(new Set());}}}
 return h(PixelShop,{react:R,player:p,mode,setMode,catalog,owned,cart,
 add:id=>{const c=catalog.find(c=>c.id===id);if(c&&!pending)setCart(old=>({...old,[id]:Math.min(c.stock,(old[id]||0)+1)}));},
 decrement:id=>setCart(old=>{const next={...old};if(next[id]>1)next[id]--;else delete next[id];return next}),clear:()=>setCart({}),
 total,count,canPay:total<=p.p,capacity:p.maxHand||7,buy:()=>send('BUY',{cart}),sell:()=>send('SELL',{selection:[...selection]}),selection,
 toggleSell:id=>setSelection(old=>{const next=new Set(old);next.has(id)?next.delete(id):next.add(id);return next}),clearSell:()=>setSelection(new Set()),sellTotal:selection.size*2,
 shuffle:()=>send('SHUFFLE'),shuffled:offer.shuffled,shuffling:!!pending,toast:{visible:!!notice,text:notice},close});
}
