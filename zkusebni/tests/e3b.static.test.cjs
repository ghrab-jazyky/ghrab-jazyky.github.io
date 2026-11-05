/* LSH E3B UI static tests – run with Node 22+: node --test zkusebni/tests/e3b.static.test.cjs */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('slovnicek/index.html');
const js=read('assets/lsh/v3/vocab.js');
const css=read('assets/lsh/v3/vocab.css');
const model=read('assets/lsh/v3/model.js');
const store=read('assets/lsh/v3/store.js');

test('all UI references have unique DOM IDs',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  const refs=[...js.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
  for(const ref of refs) assert.ok(ids.includes(ref),'Missing ID '+ref);
});
test('scripts load in dependency order',()=>{
  const urls=[...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1]);
  assert.deepEqual(urls,[
    '../assets/lsh/v2/config.js','../assets/lsh/v3/model.js',
    '../assets/lsh/v3/store.js','../assets/lsh/v3/vocab.js']);
});
test('no inline event handlers or untrusted DOM HTML',()=>{
  assert.match(html,/Content-Security-Policy/);
  assert.match(html,/script-src &#x27;self&#x27;/);
  assert.doesNotMatch(html,/\bon(?:click|change|load|error|submit)="[^"]+"/i);
  assert.doesNotMatch(js,/\.innerHTML\s*=/);
});
test('UI does not transmit local student data',()=>{
  assert.doesNotMatch(js,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/);
});
test('visible local-storage disclosure and safe import controls',()=>{
  for (const id of ['storageAlert','wordList','addWordForm','importBtn','exportBtn',
    'importReplace','practiceStart','reverseInput','practiceRating','editDialog'])
    assert.ok(html.includes('id="'+id+'"'),'Missing '+id);
  assert.match(html,/Nahradit vše/);
  assert.match(html,/prohlížeči/);
});
test('staging data namespace and schema limits',()=>{
  assert.match(store,/lsh-test/);
  assert.match(store,/options\.mode === 'staging'/);
  assert.match(model,/MAX_WORDS = 5000/);
  assert.match(model,/MAX_IMPORT_BYTES = 3 \* 1024 \* 1024/);
});
test('mobile styles and touch targets',()=>{
  assert.match(css,/@media\(max-width:600px\)/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/min-height:47px/);
});
