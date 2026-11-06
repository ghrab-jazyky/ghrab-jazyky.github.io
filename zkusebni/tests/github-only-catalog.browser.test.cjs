'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const ORIGIN='http://127.0.0.1:8777',STAGE=ORIGIN+'/zkusebni/';
const ROOT=path.resolve(__dirname,'../..');
const CORE=require('../assets/lsh/v2/core.js');
const CURRENT=JSON.parse(fs.readFileSync(path.join(ROOT,'zkusebni/data/manifest.json'),'utf8'));
const LISTED=CORE.selectCatalogTopics(CURRENT);
const TOTAL=LISTED.length;
const CONVERSATIONS=LISTED.filter(t=>t.skill==='konverzace').length;
const READING=LISTED.filter(t=>t.skill==='cteni').length;
const LISTENING=LISTED.filter(t=>t.skill==='poslech').length;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json',
 '.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
let server;
before(async()=>{
 server=http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,ORIGIN).pathname);}
  catch{res.writeHead(400);res.end();return;}
  if(!pathname.endsWith('/')&&!path.extname(pathname))pathname+='/';
  if(pathname.endsWith('/'))pathname+='index.html';
  const f=path.resolve(ROOT,'.'+pathname);
  if(!f.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(f,(err,body)=>{
   if(err){res.writeHead(404);res.end('Not found');return;}
   res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(body);
  });
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(8777,'127.0.0.1',resolve));
});
after(()=>new Promise(resolve=>server.close(resolve)));
async function exercise(engine,label,viewport){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport,serviceWorkers:'allow',acceptDownloads:true});
  const page=await context.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(STAGE+'vyber/',{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  await page.waitForFunction(n=>document.querySelectorAll('#topicList .topic-card').length===n,TOTAL);
  assert.match(await page.locator('#catalogCount').textContent(),new RegExp(TOTAL+' z '+TOTAL));
  assert.equal(await page.locator('#topicList .demo-chip').count(),0,'Synthetic Reading demo must not be offered');
  assert.equal(await page.locator('#topicList').textContent().then(s=>s.includes('Niva')),false);
  await page.locator('#skillFilter').selectOption('cteni');
  assert.equal(await page.locator('#topicList .topic-card').count(),READING);
  if(!READING) assert.match(await page.locator('#emptyDescription').textContent(),/čtecí karty/);
  await page.locator('#skillFilter').selectOption('poslech');
  assert.equal(await page.locator('#topicList .topic-card').count(),LISTENING);
  await page.locator('#skillFilter').selectOption('konverzace');
  assert.equal(await page.locator('#topicList .topic-card').count(),CONVERSATIONS);
  await page.locator('#langFilter').selectOption('es');
  await page.locator('#levelFilter').selectOption('C2');
  assert.equal(await page.locator('#topicList .topic-card').count(),CONVERSATIONS);
  await page.locator('#topicSearch').fill('nemovitosti');
  assert.equal(await page.locator('#topicList .topic-card').count(),1,
    'Accent-neutral search must find Czech topic without diacritics');
  assert.match(await page.locator('#topicList .topic-card h3').textContent(),/nemovitost/i);
  await page.locator('#topicList .fav-button').click();
  await page.locator('#catalogExtraFilters .favorites-filter').click();
  assert.equal(await page.locator('#topicList .topic-card').count(),1,'Unified favorites should reuse saved Conversation favorites');
  await page.locator('#catalogExtraFilters .favorites-filter').click();
  await page.locator('#topicList .topic-card button').filter({hasText:'Sdílet studentům'}).click();
  await page.locator('#shareDialog[open]').waitFor({state:'visible'});
  assert.equal(await page.locator('#shareLang').inputValue(),'es','Sharing must inherit the teacher language filter');
  assert.equal(await page.locator('#shareLevel').inputValue(),'C2','Sharing must inherit the teacher CEFR filter');
  await page.locator('#shareLock').check();
  const url=new URL(await page.locator('#shareUrl').inputValue());
  assert.equal(url.origin,ORIGIN);
  assert.equal(url.pathname,'/zkusebni/konverzace/ceny-nemovitosti/');
  assert.equal(url.searchParams.get('lang'),'es');
  assert.equal(url.searchParams.get('level'),'C2');
  assert.equal(url.searchParams.get('zamek'),'1');
  const code=(await page.locator('#shareShortCode').textContent()).trim();
  assert.match(code,/^[A-HJ-NP-Z2-9]{4}-ESC2Z$/);
  const svg=page.locator('#qrSlot svg');
  assert.equal(await svg.count(),1,'Embedded QR encoder should generate SVG');
  assert.equal(await page.locator('#downloadQRBtn').isEnabled(),true);
  const dialog=await page.locator('#shareDialog').boundingBox();
  assert.ok(dialog&&dialog.x>=0&&dialog.x+dialog.width<=viewport.width+1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  await page.locator('#shareClose').click();
  // Existing Conversation catalog uses the same accent-normalized search logic.
  await page.goto(STAGE+'konverzace/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(n=>document.querySelectorAll('#topicList .topic-card').length===n,CONVERSATIONS);
  await page.locator('#topicSearch').fill('nemovitosti');
  assert.equal(await page.locator('#topicList .topic-card').count(),1);
  assert.deepEqual(errors,[],label+' JS runtime errors');
  await context.close();
 }finally{await browser.close();}
}
test('GitHub-only unified selector: Chromium desktop filters, QR, short code, preview', {timeout:140000},
 ()=>exercise(chromium,'Chromium desktop',{width:1440,height:900}));
test('GitHub-only unified selector: Chromium mobile viewport', {timeout:140000},
 ()=>exercise(chromium,'Chromium mobile',{width:390,height:844}));
test('GitHub-only unified selector: WebKit mobile viewport', {timeout:140000},
 ()=>exercise(webkit,'WebKit mobile',{width:375,height:812}));
test('R3A synthetic approved Reading enters both catalogues without demo or stale copy', {timeout:140000},async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(20000);
  const synthetic={...structuredClone(CURRENT.topics.find(t=>t.skill==='konverzace')),
   id:'rl-synthetic-approved',skill:'cteni',slug:'approved-synthetic',shortCode:'R3AA',
   title:'Synthetic approved Reading',summary:'Test-only in-memory data',version:'r3a-test-only',
   cardPath:'cteni/approved-synthetic/',status:'PUBLIKOVANO',
   publishedAt:'2026-11-06T07:00:00Z',demo:false};
  const mock={...structuredClone(CURRENT),topics:[...structuredClone(CURRENT.topics),synthetic]};
  CORE.validateManifest(mock);
  await page.route('**/zkusebni/data/manifest.json',route=>route.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify(mock)
  }));
  await page.goto(STAGE+'vyber/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(n=>document.querySelectorAll('#topicList .topic-card').length===n,TOTAL+1);
  assert.match(await page.locator('#unifiedContentStatus').textContent(),/1 schválená karta/);
  await page.locator('#skillFilter').selectOption('cteni');
  assert.equal(await page.locator('#topicList .topic-card').count(),1);
  assert.match(await page.locator('#topicList .topic-card h3').textContent(),/Synthetic approved Reading/);
  assert.equal(await page.locator('#topicList').textContent().then(x=>x.includes('Niva')),false);
  await page.locator('#topicList .topic-card button').filter({hasText:'Sdílet studentům'}).click();
  const url=new URL(await page.locator('#shareUrl').inputValue());
  assert.equal(url.pathname,'/zkusebni/cteni/approved-synthetic/');
  assert.equal(url.searchParams.get('lang'),'en');
  assert.equal(url.searchParams.get('level'),'B1');
  await page.locator('#shareClose').click();
  await page.goto(STAGE+'cteni/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#topicList .topic-card').length===1);
  assert.match(await page.locator('#readingStatus').textContent(),/1 schválená karta/);
  assert.equal(await page.locator('#topicList').textContent().then(x=>x.includes('Niva')),false);
  await context.close();
 }finally{await browser.close();}
});
test('Offline service-worker shell includes unified selector and manifest', {timeout:140000},async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
  const page=await context.newPage();page.setDefaultTimeout(30000);
  await page.goto(STAGE,{waitUntil:'load'});
  const ready=await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return r.scope;});
  assert.equal(ready,STAGE);
  await page.goto(STAGE+'vyber/',{waitUntil:'load'});
  await page.waitForFunction(n=>document.querySelectorAll('#topicList .topic-card').length===n,TOTAL);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(n=>document.querySelectorAll('#topicList .topic-card').length===n,TOTAL);
  assert.match(await page.locator('#catalogCount').textContent(),new RegExp(TOTAL+' z '+TOTAL));
  await context.close();
 }finally{await browser.close();}
});

