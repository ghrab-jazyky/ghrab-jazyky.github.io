#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {webcrypto}=require('node:crypto');
const helper=require('../slovnicek/backup-safety.js');
const W={id:'manual:11111111-1111-4111-8111-111111111111',language:'en',term:'apple',translationCs:'jablko'};
const X={id:'manual:22222222-2222-4222-8222-222222222222',language:'es',term:'libro',translationCs:'kniha'};
test('R43 SHA-256 backup signature detects edits and deletions independent of ordering',async()=>{
 const ab=await helper.fingerprint([W,X],webcrypto);
 const ba=await helper.fingerprint([X,W],webcrypto);
 const edited=await helper.fingerprint([{...W,translationCs:'jablíčko'},X],webcrypto);
 const removed=await helper.fingerprint([W],webcrypto);
 assert.match(ab,/^[a-f0-9]{64}$/);assert.equal(ab,ba);assert.notEqual(ab,edited);assert.notEqual(ab,removed);
 assert.throws(()=>helper.canonical([null]));assert.throws(()=>helper.canonical(new Array(5001).fill(W)));
});
test('R43 backup status never mistakes a prepared or missing file for an external backup',async()=>{
 const digest=await helper.fingerprint([W],webcrypto),now=Date.UTC(2026,10,11);
 assert.equal(helper.assessment(0,null,digest,now).state,'empty');
 assert.equal(helper.assessment(1,null,digest,now).state,'missing');
 assert.equal(helper.assessment(1,{hash:digest,at:now-1000},digest,now).state,'ok');
 assert.equal(helper.assessment(1,{hash:digest,at:now-1000},'f'.repeat(64),now).state,'changed');
 assert.equal(helper.assessment(1,{hash:digest,at:now-helper.WEEK-10},digest,now).state,'old');
 assert.equal(helper.assessment(1,{hash:digest,at:now+60},digest,now).state,'missing');
});
test('R43 platform warning explains Safari risk and remains honest on Android',()=>{
 assert.match(helper.appleWarning('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'),/Safari/);
 assert.match(helper.appleWarning('Mozilla/5.0 (Macintosh; Intel Mac OS X)',5),/QR/);
 assert.match(helper.appleWarning('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',0,true),/nevztahuje/);
 assert.match(helper.appleWarning('Mozilla/5.0 (Macintosh; Intel Mac OS X) Version/18.0 Safari/605.1.15',0),/Macu/);
 assert.match(helper.appleWarning('Mozilla/5.0 (Linux; Android 15)',0),/Místní úložiště/);
});
test('R43 zero-server contract: no backend, no outbound API or account, no card edits',()=>{
 const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const page=read('slovnicek/index.html'),ui=read('slovnicek/backup-ui.js'),guard=read('slovnicek/backup-safety.js');
 assert.match(page,/connect-src 'none'/);assert.match(page,/id="shareBackupBtn"/);
 assert.match(page,/id="confirmBackupBtn"/);assert.match(page,/id="importFile"/);
 assert.match(page,/id="exportBtn"/);assert.match(page,/src="backup-ui\.js"/);assert.match(page,/src="backup-safety\.js"/);
 assert.ok(page.indexOf('src="backup-safety.js"')<page.indexOf('src="backup-ui.js"'),'Shared backup helper must load first');
 assert.doesNotMatch(ui,/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|https?:\/\//);
 assert.doesNotMatch(guard,/\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
 assert.doesNotMatch(ui,/localStorage\.setItem\s*\(\s*['"]student/i);
 assert.match(ui,/navigator\.share\(\{files:/);
 assert.match(read('slovnicek/vocabulary.js'),/createStore\(\{mode:'production'\}\)/);
 const v=JSON.parse(read('version.json'));assert.equal(v.topicCount,32);assert.equal(v.variantCount,678);
});
