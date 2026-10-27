import {randomCityState} from './city-random.js';
import {goldOpeningHand} from './card-balance.js';
// Pure rules shared by the engine, CPU and UI. No rendering or global store imports.
export const GOLD_PRICE=10;
const safeName=s=>String(s||'プレイヤー').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
export const goldScore=p=>(p.goldCans||0)*3+(p.pvpKills||0)*2;
export const goldCompare=(a,b)=>goldScore(b)-goldScore(a)||(b.p||0)-(a.p||0);
export const goldRankOf=(players,p)=>1+players.filter(other=>goldCompare(other,p)<0).length;
export const sameTeam=(a,b)=>a&&b&&a.id!==b.id&&a.teamColor&&a.teamColor!=='none'&&a.teamColor===b.teamColor;
export function routeTo(s,from,to){
 const queue=[{id:from,path:[],cost:0}],best=new Map([[from,0]]),p=s.players?.find(p=>p.pos===from);
 while(queue.length){queue.sort((a,b)=>a.cost-b.cost);const q=queue.shift();if(q.id===to)return q;const tile=s.mapData.find(t=>t.id===q.id);for(const id of tile?.next||[]){if(id===s.constructionPos)continue;const cost=q.cost+(s.isRainy&&!p?.rainGear&&p?.charType!=='athlete'&&!p?.equip?.foldBike?2:1);if(cost<(best.get(id)??Infinity)){best.set(id,cost);queue.push({id,path:[...q.path,id],cost});}}}return null;
}
export function chooseGoldSpot(s,random=Math.random){
 const recent=new Set([s.gold?.lastSpot,...(s.gold?.history||[])]);
 const candidates=s.mapData.filter(t=>!['center','koban','manhole','event'].includes(t.type)&&!s.players.some(p=>p.pos===t.id)&&t.id!==s.constructionPos).map(t=>{const ds=s.players.map(p=>routeTo(s,p.pos,t.id)?.cost??Infinity);return {id:t.id,ds};}).filter(t=>t.ds.length&&t.ds.every(Number.isFinite));
 const fresh=candidates.filter(t=>!recent.has(t.id)),pool=fresh.length?fresh:candidates.filter(t=>t.id!==s.gold?.lastSpot);
 const score=t=>Math.abs(Math.min(...t.ds)-5)*2+(Math.max(...t.ds)-Math.min(...t.ds))*.7+Math.max(...t.ds)*.1;
 pool.sort((a,b)=>score(a)-score(b));
 // Draw from a fair band, rather than using randomness only for exact ties.
 const shortlist=pool.filter(t=>score(t)<=score(pool[0])+8).slice(0,16);
 return shortlist[Math.min(shortlist.length-1,Math.floor(random()*shortlist.length))]?.id??null;
}
export function createGoldState(s,random=Math.random){
 const state={...s,goldMode:true,gold:{version:1,spot:null,lastSpot:null,nextRound:1,issued:0,drops:{},history:[]},players:s.players.map(p=>({...p,hand:goldOpeningHand(p.hand,random),goldCans:0,pvpKills:0,npcKills:0}))};
 state.gold.spot=chooseGoldSpot(state,random);return {...randomCityState(state,random),goldMode:true,gold:state.gold,players:state.players};
}
export function canBuyGold(s,id){const p=s.players[s.turn];return !!(s.goldMode&&!s.gameOver&&!s._roundEndInProgress&&!s.mgActive&&!s.storyActive&&!s.shopActive&&!s.weaponArcData&&!s.diceAnim?.active&&p?.id===id&&p.hp>0&&s.gold?.spot!=null&&p.pos===s.gold.spot&&p.p>=GOLD_PRICE);}
export function buyGoldPatch(s,id){
 if(!canBuyGold(s,id))return null;
 return {players:s.players.map(p=>p.id===id?{...p,p:p.p-GOLD_PRICE,goldCans:(p.goldCans||0)+1}:p),gold:{...s.gold,spot:null,lastSpot:s.gold.spot,history:[...(s.gold.history||[]),s.gold.spot].slice(-3),nextRound:s.roundCount+1,issued:s.gold.issued+1}};
}
export function goldDeathPatch(s,victimId,attackerId,deathTile){
 if(!s.goldMode||!s.gold)return null;
 const victim=s.players.find(p=>p.id===victimId),attacker=s.players.find(p=>p.id===attackerId);
 if(!victim)return null;
 const pvp=attacker&&attacker.id!==victimId&&!sameTeam(attacker,victim),lost=Math.min(1,victim.goldCans||0),drops={...s.gold.drops};
 if(!pvp&&lost)drops[deathTile]=(drops[deathTile]||0)+lost;
 return {players:s.players.map(p=>p.id===victimId?{...p,goldCans:(p.goldCans||0)-lost}:pvp&&p.id===attacker.id?{...p,goldCans:(p.goldCans||0)+lost,pvpKills:(p.pvpKills||0)+1}:p),gold:{...s.gold,drops}};
}
export function onGoldDeath(store,victimId,attackerId,deathTile,log){
 const before=store.getState(),patch=goldDeathPatch(before,victimId,attackerId,deathTile);if(!patch)return;
 const victim=before.players.find(p=>p.id===victimId),attacker=before.players.find(p=>p.id===attackerId),pvp=attacker&&attacker.id!==victimId&&!sameTeam(attacker,victim),lost=Math.min(1,victim.goldCans||0);
 store.setState(patch);log(pvp?`⚔️ ${safeName(attacker.name)}が${safeName(victim.name)}を撃破！ +2点${lost?'・金缶を1個奪った！':'（相手の金缶は0個）'}`:lost?`🥫 ${safeName(victim.name)}が金缶を1個、${deathTile}番に落とした！`:'☠️ 復活して再挑戦！');
}
export function goldRoundPatch(s,random=Math.random){if(!s.goldMode||!s.gold||s.gold.spot!=null||s.roundCount<s.gold.nextRound||s.roundCount>=s.maxRounds)return null;const spot=chooseGoldSpot(s,random);return spot==null?null:{gold:{...s.gold,spot}};}
export function pickupGoldPatch(s,id){const p=s.players.find(p=>p.id===id),amount=s.gold?.drops?.[p?.pos]||0;if(!s.goldMode||!p||!amount||s.gameOver||p.hp<=0)return null;const drops={...s.gold.drops};delete drops[p.pos];return {gold:{...s.gold,drops},players:s.players.map(a=>a.id===id?{...a,goldCans:(a.goldCans||0)+amount}:a)};}
export function goldStandings(s,emoji={}){
 const results=s.players.map(p=>({...p,totalScore:goldScore(p),goldValue:(p.goldCans||0)*3,killBonus:(p.pvpKills||0)*2,emoji:emoji[p.charType]||'👤'})).sort(goldCompare);
 const isTeamGame=results.some(p=>p.teamColor&&p.teamColor!=='none'),groups=new Map();
 if(isTeamGame)for(const p of results){const key=p.teamColor==='none'||!p.teamColor?'solo:'+p.id:p.teamColor;const team=groups.get(key)||{key,color:p.teamColor||'none',total:0,p:0,members:[]};team.total+=p.totalScore;team.p+=p.p;team.members.push(p);groups.set(key,team);}
 const sortedTeams=[...groups.values()].sort((a,b)=>b.total-a.total||b.p-a.p);
 const winners=isTeamGame?sortedTeams.filter(t=>t.total===sortedTeams[0].total&&t.p===sortedTeams[0].p).flatMap(t=>t.members.map(p=>p.id)):results.filter(p=>p.totalScore===results[0]?.totalScore&&p.p===results[0]?.p).map(p=>p.id);
 return {goldMode:true,results,isTeamGame,sortedTeams,winnerIds:winners};
}
export function finishGoldGame(store,{network,profile,saveWin,log,emoji}){
 const s=store.getState();if(s.gameOver)return;const result=goldStandings(s,emoji);
 const awards=[['tiles','最多移動賞'],['cards','カードマスター'],['cans','空き缶王'],['trash','ゴミ漁り名人'],['shopP','爆買い王'],['jobs','バイト王'],['territories','不動産王'],['minigames','ミニゲーム王']].map(([key,name])=>{const value=Math.max(0,...s.players.map(p=>p.gameStats?.[key]||0)),winners=value?s.players.filter(p=>p.gameStats?.[key]===value):[];return {key,name,desc:'称号のみ・得点加算なし',value,winners:winners.map(p=>p.id),winnerNames:winners.map(p=>p.name).join(' と ')||'該当者なし'};});
 store.setState({gameOver:true,awardsActive:true,awardsData:awards,pendingGameResult:result,goldOffer:null});
 log(`🏆 金缶争奪戦 終了！ 金缶×3＋対人キル×2（同点は所持P）`);
 const net=network.getState(),me=result.results.find(p=>net.status==='connected'?p.userId===net.myUserId:!p.isCPU&&p.name===profile.getState().playerName);
 if(me){if(result.winnerIds.includes(me.id))saveWin(me.totalScore);profile.getState().addGachaAssets(me.cans,me.totalScore);}
}
// Called by the host only; never trusts a client-supplied player id, price or amount.
export function handleGoldPurchase(store,userId,network,log,sound=()=>{}){const s=store.getState(),p=s.players[s.turn];if(network.getState().status==='connected'&&(!network.getState().isHost||p?.userId!==userId))return false;const patch=p&&buyGoldPatch(s,p.id);if(!patch)return false;store.setState(patch);log(`🥫 ${safeName(p.name)}が金缶を手に入れた！ −10P / 金缶＋1（3点）`);sound('coin');return true;}
