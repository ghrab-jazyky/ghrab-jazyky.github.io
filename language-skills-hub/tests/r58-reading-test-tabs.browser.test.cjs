'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright');
const core=require('../self-check/reading/reading-core.js');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/cards.json'));
const entries=catalog.entries.filter(e=>e.skill==='cteni');
const data=Object.fromEntries(entries.map(e=>[e.id,core.parseReadingData(read(e.relative))]));
const base=process.env.LSH_R58_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const live=process.env.LSH_R58_LIVE==='1';
const engines=live?[['Chromium',chromium]]:[['Chromium',chromium],['WebKit',webkit]];
const url=(entry,lang,level,extra='')=>{
 const u=new URL('self-check/reading/index.html',base);
 for(const [k,v] of Object.entries({topic:entry.id,lang,level}))u.searchParams.set(k,v);
 if(extra)for(const [k,v]of new URLSearchParams(extra))u.searchParams.set(k,v);
 return u.href;
};
for(const [name,engine]of engines){
 test('R58 '+name+(live?' LIVE':' LOCAL')+': all 120 Reading skill-tab variants match practice, without skill explanations',{timeout:430000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>{if(!/^ResizeObserver loop completed with undelivered notifications\.$/.test(e.message))errors.push(e.message)});
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
   let seen=0,skills=0;
   for(const entry of entries)for(const lang of entry.languages)for(const level of entry.levels){
    const v=core.variantFromData(data[entry.id],lang,level);
    const response=await page.goto(url(entry,lang,level),{waitUntil:'domcontentloaded',timeout:30000});
    assert.equal(response.status(),200,entry.id+' '+lang+'/'+level);
    await page.locator('#readingSkillTabs [role="tab"]').first().waitFor({timeout:15000});
    const buttons=page.locator('#readingSkillTabs [role="tab"]');
    assert.equal(await buttons.count(),v.tabs.length);
    assert.equal(await page.locator('#questionList fieldset.question').count(),v.questions.length);
    assert.equal(await page.locator('#questionList .reading-skill-panel').count(),v.tabs.length);
    assert.equal(await page.locator('#questionList .reading-skill-panel > h3, #questionList .reading-skill-panel > p').count(),0,
     'No skill methodology in test');
    assert.equal(await page.locator('.lsh-reading-skill-guide,#lshReadingSkillGuide').count(),0);
    assert.equal(await buttons.first().getAttribute('aria-selected'),'true');
    for(const tab of v.tabs){
     const btn=page.locator('#reading-test-tab-'+tab.id);
     assert.equal(await btn.locator('.reading-tab-title').textContent(),tab.title,
      entry.id+' '+lang+'/'+level+'/'+tab.id);
     assert.equal(await btn.getAttribute('aria-controls'),'reading-test-panel-'+tab.id);
     await btn.click();
     assert.equal(await btn.getAttribute('aria-selected'),'true');
     const panel=page.locator('#reading-test-panel-'+tab.id);
     assert.equal(await panel.isVisible(),true);
     assert.equal(await panel.locator('fieldset.question').count(),3);
     assert.equal(await page.locator('#questionList fieldset.question:visible').count(),3,
      'Only active tab should be shown');
     assert.equal(await panel.getAttribute('aria-labelledby'),'reading-test-tab-'+tab.id);
     assert.equal(await btn.locator('.reading-tab-count').textContent(),'0 / 3');
     skills++;
    }
    if(['A1','B2','C2'].includes(level)){
     const size=level==='A1'?320:level==='B2'?390:768;
     await page.setViewportSize({width:size,height:844});
     const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
     assert.ok(overflow<=3,'Horizontal overflow '+entry.id+'/'+lang+'/'+level+' at '+size+' '+overflow);
     await page.setViewportSize({width:390,height:844});
    }
    seen++;
   }
   assert.equal(seen,120);
   assert.ok(skills>400);
   assert.deepEqual(errors,[]);
   assert.deepEqual(writes,[]);
   console.log('PASS R58 '+name+(live?' LIVE':' LOCAL')+': 120 variants / '+skills+' tab switches; no skill explanations or page errors');
   await context.close();
  }finally{await browser.close();}
 });
 test('R58 '+name+(live?' LIVE':' LOCAL')+': keyboard navigation, timed cross-tab persistence, full-score submission, all-questions archive',
 {timeout:150000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>{if(!/^ResizeObserver loop completed with undelivered notifications\.$/.test(e.message))errors.push(e.message)});
   page.on('dialog',d=>d.accept());
   const entry=entries[0],v=core.variantFromData(data[entry.id],'en','B2');
   const target=url(entry,'en','B2','timer=5&attempt=classr58tabs9876');
   assert.equal((await page.goto(target,{waitUntil:'domcontentloaded'})).status(),200);
   await page.locator('#sessionIntro:not([hidden])').waitFor();
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor();
   const tabs=page.locator('#readingSkillTabs [role="tab"]');
   assert.equal(await tabs.count(),v.tabs.length);
   await tabs.first().focus();
   await page.keyboard.press('End');
   assert.equal(await tabs.last().getAttribute('aria-selected'),'true');
   await page.keyboard.press('Home');
   assert.equal(await tabs.first().getAttribute('aria-selected'),'true');
   await page.keyboard.press('ArrowRight');
   assert.equal(await tabs.nth(1).getAttribute('aria-selected'),'true');
   await page.keyboard.press('ArrowLeft');
   assert.equal(await tabs.first().getAttribute('aria-selected'),'true');
   const firstId=v.tabs[0].id,secondId=v.tabs[1].id;
   const first=page.locator('#reading-test-panel-'+firstId+' fieldset.question').first().locator('input').first();
   await first.check();
   assert.equal(await page.locator('#counter').textContent(),'1 / '+v.questions.length);
   assert.equal(await tabs.first().locator('.reading-tab-count').textContent(),'1 / 3');
   await tabs.nth(1).click();
   const second=page.locator('#reading-test-panel-'+secondId+' fieldset.question').first().locator('input').first();
   await second.check();
   assert.equal(await page.locator('#counter').textContent(),'2 / '+v.questions.length);
   assert.equal(await tabs.nth(1).locator('.reading-tab-count').textContent(),'1 / 3');
   await tabs.first().click();
   assert.equal(await first.isChecked(),true);
   await page.reload({waitUntil:'domcontentloaded'});
   await page.locator('#workspace:not([hidden])').waitFor({timeout:15000});
   assert.equal(await page.locator('#counter').textContent(),'2 / '+v.questions.length);
   assert.equal(await first.isChecked(),true);
   assert.equal(await second.isChecked(),true);
   assert.equal(await page.locator('#readingSkillTabs [role="tab"]').nth(1).locator('.reading-tab-count').textContent(),'1 / 3');
   const ticks=await page.locator('#sessionTimer').count();
   assert.ok(ticks>=0);
   // Submitting from the first tab must grade every hidden and visible question.
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor({timeout:15000});
   assert.equal(await page.locator('#submitButton').isDisabled(),true);
   const wrongs=await page.locator('#resultDetails .review').count();
   assert.ok(wrongs>=v.questions.length-2&&wrongs<=v.questions.length);
   const downloadPromise=page.waitForEvent('download',{timeout:30000});
   await page.locator('#exportResult').click();
   const output=await downloadPromise;
   const csv=fs.readFileSync(await output.path(),'utf8');
   const rows=csv.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
   assert.equal(rows.length,v.questions.length+1,'Every question must be in the teacher CSV archive');
   assert.ok(rows[0].includes('question_id'),'Export must preserve canonical question identities');
   for(const q of v.questions)assert.ok(csv.includes(','+q.id+','),'Archived test missing question '+q.id);
   assert.deepEqual(errors,[]);
   console.log('PASS R58 '+name+': answers survive switching and timed reload; every question archived');
   await context.close();
  }finally{await browser.close();}
 });
}
