'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process'),{webcrypto}=require('node:crypto');
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const root=path.resolve(__dirname,'..'),repo=path.dirname(root),core=require('../self-check/reading/reading-core.js'),a=require('../scripts/smart-feedback-f42-source-edits.cjs');
const p='language-skills-hub/cteni/asteroids/index.html',old=execFileSync('git',['show',a.BASE+':'+p],{cwd:repo,maxBuffer:6000000}).toString('utf8'),current=fs.readFileSync(path.join(repo,p),'utf8');
test('F4.2 all six and only six authorized source changes, exact ledger and no bank drift',async()=>{
 const audit=JSON.parse(fs.readFileSync(path.join(root,'docs/smart-feedback-asteroids-f42/REVIEW_CHANGES.json'),'utf8'));
 assert.equal(audit.baseline,a.BASE);assert.equal(audit.production,a.PRODUCTION);
 assert.equal(a.sha(old),a.PREVIOUS_SHA);assert.equal(a.blob(old),a.PREVIOUS_BLOB);
 assert.equal(a.sha(current),audit.cardSha256);assert.equal(a.blob(current),audit.cardBlob);
 assert.equal(a.stripBank(current),a.applySource(a.stripBank(old)));
 const data=core.parseReadingData(old),next=core.parseReadingData(current);
 assert.deepEqual(next,a.expectedData(core,data));
 const b=core.parseSmartFeedback(old);
 assert.equal(audit.edits.length,6);
 for(let i=0;i<6;i++){
  const e=audit.edits[i],expected=a.EDITS[i];
  for(const k of Object.keys(expected))assert.equal(e[k],expected[k]);
  const v=b.variants[e.variant];assert.deepEqual(v.questions[e.id],e.oldFeedback);assert.equal(v.sourceFingerprint,e.oldFingerprint);
  assert.equal(e.newFeedback.correctIndex,e.answer);
  assert.deepEqual(Object.keys(e.newFeedback.distractors),Object.keys(e.oldFeedback.distractors));
  v.questions[e.id]=e.newFeedback;v.sourceFingerprint=e.newFingerprint;
 }
 assert.deepEqual(core.parseSmartFeedback(current),b);
 for(const l of core.LANGUAGES)for(const level of core.LEVELS){
  const v=core.variantFromData(next,l,level),prior=core.variantFromData(data,l,level);
  await core.validateSmartFeedback(current,'rl-asteroids',l,level,v);
  for(const q of v.questions)for(let i=-1;i<q.choices.length;i++){
   const answer=i<0?{}:{[q.id]:i};
   assert.deepEqual(core.score(v,answer),a.reviseReport(core.score(prior,answer)));
  }
 }
 assert.throws(()=>a.revertSource(a.stripBank(current)+'\n'));
});
