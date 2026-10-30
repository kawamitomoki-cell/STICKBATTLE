// Exercise the real menu, snapshots and event handlers in two Chromium pages.
// The room adapter is in-memory; this never writes to the production Firebase database.
const {chromium}=require('/workspace/kaneki-tools/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const pages=[],errors=[];let gm=null;
 for(let i=0;i<2;i++){
  const p=await browser.newPage({viewport:{width:1280,height:900}});pages.push(p);p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',r=>{const u=r.request().url();if(u.includes('p5.min.js'))return r.fulfill({path:'/workspace/kaneki-tools/p5.min.js',contentType:'application/javascript'});if(u.startsWith('http://127.0.0.1:8000'))return r.continue();return r.abort();});
  await p.goto('http://127.0.0.1:8000');await p.waitForFunction(()=>document.querySelector('#char-grid .ci'));await p.evaluate(()=>noLoop());
 }
 const ids=await Promise.all(pages.map(p=>p.evaluate(()=>myId)));
 gm={protocol:await pages[0].evaluate(()=>NET_PROTOCOL),mode:'raid',hostId:ids[0],ph:'lobby',round:0,map:'metro',cpuN:0,raidCpuN:1,raidCpuCids:['gojo'],stocks:2,teamMode:1};
 const mem={[ids[0]]:{cid:'kaneki',label:'HOST',slot:0,protocol:gm.protocol,host:1},[ids[1]]:{cid:'jotaro',label:'GUEST',slot:1,protocol:gm.protocol}};
 for(const [i,p]of pages.entries()){
  await p.exposeFunction('raidTestWrite',async(path,value)=>{
   if(path==='gm'){gm=value;await Promise.all(pages.map(q=>q.evaluate(g=>onGm(g),gm)));}
   if(path==='gm-update'){gm={...gm,...value};await Promise.all(pages.map(q=>q.evaluate(g=>onGm(g),gm)));}
   if(path==='ev')await pages[1-i].evaluate(e=>onEvent(e),value);
   if(path==='p')await pages[1-i].evaluate(data=>{for(const [key,v]of Object.entries(data))onP({key,val:()=>v});},value);
  });
  await p.evaluate(({gm,mem,host,i})=>{
   online=true;isHost=host;gmCache=gm;memCache=mem;gmFirst=false;skipRound=-1;settings.cid=i?'jotaro':'kaneki';
   roomRef={update:async()=>{},child:path=>({set:v=>raidTestWrite(path,v),update:v=>raidTestWrite(path==='gm'?'gm-update':path,v),push:()=>({set:e=>raidTestWrite('ev',e),remove:async()=>{}})})};
   show('sc-lobby');renderLobby();
  },{gm,mem,host:i===0,i});
 }
 assert.equal(await pages[0].locator('#raid-lobby-cpus select').count(),1);
 await pages[0].locator('#lb-start').click();await pages[1].waitForFunction(()=>scene==='battle');
 assert.deepEqual(await pages[0].evaluate(()=>raidHeroes().map(p=>p.cid)),['kaneki','jotaro','gojo']);
 for(const p of pages)await p.evaluate(()=>{bt.phase='play';deltaTime=FIXED_MS;render();});
 await pages[0].evaluate(()=>{raidBeginWorld();raid.at=30;sendLocal();});
 await pages[1].waitForFunction(()=>raid.at===30);
 for(const p of pages)await p.evaluate(()=>{for(let n=0;n<160&&freezeT>0;n++){frameCount++;simulateFrame()}});
 // Real keyboard input from the guest must escape existing hitstun/cooldown on acknowledgment.
 await pages[1].evaluate(()=>{const p=byId(myId);p.spc=99;p.kb=40;});
 await pages[1].keyboard.down('s');await pages[1].keyboard.down('k');await pages[1].evaluate(()=>simulateFrame());
 await pages[0].waitForFunction(()=>raid.counterIds.length===1);
 await pages[0].evaluate(()=>{lastFighterTx.clear();sendLocal();});await pages[1].waitForFunction(()=>raid.counterIds.includes(myId));
 assert.equal(await pages[1].evaluate(()=>byId(myId).spc+byId(myId).kb),0);
 assert.equal(await pages[0].evaluate(()=>raidFrozen(byId(myId))),true);
 await pages[1].evaluate(()=>{freezeT=Math.min(freezeT,32);render();});
 await pages[1].screenshot({path:'/workspace/kaneki-tools/jotaro-world-cutin.png'});
 for(const p of pages)await p.evaluate(()=>{for(let n=0;n<160&&freezeT>0;n++){frameCount++;simulateFrame()}});
 await pages[1].keyboard.up('k');await pages[1].keyboard.up('s');
 await pages[1].evaluate(()=>simulateFrame());
 await pages[1].evaluate(()=>{const p=byId(myId),b=byId(RAID_BOSS_ID);p.x=b.x-70;p.y=b.y;p.g=true;p.groundPl=0;p.f=1;p.prev={...hin};});
 await pages[1].keyboard.down('k');
 await pages[1].evaluate(()=>{for(let n=0;n<38;n++){frameCount++;simulateFrame();}sendLocal();});
 await pages[1].keyboard.up('k');
 await pages[0].waitForFunction(()=>byId(RAID_BOSS_ID).raidHp<6400);
 const hp=await pages[0].evaluate(()=>byId(RAID_BOSS_ID).raidHp);
 await pages[0].evaluate(()=>{lastFighterTx.clear();sendLocal();});await pages[1].waitForFunction(value=>byId(RAID_BOSS_ID).raidHp===value,hp);
 for(const p of pages)await p.evaluate(()=>render());
 await pages[1].screenshot({path:'/workspace/kaneki-tools/raid-network-jotaro-counter.png'});
 // The other player stays frozen even after Jotaro has started dealing damage.
 assert.equal(await pages[0].evaluate(()=>raidFrozen(byId(myId))),true);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({party:3,guestCounter:true,hp,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
