'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','cards.json'),'utf8'));
const entries=catalog.entries.filter(e=>['rl-email-friend','rl-instant-messages'].includes(e.id));
const base='http://127.0.0.1:8765/language-skills-hub/';
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 for(const entry of entries){
  test('R55 '+engineName+': real catalog URL '+entry.id+' supports 24 variants and 3 tasks per skill',
  {timeout:170000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[],unsafe=[];
    page.on('pageerror',e=>{
     if(!/^ResizeObserver loop completed with undelivered notifications\.$/.test(e.message))errors.push(e.message)
    });
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))unsafe.push(r.method()+' '+r.url())});
    assert.ok(entry.lockSource?.startsWith('r11/variant-copies/'));
    const url=base+entry.lockSource+'?practice=1';
    assert.equal((await page.goto(url,{waitUntil:'load'})).status(),200);
    await page.locator('#lshReadingSkillGuide .lsh-reading-guide-item').first().waitFor();
    const css=await page.locator('#lshReadingSkillGuideStyles').getAttribute('href');
    assert.equal(new URL(css,page.url()).pathname,'/language-skills-hub/assets/lsh/v3/reading-skill-guides.css');
    for(const lang of ['en','es','de','fr']){
     await page.locator('#language').selectOption(lang);
     for(const level of ['A1','A2','B1','B2','C1','C2']){
      await page.locator('#levels button[data-level="'+level+'"]').click();
      const ids=await page.locator('#skillTabs button[data-skill]').evaluateAll(xs=>xs.map(x=>x.dataset.skill));
      assert.ok(ids.length>=3,lang+'/'+level);
      for(const skill of ids){
       await page.locator('#skillTabs button[data-skill="'+skill+'"]').click();
       await page.waitForFunction(([l,s])=>{
        const panel=document.querySelector('#lshReadingSkillGuide');
        return !!panel&&panel.dataset.variant===l+':'+s&&panel.querySelectorAll('.lsh-reading-guide-text').length===2;
       },[lang,skill]);
       assert.equal(await page.locator('#questions .qcard').count(),3,
        entry.id+' '+lang+'/'+level+'/'+skill);
       assert.ok(await page.evaluate(()=>{
        const explanation=document.getElementById('lshReadingSkillGuide').getBoundingClientRect();
        const question=document.querySelector('#questions .qcard').getBoundingClientRect();
        return explanation.bottom<=question.top+3;
       }),'Explanation precedes the three questions');
      }
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=3),
       'Mobile overflow '+entry.id+' '+lang+'/'+level);
     }
    }
    // Teacher sends a fixed language/CEFR link; guides must still be available.
    assert.equal((await page.goto(base+entry.lockSource+'?practice=1&lang=es&level=C2&zamek=1',{waitUntil:'load'})).status(),200);
    await page.locator('#lshReadingSkillGuide').waitFor();
    assert.equal(await page.locator('#language').inputValue(),'es');
    assert.equal(await page.locator('#language').isDisabled(),true);
    assert.equal(await page.locator('#levels button[data-level="C2"]').isDisabled(),true);
    await page.locator('#skillTabs button[data-skill="scan"]').click();
    await page.waitForFunction(()=>document.querySelector('#lshReadingSkillGuide')?.dataset.variant==='es:scan');
    assert.equal(await page.locator('#questions .qcard').count(),3);
    assert.deepEqual(errors,[],'Browser errors in '+entry.id);
    assert.deepEqual(unsafe,[],'No network writes');
    await context.close();
   }finally{await browser.close()}
  });
 }
}
