"""Bounded District Zero economy adapters; modern city retains original resources."""
import re

def patch_engine(s):
 def once(old,new):
  nonlocal s
  assert s.count(old)==1,('atom economy engine',old,s.count(old))
  s=s.replace(old,new,1)
 s='import {atomPlayerPatch,atomCharacterText} from "../src/atom-economy.js";\n'+s
 once('updatePlayer:(t,n)=>e(e=>({players:e.players.map(e=>e.id===t?{...e,...typeof n==`function`?n(e):n}:e)}))','updatePlayer:(t,n)=>e(s=>({players:s.players.map(p=>p.id===t?{...p,...atomPlayerPatch(s,p,typeof n==`function`?n(p):n)}:p)}))')
 once('updateCurrentPlayer:t=>e(e=>({players:e.players.map((n,r)=>r===e.turn?{...n,...typeof t==`function`?t(n):t}:n)}))','updateCurrentPlayer:t=>e(s=>({players:s.players.map((p,i)=>i===s.turn?{...p,...atomPlayerPatch(s,p,typeof t==`function`?t(p):t)}:p)}))')
 # Disable obsolete engine endpoints too, so remote requests cannot keep farming resources.
 for action in ['CAN','TRASH','EXCHANGE','JOB']:
  token='actionType:`ACTION_'+action+'`,userId:';start=s.index(token);end=s.index('return}',start)+7
  s=s[:end]+'if(isAtom(v.getState()))return;'+s[end:]
 for limit in [5,10,15,20]:
  old=f'a.charType===`emperor`&&a.cans>={limit}'
  assert old in s
  s=s.replace(old,f'a.charType===`emperor`&&(isAtom(v.getState())?a.p/2:a.cans)>={limit}')
 once('export{J as A', '''for(const c of Fa){for(const kind of ['passive','action']){const original=c[kind].desc;Object.defineProperty(c[kind],'desc',{enumerable:true,get:()=>atomCharacterText(v.getState(),c.id,kind,original)});}const original=c.infoDesc;Object.defineProperty(c,'infoDesc',{enumerable:true,get:()=>atomCharacterText(v.getState(),c.id,'infoDesc',original)});}export{J as A''')
 return s

def patch_skills(s):
 s='import {atomResource} from "../src/atom-economy.js";\nimport {isAtom} from "../src/atom-map.js";\nconst atomFunds=(p,k)=>atomResource(e.getState(),p,k);\n'+s
 # e is the callback player for writes; only the outer player reads are virtualized.
 s=re.sub(r'\b([aocs])\.(cans|trash)\b',lambda m:f'atomFunds({m[1]},"{m[2]}")',s)
 # Avoid spending resources after a forged or stale action. Shared UI still uses native menus.
 s=s.replace('if(t===`equip`){','if(isAtom(a)&&(o.charType!==`scavenger`||s.length>=(o.maxHand||7)))return;if(t===`equip`){',1)
 old='if(c.ap<2||atomFunds(c,"trash")<a.consumeTrash)return;'
 new='if(c.ap<2||atomFunds(c,"trash")<a.consumeTrash||isAtom(s)&&(![1,3,5,10].includes(a.consumeTrash)||a.dmg!==({1:5,3:10,5:35,10:50})[a.consumeTrash]||c.hand[a.handIndex]!==a.id||![48,49,50].includes(a.id)))return;'
 assert old in s;s=s.replace(old,new,1)
 s=s.replace('if(i.length===0||c.ap<2||atomFunds(c,"cans")<a)return;', 'if(i.length===0||c.ap<2||atomFunds(c,"cans")<a||isAtom(s)&&(c.charType!==`emperor`||![3,6,9,12].includes(a)))return;',1)
 # The 9-charge tier cannot destroy the old resource inventory in this map.
 s=s.replace('s.updatePlayer(e.id,e=>({cans:0}))','s.updatePlayer(e.id,e=>isAtom(s)?{penaltyAP:(e.penaltyAP||0)+2}:{cans:0})')
 s=s.replace('n(`💥 破壊的な威力で${e.name}の所持する缶がすべて弾け飛んだ！`)','n(isAtom(s)?`💥 ${e.name}は次回AP−2！`:`💥 破壊的な威力で${e.name}の所持する缶がすべて弾け飛んだ！`)')
 # Logs/labels for the P-based equipment and weapons.
 s=s.replace('`ゴミがありません`','isAtom(e.getState())?`弾代のPが足りません`:`ゴミがありません`').replace('`空き缶がありません`','isAtom(e.getState())?`弾代のPが足りません`:`空き缶がありません`')
 s=s.replace('n(`🔫 【ジャンクガン】ゴミ${a.consumeTrash}個を弾丸にして発射！ ${a.dmg}ダメージ！`)','n(isAtom(s)?`🔫 弾代${a.consumeTrash*3}Pで発射！ ${a.dmg}ダメージ！`:`🔫 【ジャンクガン】ゴミ${a.consumeTrash}個を弾丸にして発射！ ${a.dmg}ダメージ！`)')
 s=s.replace('n(`🥫 【缶バリスタ】${a}個の空き缶を乱射！！`)','n(isAtom(s)?`⚡ 電力砲！弾代${a*2}P。`:`🥫 【缶バリスタ】${a}個の空き缶を乱射！！`)')
 return s

