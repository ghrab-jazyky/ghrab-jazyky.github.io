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
   // PDF URLs use content-addressed ?v=SHA to avoid stale GitHub Pages caches.
   // Verify their pathname and version instead of requiring the URL to end in .pdf.
   await page.waitForFunction(()=>['materialsPracticeText','materialsPracticeAll',
    'materialsTestText','materialsTestAll'].every(id=>{
    const href=document.getElementById(id)?.getAttribute('href');
    if(!href)return false;
    const url=new URL(href,document.baseURI);
    return url.pathname.endsWith('.pdf')&&/^[a-f0-9]{16}$/.test(url.searchParams.get('v')||'');
   }));
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
  const recordError=error=>{
   if(name==='WebKit'&&error.message==='ResizeObserver loop completed with undelivered notifications.')return;
   errors.push(error.message);
  };
  try{
   const desktop=await browser.newContext({viewport:{width:1110,height:880}});
   const page=await desktop.newPage();
   page.on('pageerror',recordError);
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
    try{await page.locator('.lsh-annotation-popover:not([hidden])').waitFor({timeout:5000})}
    catch(error){
     const info=await page.evaluate(({x,y,selector})=>{
     const hit=document.elementFromPoint(x,y),anchor=document.querySelector(selector);
     const raw=localStorage.getItem('lsh-reading-practice-annotations-v1:rl-asteroids:en:B2');
     return {hit:hit?.tagName+'#'+hit?.id+'.'+hit?.className,insideAnchor:anchor?.contains(hit),
      anchor:anchor?.dataset.annotationAnchor,selected:window.getSelection()?.toString(),
      collapsed:window.getSelection()?.isCollapsed,
      mode:document.querySelector('.lsh-anno-header-toggle')?.getAttribute('aria-pressed'),
      popup:document.querySelector('.lsh-annotation-popover')?.outerHTML.slice(0,400),
      saved:raw?JSON.parse(raw).map(i=>({anchor:i.anchor,kind:i.kind,start:i.start,end:i.end,text:i.text,note:i.note.slice(0,25)})):[]
     };
    },{x:point.x,y:point.y,selector});
     throw new Error('Hover note '+i+' did not open: '+JSON.stringify(info)+' / '+error.message);
    }
    assert.ok((await page.locator('.lsh-annotation-popover-text').textContent()).includes('Pilot note '+i));
    assert.equal(await page.locator('.lsh-annotation-popover-text script').count(),0);
    await page.mouse.move(3,3);
    await page.locator('.lsh-annotation-popover').waitFor({state:'hidden'});
    await page.mouse.click(point.x,point.y);
    try{await page.locator('.lsh-annotation-popover-pinned:not([hidden])').waitFor({timeout:5000})}
    catch(error){
     const info=await page.evaluate(({x,y,selector})=>{
     const hit=document.elementFromPoint(x,y),anchor=document.querySelector(selector);
     const raw=localStorage.getItem('lsh-reading-practice-annotations-v1:rl-asteroids:en:B2');
     return {hit:hit?.tagName+'#'+hit?.id+'.'+hit?.className,insideAnchor:anchor?.contains(hit),
      anchor:anchor?.dataset.annotationAnchor,selected:window.getSelection()?.toString(),
      collapsed:window.getSelection()?.isCollapsed,
      mode:document.querySelector('.lsh-anno-header-toggle')?.getAttribute('aria-pressed'),
      popup:document.querySelector('.lsh-annotation-popover')?.outerHTML.slice(0,400),
      saved:raw?JSON.parse(raw).map(i=>({anchor:i.anchor,kind:i.kind,start:i.start,end:i.end,text:i.text,note:i.note.slice(0,25)})):[]
     };
    },{x:point.x,y:point.y,selector});
     throw new Error('Click note '+i+' did not pin: '+JSON.stringify(info)+' / '+error.message);
    }
    await page.keyboard.press('Escape');
    await page.locator('.lsh-annotation-popover').waitFor({state:'hidden'});
   }
   const saved=await page.evaluate(key=>localStorage.getItem(key),noteKey);
   assert.ok(saved&&JSON.parse(saved).filter(x=>x.kind==='note').length===3);
   await page.locator('.lsh-annotation-view-note').first().click();
   await page.locator('.lsh-annotation-popover-pinned:not([hidden])').waitFor();
   await page.locator('.lsh-annotation-popover-close').click();
   await page.locator('.lsh-annotation-popover').waitFor({state:'hidden'});
   await desktop.close();
   const mobile=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true
   });
   const phone=await mobile.newPage();phone.on('pageerror',recordError);
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
    try{await phone.locator('.lsh-annotation-popover-pinned:not([hidden])').waitFor({timeout:5000})}
    catch(error){
     const info=await phone.evaluate(({selector,point})=>{
      const hit=document.elementFromPoint(point.x,point.y),sel=getSelection();
      return {hit:hit?.tagName+'.'+hit?.className,anchor:document.querySelector(selector)?.dataset.annotationAnchor,
       isInside:document.querySelector(selector)?.contains(hit),selection:sel?.toString(),collapsed:sel?.isCollapsed,
       mode:document.querySelector('.lsh-anno-header-toggle')?.getAttribute('aria-pressed'),
       popup:document.querySelector('.lsh-annotation-popover')?.outerHTML.slice(0,550)};
     },{selector:selectors[i],point});
     throw new Error('Mobile note '+i+' did not open: '+JSON.stringify(info)+' / '+error.message);
    }
    assert.ok((await phone.locator('.lsh-annotation-popover-text').textContent()).includes('Pilot note '+i));
    await phone.locator('.lsh-annotation-popover-close').click();
   }
   await mobile.close();
   assert.deepEqual(errors,[]);
  }finally{await browser.close()}
 });

}

