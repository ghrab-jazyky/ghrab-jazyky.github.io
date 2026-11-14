/* LSH R69 Conlangs · one source bank for practice, test and teacher key. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHConlangs=api;
})(typeof window!=='undefined'?window:this,function(){
 'use strict';
 const REQUIRED=['A1','A2','A3','A4','A5','A6','B1','B2','B3','B4','B5','B6','C1','C2','C3','C4','C5'];
 const TNS=['TRUE','FALSE','NOT STATED'];
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function requireOk(ok,msg){if(!ok)throw Error('Conlangs: '+msg)}
 function isText(x){return typeof x==='string'&&x.trim().length>0&&x.length<2000}
 function validate(data){
  requireOk(data&&data.kind==='LSH_CONLANGS_LISTENING_A1C2_V1','invalid bank identifier');
  requireOk(Array.isArray(data.levels)&&data.levels.join(',')==='A1,A2,B1,B2,C1,C2','six CEFR variants required');
  requireOk(data.variants&&data.practice,'missing authored variants or practice data');
  for(const level of data.levels){
   const bank=data.variants[level],practice=data.practice[level],variant=data[level];
   requireOk(bank&&Array.isArray(bank.questionBank)&&bank.questionBank.length===17,'expected 17 independent questions at '+level);
   requireOk(Array.isArray(bank.matchingBank)&&bank.matchingBank.length===7,'expected seven matching choices at '+level);
   requireOk(bank.matchingBank.every((x,i)=>Array.isArray(x)&&x[0]===String.fromCharCode(65+i)&&isText(x[1])),'invalid matching bank at '+level);
   requireOk(new Set(bank.matchingBank.map(x=>x[1])).size===7,'duplicate matching descriptions at '+level);
   const seen=new Set(),matches=new Set();
   for(const q of bank.questionBank){
    requireOk(q&&REQUIRED.includes(q.id)&&!seen.has(q.id),'invalid or duplicate question at '+level);
    seen.add(q.id);
    requireOk(isText(q.question)&&isText(q.explanation)&&isText(q.evidence),'incomplete question at '+level);
    if(q.type==='mc'){
     requireOk(q.id[0]==='A'&&Array.isArray(q.options)&&q.options.length===4&&q.options.every(isText)&&
      new Set(q.options).size===4&&/^[A-D]$/.test(q.correct),'invalid multiple choice at '+level);
    }else if(q.type==='tns'){
     requireOk(q.id[0]==='B'&&TNS.includes(q.correct),'invalid T/F/NS at '+level);
    }else if(q.type==='match'){
     requireOk(q.id[0]==='C'&&/^[A-G]$/.test(q.correct)&&!matches.has(q.correct),'invalid matching at '+level);
     matches.add(q.correct);
    }else requireOk(false,'unknown question type at '+level);
   }
   requireOk(REQUIRED.every(id=>seen.has(id))&&matches.size===5,'incomplete question coverage at '+level);
   requireOk(['TRUE','FALSE','NOT STATED'].every(code=>bank.questionBank.some(q=>q.type==='tns'&&q.correct===code)),
    'missing T/F/NS distinction at '+level);
   requireOk(practice&&isText(practice.objective)&&Array.isArray(practice.pre)&&practice.pre.length>=1&&
    Array.isArray(practice.after)&&practice.after.length>=1&&Array.isArray(practice.vocabulary)&&
    practice.vocabulary.length>=5,'incomplete scaffolding at '+level);
   requireOk(variant&&variant.gist.length===6&&variant.detail.length===6&&
    variant.matching.items.length===5&&variant.matching.options.length===7&&
    variant.sequence.length===0&&variant.facts.length===0,'invalid common LSH mapping at '+level);
   for(const q of bank.questionBank){
    const target=(q.type==='mc'?variant.gist:q.type==='tns'?variant.detail:variant.matching.items)
     .find(row=>row.id===q.id);
    const n=q.type==='tns'?TNS.indexOf(q.correct):q.correct.charCodeAt(0)-65;
    requireOk(target&&target.correct===n&&target.title===q.question,'authored/test key mismatch at '+level+' '+q.id);
   }
  }
  requireOk(JSON.stringify(data.questionBank)===JSON.stringify(data.variants.B2.questionBank)&&
    JSON.stringify(data.matchingBank)===JSON.stringify(data.variants.B2.matchingBank),
    'B2 question bank is not canonical');
  return data;
 }
 function extractFromHtml(html){
  requireOk(typeof html==='string'&&html.length<300000,'source HTML invalid');
  const match=/\bconst\s+DATA\s*=\s*\{/.exec(html);
  requireOk(!!match,'DATA block absent');
  const begin=match.index+match[0].length-1;
  let quoted=false,escaped=false,depth=0;
  for(let i=begin;i<html.length;i++){
   const ch=html[i];
   if(quoted){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')quoted=false;}
   else if(ch==='"')quoted=true;
   else if(ch==='{')depth++;
   else if(ch==='}'&&--depth===0){
    let obj;try{obj=JSON.parse(html.slice(begin,i+1));}catch(_){throw Error('Conlangs: invalid DATA JSON')}
    return validate(obj);
   }
  }
  throw Error('Conlangs: DATA block incomplete');
 }
 function normalizeResponses(raw){
  const a={};
  for(const id of REQUIRED){
   const val=raw&&own(raw,id)?raw[id]:'';
   a[id]=typeof val==='string'&&val.length<=40?val.trim().toUpperCase():'';
  }
  return a;
 }
 function gradeAnswers(data,raw,level='B2'){
  requireOk(data.levels.includes(level),'invalid level');
  validate(data);
  const a=normalizeResponses(raw),out=[],variant=data.variants[level],bank=Object.fromEntries(variant.matchingBank);
  const matchUsed=new Set();
  for(const q of variant.questionBank){
   const value=a[q.id];
   let allowed=q.type==='mc'?['A','B','C','D']:q.type==='tns'?TNS:Object.keys(bank);
   requireOk(!value||allowed.includes(value),'invalid answer: '+q.id);
   if(q.type==='match'&&value){requireOk(!matchUsed.has(value),'matching letter used twice');matchUsed.add(value)}
   const label=code=>{
    if(!code)return 'Not answered';
    if(q.type==='mc')return code+' — '+q.options[code.charCodeAt(0)-65];
    if(q.type==='match')return code+' — '+bank[code];
    return code;
   };
   out.push({id:q.id,type:q.type,question:q.question,answer:value,correctAnswer:q.correct,
    answered:!!value,correct:value===q.correct,selectedLabel:label(value),expectedLabel:label(q.correct),
    reason:q.explanation,evidence:q.evidence});
  }
  const correct=out.filter(x=>x.correct).length,answered=out.filter(x=>x.answered).length;
  return {kind:'LSH_CONLANGS_LOCAL_RESULT_V1',level,items:out,correct,answered,total:17,
   allAnswered:answered===17,sections:{
    A:out.filter(x=>x.id[0]==='A').filter(x=>x.correct).length,
    B:out.filter(x=>x.id[0]==='B').filter(x=>x.correct).length,
    C:out.filter(x=>x.id[0]==='C').filter(x=>x.correct).length
   }};
 }
 return Object.freeze({REQUIRED,TNS,validate,extractFromHtml,normalizeResponses,gradeAnswers});
});
