#!/usr/bin/env node
'use strict';
const {chromium,webkit}=require('playwright');
const base='https://ghrab-jazyky.github.io/language-skills-hub/self-check/listening/teacher.html';
const topics=[
 {id:'ll-matthew-oscars',host:'www.youtube.com'},
 {id:'ll-harrison-ford',host:'www.facebook.com'},
 {id:'ll-peaky-no-fighting',host:'www.youtube.com'}
];
(async()=>{
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
     if(res?.status()===200&&await page.locator('meta[name="lsh-listening-teacher-release"]')
      .getAttribute('content').catch(()=>null)==='R53'){deployed=true;break}
     await page.waitForTimeout(5000);
    }
    if(!deployed)throw new Error(name+' '+topic.id+' is not published as R53');
    await page.locator('#qrMount svg').waitFor({timeout:20000});
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
     throw new Error(name+' '+topic.id+' LIVE R53 regression: '+JSON.stringify(snapshot));
    console.log('PASS LIVE HTTPS R53',name,topic.id,'video URLs',snapshot.sourceLinks.join(' / '));
   }
  }finally{await browser.close()}
 }
})().catch(err=>{console.error(err);process.exitCode=1});