for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('RL-02 '+name+': desktop sticky tools and clear-all, reference Asteroids practice',
 {timeout:110000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:900}});
   await page.goto('http://127.0.0.1:8765/language-skills-hub/cteni/asteroids/index.html?lang=en&level=B2');
   await page.locator('.lsh-anno-header-toggle').click();
   const count=()=>page.locator('#readingAnnotationTools .lsh-annotation-item').count();
   const select=(start,end)=>page.evaluate(({start,end})=>{
    const para=document.querySelector('#readingBody p[data-annotation-anchor]');
    const walker=document.createTreeWalker(para,NodeFilter.SHOW_TEXT);
    let node;while((node=walker.nextNode())&&node.textContent.length<end){}
    if(!node)throw new Error('Missing text node for sticky tool test');
    const r=document.createRange();r.setStart(node,start);r.setEnd(node,end);
    getSelection().removeAllRanges();getSelection().addRange(r);
    para.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'mouse',button:0}));
   },{start,end});
   const yellow=page.locator('[data-anno-color="yellow"]');
   await yellow.click();
   assert.equal(await yellow.getAttribute('aria-pressed'),'true');
   await select(0,5);
   await page.waitForTimeout(100);
   assert.equal(await count(),1);
   await select(6,11);
   await page.waitForTimeout(100);
   assert.equal(await count(),2,'Second drag uses same active colour');
   const underline=page.locator('[data-anno-underline]');
   await underline.click();
   assert.equal(await yellow.getAttribute('aria-pressed'),'false');
   await select(12,17);
   await page.waitForTimeout(100);
   assert.equal(await count(),3);
   await underline.click();
   assert.equal(await underline.getAttribute('aria-pressed'),'false');
   await select(18,23);
   await page.waitForTimeout(100);
   assert.equal(await count(),3,'Toggled-off tool must not annotate');
   const note=page.locator('[data-anno-start-note]');
   await note.click();
   await select(24,29);
   await page.locator('[data-anno-note-box]:not([hidden])').waitFor();
   await page.locator('[data-anno-note]').fill('This is a note');
   await page.locator('[data-anno-save-note]').click();
   assert.equal(await count(),4);
   assert.equal(await note.getAttribute('aria-pressed'),'true');
   const clear=page.locator('[data-anno-clear-all]');
   await clear.click();
   await page.locator('[data-anno-clear-confirm]:not([hidden])').waitFor();
   await page.locator('[data-anno-clear-cancel]').click();
   assert.equal(await count(),4,'Cancel preserves annotations');
   await clear.click();
   await page.locator('[data-anno-clear-confirm-action]').click();
   assert.equal(await count(),0);
   assert.equal(await clear.isDisabled(),true);
   await page.reload();
   await page.locator('.lsh-anno-header-toggle').click();
   assert.equal(await count(),0,'Clear-all persists for current language/level');
  }finally{await browser.close()}
 });
}


