#!/usr/bin/env node
/* R19 static: full viewport intro, exactly three labs, optional filters.
 * Prohibit student-source and teacher-key changes.
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),base=path.join(root,'language-skills-hub');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('R19 exactly three selectable skills, dismissible splash and optional language/CEFR',()=>{
 const html=read('index.html'),js=read('assets/hub.js'),css=read('assets/hub.css');
 assert.match(html,/id="welcome" class="welcome"/);
 assert.match(html,/id="skillChooser"[^>]*role="dialog" aria-modal="true"/);
 assert.match(html,/id="skipIntro"/);
 assert.match(html,/id="closeChooser"/);
 assert.match(html,/id="changeLab"/);
 assert.equal((html.match(/data-choose-skill="/g)||[]).length,3);
 for(const skill of ['konverzace','cteni','poslech'])
  assert.ok(html.includes('data-choose-skill="'+skill+'"'));
 assert.match(html,/21<\/strong>/);assert.match(html,/5<\/strong>/);assert.match(html,/3<\/strong>/);
 assert.match(html,/Tři dovednosti/);assert.match(html,/Jedno místo/);
 assert.match(html,/Všechny jazyky/);assert.match(html,/Všechny úrovně/);
 assert.match(html,/value="all" selected/);
 assert.match(html,/id="catalog" aria-labelledby="catalogTitle" hidden/);
 assert.doesNotMatch(html,/class="tabs"/);
 assert.doesNotMatch(html,/<script[^>]+src="https?:/);
 assert.match(js,/setTimeout\(showChooser,reduced\?0:3000\)/);
 assert.match(js,/matchMedia\('\(prefers-reduced-motion:reduce\)'\)/);
 assert.match(js,/window\.addEventListener\('popstate',restoreLocation\)/);
 assert.match(js,/history\.pushState/);
 assert.match(js,/history\.replaceState/);
 assert.match(js,/if\(language!=='all'&&level!=='all'/);
 assert.match(js,/url\.searchParams\.set\('zamek','1'\)/);
 assert.match(css,/\.welcome\{/);assert.match(css,/min-height:100dvh/);
 assert.match(css,/\.chooser-grid\{/);assert.match(css,/\[hidden\]\{display:none!important\}/);
 assert.match(css,/@media\(max-width:370px\)/);
 assert.match(css,/:root\[data-theme="light"\] \.welcome/);
 assert.doesNotThrow(()=>new vm.Script(js,{filename:'hub.js'}));
 console.log('PASS R19 3-second welcome, 3 labs, optional filters, deep links and responsive UX');
});
test('R19 retains R18 controls, original 29 cards and 642 variants (NO grading)',()=>{
 const html=read('index.html'),js=read('assets/hub.js');
 const c=JSON.parse(read('data/cards.json')),v=JSON.parse(read('version.json'));
 assert.match(html,/id="themeToggle"/);assert.match(html,/id="fullscreenToggle"/);
 assert.match(js,/localStorage\.setItem\(THEME_KEY,next\)/);
 assert.match(js,/requestFullscreen/);
 const nav=html.match(/<nav class="menu"[\s\S]*?<\/nav>/)?.[0];
 assert.ok(nav);assert.match(nav,/Jak to funguje/);
 assert.doesNotMatch(nav,/slovnicek|Katalog aktivit/i);
 assert.equal(c.entries.length,29);assert.equal(v.topicCount,29);
 assert.equal(v.variantCount,642);assert.equal(v.gradedTestsEnabled,false);
 assert.equal(c.gradedTestsEnabled,false);
 const tally={konverzace:0,cteni:0,poslech:0};
 let variants=0;
 for(const e of c.entries){
  tally[e.skill]++;
  assert.equal(hash(fs.readFileSync(path.join(base,e.relative))),v.contentHashes[e.id],e.id);
  if(e.lockSource)assert.ok(fs.existsSync(path.join(base,e.lockSource)));
  variants+=e.languages.length*e.levels.length;
 }
 assert.deepEqual(tally,{konverzace:21,cteni:5,poslech:3});
 assert.equal(variants,642);
 console.log('PASS 29 immutable student cards, 642 variants, R18 controls, test NO-GO');
});
