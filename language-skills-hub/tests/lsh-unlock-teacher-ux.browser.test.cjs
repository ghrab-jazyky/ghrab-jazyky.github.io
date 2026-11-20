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
     assert.match(await demo.getByRole('heading',{name:/^Nácvik:/}).textContent(),/Nácvik:/);
     assert.equal(await demo.locator('.lsh-session-lock-panel').count(),lab.includes('reading/')?1:0,'Asteroids uses real lock panel; Listening keeps legacy trainer');
     assert.equal(await demo.locator('.lsh-trainer-dot').count(),4);
     const corners=await page.evaluate(()=>{
      const root=document.getElementById('lshTeacherDemo');
      return ['tl','tr','bl','br'].map(k=>{
       const r=root.querySelector('.lsh-corner-'+k).getBoundingClientRect();
       return [r.x+r.width/2,r.y+r.height/2];
      });
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

const gestureIds=['corners4','tap_hold_tap','hold_double_tap','triangle3','draw_z'];
async function performMouseGesture(page,id){
 const bounds=await page.evaluate(()=>{
  const root=document.getElementById('lshTeacherDemo');
  const display=root.querySelector('.lsh-rehearsal-phone-screen')||root;
  const r=display.getBoundingClientRect();
  return {x:r.x,y:r.y,width:r.width,height:r.height};
 });
 const {width:w,height:h}=bounds;
 const p=(x,y)=>({x:Math.round(bounds.x+w*x),y:Math.round(bounds.y+h*y)});
 const tap=async point=>page.mouse.click(point.x,point.y,{delay:80});
 const hold=async(point,ms)=>{
  await page.mouse.move(point.x,point.y);await page.mouse.down();
  await page.waitForTimeout(ms);await page.mouse.up();
 };
 if(id==='corners4'){
  const corners=await page.evaluate(()=>{
   const root=document.getElementById('lshTeacherDemo');
   return ['tl','tr','bl','br'].map(k=>{
    const r=root.querySelector('.lsh-corner-'+k).getBoundingClientRect();
    return {x:r.x+r.width/2,y:r.y+r.height/2};
   });
  });
  for(const x of corners)await tap(x);
 }else if(id==='tap_hold_tap'){
  await tap(p(.5,.7));await hold(p(.5,.7),2200);await tap(p(.5,.7));
 }else if(id==='hold_double_tap'){
  await hold(p(.3,.6),2800);await tap(p(.7,.6));await tap(p(.7,.6));
 }else if(id==='triangle3'){
  await tap(p(.5,.3));await tap(p(.3,.7));await hold(p(.7,.7),750);
 }else if(id==='draw_z'){
  await page.mouse.move(p(.3,.3).x,p(.3,.3).y);await page.mouse.down();
  for(const xy of [p(.7,.3),p(.3,.7),p(.7,.7)])
   await page.mouse.move(xy.x,xy.y,{steps:9});
  await page.waitForTimeout(720);await page.mouse.up();
 }
}
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(name+' – five teacher gestures in both LABs with real pointer input',{timeout:180000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const lab of labs){
    const context=await browser.newContext({viewport:{width:1024,height:768}});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    try{
     await page.goto(new URL(lab,base).href);await ready(page);
     for(const id of gestureIds){
      await page.locator('input[name="unlockMethod"][value="'+id+'"]').check();
      await page.getByRole('button',{name:'VYZKOUŠET GESTO'}).click();
      const demo=page.locator('#lshTeacherDemo');
      await demo.waitFor();
      assert.equal(await demo.locator('.lsh-session-lock-panel').count(),lab.includes('reading/')?1:0);
      assert.equal(await demo.getAttribute('aria-modal'),'true');
      assert.equal(await page.locator('#unlockTeacherControls details').count(),1);
      await performMouseGesture(page,id);
      await demo.getByText(/Gesto bylo úspěšně rozpoznáno/).waitFor({timeout:4000});
      await page.keyboard.press('Escape');
      assert.equal(await demo.count(),0,id+' trainer close');
      const locked=await page.evaluate(()=>[...document.body.children].some(x=>x.inert));
      assert.equal(locked,false,id+' underlying page must not remain inert');
     }
     assert.deepEqual(errors,[],lab);
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 });
 test(name+' – four corners on portrait touch device, no obstructed targets',{timeout:45000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
   const page=await context.newPage();
   await page.goto(new URL('self-check/session/gesture-trainer.html?p=n1',base).href);
   await page.getByRole('button',{name:'Vyzkoušet gesto prstem'}).click();
   const hit=await page.evaluate(()=>{
    const els=[[38,38],[window.innerWidth-38,38],[38,window.innerHeight-38],[window.innerWidth-38,window.innerHeight-38]];
    return els.map(([x,y])=>document.elementFromPoint(x,y)?.className);
   });
   assert.ok(hit.every(x=>typeof x==='string'&&x.includes('lsh-corner')),JSON.stringify(hit));
   for(const [x,y] of [[38,38],[352,38],[38,806],[352,806]])
    await page.touchscreen.tap(x,y);
   await page.locator('.lsh-trainer-progress').filter({hasText:/Gesto bylo úspěšně rozpoznáno/}).waitFor({timeout:4000});
   await context.close();
  }finally{await browser.close();}
 });
}
