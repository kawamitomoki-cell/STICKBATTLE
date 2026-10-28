import test from 'node:test';
import assert from 'node:assert/strict';
import {game} from './helpers/game.mjs';
const setup=`frameCount=0;startBattleCommon([{id:myId,cid:'eren',owner:myId,label:'EREN',cpu:0},{id:'enemy',cid:'karate',owner:myId,label:'Enemy',cpu:1}],'std',false,3);bt.phase='play';const p=byId(myId),t=byId('enemy');p.x=400;p.y=390;p.inv=0;t.x=455;t.y=390;t.inv=0;`;
function env(){const g=game();g.run(setup);return g;}
test('Eren is selectable in special roster and all eleven attacks are registered',()=>{
 const g=env();assert.ok(g.run('cpuCharacterPool("special").includes("eren")'));
 assert.equal(g.run('Object.keys(EREN_MOVES).length'),11);
 for(const titan of [false,true])for(const direction of ['neutral','side','up','down']){
  g.run(`erenReset(p);p.erenForm=${titan?1:0};p.erenTime=1080;p.erenGauge=100;p.spc=0;p.prev=blankInput();
   erenSpecial(p,{neutralSpecial:${direction==='neutral'},u:${direction==='up'},d:${direction==='down'},sideSpecial:${direction==='side'?1:0}});`);
  assert.ok(g.run('p.erenForm||p.erenWire||p.erenHard||p.mv||p.spc>0'),`${titan}/${direction}`);
 }
});
test('dual blades hit twice, but gain only six gauge per swing and target',()=>{
 const g=env();g.run(`fireAttack(p,1);p.a=3;meleeCheck(p);const first=t.d;
 p.hit={};p.a=8;meleeCheck(p);`);
 assert.equal(g.run('t.d'),10);assert.equal(g.run('first'),5);assert.equal(g.run('p.erenGauge'),6);
});
test('received damage gains gauge, idle time does not, titan cannot refill',()=>{
 const g=env();g.run('for(let i=0;i<200;i++)erenTick(p);');assert.equal(g.run('p.erenGauge'),0);
 g.run('applyHit(p,{dm:20,k0:1,ks:0,up:.2,f:1},false,t.id);');assert.equal(g.run('p.erenGauge'),40);
 g.run('p.erenGauge=100;erenTransform(p);freezeT=0;applyHit(p,{dm:20,k0:1,ks:0,up:.2,f:1},false,t.id);');assert.equal(g.run('p.erenGauge'),0);
});
test('transform requires MAX; lasts 1080 active ticks; pauses in cutin and time stop',()=>{
 const g=env();assert.equal(g.run('erenTransform(p)'),false);
 g.run('p.erenGauge=100;erenTransform(p);const y=p.y;');assert.equal(g.run('p.y'),390);assert.equal(g.run('fighterSize(p)'),3);
 g.run('for(let i=0;i<100;i++)stepFighter(p,blankInput());');assert.equal(g.run('p.erenTime'),1080);
 g.run('freezeT=0;p.timeStopT=30;stepFighter(p,blankInput());');assert.equal(g.run('p.erenTime'),1080);
 g.run('p.timeStopT=0;for(let i=0;i<1079;i++)erenTick(p);');assert.equal(g.run('p.erenForm'),1);assert.equal(g.run('p.erenTime'),1);
 g.run('erenTick(p);');assert.equal(g.run('p.erenForm'),0);assert.equal(g.run('p.erenFatigue'),60);
 g.run('for(let i=0;i<60;i++)erenTick(p);');assert.equal(g.run('p.erenFatigue'),0);
});
test('wire needs a real platform, expires, accelerates toward anchor, up use is limited',()=>{
 const g=env();g.run('const ok=erenWire(p,true);const wire=p.erenWire;erenTick(p);');
 assert.equal(g.run('ok'),true);assert.ok(g.run('p.vy<0'));assert.ok(g.run('wire.y===stage.plats[wire.pl].y'));
 assert.equal(g.run('erenWire(p,true)'),false);
 g.run('for(let i=0;i<50;i++)erenTick(p);');assert.equal(g.run('p.erenWire'),null);
 g.run('erenReset(p);p.rec=false;stage={w:800,h:450,plats:[]};');assert.equal(g.run('erenWire(p,true)'),false);
});
test('titan body includes feet and head; nape is small, high and behind',()=>{
 const g=env();g.run('p.erenForm=1;');
 assert.equal(g.run('erenBodyHit(p,400,200,1)'),true);assert.equal(g.run('erenBodyHit(p,400,385,1)'),true);
 assert.equal(g.run('erenBodyHit(p,470,200,1)'),false);
 assert.equal(g.run('erenNape(p,381,219,1)'),true);assert.equal(g.run('erenNape(p,419,219,1)'),false);assert.equal(g.run('erenNape(p,381,350,1)'),false);
 g.run(`resolveProj({o:t.id,x:381,y:219,vx:1,dir:1,dm:10,k0:1,ks:0,up:.2},p);`);assert.equal(g.run('p.d'),12);
});
test('titan punches reach small fighters at its feet; enemy melee can hit its torso',()=>{
 const g=env();g.run('p.erenForm=1;erenMove(p,"titanPunch");p.a=11;t.x=480;meleeCheck(p);');assert.equal(g.run('t.d'),14);
 g.run('t.x=430;t.y=270;t.f=-1;fireAttack(t,1);t.a=t.mv.act0;meleeCheck(t);');assert.ok(g.run('p.d>0'));
});
test('down special hardens for 120 ticks, reduces damage, limits attacks and cools for 360 ticks',()=>{
 const g=env();g.run('p.erenForm=1;p.erenTime=1080;erenSpecial(p,{d:true});');
 assert.equal(g.run('p.erenHard'),120);assert.equal(g.run('p.erenHardCd'),360);
 assert.ok(g.run('fighterConfig(p).spd<.82'));g.run('fireAttack(p,CH_FULL);');assert.equal(g.run('p.mv.kind'),'titanPunch');assert.equal(g.run('p.mv.end'),42);
 g.run('applyHit(p,{dm:20,k0:1,ks:0,up:.2,f:1},false,t.id);');assert.equal(g.run('p.d'),14);
 g.run('for(let i=0;i<120;i++)erenTick(p);');assert.equal(g.run('p.erenHard'),0);assert.equal(g.run('p.erenHardCd'),240);
 g.run('erenSpecial(p,{d:true});');assert.equal(g.run('p.erenHard'),0);
});

