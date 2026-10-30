const {chromium}=require('/workspace/kaneki-tools/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:740},{width:844,height:390}]){
  const page=await browser.newPage({viewport,isMobile:viewport.width<700,hasTouch:viewport.width<700}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const u=r.request().url();if(u.includes('p5.min.js'))return r.fulfill({path:'/workspace/kaneki-tools/p5.min.js',contentType:'application/javascript'});if(u.startsWith('http://127.0.0.1:8000'))return r.continue();return r.abort();});
  await page.goto('http://127.0.0.1:8000');await page.waitForSelector('#char-grid .ci',{state:'attached'});await page.evaluate(()=>noLoop());
  await page.locator('#title-tap').click();await page.locator('#go-raid').click();
  assert.equal(await page.evaluate(()=>document.getElementById('sc-raid').scrollWidth>innerWidth),false);
  await page.screenshot({path:'/workspace/kaneki-tools/raid-dossier-'+viewport.width+'.png'});
  await page.locator('#raid-solo').click();await page.locator('[data-cid="kaneki"]').click();
  assert.equal(await page.locator('#raid-cpu-slots select').count(),3);
  await page.locator('#raid-cpu-count button').nth(1).click();assert.equal(await page.locator('#raid-cpu-slots select').count(),1);
  await page.locator('#raid-cpu-count button').nth(3).click();
  for(const [i,cid] of ['jotaro','gojo','eren'].entries())await page.locator('#raid-cpu-'+i).selectOption(cid);
  await page.screenshot({path:'/workspace/kaneki-tools/raid-party-'+viewport.width+'.png'});
  await page.locator('#chars-next').click();
  assert.deepEqual(await page.evaluate(()=>raidHeroes().map(p=>p.cid)),['kaneki','jotaro','gojo','eren']);
  await page.evaluate(()=>{bt.phase='play';deltaTime=FIXED_MS;render();fitArena();});
  await page.screenshot({path:'/workspace/kaneki-tools/raid-battle-'+viewport.width+'.png'});
  await page.evaluate(()=>{raidChoose('world');raid.at=110;render();});
  const frozen=await page.evaluate(()=>{const p=byId(myId),x=p.x;stepFighter(p,{...blankInput(),r:true});return {same:x===p.x,tip:document.getElementById('raid-hud-tip').textContent};});
  assert.equal(frozen.same,true);assert.match(frozen.tip,/承太郎だけ/);
  await page.screenshot({path:'/workspace/kaneki-tools/raid-world-'+viewport.width+'.png'});
  await page.evaluate(()=>{raidCounter(raidHeroes().find(p=>p.cid==='jotaro'));for(let i=0;i<80;i++){frameCount++;simulateFrame();}render();});
  assert.equal(await page.evaluate(()=>raid.counterIds.length),1);
  assert.equal(await page.locator('#b-char').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.getElementById('game').scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({viewport,errors,party:await page.evaluate(()=>raidHeroes().map(p=>[p.cid,p.raidHp]))}));
  await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
