import {atomCardDescription} from './atom-economy.js';
import {atomTileDescription} from './atom-rules.js';
import {isAtom} from "./atom-map.js";
import {ATOM_NPCS,atomText} from "./atom-rules.js";
import {I as ruleStore} from "../assets/useNetworkStore-CIe06z3C.js";
import {GOLD_TILE_RULES,WORLD_RULES} from './rule-details.js';
import {NPC_INFO,npcImpact} from './npc-impact.js';
import {n as characters} from '../assets/useNetworkStore-CIe06z3C.js';
import {cardAvailable,goldCardDescription} from './card-balance.js';
import {PixelItemIcon} from './pixel-item-art.js';
const characterTips={yankee:'近くの相手からPを取り、パンチで戦う。',athlete:'雨でも移動しやすい。ダッシュで近道できる。',survivor:'警察をかわすのが得意。休むとHPが回復する。',sales:'バイトと買い物が得意。手札を相手に売りつける。',hacker:'手札をたくさん持てる。どこからでも買い物できる。',musician:'仲間を集めてPをかせぐ。自分の陣地も守れる。',doctor:'自分のHPが回復する。相手への治療には毒も入る。',gambler:'サイコロが得意。APでカードを手に入れる。',detective:'NPCを動かす。道に罠をしかける。',chef:'食べ物で多く回復する。料理で攻撃もできる。',scavenger:'ゴミや空き缶から、装備や武器を作る。',billionaire:'Pをかせぐのが得意。お金で相手を困らせる。',god:'みんなを助けて、お礼のPをもらう。',emperor:'空き缶が多いほど強くなる。缶を飛ばして攻撃する。',sennin:'何もせずに待つと力がたまる。ためた力で大わざを使う。'};
const skillText=(c,kind)=>{
 let text=`${c[kind]?.name||''} ${c[kind]?.desc||''}`;
 if(c.id==='athlete'&&kind==='action')return '2APで3マス先へダッシュ。途中は飛び越え、着地先のイベントやNPCの効果は発生する。';
 if(c.id==='hacker'&&kind==='action')return '3APで、どこからでもショップを開く。品替えは店で3P、1ターン1回。';
 if(c.id==='emperor')text=text.replace('6ターン限定','1ターンに6マスまで');
 return text.replace('自身は死亡ペナ半減。','').replace('④死亡時P没収免除。','');
};
const sentences=text=>String(text||'').split(/(?<=[。！])\s*|\n/u).filter(Boolean);
export function GoldRulebook({react:R,cards,miniGames=[],onClose}){
 const atom=isAtom(ruleStore.getState()),h=R.createElement,closeRef=R.useRef(null);
 R.useEffect(()=>{const old=document.activeElement;closeRef.current?.focus();const key=e=>{if(e.key==='Escape'){e.preventDefault();onClose();}};window.addEventListener('keydown',key);return()=>{window.removeEventListener('keydown',key);if(old?.isConnected)old.focus();};},[]);
 const list=(texts)=>h('ul',{className:'easy-rule-list'},...texts.flatMap(sentences).map((text,i)=>h('li',{key:i},text)));
 const section=(title,...texts)=>h('section',{key:title},h('h3',null,title),list(texts));
 const details=(key,title,...children)=>h('details',{'data-rule-section':key,key},h('summary',null,title),...children);
 return h('div',{className:'gold-rulebook-overlay',onClick:onClose},h('section',{className:'gold-rulebook',role:'dialog','aria-modal':true,'aria-label':'金缶争奪戦のルール',onClick:e=>e.stopPropagation()},
 h('header',null,h('h2',null,'あそびかた'),h('button',{ref:closeRef,onClick:onClose,'aria-label':'ルールを閉じる'},'閉じる ×')),
 h('div',{className:'gold-rulebook-body'},
 h('p',{className:'easy-rule-goal'},'金缶を集めよう。最後に点数が多い人の勝ち！'),
 h('div',{className:'easy-rule-score'},h('div',null,h(PixelItemIcon,{react:R,id:'gold'}),h('strong',null,'金缶1個'),h('b',null,'3点')),h('div',null,h(PixelItemIcon,{react:R,id:18}),h('strong',null,'相手をたおす'),h('b',null,'2点'))),
 h('ol',{className:'easy-rule-steps'},h('li',null,h('b',null,'🎲 サイコロをふる'),h('span',null,'出た数だけ、APがもらえる。')),h('li',null,h('b',null,'🚶 移動して行動する'),h('span',null,'お金を集める。金缶を買う。武器で戦う。')),h('li',null,h('b',null,'🛑 終わったら「ターン終了」'),h('span',null,'全員が終わると、次のラウンドへ。'))),
 h('div',{className:'easy-rule-words'},h('span',null,'⚡ AP＝行動に使う力'),h('span',null,'💰 P＝お金'),h('span',null,'❤️ HP＝体力')),
 details('金缶','🥫 金缶はどこにある？',list(['金缶のあるマスへ行き、10Pで買う。APはいらない。','誰かが買うと、次の場所を予告する。次のラウンドにそこへ出る。','うすい金缶は予告のしるし。まだ買えない。','最後のラウンドには、新しい金缶は出ない。','相手をたおすと＋2点。相手の金缶は最大1個、そのマスに落ちる。','落ちた金缶は、最初に到着した人が無料で拾える。追加APは不要。','同じマスでたおすと、その場で拾える。遠くからたおしたら取りに行こう。'])),
 details('たたかい','⚔️ 武器を使ってみよう',list(['最初の手札にバットが1枚ある。','店ではレンガ3P、バット4Pで買える。','手札で武器を選び、向きを合わせて「攻撃！」を押す。','ふつうの武器は、1回で2APとカード1枚を使う。','「射程」は届く距離。「ダメージ」は減らせるHP。','HPが0になると病院で復活する。しばらく攻撃を受けない。','収集車や毒でたおれると、金缶をその場に1個落とす。',atom?'ジャンクガンは、Pを弾代にして3回使える。':'ジャンクガンは、ゴミを弾にして3回使える。'])),
 details('順位','🏆 点数が同じなら？',list(['点数が同じなら、Pが多い人が上の順位。','点数もPも同じなら、同じ順位になる。','チーム戦は、仲間の点数とPを足してくらべる。','街のNPCをたおしても、点数は増えない。','「首位まであと○点」は、いまの点数とPで計算する。'])),
 details('逆転','↗️ いちばん下の順位のとき',list(['「大暴落」「下剋上」「行政の見落とし」は、いちばん下の順位の人だけ使える。','同じ最下位なら、どちらの人も使える。','チーム戦でも、このカードは自分だけの順位で決まる。','下剋上：自分より上の敵から、一番上の人のお金を10Pまでうばう。','相手がいない・お金がないときは、カードもAPも使わない。','大暴落：味方のお金は減らさない。'])),
 details('第0区','⚛ 明日の楽園・第0区',list(['低い市場・原子炉広場・高い屋上街路を歩こう。坂道は往復でき、黄色い矢印の道は一方通行。','マザー・ゼロは街の熱を見張る巨大な機械。設備を使うと、その街区の熱が上がる。','赤いマスは次ラウンドの照射先。全員が1回行動してから、45ダメージの照射が来る。','赤いマスから逃げよう。防護シェルターなら必ず無傷。身代わり人形や復活保護も有効。','照射後は冷却中。回収口で1APを使うと15P。冷却1回につき各プレイヤー1回。','缶拾い・ゴミ漁り・換金はない。専用の稼ぎで直接Pをもらう。','修理：2APで6P。安全靴なら1AP。スカベンジャーは9P。','盗電：1APで5P。その地域がボスに狙われやすくなる。','人体実験：2APとHP15で12P。HP16以上が必要。営業マンは14P。','修理・盗電・人体実験は、それぞれ自分の手番に1回。','ショップは7か所。貯めたPで金缶・武器・回復アイテムを買おう。','タクシーは1AP＋3P。給電中の停留所へ飛べる。','配電盤は1AP。次ラウンドのタクシーを東西線／南北線に切り替える。','非常シュートは1APで下層へ。戻るには別の道を使う。','原子炉横断は1AP＋HP10。対岸への近道。着地点の効果も発生する。','この街のロボットは現代都市のNPCに対応する。お世話ロボは2Pをくれる。契約回収ロボはP、警備ロボはHPと手札に関わる。'])),
 ...WORLD_RULES.filter(([title])=>!atom||title!=='NPCの移動・危険予告').map(([title,...texts])=>details(title,title,list(atom?texts.map(t=>t.replace('ゴミを0〜2個、多く拾える。','')).filter(t=>!/缶|ゴミ|売り値/.test(t)).map(t=>atomText(ruleStore.getState(),t)):texts))),
 details('マス','📍 マスのしるし',...(atom?[...new Map(ruleStore.getState().mapData.map(t=>[t.atomKind||t.type,t])).values()].map(t=>section(t.name,atomTileDescription(ruleStore.getState(),t)||GOLD_TILE_RULES[t.type]?.desc||'3Pで陣地にできる。')):Object.values(GOLD_TILE_RULES).map(t=>section(t.title,t.desc)))),
 details('NPC',atom?'🤖 第0区のロボット':'🚛 街の人・車・動物',...Object.keys(NPC_INFO).map(key=>{const p={p:100,hand:[18],equip:{},respawnShield:0},info=npcImpact({players:[p],turn:0},key,p,{type:'can'});const easy={truck:'走っているときにぶつかると、55%の確率でHPが50減る。',police:'つかまると、次のAPが2減る。',uncle:'手札を1枚、勝手に捨ててしまう。',animal:'同じマスでは、缶拾いもゴミ漁りもできない。',yakuza:'HPが15〜20減る。手札も1枚うばう。',loanshark:'持っているPの20%を取る。取られるのは20Pまで。',friend:'空き缶を1個くれる。'};return section(info.icon+' '+(atom?ATOM_NPCS[key]:info.name),atom&&key==='truck'?'赤い予告マスへ45ダメージの照射。防護シェルターなら必ず回避。':atom&&key==='friend'?'出会うと支援金2Pをもらえる。':atom&&key==='animal'?'第0区の専用の稼ぎは妨げない。':easy[key]);}),list(['装備やキャラの力で、助かることもある。','マスをタッチすると、いまの自分がどうなるか分かる。'])),
 details('マップ','🗺️ マップの見かた',list(['マスをタッチすると説明が出る。赤は危険、緑はうれしいこと。','「マップ巡回」を押すと、自由に見られる。','スマホ：1本指で移動。2本指を左右に動かすと回転。','2本指を上下に動かすと角度が変わる。指を開く・閉じるとズーム。','パソコン：ドラッグで移動。右ドラッグで回転。ホイールでズーム。','「プレイに戻る」を押すと、ゲームのカメラに戻る。'])),
 details('キャラクター','👤 キャラの得意なこと',...characters.map(c=>h('section',{key:c.id},h('h3',null,c.name),h('p',null,atom&&['scavenger','emperor','sales'].includes(c.id)?c.passive.desc:characterTips[c.id]),h('details',null,h('summary',null,'スキルのくわしい効果'),list([skillText(c,'passive'),skillText(c,'action')]))))),
 details('ミニゲーム','🎮 ミニゲームの操作',...Object.values(miniGames).map(c=>section(c.name,c.desc))),
 details('カード','🎴 カード一覧 · くわしい効果',h('div',{className:'gold-rule-cards'},...cards.filter(c=>cardAvailable(c.id)).map(c=>h('article',{key:c.id,'data-rule-card':c.id},h(PixelItemIcon,{react:R,id:c.id}),h('div',null,h('strong',null,c.name),list([(atomCardDescription(ruleStore.getState(),c.id)||goldCardDescription(c))]))))))
 )));
}
