#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const core=require('../self-check/listening/listening-core.js');
const teacher=require('../self-check/practice-answers/teacher-key.js');
const root=path.resolve(__dirname,'..');
const entries=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8'))
 .entries.filter(e=>e.skill==='poslech');
const base='http://127.0.0.1:8765/language-skills-hub/';
function source(e){
 return core.extractJson(fs.readFileSync(path.join(root,e.lockSource||e.relative),'utf8'),'DATA');
}
for(const [browserName,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R38 '+browserName+': all 18 Listening keys render and export complete branded PDFs',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:490,height:860},acceptDownloads:true});
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   let count=0,answerRows=0,allBytes=0;
   for(const entry of entries){
    const data=source(entry);
    for(const level of core.LEVELS){
     const u=new URL('self-check/practice-answers/teacher.html',base);
     u.searchParams.set('topic',entry.id);u.searchParams.set('lang','en');u.searchParams.set('level',level);
     assert.equal((await page.goto(u.href,{waitUntil:'load',timeout:25000})).status(),200);
     await page.locator('#downloadPdf:enabled').waitFor({timeout:25000});
     assert.equal(await page.locator('#level').inputValue(),level);
     assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),entry.id);
      assert.equal(await page.locator('select#topic').count(),0);
     const model=teacher.buildListening(core.variant(data,level),entry,'en',level);
     const expected=model.groups.reduce((n,g)=>n+g.items.length,0);
     const actual=await page.locator('#answerPreview .key-item').count();
     assert.equal(actual,expected,entry.id+' '+level+' dropped practice questions');
     const textContent=await page.locator('#answerPreview').textContent();
     for(const g of model.groups)for(const x of g.items){
      assert.ok(textContent.includes(x.question),
       entry.id+' '+level+' missing question '+x.question.slice(0,80));
      assert.ok(textContent.includes(x.answer),
       entry.id+' '+level+' missing answer '+x.answer.slice(0,80));
     }
     const finished=page.waitForEvent('download',{timeout:40000});
     await page.locator('#downloadPdf').click();
     const file=await finished;
     assert.equal(file.suggestedFilename(),
      'lsh-vysledky-procvicovani-'+entry.id+'-en-'+level.toLowerCase()+'.pdf');
     const pdf=fs.readFileSync(await file.path());
     assert.equal(pdf.subarray(0,8).toString('ascii'),'%PDF-1.4');
     assert.ok(pdf.length>12000,entry.id+' '+level+' unexpectedly short PDF');
     const raw=pdf.toString('latin1');
     const pages=(raw.match(/\/Type \/Page \/Parent/g)||[]).length;
     const imgs=(raw.match(/\/Subtype \/Image/g)||[]).length;
     assert.ok(pages>=1&&imgs>=pages,'PDF image pages or school branding missing');
     count++;answerRows+=actual;allBytes+=pdf.length;
    }
   }
   assert.equal(count,18);
   assert.equal(answerRows,530);
   assert.ok(allBytes>18*12000);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
