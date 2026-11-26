#!/usr/bin/env node
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const axe=require('axe-core');
const URL='http://127.0.0.1:8765/language-skills-hub/konverzace/city-quest-f2/index.html';
async function open(browser,language='en',level='B1',width=1280,height=900,bypassCSP=false){
 // DevTools-only exception for injecting axe-core; production CSP is unchanged.
 const page=await browser.newPage({viewport:{width,height},bypassCSP});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console.error '+m.text());});
 await page.goto(URL+'?lang='+language+'&level='+level,{waitUntil:'load'});
 await page.locator('#f1Stations button').first().waitFor();
 return {page,errors};
}
test('A3/A4: mobile translated controls keep entire words and station names match visible labels',{timeout:120000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const language of ['es','de','fr'])for(const width of [320,360,390]){
   const {page,errors}=await open(browser,language,'B2',width,780);
   try{
    const broken=await page.evaluate(()=>{
     const targets=[...document.querySelectorAll('#f1Solo,#f1Pair,#f3dLearningSteps li strong')];
     const bad=[];
     for(const el of targets){
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      let textNode;
      while(textNode=walker.nextNode()){
       const text=textNode.textContent||'',re=/\p{L}{3,}/gu;let m;
       while(m=re.exec(text)){
        const range=document.createRange();
        range.setStart(textNode,m.index);
        range.setEnd(textNode,m.index+m[0].length);
        const rects=[...range.getClientRects()].filter(r=>r.width>0.1);
        if(rects.length>1&&Math.max(...rects.map(r=>r.top))-Math.min(...rects.map(r=>r.top))>2)
         bad.push(el.id||el.closest('li')?.id||el.className+':'+m[0]);
       }
      }
     }
     return bad;
    });
    assert.deepEqual(broken,[],'Broken native-language words '+language+'/'+width);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    const nav=page.locator('#f1Stations'),buttons=nav.locator('button');
    assert.equal(await buttons.count(),8);
    for(let i=0;i<8;i++){
     const button=buttons.nth(i);
     const visible=(await button.locator('.f1-station-caption').innerText()).replace(/\s+/g,' ').trim();
     assert.equal(await nav.getByRole('button',{name:visible,exact:true}).count(),1,'Accessible name matches entire visible caption '+language+'/'+i);
     assert.equal(await button.getAttribute('aria-label'),null,'Use native button content');
    }
    assert.deepEqual(errors,[]);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
test('A4: axe-core reports no violations for city, metro and reset confirmation',{timeout:120000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const {page,errors}=await open(browser,'de','B2',390,844,true);
  try{
   await page.addScriptTag({content:axe.source});
   const inspect=async label=>{
    const violations=await page.evaluate(async()=>await window.axe.run(document,{
     runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}
    }));
    assert.deepEqual(violations.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})),[],label);
   };
   await inspect('City initial');
   await page.locator('#f1Stations button').nth(4).click();
   await inspect('City bus');
   await page.locator('#metroPilotToggle').click();
   await inspect('Metro initial');
   await page.locator('#f1Stations button').nth(7).click();
   await inspect('Metro final');
   // A completed metro checkpoint progress is needed before the dialog appears;
   // test its markup in the default DOM with open/close, without injecting game state.
   await page.locator('#cqModeConfirm').evaluate(e=>e.showModal());
   await inspect('Reset modal');
   await page.locator('#cqModeCancel').click();
   assert.deepEqual(errors,[]);
  }finally{await page.close();}
 }finally{await browser.close();}
});
test('A6: missing via and incorrect B2 turn receive task-specific feedback',{timeout:90000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const {page,errors}=await open(browser,'en','B2');
  try{
   await page.locator('#f1Stations button').nth(1).click();
   const directions=await page.evaluate(()=>{
    const G=window.CityQuestF2Engine,E=window.CityQuestEngine,F=window.CityQuestF1Engine,
      c=G.config('B2'),avoid=c.via,start=E.start,goal=c.target;
    const same=(a,b)=>a.c===b.c&&a.r===b.r;
    const q=[[start,[]]],seen=new Set();
    while(q.length){
     const [point,path]=q.shift(),key=point.c+','+point.r;
     if(seen.has(key))continue;seen.add(key);
     if(same(point,goal))return path;
     for(const dir of ['north','east','south','west']){
      const next=F.nextFromDirection(point,dir);
      if(!E.isNode(next)||avoid.some(p=>same(p,next)))continue;
      q.push([next,path.concat(dir)]);
     }
    }
    throw Error('No bypass route available for negative test');
   });
   assert.ok(directions.length>=3);
   for(const dir of directions)await page.locator('.f2-quick-'+dir).click();
   const status=await page.locator('#f1Panel .f2-status').innerText();
   assert.match(status,/Market Square/);
   assert.doesNotMatch(status,/via\s*·/i);
   await page.locator('#f1Stations button').nth(3).click();
   const route=await page.evaluate(()=>window.CityQuestF2Engine.guidedPaths.B2);
   for(const dir of route)await page.locator('.f2-quick-'+dir).click();
   assert.ok(await page.locator('#f1Panel .f2-choice-list button').count()>0);
   const labels=await page.locator('#f1Panel .f2-choice-list button').allTextContents();
   const wrong=labels.findIndex(t=>/right from east/i.test(t));
   assert.ok(wrong>=0,'Wrong turn option exists');
   await page.locator('#f1Panel .f2-choice-list button').nth(wrong).click();
   assert.match(await page.locator('#f1Panel .f2-status').innerText(),/right leads south/);
   assert.deepEqual(errors,[]);
  }finally{await page.close();}
 }finally{await browser.close();}
});

