// マス種類をランダム化（病院以外）
export function randomizeTileTypes(md) {
    if (md[0] && md[0].isCustom) return md; // ★この1行を追加
    const tileTypes = ['normal','can','trash','event','job','shop','exchange','shelter','manhole','koban'];
    const tileNames = {
        normal:'道', can:'空き缶', trash:'ゴミ山', event:'イベント',
        job:'バイト', shop:'ショップ', exchange:'買取所', shelter:'避難所',
        manhole:'ﾏﾝﾎｰﾙ', koban:'交番'
    };
    md.forEach(tile => {
        if (tile.type === 'center') return; 
        const newType = tileTypes[Math.floor(Math.random() * tileTypes.length)];
        tile.type = newType;
        if (tile.area === 'luxury') {
            tile.name = newType === 'shop' ? '高級店' : newType === 'normal' ? '高級住宅' : tileNames[newType] || newType;
        } else {
            tile.name = tileNames[newType] || newType;
        }
    });
    const manholes = md.filter(t => t.type === 'manhole');
    if (manholes.length < 2) {
        const nonSpecial = md.filter(t => t.type !== 'center' && t.type !== 'manhole');
        for (let i = manholes.length; i < 2 && nonSpecial.length > 0; i++) {
            const pick = nonSpecial.splice(Math.floor(Math.random() * nonSpecial.length), 1)[0];
            pick.type = 'manhole';
            pick.name = 'ﾏﾝﾎｰﾙ';
        }
    }
    return md;
}

// マス配置をランダム化（自動迷路生成）
export function randomizeTileLayout(md) {
    if (md[0] && md[0].isCustom) return md; // ★この1行を追加
    const center = md.find(t => t.type === 'center') || md[0];
    const byArea = { slum:[], commercial:[], luxury:[] };
    md.forEach(t => { if (t.id !== center.id && byArea[t.area]) byArea[t.area].push(t); });
    Object.values(byArea).forEach(a => a.sort(() => Math.random() - 0.5));

    const grid = {}; const tPos = {};
    const K = (c,r) => c + ',' + r;
    const DIRS = [[1,0],[0,1],[-1,0],[0,-1]];
    const shuffle = arr => { for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];} return arr; };

    function put(tile, c, r) {
        tile.col = c; tile.row = r; tile.next = [];
        grid[K(c,r)] = tile; tPos[tile.id] = [c,r];
    }

    function freeAdj(c, r, cMin, cMax) {
        for (const [dc,dr] of shuffle([...DIRS])) {
            const nc = c+dc, nr = r+dr;
            if (nc >= cMin && nc <= cMax && nr >= 1 && nr <= 14 && !grid[K(nc,nr)]) return [nc, nr];
        }
        return null;
    }

    function placeArea(tiles, startC, startR, cMin, cMax) {
        if (!tiles.length) return [];
        const placed = [];
        let c = startC, r = startR;

        for (const tile of tiles) {
            let spot = freeAdj(c, r, cMin, cMax);
            if (!spot) {
                for (const pt of shuffle([...placed])) {
                    spot = freeAdj(tPos[pt.id][0], tPos[pt.id][1], cMin, cMax);
                    if (spot) break;
                }
            }
            if (!spot) spot = freeAdj(c, r, cMin - 2, cMax + 2);
            if (!spot) spot = freeAdj(c, r, 1, cMax + 4);
            if (!spot) continue;

            put(tile, spot[0], spot[1]);
            placed.push(tile);
            c = spot[0]; r = spot[1];

            if (Math.random() < 0.28 && placed.length > 2) {
                const bp = placed[Math.floor(Math.random() * placed.length)];
                [c, r] = tPos[bp.id];
            }
        }
        for (let i = 0; i < placed.length - 1; i++) placed[i].next.push(placed[i + 1].id);
        if (placed.length >= 3) placed[placed.length - 1].next.push(placed[0].id);
        const branches = Math.max(1, Math.floor(placed.length * 0.18));
        for (let b = 0; b < branches; b++) {
            const src = placed[Math.floor(Math.random() * placed.length)];
            const [sc, sr] = tPos[src.id];
            for (const [dc, dr] of shuffle([...DIRS])) {
                const adj = grid[K(sc + dc, sr + dr)];
                if (adj && adj.id !== src.id && !src.next.includes(adj.id)) { src.next.push(adj.id); break; }
            }
        }
        return placed;
    }

    const perArea = Math.ceil(Math.sqrt(md.length / 3)) + 2;
    const cxCenter = perArea;
    const ryCenter = 3 + Math.floor(Math.random() * 5);
    put(center, cxCenter, ryCenter);

    const slumP = placeArea(byArea.slum, cxCenter, ryCenter, 1, perArea * 2);
    
    let bridgeC = cxCenter, bridgeR = ryCenter;
    if (slumP.length) { const rm = slumP.reduce((b, t) => tPos[t.id][0] > tPos[b.id][0] ? t : b, slumP[0]); [bridgeC, bridgeR] = tPos[rm.id]; }
    const commP = placeArea(byArea.commercial, bridgeC + 1, bridgeR, perArea, perArea * 3);

    let bridge2C = bridgeC + 1, bridge2R = bridgeR;
    if (commP.length) { const rm = commP.reduce((b, t) => tPos[t.id][0] > tPos[b.id][0] ? t : b, commP[0]); [bridge2C, bridge2R] = tPos[rm.id]; }
    const luxP = placeArea(byArea.luxury, bridge2C + 1, bridge2R, perArea * 2, perArea * 4 + 2);

    if (slumP.length > 0) center.next.push(slumP[0].id);
    else if (commP.length > 0) center.next.push(commP[0].id);

    if (slumP.length && commP.length) { const bridge = slumP.reduce((b, t) => tPos[t.id][0] > tPos[b.id][0] ? t : b, slumP[0]); if (!bridge.next.includes(commP[0].id)) bridge.next.push(commP[0].id); }
    if (commP.length && luxP.length) { const bridge = commP.reduce((b, t) => tPos[t.id][0] > tPos[b.id][0] ? t : b, commP[0]); if (!bridge.next.includes(luxP[0].id)) bridge.next.push(luxP[0].id); }
    if (luxP.length && commP.length) { const last = luxP[luxP.length - 1]; const tgt = commP[Math.floor(Math.random() * commP.length)]; if (!last.next.includes(tgt.id)) last.next.push(tgt.id); }

    md.forEach(t => {
        if (t.next.length === 0) {
            const [c, r] = tPos[t.id] || [0, 0];
            for (const [dc, dr] of DIRS) {
                const adj = grid[K(c + dc, r + dr)];
                if (adj && adj.id !== t.id) { t.next.push(adj.id); break; }
            }
            if (t.next.length === 0) t.next.push(center.id);
        }
    });

    let minC = Infinity, minR = Infinity;
    md.forEach(t => { minC = Math.min(minC, t.col); minR = Math.min(minR, t.row); });
    md.forEach(t => { t.col -= minC - 1; t.row -= minR - 1; });

    return md;
}

export function randomizeStartPosition(md) {
    const nonCenter = md.filter(t => t.type !== 'center');
    if (nonCenter.length === 0) return 0;
    return nonCenter[Math.floor(Math.random() * nonCenter.length)].id;
}

export function scatterPlayerPositions(md, playerCount) {
    const candidates = md.filter(t => t.type !== 'center');
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const positions = [];
    for (let i = 0; i < playerCount; i++) positions.push(shuffled[i % shuffled.length].id);
    return positions;
}