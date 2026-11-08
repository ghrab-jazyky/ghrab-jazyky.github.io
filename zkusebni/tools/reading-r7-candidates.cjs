#!/usr/bin/env node
/* R7: Generate source-preserving Reading matching corrections.
 * Never touch original HTML, catalogue, public manifest or private teacher answer keys.
 * node zkusebni/tools/reading-r7-candidates.cjs <OUTPUT-DIRECTORY>
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.argv[2]||path.join(root,'_qa-reading-r7'));
const plan=JSON.parse(fs.readFileSync(path.join(root,'data/reading-r7-matching-proposals.json'),'utf8'));
const sources=[
 {id:'rl-email-friend',file:'nahledy/cteni/email-friend/index.html',blob:'9178645eaa2d4fcd522a8a52bf2cd4741dfce05f'},
 {id:'rl-instant-messages',file:'nahledy/cteni/instant-messages/index.html',blob:'274140b4799bfaef6125063e554b86d741d01289'}
];
assert.equal(plan.schemaVersion,1);
assert.equal(plan.status,'REVIEW_CANDIDATES_ONLY');
assert.equal(plan.teacherApproval,false);
assert.equal(plan.published,false);
assert.equal(plan.privateTeacherKeyRevalidationRequired,true);
assert.equal(plan.patches.length,16);
const uniq=new Set(plan.patches.map(p=>p.topicId+'/'+p.language+'/'+p.level+'/'+p.questionId));
assert.equal(uniq.size,16);
const gitBlob=src=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+src.length+'\0'),src])).digest('hex');
const sha256=src=>crypto.createHash('sha256').update(src).digest('hex');
const payload=src=>{const a=src.indexOf('const DATA='),b=src.indexOf(';\n',a);assert.ok(a>=0&&b>a);return JSON.parse(src.slice(a+'const DATA='.length,b));};
const manifest={schemaVersion:1,kind:'READING_R7_CANDIDATES_ONLY',approvedForRelease:false,
 teacherApproval:false,testModeReady:false,privateTeacherKeyRevalidationRequired:true,cards:[]};
let replacements=0;
fs.mkdirSync(out,{recursive:true});
for(const s of sources){
 const bytes=fs.readFileSync(path.join(root,s.file));
 assert.equal(gitBlob(bytes),s.blob,'Historical original changed: '+s.id);
 const initial=bytes.toString('utf8');
 let html=initial;
 const before=payload(initial);
 const expected=structuredClone(before);
 const patches=plan.patches.filter(p=>p.topicId===s.id);
 assert.equal(patches.length,s.id==='rl-email-friend'?4:12);
 for(const p of patches){
  assert.equal(p.sourceGitBlob,s.blob);
  assert.ok(['en','es','de','fr'].includes(p.language));
  assert.ok(['B2','C1','C2'].includes(p.level));
  const original=before[p.language][p.level];
  const updated=expected[p.language][p.level];
  const oldQ=original.questions.filter(q=>q.kind==='match')[p.matchingIndex];
  const newQ=updated.questions.filter(q=>q.kind==='match')[p.matchingIndex];
  assert.ok(oldQ&&newQ,'Missing target');
  assert.equal(oldQ.id,p.questionId);
  assert.equal(oldQ.answer,p.oldAnswerIndex);
  assert.equal(p.newAnswerIndex,2);
  assert.notEqual(oldQ.answer,p.newAnswerIndex,'Already fixed '+p.questionId);
  assert.ok(oldQ.choices[p.newAnswerIndex]);
  assert.equal(p.newEvidence.p,2);
  assert.ok(original.paragraphs[2].includes(p.newEvidence.text),'Evidence not exact: '+p.questionId);
  assert.ok(p.newQuestion.length>=24&&p.newExplanation.length>=24);
  newQ.q=p.newQuestion;
  newQ.answer=p.newAnswerIndex;
  newQ.evidence=[p.newEvidence];
  newQ.explanation=p.newExplanation;
  const oldLiteral=JSON.stringify(oldQ);
  assert.equal(html.split(oldLiteral).length,2,'Non-unique original question payload: '+p.questionId);
  html=html.replace(oldLiteral,JSON.stringify(newQ));
  replacements++;
 }
 let improvedExplanation=null;
 if(s.id==='rl-email-friend'){
  const oldQ=before.de.B2.questions.find(q=>q.id==='de-b2-matching-2');
  const newQ=expected.de.B2.questions.find(q=>q.id==='de-b2-matching-2');
  assert.ok(oldQ&&newQ&&oldQ.kind==='match');
  assert.equal(oldQ.explanation,'Das Sofa.');
  assert.equal(oldQ.answer,3);
  assert.ok(oldQ.evidence.some(a=>a.p===3&&before.de.B2.paragraphs[a.p].includes(a.text)));
  newQ.explanation='Im letzten Absatz bietet Lena einen Schlafplatz an: „Auf meinem Sofa ist Platz“.';
  const literal=JSON.stringify(oldQ);
  assert.equal(html.split(literal).length,2,'Expected one German B2 matching explanation');
  html=html.replace(literal,JSON.stringify(newQ));
  improvedExplanation={language:'de',level:'B2',questionId:oldQ.id};
 }
 const after=payload(html);
 assert.deepEqual(after,expected,'Unexpected data modification in '+s.id);
 // The source is byte-identical outside the 16 specified question objects.
 for(const lang of ['en','es','de','fr'])for(const level of ['B2','C1','C2']){
  const v=after[lang][level],matches=v.questions.filter(q=>q.kind==='match');
  assert.equal(matches.length,3,s.id+'/'+lang+'/'+level+' missing matching task');
  assert.equal(new Set(matches.map(q=>q.answer)).size,3,s.id+'/'+lang+'/'+level+' matching target repeats');
  for(const q of v.questions){
   assert.ok(q.answer>=0&&q.answer<q.choices.length);
   for(const ev of q.evidence||[])assert.ok(v.paragraphs[ev.p].includes(ev.text),'Broken evidence: '+s.id+'/'+lang+'/'+level+'/'+q.id);
  }
 }
 for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)){
  new vm.Script(script[1],{filename:s.id});
 }
 const file=s.id+'.html';
 const written=path.join(out,file);
 fs.writeFileSync(written,html,'utf8');
 assert.notEqual(sha256(fs.readFileSync(written)),sha256(bytes));
 manifest.cards.push({topicId:s.id,originalSource:s.file,originalGitBlob:s.blob,
  sourceSha256:sha256(bytes),candidateFile:file,candidateSha256:sha256(Buffer.from(html,'utf8')),
  repairedQuestions:patches.map(x=>({language:x.language,level:x.level,questionId:x.questionId,kind:'match',evidenceParagraph:3})),
  improvedExplanations:improvedExplanation?[improvedExplanation]:[],
  teacherApproval:false,published:false});
}
assert.equal(replacements,16);
fs.writeFileSync(path.join(out,'R7_CANDIDATES_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(out,'README.md'),[
 '# Reading Lab R7 – pouze kandidáti na obsahové opravy','',
 'Změněny přesně dvě kopie studentských HTML: 16 Multiple Matching otázek (4 v Email, 12 v Instant Messages) a 1 slabé vysvětlení v Email DE B2.',
 'Zachovány originální soubory, texty, všechny jiné úlohy a veškeré odpovědi mimo vybrané matching položky.',
 'Nové odpovědi jsou indexovány na třetí odstavec a mají přesnou evidence citaci.',
 'Ověřena jedinečnost tří cílových odstavců na všech úrovních B2–C2 a v EN/ES/DE/FR.',
 'Kandidáti nejsou publikováni do studentského katalogu a jejich soukromé učitelské klíče NEBYLY přegenerovány.',
 'Před vydáním je nutné zkontrolovat pedagogickou vhodnost a učitelský klíč, URL/QR, offline a fyzické zařízení.',
 'Počet témat katalogu se nemění. Testovací režim zůstává vypnutý.',''].join('\n'));
console.log('PASS READING R7 CANDIDATES: two original sources unchanged; 16 question objects replaced in offline QA outputs');
console.log('PASS 24 matching sets across two sources (four languages x B2/C1/C2): three distinct source paragraphs');
console.log('CANDIDATE CHECKSUMS:',JSON.stringify(manifest.cards.map(c=>({topicId:c.topicId,sha256:c.candidateSha256}))));
