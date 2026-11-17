'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const api=require('../assets/whats-new-data.js');
const data=JSON.parse(fs.readFileSync(path.join(root,'data/teacher-changelog.json'),'utf8'));
const schema=JSON.parse(fs.readFileSync(path.join(root,'data/teacher-changelog.schema.json'),'utf8'));
const example=()=>({kind:'LSH_TEACHER_CHANGELOG_V1',schemaVersion:1,latestAnnouncementSequence:1,contentRevision:1,releases:[{
 id:'lsh-2026-11-16-example',sequence:1,publishedAt:'2026-11-16',title:'Demonstrační změny při výuce',
 changes:[{id:'example-change',area:'reading',category:'content',title:'Přehlednější materiály',
 description:'Ukázkový text pro testování struktury katalogu bez produkčního zveřejnění.',
 teacherBenefit:'Zlepšuje orientaci ve výukových materiálech.'}]}]});
test('Stage D: publication source and schema valid',()=>{
 assert.equal(api.valid(data),true);
 assert.equal(schema.$schema,'https://json-schema.org/draft/2020-12/schema');
 assert.equal(schema.additionalProperties,false);
});
test('Stage D: valid synthetic publication',()=>assert.equal(api.valid(example()),true));
test('Stage D: reject injected HTML and unknown fields',()=>{
 const a=example();a.releases[0].changes[0].description='<script>alert(1)</script>';
 assert.equal(api.valid(a),false);
 const b=example();b.releases[0].changes[0].hiddenKey='secret';
 assert.equal(api.valid(b),false);
});
test('Stage D: reject duplicates and stale sequence',()=>{
 const a=example();a.latestAnnouncementSequence=0;assert.equal(api.valid(a),false);
 const b=example();b.releases.push({...b.releases[0]});assert.equal(api.valid(b),false);
});
test('Stage D: reject impossible dates and incomplete content',()=>{
 const a=example();a.releases[0].publishedAt='2026-02-30';assert.equal(api.valid(a),false);
 const b=example();delete b.releases[0].changes[0].teacherBenefit;assert.equal(api.valid(b),false);
});
test('Stage D: markup and documented first-person teacher text',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(html,/id="whatsNewOpen"/);
 assert.match(html,/Připravil jsem krátký přehled toho, co je v LSH nového/);
 assert.match(html,/id="skillChooser"/);
 assert.doesNotMatch(html,/DEMO ·|ZATÍM NENÍ SOUČÁSTÍ PRODUKCE/);
});
test('Stage D: classroom assessment policy stays unchanged',()=>{
 const policy=JSON.parse(fs.readFileSync(path.join(root,'data/test-mode-policy.json'),'utf8'));
 assert.equal(policy.backendEnabled,false);assert.equal(policy.officialGradesEnabled,false);
});
test('Stage D: deep-link, initial timer and changelog handler remain separate',()=>{
 const hub=fs.readFileSync(path.join(root,'assets/hub.js'),'utf8');
 assert.match(hub,/if\(allowed\.has\(chosen\)\)/);
 assert.match(hub,/introTimer=setTimeout\(finishIntro,reduced\?0:3000\)/);
 assert.match(hub,/function openChooserFromWelcome\(\)/);
 assert.match(hub,/byId\('skipIntro'\)\.addEventListener\('click',openChooserFromWelcome\)/);
 assert.match(hub,/function showChooser\(\)/);
});
