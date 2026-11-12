#!/usr/bin/env node
/* R10 offline multi-skill browser QA for one complete teacher-review directory.
 * All HTTP(S) traffic is blocked; no production publication or real student data.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process'),{pathToFileURL}=require('node:url');
const {chromium,webkit}=require('playwright');
const stage=path.resolve(__dirname,'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r10-browser-'));
const out=path.join(temp,'bundle');
execFileSync(process.execPath,[path.join(stage,'tools/r10-unified-review-bundle.cjs'),out],
 {timeout:180000,stdio:'pipe'});
const m=JSON.parse(fs.readFileSync(path.join(out,'R10_REVIEW_MANIFEST.json'),'utf8'));
assert.equal(m.entries.length,29);
test.after(()=>fs.rmSync(temp,{recursive:true,force:true,maxRetries:3,retryDelay:100}));
async function check(engine,name,viewport){
 const browser=await engine.launch({headless:true});
 const errors=[],verified=[];
 try{
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  // Playwright WebKit on Linux can fail file:// with setOffline(true).
  // Block all remote HTTP(S) instead, leaving local files accessible.
  await context.route(/^https?:/,route=>route.abort('internetdisconnected'));
  const page=await context.newPage();
  page.setDefaultTimeout(18000);
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(pathToFileURL(path.join(out,'index.html')).href,
    {waitUntil:'domcontentloaded',timeout:30000});
  assert.equal(await page.locator('article.item').count(),29);
  for(const e of m.entries){
   const before=errors.length;
   try{
    await page.goto(pathToFileURL(path.join(out,e.relative)).href+'?practice=1',
      {waitUntil:'domcontentloaded',timeout:45000});
    assert.ok(page.url().startsWith('file:'),'Preview unexpectedly left the offline bundle');
    if(e.skill==='konverzace'){
     await page.locator('#mainQuestion').waitFor();
     assert.ok((await page.locator('#mainQuestion').innerText()).trim().length>=5);
     assert.equal(await page.locator('#languageSelect').count(),1);
     assert.ok(await page.locator('#levelSwitch button').count()>=6);
    }else if(e.skill==='cteni'){
     await page.locator('#readingBody p').first().waitFor();
     assert.ok(await page.locator('#readingBody p').count()>=1);
     assert.equal(await page.locator('#language').count(),1);
    }else{
     await page.locator('#gistTasks .task').first().waitFor();
     assert.ok(await page.locator('#gistTasks .task').count()>=1);
     assert.ok(await page.locator('#levelPills button[data-level]').count()>=6);
    }
    const widths=await page.evaluate(()=>({
     viewport:innerWidth,body:document.body.scrollWidth,doc:document.documentElement.scrollWidth
    }));
    assert.ok(Math.max(widths.body,widths.doc)<=widths.viewport+8,
     'Horizontal overflow: '+JSON.stringify(widths));
    assert.equal(errors.length,before,'Unexpected JS exceptions: '+errors.slice(before).join(' | '));
    verified.push(e.id);
   }catch(err){throw Error(e.id+' '+name+': '+String(err.message||err).slice(0,650))}
  }
  await context.close();
 }finally{await browser.close()}
 assert.equal(verified.length,29);
 console.log('PASS R10 '+name+' '+verified.length+'/29 cards, local file only, '+viewport.width+'px');
}
test('R10 all 29 reviews on Chromium desktop',{timeout:240000},
 ()=>check(chromium,'Chromium',{width:1366,height:768}));
test('R10 all 29 reviews on WebKit mobile',{timeout:240000},
 ()=>check(webkit,'WebKit',{width:390,height:844}));
