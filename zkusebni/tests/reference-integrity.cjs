/* Language Skills Hub R5: verify reference originals remain intact and pilot adapters parse.
 * Run: node zkusebni/tests/reference-integrity.cjs
 * This test performs no network requests and never loads teacher answer keys.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const original=[
 {id:'cl-umela-inteligence',original:'reference/konverzace/umela-inteligence/index.html',
  integrated:'integrace/konverzace/umela-inteligence/index.html',
  sha:'0598c67e27a126385875155310a042104c2f1fafa59cbec0884d4deef58a7813'},
 {id:'rl-asteroids',original:'nahledy/cteni/asteroids/index.html',
  integrated:'integrace/cteni/asteroids/index.html',
  sha:'fc667a52f5f48407aa10dea31adda836ffdc88008e206a46727e94cc9991f82b'},
 {id:'ll-matthew-oscars',original:'reference/poslech/matthew-mcconaughey/index.html',
  integrated:'integrace/poslech/matthew-mcconaughey/index.html',
  sha:'403022392cbd045cef72ed3554960f922f81545e5e077ad2d1fc9be2ad91a1df'}
];
const inventory=JSON.parse(read('data/reference-pilots.json'));
assert.equal(inventory.schemaVersion,1);
assert.equal(inventory.approvedForTeaching,false);
assert.equal(inventory.entries.length,5,'Pilot consists of 3 references and 2 migration candidates');
assert.equal(inventory.entries.filter(e=>e.isReference).length,3);
assert.equal(inventory.entries.filter(e=>!e.isReference).length,2);
assert.equal(new Set(inventory.entries.map(e=>e.id)).size,5);
const isJS=s=>!/^\s*(?:\{)/.test(s);
for(const t of original){
 const before=read(t.original),after=read(t.integrated);
 const ref=inventory.entries.find(e=>e.id===t.id);
 assert.ok(ref,'Missing reference '+t.id);
 assert.equal(ref.studentPath,t.integrated.replace(/index\.html$/,''));
 assert.equal(ref.fixedVariantSupported,true);
 assert.equal(ref.practice,'preview');
 assert.equal(ref.test,'not-ready');
 assert.equal(ref.selfContainedHtml,true);
 const checksum=crypto.createHash('sha256').update(before,'utf8').digest('hex');
 assert.equal(checksum,t.sha,'Original checksum mismatch for '+t.id);
 const adapter=/<script>\n\/\* LSH-R5 variant bridge:[\s\S]*?<\/script>\n/g;
 assert.equal([...after.matchAll(adapter)].length,1,'Exactly one adapter required');
 const restored=after.replace(adapter,'');
 assert.equal(restored,before,'Original student data changed in '+t.id);
 assert.ok(after.includes('window.LSH_OFFLINE_QS||location.search'),'Offline preset missing');
 assert.ok(after.includes("p.get('zamek')==='1'"),'Fixed variant lock missing');
 const scripts=[...after.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 assert.ok(scripts.length>=2,'Expected inline script plus adapter');
 for(let n=0;n<scripts.length;n++){
  const code=scripts[n][1];
  if(isJS(code))new vm.Script(code,{filename:t.integrated+'#'+n});
 }
 console.log('PASS',t.id,'source intact; JS scripts:',scripts.length);
}

/* Stage R5E: two already-public conversation HTML files remain byte-exact
 * and are surfaced only as unapproved pilots. Git blob SHA verifies bytes. */
