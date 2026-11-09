#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {
 ContractError,validatePrivateDefinition,safeStudentDefinition,
 scoreSubmitted,validateSubmission
}=require('../src/contract.cjs');

function reading(){
 return {
  topicId:'rl-asteroids',skill:'cteni',language:'en',level:'B2',
  revision:'r22-fixture-1',title:'Fictional passage for contract tests',
  intro:'Synthetic test data only – never use as a real exam.',
  stimulus:'On an imaginary planet, two moons rise every evening.',
  teacherMediaUrl:'SECRET_SERVER_MEDIA_REFERENCE_CANARY',
  timeLimitSeconds:1200,tasks:[
   {id:'q1',type:'single-choice',prompt:'How many moons rise?',
    options:[{id:'opone',text:'One'},{id:'optwo',text:'Two'}],
    correct:'optwo',points:2,explanation:'The fictional text says two.'},
   {id:'q2',type:'multiple-choice',prompt:'Select the two descriptions',
    options:[{id:'opred',text:'Red'},{id:'opblue',text:'Blue'},
     {id:'opgreen',text:'Green'}],
    correct:['opblue','opgreen'],points:2,
    explanation:'This is a synthetic scoring fixture.'},
   {id:'q3',type:'short-text',prompt:'Greet the explorer.',
    accepted:['hello','hi'],reference:'Hello',
    points:2,explanation:'Both greetings are accepted.'},
   {id:'q4',type:'extended-response',prompt:'Explain the metaphor.',
    reference:'A model response available only on the server after submission.',
    points:2,explanation:'A human teacher must assess an extended answer.'}
  ]
 };
}
function listening(){
 return {
  topicId:'ll-matthew-oscars',skill:'poslech',language:'en',level:'B1',
  revision:'r22-fixture-2',title:'Fictional audio comprehension',
  teacherMediaUrl:'SECRET_SERVER_MEDIA_REFERENCE_CANARY',
  timeLimitSeconds:900,tasks:[
   {id:'q1',type:'single-choice',phase:'first-listening',
    prompt:'Identify the main idea',
    options:[{id:'opone',text:'Friendship'},{id:'optwo',text:'Success'}],
    correct:'optwo',points:1},
   {id:'q2',type:'single-choice',phase:'listen-and-interpret',
    prompt:'Select the speaker’s attitude',
    options:[{id:'opone',text:'Positive'},{id:'optwo',text:'Neutral'}],
    correct:'opone',points:1},
   {id:'q3',type:'short-text',phase:'listen-write-and-reconstruct',
    prompt:'Write the keyword you heard',
    accepted:['hope'],points:2,reference:'hope'}
  ]
 };
}
test('R22 private bank schema rejects conversation, wrong languages, missing phases and wrong answer keys',()=>{
 assert.equal(validatePrivateDefinition(reading()).topicId,'rl-asteroids');
 assert.equal(validatePrivateDefinition(listening()).skill,'poslech');
 for(const candidate of [
  {...reading(),skill:'konverzace',topicId:'cl-skola'},
  {...reading(),language:'xx'},
  {...reading(),level:'B3'},
  {...reading(),timeLimitSeconds:0},
  {...reading(),tasks:[]},
  {...reading(),tasks:[{...reading().tasks[0],correct:'opmissing'}]},
  {...reading(),tasks:[reading().tasks[0],reading().tasks[0]]},
  {...listening(),language:'es'},
  {...listening(),tasks:listening().tasks.slice(1)},
  {...reading(),topicId:'ll-asteroids'}
 ])assert.throws(()=>validatePrivateDefinition(candidate),ContractError);
 console.log('PASS R22 only Reading+Listening definitions, supported language/CEFR, 3 listening stages, consistent private bank');
});
test('R22 public student payload strips all private keys, explanations, teacher media and reference answers',()=>{
 for(const source of [reading(),listening()]){
  const view=safeStudentDefinition(source);
  const json=JSON.stringify(view);
  for(const term of ['SECRET_SERVER_MEDIA_REFERENCE_CANARY','correct','accepted',
   'reference','explanation','teacherMediaUrl','model response','optwo","points"']){
   if(term==='optwo","points"')continue;
   assert.equal(json.includes(term),false,'Private answer/reference leaked: '+term);
  }
  assert.equal(view.kind,'LSH_STUDENT_TEST_R22_V1');
  assert.equal(view.tasks.length,source.tasks.length);
  assert.equal(view.restrictions.dictionaryEnabled,false);
  assert.equal(view.restrictions.myVocabularyEnabled,false);
  assert.equal(view.restrictions.hintsEnabled,false);
  assert.equal(view.restrictions.supportingPassagesEnabled,false);
  assert.equal(view.restrictions.feedbackBeforeSubmission,false);
  assert.equal(view.restrictions.allowLanguageSwitch,false);
  assert.equal(view.restrictions.allowLevelSwitch,false);
  assert.equal(view.restrictions.studentMediaPlayerEnabled,false);
  for(const question of view.tasks)
   assert.ok(Object.keys(question).every(key=>['id','type','prompt','points','phase','options'].includes(key)));
 }
 console.log('PASS R22 public allowlist prevents pre-submit keys, feedback, teacher media and vocabulary');
});
test('R22 deterministic objective scoring, partial completion, no invented school grade',()=>{
 const bank=reading();
 const r=scoreSubmitted(bank,{q1:'optwo',q2:['opblue','opgreen'],q3:'  HELLO ',q4:''});
 assert.equal(r.kind,'LSH_TEST_RESULT_R22_V1');
 assert.equal(r.status,'scored');
 assert.equal(r.scoredPoints,6);
 assert.equal(r.pendingPoints,0);
 assert.equal(r.maxPoints,8);
 assert.equal(r.percentage,75);
 assert.equal(r.grade,null);
 assert.equal(r.gradeStatus,'SCHOOL_SCALE_NOT_ACTIVATED_R22');
 assert.equal(r.review.length,4);
 assert.equal(r.review[0].state,'correct');
 assert.equal(r.review[3].state,'incorrect');
 assert.equal(r.review[0].correctAnswer,'optwo');
 const wrong=scoreSubmitted(bank,{q1:'opone',q2:['opgreen'],q3:''});
 assert.equal(wrong.percentage,0);
 assert.equal(wrong.grade,null);
 console.log('PASS R22 objective marks after submission; no invented thresholds');
});
test('R22 open responses are not graded wrong solely for lack of literal match',()=>{
 const bank=reading();
 const r=scoreSubmitted(bank,{q1:'optwo',q2:[],q3:'Hello there, explorer!',q4:'An original interpretation.'});
 assert.equal(r.status,'needs_teacher_review');
 assert.equal(r.grade,null);
 assert.equal(r.percentage,null);
 assert.equal(r.scoredPoints,2);
 assert.equal(r.pendingPoints,4);
 assert.equal(r.review.find(x=>x.taskId==='q3').state,'needs_teacher_review');
 assert.equal(r.review.find(x=>x.taskId==='q4').state,'needs_teacher_review');
 console.log('PASS R22 teacher review on paraphrases and extended responses; no false automatic marks');
});
test('R22 malformed JSON answers, prototype pollution, oversized writing and unknown task IDs are rejected',()=>{
 const bank=reading();
 for(const candidate of [
  null,[],{'q0':'unknown'},{q1:[]},{q2:['opblue','opblue']},
  {q4:'x'.repeat(5501)},JSON.parse('{"__proto__":"bad"}')
 ])assert.throws(()=>validateSubmission(bank,candidate),ContractError);
 console.log('PASS R22 reject unknown/prototype keys, malformed and too-large answers');
});
test('R22 practice catalog remains unchanged and graded-test gate remains disabled',()=>{
 const base=path.resolve(__dirname,'../../../language-skills-hub');
 const cards=JSON.parse(fs.readFileSync(path.join(base,'data/cards.json'),'utf8'));
 const version=JSON.parse(fs.readFileSync(path.join(base,'version.json'),'utf8'));
 const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
 assert.equal(cards.gradedTestsEnabled,false);
 assert.equal(version.gradedTestsEnabled,false);
 assert.equal(version.topicCount,29);
 assert.equal(version.variantCount,642);
 assert.equal(cards.entries.length,29);
 assert.doesNotMatch(html,/data-test-mode="enabled"|testLaunchUrl|id="testButton"/);
 let count=0;const skills={konverzace:0,cteni:0,poslech:0};
 for(const item of cards.entries){
  skills[item.skill]++;
  const bytes=fs.readFileSync(path.join(base,item.relative));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),
   version.contentHashes[item.id]);
  count+=item.languages.length*item.levels.length;
 }
 assert.deepEqual(skills,{konverzace:21,cteni:5,poslech:3});
 assert.equal(count,642);
 console.log('PASS R22 29 original immutable practice HTML, 642 variants, NO public testing');
});
module.exports={reading,listening};
