'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const {createHash}=require('node:crypto');
const {AxeBuilder}=require('@axe-core/playwright');
const core=require('./language-skills-hub/self-check/reading/reading-core.js');
const variant=core.variantFromData(core.parseReadingData(fs.readFileSync('language-skills-hub/cteni/asteroids/index.html','utf8')),'en','B2');
const evidence=process.env.SF_EVIDENCE||'audit-evidence';fs.mkdirSync(evidence,{recursive:true});
const url='http://127.0.0.1:8765/language-skills-hub/self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B2';
async function flow(browser,tag,opt,body){
 const ctx=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,serviceWorkers:'block',reducedMotion:'reduce'});
 const traffic={before:[],after:[],errors:[],websocket:[],workers:[],readyMs:null};let ready=false,dismiss=false;
 const held=[];
 ctx.on('request',r=>{if(/^https?:/.test(r.url()))(ready?traffic.after:traffic.before).push({url:r.url(),method:r.method(),type:r.resourceType()})});
 ctx.on('serviceworker',w=>traffic.workers.push(w.url()));
 await ctx.route('**/*',route=>{
  if(opt.logo&&route.request().url().includes('/assets/school-logo.png')){
   if(opt.logo==='corrupt')return route.fulfill({status:200,contentType:'image/png',body:Buffer.from('not a PNG')});
   if(opt.logo==='stall'){held.push(route);return;}
  }
  return route.continue();
 });
 const page=await ctx.newPage();page.on('pageerror',e=>traffic.errors.push(e.message));page.on('websocket',w=>traffic.websocket.push(w.url()));page.on('worker',w=>traffic.workers.push(w.url()));
 page.on('dialog',d=>d.type()==='confirm'&&dismiss?d.dismiss():d.accept());
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{if(window.__failAuditCopy)throw Error('audit copy failure');window.__auditCopy=t;}}}));
 if(opt.finish)await page.addInitScript(()=>{
  Object.defineProperty(window,'LSHSessionUI',{configurable:true,set(api){
   const wrapped={...api,mount(cfg){const r=api.mount(cfg);if(!r)return r;return Object.freeze({...r,finish(){if(window.__auditFailFinish)throw Error('audit injected finish exception');return r.finish();}});}};
   Object.defineProperty(window,'LSHSessionUI',{value:wrapped,configurable:true});
  }});
 });
 try{
  const start=Date.now();await page.goto(url+(opt.finish?'&timer=5&attempt=finalaudit-'+tag:''),{waitUntil:'domcontentloaded'});
  await page.locator('#loading[hidden]').waitFor({state:'attached',timeout:15000});
  if(opt.finish)await page.locator('#sessionStart').click();
  await page.locator('#workspace:not([hidden])').waitFor();
  traffic.readyMs=Date.now()-start;ready=true;
  if(opt.logo==='stall'){assert.ok(held.length>0,'Expected deliberately held bootstrap logo');assert.ok(traffic.readyMs>=4500&&traffic.readyMs<12000,'bounded startup timeout');}
  for(const route of held)await route.abort();
  await ctx.setOffline(true);
  assert.equal(await page.locator('#results').isHidden(),true);
  assert.equal(await page.locator('#resultDetails article').count(),0);
  await body(page,v=>{dismiss=v;},traffic);
  assert.deepEqual(traffic.after,[]);assert.deepEqual(traffic.errors,[]);assert.deepEqual(traffic.websocket,[]);assert.deepEqual(traffic.workers,[]);
 }finally{
  fs.writeFileSync(path.join(evidence,tag+'-network.json'),JSON.stringify(traffic,null,2));
  await page.screenshot({path:path.join(evidence,tag+'.png'),fullPage:true}).catch(()=>{});
  await ctx.close();
 }
}
async function choose(page,mode){
 for(let i=0;i<variant.questions.length;i++){
  const q=variant.questions[i],field=page.locator('fieldset.question').nth(i);
  const skill=await field.evaluate(el=>el.closest('[role=tabpanel]').dataset.skill);
  await page.locator('#readingSkillTabs [role=tab][data-skill="'+skill+'"]').click();
  await field.locator('input[type=radio]').nth(mode==='perfect'?q.answer:(q.answer+1)%q.choices.length).check();
 }
}
async function submit(page){await page.locator('#submitButton').click();await page.locator('#results:not([hidden])').waitFor();assert.equal(await page.locator('#resultDetails').getAttribute('data-sf-phase'),'SUMMARY');assert.equal(await page.locator('#resultDetails article').count(),0);}
async function download(page,id){const pending=page.waitForEvent('download',{timeout:30000});await page.locator(id).click();const dl=await pending;return fs.readFileSync(await dl.path());}
async function copy(page){await page.evaluate(()=>{delete window.__auditCopy});await page.locator('#exportCopy').click();await page.waitForFunction(()=>typeof window.__auditCopy==='string');return page.evaluate(()=>window.__auditCopy);}
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test(name+' all wrong, canceled submit, keyboard and repeated accept, complete archive parity, responsive 200% CSS scaling',{timeout:180000},async()=>{
  const browser=await engine.launch({headless:true});
  try{await flow(browser,name+'-all-wrong',{},async(page,dismiss)=>{
   await choose(page,'wrong');dismiss(true);await page.locator('#submitButton').click();assert.equal(await page.locator('#results').isHidden(),true);assert.equal(await page.locator('#submitButton').isDisabled(),false);dismiss(false);
   await submit(page);assert.match(await page.locator('#scoreSummary .score-value').first().textContent(),/0\s*\/\s*18/);
   await page.evaluate(()=>{Date.now=()=>1795838400000});
   const original=await copy(page),pdf=await download(page,'#exportPdf'),csv=await download(page,'#exportResult');
   assert.equal((original.match(/^Odpoved studenta:/gm)||[]).length,18);
   await page.evaluate(()=>{window.__oldAccept=document.getElementById('sfAccept')});
   await page.locator('#sfAccept').focus();await page.keyboard.press('Enter');
   const cards=page.locator('#resultDetails article.sf-card');assert.equal(await cards.count(),18);
   await page.evaluate(()=>window.__oldAccept.click());assert.equal(await cards.count(),18);
   assert.equal(await page.locator('#sfHeading').evaluate(el=>document.activeElement===el),true);
   assert.equal(await page.locator('#resultDetails').getAttribute('lang'),'cs');
   assert.ok(await page.locator('.sf-quote p[lang=en]').count()>0);
   assert.equal(await copy(page),original);assert.deepEqual(await download(page,'#exportPdf'),pdf);
   for(const [w,h] of [[320,750],[390,844],[844,390],[768,1024],[1024,768],[1440,1000]]){
    await page.setViewportSize({width:w,height:h});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),'overflow '+w+'/'+h);
   }
   await page.evaluate(()=>{document.documentElement.style.zoom='2'});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),'CSS 200% scale overflow');
   await page.locator('#resultDetails').screenshot({path:path.join(evidence,name+'-zoom200.png')});
   await page.evaluate(()=>{document.documentElement.style.zoom=''});
   const accessibility=await new AxeBuilder({page}).include('#resultDetails').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
   fs.writeFileSync(path.join(evidence,name+'-axe.json'),JSON.stringify(accessibility,null,2));
   assert.deepEqual(accessibility.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),[],'Scoped feedback WCAG automated violations');
   await page.locator('#sfDone').click();assert.equal(await cards.count(),0);assert.equal(await copy(page),original);assert.deepEqual(await download(page,'#exportPdf'),pdf);
   for(const data of [csv,await download(page,'#exportResult')])for(const q of variant.questions)assert.ok(data.toString('utf8').includes(q.id));
   await page.evaluate(()=>{window.__failAuditCopy=true;document.execCommand=()=>false});await page.locator('#exportCopy').click();
   await page.waitForFunction(()=>/failed|error|nepoda|chyba/i.test(document.getElementById('exportStatus').textContent));
   assert.equal(await page.locator('#resultDetails').getAttribute('data-sf-phase'),'DONE');assert.deepEqual(await download(page,'#exportPdf'),pdf);
   fs.writeFileSync(path.join(evidence,name+'-archive-parity.json'),JSON.stringify({pdfSha256:createHash('sha256').update(pdf).digest('hex'),pdfBytes:pdf.length,questionCount:18,textParity:true,pdfByteParityWithFixedTimestamp:true,cssZoom200:'simulated',keyboard:true,copyFailureRecovered:true},null,2));
  });}finally{await browser.close();}
 });
 test(name+' 100% and explicit decline preserves complete PDF',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});try{await flow(browser,name+'-perfect-decline',{},async page=>{
   await choose(page,'perfect');await submit(page);assert.match(await page.locator('#scoreSummary .score-value').first().textContent(),/18\s*\/\s*18/);
   await page.locator('#sfDecline').click();assert.equal(await page.locator('#resultDetails').getAttribute('data-sf-phase'),'DECLINED');assert.equal(await page.locator('#resultDetails article').count(),0);
   assert.ok((await download(page,'#exportPdf')).length>10000);
  });}finally{await browser.close();}
 });
 for(const logo of ['corrupt','stall'])test(name+' '+logo+' logo: bounded fallback, no post-READY retry, complete copy and CSV',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});try{await flow(browser,name+'-logo-'+logo,{logo},async page=>{
   await submit(page);assert.ok(await page.locator('#exportPdf').isDisabled());assert.ok(await page.locator('#sfPdfUnavailable').isVisible());
   assert.equal(((await copy(page)).match(/^Odpoved studenta:/gm)||[]).length,18);
   const csv=(await download(page,'#exportResult')).toString('utf8');for(const q of variant.questions)assert.ok(csv.includes(q.id));
   await page.locator('#sfAccept').click();assert.equal(await page.locator('#resultDetails article.sf-card').count(),18);
  });}finally{await browser.close();}
 });
 test(name+' injected timed finish exception preserves answers, never reveals result, successful explicit retry',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});try{await flow(browser,name+'-finish-exception',{finish:true},async page=>{
   const first=page.locator('fieldset.question').first().locator('input').first();await first.check();
   await page.evaluate(()=>{window.__auditFailFinish=true});await page.locator('#submitButton').click();
   assert.equal(await page.locator('#results').isHidden(),true);assert.equal(await page.locator('#submitButton').isDisabled(),false);assert.equal(await first.isChecked(),true);
   await page.evaluate(()=>{window.__auditFailFinish=false});await submit(page);
  });}finally{await browser.close();}
 });
}
