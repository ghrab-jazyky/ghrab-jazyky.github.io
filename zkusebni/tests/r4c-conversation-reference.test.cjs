'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const file=p=>fs.readFileSync(path.join(root,p));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const refPath='reference/konverzace/umela-inteligence/index.html';
const auditPath='docs/CONVERSATION_LAB_REFERENCE_AUDIT_PROMPT_2026-11-06.txt';
const originalHash='0598c67e27a126385875155310a042104c2f1fafa59cbec0884d4deef58a7813';
const auditHash='647691791aa7d68a5b343fdd2e923e2b5b6afc2094aeb47cef070f85f24e3eaf';
function content(){
 const s=file(refPath).toString('utf8'),start='const CONTENT = ';
 const a=s.indexOf(start),b=s.indexOf(';\nconst ORDER = ',a);
 assert.ok(a>0&&b>a,'Original DATA/ORDER markers');
 return JSON.parse(s.slice(a+start.length,b));
}
test('R4C: the selected Conversation reference and teacher audit prompt preserve original bytes',()=>{
 const html=file(refPath),prompt=file(auditPath);
 assert.equal(html.length,1088624);
 assert.equal(sha(html),originalHash);
 assert.equal(sha(prompt),auditHash);
 assert.match(html.toString('utf8').slice(0,400),/Artificial Intelligence/);
 assert.match(prompt.toString('utf8').slice(0,180),/AUDIT KONVERZAČNÍ KARTY/);
});
test('R4C: 24 variants, 192 stations, 576 subquestions, complete higher-level explanations',()=>{
 const data=content(),lang=['en','es','de','fr'],level=['A1','A2','B1','B2','C1','C2'];
 assert.deepEqual(Object.keys(data).sort(),lang.sort());
 let variants=0,stations=0,questions=0,explanations=0,mainExplains=0;
 for(const lg of lang){
  const all=data[lg];
  assert.deepEqual(Object.keys(all.levels).sort(),level.slice().sort());
  for(const lv of level){
   const v=all.levels[lv];variants++;
   assert.ok(v.warm&&v.warm.length>10);
   assert.equal(v.stations.length,8);
   assert.equal(v.vocab.length,12);
   assert.equal(v.toolkit.length,4);
   const questionTexts=new Set();
   for(const [i,s] of v.stations.entries()){
    stations++;
    for(const field of ['title','subtitle','main','challenge','stretch'])
     assert.ok(typeof s[field]==='string'&&s[field].length>5,lg+lv+i+' missing '+field);
    assert.ok(Array.isArray(s.support)&&s.support.length>=3);
    assert.equal(s.questions.length,3,lg+lv+i);
    questions+=s.questions.length;
    for(const q of s.questions){
     assert.ok(typeof q==='string'&&q.length>8);
     assert.ok(!questionTexts.has(q),lg+lv+' duplicated follow-up');
     questionTexts.add(q);
    }
    if(['B2','C1','C2'].includes(lv)){
     assert.equal(s.explanations?.length,3,lg+lv+i+' must explain all three questions');
     assert.ok(s.mainExplanation?.length>30,lg+lv+i+' main explain required');
     explanations+=3;mainExplains++;
    }
   }
  }
 }
 assert.equal(variants,24);
 assert.equal(stations,192);
 assert.equal(questions,576);
 assert.equal(explanations,288);
 assert.equal(mainExplains,96);
});
test('R4C: public TEST-only selection preserves existing catalog card, keys, history and real student publication state',()=>{
 const meta=JSON.parse(file('data/conversation-reference-provenance.json').toString('utf8'));
 const inv=JSON.parse(file('data/editorial-inventory.json').toString('utf8'));
 const manifest=JSON.parse(file('data/manifest.json').toString('utf8'));
 const published=file('konverzace/umela-inteligence/index.html');
 const uploaded=file(refPath);
 assert.equal(meta.originalSha256,originalHash);
 assert.equal(meta.originalBytes,1088624);
 assert.equal(meta.visibility,'PUBLIC_TEST_ONLY');
 assert.equal(meta.pedagogicallyApproved,false);
 assert.equal(meta.supervisedTestModeImplemented,false);
 assert.equal(inv.referenceCandidates.konverzace.id,'cl-umela-inteligence');
 assert.equal(inv.referenceCandidates.konverzace.approved,false);
 assert.ok(manifest.topics.some(t=>t.id==='cl-umela-inteligence'));
 assert.notEqual(sha(published),sha(uploaded),'Reference source must not silently replace existing catalog HTML');
 assert.deepEqual(fs.readdirSync(path.join(root,'reference','konverzace','umela-inteligence')).sort(),['index.html']);
 assert.doesNotMatch(file('revize/index.html').toString('utf8'),/href="\.\.\/reference\/konverzace\/umela-inteligence\/teacher/i);
 const qa=file('revize/index.html').toString('utf8');
 assert.match(qa,/konverzace-ai-reference/);
 assert.match(qa,/Rodina \(starší kontrolní záznamy\)/);
 assert.match(qa,/reference\/konverzace\/umela-inteligence\//);
});
test('R4C: original is fully self-contained, no external script sources or key-bearing student URLs',()=>{
 const s=file(refPath).toString('utf8');
 assert.equal((s.match(/<script\b/gi)||[]).length,1);
 assert.equal((s.match(/<style\b/gi)||[]).length,1);
 assert.doesNotMatch(s,/<script[^>]+src=/i);
 assert.doesNotMatch(s,/https?:\/\//i);
 assert.doesNotMatch(s,/<iframe[^>]+src=/i);
 assert.match(s,/const CZ_GLOSSARY = /);
 assert.match(s,/const STORAGE = 'conversation-lab-ai-master-v1'/);
});
