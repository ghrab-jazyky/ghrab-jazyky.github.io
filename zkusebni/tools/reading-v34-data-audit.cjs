#!/usr/bin/env node
/* E4C Reading Lab v3.4 read-only QA: parse inline JSON, NEVER eval card scripts.
 * Reports metrics and question IDs only; never exports source text or answers. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const TAB_COUNTS={A1:3,A2:3,B1:4,B2:6,C1:7,C2:7};
const TASK_COUNTS={A1:9,A2:9,B1:12,B2:18,C1:21,C2:21};
const MAX_BYTES=75*1024*1024;
function extract(html){
 if(typeof html!=='string')throw Error('Expected HTML text');
 const found=[...html.matchAll(/\bconst\s+DATA\s*=\s*/g)];
 if(found.length!==1)throw Error('Expected exactly one const DATA JSON literal');
 const start=found[0].index+found[0][0].length;
 if(html[start]!=='{')throw Error('DATA must be a JSON object literal');
 let depth=0,inString=false,escape=false,end=-1;
 for(let i=start;i<html.length;i++){
  const c=html[i];
  if(inString){
   if(escape)escape=false;
   else if(c==='\\')escape=true;
   else if(c==='"')inString=false;
   continue;
  }
  if(c==='"'){inString=true;continue;}
  if(c==='{')depth++;
  if(c==='}'&&--depth===0){end=i+1;break;}
 }
 if(end===-1||! /^\s*;/.test(html.slice(end,end+20)))throw Error('Incomplete DATA JSON');
 return JSON.parse(html.slice(start,end));
}
function audit(html,source='input.html'){
 if(Buffer.byteLength(html,'utf8')>MAX_BYTES)throw Error('Input exceeds 75 MB cap');
 const data=extract(html),findings=[],rows=[],allIds=new Set();
 let questionCount=0;
 const mark=(severity,type,variant,detail)=>findings.push({severity,type,variant,detail});
 const languages=Object.keys(data||{});
 if(languages.length!==4||languages.some(x=>!LANGS.includes(x)))
  mark('critical','languages','all','Expected exactly EN/ES/DE/FR');
 for(const lang of LANGS)for(const level of LEVELS){
  const variant=lang+':'+level,entry=data?.[lang]?.[level];
  if(!entry||typeof entry!=='object'){mark('critical','missing-variant',variant,'Missing variant');continue;}
  const paragraphs=entry.paragraphs,tabs=entry.tabs,questions=entry.questions;
  if(!Array.isArray(paragraphs)||!paragraphs.every(x=>typeof x==='string')){
   mark('critical','paragraphs',variant,'Missing/invalid paragraph list');continue;
  }
  if(!Array.isArray(tabs)||!Array.isArray(questions)){
   mark('critical','tasks',variant,'Missing tabs or task list');continue;
  }
  if(tabs.length!==TAB_COUNTS[level])mark('critical','tab-count',variant,'Expected '+TAB_COUNTS[level]+' found '+tabs.length);
  if(questions.length!==TASK_COUNTS[level])mark('critical','question-count',variant,'Expected '+TASK_COUNTS[level]+' found '+questions.length);
  const byTab=Object.fromEntries(tabs.map(t=>[t.id,[]]));
  let lc=0,eligible=0;const positions={};
  for(const q of questions){
   questionCount++;
   if(!q.id||allIds.has(q.id))mark('critical','question-id',variant,String(q.id||'<missing>'));
   else allIds.add(q.id);
   if(!Array.isArray(byTab[q.tab]))mark('critical','unknown-tab',variant,String(q.id||'<missing>'));
   else byTab[q.tab].push(q);
   if(!Array.isArray(q.choices)||q.choices.length<3){
    mark('critical','choices',variant,String(q.id||'<missing>'));continue;
   }
   if(!Number.isInteger(q.answer)||q.answer<0||q.answer>=q.choices.length)
    mark('critical','answer-index',variant,String(q.id||'<missing>'));
   if(new Set(q.choices).size!==q.choices.length)
    mark('medium','duplicate-option',variant,String(q.id||'<missing>'));
   if(Number.isInteger(q.answer)){
    const letter=String.fromCharCode(65+q.answer);positions[letter]=(positions[letter]||0)+1;
    if(q.kind!=='match'&&q.answer>=0&&q.answer<q.choices.length){
     eligible++;
     const sizes=q.choices.map(x=>String(x).length),length=sizes[q.answer];
     const competitor=Math.max(...sizes.filter((x,i)=>i!==q.answer));
     if(length>competitor+5)lc++;
    }
   }
   if(!Array.isArray(q.evidence)||!q.evidence.length)
    mark('high','missing-evidence',variant,String(q.id||'<missing>'));
   else for(const anchor of q.evidence){
    const para=paragraphs[anchor?.p];
    const snippet=anchor?.text;
    if(!Number.isInteger(anchor?.p)||typeof para!=='string'||typeof snippet!=='string'||!snippet||
      para.split(snippet).length!==2)
      mark('high','evidence-mismatch',variant,String(q.id||'<missing>'));
   }
   const targets=q.targets||(q.target?[q.target]:[]);
   if(!Array.isArray(targets)){mark('high','targets-shape',variant,String(q.id||'<missing>'));continue;}
   for(const target of targets){
    if(!Array.isArray(target)||target.length<2){
     mark('high','target-shape',variant,String(q.id||'<missing>'));continue;
    }
    const [p,text,occurrence=1]=target;
    const para=paragraphs[p],found=(typeof para==='string'&&typeof text==='string'&&text)?para.split(text).length-1:0;
    if(!Number.isInteger(p)||!Number.isInteger(occurrence)||occurrence<1||found<occurrence)
     mark('high','target-mismatch',variant,String(q.id||'<missing>'));
   }
   if(entry.gap&&q.kind!=='gap'){
    const hidden=entry.gap.sentence;
    if(typeof hidden==='string'&&hidden){
     if((q.evidence||[]).some(a=>typeof a.text==='string'&&hidden.includes(a.text))||
        q.choices.some(c=>typeof c==='string'&&c.includes(hidden)))
       mark('high','hidden-sentence-leak',variant,String(q.id||'<missing>'));
    }
   }
  }
  const tabPatterns=new Map();
  for(const [tab,qs] of Object.entries(byTab)){
   if(qs.length!==3)mark('critical','tasks-per-tab',variant,tab+' has '+qs.length+' tasks instead of 3');
   if(qs.length===3){
    const seq=qs.map(q=>q.answer).join(',');
    if(seq==='0,1,2'||seq==='1,2,3')mark('high','predictable-answer-order',variant,tab);
    if(qs.every(q=>q.answer===qs[0].answer))mark('high','all-same-position',variant,tab);
    if(tabPatterns.has(seq))mark('high','duplicate-answer-pattern',variant,tab+' repeats '+tabPatterns.get(seq));
    else tabPatterns.set(seq,tab);
   }
  }
  const positionSuccess=questions.reduce((s,q)=>s+(q.answer===byTab[q.tab]?.indexOf(q)),0)/Math.max(questions.length,1);
  if(positionSuccess>.45)mark('medium','position-only-strategy',variant,(positionSuccess*100).toFixed(1)+' percent');
  if(['B2','C1','C2'].includes(level)&&eligible&&lc/eligible>.25)
   mark('medium','longest-correct-option',variant,lc+'/'+eligible+' correct options uniquely longest by >5 characters');
  rows.push({language:lang,level,paragraphCount:paragraphs.length,tabCount:tabs.length,
   questionCount:questions.length,answerPositions:positions,positionOnlySuccess:Number(positionSuccess.toFixed(3)),
   longestCorrectOver5:lc,eligibleCorrectOptions:eligible});
 }
 if(rows.length!==24)mark('critical','variants-total','all','Expected 24, got '+rows.length);
 if(questionCount!==360)mark('critical','tasks-total','all','Expected 360, got '+questionCount);
 return {
  tool:'LSH E4C read-only Reading Lab v3.4 data checker',source,sha256:crypto.createHash('sha256').update(html).digest('hex'),
  standard:'Reading Lab v3.4',execution:'NO_EVAL_NO_NETWORK',checks:'STRUCTURAL_AND_PATTERN_ONLY',
  variants:rows.length,questions:questionCount,rows,findings,
  counts:{critical:findings.filter(x=>x.severity==='critical').length,
   high:findings.filter(x=>x.severity==='high').length,
   medium:findings.filter(x=>x.severity==='medium').length},
  releaseDecision:'NO_GO',
  limitations:'No evaluation of linguistic/CEFR quality, teacher key consistency, actual dictionary coverage, device behavior, private data or approval. Source text and answer values are not output.'
 };
}
if(require.main===module){
 if(process.argv.length!==3){console.error('Usage: node reading-v34-data-audit.cjs path/to/approved-student-card.html');process.exitCode=2;}
 else try{
  const source=process.argv[2],file=fs.statSync(source);
  if(!file.isFile()||file.size>MAX_BYTES)throw Error('Not a file or exceeds size cap');
  const result=audit(fs.readFileSync(source,'utf8'),path.basename(source));
  console.log(JSON.stringify(result,null,2));
  if(result.counts.critical)process.exitCode=1;
 }catch(e){console.error('Data preflight error: '+e.message);process.exitCode=2;}
}else module.exports={extract,audit,MAX_BYTES};
