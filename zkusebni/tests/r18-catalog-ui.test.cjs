#!/usr/bin/env node
/* R18 static integrity and accessibility smoke for public teacher catalog. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),site=path.join(root,'language-skills-hub');
const read=p=>fs.readFileSync(path.join(site,p),'utf8');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
test('R18 nav, theme boot timing, two action buttons and accessible labels',()=>{
 const html=read('index.html'),css=read('assets/hub.css'),js=read('assets/hub.js'),boot=read('assets/theme-boot.js');
 const nav=html.match(/<nav class="menu"[\s\S]*?<\/nav>/)?.[0];
 assert.ok(nav,'Header navigation must exist');
 assert.match(nav,/href="#howto"/);
 assert.doesNotMatch(nav,/href="#catalog"|slovnicek|Můj slovníček/i);
 assert.match(html,/id="themeToggle"/);
 assert.match(html,/id="fullscreenToggle"/);
 assert.match(html,/aria-pressed="false"/);
 assert.match(html,/role="group" aria-label="Nastavení zobrazení"/);
 assert.match(html,/<html lang="cs" data-theme="dark">/);
 assert.ok(html.indexOf('src="assets/theme-boot.js"')<html.indexOf('href="assets/hub.css"'),
  'Persisted theme must be applied BEFORE CSS first paint');
 assert.match(boot,/localStorage\.getItem\('lsh:catalog-theme:v1'\)/);
 assert.match(js,/localStorage\.setItem\(THEME_KEY,next\)/);
 assert.match(js,/requestFullscreen/);assert.match(js,/exitFullscreen/);
 assert.match(js,/fullscreenchange/);assert.match(js,/aria-pressed/);
 assert.match(css,/:root\[data-theme="light"\]/);
 assert.match(css,/\.header-actions/);
 assert.match(css,/\.chrome-button/);
 assert.match(css,/@media\(max-width:680px\)/);
 for(const [name,src] of [['hub.js',js],['theme-boot.js',boot]])
  assert.doesNotThrow(()=>new vm.Script(src,{filename:name}));
 assert.doesNotMatch(html,/<script[^>]+src="https?:/);
 console.log('PASS R18 nav simplification, durable light/dark theme, fullscreen fallback and HTML semantics');
});
test('R18 did not alter 29 student HTML or test-mode restrictions',()=>{
 const catalog=JSON.parse(read('data/cards.json')),version=JSON.parse(read('version.json'));
 assert.equal(catalog.kind,'LSH_PUBLIC_PRACTICE_R17');
 assert.equal(catalog.entries.length,29);
 assert.equal(version.topicCount,29);assert.equal(version.variantCount,642);
 assert.equal(version.gradedTestsEnabled,false);assert.equal(catalog.gradedTestsEnabled,false);
 const tally={konverzace:0,cteni:0,poslech:0};
 let variants=0;
 for(const entry of catalog.entries){
  assert.ok(entry.skill in tally);tally[entry.skill]++;
  const bytes=fs.readFileSync(path.join(site,entry.relative));
  assert.equal(digest(bytes),version.contentHashes[entry.id],'Student card unexpectedly changed: '+entry.id);
  if(entry.lockSource)assert.ok(fs.existsSync(path.join(site,entry.lockSource)));
  variants+=entry.languages.length*entry.levels.length;
 }
 assert.deepEqual(tally,{konverzace:21,cteni:5,poslech:3});
 assert.equal(variants,642);
 console.log('PASS R18 29 original immutable cards, 642 variants, graded test disabled');
});
