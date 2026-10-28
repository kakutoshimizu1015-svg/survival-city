// Host-only arithmetic, deliberately absent from player-facing rules and notices.
// Base AP includes doubles/third die, but not equipment, relief or penalties.
export function diceRelief(state,player,baseAP){
 if(!state.goldMode)return {bonus:0,next:0};
 return {bonus:player._lowRollRelief===2?2:0,next:baseAP<=6?2:0};
}
