import {terminalAvailable,terminalLabel,terminalWork} from './atom-gimmicks.js';
// Choices share the existing event pipeline, hand limit and host authority.
export const atomStories=[
 {title:'⚛ お世話ロボットの無料診療',text:'「無料診療には有料登録が必要です。住所不定の方には、励ましをご用意しました」',theme:'atom',choices:[{label:'3Pで修理（HP＋25。足りなければ無料診療）',func:(s,p)=>{const paid=p.p>=3;s.updateCurrentPlayer(a=>({p:a.p-(paid?3:0),hp:Math.min(100,a.hp+(paid?25:5))}));return paid?'🤖 市民登録料3P。HP＋25。':'🤖 無料の励ましでHP＋5。';}},{label:'励ましだけ受け取る（HP＋5）',func:s=>(s.updateCurrentPlayer(a=>({hp:Math.min(100,a.hp+5)})),'🤖 「あなたには未来があります」。HP＋5。')}]},
 {title:'⚛ 軍用品の廃棄ロッカー',text:'封印には「安全のため絶対に開けないこと」。中から金属の音がする。',theme:'atom',choices:[{label:'開ける（バット獲得・次のAP−2）',func:s=>(s.updateCurrentPlayer(a=>({hand:[...a.hand,18],penaltyAP:(a.penaltyAP||0)+2})),'⚛ バットを回収。警報により次回AP−2。')},{label:'外の資材を売る（6P）',func:s=>(s.updateCurrentPlayer(a=>({p:a.p+6})),'⚛ 資材を売って6P獲得。')}]},
 {title:'⚛ 原子力自販機の試供品',text:'「賞味期限は半減期で表示しています」。緑色の飲み物が光っている。',theme:'atom',choices:[{label:'試飲（50%でHP＋30／50%でHP−15）',func:s=>{const good=Math.random()<.5;s.updateCurrentPlayer(a=>({hp:good?Math.min(100,a.hp+30):Math.max(1,a.hp-15)}));return good?'⚛ 体が軽い！HP＋30。':'⚛ 舌が光っている。HP−15。';}},{label:'試供品の広告を見る（4P）',func:s=>(s.updateCurrentPlayer(a=>({p:a.p+4})),'⚛ 宣伝を聞いて4P獲得。')}]},
 {title:'⚛ 市民幸福度の調査',text:'調査ロボットが聞く。「あなたは幸福ですか？回答は今後の支援に利用されます」',theme:'atom',choices:[{label:'不幸だと答える（5P・手札1枚を検品で失う）',func:s=>(s.updateCurrentPlayer(a=>({p:a.p+5,hand:a.hand.slice(1)})),'⚛ 支援金＋5P。検品で先頭の手札を回収された。')},{label:'幸福だと答える（2P）',func:s=>(s.updateCurrentPlayer(a=>({p:a.p+2})),'⚛ 模範市民への謝礼＋2P。')}]}
];

atomStories.push({title:'🤖 市民サービス端末',text:'「安全な治験のご案内です。健康への影響は、皆さまの未来にお任せします。」手番に1回、仕事を選べます。',theme:'atom',choices:[
 {label:'🔧 安全な点検：2AP → ＋6P',getLabel:(s,p)=>terminalLabel(s,p,'repair'),available:(s,p)=>terminalAvailable(s,p,'repair'),func:(s,p)=>terminalWork(s,p,'repair')},
 {label:'🧪 新薬の実験：2AP・HP−15 → ＋12P',getLabel:(s,p)=>terminalLabel(s,p,'trial'),available:(s,p)=>terminalAvailable(s,p,'trial'),func:(s,p)=>terminalWork(s,p,'trial')},
 {label:'今回はやめる（費用なし）',func:()=> '🤖 市民サービスの利用を見送った。'}
]});
export function atomCpuStoryChoice(s){const p=s.players[s.turn];if(s.storyIndex!==4)return p.hp<50?0:1;const choices=atomStories[4].choices;return p.hp>60&&choices[1].available(s,p)?1:choices[0].available(s,p)?0:2;}
