// Cooperative raids use their own HP, encounter clock and host-owned boss.
// The ordinary fighter roster, stocks, moves and PvP rules are left intact.
const RAID_BOSS_ID='raid_dio';
const RAID_BOSSES={dio:{name:'DIO',hp:6400,seconds:300,playerHp:240,lives:2,breakHp:64}};
const DIO_BODY={...CHARS.karate,name:'DIO',en:'DIO / THE WORLD',size:1.65,wt:8,pow:1,spd:1};
const RAID_MOVES={
 knives:{name:'投げナイフ',warn:75,end:190,hint:'光る高さを避けろ。ジャンプ・回避／五条は無下限で防御'},
 rush:{name:'無駄無駄ラッシュ',warn:65,end:205,hint:'正面は危険。背後へ回り込め'},
 roller:{name:'ロードローラーだッ！',warn:115,end:230,hint:'着地点から離脱 → 衝撃波をジャンプ'},
 blink:{name:'逃がさんッ！',warn:60,end:160,hint:'狙われた場所から離れろ。突進の軌道に注意'},
 world:{name:'ザ・ワールド',warn:100,end:490,hint:'時が止まったら承太郎だけが下＋特殊で反撃できる'}
};
let raid=null,raidFx=[],raidLastWire=-1;
const raidParty={count:3,cids:['jotaro','gojo','kaneki']};
function raidMode(){return online?gmCache?.mode==='raid':offlineMode==='raid';}
function raidActive(){return !!raid&&raidMode()&&battleSessionActive();}
function raidAuthority(){return !online||isHost;}
function raidHeroes(){return fighters.filter(p=>!p.raidBoss&&!p.shadowClone);}
function raidWorldStopped(){return raidActive()&&raid.move==='world'&&raid.at>=100&&raid.at<340;}
function raidFrozen(p){return raidWorldStopped()&&(!p||p.raidBoss||p.cid!=='jotaro'||!raid.counterIds.includes(p.id));}
function raidCanHurtBoss(p){return !!p&&!p.out&&(!raidWorldStopped()||p.cid==='jotaro'&&raid.counterIds.includes(p.id));}
function raidCounterWindow(p){return raidWorldStopped()&&raid.at<220&&p?.cid==='jotaro'&&!p.out&&!raid.counterIds.includes(p.id);}
const raidAnimeStopActiveBase=animeTimeStopActive;
animeTimeStopActive=function(){return raidWorldStopped()||raidAnimeStopActiveBase();};
function raidInit(){
 const def=RAID_BOSSES.dio;
 raid={boss:'dio',frame:0,move:'knives',at:0,serial:1,index:0,x:stage.w*.5,y:stage.h-75,dir:-1,lane:0,targetX:0,targetY:0,counterIds:[],breakDamage:0,saved:false,stun:0,result:'',phase:1};
 raidFx=[];raidLastWire=-1;
 // A closed city arena: the fight is decided by HP, never by ring-out of DIO.
 stage={...MAPS.metro,name:'カイロ / DIO RAID',w:1200,h:675,plats:[{x:20,y:600,w:1160,h:24},{x:110,y:430,w:210,h:14},{x:880,y:430,w:210,h:14}]};
 raid.x=stage.w*.65;raid.y=600;
 raidHeroes().forEach((p,i)=>{p.raidHp=def.playerHp;p.s=def.lives;p.team=1;p.x=210+i*90;p.y=600;p.f=1;p.inv=0;p.g=true;p.groundPl=0;p.raidCounterSerial=0;});
 const host=online?gmCache.hostId||raidHeroes()[0]?.owner:myId;
 const boss=makeFighter({id:RAID_BOSS_ID,cid:'dio',label:'DIO',owner:host,cpu:0,team:2},fighters.length);
 Object.assign(boss,{raidBoss:true,raidHp:def.hp,s:1,x:raid.x,y:600,f:-1,c:'#d9bf75',inv:0});fighters.push(boss);
 battleTeamMode=true;battleWpn=false;hudKey='';
 raidChoose('knives');
 document.getElementById('b-char').style.display='none';
}
const raidStartCommonBase=startBattleCommon;
startBattleCommon=function(...args){raid=null;const r=raidStartCommonBase(...args);if(raidMode())raidInit();return r;};
const raidSizeBase=fighterSize,raidConfigBase=fighterConfig;
fighterSize=function(p){return p.raidBoss?DIO_BODY.size:raidSizeBase(p);};
fighterConfig=function(p){return p.raidBoss?DIO_BODY:raidConfigBase(p);};
const raidOfflineBase=startBattleOffline;
startBattleOffline=function(){
 if(offlineMode!=='raid')return raidOfflineBase();
 online=false;aiLv=3;
 const list=[{id:myId,cid:settings.cid,label:cleanName(settings.name),owner:myId,cpu:0,team:1}];
 for(let i=0;i<raidParty.count;i++)list.push({id:'raid_cpu_'+i,cid:pickOfflineCpu(raidParty.cids[i],'all'),label:'CPU '+(i+1),owner:myId,cpu:1,team:1});
 startBattleCommon(list,'metro',false,2,true);modeHeader();
};
const raidHostStartBase=hostStart;
hostStart=async function(){
 if(gmCache?.mode!=='raid')return raidHostStartBase();
 if(!isHost||!roomRef)return;
 const humans=lobbyMembers().filter(m=>!m.cpu);
 if(humans.length<1||humans.length>4){alert('協力ボスは1〜4人で出撃できます。');return;}
 if(humans.some(m=>m.protocol!==NET_PROTOCOL)){alert('全員が最新版に更新して入り直してください。');return;}
 const players=humans.map(m=>({...m,team:1,cpu:0,owner:m.id}));
 for(let i=0;i<Math.min(4-humans.length,clampInt(gmCache.raidCpuN,0,3,0));i++)players.push({id:'raid_cpu_'+i,cid:pickOfflineCpu(gmCache.raidCpuCids?.[i],'all'),label:'CPU '+(i+1),cpu:1,owner:myId,team:1});
 const patch={p:null,items:null,ev:null};for(const id in memCache)if(memCache[id]?.cpu)patch['mem/'+id]=null;
 await roomRef.update(patch);
 await roomRef.child('gm').set({...gmCache,mode:'raid',boss:'dio',hostId:myId,protocol:NET_PROTOCOL,map:'metro',wpn:0,cpuN:0,teamMode:1,stocks:2,players,ph:'play',round:(gmCache.round||0)+1,w:'',wt:0,raidResult:''});
};
function raidChoose(move){
 const boss=byId(RAID_BOSS_ID),targets=raidHeroes().filter(p=>!p.out),target=targets[raid.index%Math.max(1,targets.length)];
 Object.assign(raid,{move,at:0,serial:raid.serial+1,counterIds:[],breakDamage:0,saved:false,stun:0,targetX:constrain(target?.x||350,120,1080),targetY:target?.y||600,lane:raid.index%2});
 if(move==='world'){boss.x=600;boss.y=600;}
 else if(move==='rush')boss.x=constrain((target?.x||500)+(raid.index%2?190:-190),80,1120);
 else if(move==='blink')boss.x=raid.index%2?100:1100;
 boss.f=Math.sign((target?.x||300)-boss.x)||-1;
 raid.x=boss.x;raid.y=boss.y;raid.dir=boss.f;
}
function raidTick(){
 if(!raidActive()||bt.phase!=='play'||freezeT>0)return;
 for(const q of raidFx)q.life--;raidFx=raidFx.filter(q=>q.life>0);
 if(!raidAuthority())return; // Guests consume the boss owner's compact snapshots and strike events.
 const boss=byId(RAID_BOSS_ID);if(!boss||raid.result)return;
 raid.frame++;raid.phase=boss.raidHp<=RAID_BOSSES.dio.hp*.5?2:1;
 if(raid.frame>=RAID_BOSSES.dio.seconds*60){raidFinish(false,'時間切れ');return;}
 if(boss.raidHp<=0){raidFinish(true,'DIO撃破');return;}
 if(raidHeroes().every(p=>p.out)){raidFinish(false,'全員戦闘不能');return;}
 if(raid.stun>0){raid.stun--;return;}
 const move=raid.move,t=++raid.at,phase=raid.phase;
 if(move==='knives'){
  if(t===75||t===110||phase===2&&t===140){
   // Alternating lanes leave a readable jump route; each volley is one bounded hit.
   const lane=t===110?1-raid.lane:raid.lane,y=lane?490:560;
   raidStrike('knives',{x:0,y,w:1200,h:60,dm:phase===2?42:34,dir:raid.dir});
  }
 }else if(move==='rush'){
  if(t>=65&&t<=125&&t%12===5){
   raidStrike('rush',{x:raid.dir>0?boss.x:boss.x-235,y:boss.y-130,w:235,h:140,dm:t>=113?34:12,dir:raid.dir});
  }
 }else if(move==='blink'){
  if(t===60){const old=boss.x;boss.x=constrain(raid.targetX+raid.dir*60,70,1130);raidStrike('blink',{x:Math.min(old,boss.x),y:raid.targetY-90,w:Math.abs(old-boss.x),h:95,dm:60,dir:raid.dir});}
 }else if(move==='roller'){
  if(t===115)raidStrike('roller',{x:raid.targetX-150,y:0,w:300,h:620,dm:135,dir:raid.dir});
  if(t===145)raidStrike('wave',{x:0,y:566,w:1200,h:42,dm:55,dir:raid.dir});
  if(phase===2&&t===178)raidStrike('wave',{x:0,y:566,w:1200,h:42,dm:55,dir:-raid.dir});
 }else if(move==='world'){
  if(t===100){raidFx.push({kind:'clock',life:36});tone(65,25,.35,.15,'sawtooth');}
  if(t===340){
   if(!raid.saved)raidStrike('world',{x:0,y:0,w:1200,h:675,dm:phase===2?285:185,dir:raid.dir,force:true});
   else raidFx.push({kind:'break',life:60});
  }
 }
 raid.x=boss.x;raid.y=boss.y;
 if(t>=RAID_MOVES[move].end){const order=['knives','rush','roller','blink','knives','world'];raid.index++;raidChoose(order[raid.index%order.length]);}
}
function raidCounter(p){
 if(!raidCounterWindow(p)||p.raidCounterSerial===raid.serial)return false;
 p.raidCounterSerial=raid.serial;
 const event={k:'raid-counter',id:p.id,serial:raid.serial};
 if(raidAuthority())raidAcceptCounter({...event,by:p.owner});else send(event);
 return true;
}
function raidAcceptCounter(e){
 const p=byId(e.id);
 if(!raidAuthority()||e.serial!==raid.serial||e.by!==p?.owner||!raidCounterWindow(p))return;
 raid.counterIds.push(p.id);raidGrantCounter(p);
 raidFx.push({kind:'counter',life:55,id:p.id});
}
function raidGrantCounter(p){
 if(!p||p.raidGrantSerial===raid.serial)return;
 p.raidGrantSerial=raid.serial;clearActs(p);p.kb=p.stn=p.timeStopT=p.domainT=p.spc=p.cd=0;
}
function raidBossDamage(p,damage,meta={}){
 if(!raidActive()||!raidAuthority()||bt.phase!=='play'||!raidCanHurtBoss(p)||!Number.isFinite(damage)||damage<=0)return 0;
 const boss=byId(RAID_BOSS_ID);if(!boss||boss.out)return 0;
 const boosted=raid.move==='world'&&raid.saved&&raid.at>=340?1.65:1;
 const dm=Math.min(boss.raidHp,Math.min(150,damage)*boosted);
 boss.raidHp=Math.max(0,boss.raidHp-dm);boss.d=0;
 addDealt(p.shadowOwner||p.id,dm);
 if(raidWorldStopped()){raid.breakDamage+=dm;if(raid.breakDamage>=RAID_BOSSES.dio.breakHp*(raid.phase===2?1.3:1))raid.saved=true;}
 emitFx({res:'hit',t:boss.id,a:p.id,x:boss.x,y:boss.y-65,kb:3,c:'#dfc777',gain:5,kanekiToken:meta.kanekiToken||null,kanekiPhase:meta.kanekiPhase||0,erenToken:meta.erenToken||null});
 if(boss.raidHp<=0)raidFinish(true,'DIO撃破');
 return dm;
}
function raidPlayerDamage(p,damage,dir=1,force=false){
 if(!raidActive()||!isLocal(p)||p.out||p.raidBoss||!Number.isFinite(damage))return 0;
 if(!force&&(isInvuln(p)||p.inv>0))return 0;
 const dm=Math.min(p.raidHp,Math.max(0,force?damage:armorCut(p,damage)));p.raidHp=Math.max(0,p.raidHp-dm);
 p.d=0;gainKO(p,dm);gainRage(p,dm);erenGain(p,dm*EREN.takenGain);kanekiGain(p,dm*.4);
 clearActs(p);p.erenGrab=p.erenWire=p.erenDash=p.kanekiPull=null;
 p.kb=force?10:Math.min(20,Math.round(dm*.25));p.vx=dir*Math.min(9,dm*.12);p.vy=-4;p.g=false;p.inv=force?60:8;
 flash[p.id]=8;if(p.raidHp<=0)koFighter(p);
 return dm;
}
function raidStrike(kind,spec){
 const e={k:'raid-strike',kind,serial:raid.serial,...spec};raidReceiveStrike({...e,by:byId(RAID_BOSS_ID).owner});if(online)send(e);
}
function raidReceiveStrike(e){
 if(!raidActive()||e.by!==byId(RAID_BOSS_ID)?.owner||!['knives','rush','roller','wave','world','blink'].includes(e.kind))return;
 if(!['x','y','w','h','dm','serial'].every(k=>Number.isFinite(e[k]))||e.w<0||e.w>1200||e.h<0||e.h>675||e.dm<=0||e.dm>300)return;
 if(e.serial<raid.serial||e.serial>raid.serial+1)return;
 // An owner applies a host strike only to their own fighters; HP is never resolved twice.
 raidFx.push({...e,life:e.kind==='roller'?48:e.kind==='world'?65:24});if(raidFx.length>16)raidFx.shift();
 for(const p of raidHeroes()){
  if(!isLocal(p)||p.out)continue;
  const sz=fighterSize(p),left=p.x-16*sz,right=p.x+16*sz,top=p.y-65*sz;
  if(right<e.x||left>e.x+e.w||p.y<e.y||top>e.y+e.h)continue;
  if(e.kind==='knives'&&p.cid==='gojo'){animeEmit(p,'infinity',{life:18});continue;}
  raidPlayerDamage(p,e.dm,e.dir||1,e.kind==='world');
 }
 if(e.kind==='roller'||e.kind==='world'){shake=Math.max(shake,12);noiseHit(.25,.18,300);}else if(e.kind==='knives')tone(1100,450,.12,.06,'triangle');
}
function raidFinish(win,reason){
 if(!raid||raid.result||!raidAuthority())return;
 raid.result=win?'clear':'failed';raid.reason=reason;
 const boss=byId(RAID_BOSS_ID);if(win){boss.out=true;boss.raidHp=0;}
 if(online){roomRef.child('gm').update({ph:'end',w:'',wt:win?1:2,raidResult:raid.result,raidReason:reason}).catch(networkError);}
 bt={phase:'game',t:130,winner:null,winnerTeam:win?1:2};sfxGame();
}

