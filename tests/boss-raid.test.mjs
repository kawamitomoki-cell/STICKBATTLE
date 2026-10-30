import test from 'node:test';
import assert from 'node:assert/strict';
import {game} from './helpers/game.mjs';
function raidGame(cid='jotaro',count=3){const g=game();g.ctx.character=cid;g.ctx.cpuCount=count;g.run(`frameCount=0;offlineMode='raid';settings.cid=character;raidParty.count=cpuCount;startBattleOffline();bt.phase='play';`);return g;}
function stop(g){g.run(`raidChoose('world');raid.at=110;`);}
test('solo raid uses an independent, selectable 0–3 CPU party and a dedicated boss',()=>{
 const g=raidGame('kaneki',0);assert.equal(g.run('raidHeroes().length'),1);
 g.run(`raidParty.count=3;raidParty.cids=['eren','jotaro','gojo'];startBattleOffline();`);
 assert.deepEqual(Array.from(g.run('raidHeroes().map(p=>p.cid)')),['kaneki','eren','jotaro','gojo']);
 assert.equal(g.run('raidHeroes().every(p=>p.team===1&&p.raidHp===240&&p.s===2)'),true);
 assert.equal(g.run('byId(RAID_BOSS_ID).raidHp'),6400);
 assert.equal(g.run('Object.hasOwn(CHARS,"dio")'),false);
 assert.equal(g.run('battleWpn'),false);
});
test('boss takes HP damage without grabs, instant knockouts, displacement or percentage scaling',()=>{
 const g=raidGame('boxer',0);g.run(`var boss=byId(RAID_BOSS_ID);var oldX=boss.x;resolveMelee({id:myId,x:boss.x-30,f:1,mv:{dm:30,ko:true,kind:'upper'}},boss);`);
 assert.equal(g.run('boss.raidHp'),6370);assert.equal(g.run('boss.d'),0);assert.equal(g.run('boss.kb'),0);assert.equal(g.run('boss.x'),g.run('oldX'));
 g.run(`resolveMelee({id:myId,mv:{dm:0,kind:'titanGrab'}},boss);koFighter(boss);`);assert.equal(g.run('!!boss.erenGrab||boss.out'),false);
});
test('only Jotaro can counter, move or damage DIO during stopped time',()=>{
 const g=raidGame('kaneki',3);stop(g);
 g.run(`var hero=byId(myId),j=raidHeroes().find(p=>p.cid==='jotaro'),boss=byId(RAID_BOSS_ID);var x=hero.x;`);
 assert.equal(g.run('raidCounter(hero)'),false);
 g.run(`stepFighter(hero,{...blankInput(),r:true,sc:1});raidBossDamage(hero,150);`);
 assert.equal(g.run('hero.x'),g.run('x'));assert.equal(g.run('boss.raidHp'),6400);
 assert.equal(g.run('raidCounter(j)'),true);
 assert.equal(g.run('raidFrozen(j)'),false);assert.equal(g.run('raidHeroes().filter(p=>p!==j).every(p=>raidFrozen(p))'),true);
 assert.equal(g.run('raidBossDamage(j,35)'),35);assert.equal(g.run('boss.raidHp'),6365);
 assert.equal(g.run('raidBossDamage(hero,150)'),0);assert.equal(g.run('raidCounter(j)'),false);
});
test('human down-special works while frozen, without gauge or a ready ordinary special',()=>{
 const g=raidGame('jotaro',0);stop(g);
 g.run(`var hero=byId(myId);hero.energy=0;hero.spc=99;hero.kb=40;stepFighter(hero,{...blankInput(),sc:1,gd:true,s:true});`);
 assert.equal(g.run('raid.counterIds.includes(myId)'),true);assert.equal(g.run('hero.kb'),0);assert.equal(g.run('hero.energy'),0);
});
test('counter expires, and breaking DIO protects frozen allies without letting them act early',()=>{
 const g=raidGame('jotaro',1);stop(g);g.run(`var hero=byId(myId),ally=raidHeroes()[1];raidCounter(hero);raidBossDamage(hero,70);`);
 assert.equal(g.run('raid.saved'),true);assert.equal(g.run('raidFrozen(ally)'),true);
 g.run(`raid.at=339;raidTick();`);assert.equal(g.run('ally.raidHp'),240);assert.equal(g.run('raidWorldStopped()'),false);
 assert.equal(g.run('raidBossDamage(ally,20)'),33);
 const late=raidGame('jotaro',0);stop(late);late.run('raid.at=220');assert.equal(late.run('raidCounter(byId(myId))'),false);
});
test('unanswered phase-two World defeats invulnerability and infinity, but successful counter avoids it',()=>{
 const g=raidGame('goku',2);g.run(`raidParty.cids=['gojo','jotaro'];startBattleOffline();bt.phase='play';byId(myId).form=3;byId(myId).energy=100;byId(RAID_BOSS_ID).raidHp=3000;raidChoose('world');raid.at=339;raidTick();`);
 assert.equal(g.run('raid.phase'),2);assert.equal(g.run('raidHeroes().every(p=>p.s===1&&p.raidHp===240)'),true);
 assert.equal(g.run('raidHeroes().every(p=>p.stats.deaths===1)'),true);
});
test('knife defenses, armor and jumps give non-Jotaro characters a role',()=>{
 const g=raidGame('gojo',1);g.run(`raidParty.cids=['berserker'];startBattleOffline();bt.phase='play';var hero=byId(myId),ally=raidHeroes()[1];hero.x=ally.x=400;hero.y=ally.y=600;raidReceiveStrike({by:myId,kind:'knives',serial:raid.serial,x:0,y:560,w:1200,h:60,dm:40});`);
 assert.equal(g.run('hero.raidHp'),240);assert.equal(g.run('ally.raidHp'),220);
 g.run(`ally.inv=0;ally.y=500;raidReceiveStrike({by:myId,kind:'wave',serial:raid.serial,x:0,y:566,w:1200,h:42,dm:55});`);assert.equal(g.run('ally.raidHp'),220);
});
test('player HP stocks reset once per death; a second death eliminates and ends the raid',()=>{
 const g=raidGame('kaneki',0);g.run(`var hero=byId(myId);raidPlayerDamage(hero,300,1,true);`);
 assert.equal(g.run('hero.s'),1);assert.equal(g.run('hero.raidHp'),240);assert.equal(g.run('hero.out'),false);
 g.run(`raidPlayerDamage(hero,300,1,true);raidTick();`);assert.equal(g.run('hero.s'),0);assert.equal(g.run('hero.out'),true);assert.equal(g.run('raid.result'),'failed');
});
test('CPU Jotaro counters and actually interrupts with normal ORA damage',()=>{
 const g=raidGame('kaneki',1);stop(g);g.run(`var j=raidHeroes()[1];j.x=byId(RAID_BOSS_ID).x-260;var oldHp=byId(myId).raidHp;for(let i=0;i<230;i++){frameCount++;simulateFrame();}`);
 assert.equal(g.run('raid.saved'),true);assert.equal(g.run('byId(myId).raidHp'),g.run('oldHp'));
 assert.ok(g.run('j.stats.dealt')>=64);assert.equal(g.run('j.cid'),'jotaro');
});
test('allied control abilities create bounded openings and never stop teammates',()=>{
 const g=raidGame('jotaro',1);g.run(`animeArea({id:myId,kind:'timestop'});`);assert.equal(g.run('raid.stun'),120);
 assert.equal(g.run('raidHeroes().some(p=>p.timeStopT>0)'),false);
 g.run(`raid.stun=0;animeArea({id:myId,kind:'timestop'});`);assert.equal(g.run('raid.stun'),0);
});
test('boss HP and raid timer are fixed across party sizes, and timeout has its own defeat',()=>{
 const g=raidGame('jotaro',0);g.run('raid.frame=17999;raidTick()');assert.equal(g.run('raid.result'),'failed');assert.equal(g.run('raid.reason'),'時間切れ');
});
test('clear uses the boss victory condition and rematch restores the selected party',()=>{
 const g=raidGame('kaneki',2);g.run(`raidParty.cids=['jotaro','eren'];startBattleOffline();bt.phase='play';byId(RAID_BOSS_ID).raidHp=10;raidBossDamage(byId(myId),12);`);
 assert.equal(g.run('raid.result'),'clear');assert.equal(g.run('bt.winnerTeam'),1);assert.equal(g.run('byId(RAID_BOSS_ID).out'),true);
 g.run('startBattleOffline()');assert.equal(g.run('byId(RAID_BOSS_ID).raidHp'),6400);assert.deepEqual(Array.from(g.run('raidHeroes().map(p=>p.cid)')),['kaneki','jotaro','eren']);
 g.run(`offlineMode='normal';startBattleOffline();`);assert.equal(g.run('raid'),null);assert.equal(g.run('fighters.some(p=>p.raidBoss)'),false);
});
test('online host publishes one boss roster with at most four configurable allies',async()=>{
 const g=game(),writes=[];g.ctx.room={update:async()=>{},child:()=>({set:async value=>writes.push(value)})};
 g.run(`online=true;isHost=true;roomRef=room;memCache={};memCache[myId]={cid:'kaneki',protocol:NET_PROTOCOL,slot:0};memCache.peer={cid:'eren',protocol:NET_PROTOCOL,slot:1};gmCache={mode:'raid',raidCpuN:3,raidCpuCids:['jotaro','gojo','goku'],round:0};`);
 await g.run('hostStart()');assert.equal(writes[0].players.length,4);assert.deepEqual(Array.from(writes[0].players,p=>p.cid),['kaneki','eren','jotaro','gojo']);assert.equal(writes[0].players.every(p=>p.team===1),true);assert.equal(writes[0].hostId,g.run('myId'));
});
function linkedRaid(){
 const host=game(),guest=game(),hostId=host.run('myId'),guestId=guest.run('myId');for(const [g,owner]of [[host,true],[guest,false]]){g.ctx.hostId=hostId;g.ctx.guestId=guestId;g.ctx.hostFlag=owner;g.run(`frameCount=0;online=true;isHost=hostFlag;curRound=1;gmCache={mode:'raid',hostId,map:'metro',teamMode:1,stocks:2,players:[{id:hostId,cid:'kaneki',label:'HOST',cpu:0},{id:guestId,cid:'jotaro',label:'GUEST',cpu:0}]};startBattleOnline();bt.phase='play';`);}
 const hostWrites=[],guestWrites=[];
 for(const [g,out]of [[host,hostWrites],[guest,guestWrites]])g.ctx.transport={child:()=>({push:()=>({set:async e=>out.push(e),remove:async()=>{}}),update:async()=>{}})};
 host.run('roomRef=transport');guest.run('roomRef=transport');
 const snapshot=()=>{const s=host.run(`({...stateOf(byId(RAID_BOSS_ID)),rd:1,sq:++netSeq,ts:Date.now()})`);guest.ctx.wire=JSON.parse(JSON.stringify(s));guest.run(`onP({key:RAID_BOSS_ID,val:()=>wire})`);};
 return {host,guest,hostWrites,guestWrites,snapshot};
}
test('two clients: guest Jotaro counters, only the host subtracts HP, snapshots reconcile, duplicate hits drop',()=>{
 const {host,guest,guestWrites,snapshot}=linkedRaid();stop(host);snapshot();assert.equal(guest.run('raid.at'),110);
 guest.run('byId(myId).spc=99;byId(myId).kb=40;raidCounter(byId(myId))');assert.equal(guestWrites[0].k,'raid-counter');host.ctx.event=guestWrites[0];host.run('receiveNetEvent(event)');snapshot();
 assert.equal(guest.run('byId(myId).spc+byId(myId).kb'),0);
 assert.equal(guest.run('raid.counterIds.includes(myId)'),true);assert.equal(host.run('raidFrozen(byId(myId))'),true);
 guest.run(`send({k:'mh',to:RAID_BOSS_ID,a:myId,ax:500,f:1,c:'#fff',mv:{dm:30,k0:3,ks:0,up:0,kind:'ora'}})`);
 host.ctx.event=guestWrites.at(-1);host.run('receiveNetEvent(event);receiveNetEvent(event)');assert.equal(host.run('byId(RAID_BOSS_ID).raidHp'),6370);snapshot();assert.equal(guest.run('byId(RAID_BOSS_ID).raidHp'),6370);
 guest.run('raidBossDamage(byId(myId),90)');assert.equal(guest.run('byId(RAID_BOSS_ID).raidHp'),6370);
});
test('two clients: host strikes damage each local owner once; forged counter and old rounds are rejected',()=>{
 const {host,guest,hostWrites,snapshot}=linkedRaid();
 host.run(`raidStrike('wave',{x:0,y:0,w:1200,h:675,dm:40})`);guest.ctx.event=hostWrites.at(-1);guest.run('receiveNetEvent(event);receiveNetEvent(event)');assert.equal(host.run('byId(myId).raidHp'),200);assert.equal(guest.run('byId(myId).raidHp'),200);
 stop(host);snapshot();host.run(`raidAcceptCounter({id:guestId,serial:raid.serial,by:'imposter'})`);assert.equal(host.run('raid.counterIds.length'),0);
 guest.run(`receiveNetEvent({...event,uid:'old-round',rd:0})`);assert.equal(guest.run('byId(myId).raidHp'),200);
});
