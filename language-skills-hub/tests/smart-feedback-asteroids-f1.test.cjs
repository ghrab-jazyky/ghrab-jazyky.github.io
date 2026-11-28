'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process'),{createHash,webcrypto}=require('node:crypto');
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const root=path.resolve(__dirname,'..'),repo=path.dirname(root);
const BASE='fde581f864093a0b87d60afbc552e5c4e021e7e5';
const file='language-skills-hub/cteni/asteroids/index.html';
const core=require('../self-check/reading/reading-core.js');
const sourceEdits=require('../scripts/smart-feedback-f42-source-edits.cjs');
const original=execFileSync('git',['show',BASE+':'+file],{cwd:repo,maxBuffer:6000000}).toString('utf8');
const candidate=fs.readFileSync(path.join(repo,file),'utf8');
const data=core.parseReadingData(candidate),v=core.variantFromData(data,'en','B2');
const marker='<script type="application/json" id="lsh-smart-feedback-asteroids-v1">';
const originalBank={schemaVersion:1,topicId:'rl-asteroids',feedbackLanguage:'cs',variants:{}};
for(const lang of core.LANGUAGES)for(const level of core.LEVELS){
 const key=lang+'/'+level;
 const p=lang==='en'&&level==='B2'?'docs/smart-feedback-asteroids-f1/en-B2.json':'docs/smart-feedback-asteroids-f2/'+lang+'-'+level+'.json';
 const raw=fs.readFileSync(path.join(root,p),'utf8'),parsed=JSON.parse(raw);
 assert.equal(raw,JSON.stringify(parsed,null,2)+'\n');
 originalBank.variants[key]=lang==='en'&&level==='B2'?parsed.variants[key]:parsed;
}
const embed=b=>marker+JSON.stringify(b).replace(/</g,'\\u003c')+'</script>';
const validate=s=>core.validateSmartFeedback(s,'rl-asteroids','en','B2',v);
const sha=s=>createHash('sha256').update(s).digest('hex');
test('F4.2 exact byte preservation except six owner-approved source edits and one inert bank',()=>{
 assert.equal(candidate.replace(embed(originalBank)+'\n',''),sourceEdits.applySource(original));
 assert.equal(sourceEdits.revertSource(candidate.replace(embed(originalBank)+'\n','')),original);
 assert.equal(sha(original),'59167c05eb80b492300b368fc0a1f45f19c1af6631d4a19c560dae98e0d45bac');
 assert.notEqual(sha(candidate),sha(original));
 assert.ok(candidate.length<=2500000);
 assert.deepEqual(core.parseReadingData(candidate),sourceEdits.expectedData(core,core.parseReadingData(original)));

 assert.deepEqual(core.parseSmartFeedback(candidate),originalBank);
});
test('F2 native Web Crypto and every answer state across all 24 variants (1689 cases)',async()=>{
 const count={correct:0,wrong:0,unanswered:0};
 for(const lang of core.LANGUAGES)for(const level of core.LEVELS){
 const v=core.variantFromData(data,lang,level);
 const bank=await core.validateSmartFeedback(candidate,'rl-asteroids',lang,level,v);
 assert.equal(bank.sourceFingerprint,originalBank.variants[lang+'/'+level].sourceFingerprint);
 for(const q of v.questions){
  for(let i=-1;i<q.choices.length;i++){
   const item=core.score(v,i<0?{}:{[q.id]:i}).details.find(x=>x.id===q.id);
   const before=JSON.stringify(item),f=core.resolveSmartFeedback(item,bank,v);
   assert.equal(JSON.stringify(item),before);
   if(i===q.answer){assert.equal(f,null);count.correct++;continue;}
   if(i===-1){
    assert.equal(f.status,'unanswered');assert.equal(f.whyWrong,undefined);
    assert.equal(f.tip,bank.questions[q.id].unanswered.tip);count.unanswered++;
   }else{
    assert.equal(f.status,'wrong');assert.equal(f.whyWrong,bank.questions[q.id].distractors[i].whyWrong);
    assert.equal(f.tip,bank.questions[q.id].distractors[i].tip);count.wrong++;
   }
   for(const e of f.evidence)assert.ok(v.paragraphs[e.p].includes(e.text));
   assert.equal(f.correctWhy,bank.questions[q.id].correctWhy);
  }
 }
 }
 assert.deepEqual(count,{correct:360,wrong:969,unanswered:360});
});
test('F2 fail-closed invalid payloads: missing, repeated, stale, extra, malformed and bad evidence',async()=>{
 const first=v.questions[0].id;
 const edit=fn=>{const b=structuredClone(originalBank);fn(b,b.variants['en/B2'],b.variants['en/B2'].questions[first]);return embed(b);};
 const bad=[
  original,candidate+embed(originalBank),marker+'{"bad":'+'</script>',
  embed(originalBank).replace('"schemaVersion":1','"schemaVersion":1,"schemaVersion":1'),
  embed(originalBank).replace('"schemaVersion":1','"schemaVersion":1,"__proto__":{}'),
  edit((b,s)=>s.sourceFingerprint='0'.repeat(64)),
  edit((b,s)=>delete s.questions[first]),
  edit((b,s,f)=>f.correctIndex=(f.correctIndex+1)%4),
  edit((b,s,f)=>delete f.distractors[Object.keys(f.distractors)[0]]),
  edit((b,s,f)=>f.evidence[0].text='invented evidence'),
  edit((b,s,f)=>f.correctWhy='<img src=x onerror=alert(1)>'),
  edit((b,s,f)=>f.unanswered.tip='TODO'),
  edit((b,s,f)=>f.evidence.push(f.evidence[0])),
  edit((b,s,f)=>f.distractors[String(f.correctIndex)]={whyWrong:'bad',tip:'bad'}),
  edit(b=>delete b.variants['fr/C2']),
  edit(b=>b.variants['xx/B2']=b.variants['en/B2'])
 ];
 for(const s of bad)await assert.rejects(validate(s));
 await assert.rejects(core.validateSmartFeedback(candidate,'rl-other','en','B2',v));
 await assert.rejects(core.validateSmartFeedback(candidate,'rl-asteroids','en','B1',v));
 await assert.rejects(core.validateSmartFeedback(edit(b=>b.variants['en/A1']=b.variants['en/B2']),'rl-asteroids','en','A1',core.variantFromData(data,'en','A1')));
 assert.equal(core.resolveSmartFeedback(core.score(v,{}).details[0],null,v),null);
});
test('F2 exact original score implementation and score parity across all 24 variants (72 cases)',()=>{
 const oldCode=execFileSync('git',['show',BASE+':language-skills-hub/self-check/reading/reading-core.js'],{cwd:repo}).toString('utf8');
 const newCode=fs.readFileSync(path.join(root,'self-check/reading/reading-core.js'),'utf8');
 assert.equal(newCode.slice(newCode.indexOf(' function score('),newCode.indexOf(' // F1:')).trim(),
  oldCode.slice(oldCode.indexOf(' function score('),oldCode.indexOf(' const api=')).trim());
 const oldData=core.parseReadingData(original);
 let n=0;
 for(const lang of core.LANGUAGES)for(const level of core.LEVELS){
  const a=core.variantFromData(data,lang,level),b=core.variantFromData(oldData,lang,level);
  for(const answers of [{},Object.fromEntries(a.questions.map(q=>[q.id,q.answer])),
   Object.fromEntries(a.questions.map((q,i)=>[q.id,i%3===0?null:(q.answer+1)%q.choices.length]))]){
   assert.deepEqual(core.score(a,answers),sourceEdits.reviseReport(core.score(b,answers)));n++;
  }
 }
 assert.equal(n,72);
 for(const p of ['reading/reading-annotations.js','reading/reading-practice-annotations.js','results/grade-core.js','results/export-core.js','session/session-ui.js','session/attempt-core.js','session/tab-guard.js','session/unlock-gestures.js']){
  const current=fs.readFileSync(path.join(root,'self-check',p));
  const baseline=execFileSync('git',['show',BASE+':language-skills-hub/self-check/'+p],{cwd:repo,maxBuffer:5000000});
  assert.deepEqual(current,baseline,p+' unchanged');
 }
});
