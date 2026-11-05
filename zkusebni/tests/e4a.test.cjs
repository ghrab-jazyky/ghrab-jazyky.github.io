/* LSH E4A contract and memory-fallback regression: node --test zkusebni/tests/e4a.test.cjs */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const BRIDGE=require('../assets/lsh/v4/reading-bridge.js');
const STORE=require('../assets/lsh/v3/store.js');
const NOW_LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const variants=(tasks=['q1','q2'])=>Object.fromEntries(NOW_LANGS.flatMap(l=>LEVELS.map(v=>[l+':'+v,tasks.slice()])));
const makeStore=()=>STORE.createStore({mode:'staging',indexedDB:null,BroadcastChannel:null,storage:null});
const opts=(store=makeStore(),patch={})=>({
  mode:'staging',experimentalLegacyAdapter:true,topicId:'rl-e4a-synthetic',dataVersion:'qa-v1',variants:variants(),store,...patch
});
const maker=(store=makeStore(),patch={})=>BRIDGE.createBridge(opts(store,patch));
const identity={language:'en',level:'B2'};
test('Contract strictly requires 24 CEFR/language variants',()=>{
 assert.equal(BRIDGE.readingLabV34Compatible,false);
 assert.throws(()=>BRIDGE.createBridge({...opts(),experimentalLegacyAdapter:false}),/INCOMPATIBLE/);
 const c=BRIDGE.validateContract(opts());
 assert.equal(Object.keys(c.variants).length,24);
 assert.deepEqual(c.variants['es:C1'],['q1','q2']);
 assert.throws(()=>BRIDGE.validateContract({...opts(),variants:{'en:A1':['q1']}}),/24/);
 assert.throws(()=>BRIDGE.validateContract({...opts(),variants:variants(['q1','q1'])}),/Duplicate/);
 assert.throws(()=>BRIDGE.validateContract({...opts(),topicId:'../escape'}),/topic ID/);
 assert.throws(()=>BRIDGE.validateContract({...opts(),mode:'production'}),/staging/);
});
test('Student bridge explicitly refuses teacher keys and solutions',()=>{
 for(const key of ['teacherKey','teacherKeyUrl','answerKey','correctAnswers','teacherAnswers']){
  assert.throws(()=>BRIDGE.validateContract({...opts(),[key]:'secret'}),/Teacher solutions/);
 }
});
test('Snapshot save uses Reading namespace and warns on temporary-only storage',async()=>{
 const b=maker();
 const r=await b.saveAnswers({...identity,answers:{q1:{value:'B',checked:true,correct:false}}});
 assert.equal(r.storedInIndexedDB,false);
 assert.match(r.warning,/dočasná/);
 assert.equal(r.snapshot.id,'cteni:rl-e4a-synthetic:en:B2');
 assert.equal(r.snapshot.answers.q1.firstAttempt,'B');
 const restored=await b.restoreAnswers(identity);
 assert.equal(restored.requiresReview,false);
 assert.equal(restored.snapshot.answers.q1.firstAttempt,'B');
 b.close();
});
test('Updates preserve original first attempt and other saved tasks',async()=>{
 const b=maker();
 await b.saveAnswers({...identity,answers:{q1:{value:'B',checked:true},q2:{value:'first'}}});
 await b.saveAnswers({...identity,answers:{q1:{value:'C',checked:true,firstAttempt:'C'}},activePart:'detail'});
 const result=await b.restoreAnswers(identity);
 assert.equal(result.snapshot.answers.q1.value,'C');
 assert.equal(result.snapshot.answers.q1.firstAttempt,'B');
 assert.equal(result.snapshot.answers.q2.value,'first');
 assert.equal(result.snapshot.activePart,'detail');
});
test('Wrong task, unsupported language, or malformed answer fails without erasing data',async()=>{
 const b=maker();
 await b.saveAnswers({...identity,answers:{q1:{value:'B'}}});
 await assert.rejects(b.saveAnswers({...identity,answers:{hacker:{value:'A'}}}),/unknown/);
 await assert.rejects(b.saveAnswers({language:'xx',level:'B2',answers:{q1:{value:'A'}}}),/language or level/);
 await assert.rejects(b.saveAnswers({...identity,answers:{q1:{value:()=>42}}}),/answer value/);
 const restored=await b.restoreAnswers(identity);
 assert.equal(restored.snapshot.answers.q1.value,'B');
});
test('v3.4: first attempt is fixed at first CHECK, not while typing or saving',async()=>{
 const b=maker();
 await b.saveAnswers({...identity,answers:{q1:{value:'draft'}}});
 let a=await b.restoreAnswers(identity);
 assert.equal(a.snapshot.answers.q1.firstAttempt,null);
 await b.saveAnswers({...identity,answers:{q1:{value:'final-before-check'}}});
 a=await b.restoreAnswers(identity);
 assert.equal(a.snapshot.answers.q1.firstAttempt,null);
 await b.saveAnswers({...identity,answers:{q1:{value:'first-checked',checked:true}}});
 a=await b.restoreAnswers(identity);
 assert.equal(a.snapshot.answers.q1.firstAttempt,'first-checked');
 await b.saveAnswers({...identity,answers:{q1:{value:'changed',checked:true,firstAttempt:'forged'}}});
 a=await b.restoreAnswers(identity);
 assert.equal(a.snapshot.answers.q1.firstAttempt,'first-checked');
 await b.saveAnswers({...identity,answers:{q1:{value:null,checked:false}}});
 a=await b.restoreAnswers(identity);
 assert.equal(a.snapshot.answers.q1.firstAttempt,'first-checked');
});
test('v3.4: no firstAttempt injection on un-checked student input',async()=>{
 const b=maker();
 await b.saveAnswers({...identity,answers:{q1:{value:'draft',firstAttempt:'forged',checked:false}}});
 const a=await b.restoreAnswers(identity);
 assert.equal(a.snapshot.answers.q1.firstAttempt,null);
});

