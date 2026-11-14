'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const R=path.resolve(__dirname,'..'), read=p=>fs.readFileSync(path.join(R,p),'utf8');
const core=require('../self-check/listening/listening-core.js'), conlangs=require('../poslech/conlangs/conlangs-core.js'), key=require('../self-check/practice-answers/teacher-key.js');
const catalog=JSON.parse(read('data/cards.json')),version=JSON.parse(read('version.json'));
const entry=catalog.entries.find(x=>x.id==='ll-conlangs'),html=read('poslech/conlangs/index.html'),data=core.extractJson(html,'DATA');
const levels=['A1','A2','B1','B2','C1','C2'];const correctFor=v=>({gist:v.gist.map(q=>q.correct),detail:v.detail.map(q=>q.correct),matching:v.matching.items.map(q=>q.correct),sequence:[],cloze:[]});
test('R69 catalog and unchanged historical approved 4 Listening HTML checksums',()=>{
 assert.equal(version.topicCount,32);assert.equal(version.variantCount,678);assert.equal(catalog.entries.length,32);
 assert.equal(catalog.entries.filter(x=>x.skill==='poslech').length,5);
 assert.deepEqual(entry.languages,['en']);assert.deepEqual(entry.levels,levels);assert.equal(core.catalogEntry(catalog,entry.id),entry);
 assert.equal(version.contentHashes[entry.id],crypto.createHash('sha256').update(html).digest('hex'));
 for(const x of catalog.entries.filter(x=>x.skill==='poslech'&&x.id!==entry.id))assert.equal(version.contentHashes[x.id],crypto.createHash('sha256').update(read(x.relative)).digest('hex'),x.id);
});
test('R69 catalog translations exactly match published teaching languages',()=>{
 const i18n=JSON.parse(read('data/catalog-i18n.json'));
 assert.equal(Object.keys(i18n.entries).length,catalog.entries.length);
 for(const e of catalog.entries){
  assert.ok(i18n.entries[e.id],'Missing catalog localization for '+e.id);
  assert.deepEqual(Object.keys(i18n.entries[e.id]).sort(),['cs',...e.languages].sort(),e.id);
 }
 assert.deepEqual(Object.keys(i18n.entries['ll-conlangs']).sort(),['cs','en']);
});
test('R69 six unique 17-item banks and pedagogical practice with keys and evidence disclaimers',()=>{
 conlangs.validate(data);assert.deepEqual(data.levels,levels);
 const signatures=[];
 for(const level of levels){
  const v=core.variant(data,level),b=data.variants[level];
  assert.deepEqual([v.gist.length,v.detail.length,v.matching.items.length,v.sequence.length,v.facts.length],[6,6,5,0,0]);
  assert.equal(v.matching.options.length,7);assert.equal(v.open.length>=2,true);
  assert.ok(b.questionBank.every(q=>q.explanation&&q.evidence));
  assert.deepEqual(new Set(v.detail.map(q=>q.correct)),new Set([0,1,2]));
  assert.equal(new Set(v.matching.items.map(q=>q.correct)).size,5);
  assert.equal(core.cloze(v,'ll-conlangs',level).length,0);
  signatures.push(b.questionBank.map(q=>q.question).join('|'));
  assert.ok(data.practice[level].vocabulary.length>=5);
  assert.ok(data.practice[level].pre.length&&data.practice[level].after.length);
  assert.ok(data.practice[level].vocabulary.every(x=>x.term&&x.cs&&x.meaning));
 }
 assert.equal(new Set(signatures).size,6);
});
test('R69 all 102 item mutations, blank tests and matching uniqueness',()=>{
 let mutations=0;
 for(const level of levels){
  const v=core.variant(data,level),all=correctFor(v),good=core.assessAuto(v,all,'ll-conlangs',level);
  assert.equal(good.objectiveMax,17);assert.equal(good.objectiveCorrect,17);assert.equal(good.answered,17);
  assert.equal(good.reviewed.length,17);
  const empty=core.assessAuto(v,{},'ll-conlangs',level);assert.equal(empty.objectiveMax,17);assert.equal(empty.objectiveCorrect,0);assert.equal(empty.unanswered,17);
  for(const type of ['gist','detail','matching'])for(let i=0;i<all[type].length;i++){
   const altered=JSON.parse(JSON.stringify(all));const q=type==='matching'?v.matching.items[i]:v[type][i];
   const used=new Set(all.matching);const wrong=type==='matching'?[0,1,2,3,4,5,6].find(x=>!used.has(x)):(q.correct+1)%q.options.length;
   altered[type][i]=wrong;const output=core.assessAuto(v,altered,'ll-conlangs',level);
   assert.equal(output.objectiveCorrect,16,level+type+i);mutations++;
  }
  assert.throws(()=>core.assessAuto(v,{matching:[0,0]},'ll-conlangs',level),/Matching answer used more than once/);
  const auth=Object.fromEntries(data.variants[level].questionBank.map(q=>[q.id,q.correct]));
  assert.equal(conlangs.gradeAnswers(data,auth,level,'test').correct,17);
 }
 assert.equal(mutations,102);
});
test('R69 same 17-answer TEST teacher key and PRACTICE explanations',()=>{
 assert.deepEqual(key.keyEntries.map(x=>x.id),catalog.entries.filter(x=>['cteni','poslech'].includes(x.skill)).map(x=>x.id));
 for(const level of levels){
  const v=core.variant(data,level);
  const train=key.validate(key.buildListening(key.conlangsPracticeVariant(data,level,v),entry,'en',level));const exam=key.validate(key.buildListeningTest(v,entry,'en',level,core.cloze(v,entry.id,level)));
  assert.equal(train.mode,'practice');assert.ok(train.groups.some(x=>x.title.includes('Vocabulary')));
  assert.equal(exam.mode,'test');assert.equal(exam.groups.flatMap(x=>x.items).length,17);
 }
});
test('R69 uses only the shared test route and the shared vocabulary bridge',()=>{
 const teacher=read('self-check/listening/listening-teacher.js'),student=read('self-check/listening/listening-student.js');
 assert.match(teacher,/ll-conlangs/);assert.match(student,/ll-conlangs/);
 assert.match(html,/card-vocabulary\.js/);assert.match(html,/conlangs-practice\.js/);
 assert.doesNotMatch(html,/student\.html|teacher-key\.html/);
 assert.doesNotMatch(read('self-check/listening/student.html'),/<(?:video|iframe|audio)\b/);
 const inline=/<script>([\s\S]*?)<\/script>/.exec(html)?.[1];assert.ok(inline);
 const digest=crypto.createHash('sha256').update(inline).digest('base64');assert.match(html,new RegExp('sha256-'+digest.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
test('R69 independent CEFR distractor and transcript-scope quality gate',()=>{
 for(const level of levels){
  const bank=data.variants[level];
  const mc=bank.questionBank.filter(q=>q.type==='mc');
  assert.equal(mc.length,6);
  const options=mc.flatMap(q=>q.options);
  assert.equal(new Set(options).size,options.length,'Repeated/generic multiple-choice distractor in '+level);
  for(const q of bank.questionBank){
   assert.doesNotMatch(q.question,/\b(?:Quenya|Sindarin)\b/i,'Not in the spoken video: '+level+q.id);
   assert.ok(q.explanation&&q.explanation.length>=20,'Explanations must be meaningful '+level+q.id);
   assert.ok(q.evidence&&q.evidence.length>35,'Detailed transcript cue required');
   assert.doesNotMatch(q.evidence,/00:00|05:05|pending manual verification/,'Do not claim fake timestamps');
  }
 }
 assert.equal(data.practice.A1.vocabulary.find(x=>x.term==='a fan').cs,'fanoušek / fanynka');
 assert.equal(data.A1.vocab.find(x=>x.term==='a fan').cs,'fanoušek / fanynka');
});

// R69 P1 release blockers: no fixed T/F/NS pattern and no public practice-test copies.
test('R69 six T/F/NS exam orders are independently mixed, all keys and aliases stay aligned',()=>{
 const patterns=new Set();
 for(const level of levels){
  const b=data.variants[level],tns=b.questionBank.filter(q=>q.type==='tns');
  assert.deepEqual(tns.map(q=>q.id),['B1','B2','B3','B4','B5','B6']);
  const pattern=tns.map(q=>q.correct);
  assert.deepEqual(pattern.map(x=>[x,pattern.filter(v=>v===x).length]).filter((x,i,a)=>a.findIndex(z=>z[0]===x[0])===i).map(x=>x[1]).sort(),[2,2,2],level);
  assert.equal(patterns.has(pattern.join(',')),false,'Predictable answer pattern in '+level);
  patterns.add(pattern.join(','));
  for(const [i,q] of tns.entries()){
   assert.equal(data[level].detail[i].id,q.id);
   assert.equal(data[level].detail[i].title,q.question);
   assert.equal(data[level].detail[i].correct,['TRUE','FALSE','NOT STATED'].indexOf(q.correct));
  }
 }
 assert.equal(patterns.size,levels.length);
});
test('R69 independent PRACTICE source contains 102 different stems and source-based feedback without false timestamps',()=>{
 let count=0;
 for(const level of levels){
  const practice=data.practiceVariants[level],exam=data.variants[level];
  assert.equal(practice.questionBank.length,17);
  assert.equal(practice.matchingBank.length,7);
  const live=new Set(exam.questionBank.map(q=>q.question.trim().toLowerCase()));
  for(const q of practice.questionBank){
   assert.ok(!live.has(q.question.trim().toLowerCase()),'Test question leaked into practice '+level+q.id);
   assert.doesNotMatch(q.evidence,/00:00|05:05|pending manual verification/);
   assert.ok(q.explanation.length>=22);
   count++;
  }
  const auth=Object.fromEntries(practice.questionBank.map(q=>[q.id,q.correct]));
  assert.equal(conlangs.gradeAnswers(data,auth,level,'practice').correct,17,level);
  assert.equal(conlangs.gradeAnswers(data,{},level,'practice').correct,0,level);
  assert.equal(conlangs.gradeAnswers(data,auth,level,'practice').mode,'practice');
  assert.throws(()=>conlangs.gradeAnswers(data,{C1:'A',C2:'A'},level,'practice'),/matching letter used twice/);
  const v=key.conlangsPracticeVariant(data,level,core.variant(data,level));
  core.validate(v);
  const teacher=key.validate(key.buildListening(v,entry,'en',level));
  const groups=teacher.groups.filter(g=>/First Listening|Listen and Interpret|Matching/.test(g.title));
  assert.equal(groups.reduce((n,g)=>n+g.items.length,0),17,level);
  assert.ok(groups.every(g=>g.items.every(q=>!live.has(q.question.trim().toLowerCase()))));
  assert.equal(teacher.mode,'practice');
  assert.deepEqual(v.matching.options,practice.matchingBank.map(x=>x[1]));
 }
 assert.equal(count,102);
});
test('R69 student practice never displays invented exact timestamps and teacher mode cannot mix bank types',()=>{
 const script=read('poslech/conlangs/conlangs-practice.js');
 assert.match(script,/data\.practiceVariants\[level\]\.questionBank/);
 assert.match(script,/data\.practiceVariants\[level\]\.matchingBank/);
 assert.match(script,/gradeAnswers\(data,responses,level,'practice'\)/);
 assert.doesNotMatch(script,/Evidence in recording: approximately/);
 assert.match(script,/Precise audio time not yet independently confirmed/);
 const teacher=read('self-check/practice-answers/teacher-key.js');
 assert.match(teacher,/e\.id==='ll-conlangs'\?conlangsPracticeVariant\(data,level,v\):v/);
 assert.match(teacher,/mode==='test'\?buildListeningTest/);
});
