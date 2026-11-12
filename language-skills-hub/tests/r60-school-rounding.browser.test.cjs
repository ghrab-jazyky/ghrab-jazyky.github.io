'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const base=process.env.LSH_R60_BASE||'http://127.0.0.1:8765/language-skills-hub/';
const engines=process.env.LSH_R60_LIVE==='1'?[['Chromium',chromium]]:
 [['Chromium',chromium],['WebKit',webkit]];
const url=(file,params)=>{const u=new URL('self-check/'+file,base);
 for(const [k,v]of Object.entries(params))u.searchParams.set(k,v);
 return u.href;
};
const samples=[
 [171,200,86,2],[427,500,85,2], // 85.5 -> 86, 85.4 -> 85
 [175,200,88,1],[437,500,87,2], // 87.5 / 87.4
 [147,200,74,2],[367,500,73,3], // 73.5 / 73.4
 [117,200,59,3],[292,500,58,4], // 58.5 / 58.4
 [87,200,44,4],[217,500,43,5]   // 43.5 / 43.4
];
for(const [engineName,engine]of engines){
 test('R60 '+engineName+' Reading: 4 languages, real submission, rounded grading, CSV/PDF consistency',
 {timeout:130000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const errors=[];
   for(const lang of ['en','es','de','fr']){
    const page=await context.newPage();
    page.on('dialog',d=>d.accept());
    page.on('pageerror',e=>errors.push(lang+': '+e.message));
    const response=await page.goto(url('reading/index.html',{topic:'rl-asteroids',lang,level:'B1'}));
    assert.equal(response.status(),200,lang+' response');
    await page.locator('#workspace:not([hidden])').waitFor();
    const outcomes=await page.evaluate(data=>data.map(([earned,max])=>{
     const p=window.LSHGradeCore.proposal(earned,max);
     const receipt=window.LSHExportCore.reading({points:earned,maxPoints:max},
      {topic:'rl-asteroids',language:'en',level:'B1',submittedAt:null,interruptionCount:0});
     return [p.roundedPercent,p.grade,receipt.success_percent,receipt.grading_percent,
      receipt.proposed_grade,p.thresholdMethod];
    }),samples);
    for(let i=0;i<samples.length;i++){
     const [earned,max,rounded,grade]=samples[i];
     assert.equal(outcomes[i][0],rounded,lang+' rounded '+earned+'/'+max);
     assert.equal(outcomes[i][1],grade,lang+' grade '+earned+'/'+max);
     assert.equal(outcomes[i][3],rounded,lang+' CSV rounded '+earned+'/'+max);
     assert.equal(outcomes[i][4],grade,lang+' CSV grade '+earned+'/'+max);
     assert.equal(outcomes[i][5],'ROUND_HALF_UP_WHOLE_PERCENT_BEFORE_BANDS');
    }
    const demonstration=await page.evaluate(()=>{
     const p=window.LSHGradeCore.proposal(175,200);
     const report={skill:'reading',topic:'Asteroids',language:'en',level:'B1',
      summary:{earned:p.earned,max:p.max,percent:p.displayedPercent,
       roundedPercent:p.roundedPercent,grade:p.grade},
      questions:[{question:'Example',correct:false,awarded:0,
       studentAnswer:'A',correctAnswer:'B'}]};
     return window.LSHPdfReport.fullText(report);
    });
    assert.match(demonstration,/Uspesnost: 87\.5 %/);
    assert.match(demonstration,/Pro znamku matematicky zaokrouhleno na: 88 %/);
    assert.match(demonstration,/Navrh znamky: 1/);
    await page.locator('fieldset.question:visible').first().locator('input[type=radio]').first().check();
    await page.locator('#submitButton').click();
    await page.locator('#results:not([hidden])').waitFor();
    const gradeText=await page.locator('#gradeProposal').textContent();
    assert.match(gradeText,/\d+(?:\.\d+)? % → \d+ %/,lang+' transparent rounding');
    assert.match(gradeText,/[1-5]/);
    assert.equal(await page.locator('#submitButton').isDisabled(),true);
    await page.close();
   }
   assert.deepEqual(errors,[]);
   await context.close();
  }finally{await browser.close();}
 });
 test('R60 '+engineName+' Listening: actual student submission shows standard whole-percent rounding',
 {timeout:65000},async()=>{
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('dialog',d=>d.accept());
   const response=await page.goto(url('listening/student.html',{topic:'ll-harrison-ford',level:'B2'}));
   assert.equal(response.status(),200);
   await page.locator('#workspace:not([hidden])').waitFor();
   assert.equal(await page.locator('#gradeProposal .grade-number').count(),0);
   await page.locator('fieldset.question').first().locator('input').first().check();
   await page.locator('#submitButton').click();
   await page.locator('#results:not([hidden])').waitFor();
   const value=await page.locator('#gradeProposal').textContent();
   assert.match(value,/after standard rounding \(0\.5 rounds up\)/);
   assert.match(value,/\d+\.\d{2} % → \d+ %/);
   assert.match((await page.locator('#gradeProposal .grade-number').textContent()).trim(),/^[1-5]$/);
   assert.equal(await page.locator('#submitButton').isDisabled(),true);
   assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 });
}
