'use strict';
/*
 * Stage D: safeguard explicit teacher confirmation against suppressed input/change.
 * Covers Reading and Listening, Chromium and WebKit; no production deployment.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const BASE=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const teachers=[
 {skill:'reading',file:'self-check/reading/teacher.html',topic:'rl-asteroids'},
 {skill:'listening',file:'self-check/listening/teacher.html',topic:'ll-sad'}
];
let serial=0;
function teacherUrl(t){
 const u=new URL(t.file,BASE);
 u.searchParams.set('topic',t.topic);u.searchParams.set('level','B2');
 u.searchParams.set('timer','30');
 if(t.skill==='reading')u.searchParams.set('lang','en');
 u.searchParams.set('audit',String(serial++));
 return u.href;
}
async function isDraft(page,context){
 assert.equal(await page.locator('#studentUrl').inputValue(),'',
  context+': unpublished student URL must be blank');
 assert.equal(await page.locator('#qrMount svg').count(),0,context+': QR must not exist');
 assert.equal(await page.locator('#copyUrl').isDisabled(),true,context+': copy must be disabled');
 assert.equal(await page.locator('#downloadQr').isDisabled(),true,context+': download must be disabled');
 assert.equal(await page.locator('#studentPreview').getAttribute('aria-disabled'),'true',
  context+': preview must be disabled');
 assert.doesNotMatch(await page.locator('#publishStatus').textContent(),/POTVRZENO/,
  context+': publication must not be reported');
}
async function confirmValid(page,expectedTimer){
 await page.locator('#confirmTest:enabled').click();
 await page.locator('#qrMount svg').waitFor({timeout:12000});
 const s=await page.locator('#studentUrl').inputValue();
 assert.ok(s,'Confirmed URL missing');
 const url=new URL(s);
 assert.equal(url.searchParams.get('timer'),String(expectedTimer));
 assert.ok(/^class[a-z0-9]+$/.test(url.searchParams.get('attempt')||''));
 assert.ok(/^n[1-5]$/.test(url.searchParams.get('p')||''));
 assert.match(await page.locator('#publishStatus').textContent(),/POTVRZENO/);
 return url;
}
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('Stage D '+engineName+': Reading/Listening stale drafts, silent edits and new attempt on confirmation',
  {timeout:125000},async()=>{
   const browser=await engine.launch({headless:true});
   const summary=[];
   try{
    for(const teacher of teachers){
     const context=await browser.newContext({viewport:{width:1024,height:768}});
     const page=await context.newPage();
     const errors=[];page.on('pageerror',error=>errors.push(error.message));
     try{
      const response=await page.goto(teacherUrl(teacher),{waitUntil:'domcontentloaded'});
      assert.equal(response.status(),200);
      await page.locator('#confirmTest:enabled').waitFor({timeout:20000});
      await isDraft(page,teacher.skill+' initial');
      // Run both actions in ONE browser task: the watchdog cannot invalidate first.
      await page.evaluate(()=>{
       document.getElementById('timerMinutes').value='1';
       document.getElementById('confirmTest').click();
      });
      await isDraft(page,teacher.skill+' invalid 1 minute, no input event');
      // The invalid state must be reversible; a fresh deliberate confirmation works.
      await page.locator('#timerMinutes').fill('30');
      const first=await confirmValid(page,30);
      // A button enabled for a previous published configuration must never copy
      // stale data after a silent invalid modification.
      await page.evaluate(()=>{
       document.getElementById('timerMinutes').value='121';
       document.getElementById('copyUrl').click();
      });
      await isDraft(page,teacher.skill+' invalid 121 minutes, synchronous copy action');
      await page.locator('#timerMinutes').fill('35');
      // A DIFFERENT valid configuration must also require one new explicit action.
      await page.evaluate(()=>{
       document.getElementById('timerMinutes').value='40';
       document.getElementById('confirmTest').click();
      });
      await isDraft(page,teacher.skill+' different valid value without input event');
      // After reconciliation the next explicit user action may confirm.
      const second=await confirmValid(page,40);
      assert.notEqual(second.searchParams.get('attempt'),first.searchParams.get('attempt'),
       'Changed setup must create a fresh attempt ID');
      // Silent change after publication, followed by URL preview: no stale link.
      const preview=await page.evaluate(()=>{
       document.getElementById('timerMinutes').value='45';
       return document.getElementById('studentPreview')
        .dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
      });
      assert.equal(preview,false,'Outdated preview must be prevented');
      await isDraft(page,teacher.skill+' stale preview rejected');
      assert.deepEqual(errors,[],'Uncaught browser JS errors');
      summary.push(teacher.skill);
     }finally{await context.close()}
    }
    assert.deepEqual(summary,['reading','listening']);
    console.log('STAGE D CONFIRM '+engineName+': both LABs, stale/invalid/valid/preview/attemptId PASS');
   }finally{await browser.close()}
 });
}