test('grab holds one target then throws once; duplicate token and stale owner are rejected',()=>{
 const g=env();g.run('p.erenForm=1;p.erenTime=1080;erenMove(p,"titanGrab");const A={id:p.id,mv:p.mv};erenGrabStart(A,t);');
 assert.ok(g.run('!!t.erenGrab'));
 g.run('for(let i=0;i<24;i++)erenGrabTick(t);');assert.equal(g.run('t.d'),20);assert.equal(g.run('t.erenGrab'),null);
 g.run('erenGrabStart(A,t);');assert.equal(g.run('t.erenGrab'),null);
 g.run('t.erenGrab={by:p.id,dir:1,t:20};p.erenForm=0;erenGrabTick(t);');assert.equal(g.run('t.erenGrab'),null);
});
test('team and invulnerability protect against grab',()=>{
 const g=env();g.run('p.erenForm=1;p.erenTime=1080;erenMove(p,"titanGrab");const A={id:p.id,mv:p.mv};battleTeamMode=true;p.team=t.team=1;erenGrabStart(A,t);');assert.equal(g.run('!!t.erenGrab'),false);
 g.run('battleTeamMode=false;t.inv=30;erenGrabStart(A,t);');assert.equal(g.run('!!t.erenGrab'),false);
});
test('KO resets titan and gauge, including final stock',()=>{
 const g=env();g.run('p.erenForm=1;p.erenTime=1080;p.erenGauge=100;p.s=1;koFighter(p);');assert.equal(g.run('p.out'),true);assert.equal(g.run('p.erenForm'),0);assert.equal(g.run('p.erenGauge'),0);
});
test('snapshot restores bounded titan/hardening/wire state and rejects fake anchors',()=>{
 const g=env();g.run('p.erenForm=1;p.erenTime=900;p.erenHard=30;const s=stateOf(p);const restored=erenReadState(s);');assert.equal(g.run('restored.erenTime'),900);assert.equal(g.run('restored.erenHard'),30);
 g.run('const bad=erenReadState({ef:1,eg:1e9,et:1e9,eh:NaN,ew:{pl:0,x:-999,y:1}});');assert.equal(g.run('bad.erenTime'),1080);assert.equal(g.run('bad.erenHard'),0);assert.equal(g.run('bad.erenWire'),null);
});
test('CPU transforms only with room and relevant combat opportunity',()=>{
 const g=env();g.run('p.cpu=true;p.ai={inp:blankInput()};p.g=true;p.groundPl=0;p.erenGauge=100;t.x=490;');
 assert.equal(g.run('aiTacticalAction(p,t,p.ai,p.ai.inp,AI_DIFFICULTY[3],AI_CHARACTER_PLAN.eren)'),'titan-transform');assert.equal(g.run('p.ai.inp.gd'),true);
});
test('two clients reconstruct titan form and grab/throw through the existing transport',()=>{
 const owner=game(),guest=game(),aId=owner.run('myId'),bId=guest.run('myId');
 const roster=[{id:aId,cid:'eren',owner:aId,label:'Eren'},{id:bId,cid:'karate',owner:bId,label:'Player'}];
 const writes=[],events=[];
 for(const g of [owner,guest]){
  g.ctx.room={child:path=>({update:async payload=>writes.push(payload),push:()=>({set:async e=>events.push(e)})})};
  g.run(`online=true;curRound=1;startBattleCommon(${JSON.stringify(roster)},'std',false,3);bt.phase='play';roomRef=room;fighters.forEach(f=>{f.x=f.cid==='eren'?400:450;f.y=390;f.inv=f.ivf=0;});`);
 }
 owner.run('byId(myId).erenGauge=100;byId(myId).erenGas=44;erenTransform(byId(myId));sendLocal();');
 for(const e of events)guest.ctx.onEvent(e);
 for(const [id,v]of Object.entries(writes[0]))guest.ctx.onP({key:id,val:()=>v});
 guest.run('updateRemote();');assert.equal(guest.run(`byId('${aId}').erenForm`),1);
 assert.equal(guest.run('fzType'),'titan');assert.equal(guest.run('byId(myId).d'),16);assert.equal(guest.run(`byId('${aId}').erenGas`),44);
 owner.run('freezeT=0;erenMove(byId(myId),"titanGrab");');
 const attack=owner.run('({id:myId,mv:byId(myId).mv})');guest.ctx.attack=attack;
 guest.run(`freezeT=0;resolveMelee(attack,byId(myId));for(let i=0;i<24;i++)erenGrabTick(byId(myId));`);
 assert.equal(guest.run('byId(myId).d'),36);assert.equal(guest.run('byId(myId).erenGrab'),null);
 owner.run('erenRevert(byId(myId));');
 const revert=events.find(e=>e.k==='eren-revert');assert.ok(revert);guest.ctx.onEvent(revert);
 assert.equal(guest.run(`byId('${aId}').erenForm`),0);
});
test('a grab swing cannot capture two opponents and cannot forge the attacker owner',()=>{
 const g=env();g.run(`p.erenForm=1;p.erenTime=1080;erenMove(p,'titanGrab');p.a=16;t.x=460;
 const third=makeFighter({id:'third',cid:'karate',owner:myId,label:'Third'},2);third.x=470;third.y=390;third.inv=0;fighters.push(third);meleeCheck(p);`);
 assert.equal(g.run('fighters.filter(f=>f.erenGrab).length'),1);
 g.run('t.erenGrab=null;online=true;handleGameplayEvent({k:"mh",by:"fake",a:p.id,to:t.id,mv:p.mv});');assert.equal(g.run('t.erenGrab'),null);
});
test('upward recovery remains available during ground-wire cooldown, once per airtime',()=>{
 const g=env();g.run('p.erenWireCd=60;p.spc=65;p.rec=false;erenSpecial(p,{u:true});');
 assert.equal(g.run('p.mv.kind'),'erenRiseSpin');assert.equal(g.run('p.erenWire'),null);assert.equal(g.run('p.rec'),true);
 g.run('const riseToken=p.mv.erenToken;p.erenWire=null;erenSpecial(p,{u:true});');assert.equal(g.run('p.erenWire'),null);assert.equal(g.run('p.mv.erenToken'),g.run('riseToken'));
});
test('next stock retains at most 50 earned gauge; final stock resets to zero',()=>{
 const g=env();g.run('p.erenGauge=90;p.s=3;koFighter(p);');assert.equal(g.run('p.erenGauge'),50);assert.equal(g.run('p.s'),2);
 g.run('p.erenGauge=90;p.s=1;koFighter(p);');assert.equal(g.run('p.erenGauge'),0);
});
test('polished moves give human and titan different finishers, keeping timed vulnerability',()=>{
 const g=env();g.run('fireAttack(p,CH_FULL);');assert.equal(g.run('p.mv.kind'),'erenSpin');assert.equal(g.run('p.mv.dm'),22);
 g.run('p.erenGauge=100;erenTransform(p);');assert.equal(g.run('p.inv'),90);
 g.run('freezeT=0;fireAttack(p,CH_FULL);');assert.equal(g.run('p.mv.kind'),'titanSmash');assert.equal(g.run('p.mv.dm'),28);
 assert.ok(g.run('p.mv.end>p.mv.act1+20'));
 g.run('clearActs(p);for(let i=0;i<90;i++)stepFighter(p,blankInput());');assert.equal(g.run('isInvuln(p)'),false);
});
test('wire combat keeps tether acceleration during an actual moving slash',()=>{
 const g=env();g.run('p.f=1;t.x=460;t.y=350;erenWire(p);erenAttack(p,1);const x=p.x,y=p.y;for(let i=0;i<10;i++){stepFighter(p,blankInput());meleeCheck(p);}');
 assert.equal(g.run('p.mv.kind'),'erenWireCut');assert.ok(g.run('Math.hypot(p.x-x,p.y-y)>40&&Math.hypot(p.x-x,p.y-y)<160'));
 assert.ok(g.run('t.d>0'));assert.ok(g.run('!!p.erenWire'));
});
test('tether slashes hit twice and titan fists alternate without duplicate damage',()=>{
 const g=env();g.run('erenWire(p);erenAttack(p,1);for(const frame of [2,7]){p.a=frame;p.hit={};meleeCheck(p);}');
 assert.equal(g.run('t.d'),10);assert.equal(g.run('p.erenGauge'),6);
 g.run('p.erenForm=1;erenMove(p,"titanPunch");t.d=0;t.x=480;const firstArm=erenHandPose(p).second;for(const frame of [6,12]){p.a=frame;meleeCheck(p);}');
 assert.equal(g.run('t.d'),14);g.run('erenMove(p,"titanPunch");');assert.notEqual(g.run('erenHandPose(p).second'),g.run('firstArm'));
});

