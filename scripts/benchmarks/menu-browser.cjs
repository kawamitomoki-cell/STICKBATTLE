const {chromium}=require('/workspace/kaneki-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});for(const [width,height]of [[1440,1000],[390,844],[320,740],[844,390]]){const p=await b.newPage({viewport:{width,height},hasTouch:width<900});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.route('**/*',r=>{const u=r.request().url();if(u.includes('p5.min.js'))return r.fulfill({path:'/workspace/kaneki-tools/p5.min.js',contentType:'application/javascript'});if(u.startsWith('http://127.0.0.1:8000'))return r.continue();return r.abort();});await p.goto('http://127.0.0.1:8000');await p.waitForFunction(()=>document.querySelector('#char-grid .ci'));await p.evaluate(()=>noLoop());
for(const screen of ['title','mode','chars','stage']){
 if(screen==='mode')await p.locator('#title-tap').click();
 if(screen==='chars'){
  await p.locator('#go-cpu').click();
  if(await p.locator('#char-grid .ci').count()!==19)throw Error('missing fighters');
  await p.locator('#fighter-search').fill('KANＥKI');if(await p.locator('#char-grid .ci:visible').count()!==1)throw Error('search');
  await p.locator('[data-roster-filter="normal"]').click();if(await p.locator('#char-grid .ci:visible').count()!==0)throw Error('filter');
  await p.locator('[data-roster-filter="special"]').click();await p.locator('#char-grid [data-cid="kaneki"]').click();
  if(!await p.evaluate(()=>settings.cid==='kaneki'))throw Error('search selection');
  await p.locator('#fighter-search').fill('');await p.locator('[data-roster-filter="all"]').click();
  await p.locator('#char-grid [data-cid="karate"]').focus();await p.keyboard.press('ArrowRight');await p.keyboard.press('Enter');if(!await p.evaluate(()=>settings.cid==='bomber'))throw Error('keyboard selection');
  await p.locator('#char-grid [data-cid="kaneki"]').click();await p.evaluate(()=>document.getElementById('sc-chars').scrollTop=0);
 }
 if(screen==='stage'){
  await p.locator('#chars-next').click();await p.locator('#stage-grid .stc').last().click();
  if(!await p.evaluate(()=>document.querySelector('#menu-arena-preview b').textContent===MAPS[settings.map].name))throw Error('preview');
  if(!(await p.locator('#menu-match-summary').textContent()).includes('金木'))throw Error('summary');
  await p.evaluate(()=>document.getElementById('sc-stage').scrollTop=0);
 }
 const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth||[...document.querySelectorAll('.screen')].filter(e=>getComputedStyle(e).display!=='none').some(e=>e.scrollWidth>e.clientWidth+1));if(overflow)throw Error('Overflow '+width+' '+screen);await p.screenshot({path:'/workspace/kaneki-tools/menu-'+width+'-'+screen+'.png'});
}
await p.locator('#stage-back').click();if(!await p.evaluate(()=>settings.cid==='kaneki'))throw Error('back lost fighter');
await p.locator('#chars-back').click();await p.locator('#go-howto').click();await p.screenshot({path:'/workspace/kaneki-tools/menu-'+width+'-howto.png'});await p.locator('#howto-back').click();await p.locator('#go-online').click();await p.screenshot({path:'/workspace/kaneki-tools/menu-'+width+'-online.png'});if(!await p.locator('#online-create').isVisible())throw Error('online entry');await p.locator('#online-back').click();await p.locator('#go-more').click();await p.locator('#extra-tournament').click();await p.locator('#tour-offline').click();await p.locator('#chars-next').click();await p.locator('#stage-next').click();if(!await p.locator('#tour-preview-start').isVisible())throw Error('tournament entry');
console.log(JSON.stringify({width,height,search:true,keyboard:true,preview:true,tournament:true,errors}));if(errors.length)throw Error('runtime errors');await p.close();}await b.close();})().catch(e=>{console.error(e);process.exit(1)});
