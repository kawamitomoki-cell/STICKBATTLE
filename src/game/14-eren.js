// Eren module: owner-authoritative state; existing fighters take unchanged paths.
const EREN={duration:1080,cutin:84,fatigue:60,hardTime:120,hardCooldown:360,
 normalGain:6,strongGain:10,takenGain:2,respawnCarry:50,wireTime:42,wireCooldown:12,wireSpeed:14,wireUpSpeed:8,wireDownSpeed:9,wireAccel:1.25,wireLift:.75,steerX:.8,steerY:.8,riseSpeed:7.5,glideTime:12,gasCost:14,gasRefund:6,gasDrain:.16,grabTime:24,grabDamage:20};
CHARS.eren={name:'エレン・イェーガー',en:'EREN YEAGER',mark:'巨',spd:1.20,jump:1.04,jumps:2,wt:1.05,pow:1,size:1,ctx:0,back:false,ctc:1,dgc:.9,dgs:1.1,st:[4,3,2],
 sp:'特殊：ワイヤー付き横回転斬り（命中から攻撃へ連携／出し切りで吹っ飛ばす）／横：立体機動急襲。巨人：掴み投げ・タックル',up:'人間：ほどよく上昇する縦回転斬り（空中1回）／巨人：対空アッパー',ab:'攻撃・被弾でTITAN GAUGE蓄積。MAXで下特殊：18秒の巨人化。ガスは着地で補充。巨人の下特殊：2秒硬質化（再使用6秒）。背後上部のうなじは1.2倍ダメージ'};
