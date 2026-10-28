import test from 'node:test';
import assert from 'node:assert/strict';
import {game} from './helpers/game.mjs';
const setup=`frameCount=0;startBattleCommon([{id:myId,cid:'eren',owner:myId,label:'EREN',cpu:0},{id:'enemy',cid:'karate',owner:myId,label:'Enemy',cpu:1}],'std',false,3);bt.phase='play';const p=byId(myId),t=byId('enemy');p.x=400;p.y=390;p.inv=0;t.x=455;t.y=390;t.inv=0;`;
function env(){const g=game();g.run(setup);return g;}
test('Eren is selectable in special roster and all thirteen attacks are registered',()=>{
 const g=env();assert.ok(g.run('cpuCharacterPool("special").includes("eren")'));
 assert.equal(g.run('Object.keys(EREN_MOVES).length'),13);
 for(const titan of [false,true])for(const direction of ['neutral','side','up','down']){
  g.run(`erenReset(p);p.erenForm=${titan?1:0};p.erenTime=1080;p.erenGauge=100;p.spc=0;p.prev=blankInput();
   erenSpecial(p,{neutralSpecial:${direction==='neutral'},u:${direction==='up'},d:${direction==='down'},sideSpecial:${direction==='side'?1:0}});`);
  assert.ok(g.run('p.erenForm||p.erenWire||p.erenHard||p.mv||p.spc>0'),`${titan}/${direction}`);
 }
});
test('dual blades hit twice, but gain only eight gauge per swing and target',()=>{
 const g=env();g.run(`fireAttack(p,1);p.a=3;meleeCheck(p);const first=t.d;
 p.hit={};p.a=8;meleeCheck(p);`);
 assert.equal(g.run('t.d'),14);assert.equal(g.run('first'),7);assert.equal(g.run('p.erenGauge'),8);
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
 const g=env();g.run('p.erenForm=1;erenMove(p,"titanPunch");p.a=11;t.x=480;meleeCheck(p);');assert.equal(g.run('t.d'),9);
 g.run('t.x=430;t.y=270;t.f=-1;fireAttack(t,1);t.a=t.mv.act0;meleeCheck(t);');assert.ok(g.run('p.d>0'));
});
test('counter hardening reduces damage by 30% without disabling attacks, expires and cools down',()=>{
 const g=env();g.run('p.erenForm=1;p.erenTime=1080;p.ct=1;erenTick(p);fireAttack(p,CH_FULL);');assert.equal(g.run('p.mv.kind'),'titanSmash');assert.equal(g.run('p.erenHard'),35);
 g.run('applyHit(p,{dm:20,k0:1,ks:0,up:.2,f:1},false,t.id);');assert.equal(g.run('p.d'),14);
 g.run('p.ct=0;for(let i=0;i<35;i++)erenTick(p);');assert.equal(g.run('p.erenHard'),0);assert.equal(g.run('p.erenHardCd'),144);
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
 assert.ok(g.run('!!p.erenWire'));assert.equal(g.run('p.rec'),true);
 g.run('p.erenWire=null;erenSpecial(p,{u:true});');assert.equal(g.run('p.erenWire'),null);
});
test('next stock retains at most 50 earned gauge; final stock resets to zero',()=>{
 const g=env();g.run('p.erenGauge=90;p.s=3;koFighter(p);');assert.equal(g.run('p.erenGauge'),50);assert.equal(g.run('p.s'),2);
 g.run('p.erenGauge=90;p.s=1;koFighter(p);');assert.equal(g.run('p.erenGauge'),0);
});
test('polished moves give human and titan different finishers, keeping timed vulnerability',()=>{
 const g=env();g.run('fireAttack(p,CH_FULL);');assert.equal(g.run('p.mv.kind'),'erenSpin');assert.equal(g.run('p.mv.dm'),20);
 g.run('p.erenGauge=100;erenTransform(p);');assert.equal(g.run('p.inv'),90);
 g.run('freezeT=0;fireAttack(p,CH_FULL);');assert.equal(g.run('p.mv.kind'),'titanSmash');assert.equal(g.run('p.mv.dm'),34);
 assert.ok(g.run('p.mv.end>p.mv.act1+20'));
 g.run('clearActs(p);for(let i=0;i<90;i++)stepFighter(p,blankInput());');assert.equal(g.run('isInvuln(p)'),false);
});
test('wire combat keeps tether acceleration during an actual moving slash',()=>{
 const g=env();g.run('p.f=1;t.x=460;t.y=350;erenWire(p);erenAttack(p,1);const x=p.x,y=p.y;for(let i=0;i<10;i++){stepFighter(p,blankInput());meleeCheck(p);}');
 assert.equal(g.run('p.mv.kind'),'erenWireCut');assert.ok(g.run('Math.hypot(p.x-x,p.y-y)>100'));
 assert.ok(g.run('t.d>0'));assert.ok(g.run('!!p.erenWire'));
});
test('tether slashes hit three times without duplicate gauge gain; titan punches combo twice',()=>{
 const g=env();g.run('erenWire(p);erenAttack(p,1);for(const frame of [2,6,10]){p.a=frame;p.hit={};meleeCheck(p);}');
 assert.equal(g.run('t.d'),18);assert.equal(g.run('p.erenGauge'),8);
 g.run('p.erenForm=1;erenMove(p,"titanPunch");t.d=0;t.x=480;for(const frame of [6,12]){p.a=frame;p.hit={};meleeCheck(p);}');
 assert.equal(g.run('t.d'),22);
});
test('airborne titan down special is a limited stomp; grounded down quakes',()=>{
 const g=env();g.run('p.erenForm=1;p.erenTime=1080;p.g=false;p.y=300;erenSpecial(p,{d:true});const token=p.mv.erenToken;');
 assert.equal(g.run('p.mv.kind'),'titanStomp');assert.equal(g.run('p.vy'),14);
 g.run('p.spc=0;erenSpecial(p,{d:true});');assert.equal(g.run('p.mv.erenToken'),g.run('token'));
 g.run('p.g=true;p.y=390;erenTick(p);p.spc=0;erenSpecial(p,{d:true});');assert.equal(g.run('p.mv.kind'),'titanQuake');
});
test('neutral special cuts on the ground without requiring any terrain anchor',()=>{
 const g=env();g.run('stage={w:800,h:450,plats:[]};erenSpecial(p,{neutralSpecial:true});');
 assert.equal(g.run('p.mv.kind'),'erenFlurry');assert.equal(g.run('p.erenWire'),null);
 g.run('for(const frame of [2,6,10,14]){p.a=frame;p.hit={};meleeCheck(p);}');assert.equal(g.run('t.d'),20);
 assert.equal(g.run('p.erenGauge'),8);
});
test('side special launches toward a forward anchor and cuts for 30 frames with a punishable recovery',()=>{
 const g=env();g.run('p.f=1;erenSpecial(p,{sideSpecial:1});');
 assert.ok(g.run('p.erenWire.y<p.y'));assert.equal(g.run('p.mv.kind'),'erenRaid');
 assert.equal(g.run('p.mv.act1-p.mv.act0+1'),30);assert.ok(g.run('p.mv.multi>0&&p.mv.end>p.mv.act1+10'));
 g.run('t.ct=CT_ON;t.f=-1;p.a=3;t.x=p.x+35;meleeCheck(p);');assert.equal(g.run('fzType'),'counter');
});
test('committed titan attacks tank ordinary hits but still take damage and heavy knockback',()=>{
 const g=env();g.run(`p.erenForm=1;p.erenTime=1080;p.inv=0;erenMove(p,"titanPunch");p.a=6;
 const A={id:t.id,x:t.x,f:-1,mv:{type:"normal",kind:"normal",dm:10,k0:8,ks:.05,up:.6}};resolveMelee(A,p);`);
 assert.equal(g.run('p.d'),10);assert.equal(g.run('p.kb'),0);assert.equal(g.run('p.a'),6);
 g.run('resolveMelee({...A,mv:{...A.mv,type:"heavy",kind:"charge",dm:20}},p);');assert.ok(g.run('p.kb>0'));assert.equal(g.run('p.d'),30);
});
test('flight can rehook during a slash, steer, detach with momentum and consume finite gas',()=>{
 const g=env();g.run(`p.f=1;p.g=true;p.groundPl=0;let I={...blankInput(),r:true,s:true,sc:1};stepFighter(p,I);
 const first=p.erenSwing,gas=p.erenGas;for(let i=0;i<9;i++)stepFighter(p,I);
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
test('giant sweep and quake damage multiple targets with distinct forward and all-around coverage',()=>{
 for(const [kind,positions]of [['titanSweep',[70,150]],['titanQuake',[-150,150]]]){
  const g=env();g.run(`p.erenForm=1;p.erenTime=1080;p.f=1;t.x=p.x+${positions[0]};
 const third=makeFighter({id:'third',cid:'karate',owner:myId,label:'Third'},2);third.x=p.x+${positions[1]};third.y=p.y;third.inv=0;fighters.push(third);
 erenMove(p,'${kind}');p.a=p.mv.act0;meleeCheck(p);meleeCheck(p);`);
  assert.equal(g.run('t.d'),kind==='titanSweep'?26:22);assert.equal(g.run('third.d'),g.run('t.d'));
  assert.equal(g.run('isArmored(p)'),true);
 }
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
 const g=env();g.run(`p.x=710;p.y=210;p.g=false;p.f=1;p.erenGas=80;erenMove(p,'erenRaid');p.a=15;p.spc=40;
 const old=p.erenSwing;const forward=erenAnchor(p,false);stepFighter(p,{...blankInput(),l:true,s:true,sc:1});`);
 assert.equal(g.run('forward'),null);assert.equal(g.run('p.f'),-1);assert.ok(g.run('p.erenSwing>old'));assert.ok(g.run('p.erenWire.x<p.x'));
});
test('wire hits refund gas once per target and swing, without rewarding repeated multi-hit receipts',()=>{
 const g=env();g.run(`p.erenGas=40;erenWire(p);erenAttack(p,1);for(const frame of [2,6,10]){p.a=frame;p.hit={};meleeCheck(p);}`);
 assert.equal(g.run('t.d'),18);assert.equal(g.run('p.erenGas'),32);
 g.run(`playFx({res:'hit',a:p.id,t:t.id,erenToken:p.mv.erenToken,x:t.x,y:t.y,kb:3});`);assert.equal(g.run('p.erenGas'),32);
});
test('domain control lock prevents emergency transformation and stops active wire steering',()=>{
 const g=env();g.run(`erenWire(p);p.domainT=20;p.erenGauge=100;stepFighter(p,{...blankInput(),gd:true,sc:1});`);
 assert.equal(g.run('p.erenForm'),0);assert.equal(g.run('p.erenWire'),null);assert.equal(g.run('p.erenGlide'),0);
});
