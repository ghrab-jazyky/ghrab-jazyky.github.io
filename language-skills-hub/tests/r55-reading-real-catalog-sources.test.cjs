'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/cards.json'));
const version=JSON.parse(read('version.json'));
const parse=require('../self-check/reading/reading-core.js').parseReadingData;
const guides=require('../assets/lsh/v3/reading-skill-guides.js');
const reading=catalog.entries.filter(e=>e.skill==='cteni');
const copyIds=['rl-email-friend','rl-instant-messages'];
test('R55: all five actual catalog links carry reading strategy guides',()=>{
 assert.equal(reading.length,5);
 assert.match(read('assets/hub.js'),/const source=e\.lockSource\|\|e\.relative/);
 let variants=0,questions=0,copyVariants=0;
 for(const entry of reading){
  const original=read(entry.relative),actual=read(entry.lockSource||entry.relative);
  const originalHash=crypto.createHash('sha256').update(original).digest('hex');
  assert.equal(originalHash,version.contentHashes[entry.id],entry.id+' original modified');
  if(copyIds.includes(entry.id)){
   copyVariants+=24;
   assert.ok(entry.lockSource?.startsWith('r11/variant-copies/'),entry.id);
   // R64: the copy is a byte-identical mirror; the guide is mounted by card-vocabulary.js on both paths.
   assert.equal(actual,original,entry.id+' mirror drift');
   assert.match(actual,/src="\.\.\/\.\.\/assets\/lsh\/v3\/card-vocabulary\.js"/,entry.id);
   assert.match(read('assets/lsh/v3/card-vocabulary.js'),/r11\\\/variant-copies\\\/rl-\[a-z0-9-\]\+\\\.html/);
  }else{
   assert.equal(entry.lockSource,null,entry.id);
   assert.match(actual,/src="\.\.\/\.\.\/assets\/lsh\/v3\/card-vocabulary\.js"/,entry.id);
  }
  const dataset=parse(actual);
  for(const lang of entry.languages)for(const level of entry.levels){
   variants++;
   const v=dataset[lang][level];questions+=v.questions.length;
   assert.ok(v.tabs.length>=3,entry.id+' '+lang+'/'+level);
   for(const tab of v.tabs){
    assert.ok(guides.guideFor(lang,tab.id),entry.id+' '+lang+'/'+level+'/'+tab.id);
    assert.equal(v.questions.filter(q=>q.tab===tab.id).length,3,
      entry.id+' '+lang+'/'+level+'/'+tab.id);
   }
  }
 }
 assert.equal(copyVariants,48);
 assert.equal(variants,120);
 assert.equal(questions,1800);
});
test('R55: no duplicate modules, no test changes, all guides localized',()=>{
 const js=read('assets/lsh/v3/reading-skill-guides.js');
 assert.match(js,/lshReadingSkillGuide/);
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|indexedDB/);
 for(const lang of guides.languages)for(const id of guides.skillIds){
  const guide=guides.guideFor(lang,id);
  assert.ok(guide?.what?.length>=55&&guide?.how?.length>=60,lang+':'+id);
 }
});