test('R3B: three separate editorial inventories show reference candidates but never share draft activities', {timeout:140000},async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(30000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const config of [
   {skill:'konverzace',count:1,title:'Human Rights',ref:'Umělá inteligence'},
   {skill:'cteni',count:5,title:'Can Mistakes Help Us Learn?',ref:'Asteroids'},
   {skill:'poslech',count:3,title:'Matthew McConaughey',ref:'Matthew McConaughey'}
  ]){
   const response=await page.goto(STAGE+config.skill+'/',{waitUntil:'domcontentloaded'});
   assert.ok(response&&response.ok(),config.skill+' HTTP');
   await page.waitForFunction(n=>document.querySelectorAll('#editorialInventoryList article.inventory-card').length===n,config.count);
   assert.match(await page.locator('#editorialInventoryList').textContent(),new RegExp(config.title,'i'));
   assert.match(await page.locator('#editorialReferenceCandidate').textContent(),new RegExp(config.ref,'i'));
   assert.equal(await page.locator('#editorialInventoryList a').count(),0,'A pending topic must not link to student HTML');
   assert.equal(await page.locator('#editorialInventoryList button').count(),0,'A pending topic must not show a Share/QR button');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,config.skill+' horizontal overflow');
  }
  assert.deepEqual(errors,[],'Unexpected editorial inventory JavaScript errors');
  await context.close();
 }finally{await browser.close();}
});

