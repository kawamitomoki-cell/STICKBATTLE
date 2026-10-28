import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const game=read('src/game/01-game-data.js');
const source=game.slice(game.indexOf('function animeHold(p,inp){'),game.indexOf('function animeUp(p){'));
function env(notices=[]){
 const sandbox={NARUTO_CLONE_MAX:2,shadowClonesAlive:()=>[],NARUTO_CLONE_HOLD:32,NARUTO_CLONE_COST:60,shadowCloneAlive:()=>null,
  shadowCloneSummon(p){p.energy-=60;p.spc=100;p.summoned=(p.summoned||0)+1;return true;},
  animeNotice(p,msg){notices.push(msg)},animeRasenShuriken(){throw Error('no shuriken while long-pressed')},
  animeGain(){},animeSound(){},GOJO_PURPLE_HOLD:150,GOJO_RED_HOLD:30};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);return sandbox;
}
test('Naruto summons during hold, without requiring button release',()=>{
 const ctx=env(),p={cid:'naruto',id:'n1',sph:1,energy:75,shadowClone:false,castStyle:'shadow-charge'};
 for(let i=0;i<34;i++)if(p.sph>0)ctx.animeHold(p,{s:true});
 assert.equal(p.summoned,1);assert.equal(p.energy,15);assert.equal(p.sph,0);assert.equal(p.castStyle,'');
});
test('insufficient chakra announces cost, summons if gauge fills while still holding',()=>{
 const messages=[],ctx=env(messages),p={cid:'naruto',id:'n1',sph:1,energy:35,shadowClone:false,castStyle:'shadow-charge'};
 for(let i=0;i<33;i++)ctx.animeHold(p,{s:true});
 assert.equal(p.summoned||0,0);assert.ok(messages.some(x=>x.includes('チャクラ60必要')));
 p.energy=66;ctx.animeHold(p,{s:true});
 assert.equal(p.summoned,1);assert.equal(p.energy,6);
});
test('HUD displays charge / available or missing chakra / clone activity',()=>{
 const ui=read('src/game/13-ui-and-menus.js');
 assert.ok(ui.includes("special.style.setProperty('--charge',progress+'%')"));
 assert.ok(game.includes('チャクラ十分！ 特殊を約0.5秒長押し'));
 assert.ok(game.includes('影分身が戦闘中'));
});
