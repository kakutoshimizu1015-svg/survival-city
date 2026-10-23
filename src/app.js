import { GOAL, ROLES, PERKS, newGame, actionInfo, canAct, act, finishDay, choosePerk, weather, migrateSave, ITEMS, useSkill, canUseSkill, useItem, buyItem, discardItem, rollDice, movePlayer, pathFor, routeChoices, waitTurn } from './game.js';
import { citySVG } from './city.js';
import { createCityWorld, WORLD_TRACK } from './world.js';
import { BOARD, TILE_TYPES, CHARACTER_ART, ENEMY_ART, WARP_LINKS, CONNECTIONS } from './board.js';
const paths = {
 dice:'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 4h.01M17 7h.01M7 17h.01M17 17h.01M12 12h.01',
 gun:'M3 6h18v6H11l-2 7H4l2-7H3ZM14 12v3h4v-3M17 6V4',
 medkit:'M3 7h18v14H3ZM9 7V3h6v4m-3 4v6m-3-3h6',
 shield:'m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6Zm-4 9 3 3 5-6',
 sun:'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 cloud:'M6 18h12a4 4 0 0 0 0-8h-1a6 6 0 0 0-11-1 4.5 4.5 0 0 0 0 9Z',
 can:'M7 5c0-2 10-2 10 0v14c0 2-10 2-10 0ZM7 5c0 2 10 2 10 0M10 10h4m-4 3h4',
 case:'M4 7h16v13H4ZM9 7V4h6v3M4 12h16m-10 0v3h4v-3',
 recycle:'m8 4 3-1 3 5m-3-5L7 9m12 0 2 3-4 4m4-4h-7m0 9h-4l-2-5m2 5 3-6',
 bowl:'M4 12h16a8 8 0 0 1-16 0Zm1 9h14M8 8c-3-3 3-3 0-6m5 6c-3-3 3-3 0-6m5 6c-3-3 3-3 0-6',
 spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',
 hand:'M3 13l5-5 4 2 5-3 4 5-8 8-5-3-5-4Zm5-5 5-4 4 3m-8 7 5 3m-2-6 5 3',
 home:'m3 11 9-8 9 8M6 9v12h12V9m-8 12v-7h4v7',
 bolt:'m13 2-9 12h7l-1 8L21 9h-8Z',
 arrow:'M4 12h16m-6-6 6 6-6 6',
 warp:'M3 12a9 5 0 1 0 18 0 9 5 0 1 0-18 0m3-2 12 4M6 14l12-4M12 3v5m-3-3 3 3 3-3',
 help:'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 flag:'M5 22V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0',
 moon:'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z',
 compass:'m16 8-3 5-5 3 3-5ZM22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 coin:'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-10 4V8h3a2 2 0 0 1 0 4h-3',
 cart:'M2 3h3l3 13h11l3-10H6m3 14h.01M18 20h.01',
 shoe:'M4 10h6l2 4 9 3v4H3v-8Z',
 trophy:'M8 3h8v7a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-5 1h10',
 close:'m6 6 12 12M6 18 18 6',
 sound:'M4 10h4l5-5v14l-5-5H4Zm12-2a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
 check:'m5 12 4 4L19 6',
 reset:'M4 10a8 8 0 1 1 0 5m0-12v7h7'
};
const icon=(id,cls='')=>`<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[id]||paths.spark}"/></svg>`;
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SAVE='survival-city-v2-run', RECORD='survival-city-v2-record';
function read(key) {try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
let storageWarning=false;
function write(key,data){try{localStorage.setItem(key,JSON.stringify(data));}catch{storageWarning=true;}}
const loaded=read(SAVE);
let state=migrateSave(loaded);
let record=read(RECORD);
if(!record||!Number.isFinite(record.best)||!Array.isArray(record.runs)) record={best:0,wins:0,plays:0,runs:[]};
let selected='shelter', role='walker', mode='random', modal=state?null:'welcome', muted=true, audioContext, toastTimer;
let travelBusy=false, inspected=0, boardZoom=1, diceBusy=false;
let cityWorld=null, worldFailed=false;
const root=document.querySelector('#app');
const preview=()=>state||newGame('preview');
const dailyKey=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function persist(){write(SAVE,state);}
function trackResult(){
 if(!state||state.phase!=='ended')return;
 const id=`sugoroku:${state.seed}:${state.role}:${state.mode}`;
 if(record.runs.includes(id)){record.best=Math.max(record.best,state.money);write(RECORD,record);return;}
 record.best=Math.max(record.best,state.money);record.plays++;record.wins+=(state.money>=GOAL?1:0);record.runs.push(id);record.runs=record.runs.slice(-300);write(RECORD,record);
}
function sound(){if(muted)return;try{audioContext ||= new AudioContext();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);o.type='sine';o.frequency.setValueAtTime(520,audioContext.currentTime);o.frequency.exponentialRampToValueAtTime(780,audioContext.currentTime+.1);g.gain.setValueAtTime(.05,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.18);o.start();o.stop(audioContext.currentTime+.2);}catch{}}
function setState(next){if(next===state)return;state=next;selected=BOARD[state.position].type;inspected=state.position;persist();trackResult();render();sound();}
function diceFace(value=1){const dots={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};return `<span class="dice-face" aria-label="${value}の目">${Array.from({length:9},(_,i)=>`<i class="${dots[value].includes(i)?'pip':''}"></i>`).join('')}</span>`;}
const skillGain={walker:'缶 +3',worker:'+15P',dreamer:'体力 +3'};
function dicePanel(s){
 const t=BOARD[s.position],a=actionInfo(s,t.type),step=s.turn==='roll'?0:s.turn==='choose'?1:2;
 const steps=`<div class="turn-steps" aria-label="手番の進行">${['振る','進む','行動'].map((label,i)=>`<span class="${i===step?'current':i<step?'done':''}" ${i===step?'aria-current="step"':''}>${i<step?'✓':i+1} ${label}</span>`).join('<i>›</i>')}<small>あと ${s.actions} 投</small></div>`;
 if(s.phase!=='playing')return `<section class="dice-panel"><div class="next-prompt">今日も、生き延びた。</div><button class="primary" data-command="night">${s.phase==='ended'?'結果を見る':s.phase==='perk'?'能力を選ぶ':'眠る'} ${icon('moon')}</button></section>`;
 let content;
 if(s.turn==='roll')content=`<div class="next-prompt" role="status">次は、サイコロ。</div><button class="primary roll-button" data-command="roll">${diceFace(s.die||1)}<span>サイコロを振る</span>${icon('arrow')}</button>`;
 else if(s.turn==='choose')content=`<div class="next-prompt" role="status">${diceFace(s.die)} <b>あと${s.remaining}マス</b>。${s.previous!==null?'分岐点、どちらへ？':'進む道を選ぼう。'}</div><div class="route-choices" style="--routes:${routeChoices(s).length}">${routeChoices(s).map(r=>{const target=BOARD[r.target],info=actionInfo(s,target.type);return `<button data-direction="${r.id}"><span>${r.label}</span><b>${icon(r.remaining?'compass':target.icon)} ${r.remaining?'分岐点':target.name}</b><small>${r.remaining?`${r.path.length}マス先で道を選ぶ`:target.type==='manhole'?`${BOARD[WARP_LINKS[target.index]].area}へワープ可`:target.type==='station'?'銃・殴る・逃げる':target.type==='alley'?'闇取引・武器探し':!info.enabled?'ここで休める':info.gain}</small></button>`;}).join('')}</div>`;
 else content=`<div class="next-prompt" role="status">${icon(t.icon)} ${t.name}に到着 <span>${a.enabled?(a.cost?'体力 −'+a.cost:'体力消費なし'):t.type==='recycle'?'缶がありません':s.stamina===6&&t.type==='shelter'?'体力は満タン':'体力が足りません'}</span></div><div class="landing-main">${a.enabled?`<button class="primary action-button" data-command="act">${a.name}<strong>${t.type==='station'||t.type==='alley'?'選ぶ →':a.gain}</strong></button>`:`<button class="primary" data-command="${s.stamina<6?'rest':'skip'}">${s.stamina<6?'ここで休む　体力 +'+Math.min(2,6-s.stamina):'次のサイコロへ'} ${icon('arrow')}</button><button data-command="act" disabled hidden>${a.name}</button>`}</div><div class="landing-options">${a.enabled||s.stamina===6?`<button data-command="rest">休む <span>体力 +${Math.min(2,6-s.stamina)}</span></button>`:''}${a.enabled||s.stamina<6?'<button data-command="skip">見送る →</button>':''}</div>`;
 return `<section class="dice-panel action-panel" aria-label="次の操作">${steps}${content}</section>`;
}
function render(){
 const s=preview(),w=weather(s),r=ROLES.find(r=>r.id===s.role),pct=Math.min(100,s.money/GOAL*100);
 root.innerHTML=`
 <header class="topbar"><a class="brand" href="./">SURVIVAL<span>CITY</span></a><nav><button class="square-button" data-command="sound" aria-label="効果音を${muted?'オン':'オフ'}にする" aria-pressed="${!muted}">${icon('sound')}${muted?'<i class="mute-slash"></i>':''}</button><button class="square-button" data-command="help" aria-label="遊び方とメニュー">${icon('help')}</button></nav></header>
 <main class="shell"><section class="hud" aria-label="現在の状態"><div class="hud-day"><small>残り ${8-s.day}日</small><b>${s.day}<span> / 7日</span></b></div><div class="hud-money"><small>脱出まで ${Math.max(0,GOAL-s.money)}P</small><b>${s.money}<span> / ${GOAL}P</span></b><div class="progress"><i style="width:${pct}%"></i></div></div><div class="hud-resource" aria-label="体力 ${s.stamina}/6">${icon('bolt')}<b>${s.stamina}<small>/6</small></b></div><div class="hud-resource" aria-label="空き缶 ${s.cans}個">${icon('can')}<b>${s.cans}</b></div></section>
 <section class="map-panel board-panel" aria-label="すごろく盤面"><div class="board-viewport" id="board-viewport" tabindex="0" aria-label="立体の街。ドラッグで視点を回し、ピンチやホイールで拡大できます">${citySVG(s,icon,inspected)}</div><div class="scene-shade"></div></section>
 <div class="board-toolbar"><span>${icon(w.icon)} ${w.label}</span><div><button class="overview-button" data-command="overview" aria-label="48マスの街全体を見る">全景</button><button data-command="rotate-left" aria-label="視点を左に回す">↶</button><button data-command="rotate-right" aria-label="視点を右に回す">↷</button><button data-command="zoom-out" aria-label="マップを縮小">−</button><button data-command="center" aria-label="視点を戻して自分のコマを表示">${icon('compass')}</button><button data-command="zoom-in" aria-label="マップを拡大">＋</button></div></div><div class="world-hint">${BOARD[s.position].area} · ${String(s.position+1).padStart(2,'0')} / 48マス</div><div class="board-inspector" hidden></div>
 <section class="command-dock"><div class="street-whisper" aria-live="polite">${s.log.length?esc(s.log[0].message):'住所はない。運と悪知恵なら、ある。'}</div>${dicePanel(s)}<nav class="pocket-tools" aria-label="道具と特殊スキル"><button data-command="skill" class="skill-button" title="${r.skill}：${r.skillText}" ${!state||!canUseSkill(s)?'disabled':''}>${icon('bolt')}<span>特殊スキル <small>${s.skillUsed?'使用済み':skillGain[s.role]}</small></span></button><button data-command="inventory">${icon('case')}<span>持ち物 <small>${s.inventory.length}/4</small></span></button><button data-command="market">${icon('coin')}<span>闇市</span></button><button data-command="journal" aria-label="記録と能力">${icon('flag')}<span>記録</span></button></nav></section>
 ${storageWarning?'<div class="save-warning" role="status">保存できません。ページを閉じると進行が失われます。</div>':''}</main><div id="toast" role="status"></div><div id="modal-root"></div>`;
 renderModal();applyBoardView();
}
let previousFocus, lastModal;
function showModal(name){previousFocus=document.activeElement;modal=name;renderModal();}
function closeModal(){modal=state?null:'welcome';renderModal();if(previousFocus?.isConnected)previousFocus.focus();else document.querySelector('[data-command="roll"],[data-direction],[data-command="act"]:not(:disabled),[data-command="rest"]')?.focus({preventScroll:true});}
function renderModal(){
 const el=document.querySelector('#modal-root');
 root.querySelector('.topbar').inert=!!modal;root.querySelector('main').inert=!!modal;document.body.style.overflow=modal?'hidden':'';
 if(!modal){el.innerHTML='';lastModal=null;return;}
 const s=preview();let content='',closable=true;
 if(modal==='welcome'||modal==='new'){
  content=`<div class="modal-kicker">SURVIVAL CITY</div><h2>家はない。手段は、選べる。</h2><p class="modal-lead">サイコロで街を巡り、<b>7日で${GOAL}P</b>。<br>稼いで、今夜の屋根を手に入れろ。</p><div class="role-choices">${ROLES.map(r=>`<button class="role-choice ${role===r.id?'chosen':''}" data-role="${r.id}" aria-pressed="${role===r.id}"><img class="role-art" src="${CHARACTER_ART[r.id]}" alt="${r.name}"/><b>${r.name}</b><small>${skillGain[r.id]} / 日</small>${role===r.id?'<span class="role-tick">✓</span>':''}</button>`).join('')}</div><details class="start-options"><summary>${mode==='daily'?'今日のチャレンジ':'フリープレイ'} · 変更</summary><div class="mode-choices"><button data-mode="random" aria-pressed="${mode==='random'}">毎回ランダム</button><button data-mode="daily" aria-pressed="${mode==='daily'}">今日のチャレンジ</button></div></details>${modal==='new'&&state&&state.phase!=='ended'?'<p class="replace-note">現在の旅は、新しい旅に置き換わります。</p>':''}<button class="primary modal-primary" data-command="start">${state?'新しい旅をはじめる':'この街で生きる'} ${icon('arrow')}</button><p class="modal-small">約5〜10分 · 自動保存</p>`;
  closable=!!state;
 }
 if(modal==='help')content=`<div class="modal-kicker">HOW TO PLAY</div><h2>振る。進む。生き延びる。</h2><div class="help-steps"><p><b>1</b> サイコロを振る。</p><p><b>2</b> 進む道を選ぶ。分岐で残りの歩数を進む。</p><p><b>3</b> 止まったマスで稼ぐ。疲れたら休む。</p></div><p class="modal-lead">1日3投、7日で${GOAL}P。<br>START通過で10P ＋ 缶を自動換金。</p><p class="modal-small">街は48マス。光るマンホールに止まったら地下道で移動できます。同じA・Bの出口につながり、ワープすると手番終了。入らずに休むこともできます。</p><p class="modal-small">街をドラッグすると視点が回転。上下ドラッグで見下ろす角度、＋−・ピンチで拡大。方位ボタンで視点を戻せます。</p><details><summary>道具・能力のルール</summary><p class="modal-small">銃は取り立て屋との対峙で使用。スキルは1日1回、闇市は1日1個。道具とスキルは手番を消費しません。2日目と4日目の夜に能力を獲得。夜は体力2回復。缶は換金してはじめて資金になります。</p></details><button class="primary modal-primary" data-command="close">街に戻る ${icon('arrow')}</button><div class="menu-links"><button data-command="new">新しい旅</button><a href="./classic.html">オリジナル版 ↗</a></div>`;
 if(modal==='journal')content=`<div class="modal-kicker">STREET NOTES</div><h2>路上の記録</h2><p class="modal-lead">${ROLES.find(r=>r.id===s.role).name} · 自己ベスト ${record.best}P</p><div class="journal-entries">${s.log.length?s.log.slice(0,12).map(e=>`<p><small>${e.day}日目</small> ${esc(e.message)}</p>`).join(''):'まだ白紙。まずはサイコロを。'}</div><h3>生き延びる悪知恵</h3>${s.perks.length?s.perks.map(id=>{const p=PERKS.find(p=>p.id===id);return `<p class="perk-note">${icon(p.icon)} <b>${p.name}</b><br><small>${p.text}</small></p>`;}).join(''):'<p class="modal-small">2日目・4日目の夜に獲得</p>'}<p class="modal-small">${ROLES.find(r=>r.id===s.role).perk}<br>${ROLES.find(r=>r.id===s.role).skill}：${ROLES.find(r=>r.id===s.role).skillText}</p>`;
 if(modal==='encounter')content=`<div class="modal-kicker">BLACK MARKET / NO QUESTIONS ASKED</div><div class="welcome-symbol">${icon('gun')}</div><h2>路地裏の誘い。</h2><p class="modal-lead">中身を聞かなければ、仕事はある。</p><div class="encounter-choices dark-choices"><button data-encounter="safe">${icon('case')}<b>闇バイトを引き受ける</b><span>確実に +12P</span></button><button data-encounter="risk">${icon('coin')}<b>危険な取引に乗る</b><span>50%で +35P</span><small>失敗：お金 −8P・体力 −1。名刺があれば防げる。</small></button><button data-encounter="loot" ${s.inventory.length>=4?'disabled':''}>${icon('gun')}<b>ゴミ山から武器を漁る</b><span>アイテムを1つ入手</span><small>${s.inventory.length>=4?'持ち物が満杯。先に使うか捨てよう。':'拳銃・ショットガン・救急キット・名刺から1つ。'}</small></button></div><p class="modal-small">体力 −1 · 1つ選んで手番終了</p>`;
 if(modal==='combat')content=`<div class="modal-kicker">STREET ENCOUNTER / DEBT COLLECTOR</div><img class="enemy-portrait" src="${ENEMY_ART}" alt="取り立て屋"/><h2>「路上にも家賃はある」</h2><p class="modal-lead">契約書も、良心も、ない。</p><div class="encounter-choices combat-choices">${['pistol','shotgun'].map(id=>{const item=ITEMS.find(i=>i.id===id);return `<button data-combat="${id}" ${!s.inventory.includes(id)?'disabled':''}>${icon('gun')}<b>${item.name}で銃撃</b><span>確実に +${id==='pistol'?32:48}P</span><small>${s.inventory.includes(id)?'武器を1個消費':'未所持'}</small></button>`;}).join('')}<button data-combat="fight">${icon('hand')}<b>殴り合う</b><span>50%で +25P</span><small>敗北：お金 −8P・体力 −2。名刺で防げる。</small></button><button data-combat="flee">${icon('shoe')}<b>逃げながら小銭を拾う</b><span>確実に +6P</span><small>無傷。プライドは保証外。</small></button></div><p class="modal-small">1つ選んで手番終了</p>`;
 if(modal==='inventory')content=`<div class="modal-kicker">YOUR ENTIRE ESTATE / ${s.inventory.length} OF 4 SLOTS</div><h2>全財産。ほぼ拾い物。</h2><p class="modal-lead">使っても手番は減らない。銃は取り立て屋に。</p><div class="item-list">${s.inventory.length?s.inventory.map((id,index)=>{const item=ITEMS.find(i=>i.id===id);return `<article class="item-card"><span class="item-icon">${icon(item.icon)}</span><div><h3>${item.name}</h3><p>${item.text}</p><div class="item-controls">${id==='medkit'?`<button data-use-item="${id}" ${s.phase!=='playing'||s.stamina===6?'disabled':''}>使う</button>`:item.type==='weapon'?'<span>駅前で使用</span>':'<span>失敗時に自動発動</span>'}<button class="discard-button" data-discard="${index}" ${s.phase!=='playing'?'disabled':''}>捨てる</button></div></div></article>`;}).join(''):'<p class="modal-lead">ポケットまで不景気。横丁で漁るか、闇市へ。</p>'}</div>`;
 if(modal==='market')content=`<div class="modal-kicker">BLACK MARKET / NO REFUNDS</div><h2>身元不問。現金歓迎。</h2><p class="modal-lead">購入は1日1個、行動消費なし。<br>現在 ${s.money}P / 持ち物 ${s.inventory.length}/4枠</p>${s.trades?'<div class="market-warning">今日の仕入れは終了。明日また来な。</div>':''}<div class="item-list">${ITEMS.map(item=>`<article class="item-card"><span class="item-icon">${icon(item.icon)}</span><div><h3>${item.name}</h3><p>${item.text}</p><button class="buy-button" data-buy="${item.id}" ${s.phase!=='playing'||s.trades||s.money<item.price||s.inventory.length>=4?'disabled':''}>${item.price}Pで購入 ${icon('arrow')}</button></div></article>`).join('')}</div><p class="modal-small">${s.inventory.length>=4?'持ち物が満杯です。使うか捨てると空き枠ができます。':'資金を使いすぎると、路上脱出が遠のきます。'}</p>`;
 if(modal==='night'){
  const entries=s.log.filter(e=>e.day===s.day),earned=entries.reduce((n,e)=>n+e.money,0),recovery=Math.min(6-s.stamina,2+(s.role==='dreamer'?1:0)+(s.perks.includes('bed')?2:0));
  content=`<div class="modal-kicker">DAY ${String(s.day).padStart(2,'0')} / GOOD NIGHT</div><div class="welcome-symbol night-symbol">${icon('moon')}</div><h2>${s.day===7?'7日間、まだ生きている。':'今日も生き残った。それで十分だ。'}</h2><p class="modal-lead">${s.day===7?'決算だ。社会復帰に、領収書はいらない。':'高層ビルの灯りを見上げて、高架下で目を閉じる。'}</p><div class="night-stats"><div><span>今日の収支</span><b>${earned>=0?'+':''}${earned}<small>P</small></b></div><div><span>現在の資金</span><b>${s.money}<small> / ${GOAL}P</small></b></div></div>${s.day<7?`<p class="night-recovery">${icon('bolt')} ひと晩休んで、体力が ${recovery} 回復します</p>`:''}<button class="primary modal-primary" data-command="next">${s.day===7?'結果を見る':[2,4].includes(s.day)?'明日の相棒を選ぶ':`${s.day+1}日目をはじめる`} ${icon('arrow')}</button>`;
  closable=false;
 }
 if(modal==='perk'){
  content=`<div class="modal-kicker">A NEW COMPANION</div><h2>まともな装備は、予算外。</h2><p class="modal-lead">残りの日も続く能力。1つ選ぼう。</p><div class="perk-choices">${s.offers.map(id=>{const p=PERKS.find(p=>p.id===id);return `<button data-perk="${id}"><span class="perk-symbol">${icon(p.icon)}</span><div><h3>${p.name}</h3><p>${p.text}</p></div>${icon('arrow')}</button>`;}).join('')}</div>`;closable=false;
 }
 if(modal==='result'){
  const won=s.money>=GOAL;
  content=`<div class="modal-kicker">${won?'OFF THE STREETS. FOR NOW.':'THE CITY ALWAYS COLLECTS'}</div><div class="welcome-symbol ${won?'':'night-symbol'}">${icon(won?'home':'sun')}</div><h2>${won?'住所、奪還。':'まだ、路上。だが終わりじゃない。'}</h2><p class="modal-lead">${won?'安い部屋の鍵を手に入れた。<br>社会は優しくない。だが今夜は、屋根がある。':`あと${GOAL-s.money}Pで、路上を抜け出せた。<br>次はもっと、図太く生きろ。`}</p><div class="result-score"><span>7日間で集めた資金</span><b>${s.money}<small>P</small></b><em>${won?'GOAL ACHIEVED':`目標 ${GOAL}P`}</em></div><div class="result-detail"><span>移動 <b>${s.totalSteps}マス</b> / 撃退 <b>${s.fights}回</b></span><span>自己ベスト <b>${record.best}P</b></span></div>${s.cans?`<p class="result-tip">手元に空き缶が${s.cans}個残りました。次は最終日に買取所へ。</p>`:''}<div class="result-perks">${s.perks.map(id=>`<span>${icon(PERKS.find(p=>p.id===id).icon)}${PERKS.find(p=>p.id===id).name}</span>`).join('')}</div><button class="primary modal-primary" data-command="replay">もう一度、この街へ ${icon('reset')}</button><button class="text-button share-button" data-command="share">結果をコピーする</button>`;
 }
 el.innerHTML=`<div class="modal-backdrop"><section class="modal ${modal==='welcome'||modal==='new'?'wide-modal':''}" role="dialog" aria-modal="true" aria-label="${({welcome:'新しい旅をはじめる',new:'新しい旅をはじめる',help:'遊び方',encounter:'路地裏の選択',night:'一日の振り返り',perk:'能力を選ぶ',result:'7日間の結果',combat:'取り立て屋との対峙',inventory:'持ち物',market:'闇市',journal:'路上の記録'})[modal]}">${closable?`<button class="modal-close square-button" data-command="close" aria-label="閉じる">${icon('close')}</button>`:''}${content}</section></div>`;
 const isNew=lastModal!==modal;lastModal=modal;
 if(isNew||!el.contains(document.activeElement))el.querySelector('button:not(:disabled)')?.focus({preventScroll:true});
}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),2500);}
root.addEventListener('click',async e=>{
 if(travelBusy||diceBusy)return;
 const direction=e.target.closest('[data-direction]');if(direction){await travel(Number(direction.dataset.direction));return;}
 const tile=e.target.closest('[data-tile]');if(tile){inspected=Number(tile.dataset.tile);renderInspector();return;}
 const roleButton=e.target.closest('[data-role]');if(roleButton){role=roleButton.dataset.role;renderModal();document.querySelector(`[data-role="${role}"]`).focus();return;}
 const modeButton=e.target.closest('[data-mode]');if(modeButton){mode=modeButton.dataset.mode;renderModal();document.querySelector(`[data-mode="${mode}"]`).focus();return;}
 const perk=e.target.closest('[data-perk]');if(perk){modal=null;setState(choosePerk(state,perk.dataset.perk));return;}
 const encounter=e.target.closest('[data-encounter]');if(encounter){modal=null;setState(act(state,'alley',encounter.dataset.encounter));afterAct();return;}
 const combat=e.target.closest('[data-combat]');if(combat){modal=null;setState(act(state,'station',combat.dataset.combat));afterAct();return;}
 const use=e.target.closest('[data-use-item]');if(use){setState(useItem(state,use.dataset.useItem));return;}
 const discard=e.target.closest('[data-discard]');if(discard){setState(discardItem(state,Number(discard.dataset.discard)));return;}
 const buy=e.target.closest('[data-buy]');if(buy){setState(buyItem(state,buy.dataset.buy));return;}
 const button=e.target.closest('[data-command]');if(!button)return;
 switch(button.dataset.command){
 case 'journal':showModal('journal');break;
 case 'inventory':showModal('inventory');break;
 case 'market':showModal('market');break;
 case 'skill':setState(useSkill(state));document.querySelector('[data-command="skill"]')?.focus({preventScroll:true});break;
 case 'help':showModal('help');break;
 case 'sound':muted=!muted;sound();render();break;
 case 'new':showModal('new');break;
 case 'close':closeModal();break;
 case 'start':{const seed=mode==='daily'?`daily-${dailyKey()}`:crypto.getRandomValues(new Uint32Array(2)).join('-');modal=null;state=newGame(seed,role,mode);selected=BOARD[state.position].type;inspected=state.position;persist();render();sound();break;}
 case 'roll':await roll();break;
 case 'focus-action':document.querySelector('.action-panel').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'nearest'});document.querySelector('[data-command="act"]')?.focus({preventScroll:true});break;
 case 'overview':cityWorld?.overview();boardZoom=window.innerWidth<700?.3:.55;break;
 case 'rotate-left':cityWorld?.rotate(-1);break;
 case 'rotate-right':cityWorld?.rotate(1);break;
 case 'center':centerPlayer(true);break;
 case 'zoom-in':boardZoom=Math.min(1.8,boardZoom+.2);cityWorld?.zoom(boardZoom);break;
 case 'zoom-out':boardZoom=Math.max(.3,boardZoom-.2);cityWorld?.zoom(boardZoom);break;
 case 'rest':setState(waitTurn(state,'rest'));afterAct();break;
 case 'skip':setState(waitTurn(state,'skip'));afterAct();break;
 case 'act':if(!state||!canAct(state,selected))return;if(selected==='manhole'){await warp();break;}if(selected==='station'){showModal('combat');break;}if(selected==='alley'){showModal('encounter');break;}setState(act(state,selected));afterAct();break;
 case 'night':showModal(state.phase==='ended'?'result':state.phase==='perk'?'perk':'night');break;
 case 'next':modal=null;setState(finishDay(state));if(state.phase==='perk')showModal('perk');else if(state.phase==='ended')showModal('result');break;
 case 'replay':showModal('new');break;
 case 'share':{const text=`SURVIVAL CITY すごろく｜7日間で${state.money}P ${state.money>=GOAL?'路上脱出。今夜は屋根がある。':'もう一度、この街へ。'}\n${ROLES.find(r=>r.id===state.role).name} / ${state.mode==='daily'?'今日のチャレンジ '+state.seed.replace('daily-',''):'フリープレイ'}\n${location.protocol.startsWith('http')?location.origin+location.pathname:'https://survival-city-street-preview.heartyotter17.chatgpt.site'}`;try{await navigator.clipboard.writeText(text);toast('結果をコピーしました');}catch{const area=document.createElement('textarea');area.value=text;document.querySelector('.modal').append(area);area.focus();area.select();toast('表示された結果テキストをコピーできます');}break;}
 }
});
function afterAct(){if(state.phase==='night')showModal('night');else document.querySelector('[data-command="roll"]')?.focus({preventScroll:true});}
document.addEventListener('keydown',e=>{
 if(!modal)return;
 const box=document.querySelector('.modal'),buttons=[...box.querySelectorAll('button:not(:disabled),a,textarea')];
 if(e.key==='Escape'&&box.querySelector('[data-command="close"]'))closeModal();
 if(e.key==='Tab'&&buttons.length){const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
});
if(state)selected=BOARD[state.position].type;
trackResult();render();
if(state?.phase==='perk')showModal('perk');
if(state?.phase==='night')showModal('night');
if(state?.phase==='ended')showModal('result');

function applyBoardView(){
 const host=document.querySelector('#board-canvas');if(!host)return;
 if(!worldFailed){try{const first=!cityWorld;cityWorld ||= createCityWorld();cityWorld.mount(host,preview());if(first&&preview().turn!=='choose')cityWorld.center(preview().position);return;}catch(error){console.warn('World rendering unavailable:',error.message);worldFailed=true;cityWorld?.dispose();cityWorld=null;}}
 host.dataset.worldStatus='fallback';host.querySelector('.world-loading').textContent='立体表示を起動できません。この端末では簡易盤面で遊べます。';
}
function centerPlayer(){cityWorld?.center(preview().position);}
function renderInspector(){
 const s=preview(),t=BOARD[inspected];toast(`${String(inspected+1).padStart(2,'0')} ${t.name} · ${actionInfo(s,t.type).gain}`);
 document.querySelectorAll('[data-tile]').forEach(b=>b.classList.toggle('inspected',Number(b.dataset.tile)===inspected));
}
async function revealDie(value){
 // Six physical CSS faces share the same pip renderer as the result in the dock.
 const overlay=document.createElement('div');overlay.id='dice-roll-overlay';overlay.className='dice-roll-overlay';
 const orientations={1:[0,0],2:[0,-90],3:[-90,0],4:[90,0],5:[0,90],6:[0,180]};
 const [x,y]=orientations[value],reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 overlay.innerHTML=`<div class="dice-theatre"><div class="die-ground-shadow" aria-hidden="true"></div><div class="die-impact" aria-hidden="true"></div><div class="die-toss"><div class="die-angle"><div class="die-spinner" aria-hidden="true">${[1,2,3,4,5,6].map(n=>`<div class="die-side die-side-${n}">${diceFace(n)}</div>`).join('')}</div></div></div><p class="die-caption" role="status" aria-live="polite" aria-atomic="true">サイコロを振っています…</p></div>`;
 document.body.append(overlay);
 const spinner=overlay.querySelector('.die-spinner'),toss=overlay.querySelector('.die-toss'),caption=overlay.querySelector('.die-caption');
 const finalTransform=`rotateX(${x+720}deg) rotateY(${y+1080}deg) rotateZ(0deg)`;
 try{
  if(reduced){spinner.style.transform=finalTransform;}
  else{
   const spin=spinner.animate([
    {transform:'rotateX(170deg) rotateY(-130deg) rotateZ(-30deg)'},
    {transform:`rotateX(${x+610}deg) rotateY(${y+965}deg) rotateZ(18deg)`,offset:.72},
    {transform:finalTransform}
   ],{duration:1120,easing:'cubic-bezier(.12,.65,.3,1)',fill:'forwards'});
   const bounce=toss.animate([
    {transform:'translate(-85px,-100px) scale(.65)',opacity:0},
    {transform:'translate(-45px,-85px) scale(1.03)',opacity:1,offset:.20},
    {transform:'translate(16px,5px) scale(1)',offset:.52},
    {transform:'translate(8px,-26px) scale(1)',offset:.69},
    {transform:'translate(0,0) scale(1)',offset:.87},
    {transform:'translate(0,-5px) scale(1)',offset:.94},
    {transform:'translate(0,0) scale(1)'}
   ],{duration:1120,easing:'linear',fill:'forwards'});
   overlay.querySelector('.die-ground-shadow').animate([
    {transform:'translateX(-60px) scale(.45)',opacity:.1},
    {transform:'translateX(12px) scale(1.12)',opacity:.6,offset:.52},
    {transform:'translateX(0) scale(.8)',opacity:.25,offset:.69},
    {transform:'translateX(0) scale(1)',opacity:.5}
   ],{duration:1120,fill:'forwards'});
   await Promise.all([spin.finished,bounce.finished]).catch(()=>{});
  }
  overlay.dataset.result=String(value);overlay.classList.add('settled');
  caption.innerHTML=`<strong>${value}</strong><span>マス進める</span>`;
  // The brief result hold is also the reduced-motion presentation; no spinning or bouncing.
  await new Promise(resolve=>setTimeout(resolve,reduced?280:480));
 }finally{overlay.remove();}
}
async function roll(){
 if(diceBusy||!state||state.turn!=='roll'||state.phase!=='playing')return;
 const next=rollDice(state);if(next===state)return;
 diceBusy=true;
 // Save the committed result before animation so refreshing cannot reroll it.
 write(SAVE,next);
 root.inert=true;root.setAttribute('aria-busy','true');cityWorld?.pauseAnimation(true);
 const button=document.querySelector('[data-command="roll"]');if(button)button.disabled=true;
 try{await revealDie(next.die);}catch(error){console.warn('Dice presentation skipped:',error.message);}
 finally{
  root.inert=false;root.removeAttribute('aria-busy');cityWorld?.pauseAnimation(false);diceBusy=false;setState(next);
  document.querySelector('.route-choices [data-direction]')?.focus({preventScroll:true});
 }
}
async function travel(direction){
 if(!state||state.turn!=='choose')return;
 const old=state,next=movePlayer(state,direction);if(next===old)return;
 const path=pathFor(old,direction);travelBusy=true;setState(next);root.inert=true;root.setAttribute('aria-busy','true');
 try{if(cityWorld)await cityWorld.walk([old.position,...path]);}
 finally{travelBusy=false;root.inert=false;root.removeAttribute('aria-busy');}
 if(state.turn!=='choose')cityWorld?.center(state.position);
 document.querySelector('.route-choices [data-direction],[data-command="act"]:not(:disabled),[data-command="rest"],[data-command="skip"]')?.focus({preventScroll:true});
}
async function warp(){
 const old=state,next=act(state,'manhole');if(old===next)return;
 travelBusy=true;setState(next);root.inert=true;root.setAttribute('aria-busy','true');
 toast(`地下道 → ${BOARD[next.position].area}`);
 try{await cityWorld?.teleport(old.position,next.position);}
 finally{travelBusy=false;root.inert=false;root.removeAttribute('aria-busy');cityWorld?.center(next.position);}
 afterAct();
}
window.addEventListener('resize',()=>cityWorld?.resize());
window.addEventListener('pagehide',e=>{if(!e.persisted)cityWorld?.dispose();});
window.addEventListener('pageshow',()=>cityWorld?.resize());
