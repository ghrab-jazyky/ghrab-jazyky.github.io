/* R6 Conversation candidates — verification ONLY. Not a publication operation.
 * node zkusebni/tests/conversation-r6-candidates.test.cjs
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const LEVELS=['A1','A2','B1','B2','C1','C2'];
const LANGS=['en','es','de','fr'];
const bytes=p=>fs.readFileSync(path.join(ROOT,p));
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const blob=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${b.length}\0`),b])).digest('hex');
const mf=JSON.parse(bytes('data/conversation-r6-candidates.json'));
assert.equal(mf.schemaVersion,1);
assert.equal(mf.status,'CANDIDATES_ONLY');
assert.equal(mf.teacherApproval,false);
assert.equal(mf.published,false);
assert.equal(mf.catalogUpdated,false);
assert.equal(mf.cards.length,21);
assert.equal(new Set(mf.cards.map(v=>v.id)).size,21);
let variants=0,stations=0,questions=0;
const runtime=['../../assets/lsh/v2/lock.js','../../assets/lsh/v3/card-bridge.css','../../assets/lsh/v3/model.js','../../assets/lsh/v3/store.js','../../assets/lsh/v3/card-bridge.js'];
for(const c of mf.cards){
 assert.match(c.id,/^cl-[a-z0-9]+(?:-[a-z0-9]+)*$/);
 assert.equal(c.candidatePath,'konverzace/k/'+c.id+'.html');
 assert.ok(c.originalPath.endsWith('/index.html'));
 const source=bytes(c.candidatePath),text=source.toString('utf8');
 assert.equal(sha256(source),c.candidateSha256,'Candidate SHA changed '+c.id);
 assert.equal(blob(source),c.candidateGitBlob,'Candidate Git blob changed '+c.id);
 const current=bytes(c.originalPath);
 assert.equal(blob(current),c.originalGitBlob,'Canonical source drift; do not overwrite '+c.id);
 assert.ok(text.includes('data-lsh-topic-id="'+c.id+'"'),'Wrong embedded ID '+c.id);
 assert.ok(text.includes('CATALOG_PRESET_V1'),'No URL preset '+c.id);
 assert.equal((text.match(/<\/body>/g)||[]).length,1);
 assert.equal((text.match(/<\/html>/g)||[]).length,1);
 for(const relative of runtime)assert.ok(text.includes(relative),'Missing local dependency '+c.id+': '+relative);
 assert.ok(!/<script[^>]+src=["']https?:/i.test(text),'External script '+c.id);
 assert.ok(!/\b(?:OPENAI|ANTHROPIC)_API_KEY\b|ghp_[A-Za-z0-9]{25,}|sk-proj-[A-Za-z0-9_-]{22,}|-----BEGIN [\w ]*PRIVATE KEY-----/.test(text),'Potential private credential '+c.id);
 const scripts=[...text.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert.equal(scripts.length,1,'Unexpected inline scripts '+c.id);
 new vm.Script(scripts[0][1],{filename:c.candidatePath});
 const cssHash=crypto.createHash('sha256').update(scripts[0][1],'utf8').digest('base64');
 const hashes=[...text.matchAll(/sha256-([A-Za-z0-9+/]{43}=)/g)];
 assert.equal(hashes.length,1,'Unexpected CSP hash count '+c.id);
 assert.equal(hashes[0][1],cssHash,'CSP hash invalid '+c.id);
 const prefix='const CONTENT = ';
 const pos=text.indexOf(prefix),tail=text.indexOf(';\nconst ORDER = ',pos);
 assert.ok(pos>=0&&tail>pos,'Cannot parse CONTENT '+c.id);
 const data=JSON.parse(text.slice(pos+prefix.length,tail));
 assert.deepEqual(Object.keys(data).sort(),LANGS.slice().sort(),'Language coverage '+c.id);
 for(const lang of LANGS){
  assert.deepEqual(Object.keys(data[lang].levels).sort(),LEVELS.slice().sort(),'CEFR coverage '+c.id+'/'+lang);
  for(const level of LEVELS){
   const v=data[lang].levels[level];
   assert.equal(v.stations.length,8,'Station count '+c.id+'/'+lang+'/'+level);
   assert.equal(v.vocab.length,12,'Vocabulary count '+c.id+'/'+lang+'/'+level);
   assert.equal(v.toolkit.length,4,'Toolkit count '+c.id+'/'+lang+'/'+level);
   for(const station of v.stations){
    assert.ok(station.title&&station.main&&Array.isArray(station.support)&&station.support.length>0&&station.challenge&&station.stretch,'Incomplete station '+c.id);
    assert.equal(station.questions.length,3,'Followup count '+c.id+'/'+lang+'/'+level);
    assert.ok(station.questions.every(q=>typeof q==='string'&&q.trim()),'Empty followup '+c.id);
    stations++;questions+=station.questions.length;
   }
   variants++;
  }
 }
}
assert.equal(variants,504);assert.equal(stations,4032);assert.equal(questions,12096);
console.log('PASS R6 CANDIDATES ONLY: 21 sources, 504 variants, 4032 stations, 12096 followups, CSP, JS, source drift, secrets, unchanged publication gate');
