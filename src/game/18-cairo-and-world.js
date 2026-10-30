// Cairo night streets and time-stop cinematics. All art is local, cached or bounded to a cut-in.
let raidCamera=null,raidCityCache=null;
const cairoInitBase=raidInit;
raidInit=function(){cairoInitBase();raidCamera=null;};
function raidCameraTarget(){
 const alive=fighters.filter(p=>!p.out&&!p.shadowClone&&p.x>-160&&p.x<stage.w+160);
 if(!alive.length)return{x:0,y:0,w:stage.w};
 const minX=Math.min(...alive.map(p=>p.x)),maxX=Math.max(...alive.map(p=>p.x));
 const minY=Math.min(...alive.map(p=>p.y-95)),maxY=Math.max(...alive.map(p=>p.y));
 const w=constrain(Math.max(1040,maxX-minX+240,(maxY-minY+180)*16/9),1040,stage.w);
 return{x:constrain((minX+maxX-w)/2,0,stage.w-w),y:constrain(maxY+90-w*9/16,0,stage.h-w*9/16),w};
}
function raidApplyCamera(){
 const target=raidCameraTarget();
 if(!raidCamera)raidCamera={...target};
 else if(!freezeT)for(const k of ['x','y','w'])raidCamera[k]+=(target[k]-raidCamera[k])*.12;
 scale(W/raidCamera.w);translate(-raidCamera.x,-raidCamera.y);
}
const cairoArenaBase=paintArena;
paintArena=function(){
 if(!raidActive())return cairoArenaBase();
 if(!raidCityCache){
  raidCityCache=document.createElement('canvas');raidCityCache.width=W;raidCityCache.height=WH;
  const c=raidCityCache.getContext('2d'),sky=c.createLinearGradient(0,0,0,WH);
  sky.addColorStop(0,'#090d20');sky.addColorStop(.58,'#252039');sky.addColorStop(1,'#594039');c.fillStyle=sky;c.fillRect(0,0,W,WH);
  c.fillStyle='#c7d6e2';for(let i=0;i<55;i++){c.globalAlpha=.22+(i%4)*.13;c.fillRect((i*127+31)%W,28+(i*67)%195,i%3?1:2,1);}c.globalAlpha=1;
  const moon=c.createRadialGradient(636,82,7,636,82,80);moon.addColorStop(0,'#e5dccb48');moon.addColorStop(1,'#d3d5ec00');c.fillStyle=moon;c.fillRect(548,0,180,175);
  c.fillStyle='#ddd6c2';c.beginPath();c.arc(636,82,26,0,Math.PI*2);c.fill();c.fillStyle='#b8b4ad50';c.beginPath();c.arc(626,78,8,0,Math.PI*2);c.fill();
  // Dense flat roofs, balconies, minarets and warm window light suggest the final Cairo street duel.
  for(let layer=0;layer<3;layer++)for(let i=0;i<22;i++){
   const x=i*41-18+(layer%2)*17,h=45+((i*53+layer*37)%115),y=335+layer*27-h;
   c.fillStyle=['#15192b','#252335','#37303c'][layer];c.fillRect(x,y,38,h+110);
   c.fillStyle=['#27253b','#443343','#5b4145'][layer];c.fillRect(x-2,y-5,42,6);
   for(let r=0;r<5;r++)for(let col=0;col<3;col++){c.fillStyle=(i+r+col)%4?'#c99d6530':'#f4ca8288';c.fillRect(x+6+col*10,y+10+r*19,4,8);}
   c.strokeStyle='#171b2c';c.lineWidth=2;for(let r=1;r<4;r++){c.beginPath();c.moveTo(x+2,y+r*29);c.lineTo(x+36,y+r*29);c.stroke();}
  }
  c.fillStyle='#222337';for(const x of [96,548]){c.fillRect(x,155,11,166);c.fillRect(x-5,169,21,5);c.beginPath();c.moveTo(x-3,155);c.lineTo(x+5,124);c.lineTo(x+14,155);c.fill();}
  // River and an arched bridge sit behind the playable avenue.
  c.fillStyle='#15232e';c.fillRect(0,363,W,WH-363);c.strokeStyle='#85725f66';c.lineWidth=2;
  for(let i=0;i<17;i++){c.beginPath();c.moveTo((i*71)%W,373+(i%5)*9);c.lineTo((i*71)%W+35,373+(i%5)*9);c.stroke();}
  c.fillStyle='#473b40';c.fillRect(0,331,W,17);c.strokeStyle='#ac8a6355';c.lineWidth=3;c.beginPath();c.moveTo(0,329);c.lineTo(W,329);c.stroke();
  c.fillStyle='#292936';for(let x=-30;x<W;x+=95){c.beginPath();c.moveTo(x,391);c.lineTo(x,350);c.quadraticCurveTo(x+39,314,x+78,350);c.lineTo(x+78,391);c.closePath();c.fill();}
  for(let x=40;x<W;x+=125){c.strokeStyle='#292733';c.lineWidth=4;c.beginPath();c.moveTo(x,337);c.lineTo(x,284);c.quadraticCurveTo(x+8,272,x+17,282);c.stroke();c.fillStyle='#eed19b';c.fillRect(x+12,280,9,5);}
  const shade=c.createLinearGradient(0,270,0,WH);shade.addColorStop(0,'#080b1600');shade.addColorStop(1,'#080b1680');c.fillStyle=shade;c.fillRect(0,270,W,WH-270);
 }
 drawingContext.drawImage(raidCityCache,0,0,W,WH);
};
const cairoPlatformsBase=paintPlatforms;
paintPlatforms=function(){
 if(!raidActive())return cairoPlatformsBase();
 const c=drawingContext;c.save();
 stage.plats.forEach((pl,i)=>{
  if(i===0){
   c.fillStyle='#191d29';c.fillRect(pl.x,pl.y,pl.w,pl.h+80);c.fillStyle='#55505a';c.fillRect(pl.x,pl.y,pl.w,6);c.fillStyle='#aaa091';c.fillRect(pl.x,pl.y+6,pl.w,3);
   c.fillStyle='#cdbf8b55';for(let x=pl.x+35;x<pl.x+pl.w-20;x+=105)c.fillRect(x,pl.y+26,60,3);
   for(let x=pl.x+40;x<pl.x+pl.w-10;x+=195){c.fillStyle='#2b303d';c.fillRect(x,pl.y+10,52,6);c.strokeStyle='#645660';c.lineWidth=1;for(let k=0;k<6;k++){c.beginPath();c.moveTo(x+5+k*8,pl.y+10);c.lineTo(x+5+k*8,pl.y+16);c.stroke();}}
  }else{
   c.fillStyle=i%2?'#302e3b':'#3a303b';c.fillRect(pl.x,pl.y,pl.w,stage.plats[0].y-pl.y);
   c.fillStyle='#b99a77';c.fillRect(pl.x-4,pl.y,pl.w+8,5);c.fillStyle='#5f5053';c.fillRect(pl.x-4,pl.y+5,pl.w+8,9);
   for(let x=pl.x+20;x<pl.x+pl.w-20;x+=45){c.fillStyle='#171e2a';c.fillRect(x,pl.y+32,23,45);c.fillStyle='#d2a96977';c.fillRect(x+4,pl.y+35,15,36);c.fillStyle='#453b46';c.fillRect(x+10,pl.y+33,3,42);}
   c.strokeStyle='#201f2a';c.lineWidth=3;c.beginPath();c.moveTo(pl.x+12,pl.y-18);c.lineTo(pl.x+12,pl.y);c.lineTo(pl.x+pl.w-12,pl.y);c.lineTo(pl.x+pl.w-12,pl.y-18);c.stroke();
   c.fillStyle='#bc9b7833';c.fillRect(pl.x+14,pl.y+95,pl.w-28,6);
  }
 });
 c.restore();
};

