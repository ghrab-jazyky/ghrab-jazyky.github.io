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
   const typography=await page.locator('#readingParagraphs').evaluate(el=>({
    alignment:getComputedStyle(el).textAlign,
    hyphens:getComputedStyle(el).hyphens
   }));
   assert.equal(typography.alignment,'justify');
   assert.equal(typography.hyphens,'auto');
   if(name==='Chromium'){
    const pdf=await page.pdf({printBackground:true,preferCSSPageSize:true});
    assert.ok(pdf.length>15000,'Printed PDF must contain content and school logo');
    assert.match(pdf.toString('latin1',0,8),/^%PDF/);
   }
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
 test('RL-02 '+name+': original Asteroids practice retains notes across skill and CEFR changes',
 {timeout:110000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1024,height:850}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/language-skills-hub/cteni/asteroids/index.html?lang=en&level=B2');
   await page.locator('#readingAnnotationTools [data-anno-toggle]').waitFor({timeout:30000});
   assert.equal(await page.locator('#readingBody p[data-annotation-anchor]').count()>0,true);
   await page.locator('#readingAnnotationTools [data-anno-toggle]').click();
   const selection=await page.evaluate(()=>{
    const p=document.querySelector('#readingBody p');
    const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);
    let text=null,n;while((n=walker.nextNode()))if(n.textContent.length>12){text=n;break}
    if(!text)return '';
    const range=document.createRange();range.setStart(text,0);range.setEnd(text,8);
    const sel=getSelection();sel.removeAllRanges();sel.addRange(range);
    p.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
    return range.toString();
   });
   assert.ok(selection.length>0);
   await page.waitForTimeout(100);
   await page.locator('#readingAnnotationTools [data-anno-color="yellow"]').click();
   assert.equal(await page.locator('#readingAnnotationTools .lsh-annotation-item').count(),1);
   await page.locator('#readingAnnotationTools .lsh-annotation-actions button').first().click();
   assert.equal(await page.locator('#readingAnnotationTools .lsh-annotation-item').count(),1);
   const tabs=page.locator('#skillTabs button[data-skill]');
   assert.ok(await tabs.count()>1);
   await tabs.nth(1).click();
   assert.equal(await page.locator('#readingAnnotationTools .lsh-annotation-item').count(),1);
   await page.locator('#levels [data-level="A1"]').click();
   assert.equal(await page.locator('#readingAnnotationTools .lsh-annotation-item').count(),0);
   await page.locator('#levels [data-level="B2"]').click();
   assert.equal(await page.locator('#readingAnnotationTools .lsh-annotation-item').count(),1);
   await page.reload();
   await page.locator('#readingAnnotationTools [data-anno-toggle]').waitFor();
   await page.locator('#readingAnnotationTools [data-anno-toggle]').click();
   assert.equal(await page.locator('#readingAnnotationTools .lsh-annotation-item').count(),1);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close()}
 });

 test('RL-02 '+name+': timed Reading keeps ungraded notes through a locked reload',
 {timeout:120000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await (await browser.newContext({viewport:{width:1024,height:850}})).newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'index.html?topic=rl-asteroids&lang=en&level=B2&timer=5&attempt=rlannotationlock123');
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor({timeout:30000});
   await page.locator('[data-anno-toggle]').click();
   await page.evaluate(()=>{
    const p=document.querySelector('#readingParagraphs p'),t=p.firstChild;
    if(!t||t.nodeType!==Node.TEXT_NODE)throw new Error('Expected first text node');
    const r=document.createRange();r.setStart(t,0);r.setEnd(t,8);
    const s=getSelection();s.removeAllRanges();s.addRange(r);
    p.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
   });
   await page.waitForTimeout(120);
   await page.locator('[data-anno-color="yellow"]').click();
   assert.equal(await page.locator('.lsh-annotation-item').count(),1);
   const before=await page.locator('#counter').textContent();
   await page.reload();
   await page.locator('#sessionLock').waitFor({state:'visible',timeout:30000});
   assert.equal(await page.locator('.lsh-annotation-item').count(),1);
   assert.equal(await page.locator('#counter').textContent(),before);
   for(const corner of ['tl','tr','bl','br'])
    await page.locator('.lsh-corner-'+corner).click();
   await page.locator('#sessionLock').waitFor({state:'hidden',timeout:10000});
   await page.locator('[data-anno-toggle]').click();
   assert.equal(await page.locator('[data-anno-controls]').isVisible(),true);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });

}
