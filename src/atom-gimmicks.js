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
export const taxiRandomDestinations=(s,p)=>s.mapData.filter(t=>t.id!==p.pos&&t.id!==s.constructionPos);
export function taxiRoutes(s,p){
 const out=taxiRandomDestinations(s,p).length?[{id:'taxi:free',label:'無料便：行き先はおまかせ',detail:'0P・1AP。乗ってからランダムなマスへ。危険な場所に着くこともある。',ap:1,p:0,random:true}]:[];
 const gold=new Set([s.gold?.spot,s.gold?.nextSpot,...Object.entries(s.gold?.drops||{}).filter(([,n])=>n>0).map(([id])=>Number(id))]);
 const candidates=s.mapData.filter(t=>t.id!==p.pos&&t.id!==s.constructionPos&&!gold.has(t.id)&&(t.type==='shop'||t.type==='shelter'||['repair','trial','terminal','reclaim'].includes(t.atomKind)));
 // Stable, geographically spread destinations. The switch changes the paid route.
 candidates.sort((a,b)=>a.id-b.id);const chosen=[];
 for(let sector=0;sector<4;sector++){const group=candidates.filter(t=>t.sector===sector);if(group.length)chosen.push(group[(s.atom?.power||0)%group.length]);}
 for(const t of chosen){const badNpc=['police','uncle','yakuza','loanshark'].some(k=>s[k+'Pos']===t.id&&!(s[k+'Cd']>0)&&s[k+'Hp']!==0);
  out.push({id:'taxi:paid:'+t.id,label:`有料便 → ${t.id}番 ${t.name}`,detail:`3P・1AP。${atomUnsafe(s,t.id)?'⚠ 照射予告中。到着後は退避が必要。':badNpc?'⚠ NPCがいるマス。':'到着先の効果も受ける。'}`,ap:1,p:3,to:t.id});
 }
 return out;
}
