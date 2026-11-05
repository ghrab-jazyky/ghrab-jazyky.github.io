/* LSH E3A – Node 22/24 tests. Run: node --test zkusebni/tests/e3a.test.cjs */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const MODEL = require('../assets/lsh/v3/model.js');
const STORE = require('../assets/lsh/v3/store.js');
const NOW = '2026-11-05T11:00:00.000Z';
const UUID = '123e4567-e89b-12d3-a456-426614174000';
const manual = (term='hola') => MODEL.normalizeWord({
  id:'manual:'+UUID, senseId:null,language:'es',term,translationCs:'ahoj'
},NOW);
const word = (senseId='bank-finance-01',translationCs='banka') =>
  MODEL.normalizeWord({language:'en',senseId,term:'bank',translationCs,
    sources:[{skill:'konverzace',topicId:'cl-umela-inteligence',savedAt:NOW}]},NOW);
test('schema: test and production databases are disjoint', () => {
  const staging=STORE.createStore({mode:'staging',indexedDB:null,BroadcastChannel:null,storage:null});
  const production=STORE.createStore({mode:'production',indexedDB:null,BroadcastChannel:null,storage:null});
  assert.equal(staging.database,'lsh-test');
  assert.equal(production.database,'lsh');
  assert.throws(()=>STORE.createStore({mode:'unknown'}));
});
test('homonyms with different senseId never merge', () => {
  assert.notEqual(word().id,word('bank-river-01').id);
});
test('same senseId retains explanations, translation and both sources', () => {
  const a=word(),b=MODEL.normalizeWord({language:'en',senseId:'bank-finance-01',term:'bank',
    explanation:'an organization that handles money',note:'student note',
    sources:[{skill:'cteni',topicId:'plastic-ocean',savedAt:NOW}]},NOW);
  const m=MODEL.mergeWords(a,b,NOW);
  assert.equal(m.translationCs,'banka');
  assert.equal(m.explanation,'an organization that handles money');
  assert.equal(m.note,'student note');
  assert.equal(m.sources.length,2);
});
test('conflicting terms with a shared senseId are refused', () => {
  const a=word(),b=MODEL.normalizeWord({language:'en',senseId:'bank-finance-01',term:'river'},NOW);
  assert.throws(()=>MODEL.mergeWords(a,b,NOW));
});
test('five box intervals and three self-ratings', () => {
  let w=word();
  assert.equal(w.dueAt,'2026-11-06T11:00:00.000Z');
  w=MODEL.reviewWord(w,'umim',NOW);
  assert.equal(w.box,2);
  assert.equal(w.dueAt,'2026-11-08T11:00:00.000Z');
  w=MODEL.reviewWord(w,'s-obtizemi',NOW);assert.equal(w.box,2);
  w=MODEL.reviewWord(w,'neumim',NOW);assert.equal(w.box,1);
});
test('no excess review history', () => {
  let w=word();
  for(let i=0;i<30;i++)w=MODEL.reviewWord(w,'umim',new Date(Date.parse(NOW)+i*60000).toISOString());
  assert.equal(w.reviews.length,20); assert.equal(w.box,5);
});
test('manual words retain a distinct ID', () => {
  assert.equal(MODEL.createManualId({randomUUID:()=>UUID}),'manual:'+UUID);
  assert.equal(manual().senseId,null);
});
test('export and import are roundtrippable, schema-gated', () => {
  const backup=MODEL.serializeExport([word(),manual()],NOW);
  const parsed=MODEL.validateImport(backup,NOW);
  assert.equal(parsed.length,2);
  assert.throws(()=>MODEL.validateImport('{"kind":"invalid","schemaVersion":1,"exportedAt":"'+NOW+'","words":[]}',NOW));
});
test('import rejects oversized and malformed data', () => {
  assert.throws(()=>MODEL.validateImport('x'.repeat(MODEL.MAX_IMPORT_BYTES+1),NOW));
  assert.throws(()=>MODEL.validateImport('not-json',NOW));
  assert.throws(()=>MODEL.validateImport(JSON.stringify({kind:'lsh-slovnicek',schemaVersion:2,exportedAt:NOW,words:[]}),NOW));
});
test('inert markup is preserved as text, never evaluated by the model', () => {
  const a=MODEL.normalizeWord({id:'manual:'+UUID,language:'en',
    term:'<img src=x onerror=alert(1)>'},NOW);
  assert.equal(a.term,'<img src=x onerror=alert(1)>');
});
test('Reading/Listening answer keys differ per variant', () => {
  assert.notEqual(MODEL.answerKey('cteni','topic','en','A2'),MODEL.answerKey('cteni','topic','en','B2'));
  assert.throws(()=>MODEL.answerKey('konverzace','topic','en','B2'));
});
test('reconciliation preserves first attempts and removes obsolete tasks', () => {
  const input=MODEL.normalizeAnswers({skill:'poslech',topicId:'test',language:'en',level:'C1',
    dataVersion:'v1',answers:{q1:{value:['1','2'],firstAttempt:['2','1'],checked:true},
      old:{value:'x',revealed:true}}},NOW);
  const next=MODEL.reconcileAnswers(input,['q1'],'v2',NOW);
  assert.deepEqual(next.snapshot.answers.q1.firstAttempt,['2','1']);
  assert.equal(next.snapshot.answers.old,undefined);
  assert.deepEqual(next.removedTaskIds,['old']);
});
test('memory fallback explicitly reports non-persistence', async () => {
  const store=STORE.createStore({mode:'staging',indexedDB:null,BroadcastChannel:null,storage:null});
  await store.open();
  assert.equal(store.status().mode,'temporary');
  const result=await store.addManualWord({language:'es',term:'hola',translationCs:'ahoj'},NOW,{randomUUID:()=>UUID});
  assert.equal(result.storedInIndexedDB,false);
  assert.equal((await store.listWords()).length,1);
});
test('bad replacement import cannot erase prior words', async () => {
  const store=STORE.createStore({mode:'staging',indexedDB:null,BroadcastChannel:null,storage:null});
  await store.saveWord(word(),NOW);
  await assert.rejects(store.importWords('{"kind":"wrong"}',{replace:true,now:NOW}));
  assert.equal((await store.listWords()).length,1);
});
test('full import and selective deletion', async () => {
  const store=STORE.createStore({mode:'staging',indexedDB:null,BroadcastChannel:null,storage:null});
  await store.saveWord(word(),NOW);
  const backup=await store.exportWords(NOW);
  const r=await store.importWords(backup,{replace:true,now:NOW});
  assert.equal(r.count,1);
  await store.deleteWord('en:bank-finance-01');
  assert.equal((await store.listWords()).length,0);
});
test('answers survive independent reads and can be reset per variant', async () => {
  const store=STORE.createStore({mode:'staging',indexedDB:null,BroadcastChannel:null,storage:null});
  await store.saveAnswers({skill:'cteni',topicId:'test',language:'en',level:'A2',dataVersion:'v1',
    answers:{q1:{value:'yes',firstAttempt:'yes'}}},NOW);
  const restored=await store.restoreAnswers('cteni','test','en','A2',['q1'],'v1',NOW);
  assert.equal(restored.snapshot.answers.q1.value,'yes');
  assert.equal(await store.getAnswers('cteni','test','en','B2'),null);
  await store.clearAnswers('cteni','test','en','A2');
  assert.equal(await store.getAnswers('cteni','test','en','A2'),null);
});