test('R3B: editorial Reading inventory remains readable offline after PWA shell precache', {timeout:140000},async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
  const page=await context.newPage();page.setDefaultTimeout(30000);
  await page.goto(STAGE,{waitUntil:'load'});
  const ready=await page.evaluate(async()=>{const reg=await navigator.serviceWorker.ready;return reg.scope;});
  assert.equal(ready,STAGE);
  await page.goto(STAGE+'cteni/',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelectorAll('#editorialInventoryList article.inventory-card').length===5);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#editorialInventoryList article.inventory-card').length===5);
  assert.match(await page.locator('#editorialInventoryList').textContent(),/Can Mistakes Help Us Learn/);
  await context.close();
 }finally{await browser.close();}
});


test('ONLINE TEST: eight real student HTML previews and mobile navigation are reachable under ghrab-jazyky', {timeout:140000},async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();page.setDefaultTimeout(20000);
  const hub=await page.goto(STAGE+'nahledy/',{waitUntil:'domcontentloaded'});
  assert.equal(hub.status(),200);
  assert.match(await page.title(),/Language Skills Hub.*TEST/);
  assert.equal(await page.locator('.preview-card a[href^="./"]').count(),8);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'preview hub mobile overflow');
  const entries=JSON.parse(fs.readFileSync(path.join(ROOT,'zkusebni/data/preview-provenance.json'),'utf8')).entries;
  for(const entry of entries){
   const route=STAGE+entry.file.replace(/index\.html$/,'');
   const response=await page.request.get(route,{timeout:20000});
   assert.equal(response.status(),200,entry.id+' must open at school Pages-equivalent URL');
   assert.match(response.headers()['content-type']||'',/text\/html/,entry.id+' must be HTML');
  }
  // Real source smoke is intentionally shallow: detailed activity-level QA comes next.
  for(const entry of [entries[0],entries[5]]){
   const url=STAGE+entry.file.replace(/index\.html$/,'');
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
   assert.equal(response.status(),200,entry.id+' must render in browser');
   assert.ok((await page.title()).trim().length>8,entry.id+' title should be visible');
  }
  await context.close();
 }finally{await browser.close();}
});


