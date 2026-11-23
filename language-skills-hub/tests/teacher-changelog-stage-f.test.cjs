'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=(f)=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const data=load('data/teacher-changelog.json');
const version=load('version.json');
const cards=load('data/cards.json');
const validate=require('../assets/whats-new-data.js').valid;
test('Stage F: curated release history is valid and chronological',()=>{
 assert.equal(validate(data),true);
 assert.deepEqual(data.releases.map(r=>r.sequence),[6,5,4,3,2,1]);
 assert.deepEqual(data.releases.map(r=>r.publishedAt),['2026-11-18','2026-11-18','2026-11-17','2026-11-16','2026-11-15','2026-11-14']);
 assert.equal(data.latestAnnouncementSequence,6);
 assert.equal(data.releases.reduce((n,r)=>n+r.changes.length,0),10);
 assert.equal(data.releases[0].changes.length,1);
 assert.equal(data.releases[0].id,'lsh-2026-11-18-reading-cefr-guidance');
 assert.match(data.releases[0].title,/Reading Lab/);
 assert.equal(data.releases[0].changes[0].area,'reading');
 assert.equal(data.releases[0].changes[0].category,'methodology');
 assert.match(data.releases[0].changes[0].description,/A1–B1/);
 assert.match(data.releases[0].changes[0].description,/B2–C2/);
 assert.match(data.releases[0].changes[0].description,/Show exact evidence/);
 assert.match(data.releases[1].title,/Plurál/);
 assert.ok(data.releases[1].changes.some(c=>c.description.includes('Conversation Lab')));
 assert.ok(data.releases[1].changes.some(c=>c.description.includes('A1 až C2')));
 assert.equal(data.releases[2].changes.length,3);
 assert.match(data.releases[2].title,/časovan/);
 assert.ok(data.releases[2].changes.some(c=>c.description.includes('Reading Lab i Listening Lab')));
 assert.ok(data.releases[2].changes.some(c=>c.description.includes('Vytvořit test a QR kód')));
});
test('Stage F: published history only describes deployed baseline topics',()=>{
 assert.equal(version.version,'R70-LISTENING-STUDIO-UNIFICATION');
 assert.equal(cards.entries.length,35);
 for(const id of ['cl-jidlo-piti-restaurace','ll-how-to-choose-your-news','ll-sad','ll-conlangs']){
  assert.ok(cards.entries.some(e=>e.id===id),id);
 }
});
test('Stage F: public notes exclude technical terms, URLs and answer keys',()=>{
 const body=data.releases.flatMap(r=>r.changes).map(c=>
  [c.title,c.description,c.teacherBenefit].join(' ')).join('\n');
 assert.doesNotMatch(body,/<|>|https?:|github|CI\/CD|SHA|commit|recovery|odemykac|serverový klíč|správné odpovědi|interní QA/i);
});
test('Stage F: no premature dated publication or unreviewed schema fields',()=>{
 const latestToday=new Date().toISOString().slice(0,10);
 for(const release of data.releases){
  assert.ok(release.publishedAt<=latestToday,'Future date: '+release.publishedAt);
  assert.deepEqual(Object.keys(release).sort(),['id','sequence','publishedAt','title','changes'].sort());
  for(const change of release.changes){
   assert.ok(change.teacherBenefit.length>=15);
   assert.deepEqual(Object.keys(change).sort(),['id','area','category','title','description','teacherBenefit'].sort());
  }
 }
});
