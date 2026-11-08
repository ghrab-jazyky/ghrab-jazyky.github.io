#!/usr/bin/env node
/* Reading Lab R7: check all five original student sources, not teacher keys.
 * Reproducible structural / evidence / CEFR-length audit; NOT an assessment or a teacher approval.
 * Outputs aggregate statistics only (never export correct-answer keys).
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const output=path.resolve(process.argv[2]||path.join(root,'_qa-reading'));
const topics=[
 {id:'rl-asteroids',path:'nahledy/cteni/asteroids/index.html',blob:'3f9f477e3c40ff71fc9403fac587cd9cce1ef4e2'},
 {id:'rl-can-mistakes',path:'nahledy/cteni/can-mistakes/index.html',blob:'ca88591cbe890d6166605f5133486f5fc17a865e'},
 {id:'rl-plastic-ocean',path:'nahledy/cteni/plastic-ocean/index.html',blob:'444c7f027fb6f4c0fb9170aecf085363f90b5da3'},
 {id:'rl-email-friend',path:'nahledy/cteni/email-friend/index.html',blob:'9178645eaa2d4fcd522a8a52bf2cd4741dfce05f'},
 {id:'rl-instant-messages',path:'nahledy/cteni/instant-messages/index.html',blob:'274140b4799bfaef6125063e554b86d741d01289'}
];
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const counts={A1:9,A2:9,B1:12,B2:18,C1:21,C2:21};
const referenceBands={A1:[180,230],A2:[230,300],B1:[290,400],B2:[380,520],C1:[480,650],C2:[580,800]};
const findings=[],rows=[],answerLengths=[];
const normalize=s=>String(s||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
const wordCount=s=>String(s||'').split(/\s+/).filter(Boolean).length;
const short=(s,n=80)=>String(s||'').slice(0,n);
function flag(topic,language,level,code,at,detail,severity='REVIEW'){
 findings.push({topicId:topic,language,level,code,location:at,detail,severity,
   status:'REQUIRES_REVIEW',teacherApproval:false});
}
const ledger=JSON.parse(fs.readFileSync(path.join(root,'data/reference-pilots.json'),'utf8'));
const queue=JSON.parse(fs.readFileSync(path.join(root,'data/claude-audit-queue.json'),'utf8'));
const pilot=ledger.entries.filter(x=>x.skill==='cteni');
assert.equal(ledger.approvedForTeaching,false);
assert.equal(pilot.length,5);
assert.deepEqual(topics.map(x=>x.id).sort(),pilot.map(x=>x.id).sort());
for(const t of topics){
 const queued=queue.topics.find(x=>x.id===t.id);
 assert.ok(queued&&queued.skill==='cteni'&&queued.sourcePath===t.path);
 assert.equal(queued.teacherApproval,false);
 const original=fs.readFileSync(path.join(root,t.path));
 const blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+original.length+'\0'),original])).digest('hex');
 assert.equal(blob,t.blob,'Source blob changed (review required): '+t.id);
 const src=original.toString('utf8');
 const pos=src.indexOf('const DATA='),end=src.indexOf(';\n',pos);
 assert.ok(pos>=0&&end>pos,t.id+' reading DATA block missing');
 const data=JSON.parse(src.slice(pos+'const DATA='.length,end));
 assert.deepEqual(Object.keys(data).sort(),LANGS.slice().sort(),t.id+' language list');
 for(const language of LANGS)for(const level of LEVELS){
  const v=data[language][level];
  assert.ok(v,t.id+'/'+language+'/'+level+' missing');
  const paragraphs=v.paragraphs;
  assert.ok(Array.isArray(paragraphs)&&paragraphs.length>0,'No text '+t.id);
  const textWords=wordCount(paragraphs.join(' '));
  if(language==='en'&&(textWords<referenceBands[level][0]||textWords>referenceBands[level][1])){
   flag(t.id,language,level,'EN_LENGTH_OUTSIDE_GUIDANCE','reading text',
     'Approx. '+textWords+' words; reference band '+referenceBands[level].join('-')+' (recommendation, not a strict CEFR criterion).');
  }
  const tabs=v.tabs||[],tabIDs=new Set(tabs.map(x=>x.id));
  assert.ok(tabs.length>0&&tabs.every(x=>typeof x.id==='string'&&x.title),t.id+' tabs missing');
  const questions=v.questions||[];
  assert.equal(questions.length,counts[level],t.id+'/'+language+'/'+level+' question count');
  const ids=new Set(),prompts=new Set();
  const byKind={},byTab={},answersLong=[];
  let supportedEvidence=0,totalEvidence=0,anchorFailures=0;
  for(const [i,q] of questions.entries()){
   const at='question '+(i+1)+' ('+short(q.id,38)+')';
   if(!q.id||ids.has(q.id))flag(t.id,language,level,'DUPLICATE_OR_MISSING_ID',at,'Missing or duplicate ID');
   ids.add(q.id);
   if(!tabIDs.has(q.tab))flag(t.id,language,level,'UNKNOWN_QUESTION_TAB',at,'Question tab '+short(q.tab)+' is not declared');
   byKind[q.kind]=(byKind[q.kind]||0)+1;
   byTab[q.tab]=(byTab[q.tab]||0)+1;
   if(!q.q||typeof q.q!=='string')flag(t.id,language,level,'EMPTY_PROMPT',at,'Question prompt missing');
   const key=normalize(q.q);
   if(prompts.has(key))flag(t.id,language,level,'DUPLICATE_PROMPT',at,'Same question repeated within variant (not necessarily the same options)');
   prompts.add(key);
   if(!Array.isArray(q.choices)||q.choices.length<3||q.choices.some(x=>typeof x!=='string'||!x.trim())){
    flag(t.id,language,level,'CHOICES_MISSING',at,'Multiple choice options are incomplete or invalid');
   }else{
    const unique=new Set(q.choices.map(normalize));
    if(unique.size!==q.choices.length)flag(t.id,language,level,'DUPLICATE_CHOICES',at,'Two choices are effectively identical');
   }
   if(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.choices.length)
    flag(t.id,language,level,'INVALID_ANSWER_INDEX',at,'Answer index missing or out of available choices','BLOCKING');
   else if(['B2','C1','C2'].includes(level)){
    const a=q.choices.map(x=>String(x).replace(/\s+/g,'').length);
    const others=a.filter((_,j)=>j!==q.answer);
    const clearly=a[q.answer]>Math.max(...others)+5;
    answersLong.push(clearly);
    answerLengths.push({topicId:t.id,language,level,questionId:q.id,correctClearlyLongest:clearly});
   }
   if(typeof q.explanation!=='string'||q.explanation.trim().length<10)
    flag(t.id,language,level,'EXPLANATION_MISSING',at,'Explanation absent or too brief');
   const ev=q.evidence||[];
   if(!Array.isArray(ev)||!ev.length)flag(t.id,language,level,'EVIDENCE_MISSING',at,'No supporting passage');
   else for(const [k,a] of ev.entries()){
    totalEvidence++;
    if(!a||!Number.isInteger(a.p)||a.p<0||a.p>=paragraphs.length||
       typeof a.text!=='string'||!a.text.trim()){
      flag(t.id,language,level,'EVIDENCE_INVALID_ANCHOR',at,'Evidence '+(k+1)+' has invalid paragraph or empty text','BLOCKING');
      anchorFailures++;
    }else if(!paragraphs[a.p].includes(a.text)){
      flag(t.id,language,level,'EVIDENCE_TEXT_NOT_FOUND',at,'Evidence '+(k+1)+' not an exact substring of paragraph '+(a.p+1),'BLOCKING');
      anchorFailures++;
    }else supportedEvidence++;
   }
  }
  const matches=questions.filter(q=>q.kind==='match');
  if(['B2','C1','C2'].includes(level)&&matches.length){
   const answers=matches.map(q=>q.answer);
   if(new Set(answers).size<Math.min(3,matches.length))
    flag(t.id,language,level,'MATCHING_ANSWERS_REPEAT','matching tab','Matching task has repeated answer position(s); check three distinct source paragraphs');
  }
  if(['B1','B2','C1','C2'].includes(level)){
   if(!v.gap||!Number.isInteger(v.gap.p)||!paragraphs[v.gap.p]||!paragraphs[v.gap.p].includes(v.gap.sentence))
    flag(t.id,language,level,'GAP_TEXT_NOT_FOUND','gapped sentence','Gap metadata does not match a source paragraph','BLOCKING');
   const gap=questions.filter(q=>q.kind==='gap');
   if(gap.length!==1)flag(t.id,language,level,'GAP_TASK_COUNT','gapped task','Expected one sentence-gap question; found '+gap.length);
   else if(v.gap&&Number.isInteger(gap[0].answer)&&
     normalize(gap[0].choices[gap[0].answer])!==normalize(v.gap.sentence))
    flag(t.id,language,level,'GAP_ANSWER_MISMATCH','gapped task','Correct gap option does not match declared omitted sentence','BLOCKING');
  }
  const mc=questions.filter(q=>q.kind==='mc').length;
  const clearlyLong=answersLong.filter(Boolean).length;
  const longRate=answersLong.length?Math.round(100*clearlyLong/answersLong.length):0;
  if(answersLong.length&&longRate>25)flag(t.id,language,level,'CORRECT_LONGEST_OVER_25_PERCENT','answer-option design',
    clearlyLong+'/'+answersLong.length+' correct options unambiguously longest (by >5 chars); may allow a guessing shortcut');
  rows.push({topicId:t.id,language,level,title:v.title,paragraphs:paragraphs.length,approxWords:textWords,
   questions:questions.length,byKind,byTab,evidenceAnchors:totalEvidence,matchedEvidence:supportedEvidence,
   evidenceProblems:anchorFailures,correctClearlyLongestRate:longRate,wrongLengthBand:language==='en'&&(textWords<referenceBands[level][0]||textWords>referenceBands[level][1])});
 }
}
assert.equal(rows.length,120);
assert.equal(rows.reduce((s,v)=>s+v.questions,0),1800);
const totalEvidence=rows.reduce((s,v)=>s+v.evidenceAnchors,0);
const invalidEvidence=rows.reduce((s,v)=>s+v.evidenceProblems,0);
const byCode={};for(const f of findings)byCode[f.code]=(byCode[f.code]||0)+1;
const report={schemaVersion:1,kind:'READING_FIVE_TOPIC_SOURCE_AUDIT',reference:'Asteroids v2.3',
 approval:false,teacherApproval:false,sourceCopiesUnchanged:true,topicCount:topics.length,variantCount:rows.length,
 questionCount:1800,evidenceAnchorCount:totalEvidence,invalidEvidenceCount:invalidEvidence,
 evidenceVerification:'Exact literal substring only; does not prove semantic relevance or correct answer',
 notes:['Word bands are recommended for new English material, not absolute CEFR limits','Answer indices are checked structurally, but semantic correctness and private teacher key remain unverified','Physical iOS/Android/QR/offline UAT is outstanding','Different genres may be legitimate, but catalog titles and level descriptions must be accurate'],
 findingsByCode:byCode,findings,variants:rows};
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,'READING_5_SOURCE_QA.json'),JSON.stringify(report,null,2)+'\n','utf8');
const md=['# Reading Lab – 5 karet, 120 variant, 1 800 úloh','',
 'Zdroj: pět přesných původních studentských HTML ověřených kontrolou Git blob, beze změn.','',
 'Všech 5 témat používá 4 jazyky × 6 úrovní; 9/9/12/18/21/21 úloh na jazyk.',
 'Celkem zkontrolováno '+totalEvidence+' doslovných důkazových odkazů; strukturálně nenalezeno v textu: '+invalidEvidence+'.',
 'Toto není validace významu, správnosti učitelských klíčů, CEFR ani fyzický iOS test.',
 '',
 '## EN – přibližná délka studentských textů (slov)','',
 '| Téma | A1 | A2 | B1 | B2 | C1 | C2 |',
 '|---|---:|---:|---:|---:|---:|---:|',
 ...topics.map(t=>'| '+t.id.replace('rl-','')+' | '+LEVELS.map(l=>String(rows.find(v=>v.topicId===t.id&&v.language==='en'&&v.level===l).approxWords)).join(' | ')+' |'),
 '',
 'Doporučená pásma master v3.5 pro nově tvořené EN texty: A1 180–230, A2 230–300, B1 290–400, B2 380–520, C1 480–650, C2 580–800. Starší reference má povolené zdokumentované výjimky.','',
 '## Zjištěná rizika k revizi','',
 ...Object.entries(byCode).sort((a,b)=>b[1]-a[1]).map(([k,n])=>'- '+k+': '+n),
 '',
 ...findings.filter(f=>f.severity==='BLOCKING').slice(0,100).map(f=>'- '+f.topicId+'/'+f.language+' '+f.level+' / '+f.location+': '+f.code+' ('+f.detail+')'),
 '',
 '## Redakční výhrady','',
 '- Plastic in Our World: A1/A2/B1 mají jiné žánry než filmová recenze; netvrdit, že všech šest úrovní jsou recenze filmu.',
 '- Can Mistakes EN C1/C2 má krátké texty na 21 úloh; uvažovat rozšíření až společně s revizí všech důkazů a správných odpovědí.',
 '- Testování, soukromé učitelské klíče a finální schválení zůstávají oddělené a otevřené.',
 '','Stav DRAFT / NO MERGE / bez automatického schválení.',''];
fs.writeFileSync(path.join(output,'READING_5_SOURCE_QA_SUMMARY.md'),md.join('\n'));
console.log('PASS READING SOURCES:',topics.length,'topics,',rows.length,'variants,',1800,'questions,',totalEvidence,'evidence snippets');
console.log('EVIDENCE PROBLEMS:',invalidEvidence,'FINDINGS:',JSON.stringify(byCode));
console.log('EN LENGTH MATRIX:',JSON.stringify(topics.map(t=>({id:t.id,levels:LEVELS.map(l=>rows.find(v=>v.topicId===t.id&&v.language==='en'&&v.level===l).approxWords)}))));
console.log('SELECTED REVIEW FINDINGS:',JSON.stringify(findings.slice(0,30)));