def patch_cards(s):
 s='import {isAtom} from "../src/atom-map.js";\n'+s
 s=s.replace('case 40:t.setState({fixedMarket:!0})','case 40:if(isAtom(c)){y.atomIncomeBonus=true;n(`📈 次の専用の稼ぎ1回に＋5P！`);break;}t.setState({fixedMarket:!0})',1)
 s=s.replace('let c=Math.max(3,Math.min(6,a.trashPrice+1));','let c=isAtom(a)?6:Math.max(3,Math.min(6,a.trashPrice+1));',1)
 return s

def patch_runtime(s):
 s='import {atomResource} from "../src/atom-economy.js";\nconst atomFunds=(p,k)=>atomResource(T.getState(),p,k);\n'+s
 # Only the live action panel, not accounts / gacha / trade inventories.
 s=s.replace('S.cans','atomFunds(S,"cans")').replace('S.trash','atomFunds(S,"trash")')
 for id in ['can','trash','job']:
  old='(0,G.jsx)(`div`,{id:`btn-'+id+'`'
  assert s.count(old)==1
  s=s.replace(old,'!isAtom(T.getState())&&'+old,1)
 # Label the underlying resource choices with their real credit costs.
 for old,new in [('🛡️ ランダム装備 (ゴミ3消費)','🛡️ ランダム装備 (9P)'),('🔫 ジャンクガン (缶10消費)','🔫 ジャンクガン (20P)'),('🥫 缶バリスタ (2AP)','⚡ 電力砲 (2AP)')]:
  s=s.replace('children:`'+old+'`','children:isAtom(T.getState())?`'+new+'`:`'+old+'`')
 s=s.replace('`🔫 ゴミを何個消費して撃ちますか？(現在:`,atomFunds(S,"trash"),`個)`','isAtom(T.getState())?`🔫 弾代を選ぶ（所持${S.p}P）`:`🔫 ゴミを何個消費して撃ちますか？(現在:${S.trash}個)`')
 # Exact option labels occur only in the junk-gun panel.
 for count,dmg in [(1,5),(3,10),(5,35),(10,50)]:
  old=f'children:`{count}個 ({dmg}ダメ)`';new=f'children:isAtom(T.getState())?`{count*3}P ({dmg}ダメ)`:`{count}個 ({dmg}ダメ)`'
  assert old in s;s=s.replace(old,new,1)
 s=s.replace('children:[`🥫`,r.cans,` 🗑️`,r.trash,` 🎴`,r.hand.length,`/`,r.maxHand]', 'children:isAtom(T.getState())?[`🎴 手札 `,r.hand.length,`/`,r.maxHand]:[`🥫`,r.cans,` 🗑️`,r.trash,` 🎴`,r.hand.length,`/`,r.maxHand]')
 s=s.replace('`🥫 缶を何個発射しますか？(現在:`,atomFunds(S,"cans"),`個)`','isAtom(T.getState())?`⚡ 電力砲の弾代を選ぶ（所持${S.p}P）`:`🥫 缶を何個発射しますか？(現在:${S.cans}個)`')
 for old,new in [('3個 (射程2/10ダメ)','6P (射程2/10ダメ)'),('6個 (射程3/25ダメ/AP-1)','12P (射程3/25ダメ/AP-1)'),('9個 (射程4/40ダメ/破壊)','18P (射程4/40ダメ/AP-2)'),('12個 (射程5/広範囲爆撃)','24P (射程5/広範囲60ダメ)')]:
  assert 'children:`'+old+'`' in s
  s=s.replace('children:`'+old+'`','children:isAtom(T.getState())?`'+new+'`:`'+old+'`',1)
 s=s.replace('failMsg:`AP不足か缶がありません`','failMsg:isAtom(T.getState())?`APか弾代のPが足りません`:`AP不足か缶がありません`')
 return s
