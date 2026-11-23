#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const listen=require('../self-check/listening/listening-core.js');
const card=require('../poslech/how-to-choose-your-news/news-core.js');
const keys=require('../self-check/practice-answers/teacher-key.js');
const html=read('poslech/how-to-choose-your-news/index.html');
const data=listen.extractJson(html,'DATA');
const catalog=JSON.parse(read('data/cards.json'));
const version=JSON.parse(read('version.json'));
const id='ll-how-to-choose-your-news';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const levels=['A1','A2','B1','B2','C1','C2'];
const answer=v=>({gist:v.gist.map(q=>q.correct),detail:v.detail.map(q=>q.correct),
 matching:v.matching.items.map(q=>q.correct),sequence:[],cloze:[]});

test('E3 catalog and official manifest preserve native LSH contract',()=>{
 assert.equal(catalog.entries.length,35);assert.equal(catalog.entries.filter(x=>x.skill==='poslech').length,6);
 assert.equal(catalog.entries.reduce((a,e)=>a+e.languages.length*e.levels.length,0),726);
 assert.equal(version.topicCount,35);assert.equal(version.variantCount,726);
 const e=catalog.entries.find(x=>x.id===id);assert.ok(e);
 assert.equal(e.relative,'poslech/how-to-choose-your-news/index.html');
 assert.deepEqual(e.languages,['en']);assert.deepEqual(e.levels,levels);
 assert.equal(listen.catalogEntry(catalog,id),e);
 assert.ok(listen.ALL_TOPICS.includes(id));
 assert.equal(version.contentHashes[id],sha(Buffer.from(html)));
 const i18n=JSON.parse(read('data/catalog-i18n.json'));
 assert.deepEqual(Object.keys(i18n.entries[id]).sort(),['cs','en']);
 assert.deepEqual(Object.keys(i18n.entries).sort(),catalog.entries.map(x=>x.id).sort());
});

test('E3 exact B2 from E1 and independent 204-item banks',()=>{
 card.validate(data);assert.deepEqual(data.levels,levels);
 assert.equal(sha(JSON.stringify(data.variants.B2.questionBank)),
  '951850978f04a3c87793594224b9d35e869786bc46999382f8b536a255ccefe2');
 assert.equal(sha(JSON.stringify(data.variants.B2.matchingBank)),
  'b88b3c1654db48d50fff86908a776e5ee0abb64c68bc3350befa66714faf9d09');
 let questions=0;
 for(const lv of levels){
  const testVariant=listen.variant(data,lv),training=card.practiceVariant(data,lv,testVariant);
  listen.validate(training);
  assert.deepEqual([testVariant.gist.length,testVariant.detail.length,testVariant.matching.items.length],[6,6,5]);
  assert.deepEqual([training.gist.length,training.detail.length,training.matching.items.length],[6,6,5]);
  assert.equal(testVariant.matching.options.length,7);assert.equal(training.matching.options.length,7);
  const testStems=new Set(data.variants[lv].questionBank.map(q=>q.question.toLowerCase()));
  assert.ok(data.practiceVariants[lv].questionBank.every(q=>!testStems.has(q.question.toLowerCase())));
  questions+=data.variants[lv].questionBank.length+data.practiceVariants[lv].questionBank.length;
 }
 assert.equal(questions,204);
});

test('E3 native LSH grading: perfect/empty + 102 single mutations and matching uniqueness',()=>{
 let mutations=0;
 for(const lv of levels){
  const v=listen.variant(data,lv),correct=answer(v);
  const full=listen.assessAuto(v,correct,id,lv);
  assert.equal(full.objectiveCorrect,17);assert.equal(full.objectiveMax,17);
  assert.equal(full.answered,17);assert.equal(full.reviewed.length,17);
  const blank=listen.assessAuto(v,{},id,lv);
  assert.equal(blank.objectiveCorrect,0);assert.equal(blank.unanswered,17);
  for(const type of ['gist','detail','matching'])for(let i=0;i<correct[type].length;i++){
   const copy=structuredClone(correct);
   const right=correct[type][i];
   if(type==='matching'){
    const unused=[0,1,2,3,4,5,6].find(x=>!correct.matching.includes(x));
    assert.ok(Number.isInteger(unused));copy.matching[i]=unused;
   }else{
    const length=v[type][i].options.length;
    copy[type][i]=(right+1)%length;
   }
   assert.equal(listen.assessAuto(v,copy,id,lv).objectiveCorrect,16,lv+':'+type+i);
   mutations++;
  }
  assert.throws(()=>listen.assessAuto(v,{matching:[0,0]},id,lv),/Matching answer used more than once/);
 }
 assert.equal(mutations,102);
});

