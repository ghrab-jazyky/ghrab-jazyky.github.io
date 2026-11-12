#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root='http://127.0.0.1:8765/language-skills-hub/';
const entries=require('../data/cards.json').entries.filter(e=>e.skill==='poslech');
const originalLinks={
 'll-matthew-oscars':['https://www.youtube.com/watch?v=wD2cVhC-63I&t=70s','https://www.youtube.com/watch?v=wD2cVhC-63I'],
 'll-harrison-ford':['https://www.facebook.com/netflixus/videos/harrison-ford-sag-life-achievement-award/796302026840392/','https://x.com/netflix/status/2028305176508170602'],
 'll-peaky-no-fighting':['https://www.youtube.com/watch?v=DRLSRX1nF0s','https://www.youtube.com/watch?v=_hzgUPl3YWU']
};
const url=(topic,level='B2')=>{
 const u=new URL('self-check/listening/teacher.html',root);
 if(topic)u.searchParams.set('topic',topic);
 if(level)u.searchParams.set('level',level);
 return u.href;
};
for(const [name,engine]of[['chromium',chromium],['webkit',webkit]]){
 test('R53 '+name+': all 3 Listening TEST topics stay fixed across 6 levels, video and student sharing',{timeout:180000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
   for(const entry of entries){
    for(const level of entry.levels){
     assert.equal((await page.goto(url(entry.id,level),{waitUntil:'load'})).status(),200);
     await page.locator('#qrMount svg').waitFor({timeout:20000});
     assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),entry.id);
     assert.equal(await page.locator('#level').inputValue(),level);
     assert.equal(await page.locator('select#topic').count(),0);
     assert.equal(await page.locator('#passCount,#markPass,#resetPass,#playbackHeading').count(),0);
     assert.equal(await page.locator('#mediaSources a').count(),2);
     const hrefs=await page.locator('#mediaSources a').evaluateAll(nodes=>nodes.map(x=>x.href));
     assert.deepEqual(hrefs,originalLinks[entry.id]);
     assert.equal(await page.locator('#mediaSources .listening-video-primary').count(),1);
     for(const a of await page.locator('#mediaSources a').all()){
      assert.equal(await a.getAttribute('target'),'_blank');
      assert.match(await a.getAttribute('rel'),/noopener noreferrer/);
     }
     const student=await page.locator('#studentUrl').inputValue();
     const parsed=new URL(student);
     assert.equal(parsed.searchParams.get('topic'),entry.id);
     assert.equal(parsed.searchParams.get('level'),level);
     assert.equal(parsed.searchParams.get('timer'),'30');
     assert.ok(parsed.searchParams.get('attempt')?.startsWith('class'));
     assert.equal(await page.locator('#studentPreview').getAttribute('href'),student);
     assert.equal(await page.locator('#downloadQr').isEnabled(),true);
     assert.equal(await page.locator('#copyUrl').isEnabled(),true);
     const width=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
     assert.ok(width<=2,'horizontal overflow: '+entry.id+' '+level+' '+width);
    }
    // Changing level/timer cannot switch the card or video sources.
    await page.locator('#level').selectOption('A1');
    await page.locator('#timerMinutes').fill('45');
    assert.equal(await page.locator('#topicTitle').getAttribute('data-topic-id'),entry.id);
    assert.equal(new URL(await page.locator('#studentUrl').inputValue()).searchParams.get('timer'),'45');
    assert.equal(new URL(await page.locator('#studentUrl').inputValue()).searchParams.get('level'),'A1');
    assert.deepEqual(await page.locator('#mediaSources a').evaluateAll(nodes=>nodes.map(x=>x.href)),originalLinks[entry.id]);
    // Invalid timer disables share link; valid input restores it.
    await page.locator('#timerMinutes').fill('4');
    assert.equal(await page.locator('#copyUrl').isDisabled(),true);
    assert.equal(await page.locator('#studentUrl').inputValue(),'');
    await page.locator('#timerMinutes').fill('30');
    await page.locator('#qrMount svg').waitFor({timeout:20000});
    assert.equal(await page.locator('#copyUrl').isEnabled(),true);
   }
   assert.deepEqual(errors,[]);
   assert.deepEqual(writes,[]);
  }finally{await browser.close()}
 });
 test('R53 '+name+': missing/invalid topic fails closed, no default to another Listening card',{timeout:60000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:375,height:812}});
   for(const invalid of [null,'rl-asteroids','ll-does-not-exist']){
    await page.goto(url(invalid),{waitUntil:'load'});
    assert.equal(await page.locator('#topicTitle').textContent(),'Kartu nelze otevřít');
    assert.equal(await page.locator('#mediaSources a').count(),0);
    assert.equal(await page.locator('#qrMount svg').count(),0);
    assert.equal(await page.locator('#copyUrl').isDisabled(),true);
    assert.equal(await page.locator('#studentUrl').inputValue(),'');
    assert.match(await page.locator('#setupStatus').textContent(),/Neplatný odkaz/);
   }
  }finally{await browser.close()}
 });
}