test('hardening also works in the air and cannot become an unlimited guard',()=>{
 const g=env();g.run('p.erenForm=1;p.erenTime=1080;p.g=false;p.y=300;erenSpecial(p,{d:true});');assert.equal(g.run('p.erenHard'),120);
 g.run('for(let i=0;i<125;i++)erenTick(p);erenSpecial(p,{d:true});');assert.equal(g.run('p.erenHard'),0);
 g.run('p.erenHardCd=0;erenSpecial(p,{d:true});');assert.equal(g.run('p.erenHard'),120);
});

test('neutral special spins without an anchor and leaves gas for side movement',()=>{
 const g=env();g.run('stage={w:800,h:450,plats:[]};p.erenGas=0;erenSpecial(p,{neutralSpecial:true});');
 assert.equal(g.run('p.mv.kind'),'erenCrossSpin');assert.equal(g.run('p.erenWire'),null);assert.equal(g.run('p.erenGas'),0);
});

test('side special launches toward a forward anchor and cuts for 30 frames with a punishable recovery',()=>{
 const g=env();g.run('p.f=1;erenSpecial(p,{sideSpecial:1});');
 assert.equal(g.run('p.erenWire.y'),390);assert.equal(g.run('p.mv.kind'),'erenRaid');
 assert.equal(g.run('p.mv.act1-p.mv.act0+1'),30);assert.ok(g.run('!p.mv.multi&&p.mv.end>p.mv.act1+10'));
 g.run('t.ct=CT_ON;t.f=-1;p.a=3;t.x=p.x+35;meleeCheck(p);');assert.equal(g.run('fzType'),'counter');
});
test('committed titan attacks tank ordinary hits but still take damage and heavy knockback',()=>{
 const g=env();g.run(`p.erenForm=1;p.erenTime=1080;p.inv=0;erenMove(p,"titanPunch");p.a=6;
 const A={id:t.id,x:t.x,f:-1,mv:{type:"normal",kind:"normal",dm:10,k0:8,ks:.05,up:.6}};resolveMelee(A,p);`);
 assert.equal(g.run('p.d'),10);assert.equal(g.run('p.kb'),0);assert.equal(g.run('p.a'),6);
 g.run('resolveMelee({...A,mv:{...A.mv,type:"heavy",kind:"charge",dm:20}},p);');assert.ok(g.run('p.kb>0'));assert.equal(g.run('p.d'),30);
});
test('flight can rehook during a slash, steer, detach with momentum and consume finite gas',()=>{
 const g=env();g.run(`t.out=true;p.f=1;p.g=true;p.groundPl=0;let I={...blankInput(),r:true,s:true,sc:1};stepFighter(p,I);
 const first=p.erenSwing;for(let i=0;i<EREN.wireCooldown+1;i++)stepFighter(p,I);const gas=p.erenGas;
 I={...I,l:true,r:false,sc:2};stepFighter(p,I);`);
 assert.equal(g.run('p.f'),-1);assert.ok(g.run('p.erenSwing>first'));assert.ok(g.run('p.erenGas<gas'));
 g.run(`const v=p.vx;I={...I,jc:1};stepFighter(p,I);`);
 assert.equal(g.run('p.erenWire'),null);assert.ok(g.run('p.erenGlide>0'));assert.ok(g.run('Math.abs(p.vx)>Math.abs(v)*.8'));
 g.run('p.erenWireCd=0;p.erenGas=0;p.rec=false;');assert.equal(g.run('erenWire(p,true)'),false);
 g.run('p.g=true;for(let i=0;i<40;i++)erenTick(p);');assert.equal(g.run('p.erenGas'),100);
});
test('attack button cancels flying raid into a player-controlled moving blade attack',()=>{
 const g=env();g.run(`p.g=true;p.f=1;let I={...blankInput(),r:true,s:true,sc:1};stepFighter(p,I);
 I={...I,a:true,ac:1};stepFighter(p,I);I={...I,a:false,rc:1};stepFighter(p,I);`);
 assert.equal(g.run('p.mv.kind'),'erenWireCut');assert.ok(g.run('!!p.erenWire'));
});
test('MAX transformation breaks hitstun, bursts nearby enemies once and respects teams and invulnerability',()=>{
 const g=env();g.run(`p.kb=70;p.stn=40;p.erenGauge=100;p.vx=20;stepFighter(p,{...blankInput(),gd:true,sc:1});`);
 assert.equal(g.run('p.erenForm'),1);assert.equal(g.run('p.kb+p.stn'),0);assert.equal(g.run('p.vx'),0);assert.equal(g.run('t.d'),16);
 assert.equal(g.run('erenTransform(p)'),false);assert.equal(g.run('t.d'),16);
 for(const protect of ['battleTeamMode=true;p.team=t.team=1','t.inv=30','t.x=p.x+240']){
  const h=env();h.run(`${protect};p.erenGauge=100;erenTransform(p);`);assert.equal(h.run('t.d'),0,protect);
 }
 const h=env();h.run(`p.erenGauge=100;p.timeStopT=20;stepFighter(p,{...blankInput(),gd:true,sc:1});`);assert.equal(h.run('p.erenForm'),0);
});
test('giant attacks use dedicated fist geometry, hit multiple enemies and remain counterable',()=>{
 const g=env();g.run(`p.erenForm=1;p.erenTime=1080;p.f=1;t.x=p.x+100;
 const third=makeFighter({id:'third',cid:'karate',owner:myId,label:'Third'},2);third.x=p.x+120;third.y=p.y;third.inv=0;fighters.push(third);
 erenMove(p,'titanSmash');p.a=p.mv.act0;meleeCheck(p);meleeCheck(p);`);
 assert.equal(g.run('t.d'),28);assert.equal(g.run('third.d'),28);
 assert.equal(g.run('erenAttackShape(p).x'),510);assert.equal(g.run('erenAttackShape(p).r'),42);
 const h=env();h.run(`p.erenForm=1;p.erenTime=1080;p.f=1;erenSpecial(p,{neutralSpecial:true});`);assert.equal(h.run('p.mv.kind'),'titanGrab');
 h.run('t.f=-1;t.ct=CT_ON;p.a=12;meleeCheck(p);');assert.equal(h.run('!!t.erenGrab'),false);assert.equal(h.run('fzType'),'counter');
});