// Share the ordinary cinematic transport. The host alone can issue DIO/counter commands.
const cairoValidCinematicBase=validCinematic;
validCinematic=function(kind,d){
 if(kind==='timestop'&&d?.raidWorld){
  return raidActive()&&byId(d.id)?.raidBoss&&Number.isFinite(d.x)&&Number.isFinite(d.y)&&Number.isSafeInteger(d.raidWorld)&&d.raidWorld>=raid.serial&&Number.isFinite(d.raidFrame)&&raid.frame<=d.raidFrame+20&&!(d.raidWorld===raid.serial&&raid.move==='fight'&&raid.at>=DIO_STOP_T);
 }
 if(kind==='timestop'&&d?.raidCounter)return raidWorldStopped()&&d.raidCounter===raid.serial&&byId(d.id)?.cid==='jotaro'&&cairoValidCinematicBase(kind,d);
 return cairoValidCinematicBase(kind,d);
};
const cairoReceiveBase=receiveNetEvent;
receiveNetEvent=function(e){
 if(e?.k==='cinx'&&e.kind==='timestop'&&(e.data?.raidWorld||e.data?.raidCounter)&&e.by!==gmCache?.hostId)return;
 return cairoReceiveBase(e);
};
const cairoCutinBase=beginJotaroTimeStopCutin;
beginJotaroTimeStopCutin=function(d){
 if(d?.raidWorld&&byId(d.id)?.raidBoss){
  if(!validCinematic('timestop',d))return;
  if(online&&!cinDispatching){requestCinematic('timestop',d);return;}
  if(d.raidWorld>raid.serial||raid.move!=='world'){
   raid.serial=d.raidWorld;raid.frame=Math.max(raid.frame,d.raidFrame);raid.move='world';raid.at=0;raid.counterIds=[];raidStopActions();
  }
  freezeT=freezeMax=60;fzType='timestopcin';fz={x:d.x,y:d.y,att:d.id,cnt:d.id,dioWorld:true};
  animeSound('timestop');shake=Math.max(shake,6);return;
 }
 if(d?.raidCounter){
  if(!validCinematic('timestop',d))return;
  if(!raid.counterIds.includes(d.id))raid.counterIds.push(d.id);
  const p=byId(d.id);if(isLocal(p))raidGrantCounter(p);
  animeSound('timestop');
 }
 return cairoCutinBase(d);
};
const cairoChronoWorldBase=chronoWorld;
chronoWorld=function(){
 if(!fz?.dioWorld)return cairoChronoWorldBase();
 const c=drawingContext,t=1-freezeT/Math.max(1,freezeMax),cx=fz.x,cy=fz.y;
 c.save();c.fillStyle=t<.27?'#12101de8':t<.38&&!prefs.lowFlash?'#d6c99ce8':'#191828e8';c.fillRect(-400,-400,stage.w+800,stage.h+800);
 for(let i=0;i<9;i++){const r=45+i*70+Math.max(0,t-.2)*900;c.strokeStyle=i%2?'#d6bd8077':'#a191b055';c.lineWidth=i%3?2:5;c.beginPath();c.ellipse(cx,cy,r,r*.55,0,0,Math.PI*2);c.stroke();}
 c.strokeStyle='#e4c77488';c.lineWidth=3;for(let i=0;i<12;i++){const a=i*Math.PI/6;c.beginPath();c.moveTo(cx+Math.sin(a)*100,cy+Math.cos(a)*100);c.lineTo(cx+Math.sin(a)*122,cy+Math.cos(a)*122);c.stroke();}
 c.restore();
};
const cairoChronoTextBase=chronoText;
chronoText=function(){
 if(!fz?.dioWorld)return cairoChronoTextBase();
 const c=drawingContext,t=1-freezeT/Math.max(1,freezeMax),slide=Math.max(0,1-t*5);
 c.save();c.fillStyle='#080c16';c.fillRect(0,0,W,20);c.fillRect(0,WH-24,W,24);
 c.save();c.globalAlpha=.65;raidDrawBody(c,W*.81,WH*.66,1.35,true,1,-1);c.restore();raidDrawBody(c,W*.76,WH*.72,1.05,false,1,-1);
 c.fillStyle='#090e18ed';c.beginPath();c.moveTo(0,WH*.68);c.lineTo(W,WH*.64);c.lineTo(W,WH*.91);c.lineTo(0,WH*.95);c.closePath();c.fill();
 c.fillStyle='#d6bb7c';c.fillRect(0,WH*.68,5,WH*.27);c.textAlign='left';c.font='bold 61px sans-serif';c.strokeStyle='#171220';c.lineWidth=7;c.strokeText('ザ・ワールド！',26-slide*210,WH*.82);c.fillStyle='#fff1cd';c.fillText('ザ・ワールド！',26-slide*210,WH*.82);
 c.font='13px sans-serif';c.fillStyle='#c3ac7c';c.fillText('THE WORLD  /  時は止まる',30,WH*.90);c.textAlign='right';c.font='bold 15px sans-serif';c.fillStyle='#ebd19c';c.fillText('DIO',W-25,44);c.restore();
};
