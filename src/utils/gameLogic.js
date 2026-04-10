// 【最適化】mapDataをO(1)参照できるMap形式に変換するユーティリティ
// GameBoard等で一度だけ生成し、各関数に渡すことでmapData.find()を全廃する
export function buildMapIndex(mapData) {
    const index = new Map();
    mapData.forEach(t => index.set(t.id, t));
    return index;
}

// 2つのマスの間の距離を計算する純粋な関数
// 【最適化①】queue.shift()はO(n)のためインデックス方式に変更してO(1)にする
// 【最適化②】mapIndex(Map)を受け取ることでBFS内のO(n)find()を全廃
// mapIndexがない場合はmapDataからフォールバック生成する（後方互換）
export function getDistance(posA, posB, mapData, mapIndex) {
    if (posA === posB) return 0;
    const index = mapIndex || buildMapIndex(mapData);
    const visited = new Set([posA]);
    const queue = [posA];
    const distMap = new Map([[posA, 0]]);
    let head = 0;

    while (head < queue.length) {
        const currentId = queue[head++]; // O(1)インデックス進め
        const currentDist = distMap.get(currentId);
        const tile = index.get(currentId); // O(1)Map参照
        if (!tile) continue;

        for (const nextId of tile.next) {
            if (nextId === posB) return currentDist + 1;
            if (!visited.has(nextId)) {
                visited.add(nextId);
                distMap.set(nextId, currentDist + 1);
                queue.push(nextId);
            }
        }
    }
    return 999;
}

// 1〜3マス先のタイルを割り出す関数 (Path Preview用)
// 【最適化】mapIndex対応でfind()をO(1)参照に変更
export function getPathPreviewTiles(startPos, mapData, mapIndex) {
    const index = mapIndex || buildMapIndex(mapData);
    const visited = new Set([startPos]);
    let frontier = [startPos];
    const result = { depth1: new Set(), depth2: new Set(), depth3: new Set() };

    for (let depth = 1; depth <= 3; depth++) {
        const nextFrontier = [];
        frontier.forEach(id => {
            const tile = index.get(id); // O(1)
            if (!tile) return;
            tile.next.forEach(nid => {
                if (!visited.has(nid)) {
                    visited.add(nid);
                    nextFrontier.push(nid);
                    if (depth === 1) result.depth1.add(nid);
                    else if (depth === 2) result.depth2.add(nid);
                    else if (depth === 3) result.depth3.add(nid);
                }
            });
        });
        frontier = nextFrontier;
    }
    return result;
}

// リンクしているマンホールを割り出す関数
export function getManholeLinkedTiles(currentPos, mapData) {
    const linked = new Set();
    mapData.forEach(t => {
        if (t.type === 'manhole' && t.id !== currentPos) {
            linked.add(t.id);
        }
    });
    return linked;
}

// --- 疑似3D（遠近感）用スケール計算 ---
// 奥の行（rowが小さい）ほど小さく、手前の行ほど大きく(最大2.0)する
export const getDepthScale = (row, maxRow) => {
    if (!maxRow || maxRow === 0) return 1;
    // 奥行き感を強めるため、一番奥を0.3に設定 (以前は0.45)
    return Math.max(0.35, 0.35 + (row / maxRow) * 0.65);
};

// --- 同一マス上の円形配置（オフセット）計算 ---
export const getTileOccupants = (tileId, players, npcs) => {
    const occupants = [];
    // プレイヤーの抽出（生存している且つ同じマス）
    players.filter(p => p.hp > 0 && p.pos === tileId).forEach(p => occupants.push(p.id));
    
    // NPCの抽出
    if (npcs.policePos === tileId) occupants.push('police');
    if (npcs.truckPos === tileId) occupants.push('truck');
    if (npcs.unclePos === tileId) occupants.push('uncle');
    if (npcs.animalPos === tileId) occupants.push('animal');
    if (npcs.yakuzaPos === tileId) occupants.push('yakuza');
    if (npcs.loansharkPos === tileId) occupants.push('loanshark');
    if (npcs.friendPos === tileId) occupants.push('friend');

    // ID順でソートし、描画順を常に一定に保つ
    return occupants.sort();
};

export const getCircularOffset = (entityId, tileId, players, npcs, radius) => {
    const occupants = getTileOccupants(tileId, players, npcs);
    const N = occupants.length;
    // 1体しかいない場合は中央に配置
    if (N <= 1) return { x: 0, y: 0 };

    const i = occupants.indexOf(entityId);
    if (i === -1) return { x: 0, y: 0 };

    // 円形配置の数式（12時方向を起点に時計回り）
    const theta = ((2 * Math.PI) / N) * i - (Math.PI / 2);
    return {
        x: radius * Math.cos(theta),
        y: radius * Math.sin(theta)
    };
};