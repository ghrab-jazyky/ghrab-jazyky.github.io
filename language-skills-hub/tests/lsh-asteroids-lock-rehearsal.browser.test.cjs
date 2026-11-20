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
    assert.match(url,/v=rl-lock-rehearsal-20261120-4/,'Asteroids teacher assets must be version-pinned');
   const before=await page.evaluate(()=>Object.keys(localStorage).filter(x=>x.includes('attempt')));
   await page.getByRole('button',{name:'VYZKOUŠET GESTO'}).click();
   const demo=page.locator('#lshTeacherDemo');
   await demo.waitFor();
   assert.equal(await demo.locator('.lsh-session-lock-panel').count(),1);
   assert.equal(await demo.locator('.lsh-session-lock-panel').isVisible(),true);
   assert.equal(await demo.evaluate(el=>el.classList.contains('lsh-lock-rehearsal')),true);
   assert.equal(await demo.locator('.lsh-rehearsal-phone-screen').count(),1,
    'Desktop teacher must see a portrait phone viewport, not desktop-wide targets');
   assert.match(await demo.locator('.lsh-rehearsal-phone-screen').evaluate(el=>
    getComputedStyle(el).backgroundColor),
    /^rgba?\(2,\s*7,\s*16[,)]/,'The simulated phone screen must use the actual dark lock background');
   assert.equal(await demo.locator('.lsh-session-lock-panel h2').textContent(),'Test locked');
   assert.equal(await demo.locator('.lsh-session-lock-panel p').first().textContent(),
    'The test was locked. Please contact your teacher. The timer continues.');
   assert.equal(await demo.locator('.lsh-trainer-dot').count(),4);
   const phoneDisplay=await demo.locator('.lsh-rehearsal-phone-screen').boundingBox();
   assert.ok(phoneDisplay.height>phoneDisplay.width*1.8,'Desktop preview must be portrait');
   assert.ok(phoneDisplay.width<=390,'Preview cannot exceed phone width');
   const positions=await demo.evaluate(root=>{
    const stage=root.querySelector('.lsh-rehearsal-phone-screen').getBoundingClientRect();
    return ['tl','tr','bl','br'].map(k=>{
     const r=root.querySelector('.lsh-corner-'+k).getBoundingClientRect();
     return [(r.x+r.width/2-stage.x)/stage.width,
      (r.y+r.height/2-stage.y)/stage.height];
    });
   });
   assert.ok(positions[0][0]<.2&&positions[0][1]<.15);
   assert.ok(positions[3][0]>.8&&positions[3][1]>.85);
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
   assert.equal(url.searchParams.get('rehearsalVersion'),'rl-lock-rehearsal-20261120-4');
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
 test(name+' mobile: all five gestures work in guided and EXACT lock modes',{timeout:225000},async()=>{
  const browser=await engine.launch({headless:true});
  const cases=[
   ['corners4','n1',4],['tap_hold_tap','n2',1],['hold_double_tap','n3',2],
   ['triangle3','n4',3],['draw_z','n5',4]
  ];
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
   for(const [id,code,dotCount] of cases){
    for(const guided of [true,false]){
     const page=await ctx.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(String(e)));
     try{
      await page.goto(new URL('self-check/session/gesture-trainer.html?source=rl-asteroids&p='+code+'&lang=en',base).href);
      const button=guided?
       page.getByRole('button',{name:'Ukázat dotyková místa při nácviku'}):
       page.getByRole('button',{name:/^Zobrazit zamčenou obrazovku/});
      await button.click();
      const lock=page.locator('#lshTeacherDemo');
      await lock.waitFor();
      assert.equal(await lock.locator('.lsh-session-lock-panel').isVisible(),true);
      assert.equal(await lock.locator('.lsh-trainer-dot').count(),guided?dotCount:0,
       'Teaching hints must never leak into exact test mode ('+id+')');
      const coords=await page.evaluate(id=>{
       const root=document.getElementById('lshTeacherDemo');
       const r=root.getBoundingClientRect(),rel=(x,y)=>({
        x:Math.round(r.left+r.width*x),y:Math.round(r.top+r.height*y)
       });
       const corners=['tl','tr','bl','br'].map(k=>{
        const b=root.querySelector('.lsh-corner-'+k)?.getBoundingClientRect();
        return b?{x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2)}:null;
       });
       const p=id==='corners4'?corners:
        id==='tap_hold_tap'?[rel(.5,.7)]:
        id==='hold_double_tap'?[rel(.3,.6),rel(.7,.6)]:
        id==='triangle3'?[rel(.5,.3),rel(.3,.7),rel(.7,.7)]:
        [rel(.3,.3),rel(.7,.3),rel(.3,.7),rel(.7,.7)];
       const hits=p.map(({x,y})=>{
        const el=document.elementFromPoint(x,y);
        return !!el?.closest(id==='corners4'?'.lsh-corner':'.lsh-unlock-surface');
       });
       return {p,hits,dimensions:{width:r.width,height:r.height}};
      },id);
      assert.ok(coords.hits.every(Boolean),
       name+' '+id+' '+(guided?'guided':'exact')+' hit targets obstructed '+JSON.stringify(coords));
      const send=async(type,p)=>{
       if(name==='Chromium'){
        // Native trusted touchscreen input on Chromium.
        if(!page.__lshCdp)page.__lshCdp=await ctx.newCDPSession(page);
        await page.__lshCdp.send('Input.dispatchTouchEvent',{
         type:type==='down'?'touchStart':type==='move'?'touchMove':'touchEnd',
         touchPoints:type==='up'?[]:[{x:p.x,y:p.y,id:1}]
        });
       }else{
        // Safari WebKit: match real pointer type and timing for holds/strokes.
        await page.evaluate(({type,p})=>{
         const el=document.querySelector('#lshTeacherDemo .lsh-unlock-surface');
         const ev=new PointerEvent(type==='down'?'pointerdown':type==='move'?'pointermove':'pointerup',{
          bubbles:true,cancelable:true,pointerId:42,pointerType:'touch',isPrimary:true,
          button:0,buttons:type==='up'?0:1,clientX:p.x,clientY:p.y
         });
         el.dispatchEvent(ev);
        },{type,p});
       }
      };
      const tap=async p=>page.touchscreen.tap(p.x,p.y);
      const hold=async(p,ms)=>{await send('down',p);await page.waitForTimeout(ms);await send('up',p)};
      const drag=async points=>{
       await send('down',points[0]);
       for(let segment=0;segment<points.length-1;segment++){
        const a=points[segment],b=points[segment+1];
        for(let n=1;n<=9;n++){
         const p={x:Math.round(a.x+(b.x-a.x)*n/9),y:Math.round(a.y+(b.y-a.y)*n/9)};
         await send('move',p);
         await page.waitForTimeout(17);
        }
       }
       await page.waitForTimeout(610);await send('up',points[points.length-1]);
      };
      const p=coords.p;
      if(id==='corners4'){for(const point of p)await tap(point)}
      else if(id==='tap_hold_tap'){await tap(p[0]);await hold(p[0],2200);await tap(p[0])}
      else if(id==='hold_double_tap'){await hold(p[0],2800);await tap(p[1]);await tap(p[1])}
      else if(id==='triangle3'){await tap(p[0]);await tap(p[1]);await hold(p[2],750)}
      else await drag(p);
      if(guided){
       await lock.locator('.lsh-trainer-progress')
        .filter({hasText:/Gesto bylo úspěšně rozpoznáno/}).waitFor({timeout:5500});
       await page.getByRole('button',{name:'Ukončit nácvik'}).click();
      }else{
       try{await lock.waitFor({state:'detached',timeout:5500});}
       catch(error){
        const d=await lock.evaluate(el=>({
         progress:el.querySelector('.lsh-trainer-progress')?.textContent,
         feedback:el.querySelector('.lsh-trainer-feedback')?.textContent
        })).catch(()=>({detached:true}));
        throw new Error(name+' '+id+' EXACT did not unlock: '+JSON.stringify(d)+'; '+error);
       }
       assert.equal(await page.locator('#gestureSuccess').isVisible(),true);
      }
      assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('attempt')).length),0);
      assert.deepEqual(errors,[],name+' '+id+' '+(guided?'guided':'exact'));
     }finally{await page.close();}
    }
   }
   await ctx.close();
  }finally{await browser.close();}
 });
}


