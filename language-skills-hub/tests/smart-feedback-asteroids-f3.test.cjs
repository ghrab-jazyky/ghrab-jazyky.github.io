'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process'),{createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),repo=path.dirname(root),core=require('../self-check/reading/reading-core.js');
const pathName='language-skills-hub/cteni/asteroids/index.html';
const audit=JSON.parse(fs.readFileSync(path.join(root,'docs/smart-feedback-asteroids-f3/REVIEW_CHANGES.json'),'utf8'));
const latest=execFileSync('git',['show','fcfa2e4d7fb8a910d24c240e049cbf36ed86bd32:'+pathName],{cwd:repo,maxBuffer:6000000}).toString('utf8');
const current=execFileSync('git',['show','c8d3fbf855bbd387c4589b7536501b727b1e47c7:'+pathName],{cwd:repo,maxBuffer:6000000}).toString('utf8');
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

test('F4.1 exhaustive corrective ledger, no unlisted change or source drift',()=>{
 const a=JSON.parse(fs.readFileSync(path.join(root,'docs/smart-feedback-asteroids-f41/REVIEW_CHANGES.json'),'utf8'));
 assert.equal(a.baseline,'c8d3fbf855bbd387c4589b7536501b727b1e47c7');
 assert.equal(sha(current),a.oldCardSha256);assert.equal(sha(latest),a.cardSha256);
 assert.equal(createHash('sha1').update('blob '+Buffer.byteLength(latest)+'\0').update(latest).digest('hex'),a.cardBlob);
 const expected=core.parseSmartFeedback(current),data=core.parseReadingData(latest);
 assert.deepEqual(data,core.parseReadingData(current));
 assert.equal(a.changes.length,59);assert.equal(new Set(a.changes.map(e=>e.id)).size,57);
 assert.deepEqual([...new Set(a.changes.map(e=>e.group))].sort(),['D01','D02','D04','D05','D06','D07','D08','D09','D10','D11','D12','D13','D14','D15','D16','D17','D18','D19','D20','D21','D23','D24']);
 for(const e of a.changes){
  assert.deepEqual(expected.variants[e.variant].questions[e.id],e.old,e.id);
  assert.notDeepEqual(e.old,e.new,e.id);assert.equal(e.old.correctIndex,e.new.correctIndex);
  assert.deepEqual(Object.keys(e.old.distractors),Object.keys(e.new.distractors));assert.ok(e.reason.length>10);
  expected.variants[e.variant].questions[e.id]=e.new;
 }
 assert.deepEqual(expected,core.parseSmartFeedback(latest));
 for(const e of a.pending)for(const id of e.ids)assert.ok(!a.changes.some(c=>c.id===id),id+' source decision pending');
});
