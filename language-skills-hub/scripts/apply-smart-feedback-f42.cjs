#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const root=path.resolve(__dirname,'..'),repo=path.dirname(root),core=require('../self-check/reading/reading-core.js'),a=require('./smart-feedback-f42-source-edits.cjs');
const read=p=>fs.readFileSync(path.join(repo,p),'utf8'),files=new Map(),put=(p,s)=>files.set(p,s);
const prefix='language-skills-hub/',card=prefix+'cteni/asteroids/index.html';
const embed=b=>a.marker+JSON.stringify(b).replace(/</g,'\\u003c')+'</script>\n';
async function run(){
 const html=read(card),data=core.parseReadingData(html),bank=core.parseSmartFeedback(html),oldBank=structuredClone(bank);
 assert.equal(a.sha(html),a.PREVIOUS_SHA);assert.equal(a.blob(html),a.PREVIOUS_BLOB);
 const original=a.stripBank(html),source=a.applySource(original),expected=a.expectedData(core,data);
 assert.equal(a.revertSource(source),original);assert.deepEqual(core.parseReadingData(source),expected);
 const ledger=[];
 for(const e of a.EDITS){
  const [l,level]=e.variant.split('/'),v=core.variantFromData(expected,l,level),b=bank.variants[e.variant],f=b.questions[e.id],old=structuredClone(f),oldFingerprint=b.sourceFingerprint;
  assert.equal(f.correctIndex,e.answer);
  if(e.group==='D03'){
   f.correctWhy='Schopnost zasáhnout asteroid je v zadání už daná. Autor zdůrazňuje další podmínku: dostatečně včas znát strukturu a dráhu tělesa, aby bylo možné změnit jeho budoucí polohu.';
   f.distractors[0].whyWrong='Přesný zásah je technicky významný, ale otázka se výslovně ptá, co je potřeba navíc. Samotný kontakt nezaručuje včasnou a dostatečnou změnu budoucí polohy.';
   f.distractors[0].tip='V zadání si označ, která podmínka už platí, a v textu vyhledej další podmínku.';
   f.unanswered.tip='Porovnej dvě otázky v odstavci o DART. První se týká zásahu, druhá včasné změny budoucí polohy; zadání vyžaduje druhou.';
  }else{
   f.correctWhy='Autor staví filmové výbuchy do protikladu ke skutečné dlouhodobé práci. Nejúčinnější reakce může být nenápadná a začínat dlouho před hrozbou; text netvrdí, že to platí vždy nebo často.';
   f.unanswered.tip='Přečti protiklad mezi filmem a skutečností. Zachovej míru jistoty zdrojového tvrzení: možnost neznamená pravidlo.';
  }
  b.sourceFingerprint=await core.smartFeedbackFingerprint('rl-asteroids',l,level,v);
  assert.notEqual(b.sourceFingerprint,oldFingerprint);
  ledger.push({...e,oldFeedback:old,newFeedback:structuredClone(f),oldFingerprint,newFingerprint:b.sourceFingerprint});
 }
 // Preserve the original bank location and every byte outside the six source edits.
 const next=a.one(html,embed(oldBank),embed(bank));
 let revised=next;
 for(const e of a.EDITS)revised=a.one(revised,JSON.stringify(e.before),JSON.stringify(e.after));
 assert.equal(a.stripBank(revised),source);
 assert.deepEqual(core.parseReadingData(revised),expected);assert.deepEqual(core.parseSmartFeedback(revised),bank);
 const newSha=a.sha(revised),newBlob=a.blob(revised);
 assert.equal(newSha,'6776eb422a143ed03a442abb057aa9e39d8175fdcbe9b01d4e126076630a8bc1','F4.2 must reproduce the previously verified content exactly');
 let questions=0,distractors=0,citations=0;
 for(const l of core.LANGUAGES)for(const level of core.LEVELS){
  const key=l+'/'+level,v=core.variantFromData(expected,l,level),o=core.variantFromData(data,l,level);
  const validated=await core.validateSmartFeedback(revised,'rl-asteroids',l,level,v);
  assert.deepEqual(validated,bank.variants[key]);
  for(const q of v.questions){
   const f=validated.questions[q.id],oq=o.questions.find(x=>x.id===q.id);
   assert.equal(q.answer,oq.answer);assert.equal(q.choices.length,oq.choices.length);
   for(let i=-1;i<q.choices.length;i++){
    const answers=i<0?{}:{[q.id]:i};
    assert.deepEqual(core.score(v,answers),a.reviseReport(core.score(o,answers)),q.id);
   }
   questions++;distractors+=Object.keys(f.distractors).length;citations+=f.evidence.length;
  }
 }
 assert.equal(questions,360);assert.equal(distractors,969);
 const dir=prefix+'docs/smart-feedback-asteroids-f42/';
 const audit={baseline:a.BASE,production:a.PRODUCTION,approval:'Owner approved D03 and D22; no approval to deploy',previousSha:a.PREVIOUS_SHA,cardSha256:newSha,cardBlob:newBlob,sourceSha256:a.sha(source),sourceBlob:a.blob(source),edits:ledger,counts:{variants:24,questions,distractors,citations,sourceEdits:6,answerIndexChanges:0}};
 put(card,revised);
 for(const e of a.EDITS){
  const [l,level]=e.variant.split('/'),p=prefix+'docs/smart-feedback-asteroids-f2/'+l+'-'+level+'.json';
  assert.deepEqual(JSON.parse(read(p)),oldBank.variants[e.variant]);put(p,JSON.stringify(bank.variants[e.variant],null,2)+'\n');
 }
 put(prefix+'version.json',a.one(read(prefix+'version.json'),a.PREVIOUS_SHA,newSha));
 // Keep full candidate hash pins and recover the original R12 source only by
 // reversing the six exact approved literals. No generic hash normalization.
 const i=prefix+'tests/city-quest-d3-integrity.test.cjs';
 let integrity=a.one(a.one(read(i),a.PREVIOUS_SHA,newSha),a.PREVIOUS_BLOB,newBlob);
 integrity=a.one(integrity,"const {integrityContent}=require('./reading-content-integrity.cjs');","const {integrityContent}=require('./reading-content-integrity.cjs');\nconst sourceEdits=require('../scripts/smart-feedback-f42-source-edits.cjs');");
 integrity=a.one(integrity,'const baseline=Buffer.from(source.slice(0,start)+source.slice(end+', 'const approvedSource=source.slice(0,start)+source.slice(end+');
 integrity=a.one(integrity,"'</script>\\n'.length),'utf8');","'</script>\\n'.length);\n const baseline=Buffer.from(sourceEdits.revertSource(approvedSource),'utf8');");
 integrity=a.one(integrity,'exact R12 bytes outside additive bank','exact R12 bytes after reversing approved six source edits');
 put(i,integrity);
 const p='tools/build-lsh-pages-preview.cjs';
 let builder=a.one(a.one(read(p),a.PREVIOUS_SHA,newSha),a.PREVIOUS_BLOB,newBlob);
 builder=a.one(builder,"const baselineAst=Buffer.from(astText.slice(0,sfStart)+astText.slice(sfEnd+'</script>\\n'.length),'utf8');",
  "const sourceEdits=require('../language-skills-hub/scripts/smart-feedback-f42-source-edits.cjs');\nconst approvedSource=astText.slice(0,sfStart)+astText.slice(sfEnd+'</script>\\n'.length);\nconst baselineAst=Buffer.from(sourceEdits.revertSource(approvedSource),'utf8');");
 builder=a.one(builder,"cardRevision:'F4.1',","cardRevision:'F4.2',approvedSourceRevisionBase:'"+a.BASE+"',approvedSourceSha256:'"+audit.sourceSha256+"',");
 put(p,builder);
 // Preserve historical F3/F4.1 review assertions; bind those to the original
 // certified predecessors instead of trying to apply them to revised content.
 const f3=prefix+'tests/smart-feedback-asteroids-f3.test.cjs';
 put(f3,a.one(read(f3),"const latest=fs.readFileSync(path.join(repo,pathName),'utf8');",
  "const latest=execFileSync('git',['show','"+a.BASE+":'+pathName],{cwd:repo,maxBuffer:6000000}).toString('utf8');"));
 const f1=prefix+'tests/smart-feedback-asteroids-f1.test.cjs';
 let test=a.one(read(f1),"const core=require('../self-check/reading/reading-core.js');","const core=require('../self-check/reading/reading-core.js');\nconst sourceEdits=require('../scripts/smart-feedback-f42-source-edits.cjs');");
 test=a.one(test,"F2 exact byte-preservation outside one inert block; authored JSON matches embedded payload","F4.2 exact byte preservation except six owner-approved source edits and one inert bank");
 test=a.one(test,"assert.equal(candidate.replace(embed(originalBank)+'\\n',''),original);","assert.equal(candidate.replace(embed(originalBank)+'\\n',''),sourceEdits.applySource(original));\n assert.equal(sourceEdits.revertSource(candidate.replace(embed(originalBank)+'\\n','')),original);");
 test=a.one(test,"assert.deepEqual(core.parseReadingData(candidate),core.parseReadingData(original));","assert.deepEqual(core.parseReadingData(candidate),sourceEdits.expectedData(core,core.parseReadingData(original)));");
 test=a.one(test,"assert.deepEqual(core.score(a,answers),core.score(b,answers));","assert.deepEqual(core.score(a,answers),sourceEdits.reviseReport(core.score(b,answers)));");
 put(f1,test);
 // Workflow changes are made separately through the authorized repository connector.
 // The CI content commit must never mutate .github/workflows.
 put(dir+'REVIEW_CHANGES.json',JSON.stringify(audit,null,2)+'\n');
 put(dir+'DECISION.md','# F4.2 owner-approved source correction (NO DEPLOY)\n\nD03 and D22 approved. Exactly six source fields, six feedback records and six variant fingerprints revised. Original answer indices, question IDs, options ordering, passages, scoring and runtime preserved. Full old/new ledger in REVIEW_CHANGES.json. All audit finding groups addressed in F4.1/F4.2; final exact-head recertification and physical device evidence pending. External reviewer sign-off not implied. No production authorization.\n');
 for(const [p,s] of files){fs.mkdirSync(path.dirname(path.join(repo,p)),{recursive:true});fs.writeFileSync(path.join(repo,p),s);}
 console.log('PASS F4.2 '+JSON.stringify(audit.counts)+'; SHA256 '+newSha);
}
run().catch(e=>{console.error(e);process.exitCode=1;});
