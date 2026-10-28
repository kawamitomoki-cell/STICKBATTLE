import test from 'node:test';
import assert from 'node:assert/strict';
import {game} from './helpers/game.mjs';
const setup=`frameCount=0;startBattleCommon([{id:myId,cid:'karate',owner:myId,cpu:1,label:'CPU'},{id:'enemy',cid:'karate',owner:myId,label:'Enemy'}],'std',false,3);bt.phase='play';aiLv=3;const p=byId(myId),t=byId('enemy');p.x=400;p.y=t.y=stage.plats[0].y;p.f=1;t.x=440;t.inv=0;p.ai.t=1;`;
test('new targets require a reaction window; observations remain bounded',()=>{
 const g=game();g.run(setup+'aiStep(p);');assert.equal(g.run('p.ai.inp.ac'),0);
 g.run('for(let i=0;i<100;i++)aiStep(p);');assert.ok(g.run('p.ai.inp.ac>0||p.ai.inp.sc>0'));
 assert.equal(g.run('p.ai.observations.length'),9);
});
test('recovery windows improve attack utility and invulnerability rejects attacks',()=>{
 const g=game();g.run(setup+`const D=AI_DIFFICULTY[3],m={range:80,startup:5,damage:10};t.vx=t.vy=0;const plain=aiAttackScore(p,t,m,D);t.mv={act1:8,end:35};t.a=10;`);
 assert.ok(g.run('aiAttackScore(p,t,m,D)>plain'));
 g.run('t.ivf=true;');assert.equal(g.run('aiAttackScore(p,t,m,D)'),-Infinity);
});
test('prediction rejects a target leaving range and differs across difficulties',()=>{
 const g=game();g.run(setup+'t.vx=20;t.vy=0;const m={range:90,startup:15,damage:10};');
 assert.equal(g.run('aiAttackScore(p,t,m,AI_DIFFICULTY[3])'),-Infinity);
 assert.ok(g.run('AI_DIFFICULTY[0].reaction>AI_DIFFICULTY[3].reaction'));
});
test('heavy threats counter; normal threats evade using shared input',()=>{
 const g=game();g.run(setup+`Math=Object.create(Math);Math.random=()=>0;const A=p.ai,I=A.inp,D=AI_DIFFICULTY[3];t.mv={type:'heavy',kind:'charge',reach:40,R:35,act1:10};t.a=3;`);
 assert.equal(g.run('aiTacticalAction(p,t,A,I,D,AI_CHARACTER_PLAN.karate)'),'counter');
 g.run('t.mv.type="normal";');assert.equal(g.run('aiTacticalAction(p,t,A,I,D,AI_CHARACTER_PLAN.karate)'),'evade');
});
test('all 17 characters have tactical skill adapters and recovery avoids non-lifting up specials',()=>{
 const g=game();g.run(setup);assert.equal(g.run('Object.keys(CHARS).every(id=>AI_SKILLS[id]&&AI_CHARACTER_PLAN[id])'),true);
 g.run("p.cid='berserker';p.x=-50;p.vy=4;p.jn=jumpsOf(p);aiStep(p);");
 assert.equal(g.run('p.ai.inp.sc'),0);assert.equal(g.run('p.ai.inp.r'),true);
});
test('resource abilities and Naruto two-clone cap use normal special input',()=>{
 const g=game();g.run(setup+`p.cid='naruto';p.energy=80;t.x=650;p.ai.clock=50;`);
 assert.equal(g.run('aiTacticalAction(p,t,p.ai,p.ai.inp,AI_DIFFICULTY[3],AI_CHARACTER_PLAN.naruto)'),'clone');
 assert.equal(g.run('p.ai.shold'),34);
});
test('prediction lands a falling opponent on a real platform',()=>{
 const g=game();g.run(setup+'t.g=false;t.x=400;t.y=stage.plats[0].y-10;t.vy=10;t.vx=0;');
 assert.equal(g.run('aiProjectedTarget(t,20).y'),g.run('stage.plats[0].y'));
});
test('melee metadata respects long weapons and berserker startup',()=>{
 const g=game();g.run(setup+'const basic=aiMeleeProfile(p);p.cid="lancer";');
 assert.ok(g.run('aiMeleeProfile(p).range>basic.range'));
 g.run('p.cid="berserker";');assert.ok(g.run('aiMeleeProfile(p).startup>basic.startup'));
});
test('all character special options have finite timing and damage, plus valid move references',()=>{
 const g=game();g.run(setup);
 assert.equal(g.run(`Object.keys(CHARS).every(cid=>{p.cid=cid;animeInit(p);return aiSkillOptions(p,t).every(m=>Number.isFinite(m.startup)&&Number.isFinite(m.range)&&Number.isFinite(m.damage)&&(!m.move||!!MOVE_DEF[m.move]));})`),true);
});
test('dodge refuses to roll off either end of a narrow isolated platform',()=>{
 const g=game();g.run(setup+'stage={w:800,h:450,plats:[{x:380,y:390,w:40,h:10}]};p.x=400;p.y=390;p.g=true;');
 assert.equal(g.run('aiCounterAction(p,p.ai.inp,p.ai,1,true)'),false);
 assert.equal(g.run('p.ai.inp.cc'),0);
});
test('expert mixes credible choices at the same distance without choosing invalid attacks',()=>{
 const g=game();g.run(setup+`Math=Object.create(Math);let rng=17;Math.random=()=>((rng=(rng*1664525+1013904223)>>>0)/4294967296);
 const A=p.ai,choices=new Set();for(let i=0;i<300;i++){
  A.clock=i*3;const selected=aiChooseMixup([{name:'tap',score:18},{name:'charge',score:17},{name:'side',score:16},{name:'unreachable',score:-Infinity}],A,t);choices.add(selected.name);
 }`);
 assert.equal(g.run('choices.size'),3);assert.equal(g.run('choices.has("unreachable")'),false);
 assert.ok(g.run('p.ai.recentMoves.length<=4'));
});
test('mindset persists and bait cannot hold forever',()=>{
 const g=game();g.run(setup+`p.ai.clock=100;p.ai.mindset='ambush';p.ai.mindsetUntil=200;t.x=500;p.ai.baitUntil=112;`);
 assert.equal(g.run('aiMindset(p.ai)'),'ambush');
 assert.equal(g.run('aiTacticalAction(p,t,p.ai,p.ai.inp,AI_DIFFICULTY[3],AI_CHARACTER_PLAN.karate)'),'bait-step');
 g.run('p.ai.clock=115;p.ai.nextBait=200;');
 assert.notEqual(g.run('aiTacticalAction(p,t,p.ai,p.ai.inp,AI_DIFFICULTY[3],AI_CHARACTER_PLAN.karate)'),'bait-step');
});
test('delayed visible max charge can be read into a counter',()=>{
 const g=game();g.run(setup+`t.ch=CH_FULL-10;t.f=-1;`);
 assert.equal(g.run('aiTacticalAction(p,t,p.ai,p.ai.inp,AI_DIFFICULTY[3],AI_CHARACTER_PLAN.karate)'),'charge-read-counter');
 assert.equal(g.run('p.ai.inp.cc'),1);
});
test('adaptive smash hold releases before overheat',()=>{
 const g=game();g.run(setup+'p.ch=CH_WARN-4;p.ai.hold=30;p.ai.inp.a=true;aiStep(p);');
 assert.equal(g.run('p.ai.inp.a'),false);assert.equal(g.run('p.ai.inp.rc'),1);
});
