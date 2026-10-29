import {reclaimOffer,taxiRoutes,taxiCooldown,taxiRandomDestinations,terminalAvailable,TERMINAL_STORY} from './atom-gimmicks.js';
import {atomEarning,atomEarnKey} from './atom-economy.js';
import {isAtom} from './atom-map.js';
export const ATOM_NPCS={police:'住所確認ドローン',uncle:'故障した検品ロボ',animal:'ケーブル食いロボ',yakuza:'警備アンドロイド',loanshark:'契約回収ロボ',friend:'お世話ロボット',truck:'マザー・ゼロ'};
export function atomText(s,text){if(!isAtom(s))return text;let value=String(text??'');for(const [a,b] of [['仲間のホームレス',ATOM_NPCS.friend],['ゴミ収集車',ATOM_NPCS.truck],['収集車',ATOM_NPCS.truck],['パトカー',ATOM_NPCS.police],['厄介なおじさん',ATOM_NPCS.uncle],['野良動物',ATOM_NPCS.animal],['ヤクザ',ATOM_NPCS.yakuza],['闇金',ATOM_NPCS.loanshark],['病院','無料修理ポッド'],['交番','住所確認ゲート']])value=value.split(a).join(b);return value.replace(/空き缶を(\d+)(?:個|つ)/g,(_,n)=>`${Number(n)*2}Pを`).replace(/ゴミを(\d+)(?:個|つ)/g,(_,n)=>`${Number(n)*3}Pを`).replace(/空き缶[＋+](\d+)/g,(_,n)=>`支援金＋${Number(n)*2}P`).replace(/ゴミ[＋+](\d+)/g,(_,n)=>`報酬＋${Number(n)*3}P`).replace(/缶の加護/g,'資金の加護').replace(/ゴミをいくつ消費して撃つ？/g,'弾代を選んで撃つ？').replace(/発射する缶の数/g,'弾代').replace(/缶バリスタ/g,'電力砲');}
export function initialAtomState(){return {power:0,nextPower:0,heat:[0,0,0,0],claims:{},earned:{},taxiCooldowns:{},boss:{phase:'sleep',targets:[],strikeRound:null,cycle:0,lastSector:null}};}
export function atomActions(s,p){
 if(!isAtom(s)||!p||!s.atom)return [];
 const t=s.mapData.find(t=>t.id===p.pos),a=s.atom,out=[];
 const income=atomEarning(s,p,t?.atomKind);
 if(income&&a.earned?.[atomEarnKey(s,p,t.atomKind)]!==true)out.push({id:t.atomKind,label:`${income.icon} ${income.name} ＋${income.reward}P${income.hp?`・HP−${income.hp}`:''}`,detail:`${income.ap}AP${income.hp?'・HP−'+income.hp:''} / 自分の手番に1回${income.heat?' / ボスに狙われやすくなる':''}`,ap:income.ap,p:0,income});
 if(t?.atomKind==='taxi')out.push(...taxiRoutes(s,p));
 if(t?.atomKind==='terminal'&&(terminalAvailable(s,p,'repair')||terminalAvailable(s,p,'trial')))out.push({id:'terminal',label:'市民サービス端末を使う',detail:'点検か実験を選ぶ。費用を見てから決められる。',ap:0,p:0});
 if(t?.atomKind==='switch')out.push({id:'switch',label:'次の路線を切替',detail:'1AP。次ラウンドから有料便の行き先が切り替わる。',ap:1,p:0});
 if(t?.atomKind==='chute'){const to=t.atomExit??(p.pos===37?10:28);out.push({id:'chute',label:`非常滑り台 → ${to}番`,detail:'1APで下層へ。一方通行。到着先の効果も受ける。',ap:1,p:0,to});}
 if(t?.atomKind==='hot')out.push({id:'hot',label:`原子炉を横断 → ${p.pos===43?53:43}番`,detail:'1AP＋HP10で近道。ボスに狙われやすくなる。',ap:1,p:0,to:p.pos===43?53:43});
 if(t?.atomKind==='reclaim'){const offer=reclaimOffer(s,p,t);if(offer)out.push({id:'reclaim',label:`${offer.label} ＋${offer.reward}P`,detail:`1AP / ${offer.detail}`,ap:1,p:0,offer});}
 return out;
}
export function canAtomAct(s,p){return isAtom(s)&&s.goldMode&&s.gamePhase==='playing'&&!s.gameOver&&!s._roundEndInProgress&&s.diceRolled&&!s.diceAnim?.active&&!s.turnOrderActive&&!s.turnBannerActive&&!s.isBranchPicking&&!s.isDashPicking&&!s.shopActive&&!s.mgActive&&!s.storyActive&&!s.weaponArcData&&!Object.keys(s).some(k=>/^is.*Picking$/.test(k)&&s[k])&&p?.id===s.players[s.turn]?.id&&p.hp>0&&!p.cannotMove;}
// State changes and landing are synchronous on the host; request keys reject replay.
export function executeAtomAction(store,actorId,request,{move,damage,log,random=Math.random}){
 const s=store.getState(),p=s.players.find(p=>p.id===actorId);if(!canAtomAct(s,p)||request?.round!==s.roundCount||request?.turn!==s.turn||request?.pos!==p.pos||request?.revision!==(s.atom.revision||0))return false;
 let action=atomActions(s,p).find(a=>a.id===request.action);if(!action||p.ap<action.ap||p.p<action.p||action.income?.hp&&p.hp<=action.income.hp||action.to!=null&&action.to===s.constructionPos)return false;
 if(action.random){const targets=taxiRandomDestinations(s,p);if(!targets.length)return false;const to=targets[Math.min(targets.length-1,Math.floor(random()*targets.length))].id;action={...action,to,label:`無料便で${to}番に到着！`};}
 if(action.id==='terminal'){store.setState({storyActive:true,storyIndex:TERMINAL_STORY});return true;}
 const t=s.mapData.find(t=>t.id===p.pos),heat=[...s.atom.heat];heat[t.sector]=(heat[t.sector]||0)+(action.income?.heat??(action.id==='reclaim'?3:2));
 let atom={...s.atom,heat,revision:(s.atom.revision||0)+1};if(action.id==='switch')atom.nextPower=1-atom.nextPower;
 if(action.id.startsWith('taxi:'))atom.taxiCooldowns={...atom.taxiCooldowns,[p.pos]:{round:s.roundCount+2,turn:s.turn}};
 if(action.income)atom.earned={...Object.fromEntries(Object.entries(atom.earned||{}).filter(([key])=>key.startsWith(s.roundCount+':'))),[atomEarnKey(s,p,action.id)]:true};
 if(action.id==='reclaim'){if(action.offer.cool)atom.claims={...atom.claims,[p.id]:atom.boss.cycle};else atom.reclaimed={...atom.reclaimed,[p.id]:action.offer.key};}
 store.setState({atom});store.getState().updatePlayer(p.id,e=>({ap:e.ap-action.ap,p:e.p-action.p+(action.income?.reward??(action.offer?.reward??0)),...((action.income||action.id==='reclaim')?{atomIncomeBonus:false}:{})}));
 if(action.income?.hp)store.getState().updatePlayer(p.id,e=>({hp:e.hp-action.income.hp}));
 if(action.id==='hot')damage(p.id,10,'原子炉の熱');
 const alive=store.getState().players.find(a=>a.id===p.id);if(action.to!=null&&alive?.pos===p.pos&&(alive.deaths||0)===(p.deaths||0)){
  store.setState({atomLanding:{playerId:p.id,to:action.to}});try{move(action.to);}finally{store.setState({atomLanding:null});}
 }
 log(`⚛ ${p.name}：${action.label}${action.id.startsWith('taxi:')?` ／ ${p.pos}番の乗り場は全員2ターン休止（R${s.roundCount+2}の${s.turn+1}番手から再開）`:''}`);return true;
}
export function atomActionRequest(s,action){return {action,round:s.roundCount,turn:s.turn,pos:s.players[s.turn]?.pos,revision:s.atom?.revision||0};}
export function chooseAtomTarget(s,random=Math.random){
 const a=s.atom,heat=a.heat||[0,0,0,0],scores=heat.map((h,sector)=>({sector,score:h+s.players.filter(p=>s.mapData.find(t=>t.id===p.pos)?.sector===sector).length+(sector===a.boss.lastSector?-2:0)}));scores.sort((a,b)=>b.score-a.score);
 const tied=scores.filter(x=>x.score===scores[0].score),sector=tied[Math.min(tied.length-1,Math.floor(random()*tied.length))].sector;
 const tiles=s.mapData.filter(t=>t.sector===sector&&t.type!=='center');return {sector,targets:tiles.map(t=>t.id)};
}
export function atomThreatText(s){const b=s.atom?.boss;return b?.phase==='locked'?`マザー・ゼロ：R${b.strikeRound}に赤い${b.targets.length}マスを照射` :b?.phase==='cooldown'?'マザー・ゼロ冷却中：回収口で＋15P':'マザー・ゼロ：熱源を観測中';}
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
  await beat('atom-cooldown','マザー・ゼロ冷却中',['回収口で廃熱を集めると＋15P。近づくチャンス。'],'atom',2200);
 }else if(boss.phase!=='locked'){
  s=store.getState();const target=chooseAtomTarget(s,random);a=s.atom;
  store.setState({atom:{...a,boss:{...boss,phase:'locked',targets:target.targets,lastSector:target.sector,strikeRound:nextRound+1}}});
  await beat('atom-warning','マザー・ゼロが熱源を捕捉',[`R${nextRound+1}開始時に赤いマスを照射。全員に1手番の退避時間。`,'赤いマスから離れるか、防護シェルターへ。'],'atom',2800);
 }
}
export function atomTileDescription(s,t){
 if(t.atomKind==='taxi'&&taxiCooldown(s,t.id))return taxiCooldown(s,t.id).text+'。この乗り場は全員、無料・有料とも利用できません。';
 if(t.atomKind==='taxi')return taxiRoutes(s,{...(s.players?.[s.turn]||{}),pos:t.id}).map(a=>`${a.label}。${a.detail}`).join(' ／ ');
 const descriptions={
  repair:'2APで6Pをもらう。自分の手番に1回。',
  siphon:'1APで5Pをもらう。この地域がボスに狙われやすくなる。手番に1回。',
  trial:'2AP＋HP15で12Pをもらう。HP16以上が必要。手番に1回。',
  terminal:'安全な点検：2APで6P。新薬の実験：2AP＋HP15で12P。どちらかを手番に1回。',
  switch:'1APで有料タクシーの路線を切替。次ラウンドから別の候補へ。',
  chute:`1APで${t.atomExit??(t.id===37?10:28)}番へ滑り降りる。逆向きには戻れない。`,
  hot:`1AP＋HP10で${t.id===43?53:43}番へ近道。ボスに狙われやすくなる。`,
  reclaim:s.atom?.boss.phase==='cooldown'?'1APで15P。冷却中に1人1回。':s.atom?.boss.phase==='locked'&&s.atom.boss.targets.includes(t.id)?`1APで12P。R${s.atom.boss.strikeRound}開始に照射！回収後に逃げよう。手番に1回。`:'1APで4P。手番に1回。照射予告中は12P、冷却中は15P。'
 };
 if(t.atomKind)return descriptions[t.atomKind];
 if(t.noTerritory)return '高低差をつなぐ通路。土地にはできない。';
 if(t.type==='shelter')return 'ここにいれば、マザー・ゼロの攻撃を必ずよける。';
 if(t.type==='koban')return 'このターンは移動できなくなる。';
 return null;
}

