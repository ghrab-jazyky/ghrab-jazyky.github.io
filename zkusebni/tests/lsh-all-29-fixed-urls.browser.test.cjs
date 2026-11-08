#!/usr/bin/env node
/* R9: Verify real teacher catalog -> student URL -> requested locked CEFR
 * on all 29 original pilot cards. Runs only against a disposable HTTP server
 * in CI. NEVER edits a card, enables tests, or opens access to teacher keys.
 * Simulated Playwright Chromium/WebKit is NOT physical Android/iOS signoff.
 */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..');
const PILOTS=JSON.parse(fs.readFileSync(path.join(ROOT,'zkusebni/data/reference-pilots.json'),'utf8'));
const ENTRIES=PILOTS.entries;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml',
 '.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
assert.equal(PILOTS.approvedForTeaching,false);
assert.equal(ENTRIES.length,29,'Known 29-card pilot; separate intake tests cover new cards');
assert.deepEqual(ENTRIES.reduce((m,e)=>(m[e.skill]=(m[e.skill]||0)+1,m),{}),
 {konverzace:21,cteni:5,poslech:3});
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
  fs.readFile(dest,(error,content)=>{
   if(error){res.writeHead(404);res.end('Not found');return}
   res.writeHead(200,{'Content-Type':MIME[path.extname(dest)]||'application/octet-stream',
    'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});
   res.end(content);
  });
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 origin='http://127.0.0.1:'+server.address().port;
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve))});
async function check(engine,label,viewport){
 const browser=await engine.launch({headless:true});
 const failures=[],seen=[],pageErrors=[];
 try{
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  // For core functional tests, block external media/fonts (not an A/V playback test).
  await context.route('**/*',route=>{
   if(route.request().url().startsWith(origin+'/'))return route.continue();
   return route.abort();
  });
  const catalog=await context.newPage(),student=await context.newPage();
  catalog.setDefaultTimeout(16000);student.setDefaultTimeout(18000);
  catalog.on('pageerror',err=>pageErrors.push('catalog: '+String(err)));
  student.on('pageerror',err=>pageErrors.push('student: '+String(err)));
  const res=await catalog.goto(origin+'/zkusebni/reference-karty/',{waitUntil:'domcontentloaded',timeout:30000});
  assert.ok(res&&res.ok(),'Teacher catalog did not load');
  await catalog.waitForFunction(()=>document.querySelectorAll('#refList .ref-card').length===29);
  for(const [index,e] of ENTRIES.entries()){
   const lang=e.languages.includes('es')?'es':'en',level=index%2===0?'A1':'C2';
   const previousErrors=pageErrors.length;
   try{
    // One catalog item (two buttons), never a duplicated test-mode topic.
    const card=catalog.locator('#refList .ref-card').filter({
     has:catalog.getByRole('heading',{name:e.title,exact:true})
    });
    assert.equal(await card.count(),1,'Missing or duplicated catalog title');
    const testButton=card.getByRole('button',{name:/Testování/});
    assert.equal(await testButton.count(),1);
    assert.equal(await testButton.isDisabled(),true,
     'Unapproved test mode must remain disabled');
    await card.getByRole('button',{name:/Procvičování/}).click();
    await catalog.locator('#refMode').selectOption('fixed');
    await catalog.locator('#refShareLang').selectOption(lang);
    await catalog.locator('#refShareLevel').selectOption(level);
    const href=await catalog.locator('#refUrl').inputValue();
    const url=new URL(href);
    assert.equal(url.origin,origin,'Share origin must be same as school staging');
    assert.equal(url.pathname,'/zkusebni/'+e.studentPath,'Share path does not match audited inventory');
    assert.equal(url.searchParams.get('lang'),lang);
    assert.equal(url.searchParams.get('level'),level);
    assert.equal(url.searchParams.get('zamek'),'1');
    assert.equal(url.searchParams.get('practice'),'1');
    assert.equal(await catalog.locator('#refQr svg').count(),1,'Fixed URL QR not generated');
    await catalog.locator('#refClose').click();
    const opened=await student.goto(href,{waitUntil:'domcontentloaded',timeout:45000});
    assert.ok(opened&&opened.ok(),'Student link returned non-2xx');
    if(e.skill==='konverzace'){
     await student.locator('#languageSelect:disabled').waitFor();
     assert.equal(await student.locator('#languageSelect').inputValue(),lang);
     assert.equal(await student.locator('#levelSwitch button.active').getAttribute('data-level'),level);
     assert.equal(await student.locator('#levelSwitch button:not(:disabled)').count(),0);
     assert.ok((await student.locator('#mainQuestion').innerText()).trim().length>5,'Conversation prompt not rendered');
    }else if(e.skill==='cteni'){
     await student.locator('#language:disabled').waitFor();
     assert.equal(await student.locator('#language').inputValue(),lang);
     assert.equal(await student.locator('#levels button[aria-pressed="true"]').getAttribute('data-level'),level);
     assert.equal(await student.locator('#levels button:not(:disabled)').count(),0);
     assert.ok(await student.locator('#readingBody p').count()>0,'Reading text not rendered');
    }else{
     await student.locator('#levelPills button[data-level]').first().waitFor();
     assert.equal((await student.locator('#heroLevel').innerText()).trim(),level);
     assert.equal(await student.locator('#levelPills button:not(:disabled)').count(),0);
     await student.locator('#gistTasks .task').first().waitFor();
    }
    const w=await student.evaluate(()=>({
     viewport:innerWidth,document:document.documentElement.scrollWidth,
     body:document.body.scrollWidth,locked:!!document.getElementById('lshVariantHint')
    }));
    assert.equal(w.locked,true,'Explicit teacher-fixed UI hint missing');
    assert.ok(Math.max(w.document,w.body)<=w.viewport+8,
     'Horizontal overflow at '+viewport.width+'px: '+JSON.stringify(w));
    if(pageErrors.length!==previousErrors)
     assert.fail('JavaScript exception(s): '+pageErrors.slice(previousErrors).join(' | '));
    seen.push(e.id);
   }catch(err){
    failures.push(e.id+': '+String(err&&err.message||err).slice(0,650));
    // A failed card must not leave the next catalog dialog modal-blocked.
    await catalog.evaluate(()=>{
     const d=document.getElementById('refDialog');if(d&&d.open)d.close();
    }).catch(()=>{});
   }
  }
  await context.close();
 }finally{await browser.close()}
 console.log(label+' checked '+seen.length+'/'+ENTRIES.length+' real fixed URLs, QR and student UI');
 for(const message of failures)console.error('R9 '+label+' '+message);
 assert.deepEqual(failures,[],label+' school catalog/student-link failures');
 assert.equal(seen.length,29);
}
test('R9 all 29 pilot topics: Chromium, desktop fixed links and QR', {timeout:900000},
 ()=>check(chromium,'Chromium',{width:1366,height:768}));
test('R9 all 29 pilot topics: WebKit, phone fixed links and QR', {timeout:900000},
 ()=>check(webkit,'WebKit',{width:390,height:844}));
