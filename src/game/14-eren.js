// Eren module: owner-authoritative state; existing fighters take unchanged paths.
const EREN={duration:1080,cutin:84,fatigue:60,hardTime:36,hardCooldown:180,
 normalGain:8,strongGain:12,takenGain:2,respawnCarry:50,wireTime:48,wireCooldown:8,gasCost:14,gasRefund:6,gasDrain:.16,grabTime:24};
CHARS.eren={name:'エレン・イェーガー',en:'EREN YEAGER',mark:'巨',spd:1.28,jump:1.04,jumps:2,wt:1.0,pow:1,size:1,ctx:0,back:false,ctc:1,dgc:.9,dgs:1.1,st:[4,3,2],
 sp:'特殊：双剣4連斬り／横：操舵できる飛行連斬（命中でガス回収）。巨人：広域薙ぎ払い・地砕き・突進',up:'人間：上の足場へワイヤー復帰（空中1回）／巨人：対空アッパー、空中下特殊で踏みつけ',ab:'攻撃・被弾でTITAN GAUGE蓄積。ガスは着地で補充。MAXで下特殊：18秒の巨人化。巨人化は被弾中も発動可。巨人の下特殊：全周地砕き、カウンター時に自動硬質化。背後上部のうなじは1.2倍ダメージ'};
