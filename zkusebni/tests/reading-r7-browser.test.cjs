/* R7 Reading: browser QA of isolated, unpublished two-card HTML candidates.
 * Checks actual corrected matching evidence, UI interactions, all 24 CEFR/language
 * combinations per card and engine, mobile width, and absence of external traffic.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {execFileSync}=require('node:child_process');
const {chromium,webkit}=require('playwright');
const root=path.resolve(__dirname,'..');
const work=fs.mkdtempSync(path.join(process.env.RUNNER_TEMP||os.tmpdir(),'lsh-r7-reading-browser-'));
execFileSync(process.execPath,[path.join(root,'tools/reading-r7-candidates.cjs'),work],{timeout:120000});
const manifest=JSON.parse(fs.readFileSync(path.join(work,'R7_CANDIDATES_MANIFEST.json'),'utf8'));
assert.equal(manifest.cards.length,2);
assert.equal(manifest.teacherApproval,false);
assert.equal(manifest.approvedForRelease,false);
const cards=manifest.cards.map(c=>({id:c.topicId,file:c.candidateFile,patch:c.repairedQuestions[0]}));
assert.equal(cards.reduce((n,c)=>n+manifest.cards.find(x=>x.topicId===c.id).repairedQuestions.length,0),16);
const counts={A1:9,A2:9,B1:12,B2:18,C1:21,C2:21};
const langs=['en','es','de','fr'],levels=Object.keys(counts);
let server,origin;
test.before(async()=>{
 server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\/+/,'');
  if(!cards.some(c=>c.file===name)){res.writeHead(404);res.end();return}
  fs.readFile(path.join(work,name),(error,body)=>{
   if(error){res.writeHead(404);res.end();return}
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8',
    'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(body);
  });
 });
 await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
 origin='http://127.0.0.1:'+server.address().port;
});
test.after(async()=>{
 if(server)await new Promise(resolve=>server.close(resolve));
 fs.rmSync(work,{recursive:true,force:true});
});
for(const [engine,engineName] of [[chromium,'Chromium'],[webkit,'WebKit']]){
 for(const viewport of [{width:1366,height:850},{width:390,height:844}]){
  for(const card of cards){
   test(engineName+' '+viewport.width+'px '+card.id+' R7 matching, 24 variants, privacy', {timeout:180000},async()=>{
    const browser=await engine.launch({headless:true});
    try{
     const context=await browser.newContext({viewport,serviceWorkers:'block'});
     const page=await context.newPage();
     page.setDefaultTimeout(25000);
     const errors=[],outside=[];
     page.on('pageerror',e=>errors.push(String(e)));
     page.on('request',r=>{if(!r.url().startsWith(origin+'/'))outside.push(r.url())});
     const patch=card.patch;
     assert.ok(patch&&langs.includes(patch.language)&&levels.includes(patch.level));
     const response=await page.goto(origin+'/'+card.file+'?lang='+patch.language+'&level='+patch.level,
      {waitUntil:'domcontentloaded',timeout:40000});
     assert.ok(response&&response.ok(),'Reading candidate must load by direct URL');
     await page.locator('#skillTabs button').first().waitFor();
     assert.equal(await page.locator('#language').inputValue(),patch.language);
     assert.equal(await page.locator('#levelMeta').innerText(),patch.level);
     assert.equal(await page.locator('#dictionaryToggle').getAttribute('aria-pressed'),'false');
     const amended=await page.evaluate(questionId=>{
      const d=DATA[state.language][state.level],q=d.questions.find(x=>x.id===questionId);
      return {question:q&&{id:q.id,tab:q.tab,answer:q.answer,evidence:q.evidence},
       matches:d.questions.filter(x=>x.kind==='match').map(x=>x.answer)};
     },patch.questionId);
     assert.ok(amended.question&&amended.question.evidence.length>0,'Missing repaired question/evidence');
     assert.equal(amended.question.answer,2,'Repaired question must point to paragraph 3');
     assert.equal(new Set(amended.matches).size,3,'Three matching prompts must target distinct paragraphs');
     await page.locator('#skillTabs button[data-skill="'+amended.question.tab+'"]').click();
     const selector='#questions .qcard[data-question="'+amended.question.id+'"]';
     await page.locator(selector+' input[type="radio"][value="2"]').check();
     await page.locator('#check').click();
     await page.locator(selector+' .verdict.good').waitFor({state:'visible'});
     await page.locator(selector+' button[data-evidence="'+amended.question.id+'"]').click();
     assert.ok(await page.locator('#readingBody .evidence-hit').count()>0,
      'Corrected evidence must be visibly highlighted in the text');
     await page.locator(selector+' input[type="radio"][value="1"]').check();
     assert.equal(await page.locator(selector+' .verdict:not([hidden])').count(),0,
      'Old grading must be cleared after editing an answer');
     assert.equal(await page.locator('#readingBody .evidence-hit').count(),0,
      'Previous evidence highlight must be invalidated');
     await page.locator('#dictionaryToggle').click();
     assert.equal(await page.locator('#dictionaryToggle').getAttribute('aria-pressed'),'true');
     await page.locator('#dictionaryToggle').click();
     assert.equal(await page.locator('#dictionaryToggle').getAttribute('aria-pressed'),'false');
     let visited=0;
     for(const lang of langs){
      await page.locator('#language').selectOption(lang);
      for(const level of levels){
       await page.locator('#levels button[data-level="'+level+'"]').click();
       const view=await page.evaluate(()=>({
        lang:state.language,level:state.level,questionCount:questions().length,
        uiCount:document.querySelectorAll('#skillTabs button').length,
        tabCount:tabs().length,paragraphs:document.querySelectorAll('#readingBody p').length,
        expectedParagraphs:curr().paragraphs.length,
        screen:innerWidth,scroll:document.documentElement.scrollWidth
       }));
       assert.equal(view.lang,lang,'Language did not switch');
       assert.equal(view.level,level,'CEFR level did not switch');
       assert.equal(view.questionCount,counts[level],lang+' '+level+' question count');
       assert.equal(view.uiCount,view.tabCount,'Visible strategy tabs mismatch');
       assert.equal(view.paragraphs,view.expectedParagraphs,'Reading paragraphs not rendered');
       assert.ok(view.scroll<=view.screen+8,'Horizontal overflow '+JSON.stringify(view));
       visited++;
      }
     }
     assert.equal(visited,24);
     // The original R7 browser test exercised only the FIRST proposal in each
     // card. Verify all 16 repairs through actual controls, verdict, supporting
     // passage highlighting, and stale-feedback invalidation in both engines.
     const repaired=manifest.cards.find(c=>c.topicId===card.id).repairedQuestions;
     let checkedRepairs=0;
     for(const patch of repaired){
      await page.locator('#language').selectOption(patch.language);
      await page.locator('#levels button[data-level="'+patch.level+'"]').click();
      const details=await page.evaluate(id=>{
       const d=DATA[state.language][state.level],q=d.questions.find(x=>x.id===id);
       return q&&{id:q.id,tab:q.tab,kind:q.kind,answer:q.answer,evidence:q.evidence};
      },patch.questionId);
      assert.ok(details,'R7 missing repaired item '+card.id+'/'+patch.questionId);
      assert.equal(details.kind,'match','R7 repair changed exercise kind');
      assert.equal(details.answer,2,'R7 repaired answer no longer targets third paragraph');
      assert.ok(details.evidence.length&&details.evidence[0].p===2,'R7 evidence paragraph missing');
      const clarified=new Set(['en-c2-matching-2','en-b2-matching-3',
       'es-b2-matching-3','de-b2-matching-3','fr-b2-matching-3']).has(patch.questionId);
      assert.equal(details.evidence.length,clarified?2:1,
       'R13 matching item must highlight all semantic premises: '+patch.questionId);
      if(clarified)assert.ok(details.evidence.every(ev=>ev.p===2&&ev.text.length>=25));
      await page.locator('#skillTabs button[data-skill="'+details.tab+'"]').click();
      const box='#questions .qcard[data-question="'+patch.questionId+'"]';
      await page.locator(box+' input[type="radio"][value="2"]').check();
      await page.locator('#check').click();
      await page.locator(box+' .verdict.good').waitFor({state:'visible'});
      await page.locator(box+' button[data-evidence="'+patch.questionId+'"]').click();
      const marked=await page.locator('#readingBody .evidence-hit').allTextContents();
      assert.ok(marked.length>0,'R7 repaired evidence must visibly highlight '+patch.questionId);
      assert.ok(marked.join('').includes(details.evidence[0].text),
       'R7 evidence highlighted the wrong passage '+patch.questionId);
      if(clarified){
       for(const ev of details.evidence)assert.ok(marked.join('').includes(ev.text),
        'R13 compound matching question did not visibly highlight both premises '+patch.questionId);
      }
      await page.locator(box+' input[type="radio"][value="1"]').check();
      assert.equal(await page.locator(box+' .verdict:not([hidden])').count(),0,
       'R7 stale grading feedback not cleared '+patch.questionId);
      assert.equal(await page.locator('#readingBody .evidence-hit').count(),0,
       'R7 stale evidence highlight not cleared '+patch.questionId);
      checkedRepairs++;
     }
     assert.equal(checkedRepairs,card.id==='rl-email-friend'?4:12);
     // Seventeenth change: meaningful de/B2 explanation, without modifying
     // the original historical source or distributing a separate answer key.
     if(card.id==='rl-email-friend'){
      await page.locator('#language').selectOption('de');
      await page.locator('#levels button[data-level="B2"]').click();
      const extra=await page.evaluate(()=>{
       const q=DATA.de.B2.questions.find(x=>x.id==='de-b2-matching-2');
       return {tab:q.tab,answer:q.answer,explanation:q.explanation};
      });
      assert.match(extra.explanation,/Im letzten Absatz bietet Lena/);
      await page.locator('#skillTabs button[data-skill="'+extra.tab+'"]').click();
      const sel='#questions .qcard[data-question="de-b2-matching-2"]';
      await page.locator(sel+' input[type="radio"][value="'+extra.answer+'"]').check();
      await page.locator('#check').click();
      assert.ok((await page.locator(sel+' .verdict.good').innerText()).includes(extra.explanation),
       'R7 de/B2 strengthened explanation must be visible after grading');
     }
     assert.deepEqual(outside,[],'Unexpected external network requests');
     assert.deepEqual(errors,[],'JavaScript runtime errors');
     await context.close();
    }finally{await browser.close()}
   });
  }
 }
}
