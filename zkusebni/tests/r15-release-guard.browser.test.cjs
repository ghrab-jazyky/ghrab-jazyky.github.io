#!/usr/bin/env node
/* R15 real local-file browser regression. No live network or student data.
 * Check import/export, 14 UAT gates, wrong-bundle rejection and NO-GO.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {chromium,webkit}=require('playwright');
const STAGE=path.resolve(__dirname,'..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r15-browser-'));
const out=path.join(tmp,'bundle');
for(const script of ['r10-unified-review-bundle.cjs','r11-review-matrix.cjs',
 'r12-content-triage.cjs','r15-release-guard.cjs'])
 execFileSync(process.execPath,[path.join(STAGE,'tools',script),out],{timeout:180000,stdio:'pipe'});
const matrix=JSON.parse(fs.readFileSync(path.join(out,'R11_REVIEW_MATRIX.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(out,'R15_RELEASE_GATES.json'),'utf8'));
assert.equal(matrix.variants.length,642);assert.equal(manifest.classifiedTestingAllowed,false);
test.after(()=>fs.rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:100}));
const sample={schemaVersion:1,kind:'LSH_R11_LOCAL_REVIEW_NOT_APPROVAL',
 bundleId:matrix.bundleId,variantCount:642,teacherApproval:false,
 approvedForRelease:false,records:[
 {id:matrix.variants[0].id,status:'reviewed',note:'Validated synthetic record'},
 {id:matrix.variants[1].id,status:'issue',note:'Synthetic editorial issue'}
 ]};
async function check(engine,name,width){
 const browser=await engine.launch({headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width,height:844},
   acceptDownloads:true,serviceWorkers:'block'});
  await ctx.route(/^https?:/,route=>route.abort('internetdisconnected'));
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.setDefaultTimeout(20000);
  await page.goto(pathToFileURL(path.join(out,'release-check.html')).href,
   {waitUntil:'domcontentloaded',timeout:40000});
  assert.equal((await page.locator('#verdict').innerText()).trim(),'NO-GO');
  assert.match(await page.locator('header .risk').innerText(),/Klasifikované testování: NO-GO/);
  assert.equal(await page.locator('#gateList input[type=checkbox]').count(),14);
  assert.equal(await page.locator('#gateList input[type=checkbox]:checked').count(),0);
  assert.match(await page.locator('#reviewedStat').innerText(),/^0 \/ 642$/);
  for(let i=0;i<14;i++)await page.locator('#gateList input[type=checkbox]').nth(i).check();
  assert.match(await page.locator('#uatStat').innerText(),/^14 \/ 14$/);
  assert.equal((await page.locator('#verdict').innerText()).trim(),'NO-GO');
  const file=(value,name)=>({name,mimeType:'application/json',
   buffer:Buffer.from(JSON.stringify(value))});
  await page.locator('#importR11').setInputFiles(file(sample,'r11-good.json'));
  await page.waitForFunction(()=>document.getElementById('importMessage').textContent.includes('Načteno 2'));
  assert.match(await page.locator('#reviewedStat').innerText(),/^1 \/ 642$/);
  assert.equal((await page.locator('#issueStat').innerText()).trim(),'1');
  const wrong={...sample,bundleId:'0'.repeat(64)};
  await page.locator('#importR11').setInputFiles(file(wrong,'r11-wrong.json'));
  await page.waitForFunction(()=>document.getElementById('importMessage').textContent.includes('odmítnut'));
  assert.equal(await page.locator('#importMessage').getAttribute('data-error'),'true');
  assert.match(await page.locator('#reviewedStat').innerText(),/^1 \/ 642$/);
  const all={...sample,records:matrix.variants.map(v=>({id:v.id,status:'reviewed',note:''}))};
  await page.locator('#importR11').setInputFiles(file(all,'r11-complete.json'));
  await page.waitForFunction(()=>document.getElementById('reviewedStat').textContent.includes('642 / 642'));
  assert.equal((await page.locator('#uatStat').innerText()).trim(),'14 / 14');
  assert.equal((await page.locator('#verdict').innerText()).trim(),'ČEKÁ NA ROZHODNUTÍ');
  assert.match(await page.locator('#practiceOutcome').innerText(),/SAMOSTATNÉ rozhodnutí/);
  assert.match(await page.locator('#decisionTitle').locator('..').innerText(),/Testovací \/ klasifikovaný režim: trvale NO-GO/);
  const pending=page.waitForEvent('download',{timeout:20000});
  await page.locator('#exportR15').click();
  const download=await pending,filename=path.join(tmp,'r15-'+name+'.json');
  await download.saveAs(filename);
  const exported=JSON.parse(fs.readFileSync(filename,'utf8'));
  assert.equal(exported.kind,'LSH_R15_OFFLINE_UAT_NOT_APPROVAL');
  assert.equal(exported.bundleId,matrix.bundleId);
  assert.equal(exported.approvedForRelease,false);
  assert.equal(exported.teacherApproval,false);
  assert.equal(exported.classifiedTestingAllowed,false);
  assert.equal(Object.values(exported.gates).filter(x=>x===true).length,14);
  assert.equal(exported.reviewRecords.length,642);
  await page.locator('#importR15').setInputFiles(file({...exported,classifiedTestingAllowed:true},'r15-forged.json'));
  await page.waitForFunction(()=>document.getElementById('importMessage').textContent.includes('R15 JSON odmítnut'));
  assert.equal((await page.locator('#verdict').innerText()).trim(),'ČEKÁ NA ROZHODNUTÍ');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#clearR15').click();
  assert.equal((await page.locator('#verdict').innerText()).trim(),'NO-GO');
  assert.match(await page.locator('#reviewedStat').innerText(),/^0 \/ 642$/);
  await page.locator('#importR15').setInputFiles(filename);
  await page.waitForFunction(()=>document.getElementById('importMessage').textContent.includes('obnovena'));
  assert.equal((await page.locator('#verdict').innerText()).trim(),'ČEKÁ NA ROZHODNUTÍ');
  const dims=await page.evaluate(()=>({
   viewport:innerWidth,body:document.body.scrollWidth,doc:document.documentElement.scrollWidth
  }));
  assert.ok(Math.max(dims.body,dims.doc)<=dims.viewport+8,
   'R15 mobile horizontal overflow '+JSON.stringify(dims));
  assert.deepEqual(errors,[],'R15 runtime page errors');
  await ctx.close();
 }finally{await browser.close()}
 console.log('PASS R15 '+name+': all 14 UAT gates, 642-item import, no-go guard, export/import and negative checks');
}
test('R15 Chromium desktop local-file release gate',{timeout:150000},
 ()=>check(chromium,'Chromium',1366));
test('R15 WebKit mobile local-file release gate',{timeout:150000},
 ()=>check(webkit,'WebKit',390));
