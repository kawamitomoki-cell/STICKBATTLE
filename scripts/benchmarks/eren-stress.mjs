import assert from 'node:assert/strict';
import {game} from '../../tests/helpers/game.mjs';

// Deterministic simulation load only: no renderer, browser or network FPS claims.
const results=[];
for(const cpus of [1,7]){
 const g=game();g.ctx.cpuCount=cpus;
 const started=performance.now();
 const result=g.run(`
  Math=Object.create(Math);let rng=147;Math.random=()=>((rng=(rng*1664525+1013904223)>>>0)/4294967296);
  frameCount=0;const roster=Array.from({length:cpuCount+1},(_,i)=>({id:i?'cpu'+i:myId,cid:'eren',label:'EREN '+i,owner:myId,cpu:i?1:0}));
  startBattleCommon(roster,'std',false,5);bt.phase='play';aiLv=3;
  for(const p of fighters){p.erenForm=1;p.erenTime=1080;p.inv=0;}
  let invalid=0,frame=0;
  for(;frame<1200;frame++){
   frameCount++;
   if(freezeT>0){freezeT--;if(!freezeT){endFreeze();finishCinematic();}continue;}
   animeWorldTick();
   for(const p of fighters){if(p.cpu){aiStep(p);stepFighter(p,p.ai.inp);}else stepFighter(p,blankInput());}
   for(const p of fighters)meleeCheck(p);stepProjs();stepBombs();stepMines();shadowClonePrune();
   for(const p of fighters)if(![p.x,p.y,p.vx,p.vy,p.d,p.erenGauge,p.erenTime,p.erenHard].every(Number.isFinite))invalid++;
  }
  ({frames:frame,invalid,knockouts:fighters.reduce((n,p)=>n+p.stats.deaths,0),fighters:fighters.length});
 `);
 assert.equal(result.invalid,0);
 results.push({cpus,...result,simMs:performance.now()-started});
}
console.log(JSON.stringify(results,null,2));
