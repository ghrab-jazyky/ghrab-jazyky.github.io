'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const core=require('../self-check/reading/reading-core.js');
const v=core.variantFromData(core.parseReadingData(fs.readFileSync(path.join(__dirname,'../cteni/asteroids/index.html'),'utf8')),'en','B2');
const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/smart-feedback-asteroids-f1/en-B2.json'),'utf8')).variants['en/B2'];
const candidate='http://127.0.0.1:8765/language-skills-hub/self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B2';
const baseline=candidate.replace(':8765',':8766');
const evidence=process.env.SF_EVIDENCE||'sf-evidence';fs.mkdirSync(evidence,{recursive:true});
const normalizeCopy=s=>s.replace(/^Vytvoreno: .*$/m,'Vytvoreno: [timestamp]');
async function contextFor(browser,tag,options={}){
 const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark',reducedMotion:'reduce',acceptDownloads:true,serviceWorkers:'block'});
 const traffic={before:[],after:[],websocket:[],errors:[],workers:[],readyMs:null};let ready=false;
 context.on('request',req=>{
  if(/^https?:/.test(req.url()))(ready?traffic.after:traffic.before).push({method:req.method(),url:req.url(),type:req.resourceType()});
 });
 context.on('serviceworker',w=>traffic.workers.push(w.url()));
 await context.route('**/*',route=>{
  if(options.badLogo&&route.request().url().includes('/assets/school-logo.png'))return route.abort('failed');
  if(options.badBank&&route.request().url().endsWith('/cteni/asteroids/index.html'))return (async()=>{
   const response=await route.fetch();
   const body=(await response.text()).replace(/<script type="application\/json" id="lsh-smart-feedback-asteroids-v1">[\s\S]*?<\/script>\n/,'');
   await route.fulfill({response,body});
  })();
  return route.continue();
 });
 const page=await context.newPage();
 page.on('pageerror',e=>traffic.errors.push(e.message));page.on('websocket',ws=>traffic.websocket.push({url:ws.url(),afterReady:ready}));
 page.on('worker',w=>traffic.workers.push(w.url()));
 page.on('dialog',d=>d.accept());
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__sfCopy=text;}}}));
 const start=Date.now();await page.goto(options.baseline?baseline:candidate);
 await page.locator('#workspace:not([hidden])').waitFor();
 await page.locator('#loading[hidden]').waitFor({state:'attached'});
 // Baseline did not wait for logo; record every pre-existing bootstrap request.
 if(options.baseline)await page.waitForLoadState('networkidle');
 traffic.readyMs=Date.now()-start;ready=true;
 if(!options.baseline)await context.setOffline(true);
 return {context,page,traffic,async close(){
  fs.writeFileSync(path.join(evidence,tag+'-network.json'),JSON.stringify(traffic,null,2));
  await context.close();
 }};
}
async function answer(page,mode){
 for(let i=0;i<v.questions.length;i++){
  const q=v.questions[i];
  if(mode==='blank'||(mode==='mix'&&i===5))continue;
  const choice=mode==='mix'&&(i===4||q.kind==='gap')?(q.answer+1)%q.choices.length:q.answer;
  const field=page.locator('#questionList fieldset.question').nth(i);
  const skill=await field.evaluate(el=>el.closest('[role="tabpanel"]').dataset.skill);
  await page.locator('#readingSkillTabs [role="tab"][data-skill="'+skill+'"]').click();
  await field.locator('input[type=radio]').nth(choice).check();
 }
}
async function copy(page){
 await page.evaluate(()=>{delete window.__sfCopy;});
 await page.locator('#exportCopy').click();await page.waitForFunction(()=>typeof window.__sfCopy==='string');
 const s=await page.evaluate(()=>window.__sfCopy);assert.equal((s.match(/^Odpoved studenta:/gm)||[]).length,18);
 return normalizeCopy(s);
}
async function download(page,id,kind){
 const pending=page.waitForEvent('download',{timeout:30000});await page.locator(id).click();
 const d=await pending,buf=fs.readFileSync(await d.path());
 if(kind==='pdf'){assert.equal(buf.subarray(0,8).toString('ascii'),'%PDF-1.4');assert.ok(buf.length>10000);}
 else for(const q of v.questions)assert.ok(buf.toString('utf8').includes(q.id),q.id+' missing in CSV');
 return buf;
}
function noNetwork(traffic){assert.deepEqual(traffic.after,[]);assert.deepEqual(traffic.websocket,[]);assert.deepEqual(traffic.workers,[]);assert.deepEqual(traffic.errors,[]);}
async function screenshot(page,name,selector='#results'){await page.locator(selector).screenshot({path:path.join(evidence,name+'.png'),animations:'disabled'});}
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('F1 '+name+' bootstrap parity, mixed ANO, offline exports, responsive screenshots, DONE',{timeout:180000},async()=>{
  const browser=await engine.launch({headless:true});
  let base,flow;
  try{
   base=await contextFor(browser,name+'-baseline',{baseline:true});
   const norm=x=>x.map(r=>r.method+' '+new URL(r.url).pathname+new URL(r.url).search).sort();
   flow=await contextFor(browser,name+'-mixed');
   assert.deepEqual(norm(flow.traffic.before),norm(base.traffic.before),'Bootstrap request multiset changed');
   const {page,traffic}=flow;
   assert.equal(await page.locator('#results').isHidden(),true);
   assert.equal(await page.locator('#resultDetails article').count(),0);
   await answer(page,'mix');await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#resultDetails').getAttribute('data-sf-phase'),'SUMMARY');
   assert.equal(await page.locator('#resultDetails article').count(),0);
   assert.ok(await page.locator('#sfAccept').isVisible());assert.ok(await page.locator('#sfDecline').isVisible());
   await screenshot(page,name+'-summary-dark');
   const before=await copy(page);await download(page,'#exportPdf','pdf');await download(page,'#exportResult','csv');
   await page.locator('#sfAccept').click();
   const cards=page.locator('#resultDetails article.sf-card');
   const expected=v.questions.filter((q,i)=>i===4||i===5||q.kind==='gap');
   assert.equal(await cards.count(),expected.length);
   for(let i=0;i<expected.length;i++){
    const q=expected[i],c=cards.nth(i),f=bank.questions[q.id];
    assert.equal(await c.getAttribute('data-question-id'),q.id);
    assert.match(await c.locator('.sf-number').textContent(),new RegExp('Otázka '+(v.questions.indexOf(q)+1)+'$'));
    assert.ok((await c.textContent()).includes(f.correctWhy));
    for(const ev of f.evidence)assert.ok((await c.textContent()).includes(ev.text));
    if(v.questions.indexOf(q)===5)assert.ok((await c.textContent()).includes(f.unanswered.tip));
    else assert.ok((await c.textContent()).includes(f.distractors[(q.answer+1)%q.choices.length].whyWrong));
   }
   assert.equal(await page.locator('#sfHeading').evaluate(el=>document.activeElement===el),true);
   assert.equal(await copy(page),before);
   await download(page,'#exportPdf','pdf');
   await screenshot(page,name+'-feedback-dark');
   for(const width of [320,390,768,1024,1440]){
    await page.setViewportSize({width,height:1000});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'horizontal overflow '+width);
    if([390,768].includes(width))await screenshot(page,name+'-feedback-'+width);
   }
   await page.locator('#themeButton').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
   await screenshot(page,name+'-feedback-light');
   await page.locator('#sfDone').click();assert.equal(await cards.count(),0);
   assert.equal(await page.locator('#resultDetails').getAttribute('data-sf-phase'),'DONE');
   assert.equal(await copy(page),before);await download(page,'#exportPdf','pdf');
   noNetwork(traffic);
  }finally{if(flow)await flow.close();if(base)await base.close();await browser.close();}
 });
 test('F1 '+name+' decline, perfect, all blank, invalid bank and logo fallback',{timeout:180000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const scenario of [{tag:'decline',mode:'mix',decline:true},{tag:'perfect',mode:'perfect'},{tag:'blank',mode:'blank'},{tag:'bank-failure',mode:'mix',badBank:true},{tag:'logo-failure',mode:'mix',badLogo:true}]){
    const flow=await contextFor(browser,name+'-'+scenario.tag,scenario);
    try{
     const {page,traffic}=flow;await answer(page,scenario.mode);await page.locator('#submitButton').click();
     await page.locator('#results:not([hidden])').waitFor();
     assert.equal(await page.locator('#resultDetails article').count(),0);
     const archive=await copy(page);
     if(scenario.badLogo){
      assert.ok(await page.locator('#exportPdf').isDisabled());assert.ok(await page.locator('#sfPdfUnavailable').isVisible());
     }
     await page.locator(scenario.decline?'#sfDecline':'#sfAccept').click();
     const cards=page.locator('#resultDetails article.sf-card');
     assert.equal(await cards.count(),scenario.decline||scenario.mode==='perfect'?0:scenario.mode==='blank'?18:3);
     if(scenario.badBank)assert.ok(await page.locator('#resultDetails .sf-unavailable').isVisible());
     if(scenario.mode==='perfect')assert.match(await page.locator('#resultDetails').textContent(),/Není co opravovat/);
     assert.equal(await copy(page),archive);
     if(scenario.decline){await download(page,'#exportPdf','pdf');await download(page,'#exportResult','csv');}
     if(['decline','perfect','logo-failure','bank-failure'].includes(scenario.tag))await screenshot(page,name+'-'+scenario.tag);
     noNetwork(traffic);
    }finally{await flow.close();}
   }
  }finally{await browser.close();}
 });
}
