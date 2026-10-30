const {chromium}=require('/workspace/kaneki-tools/node_modules/playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
for(const mobile of [false,true])for(const mode of ['normal','training']){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();if(u.includes('p5.min.js'))return r.fulfill({path:'/workspace/kaneki-tools/p5.min.js',contentType:'application/javascript'});if(u.startsWith('http://127.0.0.1:8000'))return r.continue();return r.abort();});
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>document.querySelector('#char-grid .ci'));await page.evaluate(()=>noLoop());await page.locator('#sc-title').click();
 if(mode==='normal')await page.locator('#go-cpu').click();else{await page.locator('#go-more').click();await page.locator('#extra-training').click();}
 await page.locator('#char-grid [data-cid="kaneki"]').click();
 if(mode==='normal')await page.locator('#seg-cpun button').nth(2).click();
 await page.selectOption('#cpu-fighter-0','eren');
 if(mode==='normal'){await page.selectOption('#cpu-fighter-1','jotaro');await page.selectOption('#cpu-fighter-2','goku');await page.locator('#seg-cpun button').first().click();await page.locator('#seg-cpun button').nth(2).click();if(await page.locator('#cpu-fighter-1').inputValue()!=='jotaro')throw Error('slot choice lost');}
 await page.locator('#chars-next').click();await page.locator('#stage-back').click();
 if(await page.locator('#cpu-fighter-0').inputValue()!=='eren')throw Error('choice lost after back');
 await page.locator('#cpu-fighters').scrollIntoViewIfNeeded();await page.screenshot({path:'/workspace/kaneki-tools/cpu-select-'+mode+'-'+(mobile?'mobile':'desktop')+'.png'});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('horizontal overflow');
 await page.locator('#chars-next').click();await page.locator('#stage-next').click();
 const roster=await page.evaluate(()=>fighters.map(f=>f.cid));const expected=mode==='normal'?['kaneki','eren','jotaro','goku']:['kaneki','eren'];if(JSON.stringify(roster)!==JSON.stringify(expected)||errors.length)throw Error(JSON.stringify({roster,errors}));
 console.log(JSON.stringify({mobile,mode,roster,overflow,errors}));await context.close();
}await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
