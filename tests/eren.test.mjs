import test from 'node:test';
import assert from 'node:assert/strict';
import {game} from './helpers/game.mjs';
const setup=`frameCount=0;startBattleCommon([{id:myId,cid:'eren',owner:myId,label:'EREN',cpu:0},{id:'enemy',cid:'karate',owner:myId,label:'Enemy',cpu:1}],'std',false,3);bt.phase='play';const p=byId(myId),t=byId('enemy');p.x=400;p.y=390;p.inv=0;t.x=455;t.y=390;t.inv=0;`;
function env(){const g=game();g.run(setup);return g;}
test('Eren is selectable in special roster and all ten attacks are registered',()=>{
 const g=env();assert.ok(g.run('cpuCharacterPool("special").includes("eren")'));
 assert.equal(g.run('Object.keys(EREN_MOVES).length'),10);
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
 g.run('for(let i=0;i<40;i++)erenTick(p);');assert.equal(g.run('p.erenWire'),null);
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
test('hardening reduces damage by 30%, restricts attacks, expires after 120 ticks and cools for 360',()=>{
 const g=env();g.run('p.erenForm=1;p.erenTime=1080;erenSpecial(p,{d:true});fireAttack(p,CH_FULL);');assert.equal(g.run('p.mv.kind'),'titanPunch');assert.equal(g.run('p.mv.end'),42);
 g.run('applyHit(p,{dm:20,k0:1,ks:0,up:.2,f:1},false,t.id);');assert.equal(g.run('p.d'),14);
 g.run('for(let i=0;i<120;i++)erenTick(p);');assert.equal(g.run('p.erenHard'),0);assert.equal(g.run('p.erenHardCd'),240);
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
 const g=env();g.run('p.erenForm=1;p.erenTime=900;p.erenHard=70;const s=stateOf(p);const restored=erenReadState(s);');assert.equal(g.run('restored.erenTime'),900);assert.equal(g.run('restored.erenHard'),70);
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
 owner.run('byId(myId).erenGauge=100;erenTransform(byId(myId));sendLocal();');
 for(const e of events)guest.ctx.onEvent(e);
 for(const [id,v]of Object.entries(writes[0]))guest.ctx.onP({key:id,val:()=>v});
 guest.run('updateRemote();');assert.equal(guest.run(`byId('${aId}').erenForm`),1);
 assert.equal(guest.run('fzType'),'titan');
 owner.run('freezeT=0;erenMove(byId(myId),"titanGrab");');
 const attack=owner.run('({id:myId,mv:byId(myId).mv})');guest.ctx.attack=attack;
 guest.run(`freezeT=0;resolveMelee(attack,byId(myId));for(let i=0;i<24;i++)erenGrabTick(byId(myId));`);
 assert.equal(guest.run('byId(myId).d'),20);assert.equal(guest.run('byId(myId).erenGrab'),null);
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
 g.run('p.erenGauge=100;erenTransform(p);');assert.equal(g.run('p.inv'),24);
 g.run('freezeT=0;fireAttack(p,CH_FULL);');assert.equal(g.run('p.mv.kind'),'titanSmash');assert.equal(g.run('p.mv.dm'),34);
 assert.ok(g.run('p.mv.end>p.mv.act1+20'));
 g.run('clearActs(p);for(let i=0;i<24;i++)stepFighter(p,blankInput());');assert.equal(g.run('isInvuln(p)'),false);
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
test('airborne titan down special is a limited stomp; grounded down still hardens',()=>{
 const g=env();g.run('p.erenForm=1;p.erenTime=1080;p.g=false;p.y=300;erenSpecial(p,{d:true});const token=p.mv.erenToken;');
 assert.equal(g.run('p.mv.kind'),'titanStomp');assert.equal(g.run('p.vy'),14);
 g.run('p.spc=0;erenSpecial(p,{d:true});');assert.equal(g.run('p.mv.erenToken'),g.run('token'));
 g.run('p.g=true;p.y=390;erenTick(p);p.spc=0;erenSpecial(p,{d:true});');assert.equal(g.run('p.erenHard'),120);
});