for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(name+' n3 desktop targets match phone normalized positions, not browser viewport',{timeout:30000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1649,height:718}});
   const page=await context.newPage();
   await page.goto(new URL(teacher,base).href);
   await page.locator('#confirmTest:enabled').waitFor();
   await page.locator('input[name="unlockMethod"][value="hold_double_tap"]').check();
   await page.getByRole('button',{name:'VYZKOUŠET GESTO'}).click();
   const root=page.locator('#lshTeacherDemo');
   const geometry=await root.evaluate(demo=>{
    const phone=demo.querySelector('.lsh-rehearsal-phone-screen').getBoundingClientRect();
    const dots=[...demo.querySelectorAll('.lsh-trainer-dot')].map(node=>{
     const r=node.getBoundingClientRect();
     return {x:(r.x+r.width/2-phone.x)/phone.width,
      y:(r.y+r.height/2-phone.y)/phone.height};
    });
    return {phone:{width:phone.width,height:phone.height,x:phone.x,y:phone.y},dots};
   });
   assert.equal(geometry.dots.length,2,'n3 needs exactly two physical spots');
   assert.ok(geometry.phone.width<450,'n3 must use phone width, not PC width');
   for(const [i,x] of [.3,.7].entries()){
    assert.ok(Math.abs(geometry.dots[i].x-x)<.015,JSON.stringify(geometry));
    assert.ok(Math.abs(geometry.dots[i].y-.6)<.015,JSON.stringify(geometry));
   }
   const p=(x,y)=>({
    x:geometry.phone.x+geometry.phone.width*x,
    y:geometry.phone.y+geometry.phone.height*y
   });
   const left=p(.3,.6),right=p(.7,.6);
   await page.mouse.move(left.x,left.y);
   await page.mouse.down();await page.waitForTimeout(2800);await page.mouse.up();
   await page.mouse.click(right.x,right.y,{delay:80});
   await page.mouse.click(right.x,right.y,{delay:80});
   await root.locator('.lsh-trainer-progress').filter({hasText:/Gesto bylo úspěšně rozpoznáno/})
    .waitFor({timeout:4000});
   await page.keyboard.press('Escape');
   await context.close();
  }finally{await browser.close();}
 });
}
