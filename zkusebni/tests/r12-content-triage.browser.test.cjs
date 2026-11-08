#!/usr/bin/env node
/* R12 triage links and mobile/desktop readability; local file only. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {chromium,webkit}=require('playwright');
const STAGE=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r12-browser-'));
const out=path.join(tmp,'bundle');
for(const filename of ['r10-unified-review-bundle.cjs','r11-review-matrix.cjs','r12-content-triage.cjs'])
 execFileSync(process.execPath,[path.join(STAGE,'tools',filename),out],{timeout:180000});
const d=JSON.parse(fs.readFileSync(path.join(out,'R12_CONTENT_TRIAGE.json'),'utf8'));
test.after(()=>fs.rmSync(tmp,{recursive:true,force:true,maxRetries:3,retryDelay:100}));
async function check(engine,label,viewport){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  await context.route(/^https?:/,route=>route.abort('internetdisconnected'));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(pathToFileURL(path.join(out,'triage.html')).href,{waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(await page.locator('main script').count(),0);
  assert.match(await page.locator('h1').innerText(),/Konkrétní fronta/);
  assert.equal(await page.locator('section').count(),4);
  const tables=page.locator('section table');
  assert.equal(await tables.count(),4);
  assert.equal(await tables.nth(0).locator('tbody tr').count(),30);
  assert.equal(await tables.nth(1).locator('tbody tr').count(),3);
  assert.equal(await tables.nth(2).locator('tbody tr').count(),d.pending.shorterReadingSignals);
  assert.equal(await tables.nth(3).locator('tbody tr').count(),d.pending.reusedPromptSignals);
  assert.equal(errors.length,0,'Report should not execute unexpected JS');
  // Direct, actual offline navigation to a flagged Spanish A1 Reading variant.
  const target=d.editorialSignals.shortReadings.find(x=>x.topicId==='rl-can-mistakes'&&x.language==='es'&&x.level==='A1');
  assert.ok(target);
  await page.goto(pathToFileURL(path.join(out,target.url.split('?')[0])).href+'?'+target.url.split('?')[1],
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#readingBody p').first().waitFor({timeout:15000});
  assert.equal(await page.locator('#language').inputValue(),'es');
  assert.equal(await page.locator('#levels button[aria-pressed="true"]').getAttribute('data-level'),'A1');
  const w=await page.evaluate(()=>({viewport:innerWidth,width:Math.max(
   document.documentElement.scrollWidth,document.body.scrollWidth)}));
  assert.ok(w.width<=w.viewport+8,'Horizontal scroll '+JSON.stringify(w));
  assert.equal(errors.length,0,'No JS exceptions expected');
  await context.close();
 }finally{await browser.close()}
 console.log('PASS R12 '+label+' triage and flagged Spanish A1 offline card');
}
test('R12 Chromium desktop content triage',{timeout:150000},()=>check(chromium,'Chromium',{width:1366,height:850}));
test('R12 WebKit mobile content triage',{timeout:150000},()=>check(webkit,'WebKit',{width:390,height:844}));
