// Original 160px scene, doubled without smoothing. Palette echoes the raised city.
export function drawAtomInterior(ctx,index=0,event=false){
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.scale(2,2);
 const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
 r(0,0,160,160,'#263e40');r(4,5,152,113,'#476e69');
 for(let y=8;y<110;y+=18){r(5,y,150,2,'#819589');for(let x=10;x<150;x+=22)r(x,y+5,13,7,'#345752');}
 // Porthole and impossible optimistic horizon.
 r(8,14,62,49,'#c7b88a');r(12,18,54,41,'#83aba0');r(14,47,50,10,'#49786e');
 for(let i=0;i<5;i++){r(17+i*9,33-i%2*9,4,23,'#b3c5ad');r(13+i*9,31-i%2*9,12,4,'#d2d5b4');}
 r(76,14,72,30,'#283c3b');r(79,17,66,24,'#a6c8a1');
 for(let i=0;i<7;i++)r(84+i*8,23,4,12,i%2?'#648c70':'#e2d8a5');
 r(78,48,65,5,'#c2a575');r(82,55,54,17,'#344f4b');for(let i=0;i<5;i++)r(86+i*10,58,5,10,['#d2ae69','#9ac6af','#d48e68'][i%3]);
 // A visible robot clerk with joints, vacuum tubes, aperture eyes and a receipt.
 const shade=event?['#86aaa0','#a28b68','#af9e70','#968ca2'][index%4]:'#8aa99a';
 r(62,59,42,11,'#333f3e');r(55,66,55,40,'#5e7b72');r(59,68,47,35,shade);r(64,71,35,15,'#d8c69b');
 r(67,74,29,8,'#2a494a');r(69,76,8,4,'#edcf83');r(86,76,8,4,'#edcf83');r(74,90,16,3,'#3f5450');
 r(77,54,4,12,'#c7b58a');r(74,51,10,5,'#da9d67');r(66,103,33,5,'#354744');
 r(52,109,62,36,'#b5a57d');r(58,113,50,25,shade);r(67,117,31,16,'#4b6661');for(let i=0;i<3;i++)r(71+i*8,121,4,8,'#e7c77f');
 r(39,108,12,28,'#bec4a6');r(33,132,20,8,'#719286');r(114,108,12,28,'#bec4a6');r(113,132,20,8,'#719286');
 // Counter, goods and printed citizen registration form.
 r(0,140,160,7,'#dcc18d');r(0,147,160,13,'#735f4e');r(7,121,23,19,'#a9946c');r(10,124,17,8,'#315650');r(12,125,12,4,'#bed396');
 r(129,128,23,12,'#e2d7ad');for(let i=0;i<3;i++)r(133,130+i*3,15,1,'#8b8768');
 for(let i=0;i<4;i++){r(5+i*9,86,6,19,'#c4b38c');r(5+i*9,85,6,3,'#668f7b');r(6+i*9,91,4,8,['#dca567','#97c6b6','#b89ea7'][i%3]);}
 r(0,0,160,4,'#c0a77a');r(0,0,4,160,'#c0a77a');r(156,0,4,160,'#c0a77a');ctx.restore();
}
