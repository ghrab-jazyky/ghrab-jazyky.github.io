#!/usr/bin/env node
/* R21 browser tests: teacher choice, QR, clipboard, free/fixed student controls.
 * Chromium desktop, 320px phone and WebKit 390px phone via local HTTP. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,webkit}=require('playwright');
const site=path.resolve(__dirname,'../../language-skills-hub');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8',
 '.svg':'image/svg+xml'};
let server,origin;
test.before(async()=>{
 server=http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}
  catch(_){res.writeHead(400);res.end();return}
  if(pathname.endsWith('/'))pathname+='index.html';
  const full=path.resolve(site,'.'+pathname);
  if(!full.startsWith(site+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(full,(err,buf)=>{
   if(err){res.writeHead(404);res.end();return}
   res.writeHead(200,{'Content-Type':MIME[path.extname(full)]||'application/octet-stream',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(buf);
  });
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 origin='http://127.0.0.1:'+server.address().port+'/';
});
test.after(async()=>{if(server)await new Promise(resolve=>server.close(resolve))});
async function setup(engine,width,height){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width,height},locale:'cs-CZ',
  serviceWorkers:'block',acceptDownloads:true});
 await context.route(/^https?:/,route=>
  new URL(route.request().url()).origin===new URL(origin).origin?
  route.continue():route.abort('internetdisconnected'));
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.setDefaultTimeout(18000);
 return {browser,context,page,errors};
}
async function showSkill(page,skill,params=''){
 const result=await page.goto(origin+'?skill='+skill+params,{waitUntil:'domcontentloaded',timeout:35000});
 assert.equal(result.status(),200);
 await page.locator('article.card').first().waitFor();
}
async function share(page,id){
 const card=page.locator('article.card[data-topic-id="'+id+'"]');
 await card.getByRole('button',{name:/Sdílet se studenty/}).click();
 await page.locator('#qrDialog').waitFor({state:'visible'});
 return card;
}
async function inspectUrl(page){
 const raw=await page.locator('#qrUrl').inputValue();
 return {raw,url:raw?new URL(raw):null};
}
async function noOverflow(page,part){
 const dims=await page.evaluate(()=>({
  screen:innerWidth,body:document.body.scrollWidth,
  root:document.documentElement.scrollWidth,
  dialog:document.getElementById('qrDialog').scrollWidth,
  dialogClient:document.getElementById('qrDialog').clientWidth
 }));
 assert.ok(dims.root<=dims.screen+8&&dims.body<=dims.screen+8,
  'Page overflow '+part+' '+JSON.stringify(dims));
 assert.ok(dims.dialog<=dims.dialogClient+8,
  'Dialog overflow '+part+' '+JSON.stringify(dims));
}
test('R21 Chromium desktop: free, fixed, clipboard, QR SVG and R11 Reading bridge',{timeout:200000},async()=>{
 const {browser,context,page,errors}=await setup(chromium,1366,900);
 try{
  await showSkill(page,'konverzace');
  assert.equal(await page.locator('article.card').count(),21);
  const school=await share(page,'cl-skola');
  assert.equal(await page.locator('#shareFree').isChecked(),true);
  assert.equal(await page.locator('#shareFixedFields').isVisible(),false);
  assert.equal(await page.locator('#qrCopy').isEnabled(),true);
  assert.equal(await page.locator('#qrSave').isEnabled(),true);
  await page.locator('#qrMount svg').waitFor();
  let current=await inspectUrl(page);
  assert.match(current.url.pathname,/\/konverzace\/skola\/index\.html$/);
  assert.deepEqual([...current.url.searchParams.keys()],['practice']);
  assert.equal(current.url.searchParams.get('practice'),'1');
  assert.equal(await page.locator('#qrUrl').getAttribute('readonly'),'');
  // A real, visible textarea must support direct selection (no inert fake URL).
  await page.locator('#qrUrl').click();
  const selected=await page.locator('#qrUrl').evaluate(el=>({
   start:el.selectionStart,end:el.selectionEnd,size:el.value.length
  }));
  assert.equal(selected.start,0);assert.equal(selected.end,selected.size);
  // Guaranteed API-success path for automatic copy.
  await page.evaluate(()=>{
   window.__shareCopied=null;
   Object.defineProperty(navigator,'clipboard',{
    configurable:true,value:{writeText:async s=>{window.__shareCopied=s}}
   });
  });
  await page.locator('#qrCopy').click();
  assert.equal(await page.evaluate(()=>window.__shareCopied),current.raw);
  await page.locator('#shareFixed').check();
  assert.equal(await page.locator('#shareFixedFields').isVisible(),true);
  assert.equal(await page.locator('#shareLanguage').inputValue(),'');
  assert.equal(await page.locator('#shareLevel').inputValue(),'');
  assert.equal(await page.locator('#qrCopy').isDisabled(),true);
  assert.equal(await page.locator('#qrSave').isDisabled(),true);
  assert.equal(await page.locator('#qrUrl').inputValue(),'');
  assert.equal(await page.locator('#qrMount svg').count(),0);
  await page.locator('#shareLanguage').selectOption('es');
  assert.equal(await page.locator('#qrCopy').isDisabled(),true);
  await page.locator('#shareLevel').selectOption('B1');
  assert.equal(await page.locator('#qrCopy').isEnabled(),true);
  assert.equal(await page.locator('#qrSave').isEnabled(),true);
  current=await inspectUrl(page);
  assert.deepEqual([...current.url.searchParams.keys()],['practice','lang','level','zamek']);
  assert.equal(current.url.searchParams.get('lang'),'es');
  assert.equal(current.url.searchParams.get('level'),'B1');
  assert.equal(current.url.searchParams.get('zamek'),'1');
  assert.match(await page.locator('#shareStatus').innerText(),/Zámek je pouze v rozhraní/);
  await page.locator('#qrMount svg').waitFor();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#qrSave').click();
  const download=await downloadPromise;
  assert.match(download.suggestedFilename(),/QR\.svg$/);
  await page.locator('#qrCopy').click();
  assert.equal(await page.evaluate(()=>window.__shareCopied),current.raw);
  await page.locator('#shareFree').check();
  const reverted=await inspectUrl(page);
  assert.deepEqual([...reverted.url.searchParams.keys()],['practice']);
  assert.equal(await page.locator('#qrMount svg').count(),1);
  await page.locator('#qrClose').click();
  await share(page,'cl-rodina');
  assert.equal(await page.locator('#shareFree').isChecked(),true,'Sharing must reset per card');
  const nextCard=await inspectUrl(page);
  assert.match(nextCard.url.pathname,/\/konverzace\/rodina\/index\.html$/);
  await page.locator('#qrClose').click();
  // Filters prefill fixed choices but may NEVER implicitly force student lock.
  await page.locator('#language').selectOption('es');
  await page.locator('#level').selectOption('B2');
  await share(page,'cl-skola');
  assert.equal(await page.locator('#shareFree').isChecked(),true);
  assert.equal(await page.locator('#shareLanguage').inputValue(),'es');
  assert.equal(await page.locator('#shareLevel').inputValue(),'B2');
  const freePreset=await inspectUrl(page);
  assert.deepEqual([...freePreset.url.searchParams.keys()],['practice']);
  await page.locator('#shareFixed').check();
  const fixedPreset=await inspectUrl(page);
  assert.equal(fixedPreset.url.searchParams.get('lang'),'es');
  assert.equal(fixedPreset.url.searchParams.get('level'),'B2');
  await page.locator('#qrClose').click();
  await page.locator('#changeLab').click();
  await page.locator('[data-choose-skill="cteni"]').click();
  await page.locator('article.card').first().waitFor();
  assert.equal(await page.locator('article.card').count(),5);
  await share(page,'rl-email-friend');
  await page.locator('#shareFixed').check();
  await page.locator('#shareLanguage').selectOption('fr');
  await page.locator('#shareLevel').selectOption('C2');
  const reading=await inspectUrl(page);
  assert.match(reading.url.pathname,/\/r11\/variant-copies\/rl-email-friend\.html$/);
  assert.equal(reading.url.searchParams.get('lang'),'fr');
  assert.equal(reading.url.searchParams.get('level'),'C2');
  assert.equal(reading.url.searchParams.get('zamek'),'1');
  await noOverflow(page,'desktop');
  assert.deepEqual(errors,[]);
  await context.close();
 }finally{await browser.close()}
 console.log('PASS R21 Chromium: free/fixed URLs, exact QR, clipboard, SVG download, per-card reset and R11 Reading');
});
test('R21 WebKit mobile: fixed Reading controls, free reselect, manual-copy fallback',{timeout:150000},async()=>{
 const {browser,context,page,errors}=await setup(webkit,390,844);
 try{
  await showSkill(page,'cteni','&lang=fr&level=C2');
  assert.equal(await page.locator('article.card').count(),5);
  assert.equal(await page.locator('article.card[data-topic-id="rl-email-friend"] h3').innerText(),'Un courriel d\'un ami');
  await share(page,'rl-email-friend');
  assert.equal(await page.locator('#shareFree').isChecked(),true);
  const free=await inspectUrl(page);
  assert.deepEqual([...free.url.searchParams.keys()],['practice']);
  assert.equal(await page.locator('#shareLanguage').inputValue(),'fr');
  assert.equal(await page.locator('#shareLevel').inputValue(),'C2');
  await noOverflow(page,'WebKit 390px free');
  // Clipboard permission denied/unavailable must keep text selected for manual copy.
  await page.evaluate(()=>{
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});
   document.execCommand=()=>false;
  });
  await page.locator('#qrCopy').click();
  assert.match(await page.locator('#toast').innerText(),/Odkaz je označen/);
  assert.equal(await page.locator('#qrUrl').evaluate(el=>el.selectionEnd),free.raw.length);
  await page.locator('#shareFixed').check();
  const fixed=await inspectUrl(page);
  assert.equal(fixed.url.searchParams.get('lang'),'fr');
  assert.equal(fixed.url.searchParams.get('level'),'C2');
  assert.equal(fixed.url.searchParams.get('zamek'),'1');
  await noOverflow(page,'WebKit 390px fixed');
  await page.locator('#qrClose').click();
  // Inspect actual students' Reading card. No filters on free URL; fixed disables both.
  await page.goto(free.raw,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#language').waitFor();
  assert.equal(await page.locator('#language').isEnabled(),true);
  assert.equal(await page.locator('#levels button[data-level="A1"]').isEnabled(),true);
  await page.goto(fixed.raw,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#language').waitFor();
  assert.equal(await page.locator('#language').inputValue(),'fr');
  assert.equal(await page.locator('#language').isDisabled(),true);
  assert.equal(await page.locator('#levels button[data-level="A1"]').isDisabled(),true);
  assert.equal(await page.locator('#levels button[data-level="C2"]').isDisabled(),true);
  assert.deepEqual(errors,[]);
  await context.close();
 }finally{await browser.close()}
 console.log('PASS R21 WebKit 390px: manual copy, zero overflow, free language switching, UI-only teacher lock');
});
test('R21 Chromium 320px: EN-only listening, R18 theme and optional preset status',{timeout:125000},async()=>{
 const {browser,context,page,errors}=await setup(chromium,320,740);
 try{
  await showSkill(page,'poslech');
  assert.equal(await page.locator('article.card').count(),3);
  await share(page,'ll-harrison-ford');
  assert.equal(await page.locator('#shareFree').isChecked(),true);
  const free=await inspectUrl(page);
  assert.match(free.url.pathname,/\/r11\/variant-copies\/ll-harrison-ford\.html$/);
  assert.deepEqual([...free.url.searchParams.keys()],['practice']);
  assert.match(await page.locator('#shareStatus').innerText(),/pouze English/);
  await page.locator('#shareFixed').check();
  assert.equal(await page.locator('#shareLanguage').inputValue(),'en');
  assert.equal(await page.locator('#shareLevel').inputValue(),'');
  assert.equal(await page.locator('#qrCopy').isDisabled(),true);
  await page.locator('#shareLevel').selectOption('A1');
  const fixed=await inspectUrl(page);
  assert.equal(fixed.url.searchParams.get('lang'),'en');
  assert.equal(fixed.url.searchParams.get('level'),'A1');
  assert.equal(fixed.url.searchParams.get('zamek'),'1');
  assert.equal(await page.locator('#qrMount svg').count(),1);
  await noOverflow(page,'320px listening');
  await page.locator('#qrClose').click();
  await page.locator('#themeToggle').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
  await share(page,'ll-harrison-ford');
  await noOverflow(page,'320px light share');
  await page.locator('#qrClose').click();
  await page.goto(fixed.raw,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#levelPills button[data-level="A1"]').waitFor();
  assert.equal(await page.locator('#levelPills button[data-level="A1"]').isDisabled(),true);
  assert.deepEqual(errors,[]);
  await context.close();
 }finally{await browser.close()}
 console.log('PASS R21 Chromium 320px: EN-only listening free/fixed, mobile layout, R18 light theme');
});
