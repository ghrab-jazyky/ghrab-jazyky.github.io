#!/usr/bin/env node
'use strict';
const {chromium,webkit}=require('playwright');
const targets=[
 ['Reading Asteroids TEST','rl-asteroids','cteni','en','B2','test'],
 ['Listening Harrison Ford TEST','ll-harrison-ford','poslech','en','B2','test']
];
const root='https://ghrab-jazyky.github.io/language-skills-hub/self-check/practice-answers/teacher.html';
async function probe(engineName,engine,params){
 const [label,topic,skill,lang,level,mode]=params;
 const url=new URL(root);
 for(const [k,v] of Object.entries({topic,skill,lang,level,mode}))url.searchParams.set(k,v);
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const events=[];
  page.on('console',m=>{if(['error','warning'].includes(m.type()))events.push(['console',m.type(),m.text().slice(0,700)])});
  page.on('pageerror',e=>events.push(['pageerror',e.message.slice(0,700)]));
  page.on('requestfailed',r=>events.push(['requestfailed',r.url().slice(0,200),r.failure()?.errorText]));
  page.on('response',r=>{
   if(r.url().includes('cards.json')||r.url().includes('asteroids')||r.url().includes('ford'))
    events.push(['response',r.status(),r.url().slice(0,200),r.headers()['location']||'']);
  });
  const start=Date.now();
  let pageResponse;
  try{pageResponse=await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:30000})}
  catch(e){events.push(['page.goto',e.message]);}
  await page.waitForTimeout(1800);
  const snapshot=await page.evaluate(()=>({
   pageURL:location.href,
   origin:location.origin,
   title:document.title,
   csp:document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content,
   status:document.getElementById('status')?.textContent,
   topic:document.getElementById('topicTitle')?.textContent,
   level:document.getElementById('level')?.value,
   language:document.getElementById('language')?.value,
   pdfDisabled:document.getElementById('downloadPdf')?.disabled,
   selection:document.getElementById('answerMode')?.value
  }));
  let direct;
  try{
   direct=await page.evaluate(async()=>{
    const u=new URL('../../data/cards.json',location.href);
    try{
     const res=await fetch(u.href,{credentials:'omit',redirect:'error'});
     return {url:u.href,status:res.status,ok:res.ok,type:res.type,redirected:res.redirected,chars:(await res.text()).length};
    }catch(e){return {url:u.href,error:String(e),name:e.name}};
   });
  }catch(e){direct={evaluation_error:String(e)}}
  console.log(JSON.stringify({engineName,label,httpStatus:pageResponse?.status(),elapsed:Date.now()-start,snapshot,direct,events}));
  if(snapshot.pdfDisabled||snapshot.topic==='Kartu nelze otevřít')throw new Error(engineName+' '+label+' failed to initialize in production');
 }finally{await browser.close()}
}
(async()=>{
 let fail=0;
 for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
  for(const params of targets){
   try{await probe(engineName,engine,params)}
   catch(e){fail++;console.error('FAIL',e.message)}
  }
 }
 if(fail)process.exitCode=1;
})();
