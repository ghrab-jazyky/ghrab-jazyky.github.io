'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const MODEL=require('../assets/lsh/v3/model.js');
const STORE=require('../assets/lsh/v3/store.js');
const MIGRATION=require('../assets/lsh/v3/legacy-reading-migration.js');
test('R57: catalog has one header how-to modal and no footer help section',()=>{
 const h=read('index.html'),js=read('assets/hub.js'),css=read('assets/hub.css');
 assert.match(h,/<button[^>]+id="howtoOpen"[^>]+aria-haspopup="dialog"/);
 assert.match(h,/<dialog id="howto"[^>]+aria-labelledby="howTitle"/);
 assert.match(h,/<button[^>]+id="howtoClose"[^>]+aria-label="Zavřít nápovědu"/);
 assert.doesNotMatch(h,/<section id="howto"/);
 assert.ok(h.indexOf('<dialog id="howto"')>h.indexOf('</main>'));
 assert.equal((h.match(/Jak aktivity používat/g)||[]).length,1);
 for(const title of ['Procvičování:','VÝSLEDKY u karty Reading a Listening:','TEST (Reading a Listening):'])
  assert.ok(h.includes(title),title);
 assert.match(js,/howtoDialog.showModal\(\)/);
 assert.match(js,/howtoDialog.close\(\)/);
 assert.match(css,/dialog\.howto-dialog/);
 assert.match(h,/<dialog id="qrDialog"/,'share modal remains present');
});
test('R57: atomic whole-bank deletion preserves exercise answers and blocks auto legacy migration',async()=>{
 const db=STORE.createStore({mode:'production',indexedDB:null,BroadcastChannel:null,storage:null});
 await db.open();
 await db.addManualWord({language:'en',term:'apple',translationCs:'jablko'},
 '2026-11-12T00:00:00.000Z',{randomUUID:()=>'11111111-1111-4111-8111-111111111111'});
 await db.addManualWord({language:'es',term:'libro',translationCs:'kniha'},
 '2026-11-12T00:00:00.000Z',{randomUUID:()=>'22222222-2222-4222-8222-222222222222'});
 await db.saveAnswers({skill:'cteni',topicId:'rl-asteroids',language:'en',level:'B1',
  dataVersion:'r57-test',answers:{},activePart:null},'2026-11-12T00:00:00.000Z');
 assert.equal((await db.listWords()).length,2);
 assert.equal(await db.wasWordsCleared(),false);
 const backup=await db.exportWords('2026-11-12T00:00:00.000Z');
 const cleared=await db.clearAllWords();
 assert.equal(cleared.count,0);
 assert.equal(cleared.storedInIndexedDB,false);
 assert.equal((await db.listWords()).length,0);
 assert.equal(await db.wasWordsCleared(),true);
 assert.equal((await db.getAnswers('cteni','rl-asteroids','en','B1')).dataVersion,'r57-test');
 const result=await MIGRATION.migrate(db,{indexedDB:null,localStorage:{getItem:()=>null}});
 assert.equal(result.imported,0);
 const restored=await db.importWords(backup,{replace:false});
 assert.equal(restored.count,2);
 assert.equal(await db.wasWordsCleared(),true);
 db.close();
});
test('R57: delete-all needs a confirmation and remains local-only, not a bulk delete of assessments',()=>{
 const page=read('slovnicek/index.html'),ui=read('slovnicek/vocabulary.js');
 const store=read('assets/lsh/v3/store.js'),migration=read('assets/lsh/v3/legacy-reading-migration.js');
 assert.match(page,/id="deleteAllWords"[^>]+disabled/);
 assert.match(page,/id="clearVocabularyDialog"/);
 assert.match(page,/id="cancelClearWords"/);
 assert.match(page,/id="confirmClearWords"/);
 assert.match(page,/Stáhnout zálohu/);
 assert.match(ui,/store\.clearAllWords\(\)/);
 assert.match(ui,/clearDialog\.showModal\(\)/);
 assert.match(ui,/clearDialog\.close\(\)/);
 assert.match(ui,/wasWordsCleared\(\)/);
 assert.match(migration,/wasWordsCleared/);
 assert.match(store,/db\.transaction\(\['words','meta'\],'readwrite'\)/);
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|deleteDatabase/);
 assert.match(page,/connect-src 'none'/);
});
