#!/usr/bin/env node
'use strict';
// Audit 2026-11-11: real-browser regressions for the 2026-11-11 catalog audit.
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
async function withPage(engine,options,fn){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext(options);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await fn(page,context);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
}
const phone={viewport:{width:390,height:844},isMobile:true,hasTouch:true};
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('Audit 2026-11-11 '+name+' copy confirmation is visible inside the modal share dialog',async()=>{
  await withPage(engine,phone,async page=>{
   await page.goto(base+'?skill=cteni');
   await page.locator('#cards article').first().waitFor();
   await page.locator('#cards article').first().locator('button.action').click();
   await page.locator('#qrCopy').click();
   await page.locator('#toast:not(.hidden)').waitFor();
   const onTop=await page.evaluate(()=>{
    const t=document.getElementById('toast');
    const r=t.getBoundingClientRect();
    const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return t.closest('dialog')!==null&&(hit===t||t.contains(hit));
   });
   assert.equal(onTop,true,'toast must render above the modal dialog');
   await page.locator('#qrClose').click();
   // The dialog 'close' event is dispatched asynchronously; wait for it.
   await page.waitForFunction(()=>document.getElementById('toast').parentElement===document.body);
  });
 });
 test('Audit 2026-11-11 '+name+' search finds translated titles and help dialog preserves the search',async()=>{
  await withPage(engine,{viewport:{width:1366,height:800}},async page=>{
   await page.goto(base+'?skill=konverzace');
   await page.locator('#cards article').first().waitFor();
   for(const [q,expected] of [['family','Rodina'],['Weihnachten','Vánoce'],['Navidad','Vánoce']]){
    await page.locator('#search').fill(q);
    const titles=await page.locator('#cards article h3').allTextContents();
    assert.ok(titles.includes(expected),q+' → '+titles.join(', '));
   }
   await page.locator('#search').fill('rodina');
   const before=await page.locator('#cards article').count();
   await page.locator('#howtoOpen').click();
   await page.locator('#howto[open]').waitFor();
   assert.equal(await page.locator('#search').inputValue(),'rodina');
   assert.equal(await page.locator('#cards article').count(),before);
   await page.locator('#howtoClose').click();
   assert.equal(await page.locator('#howto').evaluate(el=>el.open),false);
   await page.locator('#howtoOpen').click();
   await page.keyboard.press('Escape');
   await page.waitForFunction(()=>!document.getElementById('howto').open);
   assert.equal(await page.locator('#search').inputValue(),'rodina');
  });
 });
 test('Audit 2026-11-11 '+name+' closing the lab chooser from the catalog returns to the catalog',async()=>{
  await withPage(engine,{viewport:{width:1366,height:800}},async page=>{
   await page.goto(base+'?skill=poslech');
   await page.locator('#cards article').first().waitFor();
   await page.locator('#changeLab').click();
   assert.equal(await page.locator('#closeChooser').textContent(),'Zpět do katalogu');
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#welcome').isHidden(),true);
   assert.equal(await page.evaluate(()=>document.querySelector('main').inert),false);
   assert.match(page.url(),/skill=poslech/);
   await page.locator('#changeLab').click();
   await page.locator('#closeChooser').click();
   assert.equal(await page.locator('#catalog').isVisible(),true);
   assert.equal(await page.locator('#welcome').isHidden(),true);
  });
 });
 test('Audit 2026-11-11 '+name+' first visit still offers "Zpět na úvod" from the intro chooser',async()=>{
  await withPage(engine,{viewport:{width:1366,height:800},reducedMotion:'reduce'},async page=>{
   await page.goto(base);
   await page.locator('#skillChooser:not([hidden])').waitFor();
   assert.equal(await page.locator('#closeChooser').textContent(),'Zpět na úvod');
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#welcome').isVisible(),true);
   assert.equal(await page.locator('#catalog').isHidden(),true);
  });
 });
 test('Audit 2026-11-11 '+name+' Listening teacher disables copying while the timer is invalid',async()=>{
  await withPage(engine,{viewport:{width:1366,height:850}},async page=>{
   await page.goto(base+'self-check/listening/teacher.html?topic=ll-matthew-oscars');
   await page.waitForFunction(()=>document.getElementById('studentUrl').value.length>0);
   await page.locator('#timerMinutes').fill('2');
   assert.equal(await page.locator('#copyUrl').isDisabled(),true);
   assert.equal(await page.locator('#studentPreview').getAttribute('aria-disabled'),'true');
   await page.locator('#timerMinutes').fill('25');
   assert.equal(await page.locator('#copyUrl').isEnabled(),true);
  });
 });
 test('Audit 2026-11-11 '+name+' timed Reading shows the restore note and exports the submission time',async()=>{
  await withPage(engine,{...phone,acceptDownloads:true},async page=>{
   await page.goto(base+'self-check/reading/index.html?topic=rl-asteroids&lang=en&level=A2&timer=10&attempt=classaudittest');
   await page.locator('#sessionStart').click();
   assert.match(await page.locator('#submitNote').textContent(),/restores your attempt/);
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#exportResult').click()]);
   const fs=require('node:fs');
   const csv=fs.readFileSync(await download.path(),'utf8').replace(/^\uFEFF/,'');
   const [head,row]=csv.trim().split(/\r?\n/);
   const cols=head.split(',').map(s=>s.replace(/"/g,'')),vals=row.split(',').map(s=>s.replace(/"/g,''));
   assert.match(vals[cols.indexOf('submitted_utc')],/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
  });
 });
}
