'use strict';
/* RL Asteroids realistic lock rehearsal: parity, isolation and mobile touch. */
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const teacher='self-check/reading/teacher.html?topic=rl-asteroids&lang=en&level=B2&timer=30';
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(name+' Asteroids desktop lock screen and mobile exact rehearsal',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1024,height:768}});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(new URL(teacher,base).href);
   await page.locator('#confirmTest:enabled').waitFor();
   const teacherAssets=await page.evaluate(()=>({
    js:document.querySelector('script[src*="teacher-ux.js"]')?.getAttribute('src'),
    css:document.querySelector('link[href*="session.css"]')?.getAttribute('href')
   }));
   for(const url of [teacherAssets.js,teacherAssets.css])
    assert.match(url,/v=rl-lock-rehearsal-20261120-3/,'Asteroids teacher assets must be version-pinned');
   const before=await page.evaluate(()=>Object.keys(localStorage).filter(x=>x.includes('attempt')));
   await page.getByRole('button',{name:'VYZKOUŠET GESTO'}).click();
   const demo=page.locator('#lshTeacherDemo');
   await demo.waitFor();
   assert.equal(await demo.locator('.lsh-session-lock-panel').count(),1);
   assert.equal(await demo.locator('.lsh-session-lock-panel').isVisible(),true);
   assert.equal(await demo.evaluate(el=>el.classList.contains('lsh-lock-rehearsal')),true);
   assert.match(await demo.evaluate(el=>getComputedStyle(el).backgroundColor),
    /^rgba?\(2,\s*7,\s*16[,)]/,'Desktop teacher must see the real dark lock background');
   assert.equal(await demo.locator('.lsh-session-lock-panel h2').textContent(),'Test locked');
   assert.equal(await demo.locator('.lsh-session-lock-panel p').first().textContent(),
    'The test was locked. Please contact your teacher. The timer continues.');
   assert.equal(await demo.locator('.lsh-trainer-dot').count(),4);
   const actual=await page.evaluate(()=>{
    const d=document.getElementById('lshTeacherDemo');
    return ['tl','tr','bl','br'].map(k=>{
     const r=d.querySelector('.lsh-corner-'+k).getBoundingClientRect();
     return [r.x+r.width/2,r.y+r.height/2];
    });
   });
   for(const [x,y] of actual)await page.mouse.click(x,y,{delay:80});
   await demo.getByText(/Gesto bylo úspěšně rozpoznáno/).waitFor();
   await page.keyboard.press('Escape');
   assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage).filter(x=>x.includes('attempt'))),before);
   const mobile=page.locator('.lsh-unlock-mobile');
   await mobile.locator('summary').click();
   const url=new URL(await mobile.locator('a').getAttribute('href'));
   assert.equal(url.searchParams.get('source'),'rl-asteroids');
   assert.equal(url.searchParams.get('rehearsalVersion'),'rl-lock-rehearsal-20261120-3');
   assert.equal(url.searchParams.get('lang'),'en');
   await page.locator('#language').selectOption('es');
   const updated=new URL(await mobile.locator('a').getAttribute('href'));
   assert.equal(updated.searchParams.get('lang'),'es');
   assert.deepEqual(errors,[]);
   await context.close();
   const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const phone=await touch.newPage(),phoneErrors=[];
   phone.on('pageerror',e=>phoneErrors.push(String(e)));
   await phone.goto(new URL('self-check/session/gesture-trainer.html?source=rl-asteroids&p=n1&lang=es',base).href);
   await phone.getByRole('button',{name:/^Zobrazit zamčenou obrazovku/}).click();
   const lock=phone.locator('#lshTeacherDemo');
   await lock.waitFor();
   assert.equal(await lock.locator('.lsh-session-lock-panel h2').textContent(),'Prueba bloqueada');
   assert.match(await lock.evaluate(el=>getComputedStyle(el).backgroundColor),
    /^rgba?\(2,\s*7,\s*16[,)]/,'Mobile trainer must use the real lock background');
   assert.equal(await lock.locator('.lsh-trainer-dot').count(),0);
   assert.equal(await lock.locator('.lsh-trainer-heading').isVisible(),false);
   const points=await phone.evaluate(()=>['tl','tr','bl','br'].map(k=>{
    const r=document.querySelector('#lshTeacherDemo .lsh-corner-'+k).getBoundingClientRect();
    return [r.x+r.width/2,r.y+r.height/2];
   }));
   for(const [x,y] of points)await phone.touchscreen.tap(x,y);
   await phone.locator('#lshTeacherDemo').waitFor({state:'detached'});
   assert.equal(await phone.locator('#gestureSuccess').isVisible(),true);
   assert.equal(await phone.evaluate(()=>Object.keys(localStorage).filter(x=>x.includes('attempt')).length),0);
   assert.deepEqual(phoneErrors,[]);
   await touch.close();
  }finally{await browser.close();}
 });
}


