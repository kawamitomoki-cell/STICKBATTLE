// Eren module: owner-authoritative state; existing fighters take unchanged paths.
const EREN={duration:1080,cutin:84,fatigue:60,hardTime:120,hardCooldown:360,
 normalGain:8,strongGain:12,takenGain:2,respawnCarry:50,wireTime:26,wireCooldown:65,grabTime:24};
CHARS.eren={name:'エレン・イェーガー',en:'EREN YEAGER',mark:'巨',spd:1.15,jump:1.04,jumps:2,wt:1.0,pow:1,size:1,ctx:0,back:false,ctc:1,dgc:.9,dgs:1.1,st:[4,3,2],
 sp:'特殊：地形へワイヤー／横：立体機動急襲。巨人時：掴み投げ／横：タックル',up:'人間：上の足場へワイヤー復帰（空中1回）／巨人：対空アッパー',ab:'攻撃・被弾でTITAN GAUGE蓄積。MAXで下特殊：18秒の巨人化。巨人の下特殊：2秒硬質化（6秒間隔）。背後上部のうなじは1.2倍ダメージ'};
SPECIAL_IDS.push('eren');ANIME_COLORS.eren='#b8b276';fighterRoles.eren='ODM / 時間制限巨人化';
const EREN_MOVES={
 erenBlades:{type:'normal',act0:3,act1:10,end:16,reach:28,R:23,yo:33,cd:3,multi:5,dm:7,k0:3,ks:.035,up:.4},
 erenSpin:{type:'heavy',act0:5,act1:12,end:26,reach:32,R:32,yo:30,cd:6,dm:20,k0:10,ks:.075,up:.6},
 erenRaid:{type:'normal',act0:4,act1:16,end:32,reach:34,R:29,yo:32,cd:11,dm:18,k0:10,ks:.075,up:.5},
 titanPunch:{type:'normal',act0:8,act1:16,end:30,reach:30,R:22,yo:12,cd:9,dm:18,k0:13,ks:.10,up:.65},
 titanSmash:{type:'heavy',act0:16,act1:24,end:54,reach:34,R:25,yo:15,cd:16,dm:34,k0:21,ks:.14,up:.7},
 titanGrab:{type:'heavy',act0:12,act1:18,end:50,reach:20,R:20,yo:28,cd:18,dm:0,k0:0,ks:0,up:0},
 titanTackle:{type:'heavy',act0:11,act1:24,end:54,reach:22,R:24,yo:14,cd:18,dm:24,k0:19,ks:.12,up:.65,lunge:8},
 titanUpper:{type:'heavy',act0:10,act1:20,end:40,reach:16,R:25,yo:48,cd:12,dm:22,k0:15,ks:.12,up:1.4}
};
Object.assign(MOVE_DEF,EREN_MOVES);
function erenTitan(p){return p?.cid==='eren'&&p.erenForm===1;}
function fighterSize(p){return erenTitan(p)?3:CC(p.cid).size;}
function fighterConfig(p){
 const c=CC(p.cid);if(!erenTitan(p))return c;
 const hard=p.erenHard>0;
 return {...c,size:3,spd:hard?.38:.76,jump:.78,wt:.40,pow:1,dgs:.65,ctc:1.15};
}
function erenReset(p){Object.assign(p,{erenForm:0,erenGauge:0,erenTime:0,erenFatigue:0,erenHard:0,erenHardCd:0,erenWire:null,erenWireCd:0,erenGrab:null,erenSwing:0,erenGainTargets:new Set(),erenGaugeReceipts:new Set(),erenGrabSeen:new Set()});}
function erenGain(p,n){if(p?.cid==='eren'&&isLocal(p)&&!p.out&&!erenTitan(p)&&!p.erenFatigue)p.erenGauge=Math.min(100,(p.erenGauge||0)+Math.max(0,n));}
function erenMove(p,kind,extra={}){
 p.erenSwing=(p.erenSwing||0)+1;p.erenGainTargets=new Set();
 p.mv={...mkMv(kind),...extra,erenToken:p.id+':'+curRound+':'+p.erenSwing};p.a=1;p.ch=0;p.hit={};
 tone(erenTitan(p)?85:750,erenTitan(p)?32:210,.14,.14,'triangle');noiseHit(.08,.15,1800,true);
}
function erenAttack(p,ch){
 if(p.erenFatigue)return;
 if(p.erenHard>0){erenMove(p,'titanPunch',{end:42});return;}
 if(ch<CH_TH)erenMove(p,erenTitan(p)?'titanPunch':'erenBlades');
 else{const q=constrain((ch-CH_TH)/(CH_FULL-CH_TH),0,1);erenMove(p,erenTitan(p)?'titanSmash':'erenSpin',{dm:erenTitan(p)?22+12*q:12+8*q,k0:erenTitan(p)?17+7*q:8+4*q});}
}
function erenAnchor(p,up){
 let best=null,score=Infinity;
 for(let i=0;i<stage.plats.length;i++){
  const pl=stage.plats[i];if(up&&pl.y>p.y-35)continue;
  const x=constrain(p.x+(up?p.f*40:p.f*220),pl.x+6,pl.x+pl.w-6),y=pl.y;
  const d=Math.hypot(x-p.x,y-(p.y-35));if(d<35||d>340||!up&&(x-p.x)*p.f<25)continue;
  if(d<score){score=d;best={x,y,pl:i,t:EREN.wireTime};}
 }
 return best;
}
function erenWire(p,up=false){
 if(!up&&p.erenWireCd>0||up&&p.rec){sfxNo();return false;}
 const anchor=erenAnchor(p,up);if(!anchor){animeNotice(p,'アンカー接続先なし','#c9d5de');return false;}
 p.erenWire=anchor;p.erenWireCd=EREN.wireCooldown;if(up)p.rec=true;p.inv=Math.max(p.inv,4);
 p.spc=12;noiseHit(.1,.14,3500,true);return true;
}
function erenCutin(e){
 const p=byId(e.id);if(!p||p.cid!=='eren')return;
 // State snapshots restore the form after reconnect; cinematics are cosmetic after validation.
 freezeT=EREN.cutin;freezeMax=EREN.cutin;fzType='titan';fz={x:e.x,y:e.y,att:e.id};
 tone(70,27,.7,.27,'sawtooth');noiseHit(.55,.2,1100);
}
function erenTransform(p){
 if(p.erenGauge<100||p.erenFatigue||erenTitan(p)||p.out)return false;
 clearActs(p);p.erenForm=1;p.erenTime=EREN.duration;p.erenGauge=0;p.erenWire=null;p.erenHard=0;p.inv=Math.max(p.inv,24);
 // Feet remain on their current surface. Extra size grows upward, never into the floor.
 const e={id:p.id,x:Math.round(p.x),y:Math.round(p.y)};
 if(online)requestCinematic('titan',e);else erenCutin(e);
 return true;
}
function erenRevert(p){
 if(online&&isLocal(p))send({k:'eren-revert',id:p.id});
 p.erenForm=0;p.erenTime=0;p.erenGauge=0;p.erenHard=0;p.erenWire=null;p.erenFatigue=EREN.fatigue;clearActs(p);
 burst(p.x,p.y-80,30,5,'#e2e1d1',15);animeNotice(p,'巨人化解除 ― 疲労','#c9d5de');
}
function erenSpecial(p,inp){
 if(p.erenFatigue||p.erenHard>0)return;
 const up=inp.u&&!inp.neutralSpecial,down=inp.gd||inp.d&&!inp.neutralSpecial;
 const side=inp.sideSpecial||(!inp.neutralSpecial?((inp.r?1:0)-(inp.l?1:0)):0);
 if(p.spc>0&&!(up&&!erenTitan(p)))return;
 if(down){
  if(erenTitan(p)){
   if(!p.erenHardCd){p.erenHard=EREN.hardTime;p.erenHardCd=EREN.hardCooldown;clearActs(p);p.spc=18;}
   else animeNotice(p,'硬質化クールタイム','#bed6ee');
  }else if(!erenTransform(p))animeNotice(p,'TITAN GAUGE '+Math.floor(p.erenGauge||0)+'/100','#e6d083');
 }else if(erenTitan(p)){
  erenMove(p,up?'titanUpper':side?'titanTackle':'titanGrab');p.spc=up?48:side?65:64;
  if(side)p.f=side;
 }else if(up)erenWire(p,true);
 else if(side){p.f=side;if(erenWire(p)){erenMove(p,'erenRaid');p.spc=48;}}
 else erenWire(p);
}
function erenBody(p){return {left:p.x-34,right:p.x+34,top:p.y-207,bottom:p.y};}
function erenBodyHit(p,x,y,r=0){
 const b=erenBody(p);return Math.hypot(x-constrain(x,b.left,b.right),y-constrain(y,b.top,b.bottom))<=r;
}
function erenNape(p,x,y,r=0){return erenTitan(p)&&Number.isFinite(x)&&Number.isFinite(y)&&(x-p.x)*p.f<0&&Math.hypot(x-(p.x-p.f*19),y-(p.y-171))<14+Math.min(18,r);}
function erenMeleeNape(A,t){
 const a=byId(A.id),m=a?.mv;if(!a||!m||m.kind!==A.mv.kind)return false;
 return erenNape(t,a.x+a.f*m.reach*fighterSize(a),a.y-m.yo*fighterSize(a),m.R*fighterSize(a));
}
function erenGrabStart(A,t){
 if(t.shadowClone){shadowClonePop(t);return;}
 const a=byId(A.id),token=A.mv.erenToken;
 if(!erenTitan(a)||a.out||t.out||sameTeam(a,t)||isInvuln(t)||t.timeStopT>0||typeof token!=='string'||t.erenGrab||erenTitan(t))return;
 if(Math.abs(a.x-t.x)>140||Math.abs(a.y-t.y)>140)return;
 const seen=t.erenGrabSeen||(t.erenGrabSeen=new Set());if(seen.has(token))return;seen.add(token);if(seen.size>64)seen.delete(seen.values().next().value);
 clearActs(t);t.erenGrab={by:a.id,dir:a.f,t:EREN.grabTime,token};t.vx=t.vy=0;
}
function erenGrabTick(p){
 const g=p.erenGrab;if(!g)return false;
 const a=byId(g.by);
 if(!a||a.out||a.kb>0||a.stn>0||!erenTitan(a)||p.out||Math.abs(a.x-p.x)>220||Math.abs(a.y-p.y)>220){p.erenGrab=null;return false;}
 p.x=a.x+g.dir*64;p.y=a.y-85;p.vx=p.vy=0;clearActs(p);p.g=false;
 if(--g.t<=0){
  p.erenGrab=null;
  const kb=applyHit(p,{dm:20,k0:21,ks:.12,up:.65,f:g.dir},false,a.id);
  emitFx({res:'hit',a:a.id,t:p.id,x:p.x,y:p.y-30,kb,gain:8,c:p.c});
 }
 return true;
}
function erenTick(p){
 for(const key of ['erenWireCd','erenHard','erenHardCd','erenFatigue'])if(p[key]>0)p[key]--;
 if(erenTitan(p)&&p.erenTime>0&&--p.erenTime===0)erenRevert(p);
 if(p.mv?.kind==='titanTackle'&&p.g&&p.a>=p.mv.act0&&p.a<=p.mv.act1&&p.a%6===0)burst(p.x-p.f*25,p.y,4,3,'#b6ac8d',6);
 const w=p.erenWire;
 if(w){
  const pl=stage.plats[w.pl];
  if(!pl||w.x<pl.x||w.x>pl.x+pl.w||w.y!==pl.y||--w.t<=0||p.kb>0||p.out){p.erenWire=null;return;}
  const dx=w.x-p.x,dy=w.y-(p.y-35),d=Math.hypot(dx,dy);
  if(d<24){p.erenWire=null;return;}
  p.vx=constrain(p.vx+dx/d*2,-15,15);p.vy=constrain(p.vy+dy/d*2.2,-17,12);
  if(w.y<p.y-20){p.g=false;p.groundPl=-1;}
 }
}
// Restore only bounded, known Eren fields. No arbitrary remote object assignment.
function erenReadState(s){
 const n=(key,max)=>Number.isFinite(s[key])?constrain(s[key],0,max):0;
 const form=s.ef===1?1:0,wire=s.ew;
 const pl=wire&&Number.isInteger(wire.pl)?stage.plats[wire.pl]:null;
 return {erenForm:form,erenGauge:n('eg',100),erenTime:form?n('et',EREN.duration):0,
  erenHard:form?n('eh',EREN.hardTime):0,erenHardCd:n('ec',EREN.hardCooldown),erenFatigue:n('ez',EREN.fatigue),erenSwing:n('es',1e6),
  erenWire:pl&&Number.isFinite(wire.x)&&wire.x>=pl.x&&wire.x<=pl.x+pl.w&&wire.y===pl.y?{x:wire.x,y:wire.y,pl:wire.pl,t:constrain(wire.t||0,0,EREN.wireTime)}:null,
  erenGrab:s.eb&&typeof s.eb.by==='string'&&byId(s.eb.by)&&Number.isFinite(s.eb.t)?{by:s.eb.by,dir:s.eb.dir===-1?-1:1,t:constrain(s.eb.t,0,EREN.grabTime)}:null};
}
const erenBaseInit=animeInit;
animeInit=function(p){erenBaseInit(p);if(p.cid==='eren')erenReset(p);};
const erenBaseAttack=fireAttack;
fireAttack=function(p,ch){if(p.cid==='eren')return erenAttack(p,ch);return erenBaseAttack(p,ch);};
const erenBaseStep=stepFighter;
stepFighter=function(p,inp){
 if(p.cid==='eren'&&bt.phase==='play'&&!freezeT&&!p.timeStopT&&!p.out){erenTick(p);if(p.erenFatigue){p.prev={...inp};inp={...inp,l:false,r:false,u:false,d:false,a:false,s:false,gd:false,sideSpecial:0,neutralSpecial:false};}}
 if(p.erenGrab&&!freezeT&&!p.timeStopT){if(erenGrabTick(p)){p.prev={...inp};return;}}
 return erenBaseStep(p,inp);
};
const erenBaseMelee=resolveMelee;
resolveMelee=function(A,t){
 if(A.mv.kind==='titanGrab'){erenGrabStart(A,t);return;}
 if(erenMeleeNape(A,t))A={...A,mv:{...A.mv,dm:A.mv.dm*1.2}};
 return erenBaseMelee(A,t);
};
const erenBaseProj=resolveProj;
resolveProj=function(q,t){if(erenNape(t,q.x,q.y,q.r||0))q={...q,dm:q.dm*1.2};const before=t.d;const r=erenBaseProj(q,t);if(q.animeKind==='ki')erenGain(t,(t.d-before)*EREN.takenGain);return r;};
const erenBaseHit=applyHit;
applyHit=function(t,h,bk,id){
 const before=t.d,kb=erenBaseHit(t,h,bk,id);
 if(t.d>before){erenGain(t,(t.d-before)*EREN.takenGain);t.erenWire=null;t.erenGrab=null;}
 return kb;
};
const erenBaseArmorHit=armorHit;
armorHit=function(t,h,id){const before=t.d;erenBaseArmorHit(t,h,id);erenGain(t,(t.d-before)*EREN.takenGain);};
const erenBaseFx=playFx;
playFx=function(e,remote){
 erenBaseFx(e,remote);
 const a=byId(e.a);
 if(a?.cid==='eren'&&isLocal(a)&&['hit','armor'].includes(e.res)){
  const targets=a.erenGaugeReceipts||(a.erenGaugeReceipts=new Set()),key=(e.erenToken||a.erenSwing)+':'+e.t;
  if(!targets.has(key)){targets.add(key);if(targets.size>128)targets.delete(targets.values().next().value);erenGain(a,a.mv?.type==='heavy'?EREN.strongGain:EREN.normalGain);}
  if(erenTitan(a)&&a.mv?.kind==='titanSmash'&&e.res==='hit'){
   if(!online){freezeT=Math.max(freezeT,8);freezeMax=8;fzType='erenHitstop';fz=null;}shake=Math.max(shake,12);ring(e.x,e.y,20,20);
  }
 }
};
const erenBaseState=stateOf;
stateOf=function(p){const s=erenBaseState(p);if(p.cid==='eren')Object.assign(s,{ef:p.erenForm||0,eg:p.erenGauge||0,et:p.erenTime||0,eh:p.erenHard||0,ec:p.erenHardCd||0,ez:p.erenFatigue||0,ew:p.erenWire,es:p.erenSwing||0});if(p.erenGrab)s.eb=p.erenGrab;return s;};
const erenBaseEvent=handleGameplayEvent;
handleGameplayEvent=function(e){if(e.k==='eren-revert'){const p=byId(e.id);if(p?.cid==='eren'&&p.owner===e.by&&!isLocal(p))erenRevert(p);return;}if(e.k==='mh'&&e.mv?.kind==='titanGrab'&&byId(e.a)?.owner!==e.by)return;return erenBaseEvent(e);};
const erenBaseReceive=receiveNetEvent;
receiveNetEvent=function(e){if(e?.k==='cinx'&&e.kind==='titan'&&byId(e.data?.id)?.owner!==e.by)return;return erenBaseReceive(e);};
// CPU adapters use the same input commands as humans.
AI_CHARACTER_PLAN.eren={ideal:70,near:42,far:230,shoot:180,skill:.6,charge:.3,guard:.35};
AI_SKILLS.eren={range:130,startup:6,damage:14,hold:2,dir:'side'};
const erenBaseSkills=aiSkillOptions;
aiSkillOptions=function(p,t){
 if(p.cid!=='eren')return erenBaseSkills(p,t);
 if(p.erenHard>0)return [];
 if(!erenTitan(p))return [{name:'side',dir:'side',range:145,startup:8,damage:18,recovery:16,hold:2,ready:()=>!p.erenWireCd&&!!erenAnchor(p,false)}];
 return [{name:'special',dir:'neutral',range:120,startup:12,damage:20,hold:2},
  {name:'side',dir:'side',range:155,startup:11,damage:24,hold:2}];
};
const erenBaseTactics=aiTacticalAction;
aiTacticalAction=function(p,t,A,I,D,plan){
 if(p.cid==='eren'&&aiReady(p)&&!p.erenFatigue&&!p.spc){
  const dist=Math.abs(t.x-p.x),floor=stage.plats[p.groundPl];
  if(!erenTitan(p)&&p.erenGauge>=100&&p.g&&floor?.w>=100&&dist<360&&(t.d>65||p.d>65||dist<220||p.s<t.s)){aiUseSpecial(p,I,A,2,'down');return 'titan-transform';}
  if(erenTitan(p)&&!p.erenHardCd&&t.mv?.type==='heavy'&&t.a<=t.mv.act1&&dist<130&&p.d>70){aiUseSpecial(p,I,A,2,'down');return 'titan-harden';}
 }
 return erenBaseTactics(p,t,A,I,D,p.cid==='eren'&&erenTitan(p)?{...plan,ideal:110,near:65}:plan);
};
const erenBaseProfile=aiMeleeProfile;
aiMeleeProfile=function(p,hold=2){if(p.cid!=='eren')return erenBaseProfile(p,hold);const m=EREN_MOVES[erenTitan(p)?hold>=CH_TH?'titanSmash':'titanPunch':hold>=CH_TH?'erenSpin':'erenBlades'];return {range:(m.reach+m.R)*fighterSize(p),startup:m.act0+hold,damage:!erenTitan(p)&&hold<CH_TH?14:m.dm,hold,type:m.type,recovery:m.end-m.act1};};
// Presentation is generated geometry and synthesized effects only.
function erenDrawBody(p,t,titan=erenTitan(p)){
 const sc=titan?3:1,m=p.mv,active=m&&p.a>=m.act0&&p.a<=m.act1;
 const speed=Math.min(1,Math.abs(p.vx||0)/7),stride=Math.sin(t*(titan?.16:.3))*speed;
 const attackQ=m?constrain((p.a-m.act0)/Math.max(1,m.act1-m.act0),0,1):0;
 push();translate(p.x,p.y);scale(sc);scale(p.f,1);
 if(isInvuln(p)&&t%8<3)drawingContext.globalAlpha*=.6;
 const outline='#131c22',skin=titan?'#bd8268':'#dfbc98',light=titan?'#e2ae88':'#f3d6ae';
 // Articulated joints and tapered limbs, outlined before the lit plane.
 const limb=(x0,y0,x1,y1,x2,y2,w,col)=>{stroke(outline);strokeWeight(w+2.5);line(x0,y0,x1,y1);line(x1,y1,x2,y2);stroke(col);strokeWeight(w);line(x0,y0,x1,y1);line(x1,y1,x2,y2);stroke(light);strokeWeight(w*.24);line(x0-1,y0,x1-1,y1);};
 const fist=(x,y,r,hard=false)=>{stroke(outline);strokeWeight(1);fill(hard?'#8ca9be':skin);quad(x-r,y-r*.7,x+r*.7,y-r,x+r,y+r*.5,x-r*.6,y+r*.7);fill(hard?'#e2f6f1':light);quad(x-r*.7,y-r*.6,x+r*.5,y-r*.75,x+r*.6,y-r*.2,x-r*.6,y-r*.1);stroke(hard?'#52768b':'#875044');strokeWeight(.6);for(let i=0;i<3;i++)line(x-r*.4+i*r*.45,y-r*.55,x-r*.3+i*r*.45,y+r*.2);};
 // Legs have a thigh, knee and calf rather than one uniformly thick stick.
 for(const side of [-1,1]){
  const kneeX=side*8+stride*side*5,kneeY=-17-Math.max(0,stride*side)*3,footX=side*11+stride*side*8;
  limb(side*6,-30,kneeX,kneeY,footX,-2,titan?7:4,titan?'#9f6659':'#d2c6a5');
  if(titan){noStroke();fill('#d79978');ellipse(side*6,-25,8,14);fill('#794c44');ellipse(kneeX,kneeY,6,4);}
  stroke(outline);strokeWeight(titan?3:4);line(footX-3,-1,footX+5,-1);
  if(!titan){stroke('#5d493d');strokeWeight(2);line(kneeX,kneeY+2,footX,-2);stroke('#b1b6a6');strokeWeight(.8);line(kneeX-2,kneeY+1,kneeX+2,kneeY+1);}
 }
 let hx=18,hy=-39,backX=-18,backY=-39;
 if(p.ch>0||m?.kind==='titanSmash'&&p.a<m.act0){hx=-24;hy=-49;}
 else if(active){hx=m.reach;hy=-m.yo;}
 if(titan&&m?.kind==='titanGrab'&&p.a>=m.act0&&p.a<44){hx=21;hy=-38;}
 if(p.ct>0||p.erenHard>0){hx=12;hy=-57;backX=0;backY=-51;}
 const alternate=titan&&m?.kind==='titanPunch'&&(p.erenSwing||0)%2===0;
 limb(alternate?10:-10,-49,-19,-45,backX,backY,titan?9:4,titan?'#9b6253':'#8b6d48');
 if(titan){
  // Broad deltoids, narrow pelvis and segmented abdominal wall.
  stroke(outline);strokeWeight(1.3);fill('#9e5f52');beginShape();vertex(-16,-54);vertex(-10,-61);vertex(9,-61);vertex(18,-51);vertex(11,-36);vertex(8,-25);vertex(-8,-25);vertex(-11,-38);endShape(CLOSE);
  fill('#dba17e');ellipse(-9,-48,19,15);ellipse(9,-48,19,15);fill('#e5b38b');arc(-8,-49,15,9,PI,TWO_PI);arc(8,-49,15,9,PI,TWO_PI);
  stroke('#79483f');strokeWeight(.7);line(0,-54,0,-28);line(-13,-43,-6,-37);line(13,-43,6,-37);
  for(let row=0;row<3;row++){noStroke();fill(row%2?'#c78b6c':'#da9c77');rect(-7,-41+row*5,6,4,1);rect(1,-41+row*5,6,4,1);stroke('#895143');strokeWeight(.5);line(-6,-36+row*5,6,-36+row*5);}
  noFill();stroke('#dfaa84');strokeWeight(1);for(let i=0;i<3;i++){line(-12+i,-41-i*3,-8,-34-i*3);line(12-i,-41-i*3,8,-34-i*3);}
  fill('#9b6351');noStroke();quad(-9,-28,0,-25,9,-28,7,-20);fill('#c88c6c');triangle(-6,-27,6,-27,0,-22);
 }else{
  // Cropped leather jacket, white shirt, crossed harness and moving green cape.
  noStroke();fill('#253c31');beginShape();vertex(-11,-52);vertex(-25-speed*7,-42);vertex(-23-stride*5,-24);vertex(-9,-32);endShape(CLOSE);
  stroke(outline);strokeWeight(1.2);fill('#e1d3b7');quad(-9,-49,9,-49,9,-27,-9,-27);
  fill('#9b754b');quad(-13,-52,-3,-50,-4,-30,-14,-28);quad(3,-50,13,-52,15,-29,4,-30);
  fill('#ba9160');triangle(-12,-51,-4,-49,-8,-42);triangle(12,-51,4,-49,8,-42);
  stroke('#553e2e');strokeWeight(.65);line(-12,-39,-5,-39);line(5,-39,12,-39);line(-12,-37,-5,-37);line(5,-37,12,-37);
  stroke('#3d3930');strokeWeight(2);line(-8,-47,7,-29);line(8,-47,-7,-29);line(-11,-28,11,-28);
  stroke('#d1d1b7');strokeWeight(.7);rect(-3,-33,6,4,1);
  for(const side of [-1,1]){fill('#45565a');stroke(outline);strokeWeight(1);rect(side<0?-22:13,-25,9,17,2);fill('#aab5b2');rect(side<0?-21:14,-24,6,4,1);stroke('#d3dcd4');strokeWeight(.65);for(let i=0;i<3;i++)line(side<0?-20:15,-18+i*3,side<0?-16:19,-18+i*3);}
  // Original wing-like insignia, visible on the leather shoulder.
  stroke('#cddbd2');strokeWeight(.65);for(let i=0;i<4;i++)line(-10,-46+i*1.5,-7+i*.5,-48+i*1.5);
 }
 // Neck and angular face; hair strands frame the cheeks instead of a square helmet.
 stroke(outline);strokeWeight(1);fill(skin);rect(-4,-61,8,8,2);
 fill(titan?'#242c27':'#272b26');beginShape();vertex(-12,-55);vertex(-16,-69);vertex(-9,-80);vertex(2,-82);vertex(13,-74);vertex(14,-59);vertex(9,-50);vertex(5,-69);vertex(-6,-67);vertex(-8,-52);endShape(CLOSE);
 fill(skin);beginShape();vertex(-7,-71);vertex(4,-74);vertex(11,-66);vertex(12,-57);vertex(7,-50);vertex(-2,-52);vertex(-8,-61);endShape(CLOSE);
 fill(light);quad(1,-71,8,-67,9,-61,3,-62);fill('#9c6854');triangle(-4,-58,7,-56,3,-51);
 noStroke();fill('#edf0d5');quad(0,-65,9,-64,7,-61,1,-62);fill('#57a994');rect(4,-64,2,3);stroke('#233329');strokeWeight(1.2);line(-1,-66,9,-65);
 stroke('#805346');strokeWeight(.65);line(7,-61,10,-58);line(9,-57,5,-57);
 if(titan){
  fill('#efe4c5');stroke('#653c35');strokeWeight(.65);beginShape();vertex(-1,-57);vertex(10,-56);vertex(7,-51);vertex(0,-52);endShape(CLOSE);
  for(let i=0;i<5;i++)line(i*1.8,-56,i*1.8,-52);
  stroke('#9a5948');line(-5,-62,-2,-58);line(-4,-59,-1,-56);line(11,-61,10,-57);
  fill('#d8a27b');noStroke();triangle(-9,-64,-14,-66,-11,-59);
 }else{stroke('#704c40');strokeWeight(.7);line(0,-55,7,-55);}
 noFill();stroke('#435044');strokeWeight(.7);for(let i=0;i<5;i++)bezier(-10+i*4,-75,-13+i*4,-66,-7+i*4,-63,-10+i*4,-54);
 const elbowX=(hx+9)*.48,elbowY=-45+(hy+45)*.5-3;
 limb(alternate?-10:10,-49,elbowX,elbowY,hx,hy,titan?10:4,titan?skin:'#a58053');
 if(titan){
  fist(hx,hy,8,p.erenHard>0);fist(backX,backY,6.5,p.erenHard>0);
  // Nape stays exactly at the gameplay weak-point coordinate.
  noStroke();fill('#edb993');ellipse(-6.3,-57,4,6);
  noFill();stroke(227,231,215,70);strokeWeight(1);for(let i=0;i<4;i++){const q=(t*.012+i*.24)%1;bezier(-15+i*9,-48-q*19,-28+i*9,-54-q*21,2+i*9,-65-q*20,-8+i*9,-73-q*21);}
 }else{
  const blade=(x,y,angle)=>{push();translate(x,y);rotate(angle);stroke(outline);strokeWeight(1);fill('#c1d7d3');quad(0,-2,28,-18,31,-23,2,-5);stroke('#f5ffea');strokeWeight(.8);line(3,-5,30,-22);stroke('#526c70');line(2,-2,25,-17);stroke('#353f3e');strokeWeight(2.5);line(-4,2,2,-3);stroke('#b6bca5');strokeWeight(1.2);line(-3,-3,3,2);pop();};
  blade(hx,hy,active?(attackQ-.5)*1.4:-.15);blade(backX,backY,active?(.5-attackQ)*1.5:.35);
  if(p.erenWire||p.dg>0){noStroke();for(let i=0;i<5;i++){fill(195,226,218,90-i*13);ellipse(-24-i*7,-24+i*1.5,7+i*4,4+i*2);}}
 }
 if(active){
  noFill();stroke(titan?'#e7bd73':'#78d7cd');strokeWeight(titan?3:3.5);arc(m.reach,-m.yo,m.R*2,m.R*2,-1.35,1.2);
  stroke(titan?'#fff0ba':'#f1fff6');strokeWeight(titan?1:1.1);arc(m.reach+1,-m.yo,m.R*2+3,m.R*2+3,-1.25,1.1);
  if(!titan){stroke(156,231,220,100);strokeWeight(1);for(let i=0;i<3;i++)line(m.reach-12-i*6,-m.yo+17,m.reach+6-i*5,-m.yo-13);}
 }
 pop();
}
function drawEren(p){
 if(p.out)return;
 if(p.erenWire){push();stroke('#d5e8e1');strokeWeight(1.4);for(const offset of [-12,12])line(p.x+offset,p.y-27,p.erenWire.x,p.erenWire.y);noStroke();fill('#dce2bd');circle(p.erenWire.x,p.erenWire.y,6);pop();}
 erenDrawBody(p,visualFrame);
 push();textAlign(CENTER,CENTER);textSize(12);stroke('#111b22');strokeWeight(3);fill(p.c);text(p.label,p.x,p.y-(erenTitan(p)?260:94));pop();
}
const erenBaseDraw=drawFighter;
drawFighter=function(p){if(p.cid==='eren')return drawEren(p);return erenBaseDraw(p);};
function erenPaintCutin(){
 if(fzType==='erenHitstop')return;
 const p=byId(fz?.att);if(!p)return;
 const q=1-freezeT/EREN.cutin;
 push();noStroke();fill(5,13,17,prefs.lowFlash?150:190);rect(0,0,W,H);
 const actor={...p,x:W*.5,y:H*.78,f:1,a:0,mv:null,ch:0,ct:0,erenHard:0};
 if(q<.22){
  erenDrawBody(actor,visualFrame,false);stroke('#dcc5a7');strokeWeight(5);line(actor.x+14,actor.y-37,actor.x+3,actor.y-55);
 }else{
  if(q<.42){
   stroke('#f4ce72');strokeWeight(prefs.lowFlash?2:4);
   beginShape();vertex(W*.5-10,0);vertex(W*.5+20,H*.2);vertex(W*.5-18,H*.31);vertex(W*.5+8,H*.6);endShape();
   if(!prefs.lowFlash&&q<.27){noStroke();fill(255,224,160,100);rect(0,0,W,H);}
  }
  if(q>.42)erenDrawBody(actor,visualFrame,true);
  noStroke();for(let i=0;i<10;i++){const x=W*.5+Math.sin(i*2.4)*130,y=H*.67-Math.abs(Math.sin(i*3+q))*120;fill(217,222,203,q<.65?130:40);ellipse(x,y,70,50);}
  if(q>.68){noFill();stroke('#e6d08c');strokeWeight(2);ellipse(W*.5,H*.72,130+(q-.68)*450,25+(q-.68)*50);}
 }
 noStroke();fill('#f1db99');textAlign(CENTER,CENTER);textStyle(BOLD);textSize(30);text(q<.22?'手を噛む ― 決意':q<.55?'進撃の巨人':'ATTACK TITAN',W*.5,H*.14);
 textSize(12);text('TITAN GAUGE / 18 SECONDS',W*.5,H*.22);pop();
}
const erenBaseFreezeWorld=drawFreezeWorld,erenBaseFreezeText=drawFreezeText;
drawFreezeWorld=function(){if(['titan','erenHitstop'].includes(fzType))return;return erenBaseFreezeWorld();};
drawFreezeText=function(){if(fzType==='titan')return erenPaintCutin();if(fzType==='erenHitstop')return;return erenBaseFreezeText();};
const erenBaseEndFreeze=endFreeze;
endFreeze=function(){if(['titan','erenHitstop'].includes(fzType))return;const p=fzType==='counter'?pending?.att:null,before=p?.d;const r=erenBaseEndFreeze();if(p?.cid==='eren')erenGain(p,(p.d-before)*EREN.takenGain);return r;};
function erenPortrait(form=false){
 const skin=form?'#cb9373':'#dfbb95',coat=form?'#9b5b4d':'#967349';
 return `<svg viewBox="0 0 100 82" aria-hidden="true">
 <path d="M0 72L83 0h17v19L26 82H0z" fill="#71c7ae0d"/><circle cx="58" cy="39" r="33" fill="none" stroke="#b7c6a51f"/>
 <path d="M11 76L95 7M1 61L79 1" stroke="#96cabe" stroke-width=".65" opacity=".5"/>
 <g opacity=".2"><path d="M61 76L52 49 60 25 76 21 90 39 100 80" fill="#d49e75"/><path d="M58 34L56 9 69 0h19l12 16-7 32-8-26-16 4-3 20z" fill="#8eae94"/><path d="M76 17l15 5-7 4-9-1m-7 12 23-3-4 11-18-1" fill="#f3dba9"/></g>
 <ellipse cx="49" cy="78" rx="35" ry="3" fill="#030e15a0"/>
 <path d="M40 53L29 75 41 79 49 64 58 79 71 75 58 51" fill="${form?'#a36c57':'#bdb69d'}" stroke="#15252b" stroke-width="2"/>
 <path d="M39 59l-5 15m24-15 7 15" stroke="${form?'#e3ae85':'#5e4d3c'}" stroke-width="3"/>
 <path d="M30 31L12 43 4 64 24 60 39 46" fill="#2e4a3a" stroke="#172930" stroke-width="1.3"/>
 <path d="M29 36L12 54l13-5" fill="#48654b"/>
 <path d="M30 32L45 26 63 31 70 55 59 65 39 61 25 53z" fill="${coat}" stroke="#142129" stroke-width="1.6"/>
 ${form?'<path d="M32 34Q41 26 48 36Q56 27 65 36L58 46H39z" fill="#e2ad83"/><path d="M40 45h7v5h-7zm10 0h7v5h-7zm-9 7h6v5h-6zm9 0h6v5h-6z" fill="#d29670"/><path d="M48 34v25m-12-15 8-4m18 4-8-4" stroke="#7b473c" fill="none"/>':'<path d="M38 31L46 30 57 33 60 56 42 56z" fill="#e4d4b5"/><path d="M30 33l11-4 1 28-15-4m30-22 7 3 6 21-10 6z" fill="#aa8454"/><path d="M33 32l8-2-5 11m22-10 5 3-4 9" fill="#d4ad75"/><path d="M38 34l19 22m0-22-16 22M29 56l35 2" stroke="#393a31" stroke-width="2.4"/><path d="M45 53h7v6h-7z" fill="#bbc0ad" stroke="#3d4c49"/><path d="M30 43h8m21 0h6" stroke="#5d4836"/><path d="M29 37h7v8h-7z" fill="#4e6756"/><path d="M31 38l4 1-3 5m1-5 2 4" fill="none" stroke="#dde5d6" stroke-width=".65"/>'}
 <path d="M31 35L21 45 37 49M62 35L76 46 62 53" fill="none" stroke="#13232a" stroke-width="10" stroke-linecap="round"/>
 <path d="M31 35L21 45 37 49M62 35L76 46 62 53" fill="none" stroke="${form?'#d09b78':'#9e7b4f'}" stroke-width="6" stroke-linecap="round"/>
 <path d="M25 38l-3 6 11 3m33-7 7 6-10 5" fill="none" stroke="${form?'#efc39a':'#c5a471'}" stroke-width="1.5"/>
 <path d="M42 18h12l2 16-10 6-7-8z" fill="${skin}" stroke="#1a272a"/>
 <path d="M32 9L44 2l15 3 7 15-5 13-9 3-14-8z" fill="${skin}" stroke="#14242a" stroke-width="1.4"/>
 <path d="M47 8l10 3 5 10-10 2-3 9-8-6 6-10z" fill="${form?'#e7b08a':'#f3d6ae'}"/>
 <path d="M34 19l8 7 11 9-11-3-8-8z" fill="#ab765c"/>
 <path d="M41 17l19 3-4 4-12-2z" fill="#e9eed6"/><path d="M50 19h4v5h-4z" fill="#559f87"/><path d="M40 16l19 3" stroke="#26342b" stroke-width="1.7"/>
 <path d="M58 24l4 3-6 1m-9 2 9 1" fill="none" stroke="#865b48" stroke-width=".8"/>
 ${form?'<path d="M44 28l16 1-5 7-11-3z" fill="#eee4c4" stroke="#714538"/><path d="M47 29v5m3-5v6m3-6v6m3-6v4" stroke="#794d40" stroke-width=".7"/><path d="M38 23l5 5m-7-2 7 5" stroke="#945448"/>':''}
 <path d="M31 25L27 11 37 1 54-2 66 6 69 20 62 34 61 18 51 11 43 12 37 24 35 34z" fill="#242e27" stroke="#132229" stroke-width="1.1"/>
 <path d="M36 5l-4 12 1 11m9-25-4 17m13-18-7 12m14-9 6 16-2 9" stroke="#52604a" stroke-width="1" fill="none"/>
 ${form?'<path d="M58 50l12 1 4 9-15 5-6-6zM32 46l10 2 1 8-13 2-6-6z" fill="#d9a982" stroke="#17272b"/><path d="M60 54l10 1m-10 3 11 1m-38-9 8 1m-10 3 9 1" stroke="#8c5b4c"/>':'<path d="M26 57l-3 20 10 2 4-20m25 2 5 16 11-5-6-18" fill="#53686b" stroke="#16292d" stroke-width="1.3"/><path d="M27 59l-2 15m4-14-2 15m40-16 5 13m-3-15 5 13" stroke="#b6c7c3" stroke-width="1"/><path d="M35 48L82 9 98 1 86 15 39 52zM61 52L12 12 1 0 15 9 65 49z" fill="#c5e2db" stroke="#263f45" stroke-width=".8"/><path d="M39 48L94 4M62 49L6 3" stroke="#f3fff2" stroke-width="1"/><path d="M33 47l6 7m21-1 6-6" stroke="#6e8f8e" stroke-width="3"/>'}
 <path d="M6 77h17m57-68h15" stroke="#d5c18b" stroke-width="1" opacity=".8"/>
 </svg>`;
}

