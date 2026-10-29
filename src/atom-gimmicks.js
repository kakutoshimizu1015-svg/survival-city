import {routeTo} from './gold-rules.js';
import {atomEarning} from './atom-economy.js';
export const TERMINAL_STORY=4;
export const terminalTurn=s=>`${s.roundCount}:${s.turn}`;
export function terminalAvailable(s,p,kind){return !!p&&p.hp>0&&s.mapData.find(t=>t.id===p.pos)?.atomKind==='terminal'&&p.atomTerminalTurn!==terminalTurn(s)&&p.ap>=atomEarning(s,p,kind).ap&&(!atomEarning(s,p,kind).hp||p.hp>atomEarning(s,p,kind).hp);}
export function terminalLabel(s,p,kind){const a=atomEarning(s,p,kind);return `${kind==='repair'?'🔧 安全な点検':'🧪 新薬の実験'}：${a.ap}AP${a.hp?'・HP−'+a.hp:''} → ＋${a.reward}P`;}
export function terminalWork(s,p,kind){
 if(!terminalAvailable(s,p,kind))return '端末は手番に1回。AP・HPを確認してください。';
 const a=atomEarning(s,p,kind);s.updateCurrentPlayer(e=>({ap:e.ap-a.ap,hp:e.hp-(a.hp||0),p:e.p+a.reward,atomTerminalTurn:terminalTurn(s),atomIncomeBonus:false}));
 return `🤖 ${kind==='repair'?'点検完了':'治験完了'}！ ${a.ap}AP${a.hp?'・HP−'+a.hp:''}、＋${a.reward}P。`;
}
export function reclaimOffer(s,p,t){
 const b=s.atom.boss,cool=b.phase==='cooldown',danger=b.phase==='locked'&&b.targets.includes(t.id),key=cool?`cool:${b.cycle}`:terminalTurn(s);
 const used=cool?s.atom.claims?.[p.id]===b.cycle:s.atom.reclaimed?.[p.id]===key;
 if(used)return null;
 return {reward:(cool?15:danger?12:4)+(p.atomIncomeBonus?5:0),key,cool,danger,label:cool?'冷却中の廃熱回収':danger?'危険な廃熱回収':'廃熱回収',detail:cool?'冷却中に1人1回':danger?`R${b.strikeRound}開始に45ダメージ。回収後は赤いマスから逃げよう！`:'自分の手番に1回'};
}
export function atomUnsafe(s,id){return s.atom?.boss.phase==='locked'&&s.atom.boss.targets.includes(id)&&s.mapData.find(t=>t.id===id)?.type!=='shelter';}
export function taxiRoutes(s,p){
 const valid=t=>t.id!==p.pos&&t.id!==s.constructionPos;
 const badNpc=id=>['police','uncle','yakuza','loanshark'].some(k=>s[k+'Pos']===id&&!(s[k+'Cd']>0)&&s[k+'Hp']!==0);
 const drops=Object.entries(s.gold?.drops||{}).filter(([id,n])=>n>0&&Number(id)!==p.pos).map(([id])=>Number(id));
 const gold=[...drops,s.gold?.spot??s.gold?.nextSpot].filter(id=>id!=null&&id!==p.pos&&s.mapData.some(t=>t.id===id&&valid(t)));
 const goal=gold[0],distance=(a,b)=>routeTo(s,a,b)?.cost??Infinity;
 const shelters=s.mapData.filter(t=>valid(t)&&t.type==='shelter'&&!badNpc(t.id)).sort((a,b)=>goal!=null?distance(b.id,goal)-distance(a.id,goal)||a.id-b.id:distance(p.pos,a.id)-distance(p.pos,b.id)||a.id-b.id);
 // The switch swaps the free route; a free landing always protects against irradiation.
 const free=shelters[s.atom?.power===1&&shelters.length>1?1:0];
 let paid=goal!=null?s.mapData.find(t=>t.id===goal):null,reason=drops.includes(goal)?'落ちた金缶':goal!=null?'金缶（購入は別途10P）':'高額報酬';
 if(!paid)paid=s.mapData.filter(t=>valid(t)&&(['trial','terminal'].includes(t.atomKind)||t.atomKind==='reclaim'&&(s.atom?.boss?.phase==='cooldown'||atomUnsafe(s,t.id)))).sort((a,b)=>Number(atomUnsafe(s,a.id))-Number(atomUnsafe(s,b.id))||distance(p.pos,a.id)-distance(p.pos,b.id)||a.id-b.id)[0];
 const out=[];
 if(free)out.push({id:'taxi:free:'+free.id,label:`無料便 → ${free.id}番 防護シェルター`,detail:'0P・1AP。金缶から遠回りでも、照射を必ず回避。',ap:1,p:0,to:free.id});
 if(paid)out.push({id:'taxi:paid:'+paid.id,label:`有料便 → ${paid.id}番 ${reason}`,detail:`3P・1AP。${paid.name}へ直行。${atomUnsafe(s,paid.id)?'⚠ 照射予告中！到着後に退避が必要。':badNpc(paid.id)?'⚠ NPCが待ち構えている。':'到着先の効果も受ける。'}`,ap:1,p:3,to:paid.id});
 return out;
}