test('E3 practice scoring: another 102 mutations, no mistaken TEST bank exposure',()=>{
 let mutations=0;
 for(const lv of levels){
  const bank=data.practiceVariants[lv],reference=Object.fromEntries(bank.questionBank.map(q=>[q.id,q.correct]));
  const full=card.gradeAnswers(data,reference,lv,'practice');
  assert.equal(full.correct,17);assert.equal(full.answered,17);
  const empty=card.gradeAnswers(data,{},lv,'practice');
  assert.equal(empty.correct,0);assert.equal(empty.answered,0);
  const used=new Set(bank.questionBank.filter(q=>q.type==='match').map(q=>q.correct));
  for(const q of bank.questionBank){
   const wrong=q.type==='mc'?['A','B','C','D'].find(x=>x!==q.correct):
    q.type==='tns'?card.TNS.find(x=>x!==q.correct):
    ['A','B','C','D','E','F','G'].find(x=>!used.has(x));
   const altered={...reference,[q.id]:wrong};
   assert.equal(card.gradeAnswers(data,altered,lv,'practice').correct,16,lv+q.id);
   mutations++;
  }
  assert.throws(()=>card.gradeAnswers(data,{C1:'A',C2:'A'},lv,'practice'),/Matching letter used more than once/);
 }
 assert.equal(mutations,102);
});

test('E3 shared teacher keys cannot confuse TEST and PRACTICE',()=>{
 const entry=listen.catalogEntry(catalog,id);
 assert.deepEqual(keys.keyEntries.map(x=>x.id),catalog.entries.filter(e=>
  ['cteni','poslech'].includes(e.skill)).map(x=>x.id));
 assert.equal(keys.keyEntries.length,11);
 for(const lv of levels){
  const variant=listen.variant(data,lv),practice=card.practiceVariant(data,lv,variant);
  const fromTeacher=keys.newsPracticeVariant(data,lv,variant);
  assert.equal(data.practice[lv].vocabulary.length,7,'E8b quiz requires seven authentic entries');
  assert.equal(new Set(data.practice[lv].vocabulary.map(x=>x.meaning)).size,7);
  // The independent 17-item scored practice bank is unchanged.
  assert.deepEqual(fromTeacher.gist,practice.gist);
  assert.deepEqual(fromTeacher.detail,practice.detail);
  assert.deepEqual(fromTeacher.matching,practice.matching);
  // The teacher key must use the PRE/AFTER prompts the student actually sees,
  // not the TEST-only discussion/prediction/open questions.
  const shown=data.practice[lv];
  assert.deepEqual(fromTeacher.before,shown.pre);
  assert.deepEqual(fromTeacher.talk,shown.after);
  assert.deepEqual(fromTeacher.vocab,shown.vocabulary);
  assert.deepEqual(fromTeacher.sequence,shown.sequence);
  assert.deepEqual(fromTeacher.challenge,shown.challenge);
  assert.equal(fromTeacher.prediction,'');
  assert.deepEqual(fromTeacher.beforeHelp,[]);
  assert.deepEqual(fromTeacher.talkHelp,[]);
  const practise=keys.validate(keys.buildListening(fromTeacher,entry,'en',lv));
  const questionItems=practise.groups.flatMap(g=>g.items.map(i=>i.question));
  for(const q of [...shown.pre,...shown.after])assert.ok(questionItems.includes(q),lv+' missing student prompt: '+q);
  for(const q of [...variant.before,variant.prediction,...variant.open.map(x=>x.title)]){
   if(q&&!shown.pre.includes(q)&&!shown.after.includes(q))
    assert.ok(!questionItems.includes(q),lv+' leaked TEST-only prompt: '+q);
  }
  for(const v of shown.vocabulary)
   assert.ok(questionItems.includes(v.term),lv+' missing visible vocabulary '+v.term);
  assert.equal(shown.sequence.length,lv==='A1'?4:lv==='A2'?5:lv==='B1'?6:7);
  assert.equal(new Set(shown.sequence).size,shown.sequence.length,lv+' duplicate reconstruction idea');
  const reconstruction=practise.groups.find(g=>g.title==='Reconstruction – správné pořadí');
  assert.equal(reconstruction?.items.length,shown.sequence.length);
  assert.deepEqual(reconstruction.items.map(x=>x.answer),shown.sequence);
  const advanced=practise.groups.find(g=>g.title==='Challenge – otevřené úkoly');
  assert.equal(advanced?.items.length||0,['C1','C2'].includes(lv)?2:0);
  if(advanced)assert.deepEqual(advanced.items.map(x=>x.question),shown.challenge);
  assert.equal(practise.groups.find(g=>g.title==='Před poslechem – diskuse')?.items.length,shown.pre.length);
  assert.equal(practise.groups.find(g=>g.title==='Speaking follow-up – diskuse')?.items.length,shown.after.length);
  assert.ok(!practise.groups.some(g=>g.title==='Open questions – vzorové odpovědi'));
  const reviewLabels=practise.groups.flatMap(g=>g.items).map(x=>x.question);
  assert.equal(new Set(reviewLabels).size,reviewLabels.length,lv+' duplicate teacher key question');
  const exam=keys.validate(keys.buildListeningTest(variant,entry,'en',lv,listen.cloze(variant,id,lv)));
  assert.equal(practise.mode,'practice');assert.equal(exam.mode,'test');
  const parts=m=>m.groups.flatMap(g=>g.items);
  assert.equal(exam.groups.flatMap(g=>g.items).length,17);
  assert.notDeepEqual(parts(practise).slice(0,17).map(x=>x.question),
   parts(exam).slice(0,17).map(x=>x.question));
 }
});

