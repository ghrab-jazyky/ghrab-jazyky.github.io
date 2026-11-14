#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root='http://127.0.0.1:8765/language-skills-hub/';
const reading=['rl-asteroids','rl-can-mistakes','rl-plastic-ocean','rl-email-friend','rl-instant-messages'];
const listening=['ll-matthew-oscars','ll-harrison-ford','ll-peaky-no-fighting','ll-sad'];
const readingVariants=[['en','A1'],['es','B2'],['de','C2'],['fr','C1']];
const widths=[320,390,768,1280];
async function assertQuestionBounds(page,context){
 const check=await page.evaluate(()=>{
  const fields=[...document.querySelectorAll('fieldset.question')];
  const errors=[];
  for(let i=0;i<fields.length;i++){
   const card=fields[i],legend=card.querySelector('legend');
   if(!legend){errors.push('missing legend #'+i);continue;}
   const a=card.getBoundingClientRect(),b=legend.getBoundingClientRect();
   if(b.left<a.left-2||b.right>a.right+2||b.top<a.top-2||b.bottom>a.bottom+2)
    errors.push('prompt outside question #'+i+' card='+JSON.stringify([a.left,a.top,a.right,a.bottom])+
     ' legend='+JSON.stringify([b.left,b.top,b.right,b.bottom]));
   if(legend.scrollWidth>legend.clientWidth+2)
    errors.push('legend text overflow #'+i+': '+legend.scrollWidth+'/'+legend.clientWidth);
   for(const el of card.querySelectorAll('.choice')){
    const c=el.getBoundingClientRect();
    if(c.left<a.left-2||c.right>a.right+2)errors.push('choice outside question #'+i);
   }
  }
  return {count:fields.length,viewport:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,errors};
 });
 assert.ok(check.count>0,'No question cards '+context);
 assert.ok(check.overflow<=2,'Page overflows at '+check.viewport+'px ('+check.overflow+'px) '+context);
 assert.deepEqual(check.errors,[],context+' at '+check.viewport+'px');
}
async function openStudent(page,skill,topic,lang,level){
 const url=new URL('self-check/'+skill+'/'+(skill==='reading'?'index.html':'student.html'),root);
 url.searchParams.set('topic',topic);
 if(lang)url.searchParams.set('lang',lang);
 url.searchParams.set('level',level);
 const res=await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:45000});
 assert.equal(res?.status(),200,'Student URL '+url);
 await page.locator('#workspace:not([hidden])').waitFor({timeout:45000});
 assert.equal(await page.locator('.hero .notice').count(),0,'No intrusive answer-key notice '+url);
}
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('R45 '+name+': both catalog lab cards show TEST, conversation does not',{timeout:120000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}});
   for(const [skill,count] of [['cteni',5],['poslech',4],['konverzace',0]]){
    const url=new URL('index.html',root);
    url.searchParams.set('skill',skill);
    assert.equal((await page.goto(url.href)).status(),200);
    await page.locator('#cards .card').first().waitFor();
    const buttons=page.locator('#cards .card .action.test');
    assert.equal(await buttons.count(),count,'Buttons in '+skill);
    assert.ok((await buttons.allTextContents()).every(s=>s.trim()==='TEST'));
   }
  }finally{await browser.close();}
 });
 test('R45 '+name+': Reading questions fit on mobile and desktop in every language',{timeout:240000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   for(const topic of reading)for(const [lang,level] of readingVariants){
    await openStudent(page,'reading',topic,lang,level);
    for(const width of widths){
     await page.setViewportSize({width,height:860});
     await assertQuestionBounds(page,topic+' '+lang+'/'+level);
    }
   }
   assert.deepEqual(errors,[],'Unexpected Reading page errors');
  }finally{await browser.close();}
 });
 test('R45 '+name+': Listening question cards fit including sequencing and cloze',{timeout:240000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   for(const topic of listening)for(const level of ['A1','B2','C2']){
    await openStudent(page,'listening',topic,null,level);
    for(const width of widths){
     await page.setViewportSize({width,height:860});
     await assertQuestionBounds(page,topic+' '+level);
    }
   }
   assert.deepEqual(errors,[],'Unexpected Listening page errors');
  }finally{await browser.close();}
 });
}
