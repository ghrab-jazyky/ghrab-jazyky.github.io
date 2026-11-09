#!/usr/bin/env node
/* R16 personal UAT launchpad, real file:// Chromium and WebKit smoke.
 * Network is blocked; no keys, names, student submissions, or deployment.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {chromium,webkit}=require('playwright');
const STAGE=path.resolve(__dirname,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r16-uat-')),out=path.join(tmp,'review');
for(const script of ['r10-unified-review-bundle.cjs','r11-review-matrix.cjs',
 'r12-content-triage.cjs','r15-release-guard.cjs','r16-personal-uat.cjs'])
 execFileSync(process.execPath,[path.join(STAGE,'tools',script),out],
 {timeout:180000,stdio:'pipe'});
const m=JSON.parse(fs.readFileSync(path.join(out,'R11_REVIEW_MATRIX.json'),'utf8'));
assert.equal(m.variants.length,642);
test.after(()=>fs.rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:80}));
async function verify(engine,label,width){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width,height:844},
   acceptDownloads:true,serviceWorkers:'block'});
  await context.route(/^https?:/,route=>route.abort('internetdisconnected'));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(18000);
  await page.goto(pathToFileURL(path.join(out,'start-test.html')).href,
   {waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(await page.locator('#topic option').count(),21);
  assert.equal(await page.locator('#language option').count(),4);
  await page.locator('#topic').selectOption('cl-umela-inteligence');
  await page.locator('#language').selectOption('es');
  await page.locator('#level').selectOption('C1');
  const conversation=m.variants.find(v=>v.id==='cl-umela-inteligence|es|C1');
  assert.equal(await page.locator('#launch').getAttribute('href'),conversation.href);
  await page.locator('#mode').selectOption('free');
  assert.equal(await page.locator('#launch').getAttribute('href'),
   'konverzace/umela-inteligence/index.html?practice=1');
  await page.locator('#mode').selectOption('fixed');
  await page.locator('#skill').selectOption('cteni');
  assert.equal(await page.locator('#topic option').count(),5);
  await page.locator('#topic').selectOption('rl-email-friend');
  await page.locator('#language').selectOption('fr');
  await page.locator('#level').selectOption('C2');
  const reading=m.variants.find(v=>v.id==='rl-email-friend|fr|C2');
  assert.equal(await page.locator('#launch').getAttribute('href'),reading.href);
  await page.locator('#skill').selectOption('poslech');
  assert.equal(await page.locator('#topic option').count(),3);
  assert.equal(await page.locator('#language option').count(),1);
  await page.locator('#topic').selectOption('ll-peaky-no-fighting');
  assert.equal(await page.locator('#launch').getAttribute('href'),
   m.variants.find(v=>v.id==='ll-peaky-no-fighting|en|C2').href);
  await page.locator('#severity').selectOption('P1');
  await page.locator('#area').selectOption('media');
  await page.locator('#issueText').fill('Testovací hlášení: video na školním iPadu nejde přehrát.');
  await page.locator('#addIssue').click();
  assert.match(await page.locator('#issueCount').innerText(),/^1 uložených nálezů$/);
  assert.equal(await page.locator('#issues li').count(),1);
  const pending=page.waitForEvent('download');
  await page.locator('#exportIssues').click();
  const dl=await pending,target=path.join(tmp,label+'-uat.json');
  await dl.saveAs(target);
  const exported=JSON.parse(fs.readFileSync(target,'utf8'));
  assert.equal(exported.kind,'LSH_R16_PERSONAL_UAT_NOT_APPROVAL');
  assert.equal(exported.bundleId,m.bundleId);
  assert.equal(exported.classifiedTestingAllowed,false);
  assert.equal(exported.issues.length,1);
  assert.equal(exported.issues[0].severity,'P1');
  const bad={...exported,bundleId:'0'.repeat(64)};
  await page.locator('#importIssues').setInputFiles({
   name:'wrong-bundle.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(bad))
  });
  await page.waitForFunction(()=>document.querySelector('#message').textContent.includes('odmítnut'));
  assert.equal(await page.locator('#issues li').count(),1);
  page.once('dialog',d=>d.accept());
  await page.locator('#clearIssues').click();
  assert.equal(await page.locator('#issues li').count(),0);
  await page.locator('#importIssues').setInputFiles(target);
  await page.waitForFunction(()=>document.querySelector('#message').textContent.includes('Import dokončen'));
  assert.equal(await page.locator('#issues li').count(),1);
  assert.equal((await page.locator('#launch').getAttribute('target')),'_blank');
  const dims=await page.evaluate(()=>({
   viewport:innerWidth,body:document.body.scrollWidth,doc:document.documentElement.scrollWidth
  }));
  assert.ok(Math.max(dims.body,dims.doc)<=dims.viewport+8,
   'UAT launchpad horizontal overflow '+JSON.stringify(dims));
  assert.deepEqual(errors,[],'Unexpected launchpad JS exception');
  // Recheck an actual locked Reading card. No external network permitted.
  const fileHref=pathToFileURL(path.join(out,reading.href.split('?')[0])).href+
   '?'+reading.href.split('?')[1];
  await page.goto(fileHref,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#readingBody p').first().waitFor({timeout:20000});
  assert.equal(await page.locator('#language').inputValue(),'fr');
  assert.equal(await page.locator('#levels button[aria-pressed="true"]').getAttribute('data-level'),'C2');
  assert.deepEqual(errors,[],'Unexpected card JS exception');
  await context.close();
 }finally{await browser.close()}
 console.log('PASS R16 '+label+': selectors, fixed links, issue report export/import, no external network');
}
test('R16 Chromium desktop offline UAT entry',{timeout:240000},
 ()=>verify(chromium,'Chromium',1366));
test('R16 WebKit mobile offline UAT entry',{timeout:240000},
 ()=>verify(webkit,'WebKit',390));