test('gas snapshots are bounded and available to remote HUDs',()=>{
 const g=env();g.run('p.erenGas=44;const restored=erenReadState(stateOf(p));');assert.equal(g.run('restored.erenGas'),44);
 assert.equal(g.run('erenReadState({eo:Infinity}).erenGas'),0);assert.equal(g.run('erenReadState({eo:999}).erenGas'),100);
});
test('training gauge refill supports titan transformation and reloads gas',()=>{
 const g=env();g.run('p.erenGas=0;trainingReset(true);');assert.equal(g.run('p.erenGauge'),100);assert.equal(g.run('p.erenGas'),100);assert.equal(g.run('erenTransform(p)'),true);
});
test('giant tackle actually travels its body width during its committed rush',()=>{
 const g=env();g.run(`p.erenForm=1;p.erenTime=1080;p.g=true;p.groundPl=0;p.f=1;t.x=750;const x=p.x;erenSpecial(p,{sideSpecial:1});for(let i=0;i<24;i++)stepFighter(p,blankInput());`);
 assert.equal(g.run('p.mv.kind'),'titanTackle');assert.ok(g.run('p.x-x>120'));
});
test('failed wire attempts cannot erase attack recovery or spend gas',()=>{
 const g=env();g.run(`stage.plats=[];erenMove(p,'erenRaid');p.a=34;const swing=p.erenSwing;stepFighter(p,{...blankInput(),r:true,sc:1,s:true});`);
 assert.equal(g.run('p.erenSwing'),g.run('swing'));assert.equal(g.run('p.erenGas'),100);
});
test('released flight brakes naturally and opposite steering can reverse the glide',()=>{
 const g=env();g.run('p.g=false;p.y=240;p.vx=24;p.erenGlide=18;for(let i=0;i<8;i++)stepFighter(p,blankInput());');assert.ok(g.run('p.vx<7'));
 g.run('p.g=false;p.y=240;p.vx=20;p.erenGlide=18;for(let i=0;i<12;i++)stepFighter(p,{...blankInput(),l:true});');assert.ok(g.run('p.vx<0'));
});
test('edge rehook searches the requested direction even when the previous slash faces offstage',()=>{
 const g=env();g.run(`t.out=true;p.x=710;p.y=210;p.g=false;p.f=1;p.erenGas=80;erenMove(p,'erenRaid');p.a=15;p.spc=40;
 const old=p.erenSwing;const forward=erenAnchor(p,false);stepFighter(p,{...blankInput(),l:true,s:true,sc:1});`);
 assert.equal(g.run('forward'),null);assert.equal(g.run('p.f'),-1);assert.ok(g.run('p.erenSwing>old'));assert.ok(g.run('p.erenWire.x<p.x'));
});
test('wire hits refund gas once per target and swing, without rewarding repeated multi-hit receipts',()=>{
 const g=env();g.run(`p.erenGas=40;erenWire(p);erenAttack(p,1);for(const frame of [2,7]){p.a=frame;p.hit={};meleeCheck(p);}`);
 assert.equal(g.run('t.d'),10);assert.equal(g.run('p.erenGas'),32);
 g.run(`playFx({res:'hit',a:p.id,t:t.id,erenToken:p.mv.erenToken,x:t.x,y:t.y,kb:3});`);assert.equal(g.run('p.erenGas'),32);
});
test('domain control lock prevents emergency transformation and stops active wire steering',()=>{
 const g=env();g.run(`erenWire(p);p.domainT=20;p.erenGauge=100;stepFighter(p,{...blankInput(),gd:true,sc:1});`);
 assert.equal(g.run('p.erenForm'),0);assert.equal(g.run('p.erenWire'),null);assert.equal(g.run('p.erenGlide'),0);
});
test('respawn issues a new attack token and an old victim can be grabbed again',()=>{
 const g=env();g.run(`p.erenForm=1;p.erenTime=1080;erenMove(p,'titanGrab');const first=p.mv.erenToken;
 erenGrabStart({id:p.id,mv:p.mv},t);t.erenGrab=null;erenReset(p);p.erenForm=1;p.erenTime=1080;erenMove(p,'titanGrab');const second=p.mv.erenToken;erenGrabStart({id:p.id,mv:p.mv},t);`);
 assert.notEqual(g.run('first'),g.run('second'));assert.ok(g.run('!!t.erenGrab'));
 g.run('t.erenGrab=null;erenGrabStart({id:p.id,mv:{...p.mv,erenToken:first}},t);');assert.equal(g.run('t.erenGrab'),null);
});
test('grab respects allied clones, enemy invulnerability and attacker interruption',()=>{
 const g=env();g.run(`p.erenForm=1;p.erenTime=1080;erenMove(p,'titanGrab');
 const clone=makeFighter({id:'ally-clone',cid:'naruto',owner:myId,label:'Clone',team:1,cpu:1},2);clone.shadowClone=true;clone.shadowOwner='naruto';clone.x=455;clone.y=390;clone.inv=0;fighters.push(clone);
 battleTeamMode=true;p.team=clone.team=1;erenGrabStart({id:p.id,mv:p.mv},clone);`);
 assert.equal(g.run('clone.out'),false);
 g.run('battleTeamMode=false;erenGrabStart({id:p.id,mv:p.mv},clone);');assert.equal(g.run('clone.out'),true);
 g.run('erenGrabStart({id:p.id,mv:p.mv},t);p.timeStopT=20;erenGrabTick(t);');assert.equal(g.run('t.erenGrab'),null);assert.equal(g.run('t.d'),0);
});
test('delayed hit receipts retain the original attack gain after a different action starts',()=>{
 const g=env();g.run(`erenMove(p,'erenSpin');const token=p.mv.erenToken;erenMove(p,'erenBlades');
 playFx({res:'hit',a:p.id,t:t.id,erenToken:token,x:t.x,y:t.y,kb:3});
 playFx({res:'hit',a:p.id,t:t.id,erenToken:token,x:t.x,y:t.y,kb:3});`);
 assert.equal(g.run('p.erenGauge'),10);
 g.run(`playFx({res:'hit',a:p.id,t:t.id,erenToken:'unknown',x:t.x,y:t.y,kb:3});`);assert.equal(g.run('p.erenGauge'),10);
});
test('network melee nape contact does not depend on the attacker animation snapshot',()=>{
 const g=env();g.run(`p.erenForm=1;p.erenTime=1080;p.f=1;p.inv=0;t.mv=null;
 const A={id:t.id,x:350,f:1,mv:{kind:'normal',type:'normal',dm:10,k0:1,ks:0,up:.2},contact:{x:381,y:219,r:1}};
 handleGameplayEvent({k:'mh',by:t.owner,to:p.id,a:t.id,ax:A.x,f:A.f,mv:A.mv,contact:A.contact});`);assert.equal(g.run('p.d'),12);
 g.run(`p.f=1;resolveMelee({...A,contact:{x:419,y:219,r:1}},p);`);assert.equal(g.run('p.d'),22);
});
test('reversion steam and 60 tick fatigue end cleanly and input becomes usable again',()=>{
 const g=env();g.run(`p.erenForm=1;p.erenTime=1;erenTick(p);`);assert.equal(g.run('p.erenExit'),24);assert.equal(g.run('p.erenFatigue'),60);
 g.run('for(let i=0;i<60;i++)erenTick(p);');assert.equal(g.run('p.erenExit'),0);assert.equal(g.run('p.erenFatigue'),0);
 g.run('fireAttack(p,1);');assert.equal(g.run('p.mv.kind'),'erenBlades');
});
test('held fighters align their torso with the giant hand, and a remote spectator keeps the same grip',()=>{
 const g=env();g.run(`p.erenForm=1;p.erenTime=1080;erenMove(p,'titanGrab');erenGrabStart({id:p.id,mv:p.mv},t);erenGrabTick(t);`);
 assert.equal(g.run('p.y-(t.y-30)'),85);assert.equal(g.run('t.x-p.x'),64);
 g.run(`online=true;t.owner='remote';t.remote=true;t.off=0;t.netSnap=true;
 t.buf=[{...stateOf(t),ts:Date.now()-100,sq:1,rd:curRound}];t.x=100;t.y=100;updateRemote();`);
 assert.equal(g.run('t.x-p.x'),64);assert.equal(g.run('p.y-(t.y-30)'),85);
});
test('all stages keep giant feet planted on existing one-way platforms after transforming',()=>{
 const g=env();g.run('t.x=-500;');
 for(const map of Array.from(g.run('Object.keys(MAPS)'))){
  g.run(`stage=MAPS['${map}'];erenReset(p);p.x=stage.plats[0].x+stage.plats[0].w/2;p.y=stage.plats[0].y;p.g=true;p.groundPl=0;p.inv=0;p.erenGauge=100;var plantedY=p.y;erenTransform(p);freezeT=0;for(let i=0;i<30;i++)stepFighter(p,blankInput());`);
  assert.equal(g.run('p.y'),g.run('plantedY'),map);assert.equal(g.run('p.g'),true,map);
  g.run('p.rec=false;p.erenWireCd=0;erenRevert(p);p.erenFatigue=0;erenWire(p,true);var w=p.erenWire;');
  assert.ok(g.run('!w||w.x>=stage.plats[w.pl].x&&w.x<=stage.plats[w.pl].x+stage.plats[w.pl].w&&w.y===stage.plats[w.pl].y'),map);
 }
});
test('horizontal spin opens softly then finishes with a heavy strike, once per phase and one gauge gain',()=>{
 const g=env();g.run(`erenSpecial(p,{neutralSpecial:true});p.a=5;meleeCheck(p);const opening=t.d,openingSpeed=t.vx;
 p.hit={};p.a=13;meleeCheck(p);const finalSpeed=t.vx;meleeCheck(p);`);
 assert.equal(g.run('opening'),4);assert.equal(g.run('t.d'),18);assert.equal(g.run('p.mv.type'),'heavy');
 assert.ok(g.run('finalSpeed>openingSpeed*4'));assert.equal(g.run('p.erenGauge'),6);
});
test('spin finish can be countered while a miss cannot skip its attack recovery',()=>{
 const g=env();g.run(`erenSpecial(p,{neutralSpecial:true});p.a=13;t.ct=CT_ON;t.f=-1;meleeCheck(p);`);assert.equal(g.run('fzType'),'counter');
 const h=env();h.run(`t.x=750;let I={...blankInput(),s:true,neutralSpecial:true,sc:1};stepFighter(p,I);
 I={...I,a:true,ac:1};stepFighter(p,I);I={...I,a:false,rc:1};
 for(let i=0;i<12;i++){stepFighter(p,I);meleeCheck(p);}`);
 assert.equal(h.run('p.mv.kind'),'erenCrossSpin');assert.equal(h.run('t.d'),0);
});
test('a buffered attack tap after the opening hit continues into real double-blade attacks',()=>{
 const g=env();g.run(`let I={...blankInput(),s:true,sc:1,neutralSpecial:true};stepFighter(p,I);meleeCheck(p);
 I={...I,a:true,ac:1};stepFighter(p,I);meleeCheck(p);I={...I,a:false,rc:1};
 let chained=false;for(let i=0;i<14;i++){stepFighter(p,I);stepFighter(t,blankInput());meleeCheck(p);if(p.mv?.kind==='erenBlades')chained=true;}`);
 assert.equal(g.run('chained'),true);assert.ok(g.run('t.d>=9'));assert.ok(g.run('p.spc>0'));
 const h=env();h.run(`erenSpecial(p,{neutralSpecial:true});p.a=5;meleeCheck(p);p.a=25;stepFighter(p,{...blankInput(),a:true,ac:1});`);
 assert.ok(h.run('p.ch>0'));
});
test('holding the follow-up attack charges a finisher instead of firing an automatic normal attack',()=>{
 const g=env();g.run(`let I={...blankInput(),s:true,sc:1,neutralSpecial:true};stepFighter(p,I);meleeCheck(p);
 I={...I,a:true,ac:1};for(let i=0;i<12;i++){stepFighter(p,I);meleeCheck(p);}const charging=p.ch;
 for(let i=0;i<65&&p.ch<CH_FULL;i++)stepFighter(p,I);I={...I,a:false,rc:1};stepFighter(p,I);`);
 assert.ok(g.run('charging>0'));assert.equal(g.run('p.mv.kind'),'erenSpin');assert.equal(g.run('p.mv.dm'),22);
});
test('simultaneous special and attack taps are buffered until the opening hit confirms',()=>{
 const g=env();g.run(`let I={...blankInput(),s:true,sc:1,neutralSpecial:true,a:true,ac:1};stepFighter(p,I);meleeCheck(p);
 I={...I,a:false,rc:1};for(let i=0;i<7;i++){stepFighter(p,I);meleeCheck(p);}`);
 assert.equal(g.run('p.mv.kind'),'erenBlades');
});
test('up special is a low vertical slash, including keyboard jump plus special and extreme wire momentum',()=>{
 const g=env();g.run(`p.g=true;p.groundPl=0;const start=p.y;const I={...blankInput(),u:true,jc:1,s:true,sc:1};stepFighter(p,I);let top=p.y;
 for(let i=0;i<22;i++){stepFighter(p,I);top=Math.min(top,p.y);}`);
 assert.ok(g.run('start-top>60&&start-top<130'));
 const h=env();h.run('p.y=240;p.g=false;p.vy=-22;p.vx=24;erenWire(p);p.spc=0;p.rec=false;erenSpecial(p,{u:true});');
 assert.equal(h.run('p.mv.kind'),'erenRiseSpin');assert.equal(h.run('p.erenWire'),null);assert.equal(h.run('p.vy'),-9);assert.ok(h.run('p.vx<=5'));
});
test('side special stays within a lower speed limit and uses a flatter anchor on level ground',()=>{
 const g=env();g.run(`p.g=true;p.groundPl=0;const start=p.y;let maxSpeed=0,top=p.y;
 const I={...blankInput(),r:true,s:true,sc:1};for(let i=0;i<30;i++){stepFighter(p,I);maxSpeed=Math.max(maxSpeed,Math.abs(p.vx));top=Math.min(top,p.y);}`);
 assert.ok(g.run('maxSpeed<=16.001&&maxSpeed>14'));assert.ok(g.run('start-top<35'));
});
test('human charged spin gives a decisive launch while titan punch damage remains unchanged',()=>{
 const g=env();g.run('fireAttack(p,CH_FULL);p.a=5;meleeCheck(p);');assert.equal(g.run('t.d'),22);assert.ok(g.run('t.vx>20'));
 g.run('p.erenForm=1;erenMove(p,"titanPunch");t.d=0;t.x=480;p.a=6;meleeCheck(p);');assert.equal(g.run('t.d'),14);
});
test('one side-special press settles near its anchor instead of carrying a neutral player off the main floor',()=>{
 const g=env();g.run(`p.g=true;p.groundPl=0;let I={...blankInput(),r:true,s:true,sc:1};stepFighter(p,I);
 I={...I,r:false,s:false};for(let i=0;i<80;i++)stepFighter(p,I);`);
 assert.equal(g.run('p.stats.deaths'),0);assert.equal(g.run('p.g'),true);assert.ok(g.run('p.x>450&&p.x<670'));
});
test('explicit mobile side-special remains movement while the stick steers up or down',()=>{
 for(const direction of ['u','d']){
  const g=env();g.run(`erenSpecial(p,{sideSpecial:1,${direction}:true});`);
  assert.equal(g.run('p.mv.kind'),'erenRaid');assert.ok(g.run('!!p.erenWire'));
 }
});
test('horizontal spin cuts both sides and follow-up faces the confirmed opponent after crossing through',()=>{
 const g=env();g.run(`t.x=p.x-38;p.f=1;erenSpecial(p,{neutralSpecial:true});p.a=5;meleeCheck(p);
 const opening=t.d,away=t.vx;stepFighter(p,{...blankInput(),a:true,ac:1});stepFighter(p,{...blankInput(),a:false,rc:1});stepFighter(p,{...blankInput(),a:false,rc:1});`);
 assert.equal(g.run('opening'),4);assert.ok(g.run('away<0'));assert.equal(g.run('p.mv.kind'),'erenBlades');assert.equal(g.run('p.f'),-1);
});
test('uncancelled spin finisher still reaches the opponent after its actual opening knockback',()=>{
 const g=env();g.run(`let I={...blankInput(),neutralSpecial:true,s:true,sc:1};
 for(let i=0;i<22;i++){if(freezeT>0){freezeT--;continue;}stepFighter(p,I);stepFighter(t,blankInput());meleeCheck(p);}`);
 assert.equal(g.run('t.d'),18);
});
test('side approach, neutral spin and an attack tap connect using the actual moving combat rules',()=>{
 const g=env();g.run(`let I={...blankInput(),r:true,s:true,sc:1};
 const tick=()=>{stepFighter(p,I);stepFighter(t,blankInput());meleeCheck(p);};for(let i=0;i<5;i++)tick();
 I={...I,r:false,neutralSpecial:true,sc:2};tick();I={...I,a:true,ac:1};tick();I={...I,a:false,rc:1};
 let chained=false;for(let i=0;i<10;i++){tick();if(p.mv?.kind==='erenBlades')chained=true;}`);
 assert.equal(g.run('chained'),true);assert.ok(g.run('t.d>=23'));
});
test('remote spin animation restores the heavy phase after animation-frame prediction',()=>{
 const g=env();g.run(`erenSpecial(p,{neutralSpecial:true});p.a=12;const snap={...stateOf(p),ts:Date.now()-100,sq:1};
 online=true;p.owner='peer';p.remote=true;p.off=0;p.netSnap=true;p.buf=[snap];updateRemote();`);
 assert.ok(g.run('p.a>=13'));assert.equal(g.run('p.mv.type'),'heavy');assert.equal(g.run('p.mv.dm'),14);assert.equal(g.run('p.mv.R'),64);
});
test('being hit clears a buffered spin follow-up instead of attacking automatically after hitstun',()=>{
 const g=env();g.run(`erenSpecial(p,{neutralSpecial:true});p.a=5;meleeCheck(p);p.erenCombo={token:p.mv.erenToken,left:10,released:true};
 applyHit(p,{dm:5,k0:6,ks:.05,up:.5,f:-1},false,t.id);stepFighter(p,{...blankInput(),ac:1,rc:1});p.kb=0;stepFighter(p,{...blankInput(),ac:1,rc:1});`);
 assert.equal(g.run('p.erenCombo'),null);assert.equal(g.run('p.mv'),null);assert.equal(g.run('p.ch'),0);
});
test('CPU evaluates the human finisher damage at the charge time it can actually perform',()=>{
 const g=env();for(const hold of [12,31,50]){g.run(`const profile${hold}=aiMeleeProfile(p,${hold});fireAttack(p,${hold});`);assert.equal(g.run(`profile${hold}.damage`),g.run('p.mv.dm'));}
});
test('neutral spin casts a support wire without replacing its slashes or adding an unwanted launch',()=>{
 const g=env();g.run(`p.g=true;p.groundPl=0;p.vx=p.vy=0;erenSpecial(p,{neutralSpecial:true});const x=p.x,y=p.y,gas=p.erenGas;
 for(let i=0;i<10;i++)stepFighter(p,blankInput());`);
 assert.equal(g.run('p.mv.kind'),'erenCrossSpin');assert.ok(g.run('!!p.erenSlashWire'));assert.equal(g.run('p.erenWire'),null);
 assert.equal(g.run('p.x'),g.run('x'));assert.equal(g.run('p.y'),g.run('y'));assert.equal(g.run('p.erenGas'),g.run('gas'));
});
test('a horizontal wire remains attached after arrival and still expires at the longer time limit',()=>{
 const g=env();g.run(`erenWire(p);const w=p.erenWire;p.x=w.x-10;p.y=w.y;p.g=true;p.vx=14;erenTick(p);`);
 assert.equal(g.run('p.erenWire'),g.run('w'));assert.equal(g.run('p.erenWire.docked'),true);assert.ok(g.run('p.vx<10'));assert.ok(g.run('w.t>=40'));
 g.run('for(let i=0;i<EREN.wireTime;i++)erenTick(p);');assert.equal(g.run('p.erenWire'),null);
});
test('jumping after arrival releases the lingering wire and keeps a normal ground jump',()=>{
 const g=env();g.run(`erenWire(p);p.x=p.erenWire.x-10;p.y=390;p.g=true;p.groundPl=0;erenTick(p);
 stepFighter(p,{...blankInput(),jc:1});`);
 assert.equal(g.run('p.erenWire'),null);assert.ok(g.run('p.vy<-10'));
});
test('support wires restore through bounded snapshots and clear when hit',()=>{
 const g=env();g.run('erenSpecial(p,{neutralSpecial:true});const s=stateOf(p),restored=erenReadState(s);');
 assert.ok(g.run('!!restored.erenSlashWire'));assert.equal(g.run('restored.erenSlashWire.t'),42);
 assert.equal(g.run('erenReadState({ewc:{pl:999,x:1,y:1,t:42}}).erenSlashWire'),null);
 assert.equal(g.run('erenReadState({...s,ewc:{...s.ewc,t:0}}).erenSlashWire'),null);
 g.run('applyHit(p,{dm:5,k0:2,ks:0,up:.2,f:-1},false,t.id);');assert.equal(g.run('p.erenSlashWire'),null);
});
test('arrival ends the rush acceleration while leaving the wire visibly connected',()=>{
 const g=env();g.run(`p.g=true;p.groundPl=0;erenSpecial(p,{sideSpecial:1});p.x=p.erenWire.x-10;p.y=390;p.g=true;p.vx=14;
 const I={...blankInput(),r:true};for(let i=0;i<8;i++)stepFighter(p,I);`);
 assert.equal(g.run('p.erenWire.docked'),true);assert.ok(g.run('p.vx<6'));assert.ok(g.run('p.x<660'));
});
test('up special attaches a real wire and uses only a bounded opening boost',()=>{
 const g=env();g.run(`p.g=true;p.groundPl=0;erenSpecial(p,{u:true});const anchor=p.erenSlashWire;let top=p.y;for(let i=0;i<40;i++){stepFighter(p,blankInput());top=Math.min(top,p.y);}`);
 assert.ok(g.run('!!anchor&&anchor.y===stage.plats[anchor.pl].y'));assert.ok(g.run('390-top>70&&390-top<130'));
});
test('titan can jump high enough for the standard upper platforms without changing human jump',()=>{
 const g=env();g.run(`const human=fighterConfig(p).jump;p.erenForm=1;p.erenTime=1080;p.g=true;p.groundPl=0;let I={...blankInput(),jc:1};stepFighter(p,I);let top=p.y;for(let i=0;i<50;i++){stepFighter(p,I);top=Math.min(top,p.y);}`);
 assert.equal(g.run('human'),1.04);assert.ok(g.run('390-top>120&&390-top<180'));
 const h=env();h.run(`p.erenForm=1;p.erenTime=1080;p.x=520;p.g=true;p.groundPl=0;const I={...blankInput(),jc:1};for(let i=0;i<50;i++)stepFighter(p,I);`);
 assert.equal(h.run('p.y'),280);assert.equal(h.run('p.g'),true);
});
test('smart special closes a large gap, brakes and connects against a moving opponent',()=>{
 const g=env();g.run(`p.g=true;p.groundPl=0;t.x=650;t.vx=-1;let I={...blankInput(),neutralSpecial:true,sc:1,s:true};let peak=0;
 for(let i=0;i<28;i++){stepFighter(p,I);stepFighter(t,blankInput());meleeCheck(p);peak=Math.max(peak,Math.abs(p.vx));}`);
 assert.ok(g.run('t.d>=14'));assert.equal(g.run('p.stats.deaths'),0);assert.equal(g.run('p.erenDash'),null);assert.ok(g.run('peak>10'));
});
test('air pursuit connects with an elevated opponent and still has finite travel',()=>{
 const g=env();g.run(`p.g=false;p.y=350;t.x=560;t.y=240;t.g=false;erenSpecial(p,{u:true});const started=!!p.erenDash;
 const I=blankInput();for(let i=0;i<30;i++){stepFighter(p,I);stepFighter(t,I);meleeCheck(p);}`);
 assert.equal(g.run('started'),true);assert.ok(g.run('t.d>0'));assert.equal(g.run('p.erenDash'),null);
});
test('confirmed approach can transition immediately into a close spin',()=>{
 const g=env();g.run(`p.g=true;p.groundPl=0;t.x=620;let I={...blankInput(),neutralSpecial:true,s:true,sc:1};
 for(let i=0;i<25;i++){stepFighter(p,I);stepFighter(t,blankInput());meleeCheck(p);if(t.d)break;}
 I={...I,sc:2};for(let i=0;i<25;i++){stepFighter(p,I);stepFighter(t,blankInput());meleeCheck(p);if(p.mv?.kind==='erenCrossSpin')break;}`);assert.equal(g.run('p.mv.kind'),'erenCrossSpin');
});
test('pursuit ignores allies and stops after interruption or a disappearing target',()=>{
 const g=env();g.run(`t.x=620;battleTeamMode=true;p.team=t.team=1;`);assert.equal(g.run('erenDashTarget(p)'),null);
 g.run('battleTeamMode=false;erenSpecial(p,{neutralSpecial:true});t.out=true;stepFighter(p,blankInput());');assert.equal(g.run('p.erenDash'),null);
 g.run('t.out=false;p.spc=0;p.erenWireCd=0;erenSpecial(p,{neutralSpecial:true});applyHit(p,{dm:5,k0:2,ks:0,up:.3,f:-1},false,t.id);');assert.equal(g.run('p.erenDash'),null);
});
test('pursuit snapshots bound the timer and reject unknown targets',()=>{
 const g=env();g.run('t.x=620;erenSpecial(p,{neutralSpecial:true});const restored=erenReadState(stateOf(p));');assert.equal(g.run('restored.erenDash.id'),'enemy');
 assert.equal(g.run('erenReadState({ed:{id:"missing",t:22}}).erenDash'),null);assert.equal(g.run('erenReadState({ed:{id:t.id,t:1e9}}).erenDash.t'),30);
});
