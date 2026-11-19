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
   await page.locator('#confirmTest').waitFor({timeout:30000});
   assert.equal(await page.locator('#readingPrintSection').count(),0);
   await page.goto('http://127.0.0.1:8765/language-skills-hub/index.html?skill=cteni');
   const materials=page.locator('[data-topic-id="rl-asteroids"] button').filter({hasText:'Materiály PDF'});
   await materials.waitFor({timeout:30000});
   await materials.click();
   await page.locator('#materialsDialog[open]').waitFor();
   for(const id of ['materialsPracticeText','materialsPracticeAll','materialsTestText','materialsTestAll'])
    assert.ok((await page.locator('#'+id).getAttribute('href'))?.includes('rl-asteroids'));
   const target=new URL('print-page.html?topic=rl-asteroids&lang=en&level=B2&mode=test&format=all',base);
   await page.goto(target.href);
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
   await page.locator('#readingAnnotationToggle').click();
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
   await page.locator('#readingAnnotationToggle').click();
   assert.equal(await page.locator('[data-anno-controls]').isVisible(),false);
   await page.locator('#readingAnnotationToggle').click();
   assert.equal(await page.locator('.lsh-annotation-item').count(),1);
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });
 test('RL-02 '+name+': original Asteroids practice retains notes across skill and CEFR changes',
 {timeout:110000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1024,height:850}});
   const page=await context.newPage(),errors=[],resizeObserverWarnings=[];
   page.on('pageerror',e=>{
    // WebKit may report one benign ResizeObserver delivery warning while the
    // original Asteroids card rerenders. Keep all other page errors fatal.
    if(name==='WebKit'&&e.message==='ResizeObserver loop completed with undelivered notifications.'){
     resizeObserverWarnings.push(e.message);return;
    }
    errors.push(e.message);
   });
   await page.goto('http://127.0.0.1:8765/language-skills-hub/cteni/asteroids/index.html?lang=en&level=B2');
   await page.locator('.lsh-anno-header-toggle').waitFor({timeout:30000});
   assert.equal(await page.locator('#readingBody p[data-annotation-anchor]').count()>0,true);
   await page.locator('.lsh-anno-header-toggle').click();
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
   await page.locator('.lsh-anno-header-toggle').waitFor();
   await page.locator('.lsh-anno-header-toggle').click();
   assert.equal(await page.locator('#readingAnnotationTools .lsh-annotation-item').count(),1);
   assert.ok(resizeObserverWarnings.length<=1,
    'Repeated ResizeObserver warnings may indicate a genuine layout loop');
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
   await page.locator('#readingAnnotationToggle').click();
   await page.evaluate(()=>{
    const p=document.querySelector('#readingParagraphs p');
    const t=[...p.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.length>12);
    if(!t)throw new Error('Expected paragraph text node');
    const r=document.createRange();r.setStart(t,0);r.setEnd(t,8);
    const s=getSelection();s.removeAllRanges();s.addRange(r);
    p.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
   });
   await page.waitForTimeout(120);
   await page.locator('[data-anno-color="yellow"]').click();
   assert.equal(await page.locator('.lsh-annotation-item').count(),1);
   await page.locator('#readingParagraphs p').first().evaluate(el=>
    el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true})));
   assert.equal(await page.locator('#sessionLock').isVisible(),false,
    'Native annotation long-press must not be treated as leaving the test');
   const before=await page.locator('#counter').textContent();
   await page.reload();
   await page.locator('#sessionLock').waitFor({state:'visible',timeout:30000});
   assert.equal(await page.locator('.lsh-annotation-item').count(),1);
   assert.equal(await page.locator('#counter').textContent(),before);
   for(const corner of ['tl','tr','bl','br'])
    await page.locator('.lsh-corner-'+corner).click();
   await page.locator('#sessionLock').waitFor({state:'hidden',timeout:10000});
   await page.locator('#readingAnnotationToggle').click();
   assert.equal(await page.locator('[data-anno-controls]').isVisible(),true);
   await page.locator('body').evaluate(el=>
    el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true})));
   await page.locator('#sessionLock').waitFor({state:'visible',timeout:10000});
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });

 test('RL-02 '+name+': Asteroids note previews on desktop hover and mobile tap, text and questions',
 {timeout:120000},async()=>{
  const browser=await engine.launch({headless:true});
  const noteKey='lsh-reading-practice-annotations-v1:rl-asteroids:en:B2';
  const url='http://127.0.0.1:8765/language-skills-hub/cteni/asteroids/index.html?lang=en&level=B2';
  const selectors=[
   '#readingBody p[data-annotation-anchor]',
   '#questions .qcard h3[data-annotation-anchor]',
   '#questions .choices .choice span[data-annotation-anchor]'
  ];
  const errors=[];
  try{
   const desktop=await browser.newContext({viewport:{width:1110,height:880}});
   const page=await desktop.newPage();
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(url);
   await page.locator('.lsh-anno-header-toggle').waitFor({timeout:30000});
   await page.locator('.lsh-anno-header-toggle').click();
   assert.equal(await page.locator('[data-anno-color="blue"]').count(),1);
   for(let i=0;i<selectors.length;i++){
    const selector=selectors[i];
    const target=page.locator(selector).first();
    await target.scrollIntoViewIfNeeded();
    const chosen=await page.evaluate(selector=>{
     const el=document.querySelector(selector);
     const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
     let node;
     while((node=walker.nextNode())&&!node.textContent.trim()){}
     if(!node||node.textContent.trim().length<3)throw new Error('No selectable note text: '+selector);
     const start=node.textContent.search(/\S/),end=Math.min(node.textContent.length,start+8);
     const range=document.createRange();range.setStart(node,start);range.setEnd(node,end);
     const selection=getSelection();selection.removeAllRanges();selection.addRange(range);
     el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));
     return range.toString();
    },selector);
    await page.waitForTimeout(90);
    await page.locator('[data-anno-start-note]').click();
    await page.locator('[data-anno-note]').fill('Pilot note '+i+' <script>alert(1)</script>');
    await page.locator('[data-anno-save-note]').click();
    assert.equal(await page.locator('.lsh-annotation-item').count(),i+1);
    await target.scrollIntoViewIfNeeded();
    const point=await page.evaluate(({selector,length})=>{
     const el=document.querySelector(selector),walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
     let node;while((node=walker.nextNode())&&!node.textContent.trim()){}
     const start=node.textContent.search(/\S/);
     const range=document.createRange();range.setStart(node,start);range.setEnd(node,start+length);
     const r=range.getClientRects()[0];
     return {x:r.left+Math.min(4,r.width/2),y:r.top+r.height/2};
    },{selector,length:chosen.length});
    await page.mouse.move(point.x,point.y);
    await page.locator('.lsh-annotation-popover:not([hidden])').waitFor({timeout:5000});
    assert.ok((await page.locator('.lsh-annotation-popover-text').textContent()).includes('Pilot note '+i));
    assert.equal(await page.locator('.lsh-annotation-popover-text script').count(),0);
    await page.mouse.move(3,3);
    await page.locator('.lsh-annotation-popover[hidden]').waitFor();
    await page.mouse.click(point.x,point.y);
    await page.locator('.lsh-annotation-popover-pinned:not([hidden])').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('.lsh-annotation-popover[hidden]').waitFor();
   }
   const saved=await page.evaluate(key=>localStorage.getItem(key),noteKey);
   assert.ok(saved&&JSON.parse(saved).filter(x=>x.kind==='note').length===3);
   await page.locator('.lsh-annotation-view-note').first().click();
   await page.locator('.lsh-annotation-popover-pinned:not([hidden])').waitFor();
   await page.locator('.lsh-annotation-popover-close').click();
   await page.locator('.lsh-annotation-popover[hidden]').waitFor();
   await desktop.close();
   const mobile=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true
   });
   const phone=await mobile.newPage();phone.on('pageerror',error=>errors.push(error.message));
   await phone.goto(url);
   await phone.evaluate(({key,saved})=>localStorage.setItem(key,saved),{key:noteKey,saved});
   await phone.reload();
   await phone.locator('.lsh-anno-header-toggle').click();
   assert.equal(await phone.locator('.lsh-annotation-item').count(),3);
   for(let i=0;i<selectors.length;i++){
    const target=phone.locator(selectors[i]).first();
    await target.scrollIntoViewIfNeeded();
    const point=await phone.evaluate(({selector,i})=>{
     const anchor=document.querySelector(selector);
     const note=JSON.parse(localStorage.getItem('lsh-reading-practice-annotations-v1:rl-asteroids:en:B2'))
      .filter(x=>x.kind==='note')[i];
     const walker=document.createTreeWalker(anchor,NodeFilter.SHOW_TEXT);
     let node,position=0,start=null,end=null;
     while((node=walker.nextNode())){
      const next=position+node.textContent.length;
      if(!start&&note.start>=position&&note.start<=next)start={node,at:note.start-position};
      if(start&&note.end>=position&&note.end<=next){end={node,at:note.end-position};break;}
      position=next;
     }
     if(!start||!end)throw new Error('Missing note range');
     const range=document.createRange();range.setStart(start.node,start.at);range.setEnd(end.node,end.at);
     const rect=range.getClientRects()[0];
     return {x:rect.left+Math.min(3,rect.width/2),y:rect.top+rect.height/2};
    },{selector:selectors[i],i});
    await phone.touchscreen.tap(point.x,point.y);
    await phone.locator('.lsh-annotation-popover-pinned:not([hidden])').waitFor();
    assert.ok((await phone.locator('.lsh-annotation-popover-text').textContent()).includes('Pilot note '+i));
    await phone.locator('.lsh-annotation-popover-close').click();
   }
   await mobile.close();
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });

}