// Boss moves cannot be grabbed, launched out of bounds, or permanently domain locked.
const raidMeleeBase=resolveMelee,raidProjBase=resolveProj,raidHitBase=applyHit,raidArmorBase=armorHit;
resolveMelee=function(A,t){if(raidActive()&&t.raidBoss)return raidBossDamage(byId(A.id),A.mv.dm,A.mv);return raidMeleeBase(A,t);};
resolveProj=function(q,t){if(raidActive()&&t.raidBoss)return raidBossDamage(byId(q.o),q.dm);return raidProjBase(q,t);};
applyHit=function(t,h,bk,id){if(raidActive()){if(sameTeam(byId(id),t))return 0;if(t.raidBoss)return raidBossDamage(byId(id),h.dm);if(t.raidHp!==undefined)return raidPlayerDamage(t,h.dm,h.f);}return raidHitBase(t,h,bk,id);};
armorHit=function(t,h,id){if(raidActive())return applyHit(t,h,false,id);return raidArmorBase(t,h,id);};
const raidMeleeCheckBase=meleeCheck;
meleeCheck=function(p){if(raidActive()&&(p.raidBoss||raidFrozen(p)))return;return raidMeleeCheckBase(p);};
const raidCinematicBase=requestCinematic;
requestCinematic=function(kind,data){if(raidActive()&&kind==='ko'&&data?.t===RAID_BOSS_ID)return;return raidCinematicBase(kind,data);};
const raidPauseBase=pausedObject;
pausedObject=function(id){return raidActive()&&raidWorldStopped()?raidFrozen(byId(id)):raidPauseBase(id);};
const raidStepBase=stepFighter;
stepFighter=function(p,i){
 if(!raidActive())return raidStepBase(p,i);
 if(p.raidBoss)return;
 if(raidCounterWindow(p)&&i.sc!==p.prev.sc&&(i.gd||i.d&&!i.neutralSpecial))raidCounter(p);
 if(raidFrozen(p)){p.prev={...i};return;}
 // A closed arena keeps extreme knockback/recovery moves inside its world bounds.
 const r=raidStepBase(p,i);if(!p.out)p.x=constrain(p.x,25,stage.w-25);return r;
};
const raidKoBase=koFighter,raidRespawnBase=respawn;
koFighter=function(p){if(raidActive()&&p.raidBoss)return;return raidKoBase(p);};
respawn=function(p){const r=raidRespawnBase(p);if(raidActive()&&!p.raidBoss){p.raidHp=RAID_BOSSES.dio.playerHp;p.x=180;p.y=540;}return r;};
const raidTimeBase=animeTimeStop,raidAreaBase=animeArea;
animeTimeStop=function(p){if(raidActive()){if(raidWorldStopped()){raidCounter(p);return;}if(p.cpu)return;}return raidTimeBase(p);};
animeArea=function(e){
 if(!raidActive())return raidAreaBase(e);
 if(['domain','timestop'].includes(e.kind)){
  const p=byId(e.id);if(!p||p.out||raidWorldStopped())return;
  if(raidAuthority()&&((e.kind==='domain'&&p.cid==='gojo')||(e.kind==='timestop'&&p.cid==='jotaro'))){
   // One bounded opening per cast. Allies are never caught in a friendly time stop.
   if(raid.frame>=(raid.nextControl||0)){raid.stun=e.kind==='timestop'?120:75;raid.nextControl=raid.frame+1080;}
  }
  return;
 }
 return raidAreaBase(e);
};
const raidEndBase=checkEnd,raidHostTickBase=hostTick;
checkEnd=function(){if(raidActive())return;return raidEndBase();};
hostTick=function(){if(raidActive())return;return raidHostTickBase();};