const erenBasePortrait=portrait;
portrait=function(id,gear=1,form=0,mode=false){return id==='eren'?erenPortrait(!!form):erenBasePortrait(id,gear,form,mode);};
const erenBaseHud=animeHud;
animeHud=function(p){if(p.cid!=='eren')return erenBaseHud(p);const titan=erenTitan(p);return {m:titan?p.erenTime/EREN.duration*100:p.erenGauge,label:p.erenFatigue?'疲労':titan?(p.erenTime<=180?'解除間近 ':'ATTACK TITAN ')+Math.ceil(p.erenTime/60)+'秒':'TITAN GAUGE '+Math.floor(p.erenGauge||0)+'/100'};};
const erenBaseControl=updateControlUI;
updateControlUI=function(){erenBaseControl();const p=byId(myId);if(p?.cid!=='eren')return;setTxt(document.getElementById('combat-hint'),netIssue|| (erenTitan(p)?'特殊：掴み投げ ／ 横：タックル ／ 上：アッパー ／ 下：硬質化':'特殊：ワイヤー ／ 横：急襲 ／ 上：ワイヤー復帰 ／ MAXで下特殊：巨人化'));setTxt(document.querySelector('#btn-g small'),erenTitan(p)?'硬質化':'巨人化');setTxt(document.querySelector('#btn-s small'),erenTitan(p)?'掴み投げ':'ワイヤー');};
const erenBaseHUDDraw=drawHUD;
drawHUD=function(){erenBaseHUDDraw();const list=fighters.filter(f=>!f.shadowClone);const rows=document.getElementById('battle-roster').children;list.forEach((p,i)=>{if(p.cid==='eren'&&rows[i]){rows[i].classList.toggle('titan-expiring',erenTitan(p)&&p.erenTime<=180);rows[i].style.setProperty('--team',p.erenTime<=180&&erenTitan(p)?'#ed975e':p.c);}});};

const erenBaseKO=koFighter;
koFighter=function(p){const saved=p.erenGauge||0;erenBaseKO(p);if(p.cid==='eren'){erenReset(p);if(!p.out)p.erenGauge=Math.min(EREN.respawnCarry,saved);}};
const erenBaseUp=aiUpSpecial;
aiUpSpecial=function(p,I,A){if(erenTitan(p))return false;return erenBaseUp(p,I,A);};

const erenBasePickup=tryPickup;
tryPickup=function(p,id,it){if(p.cid==='eren')return;return erenBasePickup(p,id,it);};