test('R4A teacher QA journal: Chromium and WebKit save notes locally, export, and delete', {timeout:170000},async()=>{
 for(const [engine,label,viewport] of [
  [chromium,'Chromium desktop',{width:1280,height:800}],
  [webkit,'WebKit phone',{width:390,height:844}]
 ]){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport,acceptDownloads:true,serviceWorkers:'block'});
   const page=await context.newPage();page.setDefaultTimeout(20000);
   const errors=[],external=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('request',r=>{if(!r.url().startsWith(ORIGIN))external.push(r.url());});
   const res=await page.goto(STAGE+'revize/',{waitUntil:'domcontentloaded'});
   assert.equal(res.status(),200,label);
   assert.equal(await page.locator('select#level option').count(),6,label+' must offer exactly A1-C2');
   await page.locator('#card').selectOption('cteni-asteroids-v23');
   assert.match(await page.locator('#cardLink').getAttribute('href'),/nahledy\/cteni\/asteroids\/$/);
   await page.locator('#device').selectOption('iPad');
   await page.locator('#browser').selectOption('Safari');
   await page.locator('#language').selectOption('fr');
   await page.locator('#level').selectOption('C1');
   await page.locator('#result').selectOption('CHYBA');
   await page.locator('#notes').fill('Syntetická regresní poznámka bez osobních údajů');
   await page.locator('.qa-check input[value="nacteni"]').check();
   await page.locator('#qaForm button[type="submit"]').click();
   assert.match(await page.locator('#recordCount').textContent(),/^1 uložených záznamů$/);
   assert.match(await page.locator('#savedEntries').textContent(),/Syntetická regresní poznámka/);
   const raw=await page.evaluate(()=>localStorage.getItem('lsh-r4a-local-testing-v1'));
   const saved=JSON.parse(raw);
   assert.equal(saved.length,1);
   assert.equal(saved[0].language,'fr');
   assert.equal(saved[0].level,'C1');
   await page.reload({waitUntil:'domcontentloaded'});
   assert.match(await page.locator('#recordCount').textContent(),/^1 uložených záznamů$/);
   const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.locator('#export').click()
   ]);
   assert.equal(download.suggestedFilename(),'LSH-referencni-testy.json');
   page.on('dialog',dialog=>dialog.accept());
   await page.locator('#removeAll').click();
   assert.match(await page.locator('#recordCount').textContent(),/^0 uložených záznamů$/);
   await page.locator('#card').selectOption('poslech-matthew-v3');
   assert.match(await page.locator('#cardLink').getAttribute('href'),/reference\/poslech\/matthew-mcconaughey\/$/);
   assert.equal(await page.locator('#language').isDisabled(),true,'Listening is English-only');
   assert.equal(await page.locator('#language').inputValue(),'en');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,
    label+' must not have horizontal overflow');
   assert.deepEqual(errors,[],label+' page errors');
   assert.deepEqual(external,[],label+' must not send QA records to external hosts');
   await context.close();
  }finally{await browser.close();}
 }
});


test('R4B Asteroids v2.3 original TEST preview supports direct FR C1, dictionary OFF/ON and responsive layout', {timeout:160000},async()=>{
 for(const [engine,label,viewport] of [
   [chromium,'Chromium desktop',{width:1440,height:900}],
   [webkit,'WebKit mobile',{width:390,height:844}]
 ]){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport,serviceWorkers:'block'});
   const page=await context.newPage();page.setDefaultTimeout(30000);
   const errors=[],external=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!r.url().startsWith(ORIGIN))external.push(r.url());});
   const res=await page.goto(STAGE+'nahledy/cteni/asteroids/?lang=fr&level=C1',{waitUntil:'domcontentloaded'});
   assert.equal(res.status(),200,label);
   await page.waitForFunction(()=>document.querySelectorAll('[role="tab"]').length===7);
   assert.match(await page.title(),/Asteroids.*v2\.3/);
   assert.equal(await page.locator('#language').inputValue(),'fr',label+' direct language link');
   assert.match(await page.locator('#levels button[aria-pressed="true"]').innerText(),/C1/,label+' direct CEFR link');
   assert.equal(await page.locator('#dictionaryToggle').getAttribute('aria-pressed'),'false',label+' original dictionary must default OFF');
   await page.locator('#dictionaryToggle').click();
   assert.equal(await page.locator('#dictionaryToggle').getAttribute('aria-pressed'),'true',label+' dictionary ON');
   await page.locator('#dictionaryToggle').click();
   assert.equal(await page.locator('#dictionaryToggle').getAttribute('aria-pressed'),'false',label+' dictionary OFF again');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,label+' no horizontal overflow');
   await page.goto(STAGE+'nahledy/cteni/asteroids/',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelectorAll('[role="tab"]').length>0);
   assert.equal(await page.locator('#language').inputValue(),'en',label+' default language must reset to English');
   assert.deepEqual(errors,[],label+' page errors');
   assert.deepEqual(external,[],label+' original student HTML must be self-contained');
   await context.close();
  }finally{await browser.close();}
 }
});


