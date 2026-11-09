#!/usr/bin/env node
/* R21: all 29 cards, 642 variants, two explicit share modes, NO graded testing. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const base=path.resolve(__dirname,'../../language-skills-hub');
const read=name=>fs.readFileSync(path.join(base,name),'utf8');
const source=JSON.parse(read('data/cards.json')),version=JSON.parse(read('version.json'));
const i18n=JSON.parse(read('data/catalog-i18n.json'));
const js=read('assets/hub.js'),html=read('index.html'),css=read('assets/hub.css');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
test('R21 user-facing controls, selectable links, WCAG labels and accessible raw URL field',()=>{
 assert.match(html,/<dialog id="qrDialog"[^>]*aria-labelledby="qrTitle"/);
 assert.match(html,/<fieldset class="share-mode">/);
 assert.match(html,/id="shareFree"[^>]*name="shareMode" value="free" checked/);
 assert.match(html,/id="shareFixed"[^>]*name="shareMode" value="fixed"/);
 assert.match(html,/id="shareFixedFields" hidden/);
 assert.match(html,/id="shareLanguage"/);
 assert.match(html,/id="shareLevel"/);
 assert.match(html,/<textarea id="qrUrl"[^>]*readonly/);
 assert.match(html,/id="qrCopy"[^>]*disabled/);
 assert.match(html,/id="qrSave"[^>]*disabled/);
 assert.match(html,/id="qrMount"/);
 assert.match(html,/Sdílet se studenty/);
 assert.doesNotMatch(html,/QR a odkaz/);
 assert.match(html,/Uzamčení je pouze v uživatelském rozhraní/);
 assert.match(html,/Nejde o zabezpečený ani klasifikovaný test/);
 assert.match(html,/aria-describedby="shareStatus"/);
 assert.match(js,/function makeShareUrl\(/);
 assert.match(js,/if\(mode==='free'\)return url\.href/);
 assert.match(js,/url\.searchParams\.set\('zamek','1'\)/);
 assert.match(js,/share\.addEventListener\('click',\(\)=>openShare\(e\)\)/);
 assert.match(js,/field\.select\(\)/);
 assert.match(js,/field\.setSelectionRange\(0,field\.value\.length\)/);
 assert.match(js,/navigator\.clipboard\.writeText\(qrUrl\)/);
 assert.match(js,/qrMount\.replaceChildren\(\)/);
 assert.match(js,/const svg=window\.CLBQRCode\.svg\(qrUrl\)/);
 assert.match(js,/shareEntry=null;qrUrl=''/);
 assert.match(js,/byId\('shareFree'\)\.checked=true/);
 assert.match(js,/byId\('shareFixedFields'\)\.hidden=!fixed/);
 assert.doesNotMatch(js,/QR a odkaz/);
 assert.match(css,/dialog\.share-dialog/);
 assert.match(css,/@media\(max-width:380px\)/);
 assert.match(css,/share-option:has\(input:checked\)/);
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.equal(html.includes('<script src="http'),false);
 console.log('PASS R21 explicit teacher/student choice, raw copyable link, QR preview, responsive and secure-by-description UI');
});
test('R21 all 29 card URLs free without constraints and 642 fixed presets',()=>{
 const begin=js.indexOf('function makeShareUrl('),end=js.indexOf('function updateSharePreview(',begin);
 assert.ok(begin>=0&&end>begin);
 const sourceFn=js.slice(begin,end).trim();
 const fn=vm.runInNewContext('('+sourceFn+')',{
  URL,document:{baseURI:'https://example.test/language-skills-hub/'}
 },{timeout:5000});
 let count=0;
 for(const e of source.entries){
  const expectedPath='/language-skills-hub/'+(e.lockSource||e.relative);
  const free=fn(e,'free','','');
  const p=new URL(free);
  assert.equal(p.pathname,expectedPath);
  assert.deepEqual([...p.searchParams.keys()],['practice']);
  assert.equal(p.searchParams.get('practice'),'1');
  assert.equal(p.searchParams.has('zamek'),false);
  assert.equal(p.searchParams.has('lang'),false);
  assert.equal(p.searchParams.has('level'),false);
  const invalid=fn(e,'fixed','zz','B2');
  assert.equal(invalid,'');
  assert.equal(fn(e,'fixed',e.languages[0],'D4'),'');
  assert.equal(fn(e,'missing',e.languages[0],'B2'),'');
  for(const lang of e.languages)for(const level of e.levels){
   const fixed=new URL(fn(e,'fixed',lang,level));
   assert.equal(fixed.pathname,expectedPath);
   assert.deepEqual([...fixed.searchParams.keys()],['practice','lang','level','zamek']);
   assert.equal(fixed.searchParams.get('practice'),'1');
   assert.equal(fixed.searchParams.get('lang'),lang);
   assert.equal(fixed.searchParams.get('level'),level);
   assert.equal(fixed.searchParams.get('zamek'),'1');
   count++;
  }
 }
 assert.equal(source.entries.length,29);
 assert.equal(count,642);
 console.log('PASS R21 all 29 free URLs + 642 fixed variant URLs use correct path and parameters');
});
test('R21 live practice cards unchanged, 4 R11 lock bridges retained, no classified grading',()=>{
 const expected={konverzace:21,cteni:5,poslech:3},count={konverzace:0,cteni:0,poslech:0};
 assert.equal(version.topicCount,29);
 assert.equal(version.variantCount,642);
 assert.equal(version.gradedTestsEnabled,false);
 assert.equal(source.gradedTestsEnabled,false);
 assert.equal(i18n.kind,'LSH_CATALOG_I18N_R20');
 assert.equal(Object.keys(i18n.entries).length,29);
 const convoLock=read('assets/lsh/v2/lock.js');
 assert.match(convoLock,/zámek pouze v rozhraní/);
 assert.match(convoLock,/langSelect\.disabled = true/);
 let bridges=0;
 for(const e of source.entries){
  count[e.skill]++;
  assert.equal(sha(fs.readFileSync(path.join(base,e.relative))),version.contentHashes[e.id],
   'Student HTML changed: '+e.id);
  const pathToUse=e.lockSource||e.relative;
  const html=read(pathToUse);
  assert.ok(html.length>10000);
  if(e.lockSource)bridges++;
  if(e.skill==='konverzace'){
   assert.match(html,/lsh\/v2\/lock\.js/);
   assert.match(html,/new URLSearchParams\(/);
  }else{
   assert.match(html,/getAll\('zamek'\)/,'Missing UI-only share bridge '+e.id);
  }
 }
 assert.deepEqual(count,expected);
 assert.equal(bridges,4);
 console.log('PASS R21 29 SHA-256 identical cards, 4 R11 fixes, 642 variants, NO graded test');
});
