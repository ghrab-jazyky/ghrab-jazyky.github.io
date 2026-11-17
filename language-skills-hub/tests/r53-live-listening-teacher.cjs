#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.LSH_R53_BASE_URL||'https://ghrab-jazyky.github.io/language-skills-hub/self-check/listening/teacher.html';
const target=new URL(base);
const targetLabel=target.origin==='https://ghrab-jazyky.github.io'?'LIVE HTTPS R53':
 target.origin==='http://127.0.0.1:8765'?'LOCAL HTTP R53':'CONFIGURED TARGET R53';
const topics=[
 {id:'ll-matthew-oscars',host:'www.youtube.com'},
 {id:'ll-harrison-ford',host:'www.facebook.com'},
 {id:'ll-peaky-no-fighting',host:'www.youtube.com'}
];
(async()=>{
 console.log('TARGET',targetLabel,target.href);
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   for(const topic of topics){
    const u=new URL(base);
    u.searchParams.set('topic',topic.id);u.searchParams.set('level','B2');
    let deployed=false;
    for(let attempt=0;attempt<36;attempt++){
     u.searchParams.set('_release_check',String(Date.now())+'-'+attempt);
     const res=await page.goto(u.href,{waitUntil:'domcontentloaded',timeout:25000});
     const marker=await page.evaluate(()=>
      document.querySelector('meta[name="lsh-listening-teacher-release"]')?.content||'').catch(()=>'');
     if(res?.status()===200&&marker==='R53'){deployed=true;break}
     await page.waitForTimeout(5000);
    }
    if(!deployed)throw new Error(targetLabel+' '+name+' '+topic.id+' is not published as R53');
    await page.locator('#confirmTest:enabled').waitFor({timeout:20000});
    assert.equal(await page.locator('#studentUrl').inputValue(),'','Draft settings have no student URL');
    assert.equal(await page.locator('#qrMount svg').count(),0,'Draft settings have no QR code');
    await page.locator('#confirmTest').click();
    await page.locator('#qrMount svg').waitFor({timeout:20000});
    assert.equal(await page.locator('#confirmTest').isDisabled(),true,'Confirmed settings disable confirmation');
    const snapshot=await page.evaluate(()=>({
     topic:document.getElementById('topicTitle')?.dataset.topicId,
     sourceLinks:[...document.querySelectorAll('#mediaSources a')].map(x=>x.href),
     studentUrl:document.getElementById('studentUrl')?.value,
     topicSelector:document.querySelectorAll('select#topic').length,
     playbackControls:document.querySelectorAll('#passCount,#markPass,#resetPass,#playbackHeading').length,
     widthOverflow:document.documentElement.scrollWidth-innerWidth
    }));
    if(snapshot.topic!==topic.id||snapshot.sourceLinks.length!==2||
       new URL(snapshot.sourceLinks[0]).hostname!==topic.host||
       new URL(snapshot.studentUrl).searchParams.get('topic')!==topic.id||
       snapshot.topicSelector!==0||snapshot.playbackControls!==0||
       snapshot.widthOverflow>2)
     throw new Error(name+' '+topic.id+' '+targetLabel+' regression: '+JSON.stringify(snapshot));
    console.log('PASS '+targetLabel,name,topic.id,'video URLs',snapshot.sourceLinks.join(' / '));
   }
  }finally{await browser.close()}
 }
})().catch(err=>{console.error(err);process.exitCode=1});
