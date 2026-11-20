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
   const before=await page.evaluate(()=>Object.keys(localStorage).filter(x=>x.includes('attempt')));
   await page.getByRole('button',{name:'VYZKOUŠET GESTO'}).click();
   const demo=page.locator('#lshTeacherDemo');
   await demo.waitFor();
   assert.equal(await demo.locator('.lsh-session-lock-panel').count(),1);
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
   await phone.getByRole('button',{name:'Zobrazit zamčenou obrazovku'}).click();
   const lock=phone.locator('#lshTeacherDemo');
   await lock.waitFor();
   assert.equal(await lock.locator('.lsh-session-lock-panel h2').textContent(),'Prueba bloqueada');
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
