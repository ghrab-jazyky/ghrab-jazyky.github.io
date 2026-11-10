#!/usr/bin/env node
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
const base='http://127.0.0.1:8765/language-skills-hub/';
const catalog=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../data/cards.json'),'utf8'));
const entries=catalog.entries.filter(e=>['cteni','poslech'].includes(e.skill));
const qa=new URL('self-check/test-banks/qa.html',base).href;
function url(skill,topic,lang,level,suffix){
 const loc=new URL('self-check/test-banks/'+skill+'/preview.html',base);
 loc.searchParams.set('topic',topic);
 if(skill==='reading')loc.searchParams.set('lang',lang);
 loc.searchParams.set('level',level);
 loc.searchParams.set('timer','20');loc.searchParams.set('attempt','r34candidate'+suffix);
 return loc.href;
}
async function begin(page){
 await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:40000});
 await page.locator('#sessionStart').click();
 await page.locator('#workspace:not([hidden])').waitFor();
}
async function unlock(page){
 if(await page.locator('#sessionLock').isVisible()){
  for(const corner of ['tl','tr','bl','br'])await page.locator('.lsh-corner-'+corner).click();
  await page.locator('#sessionLock').waitFor({state:'hidden'});
 }
}
for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
 test('R34 '+name+' teacher QA dashboard shows complete coverage and can download a Claude review packet',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const page=await ctx.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
   assert.equal((await page.goto(qa)).status(),200);
   await page.locator('#coverageRows tr').first().waitFor({timeout:30000});
   assert.equal(await page.locator('#coverageRows tr').count(),8);
   assert.match(await page.locator('#stats').textContent(),/Reading: 120\/120/);
   assert.match(await page.locator('#stats').textContent(),/Listening: 18\/18/);
   await page.locator('#topic').selectOption('rl-plastic-ocean');
   await page.locator('#language').selectOption('fr');
   await page.locator('#level').selectOption('C2');
   assert.match(await page.locator('#selectedStatus').textContent(),/Automatický kandidát/);
   const link=await page.locator('#previewLink').getAttribute('href');
   assert.match(link,/rl-plastic-ocean/);assert.match(link,/lang=fr/);assert.match(link,/level=C2/);
   const wait=page.waitForEvent('download',{timeout:12000});
   await page.locator('#downloadPacket').click();
   const download=await wait;
   const packet=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
   assert.equal(packet.kind,'LSH_R34_CLAUDE_REVIEW_PACKET_V1');
   assert.equal(packet.stage,'NEVER_PUBLISH_UNREVIEWED');
   assert.equal(packet.practice.questions.length,21);
   assert.equal(packet.proposedTest.questions.length,10);
   assert.equal(packet.language,'fr');
   await page.locator('#skill').selectOption('poslech');
   await page.locator('#level').selectOption('A1');
   assert.match(await page.locator('#selectedStatus').textContent(),/Listening autorský návrh/);
   assert.match(await page.locator('#previewLink').getAttribute('href'),/listening\/preview/);
   assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
 test('R34 '+name+' Reading FR C2 candidate works on mobile, restores and shows only mistakes',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844}}),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   await page.goto(url('reading','rl-asteroids','fr','C2','frc2'));
   await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
   assert.match(await page.locator('.mode').textContent(),/AUTO-GENERATED CANDIDATE/);
   assert.match(await page.locator('#pilotWarning').textContent(),/Claude/);
   assert.equal(await page.locator('fieldset.question').count(),10);
   assert.equal(await page.locator('#results').isHidden(),true);
   await begin(page);
   const answers=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,
    '../self-check/test-banks/reading/collections/rl-asteroids.json'),'utf8')).variants.fr.C2.questions;
   for(let i=0;i<answers.length;i++)
    await page.locator('fieldset.question').nth(i).locator('input').nth(answers[i].answer).check();
   await page.reload();
   await page.locator('#workspace:not([hidden])').waitFor({timeout:30000});await unlock(page);
   await page.locator('fieldset.question').first().locator('input').nth((answers[0].answer+1)%answers[0].choices.length).check();
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   assert.equal(await page.locator('#resultDetails .review').count(),1);
   assert.match(await page.locator('#resultDetails').textContent(),/Correct answer/);
   assert.match(await page.locator('#sessionBar').textContent(),/Submitted|Remis/);
   const keys=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('lsh:local-attempt:r30:reading:')));
   assert.ok(keys.some(k=>k.includes('qa-rl-asteroids')),'QA session must be separate from live test');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
   assert.deepEqual(errors,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
 test('R34 '+name+' Listening candidate is clearly unapproved and requires teacher grading',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true}),page=await ctx.newPage(),errors=[],writes=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method())});
   await page.goto(url('listening','ll-matthew-oscars','en','B2','listeningb2'));
   await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
   assert.match(await page.locator('#notice').textContent(),/not yet been verified against the original recording/);
   assert.match(await page.locator('title').textContent(),/UNAPPROVED Listening QA/);
   await begin(page);
   assert.ok(await page.locator('fieldset.question').count()>=3);
   assert.equal(await page.locator('#results').isHidden(),true);
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.locator('.written-response').first().fill('My independent answer.');
   await page.locator('#submitButton').click();
   await page.locator('#manualGrade:not([hidden])').waitFor();
   assert.equal(await page.locator('#exportResult').isDisabled(),true);
   const controls=page.locator('#manualGradeTasks select');
   assert.ok(await controls.count()>=2);
   await controls.first().selectOption('1');
   await page.reload();
   await page.locator('#manualGrade:not([hidden])').waitFor({timeout:30000});
   assert.equal(await controls.first().inputValue(),'1');
   for(let i=1;i<await controls.count();i++)await controls.nth(i).selectOption('0');
   assert.equal(await page.locator('#exportResult').isDisabled(),false);
   const keys=await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.includes('lsh:local-attempt:r30:listening:')));
   assert.ok(keys.some(k=>k.includes('qa-ll-matthew-oscars')));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2);
   assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
 test('R34 '+name+' malformed or prematurely published banks fail closed',async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const ctx=await browser.newContext(),page=await ctx.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/collections/rl-email-friend.json',async route=>{
    const data=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,
     '../self-check/test-banks/reading/collections/rl-email-friend.json'),'utf8'));
    data.published=true;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
   });
   await page.goto(url('reading','rl-email-friend','de','A2','badread'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/Unapproved or mismatched Reading collection/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   await page.unrouteAll();
   await page.route('**/collections/ll-peaky-no-fighting.json',async route=>{
    const data=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,
     '../self-check/test-banks/listening/collections/ll-peaky-no-fighting.json'),'utf8'));
    data.variants.B1.published=true;
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
   });
   await page.goto(url('listening','ll-peaky-no-fighting','en','B1','badlisten'));
   await page.locator('#loading.error').waitFor({timeout:30000});
   assert.match(await page.locator('#loading').textContent(),/Unapproved or mismatched Listening candidate/);
   assert.equal(await page.locator('#sessionStart').count(),0);
   assert.deepEqual(errors,[]);
   await ctx.close();
  }finally{await browser.close()}
 });
}
test('R34 Chromium representative inventory loads from all five topics and four languages',async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const languages=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
  let count=0;
  for(const e of entries.filter(e=>e.skill==='cteni'))for(const lang of languages)for(let k=0;k<levels.length;k++){
   const level=levels[k],id='load'+String(count).padStart(4,'0');
   await page.goto(url('reading',e.id,lang,level,id));
   await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:30000});
   const n=await page.locator('fieldset.question').count();
   assert.equal(n,lang==='en'&&e.id==='rl-can-mistakes'&&['B1','B2'].includes(level)?10:
    ['A1','A2'].includes(level)?6:level==='B1'?8:10,e.id+' '+lang+' '+level);
   count++;
  }
  assert.equal(count,120);assert.deepEqual(errors,[]);
 }finally{await browser.close()}
});
