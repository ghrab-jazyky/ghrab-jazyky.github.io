'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../assets/lsh/v2/core.js');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/manifest.json'),'utf8'));
test('R2: current 21 Conversation pilots are selectable; fictional Reading demo and absent Listening remain hidden',()=>{
  core.validateManifest(manifest);
  const selected=core.selectCatalogTopics(manifest);
  assert.ok(selected.filter(t=>t.skill==='konverzace').length>=21);
  assert.ok(selected.every(t=>t.demo===false && t.status!=='STAZENO'));
  assert.ok(selected.filter(t=>t.skill!=='konverzace').every(t=>t.status==='PUBLIKOVANO'));
});
test('R2: fail closed for drafts and withdrawn Reading/Listening, including forged publication date',()=>{
  for(const skill of ['cteni','poslech']){
    const fixture={skill,status:'ROZPRACOVANO',demo:false,publishedAt:null};
    assert.equal(core.isUnifiedSelectable(fixture),false);
    fixture.status='ZKONTROLOVANO';
    assert.equal(core.isUnifiedSelectable(fixture),false);
    fixture.status='PUBLIKOVANO';
    assert.equal(core.isUnifiedSelectable(fixture),false);
    fixture.publishedAt='not a date';
    assert.equal(core.isUnifiedSelectable(fixture),false);
    fixture.publishedAt='2026-11-06T06:00:00Z';
    assert.equal(core.isUnifiedSelectable(fixture),true);
    fixture.status='STAZENO';
    assert.equal(core.isUnifiedSelectable(fixture),false);
    fixture.status='PUBLIKOVANO';
    fixture.demo=true;
    assert.equal(core.isUnifiedSelectable(fixture),false);
  }
  assert.equal(core.isUnifiedSelectable(null),false);
  assert.equal(core.isUnifiedSelectable({skill:'other',status:'PUBLIKOVANO',demo:false,publishedAt:'2026-11-06'}),false);
});
test('R2: UI selector uses centralized safety predicate',()=>{
  const js=fs.readFileSync(path.join(__dirname,'../assets/lsh/v2/app.js'),'utf8');
  assert.match(js,/const topics = CORE\.selectCatalogTopics\(m,kind\)/);
});
