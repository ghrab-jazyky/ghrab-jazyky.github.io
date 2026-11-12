'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require('playwright'),jsQR=require('jsqr'),{PNG}=require('pngjs');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=require('../self-check/reading/reading-core.js');
const entries=JSON.parse(read('data/cards.json')).entries.filter(e=>e.skill==='cteni');
const base=process.env.LSH_QR_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const live=process.env.LSH_QR_MODE==='live';
const engines=(process.env.LSH_QR_ENGINE==='chromium'?[['Chromium',chromium]]:[['Chromium',chromium],['WebKit',webkit]]);
const variants=Object.fromEntries(entries.map(e=>[e.id,core.parseReadingData(read(e.relative))]));
const levels=['A1','A2','B1','B2','C1','C2'],langs=['en','es','de','fr'];
function decode(bytes,label){
 const png=PNG.sync.read(bytes);
 const data=new Uint8ClampedArray(png.data.buffer,png.data.byteOffset,png.data.byteLength);
 const out=jsQR(data,png.width,png.height,{inversionAttempts:'dontInvert'});
 assert.ok(out&&out.data,'QR cannot be independently decoded: '+label+' ('+png.width+'x'+png.height+')');
 return out.data;
}
for(const [engineName,engine] of engines){
 test('R56 '+engineName+': independently scan all 120 Reading TEST QRs and verify student destinations',
 {timeout:650000},async()=>{
  const browser=await engine.launch({headless:true});
  let teacher=null,student=null,preview=null;
  try{
   const context=await browser.newContext({
    viewport:{width:390,height:844},deviceScaleFactor:2,
    acceptDownloads:true,reducedMotion:'reduce'
   });
   teacher=await context.newPage();student=await context.newPage();preview=await context.newPage();
   const errors=[],writes=[];
   for(const page of [teacher,student]){
    page.on('pageerror',e=>{if(!/^ResizeObserver loop completed with undelivered notifications\.$/.test(e.message))errors.push(e.message)});
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.method()+' '+r.url())});
   }
   const setup=new URL('self-check/reading/teacher.html',base);
   setup.searchParams.set('topic',entries[0].id);
   setup.searchParams.set('lang','en');setup.searchParams.set('level','A1');
   assert.equal((await teacher.goto(setup.href,{waitUntil:'domcontentloaded',timeout:45000})).status(),200);
   await teacher.locator('#qrMount svg').waitFor({timeout:30000});
   const sessionAttempt=new URL(await teacher.locator('#studentUrl').inputValue()).searchParams.get('attempt');
   assert.match(sessionAttempt,/^class[a-z0-9]{12,30}$/);
   let checked=0,opened=0,downloads=0;
   for(const [index,entry] of entries.entries()){
    await teacher.locator('#topic').selectOption(entry.id);
    assert.equal(await teacher.locator('#topic').inputValue(),entry.id);
    for(const [languageIndex,lang] of langs.entries()){
     await teacher.locator('#language').selectOption(lang);
     for(const [levelIndex,level] of levels.entries()){
      const id=entry.id+' '+lang+'/'+level;
      // WebKit throttles input events in background tabs. A teacher configuring
      // the QR is actively viewing this panel; keep that real user condition.
      await teacher.bringToFront();
      await teacher.locator('#level').selectOption(level);
      const timer=[5,30,120][(index+languageIndex+levelIndex)%3];
      await teacher.locator('#timerMinutes').fill(String(timer));
      const link=await teacher.locator('#studentUrl').inputValue();
      const parsed=new URL(link);
      assert.equal(parsed.origin,new URL(base).origin,id);
      assert.equal(parsed.pathname,new URL('self-check/reading/index.html',base).pathname,id);
      assert.equal(parsed.searchParams.get('topic'),entry.id,id);
      assert.equal(parsed.searchParams.get('lang'),lang,id);
      assert.equal(parsed.searchParams.get('level'),level,id);
      assert.equal(parsed.searchParams.get('timer'),String(timer),id);
      assert.equal(parsed.searchParams.get('attempt'),sessionAttempt,id);
      assert.deepEqual([...parsed.searchParams.keys()].sort(),['attempt','lang','level','timer','topic']);
      assert.equal(await teacher.locator('#studentPreview').getAttribute('href'),link,id);
      assert.equal(await teacher.locator('#copyUrl').isEnabled(),true,id);
      assert.equal(await teacher.locator('#downloadQr').isEnabled(),true,id);
      assert.equal(await teacher.locator('#qrMount svg').count(),1,id);
      const qrBytes=await teacher.locator('#qrMount svg').screenshot({scale:'device',timeout:10000});
      assert.equal(decode(qrBytes,id),link,'QR payload differs from teacher URL '+id);
      checked++;
      // Local checks verify every QR actually opens the matching test. On the
      // live site, check 20 destinations and all 120 QR encodings.
      const visit=!live||(levelIndex===(index+languageIndex)%6);
      if(visit){
       const resp=await student.goto(link,{waitUntil:'domcontentloaded',timeout:45000});
       assert.equal(resp.status(),200,'Student HTTP '+id);
       await student.locator('#sessionIntro:not([hidden])').waitFor({timeout:15000});
       assert.equal(await student.locator('#title').textContent(),variants[entry.id][lang][level].title,id);
       assert.equal(await student.locator('#readingVariant').textContent(),lang.toUpperCase()+' · '+level,id);
       assert.equal(await student.locator('#questionList fieldset.question').count(),
        variants[entry.id][lang][level].questions.length,id);
       assert.equal(await student.locator('#language').count(),0,'No student variant switch '+id);
       if((level==='B2'&&lang==='en')||(level==='A1'&&lang==='es'&&index===0)){
        await student.locator('#sessionStart').click();
        await student.locator('#workspace:not([hidden])').waitFor({timeout:12000});
       }
       opened++;
      }
      if(lang==='en'&&level==='B2'){
       const downloadPromise=teacher.waitForEvent('download',{timeout:20000});
       await teacher.locator('#downloadQr').click();
       const downloaded=await downloadPromise;
       assert.equal(downloaded.suggestedFilename(),'reading-test-navrh-znamky-qr.svg');
       const svg=fs.readFileSync(await downloaded.path(),'utf8');
       assert.match(svg,/<svg\s/);assert.match(svg,/<path\s/);
       await preview.setContent('<!doctype html><html><head><style>body{margin:0}svg{width:400px;height:400px;display:block}</style></head><body>'+svg+'</body></html>');
       const printable=await preview.locator('svg').screenshot({scale:'device'});
       assert.equal(decode(printable,'downloaded '+id),link,'Downloaded SVG QR incorrect '+id);
       downloads++;
      }
     }
    }
    await teacher.setViewportSize({width:320,height:740});
    assert.ok(await teacher.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=3),'Teacher mobile overflow '+entry.id);
    await teacher.setViewportSize({width:390,height:844});
   }
   await teacher.locator('#timerMinutes').fill('4');
   assert.equal(await teacher.locator('#qrMount svg').count(),0,'Invalid 4 minute QR exposed');
   assert.equal(await teacher.locator('#downloadQr').isDisabled(),true);
   assert.equal(await teacher.locator('#copyUrl').isDisabled(),true);
   await teacher.locator('#timerMinutes').fill('121');
   assert.equal(await teacher.locator('#qrMount svg').count(),0,'Invalid 121 minute QR exposed');
   await teacher.locator('#timerMinutes').fill('30');
   await teacher.locator('#qrMount svg').waitFor();
   assert.equal(checked,120,'120 QR images independently decoded');
   assert.equal(downloads,5,'Downloaded SVG of every topic independently decoded');
   assert.equal(opened,live?20:120,'Student destinations opened');
   assert.deepEqual(writes,[],'No network writes from QR/test flow');
   assert.deepEqual(errors,[],'Unexpected browser errors '+errors.join('; '));
   console.log('PASS '+engineName+(live?' LIVE':' LOCAL')+': '+checked+' scanned QR images, '+downloads+
     ' scanned downloaded SVGs, '+opened+' loaded student tests, 5 topics / 4 languages / 6 levels');
   await context.close();
  }finally{await browser.close()}
 });
}
