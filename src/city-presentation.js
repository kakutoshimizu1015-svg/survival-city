import {atomText} from './atom-rules.js';
// Host-owned round beats are synchronized with the game. They do not change damage or movement rules.
let serial=0;
export class RoundCancelled extends Error{constructor(){super('Round presentation cancelled');this.name='RoundCancelled';}}
export function beginRound(store){if(!store.getState().goldMode)return null;const id=Date.now()+':'+(++serial);store.setState({cityRoundId:id,cityBeat:null});return id;}
export async function roundWait(store,id,ms,wait){if(id&&(store.getState().cityRoundId!==id||store.getState().gamePhase!=='playing'))throw new RoundCancelled();await wait(ms);if(id&&(store.getState().cityRoundId!==id||store.getState().gamePhase!=='playing'))throw new RoundCancelled();}
export async function roundBeat(store,id,phase,title,lines,focus,ms,wait){
 if(!id)return;title=atomText(store.getState(),title);lines=lines.map(x=>atomText(store.getState(),x));const pages=Math.max(1,Math.ceil(lines.length/3));
 for(let page=0;page<pages;page++){
  if(store.getState().cityRoundId!==id||store.getState().gamePhase!=='playing')throw new RoundCancelled();
  store.setState({cityBeat:{id:id+':'+(++serial),phase,title:pages>1?`${title} (${page+1}/${pages})`:title,lines:lines.slice(page*3,page*3+3),focus}});
  await roundWait(store,id,ms,wait);
 }
}
export function movingBeat(store,id,vehicle){if(!id)return;store.setState({cityBeat:{id:id+':'+vehicle,phase:vehicle+'-move',title:atomText(store.getState(),vehicle==='truck'?'収集車が通ります':'パトカーが巡回中'),lines:['通りすぎるまで待とう'],focus:vehicle}});}
export async function encounterBeat(store,id,vehicle,before,pos,wait){
 if(!id)return false;let shown=false;
 for(const old of before.filter(p=>p.hp>0&&p.pos===pos)){
  const p=store.getState().players.find(p=>p.id===old.id);if(!p)continue;
  const died=(p.deaths||0)>(old.deaths||0),damage=died?old.hp:Math.max(0,old.hp-p.hp),penalty=(p.penaltyAP||0)-(old.penaltyAP||0),doll=old.equip?.doll&&!p.equip?.doll;
  const blessed=old.godBlessing&&!p.godBlessing;const safe=vehicle==='truck'&&store.getState().goldMode&&store.getState().mapData.find(t=>t.id===pos)?.type==='shelter';const lines=safe?['休憩所にいるので、収集車を必ず回避！']:doll?['身代わり人形が守った！']:blessed?[`神の加護で助かった！ HP ${p.hp}`]:died?['HPが0に。病院で復活します。']:damage?[`HP −${damage}　残り${p.hp}`]:penalty?[`次のサイコロのAP −${penalty}`]:old.respawnShield>0?['復活したばかりなので無傷！']:['ぶつからずにすんだ！'];
  if(died&&(old.goldCans||0)>(p.goldCans||0))lines.push('金缶を1個、道に落とした');
  await roundBeat(store,id,vehicle+'-result',p.name+'の結果',lines,vehicle,2200,wait);shown=true;
 }
 return shown;
}
export function finishRound(store,id){if(!id||store.getState().cityRoundId===id)store.setState({_roundEndInProgress:false,cityBeat:null,cityRoundId:null});}
export function withCombat(store,damage,target,amount,source,attacker=null){
 const before=store.getState();if(!before.goldMode)return damage(target,amount,source,attacker);
 const npc=String(target).startsWith('npc_')?String(target).slice(4):null,victim=npc?null:before.players.find(p=>p.id===target),from=before.players.find(p=>p.id===attacker);
 const pos=npc?before[npc+'Pos']:victim?.pos,hp=npc?before[npc+'Hp']:victim?.hp;
 const result=damage(target,amount,source,attacker);if(!(result>0)||pos==null||!(hp>0))return result;
 const after=store.getState(),next=after.players.find(p=>p.id===target),winner=after.players.find(p=>p.id===attacker);
 const defeated=npc?after[npc+'Hp']<=0:(next?.deaths||0)>(victim?.deaths||0),goldDropped=victim&&defeated?Math.min(1,Math.max(0,(victim.goldCans||0)-(next?.goldCans||0))):0,goldRecovered=from&&victim&&defeated&&from.pos===pos?Math.max(0,(winner?.goldCans||0)-(from.goldCans||0)):0;
 const event={id:Date.now()+':'+(++serial),target,attacker,attackerName:from?.name||null,source:source||'攻撃',pos,fromPos:from?.pos,damage:Math.min(hp,result),defeated,goldDropped,goldRecovered,killPoints:from?Math.min(2,Math.max(0,((winner?.pvpKills||0)-(from.pvpKills||0))*2)):0,name:victim?.name||atomText(after,({police:'パトカー',uncle:'おじさん',yakuza:'ヤクザ',loanshark:'闇金',friend:'仲間'}[npc]||'NPC')),createdAt:Date.now()};
 store.setState({cityCombat:[...(after.cityCombat||[]),event].slice(-16)});return result;
}