test('E3 equal Listening Studio R70 UI, consistent CSP and source URLs',()=>{
 assert.ok(html.length<200000);
 assert.match(html,/href="\.\.\/\.\.\/assets\/lsh\/listening-studio\.css"/);
 assert.match(html,/src="\.\.\/\.\.\/assets\/lsh\/listening-studio\.js"/);
 assert.match(html,/href="\.\.\/conlangs\/conlangs\.css"/);
 assert.match(html,/<nav class="studio-levelbar" aria-label="Choose a listening level">/);
 for(const id of ['levelPills','topLevelText','videoFrame','videoCover','loadVideo','questionsA',
  'questionsB','questionsC','checkA','checkB','checkC','progressBar','progressStatus',
  'studioProgressBar','studioProgressText'])
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 const script=/<script>([\s\S]*?)<\/script>/.exec(html);assert.ok(script);
 const hash=crypto.createHash('sha256').update(script[1]).digest('base64');
 assert.match(html,new RegExp('sha256-'+hash.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 assert.equal(listen.sourceLinks(html).length,2);
 const teacher=read('self-check/listening/listening-teacher.js');
 assert.match(teacher,/ll-how-to-choose-your-news/);assert.match(teacher,/q-Y-z6HmRgI/);
 assert.match(read('self-check/listening/listening-student.js'),/ll-how-to-choose-your-news/);
 assert.doesNotMatch(read('self-check/listening/student.html'),/<(?:video|audio|iframe)\b/i);
 const practice=read('poslech/how-to-choose-your-news/news-practice.js');
 assert.doesNotMatch(practice,/Choose one correct answer\.|Choose True, False or Not Stated\./);
 assert.match(practice,/el\('fieldset','task-field'\)/);
 assert.match(practice,/el\('legend','sr-only-task-legend'/);
});

test('E8 NEWS optional writing/replay stays scoped to practice, keeps official TEST grade separate',()=>{
 const practice=read('poslech/how-to-choose-your-news/news-practice.js');
 const extraCss=read('poslech/how-to-choose-your-news/news-practice-extras.css');
 assert.match(practice,/function loadDraft\(lv\)/);
 assert.match(practice,/function exportAnswers\(\)/);
 assert.match(practice,/function renderVocabPractice\(\)/);
 assert.match(practice,/function checkVocabPractice\(\)/);
 assert.match(practice,/function renderSequence\(\)/);
 assert.match(practice,/function checkSequence\(\)/);
 assert.match(practice,/function renderChallenge\(\)/);
 assert.match(practice,/function installPracticeExtras\(\)/);
 assert.match(practice,/for\(const section of 'ABC'\)check\(section\)/);
 assert.match(practice,/news-practice-extras\.css/);
 // E10 P0: the dot-prefixed CSS selector must be resolved by querySelector,
 // not by the getElementById helper. The latter crashes setup before rendering.
 assert.match(practice,/const nav=document\.querySelector\('\.side nav'\)/);
 assert.doesNotMatch(practice,/\$\('\.side nav'\)/);
 assert.match(practice,/draft\.after\.filter/);
 assert.match(practice,/answerSaveFailed/);
 assert.match(practice,/Deletion could not be verified/);
 assert.match(practice,/localStorage\.getItem\(storageKey\)!==null/);
 assert.match(extraCss,/#afterQuestions>li/);
 assert.match(extraCss,/\.news-writing:focus-visible/);
 assert.match(extraCss,/\.news-vocab-select:focus-visible/);
 assert.match(extraCss,/\.news-sequence-item/);
 assert.match(extraCss,/\.news-challenge/);
 assert.doesNotMatch(read('self-check/listening/listening-student.js'),/news-practice-extras\.css/);
 const student=read('self-check/listening/listening-student.js');
 assert.match(student,/selection\.topic==='ll-sad'\?/);
 assert.match(student,/Replay the source and match each statement/);
});
