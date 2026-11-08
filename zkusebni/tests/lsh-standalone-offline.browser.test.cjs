#!/usr/bin/env node
/* R9: exercise the actual teacher-catalog single-file HTML download and
 * open each downloaded self-contained card under file:// without network.
 * No real devices or student data; no change to public cards or manifests.
 */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const inventory=JSON.parse(fs.readFileSync(path.join(ROOT,'zkusebni/data/reference-pilots.json'),'utf8'));
const CANDIDATES=inventory.entries.filter(e=>e.selfContainedHtml===true);
assert.ok(CANDIDATES.length>=9,'Expected at least the nine pre-existing self-contained cards');
assert.ok(CANDIDATES.every(e=>e.test==='not-ready'&&e.practice==='preview'));
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'};
let server,origin;
test.before(async()=>{
 server=http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}
  catch{res.writeHead(400);res.end();return}
  if(pathname.endsWith('/'))pathname+='index.html';
  else if(!path.extname(pathname))pathname+='/index.html';
  const dest=path.resolve(ROOT,'.'+pathname);
  if(!dest.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(dest,(err,body)=>{
   if(err){res.writeHead(404);res.end();return}
   res.writeHead(200,{'Content-Type':MIME[path.extname(dest)]||'application/octet-stream',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(body);
  });
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 origin='http://127.0.0.1:'+server.address().port;
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve))});
async function reviewOffline(engine,label,viewport){
 const browser=await engine.launch({headless:true});
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r9-single-file-'));
 const problems=[],verified=[];
 try{
  const online=await browser.newContext({acceptDownloads:true,viewport,serviceWorkers:'block'});
  const catalog=await online.newPage();
  catalog.setDefaultTimeout(16000);
  const response=await catalog.goto(origin+'/zkusebni/reference-karty/',{waitUntil:'domcontentloaded'});
  assert.ok(response&&response.ok(),'Review catalog could not be loaded');
  await catalog.waitForFunction(expected=>document.querySelectorAll('#refList .ref-card').length===expected,
   inventory.entries.length);
  const offline=await browser.newContext({viewport,serviceWorkers:'block'});
  // Linux Playwright WebKit may reject file:// navigation when OS network-offline
  // mode is enabled. For WebKit block every HTTP(S) request instead: the
  // downloaded file remains the only permitted content source.
  if(label==='WebKit')await offline.route(/^https?:/,route=>route.abort());
  else await offline.setOffline(true);
  const student=await offline.newPage();
  student.setDefaultTimeout(16000);
  let unexpectedErrors=[];
  student.on('pageerror',e=>unexpectedErrors.push(String(e)));
  for(const e of CANDIDATES){
   const firstError=unexpectedErrors.length;
   try{
    const card=catalog.locator('#refList .ref-card').filter({
     has:catalog.getByRole('heading',{name:e.title,exact:true})
    });
    assert.equal(await card.count(),1,'Catalog entry missing for '+e.id);
    await card.getByRole('button',{name:/Procvičování/}).click();
    await catalog.locator('#refMode').selectOption('fixed');
    const language=e.languages.includes('es')?'es':'en';
    if(!(await catalog.locator('#refShareLang').isDisabled()))
     await catalog.locator('#refShareLang').selectOption(language);
    await catalog.locator('#refShareLevel').selectOption('B2');
    const url=await catalog.locator('#refUrl').inputValue();
    const chosen=new URL(url);
    assert.equal(chosen.searchParams.get('lang'),language);
    assert.equal(chosen.searchParams.get('level'),'B2');
    assert.equal(chosen.searchParams.get('zamek'),'1');
    assert.equal(chosen.searchParams.get('practice'),'1');
    const pending=catalog.waitForEvent('download',{timeout:30000});
    await catalog.locator('#refSaveHtml').click();
    const download=await pending;
    const target=path.join(temp,e.id+'.html');
    await download.saveAs(target);
    const html=fs.readFileSync(target,'utf8');
    assert.match(html,/window\.LSH_OFFLINE_QS=/,'Downloaded HTML has no offline query bridge');
    assert.match(html,/\/\* LSH-R5 variant bridge:/);
    assert.ok(html.includes(chosen.search),'Offline preset differs from catalog URL');
    const opened=await student.goto(pathToFileURL(target).href,{waitUntil:'domcontentloaded',timeout:45000});
    assert.ok(student.url().startsWith('file:'),'Downloaded HTML was not opened locally');
    if(opened)assert.ok(opened.ok(),'Downloaded HTML could not open');
    if(e.skill==='konverzace'){
     await student.locator('#languageSelect:disabled').waitFor();
     assert.equal(await student.locator('#languageSelect').inputValue(),language);
     assert.equal(await student.locator('#levelSwitch button.active').getAttribute('data-level'),'B2');
     assert.equal(await student.locator('#levelSwitch button:not(:disabled)').count(),0);
     assert.ok((await student.locator('#mainQuestion').innerText()).trim().length>5);
    }else if(e.skill==='cteni'){
     await student.locator('#language:disabled').waitFor();
     assert.equal(await student.locator('#language').inputValue(),language);
     assert.equal(await student.locator('#levels button[aria-pressed="true"]').getAttribute('data-level'),'B2');
     assert.equal(await student.locator('#levels button:not(:disabled)').count(),0);
     assert.ok((await student.locator('#readingBody p').count())>=1);
    }else{
     await student.locator('#levelPills button[data-level]').first().waitFor();
     assert.equal((await student.locator('#heroLevel').innerText()).trim(),'B2');
     assert.equal(await student.locator('#levelPills button:not(:disabled)').count(),0);
     await student.locator('#gistTasks .task').first().waitFor();
    }
    const width=await student.evaluate(()=>({
     viewport:innerWidth,body:document.body.scrollWidth,doc:document.documentElement.scrollWidth
    }));
    assert.ok(Math.max(width.body,width.doc)<=width.viewport+8,
     'Local HTML horizontally overflows: '+JSON.stringify(width));
    assert.equal(unexpectedErrors.length,firstError,
     'Local HTML pageerror: '+unexpectedErrors.slice(firstError).join(' | '));
    verified.push(e.id);
   }catch(error){
    problems.push(e.id+': '+String(error.message||error).slice(0,700));
   }finally{
    await catalog.evaluate(()=>{
     const d=document.getElementById('refDialog');if(d&&d.open)d.close();
    }).catch(()=>{});
   }
  }
  await online.close();
  await offline.close();
 }finally{
  await browser.close();
  fs.rmSync(temp,{recursive:true,force:true,maxRetries:3,retryDelay:80});
 }
 for(const error of problems)console.error('R9 OFFLINE '+label+' '+error);
 console.log('R9 '+label+' verified '+verified.length+'/'+CANDIDATES.length+' downloaded single-file fixed variants');
 assert.deepEqual(problems,[],label+' failed some offline download/locked-variant checks');
 assert.equal(verified.length,CANDIDATES.length);
}
test('R9 standalone offline: Chromium desktop, all self-contained cards',{timeout:360000},
 ()=>reviewOffline(chromium,'Chromium',{width:1366,height:768}));
test('R9 standalone offline: WebKit mobile, all self-contained cards',{timeout:360000},
 ()=>reviewOffline(webkit,'WebKit',{width:390,height:844}));