// F1: direct URLs, identity, canonical offsets, write conflicts and populated layout.
const f1URL='http://127.0.0.1:8765/language-skills-hub/cteni/asteroids/index.html';
const f1Key='lsh-reading-practice-annotations-v1:rl-asteroids:en:B2';
const f1Para='#readingBody p[data-annotation-anchor="p:0"]';
async function f1Open(page,lang='en',level='B2'){
 await page.goto(f1URL+'?lang='+lang+'&level='+level,{waitUntil:'load'});
 const toggle=page.locator('.topbar .controls .lsh-anno-header-toggle');
 await toggle.waitFor({state:'visible'});
 assert.equal(await page.locator('.lsh-anno-header-toggle').count(),1);
 assert.equal(await page.locator('#lookup .lsh-anno-header-toggle').count(),0);
 await toggle.click();
 await page.locator('[data-anno-controls]:visible').waitFor();
}
async function f1Select(page,selector,start,end){
 return page.evaluate(({selector,start,end})=>{
  const anchor=document.querySelector(selector);
  const walk=document.createTreeWalker(anchor,NodeFilter.SHOW_TEXT);
  let n,pos=0,a,b;
  while((n=walk.nextNode())){
   const next=pos+n.textContent.length;
   if(!a&&start>=pos&&start<=next)a=[n,start-pos];
   if(a&&end>=pos&&end<=next){b=[n,end-pos];break;}
   pos=next;
  }
  if(!a||!b)throw Error('Missing range '+selector);
  const r=document.createRange();r.setStart(...a);r.setEnd(...b);
  getSelection().removeAllRanges();getSelection().addRange(r);
  document.dispatchEvent(new Event('selectionchange'));
  return r.toString();
 },{selector,start,end});
}
async function f1Note(page,selector,start,end,note){
 await f1Select(page,selector,start,end);
 await page.locator('[data-anno-start-note]').click();
 await page.locator('[data-anno-note]:visible').fill(note);
 await page.locator('[data-anno-save-note]').click();
 await page.locator('[data-anno-note-box]').waitFor({state:'hidden'});
}
const f1Records=(page,key=f1Key)=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'[]'),key);
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('F1 '+name+': 24 direct language/level URLs mount the annotation toggle', {timeout:160000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   for(const lang of ['en','es','de','fr'])for(const level of ['A1','A2','B1','B2','C1','C2']){
    await f1Open(page,lang,level);
    assert.equal(await page.locator('#language').inputValue(),lang);
    assert.equal(await page.locator('#levels [aria-pressed="true"]').getAttribute('data-level'),level);
   }
  }finally{await browser.close()}
 });
 test('F1 '+name+': stable note IDs, draft guard, stale selection, narrow populated rows',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:900}});
   await f1Open(page);
   await f1Note(page,f1Para,0,4,'A');await f1Note(page,f1Para,5,9,'B');await f1Note(page,f1Para,10,15,'C');
   const initial=await f1Records(page);
   assert.equal(new Set(initial.map(x=>x.id)).size,3);
   const rows=page.locator('.lsh-annotation-item');
   await rows.nth(1).getByRole('button',{name:'Upravit anotaci 2'}).click();
   await page.locator('[data-anno-note]').fill('B edited');
   await rows.nth(0).getByRole('button',{name:'Smazat anotaci 1'}).click();
   await page.locator('[data-anno-save-note]').click();
   assert.deepEqual((await f1Records(page)).map(x=>[x.id,x.note]),[[initial[1].id,'B edited'],[initial[2].id,'C']]);
   await rows.first().getByRole('button',{name:'Upravit anotaci 1'}).click();
   await page.locator('[data-anno-note]').fill('unsaved');
   await page.locator('#levels [data-level="C1"]').click();
   assert.equal(await page.locator('#levels [aria-pressed="true"]').getAttribute('data-level'),'B2');
   assert.equal(await page.locator('[data-anno-note]').inputValue(),'unsaved');
   await page.locator('[data-anno-cancel-note]').click();
   await f1Select(page,f1Para,0,4);
   await page.evaluate(()=>{getSelection().removeAllRanges();document.dispatchEvent(new Event('selectionchange'))});
   await page.locator('[data-anno-color="yellow"]').click();
   assert.equal((await f1Records(page)).length,2,'Collapsed range must not be stored');
   await page.locator('[data-anno-color="yellow"]').click();
   await f1Select(page,f1Para,0,4);
   await page.evaluate(()=>{
    const a=document.querySelector('#readingBody p'),b=a.nextElementSibling;
    const r=document.createRange();r.setStart(a.firstChild,0);r.setEnd(b.firstChild,4);
    getSelection().removeAllRanges();getSelection().addRange(r);document.dispatchEvent(new Event('selectionchange'));
   });
   await page.locator('[data-anno-color="green"]').click();
   assert.equal((await f1Records(page)).length,2,'Cross-anchor selection must not reuse earlier text');
   for(const width of [320,360,390,430,650,768,1024]){
    await page.setViewportSize({width,height:850});
    const m=await rows.first().evaluate(row=>{
     const r=row.getBoundingClientRect(),l=row.querySelector('.lsh-annotation-item-label').getBoundingClientRect();
     return {row:r.width,label:l.width,actionsRight:row.querySelector('.lsh-annotation-actions').getBoundingClientRect().right,rowRight:r.right};
    });
    assert.ok(m.label>=Math.min(140,m.row*.75),name+' '+width+' unusable text '+JSON.stringify(m));
    assert.ok(m.actionsRight<=m.rowRight+2,name+' '+width+' actions overflow');
   }
  }finally{await browser.close()}
 });
 test('F1 '+name+': exact source ranges survive reveal/re-hide across 16 gap variants',{timeout:160000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:900}});
   for(const lang of ['en','es','de','fr'])for(const level of ['B1','B2','C1','C2']){
    await f1Open(page,lang,level);
    const key='lsh-reading-practice-annotations-v1:rl-asteroids:'+lang+':'+level;
    const gap=await page.evaluate(()=>{
     const v=DATA[document.getElementById('language').value][document.querySelector('#levels [aria-pressed="true"]').dataset.level];
     const selector='#readingBody [data-annotation-anchor="p:'+v.gap.p+'"]';
     return {selector,text:document.querySelector(selector).textContent,source:v.paragraphs[v.gap.p]};
    });
    assert.ok(gap.text.startsWith('[…] '),lang+'/'+level);
    const quote=await f1Select(page,gap.selector,4,Math.min(34,gap.text.length));
    await page.locator('[data-anno-color="yellow"]').click();
    const rec=await f1Records(page,key);assert.equal(rec.length,1);assert.equal(rec[0].basis,'source-v1');
    assert.equal(gap.source.slice(rec[0].start,rec[0].end),quote);
    const painted=()=>page.evaluate(()=>[...CSS.highlights.get('lsh-anno-yellow')].map(r=>r.toString()));
    assert.deepEqual(await painted(),[quote]);
    await page.locator('#checkAll').click();assert.deepEqual(await painted(),[quote],lang+'/'+level+' reveal');
    await page.locator('#skillTabs [data-skill="structure"]').click();await page.locator('#clear').click();
    assert.deepEqual(await painted(),[quote],lang+'/'+level+' re-hide');
   }
  }finally{await browser.close()}
 });
 // Measure after Playwright has brought the element into view. An immediate
 // getBoundingClientRect after smooth scrollIntoView returns stale coordinates.
 async function choicePoint(page,choice){
  const target=page.locator(choice).first();
  await target.scrollIntoViewIfNeeded();
  const point=await target.evaluate(el=>{
   const r=document.createRange();r.setStart(el.firstChild,0);r.setEnd(el.firstChild,4);
   const rect=r.getClientRects()[0];
   if(!rect||!rect.width||!rect.height)throw Error('No visible note range');
   return {x:rect.left+Math.min(4,rect.width/2),y:rect.top+rect.height/2};
  });
  const hit=await page.evaluate(({point,choice})=>{
   const anchor=document.querySelector(choice),el=document.elementFromPoint(point.x,point.y);
   return {inside:!!el&&anchor.contains(el),tag:el?.tagName,id:el?.id,cls:el?.className,point,selected:getSelection()?.toString()};
  },{point,choice});
  assert.ok(hit.inside,'Note point must hit its own text: '+JSON.stringify(hit));
  return point;
 }
 test('F1 '+name+': native desktop click and mobile tap on choice note do not change the answer',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const desktop=await browser.newContext({viewport:{width:1200,height:900},reducedMotion:'reduce'});
   const a=await desktop.newPage();
   await f1Open(a);
   const choice='#questions .choice span[data-annotation-anchor]';
   await f1Note(a,choice,0,4,'choice note');
   const saved=await f1Records(a);
   assert.equal(saved.length,1);assert.equal(saved[0].kind,'note');
   const radio=a.locator('#questions .choice input').first();
   const point=await choicePoint(a,choice);
   assert.equal(await radio.isChecked(),false);
   await a.mouse.move(point.x,point.y);
   await a.locator('.lsh-annotation-popover:not([hidden])').waitFor({timeout:5000});
   assert.equal(await a.locator('.lsh-annotation-popover-text').textContent(),'choice note');
   await a.mouse.click(point.x,point.y);
   await a.locator('.lsh-annotation-popover-pinned:not([hidden])').waitFor({timeout:5000});
   assert.equal(await radio.isChecked(),false,'Note preview must not answer');
   await a.locator('.lsh-annotation-popover-close').click();await radio.click();
   assert.equal(await radio.isChecked(),true,'Direct radio remains functional');
   const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
   const m=await mobile.newPage();
   await m.goto(f1URL+'?lang=en&level=B2');
   await m.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key:f1Key,saved});
   await f1Open(m);
   const mr=m.locator('#questions .choice input').first();
   const mp=await choicePoint(m,choice);
   assert.equal(await mr.isChecked(),false);
   await m.touchscreen.tap(mp.x,mp.y);
   await m.locator('.lsh-annotation-popover-pinned:not([hidden])').waitFor({timeout:5000});
   assert.equal(await mr.isChecked(),false,'Touch note preview must not answer');
   await m.locator('.lsh-annotation-popover-close').click();await mr.tap();
   assert.equal(await mr.isChecked(),true,'Direct radio tap remains functional');
  }finally{await browser.close()}
 });
 test('F1 '+name+': stale tab and failed writes do not overwrite or lose notes',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:1200,height:900},reducedMotion:'reduce'});
   const a=await ctx.newPage(),b=await ctx.newPage();
   await a.bringToFront();await f1Open(a);
   await b.bringToFront();await f1Open(b);
   await a.bringToFront();await f1Note(a,f1Para,0,4,'original note');
   const initial=await f1Records(a);assert.equal(initial.length,1);
   await b.bringToFront();
   await f1Select(b,f1Para,0,4);await b.locator('[data-anno-color="yellow"]').click();
   assert.equal(await b.locator('.lsh-annotation-item').count(),0);
   assert.deepEqual(await f1Records(a),initial);
   assert.match(await b.locator('[data-anno-status]').textContent(),/jiné záložce/);
   await a.bringToFront();
   await a.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){
    if(k.startsWith('lsh-reading-practice-annotations-v1:'))throw Error('Simulated quota failure');
    return original.call(this,k,v);
   }});
   await f1Select(a,f1Para,0,4);await a.locator('[data-anno-color="green"]').click();
   assert.equal(await a.locator('.lsh-annotation-item').count(),1);
   assert.match(await a.locator('[data-anno-status]').textContent(),/nelze trvale uložit/);
   await a.locator('.lsh-annotation-item').first().getByRole('button',{name:'Smazat anotaci 1'}).click();
   assert.equal(await a.locator('.lsh-annotation-item').count(),1);assert.deepEqual(await f1Records(a),initial);
  }finally{await browser.close()}
 });
}


