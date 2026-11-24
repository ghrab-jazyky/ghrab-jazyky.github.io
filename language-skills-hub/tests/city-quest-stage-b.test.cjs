#!/usr/bin/env node
'use strict';
// Stage B regression: optional CEFR B2-C2 oral reflection, no grading.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'konverzace/city-quest-f2/index.html'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
const crypto=require('node:crypto');
const local=['en','es','de','fr'],levels=['B2','C1','C2'];
const inlineName='  const cqAdvancedOracy=';
const snapshot=html.split('\n').find(s=>s.startsWith(inlineName));
assert.ok(snapshot);
const embedded=JSON.parse(snapshot.slice(inlineName.length,-1));
const findJSON=name=>{
 const token='  const '+name+'=';
 const line=html.split('\n').find(s=>s.startsWith(token));
 assert.ok(line,'Missing authored data '+name);
 return JSON.parse(line.slice(token.length,-1));
};
test('Stage B: 144 oral missions unchanged and native-language review text is synchronized',()=>{
 let count=0;
 for(const lang of local){
  const p=path.resolve(root,'../docs/city-quest/stage3-oracy-'+lang+'.json');
  const file=JSON.parse(fs.readFileSync(p,'utf8'));
  assert.deepEqual(embedded[lang],file,lang+' authoring/inline drift');
  for(const key of ['reviewPrompt','reviewProgress','reviewDone','partnerConfirm','partnerNote']){
   assert.ok(file.ui[key]&&file.ui[key].length>=15,lang+'/'+key);
  }
  for(const mode of ['city','metro']){
   for(const [mission,byLevel] of Object.entries(file[mode])){
    for(const level of levels){
     assert.ok(byLevel[level].length>=75,lang+'/'+mode+'/'+mission+'/'+level);
     count++;
    }
   }
  }
 }
 assert.equal(count,144);
 assert.match(embedded.fr.ui.partnerConfirm,/\u202f:/);
});
test('Stage B: classroom context is students, not adult colleagues in ES/DE C1',()=>{
 const clues=findJSON('advancedExploreClues');
 assert.match(clues.es.C1[4],/compañeros de clase/);
 assert.match(clues.de.C1[4],/Mitschüler/);
 assert.doesNotMatch(JSON.stringify(clues.es),/\bcolegas\b/i);
 assert.doesNotMatch(JSON.stringify(clues.de),/\bKollegen\b/);
});
test('Stage B: checkboxes are optional, held in local memory and reset with session',()=>{
 assert.match(html,/oracyReview:Object\.create\(null\)/);
 assert.match(html,/function oracyReviewFor\(n\)/);
 assert.match(html,/review\.checks\[index\]=check\.checked/);
 assert.match(html,/partner\.dataset\.cqPartnerConfirm="true"/);
 assert.match(html,/delete state\.oracyReview\[oracyReviewKey\(n\)\]/);
 assert.match(html,/delete state\.oracyReview\["metro:"\+n\]/);
 assert.match(html,/makeSession\(lang,level,mode\)/);
 assert.doesNotMatch(html,/SpeechRecognition|webkitSpeechRecognition|navigator\.mediaDevices\.getUserMedia/);
 assert.match(html,/connect-src 'none'/);
 assert.ok(html.includes('No speech recording, recognition, grading, storage or progression gate.'));
});
test('Stage B: CSP and manifest match the exact offline candidate',()=>{
 const sha=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
 assert.equal(sha(html),manifest.contentHashes['cl-city-quest-f2']);
 const csp=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1]||'';
 for(const kind of ['script','style']){
  const block=html.match(new RegExp('<'+kind+'>([\\s\\S]*?)</'+kind+'>'));
  assert.ok(block);
  const base64=crypto.createHash('sha256').update(block[1],'utf8').digest('base64');
  assert.ok(csp.includes(kind+"-src 'sha256-"+base64+"'"));
 }
});
