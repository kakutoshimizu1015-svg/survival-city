// Calm flyovers with a long off-screen interval; no game-state or camera changes.
export function atomFlyoverPose(now,index=0){
 const time=now/1000-index*21-9,cycle=48,flight=13;
 if(time<0)return {visible:false};
 const phase=time%cycle;if(phase>=flight)return {visible:false};
 const u=phase/flight,reverse=index%2===1;
 return {visible:true,x:(reverse?1-u:u)*190-95,y:30+index*5+Math.sin(u*Math.PI)*2,z:reverse?28-u*48:-24+u*42,yaw:reverse?-Math.PI/2:Math.PI/2};
}
export function animateAtomFlyover(entry,now){const p=atomFlyoverPose(now,entry.index);entry.object.visible=p.visible;if(p.visible){entry.object.position.set(p.x,p.y,p.z);entry.object.rotation.y=p.yaw;}}