// Reuse the existing sequenced fighter transport. No per-frame extra database writes.
const raidStateBase=stateOf,raidOnPBase=onP,raidEventBase=handleGameplayEvent;
stateOf=function(p){const s=raidStateBase(p);if(raidActive()){s.rhp=p.raidHp??0;if(p.raidBoss)s.raid={...raid,counterIds:raid.counterIds.slice()};}return s;};
function raidReadSnapshot(v){
 const r=v?.raid;if(!r||v.rd!==curRound||!RAID_MOVES[r.move]||!['frame','at','serial','phase','breakDamage','stun'].every(k=>Number.isFinite(r[k]))||r.frame<raidLastWire)return;
 if(r.at<0||r.at>600||r.frame<0||r.frame>18001||r.serial<0)return;
 raidLastWire=r.frame;
 const old=raid;
 raid={...r,counterIds:(Array.isArray(r.counterIds)?r.counterIds:[]).filter(id=>byId(id)?.cid==='jotaro').slice(0,4)};
 for(const id of raid.counterIds){const p=byId(id);if(p&&isLocal(p))raidGrantCounter(p);}
 if(old?.serial===raid.serial&&raid.counterIds.length>old.counterIds.length)raidFx.push({kind:'counter',life:45});
}
onP=function(s){
 const f=byId(s.key),v=s.val();const previous=f?.netLastSeq;
 raidOnPBase(s);
 if(!raidActive()||!f?.remote||!v||v.rd!==curRound||f.netLastSeq===previous)return;
 if(Number.isFinite(v.rhp))f.raidHp=constrain(v.rhp,0,f.raidBoss?6400:240);
 if(f.raidBoss&&!isHost)raidReadSnapshot(v);
};
handleGameplayEvent=function(e){
 if(raidActive()){
  if(e.k==='raid-counter'){raidAcceptCounter(e);return;}
  if(e.k==='raid-strike'){raidReceiveStrike(e);return;}
  if(['mh','ph'].includes(e.k)){
   const p=byId(e.k==='mh'?e.a:e.q?.o);if(!p||p.owner!==e.by||!raidCanHurtBoss(p))return;
  }
 }
 return raidEventBase(e);
};

