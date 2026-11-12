#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/cards.json'));
const manifest=JSON.parse(read('version.json'));
const parse=require('../self-check/reading/reading-core.js').parseReadingData;
const cards=catalog.entries.filter(e=>e.skill==='cteni');
const hasWord=ch=>!!ch&&/[\p{L}\p{M}\p{N}]/u.test(ch);
function findNth(hay,needle,occ){
 let from=0,n=0;
 while(true){
  const at=hay.indexOf(needle,from);
  if(at<0)return -1;
  if(!hasWord(hay[at-1])&&!hasWord(hay[at+needle.length])&&++n===occ)return at;
  from=at+1;
 }
}
test('R44: five cards, 120 variants, 1800 unchanged questions and all 391 exact source targets',()=>{
 assert.equal(cards.length,5);
 let variants=0,questions=0,targetMatches=0,evidenceMatches=0,withLocate=0;
 for(const entry of cards){
  const source=read(entry.relative);
  assert.equal(crypto.createHash('sha256').update(source).digest('hex'),manifest.contentHashes[entry.id],entry.id);
  const data=parse(source);
  assert.equal(Object.keys(data).length,4,entry.id);
  for(const lang of entry.languages)for(const level of entry.levels){
   const v=data[lang][level];
   variants++;
   assert.equal(v.questions.length,{A1:9,A2:9,B1:12,B2:18,C1:21,C2:21}[level],entry.id+' '+lang+'/'+level);
   questions+=v.questions.length;
   assert.equal(v.questions.length,new Set(v.questions.map(q=>q.id)).size,'Duplicate question ID '+entry.id+' '+lang+'/'+level);
   for(const q of v.questions){
    const list=(Array.isArray(q.target)?[q.target]:[]).concat(Array.isArray(q.targets)?q.targets:[]);
    if(list.length)withLocate++;
    for(const target of list){
     assert.equal(Array.isArray(target),true,entry.id+' '+q.id);
     const [p,needle,occ]=target;
     assert.ok(typeof v.paragraphs[p]==='string',entry.id+' '+lang+'/'+level+' '+q.id);
     assert.ok(findNth(v.paragraphs[p],needle,occ||1)>=0,'Unmatched source target '+entry.id+' '+lang+'/'+level+' '+q.id+' '+needle);
     targetMatches++;
    }
    assert.ok(Array.isArray(q.evidence)&&q.evidence.length>0,'No evidence '+entry.id+' '+lang+'/'+level+' '+q.id);
    for(const item of q.evidence){
     assert.ok(v.paragraphs[item.p]?.includes(item.text),'Bad supporting passage '+entry.id+' '+lang+'/'+level+' '+q.id);
     evidenceMatches++;
    }
   }
  }
 }
 assert.equal(variants,120);
 assert.equal(questions,1800);
 assert.equal(targetMatches,391);
 assert.equal(withLocate,389);
 assert.ok(evidenceMatches>=1800);
});
test('R44: all five practice cards have exactly one return route with language labels',()=>{
 const script=read('assets/lsh/reading-return.js');
 const css=read('assets/lsh/reading-return.css');
 const ast=read('cteni/asteroids/index.html');
 assert.match(ast,/id="backToQuestion"/);
 assert.match(ast,/Reading Lab navigation v2\.2/);
 assert.doesNotMatch(ast,/reading-return\.js/);
 for(const entry of cards.filter(x=>x.id!=='rl-asteroids')){
  const s=read(entry.relative);
  assert.match(s,/href="\.\.\/\.\.\/assets\/lsh\/reading-return\.css"/,entry.id);
  assert.match(s,/src="\.\.\/\.\.\/assets\/lsh\/reading-return\.js"/,entry.id);
  assert.doesNotMatch(s,/id="backToQuestion"/,'UI must not duplicate return control');
  assert.match(s,/function locateTarget\(/);
  assert.match(s,/function showEvidence\(/);
 }
 for(const label of ['Back to question','Volver a la pregunta','Zurück zur Frage','Retour à la question'])
  assert.ok(script.includes(label));
 assert.match(script,/requestAnimationFrame/);
 assert.match(script,/preventScroll:true/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/@media print/);
 assert.doesNotMatch(script,/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage\.(?:clear|setItem)/);
});
