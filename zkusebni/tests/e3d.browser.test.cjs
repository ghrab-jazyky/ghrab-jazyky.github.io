/* E3D: real browser engine smoke tests against local /zkusebni/ HTTP staging.
   Not a substitute for real iPhone/iPad/Android device UAT. */
'use strict';
const {test,before,after}=require('node:test');
const http=require('node:http');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium,webkit}=require('playwright');
const ORIGIN='http://127.0.0.1:8766';
const ROOT=path.resolve(__dirname,'../..');
let networkBlocked=false;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  if(networkBlocked){req.socket.destroy();return;}
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,ORIGIN).pathname);}catch(_){res.writeHead(400);res.end();return;}
  if(!pathname.endsWith('/')&&!path.extname(pathname))pathname+='/';
  if(pathname.endsWith('/'))pathname+='index.html';
  const file=path.resolve(ROOT,'.'+pathname);
  if(!file.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(error,body)=>{
    if(error){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(body);
  });
});
before(()=>new Promise((resolve,reject)=>server.once('error',reject).listen(8766,'127.0.0.1',resolve)));
after(()=>new Promise(resolve=>server.close(resolve)));
const STAGE=ORIGIN+'/zkusebni/';
const VISITED=STAGE+'konverzace/ceny-nemovitosti/';
const NOT_VISITED=STAGE+'konverzace/rodina/';
function screenshot(name){
  const dir=path.join(process.cwd(),'qa');
  fs.mkdirSync(dir,{recursive:true});
  return path.join(dir,name);
}
test('E3D Chromium: scoped PWA registration, offline shell, visited/unvisited card', {timeout:180000},async()=>{
  const browser=await chromium.launch({headless:true});
  const errors=[];
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
  try{
    const page=await context.newPage();
    page.setDefaultTimeout(20000);
    page.on('pageerror',e=>errors.push(e.message));
    let response=await page.goto(STAGE,{waitUntil:'load'});
    assert.ok(response&&response.ok(),'staging entry HTTP response');
    const manifest=await page.locator('link[rel="manifest"]').getAttribute('href');
    assert.equal(manifest,'manifest.webmanifest');
    const reg=await page.evaluate(async()=>{
      if(!('serviceWorker' in navigator))return null;
      const r=await navigator.serviceWorker.ready;
      return {scope:r.scope,active:!!r.active};
    });
    assert.ok(reg&&reg.active,'Service worker should become active');
    assert.equal(reg.scope,STAGE);
    await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>navigator.serviceWorker&&navigator.serviceWorker.controller!==null,null,{timeout:20000});
    const response2=await page.goto(VISITED,{waitUntil:'domcontentloaded'});
    assert.ok(response2&&response2.ok(),'first card load while online');
    await page.locator('#lshBridgeVocabularyLink').waitFor({state:'visible'});
    // Ensure the service worker had a chance to cache the full HTML response.
    await page.waitForFunction(async()=>{
      if(!('caches' in window))return false;
      return !!(await caches.match(location.pathname,{ignoreSearch:true}));
    },null,{timeout:20000});
    await page.screenshot({path:screenshot('e3d-chromium-online-390.png'),fullPage:true});
    networkBlocked=true;
    await context.setOffline(true);
    response=await page.reload({waitUntil:'domcontentloaded',timeout:30000});
    assert.ok(response&&response.ok(),'cached Conversation card must load offline');
    assert.equal(response.fromServiceWorker(),true,'offline card must be served by the scoped service worker');
    await page.locator('#lshBridgeVocabularyLink').waitFor({state:'visible'});
    assert.ok((await page.locator('#heroTitle').textContent()).length>5);
    response=await page.goto(STAGE+'slovnicek/',{waitUntil:'domcontentloaded',timeout:30000});
    assert.ok(response&&response.ok(),'pre-cached vocabulary shell must load offline');
    await page.locator('#addWordForm').waitFor({state:'visible'});
    response=await page.goto(NOT_VISITED,{waitUntil:'domcontentloaded',timeout:30000});
    assert.ok(response&&response.ok(),'offline fallback must return readable page');
    assert.equal(response.fromServiceWorker(),true,'offline fallback must come from service worker');
    assert.match(await page.locator('h1').textContent(),/zatím není dostupná offline/);
    await page.screenshot({path:screenshot('e3d-chromium-offline-fallback.png'),fullPage:true});
    assert.deepEqual(errors,[],'Unexpected browser JS errors: '+errors.join('; '));
  }finally{
    networkBlocked=false;
    await context.setOffline(false);
    await context.close();
    await browser.close();
  }
});
test('E3D Chromium: missing QR support retains manual short-code entry', {timeout:60000},async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext();
  try{
    await context.addInitScript(()=>{
      Object.defineProperty(window,'BarcodeDetector',{configurable:true,value:undefined});
    });
    const page=await context.newPage();
    await page.goto(STAGE+'k/',{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#openScanner').isDisabled(),true);
    assert.match(await page.locator('#scannerHelp').textContent(),/kód ručně/i);
    await page.locator('#codeInput').fill('ZA7C-ENB2');
    await page.locator('#codeForm button[type="submit"]').click();
    await page.waitForURL(u=>u.pathname==='/zkusebni/konverzace/socialni-media/'&&u.searchParams.get('level')==='B2',{timeout:30000});
    assert.equal(new URL(page.url()).searchParams.get('lang'),'en');
  }finally{await context.close();await browser.close();}
});
test('E3D Chromium: denied camera permission is visible, dialog can close', {timeout:60000},async()=>{
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext();
  try{
    await context.addInitScript(()=>{
      class Detector{static async getSupportedFormats(){return ['qr_code'];}async detect(){return [];}}
      Object.defineProperty(window,'BarcodeDetector',{configurable:true,value:Detector});
      if(navigator.mediaDevices)Object.defineProperty(navigator.mediaDevices,'getUserMedia',{
        configurable:true,value:async()=>{throw new Error('camera permission denied');}});
    });
    const page=await context.newPage();
    await page.goto(STAGE+'k/',{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('#openScanner').isEnabled(),true);
    await page.locator('#openScanner').click();
    await page.waitForFunction(()=>{
      const s=document.getElementById('scanStatus');
      return !!s&&s.textContent.includes('Kamera nebo rozpoznávání');
    },null,{timeout:10000});
    assert.equal(await page.locator('#scanDialog').evaluate(el=>el.open),true);
    await page.locator('#closeScanner').click();
    assert.equal(await page.locator('#scanDialog').evaluate(el=>el.open),false);
    assert.equal(await page.locator('#codeInput').isEnabled(),true);
  }finally{await context.close();await browser.close();}
});
test('E3D Chromium: simulated working camera decodes QR and opens only the local card', {timeout:90000},async()=>{
  const browser=await chromium.launch({headless:true,args:[
    '--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
  const context=await browser.newContext({permissions:['camera']});
  try{
    await context.addInitScript(()=>{
      class Detector{
        static async getSupportedFormats(){return ['qr_code'];}
        async detect(){return [{rawValue:'ZA7C-ENB2'}];}
      }
      Object.defineProperty(window,'BarcodeDetector',{configurable:true,value:Detector});
    });
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(STAGE+'k/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.getElementById('openScanner')?.disabled===false,null,{timeout:15000});
    await page.locator('#openScanner').click();
    await page.waitForURL(u=>u.pathname==='/zkusebni/konverzace/socialni-media/'&&
      u.searchParams.get('lang')==='en'&&u.searchParams.get('level')==='B2',{timeout:45000});
    assert.deepEqual(errors,[],'QR decode page errors: '+errors.join('; '));
  }finally{await context.close();await browser.close();}
});

test('E3D WebKit: staged vocabulary add, persistent reload and QR fallback', {timeout:120000},async()=>{
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  const errors=[];
  try{
    await context.addInitScript(()=>{
      Object.defineProperty(window,'BarcodeDetector',{configurable:true,value:undefined});
    });
    const page=await context.newPage();
    page.setDefaultTimeout(20000);
    page.on('pageerror',e=>errors.push(e.message));
    const response=await page.goto(STAGE+'slovnicek/',{waitUntil:'domcontentloaded'});
    assert.ok(response&&response.ok(),'WebKit vocabulary HTTP');
    await page.locator('#addTerm').fill('curiosity');
    await page.locator('#addTranslation').fill('zvídavost');
    await page.locator('#addSubmit').click();
    await page.waitForFunction(()=>document.getElementById('wordCount')?.textContent==='1',null,{timeout:20000});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.getElementById('wordCount')?.textContent==='1',null,{timeout:20000});
    await page.screenshot({path:screenshot('e3d-webkit-vocabulary-390.png'),fullPage:true});
    await page.goto(STAGE+'k/',{waitUntil:'domcontentloaded'});
    await page.locator('#openScanner').waitFor({state:'visible'});
    assert.equal(await page.locator('#openScanner').isDisabled(),true);
    await page.locator('#codeInput').fill('ZA7C-ENB2');
    await page.locator('#codeForm button[type="submit"]').click();
    await page.waitForURL(u=>u.pathname==='/zkusebni/konverzace/socialni-media/'&&u.searchParams.get('level')==='B2',{timeout:30000});
    assert.deepEqual(errors,[],'WebKit JS errors: '+errors.join('; '));
  }finally{await context.close();await browser.close();}
});
