#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,webkit}=require('playwright');
const base='http://127.0.0.1:8765/language-skills-hub/';
const makeUrl=(relative,params)=>{const u=new URL(relative,base);for(const [k,v]of Object.entries(params))u.searchParams.set(k,v);return u.href;};

async function allowCopy(page){
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,
  value:{writeText:async text=>{window.__r48Copy=text}}}));
}
async function copiedReport(page){
 await allowCopy(page);
 await page.locator('#exportCopy').click();
 await page.waitForFunction(()=>typeof window.__r48Copy==='string');
 return page.evaluate(()=>window.__r48Copy);
}
async function checkPdf(page,skill){
 const dlPromise=page.waitForEvent('download',{timeout:30000});
 await page.locator('#exportPdf').click();
 const dl=await dlPromise,bytes=fs.readFileSync(await dl.path());
 assert.match(dl.suggestedFilename(),new RegExp('^lsh-'+skill+'-.*\\.pdf$'));
 assert.ok(bytes.length>10000,'Full archive PDF should not be empty');
 assert.equal(bytes.subarray(0,8).toString('ascii'),'%PDF-1.4');
 assert.match(bytes.subarray(-160).toString('latin1'),/%%EOF/);
}
async function checkLayout(page){
 for(const width of [390,1280]){
  await page.setViewportSize({width,height:880});
  const layout=await page.evaluate(()=>{
   const pairs=[...document.querySelectorAll('#resultDetails .feedback-compare')];
   const errors=[];
   for(const pair of pairs){
    const entries=pair.querySelectorAll('.feedback-answer');
    if(entries.length!==2){errors.push('comparison does not have two answers');continue;}
    const a=pair.getBoundingClientRect();
    for(const entry of entries){
     const b=entry.getBoundingClientRect();
     if(b.left<a.left-2||b.right>a.right+2)errors.push('response escapes its card');
    }
   }
   return {pairs:pairs.length,overflow:document.documentElement.scrollWidth-innerWidth,
    columns:pairs.length?getComputedStyle(pairs[0]).gridTemplateColumns.split(' ').length:0,errors};
  });
  assert.ok(layout.pairs>0,'No mistake comparisons');
  assert.ok(layout.overflow<=2,'Horizontal overflow '+width+'px');
  assert.equal(layout.columns,width===390?1:2,'Responsive comparison '+width+'px');
  assert.deepEqual(layout.errors,[]);
 }
}
for(const [name,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 for(const spec of [{topic:'rl-asteroids',lang:'en',level:'B1'},
  {topic:'rl-can-mistakes',lang:'es',level:'B2'}]){
  test('R48 '+name+' Reading '+spec.lang+'/'+spec.level+
    ': show one wrong and one blank answer; archive all questions',{timeout:150000},async()=>{
   const browser=await engine.launch({headless:true});
   try{
    const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
    assert.equal((await page.goto(makeUrl('self-check/reading/index.html',spec))).status(),200);
    await page.locator('#workspace:not([hidden])').waitFor();
    const questions=await page.evaluate(async({topic,lang,level})=>{
     const entries=(await (await fetch('../../data/cards.json')).json()).entries;
     const source=entries.find(x=>x.id===topic).relative;
     const html=await (await fetch('../../'+source)).text();
     return window.LSHReadingCore.variantFromData(
      window.LSHReadingCore.parseReadingData(html),lang,level).questions;
    },spec);
    assert.equal(await page.locator('#resultDetails article.review').count(),0,
     'No corrections before submission');
    assert.equal(await page.locator('#results').isHidden(),true);
    for(let i=0;i<questions.length;i++){
     if(i===1)continue; // unanswered should be reviewed as a mistake
     const q=questions[i],choice=i===0?(q.answer+1)%q.choices.length:q.answer;
     await page.locator('fieldset.question').nth(i).locator('input[type=radio]').nth(choice).check();
    }
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    const cards=page.locator('#resultDetails article.review');
    assert.equal(await cards.count(),2,'Only wrong and unanswered Reading questions');
    assert.equal(await page.locator('#resultDetails .feedback-answer.submitted').count(),2);
    assert.equal(await page.locator('#resultDetails .feedback-answer.expected').count(),2);
    assert.equal((await cards.nth(0).locator('.feedback-answer.submitted dd').textContent()).trim(),
     questions[0].choices[(questions[0].answer+1)%questions[0].choices.length]);
    assert.equal((await cards.nth(0).locator('.feedback-answer.expected dd').textContent()).trim(),
     questions[0].choices[questions[0].answer]);
    assert.equal((await cards.nth(1).locator('.feedback-answer.expected dd').textContent()).trim(),
     questions[1].choices[questions[1].answer]);
    for(const c of [cards.nth(0),cards.nth(1)])
     assert.ok((await c.locator('.feedback-explanation').textContent()).trim().length>15);
    await checkLayout(page);
    const copy=await copiedReport(page);
    assert.equal((copy.match(/^Odpoved studenta:/gm)||[]).length,questions.length,
     'Teacher copy must include all correct, wrong and unanswered Reading tasks');
    assert.match(copy,/Vysvetleni:/);
    assert.match(copy,/SPRAVNE/);
    assert.match(copy,/CHYBNE/);
    assert.ok(copy.includes(questions[2].q),'Teacher copy missing a correct question');
    await checkPdf(page,'reading');
    assert.deepEqual(errors,[]);
   }finally{await browser.close();}
  });
 }
 test('R48 '+name+' Listening: hide correct items, compare wrong/blank including sequence and cloze; teacher archive complete',
  {timeout:150000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   const topic='ll-harrison-ford',level='B2';
   assert.equal((await page.goto(makeUrl('self-check/listening/student.html',{topic,level}))).status(),200);
   await page.locator('#workspace:not([hidden])').waitFor();
   const {v,bank}=await page.evaluate(async()=>{
    const catalog=await (await fetch('../../data/cards.json')).json();
    const entry=catalog.entries.find(x=>x.id==='ll-harrison-ford');
    const html=await (await fetch('../../'+entry.relative)).text();
    const v=window.LSHListeningCore.variant(window.LSHListeningCore.extractJson(html,'DATA'),'B2');
    return {v,bank:window.LSHListeningCore.cloze(v,'ll-harrison-ford','B2')};
   });
   assert.equal(await page.locator('#results').isHidden(),true);
   for(const [part,offset]of [['gist',0],['detail',v.gist.length]]){
    for(let i=0;i<v[part].length;i++){
     const q=v[part][i],field=page.locator('fieldset.question').nth(offset+i);
     if(part==='detail'&&i===0)continue; // one genuinely missing answer
     if(q.type==='single'){
      const choice=part==='gist'&&i===0?(q.correct+1)%q.options.length:q.correct;
      await field.locator('input').nth(choice).check();
     }else{
      let picked=q.correct;
      if(part==='gist'&&i===0){
       const bad=q.options.findIndex((_,j)=>!q.correct.includes(j));
       picked=bad>=0?[bad]:[]; // keep deliberately incorrect
      }
      for(const index of picked)await field.locator('input').nth(index).check();
     }
    }
   }
   for(let i=0;i<v.sequence.length;i++){
    const select=page.locator('#seq-'+i);
    const options=await select.locator('option').evaluateAll(opts=>opts.map(o=>({value:o.value,text:o.textContent})));
    const found=options.find(o=>o.text.endsWith(' — '+v.sequence[i]));
    assert.ok(found,'Missing sequence option');await select.selectOption(found.value);
   }
   for(let i=0;i<bank.length;i++)if(i===0){
    await page.locator('#cloze-'+i).fill('definitely-not-the-answer');
   }else if(i>1){
    await page.locator('#cloze-'+i).fill(bank[i].accepted[0]);
   } // cloze 1 left blank
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   const cards=page.locator('#resultDetails article.review');
   assert.equal(await cards.count(),4,'Exactly gist wrong, detail blank, cloze wrong, cloze blank');
   assert.equal(await page.locator('#resultDetails .feedback-answer.expected').count(),4);
   assert.match(await cards.first().locator('.feedback-explanation').textContent(),/.{8,}/);
   assert.equal(await page.locator('#resultDetails .feedback-answer.submitted dd').count(),4);
   assert.ok((await page.locator('#resultDetails').textContent()).includes('Correct answer'));
   assert.ok((await page.locator('#resultDetails').textContent()).includes('Not answered'));
   assert.ok((await page.locator('#resultDetails').textContent()).includes(bank[0].correctAnswer));
   await checkLayout(page);
   const expectedTotal=v.gist.length+v.detail.length+v.sequence.length+bank.length;
   const copy=await copiedReport(page);
   assert.equal((copy.match(/^Odpoved studenta:/gm)||[]).length,expectedTotal,
    'Full teacher export must include every Listening item, not just mistakes');
   assert.match(copy,/SPRAVNE/);assert.match(copy,/CHYBNE/);
   assert.match(copy,/Vysvetleni:/,'Author-written explanations retained');
   await checkPdf(page,'listening');
   assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 });
}
