// Kaneki's mechanics are isolated; victims confirm hits/pulls, owners confirm regeneration.
const KANEKI={duration:900,cutin:84,fatigue:24,regenCooldown:360,regenCap:20,regenHits:3,pullTime:18,pullImmunity:120};
CHARS.kaneki={name:'金木 研',en:'KEN KANEKI',mark:'赫',spd:1.12,jump:1.08,jumps:2,wt:1.18,pow:1.08,size:1,ctx:0,back:false,ctc:1,dgc:1,dgs:1,st:[4,2,3],sp:'特殊：赫子乱舞／横：赫子捕縛 → 乱舞・上特殊・攻撃へ連携',up:'赫子跳躍（空中1回）',ab:'白髪・四尾鱗赫。確認済み攻撃3回で2%再生（6秒間隔・残機20%まで）。MAXで下特殊：半赫者「百足」15秒。覚醒中下特殊：狂乱衝撃'};
SPECIAL_IDS.push('kaneki');ANIME_COLORS.kaneki='#e94b69';fighterRoles.kaneki='鱗赫 / 捕縛・再生';
const KANEKI_MOVES={
 kanekiJab:{type:'normal',act0:3,act1:7,end:16,reach:42,R:24,yo:32,dm:8,k0:3,ks:.035,up:.3,cd:5},
 kanekiPierce:{type:'heavy',act0:15,act1:21,end:48,reach:95,R:27,yo:34,line:true,dm:25,k0:16,ks:.12,up:.5,cd:15},
 kanekiDance:{type:'normal',act0:4,act1:25,end:38,reach:68,R:30,yo:34,multi:7,dm:6,k0:1,ks:.012,up:.12,cd:12},
 kanekiBind:{type:'heavy',act0:10,act1:13,end:48,reach:170,R:17,yo:32,line:true,dm:8,k0:2,ks:.02,up:.2,cd:20},
 kanekiRise:{type:'normal',act0:3,act1:14,end:28,reach:15,R:33,yo:55,dm:13,k0:7,ks:.06,up:1.1,cd:12},
 kakujaJab:{type:'normal',act0:2,act1:8,end:14,reach:52,R:28,yo:33,multi:6,dm:5,k0:2,ks:.025,up:.2,cd:4},
 kakujaPierce:{type:'heavy',act0:17,act1:24,end:52,reach:120,R:32,yo:34,line:true,dm:30,k0:18,ks:.13,up:.6,cd:20},
 kakujaDance:{type:'normal',act0:3,act1:28,end:40,reach:86,R:38,yo:35,multi:5,dm:5,k0:1,ks:.012,up:.12,cd:14},
 kakujaRaid:{type:'normal',act0:5,act1:23,end:43,reach:55,R:32,yo:33,multi:6,dm:5,k0:2,ks:.02,up:.2,lunge:9,rush:true,cd:18},
 kakujaRise:{type:'normal',act0:3,act1:16,end:30,reach:18,R:39,yo:60,dm:16,k0:9,ks:.07,up:1.2,cd:15},
 kakujaBurst:{type:'heavy',act0:22,act1:26,end:65,reach:0,R:125,yo:32,dm:23,k0:17,ks:.12,up:.7,cd:30}
};
Object.assign(MOVE_DEF,KANEKI_MOVES);
let kanekiLifeSerial=0;
function kanekiAwake(p){return p?.cid==='kaneki'&&p.kanekiTime>0;}
function kanekiReset(p){Object.assign(p,{kanekiLife:++kanekiLifeSerial,kanekiSwing:0,kanekiGauge:0,kanekiTime:0,kanekiFatigue:0,kanekiRegenCd:0,kanekiHealed:0,kanekiHits:0,kanekiGlow:0,kanekiBurstCd:0,kanekiAttacks:new Map(),kanekiReceipts:new Set(),kanekiPull:null,kanekiPullSeen:new Set(),kanekiPullImmune:0,kanekiBuffer:null});}
const kanekiInitBase=animeInit;
animeInit=function(p){kanekiInitBase(p);kanekiReset(p);};
function kanekiMove(p,kind,extra={}){
 const token=p.id+':'+curRound+':'+p.kanekiLife+':'+(++p.kanekiSwing);
 p.mv={...mkMv(kind),...extra,kanekiToken:token,kanekiPhase:0};p.a=1;p.ch=0;p.hit={};p.kanekiBuffer=null;
 p.kanekiAttacks.set(token,{kind,connected:false});if(p.kanekiAttacks.size>128)p.kanekiAttacks.delete(p.kanekiAttacks.keys().next().value);
 tone(190,65,.12,.09,'sawtooth');
}
function kanekiAttack(p,ch){if(p.kanekiFatigue)return;const awake=kanekiAwake(p),heavy=ch>=CH_TH,q=constrain((ch-CH_TH)/(CH_FULL-CH_TH),0,1);kanekiMove(p,awake?(heavy?'kakujaPierce':'kakujaJab'):(heavy?'kanekiPierce':'kanekiJab'),heavy?{dm:(awake?20:15)+(awake?10:10)*q}:{});}
const kanekiAttackBase=fireAttack;
fireAttack=function(p,ch){if(p.cid==='kaneki')return kanekiAttack(p,ch);return kanekiAttackBase(p,ch);};
function kanekiCutin(e){freezeT=freezeMax=KANEKI.cutin;fzType='kakuja';fz={att:e.id};tone(110,32,.7,.16,'sawtooth');}
function kanekiTransform(p){
 if(p.out||kanekiAwake(p)||p.kanekiGauge<100||p.kanekiFatigue)return false;
 clearActs(p);p.kanekiPull=null;p.kanekiGauge=0;p.kanekiTime=KANEKI.duration;
 const e={id:p.id,x:p.x,y:p.y};if(online)requestCinematic('kakuja',e);else kanekiCutin(e);return true;
}
function kanekiSpecial(p,i){
 if(p.spc>0||p.kanekiFatigue)return;
 const up=i.u&&!i.neutralSpecial&&!i.sideSpecial,down=i.gd||i.d&&!i.neutralSpecial&&!i.sideSpecial,side=i.sideSpecial||(!i.neutralSpecial&&!up?((i.r?1:0)-(i.l?1:0)):0),awake=kanekiAwake(p);
 if(down){if(!awake){if(!kanekiTransform(p))animeNotice(p,'KAKUJA GAUGE '+Math.floor(p.kanekiGauge)+'/100','#e94b69');}else if(!p.kanekiBurstCd){kanekiMove(p,'kakujaBurst');p.kanekiBurstCd=300;p.spc=75;}return;}
 if(up){if(p.rec)return;p.rec=true;p.g=false;p.groundPl=-1;p.vy=awake?-13:-11.5;kanekiMove(p,awake?'kakujaRise':'kanekiRise');p.spc=32;}
 else if(side){p.f=side;kanekiMove(p,awake?'kakujaRaid':'kanekiBind');p.spc=awake?65:80;}
 else{kanekiMove(p,awake?'kakujaDance':'kanekiDance');p.spc=awake?48:44;}
}
function kanekiGain(p,n){if(p?.cid!=='kaneki'||!isLocal(p)||p.out||kanekiAwake(p)||p.kanekiFatigue)return;const old=p.kanekiGauge;p.kanekiGauge=Math.min(100,old+n);if(old<100&&p.kanekiGauge===100){p.kanekiGlow=30;animeNotice(p,'KAKUJA READY','#f25a78');}}
function kanekiConfirm(e){
 const p=byId(e.a),target=byId(e.t);if(p?.cid!=='kaneki'||!isLocal(p)||p.out||!target||sameTeam(p,target)||target.shadowClone||!['hit','armor'].includes(e.res)||e.bk)return;
 const token=e.kanekiToken,record=p.kanekiAttacks.get(token);if(!record)return;
 record.connected=true;
 if(record.kind==='kakujaBurst'&&!online){freezeT=Math.max(freezeT,5);freezeMax=freezeT;fzType='erenHitstop';fz=null;shake=Math.max(shake,8);}
 // Once per committed attack, independent of number of tails, victims or replays.
 if(!remember(p.kanekiReceipts,token,128))return;
 kanekiGain(p,record.kind.includes('Dance')?16:12);p.kanekiHits=Math.min(KANEKI.regenHits,p.kanekiHits+1);
 if(p.kanekiHits>=KANEKI.regenHits&&!p.kanekiRegenCd&&p.d>0&&p.kanekiHealed<KANEKI.regenCap){
  const n=Math.min(2,p.d,KANEKI.regenCap-p.kanekiHealed);p.d-=n;p.kanekiHealed+=n;p.kanekiHits=0;p.kanekiRegenCd=KANEKI.regenCooldown;p.kanekiGlow=24;ring(p.x,p.y-30,20,12);burst(p.x,p.y-30,6,1,'#e94b69',12);
 }
}
const kanekiFxBase=playFx;
playFx=function(e,remote){kanekiFxBase(e,remote);kanekiConfirm(e);};
function kanekiPrepare(p){
 const m=p.mv;if(p.cid!=='kaneki'||!m||!KANEKI_MOVES[m.kind])return;
 const base=KANEKI_MOVES[m.kind],phase=base.multi?Math.max(0,Math.floor((p.a-base.act0)/base.multi)):0;m.kanekiPhase=phase;
 if(['kanekiDance','kakujaDance','kakujaRaid','kakujaJab'].includes(m.kind)){
  const final=p.a>=base.act1-(base.multi-1);Object.assign(m,{type:final?'heavy':'normal',dm:base.dm,k0:final?10:base.k0,ks:final?.08:base.ks,up:final?.6:base.up});
 }
}
const kanekiCheckBase=meleeCheck;
meleeCheck=function(p){kanekiPrepare(p);return kanekiCheckBase(p);};
function kanekiPullTick(p){
 const g=p.kanekiPull;if(!g)return false;const a=byId(g.by);
 if(!a||a.out||a.cid!=='kaneki'||!g.token.startsWith(a.id+':'+curRound+':'+a.kanekiLife+':')||kanekiAwake(a)||a.kb||a.stn||a.timeStopT||a.domainT||p.out||erenTitan(p)||p.kanekiTime>0||isInvuln(p)||Math.hypot(p.x-a.x,p.y-a.y)>260||--g.t<=0){p.kanekiPull=null;return false;}
 // Victim owner moves its own body; bounded displacement, no teleport across the arena.
 p.x+=constrain(a.x+g.dir*52-p.x,-9,9);p.y+=constrain(a.y-p.y,-6,6);p.vx=p.vy=0;clearActs(p);return true;
}
const kanekiMeleeBase=resolveMelee;
resolveMelee=function(A,t){
 const a=byId(A.id),m=A.mv;
 if(a?.cid==='kaneki'&&KANEKI_MOVES[m.kind]){
  const token=m.kanekiToken;if(!Number.isInteger(m.kanekiPhase)||m.kanekiPhase<0||m.kanekiPhase>Math.floor((KANEKI_MOVES[m.kind].act1-KANEKI_MOVES[m.kind].act0)/(KANEKI_MOVES[m.kind].multi||1000)))return;
  if(typeof token!=='string'||token.length>180||!token.startsWith(a.id+':'+curRound+':'+a.kanekiLife+':'))return;
  if(t.out||sameTeam(a,t)||isInvuln(t)||t.timeStopT||Math.hypot(a.x-t.x,a.y-t.y)>300)return;
  const key=token+':'+(m.kanekiPhase||0);if(!remember(t.kanekiPullSeen,key,256))return;
  const def=KANEKI_MOVES[m.kind],phase=m.kanekiPhase;
  const final=!!def.multi&&phase===Math.floor((def.act1-def.act0)/def.multi);
  // Accept only this move's bounded charge; never accept fixed-KO or piercing flags.
  const safe={...def,kanekiToken:token,kanekiPhase:phase,dm:m.kind.includes('Pierce')?constrain(m.dm,15,def.dm):def.dm,k0:final?10:def.k0,ks:final?.08:def.ks,up:final?.6:def.up,type:final?'heavy':def.type,ko:false,pierce:false};
  const protectedTarget=isArmored(t);
  const before=t.d;kanekiMeleeBase({...A,mv:safe},t);
  if(m.kind==='kanekiBind'&&t.d>before&&!t.ct&&!protectedTarget&&!erenTitan(t)&&fighterSize(t)<=1.5&&!t.shadowClone&&!t.erenGrab&&!t.kanekiPullImmune&&!kanekiAwake(t)){
   t.kanekiPull={by:a.id,dir:A.f,t:KANEKI.pullTime,token};t.kanekiPullImmune=KANEKI.pullImmunity;t.kb=t.stn=0;
  }
  return;
 }
 return kanekiMeleeBase(A,t);
};
const kanekiHitBase=applyHit;
applyHit=function(p,h,bk,id){const before=p.d,r=kanekiHitBase(p,h,bk,id);if(p.d>before){p.kanekiPull=null;p.kanekiBuffer=null;kanekiGain(p,(p.d-before)*.4);}return r;};
function kanekiTick(p){
 for(const k of ['kanekiFatigue','kanekiRegenCd','kanekiGlow','kanekiBurstCd'])if(p[k]>0)p[k]--;
 if(kanekiAwake(p)&&--p.kanekiTime===0){p.kanekiGauge=0;p.kanekiFatigue=KANEKI.fatigue;clearActs(p);burst(p.x,p.y-30,12,2,'#a82a49',16);}
}
const kanekiStepBase=stepFighter;
stepFighter=function(p,i){
 if(bt.phase==='play'&&!freezeT&&!p.timeStopT&&!p.out){
  if(p.kanekiPullImmune>0)p.kanekiPullImmune--;
  if(p.kanekiPull&&kanekiPullTick(p)){p.prev={...i};return;}
  if(p.cid==='kaneki'){
   kanekiTick(p);
   const record=p.mv&&p.kanekiAttacks.get(p.mv.kanekiToken),edge=i.sc!==p.prev.sc||i.ac!==p.prev.ac;
   if(record?.connected&&edge&&!p.kb&&!p.stn&&p.a>=8)p.kanekiBuffer={i:{...i},t:10};
   if(p.kanekiBuffer){const b=p.kanekiBuffer;if(--b.t<=0||p.kb||p.stn)p.kanekiBuffer=null;else if(p.mv&&p.a>=p.mv.act1){clearActs(p);p.cd=p.spc=0;i=b.i;p.prev.sc=i.sc-1;p.prev.ac=i.ac-1;p.kanekiBuffer=null;}}
   if(p.kanekiFatigue)i={...blankInput(),ac:i.ac,sc:i.sc};
  }
 }
 return kanekiStepBase(p,i);
};
const kanekiConfigBase=fighterConfig;
fighterConfig=function(p){const c=kanekiConfigBase(p);return kanekiAwake(p)?{...c,spd:1.24}:c;};
const kanekiKOBase=koFighter;
koFighter=function(p){kanekiKOBase(p);kanekiReset(p);};
const kanekiPickupBase=tryPickup;
tryPickup=function(p,id,it){if(p.cid==='kaneki')return;return kanekiPickupBase(p,id,it);};
// Bounded snapshots; no remote map/set assignment or remote healing commands.
function kanekiRead(s){const k=s.kn||{},n=(v,max)=>Number.isFinite(v)?constrain(v,0,max):0;return {kanekiLife:n(k.life,1e9),kanekiGauge:n(k.gauge,100),kanekiTime:n(k.time,900),kanekiHealed:n(k.healed,20),kanekiRegenCd:n(k.regen,360),kanekiGlow:n(k.glow,30),kanekiFatigue:n(k.fatigue,24)};}
function kanekiRestore(p,s){if(p.cid==='kaneki')Object.assign(p,kanekiRead(s));const g=s.kg,a=g&&byId(g.by);p.kanekiPull=g&&a?.cid==='kaneki'&&Number.isInteger(g.t)&&g.t>0&&g.t<=18&&typeof g.token==='string'&&g.token.length<=180&&Math.abs(g.dir)===1?{by:g.by,t:g.t,token:g.token,dir:g.dir}:null;}
const kanekiStateBase=stateOf;
stateOf=function(p){const s=kanekiStateBase(p);if(p.cid==='kaneki')s.kn={life:p.kanekiLife,gauge:p.kanekiGauge,time:p.kanekiTime,healed:p.kanekiHealed,regen:p.kanekiRegenCd,glow:p.kanekiGlow,fatigue:p.kanekiFatigue};if(p.kanekiPull)s.kg=p.kanekiPull;return s;};
const kanekiEventBase=handleGameplayEvent;
handleGameplayEvent=function(e){if(e.k==='mh'&&KANEKI_MOVES[e.mv?.kind]&&byId(e.a)?.owner!==e.by)return;if(e.k==='fx'&&e.kanekiToken&&byId(e.t)?.owner!==e.by)return;return kanekiEventBase(e);};
const kanekiReceiveBase=receiveNetEvent;
receiveNetEvent=function(e){if(e?.k==='cinx'&&e.kind==='kakuja'&&byId(e.data?.id)?.owner!==e.by)return;return kanekiReceiveBase(e);};
AI_CHARACTER_PLAN.kaneki={ideal:105,near:48,far:220,shoot:180,skill:.65,charge:.25,guard:.3};
AI_SKILLS.kaneki={range:105,startup:4,damage:24,hold:2,dir:'neutral'};
const kanekiSkillsBase=aiSkillOptions;
aiSkillOptions=function(p,t){if(p.cid!=='kaneki')return kanekiSkillsBase(p,t);return [{name:'special',dir:'neutral',range:kanekiAwake(p)?140:110,startup:4,damage:24,recovery:13,hold:2},{name:'side',dir:'side',range:185,startup:10,damage:8,recovery:35,hold:2,ready:()=>!erenTitan(t)&&!t.kanekiPullImmune}];};
const kanekiTacticsBase=aiTacticalAction;
aiTacticalAction=function(p,t,A,I,D,plan){
 if(p.cid==='kaneki'&&p.mv&&!p.kb&&!p.stn&&!p.ct&&!p.dg){
  const record=p.kanekiAttacks.get(p.mv.kanekiToken);
  if(record?.connected&&!record.comboIssued&&p.a>=Math.max(8,p.mv.act1-6)&&Math.abs(t.x-p.x)<150&&Math.random()>D.error){
   const rise=p.mv.kind==='kanekiDance'&&!p.rec;
   if(p.mv.kind==='kanekiBind'||rise){record.comboIssued=true;I.s=true;I.sc++;I.u=rise;I.neutralSpecial=!rise;I.sideSpecial=0;I.gd=I.d=false;A.shold=2;return rise?'kagune-follow-rise':'kagune-follow-dance';}
  }
 }
 if(p.cid==='kaneki'&&aiReady(p)&&!p.spc&&!p.kanekiFatigue){if(!kanekiAwake(p)&&p.kanekiGauge>=100&&Math.abs(t.x-p.x)<240){aiUseSpecial(p,I,A,2,'down');return 'kakuja-awaken';}if(!p.rec&&t.y<p.y-35&&Math.abs(t.x-p.x)<70){aiUseSpecial(p,I,A,2,'up');return 'kagune-rise';}if(kanekiAwake(p)&&!p.kanekiBurstCd&&Math.abs(t.x-p.x)<100&&t.d>70){aiUseSpecial(p,I,A,2,'down');return 'kakuja-burst';}}return kanekiTacticsBase(p,t,A,I,D,plan);};
