const {chromium}=require('/workspace/kaneki-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();if(u.includes('p5.min.js'))return r.fulfill({path:'/workspace/kaneki-tools/p5.min.js',contentType:'application/javascript'});if(!u.startsWith('http://127.0.0.1:8000'))return r.abort();return r.continue();});
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>typeof noLoop==='function'&&document.querySelector('canvas'));
 await page.locator('#sc-title').click();
 await page.locator('#go-cpu').click();
 const roster=await page.evaluate(()=>({expected:SPECIAL_IDS.slice(),shown:[...document.querySelectorAll('#char-grid .secret-roster .ci')].map(e=>e.dataset.cid)}));
 for(const id of roster.expected)if(!roster.shown.includes(id))throw Error('Missing SPECIAL selection card: '+id);
 const card=page.locator('#char-grid .ci[data-cid="kaneki"]');
 await card.click();
 const selection=await page.evaluate(()=>({cid:settings.cid,pressed:document.querySelector('#char-grid .ci[data-cid="kaneki"]').getAttribute('aria-pressed'),info:document.getElementById('char-info').textContent}));
 if(selection.cid!=='kaneki'||selection.pressed!=='true'||!selection.info.includes('赫子'))throw Error('Kaneki cannot be selected '+JSON.stringify(selection));
 await page.screenshot({path:'/workspace/kaneki-tools/'+(mobile?'mobile':'desktop')+'-selection.png'});
 console.log(JSON.stringify({mobile,selection:selection.cid,specialCards:roster.shown.length}));
 await page.evaluate(()=>{noLoop();offlineMode='training';trainingAiMode=0;startBattleCommon([{id:myId,cid:'kaneki',owner:myId,label:'金木',cpu:0},{id:'enemy',cid:'karate',owner:myId,label:'敵',cpu:1}],'std',false,3);bt.phase='play';scene='battle';document.querySelectorAll('.screen').forEach(e=>e.classList.remove('active'));const p=byId(myId),t=byId('enemy');p.x=400;p.y=390;p.inv=0;t.x=535;t.y=390;t.inv=0;inputUnfocused=false;render();updateControlUI();});
 // Real keyboard/pointer events go through readHuman; fixed stepping keeps assertions deterministic.
 if(mobile){await page.dispatchEvent('#btn-h','pointerdown',{pointerId:1,pointerType:'touch',isPrimary:true});}else{await page.keyboard.down('ArrowRight');await page.keyboard.down('k');}
 await page.evaluate(()=>{for(let n=0;n<14;n++)simulateFrame();});
 if(mobile)await page.dispatchEvent('#btn-h','pointerup',{pointerId:1,pointerType:'touch'});else{await page.keyboard.up('k');await page.keyboard.up('ArrowRight');}
 const bind=await page.evaluate(()=>({kind:byId(myId).mv?.kind,damage:byId('enemy').d,pull:!!byId('enemy').kanekiPull}));
 if(!bind.pull||bind.damage!==8)throw Error('Bind failed '+JSON.stringify(bind));
 await page.evaluate(()=>{render();updateControlUI();});await page.screenshot({path:'/workspace/kaneki-tools/'+(mobile?'mobile':'desktop')+'-bind.png'});
 await page.evaluate(()=>simulateFrame());
 if(mobile)await page.dispatchEvent('#btn-s','pointerdown',{pointerId:3,pointerType:'touch'});else await page.keyboard.down('k');
 for(let n=0;n<26;n++){
  if(n>0&&n%4===0){if(mobile)await page.dispatchEvent('#btn-s','pointerup',{pointerId:3,pointerType:'touch'});else await page.keyboard.up('k');}
  if(n%4===1){if(mobile)await page.dispatchEvent('#btn-s','pointerdown',{pointerId:3,pointerType:'touch'});else await page.keyboard.down('k');}
  await page.evaluate(()=>simulateFrame());
 }
 if(mobile)await page.dispatchEvent('#btn-s','pointerup',{pointerId:3,pointerType:'touch'});else await page.keyboard.up('k');
 const dance=await page.evaluate(()=>({kind:byId(myId).mv?.kind,damage:byId('enemy').d}));
 if(dance.kind!=='kanekiDance'||dance.damage!==40)throw Error('Dance follow-up failed '+JSON.stringify(dance));
 await page.evaluate(()=>render());await page.screenshot({path:'/workspace/kaneki-tools/'+(mobile?'mobile':'desktop')+'-finisher.png'});
 await page.evaluate(()=>simulateFrame());
 if(mobile)await page.dispatchEvent('#btn-v','pointerdown',{pointerId:4,pointerType:'touch'});else{await page.keyboard.down('w');await page.keyboard.down('k');}
 await page.evaluate(()=>{for(let n=0;n<12;n++)simulateFrame();});
 const rise=await page.evaluate(()=>byId(myId).mv?.kind);
 if(rise!=='kanekiRise')throw Error('Up follow-up failed '+rise);
 if(mobile)await page.dispatchEvent('#btn-v','pointerup',{pointerId:4,pointerType:'touch'});else{await page.keyboard.up('k');await page.keyboard.up('w');}
 console.log(JSON.stringify({mobile,dance,rise}));
 await page.evaluate(()=>{freezeT=0;resetTouch();const p=byId(myId);clearActs(p);p.rec=false;p.spc=70;p.kb=p.stn=p.kanekiFatigue=0;p.x=stage.w/2;p.y=stage.plats[0].y+100;p.g=false;});
 if(mobile)await page.dispatchEvent('#btn-v','pointerdown',{pointerId:5,pointerType:'touch'});else{await page.keyboard.down('w');await page.keyboard.down('k');}
 await page.evaluate(()=>simulateFrame());
 if(mobile)await page.dispatchEvent('#btn-v','pointerup',{pointerId:5,pointerType:'touch'});else{await page.keyboard.up('k');await page.keyboard.up('w');}
 const recovery=await page.evaluate(()=>{const p=byId(myId),start=p.y;let top=start;for(let n=0;n<75;n++){simulateFrame();top=Math.min(top,p.y);}return {climb:start-top,landed:p.g,rec:p.rec};});
 if(recovery.climb<180||!recovery.landed||recovery.rec)throw Error('Recovery failed '+JSON.stringify(recovery));
 console.log(JSON.stringify({mobile,recovery}));
 await page.evaluate(()=>{for(let n=0;n<60;n++)simulateFrame();const p=byId(myId);clearActs(p);p.spc=0;p.kanekiGauge=100;});
 if(mobile)await page.dispatchEvent('#btn-g','pointerdown',{pointerId:2,pointerType:'touch',isPrimary:true});else{await page.keyboard.down('ArrowDown');await page.keyboard.down('k');}
 await page.evaluate(()=>{simulateFrame();for(let n=0;n<48;n++)simulateFrame();render();});
 await page.screenshot({path:'/workspace/kaneki-tools/'+(mobile?'mobile':'desktop')+'-awakening.png'});
 if(mobile)await page.dispatchEvent('#btn-g','pointerup',{pointerId:2,pointerType:'touch'});else{await page.keyboard.up('k');await page.keyboard.up('ArrowDown');}
 await page.evaluate(()=>{for(let n=0;n<45;n++)simulateFrame();render();updateControlUI();});
 const result=await page.evaluate(()=>({time:byId(myId).kanekiTime,overflow:document.documentElement.scrollWidth>innerWidth}));
 await page.screenshot({path:'/workspace/kaneki-tools/'+(mobile?'mobile':'desktop')+'-awake.png'});
 if(!result.time||result.overflow||errors.length)throw Error(JSON.stringify({result,errors}));console.log(JSON.stringify({mobile,bind,...result,errors}));await context.close();
}
await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
