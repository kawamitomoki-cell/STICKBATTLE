import {game} from '../../tests/helpers/game.mjs';
import {readFileSync} from 'node:fs';
const old=readFileSync(new URL('./cpu-v27.txt',import.meta.url),'utf8');
const rows=[];
for(const version of ['before','after'])for(const cid of ['karate','gunman','naruto','berserker']){
 const totals={damage:0,deaths:0,attacks:0,hitEvents:0,aiMs:0,frames:0};
 for(let seed=1;seed<=3;seed++){
  const g=game();g.ctx.seed=seed;
  if(version==='before'){g.run(old.slice(old.indexOf('function aiSelectSpecial('),old.indexOf('function aiNavigationV27(')));g.run(old.slice(old.indexOf('function aiStep(p){')));}
  const result=g.run(`
  Math=Object.create(Math);let rng=seed;Math.random=()=>((rng=(rng*1664525+1013904223)>>>0)/4294967296);
  frameCount=0;startBattleCommon([{id:myId,cid:'${cid}',owner:myId,label:'A',cpu:1},{id:'b',cid:'karate',owner:myId,label:'B',cpu:1}],'std',false,3);
  bt.phase='play';aiLv=3;let aiMs=0,attacks=0,hitEvents=0;
  const originalAttack=fireAttack,originalFx=emitFx;
  fireAttack=(...args)=>{attacks++;return originalAttack(...args)};
  emitFx=e=>{if(e.res==='hit')hitEvents++;return originalFx(e)};
  for(let frame=0;frame<1800;frame++){
   frameCount++;if(freezeT>0){freezeT--;if(!freezeT)endFreeze();continue;}
   animeWorldTick();
   for(const f of fighters){const tick=performance.now();aiStep(f);aiMs+=performance.now()-tick;stepFighter(f,f.ai.inp);}
   for(const f of fighters)meleeCheck(f);stepProjs();stepBombs();stepMines();shadowClonePrune();
   for(const f of fighters)if(f.out){f.out=false;f.s=3;respawn(f);}
  }
  ({damage:fighters.reduce((s,f)=>s+f.stats.dealt,0),deaths:fighters.reduce((s,f)=>s+f.stats.deaths,0),attacks,hitEvents,aiMs,frames:1800});`);
  for(const key in totals)totals[key]+=result[key];
 }
 rows.push({version,cid,...totals});
}
console.log(JSON.stringify(rows,null,2));
for(const count of [1,3,7]){
 const g=game();g.ctx.count=count;
 console.log(JSON.stringify(g.run(`frameCount=0;startBattleCommon(Array.from({length:count+1},(_,i)=>({id:i?'cpu'+i:myId,cid:'karate',owner:myId,label:'CPU',cpu:1})),'wide',false,3);bt.phase='play';aiLv=3;
 let ms=0,calls=0;for(let frame=0;frame<1200;frame++){frameCount++;for(const f of fighters.slice(1)){const start=performance.now();aiStep(f);ms+=performance.now()-start;calls++;stepFighter(f,f.ai.inp);}}
 ({cpuCount:count,calls,aiMs:ms});`)));
}
