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
  assert.equal(conlangs.gradeAnswers(data,auth,level).correct,17);
 }
 assert.equal(mutations,102);
});
test('R69 same 17-answer TEST teacher key and PRACTICE explanations',()=>{
 assert.deepEqual(key.keyEntries.map(x=>x.id),catalog.entries.filter(x=>['cteni','poslech'].includes(x.skill)).map(x=>x.id));
 for(const level of levels){
  const v=core.variant(data,level);
  const train=key.validate(key.buildListening(v,entry,'en',level));const exam=key.validate(key.buildListeningTest(v,entry,'en',level,core.cloze(v,entry.id,level)));
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
