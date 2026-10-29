import {isAtom} from "./atom-map.js";
import {ATOM_NPCS} from "./atom-rules.js";
export const NPC_INFO={truck:{name:'ゴミ収集車',icon:'🚛'},police:{name:'パトカー・警察官',icon:'🚓'},uncle:{name:'厄介なおじさん',icon:'🧓'},animal:{name:'野良動物',icon:'🐀'},yakuza:{name:'ヤクザ',icon:'😎'},loanshark:{name:'闇金',icon:'💼'},friend:{name:'仲間のホームレス',icon:'🤝'}};
export function viewerPlayer(s,userId){return (userId&&s.players.find(p=>p.userId===userId))||(!s.players[s.turn]?.isCPU&&s.players[s.turn])||s.players.find(p=>!p.isCPU)||s.players[s.turn];}
// Describes existing encounter rules; this module never applies effects or consumes equipment.
export function npcImpact(s,key,p=viewerPlayer(s),tile){
 const info=isAtom(s)?{...NPC_INFO[key],name:ATOM_NPCS[key],icon:key==='friend'?'🤖':'⚙'}:NPC_INFO[key];if(!info||!p)return null;
 const result=(tone,desc)=>({...info,key,tone,desc});
 if(isAtom(s)&&key==='animal')return result('neutral','資源拾いのない第0区では作業を妨げない');
 if(isAtom(s)&&key==='friend')return result(p.respawnShield>0?'neutral':'good',p.respawnShield>0?'復活保護中は接触イベントなし':'出会うと支援金2Pをもらえる');
 if(key==='animal')return result(['can','trash'].includes(tile?.type)?'bad':'neutral','同じマスでは缶拾い・ゴミ漁りができない');
 if(key==='truck'){
  if(isAtom(s))return result(tile?.type==='shelter'?'good':'bad',tile?.type==='shelter'?'防護シェルターで照射を必ず回避':`R${s.atom?.boss.strikeRound}開始時に45ダメージ。赤いマスから退避しよう`);
  if(s.goldMode&&tile?.type==='shelter')return result('good','休憩所にいる間は収集車を必ず回避。人形も消費しない');
  if(p.equip?.doll)return result('bad','暴走時は身代わり人形を1個消費して回避');
  if(p.respawnShield>0)return result('neutral','復活無敵でダメージ回避中。通常は暴走時55%で50ダメージ');
  return result('bad','暴走時に接触すると55%で50ダメージ');
 }
 // Patrol collision differs from stepping onto the police tile: a shield does not block AP loss.
 if(key==='police'){
  if(p.respawnShield>0&&p.equip?.doll)return result('bad','進入は復活無敵で回避。巡回中の接触は身代わり人形を消費');
  if(p.respawnShield>0&&p.charType==='survivor')return result('neutral','サバイバーの勘で補導を回避');
  if(p.respawnShield>0&&!p.stealth&&!p.hasID)return result('bad','マスへの進入は復活無敵で回避。巡回中の接触は次回AP−2');
  if(p.respawnShield<=0||!p.respawnShield){
   if(p.equip?.doll)return result('bad','身代わり人形を1個消費して補導を回避');
   if(p.stealth)return result('bad','ステルスを消費して補導を回避');
   if(p.hasID)return result('bad','身分証を消費して補導を回避');
  }
  if(p.charType==='survivor'||p.stealth||p.hasID)return result('neutral','現在は補導を回避できる');
  return result('bad','補導されると次回AP−2');
 }
 if(p.respawnShield>0)return result('neutral','復活無敵中は接触イベントが発生しない');
 if(key==='friend')return result('good','出会うと空き缶を1個もらえる');
 if(key==='uncle')return result(p.hand?.length?'bad':'neutral',p.hand?.length?'手札をランダムに1枚捨てられる':'手札がないため、現在は捨てられるカードなし');
 if(key==='yakuza')return result('bad',p.equip?.doll?'身代わり人形を1個消費して回避':'15〜20ダメージ。手札があれば1枚強奪');
 if(key==='loanshark'){
  if(p.equip?.doll)return result('bad','身代わり人形を1個消費して回避');
  const fee=Math.min(20,Math.floor(p.p*.2));return result(fee>0?'bad':fee<0?'good':'neutral',fee>0?`所持Pの20%（最大20P）を没収。現在は${fee}P`:fee<0?`現在の所持Pでは${-fee}P増える`:'現在の所持Pでは没収額0P');
 }
 return null;
}
export function tileNpcEffects(s,t,p=viewerPlayer(s),visibleKeys){const effects=Object.keys(NPC_INFO).filter(k=>s[k+'Pos']===t.id&&(k==='truck'||(s[k+'Hp']??10)>0)&&(!visibleKeys||visibleKeys.includes(k))).map(k=>npcImpact(s,k,p,t)).filter(Boolean);if(isAtom(s)&&s.atom?.boss.phase==='locked'&&s.atom.boss.targets.includes(t.id)){const effect=npcImpact(s,'truck',p,t);if(effect)effects.unshift(effect);}return effects;}
export function impactTone(effects){return effects.some(e=>e.tone==='bad')?'bad':effects.some(e=>e.tone==='good')?'good':effects.length?'neutral':null;}
