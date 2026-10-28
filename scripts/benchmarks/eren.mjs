import {game} from '../../tests/helpers/game.mjs';
const results=[];
for(const opponent of ['karate','bomber','ninja','sumo','boxer','yankee','swordsman','lancer','gunman','archer','rubber','berserker','goku','gojo','tanjiro','naruto','jotaro']){
 const totals={opponent,wins:0,losses:0,timeouts:0,transformations:0,damage:0,taken:0,simMs:0};
 for(let seed=1;seed<=2;seed++){
  const g=game();g.ctx.seed=seed;
  const start=performance.now();const r=g.run(`Math=Object.create(Math);let rng=seed;Math.random=()=>((rng=(rng*1664525+1013904223)>>>0)/4294967296);
  frameCount=0;startBattleCommon([{id:myId,cid:'eren',owner:myId,label:'Eren',cpu:1},{id:'rival',cid:'${opponent}',owner:myId,label:'Rival',cpu:1}],'std',false,3);bt.phase='play';aiLv=3;
  if(seed%2){const x=fighters[0].x;fighters[0].x=fighters[1].x;fighters[1].x=x;}
  let transformations=0;const originalTransform=erenTransform;erenTransform=p=>{const ok=originalTransform(p);if(ok)transformations++;return ok};
  for(let frame=0;frame<3600&&!fighters.some(f=>f.out&&!f.shadowClone);frame++){
   frameCount++;if(freezeT>0){freezeT--;if(!freezeT){endFreeze();finishCinematic();}continue;}
   animeWorldTick();for(const f of fighters){if(f.cpu){aiStep(f);stepFighter(f,f.ai.inp);}}
   for(const f of fighters)meleeCheck(f);stepProjs();stepBombs();stepMines();shadowClonePrune();
  }
  const a=byId(myId),b=byId('rival');({wins:b.out?1:0,losses:a.out?1:0,timeouts:!a.out&&!b.out?1:0,transformations,damage:a.stats.dealt,taken:b.stats.dealt});`);
  totals.simMs+=performance.now()-start;for(const key in r)totals[key]+=r[key];
 }
 results.push(totals);
}
console.log(JSON.stringify(results,null,2));
