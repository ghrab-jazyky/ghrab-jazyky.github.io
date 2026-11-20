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
    assert.match(url,/v=rl-lock-rehearsal-20261120-7/,'Asteroids teacher assets must be version-pinned');
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
   assert.equal(url.searchParams.get('rehearsalVersion'),'rl-lock-rehearsal-20261120-7');
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
      if(guided){
       const normalized=await lock.evaluate(el=>{
        const r=el.getBoundingClientRect();
        return [...el.querySelectorAll('.lsh-trainer-dot')].map(dot=>{
         const d=dot.getBoundingClientRect();
         return [(d.left+d.width/2-r.left)/r.width,(d.top+d.height/2-r.top)/r.height];
        });
       });
       const expected=expectedTargets[id];
       assert.equal(normalized.length,expected.length);
       for(let t=0;t<expected.length;t++)
        assert.ok(Math.abs(normalized[t][0]-expected[t][0])<.018 &&
         Math.abs(normalized[t][1]-expected[t][1])<.018,
         id+' guided PHONE target '+t+' moved: '+JSON.stringify(normalized));
      }
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
      else if(id==='triangle3'){await tap(p[0]);await page.waitForTimeout(2400);await tap(p[1]);await page.waitForTimeout(2400);await hold(p[2],1800)}
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


// Real manual mouse pacing: the triangle must not demand a 600–1000 ms
// laboratory-perfect release. Guided trainer uses the student recognizer.
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(name+' desktop Asteroids triangle accepts slow mouse movement and identifies too-short holds',{timeout:110000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:1280,height:800}});
   const page=await ctx.newPage(),errors=[];
   page.on('pageerror',err=>errors.push(String(err)));
   await page.goto(new URL(teacher,base).href);
   await page.locator('#confirmTest:enabled').waitFor();
   await page.locator('input[name="unlockMethod"][value="triangle3"]').check();
   await page.getByRole('button',{name:'VYZKOUŠET GESTO'}).click();
   const demo=page.locator('#lshTeacherDemo');
   await demo.waitFor();
   const points=await demo.evaluate(root=>
    [...root.querySelectorAll('.lsh-trainer-dot')].map(el=>{
     const r=el.getBoundingClientRect();
     return {x:r.x+r.width/2,y:r.y+r.height/2};
    }));
   assert.equal(points.length,3,'Exactly three triangular targets must render');
   for(const p of points.slice(0,2)){
    await page.mouse.click(p.x,p.y,{delay:180});
    await page.waitForTimeout(2650); // Deliberately exceeds the former 2-second gap.
   }
   await page.mouse.move(points[2].x,points[2].y);
   await page.mouse.down();
   await page.waitForTimeout(1800);
   await page.mouse.up();
   await demo.getByText('Gesto bylo úspěšně rozpoznáno.').first().waitFor({timeout:3500});
   assert.deepEqual(errors,[],'No browser errors after a natural hold');
   await page.getByRole('button',{name:'Zkusit znovu'}).click();
   for(const p of points.slice(0,2))await page.mouse.click(p.x,p.y,{delay:130});
   await page.mouse.click(points[2].x,points[2].y,{delay:100});
   await demo.locator('.lsh-trainer-feedback').filter({hasText:/Bod 3: stisk byl příliš krátký/}).waitFor({timeout:3000});
   await page.getByRole('button',{name:'Ukončit nácvik'}).click();
   await ctx.close();
  }finally{await browser.close();}
 });
}

const expectedTargets=Object.freeze({
 corners4:[[.0974,.045],[.9026,.045],[.0974,.955],[.9026,.955]],
 tap_hold_tap:[[.5,.7]],
 hold_double_tap:[[.3,.6],[.7,.6]],
 triangle3:[[.5,.3],[.3,.7],[.7,.7]],
 draw_z:[[.3,.3],[.7,.3],[.3,.7],[.7,.7]]
});
// Every gesture must have the same normalized target points in the desktop
// phone preview and on a real 390×844 student phone, not just n3.
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(name+' desktop phone preview: ALL five gesture geometries match mobile',{timeout:45000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1649,height:718}});
   const page=await context.newPage();
   await page.goto(new URL(teacher,base).href);
   await page.locator('#confirmTest:enabled').waitFor();
   for(const [id,expectedPoints] of Object.entries(expectedTargets)){
    await page.locator('input[name="unlockMethod"][value="'+id+'"]').check();
    await page.getByRole('button',{name:'VYZKOUŠET GESTO'}).click();
    const demo=page.locator('#lshTeacherDemo');
    const geom=await demo.evaluate(el=>{
     const phone=el.querySelector('.lsh-rehearsal-phone-screen');
     if(!phone)return null;
     const r=phone.getBoundingClientRect();
     const dots=[...phone.querySelectorAll('.lsh-trainer-dot')].map(n=>{
      const q=n.getBoundingClientRect();
      return {x:(q.x+q.width/2-r.x)/r.width,y:(q.y+q.height/2-r.y)/r.height};
     });
     const close=el.querySelector('.lsh-trainer-close').getBoundingClientRect();
     const instructions=el.querySelector('.lsh-trainer-heading').getBoundingClientRect();
     const hit=el.querySelector('.lsh-unlock-surface,.lsh-session-corners');
     return {phone:{x:r.x,y:r.y,width:r.width,height:r.height},dots,
      closeOutside:close.left>=r.right,headingOutside:instructions.left>=r.right,
      gestureSurfaceInside:!!hit&&phone.contains(hit)};
    });
    assert.ok(geom,'Desktop '+id+' must render a portrait phone screen');
    assert.ok(geom.phone.height>1.9*geom.phone.width);
    assert.ok(geom.phone.width<390,'Narrow desktop preview cannot be monitor-wide');
    assert.equal(geom.gestureSurfaceInside,true,id+' recognizer must bind to the phone');
    assert.ok(geom.closeOutside&&geom.headingOutside,
     id+' teaching controls must remain outside the student phone screen');
    assert.equal(geom.dots.length,expectedPoints.length,id+' unique target count');
    for(let i=0;i<expectedPoints.length;i++){
     const [x,y]=expectedPoints[i],actual=geom.dots[i];
     assert.ok(Math.abs(x-actual.x)<.018&&Math.abs(y-actual.y)<.018,
      id+' target '+(i+1)+' changed between PC and phone: '+JSON.stringify({actual,expected:[x,y]}));
    }
    await page.keyboard.press('Escape');
    assert.equal(await demo.count(),0,id+' must close cleanly');
   }
   await context.close();
  }finally{await browser.close();}
 });
}
