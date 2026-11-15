#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),topic='ll-how-to-choose-your-news';
const core=require('../self-check/listening/listening-core.js'),attempt=require('../self-check/session/attempt-core.js');
const pdf=require('../self-check/results/pdf-report.js');
const policy=JSON.parse(read('data/test-mode-policy.json'));
const version=JSON.parse(read('version.json'));
const data=core.extractJson(read('poslech/how-to-choose-your-news/index.html'),'DATA');
const session=read('self-check/session/session-ui.js'),student=read('self-check/listening/listening-student.js');
test('E4 security contract uses the same LSH runtime, with no security fork',()=>{
 const pinned={
  'self-check/session/attempt-core.js':'fb04ac83b7565b5c43bedaaae595c7b0cc7e26d1',
  'self-check/session/tab-guard.js':'cb753d0e440eafa06d077fecbbb627afd3f600bf',
  'self-check/results/pdf-report.js':'372931ac7895d4b6da39a7f1d43dc5bb073d4050',
  'self-check/results/export-core.js':'ed51c90758aa2ca3036f54fa96e7fae6c02b585e',
  'data/test-mode-policy.json':'cfd8ce76d8314bcdedc1397dc95ab4fbc7759871'
 };
 for(const [file,expected] of Object.entries(pinned)){
  const b=fs.readFileSync(path.join(root,file));
  const actual=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
  assert.equal(actual,expected,file+' changed outside E4 scope');
 }
 assert.equal(version.gradedTestsEnabled,false);
 assert.equal(version.officialGradesEnabled,false);
 assert.equal(policy.tamperProofResultsGuaranteed,false);
 assert.equal(policy.clientAnswerKeySecrecyGuaranteed,false);
 const html=read('self-check/listening/student.html');
 for(const f of ['attempt-core.js','tab-guard.js','session-ui.js'])
  assert.ok(html.includes(f),f);
 assert.doesNotMatch(html,/<iframe\b|<video\b|<audio\b|type=["']password/i);
 assert.match(session,/const order=\['tl','tr','bl','br'\]/);
 assert.match(session,/if\(restricted\(\)\)\{lockReason\('restricted-viewport'\);return;\}/);
 assert.match(session,/addEventListener\('beforeprint'/);
 assert.match(session,/lock\('concurrent-tab'\)/);
 assert.match(student,/const mistakes=report\.reviewed\.filter\(task=>!task\.correct\)/);
 assert.match(student,/window\.LSHPdfReport\.download/);
 assert.match(student,/exportCore\.downloadDetailed/);
});
test('E4 all NEWS TEST variants score 17 objectives, never exposing correct answers before submit',()=>{
 const catalog=JSON.parse(read('data/cards.json'));
 const entry=catalog.entries.find(e=>e.id===topic);
 assert.ok(entry&&entry.skill==='poslech');
 const keys=require('../self-check/practice-answers/teacher-key.js');
 for(const level of core.LEVELS){
  const v=core.variant(data,level);
  const inputs={gist:v.gist.map(q=>q.correct),detail:v.detail.map(q=>q.correct),
    matching:v.matching.items.map(q=>q.correct),sequence:[],cloze:[]};
  const full=core.assessAuto(v,inputs,topic,level);
  assert.equal(full.objectiveMax,17);
  assert.equal(full.objectiveCorrect,17);
  inputs.gist[0]=(inputs.gist[0]+1)%v.gist[0].options.length;
  const oneWrong=core.assessAuto(v,inputs,topic,level);
  assert.equal(oneWrong.objectiveCorrect,16);
  assert.equal(oneWrong.reviewed.filter(q=>!q.correct).length,1);
  assert.ok(keys.validate(keys.buildListeningTest(v,entry,'en',level,core.cloze(v,topic,level))));
  assert.ok(keys.validate(keys.buildListening(keys.newsPracticeVariant(data,level,v),entry,'en',level)));
 }
});
test('E4 timed NEWS attempt preserves incident chronology, answers and a nonverified report',()=>{
 const saved=new Map(),storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
 let clock=1794710000000;
 const cfg={skill:'listening',topic,lang:'en',level:'B2',attempt:'r73-unit-abc',limitMinutes:5,now:()=>clock,storage};
 const a=attempt.open(cfg);
 a.start();a.saveAnswers({gist:[0]});clock+=10000;a.interrupt('restricted-viewport');
 assert.equal(a.status().phase,'interrupted');
 assert.throws(()=>a.saveAnswers({gist:[1]}),/not editable/);
 clock+=15000;a.resume();clock+=10000;a.interrupt('hidden');clock+=10000;a.resume();a.finish();
 const restored=attempt.open(cfg).status();
 assert.equal(restored.phase,'submitted');
 assert.deepEqual(restored.answers,{gist:[0]});
 const security=pdf.securityFromAttempt({...restored,tabMonitoringAvailable:true});
 assert.deepEqual(security.events.map(e=>e.kind),
  ['restricted-viewport','teacher-resume','hidden','teacher-resume']);
 assert.equal(security.monitored,true);
});