test('Metro place aliases and transfer icon are consistent with surface labels',{timeout:90000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const language of ['es','de','fr']){
   const {page,errors}=await open(browser,language,'B2',390,844);
   try{
    await page.locator('#metroPilotToggle').click();
    await page.locator('#f1Stations button').nth(7).click();
    const central=await page.locator('[data-landmark-label="CENTRAL STATION"] text').textContent();
    const square=await page.locator('[data-landmark-label="MARKET SQUARE"] text').textContent();
    assert.equal(central,'CENTRAL STATION');
    assert.equal(square,'MARKET SQUARE');
    assert.equal(await page.locator('#mapLocation').textContent(),'Central Station');
    if(language==='de'){
     const nav=page.locator('#f1Stations'),last=nav.locator('button').nth(7);
     const visible=(await last.locator('.f1-station-caption').innerText()).replace(/\s+/g,' ').trim();
     assert.match(visible,/^Aufgabe 08 /);
     assert.equal(await nav.getByRole('button',{name:visible,exact:true}).count(),1);
     assert.match(await page.locator('#f1Stations button').nth(5).innerText(),/🔀/);
    }
    assert.deepEqual(errors,[]);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});
test('French dialogue uses non-breaking typographic space before questions',{timeout:45000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const {page,errors}=await open(browser,'fr','C1',390,844);
  try{
   await page.locator('#f1Stations button').nth(2).click();
   const dialogue=await page.locator('#f1Panel .f2-dialogue-bubble').innerText();
   assert.match(dialogue,/\u202f\?/,'French question mark should be joined to its preceding word');
   assert.deepEqual(errors,[]);
  }finally{await page.close();}
 }finally{await browser.close();}
});


test('A+ F-17: mixed metro map footer localizes the surface City Museum in all four languages',{timeout:120000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const names={en:'City Museum',es:'Museo de la Ciudad',de:'Stadtmuseum',fr:'Musée municipal'};
 try{
  for(const language of ['en','es','de','fr']){
   const {page,errors}=await open(browser,language,'B2',390,844);
   try{
    await page.locator('#metroPilotToggle').click();
    const footer=await page.locator('.map-footer').innerText();
    assert.ok(footer.includes('Central Station'),'Metro proper name not retained for '+language);
    assert.ok(footer.includes(names[language]),'Surface museum not localized for '+language+': '+footer);
    assert.deepEqual(errors,[]);
   }finally{await page.close();}
  }
 }finally{await browser.close();}
});


test('GA-014: heading, scrollable panels and metro landmarks across 40 language/state combinations',{timeout:240000},async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const rules=['page-has-heading-one','heading-order','scrollable-region-focusable','landmark-complementary-is-top-level'];
 let checked=0;
 try{
  for(const lang of ['en','es','de','fr']){
   // axe injection only: the normal UX and matrix suites retain strict CSP.
   const {page,errors}=await open(browser,lang,'B2',1366,768,true);
   try{
    await page.addScriptTag({content:axe.source});
    async function inspect(label){
     const result=await page.evaluate(async rules=>await window.axe.run(document,{runOnly:{type:'rule',values:rules}}),rules);
     assert.deepEqual(result.violations.map(x=>({id:x.id,nodes:x.nodes.map(n=>n.target)})),[],lang+' '+label);
     assert.equal(await page.getByRole('heading',{level:1}).count(),1,lang+' '+label);
     checked++;
    }
    await inspect('City 01');
    for(const n of [2,3,5]){
     await page.locator('#f1Stations button').nth(n-1).click();
     await inspect('City '+n);
    }
    await page.locator('#cqTeacherGuide > summary').click();
    const guide=page.locator('#cqTeacherGuide .cq-teacher-content');
    assert.equal(await guide.getAttribute('tabindex'),'0');
    assert.equal(await page.locator('#cqTeacherGuide').getAttribute('lang'),'cs');
    await guide.focus();
    assert.equal(await guide.evaluate(n=>document.activeElement===n),true);
    await inspect('Teacher guide');
    await page.locator('#cqTeacherGuide > summary').click();
    await page.locator('#cqUxAbout > summary').click();
    const about=page.locator('.cq-ux-about-panel');
    assert.equal(await about.getAttribute('tabindex'),'0');
    await about.focus();
    assert.equal(await about.evaluate(n=>document.activeElement===n),true);
    await inspect('About');
    await page.locator('#cqUxAbout > summary').click();
    await page.locator('#metroPilotToggle').click();
    for(const n of [5,6,7,8]){
     await page.locator('#f1Stations button').nth(n-1).click();
     await inspect('Mixed '+n);
    }
    assert.deepEqual(errors,[]);
   }finally{await page.close();}
  }
  assert.equal(checked,40);
 }finally{await browser.close();}
});