const kanekiProfileBase=aiMeleeProfile;
aiMeleeProfile=function(p,hold=2){if(p.cid!=='kaneki')return kanekiProfileBase(p,hold);const m=KANEKI_MOVES[kanekiAwake(p)?hold>=CH_TH?'kakujaPierce':'kakujaJab':hold>=CH_TH?'kanekiPierce':'kanekiJab'];return {range:m.reach+m.R,startup:m.act0+hold,damage:m.dm,hold,type:m.type,recovery:m.end-m.act1};};
// Shared tail pose drives independent organic curves and attack telegraphs.
function kanekiTailPose(p,index,time){
 const m=p.mv,awake=kanekiAwake(p),base=KANEKI_MOVES[m?.kind],active=base&&p.a>=base.act0&&p.a<=base.act1,phase=base?.multi?Math.floor((p.a-base.act0)/base.multi):0;
 let x=-35-index*9,y=-28-index*13,extend=active&&(m.kind.includes('Dance')?index===((phase%4+4)%4):m.kind.includes('Pierce')||m.kind.includes('Burst')||index<2);
 if(extend){x=m.kind.includes('Burst')?(index%2?1:-1)*115:(base.reach||70)+15;y=m.kind.includes('Rise')?-85:-base.yo+(index-1.5)*7;}
 if(extend&&m.kind.includes('Dance'))y+=[0,12,-20,-4][((phase%4)+4)%4];
 const sway=Math.sin(time*.055-index*1.6)*9,lag=Math.sin(time*.055-index*1.6-.8)*12;
 return {x:x*(awake?1.18:1),y:y+sway,cx:-38-index*5-(p.vx||0)*1.4,cy:-65-index*10+lag,extend};
}
function kanekiDraw(p,time=visualFrame){
 if(p.out)return;const awake=kanekiAwake(p);push();translate(p.x,p.y);scale(p.f,1);
 for(let j=0;j<4;j++){
  const q=kanekiTailPose(p,j,time);noFill();stroke('#320c20');strokeWeight(awake?12:7);bezier(-5,-27,q.cx,q.cy,q.cx+q.x*.45,q.y-16,q.x,q.y);stroke(p.kanekiGlow?'#ff7594':'#b3264d');strokeWeight(awake?7:4);bezier(-5,-27,q.cx,q.cy,q.cx+q.x*.45,q.y-16,q.x,q.y);
  noStroke();fill('#ec5572');triangle(q.x-7,q.y-4,q.x+6,q.y,q.x-7,q.y+4);
  if(awake){for(let n=1;n<9;n++){const t=n/9,u=1-t,x=3*u*u*t*q.cx+3*u*t*t*(q.cx+q.x*.45)+t*t*t*q.x,y=u*u*u*(-27)+3*u*u*t*q.cy+3*u*t*t*(q.y-16)+t*t*t*q.y;stroke('#f18a96');strokeWeight(1.5);line(x,y,x-7,y-6);line(x,y,x-7,y+6);}}
 }
 const lean=p.a>0?8:awake?5:1;translate(lean,0);stroke('#101522');strokeWeight(7);line(-3,-24,-11,0);line(3,-24,12,0);strokeWeight(10);line(0,-24,awake?6:0,-48);strokeWeight(5);line(0,-43,p.a?23:12,p.a?-34:-24);line(-2,-43,-13,-25);
 noStroke();if(awake){stroke('#8d2545');strokeWeight(3);for(let n=0;n<5;n++)line(-4,-29-n*4,10,-33-n*4);fill('#341726');noStroke();ellipse(4,-46,21,13);}
 noStroke();fill('#d7c9c4');circle(awake?7:0,-60,20);fill('#e9eef4');beginShape();for(const [x,y] of [[-11,-57],[-13,-65],[-8,-74],[-3,-69],[3,-75],[6,-69],[12,-70],[11,-56],[5,-65],[0,-61],[-4,-66]])vertex(x,y);endShape(CLOSE);
 fill('#14141e');rect(-10,-58,21,10,3);stroke('#c6c8cc');strokeWeight(1);line(-7,-54,8,-54);for(let x=-6;x<9;x+=3)line(x,-56,x,-52);noStroke();fill('#ff274c');ellipse(5,-61,5,3);
 if(awake){fill('#3a1425');triangle(-8,-68,6,-80,16,-54);fill('#ed4b70');ellipse(9,-63,4,6);stroke('#d4b8be');strokeWeight(2);line(8,-51,18,-47);}
 pop();if(p.kanekiGlow>0){push();noStroke();fill('#f35c82');const radius=30*p.kanekiGlow/30;for(let n=0;n<6;n++){const a=n*Math.PI/3+time*.06;circle(p.x+Math.cos(a)*radius,p.y-35+Math.sin(a)*radius,3);}pop();}
 push();textAlign(CENTER,CENTER);textSize(11);fill('#f2c9d5');noStroke();text(p.label,p.x,p.y-94);pop();
 if(p.kanekiPull){const a=byId(p.kanekiPull.by);if(a){push();noFill();stroke('#cb355a');strokeWeight(3);bezier(a.x,a.y-28,a.x+a.f*65,a.y-85,p.x,p.y-60,p.x,p.y-30);pop();}}
}
const kanekiDrawBase=drawFighter;
drawFighter=function(p){if(p.cid==='kaneki')return kanekiDraw(p);const r=kanekiDrawBase(p);if(p.kanekiPull){const a=byId(p.kanekiPull.by);if(a){push();stroke('#c73759');strokeWeight(3);noFill();bezier(a.x,a.y-27,a.x+a.f*80,a.y-70,p.x,p.y-60,p.x,p.y-28);ellipse(p.x,p.y-30,25,13);ellipse(p.x,p.y-23,23,10);pop();}}return r;};
const kanekiPortraitBase=portrait;
portrait=function(id,gear=1,form=0,mode=false){if(id!=='kaneki')return kanekiPortraitBase(id,gear,form,mode);return '<svg viewBox="0 0 100 82" aria-hidden="true"><path d="M45 68Q-15 15 10 10M48 65Q0 65 9 33M55 68Q115 5 85 12M57 66Q110 77 93 36" fill="none" stroke="#b62d50" stroke-width="7"/><path d="M27 82L35 45 64 45 77 82" fill="#111723"/><ellipse cx="50" cy="29" rx="17" ry="20" fill="#d6c5c1"/><path d="M32 33L30 17 37 2 44 9 51 0 57 8 67 6 70 34 61 23 56 29 49 17 42 31 38 22Z" fill="#eef0f6"/><path d="M34 33H67V48H34Z" fill="#111421"/><path d="M38 39h25m-20-3v7m6-7v7m6-7v7" stroke="#dad4d5"/><ellipse cx="59" cy="30" rx="4" ry="3" fill="#f32953"/></svg>';};
const kanekiHudBase=animeHud;
animeHud=function(p){if(p.cid!=='kaneki')return kanekiHudBase(p);return {m:kanekiAwake(p)?p.kanekiTime/9:p.kanekiGauge,label:p.kanekiFatigue?'解除疲労':kanekiAwake(p)?'HALF-KAKUJA '+Math.ceil(p.kanekiTime/60)+'秒':(p.kanekiGauge>=100?'KAKUJA READY':'KAKUJA GAUGE '+Math.floor(p.kanekiGauge)+'/100')+' / 再生 '+p.kanekiHealed.toFixed(1)+'/20'};};
const kanekiControlBase=updateControlUI;
updateControlUI=function(){kanekiControlBase();const p=byId(myId);if(p?.cid!=='kaneki')return;setTxt(document.querySelector('#btn-s small'),kanekiAwake(p)?'百足乱舞':'赫子乱舞');setTxt(document.querySelector('#btn-g small'),kanekiAwake(p)?'狂乱衝撃':'半赫者覚醒');document.getElementById('btn-g').classList.toggle('ready',!kanekiAwake(p)&&p.kanekiGauge>=100);setTxt(document.getElementById('combat-hint'),'横：捕縛 → 特殊：乱舞 → 上：跳躍 ／ 攻撃成功で再生 ／ MAXで下：半赫者');};
const kanekiFreezeWorldBase=drawFreezeWorld,kanekiFreezeTextBase=drawFreezeText,kanekiEndFreezeBase=endFreeze;
drawFreezeWorld=function(){if(fzType==='kakuja')return;return kanekiFreezeWorldBase();};
endFreeze=function(){if(fzType==='kakuja')return;return kanekiEndFreezeBase();};
drawFreezeText=function(){if(fzType!=='kakuja')return kanekiFreezeTextBase();const p=byId(fz?.att);if(!p)return;const q=1-freezeT/Math.max(1,freezeMax);push();noStroke();fill(12,4,14,prefs.lowFlash?190:235);rect(0,0,W,WH);push();translate(W*.5,WH*.62);scale(2.5);kanekiDraw({...p,x:0,y:0,kanekiTime:q>.45?900:0,a:q>.2?10:0,mv:mkMv('kakujaBurst')},visualFrame);pop();fill('#ef5579');textAlign(CENTER,CENTER);textSize(Math.min(38,W/12));text(q<.45?'鱗赫、覚醒': 'HALF-KAKUJA',W*.5,WH*.24);textSize(15);fill('#e6c1cd');text('金木 研  /  半赫者「百足」',W*.5,WH*.83);pop();};
const kanekiArmorBase=armorHit;
armorHit=function(p,h,id){const before=p.d,r=kanekiArmorBase(p,h,id);kanekiGain(p,(p.d-before)*.4);return r;};
const kanekiProjBase=resolveProj;
resolveProj=function(q,p){const before=p.d,r=kanekiProjBase(q,p);if(q.animeKind==='ki')kanekiGain(p,(p.d-before)*.4);return r;};
