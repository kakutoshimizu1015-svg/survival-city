// One rule for both cities, human controls, CPU actions and the host endpoint.
export const canOwnTile=tile=>!!tile&&tile.type==='normal'&&!tile.atomKind&&!tile.noTerritory;
export function territoryCleanup(s){
 const invalid=Object.keys(s.territories||{}).filter(id=>!canOwnTile(s.mapData.find(t=>String(t.id)===id)));
 if(!invalid.length)return null;
 const territories={...s.territories},territoryCosts={...s.territoryCosts},refunds=new Map();
 for(const id of invalid){const owner=territories[id];refunds.set(owner,(refunds.get(owner)||0)+(territoryCosts[id]||3));delete territories[id];delete territoryCosts[id];}
 return {territories,territoryCosts,players:s.players.map(p=>refunds.has(p.id)?{...p,p:p.p+refunds.get(p.id)}:p)};
}
