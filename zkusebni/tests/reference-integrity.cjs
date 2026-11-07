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
assert.equal(inventory.entries.length,3);
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
const ui=read('assets/lsh/v4/reference-pilots.js');
new vm.Script(ui,{filename:'reference-pilots.js'});
for(const feature of ['function refreshShare()','function saveHtml()',"url.searchParams.set('zamek','1')",
 "url.searchParams.set('practice','1')",'LSH_OFFLINE_QS']){
 assert.ok(ui.includes(feature),'Missing catalog feature: '+feature);
}
const doc=read('reference-karty/index.html');
for(const required of ['id="refMode"','id="refShareLang"','id="refShareLevel"','id="refSaveHtml"','id="refQr"']){
 assert.ok(doc.includes(required),'Missing dialog control: '+required);
}
console.log('PASS R5 reference pilot catalog + 3 intact source references');
