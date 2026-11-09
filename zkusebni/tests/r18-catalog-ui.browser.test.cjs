#!/usr/bin/env node
/* R18 real-browser accessibility, persistence, responsive and fullscreen smoke.
 * CI only; no production deployment or student data.
 */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');
const site=path.resolve(__dirname,'../../language-skills-hub');
let server,origin;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
 '.svg':'image/svg+xml'};
test.before(async()=>{
 server=http.createServer((req,res)=>{
  let p;
  try{p=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}
  catch(_){res.writeHead(400);res.end();return}
  if(p.endsWith('/'))p+='index.html';
  const full=path.resolve(site,'.'+p);
  if(!full.startsWith(site+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(full,(err,content)=>{
   if(err){res.writeHead(404);res.end();return}
   res.writeHead(200,{'Content-Type':MIME[path.extname(full)]||'application/octet-stream',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(content);
  });
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 origin='http://127.0.0.1:'+server.address().port+'/';
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve))});
async function check(engine,label,width,height){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width,height},locale:'cs-CZ',serviceWorkers:'block'});
  await context.route(/^https?:/,route=>{
   if(new URL(route.request().url()).origin===new URL(origin).origin)return route.continue();
   return route.abort('internetdisconnected');
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.setDefaultTimeout(18000);
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('article.card').first().waitFor({timeout:25000});
  assert.equal(await page.locator('article.card').count(),29);
  assert.equal(await page.locator('nav.menu a').count(),1);
  assert.equal(await page.locator('nav.menu a').first().innerText(),'Jak to funguje');
  assert.equal(await page.locator('nav.menu a[href="../slovnicek/"]').count(),0);
  assert.equal(await page.locator('#themeToggle').getAttribute('aria-label'),'Zapnout denní režim');
  assert.equal(await page.locator('#fullscreenToggle').getAttribute('aria-label'),'Přejít na celou obrazovku');
  const header=await page.locator('header').boundingBox();
  const theme=await page.locator('#themeToggle').boundingBox();
  const full=await page.locator('#fullscreenToggle').boundingBox();
  assert.ok(header&&theme&&full);
  assert.ok(theme.x+theme.width<full.x+full.width,'Fullscreen must be at right');
  assert.ok(full.x+full.width<=width+1,'Fullscreen outside viewport');
  const initial=await page.evaluate(()=>({theme:document.documentElement.dataset.theme,
   background:getComputedStyle(document.body).backgroundColor}));
  assert.equal(initial.theme,'dark');
  await page.locator('#themeToggle').click();
  const after=await page.evaluate(()=>({theme:document.documentElement.dataset.theme,
   background:getComputedStyle(document.body).backgroundColor,
   preference:localStorage.getItem('lsh:catalog-theme:v1'),
   meta:document.querySelector('meta[name=theme-color]').content}));
  assert.equal(after.theme,'light');assert.equal(after.preference,'light');
  assert.equal(after.meta,'#f4f8fc');
  assert.notEqual(after.background,initial.background,'Light theme did not change background');
  assert.equal(await page.locator('#themeToggle').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#themeToggle').getAttribute('aria-label'),'Zapnout noční režim');
  assert.equal(await page.locator('article.card').count(),29,'Theme changed content');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('article.card').first().waitFor();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light',
   'Saved preference not applied at next page load');
  const saved=await page.evaluate(()=>localStorage.getItem('lsh:catalog-theme:v1'));
  assert.equal(saved,'light');
  await page.locator('#themeToggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
  // Controlled deterministic browser API mock tests both enter/exit and event-synchronized labels.
  await page.evaluate(()=>{
   const root=document.documentElement;
   Object.defineProperty(document,'fullscreenElement',{configurable:true,
    get(){return window.__lshMockFullscreen||null;}});
   Object.defineProperty(root,'requestFullscreen',{configurable:true,
    value:()=>{window.__lshMockFullscreen=root;
     document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();}});
   Object.defineProperty(document,'exitFullscreen',{configurable:true,
    value:()=>{window.__lshMockFullscreen=null;
     document.dispatchEvent(new Event('fullscreenchange'));return Promise.resolve();}});
  });
  await page.locator('#fullscreenToggle').click();
  assert.equal(await page.locator('#fullscreenToggle').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#fullscreenToggle').getAttribute('aria-label'),'Ukončit celou obrazovku');
  await page.locator('#fullscreenToggle').click();
  assert.equal(await page.locator('#fullscreenToggle').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#fullscreenToggle').getAttribute('aria-label'),'Přejít na celou obrazovku');
  await page.evaluate(()=>{
   Object.defineProperty(document.documentElement,'requestFullscreen',
    {configurable:true,value:undefined});
  });
  await page.locator('#fullscreenToggle').click();
  assert.match(await page.locator('#toast').innerText(),/fullscreen nepodporuje/);
  assert.equal(await page.locator('#fullscreenToggle').getAttribute('aria-pressed'),'false');
  // Catalog behavior must be unchanged.
  await page.locator('.tab[data-skill="cteni"]').click();
  assert.equal(await page.locator('article.card').count(),5);
  await page.locator('.tab[data-skill="poslech"]').click();
  assert.equal(await page.locator('article.card').count(),3);
  await page.locator('.tab[data-skill="konverzace"]').click();
  assert.equal(await page.locator('article.card').count(),21);
  await page.locator('#language').selectOption('es');
  await page.locator('#level').selectOption('B1');
  const target=page.locator('article.card[data-topic-id="cl-skola"]');
  const url=await target.locator('a.action.primary').getAttribute('href');
  assert.match(url,/lang=es&level=B1&zamek=1&practice=1$/);
  await target.getByRole('button',{name:/QR kód/}).click();
  await page.locator('#qrMount svg').waitFor();
  await page.locator('#qrClose').click();
  const dims=await page.evaluate(()=>({
   viewport:innerWidth,wide:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)
  }));
  assert.ok(dims.wide<=dims.viewport+8,'Horizontal overflow '+JSON.stringify(dims));
  assert.deepEqual(errors,[],'JavaScript runtime failures');
  await context.close();
  console.log('PASS R18 '+label+': light/dark persisted, fullscreen mock + graceful fallback, navigation, 29 cards and filters');
 }finally{await browser.close()}
}
test('R18 Chromium desktop 1366px',{timeout:180000},()=>check(chromium,'Chromium desktop',1366,900));
test('R18 Chromium narrow mobile 320px',{timeout:180000},()=>check(chromium,'Chromium narrow mobile',320,740));
test('R18 WebKit iPhone-sized 390px',{timeout:180000},()=>check(webkit,'WebKit mobile',390,844));