test('R4C original Conversation AI reference: public TEST source runs in Chromium and WebKit with correct level, language and mobile layout', {timeout:160000},async()=>{
 for(const [engine,label,viewport] of [
  [chromium,'Chromium desktop',{width:1440,height:900}],
  [webkit,'WebKit mobile-sized',{width:390,height:844}]
 ]){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport,serviceWorkers:'block'});
   const page=await context.newPage();page.setDefaultTimeout(30000);
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const res=await page.goto(STAGE+'reference/konverzace/umela-inteligence/',{waitUntil:'domcontentloaded'});
   assert.equal(res.status(),200,label+' original HTML must load');
   await page.waitForFunction(()=>document.querySelectorAll('#sectionNav button').length===8);
   assert.equal(await page.locator('#languageSelect').inputValue(),'en',label+' fresh default EN');
   assert.equal(await page.locator('#levelSwitch button.active').getAttribute('data-level'),'B2',label+' fresh default B2');
   assert.equal(await page.locator('html').getAttribute('lang'),'en');
   await page.locator('#languageSelect').selectOption('fr');
   await page.locator('#levelSwitch button[data-level="C2"]').click();
   assert.equal(await page.locator('html').getAttribute('lang'),'fr',label+' changed html lang');
   assert.equal(await page.locator('#levelSwitch button.active').getAttribute('data-level'),'C2');
   assert.equal(await page.locator('#sectionNav button').count(),8);
   await page.locator('#sectionNav button').last().click();
   assert.equal(await page.locator('#stationNum').textContent(),'8');
   assert.equal(await page.locator('#questions .question-text').count(),3);
   assert.equal(await page.locator('#questions .question-action').count(),3);
   await page.locator('#questions .question-action').first().click();
   assert.equal(await page.locator('#questions .question-detail').first().isVisible(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,label+' no horizontal overflow');
   assert.deepEqual(errors,[],label+' JS runtime exceptions');
   await context.close();
  }finally{await browser.close();}
 }
});


test('R4D Matthew v3 reference: 3 independent checks, separate optional vocabulary and teacher-reviewed writing', {timeout:170000},async()=>{
 for(const [engine,label,viewport] of [
  [chromium,'Chromium desktop',{width:1366,height:900}],
  [webkit,'WebKit phone-sized',{width:390,height:844}]
 ]){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport,serviceWorkers:'block'});
   const page=await context.newPage();
   page.setDefaultTimeout(25000);
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   const response=await page.goto(STAGE+'reference/poslech/matthew-mcconaughey/',{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200,label+' reference HTTP');
   await page.waitForFunction(()=>document.querySelectorAll('#levelPills button').length===6);
   assert.match(await page.title(),/Listening A1–C2|Listening \| v3/);
   assert.equal(await page.locator('#topLevelText').textContent(),'B2');
   assert.equal(await page.locator('#gistTasks article.task').count(),3);
   assert.equal(await page.locator('#detailTasks article.task').count(),6);
   assert.equal(await page.locator('#factsTasks .short-task').count()+await page.locator('#openTasks .short-task').count(),5);
   for(const [id,heading] of [['gist','FIRST LISTENING'],['detail','SECOND LISTENING'],['evidence','THIRD LISTENING']]){
    assert.match((await page.locator('#'+id+' .section-number').textContent()).toUpperCase(),new RegExp(heading));
   }
   await page.locator('#checkFirstBtn').click();
   assert.match(await page.locator('#firstReview').textContent(),/^0\/3 correct/);
   assert.match(await page.locator('#secondReview').textContent(),/Not checked yet/);
   assert.match(await page.locator('#scoreNumber').textContent(),/—/);
   await page.locator('#checkSecondBtn').click();
   assert.match(await page.locator('#secondReview').textContent(),/^0\/6 correct/);
   assert.match(await page.locator('#scoreNumber').textContent(),/—/);
   await page.locator('#checkThirdBtn').click();
   assert.match(await page.locator('#thirdReview').textContent(),/^Sequence: 0\/6/);
   assert.equal(await page.locator('#scoreNumber').textContent(),'0 / 15');
   assert.match(await page.locator('#reviewSummary').textContent(),/No numerical points assigned to writing/);
   await page.locator('#v-0').selectOption('0');
   await page.locator('#checkVocabBtn').click();
   assert.equal(await page.locator('#scoreNumber').textContent(),'0 / 15','Optional vocabulary never affects core score');
   await page.locator('#levelPills button[data-level="C1"]').click();
   assert.equal(await page.locator('#topLevelText').textContent(),'C1');
   assert.match(await page.locator('#scoreNumber').textContent(),/—/);
   await page.locator('#o-0').fill('Synthetic open answer: only a teacher can evaluate this interpretation.');
   await page.locator('#checkThirdBtn').click();
   assert.match(await page.locator('#openTasks .feedback').first().textContent(),/Teacher review only/);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelectorAll('#levelPills button').length===6);
   assert.equal(await page.locator('#topLevelText').textContent(),'C1');
   assert.match(await page.locator('#o-0').inputValue(),/Synthetic open answer/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,label+' no horizontal overflow');
   assert.deepEqual(errors,[],label+' no JS runtime errors');
   await context.close();
  }finally{await browser.close();}
 }
});
