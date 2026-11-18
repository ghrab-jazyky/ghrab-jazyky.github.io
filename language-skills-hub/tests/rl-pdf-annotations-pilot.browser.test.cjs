#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/self-check/reading/';
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('RL-PDF '+name+': teacher actions resolve to branded readable Asteroids print pages',
 {timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'teacher.html?topic=rl-asteroids&lang=en&level=B2');
   await page.locator('#printStatus').getByText(/Asteroids/).waitFor({timeout:30000});
   for(const id of ['printPracticeText','printPracticeAll','printTestText','printTestAll'])
    assert.match(await page.locator('#'+id).getAttribute('href'),/print-page\.html\?/);
   const target=await page.locator('#printTestAll').getAttribute('href');
   await page.goto(target);
   await page.locator('#printButton:not([disabled])').waitFor({timeout:30000});
   assert.equal(await page.locator('#schoolLogo').evaluate(e=>e.naturalWidth>0),true);
   assert.equal(await page.locator('#readingParagraphs p').count()>0,true);
   assert.equal(await page.locator('.exercise-question').count()>0,true);
   assert.equal(await page.locator('#materialMeta').textContent().then(s=>s.includes('TEST')),true);
   assert.equal(await page.locator('#paper').isVisible(),true);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('RL-02 '+name+': student annotations are local and do not change answers',
 {timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1080,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'index.html?topic=rl-asteroids&lang=en&level=B2');
   await page.locator('#readingParagraphs p').first().waitFor({timeout:30000});
   await page.locator('[data-anno-toggle]').click();
   assert.equal(await page.locator('[data-anno-controls]').isVisible(),true);
   const result=await page.evaluate(()=>{
    const para=document.querySelector('#readingParagraphs p');
    const text=[...para.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim().length>12);
    if(!text)return 'no text';
    const range=document.createRange();range.setStart(text,0);range.setEnd(text,Math.min(8,text.textContent.length));
    const s=window.getSelection();s.removeAllRanges();s.addRange(range);
    para.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
    return range.toString();
   });
   assert.ok(result.length>0,'Must select original text');
   await page.waitForTimeout(180);
   await page.locator('[data-anno-color="yellow"]').click();
   assert.equal(await page.locator('.lsh-annotation-item').count(),1);
   assert.equal(await page.locator('#counter').textContent().then(t=>t.trim().startsWith('0 /')),true);
   await page.locator('[data-anno-toggle]').click();
   assert.equal(await page.locator('[data-anno-controls]').isVisible(),false);
   await page.locator('[data-anno-toggle]').click();
   assert.equal(await page.locator('.lsh-annotation-item').count(),1);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
}