// F2: new interaction tests deliberately separate native mouse/keyboard
// gestures from synthetic touch selection lifecycle. Hardware handle behavior
// is a manual certification item, not inferred from Playwright emulation.
async function f2SetSelection(page,selector,start,end,pointerType){
 return page.evaluate(({selector,start,end,pointerType})=>{
  const el=document.querySelector(selector);
  const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n,at=0,a,b;
  while((n=w.nextNode())){
   const next=at+n.textContent.length;
   if(!a&&start>=at&&start<=next)a=[n,start-at];
   if(a&&end>=at&&end<=next){b=[n,end-at];break;}
   at=next;
  }
  if(!a||!b)throw Error('F2 range unavailable');
  const range=document.createRange();range.setStart(...a);range.setEnd(...b);
  if(pointerType)el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType,button:0,isPrimary:true}));
  const selection=getSelection();selection.removeAllRanges();selection.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
  if(pointerType)el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType,button:0,isPrimary:true}));
  return range.toString();
 },{selector,start,end,pointerType});
}
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('F2 '+name+': native mouse drag and keyboard selection commit without changing answers',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:900},reducedMotion:'reduce'});
   await f1Open(page);
   await page.locator('[data-anno-color="yellow"]').click();
   const para=page.locator(f1Para);
   await para.scrollIntoViewIfNeeded();
   const points=await para.evaluate(el=>{
    const n=el.firstChild;if(n.nodeType!==Node.TEXT_NODE)throw Error('Expected text node');
    const r=document.createRange();
    const at=i=>{r.setStart(n,i);r.setEnd(n,i+1);const b=r.getBoundingClientRect();return {x:b.left+b.width*.15,y:b.top+b.height/2}};
    return {a:at(0),b:at(9)};
   });
   await page.mouse.move(points.a.x,points.a.y);await page.mouse.down();
   await page.mouse.move(points.b.x,points.b.y,{steps:10});await page.mouse.up();
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'[]').length===1,f1Key);
   assert.ok((await f1Records(page))[0].text.length>=5,'Native drag must annotate its actual text');
   await page.locator('[data-anno-color="blue"]').click();
   const choice=page.locator('#questions .choice span[data-annotation-anchor]').first();
   assert.equal(await choice.getAttribute('tabindex'),'0');
   await choice.focus();
   for(let i=0;i<4;i++)await page.keyboard.press('Shift+ArrowRight');
   await page.locator('[data-anno-apply-selection]').waitFor({state:'visible'});
   const quote=await page.evaluate(()=>getSelection().toString());
   assert.equal(quote.length,4);
   await page.keyboard.press('Enter');
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'[]').length===2,f1Key);
   const records=await f1Records(page);
   assert.equal(records[1].text,quote);assert.equal(records[1].color,'blue');
   assert.equal(await page.locator('#questions .choice input').first().isChecked(),false);
   await page.locator('.lsh-anno-header-toggle').click();
   assert.equal(await choice.getAttribute('tabindex'),null);
   assert.equal(await page.locator('[data-anno-color="blue"]').getAttribute('aria-pressed'),'false');
  }finally{await browser.close()}
 });
 test('F2 '+name+': touch and pen wait for explicit final selection, cancel never saves',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
   const page=await ctx.newPage();
   await f1Open(page);await page.locator('[data-anno-color="green"]').click();
   await page.locator(f1Para).scrollIntoViewIfNeeded();
   await f2SetSelection(page,f1Para,0,4,'touch');
   await page.waitForTimeout(750);
   assert.equal((await f1Records(page)).length,0,'No timed write after touch release');
   await page.locator('[data-anno-apply-selection]').waitFor({state:'visible'});
   // Native selection handles may change the range after pointer release.
   const finalQuote=await f2SetSelection(page,f1Para,0,12,null);
   await page.waitForTimeout(500);
   assert.equal((await f1Records(page)).length,0);
   await page.locator('[data-anno-apply-selection]').tap();
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'[]').length===1,f1Key);
   assert.equal((await f1Records(page))[0].text,finalQuote);
   await page.locator('[data-anno-apply-selection]').waitFor({state:'hidden'});
   await page.setViewportSize({width:820,height:1180});
   const penQuote=await f2SetSelection(page,f1Para,14,23,'pen');
   await page.waitForTimeout(500);
   assert.equal((await f1Records(page)).length,1,'Pen release cannot write');
   await page.locator('[data-anno-cancel-selection]').tap();
   assert.equal((await f1Records(page)).length,1);
   await page.locator('[data-anno-apply-selection]').waitFor({state:'hidden'});
   await f2SetSelection(page,f1Para,14,23,'pen');
   await page.locator('[data-anno-apply-selection]').tap();
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'[]').length===2,f1Key);
   assert.equal((await f1Records(page))[1].text,penQuote);
   await f2SetSelection(page,f1Para,26,34,'touch');
   await page.locator('#levels [data-level="C1"]').click();
   await page.locator('[data-anno-apply-selection]').waitFor({state:'hidden'});
   assert.equal(await page.locator('[data-anno-color="green"]').getAttribute('aria-pressed'),'false');
   assert.equal((await f1Records(page)).length,2,'Variant switch cannot commit pending text');
  }finally{await browser.close()}
 });
 test('F2 '+name+': dictionary exclusion, editor focus and pinned popup after viewport change',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:900},reducedMotion:'reduce'});
   await page.goto(f1URL+'?lang=es&level=B2');
   const dictionary=page.locator('#dictionaryToggle'),toggle=page.locator('.lsh-anno-header-toggle');
   if(await dictionary.getAttribute('aria-pressed')!=='true')await dictionary.click();
   await toggle.click();assert.equal(await dictionary.getAttribute('aria-pressed'),'false');
   assert.equal(await toggle.getAttribute('aria-pressed'),'true');
   await dictionary.click();assert.equal(await dictionary.getAttribute('aria-pressed'),'true');
   assert.equal(await toggle.getAttribute('aria-pressed'),'false');
   await toggle.click();assert.equal(await dictionary.getAttribute('aria-pressed'),'false');
   await f1Select(page,f1Para,0,4);
   await page.locator('[data-anno-start-note]').click();
   const input=page.locator('[data-anno-note]');
   assert.ok(await input.evaluate(el=>document.activeElement===el));
   await input.fill('Rozpracováno');
   await dictionary.click();
   assert.equal(await input.inputValue(),'Rozpracováno');
   assert.equal(await dictionary.getAttribute('aria-pressed'),'false');
   await page.keyboard.press('Escape');
   await page.locator('[data-anno-note-box]').waitFor({state:'hidden'});
   await f1Note(page,f1Para,5,10,'focus note');
   const show=page.locator('.lsh-annotation-view-note').first();
   await show.focus();await page.keyboard.press('Enter');
   const popup=page.locator('.lsh-annotation-popover-pinned:not([hidden])');
   await popup.waitFor();
   assert.ok(await page.locator('.lsh-annotation-popover-close').evaluate(el=>document.activeElement===el));
   // Retain the original immediate assertion; do not hide the race with a
   // timeout. Exercise rapid desktop/phone/landscape/short-window transitions.
   for(const [width,height] of [[390,640],[320,240],[844,390],[1440,900],[360,230],[1200,900],[390,640]]){
    await page.setViewportSize({width,height});
    const geometry=await popup.evaluate(el=>{
     const measure=()=>{
      const r=el.getBoundingClientRect(),v=visualViewport;
      const left=v?.offsetLeft||0,top=v?.offsetTop||0,w=v?.width||innerWidth,h=v?.height||innerHeight;
      return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,w,h,fit:r.left>=left-1&&r.right<=left+w+1&&r.top>=top-1&&r.bottom<=top+h+1};
     };
     const immediate=measure(),style=el.getAttribute('style');
     // Deterministic race replay: the previous wide viewport's requested
     // coordinates survive a layout change until the JS handler runs.
     for(const [key,value] of Object.entries({'--lsh-popup-w':'340px','--lsh-popup-h':'320px','--lsh-popup-x':'850px','--lsh-popup-y':'740px','--lsh-popup-measured-h':'280px'}))el.style.setProperty(key,value);
     const stale=measure();
     if(style===null)el.removeAttribute('style');else el.setAttribute('style',style);
     return {immediate,stale};
    });
    assert.ok(geometry.immediate.fit,'Pinned note must fit immediately '+width+'x'+height+' '+JSON.stringify(geometry.immediate));
    assert.ok(geometry.stale.fit,'CSS must constrain stale viewport coordinates '+width+'x'+height+' '+JSON.stringify(geometry.stale));
    assert.ok(await page.locator('.lsh-annotation-popover-close').evaluate(el=>document.activeElement===el),'Viewport change must preserve focus');
   }
   await page.keyboard.press('Escape');
   assert.ok(await show.evaluate(el=>document.activeElement===el),'Focus must return to the list button');
  }finally{await browser.close()}
 });
}


