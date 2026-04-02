// 2つのマスの間の距離を計算する純粋な関数
export function getDistance(posA, posB, mapData) {
    if (posA === posB) return 0;
    let visited = new Set([posA]);
    let queue = [{ id: posA, dist: 0 }];
    
    while (queue.length > 0) {
        let current = queue.shift();
        let tile = mapData.find(t => t.id === current.id);
        if (!tile) continue;
        
        for (let nextId of tile.next) {
            if (nextId === posB) return current.dist + 1;
            if (!visited.has(nextId)) {
                visited.add(nextId);
                queue.push({ id: nextId, dist: current.dist + 1 });
            }
        }
    }
    return 999;
}

// 1〜3マス先のタイルを割り出す関数 (Path Preview用)
export function getPathPreviewTiles(startPos, mapData) {
    const visited = new Set([startPos]);
    let frontier = [startPos];
    const result = { depth1: new Set(), depth2: new Set(), depth3: new Set() };

    for (let depth = 1; depth <= 3; depth++) {
        const nextFrontier = [];
        frontier.forEach(id => {
            const tile = mapData.find(t => t.id === id);
            if (!tile) return;
            tile.next.forEach(nid => {
                if (!visited.has(nid)) {
                    visited.add(nid);
                    nextFrontier.push(nid);
                    if (depth === 1) result.depth1.add(nid);
                    if (depth === 2) result.depth2.add(nid);
                    if (depth === 3) result.depth3.add(nid);
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

// --- 2.5D 疑似3D用 共通計算ロジック (統合) ---
// z値 (0=手前, 7.2=奥) に基づき、スケーリング倍率 (0.35〜1.0) を算出
export const getDepthScale = (z) => Math.max(0.35, 1 - z * 0.09);
// z値に基づき、タイルの幅 (20px〜60px) を算出
export const getTileW = (z) => Math.max(20, 60 - z * 5);
// z値に基づき、タイルの高さ (11px〜32px) を算出
export const getTileH = (z) => Math.max(11, 32 - z * 2.8);
// z値に基づき、タイルの側面の厚み (3px〜12px) を算出
export const getSideH = (z) => Math.max(3, 12 - z * 1.2);