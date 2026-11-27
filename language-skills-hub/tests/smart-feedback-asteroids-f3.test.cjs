'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),repo=path.dirname(root),core=require('../self-check/reading/reading-core.js');
const pathName='language-skills-hub/cteni/asteroids/index.html';
const audit=JSON.parse(fs.readFileSync(path.join(root,'docs/smart-feedback-asteroids-f3/REVIEW_CHANGES.json'),'utf8'));
const current=fs.readFileSync(path.join(repo,pathName),'utf8');
const before=execFileSync('git',['show',audit.baseline+':'+pathName],{cwd:repo,maxBuffer:6000000}).toString('utf8');
const sha=s=>createHash('sha256').update(s).digest('hex');
test('F3 reviewed question delta is exhaustive, ordered and bound to the exact candidate',()=>{
 assert.equal(sha(current),audit.cardSha256);
 assert.equal(createHash('sha1').update('blob '+Buffer.byteLength(current)+'\0').update(current).digest('hex'),audit.cardBlob);
 const initial=core.parseSmartFeedback(before),expected=structuredClone(initial),actual=core.parseSmartFeedback(current);
 const ids=new Set();
 for(const edit of audit.changes){
  assert.deepEqual(expected.variants[edit.variant].questions[edit.id],edit.old,edit.id+' old record');
  expected.variants[edit.variant].questions[edit.id]=edit.new;
  assert.ok(edit.reason.trim().length>10);
  ids.add(edit.id);
 }
 assert.equal(audit.changes.length,92);assert.equal(ids.size,89);
 assert.deepEqual(expected,actual);
 assert.deepEqual(initial.variants['en/B2'],actual.variants['en/B2']);
 for(const [key,bank] of Object.entries(actual.variants)){
  const [lang,level]=key.split('/'),v=core.variantFromData(core.parseReadingData(current),lang,level);
  for(const q of v.questions){
   const f=bank.questions[q.id],old=initial.variants[key].questions[q.id];
   assert.equal(f.correctIndex,old.correctIndex,q.id);
   assert.deepEqual(Object.keys(f.distractors),Object.keys(old.distractors),q.id);
   for(const e of f.evidence)assert.ok(v.paragraphs[e.p].includes(e.text),q.id);
  }
 }
});