export function atomTileNotes(t){
 return {
  repair:'安全靴なら1AP。スカベンジャーなら報酬＋3P。',
  siphon:'盗電で地域の熱が上がる。次のボスの攻撃先に選ばれやすくなる。',
  trial:'HPの消費は装備で軽減できない。営業マンなら報酬＋2P。',
  taxi:'利用した乗り場は全員2ターン休止（全員が2周）。別の乗り場は利用できる。無料便は乗るまで行き先不明。有料便はマップ上の候補から選ぶ。金缶の販売・落下・出現予告マスには行かない。どちらも到着先の効果を受ける。',
  switch:'切替前にもう一度使うと元に戻る。使うとボスに狙われやすくなる。',
  chute:'着いたマスの効果も受ける。使うとボスに狙われやすくなる。',
  hot:'着いたマスの効果も受ける。HPが足りないと倒れるので注意。',
  terminal:'安全靴・修理や実験のキャラ特典・次の稼ぎ＋5Pが有効。別の端末に行っても手番に1回。HP16以上で実験できる。',
  reclaim:'回収口を変えても回数は共通。予告中の回収では退避のAPを残そう。冷却中の回収は別枠。',
 }[t.atomKind]|| (t.type==='shelter'?'ほかの敵やプレイヤーの攻撃は防げない。':'');
}
