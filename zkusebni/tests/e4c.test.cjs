'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const tool=require('../tools/reading-v34-data-audit.cjs');
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const STRATEGIES={A1:['gist','scan','detail'],A2:['gist','scan','detail'],
 B1:['gist','scan','detail','structure'],
 B2:['gist','scan','detail','inference','matching','structure'],
 C1:['gist','scan','detail','inference','vocab','matching','structure'],
 C2:['gist','scan','inference','tone','critical','matching','structure']};
const PATTERNS=[[0,2,1],[1,0,2],[2,1,0],[1,2,0],[0,3,2],[1,3,0],[2,0,3]];
function makeData(){
 const data={};
 for(const lang of LANGS){
  data[lang]={};
  for(const level of LEVELS){
   const tabs=STRATEGIES[level].map(id=>({id,title:id,description:id}));
   const questions=[];
   for(let t=0;t<tabs.length;t++)for(let i=0;i<3;i++){
    const choices=['option 1','option 2','option 3',...(LEVELS.indexOf(level)>=3?['option 4']:[])];
    questions.push({id:lang+'-'+level+'-'+t+'-'+i,tab:tabs[t].id,
     kind:'mc',q:'Which option?',choices,answer:PATTERNS[t][i],
     evidence:[{p:0,text:'first unique sentence'}],explanation:'Synthetic explanation',
     target:i===0?[0,'unique sentence']:undefined});
   }
   data[lang][level]={title:'Synthetic only',paragraphs:['The first unique sentence is here.','A different second sentence.'],
    pre:'Synthetic prompt',open:'Synthetic reflection',tabs,questions};
  }
 }
 return data;
}
const html=d=>'<!doctype html><html><head><meta charset="utf-8"></head><body><script>const DATA='+JSON.stringify(d)+';</script></body></html>';
test('E4C synthetic 24x360 QA is structural only and never approves release',()=>{
 const r=tool.audit(html(makeData()),'synthetic.html');
 assert.equal(r.variants,24);
 assert.equal(r.questions,360);
 assert.equal(r.counts.critical,0,JSON.stringify(r.findings.slice(0,6)));
 assert.equal(r.counts.high,0,JSON.stringify(r.findings.slice(0,6)));
 assert.equal(r.releaseDecision,'NO_GO');
 assert.equal(r.execution,'NO_EVAL_NO_NETWORK');
 assert.ok(!JSON.stringify(r).includes('first unique sentence'),'Never output question or evidence text');
});
test('Reject missing variant and duplicate question ID',()=>{
 const a=makeData();
 delete a.es.A2;
 a.en.A1.questions[0].id=a.en.A1.questions[1].id;
 const r=tool.audit(html(a));
 assert.ok(r.findings.some(f=>f.type==='missing-variant'));
 assert.ok(r.findings.some(f=>f.type==='question-id'));
});
test('Detect missing evidence, missing target and repeated correct positions',()=>{
 const a=makeData(),q=a.en.B2.questions[0];
 q.evidence=[{p:0,text:'not in paragraph'}];
 q.target=[0,'not in paragraph'];
 for(const i of [0,1,2])a.en.B2.questions[i].answer=0;
 const r=tool.audit(html(a));
 assert.ok(r.findings.some(f=>f.type==='evidence-mismatch'));
 assert.ok(r.findings.some(f=>f.type==='target-mismatch'));
 assert.ok(r.findings.some(f=>f.type==='all-same-position'));
});
test('Reject a strict A-B-C pattern',()=>{
 const a=makeData();for(let i=0;i<3;i++)a.de.C2.questions[i].answer=i;
 assert.ok(tool.audit(html(a)).findings.some(f=>f.type==='predictable-answer-order'));
});
test('Catch repeated answer-position patterns across two tabs',()=>{
 const a=makeData();
 for(let i=0;i<3;i++)a.en.C2.questions[3+i].answer=a.en.C2.questions[i].answer;
 assert.ok(tool.audit(html(a)).findings.some(f=>f.type==='duplicate-answer-pattern'&&f.variant==='en:C2'));
});
test('Detect leaking missing sentence outside its gapped task',()=>{
 const a=makeData();a.en.B1.gap={p:0,sentence:'The secret sentence is hidden.'};
 a.en.B1.questions[0].choices[2]='The secret sentence is hidden.';
 assert.ok(tool.audit(html(a)).findings.some(f=>f.type==='hidden-sentence-leak'));
});
test('Length bias is a REVIEW warning, never full compliance',()=>{
 const a=makeData();for(const q of a.fr.C2.questions){q.choices[0]='A much longer answer that could give it away';q.answer=0;}
 const r=tool.audit(html(a));
 assert.ok(r.findings.some(f=>f.type==='longest-correct-option'));
 assert.equal(r.releaseDecision,'NO_GO');
});
test('Inline malicious code is never executed',()=>{
 const a=makeData(),x=html(a)+'<script>throw new Error("MUST NEVER RUN")</script>';
 assert.equal(tool.extract(x).de.A2.questions.length,9);
 assert.equal(tool.audit(x).releaseDecision,'NO_GO');
});
test('Reject JS-only DATA or malformed literals',()=>{
 assert.throws(()=>tool.extract('const DATA=(()=>({bad:true}))();'),/JSON/);
 assert.throws(()=>tool.extract('const DATA={"en": } ;'),/Unexpected token|JSON|position/i);
 assert.throws(()=>tool.extract('const DATA={};const DATA={};'),/exactly one/);
});
test('CLI emits only metrics; exit codes are deterministic',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-e4c-')),file=path.join(dir,'test-student.html');
 const cmd=path.resolve(__dirname,'../tools/reading-v34-data-audit.cjs');
 try{
  fs.writeFileSync(file,html(makeData()));
  let r=cp.spawnSync(process.execPath,[cmd,file],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const report=JSON.parse(r.stdout);
  assert.equal(report.releaseDecision,'NO_GO');
  assert.equal(report.questions,360);
  fs.writeFileSync(file,'no DATA');
  r=cp.spawnSync(process.execPath,[cmd,file],{encoding:'utf8'});
  assert.equal(r.status,2);
 }finally{fs.rmSync(dir,{force:true,recursive:true});}
});
