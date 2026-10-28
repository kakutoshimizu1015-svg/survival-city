import {isAtom} from './atom-map.js';
export const ATOM_NPCS={police:'住所確認ドローン',uncle:'故障した検品ロボ',animal:'ケーブル食いロボ',yakuza:'警備アンドロイド',loanshark:'契約回収ロボ',friend:'お世話ロボット',truck:'マザー・ゼロ'};
export function atomText(s,text){if(!isAtom(s))return text;let value=String(text??'');for(const [a,b] of [['仲間のホームレス',ATOM_NPCS.friend],['ゴミ収集車',ATOM_NPCS.truck],['収集車',ATOM_NPCS.truck],['パトカー',ATOM_NPCS.police],['厄介なおじさん',ATOM_NPCS.uncle],['野良動物',ATOM_NPCS.animal],['ヤクザ',ATOM_NPCS.yakuza],['闇金',ATOM_NPCS.loanshark],['病院','無料修理ポッド'],['交番','住所確認ゲート']])value=value.split(a).join(b);return value;}
export function initialAtomState(){return {power:0,nextPower:0,heat:[0,0,0,0],claims:{},boss:{phase:'sleep',targets:[],strikeRound:null,cycle:0,lastSector:null}};}
export function atomActions(s,p){
 if(!isAtom(s)||!p||!s.atom)return [];
 const t=s.mapData.find(t=>t.id===p.pos),a=s.atom,out=[];
 if(t?.atomKind==='taxi')for(const id of (a.power===0?[1,20]:[10,28]).filter(id=>id!==p.pos))out.push({id:'taxi:'+id,label:`空中タクシー → ${id}番`,detail:'1AP・3P / 着地先の効果あり / この街区の熱が上がる',ap:1,p:3,to:id});
 if(t?.atomKind==='switch')out.push({id:'switch',label:'次の路線を切替',detail:`1AP / 次ラウンドから${a.nextPower===0?'南北':'東西'}線へ / 全員が使う路線`,ap:1,p:0});
 if(t?.atomKind==='chute')out.push({id:'chute',label:`非常シュート → ${p.pos===37?10:28}番`,detail:'1AP / 下層へ一方通行 / 着地先の効果あり',ap:1,p:0,to:p.pos===37?10:28});
 if(t?.atomKind==='hot')out.push({id:'hot',label:`原子炉を横断 → ${p.pos===43?53:43}番`,detail:'1AP・HP−10 / 対岸へ近道 / この街区の熱が上がる',ap:1,p:0,to:p.pos===43?53:43});
 if(t?.atomKind==='reclaim'&&a.boss.phase==='cooldown'&&a.claims[p.id]!==a.boss.cycle)out.push({id:'reclaim',label:'廃熱を回収 ＋5P',detail:'1AP / 冷却中に1人1回 / 次の捕捉候補になりやすい',ap:1,p:0});
 return out;
}
export function canAtomAct(s,p){return isAtom(s)&&s.goldMode&&s.gamePhase==='playing'&&!s.gameOver&&!s._roundEndInProgress&&s.diceRolled&&!s.diceAnim?.active&&!s.turnOrderActive&&!s.turnBannerActive&&!s.isBranchPicking&&!s.isDashPicking&&!s.shopActive&&!s.mgActive&&!s.storyActive&&!s.weaponArcData&&p?.id===s.players[s.turn]?.id&&p.hp>0&&!p.cannotMove;}
// State changes and landing are synchronous on the host; request keys reject replay.
export function executeAtomAction(store,actorId,request,{move,damage,log}){
 const s=store.getState(),p=s.players.find(p=>p.id===actorId);if(!canAtomAct(s,p)||request?.round!==s.roundCount||request?.turn!==s.turn||request?.pos!==p.pos||request?.revision!==(s.atom.revision||0))return false;
 const action=atomActions(s,p).find(a=>a.id===request.action);if(!action||p.ap<action.ap||p.p<action.p||action.to!=null&&action.to===s.constructionPos)return false;
 const t=s.mapData.find(t=>t.id===p.pos),heat=[...s.atom.heat];heat[t.sector]=(heat[t.sector]||0)+(action.id==='reclaim'?3:2);
 let atom={...s.atom,heat,revision:(s.atom.revision||0)+1};if(action.id==='switch')atom.nextPower=1-atom.nextPower;
 if(action.id==='reclaim')atom.claims={...atom.claims,[p.id]:atom.boss.cycle};
 store.setState({atom});store.getState().updatePlayer(p.id,e=>({ap:e.ap-action.ap,p:e.p-action.p+(action.id==='reclaim'?5:0)}));
 if(action.id==='hot')damage(p.id,10,'原子炉の熱');
 const alive=store.getState().players.find(a=>a.id===p.id);if(action.to!=null&&alive?.pos===p.pos&&(alive.deaths||0)===(p.deaths||0)){
  store.setState({atomLanding:{playerId:p.id,to:action.to}});try{move(action.to);}finally{store.setState({atomLanding:null});}
 }
 log(`⚛ ${p.name}：${action.label}`);return true;
}
export function atomActionRequest(s,action){return {action,round:s.roundCount,turn:s.turn,pos:s.players[s.turn]?.pos,revision:s.atom?.revision||0};}
export function chooseAtomTarget(s,random=Math.random){
 const a=s.atom,heat=a.heat||[0,0,0,0],scores=heat.map((h,sector)=>({sector,score:h+s.players.filter(p=>s.mapData.find(t=>t.id===p.pos)?.sector===sector).length+(sector===a.boss.lastSector?-2:0)}));scores.sort((a,b)=>b.score-a.score);
 const tied=scores.filter(x=>x.score===scores[0].score),sector=tied[Math.min(tied.length-1,Math.floor(random()*tied.length))].sector;
 const tiles=s.mapData.filter(t=>t.sector===sector&&t.type!=='center');return {sector,targets:tiles.map(t=>t.id)};
}
export function atomThreatText(s){const b=s.atom?.boss;return b?.phase==='locked'?`マザー・ゼロ：R${b.strikeRound}に赤い${b.targets.length}マスを照射` :b?.phase==='cooldown'?'マザー・ゼロ冷却中：回収口で＋5P':'マザー・ゼロ：熱源を観測中';}
export async function advanceAtomThreat(store,nextRound,{beat,damage,wait,log,random=Math.random}){
 let s=store.getState(),a=s.atom||initialAtomState();const boss=a.boss;
 store.setState({truckPos:999,truckForecast:null,atom:{...a,power:a.nextPower,revision:(a.revision||0)+1}});
 if(boss.phase==='locked'&&nextRound>=boss.strikeRound){
  await beat('atom-fire','マザー・ゼロ：照射開始',['赤く予告した街区を照射します'],'atom',1800);
  for(const p of store.getState().players.filter(p=>p.hp>0&&boss.targets.includes(p.pos))){
   const tile=s.mapData.find(t=>t.id===p.pos);let message;
   if(tile?.type==='shelter'||p.respawnShield>0)message='防護区画・復活保護で回避！';
   else if(p.equip?.doll){store.getState().updatePlayer(p.id,e=>({equip:{...e.equip,doll:false}}));message='身代わり人形が信号をそらした！';}
   else{damage(p.id,45,'マザー・ゼロ');const now=store.getState().players.find(a=>a.id===p.id);message=(now.deaths||0)>(p.deaths||0)?'照射で倒れた。修理ポッドで復活。':`照射後 HP ${now.hp}`;}
   log(`⚛ ${p.name}：${message}`);await beat('atom-result',p.name+'の結果',[message],'atom',1900);
  }
  a=store.getState().atom;store.setState({atom:{...a,heat:[0,0,0,0],claims:{},boss:{...boss,phase:'cooldown',targets:[],strikeRound:null,cycle:boss.cycle+1}}});
  await beat('atom-cooldown','マザー・ゼロ冷却中',['回収口で廃熱を集めると＋5P。近づくチャンス。'],'atom',2200);
 }else if(boss.phase!=='locked'){
  s=store.getState();const target=chooseAtomTarget(s,random);a=s.atom;
  store.setState({atom:{...a,boss:{...boss,phase:'locked',targets:target.targets,lastSector:target.sector,strikeRound:nextRound+1}}});
  await beat('atom-warning','マザー・ゼロが熱源を捕捉',[`R${nextRound+1}開始時に赤いマスを照射。全員に1手番の退避時間。`,'赤いマスから離れるか、防護シェルターへ。'],'atom',2800);
 }
}
export function atomTileDescription(s,t){
 const descriptions={taxi:'空飛ぶ乗合タクシー。1AP＋3Pで給電中の停留所へ。行先は「設備」ボタンで選べます。',switch:'1APで次ラウンドの給電路線を切り替える。全員のタクシーの行先が変わります。',chute:'1APで下層へ一方通行。着地点の効果は発生します。',hot:'1APとHP10で原子炉の対岸へ近道。熱が上がり、マザーの捕捉候補になります。',reclaim:'マザーの冷却中だけ、1APで5Pを回収。1人1回。'};
 if(t.atomKind)return descriptions[t.atomKind];
 if(t.type==='shelter')return '防護シェルター。ここにいればマザー・ゼロの照射を必ず回避します。';
 if(t.type==='koban')return '住所確認ゲート。登録住所がないため、このターンは移動できなくなります。';
 return null;
}