test('Variant and topic separation: saved answers never leak across variants',async()=>{
 const store=makeStore(),b=maker(store);
 await b.saveAnswers({...identity,answers:{q1:{value:'yes'}}});
 assert.equal((await b.restoreAnswers({language:'es',level:'B2'})).snapshot,null);
 const other=maker(store,{topicId:'rl-second-topic'});
 assert.equal((await other.restoreAnswers(identity)).snapshot,null);
});
test('Data version drift requires explicit migration and removes obsolete IDs',async()=>{
 const store=makeStore();
 const v1=maker(store);
 await v1.saveAnswers({...identity,answers:{q1:{value:'B',checked:true},q2:{value:'legacy'}}});
 const v2=maker(store,{dataVersion:'qa-v2',variants:variants(['q1','q3'])});
 const peek=await v2.restoreAnswers(identity);
 assert.equal(peek.requiresReview,true);
 assert.deepEqual(peek.removedTaskIds,['q2']);
 assert.equal(peek.snapshot.answers.q1.value,'B');
 await assert.rejects(v2.saveAnswers({...identity,answers:{q3:{value:'new'}}}),/acknowledge/);
 const migration=await v2.acknowledgeVersionChange(identity);
 assert.equal(migration.changed,true);
 assert.equal(migration.storedInIndexedDB,false);
 await v2.saveAnswers({...identity,answers:{q3:{value:'new'}}});
 const after=await v2.restoreAnswers(identity);
 assert.equal(after.snapshot.answers.q2,undefined);
 assert.equal(after.snapshot.answers.q1.firstAttempt,'B');
});
test('Reading words use caller-supplied stable senseId and merge sources only by ID',async()=>{
 const store=makeStore(),first=maker(store);
 const saved=await first.saveWord({...identity,senseId:'word-horizon-0001',term:'horizon',translationCs:'obzor'});
 assert.equal(saved.storedInIndexedDB,false);
 assert.equal(saved.word.sources[0].skill,'cteni');
 const other=maker(store,{topicId:'rl-second-topic'});
 await other.saveWord({...identity,senseId:'word-horizon-0001',term:'horizon',explanation:'where sky seems to meet land'});
 const words=await store.listWords();
 assert.equal(words.length,1);
 assert.equal(words[0].sources.length,2);
 assert.equal(words[0].translationCs,'obzor');
 assert.match(words[0].explanation,/sky/);
});
test('Reject implicit sense IDs, blank meanings and colliding senses',async()=>{
 const store=makeStore(),b=maker(store);
 await assert.rejects(b.saveWord({...identity,term:'horizon',translationCs:'obzor'}),/senseId/);
 await assert.rejects(b.saveWord({...identity,senseId:'word-x',term:'x'}),/translation or explanation/);
 await b.saveWord({...identity,senseId:'word-sense-01',term:'bank',translationCs:'banka'});
 await assert.rejects(b.saveWord({...identity,senseId:'word-sense-01',term:'shore',translationCs:'břeh'}));
 assert.equal((await store.listWords()).length,1);
});
test('Readability: synthetic fixture is isolated and never added to public catalog',()=>{
 const p=path.join(__dirname,'..','data','manifest.json');
 const manifest=JSON.parse(fs.readFileSync(p,'utf8'));
 assert.equal(manifest.topics.some(x=>x.id==='rl-e4a-synthetic'),false);
 for(const topic of manifest.topics)assert.equal(topic.hasTeacherKey,false);
});
