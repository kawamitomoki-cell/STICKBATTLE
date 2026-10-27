
// Naruto: autonomous shadow clone companion.
// Real CPU fighter, excluded from stock/score; 60 chakra and one-hit life.
const NARUTO_CLONE_HOLD=32,NARUTO_CLONE_COST=60,NARUTO_CLONE_COOLDOWN=100;
let shadowCloneSerial=0;
const shadowCloneGone=new Set();
function shadowCloneReset(){shadowCloneSerial=0;shadowCloneGone.clear();}
function shadowCloneAlive(ownerId){return fighters.find(f=>f.shadowClone&&f.shadowOwner===ownerId&&!f.out)||null;}
function shadowCloneSummon(p){
 if(!p||p.cid!=='naruto'||p.shadowClone||!isLocal(p)||p.out)return false;
 if(shadowCloneAlive(p.id)){animeNotice(p,'影分身は既に出現中','#ffda95');sfxNo();p.spc=24;return false;}
 if((p.energy||0)<NARUTO_CLONE_COST){animeNotice(p,'チャクラ不足','#ffda95');sfxNo();p.spc=24;return false;}
 p.energy-=NARUTO_CLONE_COST;p.spc=NARUTO_CLONE_COOLDOWN;
 const x=Math.max(28,Math.min(stage.w-28,p.x-p.f*55));
 const id='sclone_'+p.id+'_'+(++shadowCloneSerial);
 const f=makeFighter({id,cid:'naruto',label:'影分身',cpu:1,owner:p.owner,team:p.team},fighters.length);
 f.shadowClone=true;f.shadowOwner=p.id;f.x=x;f.y=p.y;f.f=p.f;f.vx=0;f.vy=0;f.g=p.g;f.groundPl=p.groundPl;
 f.form=p.form;f.modeT=p.modeT;f.energy=0;f.inv=0;f.s=1;f.spc=30;f.ai.t=1;f.c='#9bd6ff';
 fighters.push(f);hudKey='';
 animeEmit(p,'clone',{title:'影分身の術！',life:31});
 popups.push({x:f.x,y:f.y-95,txt:'SHADOW CLONE',life:48,max:48,size:17,c:'#d8f2ff'});
 return true;
}
function shadowCloneReceiveSnapshot(id,s){
 if(!online||shadowCloneGone.has(id)||!s||s.sc!==1||s.rd!==curRound||s.o||typeof id!=='string')return null;
 if(typeof s.so!=='string'||!id.startsWith('sclone_'+s.so+'_'))return null;
 const owner=byId(s.so);
 if(!owner||owner.cid!=='naruto'||owner.owner===myId)return null;
 const active=shadowCloneAlive(owner.id);
 if(active)return active.id===id?active:null;
 const f=makeFighter({id,cid:'naruto',label:'影分身',cpu:1,owner:owner.owner,team:owner.team},fighters.length);
 f.shadowClone=true;f.shadowOwner=owner.id;f.x=s.x;f.y=s.y;f.f=s.f||1;f.form=s.af||0;f.modeT=s.at||0;f.energy=0;
 f.inv=0;f.s=1;f.spc=0;f.c='#9bd6ff';fighters.push(f);hudKey='';
 return f;
}
function shadowCloneSmoke(x,y){
 burst(x,y-30,22,6,'#e3edf8',7);ring(x,y-30,30,17);animeSound('clone');
 popups.push({x,y:y-83,txt:'POOF!',life:30,max:30,size:18,c:'#e0f5ff'});
}
function shadowClonePop(f,broadcast=true){
 if(!f||!f.shadowClone||f.out)return false;
 const x=f.x,y=f.y;f.out=true;f.s=0;f.shadowGoneAt=Date.now();shadowCloneGone.add(f.id);
 clearActs(f);f.w=null;f.hit={};shadowCloneSmoke(x,y);
 if(broadcast&&isLocal(f))send({k:'shadow-pop',id:f.id,owner:f.shadowOwner,x:Math.round(x),y:Math.round(y)});
 return true;
}
function shadowCloneReceivePop(e){
 if(!e||typeof e.id!=='string'||typeof e.owner!=='string')return;
 const owner=byId(e.owner);
 if(!owner||owner.cid!=='naruto'||owner.owner!==e.by||!e.id.startsWith('sclone_'+e.owner+'_'))return;
 shadowCloneGone.add(e.id);
 const f=byId(e.id);
 if(f&&f.shadowClone)shadowClonePop(f,false);
 else if(Number.isFinite(e.x)&&Number.isFinite(e.y))shadowCloneSmoke(e.x,e.y);
}
function shadowCloneClearOwner(ownerId){
 for(const f of fighters)if(f.shadowClone&&f.shadowOwner===ownerId&&!f.out&&isLocal(f))shadowClonePop(f);
}
function shadowClonePrune(){
 const now=Date.now();
 for(const f of fighters){
  if(!f.shadowClone||f.out)continue;
  const owner=byId(f.shadowOwner);
  if(!owner||owner.out){
   if(isLocal(f))shadowClonePop(f);
   else{f.out=true;f.shadowGoneAt=now;shadowCloneGone.add(f.id);}
  }
 }
 for(let i=fighters.length-1;i>=0;i--){
  const f=fighters[i];if(!f.shadowClone||!f.out||!f.shadowGoneAt||now-f.shadowGoneAt<800)continue;
  fighters.splice(i,1);hudKey='';
  if(online&&isLocal(f)&&roomRef)roomRef.child('p/'+f.id).remove().catch(networkError);
 }
}