const migrants=[
 {id:'cl-socialni-media',file:'konverzace/socialni-media/index.html',blob:'c81683e238dcdb96f3d4f39768a5d2d0d9b5f0da'},
 {id:'cl-hrani-her',file:'konverzace/hrani-her/index.html',blob:'1cafcbaa0a9f35d2ff1d0a152e915c5010743364'}
];
for(const candidate of migrants){
 const buffer=fs.readFileSync(path.join(root,candidate.file));
 const gitBlob=Buffer.concat([Buffer.from('blob '+buffer.length+'\0'),buffer]);
 const checksum=crypto.createHash('sha1').update(gitBlob).digest('hex');
 assert.equal(checksum,candidate.blob,'Original migrated candidate source changed: '+candidate.id);
 const html=buffer.toString('utf8');
 const item=inventory.entries.find(x=>x.id===candidate.id);
 assert.ok(item&&item.isReference===false&&item.test==='not-ready','Candidate must remain unapproved');
 assert.equal(item.studentPath,candidate.file.replace(/index\.html$/,''));
 assert.equal(item.selfContainedHtml,false,'Cannot claim standalone offline HTML with relative JS assets');
 for(const piece of ['data-lsh-topic-id="'+candidate.id+'"','id="languageSelect"','id="levelSwitch"',
   '../../assets/lsh/v2/lock.js','../../assets/lsh/v3/model.js',
   '../../assets/lsh/v3/store.js','../../assets/lsh/v3/card-bridge.js',
   'CATALOG_PRESET_V1','const clbPreset = new URLSearchParams(window.location.search)']){
  assert.ok(html.includes(piece),'Missing URL/CEFR/bridge contract: '+piece+' in '+candidate.id);
 }
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 const inline=scripts.map(x=>x[1]).filter(x=>x.trim());
 assert.equal(inline.length,1,'Expected single existing inline Conversation engine');
 new vm.Script(inline[0],{filename:candidate.file});
 const token=html.match(/sha256-([A-Za-z0-9+/=]+)/)?.[1];
 assert.ok(token,'Original Conversation CSP hash missing');
 assert.equal(crypto.createHash('sha256').update(inline[0]).digest('base64'),token,
  'Conversation inline CSP hash must match source; UI scripts would otherwise be blocked');
 console.log('PASS',candidate.id,'original blob and CSP intact, URL and shared bridge present');
}

const ui=read('assets/lsh/v4/reference-pilots.js');
new vm.Script(ui,{filename:'reference-pilots.js'});
for(const feature of ['function refreshShare()','function saveHtml()',"url.searchParams.set('zamek','1')",
 "url.searchParams.set('practice','1')",'LSH_OFFLINE_QS']){
 assert.ok(ui.includes(feature),'Missing catalog feature: '+feature);
}

/* Verify every pilot URL variant without trusting a card's advertised label. */
const block=ui.match(/function urlOf\(entry,mode,lang,level\)\{[\s\S]*?\n\}/);
assert.ok(block,'Missing URL builder');
const makeUrl=vm.runInNewContext('const ROOT="/zkusebni/"; const location={origin:"https://ghrab-jazyky.github.io"};('+block[0]+')',{URL,Error});
let checkedVariants=0;
for(const entry of inventory.entries){
 const free=new URL(makeUrl(entry,'free',entry.defaultLanguage,entry.defaultLevel));
 assert.equal(free.searchParams.get('practice'),'1');
 assert.equal(free.searchParams.has('zamek'),false);
 assert.equal(free.searchParams.has('level'),false);
 for(const language of entry.languages){
  for(const level of entry.levels){
   const target=new URL(makeUrl(entry,'fixed',language,level));
   assert.equal(target.origin,'https://ghrab-jazyky.github.io');
   assert.equal(target.pathname,'/zkusebni/'+entry.studentPath);
   assert.equal(target.searchParams.get('lang'),language);
   assert.equal(target.searchParams.get('level'),level);
   assert.equal(target.searchParams.get('zamek'),'1');
   assert.equal(target.searchParams.get('practice'),'1');
   checkedVariants++;
  }
 }
 if(entry.skill==='poslech')assert.throws(()=>makeUrl(entry,'fixed','es','B2'));
}
assert.equal(checkedVariants,5*24-18,'Five pilot topic variants must cover 102 combinations');
console.log('PASS',checkedVariants,'fixed URLs + 5 free URLs across pilots');

const doc=read('reference-karty/index.html');
for(const required of ['id="refMode"','id="refShareLang"','id="refShareLevel"','id="refSaveHtml"','id="refQr"']){
 assert.ok(doc.includes(required),'Missing dialog control: '+required);
}
console.log('PASS R5E pilot catalog: 3 original references, 2 unchanged Conversation candidates');