// F3: rendered geometry, real controls and reversible persisted mutations.
// These are layout/interaction contracts, not physical device screenshots.
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('F3 '+name+': undo is scoped, persisted, atomic on failure and never discards a draft',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:900},reducedMotion:'reduce'});
   await f1Open(page);
   const undo=page.locator('[data-anno-undo]');
   const count=page.locator('[data-anno-count]');
   assert.ok(await undo.isDisabled());assert.equal(await count.textContent(),'0');
   await f1Select(page,f1Para,0,4);await page.locator('[data-anno-color="yellow"]').click();
   assert.equal(await count.textContent(),'1');
   assert.equal(await undo.isDisabled(),false);
   await undo.click();assert.deepEqual(await f1Records(page),[]);
   assert.ok(await undo.isDisabled());
   await f1Note(page,f1Para,0,4,'Original');
   const original=await f1Records(page);
   const edit=page.locator('.lsh-annotation-item').first().getByRole('button',{name:'Upravit anotaci 1'});
   await edit.click();
   assert.ok(await undo.isDisabled());
   assert.equal(await page.locator('[data-anno-editor-quote]').textContent(),'„'+original[0].text+'“');
   assert.equal(await page.locator('[data-anno-note-count]').textContent(),'8 / 500');
   await page.locator('[data-anno-note]').fill('Changed');
   assert.equal(await page.locator('[data-anno-note-count]').textContent(),'7 / 500');
   await page.locator('[data-anno-save-note]').click();
   assert.equal((await f1Records(page))[0].note,'Changed');
   await undo.click();assert.deepEqual(await f1Records(page),original);
   await page.locator('.lsh-annotation-item').first().getByRole('button',{name:'Smazat anotaci 1'}).click();
   assert.equal((await f1Records(page)).length,0);
   await undo.click();assert.deepEqual(await f1Records(page),original);
   await page.locator('[data-anno-clear-all]').click();
   assert.ok(await undo.isDisabled());
   await page.locator('[data-anno-clear-confirm-action]').click();
   assert.equal(await count.textContent(),'0');
   assert.equal(await undo.isDisabled(),false);
   await page.evaluate(()=>{
    window.f3StorageSet=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){if(k.startsWith('lsh-reading-practice-annotations-v1:'))throw Error('F3 write failed');return window.f3StorageSet.call(this,k,v)};
   });
   await undo.click();assert.deepEqual(await f1Records(page),[]);
   assert.ok(!(await undo.isDisabled()),'Failed undo retains history');
   assert.match(await page.locator('[data-anno-status]').textContent(),/nelze trvale uložit/);
   await page.evaluate(()=>{Storage.prototype.setItem=window.f3StorageSet;delete window.f3StorageSet});
   await undo.click();assert.deepEqual(await f1Records(page),original);
   await page.locator('#levels [data-level="C1"]').click();
   assert.ok(await undo.isDisabled());
   await page.locator('#levels [data-level="B2"]').click();
   assert.deepEqual(await f1Records(page),original);
   assert.ok(await undo.isDisabled(),'History is local to current variant/session');
  }finally{await browser.close()}
 });
 test('F3 '+name+': bounded 80-item library, readable editor and controls in both themes and five widths',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:900},reducedMotion:'reduce'});
   await page.goto(f1URL+'?lang=en&level=B2');
   await page.locator(f1Para).waitFor();
   const quote=(await page.locator(f1Para).textContent()).slice(0,4);
   const seeded=Array.from({length:80},(_,i)=>({id:'f3-'+i,anchor:'p:0',start:0,end:4,text:quote,kind:'note',color:'yellow',note:('Note '+i+' <script>alert(1)</script> '+('abcdefghij'.repeat(50))).slice(0,500)}));
   await page.evaluate(({key,seeded})=>localStorage.setItem(key,JSON.stringify(seeded)),{key:f1Key,seeded});
   await f1Open(page);
   const library=page.locator('[data-anno-library]'),list=page.locator('[data-anno-list]');
   assert.equal(await page.locator('[data-anno-count]').textContent(),'80');
   assert.equal(await list.locator('.lsh-annotation-item').count(),80);
   assert.equal(await list.locator('script').count(),0);
   for(const theme of ['dark','light']){
    if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme').click();
    for(const width of [320,390,820,1180,1440]){
     await page.setViewportSize({width,height:850});
     const m=await list.evaluate(el=>{
      const host=el.closest('#readingAnnotationTools'),r=host.getBoundingClientRect();
      const row=el.querySelector('.lsh-annotation-item'),label=row.querySelector('.lsh-annotation-item-label');
      const controls=[...host.querySelectorAll('.lsh-annotation-buttons button,.lsh-annotation-item:first-child button')];
      const colorBtn=host.querySelector('[data-anno-color="yellow"]'),swatch=getComputedStyle(colorBtn,'::before');
      return {client:el.clientHeight,scroll:el.scrollHeight,listWidth:el.clientWidth,listScrollWidth:el.scrollWidth,
       hostWidth:r.width,hostScroll:host.scrollWidth,hostClient:host.clientWidth,labelWidth:label.getBoundingClientRect().width,
       rowWidth:row.getBoundingClientRect().width,minButton:Math.min(...controls.map(b=>b.getBoundingClientRect().height)),
       swatch:swatch.backgroundColor,swatchWidth:swatch.width};
     });
     assert.ok(m.client<=261&&m.scroll>m.client,theme+'/'+width+' list must be bounded '+JSON.stringify(m));
     assert.ok(m.listScrollWidth<=m.listWidth+2&&m.hostScroll<=m.hostClient+2,theme+'/'+width+' annotation UI overflow '+JSON.stringify(m));
     assert.ok(m.labelWidth>=Math.min(140,m.rowWidth*.75),theme+'/'+width+' cramped text '+JSON.stringify(m));
     assert.ok(m.minButton>=44,theme+'/'+width+' target too small '+JSON.stringify(m));
     assert.equal(m.swatch,'rgb(244, 212, 91)');assert.equal(m.swatchWidth,'12px');
    }
   }
   const summary=library.locator('summary');await summary.click();
   assert.equal(await library.getAttribute('open'),null);
   assert.equal(await list.isVisible(),false);assert.equal(await page.locator('[data-anno-count]').textContent(),'80');
   await summary.click();assert.ok(await list.isVisible());assert.deepEqual(await f1Records(page),seeded);
   await page.setViewportSize({width:320,height:640});
   await page.locator('.lsh-annotation-item').first().getByRole('button',{name:'Upravit anotaci 1'}).click();
   const input=page.locator('[data-anno-note]');
   assert.equal(await input.inputValue(),seeded[0].note);
   assert.equal(await page.locator('[data-anno-note-count]').textContent(),'500 / 500');
   const fits=await input.evaluate(el=>{const b=el.getBoundingClientRect(),box=el.closest('[data-anno-note-box]').getBoundingClientRect();return b.left>=box.left&&b.right<=box.right&&parseFloat(getComputedStyle(el).fontSize)>=16;});
   assert.ok(fits);
   await page.locator('[data-anno-cancel-note]').click();assert.deepEqual(await f1Records(page),seeded);
  }finally{await browser.close()}
 });
 test('F3 '+name+': mobile quick palette changes the existing tool, respects selection and reaches collapsed notes',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await (await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'})).newPage();
   await f1Open(page);
   const dock=page.locator('.lsh-anno-dock'),quick=page.locator('[data-anno-dock-toggle]');
   await page.locator('.workspace').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
   await dock.waitFor({state:'visible'});
   await quick.tap();
   assert.equal(await quick.getAttribute('aria-expanded'),'true');
   const pick=page.locator('[data-anno-quick-tool="pink"]');await pick.tap();
   assert.equal(await quick.getAttribute('aria-expanded'),'false');
   assert.equal(await page.locator('[data-anno-color="pink"]').getAttribute('aria-pressed'),'true');
   assert.match(await page.locator('[data-anno-active-tool]').textContent(),/Růžové/);
   const quote=await f2SetSelection(page,f1Para,0,9,'touch');
   await page.locator('[data-anno-apply-selection]').waitFor({state:'visible'});
   await dock.waitFor({state:'hidden'});
   assert.deepEqual(await f1Records(page),[]);
   await page.locator('[data-anno-apply-selection]').tap();
   await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'[]').length===1,f1Key);
   const saved=await f1Records(page);assert.equal(saved[0].text,quote);assert.equal(saved[0].color,'pink');
   await page.locator('[data-anno-library] summary').click();
   await page.locator('.workspace').evaluate(el=>el.scrollIntoView({block:'start',behavior:'instant'}));
   await dock.waitFor({state:'visible'});await quick.tap();
   assert.match(await page.locator('[data-anno-dock-notes]').textContent(),/\(1\)/);
   await page.locator('[data-anno-dock-notes]').tap();
   assert.notEqual(await page.locator('[data-anno-library]').getAttribute('open'),null);
   assert.equal(await page.locator('[data-anno-count]').textContent(),'1');
   assert.deepEqual(await f1Records(page),saved);
   await page.locator('.lsh-anno-header-toggle').click();
   await dock.waitFor({state:'hidden'});assert.deepEqual(await f1Records(page),saved);
  }finally{await browser.close()}
 });
}


