'use strict';
/* Teacher UI and rehearsal must never write a student attempt. */
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const labs=[
 'self-check/reading/teacher.html?topic=rl-asteroids&lang=en&level=B2&timer=30',
 'self-check/listening/teacher.html?topic=ll-sad&level=B2&timer=30'
];
async function ready(page){
 await page.locator('#confirmTest:enabled').waitFor({timeout:30000});
 await page.locator('#unlockTeacherControls.lsh-unlock-teacher-v2').waitFor();
}
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(name+' – teacher selection, guided rehearsal, cleanup and QR for both labs',{timeout:120000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const lab of labs){
    const context=await browser.newContext({viewport:{width:1024,height:768}});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    try{
     await page.goto(new URL(lab,base).href);
     await ready(page);
     assert.equal(await page.locator('.lsh-unlock-mobile-qr svg').count(),1);
     assert.equal(await page.locator('#confirmTest').isEnabled(),true);
     const before=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('lsh:device-attempt:')).length);
     await page.getByRole('button',{name:'VYZKOUŠET GESTO'}).click();
     const demo=page.locator('#lshTeacherDemo');
     await demo.waitFor();
     assert.match(await demo.getByRole('heading').textContent(),/Nácvik:/);
     assert.equal(await demo.locator('.lsh-session-lock-panel').count(),0,'No English lock dialog');
     assert.equal(await demo.locator('.lsh-trainer-dot').count(),4);
     const corners=await page.evaluate(()=>{
      const d=document.getElementById('lshTeacherDemo').getBoundingClientRect();
      return [[38,38],[d.width-38,38],[38,d.height-38],[d.width-38,d.height-38]];
     });
     for(const p of corners)await page.mouse.click(p[0],p[1],{delay:80});
     await demo.getByText(/Gesto bylo úspěšně rozpoznáno/).waitFor();
     await page.getByRole('button',{name:'Zkusit znovu'}).click();
     await demo.getByText(/Krok 1 ze 4/).waitFor();
     await page.keyboard.press('Escape');
     assert.equal(await demo.count(),0);
     const after=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('lsh:device-attempt:')).length);
     assert.equal(after,before,'Teacher rehearsal cannot create student attempt');
     const mobile=page.locator('.lsh-unlock-mobile');
     await mobile.locator('summary').click();
     const url=await mobile.locator('a').getAttribute('href');
     assert.equal(new URL(url).searchParams.get('p'),'n1');
     await page.locator('input[name="unlockMethod"][value="triangle3"]').check();
     assert.equal(new URL(await mobile.locator('a').getAttribute('href')).searchParams.get('p'),'n4');
     assert.deepEqual(errors,[]);
    }finally{await context.close()}
   }
  }finally{await browser.close()}
 });
 test(name+' – mobile QR trainer opens selected gesture without student session',{timeout:60000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(new URL('self-check/session/gesture-trainer.html?p=n4',base).href);
   assert.equal(await page.locator('#gestureTitle').textContent(),'Skrytý trojúhelník');
   await page.getByRole('button',{name:'Vyzkoušet gesto prstem'}).click();
   await page.locator('#lshTeacherDemo').waitFor();
   assert.equal(await page.locator('.lsh-trainer-dot').count(),3);
   await page.getByRole('button',{name:'Ukončit nácvik'}).click();
   assert.equal(await page.locator('#lshTeacherDemo').count(),0);
   assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('attempt')).length),0);
   assert.deepEqual(errors,[]);
   await page.goto(new URL('self-check/session/gesture-trainer.html?p=invalid',base).href);
   assert.equal(await page.locator('#launchTrainer').isDisabled(),true);
   await context.close();
  }finally{await browser.close()}
 });
}
