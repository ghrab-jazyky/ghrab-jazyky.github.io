'use strict';
// R4A structural preflight. This is NOT a pedagogical audit and never approves a card.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const languages=['en','es','de','fr'];
const levels=['A1','A2','B1','B2','C1','C2'];
const reading=['can-mistakes','plastic-ocean','asteroids','email-friend','instant-messages'];
const listening=['matthew-mcconaughey','harrison-ford','peaky-blinders'];
const inventory=JSON.parse(fs.readFileSync(path.join(base,'data/editorial-inventory.json'),'utf8'));
const provenance=JSON.parse(fs.readFileSync(path.join(base,'data/preview-provenance.json'),'utf8'));
const manifest=JSON.parse(fs.readFileSync(path.join(base,'data/manifest.json'),'utf8'));
const normalize=x=>String(x??'').normalize('NFKC').replace(/\s+/g,' ').trim().toLocaleLowerCase('en');
const sourceHtml=(skill,id)=>fs.readFileSync(path.join(base,'nahledy',skill,id,'index.html'),'utf8');
function dataFromHtml(html,nextConst){
  const start=html.indexOf('const DATA=');
  assert.ok(start>=0,'Expected literal JSON DATA in original student HTML');
  const from=start+'const DATA='.length;
  const end=html.indexOf(';\nconst '+nextConst+'=',from);
  assert.ok(end>from,'Expected JSON end marker '+nextConst);
  return JSON.parse(html.slice(from,end));
}
test('R4A all eight online previews are accurately represented as pending in editorial inventory',()=>{
  assert.equal(provenance.entries.length,8);
  const map=new Map(inventory.topics.map(t=>[t.id,t]));
  const conversions=new Map([
    ['can-mistakes','rl-can-mistakes'],['plastic-ocean','rl-plastic-ocean'],
    ['asteroids','rl-asteroids'],['email-friend','rl-email-friend'],
    ['instant-messages','rl-instant-messages'],
    ['matthew-mcconaughey','ll-matthew-oscars'],
    ['harrison-ford','ll-harrison-ford'],
    ['peaky-blinders','ll-peaky-no-fighting']
  ]);
  assert.equal(conversions.size,8);
  for(const entry of provenance.entries){
    const item=map.get(conversions.get(entry.id));
    assert.ok(item,'Editorial topic missing: '+entry.id);
    assert.equal(item.skill,entry.skill);
    assert.equal(item.sourceState,'public-test-preview','Stale source status: '+entry.id);
    assert.ok(item.version && /v\d/.test(item.version),'Source version missing: '+entry.id);
    assert.notEqual(item.state,'PUBLIKOVANO');
    assert.ok(fs.existsSync(path.join(base,entry.file)));
    assert.equal(manifest.topics.some(t=>t.skill===entry.skill && t.slug===entry.id),false,
      'A TEST-only student lesson must not enter the approved/shareable manifest: '+entry.id);
  }
  assert.ok(inventory.referenceCandidates &&
    ['konverzace','cteni','poslech'].every(skill=>inventory.referenceCandidates[skill]?.approved===false));
  assert.ok(manifest.topics.some(t=>t.id===inventory.referenceCandidates.konverzace.id&&t.skill==='konverzace'));
});
test('R4A: all 120 Reading variants have supported question forms and text-located evidence',()=>{
  const expected={A1:9,A2:9,B1:12,B2:18,C1:21,C2:21};
  let variants=0,questions=0,evidences=0;
  for(const id of reading){
    const html=sourceHtml('cteni',id);
    assert.ok(html.includes('reading-lab-vocabulary'),id+' must retain legacy local student vocabulary');
    assert.match(html,/id="dictionaryToggle"/);
    const data=dataFromHtml(html,'GLOSSARY');
    assert.deepEqual(Object.keys(data).sort(),languages.slice().sort());
    let perCard=0;
    for(const lang of languages)for(const level of levels){
      const lesson=data[lang]?.[level];
      assert.ok(lesson,id+' missing '+lang+'/'+level);
      variants++;
      assert.ok(Array.isArray(lesson.paragraphs)&&lesson.paragraphs.length>=2);
      assert.ok(lesson.paragraphs.every(p=>typeof p==='string'&&p.length>=20));
      assert.equal(lesson.questions.length,expected[level],id+': '+lang+'/'+level+' count');
      const ids=new Set();
      const tabs=new Set(lesson.tabs.map(t=>t.id));
      for(const question of lesson.questions){
        questions++;perCard++;
        assert.ok(typeof question.id==='string'&&question.id.length>4&&!ids.has(question.id));
        ids.add(question.id);
        assert.ok(tabs.has(question.tab),id+': unknown tab '+question.tab);
        assert.ok(['mc','match','gap'].includes(question.kind));
        assert.ok(typeof question.q==='string'&&question.q.trim().length>=10);
        assert.ok(Array.isArray(question.choices)&&question.choices.length>=2);
        assert.ok(Number.isInteger(question.answer)&&question.answer>=0&&question.answer<question.choices.length,
          id+' invalid answer index '+question.id);
        assert.ok(Array.isArray(question.evidence)&&question.evidence.length>0,
          id+' evidence missing '+question.id);
        for(const e of question.evidence){
          evidences++;
          assert.ok(Number.isInteger(e.p)&&e.p>=0&&e.p<lesson.paragraphs.length,
            id+' evidence paragraph invalid '+question.id);
          assert.ok(typeof e.text==='string'&&e.text.length>=4);
          assert.ok(normalize(lesson.paragraphs[e.p]).includes(normalize(e.text)),
            id+' evidence not found in source '+question.id);
        }
      }
    }
    assert.equal(perCard,360,id+' reading question total');
  }
  assert.equal(variants,120);
  assert.equal(questions,1800);
  assert.ok(evidences>=1800);
});
test('R4A: all 18 Listening levels have coherent closed-task answer keys and activity structure',()=>{
  let variants=0,closed=0;
  for(const id of listening){
    const html=sourceHtml('poslech',id);
    const data=dataFromHtml(html,'SOURCES');
    assert.deepEqual(Object.keys(data).sort(),levels.slice().sort());
    for(const level of levels){
      const d=data[level];variants++;
      for(const field of ['gist','detail','sequence','vocab','facts','open','talk']){
        assert.ok(Array.isArray(d[field]),id+': missing '+level+'/'+field);
      }
      assert.ok(d.gist.length>=3&&d.detail.length>=4&&d.vocab.length>=4&&d.sequence.length>=3);
      for(const q of [...d.gist,...d.detail]){
        closed++;
        assert.ok(q.title&&Array.isArray(q.options)&&q.options.length>=3);
        if(q.type==='multi'){
          assert.ok(Array.isArray(q.correct)&&q.correct.length>=2);
          assert.equal(new Set(q.correct).size,q.correct.length);
          assert.ok(q.correct.every(n=>Number.isInteger(n)&&n>=0&&n<q.options.length));
        }else{
          assert.equal(q.type,'single');
          assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
        }
      }
      assert.ok(d.sequence.every(x=>typeof x==='string'&&x.length>5));
      assert.ok(d.vocab.every(x=>typeof x.term==='string'&&typeof x.meaning==='string'));
    }
  }
  assert.equal(variants,18);
  assert.ok(closed>=150);
});
