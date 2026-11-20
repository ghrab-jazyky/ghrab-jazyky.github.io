'use strict';
/* Five-gesture mobile layout certification. Tests real browser-computed geometry
 * in the teacher's QR rehearsal only; it never modifies the student session. */
const test=require('node:test');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');

const base=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const pagePath='self-check/session/gesture-trainer.html?source=rl-asteroids&lang=en&p=';
const sizes=[[320,568],[345,635],[390,844]];
const gestures=[
 {code:'n1',name:'corners4',dots:4},
 {code:'n2',name:'tap_hold_tap',dots:1},
 {code:'n3',name:'hold_double_tap',dots:2},
 {code:'n4',name:'triangle3',dots:3},
 {code:'n5',name:'draw_z',dots:4}
];
const failure='Sekvence se nezdařila nebo vypršel čas. Začněte znovu od prvního kroku.';
const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
const noOverlap=(a,b,gap,context)=>assert.ok(a.bottom+gap<=b.top,
 context+' overlapping vertical areas: '+JSON.stringify({a,b}));

for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(engineName+' all five gestures: QR, guided and exact layouts on narrow phones',
  {timeout:240000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    for(const [width,height] of sizes){
     const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
     try{
      for(const gesture of gestures){
       const tag=engineName+' '+gesture.name+' '+width+'x'+height;
       const page=await context.newPage();
       const errors=[];
       page.on('pageerror',e=>errors.push(String(e)));
       try{
        await page.goto(new URL(pagePath+gesture.code,base).href);
        const guidedButton=page.getByRole('button',{name:'Ukázat dotyková místa při nácviku'});
        await guidedButton.waitFor();
        const landing=await page.evaluate(()=>{
         const form=document.querySelector('.lsh-unlock-trainer-page .teacher-form');
         const elements=[document.querySelector('#gestureTitle'),document.querySelector('#gestureGuide'),
          document.querySelector('#launchTrainer'),document.querySelector('#launchGuidedTrainer')];
         const r=e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom}};
         return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
          padding:parseFloat(getComputedStyle(form).paddingLeft),
          form:r(form),elements:elements.map(r),coarse:matchMedia('(pointer:coarse)').matches};
        });
        assert.equal(landing.coarse,true,tag+' must emulate a touch device');
        assert.ok(landing.scrollWidth<=landing.viewport+1,tag+' QR page overflows horizontally');
        assert.ok(landing.padding>=14,tag+' QR panel lacks side padding');
        for(const element of landing.elements){
         assert.ok(element.left>=landing.form.left+landing.padding-1,tag+' QR content touches left border');
         assert.ok(element.right<=landing.form.right-landing.padding+1,tag+' QR content clips right border');
        }
        noOverlap(landing.elements[2],landing.elements[3],3,tag+' QR buttons');

        await guidedButton.click();
        const overlay=page.locator('#lshTeacherDemo');
        await overlay.waitFor();
        assert.equal(await overlay.locator('.lsh-trainer-dot').count(),gesture.dots,tag+' wrong number of hints');
        const guided=await overlay.evaluate((root,args)=>{
         root.querySelector('.lsh-trainer-feedback').textContent=args.failure;
         const r=e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height}};
         const pick=s=>r(root.querySelector(s));
         const points=args.code==='n1'?
          [...root.querySelectorAll('.lsh-corner')]:
          [...root.querySelectorAll('.lsh-trainer-dot')];
         const targets=points.map(el=>{
          const box=r(el),x=(box.left+box.right)/2,y=(box.top+box.bottom)/2;
          const top=document.elementFromPoint(x,y);
          return {x,y,inside:x>=0&&x<innerWidth&&y>=0&&y<innerHeight,
           hit:!!top?.closest(args.code==='n1'?'.lsh-corner':'.lsh-unlock-surface')};
         });
         return {close:pick('.lsh-trainer-close'),heading:pick('.lsh-trainer-heading'),
          lock:pick('.lsh-session-lock-panel'),feedback:pick('.lsh-trainer-feedback'),
          retry:pick('.lsh-trainer-retry'),targets,
          helpHidden:getComputedStyle(root.querySelector('.lsh-trainer-heading p:not(.lsh-trainer-progress)')).display==='none'};
        },{code:gesture.code,failure});
        assert.equal(guided.helpHidden,true,tag+' long help should not cover the lock');
        noOverlap(guided.close,guided.heading,4,tag+' close/heading');
        noOverlap(guided.heading,guided.lock,6,tag+' heading/lock');
        noOverlap(guided.lock,guided.feedback,6,tag+' lock/feedback');
        noOverlap(guided.feedback,guided.retry,6,tag+' feedback/retry');
        assert.equal(guided.targets.length,gesture.dots,tag+' missing gesture targets');
        assert.ok(guided.targets.every(x=>x.inside&&x.hit),
         tag+' some gesture targets are obscured: '+JSON.stringify(guided.targets));
        await page.getByRole('button',{name:'Zkusit znovu'}).click();
        assert.equal(await overlay.locator('.lsh-trainer-feedback').textContent(),'',
         tag+' retry must clear the failure text');
        await page.getByRole('button',{name:'Ukončit nácvik'}).click();
        assert.equal(await overlay.count(),0,tag+' guided overlay must close');

        await page.getByRole('button',{name:/^Zobrazit zamčenou obrazovku/}).click();
        const exact=page.locator('#lshTeacherDemo');
        await exact.waitFor();
        assert.equal(await exact.locator('.lsh-trainer-dot').count(),0,tag+' exact mode leaked guidance');
        const exactLayout=await exact.evaluate(root=>{
         const r=e=>{const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom}};
         return {close:r(root.querySelector('.lsh-trainer-close')),
          lock:r(root.querySelector('.lsh-session-lock-panel')),
          heading:getComputedStyle(root.querySelector('.lsh-trainer-heading')).display,
          retry:getComputedStyle(root.querySelector('.lsh-trainer-retry')).display};
        });
        assert.equal(exactLayout.heading,'none',tag+' exact mode shows heading');
        assert.equal(exactLayout.retry,'none',tag+' exact mode shows retry');
        noOverlap(exactLayout.close,exactLayout.lock,4,tag+' exact close/lock');
        await page.getByRole('button',{name:'Ukončit nácvik'}).click();
        assert.equal(await exact.count(),0,tag+' exact overlay must close');
        assert.deepEqual(errors,[],tag+' browser errors');
       }finally{await page.close();}
      }
     }finally{await context.close();}
    }
   }finally{await browser.close();}
  });
}
