'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const cards=['asteroids','can-mistakes','email-friend','instant-messages','plastic-ocean'];
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('R54 '+engineName+': guidance before three tasks in all Reading variants',{timeout:200000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>{if(!/^ResizeObserver loop completed/.test(e.message))errors.push(e.message)});
   for(const card of cards){
    const url='http://127.0.0.1:8765/language-skills-hub/cteni/'+card+'/index.html?practice=1&lang=en&level=A1';
    assert.equal((await page.goto(url,{waitUntil:'load'})).status(),200);
    await page.locator('#lshReadingSkillGuide').waitFor({timeout:10000});
    for(const lang of ['en','es','de','fr']){
     await page.locator('#language').selectOption(lang);
     for(const level of ['A1','A2','B1','B2','C1','C2']){
      await page.locator('#levels button[data-level="'+level+'"]').click();
      const ids=await page.locator('#skillTabs button[data-skill]').evaluateAll(xs=>xs.map(x=>x.dataset.skill));
      for(const skill of ids){
       await page.locator('#skillTabs button[data-skill="'+skill+'"]').click();
       await page.waitForFunction(([l,s])=>document.querySelector('#lshReadingSkillGuide')?.dataset.variant===l+':'+s,[lang,skill]);
       assert.equal(await page.locator('#lshReadingSkillGuide .lsh-reading-guide-item').count(),2);
       assert.equal(await page.locator('#questions .qcard').count(),3);
       assert.ok(await page.evaluate(()=>{
        const a=document.getElementById('lshReadingSkillGuide').getBoundingClientRect();
        const b=document.querySelector('#questions .qcard').getBoundingClientRect();
        return a.bottom<=b.top+3;
       }),'Explanation must precede tasks');
      }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=3));
     }
    }
   }
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });
}