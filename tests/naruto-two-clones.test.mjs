import test from 'node:test';
import assert from 'node:assert/strict';
import {game} from './helpers/game.mjs';
const battle=`startBattleCommon([{id:myId,cid:'naruto',owner:myId,label:'P1'},
 {id:'enemy',cid:'karate',owner:myId,label:'CPU',cpu:1}],'std',false,3);bt.phase='play';const p=byId(myId);`;
test('two separate holds summon two clones, each costs 60, third is rejected without cost',()=>{
 const g=game();g.run(battle+`let input=blankInput();
 for(let press=0;press<2;press++){
  p.energy=100;p.spc=0;input.sc++;input.s=true;
  for(let i=0;i<34;i++)stepFighter(p,input);
  input.s=false;stepFighter(p,input);
 }`);
 assert.equal(g.run('shadowClonesAlive(myId).length'),2);
 assert.ok(g.run('p.energy>=40&&p.energy<42'));
 g.run('p.energy=100;p.spc=0;input.sc++;input.s=true;for(let i=0;i<34;i++)stepFighter(p,input);');
 assert.equal(g.run('shadowClonesAlive(myId).length'),2);assert.equal(g.run('p.energy'),100);
 assert.ok(g.run('animeHud(p).label.includes("2/2")'));
});
test('one clone death frees one slot, friendly clones do not hit each other, respawn clears both',()=>{
 const g=game();g.run(battle+`p.energy=100;shadowCloneSummon(p);p.energy=100;shadowCloneSummon(p);
 const [a,b]=shadowClonesAlive(myId);const ids=new Set([a.id,b.id]);`);
 assert.equal(g.run('ids.size'),2);assert.equal(g.run('sameTeam(a,b)&&sameTeam(p,b)'),true);
 g.run(`resolveMelee({id:a.id,x:a.x,f:1,mv:{dm:6,k0:4,ks:.05,up:.6}},b);`);
 assert.equal(g.run('b.out'),false);
 g.run('shadowClonePop(a);p.energy=100;shadowCloneSummon(p);');
 assert.equal(g.run('shadowClonesAlive(myId).length'),2);
 assert.equal(g.run('shadowClonesAlive(myId).some(f=>f.id===a.id)'),false);
 g.run('respawn(p);');assert.equal(g.run('shadowClonesAlive(myId).length'),0);
});
test('remote accepts two clones, deduplicates either ID, rejects third, and accepts replacement after pop',()=>{
 const g=game();g.run(`online=true;curRound=1;`+battle+`
 fighters.push(makeFighter({id:'peer',cid:'naruto',owner:'peer',label:'P2'},2));
 const packet={...stateOf(byId('peer')),sc:1,so:'peer',ts:Date.now(),sq:1};
 for(const n of [1,2,1,2,3])onP({key:'sclone_peer_'+n,val:()=>packet});`);
 assert.equal(g.run('shadowClonesAlive("peer").length'),2);
 g.run(`shadowCloneReceivePop({id:'sclone_peer_1',owner:'peer',by:'peer'});
 onP({key:'sclone_peer_1',val:()=>({...packet,sq:2})});
 onP({key:'sclone_peer_4',val:()=>packet});`);
 assert.equal(g.run('shadowClonesAlive("peer").length'),2);
 assert.equal(g.run('byId("sclone_peer_1").out'),true);
 assert.equal(g.run('!!byId("sclone_peer_4")'),true);
});
