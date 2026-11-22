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
  ['fr-c1-scan-1','scan',0,'La structure de l’objet, la direction de la déviation et le délai disponible avant un impact éventuel.',2],
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


// R-13 independent linguistic review: refined author-purpose, inference,
// lexical nuance and cohesion, while preserving every stable question ID/key.
const r13={
 es:[
  ['gist-3','gist',3,'Riesgo, pruebas e incertidumbre: informar sin alarmar',1],
  ['inference-1','inference',2,'Porque la probabilidad calculada puede variar mientras se reduce la incertidumbre orbital.',1],
  ['inference-2','inference',1,'Que el contacto visible no basta: hacen falta observaciones posteriores del cambio orbital.',2],
  ['inference-3','inference',1,'Que probablemente perdería la confianza del público.',3],
  ['vocab-2','vocab',2,'El conjunto de trayectorias que aún concuerdan con los datos disponibles.',1],
  ['vocab-3','vocab',1,'Restarles importancia hasta descartar una preparación que podría ser necesaria.',3],
  ['matching-1','matching',1,'El segundo párrafo',1],
  ['matching-2','matching',3,'El último párrafo',3],
  ['structure-1','structure',3,'También surge una cuestión de prioridades: qué recibe atención y recursos.',3]
 ],
 fr:[
  ['gist-2','gist',2,'Distinguer la proximité orbitale du danger réel et montrer comment certains médias brouillent cette distinction.',0],
  ['gist-3','gist',3,'Risque, preuves et incertitude : informer sans alarmer',1],
  ['detail-3','detail',3,'Qu’un transfert de quantité de mouvement peut modifier une orbite en conditions réelles.',2],
  ['inference-1','inference',0,'Parce que la probabilité calculée peut évoluer pendant que les nouvelles observations réduisent l’incertitude orbitale.',1],
  ['inference-2','inference',3,'Le contact visible ne suffit pas : il faut mesurer ensuite l’effet réel sur l’orbite.',2],
  ['vocab-2','vocab',1,'L’ensemble des trajectoires encore compatibles avec les mesures.',1],
  ['vocab-3','vocab',0,'L’idée qu’un risque rare ne mériterait aucune mesure anticipée.',3],
  ['matching-1','matching',1,'Le deuxième paragraphe',1],
  ['matching-2','matching',3,'Le dernier paragraphe',3],
  ['matching-3','matching',0,'Le premier paragraphe',0],
  ['structure-1','structure',3,'Reste la question des priorités.',3]
 ]
};
for(const lang of ['es','fr']){
 test('R-13 '+lang+'/C1: complete 21-item structure, unchanged answer keys and all evidence',()=>{
  const v=core.variantFromData(data,lang,'C1');
  assert.equal(v.questions.length,21);
  assert.equal(new Set(v.questions.map(q=>q.id)).size,21);
  for(const tab of ['gist','scan','detail','inference','vocab','matching','structure'])
   assert.equal(v.questions.filter(q=>q.tab===tab).length,3,tab);
  for(const q of v.questions){
   assert.equal(q.choices.length,4,q.id);
   assert.equal(new Set(q.choices).size,4,q.id);
   assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4,q.id);
   assert.ok(q.evidence.length>0,q.id);
   for(const e of q.evidence)
    assert.ok(v.paragraphs[e.p]?.includes(e.text),q.id+' evidence citation');
   if(q.target)
    assert.ok(v.paragraphs[q.target[0]]?.includes(q.target[1]),q.id+' locate target');
  }
  for(const [short,tab,answer,correct,p] of r13[lang]){
   const id=lang+'-c1-'+short,q=v.questions.find(q=>q.id===id);
   assert.ok(q,id);
   assert.equal(q.tab,tab,id);
   assert.equal(q.answer,answer,id);
   assert.equal(q.choices[answer],correct,id);
   assert.ok(q.evidence.some(e=>e.p===p),id+' supports correct paragraph');
   assert.ok(q.explanation.length>=50,id+' feedback is instructive');
  }
 });
 test('R-13 '+lang+'/C1: source, printable practice/test and local score remain synchronized',()=>{
  const v=core.variantFromData(data,lang,'C1');
  const answerBook=Object.fromEntries(v.questions.map(q=>[q.id,q.answer]));
  assert.equal(core.score(v,answerBook).correct,21);
  for(const [short] of r13[lang]){
   const id=lang+'-c1-'+short,q=v.questions.find(q=>q.id===id);
   const wrong={...answerBook,[id]:(q.answer+1)%4};
   const got=core.score(v,wrong);
   assert.equal(got.correct,20,id);
   assert.equal(got.details.find(x=>x.id===id).correctAnswer,q.choices[q.answer]);
  }
  for(const mode of ['practice','test']){
   const printed=print.printable(v,mode,'all').sections.flatMap(s=>s.questions);
   assert.equal(printed.length,21);
   for(let i=0;i<v.questions.length;i++){
    const expected=v.questions[i],got=printed[i];
    assert.equal(got.prompt,expected.q,expected.id+' prompt');
    assert.deepEqual(got.choices,expected.choices,expected.id+' choices');
    for(const secret of ['answer','evidence','explanation'])
     assert.equal(Object.hasOwn(got,secret),false,expected.id+' secret '+secret);
   }
  }
 });
}
test('R-13: one-time session migration is versioned and scoped to ES/FR C1',()=>{
 assert.match(source,/es-fr-c1-r13-20261122/);
 assert.match(source,/itemRevisionR13/);
 assert.match(source,/R13_REVISED_IDS/);
 assert.match(source,/R12_REVISED_IDS/);
});
