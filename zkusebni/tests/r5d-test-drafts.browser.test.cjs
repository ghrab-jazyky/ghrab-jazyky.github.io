#!/usr/bin/env node
/* Browser-only audit of the 54 static R5D teacher-review drafts.
 * Does not test authenticated exams; no deploy, user data or teacher keys.
 */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium,webkit}=require('playwright');
const STAGE=path.resolve(__dirname,'..');
const GENERATOR=path.join(STAGE,'tools/r5d-test-drafts.cjs');
const TMP=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r5d-browser-'));
const OUT=path.join(TMP,'out');
execFileSync(process.execPath,[GENERATOR,OUT],{timeout:120000});
const M=JSON.parse(fs.readFileSync(path.join(OUT,'R5D_DRAFT_MANIFEST.json'),'utf8'));
test.after(()=>fs.rmSync(TMP,{force:true,recursive:true,maxRetries:3,retryDelay:100}));
async function verify(engine,name,viewport){
 const browser=await engine.launch({headless:true}),bad=[],checked=[];
 try{
  const context=await browser.newContext({viewport,serviceWorkers:'block'});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  const js=[];
  page.on('pageerror',error=>js.push(String(error)));
  page.on('request',request=>{
   if(!request.url().startsWith('file:'))bad.push('External request: '+request.url());
  });
  for(const v of M.variants){
   const before=js.length,href=pathToFileURL(path.join(OUT,v.file)).href;
   try{
    const res=await page.goto(href,{waitUntil:'domcontentloaded',timeout:30000});
    assert.ok(res&&res.ok(),'Could not load offline draft '+v.file);
    assert.equal(await page.locator('.warning').count(),1,'Warning banner missing');
    assert.ok((await page.locator('.warning').innerText()).length>20);
    assert.equal(await page.locator('form').count(),0,'No score/submit forms permitted');
    assert.equal(await page.locator('script').count(),0,'No client JS permitted');
    assert.equal(await page.locator('iframe,video,audio').count(),0,'No direct network media');
    const inputs=page.locator('input[type="radio"]');
    if(v.skill==='konverzace'){
     assert.equal(await inputs.count(),0);
     assert.equal(await page.locator('article').count(),3);
    }else{
     assert.ok(await inputs.count()>6,'Missing real selectable answers for '+v.file);
     const first=inputs.first();
     await first.check();
     assert.equal(await first.isChecked(),true,'Question option cannot be selected');
    }
    const width=await page.evaluate(()=>({
     viewport:window.innerWidth,document:document.documentElement.scrollWidth,
     body:document.body.scrollWidth
    }));
    assert.ok(Math.max(width.document,width.body)<=width.viewport+8,
     'Horizontal overflow: '+JSON.stringify(width));
    assert.equal(js.length,before,'Student HTML triggered JS error '+js.slice(before).join(' | '));
    checked.push(v.file);
   }catch(err){bad.push(name+' '+v.file+': '+String(err.message||err).slice(0,350))}
  }
  await context.close();
 }finally{await browser.close()}
 for(const line of bad)console.error('R5D browser '+line);
 assert.deepEqual(bad,[],name+' draft UI or offline failure');
 assert.equal(checked.length,54);
 console.log('PASS R5D '+name+' '+checked.length+'/54 standalone drafts at '+viewport.width+'px, no network/JS/overflow');
}
test('R5D Chromium 54 draft-only cards on desktop',{timeout:300000},
 ()=>verify(chromium,'Chromium',{width:1366,height:768}));
test('R5D WebKit 54 draft-only cards on mobile',{timeout:300000},
 ()=>verify(webkit,'WebKit',{width:390,height:844}));
