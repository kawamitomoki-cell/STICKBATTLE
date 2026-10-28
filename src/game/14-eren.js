// Eren module: owner-authoritative state; existing fighters take unchanged paths.
const EREN={duration:1080,cutin:84,fatigue:60,hardTime:120,hardCooldown:360,
 normalGain:8,strongGain:12,takenGain:2,respawnCarry:50,wireTime:42,wireCooldown:36,grabTime:24};
CHARS.eren={name:'エレン・イェーガー',en:'EREN YEAGER',mark:'巨',spd:1.15,jump:1.04,jumps:2,wt:1.0,pow:1,size:1,ctx:0,back:false,ctc:1,dgc:.9,dgs:1.1,st:[4,3,2],
 sp:'特殊：双剣4連斬り／横：ワイヤーで切り込む長い連続斬撃。巨人：左右2連打・掴み・タックル',up:'人間：上の足場へワイヤー復帰（空中1回）／巨人：対空アッパー、空中下特殊で踏みつけ',ab:'攻撃・被弾でTITAN GAUGE蓄積。MAXで下特殊：18秒の巨人化。巨人の下特殊：2秒硬質化（6秒間隔）。背後上部のうなじは1.2倍ダメージ'};
SPECIAL_IDS.push('eren');ANIME_COLORS.eren='#b8b276';fighterRoles.eren='ODM / 時間制限巨人化';
const EREN_MOVES={
 erenBlades:{type:'normal',act0:3,act1:10,end:16,reach:28,R:23,yo:33,cd:3,multi:5,dm:7,k0:3,ks:.035,up:.4},
 erenSpin:{type:'heavy',act0:5,act1:12,end:26,reach:32,R:32,yo:30,cd:6,dm:20,k0:10,ks:.075,up:.6},
 erenFlurry:{type:'normal',act0:2,act1:15,end:25,reach:32,R:27,yo:32,cd:8,multi:4,dm:5,k0:3,ks:.03,up:.4},
 erenRaid:{type:'heavy',act0:3,act1:32,end:44,reach:34,R:30,yo:32,cd:12,multi:10,dm:14,k0:7,ks:.06,up:.4,rush:true},
 erenWireCut:{type:'normal',act0:2,act1:11,end:18,reach:32,R:28,yo:32,cd:3,multi:4,dm:6,k0:3,ks:.035,up:.4,rush:true},
 titanStomp:{type:'heavy',act0:8,act1:30,end:52,reach:0,R:27,yo:4,cd:20,dm:24,k0:18,ks:.12,up:.7},
 titanPunch:{type:'normal',act0:6,act1:16,end:24,reach:30,R:23,yo:12,cd:5,multi:6,dm:9,k0:7,ks:.10,up:.65},
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
 return {...c,size:3,spd:hard?.48:.98,jump:.78,wt:.40,pow:1,dgs:.65,ctc:1.15};
}
function erenReset(p){Object.assign(p,{erenForm:0,erenGauge:0,erenTime:0,erenFatigue:0,erenHard:0,erenHardCd:0,erenWire:null,erenWireCd:0,erenGrab:null,erenStompUsed:false,erenSwing:0,erenGainTargets:new Set(),erenGaugeReceipts:new Set(),erenGrabSeen:new Set()});}
function erenGain(p,n){if(p?.cid==='eren'&&isLocal(p)&&!p.out&&!erenTitan(p)&&!p.erenFatigue)p.erenGauge=Math.min(100,(p.erenGauge||0)+Math.max(0,n));}
function erenMove(p,kind,extra={}){
 p.erenSwing=(p.erenSwing||0)+1;p.erenGainTargets=new Set();
 p.mv={...mkMv(kind),...extra,erenToken:p.id+':'+curRound+':'+p.erenSwing};p.a=1;p.ch=0;p.hit={};
 tone(erenTitan(p)?85:750,erenTitan(p)?32:210,.14,.14,'triangle');noiseHit(.08,.15,1800,true);
}
function erenAttack(p,ch){
 if(p.erenFatigue)return;
 if(p.erenHard>0){erenMove(p,'titanPunch',{end:42,multi:0,dm:18,k0:13});return;}
 if(ch<CH_TH)erenMove(p,erenTitan(p)?'titanPunch':p.erenWire?'erenWireCut':'erenBlades');
 else{const q=constrain((ch-CH_TH)/(CH_FULL-CH_TH),0,1);erenMove(p,erenTitan(p)?'titanSmash':'erenSpin',{dm:erenTitan(p)?22+12*q:12+8*q,k0:erenTitan(p)?17+7*q:8+4*q});}
}
function erenAnchor(p,up,assault=false){
 let best=null,score=Infinity;
 for(let i=0;i<stage.plats.length;i++){
  const pl=stage.plats[i];if(up&&pl.y>p.y-35)continue;
  const x=constrain(p.x+(up?p.f*40:p.f*280),pl.x+6,pl.x+pl.w-6),y=pl.y;
  const d=Math.hypot(x-p.x,y-(p.y-35));if(d<35||d>440||!up&&(x-p.x)*p.f<25)continue;
  const value=d+(assault?Math.abs(y-p.y)*3:0);
  if(value<score){score=value;best={x,y,pl:i,t:EREN.wireTime};}
 }
 return best;
}
function erenWire(p,up=false,assault=false){
 if(!up&&p.erenWireCd>0||up&&p.rec){sfxNo();return false;}
 const anchor=erenAnchor(p,up,assault);if(!anchor){animeNotice(p,'アンカー接続先なし','#c9d5de');return false;}
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
 clearActs(p);p.erenForm=1;p.erenTime=EREN.duration;p.erenGauge=0;p.erenWire=null;p.erenHard=0;p.inv=Math.max(p.inv,60);
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
   if(!p.g){if(!p.erenStompUsed){erenMove(p,'titanStomp');p.vy=14;p.erenStompUsed=true;p.spc=65;}return;}
   if(!p.erenHardCd){p.erenHard=EREN.hardTime;p.erenHardCd=EREN.hardCooldown;clearActs(p);p.spc=18;}
   else animeNotice(p,'硬質化クールタイム','#bed6ee');
  }else if(!erenTransform(p))animeNotice(p,'TITAN GAUGE '+Math.floor(p.erenGauge||0)+'/100','#e6d083');
 }else if(erenTitan(p)){
  erenMove(p,up?'titanUpper':side?'titanTackle':'titanGrab');p.spc=up?48:side?65:64;
  if(side)p.f=side;
 }else if(up)erenWire(p,true);
 else if(side){p.f=side;if(erenWire(p,false,true)){erenMove(p,'erenRaid');p.spc=56;}else{erenMove(p,'erenFlurry');p.spc=28;}}
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
 if(p.g)p.erenStompUsed=false;
 if(p.mv?.kind==='titanStomp'&&p.g&&!p.mv.erenLanded){p.mv.erenLanded=true;ring(p.x,p.y,22,16);burst(p.x,p.y,12,5,'#b9bba6',6);}
 for(const key of ['erenWireCd','erenHard','erenHardCd','erenFatigue'])if(p[key]>0)p[key]--;
 if(erenTitan(p)&&p.erenTime>0&&--p.erenTime===0)erenRevert(p);
 if(p.mv?.kind==='titanTackle'&&p.g&&p.a>=p.mv.act0&&p.a<=p.mv.act1&&p.a%6===0)burst(p.x-p.f*25,p.y,4,3,'#b6ac8d',6);
 const w=p.erenWire;
 if(w){
  const pl=stage.plats[w.pl];
  if(!pl||w.x<pl.x||w.x>pl.x+pl.w||w.y!==pl.y||--w.t<=0||p.kb>0||p.out){p.erenWire=null;return;}
  const dx=w.x-p.x,dy=w.y-(p.y-35),d=Math.hypot(dx,dy);
  if(d<24){p.erenWire=null;p.vx*=.4;p.vy*=.4;return;}
  p.vx=constrain(p.vx+dx/d*3.1,-23,23);p.vy=constrain(p.vy+dy/d*2.6,-20,14);
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
 if(!erenTitan(p))return [{name:'special',dir:'neutral',range:75,startup:2,damage:20,recovery:10,hold:2},{name:'side',dir:'side',range:210,startup:3,damage:48,recovery:12,hold:2,ready:()=>!p.erenWireCd&&!!erenAnchor(p,false,true)}];
 return [{name:'special',dir:'neutral',range:120,startup:12,damage:20,hold:2},
  {name:'side',dir:'side',range:155,startup:11,damage:24,hold:2}];
};
const erenBaseTactics=aiTacticalAction;
aiTacticalAction=function(p,t,A,I,D,plan){
 if(p.cid==='eren'&&aiReady(p)&&!p.erenFatigue&&!p.spc){
  const dist=Math.abs(t.x-p.x),floor=stage.plats[p.groundPl];
  if(!erenTitan(p)&&p.erenGauge<100&&!p.erenWire&&!p.erenWireCd&&dist>160&&dist<330&&Math.sign(t.x-p.x)===p.f&&!!erenAnchor(p,false)){aiUseSpecial(p,I,A,2,'side');return 'wire-approach';}
  if(erenTitan(p)&&!p.g&&!p.erenStompUsed&&t.y>p.y+55&&dist<100){aiUseSpecial(p,I,A,2,'down');return 'titan-stomp';}
  if(erenTitan(p)&&t.y<p.y-45&&dist<95){aiUseSpecial(p,I,A,2,'up');return 'titan-anti-air';}
  if(!erenTitan(p)&&p.erenGauge>=100&&p.g&&floor?.w>=100&&dist<360&&(t.d>65||p.d>65||dist<220||p.s<t.s)){aiUseSpecial(p,I,A,2,'down');return 'titan-transform';}
  if(erenTitan(p)&&p.g&&!p.erenHardCd&&t.mv?.type==='heavy'&&t.a<=t.mv.act1&&dist<130&&p.d>70){aiUseSpecial(p,I,A,2,'down');return 'titan-harden';}
 }
 return erenBaseTactics(p,t,A,I,D,p.cid==='eren'&&erenTitan(p)?{...plan,ideal:110,near:65}:plan);
};
const erenBaseProfile=aiMeleeProfile;
aiMeleeProfile=function(p,hold=2){if(p.cid!=='eren')return erenBaseProfile(p,hold);const m=EREN_MOVES[erenTitan(p)?hold>=CH_TH?'titanSmash':'titanPunch':hold>=CH_TH?'erenSpin':p.erenWire?'erenWireCut':'erenBlades'];return {range:(m.reach+m.R)*fighterSize(p),startup:m.act0+hold,damage:!erenTitan(p)&&hold<CH_TH?(p.erenWire?18:14):erenTitan(p)&&hold<CH_TH?22:m.dm,hold,type:m.type,recovery:m.end-m.act1};};
// Presentation is generated geometry and synthesized effects only.
function erenDrawBody(p,t,titan=erenTitan(p)){
 const sc=titan?3:1,m=p.mv,active=m&&p.a>=m.act0&&p.a<=m.act1;
 const skin=flash[p.id]>0?'#fff9e8':'#dcb997',base=titan?'#c18c6d':'#8b704d';
 const walk=p.g?Math.sin(t*.30)*Math.min(4,Math.abs(p.vx||0))*1.5:4;
 push();translate(p.x,p.y);scale(sc);scale(p.f,1);
 if(isInvuln(p)){if(titan){noStroke();fill(244,210,128,22);ellipse(0,-38,78,105);noFill();stroke(245,213,138,125);strokeWeight(1.1);ellipse(0,-38,73,100);}else if(t%8<3)drawingContext.globalAlpha*=.55;}
 // Same blank face, rounded limbs and costume silhouette as the other SPECIAL fighters.
 if(!titan){noStroke();fill('#2c5745');quad(-12,-51,-27-Math.abs(p.vx)*.5,-37,-22,-21,-8,-29);}
 for(const side of [-1,1]){
  const foot=side*10+side*walk;
  stroke('#111b29');strokeWeight(11);line(side*7,-24,foot,-5);
  stroke(titan?skin:'#d7d0b8');strokeWeight(8);line(side*7,-24,foot,-5);
  stroke(titan?'#a4775f':'#514238');strokeWeight(5);line(foot,-8,foot,-2);
  stroke('#8e9b93');strokeWeight(1.2);line(foot-3,-1,foot+5,-1);
 }
 stroke('#172334');strokeWeight(1.5);fill(base);quad(-12,-50,12,-50,15,-25,-15,-25);
 if(titan){
  fill('#dfb18b');quad(-10,-48,10,-48,8,-38,-8,-38);
  noFill();stroke('#a5735d');strokeWeight(1);line(0,-47,0,-28);line(-6,-35,6,-35);line(-5,-30,5,-30);
 }else{
  fill('#e6deca');triangle(-8,-50,0,-36,8,-50);
  fill('#a18458');quad(-12,-50,-5,-49,-6,-28,-14,-26);quad(5,-49,12,-50,14,-26,6,-28);
  stroke('#3d463c');strokeWeight(2);line(-8,-46,7,-27);line(8,-46,-7,-27);line(-12,-26,12,-26);
  noStroke();fill('#c7cdbc');rect(-3,-29,6,4,1);
  for(const side of [-1,1]){fill('#5c7275');stroke('#172334');strokeWeight(1);rect(side<0?-22:14,-26,8,17,2);stroke('#ced7d0');strokeWeight(.8);line(side<0?-19:17,-23,side<0?-19:17,-12);}
  stroke('#dbe2d5');strokeWeight(.8);line(-10,-45,-7,-47);line(-10,-42,-6,-45);
 }
 // Intentionally no eyes, teeth, jaw or anatomy rendering: match the roster's visual language.
 stroke('#152131');strokeWeight(1.3);fill(skin);ellipse(0,-59,20,22);
 fill('#27352e');noStroke();beginShape();vertex(-12,-58);vertex(-13,-69);vertex(-6,-76);vertex(6,-76);vertex(13,-68);vertex(11,-54);vertex(7,-64);vertex(0,-68);vertex(-7,-64);vertex(-10,-53);endShape(CLOSE);
 let hx=18,hy=-35;
 if(p.ch>0||m?.kind==='titanSmash'&&p.a<m.act0){hx=-23;hy=-43;}
 if(active){hx=m.reach;hy=-m.yo;}
 if(titan&&m?.kind==='titanGrab'&&p.a>=m.act0&&p.a<40){hx=21;hy=-38;}
 if(p.ct>0||p.erenHard>0){hx=12;hy=-49;}
 const second=titan&&m?.kind==='titanPunch'&&p.a>=m.act0+6;
 animeArm(second?-8:8,-45,hx,hy,titan?skin:base,titan?8:5);
 animeArm(second?8:-8,-45,-18,-29,titan?skin:base,titan?7:5);
 noStroke();fill(p.erenHard>0?'#bedce6':skin);circle(hx,hy,titan?15:7);circle(-18,-29,titan?12:7);
 if(titan){
  noFill();stroke(225,231,217,70);strokeWeight(1);for(let i=0;i<3;i++){const q=(t*.012+i*.3)%1;bezier(-13+i*12,-49-q*10,-24+i*12,-60-q*12,4+i*12,-62-q*12,-7+i*12,-74-q*10);}
 }else{
  const blade=(x,y,ang)=>{push();translate(x,y);rotate(ang);stroke('#172334');strokeWeight(3.3);line(0,0,28,-19);stroke('#edf4df');strokeWeight(2);line(0,0,28,-19);stroke('#90b1ad');strokeWeight(.7);line(0,1,27,-17);stroke('#80938b');strokeWeight(2);line(-3,-3,3,2);pop();};
  blade(hx,hy,active?Math.sin(p.a*.8)*.5:0);blade(-18,-29,active?-Math.sin(p.a*.8)*.5:.3);
  if(p.erenWire||p.dg>0){noStroke();for(let i=0;i<4;i++){fill(200,232,220,85-i*15);ellipse(-25-i*8,-23+i*2,8+i*5,5+i*2);}}
 }
 if(active){
  noFill();stroke(titan?'#ffd88e':'#86ddd0');strokeWeight(titan?2.5:3);arc(m.reach,-m.yo,m.R*2,m.R*2,-1.4,1.2);
  stroke(titan?'#fff0bf':'#f0fff1');strokeWeight(1);arc(m.reach+1,-m.yo,m.R*2+3,m.R*2+3,-1.3,1.1);
 }
 pop();
}
function drawEren(p){
 if(p.out)return;
 if(p.erenWire){push();stroke('#d5e8e1');strokeWeight(1.4);for(const offset of [-12,12])line(p.x+offset,p.y-27,p.erenWire.x,p.erenWire.y);noStroke();fill('#dce2bd');circle(p.erenWire.x,p.erenWire.y,6);pop();}
 erenDrawBody(p,visualFrame);
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
 const skin='#e3b99a',base=form?'#bf8d70':'#92764e';
 return `<svg viewBox="0 0 100 82" aria-hidden="true"><circle cx="50" cy="40" r="35" fill="#9cba8f" opacity=".12"/><ellipse cx="50" cy="78" rx="30" ry="3" fill="#050b1680"/>
 ${form?'':'<path d="M34 35L17 48 22 70 43 57" fill="#315c46" stroke="#19283a"/>'}
 <path d="M42 60l-8 17m24-17 9 17" stroke="${form?skin:'#d4cbb0'}" stroke-width="10"/><path d="M31 77h9m23 0h9" stroke="${form?'#9b725d':'#514536'}" stroke-width="5"/>
 <path d="M35 35h30l5 29H30z" fill="${base}" stroke="#19283a"/>
 <path d="M35 40L22 51M65 40l13 9" fill="none" stroke="${form?skin:base}" stroke-width="8" stroke-linecap="round"/><circle cx="20" cy="51" r="${form?7:5}" fill="${skin}"/><circle cx="80" cy="49" r="${form?7:5}" fill="${skin}"/>
 ${form?'<path d="M38 38h25l-4 10H42z" fill="#ddb08b"/><path d="M50 40v19m-7-7h14m-13 5h12" stroke="#a6775f" stroke-width="1"/>':'<path d="M41 35l9 15 10-15" fill="#e6deca"/><path d="M38 39l21 23m0-23L40 62M32 62h35" stroke="#444a3d" stroke-width="2.3"/><path d="M46 59h8v5h-8z" fill="#c8cbb5"/><path d="M24 58h9v17h-9zm44 0h9v17h-9z" fill="#627c7e" stroke="#19283a"/><path d="M27 61v11m44-11v11" stroke="#d6e0d3"/><path d="M17 51L4 19m78 29 14-29" stroke="#eff7df" stroke-width="3"/><path d="M13 49l7-2m59-1 7 3" stroke="#8daba4" stroke-width="2"/>'}
 <circle cx="51" cy="24" r="12" fill="${skin}"/>
 <path d="M38 25l-1-12 7-10h14l9 9-1 16-5-8-10-6-9 6-3 12z" fill="#27352e"/>
 </svg>`;
}
const erenBasePortrait=portrait;
portrait=function(id,gear=1,form=0,mode=false){return id==='eren'?erenPortrait(!!form):erenBasePortrait(id,gear,form,mode);};
const erenBaseHud=animeHud;
animeHud=function(p){if(p.cid!=='eren')return erenBaseHud(p);const titan=erenTitan(p);return {m:titan?p.erenTime/EREN.duration*100:p.erenGauge,label:p.erenFatigue?'疲労':titan?(p.erenTime<=180?'解除間近 ':'ATTACK TITAN ')+Math.ceil(p.erenTime/60)+'秒':'TITAN GAUGE '+Math.floor(p.erenGauge||0)+'/100'};};
const erenBaseControl=updateControlUI;
updateControlUI=function(){erenBaseControl();const p=byId(myId);if(p?.cid!=='eren')return;setTxt(document.getElementById('combat-hint'),netIssue|| (erenTitan(p)?'特殊：掴み投げ ／ 横：タックル ／ 上：アッパー ／ 下：地上硬質化／空中踏みつけ':'特殊：双剣4連斬り ／ 横：ワイヤー連続斬り込み ／ 上：ワイヤー復帰 ／ MAXで下特殊：巨人化'));setTxt(document.querySelector('#btn-g small'),erenTitan(p)?p.g?'硬質化':'踏みつけ':'巨人化');setTxt(document.querySelector('#btn-s small'),erenTitan(p)?'掴み投げ':'双剣連斬');};
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
isArmored=function(p){return erenBaseArmored(p)||erenTitan(p)&&p.a>0&&p.mv&&p.a<=p.mv.act1&&['titanPunch','titanSmash','titanTackle','titanUpper','titanStomp'].includes(p.mv.kind);};
