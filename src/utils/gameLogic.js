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