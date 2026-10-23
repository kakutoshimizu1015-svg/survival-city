import { BOARD, CONNECTIONS, WARP_LINKS } from './board.js';
export const VERSION = 4;
export const GOAL = 200;
export const ROLES = [
  { id: 'walker', name: '缶拾いの亡霊', subtitle: '社会の底にも、拾えるものはある。', perk: '缶拾い +1個。特殊スキル：ゴミ漁りで缶 +3個。', skill: 'ゴミ山の錬金術', skillText: '空き缶 +3個 / 体力・行動消費なし', icon: 'compass' },
  { id: 'worker', name: '元・取り立て屋', subtitle: '履歴書に書けない特技がある。', perk: 'バイト報酬 +3P。特殊スキル：裏の人脈で +15P。', skill: '未払いの回収', skillText: 'お金 +15P / 体力・行動消費なし', icon: 'gun' },
  { id: 'dreamer', name: '無免許の闇医者', subtitle: '保険証不要。品質保証も不要。', perk: '夜の回復 +1。特殊スキル：怪しい処置で体力 +3。', skill: '違法な応急処置', skillText: '体力 +3（上限6）/ 行動消費なし', icon: 'medkit' }
];
export const PERKS = [
  { id: 'cart', name: '無車検リヤカー', text: '缶拾いで見つかる空き缶 +2個', icon: 'cart' },
  { id: 'shoes', name: '逃走用スニーカー', text: 'バイトで消費する体力 −1', icon: 'shoe' },
  { id: 'regular', name: '闇の買取ルート', text: '空き缶の買取価格が 5P → 7P', icon: 'hand' },
  { id: 'lunch', name: '賞味期限の概念なし', text: 'バイトの報酬 +4P', icon: 'bowl' },
  { id: 'bed', name: '最高級ダンボール', text: '毎晩の体力回復 +2', icon: 'moon' },
  { id: 'pocket', name: '出所不明の封筒', text: '今すぐ 25P を受け取る', icon: 'coin' }
];
const WEATHER = [
  { id: 'clear', label: '平常運転', desc: '株価は上がった。あなたの寝床は撤去された。今日も稼ごう。', icon: 'sun' },
  { id: 'market', label: 'エコ企業の広報週間', desc: '地球に優しい顔をする日。空き缶の買取価格 +2P。', icon: 'recycle' },
  { id: 'busy', label: '再開発バブル', desc: '昨日の寝床を今日壊す仕事。バイトの報酬 +5P。', icon: 'flag' },
  { id: 'rain', label: '宴のあと', desc: '富裕層の野外パーティーが終了。缶拾い +2個。', icon: 'cloud' }
];
export function random(state) {
  state.rng = (state.rng + 0x6D2B79F5) >>> 0;
  let t = state.rng;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
export function hashSeed(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function newGame(seed, role = 'walker', mode = 'random') {
  const s = { version: VERSION, seed: String(seed), rng: hashSeed(String(seed)), role: ROLES.some(r => r.id === role) ? role : 'walker', mode, day: 1, actions: 3, money: 0, stamina: 6, cans: 0, perks: [], phase: 'playing', log: [], history: [], visits: {}, offers: [], totalCans: 0, inventory: ['pistol', 'medkit'], skillUsed: false, trades: 0, fights: 0, position: 0, turn: 'roll', die: null, rollCount: 0, totalSteps: 0, laps: 0, remaining: 0, previous: null };
  nextWeather(s);
  return s;
}
function nextWeather(s) {
  const daily = { rng: hashSeed(`${s.seed}:day:${s.day}`) };
  s.weather = s.day === 1 ? 'clear' : WEATHER[Math.floor(random(daily) * WEATHER.length)].id;
  s.jobPay = 14 + Math.floor(random(daily) * 5);
  s.findCount = 3 + Math.floor(random(daily) * 3);
  s.visits = {};
  s.skillUsed = false; s.trades = 0;
}
export function weather(s) { return WEATHER.find(w => w.id === s.weather) || WEATHER[0]; }
export function has(s, id) { return s.perks.includes(id); }
export function actionInfo(s, id) {
  const pay = s.jobPay + (s.role === 'worker' ? 3 : 0) + (has(s, 'lunch') ? 4 : 0) + (s.weather === 'busy' ? 5 : 0);
  const count = s.findCount + (s.role === 'walker' ? 1 : 0) + (has(s, 'cart') ? 2 : 0) + (s.weather === 'rain' ? 2 : 0);
  const price = (has(s, 'regular') ? 7 : 5) + (s.weather === 'market' ? 2 : 0);
  return {
    park: { name: '空き缶を拾う', place: '立入禁止の河川敷', type: 'COLLECT', icon: 'can', desc: '資源を拾えば環境活動家。住みつけば不審者。今日も缶を拾う。', gain: `空き缶 +${count}個`, cost: 1, count, enabled: s.stamina >= 1 },
    shop: { name: 'バイトをする', place: '人材使い捨て商店', type: 'WORK', icon: 'case', desc: '福利厚生は「やりがい」。賃金だけは、その場でもぎ取れ。', gain: `お金 +${pay}P`, cost: has(s, 'shoes') ? 1 : 2, pay, enabled: s.stamina >= (has(s, 'shoes') ? 1 : 2) },
    recycle: { name: '空き缶を売る', place: '闇の買取所', type: 'RECYCLE', icon: 'recycle', desc: `持っている空き缶をすべて換金。今日の買取価格は1個 ${price}P。`, gain: `お金 +${s.cans * price}P`, cost: 0, price, enabled: s.cans > 0 },
    shelter: { name: 'ひと休みする', place: '高架下のねぐら', type: 'REST', icon: 'bowl', desc: 'ダンボール一枚の不動産。管理費ゼロ、立退きリスク無限。体力を戻す。', gain: `体力 +${Math.min(4, 6 - s.stamina)}`, cost: 0, enabled: s.stamina < 6 },
    alley: { name: '路地裏をのぞく', place: 'ブラック横丁', type: 'CHANCE', icon: 'spark', desc: '闇バイト、拾得物、出所不明の武器。履歴書に残らない選択を。', gain: '金・武器・リスクから選ぶ', cost: 1, enabled: s.stamina >= 1 },
    manhole: { name: `${BOARD[WARP_LINKS[s.position]]?.area || '別の街区'}へワープ`, place: '市営・非公式地下道', type: 'WARP', icon: 'warp', desc: '地下には住所も入場審査もない。別のマンホールへ移動して、この手番を終える。', gain: '地下道で移動・手番終了', cost: 0, enabled: true },
    station: { name: '取り立て屋と対峙', place: '治安の悪い駅前', type: 'COMBAT', icon: 'gun', desc: '「路上にも家賃はある」と取り立て屋。銃で撃退、殴り合い、逃走。選ぶのはあなただ。', gain: '武器と選択で報酬が変わる', cost: 0, enabled: true }
  }[id];
}
export function canAct(s, id) { return s.phase === 'playing' && s.turn === 'landed' && s.actions > 0 && BOARD[s.position]?.type === id && !!actionInfo(s, id)?.enabled; }
export function act(state, id, choice) {
  const s = structuredClone(state);
  if (!canAct(s, id)) return state;
  const a = actionInfo(s, id);
  if (id === 'alley' && !['safe', 'risk', 'loot'].includes(choice)) return state;
  if (id === 'alley' && choice === 'loot' && s.inventory.length >= 4) return state;
  if (id === 'station' && !['flee', 'fight', 'pistol', 'shotgun'].includes(choice)) return state;
  if (id === 'station' && ['pistol', 'shotgun'].includes(choice) && !s.inventory.includes(choice)) return state;
  s.stamina -= a.cost;
  
  s.visits[id] = (s.visits[id] || 0) + 1;
  const before = { money: s.money, cans: s.cans, stamina: state.stamina };
  let message;
  if (id === 'manhole') { s.position = WARP_LINKS[s.position]; message = `地下道を抜けて${BOARD[s.position].area}へ。家賃ゼロの地下鉄。次のサイコロはここから。`; }
  if (id === 'park') { s.cans += a.count; s.totalCans += a.count; message = `空き缶を${a.count}個確保。街のゴミは減ったが、社会的信用は増えない。`; }
  if (id === 'shop') { s.money += a.pay; message = `日雇いで${a.pay}P。「君の代わりはいくらでもいる」らしい。`; }
  if (id === 'recycle') { const earned = s.cans * a.price; s.money += earned; s.cans = 0; message = `空き缶をまとめて換金。${earned}Pを受け取った！`; }
  if (id === 'shelter') { s.stamina = Math.min(6, s.stamina + 4); message = '高架下で野宿。ダンボールの断熱性能だけは、信用できる。'; }
  if (id === 'station') {
    if (choice === 'flee') { s.money += 6; message = '取り立て屋から逃げた。途中で6P拾った。今日はプライドより現金。'; }
    else if (choice === 'pistol' || choice === 'shotgun') {
      s.inventory.splice(s.inventory.indexOf(choice), 1);
      const pay = choice === 'shotgun' ? 48 : 32;
      s.money += pay; s.fights += 1;
      message = `${choice === 'shotgun' ? 'ショットガン' : '錆びた拳銃'}で取り立て屋を撃退。巻き上げていた${pay}Pを回収。「自己責任」の適用先が変わった。`;
    } else if (random(s) < .5) { s.money += 25; s.fights += 1; message = '殴り合いに勝って25Pを奪還。対話には拳という方言もある。'; }
    else { message = suffer(s, '殴り合いに負けた。', 8, 2); }
  }
  if (id === 'alley') {
    if (choice === 'safe') { s.money += 12; message = '中身を聞かずに荷物を運び、12P。知らないことは、時に福利厚生。'; }
    else if (choice === 'loot') { const id = ['pistol', 'shotgun', 'medkit', 'shield'][Math.floor(random(s) * 4)]; s.inventory.push(id); message = `ゴミ山から「${ITEMS.find(i => i.id === id).name}」を回収。分別ルールには載っていない。`; }
    else if (random(s) < 0.5) { s.money += 35; message = '闇取引が成功。35Pを手に入れた。領収書の宛名は、聞かれなかった。'; }
    else { message = suffer(s, '闇取引は詐欺だった。', 8, 1); }
  }
  const entry = { day: s.day, id, message, money: s.money - before.money, cans: s.cans - before.cans, stamina: s.stamina - before.stamina };
  s.log.unshift(entry); s.log = s.log.slice(0, 30);
  return endTurn(s);
}
export function finishDay(state) {
  if (state.phase !== 'night') return state;
  const s = structuredClone(state);
  s.history.push({ day: s.day, money: s.money, cans: s.cans });
  if (s.day === 7) { s.phase = 'ended'; return s; }
  if ([2, 4].includes(s.day)) {
    const pool = PERKS.filter(p => !has(s, p.id)).map(p => p.id);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(random(s) * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    s.offers = pool.slice(0, 3); s.phase = 'perk';
    return s;
  }
  return startDay(s);
}
function startDay(s) {
  s.day += 1;
  s.stamina = Math.min(6, s.stamina + 2 + (s.role === 'dreamer' ? 1 : 0) + (has(s, 'bed') ? 2 : 0));
  s.actions = 3; s.phase = 'playing'; s.offers = []; s.turn = 'roll'; s.die = null;
  nextWeather(s);
  return s;
}
export function choosePerk(state, id) {
  if (state.phase !== 'perk' || !state.offers.includes(id) || has(state, id)) return state;
  const s = structuredClone(state);
  s.perks.push(id);
  if (id === 'pocket') s.money += 25;
  return startDay(s);
}
export function isValidSave(s) {
  if (!s || s.version !== VERSION || !ROLES.some(r => r.id === s.role) || !['playing', 'night', 'perk', 'ended'].includes(s.phase)) return false;
  if (!Number.isInteger(s.day) || s.day < 1 || s.day > 7 || !Number.isInteger(s.actions) || s.actions < 0 || s.actions > 3) return false;
  if (![s.money, s.cans, s.stamina, s.rng, s.jobPay, s.findCount, s.totalCans].every(Number.isInteger) || s.money < 0 || s.cans < 0 || s.stamina < 0 || s.stamina > 6) return false;
  if (!Array.isArray(s.perks) || s.perks.some(id => !PERKS.some(p => p.id === id)) || new Set(s.perks).size !== s.perks.length) return false;
  if (s.phase === 'playing' && s.actions === 0 || s.phase !== 'playing' && s.actions !== 0) return false;
  if (s.phase === 'perk' && (![2, 4].includes(s.day) || !Array.isArray(s.offers) || s.offers.length !== 3 || new Set(s.offers).size !== 3 || s.offers.some(id => s.perks.includes(id)))) return false;
  if (s.phase === 'ended' && s.day !== 7) return false;
  if (!Number.isInteger(s.position) || !BOARD[s.position] || !['roll','choose','landed'].includes(s.turn) || ![s.rollCount,s.totalSteps,s.laps].every(n=>Number.isInteger(n)&&n>=0)) return false;
  if (!Number.isInteger(s.remaining) || s.remaining<0 || s.remaining>6 || (s.turn==='choose' ? s.remaining<1 || s.remaining>s.die : s.remaining!==0)) return false;
  if (s.previous!==null && (!Number.isInteger(s.previous) || !CONNECTIONS[s.position].includes(s.previous) || s.turn!=='choose' || s.remaining>=s.die)) return false;
  if (s.die !== null && (!Number.isInteger(s.die) || s.die < 1 || s.die > 6)) return false;
  if (s.turn !== 'roll' && (s.phase !== 'playing' || s.die === null)) return false;
  if (!Array.isArray(s.inventory) || s.inventory.length > 4 || s.inventory.some(id => !ITEMS.some(i => i.id === id)) || typeof s.skillUsed !== 'boolean' || ![0, 1].includes(s.trades) || !Number.isInteger(s.fights) || s.fights < 0) return false;
  return Array.isArray(s.log) && s.log.every(e => e && typeof e.message === 'string' && Number.isInteger(e.day)) && Array.isArray(s.history) && Array.isArray(s.offers) && s.offers.every(id => PERKS.some(p => p.id === id)) && !!s.visits && WEATHER.some(w => w.id === s.weather) && typeof s.seed === 'string';
}


// Items are single-use cards. Weapons are used only in the station encounter.
export const ITEMS = [
  { id: 'pistol', name: '錆びた拳銃', icon: 'gun', price: 22, text: '取り立て屋を銃撃で撃退。確実に +32P。使用後になくなる。', type: 'weapon' },
  { id: 'shotgun', name: '拾い物のショットガン', icon: 'gun', price: 34, text: '取り立て屋を吹き飛ばして撃退。確実に +48P。使い切り。', type: 'weapon' },
  { id: 'medkit', name: '期限切れ救急キット', icon: 'medkit', price: 12, text: '体力 +3（上限6）。行動回数は消費しない。', type: 'use' },
  { id: 'shield', name: '弁護士の名刺', icon: 'shield', price: 10, text: '闇取引や殴り合いで失敗した時、損失を1回無効化。自動発動。', type: 'passive' }
];
function logExtra(s, message, before) {
  s.log.unshift({ day: s.day, id: 'item', message, money: s.money - before.money, cans: s.cans - before.cans, stamina: s.stamina - before.stamina });
  s.log = s.log.slice(0, 30);
}
function suffer(s, prefix, money, stamina) {
  const shield = s.inventory.indexOf('shield');
  if (shield !== -1) { s.inventory.splice(shield, 1); return `${prefix}弁護士の名刺で損失ゼロ。法律は紙一枚で急に強くなる。`; }
  const loss = Math.min(s.money, money), fatigue = Math.min(s.stamina, stamina);
  s.money -= loss; s.stamina -= fatigue;
  return `${prefix}お金 −${loss}P、体力 −${fatigue}。相談窓口は本日も営業時間外。`;
}
export function canUseSkill(s) { return s.phase === 'playing' && !s.skillUsed && (s.role !== 'dreamer' || s.stamina < 6); }
export function useSkill(state) {
  if (!canUseSkill(state)) return state;
  const s = structuredClone(state); s.skillUsed = true;
  let message;
  if (s.role === 'walker') { s.cans += 3; s.totalCans += 3; message = '【ゴミ山の錬金術】空き缶 +3個。錬金術師の住所は高架下。'; }
  if (s.role === 'worker') { s.money += 15; message = '【未払いの回収】裏の人脈から15P。「立替経費」の精算ということにした。'; }
  if (s.role === 'dreamer') { s.stamina = Math.min(6, s.stamina + 3); message = '【違法な応急処置】体力が戻った。薬の成分は企業秘密。'; }
  logExtra(s, message, state); return s;
}
export function useItem(state, id) {
  if (state.phase !== 'playing' || id !== 'medkit' || !state.inventory.includes(id) || state.stamina === 6) return state;
  const s = structuredClone(state);s.inventory.splice(s.inventory.indexOf(id), 1);s.stamina = Math.min(6, s.stamina + 3);
  logExtra(s, '期限切れ救急キットで体力回復。期限より自分の明日のほうが心配だ。', state);return s;
}
export function discardItem(state, index) {
  if (state.phase !== 'playing' || !Number.isInteger(index) || index < 0 || index >= state.inventory.length) return state;
  const s = structuredClone(state); const [id] = s.inventory.splice(index, 1);
  logExtra(s, `「${ITEMS.find(i => i.id === id).name}」を手放した。持てるものにも限りがある。`, state); return s;
}
export function buyItem(state, id) {
  const item = ITEMS.find(i => i.id === id);
  if (!item || state.phase !== 'playing' || state.trades >= 1 || state.inventory.length >= 4 || state.money < item.price) return state;
  const s = structuredClone(state);s.money -= item.price;s.inventory.push(id);s.trades += 1;
  logExtra(s, `闇市で「${item.name}」を購入。−${item.price}P。返品と身元確認はお断り。`, state);return s;
}
export function migrateSave(s) {
  if (s?.version === 3) {
    const migrated={...s,version:VERSION,remaining:s.turn==='choose'?s.die:0,previous:null};
    return isValidSave(migrated)?migrated:null;
  }
  if (s?.version === 1 || s?.version === 2) {
    const migrated = { ...s, version: VERSION, inventory: s.version === 1 ? ['pistol', 'medkit'] : s.inventory, skillUsed: s.version === 1 ? false : s.skillUsed, trades: s.version === 1 ? 0 : s.trades, fights: s.version === 1 ? 0 : s.fights, position: 0, turn: 'roll', die: null, rollCount: (s.day-1)*3+(3-s.actions), totalSteps: 0, laps: 0, remaining: 0, previous: null };
    return isValidSave(migrated) ? migrated : null;
  }
  return isValidSave(s) ? s : null;
}
function endTurn(s) {
  s.actions -= 1; s.turn = 'roll'; s.remaining=0; s.previous=null;
  if (s.actions === 0) s.phase = 'night';
  return s;
}
export function rollDice(state) {
  if (state.phase !== 'playing' || state.turn !== 'roll' || state.actions <= 0) return state;
  const s = structuredClone(state);
  // Dice depend only on the seed and roll number, never on which event was chosen.
  const diceRng = {rng: hashSeed(`${s.seed}:dice:${s.rollCount}`)};
  s.die = 1 + Math.floor(random(diceRng)*6);s.rollCount += 1;s.turn = 'choose';s.remaining=s.die;s.previous=null;
  return s;
}
// A segment stops at the next junction, keeping the unused die steps in the save.
export function routeChoices(s) {
  if(s.phase!=='playing'||s.turn!=='choose'||!s.remaining)return [];
  return CONNECTIONS[s.position].filter(n=>n!==s.previous).map((first,i)=>{
    const path=[first];let previous=s.position,current=first;
    while(path.length<s.remaining){
      const exits=CONNECTIONS[current].filter(n=>n!==previous);
      if(exits.length!==1)break;
      previous=current;current=exits[0];path.push(current);
    }
    const remaining=s.remaining-path.length;
    const label=first>=24?`${BOARD[first].area}へ`:s.position>=24?'市街地へ':s.previous!==null?`${String(first+1).padStart(2,'0')}番方面`:i===0?'↻ 右まわり':'↺ 左まわり';
    return {id:[1,-1,2][i],first,path,target:current,remaining,label};
  });
}
export function pathFor(s, direction) { return routeChoices(s).find(r=>r.id===direction)?.path || []; }
export function movePlayer(state, direction) {
  const route=routeChoices(state).find(r=>r.id===direction);
  if(!route)return state;
  const s=structuredClone(state),path=route.path,before=structuredClone(state);
  s.position=route.target;s.totalSteps+=path.length;s.remaining=route.remaining;
  s.previous=s.remaining?(path.length>1?path.at(-2):state.position):null;
  s.turn=s.remaining?'choose':'landed';
  let message=s.remaining?`分岐点。あと${s.remaining}マス、進む道を選ぼう。`:`${BOARD[s.position].area}の「${BOARD[s.position].name}」に到着。`;
  if(path.includes(0)){
    const sold=s.cans*actionInfo(s,'recycle').price;s.money+=sold+10;s.cans=0;s.laps++;
    message+=` スタート通過！支援金10P${sold?`と空き缶の自動換金${sold}P`:''}。`;
  }
  logExtra(s,message,before);return s;
}
export function waitTurn(state, kind = 'rest') {
  if (state.phase !== 'playing' || state.turn !== 'landed' || !['rest','skip'].includes(kind)) return state;
  const s = structuredClone(state);
  if (kind === 'rest') s.stamina = Math.min(6,s.stamina+2);
  logExtra(s,kind==='rest'?'道端でひと休み。体力を最大2回復して、この手番を終えた。':'このマスは見送った。引き際も、生き延びる技術。',state);
  return endTurn(s);
}
