#!/usr/bin/env node
/* LSH E4E: independent Reading Lab assessment intake validator and PRIVATE scorer.
 * No evaluation of card scripts, network access, or output of correct answer letters.
 * The original HTML and assessor packets stay on the local machine: never commit them.
 * A numerical score is NOT proof of assessor independence or pedagogical approval.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {extract}=require('./reading-v34-data-audit.cjs');
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const EXPECTED_HEADER='mode,case_id,question_id,selected_letter';
const ASSIGN_HEADER='case_id,assessor_alias,isolated_context,saw_article,saw_key,saw_other_tabs,cefr_review_done,notes_recorded';
const MAX_FILE=75*1024*1024;
const sum=(array,callback)=>array.reduce((s,v)=>s+callback(v),0);
function sha(s){return crypto.createHash('sha256').update(s,'utf8').digest('hex');}
function expected(data){
  const cases=new Map(),rows=new Map(),qids=new Set();
  for(const lang of LANGS)for(const level of LEVELS){
    const variant=data?.[lang]?.[level];
    if(!variant||!Array.isArray(variant.questions)||!Array.isArray(variant.tabs))
      throw Error('Source lacks complete variant '+lang+':'+level);
    const fullId='ft-'+lang+'-'+level;
    const qs=variant.questions;
    const addCase=(id,mode,tab,questions)=>{
      if(cases.has(id))throw Error('Duplicate case ID');
      const spec={id,mode,lang,level,tab:tab||null,questionCount:questions.length,items:[]};
      for(const q of questions){
        if(!q.id||!Array.isArray(q.choices)||!Number.isInteger(q.answer)||
          q.answer<0||q.answer>=q.choices.length)throw Error('Invalid answer data in source');
        const key=mode+'|'+id+'|'+q.id;
        if(rows.has(key))throw Error('Duplicate question mapping in source');
        rows.set(key,{key,mode,id,lang,level,tab:q.tab,questionId:q.id,choiceCount:q.choices.length,answer:q.answer});
        spec.items.push(key);
      }
      cases.set(id,spec);
    };
    for(const q of qs){
      const key=lang+':'+level+':'+q.id;
      if(qids.has(key))throw Error('Duplicate question ID '+key);
      qids.add(key);
    }
    addCase(fullId,'fulltext',null,qs);
    if(level==='C1'||level==='C2')
      for(const tab of variant.tabs){
        const t=qs.filter(q=>q.tab===tab.id);
        if(t.length!==3)throw Error('Blind tabs must contain exactly 3 questions: '+lang+level+tab.id);
        addCase('blind-'+lang+'-'+level+'-'+tab.id,'blind',tab.id,t);
      }
  }
  const blind=[...cases.values()].filter(c=>c.mode==='blind'),full=[...cases.values()].filter(c=>c.mode==='fulltext');
  if(cases.size!==80||blind.length!==56||full.length!==24||rows.size!==528)
    throw Error('Expected 80 cases / 56 blind / 24 with text / 528 answer slots');
  return {cases,rows,source:{blindCases:blind.length,withTextCases:full.length,blindSlots:168,withTextSlots:360}};
}
function csvRows(raw,header,label){
  if(typeof raw!=='string')throw Error(label+' CSV missing');
  const lines=raw.replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');
  while(lines.length&&lines[lines.length-1]==='')lines.pop();
  if(lines.shift()!==header)throw Error(label+' CSV column header mismatch');
  return lines.map((line,index)=>{
    const cells=line.split(',');
    if(cells.length!==header.split(',').length)throw Error(label+' row '+(index+2)+' malformed');
    return cells.map(x=>x.trim());
  });
}
function assess({studentHTML,manifest,blindCSV,withTextCSV,assignmentsCSV=null,packets=null}){
  const data=extract(studentHTML),spec=expected(data),sourceSHA256=sha(studentHTML),issues=[];
  const problem=(code,detail)=>issues.push({code,detail});
  if(!manifest||manifest.metadata?.sourceSHA256!==sourceSHA256)
    problem('SOURCE_HASH','Manifest SHA-256 does not match the exact original student card');
  const declared=manifest?.cases||[];
  if(!Array.isArray(declared)||declared.length!==80)problem('CASE_MANIFEST_COUNT','Expected 80 manifest case declarations');
  const declaredCases=new Set();
  for(const c of Array.isArray(declared)?declared:[]){
    if(declaredCases.has(c.id))problem('DUPLICATE_CASE',String(c.id));
    declaredCases.add(c.id);
    const expectedCase=spec.cases.get(c.id);
    if(!expectedCase||expectedCase.mode!==(c.kind||c.mode)||expectedCase.lang!==c.lang||
       expectedCase.level!==c.level||expectedCase.questionCount!==c.questionCount||
       (expectedCase.mode==='blind'&&expectedCase.tab!==c.tab))
      problem('CASE_MANIFEST_MAPPING',String(c.id));
  }
  for(const id of spec.cases.keys())if(!declaredCases.has(id))problem('MISSING_MANIFEST_CASE',id);
  const responseMap=new Map(),seen=new Set();
  for(const [mode,raw] of [['blind',blindCSV],['fulltext',withTextCSV]]){
    const dataRows=csvRows(raw,EXPECTED_HEADER,mode);
    for(const [declaredMode,caseId,qid,choice] of dataRows){
      const key=declaredMode+'|'+caseId+'|'+qid;
      if(declaredMode!==mode){problem('MODE_MISMATCH',key);continue;}
      if(seen.has(key)){problem('DUPLICATE_RESPONSE',key);continue;}seen.add(key);
      const expectedRow=spec.rows.get(key);
      if(!expectedRow){problem('UNEXPECTED_RESPONSE',key);continue;}
      const normalized=choice.toUpperCase();
      if(normalized&&!/^[A-Z]$/.test(normalized)){
        problem('INVALID_CHOICE',key);continue;
      }
      if(normalized&&normalized.charCodeAt(0)-65>=expectedRow.choiceCount){
        problem('OUT_OF_RANGE_CHOICE',key);continue;
      }
      responseMap.set(key,normalized);
    }
  }
  for(const key of spec.rows.keys())if(!responseMap.has(key))problem('MISSING_RESPONSE_ROW',key);
  // Empty responses are intentionally NOT scored as incorrect; this remains an unfinished assessment.
  const unanswered=[...spec.rows.keys()].filter(key=>!responseMap.get(key));
  const resultCases=[];
  for(const [caseId,c] of spec.cases){
    const complete=c.items.every(key=>responseMap.has(key)&&!!responseMap.get(key));
    let correct=null;
    if(complete)correct=sum(c.items,key=>{
      const source=spec.rows.get(key);
      return Number(responseMap.get(key).charCodeAt(0)-65===source.answer);
    });
    const criticalBlind=c.mode==='blind'&&['scan','matching','detail'].includes(c.tab);
    resultCases.push({caseId,mode:c.mode,language:c.lang,level:c.level,tab:c.tab,
      answersExpected:c.items.length,answersPresent:c.items.filter(key=>!!responseMap.get(key)).length,
      correct,accuracy:complete?Number((100*correct/c.items.length).toFixed(1)):null,
      criticalBlind,overFiftyPercent:criticalBlind&&complete&&correct/c.items.length>0.5});
  }
  // Assignment attestations are self-reported and NEVER certify true independence.
  let assignmentStatus='NOT_PROVIDED',assignmentCoverage=0;
  if(assignmentsCSV!==null){
    const arows=csvRows(assignmentsCSV,ASSIGN_HEADER,'assignments'),aliases=new Map(),found=new Set(),blindAliases=new Set(),fullTextAliases=new Set();
    for(const row of arows){
      const [id,alias,isolated,sawArticle,sawKey,otherTabs,cefrDone,notesDone]=row;
      if(!spec.cases.has(id)){problem('UNKNOWN_ASSIGNEE_CASE',id);continue;}
      if(found.has(id)){problem('DUPLICATE_ASSIGNMENT',id);continue;}found.add(id);
      if(!alias){continue;}
      if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,40}$/.test(alias)){
        problem('ALIAS_FORMAT',id);continue;
      }
      const c=spec.cases.get(id);
      const policy=(isolated==='YES'&&sawKey==='NO'&&notesDone==='YES'&&
        (c.mode==='blind'?sawArticle==='NO'&&otherTabs==='NO':
          sawArticle==='YES'&&cefrDone==='YES'));
      if(!policy){problem('ASSIGNMENT_POLICY',id);continue;}
      const normalizedAlias=alias.toLowerCase();
      if(c.mode==='blind'){
        blindAliases.add(normalizedAlias);
        const k=normalizedAlias+'|'+c.level;
        if(aliases.has(k))problem('MULTIPLE_TABS_SAME_ASSESSOR_LEVEL',id+' conflicts '+aliases.get(k));
        else aliases.set(k,id);
      }else fullTextAliases.add(normalizedAlias);
      assignmentCoverage++;
    }
    for(const alias of blindAliases)if(fullTextAliases.has(alias))
      problem('BLIND_ASSESSOR_SAW_ARTICLE','Assessor alias '+alias+' is assigned to both BLIND and WITH-TEXT cases; all that assessor\'s blind results are invalid');
    for(const id of spec.cases.keys())if(!found.has(id))problem('MISSING_ASSIGNMENT_ROW',id);
    assignmentStatus=assignmentCoverage===80?'SELF_DECLARED_ALL_CASES':'NOT_YET_DECLARED';
  }
  let packetCoverage=null;
  if(packets){
    let found=0;
    for(const [id,c] of spec.cases){
      const relative=(c.mode==='blind'?'blind_one_tab_only':'with_text_one_variant_only')+'/'+id+'.txt';
      const src=packets[relative];
      if(typeof src!=='string'){problem('MISSING_PACKET',relative);continue;}
      // Check case attribution and question scope; don't echo source content or correct answers.
      const present=c.items.every(key=>src.includes(spec.rows.get(key).questionId+' | '));
      if(!present){problem('PACKET_QUESTION_MISSING',id);continue;}
      if(c.mode==='blind'){
        const actualIds=[...src.matchAll(/^\s*((?:en|es|de|fr)-(?:c1|c2)-[a-z0-9-]+)\s*\|/gim)].map(m=>m[1]);
        const wanted=c.items.map(key=>spec.rows.get(key).questionId);
        if(actualIds.length!==wanted.length||actualIds.slice().sort().join('|')!==wanted.slice().sort().join('|')){
          problem('PACKET_SCOPE',id);continue;
        }
        const variant=data[c.lang][c.level];
        if(variant.paragraphs.some(text=>text.length>90&&src.includes(text))){
          problem('BLIND_ARTICLE_LEAK',id);continue;
        }
      }
      found++;
    }
    packetCoverage={found,expected:80};
  }
  const scoredCases=resultCases.filter(c=>c.accuracy!==null),hard=resultCases.filter(c=>c.criticalBlind&&c.accuracy!==null);
  const allAnswersFilled=unanswered.length===0&&scoredCases.length===80;
  const inputValid=issues.length===0;
  const status=!inputValid?'INVALID_INPUT':!allAnswersFilled?'WAITING_FOR_INDEPENDENT_RESPONSES':
     assignmentStatus!=='SELF_DECLARED_ALL_CASES'?'SCORED_BUT_ASSESSOR_EVIDENCE_MISSING':
     'SCORED_SELF_DECLARED_REQUIRES_MANUAL_REVIEW';
  return {kind:'READING_LAB_QA_V34_VALIDATED_INTAKE_V2',
    sourceSHA256,method:'NO_EVAL_OFFLINE_PRIVATE_SCORING',casesExpected:80,answerSlotsExpected:528,
    counts:{blindCases:56,withTextCases:24,blindSlots:168,withTextSlots:360,
      scoredCases:scoredCases.length,unansweredSlots:unanswered.length,
      responseRowsPresent:responseMap.size,issues:issues.length,
      assignmentDeclarations:assignmentCoverage,criticalBlindCasesScored:hard.length,
      criticalBlindOver50Percent:hard.filter(c=>c.overFiftyPercent).length},
    status,assignmentStatus,packetCoverage,
    scoreReport:resultCases,issues,
    reviewWarning:'Every full-text disagreement and every reported ambiguity needs an independent editorial review. Three-item tabs have coarse 0/33.3/66.7/100% scores. Source answer indices are NOT proof of pedagogical correctness. Assessor independence cannot be verified from self-declaration.',
    releaseDecision:'NO_GO'};
}
function read(p){const stat=fs.statSync(p);if(!stat.isFile()||stat.size>MAX_FILE)throw Error('Invalid or oversized file');return fs.readFileSync(p,'utf8');}
function main(){
  const [original,folder]=process.argv.slice(2);
  if(!original||!folder){process.stderr.write('Usage: node reading-v34-assessor-score.cjs ORIGINAL_PRIVATE_STUDENT.html PRIVATE_QA_PACKET_DIR\n');process.exitCode=2;return;}
  try{
    const dir=path.resolve(folder),readIn=name=>read(path.join(dir,name));
    const assign=fs.existsSync(path.join(dir,'ASSIGNMENTS.csv'))?readIn('ASSIGNMENTS.csv'):null;
    const packetFiles={};
    for(const dirName of ['blind_one_tab_only','with_text_one_variant_only']){
      const fullDir=path.join(dir,dirName);
      if(fs.existsSync(fullDir))for(const name of fs.readdirSync(fullDir))
        if(name.endsWith('.txt'))packetFiles[dirName+'/'+name]=read(path.join(fullDir,name));
    }
    const result=assess({studentHTML:read(original),manifest:JSON.parse(readIn('manifest.json')),
      blindCSV:readIn('RESPONSES_BLIND.csv'),
      withTextCSV:readIn('RESPONSES_WITH_TEXT.csv'),assignmentsCSV:assign,packets:packetFiles});
    process.stdout.write(JSON.stringify(result,null,2)+'\n');
    if(result.status==='INVALID_INPUT')process.exitCode=1;
  }catch(error){process.stderr.write('QA intake error: '+error.message+'\n');process.exitCode=2;}
}
if(require.main===module)main();
else module.exports={assess,expected,csvRows,EXPECTED_HEADER,ASSIGN_HEADER};
