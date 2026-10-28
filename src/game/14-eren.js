// Eren module: owner-authoritative state; existing fighters take unchanged paths.
const EREN={duration:1080,cutin:84,fatigue:60,hardTime:120,hardCooldown:360,
 normalGain:6,strongGain:10,takenGain:2,respawnCarry:50,wireTime:26,wireCooldown:65,grabTime:24};
CHARS.eren={name:'エレン・イェーガー',en:'EREN YEAGER',mark:'巨',spd:1.15,jump:1.04,jumps:2,wt:1.05,pow:1,size:1,ctx:0,back:false,ctc:1,dgc:.9,dgs:1.1,st:[4,3,2],
 sp:'特殊：地形へワイヤー／横：立体機動急襲。巨人時：掴み投げ／横：タックル',up:'人間：上の足場へワイヤー復帰（空中1回）／巨人：対空アッパー',ab:'攻撃・被弾でTITAN GAUGE蓄積。MAXで下特殊：18秒の巨人化。巨人の下特殊：2秒硬質化（6秒間隔）。背後上部のうなじは1.2倍ダメージ'};
SPECIAL_IDS.push('eren');ANIME_COLORS.eren='#b8b276';fighterRoles.eren='ODM / 時間制限巨人化';
const EREN_MOVES={
 erenBlades:{type:'normal',act0:3,act1:10,end:19,reach:24,R:20,yo:33,cd:5,multi:5,dm:5,k0:3,ks:.035,up:.4},
 erenSpin:{type:'heavy',act0:5,act1:11,end:29,reach:28,R:29,yo:30,cd:8,dm:16,k0:10,ks:.075,up:.6},
 erenRaid:{type:'normal',act0:5,act1:12,end:38,reach:30,R:26,yo:32,cd:15,dm:14,k0:10,ks:.075,up:.5},
 titanPunch:{type:'normal',act0:11,act1:17,end:39,reach:26,R:20,yo:12,cd:12,dm:14,k0:13,ks:.10,up:.65},
 titanSmash:{type:'heavy',act0:19,act1:24,end:65,reach:32,R:23,yo:15,cd:20,dm:28,k0:21,ks:.14,up:.7},
 titanGrab:{type:'heavy',act0:16,act1:19,end:66,reach:20,R:20,yo:28,cd:24,dm:0,k0:0,ks:0,up:0},
 titanTackle:{type:'heavy',act0:13,act1:24,end:67,reach:18,R:23,yo:14,cd:23,dm:18,k0:17,ks:.12,up:.65,lunge:5},
 titanUpper:{type:'heavy',act0:12,act1:20,end:48,reach:14,R:23,yo:48,cd:16,dm:18,k0:15,ks:.12,up:1.4}
};
Object.assign(MOVE_DEF,EREN_MOVES);
function erenTitan(p){return p?.cid==='eren'&&p.erenForm===1;}
function fighterSize(p){return erenTitan(p)?3:CC(p.cid).size;}
function fighterConfig(p){
 const c=CC(p.cid);if(!erenTitan(p))return c;
 const hard=p.erenHard>0;
 return {...c,size:3,spd:hard?.32:.62,jump:.68,wt:.48,pow:1,dgs:.65,ctc:1.15};
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
 if(p.erenHard>0){erenMove(p,'titanPunch',{end:51});return;}
 if(ch<CH_TH)erenMove(p,erenTitan(p)?'titanPunch':'erenBlades');
 else{const q=constrain((ch-CH_TH)/(CH_FULL-CH_TH),0,1);erenMove(p,erenTitan(p)?'titanSmash':'erenSpin',{dm:erenTitan(p)?18+10*q:10+6*q,k0:erenTitan(p)?14+7*q:7+3*q});}
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
 clearActs(p);p.erenForm=1;p.erenTime=EREN.duration;p.erenGauge=0;p.erenWire=null;p.erenHard=0;
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
  erenMove(p,up?'titanUpper':side?'titanTackle':'titanGrab');p.spc=up?65:side?95:90;
  if(side)p.f=side;
 }else if(up)erenWire(p,true);
 else if(side){p.f=side;if(erenWire(p)){erenMove(p,'erenRaid');p.spc=65;}}
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
  const kb=applyHit(p,{dm:16,k0:19,ks:.12,up:.65,f:g.dir},false,a.id);
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
 if(!erenTitan(p))return [{name:'side',dir:'side',range:125,startup:9,damage:14,recovery:26,hold:2,ready:()=>!p.erenWireCd&&!!erenAnchor(p,false)}];
 return [{name:'special',dir:'neutral',range:120,startup:16,damage:16,hold:2},
  {name:'side',dir:'side',range:140,startup:13,damage:18,hold:2}];
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
aiMeleeProfile=function(p,hold=2){if(p.cid!=='eren')return erenBaseProfile(p,hold);const m=EREN_MOVES[erenTitan(p)?hold>=CH_TH?'titanSmash':'titanPunch':hold>=CH_TH?'erenSpin':'erenBlades'];return {range:(m.reach+m.R)*fighterSize(p),startup:m.act0+hold,damage:!erenTitan(p)&&hold<CH_TH?10:m.dm,hold,type:m.type,recovery:m.end-m.act1};};
// Presentation is generated geometry and synthesized effects only.
function erenDrawBody(p,t,titan=erenTitan(p)){
 const sc=titan?3:1,attack=p.mv&&p.a>=p.mv.act0&&p.a<=p.mv.act1;
 push();translate(p.x,p.y);scale(sc);scale(p.f,1);
 if(isInvuln(p)&&t%8<3)drawingContext.globalAlpha*=.55;
 const walk=Math.sin(t*.22)*Math.min(4,Math.abs(p.vx))*1.2;
 stroke('#16202a');strokeWeight(titan?9:5);
 line(-7,-20,-10-walk,-2);line(7,-20,12+walk,-2);
 stroke(titan?'#b57860':'#d3c5a2');strokeWeight(titan?6:3);line(-7,-20,-10-walk,-2);line(7,-20,12+walk,-2);
 noStroke();fill(titan?'#aa6658':'#766c53');quad(-13,-48,13,-48,11,-18,-11,-18);
 if(titan){
  fill('#dc9b79');ellipse(-7,-42,15,17);ellipse(7,-42,15,17);rect(-6,-35,12,17,3);
  stroke('#7b463e');strokeWeight(.8);for(let i=0;i<4;i++)line(-5,-33+i*4,5,-33+i*4);
 }else{
  fill('#b69b68');quad(-13,-48,-3,-47,-3,-26,-14,-24);quad(3,-47,13,-48,14,-24,3,-26);
  stroke('#343d35');strokeWeight(2);line(-9,-44,7,-20);line(9,-44,-7,-20);
  fill('#87979c');noStroke();rect(-19,-23,9,16,2);rect(11,-23,9,16,2);
  stroke('#d8dfdc');strokeWeight(1);line(-17,-22,-17,-9);line(15,-22,15,-9);
 }
 stroke('#172027');strokeWeight(1.5);fill(titan?'#dc9b79':'#dcc5a7');ellipse(0,-59,18,22);
 fill('#29342b');beginShape();vertex(-11,-52);vertex(-14,-67);vertex(-7,-74);vertex(7,-74);vertex(14,-65);vertex(10,-49);vertex(5,-64);vertex(-3,-65);vertex(-8,-49);endShape(CLOSE);
 if(titan){stroke('#f7e4be');strokeWeight(1.2);line(0,-60,8,-60);line(-3,-53,8,-53);stroke('#618b71');line(2,-63,7,-63);}
 let hx=17,hy=-35;
 if(p.ch>0){hx=-19;hy=-44;}
 if(titan&&p.mv?.kind==='titanSmash'&&p.a<p.mv.act0){hx=-24;hy=-48;}
 if(attack){hx=p.mv.reach;hy=-p.mv.yo;}
 if(titan&&p.mv?.kind==='titanGrab'&&p.a>=16&&p.a<46){hx=21;hy=-38;}
 if(p.ct>0||p.erenHard>0){hx=11;hy=-53;}
 stroke(titan?'#9f6556':'#172027');strokeWeight(titan?10:5);const alternate=titan&&p.mv?.kind==='titanPunch'&&(p.erenSwing||0)%2===0;line(alternate?-9:9,-45,hx,hy);line(alternate?9:-9,-45,-18,-30);
 if(titan){
  noStroke();fill(p.erenHard>0?'#c1dce9':'#d69a78');rect(hx-7,hy-5,14,11,3);rect(-24,-34,12,10,3);
  stroke('#e9f0e5');strokeWeight(.8);line(hx-4,hy-3,hx+4,hy-3);
  // Small visible nape target, not a whole-back damage multiplier.
  noStroke();fill('#f3c38d');ellipse(-6.3,-57,5,6);
  noFill();stroke(229,230,219,60);strokeWeight(1.2);
  for(let i=0;i<3;i++){const q=(t*.015+i*.3)%1;bezier(-12+i*9,-54-q*10,-23+i*9,-63-q*12,1+i*9,-64-q*12,-6+i*9,-75-q*10);}
 }else{
  const blade=(x,y,ang)=>{push();translate(x,y);rotate(ang);stroke('#dce7df');strokeWeight(2);line(0,0,23,-17);stroke('#839495');strokeWeight(1);line(0,1,22,-15);pop();};
  blade(hx,hy,attack?Math.sin(p.a*.9)*.65:0);blade(-18,-30,attack?-Math.sin(p.a*.9)*.65:.3);
  if(p.erenWire||p.dg>0){noStroke();fill(205,228,219,100);for(let i=0;i<4;i++)ellipse(-23-i*6,-21+i*2,10+i*3,6+i*2);}
 }
 if(attack){noFill();stroke(titan?'#ffd68e':'#b5f0dc');strokeWeight(titan?1.8:1.2);arc(hx,hy,p.mv.R*2,p.mv.R*2,-1.2,1.3);}
 pop();
}
function drawEren(p){
 if(p.out)return;
 if(p.erenWire){push();stroke('#d5e8e1');strokeWeight(1.4);for(const offset of [-12,12])line(p.x+offset,p.y-27,p.erenWire.x,p.erenWire.y);noStroke();fill('#dce2bd');circle(p.erenWire.x,p.erenWire.y,6);pop();}
 erenDrawBody(p,visualFrame);
 push();textAlign(CENTER,CENTER);textSize(12);stroke('#111b22');strokeWeight(3);fill(p.c);text(p.label,p.x,p.y-(erenTitan(p)?228:94));pop();
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
const erenBasePortrait=portrait;
portrait=function(id,gear=1,form=0,mode=false){
 if(id!=='eren')return erenBasePortrait(id,gear,form,mode);
 return `<svg viewBox="0 0 100 82" aria-hidden="true"><path d="M22 80l7-37 20-11 24 12 11 36" fill="${form?'#ae6e59':'#9a835c'}"/><path d="M36 47l13 31 17-31M28 62h47" stroke="#354239" stroke-width="4" fill="none"/><ellipse cx="50" cy="24" rx="16" ry="20" fill="#dcb58e"/><path d="M31 41L28 16 39 3h23l11 14-7 26-8-24-14-2-8 26" fill="#29372e"/><path d="M27 48L4 70M75 48l22 22" stroke="#d4e4da" stroke-width="4"/><path d="M37 80V62h-15v18m42 0V62h15v18" fill="#82918c"/><path d="M53 26h9m-9 11h9" stroke="${form?'#f4f0d7':'#31483b'}" stroke-width="2"/></svg>`;
};
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
