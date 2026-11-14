#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const ROOT='http://127.0.0.1:8765/language-skills-hub/';
const LEVELS=['A1','A2','B1','B2','C1','C2'];

for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('R71 '+engineName+': SAD and Conlangs instructions shown once per section, accessible question groups intact', {timeout:220000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   for(const topic of ['sad','conlangs']){
    for(const level of LEVELS){
     const url=ROOT+'poslech/'+topic+'/index.html?practice=1&lang=en&level='+level;
     const response=await page.goto(url,{waitUntil:'load'});
     assert.equal(response.status(),200,topic+' '+level);
     await page.locator('#questionsB .task').last().waitFor({timeout:15000});
     assert.equal(await page.locator('.task').count(),17,topic+' '+level);
     assert.equal(await page.locator('#questionsA fieldset').count(),6);
     assert.equal(await page.locator('#questionsB fieldset').count(),6);
     assert.match(await page.locator('#first .section-description').innerText(),/choose the best answer/i);
     assert.match(await page.locator('#second .stage-heading').innerText(),/True, False or Not Stated/i);
     const inspected=await page.evaluate(()=>{
      const fields=[...document.querySelectorAll('#questionsA fieldset,#questionsB fieldset')];
      return fields.map(field=>{
       const task=field.closest('.task'),legend=field.querySelector('legend');
       return {
        question:task?.querySelector('.task-text')?.textContent||'',
        id:task?.dataset.qid||'',
        legend:legend?.textContent||'',
        clip:legend?getComputedStyle(legend).clipPath:'',
        border:getComputedStyle(field).borderTopWidth,
        pad:getComputedStyle(field).paddingTop,
        radioCount:field.querySelectorAll('input[type="radio"]').length
       };
      });
     });
     for(const x of inspected){
      assert.ok(x.question.length>10,topic+' '+level+' question missing');
      assert.equal(x.legend,x.id+': '+x.question);
      assert.equal(x.clip,'inset(50%)','Semantic legend must be visually hidden');
      assert.equal(x.border,'0px','Legacy fieldset border must not be visible');
      assert.equal(x.pad,'0px');
      assert.ok(x.radioCount>=3,'Radio choices must remain present');
     }
     const first=inspected[0];
     assert.equal(await page.getByRole('group',{name:first.legend}).count(),1,'Accessible group label must survive');
     const text=await page.locator('#questionsA,#questionsB').allInnerTexts();
     assert.ok(text.every(x=>!x.includes('Choose one correct answer.')&&!x.includes('Choose True, False or Not Stated.')));
     await page.locator('#questionsA input[type="radio"]').first().check();
     await page.waitForFunction(()=>document.getElementById('progressBar').style.width!=='0%');
     for(const width of [320,390,768,1280]){
      await page.setViewportSize({width,height:860});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=3),topic+' '+level+' overflow at '+width);
     }
    }
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
