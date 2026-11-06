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
