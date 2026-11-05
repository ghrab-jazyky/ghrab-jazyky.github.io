/* E4A real Chromium/WebKit IndexedDB regression, localhost only. */
'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const ORIGIN='http://127.0.0.1:8767';
const FIXTURE=ORIGIN+'/zkusebni/tests/fixtures/reading-e4a.html';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json',
 '.png':'image/png'};
const server=http.createServer((req,res)=>{
 let name;
 try{name=decodeURIComponent(new URL(req.url,ORIGIN).pathname);}catch(_){res.writeHead(400).end();return;}
 if(name.endsWith('/'))name+='index.html';
 const file=path.resolve(ROOT,'.'+name);
 if(!file.startsWith(ROOT+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,content)=>{
  if(err){res.writeHead(404).end('Not found');return;}
  res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(content);
 });
});
before(()=>new Promise((resolve,reject)=>server.once('error',reject).listen(8767,'127.0.0.1',resolve)));
after(()=>new Promise(resolve=>server.close(resolve)));
async function exerciseBrowser(engine,name){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 try{
  const errors=[];
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(FIXTURE,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#fixtureMode')?.textContent?.includes('ready'));
  await page.locator('#fixtureAnswer').fill('first-attempt');
  await page.locator('#fixtureSaveAnswer').click();
  await page.waitForFunction(()=>document.querySelector('#fixtureStatus')?.textContent?.includes('Zapsáno do IndexedDB'));
  await page.locator('#fixtureAnswer').fill('second-attempt');
  await page.locator('#fixtureSaveAnswer').click();
  await page.waitForFunction(async()=>{
    const r=await window.E4A_FIXTURE.restoreAnswers({language:'en',level:'B2'});
    return r.snapshot?.answers?.q1?.value==='second-attempt';
  });
  await page.locator('#fixtureSaveWord').click();
  await page.waitForFunction(async()=>{
    if(!window.E4A_TEST_STORE)window.E4A_TEST_STORE=window.LSH_STORE.createStore({mode:'staging'});
    const words=await window.E4A_TEST_STORE.listWords();
    return words.some(x=>x.term==='horizon');
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#fixtureRestoreAnswer').click();
  await page.waitForFunction(()=>document.querySelector('#fixtureAnswer')?.value==='second-attempt');
  const result=await page.evaluate(async()=>{
   const a=await window.E4A_FIXTURE.restoreAnswers({language:'en',level:'B2'});
   const other=await window.E4A_FIXTURE.restoreAnswers({language:'es',level:'B2'});
   const store=window.LSH_STORE.createStore({mode:'staging'});
   const words=await store.listWords();store.close();
   return{first:a.snapshot.answers.q1.firstAttempt,other:other.snapshot,words};
  });
  assert.equal(result.first,'first-attempt');
  assert.equal(result.other,null);
  assert.ok(result.words.some(x=>x.term==='horizon'&&x.sources.some(s=>s.skill==='cteni')));
  await page.goto(ORIGIN+'/zkusebni/slovnicek/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#wordCount')?.textContent==='1');
  assert.deepEqual(errors,[],name+' browser errors: '+errors.join(';'));
 }finally{await context.close();await browser.close();}
}
test('E4A Chromium: student answers and vocabulary saved in shared IndexedDB', {timeout:120000},
  ()=>exerciseBrowser(chromium,'Chromium'));
test('E4A WebKit: reload and shared vocabulary integration', {timeout:120000},
  ()=>exerciseBrowser(webkit,'WebKit'));
