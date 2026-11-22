#!/usr/bin/env node
'use strict';
/* R-12: ES/FR C1 item contract and projection consistency.
 * Linguistic/cognitive validity is checked in the accompanying human audit;
 * these tests keep answer keys, evidence and printed worksheets in sync.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../self-check/reading/reading-core.js');
const print=require('../self-check/reading/print-core.js');

const source=fs.readFileSync(path.resolve(__dirname,'../cteni/asteroids/index.html'),'utf8');
const data=core.parseReadingData(source);
const specs={
 es:[
  ['es-c1-scan-1','scan',0,'La estructura del objeto, la dirección del desvío y el tiempo de reacción disponible.',2],
  ['es-c1-scan-2','scan',0,'La observación continuada, el intercambio internacional de datos y las explicaciones públicas rigurosas.',3],
  ['es-c1-scan-3','scan',1,'Algunos titulares expresan una certeza mayor que la respaldada por los datos.',0],
  ['es-c1-vocab-1','vocab',1,'Que captan la atención sin aportar necesariamente información útil.',0]
 ],
 fr:[
  ['fr-c1-scan-1','scan',0,'La structure de l’objet, la direction de la déviation et le temps restant avant l’impact.',2],
  ['fr-c1-scan-2','scan',2,'La date des observations et la marge d’erreur associée.',1],
  ['fr-c1-scan-3','scan',1,'Ils peuvent donner une impression de certitude supérieure à celle que justifient les observations.',0],
  ['fr-c1-vocab-1','vocab',1,'Qui capte l’attention sans nécessairement aider à comprendre le risque.',0]
 ]
};
for(const lang of ['es','fr']){
 test('R-12 '+lang+'/C1: 21 questions, 7 stable competencies and unique identifiers',()=>{
  const v=core.variantFromData(data,lang,'C1');
  assert.equal(v.paragraphs.length,4);
  assert.equal(v.questions.length,21);
  assert.equal(new Set(v.questions.map(q=>q.id)).size,21);
  for(const section of ['gist','scan','detail','inference','vocab','matching','structure'])
   assert.equal(v.questions.filter(q=>q.tab===section).length,3);
 });
 test('R-12 '+lang+'/C1: all revised keys, evidence and distractors valid',()=>{
  const v=core.variantFromData(data,lang,'C1');
  for(const [id,tab,answer,correct,evidenceParagraph] of specs[lang]){
   const q=v.questions.find(q=>q.id===id);
   assert.ok(q,id+' exists');
   assert.equal(q.tab,tab);
   assert.equal(q.kind,'mc');
   assert.equal(q.choices.length,4);
   assert.equal(q.answer,answer);
   assert.equal(q.choices[q.answer],correct);
   assert.equal(new Set(q.choices.map(x=>x.normalize('NFC').toLowerCase().trim())).size,4);
   assert.ok(q.explanation.length>=55,id+' has explanatory feedback');
   assert.ok(q.evidence.length>=1,id+' provides in-text support');
   assert.equal(q.evidence[0].p,evidenceParagraph);
   for(const e of q.evidence)
    assert.ok(v.paragraphs[e.p].includes(e.text),id+' citation must occur verbatim');
   if(tab==='scan'){
    assert.ok(!/(?:Con qué expresión|Con qué adjetivo|palabra completa|Quelle expression|Quel adjectif|Quel mot complète)/i.test(q.q),
     id+' should not be a verbatim word-search prompt');
   }
  }
 });
 test('R-12 '+lang+'/C1: local score agrees with the revised answer key',()=>{
  const v=core.variantFromData(data,lang,'C1');
  const correctAnswers=Object.fromEntries(v.questions.map(q=>[q.id,q.answer]));
  const allCorrect=core.score(v,correctAnswers);
  assert.equal(allCorrect.total,21);
  assert.equal(allCorrect.correct,21);
  for(const [id] of specs[lang]){
   const wrong={...correctAnswers},q=v.questions.find(q=>q.id===id);
   wrong[id]=(q.answer+1)%q.choices.length;
   const grade=core.score(v,wrong);
   assert.equal(grade.correct,20);
   assert.equal(grade.details.find(x=>x.id===id).correct,false);
   assert.equal(grade.details.find(x=>x.id===id).correctAnswer,q.choices[q.answer]);
  }
 });
 test('R-12 '+lang+'/C1: test/practice PDF print prompts are synchronized, keys stay hidden',()=>{
  const v=core.variantFromData(data,lang,'C1');
  for(const mode of ['practice','test']){
   const p=print.printable(v,mode,'all');
   const printed=p.sections.flatMap(s=>s.questions);
   assert.equal(printed.length,21);
   for(const [id] of specs[lang]){
    const index=v.questions.findIndex(q=>q.id===id);
    assert.equal(printed[index].prompt,v.questions[index].q);
    assert.deepEqual(printed[index].choices,v.questions[index].choices);
    assert.equal(Object.hasOwn(printed[index],'answer'),false);
    assert.equal(Object.hasOwn(printed[index],'explanation'),false);
    assert.equal(Object.hasOwn(printed[index],'evidence'),false);
   }
   assert.equal(print.printable(v,mode,'text').sections.length,0);
  }
 });
}
