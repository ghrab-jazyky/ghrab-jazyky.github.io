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