// CPU partners use the same movement/attacks as players, with encounter-specific priorities.
const raidAiBase=aiStep;
aiStep=function(p){
 if(!raidActive()||p.raidBoss)return raidAiBase(p);
 const boss=byId(RAID_BOSS_ID),A=p.ai;
 if(raidCounterWindow(p)&&raid.at>=128+(Number(p.id.slice(-1))||0)*6)raidCounter(p);
 if(raidFrozen(p)){A.inp={...blankInput(),sc:A.inp.sc,ac:A.inp.ac,jc:A.inp.jc};return;}
 if(raidWorldStopped()&&p.cid==='jotaro'){
  // Stop-counter is a raid duty: do not let the PvP AI charge, evade or spend it on a side move.
  const I={...A.inp,l:false,r:false,u:false,d:false,gd:false,a:false,s:false,sideSpecial:0,neutralSpecial:true};
  if(p.ch>0)I.rc++;
  const dx=boss.x-p.x;if(Math.abs(dx)>60)I[dx>0?'r':'l']=true;
  p.f=Math.sign(dx)||p.f;
  if(Math.abs(dx)<110&&!p.kb&&!p.stn&&!p.a&&!p.ch&&!p.sph&&p.spc===0){I.s=true;I.sc++;}
  A.inp=I;return;
 }
 raidAiBase(p);
 const I=A.inp,t=raid.at,move=raid.move;
 const walk=dir=>{I.l=dir<0;I.r=dir>0;};
 const jump=()=>{if(p.g&&raid.frame>=(p.raidJumpAt||0)&&!p.kb&&!p.stn){I.jc++;p.raidJumpAt=raid.frame+40;}};
 if(move==='roller'&&t>=20&&t<125&&Math.abs(p.x-raid.targetX)<195){walk(p.x<raid.targetX?-1:1);I.s=false;I.a=false;}
 else if(move==='roller'&&t>=126&&t<145){jump();}
 else if(move==='rush'&&t>=18&&t<130){
  const inFront=(p.x-boss.x)*raid.dir;
  if(inFront>-35&&inFront<280){walk(-raid.dir);jump();I.s=false;I.a=false;}
 }else if(move==='blink'&&t>20&&t<65&&Math.abs(p.x-raid.targetX)<100){walk(p.x<raid.targetX?-1:1);jump();}
 else if(move==='knives'&&p.cid!=='gojo'){
  if((t>=50&&t<75)||(t>=88&&t<110)||(raid.phase===2&&t>=118&&t<140))jump();
 }
 if(move==='roller'&&raid.phase===2&&t>=157&&t<178)jump();
};

