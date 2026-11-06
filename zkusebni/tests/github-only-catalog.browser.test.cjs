'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const ORIGIN='http://127.0.0.1:8777',STAGE=ORIGIN+'/zkusebni/';
const ROOT=path.resolve(__dirname,'../..');
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
  await page.waitForFunction(()=>document.querySelectorAll('#topicList .topic-card').length===21);
  assert.match(await page.locator('#catalogCount').textContent(),/21 z 21/);
  assert.equal(await page.locator('#topicList .demo-chip').count(),0,'Synthetic Reading demo must not be offered');
  assert.equal(await page.locator('#topicList').textContent().then(s=>s.includes('Niva')),false);
  await page.locator('#skillFilter').selectOption('cteni');
  assert.equal(await page.locator('#topicList .topic-card').count(),0);
  assert.match(await page.locator('#emptyDescription').textContent(),/čtecí karty/);
  await page.locator('#skillFilter').selectOption('poslech');
  assert.equal(await page.locator('#topicList .topic-card').count(),0);
  await page.locator('#skillFilter').selectOption('konverzace');
  assert.equal(await page.locator('#topicList .topic-card').count(),21);
  await page.locator('#langFilter').selectOption('es');
  await page.locator('#levelFilter').selectOption('C2');
  assert.equal(await page.locator('#topicList .topic-card').count(),21);
  await page.locator('#topicSearch').fill('nemovitosti');
  assert.equal(await page.locator('#topicList .topic-card').count(),1,
    'Accent-neutral search must find Czech topic without diacritics');
  assert.match(await page.locator('#topicList .topic-card h3').textContent(),/nemovitost/i);
  await page.locator('#topicList .topic-card button').filter({hasText:'Sdílet studentům'}).click();
  await page.locator('#shareDialog[open]').waitFor({state:'visible'});
  await page.locator('#shareLang').selectOption('es');
  await page.locator('#shareLevel').selectOption('C2');
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
  await page.waitForFunction(()=>document.querySelectorAll('#topicList .topic-card').length===21);
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
test('Offline service-worker shell includes unified selector and manifest', {timeout:140000},async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
  const page=await context.newPage();page.setDefaultTimeout(30000);
  await page.goto(STAGE,{waitUntil:'load'});
  const ready=await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return r.scope;});
  assert.equal(ready,STAGE);
  await page.goto(STAGE+'vyber/',{waitUntil:'load'});
  await page.waitForFunction(()=>document.querySelectorAll('#topicList .topic-card').length===21);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#topicList .topic-card').length===21);
  assert.match(await page.locator('#catalogCount').textContent(),/21 z 21/);
  await context.close();
 }finally{await browser.close();}
});
