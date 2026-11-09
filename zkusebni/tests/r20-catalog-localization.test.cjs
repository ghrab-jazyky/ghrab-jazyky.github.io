#!/usr/bin/env node
/* R20 teacher catalog localization – deterministic metadata, source integrity,
 * no private teacher keys, no change to students or classified test policy.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const base=path.resolve(__dirname,'../../language-skills-hub');
const read=x=>fs.readFileSync(path.join(base,x),'utf8');
const source=JSON.parse(read('data/cards.json'));
const i18n=JSON.parse(read('data/catalog-i18n.json'));
const version=JSON.parse(read('version.json'));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
test('R20 covers exactly 29 topics and 136 language records, with no missing locales',()=>{
 assert.equal(i18n.kind,'LSH_CATALOG_I18N_R20');
 assert.equal(i18n.schemaVersion,1);assert.equal(i18n.defaultLanguage,'cs');
 assert.equal(Object.keys(i18n.entries).length,29);
 const ids=new Set(source.entries.map(x=>x.id));
 assert.equal(ids.size,29);
 let count=0;
 const titleKeys=new Set();
 for(const e of source.entries){
  const row=i18n.entries[e.id];
  assert.ok(row,'Missing topic '+e.id);
  const expected=['cs',...e.languages].sort();
  assert.deepEqual(Object.keys(row).sort(),expected,'Unsupported/missing language for '+e.id);
  for(const language of expected){
   const text=row[language];
   assert.ok(text&&typeof text.title==='string'&&typeof text.summary==='string',e.id+language);
   assert.ok(text.title.trim().length>=2&&text.title===text.title.trim(),e.id+language);
   assert.ok(text.summary.trim().length>=10&&text.summary===text.summary.trim(),e.id+language);
   assert.doesNotMatch(text.title+text.summary,/<|>|[\u0000-\u0008]/);
   const key=e.skill+'|'+language+'|'+text.title.toLocaleLowerCase(language);
   assert.ok(!titleKeys.has(key),'Ambiguous translated title: '+key);
   titleKeys.add(key);count++;
  }
  if(e.skill==='poslech')assert.deepEqual(Object.keys(row).sort(),['cs','en']);
 }
 assert.equal(count,136);
 assert.deepEqual(Object.keys(i18n.entries).sort(),[...ids].sort());
 assert.equal(i18n.entries['cl-skola'].cs.title,'Škola');
 assert.equal(i18n.entries['rl-asteroids'].cs.title,'Asteroidy');
 assert.equal(i18n.entries['rl-can-mistakes'].cs.title,'Mohou nám chyby pomoci v učení?');
 assert.equal(i18n.entries['rl-asteroids'].fr.title,'Astéroïdes');
 assert.equal(i18n.entries['ll-peaky-no-fighting'].en.title,'Peaky Blinders – No Fighting');
 console.log('PASS R20 29 topics x 136 supported language records, no missing target translations');
});
test('R20 catalog renders as text, localized search and teacher controls remain Czech',()=>{
 const js=read('assets/hub.js'),html=read('index.html'),css=read('assets/hub.css');
 assert.doesNotThrow(()=>new vm.Script(js,{filename:'assets/hub.js'}));
 assert.match(js,/LSH_CATALOG_I18N_R20/);
 assert.match(js,/new Map\(Object\.entries\(i18n\.entries\)\)/);
 assert.match(js,/title\.lang=language/);
 assert.match(js,/summary\.lang=language/);
 assert.match(js,/const subtitle=one\('p','catalog-czech'/);
 assert.match(js,/normalizeSearch/);
 assert.match(js,/\.localeCompare\(/);
 assert.match(js,/byId\('qrTitle'\)\.textContent=qrTitle/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.match(js,/new URL\(source,document\.baseURI\)/);
 assert.match(js,/url\.searchParams\.set\('zamek','1'\)/);
 assert.match(js,/setTimeout\(showChooser,reduced\?0:3000\)/);
 assert.match(js,/const THEME_KEY/);
 assert.match(js,/requestFullscreen/);
 assert.match(css,/\.catalog-summary/);assert.match(css,/\.catalog-czech/);
 assert.match(html,/Výchozí názvy a popisy|Bez filtrů jsou všechny názvy a popisy česky/);
 assert.match(html,/id="welcome" class="welcome"/);
 assert.match(html,/id="themeToggle"/);assert.match(html,/id="fullscreenToggle"/);
 assert.match(html,/id="skillChooser"/);
 assert.doesNotMatch(html,/<script[^>]+src="https?:/);
 console.log('PASS R20 safe text-only i18n, CS controls, R18/R19 preserved and QR labels localized');
});
test('R20 student source cards are byte-identical and classified tests remain disabled',()=>{
 assert.equal(source.kind,'LSH_PUBLIC_PRACTICE_R17');
 assert.equal(source.gradedTestsEnabled,false);assert.equal(version.gradedTestsEnabled,false);
 assert.equal(version.topicCount,29);assert.equal(version.variantCount,642);
 let variants=0;const tally={konverzace:0,cteni:0,poslech:0};
 for(const e of source.entries){
  tally[e.skill]++;variants+=e.languages.length*e.levels.length;
  assert.equal(hash(fs.readFileSync(path.join(base,e.relative))),version.contentHashes[e.id],
   'Changed student card bytes: '+e.id);
  if(e.lockSource)assert.ok(fs.existsSync(path.join(base,e.lockSource)));
 }
 assert.equal(variants,642);assert.deepEqual(tally,{konverzace:21,cteni:5,poslech:3});
 assert.equal(Object.keys(version.contentHashes).length,29);
 console.log('PASS R20 original 29 card SHA-256 matches; 642 links unchanged; classified mode disabled');
});
