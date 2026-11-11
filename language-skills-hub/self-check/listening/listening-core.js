/* LSH R24: independent, public-data Listening self-check – never an authenticated exam. */
(function(root){
 'use strict';
 const LEVELS=Object.freeze(['A1','A2','B1','B2','C1','C2']);
 const TOPICS=Object.freeze(['ll-matthew-oscars','ll-harrison-ford','ll-peaky-no-fighting']);
 const PHASES=Object.freeze(['first-listening','listen-and-interpret','listen-write-and-reconstruct']);
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&
   (Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
 function must(ok,message){if(!ok)throw new Error(message)}
 function nonempty(s,max=3000){return typeof s==='string'&&s.trim().length>0&&s.length<=max}
 function extractJson(html,name){
  must(typeof html==='string'&&html.length>0&&html.length<=200000,'Invalid Listening source HTML.');
  must(['DATA','SOURCES'].includes(name),'Unsupported source section.');
  const re=new RegExp('\\bconst\\s+'+name+'\\s*=\\s*\\{','g');
  const match=re.exec(html);
  must(match,name+' section not found in public source.');
  const begin=match.index+match[0].length-1;
  let quote=false,escaped=false,depth=0,end=-1;
  for(let i=begin;i<html.length;i++){
   const c=html[i];
   if(quote){
    if(escaped)escaped=false;
    else if(c==='\\')escaped=true;
    else if(c==='"')quote=false;
   }else if(c==='"')quote=true;
   else if(c==='{')depth++;
   else if(c==='}'){
    if(--depth===0){end=i+1;break;}
   }
  }
  must(end>begin,'Source contains an incomplete '+name+' section.');
  let parsed;
  try{parsed=JSON.parse(html.slice(begin,end));}
  catch(_){throw new Error('Source contains unreadable '+name+' JSON.');}
  must(plain(parsed),'Source '+name+' must be an object.');
  return parsed;
 }
 function catalogEntry(catalog,topic){
  must(plain(catalog)&&Array.isArray(catalog.entries)&&TOPICS.includes(topic),'Unknown Listening topic.');
  const e=catalog.entries.find(x=>x.id===topic&&x.skill==='poslech');
  must(e&&/^poslech\/[a-z0-9-]+\/index\.html$/.test(e.relative),'No approved source Listening card.');
  must(Array.isArray(e.languages)&&e.languages.length===1&&e.languages[0]==='en','Listening is English-only.');
  must(Array.isArray(e.levels)&&LEVELS.every(l=>e.levels.includes(l)),'Incomplete CEFR levels.');
  return e;
 }
 function validate(v){
  must(plain(v)&&nonempty(v.goal,1500),'Missing listening goal.');
  for(const phase of ['gist','detail']){
   const arr=v[phase];
   must(Array.isArray(arr)&&arr.length>=1&&arr.length<=20,'Invalid '+phase+' tasks.');
   for(const q of arr){
    must(plain(q)&&nonempty(q.title,2000)&&['single','multi'].includes(q.type)&&
       Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=10&&
       q.options.every(x=>nonempty(x,1000)),'Invalid question in '+phase+'.');
    if(q.type==='single'){
     must(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length,'Invalid single answer.');
    }else{
     must(Array.isArray(q.correct)&&q.correct.length>=2&&q.correct.length<=q.options.length&&
       q.correct.every(x=>Number.isInteger(x)&&x>=0&&x<q.options.length)&&
       new Set(q.correct).size===q.correct.length,'Invalid multiple answers.');
    }
   }
  }
  must(Array.isArray(v.sequence)&&v.sequence.length>=2&&v.sequence.length<=20&&
    v.sequence.every(x=>nonempty(x,2500))&&new Set(v.sequence).size===v.sequence.length,
    'Invalid reconstruction sequence.');
  for(const phase of ['facts','open']){
   must(Array.isArray(v[phase])&&v[phase].length>=1&&v[phase].length<=12,'Invalid writing tasks.');
   for(const q of v[phase])must(plain(q)&&nonempty(q.title,2000)&&
     nonempty(q.answer,6000),'Missing writing reference.');
  }
  return v;
 }
 function variant(data,level){
  must(LEVELS.includes(level)&&plain(data)&&own(data,level),'Missing CEFR variant.');
  return validate(data[level]);
 }
 function normalizeResponse(v,a){
  must(plain(a),'Answers must be an object.');
  const normalized={gist:[],detail:[],sequence:[],facts:[],open:[]};
  for(const part of ['gist','detail']){
   const arr=a[part]===undefined?[]:a[part];
   must(Array.isArray(arr)&&arr.length<=v[part].length,'Invalid '+part+' answers.');
   for(let i=0;i<v[part].length;i++){
    const value=arr[i],q=v[part][i];
    if(value===null||value===undefined||value===''){normalized[part][i]=null;continue}
    if(q.type==='single'){
     must(Number.isInteger(value)&&value>=0&&value<q.options.length,'Invalid single response.');
     normalized[part][i]=value;
    }else{
     must(Array.isArray(value)&&value.length<=q.options.length&&
       value.every(n=>Number.isInteger(n)&&n>=0&&n<q.options.length)&&
       value.length===new Set(value).size,'Invalid multi response.');
     normalized[part][i]=value.length?value:null;
    }
   }
  }
  const seq=a.sequence===undefined?[]:a.sequence;
  must(Array.isArray(seq)&&seq.length<=v.sequence.length,'Invalid sequence answers.');
  const seen=new Set();
  for(let i=0;i<v.sequence.length;i++){
   const n=seq[i];
   must(n===undefined||n===null||(Number.isInteger(n)&&n>=0&&n<v.sequence.length),
     'Invalid reconstruction position.');
   if(Number.isInteger(n)){must(!seen.has(n),'A reconstruction item cannot be used twice.');seen.add(n);}
   normalized.sequence[i]=Number.isInteger(n)?n:null;
  }
  for(const part of ['facts','open']){
   const arr=a[part]===undefined?[]:a[part];
   must(Array.isArray(arr)&&arr.length<=v[part].length,'Invalid written answers.');
   for(let i=0;i<v[part].length;i++){
    const value=arr[i]===undefined?'':arr[i];
    must(typeof value==='string'&&value.length<=5000,'Invalid written response.');
    normalized[part][i]=value;
   }
  }
  return normalized;
 }
 function assess(v,answers){
  validate(v);
  const a=normalizeResponse(v,answers);
  const reviewed=[];let correct=0,answered=0;
  for(const part of ['gist','detail'])for(let i=0;i<v[part].length;i++){
   const q=v[part][i],picked=a[part][i];
   const filled=picked!==null&&(typeof picked!=='object'||picked.length>0);
   const ok=filled&&(q.type==='single'?picked===q.correct:
     picked.length===q.correct.length&&picked.every(x=>q.correct.includes(x)));
   if(ok)correct++;
   if(filled)answered++;
   reviewed.push({phase:part,type:q.type,number:i+1,question:q.title,answered:filled,
    correct:!!ok,chosen:filled?(q.type==='single'?[q.options[picked]]:picked.map(n=>q.options[n])):[],
    correctAnswers:(q.type==='single'?[q.correct]:q.correct).map(n=>q.options[n]),
    reason:typeof q.why==='string'?q.why:''});
  }
  for(let i=0;i<v.sequence.length;i++){
   const value=a.sequence[i],filled=value!==null,ok=filled&&value===i;
   if(ok)correct++;
   if(filled)answered++;
   reviewed.push({phase:'sequence',number:i+1,question:'Position '+(i+1),
    answered:filled,correct:ok,chosen:filled?[v.sequence[value]]:[],
    correctAnswers:[v.sequence[i]],reason:''});
  }
  const writing=[];
  for(const part of ['facts','open'])for(let i=0;i<v[part].length;i++){
   const q=v[part][i];const answer=a[part][i].trim();
   if(answer)answered++;
   writing.push({phase:part,number:i+1,question:q.title,answer,
    reference:q.answer,criteria:typeof q.criteria==='string'?q.criteria:'',
    state:answer?'teacher_review_required':'not_answered',correct:null});
  }
  const objectiveMax=v.gist.length+v.detail.length+v.sequence.length;
  const total=objectiveMax+writing.length;
  return {
   kind:'LSH_LOCAL_LISTENING_REVIEW_R24_V1',localOnly:true,officialGrade:null,
   objectiveCorrect:correct,objectiveMax,objectivePercent:
    Math.round(correct/objectiveMax*10000)/100,
   allTaskCount:total,answered,unanswered:total-answered,
   writingReviewCount:writing.filter(q=>q.state==='teacher_review_required').length,
   resultFinal:false,finalPercentage:null,reviewed,writing
  };
 }
 /* R33 test-only closed matching task: public practice cards remain unchanged. */
 function matching(v){
  validate(v);
  const prompts=[
   ...v.facts.map(x=>({phase:'facts',question:x.title,answer:x.answer})),
   ...v.open.map(x=>({phase:'interpretation',question:x.title,answer:x.answer}))
  ];
  must(prompts.length>=3&&prompts.length<=26,'Invalid matching bank.');
  must(new Set(prompts.map(x=>x.answer.trim().toLowerCase())).size===prompts.length,
   'Ambiguous duplicate matching reference.');
  const options=prompts.map((p,sourceIndex)=>({sourceIndex,text:p.answer}));
  options.sort((a,b)=>a.text.localeCompare(b.text,'en')||a.sourceIndex-b.sourceIndex);
  return {
   prompts:prompts.map((p,i)=>({...p,index:i})),
   options:options.map((p,i)=>({...p,letter:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i]}))
  };
 }
 function assessAuto(v,responses){
  validate(v);
  must(plain(responses),'Invalid automatic test answers.');
  // The original assessor remains for legacy practice tests; free text is
  // discarded and never assessed in the new test-only closed mode.
  const base=assess(v,{...responses,facts:[],open:[]});
  const bank=matching(v),picks=responses.match===undefined?[]:responses.match;
  must(Array.isArray(picks)&&picks.length<=bank.prompts.length,
   'Invalid matching answers.');
  const used=new Set();let answered=0,correct=0;
  const matchReview=bank.prompts.map((p,i)=>{
   const value=picks[i];
   must(value===undefined||value===null||value===''||
    (Number.isInteger(value)&&value>=0&&value<bank.options.length),
    'Invalid matching choice.');
   const selected=Number.isInteger(value)?value:null;
   if(selected!==null){
    must(!used.has(selected),'Each matching answer may be used once.');
    used.add(selected);answered++;
   }
   const correctOption=bank.options.findIndex(x=>x.sourceIndex===i);
   const right=selected!==null&&selected===correctOption;
   if(right)correct++;
   return {phase:'matching',number:i+1,question:p.question,answered:selected!==null,
    correct:right,chosen:selected===null?[]:[bank.options[selected].text],
    correctAnswers:[p.answer],reason:''};
  });
  const objectiveCorrect=base.objectiveCorrect+correct;
  const objectiveMax=base.objectiveMax+bank.prompts.length;
  const totalAnswered=base.answered+answered;
  return {
   ...base,assessmentMode:'AUTO_CLOSED',autoClosed:true,
   objectiveCorrect,objectiveMax,objectivePercent:
    Math.round(objectiveCorrect/objectiveMax*10000)/100,
   allTaskCount:objectiveMax,answered:totalAnswered,
   unanswered:objectiveMax-totalAnswered,writing:[],writingReviewCount:0,
   reviewed:[...base.reviewed,...matchReview]
  };
 }
 function sourceLinks(html){
  const sources=extractJson(html,'SOURCES');
  const urls=[];
  for(const [name,url]of Object.entries(sources)){
   if(typeof url!=='string')continue;
   let parsed;try{parsed=new URL(url)}catch(_){continue}
   if(parsed.protocol!=='https:')continue;
   if(!['www.youtube.com','youtube.com','www.facebook.com','facebook.com','x.com','www.netflix.com'].includes(parsed.hostname))continue;
   urls.push({name,url:parsed.href});
  }
  must(urls.length>0,'No approved public media source.');
  return urls;
 }
 const api={LEVELS,TOPICS,PHASES,extractJson,catalogEntry,variant,validate,
   normalizeResponse,assess,matching,assessAuto,sourceLinks};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHListeningCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
