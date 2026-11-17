'use strict';
/* Stage B URL, R64 registry, legacy compatibility, persistence and R30 failure counter.
 * All assertions operate on unmodified Reading/Listening app pages.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const BASE=process.env.LSH_STAGEB_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const languages={
 en:'This test link is not valid.',es:'Este enlace de la prueba no es válido.',
 de:'Dieser Testlink ist ungültig.',fr:'Ce lien de test n’est pas valide.'
};
let seq=0;
const fresh=()=>('classstate'+Date.now().toString(36)+(seq++).toString(36));
function link(lab,attempt,p='n4',lang='en'){
 const path=lab==='reading'?'self-check/reading/index.html':'self-check/listening/student.html';
 const u=new URL(path,BASE);
 u.searchParams.set('topic',lab==='reading'?'rl-asteroids':'ll-sad');
 if(lab==='reading')u.searchParams.set('lang',lang);
 u.searchParams.set('level','B2');u.searchParams.set('timer','5');u.searchParams.set('attempt',attempt);
 if(p!==null)u.searchParams.append('p',p);
 return u;
}
const prelude=()=>new URL('self-check/reading/teacher.html',BASE).href;
const keys=()=>Object.keys(localStorage).filter(k=>k.startsWith('lsh:device-attempt:')||k.startsWith('lsh:local-attempt:')).sort();
function r64Key(lab,attempt,lang='en'){
 const skill=lab==='reading'?'reading':'listening';
 const topic=lab==='reading'?'rl-asteroids':'ll-sad';
 return 'lsh:device-attempt:r64:'+skill+':'+attempt.toLowerCase()+':'+[topic,lang,'B2'].join('|');
}
for(const [engineName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 test('R64 '+engineName+' invalid URL fails before registry, no hash or attempt side effects; all locales',
 {timeout:110000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   for(const lab of ['reading','listening']){
    for(const lang of lab==='reading'?['en','es','de','fr']:['en']){
     const context=await browser.newContext(),page=await context.newPage();
     const attempt=fresh();
     try{
      await page.goto(prelude());
      const before=await page.evaluate(keys);
      for(const p of ['', 'n8','N4',null]){
       if(p===null)continue; // Legacy missing parameter is valid, tested separately.
       const u=link(lab,attempt,p,lang);
       await page.goto(u.href,{waitUntil:'domcontentloaded'});
       await page.locator('#loading').waitFor({timeout:15000});
       const text=await page.locator('#loading').textContent();
       assert.ok(text.includes(lab==='reading'?languages[lang]:languages.en),lab+' '+lang+' '+p+' '+text);
       assert.equal(await page.locator('#workspace').isHidden(),true);
       assert.equal(await page.locator('#sessionStart').count(),0);
       assert.equal(new URL(page.url()).hash,'');
       assert.deepEqual(await page.evaluate(keys),before,'Invalid URL must not touch attempts');
      }
      const dup=link(lab,attempt,'n4',lang);
      dup.searchParams.append('p','n4');
      await page.goto(dup.href,{waitUntil:'domcontentloaded'});
      await page.waitForTimeout(80);
      assert.equal(await page.locator('#workspace').isHidden(),true);
      assert.deepEqual(await page.evaluate(keys),before);
      assert.equal(new URL(page.url()).hash,'');
      // Same attempt with a valid URL can still begin after invalid requests.
      await page.goto(link(lab,attempt,'n4',lang).href,{waitUntil:'domcontentloaded'});
      await page.locator('#sessionIntro:not([hidden])').waitFor({timeout:20000});
      const found=await page.evaluate(keys);
      assert.ok(found.some(k=>k.startsWith('lsh:device-attempt:r64:')));
     }finally{await context.close()}
    }
   }
   console.log('URL VALIDATION '+engineName+' Reading EN/ES/DE/FR and Listening EN: PASS');
  }finally{await browser.close()}
 });
 test('R64 '+engineName+' new, legacy, mismatch sticky, corrupted unlock, and no-write states',
 {timeout:105000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext(),page=await context.newPage();
   const attempt=fresh(),key=r64Key('reading',attempt);
   try{
    await page.goto(link('reading',attempt,'n4').href);
    await page.locator('#sessionIntro:not([hidden])').waitFor();
    let item=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
    assert.equal(item.unlock,'triangle3');assert.equal(item.unlockCode,'n4');
    assert.equal(item.configurationMismatchSeen,false);
    await page.goto(link('reading',attempt,'n5').href);
    await page.locator('#sessionIntro:not([hidden])').waitFor();
    item=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
    assert.equal(item.unlockCode,'n4');assert.equal(item.configurationMismatchSeen,true);
    await page.goto(link('reading',attempt,'n4').href);
    await page.locator('#sessionIntro:not([hidden])').waitFor();
    item=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
    assert.equal(item.configurationMismatchSeen,true,'Mismatch evidence must be sticky');
   }finally{await context.close()}
   const legacy=await browser.newContext(),p=await legacy.newPage();
   const legacyAttempt=fresh(),legacyKey=r64Key('reading',legacyAttempt);
   const old={session:'0123456789abcdef01234567',variant:'rl-asteroids|en|B2',
    limitMinutes:5,createdAt:Date.now(),consumed:false};
   try{
    await p.goto(prelude());
    await p.evaluate(({k,v})=>localStorage.setItem(k,JSON.stringify(v)),{k:legacyKey,v:old});
    await p.goto(link('reading',legacyAttempt,null).href);
    await p.locator('#sessionIntro:not([hidden])').waitFor();
    assert.deepEqual(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),legacyKey),old,
     'Original older R64 registry may not be rewritten when compatible');
    await p.goto(link('reading',legacyAttempt,'n4').href);
    await p.locator('#sessionIntro:not([hidden])').waitFor();
    const changed=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),legacyKey);
    assert.equal(changed.configurationMismatchSeen,true);
    assert.equal(Object.prototype.hasOwnProperty.call(changed,'unlock'),false,
     'Old registry retains historical corners4 semantics');
   }finally{await legacy.close()}
   const corrupted=await browser.newContext(),q=await corrupted.newPage();
   const badAttempt=fresh(),badKey=r64Key('reading',badAttempt);
   const broken={...old,unlock:'unsupported-id',unlockCode:'n4',configurationMismatchSeen:false};
   try{
    await q.goto(prelude());
    await q.evaluate(({k,v})=>localStorage.setItem(k,JSON.stringify(v)),{k:badKey,v:broken});
    const before=await q.evaluate(keys);
    await q.goto(link('reading',badAttempt,'n4').href,{waitUntil:'domcontentloaded'});
    await q.locator('#loading').waitFor();
    assert.match(await q.locator('#loading').textContent(),/saved test on this device cannot be read/);
    assert.equal(await q.locator('#workspace').isHidden(),true);
    assert.equal(new URL(q.url()).hash,'');
    assert.deepEqual(await q.evaluate(keys),before);
    assert.deepEqual(await q.evaluate(k=>JSON.parse(localStorage.getItem(k)),badKey),broken);
   }finally{await corrupted.close()}
   console.log('R64 REGISTRY '+engineName+' pinning, sticky mismatch, rollback, and invalid state: PASS');
  }finally{await browser.close()}
 });
 test('R30 '+engineName+' incomplete gestures saturate at 9999 without changing incidents or resumptions',
 {timeout:65000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:820,height:1180}}),page=await context.newPage();
   const attempt=fresh();
   await page.addInitScript(()=>{
    window.__FS=true;
    Object.defineProperty(Document.prototype,'fullscreenElement',{configurable:true,
     get:()=>window.__FS?document.documentElement:null});
    Element.prototype.requestFullscreen=function(){window.__FS=true;return Promise.resolve()};
   });
   try{
    await page.goto(link('reading',attempt,'n4').href);
    await page.locator('#sessionIntro:not([hidden])').waitFor();
    await page.locator('#sessionStart').click();
    await page.locator('#workspace:not([hidden])').waitFor();
    await page.mouse.click(110,180,{button:'right'});
    await page.locator('#sessionLock:not([hidden])').waitFor();
    const snapshot=()=>page.evaluate(()=>{
     const k=Object.keys(localStorage).find(k=>k.startsWith('lsh:local-attempt:r30:'));
     if(!k)throw new Error('Missing R30 snapshot');
     return {key:k,record:JSON.parse(localStorage.getItem(k))};
    });
    let {key,record}=await snapshot();
    assert.equal(record.unlockFailures,0);
    const nIncidents=record.incidents.length,nResumes=(record.resumptions||[]).length;
    const w=820,h=1180;
    async function failedGesture(){
     for(const [x,y] of [[.5,.3],[.3,.7],[.7,.7]])
      await page.mouse.click(Math.round(w*x),Math.round(h*y),{delay:60});
    }
    await failedGesture();
    record=(await snapshot()).record;
    assert.equal(record.unlockFailures,1);
    assert.equal(record.incidents.length,nIncidents);
    assert.equal(record.resumptions.length,nResumes);
    record.unlockFailures=9998;
    await page.evaluate(({key,record})=>localStorage.setItem(key,JSON.stringify(record)),{key,record});
    await page.reload();
    await page.locator('#sessionLock:not([hidden])').waitFor();
    await failedGesture();
    record=(await snapshot()).record;assert.equal(record.unlockFailures,9999);
    await failedGesture();
    record=(await snapshot()).record;assert.equal(record.unlockFailures,9999);
    assert.equal(record.incidents.length,nIncidents);
    assert.equal(record.resumptions.length,nResumes);
   }finally{await context.close()}
   console.log('R30 FAILURE SATURATION '+engineName+' PASS');
  }finally{await browser.close()}
 });
}
