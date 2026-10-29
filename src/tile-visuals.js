// A shared visual vocabulary for physical spaces, touch targets and route choices.
export const TILE_VISUALS={
 repair:{name:'修理',color:'#54a5b1',path:'M14 3a6 6 0 0 0-7 7L2 18l4 4 8-8a6 6 0 0 0 7-7l-5 4-4-4z'},
 siphon:{name:'盗電',color:'#e4bf4e',path:'M13 2L4 14h7l-1 8L21 9h-8z',fill:true},
 trial:{name:'人体実験',color:'#b28ac7',path:'M8 2h8 M10 2v8L3 21h18l-7-11V2 M7 15h10'},
 taxi:{name:'空中タクシー',color:'#64b6bd',path:'M3 15h18l-3-5H6z M8 10l2-4h4l2 4 M6 18h3 M15 18h3'},
 switch:{name:'配電盤',color:'#d5bb5e',path:'M4 4h16v16H4z M8 8h8 M8 12h4 M15 11v6'},
 terminal:{name:'市民サービス端末',color:'#71b7a3',path:'M3 4h18v14H3z M8 9h1 M15 9h1 M8 14h8 M12 18v4 M8 22h8'},
 chute:{name:'非常滑り台',color:'#d38f65',path:'M7 3v8c0 5 4 7 11 7 M14 14l5 4-5 4'},
 hot:{name:'原子炉横断',color:'#e47858',path:'M12 2l-8 12h7l-1 8 10-13h-7z'},
 reclaim:{name:'廃熱回収',color:'#a3b95f',path:'M4 10h16v11H4z M8 3v4 M12 2v5 M16 3v4 M9 14h6 M12 12v6'},
 ramp:{name:'連絡通路',color:'#9caa9a',path:'M3 20h5v-5h5v-5h5V5h3 M6 6l3-3 3 3 M9 3v8'},
 normal:{name:'街路',color:'#718b82',path:'M10 10h4v4h-4z'},
 center:{name:'回復',color:'#d46564',path:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',fill:true},
 can:{name:'空き缶',color:'#d39446',path:'M7 5h10v14H7z M7 8h10 M7 16h10 M10 3h4'},
 trash:{name:'ゴミ',color:'#8a9d50',path:'M5 7h14 M9 4h6 M7 7l1 14h8l1-14 M10 10v7 M14 10v7'},
 shop:{name:'ショップ',color:'#4d9ac5',path:'M4 10v11h16V10 M2 10l3-7h14l3 7z M9 21v-7h6v7 M8 4l-1 6 M16 4l1 6'},
 job:{name:'バイト',color:'#b88855',path:'M3 8h18v12H3z M8 8V4h8v4 M3 13h18 M10 12v3h4v-3'},
 exchange:{name:'買取',color:'#d3ae43',path:'M3 7h17l-4-4 M21 17H4l4 4 M4 4v7 M20 13v7'},
 event:{name:'イベント',color:'#a277b8',path:'M7 7c0-6 11-6 11 0 0 4-6 3-6 8 M12 20v1'},
 shelter:{name:'休憩',color:'#53a58d',path:'M4 8h13v9c0 5-13 5-13 0z M17 9h3c4 0 3 6-3 6 M7 3v2 M12 2v3 M2 22h19'},
 manhole:{name:'ワープ',color:'#599aba',path:'M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0 M17 12a5 5 0 1 1-10 0 5 5 0 1 1 10 0 M10 12h4'},
 koban:{name:'交番',color:'#6477bf',path:'M12 2l9 4v7c0 5-9 9-9 9s-9-4-9-9V6z M8 10h8 M12 7v9'}
};
// Atomic-age signs are painted onto the physical spaces, with the same keys
// used for route cards and the accessible interactive markers.
Object.assign(TILE_VISUALS,{
 'atom-can':{name:'燃料缶',color:'#d39446',path:'M6 6h12v15H6z M9 6V3h6v3 M12 9l-3 5h4l-1 4 4-6h-4z'},
 'atom-trash':{name:'廃棄パーツ',color:'#8a9d50',path:'M4 4h7v7H4z M14 12h7v8h-7z M7 15v6 M4 18h6 M16 3v5 M13 6h6'},
 'atom-shop':{name:'ロボット商店',color:'#4d9ac5',path:'M4 7h16v14H4z M12 7V3 M10 3h4 M7 11h2 M15 11h2 M8 17h8'},
 'atom-center':{name:'修理ポッド',color:'#d46564',path:'M6 2h12l3 5v14H3V7z M10 8h4v4h4v4h-4v4h-4v-4H6v-4h4z'},
 'atom-shelter':{name:'防護シェルター',color:'#53a58d',path:'M12 2l9 4v7c0 5-9 9-9 9s-9-4-9-9V6z M7 13l4 4 6-8'},
 'atom-job':{name:'原子炉の仕事',color:'#b88855',path:'M3 9h18v12H3z M8 9V5h8v4 M12 11l-3 4h4l-1 4 4-5h-4z'},
 'atom-exchange':{name:'資源の買取',color:'#d3ae43',path:'M9 4h7l4 7 M16 8l4 3 1-5 M20 15l-4 6H8 M11 18l-3 3 3 2 M4 18l-3-7 4-6 M2 10l3-5 3 4'},
 'atom-event':{name:'ロボットのイベント',color:'#a277b8',path:'M3 5h18v14H3z M8 9h1 M15 9h1 M8 14h8 M12 5V2 M6 19l-2 3'},
 'atom-koban':{name:'住所確認ゲート',color:'#6477bf',path:'M3 22V3h18v19 M7 22V7h10v15 M7 13h10 M12 10v6'}
});
export function tileVisualKey(tile){
 if(typeof tile==='string')return tile;
 if(tile?.atomKind)return tile.atomKind;
 if(tile?.noTerritory)return 'ramp';
 const type=tile?.type||'normal';
 return tile?.boardLayout?.startsWith('atom-zero-')&&TILE_VISUALS['atom-'+type]?'atom-'+type:type;
}
export const tileVisual=type=>TILE_VISUALS[type]||TILE_VISUALS.normal;
export function tileIconURL(type){const v=tileVisual(type);return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${v.path}" fill="${v.fill?'#fff4d4':'none'}" stroke="#fff4d4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`);}
export function drawTileIcon(ctx,type,x,y,size){const v=tileVisual(type);ctx.save();ctx.translate(x,y);ctx.scale(size/24,size/24);ctx.strokeStyle='#fff4d4';ctx.fillStyle='#fff4d4';ctx.lineWidth=2.2;ctx.lineCap='round';ctx.lineJoin='round';const path=new Path2D(v.path);if(v.fill)ctx.fill(path);ctx.stroke(path);ctx.restore();}
export function tileIconHTML(type){const v=tileVisual(type);return `<img class="city-tile-icon" src="${tileIconURL(type)}" alt="" style="--tile-color:${v.color}">`;}