function raidCpuSelect(index,value,onChange,prefix='raid-cpu-'){
 const label=document.createElement('label');label.className='raid-cpu-row';label.textContent='味方CPU '+(index+1);
 const select=document.createElement('select');select.id=prefix+index;select.setAttribute('aria-label','味方CPU '+(index+1)+'のキャラクター');
 const option=(id,name)=>{const o=document.createElement('option');o.value=id;o.textContent=name;select.appendChild(o);};
 option('','ランダム（全キャラ）');for(const id of Object.keys(CHARS))option(id,CHARS[id].name);
 select.value=CHARS[value]?value:'';select.onchange=()=>onChange(select.value);label.appendChild(select);return label;
}
function raidRenderParty(){
 const box=document.getElementById('raid-party');if(!box)return;
 box.innerHTML='<b>味方CPUの編成</b><p>自分＋味方CPUで最大4人。CPUの強さは最強固定。</p><div id="raid-cpu-count" class="seg"></div><div id="raid-cpu-slots"></div><p id="raid-party-warning" role="status"></p>';
 seg('raid-cpu-count',['なし','1人','2人','3人'],()=>raidParty.count,n=>{raidParty.count=n;raidRenderParty();});
 const slots=document.getElementById('raid-cpu-slots');for(let i=0;i<raidParty.count;i++)slots.appendChild(raidCpuSelect(i,raidParty.cids[i],v=>{raidParty.cids[i]=v;raidPartyWarning();}));
 raidPartyWarning();
}
function raidPartyWarning(){
 const ids=[settings.cid,...raidParty.cids.slice(0,raidParty.count)];
 setTxt(document.getElementById('raid-party-warning'),ids.includes('jotaro')?'承太郎編成済み：時止めに対抗できます。':'承太郎がいません。DIOの時止めを中断できず、攻略は極めて困難です。');
}
function raidOpenSolo(){offlineMode='raid';online=false;offlineTour=null;openChars('raid');raidRenderParty();}
const raidOpenCharsBase=openChars;
openChars=function(mode){
 const r=raidOpenCharsBase(mode);
 const party=document.getElementById('raid-party');if(party)party.hidden=!(offlineMode==='raid'&&!online&&mode==='raid');
 if(offlineMode==='raid'&&!online&&mode==='raid'){document.getElementById('chars-next').textContent='DIOに挑む →';raidRenderParty();}
 return r;
};
const raidLobbyBase=renderLobby;
renderLobby=function(){
 raidLobbyBase();if(gmCache?.mode!=='raid')return;
 const humans=lobbyMembers().filter(p=>!p.cpu),g=gmCache;
 const count=Math.min(Math.max(0,4-humans.length),clampInt(g.raidCpuN,0,3,0));
 document.getElementById('lb-mem').innerHTML='<div class="sh">③ 協力メンバー（'+(humans.length+count)+' / 4）</div>'+humans.map(p=>'<div class="mrow"><div class="mk" style="background:#455064">'+CC(p.cid).mark+'</div><div>'+esc(p.label)+' / '+CC(p.cid).name+(p.host?' <span class="tag">HOST</span>':'')+'</div></div>').join('')+Array.from({length:count},(_,i)=>'<div class="mrow"><div class="mk" style="background:#455064">C</div><div>味方CPU '+(i+1)+' / '+esc(CHARS[g.raidCpuCids?.[i]]?.name||'ランダム')+'</div></div>').join('');
 let html='<div class="sh">DIO / 協力ボスバトル</div><p class="raid-lobby-note">最高難度 · 最大4人 · HP 6,400 · 5分<br>承太郎だけが時止め中に反撃可能。全員で同じボスを倒します。</p>';
 html+='<p class="raid-lobby-note">参加者 '+humans.length+'人 ＋ 味方CPU '+count+'人 / 4人</p>';
 if(isHost)html+='<div id="raid-lobby-count" class="seg"></div><div id="raid-lobby-cpus"></div>';
 else for(let i=0;i<count;i++)html+='<p>味方CPU '+(i+1)+'：'+esc(CHARS[g.raidCpuCids?.[i]]?.name||'ランダム')+'</p>';
 html+='<p class="raid-lobby-note">'+(humans.some(p=>p.cid==='jotaro')||Array.from({length:count},(_,i)=>g.raidCpuCids?.[i]).includes('jotaro')?'承太郎編成済み。':'承太郎がいません。時止めを中断できません。')+'</p>';
 document.getElementById('lb-set').innerHTML=html;
 document.getElementById('lb-team-pick').style.display='none';
 if(isHost){
  seg('raid-lobby-count',Array.from({length:Math.min(3,4-humans.length)+1},(_,i)=>i?'CPU '+i+'人':'CPUなし'),()=>count,n=>roomRef.child('gm').update({raidCpuN:n}));
  const slots=document.getElementById('raid-lobby-cpus');for(let i=0;i<count;i++)slots.appendChild(raidCpuSelect(i,g.raidCpuCids?.[i],v=>{const ids=Array.from({length:3},(_,j)=>g.raidCpuCids?.[j]||'');ids[i]=v;roomRef.child('gm').update({raidCpuCids:ids});},'raid-lobby-cpu-'));
  const start=document.getElementById('lb-start');start.className='startbig';start.textContent='DIOに挑む（'+(humans.length+count)+'人編成）';
 }
};
const raidModeHeaderBase=modeHeader;
modeHeader=function(){const r=raidModeHeaderBase();if(raidActive()){document.getElementById('b-char').style.display='none';document.getElementById('mode-hud').style.display='none';}return r;};
const raidCharChangeBase=applyCharChange;
applyCharChange=function(id){if(raidActive())return;return raidCharChangeBase(id);};
const raidBuildBase=buildMenus;
buildMenus=function(){
 raidBuildBase();
 const party=document.createElement('section');party.id='raid-party';party.hidden=true;document.getElementById('cpu-opts').after(party);
 document.getElementById('go-raid').onclick=()=>show('sc-raid');
 document.getElementById('raid-back').onclick=()=>show('sc-mode');
 document.getElementById('raid-solo').onclick=raidOpenSolo;
 document.getElementById('raid-online').onclick=()=>{requestedOnlineMode='raid';show('sc-online');};
 const onlineBack=document.getElementById('online-back').onclick;
 document.getElementById('online-back').onclick=()=>requestedOnlineMode==='raid'?show('sc-raid'):onlineBack();
 const next=document.getElementById('chars-next').onclick,back=document.getElementById('chars-back').onclick;
 document.getElementById('chars-next').onclick=()=>{if(!online&&charMode==='raid'){startBattleOffline();return;}next();};
 document.getElementById('chars-back').onclick=()=>{if(!online&&charMode==='raid'){show('sc-raid');return;}back();};
 const choose=renderChars;renderChars=function(){const r=choose();if(!online&&charMode==='raid')raidPartyWarning();return r;};
 const resultChars=document.getElementById('res-chars').onclick;
 document.getElementById('res-chars').onclick=()=>{if(!online&&offlineMode==='raid')raidOpenSolo();else resultChars();};
 document.getElementById('raid-boss-art').innerHTML=raidDossierSVG();
};

