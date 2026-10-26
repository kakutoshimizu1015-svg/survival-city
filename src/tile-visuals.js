// A shared visual vocabulary for physical spaces, touch targets and route choices.
export const TILE_VISUALS={
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
export const tileVisual=type=>TILE_VISUALS[type]||TILE_VISUALS.normal;
export function tileIconURL(type){const v=tileVisual(type);return 'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${v.path}" fill="${v.fill?'#fff4d4':'none'}" stroke="#fff4d4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`);}
export function drawTileIcon(ctx,type,x,y,size){const v=tileVisual(type);ctx.save();ctx.translate(x,y);ctx.scale(size/24,size/24);ctx.strokeStyle='#fff4d4';ctx.fillStyle='#fff4d4';ctx.lineWidth=2.2;ctx.lineCap='round';ctx.lineJoin='round';const path=new Path2D(v.path);if(v.fill)ctx.fill(path);ctx.stroke(path);ctx.restore();}
export function tileIconHTML(type){const v=tileVisual(type);return `<img class="city-tile-icon" src="${tileIconURL(type)}" alt="" style="--tile-color:${v.color}">`;}
