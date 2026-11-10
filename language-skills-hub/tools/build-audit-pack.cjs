#!/usr/bin/env node
'use strict';
// Generates a private-to-review workflow bundle from existing PUBLIC draft banks.
// NO grades, students, teacher secrets, new content generation or publication.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.resolve(process.argv[2]||path.join(root,'audit-output-r34'));
const {records,summary}=require('./independent-coverage.cjs');
const reading=require('../self-check/reading/reading-core.js');
const listening=require('../self-check/listening/listening-core.js');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8'));
const write=(name,text)=>{const target=path.join(out,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text,'utf8')};
const esc=x=>String(x??'').replaceAll('|','\\|').replace(/\r?\n/g,' ');
const table=(items,cols)=>'| '+cols.join(' | ')+' |\n|'+cols.map(()=>'---').join('|')+'|\n'+items.map(item=>'| '+cols.map(k=>esc(item[k])).join(' | ')+' |').join('\n')+'\n';
const policy=[
 '# LSH R34 – Independent test reviewer dossier',
 '',
 'Coverage: '+summary.total+' separate Reading/Listening variants; authored: '+summary.authored+'; teacher approved: '+summary.approved+'; missing: '+summary.missing+'.',
 '',
 '## Claude independent audit instructions',
 '',
 'Inspect each candidate using the ORIGINAL source and original practice tasks below.',
 'Do not trust old answer keys or prior assistant findings. Verify the sole correct option,',
 'the CEFR level and all distractors; identify semantic overlaps with practice.',
 'For every question give original source evidence, exact correction where needed,',
 'a severity, PASS/FAIL, expected duration and score fairness.',
 'Check privacy, UI accessibility, 4-corner unlock, timer/reload, and iOS/Android.',
 'Do not invent missing question banks or classify unreviewed banks as approved.',
 'A CSV local grade is not an authenticated school record. Public JS exposes keys.',
 'Speaking testing requires an independently agreed teacher rubric, not AI auto-grading.',
 'Listening requires video/audio and transcript evaluation; text questions alone are insufficient.',
 'Never touch original practice cards. Teacher sign-off remains outside automated checks.',
 '',
 'See coverage.json, MISSING-VARIANTS.md, and review/ per authored candidate.',
].join('\n');
write('README-FOR-CLAUDE.md',policy+'\n');
write('coverage.json',JSON.stringify(summary,null,2)+'\n');
const missing=records.filter(r=>!r.approved);
write('MISSING-VARIANTS.md','# Incomplete / non-approved test variants\n\n'+table(
 missing.map(r=>({skill:r.skill,topic:r.id,language:r.language,level:r.level,status:r.status,file:'self-check/test-banks/'+r.bankPath})),
 ['skill','topic','language','level','status','file']));
for(const r of records.filter(x=>x.available)){
 const entry=catalog.entries.find(e=>e.id===r.id);
 const html=fs.readFileSync(path.join(root,entry.relative),'utf8');
 const data=r.skill==='cteni'?reading.parseReadingData(html):listening.extractJson(html,'DATA');
 const practice=r.skill==='cteni'?reading.variantFromData(data,r.language,r.level):listening.variant(data,r.level);
 const bank=JSON.parse(fs.readFileSync(path.join(root,'self-check/test-banks',r.bankPath),'utf8'));
 const passage=(practice.paragraphs||[]).map((p,i)=>'PARAGRAPH '+(i+1)+':\n'+p).join('\n\n');
 const rows=(questions)=>questions.map((q,i)=>({id:q.id||String(i+1),stem:q.q,
  choices:(q.choices||[]).map((c,j)=>String.fromCharCode(65+j)+' '+c).join('; '),
  key:Number.isInteger(q.answer)?String.fromCharCode(65+q.answer):'PENDING',
  evidence:q.sourceParagraph||'',rationale:q.explanation||''}));
 const content=['# '+r.id+' / '+r.language+' / '+r.level,
  'STATUS: '+r.status+'; APPROVED: '+r.approved+'; SHA: '+r.sourceHash,
  'BANK: '+r.bankPath,
  '', '## Original passage / media', passage||'Listening requires independent audio/video evidence.',
  '', '## Existing practice tasks', table(rows(practice.questions||[]),['id','stem','choices','key','rationale']),
  '', '## Proposed INDEPENDENT test tasks', table(rows(bank.questions||[]),['id','stem','choices','key','evidence','rationale']),
  '', '## Independent verdict: PENDING',
  'Check each item for multiple plausible keys, inaccurate evidence, distractor quality,',
  'CEFR lexical difficulty, real independence and scoring fairness. Provide corrected JSON.'].join('\n');
 write('review/'+r.id+'/'+r.language+'-'+r.level+'.md',content+'\n');
}
console.log('Claude audit pack: '+out+'; authored '+summary.authored+' / '+summary.total);
