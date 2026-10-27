import {GOLD_TILE_RULES,WORLD_RULES} from "./rule-details.js";
import {NPC_INFO,npcImpact} from "./npc-impact.js";
import {n as characters} from "../assets/useNetworkStore-CIe06z3C.js";
import {cardAvailable,goldCardDescription} from './card-balance.js';
import {PixelItemIcon} from './pixel-item-art.js';
export function GoldRulebook({react:R,cards,miniGames=[],onClose}){
 const h=R.createElement,closeRef=R.useRef(null);
 R.useEffect(()=>{const old=document.activeElement;closeRef.current?.focus();const key=e=>{if(e.key==='Escape'){e.preventDefault();onClose();}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);if(old?.isConnected)old.focus();};},[]);
 const section=(title,...texts)=>h('section',{key:title},h('h3',null,title),...texts.map((text,i)=>h('p',{key:i},text)));
 return h('div',{className:'gold-rulebook-overlay',onClick:onClose},h('section',{className:'gold-rulebook',role:'dialog','aria-modal':true,'aria-label':'金缶争奪戦のルール',onClick:e=>e.stopPropagation()},h('header',null,h('h2',null,'金缶争奪戦'),h('button',{ref:closeRef,onClick:onClose,'aria-label':'ルールを閉じる'},'閉じる ×')),h('div',{className:'gold-rulebook-body'},
 section('勝ち方と順位','金缶1個＝3点、対人キル1回＝2点。合計点が高い人が勝ち。同点は所持Pで比較し、両方同じなら同順位。NPC討伐・デスは得点に加算しません。','チーム戦の勝敗はメンバーの得点とPの合計。逆転カードの使用条件はチーム内でも個人のランキングを使います。'),
 section('金缶を手に入れる','マップに表示された販売場所で10P。購入にAPは不要です。購入後は次ラウンドに別の場所へ出現します（最終ラウンドの新規出現なし）。','相手を倒すとキル点に加えて金缶を最大1個奪います。NPC・毒などで倒れると、その場に金缶を1個落とします。復活時の無敵がある間は攻撃を受けません。'),
 section('自分の手番','サイコロ2個の合計がAPになり、ゾロ目は倍。通常の移動は1AP、雨は原則2AP。移動・缶拾い・ゴミ漁り・バイト・カードを組み合わせ、終わったらターン終了。','缶とゴミを買取所で換金して、金缶や武器を購入します。陣地はP収入を生みますが、維持費もあります。昼夜・天気・NPC・職業によって条件が変わります。'),
 section('武器の入手と攻撃','開始時の手札3枚のうち1枚はバットです。ショップにはレンガ3P・バット4Pが必ず並び、それぞれ1人につき1ラウンド4個まで購入できます。営業マンは2P引き（最低2P）。','一般武器は1回の攻撃につき2APとカード1枚を使います。カードの射程・威力を確認して照準を合わせます。攻撃をキャンセルするとカードとAPが戻ります。ジャンクガンはゴミを弾にして3回使える工作武器です。'),
 section('逆転カードの「最下位」','金缶×3＋対人キル×2の得点順位で判定。同点は所持P、得点とPの両方が同じ最下位なら全員が対象です。所持Pだけ少ない首位には使えません。','下剋上は、自分より上位の敵のうち最上位から最大10Pを奪います。上位の敵がいない、またはその相手が0PならカードもAPも消費しません。大暴落は味方を巻き込みません。'),
 section('マップと詳細','マスをタップ／クリックすると、その場所の効果とNPCの影響を表示します。赤い印は不利益、緑は恩恵。巡回中は1本指で移動、2本指の開閉でズーム、左右移動で回転、上下移動で角度を調整できます。','キャラクターの能力は自分の肖像を押して確認。ショップや手札の説明は、下のカード一覧と同じ効果を表示します。'),
 ...WORLD_RULES.map(([title,...texts])=>h('details',{key:title,'data-rule-section':title},h('summary',null,title),section(title,...texts))),
 h('details',{'data-rule-section':'マス'},h('summary',null,'マスの種類・効果一覧'),...Object.values(GOLD_TILE_RULES).map(t=>section(t.title,t.desc))),
 h('details',{'data-rule-section':'NPC'},h('summary',null,'敵・味方NPCの説明'),...Object.keys(NPC_INFO).map(key=>{const p={p:100,hand:[18],equip:{},respawnShield:0},info=npcImpact({players:[p],turn:0},key,p,{type:'can'});return section(info.icon+' '+info.name,info.desc)}),h('p',null,'装備品・職業・復活無敵によって回避条件が変わります。実際のマス説明には自分の現在の状態が反映されます。')),
 h('details',{'data-rule-section':'キャラクター'},h('summary',null,'キャラクター・特殊スキル'),...characters.map(c=>section(c.name,`${c.passive?.name||''} ${c.passive?.desc||''}`,`${c.action?.name||''} ${c.action?.desc||''}`))),
 h('details',{'data-rule-section':'ミニゲーム'},h('summary',null,'ミニゲーム'),h('p',null,'イベントで出現したミニゲームの画面に従って操作します。勝敗・報酬は結果とログに表示されます。'),...Object.values(miniGames).map(c=>section(c.name||c.title,c.desc||c.description||''))),
 h('details',{'data-rule-section':'カード'},h('summary',null,'使用カード一覧 · 効果と消費AP'),h('div',{className:'gold-rule-cards'},...cards.filter(c=>cardAvailable(c.id)).map(c=>h('article',{key:c.id,'data-rule-card':c.id},h(PixelItemIcon,{react:R,id:c.id}),h('div',null,h('strong',null,c.name),h('p',null,goldCardDescription(c))))))))));
}
