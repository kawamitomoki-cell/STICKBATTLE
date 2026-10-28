import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('summon costs 60 chakra, uses real CPU fighter, lasts to first hit',()=>{
 const ctx={fighters:[],myId:'hero',online:false,stage:{w:800},hudKey:'',makeFighter:(m,i)=>({...m,out:false,ai:{t:1},hit:{}}),isLocal:()=>true,
  animeEmit:()=>{},popups:[],clearActs:()=>{},burst:()=>{},ring:()=>{},animeSound:()=>{},send:()=>{},sfxNo:()=>{},animeNotice:()=>{},roomRef:null,byId:null,networkError:()=>{}};
 vm.createContext(ctx);vm.runInContext(read('src/game/01b-naruto-shadow-clone.js'),ctx);ctx.byId=id=>ctx.fighters.find(f=>f.id===id);
 const hero={id:'hero',cid:'naruto',owner:'hero',team:0,x:390,y:380,f:1,energy:75,form:0,modeT:0,g:true,groundPl:0,spc:0,out:false};ctx.fighters.push(hero);
 assert.equal(ctx.shadowCloneSummon(hero),true);assert.equal(hero.energy,15);
 const clone=ctx.shadowCloneAlive('hero');assert.ok(clone?.shadowClone&&clone.cpu&&clone.shadowOwner==='hero');assert.equal(ctx.shadowCloneSummon(hero),false);
 assert.equal(ctx.shadowClonePop(clone),true);assert.equal(clone.out,true);assert.equal(ctx.shadowClonePop(clone),false);
});
test('network accepts only valid remote clone snapshots',()=>{
 const ctx={fighters:[],myId:'self',online:true,curRound:8,stage:{w:800},popups:[],hudKey:'',makeFighter:(m,i)=>({...m,out:false,ai:{t:1}}),byId:null};
 vm.createContext(ctx);vm.runInContext(read('src/game/01b-naruto-shadow-clone.js'),ctx);ctx.byId=id=>ctx.fighters.find(f=>f.id===id);
 ctx.fighters.push({id:'other',cid:'naruto',owner:'other',team:0});
 assert.equal(ctx.shadowCloneReceiveSnapshot('sclone_other_1',{sc:1,so:'other',rd:8,x:100,y:200,f:1,o:0}).shadowClone,true);
 assert.equal(ctx.shadowCloneReceiveSnapshot('sclone_other_2',{sc:1,so:'other',rd:8,x:100,y:200,o:0}).shadowClone,true);
 assert.equal(ctx.shadowCloneReceiveSnapshot('sclone_other_3',{sc:1,so:'other',rd:8,x:100,y:200,o:0}),null);
 assert.equal(ctx.shadowCloneReceiveSnapshot('sclone_fake_2',{sc:1,so:'other',rd:8,x:100,y:200,o:0}),null);
});
test('expert AI, combat, multiplayer and win checks are wired',()=>{
 const d=read('src/game/01-game-data.js'),m=read('src/game/03-main-loop.js'),n=read('src/game/05-network-sync.js'),
 c=read('src/game/08-combat.js'),u=read('src/game/13-ui-and-menus.js'),g=read('src/game/06-game-modes.js'),lb=read('src/game/04-network-lobby.js');
 assert.ok(d.includes("p.castStyle='shadow-charge'"));assert.ok(d.includes('shadowCloneSummon(p)'));
 assert.ok(m.includes('if(f.shadowClone)aiLv=3'));assert.ok(n.includes('sc:f.shadowClone?1:0'));assert.ok(u.includes('shadowCloneReceiveSnapshot(s.key,v)'));
 assert.ok(n.includes("e.k==='shadow-pop'"));assert.ok(c.includes('if(t.shadowClone){shadowClonePop(t);return;}'));
 assert.ok(g.includes('!f.out&&!f.shadowClone'));assert.ok(lb.includes('!f.out&&!f.shadowClone'));
 assert.ok(u.includes('const rosterFighters=fighters.filter(f=>!f.shadowClone)'));
});
