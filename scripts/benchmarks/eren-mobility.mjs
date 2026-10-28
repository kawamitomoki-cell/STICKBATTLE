import {resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

// Optional argument: an isolated checkout of the previous revision to compare.
const currentRoot=fileURLToPath(new URL('../../',import.meta.url));
const versions=process.argv[2]?[['before',resolve(process.argv[2])],['after',currentRoot]]:[['after',currentRoot]];
const results=[];
for(const [version,root]of versions){
 const {game}=await import(pathToFileURL(resolve(root,'tests/helpers/game.mjs')).href);
 for(const move of ['side','up']){
  const g=game(),frames=move==='side'?30:60;
  const result=g.run(`
   startBattleCommon([{id:myId,cid:'eren',owner:myId,label:'Eren',cpu:0},
    {id:'target',cid:'karate',owner:myId,label:'Target',cpu:1}],'std',false,3);
   bt.phase='play';const p=byId(myId);p.x=400;p.y=390;p.g=true;p.groundPl=0;p.inv=0;
   const I={...blankInput(),s:true,sc:1,${move==='side'?'r:true':'u:true,jc:1'}};
   const startY=p.y,startX=p.x;let top=p.y,maxSpeed=0,farthest=p.x,ko=false,steps=0;
   for(let i=0;i<${frames};i++){
    stepFighter(p,I);steps++;if(p.stats.deaths){ko=true;break;}
    top=Math.min(top,p.y);maxSpeed=Math.max(maxSpeed,Math.abs(p.vx));farthest=Math.max(farthest,p.x);
   }
   ({ko,steps,maxRise:startY-top,maxSpeed,maxForward:farthest-startX,finalX:p.x,finalY:p.y});
  `);
  results.push({version,move,frames,...result});
 }
}
console.log(JSON.stringify(results,null,2));