for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('F3 '+name+': timed session lock hides quick tools and rejects undo writes',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1024,height:850}});
   await page.goto(base+'index.html?topic=rl-asteroids&lang=en&level=B2&timer=5&attempt=f3annotationlock123');
   await page.locator('#sessionStart').click();
   await page.locator('#workspace:not([hidden])').waitFor({timeout:30000});
   await page.locator('#readingAnnotationToggle').click();
   await f2SetSelection(page,'#readingParagraphs p[data-annotation-anchor="p:0"]',0,8,null);
   await page.locator('[data-anno-color="yellow"]').click();
   const items=page.locator('.lsh-annotation-item'),undo=page.locator('[data-anno-undo]');
   assert.equal(await items.count(),1);assert.equal(await undo.isDisabled(),false);
   const before=await page.locator('#counter').textContent();
   await page.locator('body').evaluate(el=>el.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true})));
   await page.locator('#sessionLock').waitFor({state:'visible',timeout:10000});
   assert.equal(await page.locator('.lsh-anno-dock').isVisible(),false);
   assert.equal(await page.locator('.lsh-anno-confirm-selection').isVisible(),false);
   await undo.evaluate(el=>el.click());
   assert.equal(await items.count(),1,'Locked session must reject undo');
   assert.equal(await page.locator('#counter').textContent(),before);
  }finally{await browser.close()}
 });
}


