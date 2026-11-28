'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const load=(f)=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const data=load('data/teacher-changelog.json');
const version=load('version.json');
const cards=load('data/cards.json');
const validate=require('../assets/whats-new-data.js').valid;
const crypto=require('node:crypto');
test('Stage F: curated release history is valid and chronological',()=>{
 assert.equal(validate(data),true);
 assert.deepEqual(data.releases.map(r=>r.sequence),[10,9,8,7,6,5,4,3,2,1]);
 assert.deepEqual(data.releases.map(r=>r.publishedAt),['2026-11-28','2026-11-27','2026-11-23','2026-11-23','2026-11-18','2026-11-18','2026-11-17','2026-11-16','2026-11-15','2026-11-14']);
 assert.equal(data.latestAnnouncementSequence,10);
 assert.equal(data.releases.reduce((n,r)=>n+r.changes.length,0),14);
 assert.equal(data.contentRevision,6);
 assert.equal(data.releases[0].id,'lsh-2026-11-28-asteroids-smart-feedback');
 assert.deepEqual(data.releases[0],{"id":"lsh-2026-11-28-asteroids-smart-feedback","sequence":10,"publishedAt":"2026-11-28","title":"Reading Lab: Smart Feedback pro Asteroids","changes":[{"id":"reading-asteroids-smart-feedback-v1","area":"reading","category":"methodology","title":"Podrobná zpětná vazba na kartě Asteroids","description":"Po dokončení testu na kartě Asteroids si studenti mohou zvolit podrobnou zpětnou vazbu ke svým chybným a nezodpovězeným otázkám. Uvidí vysvětlení, konkrétní oporu v textu a radu, jak podobnou úlohu zvládnout příště. Novinka je dostupná v angličtině, španělštině, němčině a francouzštině na úrovních A1–C2. Bodování a kompletní učitelský export zůstávají zachovány. Pro načtení testu je stále potřeba připojení k internetu.","teacherBenefit":"Studenti mohou samostatně rozebrat příčinu chyby a učitel může navázat cílenou konzultací bez změny dosavadního vyhodnocování testu."}]});
 // Exact preservation of the previously published nine entries is enforced
 // by a content hash of the canonical JSON projection.
 const former={...data,latestAnnouncementSequence:9,contentRevision:5,releases:data.releases.slice(1)};
 assert.equal(crypto.createHash('sha1').update(Buffer.from('blob '+Buffer.byteLength(JSON.stringify(former,null,2)+'\n')+'\0'+JSON.stringify(former,null,2)+'\n')).digest('hex'),'00844bb43af772585fb45d9c766adac549ddd512');
 assert.equal(data.releases[1].id,'lsh-2026-11-27-christmas-quest-preview');
 assert.equal(data.releases[1].changes.length,1);
 assert.match(data.releases[1].changes[0].description,/není možné ji běžně spustit ani sdílet se studenty/);
 assert.equal(data.releases[2].id,'lsh-2026-11-23-pwa-installation');
 assert.equal(data.releases[2].changes.length,1);
 assert.match(data.releases[2].changes[0].description,/sedm dní/);
 assert.equal(data.releases[3].id,'lsh-2026-11-23-city-quest');
 assert.match(data.releases[3].changes[0].title,/City Quest/);
 const history=data.releases.slice(4);
 assert.equal(history[0].id,'lsh-2026-11-18-reading-cefr-guidance');
 assert.match(history[0].title,/Reading Lab/);
 assert.equal(history[0].changes[0].area,'reading');
 assert.equal(history[0].changes[0].category,'methodology');
 assert.match(history[0].changes[0].description,/A1–B1/);
 assert.match(history[0].changes[0].description,/B2–C2/);
 assert.match(history[0].changes[0].description,/Show exact evidence/);
 assert.match(history[1].title,/Plurál/);
 assert.ok(history[1].changes.some(c=>c.description.includes('Conversation Lab')));
 assert.ok(history[1].changes.some(c=>c.description.includes('A1 až C2')));
 assert.equal(history[2].changes.length,3);
 assert.match(history[2].title,/časovan/);
 assert.ok(history[2].changes.some(c=>c.description.includes('Reading Lab i Listening Lab')));
 assert.ok(history[2].changes.some(c=>c.description.includes('Vytvořit test a QR kód')));
});
test('Stage F: published history only describes deployed baseline topics',()=>{
 assert.equal(version.version,'R70-LISTENING-STUDIO-UNIFICATION');
 assert.equal(cards.entries.length,36);
 for(const id of ['cl-christmas-quest','cl-city-quest-f2','cl-jidlo-piti-restaurace','ll-how-to-choose-your-news','ll-sad','ll-conlangs']){
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
