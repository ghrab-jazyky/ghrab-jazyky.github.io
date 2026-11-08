/* Listening R7 isolated candidate browser regression.
 * Browser uses local HTTP, no source or teacher-key changes, no media playback.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const work=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP||os.tmpdir(),'lsh-r7-ui-browser-'));
const generator=path.join(root,'tools/listening-r7-three-phase-candidates.cjs');
execFileSync(process.execPath,[generator,work],{encoding:'utf8',timeout:60000});
const manifest=JSON.parse(fs.readFileSync(path.join(work,'LISTENING_R7_UI_MANIFEST.json'),'utf8'));
assert.equal(manifest.cards.length,2);
const cases=[
 {id:'ll-harrison-ford',file:manifest.cards.find(x=>x.id==='ll-harrison-ford').candidate},
 {id:'ll-peaky-no-fighting',file:manifest.cards.find(x=>x.id==='ll-peaky-no-fighting').candidate}
];
let server,base;
test.before(async()=>{
 server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\/+/,'');
  if(!cases.some(x=>x.file===name)){res.writeHead(404);res.end();return;}
  fs.readFile(path.join(work,name),(error,body)=>{
   if(error){res.writeHead(404);res.end();return;}
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store',
      'Content-Security-Policy':"default-src 'self' 'unsafe-inline' data:; connect-src 'none'; frame-src 'none'"});
   res.end(body);
  });
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 base='http://127.0.0.1:'+server.address().port;
});
test.after(async()=>{if(server)await new Promise(r=>server.close(r));fs.rmSync(work,{recursive:true,force:true});});
for(const [engine,name] of [[chromium,'Chromium'],[webkit,'WebKit']]){
 for(const viewport of [{width:1366,height:850},{width:390,height:844}]){
  for(const c of cases){
   test(name+' '+viewport.width+'px '+c.id+': stages independent, scores safe, no JS exceptions',async()=>{
    const browser=await engine.launch({headless:true});
    try{
     const context=await browser.newContext({viewport,serviceWorkers:'block'});
     const page=await context.newPage(),errors=[];
     page.on('pageerror',error=>errors.push(String(error)));
     await page.goto(base+'/'+c.file,{waitUntil:'domcontentloaded',timeout:25000});
     await page.locator('#gistTasks .task').first().waitFor({timeout:15000});
     const notice=page.locator('#r7MediaSafetyNotice');
     assert.equal(await notice.count(),1,'Every unpublished Listening candidate needs a visible media/content notice');
     assert.equal(await notice.isVisible(),true);
     const noticeText=await notice.innerText();
     if(c.id==='ll-peaky-no-fighting'){
      assert.match(noticeText,/strong profanity/i);
      assert.match(noticeText,/drugs/i);
      assert.match(noticeText,/younger classes/i);
     }else{
      assert.match(noticeText,/external video/i);
      assert.match(noticeText,/school network/i);
     }
     const sectionIds=await page.locator('main > section').evaluateAll(els=>els.map(e=>e.id));
     for(const id of ['gist','detail','evidence','language']){
      assert.ok(sectionIds.includes(id),'missing section '+id);
     }
     assert.ok(sectionIds.indexOf('detail')<sectionIds.indexOf('evidence'));
     assert.ok(sectionIds.indexOf('evidence')<sectionIds.indexOf('language'));
     const navOrder=await page.locator('.sidenav a[href^="#"]').evaluateAll(els=>els.map(el=>el.getAttribute('href')));
     for(const anchor of ['#gist','#detail','#evidence','#language','#thinking','#finish']){
      assert.ok(navOrder.includes(anchor),'Missing stage navigation '+anchor);
     }
     assert.ok(navOrder.indexOf('#detail')<navOrder.indexOf('#evidence'));
     assert.ok(navOrder.indexOf('#evidence')<navOrder.indexOf('#language'));
     assert.match(await page.locator('.sidenav').innerText(),/Completed core tasks/);
     assert.match(await page.locator('.sidenav a[href="#evidence"]').innerText(),/Third Listening/);
     assert.equal(await page.locator('#firstReview').innerText(),'Not checked yet.');
     assert.equal(await page.locator('#secondReview').innerText(),'Not checked yet.');
     assert.equal(await page.locator('#thirdReview').innerText(),'Not checked yet.');
     const max=await page.evaluate(()=>DATA[current].gist.length+DATA[current].detail.length+DATA[current].sequence.length);
     const initial=await page.locator('#scoreNumber').innerText();
     assert.ok(initial.includes('/ '+max),'Initial score denominator should exclude optional vocabulary: '+initial);
     await page.locator('#checkFirstBtn').click();
     assert.match(await page.locator('#firstReview').innerText(),/correct|answered/i);
     assert.equal(await page.locator('#secondReview').innerText(),'Not checked yet.');
     assert.equal(await page.locator('#thirdReview').innerText(),'Not checked yet.');
     await page.locator('#checkSecondBtn').click();
     assert.match(await page.locator('#secondReview').innerText(),/correct|answered/i);
     assert.equal(await page.locator('#thirdReview').innerText(),'Not checked yet.');
     await page.locator('#checkThirdBtn').click();
     assert.match(await page.locator('#thirdReview').innerText(),/teacher review/i);
     const afterThree=await page.locator('#scoreNumber').innerText();
     assert.ok(afterThree.includes('/ '+max),afterThree);
     assert.match(await page.locator('#scoreDescription').innerText(),/all three/i);
     await page.locator('#checkVocabBtn').click();
     assert.equal(await page.locator('#scoreNumber').innerText(),afterThree,'Optional vocabulary changed the core score');
     await page.locator('#checkBtn').click();
     assert.match(await page.locator('#scoreDescription').innerText(),/all three/i);
     await page.locator('#gistTasks .option').first().click();
     assert.equal(await page.locator('#firstReview').innerText(),'Not checked yet.','Edits must invalidate old review');
     assert.equal(await page.locator('#thirdReview').innerText(),'Not checked yet.','Stale third-stage result must be invalidated');
     const x=await page.evaluate(()=>({screen:innerWidth,scroll:document.documentElement.scrollWidth,hasTeacherApproval:!!window.teacherApproval}));
     assert.ok(x.scroll<=x.screen+8,'Horizontal overflow '+JSON.stringify(x));
     assert.deepEqual(errors,[],'JS exceptions: '+errors.join('; '));
     // Repeat the essential UI contract for every available CEFR variant.
     for(const level of ['A1','A2','B1','B2','C1','C2']){
      await page.locator('.level-pill[data-level="'+level+'"]').click();
      assert.equal(await page.locator('#heroLevel').innerText(),level);
      const expected=await page.evaluate(()=>DATA[current].gist.length+DATA[current].detail.length+DATA[current].sequence.length);
      assert.ok((await page.locator('#scoreNumber').innerText()).includes('/ '+expected),'Wrong core total for '+level);
      assert.ok((await page.locator('#progressLabel').innerText()).includes('/ '+expected),'Wrong progress total for '+level);
      assert.equal(await page.locator('#firstReview').innerText(),'Not checked yet.','Old phase feedback leaked to '+level);
      assert.equal(await page.locator('#secondReview').innerText(),'Not checked yet.','Old phase feedback leaked to '+level);
      assert.equal(await page.locator('#thirdReview').innerText(),'Not checked yet.','Old phase feedback leaked to '+level);
      if(c.id==='ll-peaky-no-fighting'&&level==='C1'){
       const source=await page.evaluate(()=>({
        prompt:DATA.C1.gist[1].title,correct:DATA.C1.gist[1].correct,
        label:DATA.C1.gist[1].options[0]
       }));
       assert.equal(source.prompt,'What is the overall dramatic effect of the interruptions?');
       assert.equal(source.correct,0,'Peaky C1 gist must reject unsupported disobedience inference');
       assert.match(source.label,/puncture his attempt/);
       const options=page.locator('#gistTasks .task').nth(1).locator('.option');
       assert.equal(await options.count(),3);
       await options.nth(0).click();
       await page.locator('#checkFirstBtn').click();
       assert.match(await page.locator('#firstReview').innerText(),/^1\/\d+ correct/,
        'Actual C1 first option must be graded correct');
       await options.nth(1).click();
       await page.locator('#checkFirstBtn').click();
       assert.match(await page.locator('#firstReview').innerText(),/^0\/\d+ correct/,
        'Unsupported disobedience option must be graded incorrect');
      }
      const width=await page.evaluate(()=>({screen:innerWidth,scroll:document.documentElement.scrollWidth}));
      assert.ok(width.scroll<=width.screen+8,'Overflow '+level+': '+JSON.stringify(width));
     }
     if(c.id==='ll-peaky-no-fighting'){
      // A previously reviewed variant retains its own result, but this must
      // never bleed into another level's phase-feedback text.
      await page.locator('.level-pill[data-level="C1"]').click();
      assert.match(await page.locator('#firstReview').innerText(),/^0\/\d+ correct/,
       'C1 phase result should be restored for the same level');
      await page.locator('.level-pill[data-level="A1"]').click();
      assert.equal(await page.locator('#firstReview').innerText(),'Not checked yet.',
       'C1 review must never appear on unreviewed A1');
      assert.equal(await page.locator('#secondReview').innerText(),'Not checked yet.');
      assert.equal(await page.locator('#thirdReview').innerText(),'Not checked yet.');
     }
     await context.close();
    }finally{await browser.close();}
   });
  }
 }
}
