'use strict';
/* Screenshot-driven R133 layout certification. This does not mock CSS:
 * each assertion reads browser-computed boxes under a coarse mobile pointer.
 * User screenshots: guided lock overlay overlap and QR landing card padding. */
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const url=new URL('self-check/session/gesture-trainer.html?source=rl-asteroids&p=n1&lang=en',base).href;
const dimensions=[[345,635],[320,568],[390,844]];
const rect=e=>e.getBoundingClientRect();
const epsilon=1;
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test(engineName+' Android-sized QR landing and guided lock: no overlap, no clipped text',{timeout:110000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const [width,height] of dimensions){
    const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    try{
     await page.goto(url);
     await page.getByRole('button',{name:'Ukázat dotyková místa při nácviku'}).waitFor();
     const landing=await page.evaluate(()=>{
      const get=s=>document.querySelector(s);
      const b=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
      const form=get('.lsh-unlock-trainer-page .teacher-form');
      const title=get('#gestureTitle');
      const guide=get('#gestureGuide');
      const buttons=[get('#launchTrainer'),get('#launchGuidedTrainer')];
      const panel=get('.lsh-unlock-trainer-page .teacher-panel');
      const main=get('main');
      return {scrollWidth:document.documentElement.scrollWidth,innerWidth:innerWidth,
       coarse:matchMedia('(pointer:coarse)').matches,
       panel:b(panel),main:b(main),form:b(form),title:b(title),guide:b(guide),
       buttons:buttons.map(b),pad:parseFloat(getComputedStyle(form).paddingLeft)};
     });
     assert.equal(landing.coarse,true,'Mobile coarse-pointer responsive styling missing');
     assert.ok(landing.scrollWidth<=landing.innerWidth+epsilon,
      engineName+' '+width+'px QR page scrolls horizontally: '+JSON.stringify(landing));
     assert.ok(landing.pad>=14,'QR teacher card must have useful side padding');
     assert.ok(landing.title.left>=landing.form.left+landing.pad-epsilon,
      'QR title touches the panel border at '+width+'px');
     assert.ok(landing.guide.left>=landing.form.left+landing.pad-epsilon,
      'QR instruction touches the left panel border at '+width+'px');
     for(const button of landing.buttons){
      assert.ok(button.left>=landing.form.left+landing.pad-epsilon,
       'QR button clips on the left at '+width+'px');
      assert.ok(button.right<=landing.form.right-landing.pad+epsilon,
       'QR button clips on the right at '+width+'px');
     }
     assert.ok(landing.buttons[0].bottom+3<=landing.buttons[1].top,
      'QR mode buttons overlap at '+width+'px');

     await page.getByRole('button',{name:'Ukázat dotyková místa při nácviku'}).click();
     const overlay=page.locator('#lshTeacherDemo');
     await overlay.waitFor();
     assert.equal(await overlay.locator('.lsh-session-lock-panel h2').textContent(),'Test locked');
     assert.equal(await overlay.locator('.lsh-trainer-dot').count(),4);
     // Reproduce the feedback chip shown on the screenshot, including its height.
     const layout=await overlay.evaluate(root=>{
      const find=s=>root.querySelector(s);
      const b=s=>{const r=find(s).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
      const label=find('.lsh-trainer-heading p:not(.lsh-trainer-progress)');
      const feedback=find('.lsh-trainer-feedback');
      feedback.textContent='Začněte na zvýrazněném bodu.';
      const corners=['tl','tr','bl','br'].map(key=>{
       const c=find('.lsh-corner-'+key),r=c.getBoundingClientRect();
       const target=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
       return {key,hit:target===c||c.contains(target),rect:{x:r.x,y:r.y,width:r.width,height:r.height}};
      });
      return {close:b('.lsh-trainer-close'),heading:b('.lsh-trainer-heading'),
       panel:b('.lsh-session-lock-panel'),feedback:b('.lsh-trainer-feedback'),
       retry:b('.lsh-trainer-retry'),
       labelVisible:!!label&&getComputedStyle(label).display!=='none',
       screen:{width:innerWidth,height:innerHeight},corners};
     });
     assert.equal(layout.labelVisible,false,
      'Long help text must not overlay the locked-test panel on mobile');
     assert.ok(layout.close.bottom+4<=layout.heading.top,
      'Exit overlaps instruction header: '+JSON.stringify(layout));
     assert.ok(layout.heading.bottom+8<=layout.panel.top,
      'Instruction header overlaps Test locked: '+JSON.stringify(layout));
     assert.ok(layout.panel.bottom+8<=layout.feedback.top,
      'Test locked overlaps feedback: '+JSON.stringify(layout));
     assert.ok(layout.feedback.bottom+8<=layout.retry.top,
      'Feedback overlaps Retry: '+JSON.stringify(layout));
     assert.ok(layout.corners.every(x=>x.hit),
      'Corner target blocked at '+width+'x'+height+': '+JSON.stringify(layout.corners));
     await page.getByRole('button',{name:'Ukončit nácvik'}).click();
     assert.equal(await overlay.count(),0);
     assert.deepEqual(errors,[],'Unexpected JavaScript error at '+width+'x'+height);
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 });
}
