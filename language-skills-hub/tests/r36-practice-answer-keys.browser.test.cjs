#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
function href(path,params){const u=new URL(path,base);for(const [k,v]of Object.entries(params))u.searchParams.set(k,v);return u.href}
for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
 test('R36 '+engineName+' teacher VÝSLEDKY preview and local PDF for Reading and Listening',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await context.newPage(),errors=[],uploads=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))uploads.push(r.method()+' '+r.url())});
   for(const variant of [
    {topic:'rl-asteroids',lang:'es',level:'B2'},
    {topic:'ll-harrison-ford',lang:'en',level:'B1'}
   ]){
    const url=href('self-check/practice-answers/teacher.html',variant);
    assert.equal((await page.goto(url,{waitUntil:'load'})).status(),200);
    await page.locator('#downloadPdf:enabled').waitFor({timeout:25000});
    const count=await page.locator('#answerPreview .key-item').count();
    assert.ok(count>=10,variant.topic+' expected a complete practice key, got '+count);
    assert.match(await page.locator('#status').textContent(),/Klíč je připraven/);
    assert.ok(await page.locator('#answerPreview').textContent());
    const dl=page.waitForEvent('download',{timeout:25000});
    await page.locator('#downloadPdf').click();
    const result=await dl;
    assert.match(result.suggestedFilename(),
     new RegExp('^lsh-vysledky-procvicovani-'+variant.topic+'-'+variant.lang+'-'+variant.level.toLowerCase()+'\\.pdf$'));
    const bytes=fs.readFileSync(await result.path());
    assert.ok(bytes.length>12000,'Expected rendered PDF pages');
    assert.equal(bytes.subarray(0,8).toString('ascii'),'%PDF-1.4');
    const body=bytes.toString('latin1');
    assert.ok((body.match(/\/Type \/Page \/Parent/g)||[]).length>=1);
    assert.ok((body.match(/\/Subtype \/Image/g)||[]).length>=1);
    assert.match(await page.locator('#status').textContent(),/Staženo/);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=3,variant.topic+' mobile overflow '+overflow);
   }
   await page.goto(href('index.html',{skill:'cteni'}));
   const cards=page.locator('#cards .card');
   await cards.first().waitFor({timeout:20000});
   assert.equal(await cards.count(),5);
   assert.equal(await cards.locator('a').filter({hasText:'VÝSLEDKY'}).count(),5);
   await page.goto(href('index.html',{skill:'poslech'}));
   await cards.first().waitFor({timeout:20000});
   assert.equal(await cards.count(),3);
   assert.equal(await cards.locator('a').filter({hasText:'VÝSLEDKY'}).count(),3);
   assert.deepEqual(errors,[]);
   assert.deepEqual(uploads,[]);
  }finally{await browser.close()}
 });
}
