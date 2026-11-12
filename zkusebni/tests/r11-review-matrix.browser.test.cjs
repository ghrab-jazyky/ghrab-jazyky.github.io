#!/usr/bin/env node
/* R11 real offline (file://) browser checks of review status, notes, export/import.
 * UI never sends a request or produces teaching-release approval.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {chromium,webkit}=require('playwright');
const STAGE=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r11-browser-'));
const OUT=path.join(tmp,'bundle');
execFileSync(process.execPath,[path.join(STAGE,'tools/r10-unified-review-bundle.cjs'),OUT],{timeout:180000});
execFileSync(process.execPath,[path.join(STAGE,'tools/r11-review-matrix.cjs'),OUT],{timeout:180000});
const m=JSON.parse(fs.readFileSync(path.join(OUT,'R11_REVIEW_MATRIX.json'),'utf8'));
assert.equal(m.variantCount,642);
test.after(()=>fs.rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:100}));
async function testUI(engine,label,width){
 const browser=await engine.launch({headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width,height:844},acceptDownloads:true,serviceWorkers:'block'});
  await ctx.route(/^https?:/,route=>route.abort('internetdisconnected'));
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(pathToFileURL(path.join(OUT,'review.html')).href,{waitUntil:'domcontentloaded'});
  await page.locator('#reviewList button.review-row').first().waitFor();
  assert.equal(await page.locator('#reviewList button.review-row').count(),45);
  assert.match(await page.locator('#reviewSummary').innerText(),/642/);
  await page.locator('#skillFilter').selectOption('cteni');
  await page.locator('#langFilter').selectOption('es');
  await page.locator('#levelFilter').selectOption('B2');
  assert.equal(await page.locator('#reviewList button.review-row').count(),5);
  await page.locator('#reviewList button.review-row').first().click();
  assert.match(await page.locator('#detailTitle').innerText(),/ES B2/);
  const href=await page.locator('#openStudent').getAttribute('href');
  assert.ok(href.includes('?lang=es&level=B2&zamek=1&practice=1'));
  await page.locator('#reviewStatus').selectOption('issue');
  await page.locator('#reviewNote').fill('Verify Spanish B2 matching question');
  assert.match(await page.locator('#reviewSummary').innerText(),/641/);
  const pending=page.waitForEvent('download');
  await page.locator('#exportReview').click();
  const download=await pending,exportPath=path.join(tmp,label+'-review.json');
  await download.saveAs(exportPath);
  const exported=JSON.parse(fs.readFileSync(exportPath,'utf8'));
  assert.equal(exported.kind,'LSH_R11_LOCAL_REVIEW_NOT_APPROVAL');
  assert.equal(exported.bundleId,m.bundleId);
  assert.equal(exported.teacherApproval,false);assert.equal(exported.approvedForRelease,false);
  assert.equal(exported.records.length,1);
  assert.equal(exported.records[0].status,'issue');
  assert.equal(exported.records[0].note,'Verify Spanish B2 matching question');
  page.once('dialog',d=>d.accept());await page.locator('#clearReview').click();
  assert.match(await page.locator('#reviewSummary').innerText(),/642/);
  await page.locator('#importReview').setInputFiles(exportPath);
  await page.waitForFunction(()=>document.querySelector('#saveNotice').textContent.includes('1'));
  assert.match(await page.locator('#reviewSummary').innerText(),/641/);
  assert.equal(await page.locator('#reviewStatus').inputValue(),'issue');
  const bad={...exported,bundleId:'0'.repeat(64)};
  const badFile=path.join(tmp,label+'-wrong-bundle.json');
  fs.writeFileSync(badFile,JSON.stringify(bad));
  await page.locator('#importReview').setInputFiles(badFile);
  await page.waitForFunction(()=>document.querySelector('#saveNotice').textContent.includes('nebyl'));
  assert.equal(await page.locator('#reviewStatus').inputValue(),'issue',
   'Wrong-bundle import must preserve prior review state');
  const overflow=await page.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-innerWidth);
  assert.ok(overflow<=8,'Review page overflows viewport by '+overflow+' px');
  // Exactly one audited fixed preview per skill, including four review-only R7 adapters.
  const choices=[['cl-skola','es','B2','konverzace'],
   ['rl-email-friend','fr','B2','cteni'],
   ['ll-harrison-ford','en','B1','poslech']];
  for(const [id,lang,level,skill] of choices){
   const v=m.variants.find(x=>x.topicId===id&&x.lang===lang&&x.level===level);
   assert.ok(v);
   const res=await page.goto(pathToFileURL(path.join(OUT,v.href.split('?')[0])).href+'?'+v.href.split('?')[1],
    {waitUntil:'domcontentloaded',timeout:45000});
   assert.ok(res&&res.ok(),'Candidate offline HTML failed: '+id);
   if(skill==='konverzace'){
    await page.locator('#languageSelect:disabled').waitFor();
    assert.equal(await page.locator('#languageSelect').inputValue(),lang);
    assert.equal(await page.locator('#levelSwitch button.active').getAttribute('data-level'),level);
   }else if(skill==='cteni'){
    await page.locator('#language:disabled').waitFor();
    assert.equal(await page.locator('#language').inputValue(),lang);
    assert.equal(await page.locator('#levels button[aria-pressed="true"]').getAttribute('data-level'),level);
   }else{
    await page.locator('#levelPills button[data-level]:disabled').first().waitFor();
    assert.equal((await page.locator('#heroLevel').innerText()).trim(),level);
   }
  }
  assert.deepEqual(errors,[],'Unexpected browser exceptions');
  await ctx.close();
  console.log('PASS R11 '+label+': 642 review matrix, local JSON export/import, 3 fixed offline subjects');
 }finally{await browser.close()}
}
test('R11 review UX Chromium 1366px',{timeout:240000},()=>testUI(chromium,'Chromium',1366));
test('R11 review UX WebKit 390px',{timeout:240000},()=>testUI(webkit,'WebKit',390));
