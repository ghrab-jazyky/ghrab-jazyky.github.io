/* LSH E3C – structural, CSP and semantic integration checks.
   Run from repo: node --test zkusebni/tests/e3c.test.cjs
   No browser/device assertions are made by this suite. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..');
const stage=path.join(root,'zkusebni');
const {patchCard}=require('./e3c.patch.cjs');
const BRIDGE=require('../assets/lsh/v3/card-bridge.js');
const MODEL=require('../assets/lsh/v3/model.js');
const manifest=JSON.parse(fs.readFileSync(path.join(stage,'data/manifest.json'),'utf8'));
const topics=manifest.topics.filter(t=>t.skill==='konverzace');
const NOW='2026-11-05T11:00:00.000Z';
function readCard(base,slug){
  return fs.readFileSync(path.join(base,'konverzace',slug,'index.html'),'utf8');
}
function extractData(source,label){
  const token='const '+label+' = ';
  const start=source.indexOf(token);
  assert.notEqual(start,-1,label+' not found');
  const end=source.indexOf(';\n',start+token.length);
  assert.ok(end>start,label+' terminator not found');
  return JSON.parse(source.slice(start+token.length,end));
}
test('manifest: 21 conversation cards, exactly 24 language × level variants each',()=>{
  assert.equal(topics.length,21);
  for(const t of topics){
    assert.equal(t.id,'cl-'+t.slug);
    assert.equal(t.variants.length,24);
    const combos=new Set(t.variants.map(v=>v.lang+':'+v.level));
    assert.equal(combos.size,24);
  }
});
test('all 21 staged cards match deterministic patch of the untouched original',()=>{
  for(const topic of topics){
    const original=readCard(root,topic.slug);
    const staged=readCard(stage,topic.slug);
    assert.equal(staged,patchCard(original,topic.id),'Unexpected card edit: '+topic.slug);
  }
});
test('every card retains original inline SHA-256 CSP authorization',()=>{
  for(const topic of topics){
    const source=readCard(stage,topic.slug);
    const inline=source.match(/<script>([\s\S]*?)<\/script>/g);
    assert.ok(inline&&inline.length===1,topic.slug+' inline count');
    const content=inline[0].slice('<script>'.length,-'</script>'.length);
    const digest=crypto.createHash('sha256').update(content,'utf8').digest('base64');
    assert.ok(source.includes('sha256-'+digest),'Broken CSP hash: '+topic.slug);
    assert.ok(source.includes("style-src &#x27;self&#x27;"),topic.slug+' external CSS policy');
    for(const suffix of ['model.js','store.js','card-bridge.js']){
      assert.ok(source.includes('../../assets/lsh/v3/'+suffix),topic.slug+' missing '+suffix);
    }
    assert.ok(source.includes('../../assets/lsh/v3/card-bridge.css'),topic.slug+' missing CSS');
  }
});
test('all 6048 recommendation records in 504 variants validate against canonical word schema',()=>{
  let variantCount=0,wordCount=0;
  const seen=new Map();
  for(const topic of topics){
    const source=readCard(root,topic.slug);
    const content=extractData(source,'CONTENT');
    const glossary=extractData(source,'CZ_GLOSSARY');
    for(const [language,langBlock] of Object.entries(content)){
      assert.ok(BRIDGE.norm(language));
      for(const [level,lesson] of Object.entries(langBlock.levels)){
        assert.ok(Array.isArray(lesson.vocab),topic.slug+':'+language+':'+level);
        variantCount++;
        for(const [term,explanation] of lesson.vocab){
          const input=BRIDGE.makeEntry({language,level,topicId:topic.id,term,explanation},glossary,'recommended');
          const w=MODEL.normalizeWord(input,NOW);
          assert.ok(w.senseId&&w.id===language+':'+w.senseId);
          const key=w.id,old=seen.get(key);
          assert.ok(!old||BRIDGE.norm(old)===BRIDGE.norm(w.term),'Hash collision across different terms: '+key);
          seen.set(key,w.term);wordCount++;
        }
      }
    }
  }
  assert.equal(variantCount,504);assert.equal(wordCount,6048);
});
test('semantic identity never merges distinct homonyms when glossary is ambiguous',()=>{
  const g={words:{en:{bank:'banka; břeh'}}};
  const topicId='cl-ceny-nemovitosti';
  const first=BRIDGE.makeEntry({language:'en',level:'B2',topicId,term:'bank',
    explanation:'a financial institution'},g,'recommended');
  const second=BRIDGE.makeEntry({language:'en',level:'B2',topicId,term:'bank',
    explanation:'land next to a river'},g,'recommended');
  assert.notEqual(first.senseId,second.senseId);
  assert.equal(first.translationCs,'');
  assert.equal(second.translationCs,'');
});
test('dictionary and recommended glossary words with one unambiguous translation merge safely',()=>{
  const g={words:{en:{affordable:'cenově dostupný'}}},topicId='cl-ceny-nemovitosti';
  const a=BRIDGE.makeEntry({language:'en',level:'B2',topicId,
    term:'affordable',explanation:'not too expensive'},g,'recommended');
  const b=BRIDGE.makeEntry({language:'en',level:'B2',topicId,
    term:'affordable',translationCs:'cenově dostupný'},g,'dictionary');
  assert.equal(a.senseId,b.senseId);
  const combined=MODEL.mergeWords(MODEL.normalizeWord(a,NOW),MODEL.normalizeWord(b,NOW),NOW);
  assert.equal(combined.translationCs,'cenově dostupný');
  assert.equal(combined.explanation,'not too expensive');
});
test('stable sense IDs keep Czech diacritics and distinguish meanings',()=>{
  assert.equal(BRIDGE.senseId('en','BANK','cz:banka'),BRIDGE.senseId('en','bank','cz:banka'));
  assert.notEqual(BRIDGE.senseId('en','bank','cz:banka'),BRIDGE.senseId('en','bank','cz:břeh'));
  assert.notEqual(BRIDGE.senseId('en','bank','cz:banka'),BRIDGE.senseId('de','bank','cz:banka'));
  assert.match(BRIDGE.senseId('en','bank','cz:banka'),/^cl-[0-9a-f]{16}$/);
});
test('back navigation only accepts a local conversation path',()=>{
  const html=fs.readFileSync(path.join(stage,'slovnicek/index.html'),'utf8');
  const js=fs.readFileSync(path.join(stage,'assets/lsh/v3/vocab.js'),'utf8');
  assert.ok(html.includes('id="backToCard"'));
  assert.ok(js.includes('target.origin!==location.origin'));
  assert.ok(js.includes('config.basePath'));
});