// Catch the desktop screenshot regression: the exit control must be above,
// never inside, the guided instructions at all supported viewport sizes.
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(name+' Asteroids exit button does not overlap the guided heading',{timeout:80000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1649,height:718}});
   const page=await context.newPage();
   await page.goto(new URL(teacher,base).href);
   await page.locator('#confirmTest:enabled').waitFor();
   await page.locator('input[name="unlockMethod"][value="hold_double_tap"]').check();
   await page.getByRole('button',{name:'VYZKOUŠET GESTO'}).click();
   const demo=page.locator('#lshTeacherDemo');
   for(const [w,h] of [[1649,718],[1024,768],[390,844],[320,568],[768,550]]){
    await page.setViewportSize({width:w,height:h});
    const metrics=await demo.evaluate(el=>{
     const c=el.querySelector('.lsh-trainer-close').getBoundingClientRect();
     const g=el.querySelector('.lsh-trainer-heading').getBoundingClientRect();
     return {closeBottom:c.bottom,headingTop:g.top};
    });
    assert.ok(metrics.headingTop-metrics.closeBottom>=12,
     'Close overlaps heading at '+w+'x'+h+': '+JSON.stringify(metrics));
   }
   await page.keyboard.press('Escape');
   await context.close();
  }finally{await browser.close();}
 });
 test(name+' mobile n3 long hold and double tap work with same touch targets',{timeout:90000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(new URL('self-check/session/gesture-trainer.html?source=rl-asteroids&p=n3&lang=en',base).href);
   assert.match(await page.locator('#gestureGuide').textContent(),/Vlevo pod středem/);
   const guided=page.getByRole('button',{name:'Ukázat dotyková místa při nácviku'});
   assert.equal(await guided.isVisible(),true,'Mobile trainer must offer visible target guidance');
   await guided.click();
   const demo=page.locator('#lshTeacherDemo');
   await demo.waitFor();
   assert.equal(await demo.locator('.lsh-trainer-dot').count(),2);
   const geometry=await page.evaluate(()=>{
    const overlay=document.getElementById('lshTeacherDemo'),r=overlay.getBoundingClientRect();
    return [[.3,.6],[.7,.6]].map(([x,y])=>{
     const px=Math.round(r.x+r.width*x),py=Math.round(r.y+r.height*y);
     return {x:px,y:py,hit:!!document.elementFromPoint(px,py)?.closest('.lsh-unlock-surface')};
    });
   });
   assert.ok(geometry.every(p=>p.hit),'Gesture targets blocked: '+JSON.stringify(geometry));
   const [left,right]=geometry;
   const performGesture=async()=>{
   if(name==='Chromium'){
    const cdp=await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:left.x,y:left.y,id:1}]});
    await page.waitForTimeout(2800);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }else{
    await page.evaluate(p=>{
     const el=document.querySelector('#lshTeacherDemo .lsh-unlock-surface');
     el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:42,pointerType:'touch',
      isPrimary:true,button:0,buttons:1,clientX:p.x,clientY:p.y}));
    },left);
    await page.waitForTimeout(2800);
    await page.evaluate(p=>{
     const el=document.querySelector('#lshTeacherDemo .lsh-unlock-surface');
     el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:42,pointerType:'touch',
      isPrimary:true,button:0,buttons:0,clientX:p.x,clientY:p.y}));
    },left);
   }
   await page.touchscreen.tap(right.x,right.y);
   await page.touchscreen.tap(right.x,right.y);
   };
   await performGesture();
   await demo.locator('.lsh-trainer-progress').filter({hasText:/Gesto bylo úspěšně rozpoznáno/}).waitFor({timeout:5000});
   await page.getByRole('button',{name:'Ukončit nácvik'}).click();
   assert.equal(await demo.count(),0);
   // Repeat the very same touch gesture in the exact student-style lock screen.
   // Hints must disappear without affecting any of the real hit targets.
   await page.getByRole('button',{name:/^Zobrazit zamčenou obrazovku/}).click();
   const exact=page.locator('#lshTeacherDemo');
   await exact.waitFor();
   assert.equal(await exact.locator('.lsh-trainer-dot').count(),0);
   await performGesture();
   await exact.waitFor({state:'detached',timeout:5000});
   assert.equal(await page.locator('#gestureSuccess').isVisible(),true);
   assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('attempt')).length),0);
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close();}
 });
}
