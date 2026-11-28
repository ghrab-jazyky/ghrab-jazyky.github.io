'use strict';
// F4.2 owner-approved D03 and D22 only. Reversible literal changes,
// not a general normalization of card bytes or question data.
const assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const BASE='fcfa2e4d7fb8a910d24c240e049cbf36ed86bd32';
const PRODUCTION='d8d032ee1fc51a009df3d20d8fb64135f9b23be3';
const ORIGINAL_SHA='59167c05eb80b492300b368fc0a1f45f19c1af6631d4a19c560dae98e0d45bac';
const ORIGINAL_BLOB='d0ddfe9aae769eff948ee7cf52092139678b64d3';
const PREVIOUS_SHA='f24232f5699b8f2f52313e91ccf74f559d5bd13aa0c07bec19ec46ad826f6788';
const PREVIOUS_BLOB='e0d9772e66b71564660dbcc4b249e39f2ddcfde1';
const EDITS=Object.freeze([
 {group:'D03',variant:'es/C2',id:'es-c2-critical-3',field:'q',answer:3,
  before:'¿Qué dato faltaría para afirmar que una desviación funcionaría ante una amenaza real?',
  after:'Según el autor, ¿qué condición adicional es decisiva para que una desviación sea eficaz, más allá de acertar en el asteroide?'},
 {group:'D03',variant:'de/C2',id:'de-c2-critical-3',field:'q',answer:2,
  before:'Welche Angabe fehlt noch, um zu behaupten, dass eine Ablenkung bei einer echten Bedrohung funktionieren würde?',
  after:'Welche zusätzliche Voraussetzung ist laut Text für eine wirksame Ablenkung entscheidend, über das bloße Treffen des Asteroiden hinaus?'},
 {group:'D03',variant:'fr/C2',id:'fr-c2-critical-3',field:'q',answer:3,
  before:'Quelle donnée manquerait pour affirmer qu’une déviation réussirait face à une menace réelle ?',
  after:'Selon le texte, quelle condition supplémentaire est décisive pour une déviation efficace, au-delà de la capacité à atteindre l’astéroïde ?'},
 {group:'D22',variant:'es/B2',id:'es-b2-inference-3',field:'choice',answer:0,
  before:'La respuesta más eficaz suele ser poco espectacular.',
  after:'La respuesta más eficaz puede ser poco espectacular.'},
 {group:'D22',variant:'de/B2',id:'de-b2-inference-3',field:'choice',answer:0,
  before:'Die wirksamste Antwort ist oft wenig spektakulär.',
  after:'Die wirksamste Antwort kann wenig spektakulär sein.'},
 {group:'D22',variant:'fr/B2',id:'fr-b2-inference-3',field:'choice',answer:2,
  before:'La réponse la plus efficace est souvent peu spectaculaire.',
  after:'La réponse la plus efficace peut être peu spectaculaire.'}
].map(Object.freeze));
const marker='<script type="application/json" id="lsh-smart-feedback-asteroids-v1">';
const sha=s=>createHash('sha256').update(s).digest('hex');
const blob=s=>createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
function one(s,a,b){assert.equal(s.split(a).length,2,'Expected one exact literal: '+a);return s.replace(a,b);}
function stripBank(s){
 assert.equal(s.split(marker).length,2);
 const start=s.indexOf(marker),end=s.indexOf('</script>\n',start);
 assert.ok(end>start);
 return s.slice(0,start)+s.slice(end+'</script>\n'.length);
}
function applySource(original){
 assert.equal(sha(original),ORIGINAL_SHA);assert.equal(blob(original),ORIGINAL_BLOB);
 let next=original;
 for(const e of EDITS)next=one(next,JSON.stringify(e.before),JSON.stringify(e.after));
 return next;
}
function revertSource(edited){
 let old=edited;
 for(const e of EDITS)old=one(old,JSON.stringify(e.after),JSON.stringify(e.before));
 assert.equal(sha(old),ORIGINAL_SHA);assert.equal(blob(old),ORIGINAL_BLOB);
 assert.equal(edited,applySource(old));
 return old;
}
function expectedData(core,old){
 const next=structuredClone(old);
 for(const e of EDITS){
  const [l,v]=e.variant.split('/'),q=next[l][v].questions.find(q=>q.id===e.id);
  assert.ok(q,e.id);assert.equal(q.answer,e.answer,e.id);
  if(e.field==='q'){assert.equal(q.q,e.before);q.q=e.after;}
  else{assert.equal(q.choices[e.answer],e.before);q.choices[e.answer]=e.after;}
 }
 return next;
}
// Translate only the approved presentation fields in old score reports.
// Everything else, including explanations and all numeric results, is compared.
function reviseReport(report){
 const next=structuredClone(report);
 for(const item of next.details){
  const e=EDITS.find(x=>x.id===item.id);if(!e)continue;
  assert.equal(item.correctIndex,e.answer);
  if(e.field==='q'){assert.equal(item.prompt,e.before);item.prompt=e.after;}
  else{
   assert.equal(item.correctAnswer,e.before);item.correctAnswer=e.after;
   if(item.selectedIndex===e.answer){assert.equal(item.selectedAnswer,e.before);item.selectedAnswer=e.after;}
  }
 }
 return next;
}
module.exports={BASE,PRODUCTION,ORIGINAL_SHA,ORIGINAL_BLOB,PREVIOUS_SHA,PREVIOUS_BLOB,EDITS,marker,sha,blob,one,stripBank,applySource,revertSource,expectedData,reviseReport};
