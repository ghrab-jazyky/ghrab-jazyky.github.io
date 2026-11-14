#!/usr/bin/env node
'use strict';
// R70: runtime acceptance checks. Not a substitute for a human visual sign-off.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const BASE='http://127.0.0.1:8765/language-skills-hub/';
const TOPICS=['sad','conlangs'];

for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('R70 '+name+': intro/chooser counts equal the live catalog', {timeout:120000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const res=await page.goto(BASE,{waitUntil:'load'});
   assert.equal(res.status(),200);
   await page.waitForFunction(()=>[...document.querySelectorAll('[data-count-skill="poslech"]')]
    .length===2&&[...document.querySelectorAll('[data-count-skill="poslech"]')]
    .every(el=>el.textContent.trim()==='5'));
   for(const [skill,count] of [['konverzace',22],['cteni',5],['poslech',5]]){
    const nums=await page.locator('[data-count-skill="'+skill+'"]').allTextContents();
    assert.deepEqual(nums,[String(count),String(count)]);
   }
   await page.locator('#skillChooser:not([hidden])').waitFor({timeout:8000});
   await page.locator('[data-choose-skill="poslech"]').click();
   await page.locator('#cards .card').first().waitFor();
   assert.equal(await page.locator('#cards .card').count(),5);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('R70 '+name+': SAD/Conlangs studio layout, safe resize, theme and progress', {timeout:180000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   for(const topic of TOPICS){
    await page.goto(BASE+'poslech/'+topic+'/index.html?practice=1&lang=en&level=B2',{waitUntil:'load'});
    await page.locator('#questionsA .task').first().waitFor({timeout:16000});
    assert.equal(await page.locator('#levelPills button').count(),6);
    assert.equal(await page.locator('.task').count(),17);
    assert.equal(await page.locator('.studio-levelbar').count(),1);
    assert.equal(await page.locator('.side').count(),1);
    const style=await page.evaluate(()=>{
     const level=getComputedStyle(document.querySelector('.studio-levelbar'));
     const bg=getComputedStyle(document.body).backgroundColor;
     return {sticky:level.position==='sticky',light:document.documentElement.dataset.theme==='light',bg};
    });
    assert.equal(style.sticky,true,topic+' CEFR bar must remain sticky');
    assert.equal(style.light,true,topic+' should use the light-first studio design');
    assert.equal(style.bg,'rgb(251, 250, 246)',topic+' studio body background');
    for(const width of [320,390,768,1280]){
     await page.setViewportSize({width,height:860});
     // Permit layout measurement to complete before checking for observer errors.
     await page.waitForTimeout(85);
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
     assert.ok(overflow<=3,topic+' '+width+'px overflow: '+overflow);
    }
    await page.locator('#themeBtn').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    await page.locator('#themeBtn').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
    await page.locator('#questionsA input[type="radio"]').first().check();
    await page.waitForFunction(()=>{
     const mirror=document.getElementById('studioProgressBar');
     return mirror.style.width!=='' && mirror.style.width!=='0%' &&
      document.getElementById('studioProgressText').textContent===
      document.getElementById('progressStatus').textContent;
    });
    const width=await page.locator('#studioProgressBar').evaluate(el=>el.style.width);
    assert.notEqual(width,'0%',topic+' progress was not mirrored');
    assert.deepEqual(errors,[],topic+' must emit no browser errors');
   }
  }finally{await browser.close()}
 });
}
