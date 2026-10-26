export function tileInfo(s,t,descriptions){
 const base=descriptions[t.type==='normal'?'normal_'+t.area:t.type]||descriptions.normal;
 const desc=s.goldMode&&t.type==='center'?'HPが0になるとここで復活。金缶は1個まで奪われるか、倒れた場所に落ちます。':base.desc;
 const short={center:'倒れるとここで復活',normal:'陣地化3P · 収入'+({slum:1,commercial:2,luxury:3}[t.area]||1)+'P',can:'1APで缶拾い · 1ターン3回',trash:'2APでゴミ漁り · 失敗で補導',exchange:'缶・ゴミを換金 · 0AP',job:'3APでバイト · 成功で12P',shop:'カードの購入・売却',event:'イベント・ミニゲームが発生',shelter:'次の敵を1回回避',manhole:'1APで別の穴へワープ',koban:'このターンは移動不可'}[t.type]||desc;
 const owner=s.players.find(p=>p.id===s.territories?.[t.id]);
 return {title:t.name||base.title,desc,short,extra:[s.gold?.spot===t.id?'金缶を10Pで購入可能':'',s.gold?.drops?.[t.id]?`落ちている金缶：${s.gold.drops[t.id]}個`:'',owner?`所有者：${owner.name}`:''].filter(Boolean).join(' ／ ')};
}