// F4 adversarial scenarios. All gestures are explicit; synthetic event-order
// tests intentionally exercise races that cannot reliably be timed by a mouse.
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('F4 '+name+': stale confirmation cannot apply a changed or cross-anchor range; genuine collapse still works',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:900},reducedMotion:'reduce'});
   await f1Open(page);
   await page.locator('[data-anno-color="yellow"]').click();
   const apply=page.locator('[data-anno-apply-selection]');
   for(const cross of [false,true]){
    await f2SetSelection(page,f1Para,0,4,'touch');await apply.waitFor({state:'visible'});
    await apply.evaluate(el=>el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',button:0,isPrimary:true})));
    if(cross){
     await page.evaluate(()=>{
      const a=document.querySelector('#readingBody p'),b=a.nextElementSibling;
      const range=document.createRange();range.setStart(a.firstChild,0);range.setEnd(b.firstChild,4);
      getSelection().removeAllRanges();getSelection().addRange(range);document.dispatchEvent(new Event('selectionchange'));
     });
    }else await f1Select(page,f1Para,5,9);
    await apply.evaluate(el=>el.click());
    assert.deepEqual(await f1Records(page),[],'An obsolete confirmation must not apply either range');
   }
   const expected=await f2SetSelection(page,f1Para,0,4,'touch');
   await apply.waitFor({state:'visible'});
   await apply.evaluate(el=>{
    el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',button:0,isPrimary:true}));
    getSelection().removeAllRanges();document.dispatchEvent(new Event('selectionchange'));el.click();
   });
   const saved=await f1Records(page);assert.equal(saved.length,1);assert.equal(saved[0].text,expected);
   await f1Select(page,f1Para,5,9);
   const radio=page.locator('#questions input[type="radio"]').first();
   await radio.evaluate(el=>el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'mouse',button:0,isPrimary:true})));
   await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,30)));
   assert.deepEqual(await f1Records(page),saved,'Answer-widget pointerup is not a reading selection gesture');
  }finally{await browser.close()}
 });
 test('F4 '+name+': edited row survives self-delete and obsolete clear confirmation never removes newer annotations',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:900},reducedMotion:'reduce'});
   await f1Open(page);await f1Note(page,f1Para,0,4,'Original');
   const initial=await f1Records(page);
   const row=page.locator('.lsh-annotation-item').first();
   await row.getByRole('button',{name:'Upravit anotaci 1'}).click();
   await page.locator('[data-anno-note]').fill('Unsaved draft');
   await row.getByRole('button',{name:'Smazat anotaci 1'}).click();
   assert.deepEqual(await f1Records(page),initial);
   assert.equal(await page.locator('[data-anno-note]').inputValue(),'Unsaved draft');
   assert.ok(await page.locator('[data-anno-note-box]').isVisible());
   await page.locator('[data-anno-save-note]').click();
   assert.equal((await f1Records(page))[0].note,'Unsaved draft');
   const clear=page.locator('[data-anno-clear-all]'),confirm=page.locator('[data-anno-clear-confirm-action]'),box=page.locator('[data-anno-clear-confirm]');
   await clear.click();await box.waitFor({state:'visible'});
   await f1Select(page,f1Para,5,9);await page.locator('[data-anno-color="green"]').click();
   const updated=await f1Records(page);assert.equal(updated.length,2);
   assert.notEqual(await box.getAttribute('hidden'),null);
   await confirm.evaluate(el=>el.click());assert.deepEqual(await f1Records(page),updated);
   await clear.click();await page.locator('[data-anno-library] summary').click();
   await page.waitForFunction(()=>document.querySelector('[data-anno-clear-confirm]').hidden);
   await confirm.evaluate(el=>el.click());assert.deepEqual(await f1Records(page),updated);
   await page.locator('[data-anno-library] summary').click();
   await clear.click();await page.keyboard.press('Escape');
   assert.notEqual(await box.getAttribute('hidden'),null);
   await confirm.evaluate(el=>el.click());assert.deepEqual(await f1Records(page),updated);
  }finally{await browser.close()}
 });
 test('F4 '+name+': 80-record limit rejects new draft but permits existing edit; corrupt practice storage fails closed',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:900},reducedMotion:'reduce'});
   await page.goto(f1URL+'?lang=en&level=B2');await page.locator(f1Para).waitFor();
   const quote=(await page.locator(f1Para).textContent()).slice(0,4);
   const records=Array.from({length:80},(_,i)=>({id:'f4-'+i,anchor:'p:0',start:0,end:4,text:quote,kind:'note',color:'yellow',note:'Note '+i}));
   await page.evaluate(({key,records})=>localStorage.setItem(key,JSON.stringify(records)),{key:f1Key,records});
   await f1Open(page);
   await f1Select(page,f1Para,5,9);await page.locator('[data-anno-start-note]').click();
   assert.equal(await page.locator('[data-anno-note-box]').isVisible(),false);
   assert.match(await page.locator('[data-anno-status]').textContent(),/Limit 80/);
   assert.deepEqual(await f1Records(page),records);
   await page.locator('.lsh-annotation-item').first().getByRole('button',{name:'Upravit anotaci 1'}).click();
   await page.locator('[data-anno-note]').fill('Allowed at limit');await page.locator('[data-anno-save-note]').click();
   assert.equal((await f1Records(page))[0].note,'Allowed at limit');assert.equal((await f1Records(page)).length,80);
   const corrupt=JSON.stringify([records[0],{...records[1],end:99}]);
   await page.evaluate(({key,corrupt})=>localStorage.setItem(key,corrupt),{key:f1Key,corrupt});
   await f1Open(page);
   const warning=page.locator('[data-anno-storage-warning]');
   assert.ok(await warning.isVisible());assert.match(await warning.textContent(),/nelze bezpečně načíst/);
   await f1Select(page,f1Para,0,4);await page.locator('[data-anno-color="yellow"]').click();
   assert.equal(await page.locator('.lsh-annotation-item').count(),0);
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),f1Key),corrupt);
   assert.ok(await warning.isVisible(),'Transient messages do not erase the storage warning');
  }finally{await browser.close()}
 });
 test('F4 '+name+': untimed self-check blocks stale-tab overwrite, corrupted snapshot and gap placeholder',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1200,height:900},reducedMotion:'reduce'});
   const a=await context.newPage(),b=await context.newPage();
   const url=base+'index.html?topic=rl-asteroids&lang=en&level=B2';
   const key='lsh-reading-annotations-v1:rl-asteroids:en:B2';
   const para='#readingParagraphs p:not(:has(.gap-marker))';
   async function open(page){
    await page.goto(url);await page.locator('#workspace:not([hidden])').waitFor();
    await page.locator('#readingAnnotationToggle').click();
    await page.locator('[data-anno-controls]:visible').waitFor();
   }
   await a.bringToFront();await open(a);
   await b.bringToFront();await open(b);
   await a.bringToFront();await f1Note(a,para,0,4,'Author A');
   const saved=await f1Records(a,key);assert.equal(saved.length,1);
   await b.bringToFront();await f1Select(b,para,0,4);await b.locator('[data-anno-color="yellow"]').click();
   assert.deepEqual(await f1Records(a,key),saved);
   assert.equal(await b.locator('.lsh-annotation-item').count(),0);
   assert.match(await b.locator('[data-anno-status]').textContent(),/jiné záložce/);
   await open(b);
   assert.equal(await b.locator('.lsh-annotation-item').count(),1);
   await b.evaluate(()=>{
    const marker=document.querySelector('#readingParagraphs .gap-marker');
    if(!marker)throw Error('Expected concealed reading gap');
    const range=document.createRange();range.selectNodeContents(marker);
    getSelection().removeAllRanges();getSelection().addRange(range);document.dispatchEvent(new Event('selectionchange'));
   });
   await b.locator('[data-anno-color="green"]').click();
   assert.deepEqual(await f1Records(b,key),saved,'Gap placeholder must not be annotated');
   const raw='[{"anchor":"broken"}]';
   await b.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});
   await open(b);assert.ok(await b.locator('[data-anno-storage-warning]').isVisible());
   await f1Select(b,para,0,4);await b.locator('[data-anno-color="green"]').click();
   assert.equal(await b.evaluate(key=>localStorage.getItem(key),key),raw);
   assert.equal(await b.locator('.lsh-annotation-item').count(),0);
  }finally{await browser.close()}
 });
 test('F4 '+name+': timed quota failure rolls back annotation UI and editable attempt memory',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:900},reducedMotion:'reduce'});
   // Test-only instrumentation of the existing mount/status API, not the guard.
   await page.addInitScript(()=>{
    let wrapped;
    Object.defineProperty(window,'LSHSessionUI',{configurable:true,get:()=>wrapped,set:api=>{
     wrapped={...api,mount:cfg=>{const session=api.mount(cfg);window.f4AttemptStatus=()=>session.status();return session;}};
    }});
   });
   await page.goto(base+'index.html?topic=rl-asteroids&lang=en&level=B2&timer=5&attempt=f4annotationquota123');
   await page.locator('#sessionStart').click();await page.locator('#workspace:not([hidden])').waitFor();
   await page.locator('#readingAnnotationToggle').click();
   const para='#readingParagraphs p:not(:has(.gap-marker))';
   await f1Note(page,para,0,4,'Durable note');
   const initial=await page.evaluate(()=>window.f4AttemptStatus());
   assert.equal(initial.answers.annotations.length,1);assert.equal(initial.persistent,true);
   await page.evaluate(()=>{
    const original=Storage.prototype.setItem;
    window.f4RejectedWrites=0;
    Storage.prototype.setItem=function(k,v){
     let parsed;try{parsed=JSON.parse(v)}catch(_){}
     if(Array.isArray(parsed?.answers?.annotations)&&parsed.answers.annotations.length>1){
      window.f4RejectedWrites++;throw Error('F4 annotation quota failure');
     }
     return original.call(this,k,v);
    };
   });
   await f1Select(page,para,5,9);await page.locator('[data-anno-color="green"]').click();
   assert.equal(await page.locator('.lsh-annotation-item').count(),1);
   assert.match(await page.locator('[data-anno-status]').textContent(),/nelze trvale uložit/);
   const after=await page.evaluate(()=>({status:window.f4AttemptStatus(),failures:window.f4RejectedWrites}));
   assert.equal(after.failures,1);assert.equal(after.status.persistent,false);
   assert.deepEqual(after.status.answers.annotations,initial.answers.annotations,'Failed volatile save must not remain in attempt memory');
   assert.deepEqual(after.status.answers.answers,initial.answers.answers);
   assert.equal(after.status.phase,'running');assert.equal(await page.locator('#sessionLock').isVisible(),false);
  }finally{await browser.close()}
 });
}
