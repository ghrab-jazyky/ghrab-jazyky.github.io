'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const studentPath='nahledy/cteni/asteroids/index.html';
const promptPath='docs/READING_LAB_MASTER_PROMPT_v3_5.txt';
const promptHash='3ca303c966fbf438c77691e180b417af7e765a361b508078eab3b1099a34f5a';
const studentHash='fc667a52f5f48407aa10dea31adda836ffdc88008e206a46727e94cc9991f82b';

function readStudentData(){
  const html=read(studentPath).toString('utf8');
  const a=html.indexOf('const DATA=');
  const b=html.indexOf(';\nconst GLOSSARY=',a);
  assert.ok(a>0&&b>a,'Original Asteroids DATA/GLOSSARY markers required');
  return JSON.parse(html.slice(a+'const DATA='.length,b));
}
test('R4B: teacher-supplied Asteroids v2.3 bytes and master prompt v3.5 are exact originals',()=>{
  const html=read(studentPath),prompt=read(promptPath);
  assert.equal(html.length,1442681);
  assert.equal(sha(html),studentHash);
  assert.equal(sha(prompt),promptHash);
  assert.match(html.toString('utf8').slice(0,1200),/Asteroids · Reading Lab v2\.3/);
  assert.match(prompt.toString('utf8').slice(0,1600),/REFERENČNÍ KARTA = ASTEROIDS v2\.3/);
});
test('R4B: all 24 language/CEFR variants and 360 questions preserve evidence and sound answer indexes',()=>{
  const data=readStudentData(),levels={A1:9,A2:9,B1:12,B2:18,C1:21,C2:21};
  assert.deepEqual(Object.keys(data),['en','es','de','fr']);
  let variants=0,questions=0,snippets=0,matching=0;
  for(const lang of Object.keys(data))for(const [level,expected] of Object.entries(levels)){
    const lesson=data[lang][level];
    assert.ok(lesson,lang+'/'+level);
    variants++;
    assert.equal(lesson.questions.length,expected,lang+'/'+level);
    assert.equal(lesson.tabs.length,expected/3,lang+'/'+level+' tab count');
    const tabSet=new Set(lesson.tabs.map(t=>t.id));
    assert.equal(tabSet.size,lesson.tabs.length);
    const ids=new Set();
    for(const q of lesson.questions){
      questions++;
      assert.ok(q.id&&!ids.has(q.id),lang+'/'+level+' duplicate ID');
      ids.add(q.id);
      assert.ok(tabSet.has(q.tab),lang+'/'+level+' invalid tab');
      assert.ok(Array.isArray(q.choices)&&q.choices.length>=2);
      assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length);
      assert.ok(Array.isArray(q.evidence)&&q.evidence.length>0,q.id+' evidence missing');
      for(const e of q.evidence){
        snippets++;
        assert.ok(Number.isInteger(e.p)&&e.p>=0&&e.p<lesson.paragraphs.length,q.id+' paragraph');
        const paragraph=lesson.paragraphs[e.p];
        assert.equal(paragraph.split(e.text).length-1,1,q.id+' evidence must be unique');
      }
    }
    const match=lesson.questions.filter(q=>q.tab==='matching');
    if(match.length){
      matching++;
      assert.equal(match.length,3);
      assert.equal(new Set(match.map(q=>q.answer)).size,3,lang+'/'+level+' matching answers must differ');
    }
  }
  assert.equal(variants,24);
  assert.equal(questions,360);
  assert.equal(snippets,391);
  assert.equal(matching,12);
});
test('R4B: Reading reference selected but not approved for graded tests, no teacher key released',()=>{
  const inventory=JSON.parse(read('data/editorial-inventory.json').toString('utf8'));
  const provenance=JSON.parse(read('data/preview-provenance.json').toString('utf8'));
  const manifest=JSON.parse(read('data/manifest.json').toString('utf8'));
  assert.equal(inventory.referenceCandidates.cteni.id,'rl-asteroids');
  assert.equal(inventory.referenceCandidates.cteni.referenceVersion,'v2.3');
  assert.equal(inventory.referenceCandidates.cteni.approved,false);
  const topic=inventory.topics.find(t=>t.id==='rl-asteroids');
  assert.equal(topic.version,'v2.3');
  assert.equal(topic.sourceState,'public-test-preview');
  assert.notEqual(topic.state,'PUBLIKOVANO');
  const preview=provenance.entries.find(t=>t.id==='asteroids');
  assert.equal(preview.sha256,studentHash);
  assert.equal(preview.bytes,1442681);
  assert.equal(provenance.visibility,'PUBLIC_TEST_ONLY');
  assert.equal(manifest.topics.some(t=>t.id==='rl-asteroids'),false);
  const keyFiles=fs.readdirSync(path.join(root,'nahledy','cteni','asteroids'));
  assert.deepEqual(keyFiles,['index.html']);
  const review=read('revize/index.html').toString('utf8');
  assert.match(review,/cteni-asteroids-v23/);
  assert.match(review,/Can Mistakes Help Us Learn\? \(starší kontrolní záznam\)/);
  assert.match(review,/nahledy\/cteni\/asteroids\//);
});