// Boss-only art. DIO and The World have their own silhouettes and attack poses.
function raidDossierSVG(){return `<svg viewBox="0 0 450 600" role="img"><defs><linearGradient id="dio-gold" x2=".8" y2="1"><stop stop-color="#fae7a4"/><stop offset=".5" stop-color="#c69b48"/><stop offset="1" stop-color="#594022"/></linearGradient></defs><g fill="none" stroke="#d0ac6240"><circle cx="225" cy="250" r="180"/><circle cx="225" cy="250" r="155"/><path d="M225 40v420M20 250h410"/>${Array.from({length:12},(_,i)=>`<path d="M225 76v15" transform="rotate(${i*30} 225 250)"/>`).join('')}</g><text x="225" y="548" fill="#b99c64" font-size="10" letter-spacing="8" text-anchor="middle">THE WORLD</text><g transform="translate(280 300) rotate(-8)" opacity=".5"><path d="M-42-98L-65 0-40 67-57 175M37-94L65 0 40 67 62 175" fill="none" stroke="#b3ad85" stroke-width="36"/><path d="M-40-87H40L35 40H-35Z" fill="#898970" stroke="#d1cba6" stroke-width="4"/><ellipse cy="-131" rx="36" ry="44" fill="#c5bb83"/><path d="M-32-140h64M0-170v34M-25-115h50" stroke="#3a423b" stroke-width="10"/><circle cx="-17" cy="-132" r="4" fill="#ec6753"/><circle cx="17" cy="-132" r="4" fill="#ec6753"/></g><g transform="translate(195 320)"><path d="M-29 6L-44 160M27 6l60 148" stroke="#090f18" stroke-width="42"/><path d="M-29 6L-44 160M27 6l60 148" stroke="url(#dio-gold)" stroke-width="29"/><path d="M-44 150l-8 26h-28M86 144l13 24h29" stroke="#657e57" stroke-width="17"/><path d="M-35-116L-52-15-21 34H38L50-18 33-116Z" fill="url(#dio-gold)" stroke="#211e20" stroke-width="5"/><path d="M-17-108L0-40l22-69-6 116h-32Z" fill="#17201f"/><path d="M-36-100L-91-32-123-72M35-98L83-50l36-64" fill="none" stroke="#100f15" stroke-width="30" stroke-linecap="round"/><path d="M-36-100L-91-32-123-72M35-98L83-50l36-64" fill="none" stroke="url(#dio-gold)" stroke-width="22" stroke-linecap="round"/><circle cx="-123" cy="-75" r="14" fill="#d7bb8d"/><circle cx="120" cy="-117" r="14" fill="#d7bb8d"/><ellipse cy="-153" rx="30" ry="40" fill="#d9bd90" stroke="#28201f" stroke-width="4"/><path d="M-30-157l-12-34 19 6 7-26 16 20 23-18 1 24 22 9-20 20-8-15-19 8-16-13Z" fill="url(#dio-gold)"/><path d="M-30-165h59" stroke="#5d825b" stroke-width="9"/><path d="M-7-166q7-13 14 0l-7 8Z" fill="#c7d88f"/><path d="M-21-147l13 2M9-145l13-3" stroke="#392e2a" stroke-width="3"/><path d="M-9-128q11 6 20-1" fill="none" stroke="#694336" stroke-width="2"/><path d="M-43-22h87" stroke="#638260" stroke-width="13"/><path d="M-8-25q8-16 16 0l-8 10Z" fill="#d5d992"/></g><text x="35" y="90" fill="#dfc488" font-size="54" font-family="serif" font-weight="bold" letter-spacing="10">DIO</text><text x="37" y="111" fill="#b3a58c" font-size="9" letter-spacing="4">RAID BOSS / 001</text></svg>`;}
function raidDrawBody(c,x,y,size,stand=false,pose=0,dir=1){
 c.save();c.translate(x,y);c.scale(size*dir,size);c.lineCap='round';c.lineJoin='round';
 const gold=c.createLinearGradient(-35,-105,40,10);gold.addColorStop(0,stand?'#e9dfaa':'#f2d683');gold.addColorStop(.5,stand?'#9eaa8a':'#c69843');gold.addColorStop(1,stand?'#596955':'#71502b');
 const path=(points,col,width)=>{c.beginPath();points.forEach(([xx,yy],i)=>i?c.lineTo(xx,yy):c.moveTo(xx,yy));c.strokeStyle='#10151c';c.lineWidth=width+5;c.stroke();c.strokeStyle=col;c.lineWidth=width;c.stroke();};
 path([[-13,-39],[-19,-17],[-28,0]],gold,14);path([[13,-39],[24,-17],[34,0]],gold,14);
 path([[-30,-2],[-20,-1]],stand?'#a4ac8c':'#78926a',10);path([[29,-2],[42,-2]],stand?'#a4ac8c':'#78926a',10);
 c.fillStyle=gold;c.strokeStyle='#1d2425';c.lineWidth=3;c.beginPath();c.moveTo(-25,-92);c.lineTo(22,-92);c.lineTo(25,-52);c.lineTo(10,-32);c.lineTo(-16,-33);c.lineTo(-27,-52);c.closePath();c.fill();c.stroke();
 c.fillStyle=stand?'#5e705f':'#1c2424';c.beginPath();c.moveTo(-10,-87);c.lineTo(0,-61);c.lineTo(12,-87);c.lineTo(7,-40);c.lineTo(-7,-40);c.fill();
 const armPose=pose>0;
 path([[-23,-84],[-38,-61],[-29,-45]],gold,13);
 path([[23,-84],armPose?[50,-82]:[36,-61],armPose?[75,-88]:[46,-48]],gold,14);
 c.fillStyle=stand?'#cbd1ae':'#dfc096';c.beginPath();c.arc(armPose?78:48,armPose?-88:-48,8,0,Math.PI*2);c.fill();
 c.fillStyle='#78916a';c.fillRect(-25,-48,49,8);c.fillStyle='#d6df9a';c.beginPath();c.moveTo(0,-43);c.lineTo(-7,-50);c.lineTo(0,-54);c.lineTo(7,-50);c.closePath();c.fill();
 c.fillStyle=stand?'#bac5a0':'#dfbf93';c.strokeStyle='#28282a';c.lineWidth=2;c.beginPath();c.ellipse(0,-111,18,24,0,0,Math.PI*2);c.fill();c.stroke();
 if(stand){c.fillStyle='#546858';c.fillRect(-17,-125,34,9);c.fillRect(-3,-135,6,19);c.fillRect(-13,-97,26,6);c.fillStyle='#ef8b75';c.fillRect(-12,-112,7,3);c.fillRect(5,-112,7,3);}
 else{
  c.fillStyle=gold;c.beginPath();[[-18,-113],[-24,-138],[-12,-133],[-10,-150],[1,-137],[16,-148],[15,-134],[28,-132],[19,-113],[10,-125],[0,-120],[-10,-126]].forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.closePath();c.fill();
  c.strokeStyle='#76906a';c.lineWidth=5;c.beginPath();c.moveTo(-17,-121);c.lineTo(16,-121);c.stroke();c.fillStyle='#cfe29b';c.beginPath();c.arc(0,-121,4,0,Math.PI*2);c.fill();
  c.strokeStyle='#473d30';c.lineWidth=2;c.beginPath();c.moveTo(-12,-110);c.lineTo(-5,-108);c.moveTo(5,-108);c.lineTo(12,-111);c.moveTo(-4,-97);c.lineTo(7,-98);c.stroke();
 }
 c.restore();
}
const raidDrawBase=drawFighter;
const raidThemeBase=theme;
theme=function(){return raidActive()?{...themes.metro,top:'#10101a',bottom:'#2c2935',accent:'#c4a86c',name:'CAIRO / DIO RAID'}:raidThemeBase();};
drawFighter=function(p){
 if(!raidActive())return raidDrawBase(p);
 if(p.raidBoss){
  if(p.out)return;const c=drawingContext,t=raid.at,attack=(raid.move==='rush'&&t>=65&&t<130)||(raid.move==='blink'&&t>=60&&t<80);
  c.save();c.globalAlpha=.52;raidDrawBody(c,p.x-p.f*55,p.y-18,1.65,true,attack?1:0,p.f);c.restore();
  if(attack){c.save();c.strokeStyle='#ead39166';c.lineWidth=12;c.lineCap='round';for(let i=0;i<5;i++){const yy=p.y-108+i*15,xx=p.x+p.f*(80+((t+i*7)%28)*3);c.beginPath();c.moveTo(p.x+p.f*20,yy);c.lineTo(xx,yy-9);c.stroke();}c.restore();}
  raidDrawBody(c,p.x,p.y,1.05,false,attack?1:0,p.f);
  c.save();c.textAlign='center';c.font='bold 13px sans-serif';c.fillStyle='#e2c47c';c.fillText('DIO',p.x,p.y-174);c.restore();return;
 }
 const old=visualFrame;
 if(raidFrozen(p)){p.raidPose??=visualFrame;visualFrame=p.raidPose;}else delete p.raidPose;
 try{return raidDrawBase(p);}finally{visualFrame=old;}
};
function raidDangerRect(c,x,y,w,h,color,progress){
 c.save();c.fillStyle=color+'22';c.fillRect(x,y,w,h);c.strokeStyle=color+'aa';c.lineWidth=2;c.setLineDash([12,7]);c.strokeRect(x,y,w,h);c.setLineDash([]);
 c.fillStyle=color+'77';c.fillRect(x,y+h-5,w*constrain(progress,0,1),5);c.restore();
}
const raidPlatformBase=paintPlatforms;
paintPlatforms=function(){
 raidPlatformBase();if(!raidActive()||bt.phase!=='play')return;
 const c=drawingContext,t=raid.at,boss=byId(RAID_BOSS_ID),move=raid.move;
 if(move==='knives'&&t<145){const next=t<75?75:t<110?110:140,lane=next===110?1-raid.lane:raid.lane;if(next===140&&raid.phase!==2)return;raidDangerRect(c,20,lane?490:560,1160,60,'#ed9279',t/next);}
 if(move==='rush'&&t<130)raidDangerRect(c,raid.dir>0?boss.x:boss.x-235,boss.y-130,235,140,'#e96d69',t/65);
 if(move==='blink'&&t<60)raidDangerRect(c,Math.min(boss.x,raid.targetX),raid.targetY-90,Math.abs(boss.x-raid.targetX)+60,95,'#df7f6d',t/60);
 if(move==='roller'&&t<115){raidDangerRect(c,raid.targetX-150,160,300,455,'#e3bd68',t/115);raidDrawRoller(c,raid.targetX,100+Math.max(0,t-65)/50*425,.8);}
 if(move==='roller'&&t>=115&&t<145)raidDangerRect(c,20,566,1160,42,'#ecc576',(t-115)/30);
 if(move==='roller'&&raid.phase===2&&t>=145&&t<178)raidDangerRect(c,20,566,1160,42,'#ecc576',(t-145)/33);
};
function raidDrawRoller(c,x,y,scale){
 c.save();c.translate(x,y);c.scale(scale,scale);c.lineWidth=4;c.strokeStyle='#191f25';
 c.fillStyle='#8d7238';c.fillRect(-135,-108,250,70);c.strokeRect(-135,-108,250,70);c.fillStyle='#b89e58';c.fillRect(-114,-135,114,28);c.strokeRect(-114,-135,114,28);
 c.fillStyle='#2b3e42';c.fillRect(-100,-167,94,35);c.strokeRect(-100,-167,94,35);c.fillStyle='#b8c9bd';c.fillRect(-90,-160,31,20);c.fillRect(-51,-160,33,20);
 c.fillStyle='#535e61';c.beginPath();c.ellipse(60,-25,79,39,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#8d9996';c.beginPath();c.ellipse(64,-28,62,28,0,0,Math.PI*2);c.fill();c.stroke();
 c.fillStyle='#303d3b';c.beginPath();c.arc(-91,-24,32,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#9c946a';c.beginPath();c.arc(-91,-24,17,0,Math.PI*2);c.fill();
 c.strokeStyle='#e4ce86';c.lineWidth=3;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-3+i*22,-95);c.lineTo(-13+i*22,-62);c.stroke();}c.restore();
}
const raidFxBase=paintAnimeFx;
paintAnimeFx=function(){
 raidFxBase();if(!raidActive())return;
 const c=drawingContext;
 if(raidWorldStopped()&&!raid.saved){
  // The knife cage is motionless inside stopped time. Damage resolves on resumption.
  c.save();c.fillStyle='#e0d9c0';c.strokeStyle='#b29469';c.lineWidth=2;
  for(const p of raidHeroes().filter(p=>!p.out&&raidFrozen(p))){for(let i=0;i<6;i++){const a=i*Math.PI/3,x=p.x+Math.cos(a)*80,y=p.y-45+Math.sin(a)*64;c.save();c.translate(x,y);c.rotate(a+Math.PI);c.beginPath();c.moveTo(19,0);c.lineTo(-9,-5);c.lineTo(-7,5);c.closePath();c.fill();c.beginPath();c.moveTo(-8,0);c.lineTo(-21,0);c.stroke();c.restore();}}
  c.restore();
  if(raid.at>=220)raidDrawRoller(c,600,80+(raid.at-220)*2.8,1.05);
 }
 for(const q of raidFx){
  if(q.kind==='knives'){
   c.save();c.fillStyle='#dde8eb';c.strokeStyle='#9aa9a8';c.lineWidth=2;
   for(let i=0;i<15;i++){const x=q.dir>0?1200-(q.life/24)*1450+i*90:(q.life/24)*1450-i*90,y=q.y+15+(i%3)*14;c.beginPath();c.moveTo(x,y);c.lineTo(x-q.dir*30,y-4);c.lineTo(x-q.dir*24,y+5);c.closePath();c.fill();c.beginPath();c.moveTo(x-q.dir*29,y);c.lineTo(x-q.dir*47,y);c.stroke();}c.restore();
  }else if(q.kind==='counter'||q.kind==='break'){
   c.save();const p=byId(q.id)||byId(RAID_BOSS_ID);c.strokeStyle='#c5a6ef';c.lineWidth=4;c.beginPath();c.ellipse(p.x,p.y-55,70+(60-q.life)*3,90+(60-q.life)*2,0,0,Math.PI*2);c.stroke();c.restore();
  }else if(q.kind==='world')raidDrawRoller(c,600,600,1.1);
  else if(q.kind==='roller')raidDrawRoller(c,q.x+150,600+Math.max(0,25-q.life)*.5,1);
  else if(q.kind==='wave'){c.save();c.strokeStyle='#e3b879';c.lineWidth=6;c.beginPath();c.ellipse(600,600,(24-q.life)*40,14,0,Math.PI,Math.PI*2);c.stroke();c.restore();}
 }
};
const raidBackdropBase=paintAnimeBackdrop;
paintAnimeBackdrop=function(){
 raidBackdropBase();if(!raidWorldStopped())return;
 const c=drawingContext;c.save();c.fillStyle='#11132288';c.fillRect(0,0,1200,675);c.strokeStyle='#cfb7fc44';c.lineWidth=2;
 c.beginPath();c.arc(600,260,175,0,Math.PI*2);c.stroke();
 for(let i=0;i<12;i++){const angle=i*Math.PI/6;c.beginPath();c.moveTo(600+Math.sin(angle)*155,260+Math.cos(angle)*155);c.lineTo(600+Math.sin(angle)*170,260+Math.cos(angle)*170);c.stroke();}
 c.translate(600,260);c.rotate(-Math.PI/3);c.beginPath();c.moveTo(0,20);c.lineTo(0,-135);c.stroke();c.restore();
};
function raidHudEnsure(){
 let h=document.getElementById('raid-boss-hud');if(h)return h;
 h=document.createElement('div');h.id='raid-boss-hud';h.innerHTML='<div class="raid-hud-top"><b>DIO <span id="raid-phase"></span></b><span id="raid-health"></span><span id="raid-time"></span></div><div class="raid-hp-track" role="progressbar" aria-label="DIOの体力" aria-valuemin="0" aria-valuemax="6400"><div class="raid-hp-fill"></div></div><div class="raid-hud-move"></div><div class="raid-break-track"><div class="raid-break-fill"></div></div>';
 document.getElementById('wrap').appendChild(h);
 const tip=document.createElement('div');tip.id='raid-hud-tip';tip.className='raid-hud-bottom';tip.setAttribute('role','status');document.getElementById('wrap').appendChild(tip);return h;
}
const raidHudBase=drawHUD;
drawHUD=function(){
 const active=raidActive(),h=raidHudEnsure(),tip=document.getElementById('raid-hud-tip');
 h.style.display=tip.style.display=active?'block':'none';document.getElementById('game').classList.toggle('raid-battle',active);
 if(!active)return raidHudBase();
 const boss=byId(RAID_BOSS_ID),heroes=raidHeroes(),roster=document.getElementById('battle-roster'),key='raid|'+heroes.map(p=>p.id+':'+p.cid).join('|');
 if(hudKey!==key){hudKey=key;roster.style.setProperty('--columns',heroes.length);roster.style.setProperty('--pc-columns',heroes.length);roster.innerHTML=heroes.map(p=>`<div class="hud-card ${p.id===myId?'me':''}"><div class="hud-portrait">${portrait(p.cid)}</div><div class="hud-info"><div class="hud-name">${esc(p.label)}</div><div class="hud-damage"></div></div><div class="hud-stocks"></div><div class="hud-skill"></div><div class="hud-meter"></div><div class="raid-player-track"></div></div>`).join('');}
 heroes.forEach((p,i)=>{const el=roster.children[i];if(!el)return;el.classList.toggle('out',p.out);setTxt(el.querySelector('.hud-damage'),Math.ceil(p.raidHp)+' HP');setTxt(el.querySelector('.hud-stocks'),p.out?'脱落':'残機 '+p.s);const meter=animeHud(p);setTxt(el.querySelector('.hud-skill'),p.out?'観戦中':raidFrozen(p)?'時間停止中':meter?.label||CC(p.cid).name);setVar(el,'--player-hp',p.raidHp/240*100+'%');setVar(el,'--meter',Math.round(meter?.m||0)+'%');});
 setTxt(document.getElementById('raid-health'),Math.ceil(boss.raidHp).toLocaleString()+' / 6,400');
 setTxt(document.getElementById('raid-phase'),raid.phase===2?' / 覚醒':'');
 const seconds=Math.max(0,300-Math.floor(raid.frame/60));setTxt(document.getElementById('raid-time'),Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'));
 setVar(h,'--hp',boss.raidHp/6400*100+'%');h.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',Math.ceil(boss.raidHp));
 const stopped=raidWorldStopped(),p=byId(myId),move=RAID_MOVES[raid.move];
 const label=stopped?(raid.saved?'時止め返し成功 ―― 大技を阻止':raid.counterIds.length?'承太郎、反撃せよ！':'ザ・ワールド ―― 時間停止'):raid.move==='world'&&raid.at>=340?(raid.saved?'全員で総攻撃！ ダメージ ×1.65':'そして時は動き出す ―― 大技発動'):move.name;
 setTxt(h.querySelector('.raid-hud-move'),label);
 h.querySelector('.raid-break-track').style.display=stopped?'block':'none';setVar(h,'--break',Math.max(0,100-raid.breakDamage/(64*(raid.phase===2?1.3:1))*100)+'%');
 setTxt(tip,stopped?(p?.cid==='jotaro'?(raidCounterWindow(p)?'今だ！ 下＋特殊で時止め返し（ゲージ不要）':raid.counterIds.includes(p.id)?'DIOを攻撃して反撃ゲージを削れ！':'ほかの承太郎の反撃を待とう'):'時間停止中 ―― 反撃できるのは承太郎だけ'):raid.move==='roller'&&raid.phase===2?'着地点から離脱 → 衝撃波は2回！ ジャンプで回避':move.hint);
 setTxt(document.getElementById('match-label'),'CO-OP RAID / '+heroes.length+' PLAYERS');setTxt(document.getElementById('match-stage'),'カイロ / 最高難度');
};
const raidControlsBase=updateControlUI;
updateControlUI=function(){const r=raidControlsBase();if(!raidActive())return r;const p=byId(myId);if(raidWorldStopped()){const b=document.getElementById('btn-g');b.classList.toggle('ready',raidCounterWindow(p));setTxt(b.querySelector('small'),raidCounterWindow(p)?'時止め返し！':'時間停止中');setTxt(document.getElementById('combat-hint'),raidFrozen(p)?p?.cid==='jotaro'?'下＋特殊で時止め返し！':'時間停止中：承太郎の反撃を待て':'動けるのは止め返した承太郎だけ。DIOを攻撃！');}return r;};
// Preserve Kaneki's regeneration as HP healing in a raid (same per-life budget/cooldown).
const raidPlayFxBase=playFx;
playFx=function(e,remote){
 const p=byId(e.a),token=e.kanekiToken,seen=p?.kanekiReceipts?.has(token);
 const r=raidPlayFxBase(e,remote);
 if(raidActive()&&p?.cid==='kaneki'&&isLocal(p)&&!p.out&&!seen&&token&&p.kanekiReceipts.has(token)&&p.kanekiHits>=3&&!p.kanekiRegenCd&&p.kanekiHealed<20&&p.raidHp<240){
  const heal=Math.min(4,240-p.raidHp,(20-p.kanekiHealed)*2);p.raidHp+=heal;p.kanekiHealed+=heal/2;p.kanekiHits=0;p.kanekiRegenCd=360;
 }
 return r;
};
const raidResultBase=showResult;
showResult=function(){
 if(!raidActive())return raidResultBase();
 raidResultBase();const win=bt.winnerTeam===1;
 document.getElementById('res-win').textContent=win?'RAID CLEAR':'RAID FAILED';
 document.getElementById('winner-art').innerHTML='';
 document.getElementById('res-list').innerHTML=raidHeroes().map(p=>`<div class="rk"><div class="mk">${CC(p.cid).mark}</div><div>${esc(p.label)} / ${CC(p.cid).name}<div class="result-stats">与ダメージ ${Math.round(p.stats.dealt)} HP ／ 戦闘不能 ${p.stats.deaths}回</div></div></div>`).join('');
 const box=document.getElementById('tour-result');box.style.display='block';box.innerHTML='<h3>'+ (win?'DIOを撃破！':esc(gmCache?.raidReason||raid.reason||'DIOに敗北'))+'</h3><p>ボス残りHP '+Math.ceil(byId(RAID_BOSS_ID).raidHp)+' / 6,400 ／ 経過 '+Math.floor(raid.frame/60)+'秒</p>';
};
