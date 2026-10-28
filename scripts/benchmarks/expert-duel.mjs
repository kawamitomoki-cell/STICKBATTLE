import {game} from '../../tests/helpers/game.mjs';
import {readFileSync} from 'node:fs';
let baseline=readFileSync(new URL('./cpu-utility-v1.txt',import.meta.url),'utf8');
const names=[...baseline.matchAll(/function\s+(\w+)/g),...baseline.matchAll(/^const\s+(AI_\w+)/gm)].map(m=>m[1]);
for(const name of [...new Set(names)].sort((a,b)=>b.length-a.length))baseline=baseline.replace(new RegExp('\\b'+name+'\\b','g'),'v1_'+name);
const rows=[];
for(const cid of ['karate','bomber','ninja','sumo','boxer','yankee','swordsman','lancer','gunman','archer','rubber','berserker','goku','gojo','tanjiro','naruto','jotaro']){
 const row={cid,newDamage:0,oldDamage:0,newDeaths:0,oldDeaths:0,newWins:0,oldWins:0,draws:0,aiMs:0};
 for(let seed=1;seed<=6;seed++){
  const g=game();g.run(baseline);g.ctx.seed=seed;
  const r=g.run(`Math=Object.create(Math);let rng=seed;Math.random=()=>((rng=(rng*1664525+1013904223)>>>0)/4294967296);
  frameCount=0;const newStep=aiStep;aiStep=p=>p.id===myId?newStep(p):v1_aiStep(p);
  startBattleCommon([{id:myId,cid:'${cid}',owner:myId,cpu:1,label:'new'},{id:'old',cid:'${cid}',owner:myId,cpu:1,label:'old'}],'std',false,3);bt.phase='play';aiLv=3;
  if(seed%2){const x=fighters[0].x;fighters[0].x=fighters[1].x;fighters[1].x=x;}
  let aiMs=0;
  for(let frame=0;frame<3600&&!fighters.some(f=>!f.shadowClone&&f.out);frame++){
   frameCount++;if(freezeT>0){freezeT--;if(!freezeT)endFreeze();continue;}
   animeWorldTick();
   for(const f of fighters){const start=performance.now();aiStep(f);aiMs+=performance.now()-start;stepFighter(f,f.ai.inp);}
   for(const f of fighters)meleeCheck(f);stepProjs();stepBombs();stepMines();shadowClonePrune();
  }
  const n=byId(myId),o=byId('old');
  ({newDamage:n.stats.dealt,oldDamage:o.stats.dealt,newDeaths:n.stats.deaths,oldDeaths:o.stats.deaths,newWins:o.out?1:0,oldWins:n.out?1:0,draws:!o.out&&!n.out?1:0,aiMs});`);
  for(const key in r)row[key]+=r[key];
 }
 rows.push(row);
}
console.log(JSON.stringify(rows,null,2));
