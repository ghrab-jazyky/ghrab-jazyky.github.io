'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const core=require('../self-check/reading/reading-core.js');
const entries=JSON.parse(read('data/cards.json')).entries.filter(e=>e.skill==='cteni');
const version=JSON.parse(read('version.json'));
test('R58: Reading TEST tabs mirror the immutable practice taxonomy in 120 variants',()=>{
 assert.equal(entries.length,5);
 let variants=0,questions=0,groups=0;
 for(const entry of entries){
  const html=read(entry.relative),hash=crypto.createHash('sha256').update(html).digest('hex');
  assert.equal(hash,version.contentHashes[entry.id],entry.id+' original source changed');
  const parsed=core.parseReadingData(html);
  for(const lang of entry.languages)for(const level of entry.levels){
   const v=core.variantFromData(parsed,lang,level);
   const tabs=new Set(v.tabs.map(tab=>tab.id));
   assert.equal(tabs.size,v.tabs.length,entry.id+' '+lang+'/'+level+' duplicate tabs');
   for(const tab of v.tabs){
    assert.ok(tab.title&&tab.title.length>2);
    const count=v.questions.filter(q=>q.tab===tab.id).length;
    assert.equal(count,3,entry.id+' '+lang+'/'+level+'/'+tab.id);
    groups++;
   }
   questions+=v.questions.length;
   variants++;
  }
 }
 assert.equal(variants,120);
 assert.equal(questions,1800);
 assert.ok(groups>400);
});
test('R58: Reading TEST exposes keyboard tabs, preserves every input and omits strategy guides',()=>{
 const js=read('self-check/reading/reading.js'),html=read('self-check/reading/index.html');
 const css=read('self-check/reading/reading.css');
 assert.match(html,/id="readingSkillTabs"[^>]+role="tablist"/);
 assert.match(js,/button\.setAttribute\('role','tab'\)/);
 assert.match(js,/stage\.setAttribute\('role','tabpanel'\)/);
 assert.match(js,/button\.dataset\.title=tab\.title/);
 assert.match(js,/selectSkillTab\(tabs\[next\]\.dataset\.skill,true\)/);
 for(const key of ['ArrowRight','ArrowLeft','Home','End'])assert.ok(js.includes(key));
 assert.match(js,/stage\.appendChild\(card\)/);
 assert.match(js,/variant\.questions\.reduce/);
 assert.match(js,/const report=core\.score\(variant,answers\)/);
 assert.match(js,/timedUI\?\.save\(\)/);
 assert.match(js,/restoreAnswers:saved=>/);
 assert.match(js,/for\(const input of \$\('questionList'\)\.querySelectorAll\('input'\)\)input\.disabled=true/);
 assert.match(css,/\.reading-skill-tab\[aria-selected="true"\]/);
 assert.match(css,/@media\(max-width:380px\)/);
 assert.doesNotMatch(js,/tab\.description|reading-skill-guides\.js|guideFor|Cambridge-style reading strategy/i);
 assert.doesNotMatch(html,/<script[^>]+reading-skill-guides/i);
 const catalog=JSON.parse(read('data/cards.json'));
 assert.equal(catalog.entries.length,29);
});