SPECIAL_IDS.push('eren');ANIME_COLORS.eren='#b8b276';fighterRoles.eren='ODM / 時間制限巨人化';
const EREN_MOVES={
 erenBlades:{type:'normal',act0:3,act1:10,end:16,reach:28,R:23,yo:33,cd:3,multi:5,dm:7,k0:3,ks:.035,up:.4},
 erenSpin:{type:'heavy',act0:5,act1:12,end:26,reach:32,R:32,yo:30,cd:6,dm:20,k0:10,ks:.075,up:.6},
 erenFlurry:{type:'normal',act0:2,act1:15,end:25,reach:32,R:27,yo:32,cd:8,multi:4,dm:5,k0:3,ks:.03,up:.4},
 erenRaid:{type:'heavy',act0:3,act1:32,end:44,reach:34,R:30,yo:32,cd:12,multi:10,dm:14,k0:7,ks:.06,up:.4,rush:true},
 erenWireCut:{type:'normal',act0:2,act1:11,end:18,reach:32,R:28,yo:32,cd:3,multi:4,dm:6,k0:3,ks:.035,up:.4,rush:true},
 titanSweep:{type:'heavy',act0:7,act1:17,end:30,reach:24,R:36,yo:14,cd:10,dm:26,k0:18,ks:.11,up:.65,line:true},
 titanQuake:{type:'heavy',act0:11,act1:17,end:35,reach:0,R:60,yo:6,cd:14,dm:22,k0:16,ks:.10,up:1.1},
 titanStomp:{type:'heavy',act0:8,act1:30,end:52,reach:0,R:27,yo:4,cd:20,dm:24,k0:18,ks:.12,up:.7},
 titanPunch:{type:'normal',act0:6,act1:16,end:24,reach:30,R:23,yo:12,cd:5,multi:6,dm:9,k0:7,ks:.10,up:.65},
 titanSmash:{type:'heavy',act0:16,act1:24,end:54,reach:34,R:25,yo:15,cd:16,dm:34,k0:21,ks:.14,up:.7},
 titanGrab:{type:'heavy',act0:12,act1:18,end:50,reach:20,R:20,yo:28,cd:18,dm:0,k0:0,ks:0,up:0},
 titanTackle:{type:'heavy',act0:8,act1:25,end:40,reach:22,R:24,yo:14,cd:18,dm:24,k0:19,ks:.12,up:.65,lunge:16,rush:true},
 titanUpper:{type:'heavy',act0:10,act1:20,end:40,reach:16,R:25,yo:48,cd:12,dm:22,k0:15,ks:.12,up:1.4}
};
Object.assign(MOVE_DEF,EREN_MOVES);
function erenTitan(p){return p?.cid==='eren'&&p.erenForm===1;}
function fighterSize(p){return erenTitan(p)?3:CC(p.cid).size;}
function fighterConfig(p){
 const c=CC(p.cid);if(!erenTitan(p))return c;
 return {...c,size:3,spd:1.15,jump:.78,wt:.40,pow:1,dgs:.65,ctc:1.15};
}
function erenReset(p){Object.assign(p,{erenGas:100,erenGlide:0,erenImpactToken:null,erenSteerX:0,erenSteerY:0,erenForm:0,erenGauge:0,erenTime:0,erenFatigue:0,erenHard:0,erenHardCd:0,erenWire:null,erenWireCd:0,erenGrab:null,erenStompUsed:false,erenSwing:0,erenGainTargets:new Set(),erenGaugeReceipts:new Set(),erenGrabSeen:new Set()});}
function erenGain(p,n){
 if(p?.cid!=='eren'||!isLocal(p)||p.out||erenTitan(p)||p.erenFatigue)return;
 const before=p.erenGauge||0;p.erenGauge=Math.min(100,before+Math.max(0,n));
 if(before<100&&p.erenGauge===100)animeNotice(p,'巨人化 READY! ↓特殊','#e6d083');
}
function erenMove(p,kind,extra={}){
 p.erenSwing=(p.erenSwing||0)+1;p.erenGainTargets=new Set();
 p.mv={...mkMv(kind),...extra,erenToken:p.id+':'+curRound+':'+p.erenSwing};p.a=1;p.ch=0;p.hit={};
 tone(erenTitan(p)?85:750,erenTitan(p)?32:210,.14,.14,'triangle');noiseHit(.08,.15,1800,true);
}
function erenAttack(p,ch){
 if(p.erenFatigue)return;
 if(ch<CH_TH)erenMove(p,erenTitan(p)?'titanPunch':p.erenWire?'erenWireCut':'erenBlades');
 else{const q=constrain((ch-CH_TH)/(CH_FULL-CH_TH),0,1);erenMove(p,erenTitan(p)?'titanSmash':'erenSpin',{dm:erenTitan(p)?22+12*q:12+8*q,k0:erenTitan(p)?17+7*q:8+4*q});}
}
function erenAnchor(p,up){
 let best=null,score=Infinity;
 for(let i=0;i<stage.plats.length;i++){
  const pl=stage.plats[i];if(up&&pl.y>p.y-35)continue;
  const x=constrain(p.x+(up?p.f*40:p.f*280),pl.x+6,pl.x+pl.w-6),y=pl.y;
  const d=Math.hypot(x-p.x,y-(p.y-35));if(d<35||d>440||!up&&(x-p.x)*p.f<25)continue;
  const value=d;
  if(value<score){score=value;best={x,y,pl:i,t:EREN.wireTime};}
 }
 return best;
}
function erenWire(p,up=false){
 if(!up&&p.erenWireCd>0||up&&p.rec){sfxNo();return false;}
 if(p.erenGas<EREN.gasCost){animeNotice(p,'ガス不足 ― 着地で補充','#b9d5c7');return false;}
 const anchor=erenAnchor(p,up);if(!anchor){animeNotice(p,'アンカー接続先なし','#c9d5de');return false;}
 p.erenGas-=EREN.gasCost;p.erenWire=anchor;if(p.g){p.vy=-7;p.g=false;}p.erenWireCd=EREN.wireCooldown;if(up)p.rec=true;p.inv=Math.max(p.inv,4);
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
 clearActs(p);p.erenForm=1;p.erenTime=EREN.duration;p.erenGauge=0;p.erenWire=null;p.erenGrab=null;p.erenHard=0;p.inv=Math.max(p.inv,90);p.kb=p.stn=0;p.vx=p.vy=0;
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
 p.erenForm=0;p.erenTime=0;p.erenGauge=0;p.erenHard=0;p.erenWire=null;p.erenFatigue=EREN.fatigue;clearActs(p);
 burst(p.x,p.y-80,30,5,'#e2e1d1',15);animeNotice(p,'巨人化解除 ― 疲労','#c9d5de');
}
function erenSpecial(p,inp){
 if(p.erenFatigue)return;
 const up=inp.u&&!inp.neutralSpecial,down=inp.gd||inp.d&&!inp.neutralSpecial;
 const side=inp.sideSpecial||(!inp.neutralSpecial?((inp.r?1:0)-(inp.l?1:0)):0);
 if(p.spc>0&&!(up&&!erenTitan(p)))return;
 if(down){
  if(erenTitan(p)){
   if(!p.g){if(!p.erenStompUsed){erenMove(p,'titanStomp');p.vy=14;p.erenStompUsed=true;p.spc=65;}return;}
   erenMove(p,'titanQuake');p.spc=48;
  }else if(!erenTransform(p))animeNotice(p,'TITAN GAUGE '+Math.floor(p.erenGauge||0)+'/100','#e6d083');
 }else if(erenTitan(p)){
  erenMove(p,up?'titanUpper':side?'titanTackle':'titanSweep');p.spc=up?32:side?44:34;
  if(side)p.f=side;
 }else if(up)erenWire(p,true);
 else if(side){p.f=side;if(erenWire(p,false)){erenMove(p,'erenRaid');p.spc=56;}else{erenMove(p,'erenFlurry');p.spc=28;}}
 else{erenMove(p,'erenFlurry');p.spc=28;}
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
 if(!erenTitan(p))p.erenGas=Math.min(100,(p.erenGas??100)+(p.g?2.5:.08));
 if(erenTitan(p)&&p.ct>0&&!p.erenHardCd){p.erenHard=EREN.hardTime;p.erenHardCd=EREN.hardCooldown;}
 if(p.g)p.erenStompUsed=false;
 if(p.mv?.kind==='titanStomp'&&p.g&&!p.mv.erenLanded){p.mv.erenLanded=true;ring(p.x,p.y,22,16);burst(p.x,p.y,12,5,'#b9bba6',6);}
 for(const key of ['erenGlide','erenWireCd','erenHard','erenHardCd','erenFatigue'])if(p[key]>0)p[key]--;
 if(erenTitan(p)&&p.erenTime>0&&--p.erenTime===0)erenRevert(p);
 if(p.mv?.kind==='titanTackle'&&p.g&&p.a>=p.mv.act0&&p.a<=p.mv.act1&&p.a%6===0)burst(p.x-p.f*25,p.y,4,3,'#b6ac8d',6);
 const w=p.erenWire;
 if(w){
  const pl=stage.plats[w.pl];
  p.erenGas=Math.max(0,p.erenGas-EREN.gasDrain);
  if(p.erenGas<=0||!pl||w.x<pl.x||w.x>pl.x+pl.w||w.y!==pl.y||--w.t<=0||p.kb>0||p.out){p.erenWire=null;if(!p.kb&&!p.out)p.erenGlide=18;return;}
  const dx=w.x-p.x,dy=w.y-(p.y-35),d=Math.hypot(dx,dy);
  if(d<24){p.erenWire=null;p.erenGlide=18;return;}
  p.vx=constrain(p.vx+dx/d*2.4+(p.erenSteerX||0)*1.6,-24,24);p.vy=constrain(p.vy+dy/d*1.8+(p.erenSteerY||0)*2.6,-22,18);
  if(w.y<p.y-20){p.g=false;p.groundPl=-1;}
 }
}
// Restore only bounded, known Eren fields. No arbitrary remote object assignment.
function erenReadState(s){
 const n=(key,max)=>Number.isFinite(s[key])?constrain(s[key],0,max):0;
 const form=s.ef===1?1:0,wire=s.ew;
 const pl=wire&&Number.isInteger(wire.pl)?stage.plats[wire.pl]:null;
 return {erenGas:n('eo',100),erenGlide:n('el',18),erenForm:form,erenGauge:n('eg',100),erenTime:form?n('et',EREN.duration):0,
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
 if(p.cid==='eren'&&bt.phase==='play'&&!freezeT&&!p.out){
  if(p.domainT>0){p.erenWire=null;p.erenGlide=0;}
  const mobility=(inp.u||inp.sideSpecial||inp.l||inp.r)&&!inp.neutralSpecial&&!inp.gd&&!inp.d;
  if(!erenTitan(p)&&!p.erenFatigue&&!p.timeStopT&&!p.domainT){
   if(inp.sc!==p.prev.sc&&(inp.gd||inp.d)&&p.erenGauge>=100){erenTransform(p);p.prev={...inp};return;}
   p.erenSteerX=(inp.r?1:0)-(inp.l?1:0);p.erenSteerY=(inp.d?1:0)-(inp.u?1:0);
   // Check the requested facing, including while a previous slash locks body facing.
   // At the right edge, the old right-facing anchor may not exist even though a left one does.
   const wireFacing=inp.sideSpecial||p.erenSteerX||p.f;
   if(mobility&&inp.sc!==p.prev.sc&&!p.kb&&!p.stn&&!p.erenWireCd&&
      p.erenGas>=EREN.gasCost&&(!inp.u||!p.rec)&&erenAnchor({x:p.x,y:p.y,f:wireFacing},!!inp.u)){
    clearActs(p);p.spc=p.cd=0;
   }
   if(p.erenWire&&inp.ac!==p.prev.ac&&!p.kb&&!p.stn){clearActs(p);p.cd=0;}
   if(p.erenWire&&inp.jc!==p.prev.jc){p.erenWire=null;p.erenGlide=18;p.vy=Math.min(p.vy,-9);p.prev.jc=inp.jc;}
  }
  if(!p.timeStopT){erenTick(p);if(p.erenFatigue){p.prev={...inp};inp={...inp,l:false,r:false,u:false,d:false,a:false,s:false,gd:false,sideSpecial:0,neutralSpecial:false};}}
 }
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
  if(!targets.has(key)){
   targets.add(key);if(targets.size>128)targets.delete(targets.values().next().value);
   erenGain(a,a.mv?.type==='heavy'?EREN.strongGain:EREN.normalGain);
   // Reward committed aerial attacks, once per swing/target rather than each multi-hit.
   if(!erenTitan(a)&&(a.erenWire||['erenRaid','erenWireCut'].includes(a.mv?.kind)))
    a.erenGas=Math.min(100,(a.erenGas??100)+EREN.gasRefund);
  }
  if(erenTitan(a)&&['titanSmash','titanSweep','titanQuake'].includes(a.mv?.kind)&&e.res==='hit'&&a.erenImpactToken!==a.mv.erenToken){
   a.erenImpactToken=a.mv.erenToken;
   if(!online){freezeT=Math.max(freezeT,8);freezeMax=8;fzType='erenHitstop';fz=null;}shake=Math.max(shake,12);ring(e.x,e.y,20,20);
  }
 }
};
const erenBaseState=stateOf;
stateOf=function(p){const s=erenBaseState(p);if(p.cid==='eren')Object.assign(s,{eo:p.erenGas??100,el:p.erenGlide||0,ef:p.erenForm||0,eg:p.erenGauge||0,et:p.erenTime||0,eh:p.erenHard||0,ec:p.erenHardCd||0,ez:p.erenFatigue||0,ew:p.erenWire,es:p.erenSwing||0});if(p.erenGrab)s.eb=p.erenGrab;return s;};
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

 if(!erenTitan(p))return [{name:'special',dir:'neutral',range:75,startup:2,damage:20,recovery:10,hold:2},{name:'side',dir:'side',range:210,startup:3,damage:48,recovery:12,hold:2,ready:()=>!p.erenWireCd&&!!erenAnchor(p,false)}];
 return [{name:'special',dir:'neutral',range:180,startup:7,damage:26,hold:2},
  {name:'side',dir:'side',range:185,startup:8,damage:24,hold:2}];
};
const erenBaseTactics=aiTacticalAction;
aiTacticalAction=function(p,t,A,I,D,plan){
 if(p.cid==='eren'&&aiReady(p)&&!p.erenFatigue&&!p.spc){
  const dist=Math.abs(t.x-p.x),floor=stage.plats[p.groundPl];
  if(!erenTitan(p)&&p.erenGauge<100&&!p.erenWire&&!p.erenWireCd&&dist>160&&dist<330&&Math.sign(t.x-p.x)===p.f&&!!erenAnchor(p,false)){aiUseSpecial(p,I,A,2,'side');return 'wire-approach';}
  if(erenTitan(p)&&!p.g&&!p.erenStompUsed&&t.y>p.y+55&&dist<100){aiUseSpecial(p,I,A,2,'down');return 'titan-stomp';}
  if(erenTitan(p)&&t.y<p.y-45&&dist<95){aiUseSpecial(p,I,A,2,'up');return 'titan-anti-air';}
  if(!erenTitan(p)&&p.erenGauge>=100&&p.g&&floor?.w>=100&&dist<360&&(t.d>65||p.d>65||dist<220||p.s<t.s)){aiUseSpecial(p,I,A,2,'down');return 'titan-transform';}
  if(erenTitan(p)&&p.g&&!p.spc&&t.mv?.type==='heavy'&&t.a<=t.mv.act1&&dist<130&&p.d>70){aiUseSpecial(p,I,A,2,'down');return 'titan-quake';}
 }
 return erenBaseTactics(p,t,A,I,D,p.cid==='eren'&&erenTitan(p)?{...plan,ideal:110,near:65}:plan);
};
const erenBaseProfile=aiMeleeProfile;
aiMeleeProfile=function(p,hold=2){if(p.cid!=='eren')return erenBaseProfile(p,hold);const m=EREN_MOVES[erenTitan(p)?hold>=CH_TH?'titanSmash':'titanPunch':hold>=CH_TH?'erenSpin':p.erenWire?'erenWireCut':'erenBlades'];return {range:(m.reach+m.R)*fighterSize(p),startup:m.act0+hold,damage:!erenTitan(p)&&hold<CH_TH?(p.erenWire?18:14):erenTitan(p)&&hold<CH_TH?22:m.dm,hold,type:m.type,recovery:m.end-m.act1};};
// Presentation is generated geometry and synthesized effects only.
function erenDrawBody(p,t,titan=erenTitan(p)){
 const sc=titan?3:1,m=p.mv,active=m&&p.a>=m.act0&&p.a<=m.act1;
 const skin=flash[p.id]>0?'#fff9e8':titan?'#c5987c':'#e3c3a5',base=titan?'#bb876c':'#aa8254';
 const walk=p.g?Math.sin(t*.30)*Math.min(4,Math.abs(p.vx||0))*1.5:4;
 push();translate(p.x,p.y);scale(sc);scale(p.f,1);
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
 if(titan){fill(skin);triangle(-11,-61,-17,-64,-12,-55);triangle(11,-61,17,-64,12,-55);stroke('#8bbe9d');strokeWeight(1.2);line(3,-60,7,-61);}

 let hx=18,hy=-35;
 if(p.ch>0||m?.kind==='titanSmash'&&p.a<m.act0){hx=-23;hy=-43;}
 if(active){hx=m.reach;hy=-m.yo;if(m.kind==='titanSweep'){const swing=(p.a-m.act0)/(m.act1-m.act0);hx=30+Math.sin(swing*PI)*10;hy=-12-Math.sin(swing*PI)*16;}if(m.kind==='titanQuake'){hx=17;hy=-4;}}
 if(titan&&m?.kind==='titanGrab'&&p.a>=m.act0&&p.a<40){hx=21;hy=-38;}
 if(p.ct>0||p.erenHard>0){hx=12;hy=-49;}
 const second=titan&&m?.kind==='titanPunch'&&p.a>=m.act0+6;
 animeArm(second?-8:8,-45,hx,hy,titan?skin:base,titan?11:5);
 animeArm(second?8:-8,-45,m?.kind==='titanQuake'&&active?-17:-18,m?.kind==='titanQuake'&&active?-4:-29,titan?skin:base,titan?10:5);
 noStroke();fill(p.erenHard>0?'#bedce6':skin);circle(hx,hy,titan?15:7);circle(-18,-29,titan?12:7);
 if(titan){
  noFill();stroke(225,231,217,70);strokeWeight(1);for(let i=0;i<3;i++){const q=(t*.012+i*.3)%1;bezier(-13+i*12,-49-q*10,-24+i*12,-60-q*12,4+i*12,-62-q*12,-7+i*12,-74-q*10);}
 }else{
  const blade=(x,y,ang)=>{push();translate(x,y);rotate(ang);stroke('#172334');strokeWeight(3.3);line(0,0,28,-19);stroke('#edf4df');strokeWeight(2);line(0,0,28,-19);stroke('#90b1ad');strokeWeight(.7);line(0,1,27,-17);stroke('#80938b');strokeWeight(2);line(-3,-3,3,2);pop();};
  blade(hx,hy,active?Math.sin(p.a*.8)*.5:0);blade(-18,-29,active?-Math.sin(p.a*.8)*.5:.3);
  if(p.erenWire||p.dg>0){noStroke();for(let i=0;i<4;i++){fill(200,232,220,85-i*15);ellipse(-25-i*8,-23+i*2,8+i*5,5+i*2);}}
 }
 if(active&&m.kind==='titanQuake'){noFill();stroke(246,213,147,170);strokeWeight(2);ellipse(0,-2,m.R*2,12);for(let i=-2;i<=2;i++)line(i*22,-1,i*27,-7-Math.abs(i)*3);}
 if(active){
  noFill();stroke(titan?'#ffd88e':'#86ddd0');strokeWeight(titan?2.5:3);arc(m.reach,-m.yo,m.R*2,m.R*2,-1.4,1.2);
  stroke(titan?'#fff0bf':'#f0fff1');strokeWeight(1);arc(m.reach+1,-m.yo,m.R*2+3,m.R*2+3,-1.3,1.1);
 }
 pop();
}
function drawEren(p){
 if(p.out)return;
 if(p.erenWire){push();stroke('#d5e8e1');strokeWeight(1.4);for(const offset of [-12,12])line(p.x+offset,p.y-27,p.erenWire.x,p.erenWire.y);noStroke();fill('#dce2bd');circle(p.erenWire.x,p.erenWire.y,6);pop();}
 if(!erenTitan(p)&&(p.erenWire||p.erenGlide>0)&&Math.abs(p.vx)>8){for(let i=2;i>=1;i--){push();drawingContext.globalAlpha*=.12/i;erenDrawBody({...p,x:p.x-p.vx*i*.8,y:p.y-p.vy*i*.8,inv:0},visualFrame-i*2);pop();}}
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
 const actor={...p,x:0,y:0,inv:0,ivf:0,dg:0,ch:0,a:0,mv:null,ct:q<.2?1:0,erenHard:0};
 push();translate(x,y);
 if(q<.2){scale(1.8);erenDrawBody(actor,visualFrame,false);stroke('#e3b99a');strokeWeight(4);line(12,-43,2,-58);}
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
 if(form)return `<svg viewBox="0 0 100 82" aria-hidden="true"><path d="M14 78L23 39 40 30h22l16 11 9 37" fill="#bb876c" stroke="#1b2835" stroke-width="2"/><path d="M34 43l-8 21m42-21 10 21" stroke="#d5a789" stroke-width="12" stroke-linecap="round"/><path d="M42 47h18m-9 0v25" stroke="#a5735d"/><ellipse cx="51" cy="23" rx="14" ry="16" fill="#c5987c"/><path d="M35 37L32 20 39 4 53 1 68 9 72 39 63 31 61 15 50 10 40 16 39 31Z" fill="#302e29"/><path d="M37 23l-8-4 7 11m29-7 8-4-7 11" fill="#c5987c"/><path d="M55 24l7-1" stroke="#8bbe9d" stroke-width="2"/></svg>`;
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
updateControlUI=function(){erenBaseControl();const p=byId(myId);if(p?.cid!=='eren')return;document.getElementById('btn-g').classList.toggle('ready',!erenTitan(p)&&p.erenGauge>=100&&!p.erenFatigue);setTxt(document.getElementById('combat-hint'),netIssue|| (erenTitan(p)?'特殊：薙ぎ払い ／ 横：突進 ／ 上：アッパー ／ 下：地砕き・踏みつけ':'特殊：双剣4連斬り ／ 横：飛行連斬（連打で張替）／ 方向：操舵 ／ ジャンプ：離脱 ／ MAXで下特殊：巨人化'));setTxt(document.querySelector('#btn-g small'),erenTitan(p)?p.g?'地砕き':'踏みつけ':'巨人化');setTxt(document.querySelector('#btn-s small'),erenTitan(p)?'薙ぎ払い':'双剣連斬');};
const erenBaseHUDDraw=drawHUD;
drawHUD=function(){erenBaseHUDDraw();const list=fighters.filter(f=>!f.shadowClone);const rows=document.getElementById('battle-roster').children;list.forEach((p,i)=>{if(p.cid==='eren'&&rows[i]){rows[i].classList.toggle('titan-expiring',erenTitan(p)&&p.erenTime<=180);rows[i].style.setProperty('--team',p.erenTime<=180&&erenTitan(p)?'#ed975e':p.c);}});};

const erenBaseKO=koFighter;
koFighter=function(p){const saved=p.erenGauge||0;erenBaseKO(p);if(p.cid==='eren'){erenReset(p);if(!p.out)p.erenGauge=Math.min(EREN.respawnCarry,saved);}};
const erenBaseUp=aiUpSpecial;
aiUpSpecial=function(p,I,A){if(erenTitan(p))return false;return erenBaseUp(p,I,A);};

const erenBasePickup=tryPickup;
tryPickup=function(p,id,it){if(p.cid==='eren')return;return erenBasePickup(p,id,it);};

// The second fist uses the existing multi-hit window and the same owner-side hit transport.
const erenBaseCheck=meleeCheck;
meleeCheck=function(p){if(p.cid==='eren'&&!erenTitan(p)&&p.mv?.kind==='erenRaid'){const finish=p.a>=23;p.mv.dm=finish?20:14;p.mv.k0=finish?14:7;}if(erenTitan(p)&&p.mv?.kind==='titanPunch'&&p.mv.multi){const finish=p.a>=p.mv.act0+6;p.mv.dm=finish?13:9;p.mv.k0=finish?15:7;}return erenBaseCheck(p);};

// Titans keep taking damage, but ordinary hits cannot interrupt committed strikes.
const erenBaseArmored=isArmored;
isArmored=function(p){return erenBaseArmored(p)||erenTitan(p)&&p.a>0&&p.mv&&p.a<=p.mv.act1&&['titanPunch','titanSmash','titanTackle','titanUpper','titanStomp','titanSweep','titanQuake'].includes(p.mv.kind);};