SPECIAL_IDS.push('eren');ANIME_COLORS.eren='#b8b276';fighterRoles.eren='ODM / 時間制限巨人化';
const EREN_MOVES={
 erenBlades:{type:'normal',act0:3,act1:10,end:16,reach:28,R:23,yo:33,cd:3,multi:5,dm:5,k0:3,ks:.035,up:.4},
 erenSpin:{type:'heavy',act0:5,act1:12,end:26,reach:32,R:32,yo:30,cd:6,dm:22,k0:18,ks:.11,up:.6},
 erenCrossSpin:{type:'normal',act0:5,act1:16,end:30,reach:0,R:44,yo:32,cd:12,multi:8,dm:4,k0:2,ks:.025,up:.25},
 erenRiseSpin:{type:'normal',act0:4,act1:15,end:28,reach:12,R:30,yo:49,cd:12,multi:6,dm:5,k0:5,ks:.045,up:1.15},
 erenRaid:{type:'heavy',act0:3,act1:32,end:44,reach:34,R:30,yo:32,cd:12,dm:14,k0:4,ks:.04,up:.25,rush:true},
 erenWireCut:{type:'normal',act0:2,act1:9,end:18,reach:32,R:28,yo:32,cd:3,multi:5,dm:5,k0:3,ks:.035,up:.4,rush:true},
 titanPunch:{type:'normal',act0:6,act1:16,end:24,reach:30,R:23,yo:12,cd:5,dm:14,k0:7,ks:.10,up:.65},
 titanSmash:{type:'heavy',act0:16,act1:24,end:54,reach:34,R:25,yo:15,cd:16,dm:28,k0:21,ks:.14,up:.7},
 titanGrab:{type:'heavy',act0:12,act1:18,end:50,reach:20,R:20,yo:28,cd:18,dm:0,k0:0,ks:0,up:0},
 titanTackle:{type:'heavy',act0:8,act1:25,end:40,reach:22,R:24,yo:14,cd:18,dm:18,k0:19,ks:.12,up:.65,lunge:16,rush:true},
 titanUpper:{type:'heavy',act0:10,act1:20,end:40,reach:16,R:25,yo:48,cd:12,dm:18,k0:15,ks:.12,up:1.4}
};
Object.assign(MOVE_DEF,EREN_MOVES);
function erenTitan(p){return p?.cid==='eren'&&p.erenForm===1;}
function fighterSize(p){return erenTitan(p)?3:CC(p.cid).size;}
function fighterConfig(p){
 const c=CC(p.cid);if(!erenTitan(p))return c;
 return {...c,size:3,spd:p.erenHard>0?.48:.82,jump:.78,wt:.40,pow:1,dgs:.65,ctc:1.15};
}
let erenLifeSerial=0;
function erenReset(p){Object.assign(p,{erenLife:isLocal(p)?++erenLifeSerial:0,erenAttacks:new Map(),erenCombo:null,erenGas:100,erenGlide:0,erenImpactToken:null,erenSteerX:0,erenSteerY:0,erenExit:0,erenForm:0,erenGauge:0,erenTime:0,erenFatigue:0,erenHard:0,erenHardCd:0,erenWire:null,erenSlashWire:null,erenWireCd:0,erenGrab:null,erenSwing:0,erenGainTargets:new Set(),erenGaugeReceipts:new Set(),erenGrabSeen:new Set()});}
function erenGain(p,n){
 if(p?.cid!=='eren'||!isLocal(p)||p.out||erenTitan(p)||p.erenFatigue)return;
 const before=p.erenGauge||0;p.erenGauge=Math.min(100,before+Math.max(0,n));
 if(before<100&&p.erenGauge===100)animeNotice(p,'巨人化 READY! ↓特殊','#e6d083');
}
function erenMove(p,kind,extra={}){
 p.erenCombo=null;p.erenSwing=(p.erenSwing||0)+1;p.erenGainTargets=new Set();
 const token=p.id+':'+curRound+':'+p.erenLife+':'+p.erenSwing;
 p.mv={...mkMv(kind),...extra,erenToken:token};p.a=1;p.ch=0;p.hit={};
 p.erenAttacks.set(token,{kind,type:p.mv.type,connected:false});
 if(p.erenAttacks.size>128)p.erenAttacks.delete(p.erenAttacks.keys().next().value);
 tone(erenTitan(p)?85:750,erenTitan(p)?32:210,.14,.14,'triangle');noiseHit(.08,.15,1800,true);
}
function erenAttack(p,ch){
 if(p.erenFatigue)return;
 if(erenTitan(p)&&p.erenHard>0){erenMove(p,'titanPunch',{end:42});return;}
 if(ch<CH_TH)erenMove(p,erenTitan(p)?'titanPunch':p.erenWire?'erenWireCut':'erenBlades');
 else{const q=constrain((ch-CH_TH)/(CH_FULL-CH_TH),0,1);erenMove(p,erenTitan(p)?'titanSmash':'erenSpin',{dm:erenTitan(p)?18+10*q:12+10*q,k0:erenTitan(p)?17+7*q:10+8*q});}
}
function erenAnchor(p,up){
 let best=null,score=Infinity;
 for(let i=0;i<stage.plats.length;i++){
  const pl=stage.plats[i];if(up&&pl.y>p.y-35)continue;
  const x=constrain(p.x+(up?p.f*40:p.f*210),pl.x+Math.min(48,pl.w/3),pl.x+pl.w-Math.min(48,pl.w/3)),y=pl.y;
  const d=Math.hypot(x-p.x,y-(p.y-35));if(d<35||d>440||!up&&(x-p.x)*p.f<25)continue;
  const value=d+(up?0:Math.abs(y-(p.y-35))*1.4);
  if(value<score){score=value;best={x,y,pl:i,t:EREN.wireTime};}
 }
 return best;
}
function erenWire(p,up=false){
 if(!up&&p.erenWireCd>0||up&&p.rec){sfxNo();return false;}
 if(p.erenGas<EREN.gasCost){animeNotice(p,'ガス不足 ― 着地で補充','#b9d5c7');return false;}
 const anchor=erenAnchor(p,up);if(!anchor){animeNotice(p,'アンカー接続先なし','#c9d5de');return false;}
 p.erenGas-=EREN.gasCost;p.erenSlashWire=null;p.erenWire=anchor;if(p.g){p.vy=-3;p.g=false;}p.erenWireCd=EREN.wireCooldown;if(up)p.rec=true;p.inv=Math.max(p.inv,4);
 p.spc=12;noiseHit(.1,.14,3500,true);return true;
}
function erenCutin(e){
 const p=byId(e.id);if(!p||p.cid!=='eren')return;
 // State snapshots restore the form after reconnect; cinematics are cosmetic after validation.
 freezeT=EREN.cutin;freezeMax=EREN.cutin;fzType='titan';fz={x:e.x,y:e.y,att:e.id};
 tone(70,27,.4,.22,'sawtooth',.25);noiseHit(.22,.2,1100,false,.25);tone(95,33,.45,.17,'sawtooth',.74);tone(51,25,.42,.13,'triangle',.76);noiseHit(.36,.12,650,false,.76);
}
function erenTransform(p){
 if(p.erenGauge<100||p.erenFatigue||erenTitan(p)||p.out)return false;
 clearActs(p);p.erenExit=0;p.erenForm=1;p.erenTime=EREN.duration;p.erenGauge=0;p.erenWire=null;p.erenSlashWire=null;p.erenGrab=null;p.erenHard=0;p.inv=Math.max(p.inv,90);p.kb=p.stn=0;p.vx=p.vy=0;
 // Feet remain on their current surface. Extra size grows upward, never into the floor.
 const e={id:p.id,x:Math.round(p.x),y:Math.round(p.y)};
 // Reuse hit transport so remote targets apply damage on their own owner, once.
 for(const t of fighters){
  if(t===p||t.out||sameTeam(p,t)||Math.hypot(t.x-p.x,t.y-p.y)>190)continue;
  const q={o:p.id,x:p.x,y:p.y-40,dir:Math.sign(t.x-p.x)||p.f,dm:16,k0:16,ks:.08,up:.8};
  if(isLocal(t))resolveProj(q,t);else send({k:'ph',to:t.id,q});
 }
 if(online)requestCinematic('titan',e);else erenCutin(e);
 return true;
}
function erenRevert(p){
 if(online&&isLocal(p))send({k:'eren-revert',id:p.id});
 p.erenExit=24;p.erenForm=0;p.erenTime=0;p.erenGauge=0;p.erenHard=0;p.erenWire=null;p.erenSlashWire=null;p.erenFatigue=EREN.fatigue;clearActs(p);
 burst(p.x,p.y-80,30,5,'#e2e1d1',15);animeNotice(p,'巨人化解除 ― 疲労','#c9d5de');
}
function erenSpecial(p,inp){
 if(p.erenFatigue||p.erenHard>0)return;
 const up=inp.u&&!inp.neutralSpecial&&!inp.sideSpecial,down=inp.gd||inp.d&&!inp.neutralSpecial&&!inp.sideSpecial;
 const side=inp.sideSpecial||(!inp.neutralSpecial?((inp.r?1:0)-(inp.l?1:0)):0);
 if(p.spc>0&&!(up&&!erenTitan(p)))return;
 if(down){
  if(erenTitan(p)){
   if(p.erenHardCd>0){animeNotice(p,'硬質化 再使用 '+Math.ceil(p.erenHardCd/60)+'秒','#b7dce6');return;}
   clearActs(p);p.erenHard=EREN.hardTime;p.erenHardCd=EREN.hardCooldown;
   animeNotice(p,'硬質化','#b7dce6');tone(440,110,.2,.14,'triangle');
  }else if(!erenTransform(p))animeNotice(p,'TITAN GAUGE '+Math.floor(p.erenGauge||0)+'/100','#e6d083');
 }else if(erenTitan(p)){
  erenMove(p,up?'titanUpper':side?'titanTackle':'titanGrab');p.spc=up?40:side?54:65;
  if(side)p.f=side;
 }else if(up){
  if(p.rec){sfxNo();return;}
  p.erenWire=null;p.erenGlide=0;p.vx=constrain(p.vx,-5,5);p.vy=-EREN.riseSpeed;p.g=false;p.groundPl=-1;p.rec=true;
  erenMove(p,'erenRiseSpin');p.spc=36;
 }
 else if(side){p.f=side;if(erenWire(p,false)){erenMove(p,'erenRaid');p.spc=56;}}
 else{const anchor=p.erenWire||erenAnchor(p,false);p.erenSlashWire=anchor?{...anchor,t:EREN.wireTime}:null;p.erenWire=null;p.erenGlide=0;p.vx=constrain(p.vx,-6,6);p.vy=constrain(p.vy,-4,8);erenMove(p,'erenCrossSpin');p.spc=42;}
}
// Explicit world-space giant hurtbox and fist shapes; normal fighters use their original geometry.
const EREN_TITAN_BODY={halfWidth:45,height:225,napeX:19,napeY:171,napeRadius:11};
const EREN_TITAN_HITS={
 titanPunch:{reach:90,height:36,radius:34},titanSmash:{reach:110,height:45,radius:42},
 titanGrab:{reach:64,height:85,radius:44},titanTackle:{reach:55,height:50,radius:56},
 titanUpper:{reach:42,height:144,radius:50}
};
function erenAttackShape(p){
 const h=EREN_TITAN_HITS[p.mv?.kind];
 return h?{x:p.x+p.f*h.reach,y:p.y-h.height,r:h.radius}:null;
}
function erenBody(p){return {left:p.x-EREN_TITAN_BODY.halfWidth,right:p.x+EREN_TITAN_BODY.halfWidth,top:p.y-EREN_TITAN_BODY.height,bottom:p.y};}
function erenBodyHit(p,x,y,r=0){
 const b=erenBody(p);return Math.hypot(x-constrain(x,b.left,b.right),y-constrain(y,b.top,b.bottom))<=r;
}
function erenNape(p,x,y,r=0){return erenTitan(p)&&Number.isFinite(x)&&Number.isFinite(y)&&(x-p.x)*p.f<0&&Math.hypot(x-(p.x-p.f*EREN_TITAN_BODY.napeX),y-(p.y-EREN_TITAN_BODY.napeY))<EREN_TITAN_BODY.napeRadius+Math.min(18,r);}
function erenMeleeNape(A,t){
 // Use transmitted impact geometry: remote animation can lag behind the hit event.
 const c=A.contact;
 if(c&&[c.x,c.y,c.r,A.x].every(Number.isFinite)&&c.r>=0&&c.r<=180&&Math.abs(c.x-A.x)<=450)
  return erenNape(t,c.x,c.y,c.r);
 const a=byId(A.id),m=a?.mv;if(!a||!m||m.kind!==A.mv.kind)return false;
 const hit=erenTitan(a)?erenAttackShape(a):null;
 return erenNape(t,hit?.x??a.x+a.f*m.reach*fighterSize(a),hit?.y??a.y-m.yo*fighterSize(a),hit?.r??m.R*fighterSize(a));
}
function erenGrabStart(A,t){
 const a=byId(A.id),token=A.mv.erenToken;
 if(!erenTitan(a)||a.out||t.out||sameTeam(a,t)||isInvuln(t)||t.timeStopT>0||typeof token!=='string'||token.length>200||t.erenGrab||erenTitan(t))return;
 if(a.erenLife&& !token.startsWith(a.id+':'+curRound+':'+a.erenLife+':'))return;
 if(Math.abs(a.x-t.x)>140||Math.abs(a.y-t.y)>140)return;
 if(inCounter(t)&&fromFront(t,A.x??a.x)){erenBaseMelee({...A,x:A.x??a.x,mv:{...A.mv,dm:EREN.grabDamage}},t);return;}
 if(t.shadowClone){shadowClonePop(t);return;}
 const seen=t.erenGrabSeen||(t.erenGrabSeen=new Set());if(seen.has(token))return;seen.add(token);if(seen.size>64)seen.delete(seen.values().next().value);
 clearActs(t);t.erenGrab={by:a.id,dir:a.f,t:EREN.grabTime,token};t.vx=t.vy=0;
}
function erenGrabTick(p){
 const g=p.erenGrab;if(!g)return false;
 const a=byId(g.by);
 if(!a||a.out||a.kb>0||a.stn>0||a.timeStopT>0||a.domainT>0||!erenTitan(a)||p.out||Math.abs(a.x-p.x)>220||Math.abs(a.y-p.y)>220){p.erenGrab=null;return false;}
 p.x=a.x+g.dir*64;p.y=a.y-55;p.vx=p.vy=0;clearActs(p);p.g=false;
 if(--g.t<=0){
  p.erenGrab=null;
  const kb=applyHit(p,{dm:EREN.grabDamage,k0:21,ks:.12,up:.65,f:g.dir},false,a.id);
  emitFx({res:'hit',a:a.id,t:p.id,x:p.x,y:p.y-30,kb,gain:8,c:p.c});
 }
 return true;
}
function erenTick(p){
 if(!erenTitan(p))p.erenGas=Math.min(100,(p.erenGas??100)+(p.g?2.5:.08));
 for(const key of ['erenExit','erenGlide','erenWireCd','erenHard','erenHardCd','erenFatigue'])if(p[key]>0)p[key]--;
 if(erenTitan(p)&&p.erenTime>0&&--p.erenTime===0)erenRevert(p);
 const slash=p.erenSlashWire;
 if(slash){const pl=stage.plats[slash.pl];if(!pl||slash.x<pl.x||slash.x>pl.x+pl.w||slash.y!==pl.y||--slash.t<=0||p.kb>0||p.out)p.erenSlashWire=null;}
 if(p.mv?.kind==='titanTackle'&&p.g&&p.a>=p.mv.act0&&p.a<=p.mv.act1&&p.a%6===0)burst(p.x-p.f*25,p.y,4,3,'#b6ac8d',6);
 const w=p.erenWire;
 if(w){
  const pl=stage.plats[w.pl];
  p.erenGas=Math.max(0,p.erenGas-EREN.gasDrain);
  if(p.erenGas<=0||!pl||w.x<pl.x||w.x>pl.x+pl.w||w.y!==pl.y||--w.t<=0||p.kb>0||p.out){p.erenWire=null;if(!p.kb&&!p.out)p.erenGlide=EREN.glideTime;return;}
  const dx=w.x-p.x,dy=w.y-(p.y-35),d=Math.hypot(dx,dy);
  if(w.docked||d<24||Math.abs(dx)<24&&Math.abs(w.y-p.y)<48){
   if(!w.docked){p.erenGlide=0;p.vx*=.45;w.docked=true;}
   return; // Stay attached until expiry; reaching the anchor stops thrust, not the wire.
  }
  p.vx=constrain(p.vx+dx/d*EREN.wireAccel+(p.erenSteerX||0)*EREN.steerX,-EREN.wireSpeed,EREN.wireSpeed);p.vy=constrain(p.vy+dy/d*EREN.wireLift+(p.erenSteerY||0)*EREN.steerY,-EREN.wireUpSpeed,EREN.wireDownSpeed);
  if(w.y<p.y-20){p.g=false;p.groundPl=-1;}
 }
}
// Restore only bounded, known Eren fields. No arbitrary remote object assignment.
function erenReadState(s){
 const n=(key,max)=>Number.isFinite(s[key])?constrain(s[key],0,max):0;
 const form=s.ef===1?1:0;
 const readWire=wire=>{
  const pl=wire&&Number.isInteger(wire.pl)?stage.plats[wire.pl]:null;
  return pl&&Number.isFinite(wire.x)&&wire.x>=pl.x&&wire.x<=pl.x+pl.w&&wire.y===pl.y&&Number.isFinite(wire.t)&&wire.t>0?
   {x:wire.x,y:wire.y,pl:wire.pl,t:Math.min(wire.t,EREN.wireTime),docked:wire.docked===true}:null;
 };
 return {erenLife:Math.floor(n('ep',1e9)),erenExit:n('ex',24),erenGas:n('eo',100),erenGlide:n('el',EREN.glideTime),erenForm:form,erenGauge:n('eg',100),erenTime:form?n('et',EREN.duration):0,
  erenHard:form?n('eh',EREN.hardTime):0,erenHardCd:n('ec',EREN.hardCooldown),erenFatigue:n('ez',EREN.fatigue),erenSwing:n('es',1e6),
  erenWire:readWire(s.ew),erenSlashWire:readWire(s.ewc),
  erenGrab:s.eb&&typeof s.eb.by==='string'&&byId(s.eb.by)&&Number.isFinite(s.eb.t)?{by:s.eb.by,dir:s.eb.dir===-1?-1:1,t:constrain(s.eb.t,0,EREN.grabTime)}:null};
}
const erenBaseInit=animeInit;
animeInit=function(p){erenBaseInit(p);if(p.cid==='eren')erenReset(p);};
const erenBaseAttack=fireAttack;
fireAttack=function(p,ch){if(p.cid==='eren')return erenAttack(p,ch);return erenBaseAttack(p,ch);};
function erenPrepareSpin(p){
 if(p.mv?.kind!=='erenCrossSpin')return;
 const finish=p.a>=13;
 Object.assign(p.mv,finish?{type:'heavy',R:64,dm:14,k0:13,ks:.10,up:.55}:{type:'normal',R:44,dm:4,k0:2,ks:.025,up:.25});
}
function erenSpinFollow(p,inp){
 const m=p.mv;
 if(m?.kind!=='erenCrossSpin'||p.kb||p.stn||p.ct||p.dg||p.domainT){p.erenCombo=null;return;}
 // Buffer quick taps while the opening cut is still starting. Whiffs retain their recovery.
 if(inp.ac!==p.prev.ac&&p.a>=2&&p.a<=m.end)p.erenCombo={token:m.erenToken,left:18,released:!inp.a};
 const q=p.erenCombo;if(!q)return;
 if(inp.rc!==p.prev.rc||!inp.a)q.released=true;
 if(--q.left<=0||q.token!==m.erenToken){p.erenCombo=null;return;}
 const record=p.erenAttacks.get(q.token);
 if(p.a<7||!record?.connected)return;
 const target=byId(record.target),aim=(inp.r?1:0)-(inp.l?1:0);
 if(aim)p.f=aim;else if(target&&!target.out&&Math.abs(target.x-p.x)<120)p.f=Math.sign(target.x-p.x)||p.f;
 clearActs(p);p.cd=0;p.erenCombo=null;
 if(q.released)erenAttack(p,1);else p.ch=1;
}
const erenBaseStep=stepFighter;
stepFighter=function(p,inp){
 const attackEdge=inp.ac!==p.prev.ac;
 if(p.cid==='eren'&&bt.phase==='play'&&!freezeT&&!p.out){
  if(p.domainT>0){p.erenWire=null;p.erenSlashWire=null;p.erenGlide=0;}
  const side=inp.sideSpecial||(!inp.neutralSpecial&&!inp.u?((inp.r?1:0)-(inp.l?1:0)):0);
  const mobility=!!side&&!inp.gd&&(!inp.d||inp.sideSpecial);
  if(!erenTitan(p)&&!p.erenFatigue&&!p.timeStopT&&!p.domainT){
   if(inp.sc!==p.prev.sc&&(inp.gd||inp.d)&&p.erenGauge>=100){erenTransform(p);p.prev={...inp};return;}
   p.erenSteerX=(inp.r?1:0)-(inp.l?1:0);p.erenSteerY=(inp.d?1:0)-(inp.u?1:0);
   // Check the requested facing, including while a previous slash locks body facing.
   // At the right edge, the old right-facing anchor may not exist even though a left one does.
   const wireFacing=inp.sideSpecial||p.erenSteerX||p.f;
   if(mobility&&inp.sc!==p.prev.sc&&!p.kb&&!p.stn&&!p.erenWireCd&&
      p.erenGas>=EREN.gasCost&&erenAnchor({x:p.x,y:p.y,f:wireFacing},false)){
    clearActs(p);p.spc=p.cd=0;
   }
   // Change travel thrust into a braced spin without losing the connected wire.
   if(p.erenWire&&inp.sc!==p.prev.sc&&!p.kb&&!p.stn&&!inp.gd&&!inp.d&&(!side)&&(!inp.u||!p.rec)){
    clearActs(p);p.spc=p.cd=0;
   }
   if(p.erenSlashWire&&inp.jc!==p.prev.jc)p.erenSlashWire=null;
   erenSpinFollow(p,inp);
   if(p.erenWire&&inp.ac!==p.prev.ac&&!p.kb&&!p.stn){clearActs(p);p.cd=0;}
   if(p.erenWire&&inp.jc!==p.prev.jc){
    const moving=!p.erenWire.docked;p.erenWire=null;
    if(moving){p.erenGlide=EREN.glideTime;p.vy=constrain(p.vy,-EREN.riseSpeed,-3);p.prev.jc=inp.jc;}
    else p.erenGlide=0;
   }
  }
  if(!p.timeStopT){erenTick(p);if(p.erenFatigue){p.prev={...inp};inp={...inp,l:false,r:false,u:false,d:false,a:false,s:false,gd:false,sideSpecial:0,neutralSpecial:false};}}
 }
 if(p.erenGrab&&!freezeT&&!p.timeStopT){if(erenGrabTick(p)){p.prev={...inp};return;}}
 const result=erenBaseStep(p,inp);
 if(p.cid==='eren'&&!erenTitan(p)&&bt.phase==='play'&&!freezeT&&!p.out&&!p.kb&&!p.stn&&!p.timeStopT&&
    attackEdge&&p.mv?.kind==='erenCrossSpin'&&p.a<=2&&!p.erenCombo)
  p.erenCombo={token:p.mv.erenToken,left:18,released:!inp.a};
 return result;
};
const erenBaseMeleeCheck=meleeCheck;
meleeCheck=function(p){erenPrepareSpin(p);return erenBaseMeleeCheck(p);};
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
 if(t.d>before){erenGain(t,(t.d-before)*EREN.takenGain);t.erenWire=null;t.erenSlashWire=null;t.erenGrab=null;}
 return kb;
};
const erenBaseArmorHit=armorHit;
armorHit=function(t,h,id){const before=t.d;erenBaseArmorHit(t,h,id);erenGain(t,(t.d-before)*EREN.takenGain);};
const erenBaseFx=playFx;
playFx=function(e,remote){
 erenBaseFx(e,remote);
 const a=byId(e.a);
 if(a?.cid==='eren'&&isLocal(a)&&['hit','armor'].includes(e.res)){
  const tokenHit=e.erenToken||a.mv?.erenToken;
  if(e.res==='hit'&&a.erenAttacks.has(tokenHit)){const hit=a.erenAttacks.get(tokenHit);hit.connected=true;hit.target=e.t;}
  const targets=a.erenGaugeReceipts||(a.erenGaugeReceipts=new Set()),token=e.erenToken||a.mv?.erenToken,attack=a.erenAttacks.get(token),key=token+':'+e.t;
  if(attack&&!targets.has(key)){
   targets.add(key);if(targets.size>128)targets.delete(targets.values().next().value);
   erenGain(a,attack.type==='heavy'?EREN.strongGain:EREN.normalGain);
   // Reward committed aerial attacks, once per swing/target rather than each multi-hit.
   if(!erenTitan(a)&&['erenRaid','erenWireCut'].includes(attack.kind))
    a.erenGas=Math.min(100,(a.erenGas??100)+EREN.gasRefund);
  }
  if((erenTitan(a)&&a.mv?.kind==='titanSmash'||!erenTitan(a)&&['erenSpin','erenCrossSpin'].includes(a.mv?.kind)&&a.mv?.type==='heavy')&&e.res==='hit'&&a.erenImpactToken!==a.mv.erenToken){
   a.erenImpactToken=a.mv.erenToken;
   if(!online){const impact=erenTitan(a)?8:4;freezeT=Math.max(freezeT,impact);freezeMax=impact;fzType='erenHitstop';fz=null;}shake=Math.max(shake,erenTitan(a)?12:6);ring(e.x,e.y,erenTitan(a)?20:12,16);
  }
 }
};
const erenBaseState=stateOf;
stateOf=function(p){const s=erenBaseState(p);if(p.cid==='eren')Object.assign(s,{ep:p.erenLife||0,ex:p.erenExit||0,eo:p.erenGas??100,el:p.erenGlide||0,ef:p.erenForm||0,eg:p.erenGauge||0,et:p.erenTime||0,eh:p.erenHard||0,ec:p.erenHardCd||0,ez:p.erenFatigue||0,ew:p.erenWire,ewc:p.erenSlashWire,es:p.erenSwing||0});if(p.erenGrab)s.eb=p.erenGrab;return s;};
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
 if(!erenTitan(p))return [{name:'special',dir:'neutral',type:'heavy',range:76,startup:5,damage:18,recovery:14,hold:2},{name:'side',dir:'side',range:210,startup:3,damage:14,recovery:12,hold:2,
  ready:()=>p.erenGas>=EREN.gasCost&&!p.erenWireCd&&!!erenAnchor(p,false)}];
 return [{name:'special',dir:'neutral',range:115,startup:12,damage:EREN.grabDamage,recovery:32,hold:2,
   ready:()=>!erenTitan(t)},
  {name:'side',dir:'side',range:175,startup:8,damage:18,recovery:15,hold:2,ready:()=>{const pl=stage.plats[p.groundPl];return p.g&&!!pl&&p.x+p.f*175>pl.x+16&&p.x+p.f*175<pl.x+pl.w-16;}}];
};
const erenBaseTactics=aiTacticalAction;
aiTacticalAction=function(p,t,A,I,D,plan){
 if(p.cid==='eren'&&aiReady(p)&&!p.erenFatigue&&!p.erenHard&&!p.spc){
  const dist=Math.abs(t.x-p.x),floor=stage.plats[p.groundPl];
  if(!erenTitan(p)&&p.erenGauge<100&&!p.erenWire&&!p.erenWireCd&&dist>160&&dist<330&&Math.sign(t.x-p.x)===p.f&&!!erenAnchor(p,false)){aiUseSpecial(p,I,A,2,'side');return 'wire-approach';}
  if(!erenTitan(p)&&!p.rec&&t.y<p.y-35&&t.y>p.y-110&&dist<65){aiUseSpecial(p,I,A,2,'up');return 'eren-vertical-spin';}
  if(erenTitan(p)&&t.y<p.y-45&&dist<95){aiUseSpecial(p,I,A,2,'up');return 'titan-anti-air';}
  if(!erenTitan(p)&&p.erenGauge>=100&&p.g&&floor?.w>=102&&p.x-floor.x>=45&&floor.x+floor.w-p.x>=45&&dist<360&&(t.d>65||p.d>65||dist<220||p.s<t.s)){aiUseSpecial(p,I,A,2,'down');return 'titan-transform';}
  if(erenTitan(p)&&p.g&&!p.erenHardCd&&t.mv?.type==='heavy'&&t.a<=t.mv.act1&&dist<130&&p.d>70){aiUseSpecial(p,I,A,2,'down');return 'titan-harden';}
 }
 return erenBaseTactics(p,t,A,I,D,p.cid==='eren'&&erenTitan(p)?{...plan,ideal:110,near:65}:plan);
};
const erenBaseProfile=aiMeleeProfile;
aiMeleeProfile=function(p,hold=2){
 if(p.cid!=='eren')return erenBaseProfile(p,hold);
 const titan=erenTitan(p),charged=hold>=CH_TH&&!p.erenHard;
 const kind=titan?(charged?'titanSmash':'titanPunch'):(charged?'erenSpin':p.erenWire?'erenWireCut':'erenBlades');
 const m=EREN_MOVES[kind],shape=EREN_TITAN_HITS[kind];
 return {range:shape?shape.reach+shape.radius:m.reach+m.R,startup:m.act0+hold,
  damage:!titan?(charged?12+10*constrain((hold-CH_TH)/(CH_FULL-CH_TH),0,1):10):m.dm,hold,type:m.type,recovery:(p.erenHard?42:m.end)-m.act1};
};
// One pose source for fists, grip/throw animation and the giant's attack indicators.
function erenHandPose(p,titan=erenTitan(p)){
 const m=p.mv,active=m&&p.a>=m.act0&&p.a<=m.act1;
 let hx=18,hy=-35;
 if(p.ch>0||m?.kind==='titanSmash'&&p.a<m.act0){hx=-23;hy=-43;}
 if(active){const h=titan?EREN_TITAN_HITS[m.kind]:null;hx=h?h.reach/3:m.reach;hy=h?-h.height/3:-m.yo;}
 if(titan&&m?.kind==='titanGrab'&&p.a>=m.act0&&p.a<44){hx=p.a<36?64/3:36;hy=-85/3;}
 if(p.ct>0||p.erenHard>0&&!active){hx=12;hy=-49;}
 if(p.erenBite){hx=2;hy=-60;}
 if(p.erenRoar){hx=24;hy=-30;}
 const second=titan?m?.kind==='titanPunch'&&(p.erenSwing||0)%2===0:
  active&&p.a>=m.act0+(m.multi||5);
 return {hx,hy,second};
}
// Presentation is generated geometry and synthesized effects only.
function erenDrawBody(p,t,titan=erenTitan(p)){
 const sc=titan?3:1,m=p.mv,active=m&&p.a>=m.act0&&p.a<=m.act1;
 const skin=flash[p.id]>0?'#fff9e8':titan?'#c5987c':'#e3c3a5',base=titan?'#bb876c':'#aa8254';
 const walk=p.g?Math.sin(t*.30)*Math.min(4,Math.abs(p.vx||0))*1.5:4;
 push();translate(p.x,p.y);scale(sc);scale(p.f,1);
 if(p.erenRoar){translate(0,-28);rotate(-.12);translate(0,28);}
 if(!titan&&['erenSpin','erenRiseSpin'].includes(m?.kind)&&active){translate(0,-35);rotate((p.a-m.act0)/(m.act1-m.act0)*TWO_PI);translate(0,35);}
 if(!titan&&m?.kind==='erenCrossSpin'&&active)scale(.72+.28*Math.abs(Math.cos(p.a*.55)),1);
 if(!titan&&(p.erenWire||p.erenGlide>0))rotate(constrain((p.vx||0)*p.f*.022,-.5,.5));
 if(isInvuln(p)){if(titan){noStroke();fill(244,210,128,22);ellipse(0,-38,78,105);noFill();stroke(245,213,138,125);strokeWeight(1.1);ellipse(0,-38,73,100);}else if(t%8<3)drawingContext.globalAlpha*=.55;}
 // Same blank face, rounded limbs and costume silhouette as the other SPECIAL fighters.
 if(!titan){noStroke();fill('#244d3d');beginShape();vertex(-8,-51);vertex(-23,-47);vertex(-34-Math.abs(p.vx)*.7,-24-Math.sin(t*.15)*3);vertex(-21,-30);vertex(-23,-20);vertex(-8,-29);endShape(CLOSE);}
 for(const side of [-1,1]){
  const foot=side*10+side*walk;
  stroke('#111b29');strokeWeight(11);line(side*7,-24,foot,-5);
  stroke(titan?skin:'#d7d0b8');strokeWeight(8);line(side*7,-24,foot,-5);
  stroke(titan?'#a4775f':'#514238');strokeWeight(5);line(foot,-8,foot,-2);
  if(!titan){stroke('#8e9b93');strokeWeight(1.2);line(foot-3,-1,foot+5,-1);}
 }
 stroke('#172334');strokeWeight(1.5);fill(base);quad(-12,-50,12,-50,15,-25,-15,-25);
 if(titan){
  fill('#d5a789');quad(-16,-49,16,-49,11,-37,-11,-37);
  noFill();stroke('#a5735d');strokeWeight(1);line(0,-47,0,-28);line(-9,-39,9,-39);line(-5,-32,5,-32);
 }else{
  fill('#e6deca');triangle(-8,-50,0,-36,8,-50);
  fill('#a18458');quad(-12,-50,-5,-49,-6,-28,-14,-26);quad(5,-49,12,-50,14,-26,6,-28);
  stroke('#3d463c');strokeWeight(2);line(-8,-46,7,-27);line(8,-46,-7,-27);line(-12,-26,12,-26);
  noStroke();fill('#c7cdbc');rect(-3,-29,6,4,1);
  for(const side of [-1,1]){fill('#5c7275');stroke('#172334');strokeWeight(1);rect(side<0?-22:14,-26,8,17,2);stroke('#ced7d0');strokeWeight(.8);line(side<0?-19:17,-23,side<0?-19:17,-12);}
  // Survey Corps wing patch: recognisable costume without adding facial detail.
  fill('#e1e5d5');stroke('#344a50');strokeWeight(.6);rect(-13,-46,7,8,1);
  stroke('#4e8295');line(-12,-40,-8,-45);line(-12,-42,-9,-45);stroke('#9ba9aa');line(-10,-40,-7,-43);
  stroke('#4d4a40');strokeWeight(1.5);line(-11,-21,-6,-8);line(11,-21,6,-8);
 }
 // Keep the roster's rounded face; distinguish the forms through hair and silhouette.
 stroke('#152131');strokeWeight(1.3);fill(skin);ellipse(0,-59,20,22);
 fill('#302e29');noStroke();beginShape();
 if(titan){for(const [x,y]of [[-13,-48],[-16,-60],[-13,-72],[-6,-77],[7,-76],[16,-67],[14,-48],[9,-56],[8,-66],[1,-69],[-7,-65],[-9,-53]])vertex(x,y);}
 else{for(const [x,y]of [[-12,-57],[-12,-69],[-6,-75],[5,-74],[13,-67],[11,-57],[7,-65],[3,-69],[0,-63],[-3,-69],[-8,-65],[-10,-55]])vertex(x,y);}
 endShape(CLOSE);
 if(titan){fill(skin);triangle(-11,-61,-17,-64,-12,-55);triangle(11,-61,17,-64,12,-55);fill('#b98b70');quad(-6,-54,8,-54,5,-48,-3,-49);stroke('#8bbe9d');strokeWeight(1.2);line(3,-60,7,-61);if(p.erenRoar){noStroke();fill('#594d42');ellipse(4,-53,5,7);}else{stroke('#755d50');strokeWeight(.7);line(0,-53,7,-54);}}

 const {hx,hy,second}=erenHandPose(p,titan);
 animeArm(second?-8:8,-45,hx,hy,titan?skin:base,titan?11:5);
 animeArm(second?8:-8,-45,p.erenRoar?-24:-18,p.erenRoar?-30:-29,titan?skin:base,titan?10:5);
 noStroke();fill(p.erenHard>0?'#bedce6':skin);circle(hx,hy,titan?15:7);circle(p.erenRoar?-24:-18,p.erenRoar?-30:-29,titan?12:7);
 if(titan&&m?.kind==='titanGrab'&&p.a>=m.act0&&p.a<36){stroke(skin);strokeWeight(2);for(let i=0;i<4;i++)line(hx+3,hy-5+i*3,hx+10,hy-7+i*3);}
 if(titan){
  noFill();stroke(225,231,217,70);strokeWeight(1);for(let i=0;i<3;i++){const q=(t*.012+i*.3)%1;bezier(-13+i*12,-49-q*10,-24+i*12,-60-q*12,4+i*12,-62-q*12,-7+i*12,-74-q*10);}
 }else{
  const blade=(x,y,ang)=>{push();translate(x,y);rotate(ang);stroke('#172334');strokeWeight(3.3);line(0,0,28,-19);stroke('#edf4df');strokeWeight(2);line(0,0,28,-19);stroke('#90b1ad');strokeWeight(.7);line(0,1,27,-17);stroke('#80938b');strokeWeight(2);line(-3,-3,3,2);pop();};
  blade(hx,hy,active?Math.sin(p.a*.8)*.5:0);blade(-18,-29,active?-Math.sin(p.a*.8)*.5:.3);
  if(p.erenWire||p.dg>0){noStroke();for(let i=0;i<4;i++){fill(200,232,220,85-i*15);ellipse(-25-i*8,-23+i*2,8+i*5,5+i*2);}}
 }
 if(active&&m.kind!=='titanGrab'){
  const h=titan?EREN_TITAN_HITS[m.kind]:null,reach=h?h.reach/3:m.reach,yo=h?h.height/3:m.yo,R=h?h.radius/3:m.R;
  const finisher=titan||m.type==='heavy';
  if(m.kind==='erenCrossSpin'){noFill();stroke(finisher?'#ffe2a0':'#a2f1df');strokeWeight(finisher?4:2.4);ellipse(0,-32,finisher?140:100,finisher?34:24);arc(0,-32,finisher?144:104,finisher?38:28,p.a*.6,p.a*.6+PI*1.3);}
  noFill();stroke(finisher?'#ffd88e':'#86ddd0');strokeWeight(titan?2.5:3);arc(reach,-yo,R*2,R*2,-1.4,1.2);
  stroke(titan?'#fff0bf':'#f0fff1');strokeWeight(1);arc(reach+1,-yo,R*2+3,R*2+3,-1.3,1.1);
 }
 pop();
}
function drawEren(p){
 if(p.out)return;
 const wire=p.erenWire||p.erenSlashWire;
 if(wire){push();stroke('#d5e8e1');strokeWeight(1.4);for(const offset of [-12,12])line(p.x+offset,p.y-27,wire.x,wire.y);noStroke();fill('#dce2bd');circle(wire.x,wire.y,6);pop();}
 if(!erenTitan(p)&&(p.erenWire||p.erenGlide>0)&&Math.abs(p.vx)>8){for(let i=2;i>=1;i--){push();drawingContext.globalAlpha*=.12/i;erenDrawBody({...p,x:p.x-p.vx*i*.8,y:p.y-p.vy*i*.8,inv:0},visualFrame-i*2);pop();}}
 if(p.erenExit>0){push();drawingContext.globalAlpha*=p.erenExit/24*.55;erenDrawBody({...p,inv:0,mv:null,ch:0},visualFrame,true);pop();}
 erenDrawBody(p,visualFrame);
 if(!erenTitan(p)){push();noStroke();fill('#091621');rect(p.x-23,p.y-86,46,3,1);fill(p.erenGas>=EREN.gasCost?'#83d5ba':'#e2a46c');rect(p.x-23,p.y-86,46*(p.erenGas??100)/100,3,1);pop();}
 push();textAlign(CENTER,CENTER);textSize(12);stroke('#111b22');strokeWeight(3);fill(p.c);text(p.label,p.x,p.y-(erenTitan(p)?240:94));pop();
}
const erenBaseDraw=drawFighter;
drawFighter=function(p){if(p.cid==='eren')return drawEren(p);return erenBaseDraw(p);};
function erenPaintCutin(){
 const p=byId(fz?.att);if(!p)return;
 const q=1-freezeT/Math.max(1,freezeMax),x=W*.54,y=WH*.69;
 push();noStroke();fill(3,8,17,prefs.lowFlash?175:220);rect(0,0,W,WH);
 // Match the established awakening: world freeze, radial energy, actor reveal,
 // then the shared letterbox/diagonal title renderer used by the other forms.
 const energy=Math.max(0,(q-.18)/.82);
 for(let i=0;i<24;i++){
  const a=i*TWO_PI/24,r=65+(i%4)*10;
  stroke(219,193,115,prefs.lowFlash?45:105);strokeWeight(i%4===0?2.4:1);
  line(x+Math.cos(a)*r,y-100+Math.sin(a)*r*.6,x+Math.cos(a)*(r+energy*210),y-100+Math.sin(a)*(r+energy*210)*.6);
 }
 const actor={...p,x:0,y:0,inv:0,ivf:0,dg:0,ch:0,a:0,mv:null,ct:q<.2?1:0,erenHard:0,erenBite:q<.2,erenRoar:q>.55&&q<.83};
 push();translate(x,y);
 if(q<.2){scale(1.8);erenDrawBody(actor,visualFrame,false);}
 else{drawingContext.globalAlpha*=Math.min(1,.25+(q-.2)*3);erenDrawBody(actor,visualFrame,true);}
 pop();
 if(q>.18&&q<.53)animeLightning(x,y-150,80,WH*.9,freezeMax-freezeT,'#f3d184');
 noStroke();for(let i=0;i<12;i++){
  const a=i*2.4,fade=q<.55?115:Math.max(0,100-(q-.55)*230);
  fill(213,224,204,fade);ellipse(x+Math.sin(a)*110,y-30-Math.abs(Math.sin(a+q*3))*115,60,38);
 }
 if(q>.55){noFill();stroke(238,213,148,prefs.lowFlash?75:155);strokeWeight(2);ellipse(x,y-15,90+(q-.55)*500,15+(q-.55)*75);}
 pop();
 const original=fz;
 try{fz={...fz,cid:'eren',form:1};paintAnimeFormCutin();}finally{fz=original;}
}
const erenBasePalette=animeFormPalette;
animeFormPalette=function(cid,form){return cid==='eren'?{main:'#dfc079',hot:'#f5f0cf',shadow:'#273b31',tag:'ATTACK TITAN',sub:'進撃の巨人  /  18秒の覚醒'}:erenBasePalette(cid,form);};
const erenBaseFreezeWorld=drawFreezeWorld,erenBaseFreezeText=drawFreezeText;
drawFreezeWorld=function(){if(['titan','erenHitstop'].includes(fzType))return;return erenBaseFreezeWorld();};
drawFreezeText=function(){if(fzType==='titan')return erenPaintCutin();if(fzType==='erenHitstop')return;return erenBaseFreezeText();};
const erenBaseEndFreeze=endFreeze;
endFreeze=function(){if(['titan','erenHitstop'].includes(fzType))return;const p=fzType==='counter'?pending?.att:null,before=p?.d;const r=erenBaseEndFreeze();if(p?.cid==='eren')erenGain(p,(p.d-before)*EREN.takenGain);return r;};
function erenPortrait(form=false){
 if(form)return `<svg viewBox="0 0 100 82" aria-hidden="true"><path d="M14 78L23 39 40 30h22l16 11 9 37" fill="#bb876c" stroke="#1b2835" stroke-width="2"/><path d="M34 43l-8 21m42-21 10 21" stroke="#d5a789" stroke-width="12" stroke-linecap="round"/><path d="M42 47h18m-9 0v25" stroke="#a5735d"/><ellipse cx="51" cy="23" rx="14" ry="16" fill="#c5987c"/><path d="M35 37L32 20 39 4 53 1 68 9 72 39 63 31 61 15 50 10 40 16 39 31Z" fill="#302e29"/><path d="M37 23l-8-4 7 11m29-7 8-4-7 11" fill="#c5987c"/><path d="M44 29h15l-4 9-8-2Z" fill="#b98b70"/><path d="M55 24l7-1" stroke="#8bbe9d" stroke-width="2"/></svg>`;
 return `<svg viewBox="0 0 100 82" aria-hidden="true"><circle cx="51" cy="42" r="36" fill="#69b7a0" opacity=".1"/>
 <path d="M46 34L26 34 5 60 18 56 14 70 44 60" fill="#244d3d" stroke="#172334"/>
 <path d="M43 60L30 75M58 59l17 15" stroke="#1b2835" stroke-width="12" stroke-linecap="round"/><path d="M43 60L30 75M58 59l17 15" stroke="#ded8c5" stroke-width="8"/><path d="M25 77h10m35-2h12" stroke="#514238" stroke-width="5"/>
 <path d="M38 35L61 32 70 57 36 64Z" fill="#aa8254" stroke="#172334"/><path d="M45 34l9 17 4-18" fill="#ede5d3"/><path d="M40 39l24 19m-3-21L42 61m-7 1 34-5" stroke="#4d4a40" stroke-width="2"/>
 <path d="M29 59l9-2 3 17-9 2m33-21 9-2 4 17-9 2" fill="#637e80" stroke="#172334"/><path d="M33 62l2 10m35-14 3 9" stroke="#cfded6" stroke-width="2"/>
 <path d="M39 40L24 48 39 54m23-16 12 8-10 9" fill="none" stroke="#172334" stroke-width="9" stroke-linecap="round"/><path d="M39 40L24 48 39 54m23-16 12 8-10 9" fill="none" stroke="#aa8254" stroke-width="6" stroke-linecap="round"/>
 <path d="M38 54L78 13 76 22 41 57M65 55L17 17 20 25 62 58" fill="#e9f5e9" stroke="#90b1ad"/><path d="M34 53l8 7m19 1 8-8" stroke="#5b7777" stroke-width="3"/>
 <path d="M36 39l7-1 1 8-7 1Z" fill="#e1e5d5"/><path d="M37 45l4-6m-2 6 4-4" stroke="#4e8295"/>
 <ellipse cx="50" cy="23" rx="12" ry="13" fill="#e3c3a5"/><path d="M37 28L36 16 42 5 54 4 64 13 63 28 59 20 54 12 50 20 47 12 41 18 39 29Z" fill="#302e29"/>
 </svg>`;
}
const erenBasePortrait=portrait;
portrait=function(id,gear=1,form=0,mode=false){return id==='eren'?erenPortrait(!!form):erenBasePortrait(id,gear,form,mode);};
const erenBaseHud=animeHud;
animeHud=function(p){if(p.cid!=='eren')return erenBaseHud(p);const titan=erenTitan(p);return {m:titan?p.erenTime/EREN.duration*100:p.erenGauge,label:p.erenFatigue?'疲労':titan?(p.erenTime<=180?'解除間近 ':'ATTACK TITAN ')+Math.ceil(p.erenTime/60)+'秒':'TITAN GAUGE '+Math.floor(p.erenGauge||0)+'/100 / GAS '+Math.floor(p.erenGas??100)};};
const erenBaseControl=updateControlUI;
updateControlUI=function(){
 erenBaseControl();const p=byId(myId);if(p?.cid!=='eren')return;
 const titan=erenTitan(p),linked=p.mv?.kind==='erenCrossSpin'&&p.a<=p.mv.end&&p.erenAttacks.get(p.mv.erenToken)?.connected;
 const humanHint=p.ch>0?'攻撃を離して回転斬り ／ 最大溜めでフィニッシュ':linked?
  '攻撃で連携（長押しで溜め）／ そのままで吹き飛ばし':
  '特殊：横回転 ／ 命中→攻撃で連携 ／ 横：移動 ／ 上：縦回転 ／ MAXで下特殊：巨人化';
 document.getElementById('btn-g').classList.toggle('ready',!titan&&p.erenGauge>=100&&!p.erenFatigue);
 setTxt(document.getElementById('combat-hint'),netIssue||(p.out?'観戦中':titan?
  '特殊：掴み投げ ／ 横：タックル ／ 上：アッパー ／ 下：硬質化':humanHint));
 setTxt(document.querySelector('#btn-g small'),titan?p.erenHard>0?'硬質化中':p.erenHardCd>0?'待ち '+Math.ceil(p.erenHardCd/60)+'秒':'硬質化':'巨人化');
 setTxt(document.querySelector('#btn-s small'),titan?'掴み投げ':'横回転斬り');
};
const erenBaseHUDDraw=drawHUD;
drawHUD=function(){erenBaseHUDDraw();const list=fighters.filter(f=>!f.shadowClone);const rows=document.getElementById('battle-roster').children;list.forEach((p,i)=>{if(p.cid==='eren'&&rows[i]){rows[i].classList.toggle('titan-expiring',erenTitan(p)&&p.erenTime<=180);rows[i].style.setProperty('--team',p.erenTime<=180&&erenTitan(p)?'#ed975e':p.c);}});};

const erenBaseKO=koFighter;
koFighter=function(p){const saved=p.erenGauge||0;erenBaseKO(p);if(p.cid==='eren'){erenReset(p);if(!p.out)p.erenGauge=Math.min(EREN.respawnCarry,saved);}};
const erenBaseUp=aiUpSpecial;
aiUpSpecial=function(p,I,A){if(erenTitan(p))return false;return erenBaseUp(p,I,A);};

const erenBasePickup=tryPickup;
tryPickup=function(p,id,it){if(p.cid==='eren')return;return erenBasePickup(p,id,it);};

// Titans keep taking damage, but ordinary hits cannot interrupt committed strikes.
const erenBaseArmored=isArmored;
isArmored=function(p){return erenBaseArmored(p)||erenTitan(p)&&p.erenHard>0||erenTitan(p)&&p.a>0&&p.mv&&p.a<=p.mv.act1&&['titanPunch','titanSmash','titanTackle','titanUpper'].includes(p.mv.kind);};
