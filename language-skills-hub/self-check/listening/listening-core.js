/* LSH R24: independent, public-data Listening self-check – never an authenticated exam. */
(function(root){
 'use strict';
 const LEVELS=Object.freeze(['A1','A2','B1','B2','C1','C2']);
 const TOPICS=Object.freeze(['ll-matthew-oscars','ll-harrison-ford','ll-peaky-no-fighting']);
 const ALL_TOPICS=Object.freeze([...TOPICS,'ll-sad','ll-conlangs']);
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
  must(plain(catalog)&&Array.isArray(catalog.entries)&&ALL_TOPICS.includes(topic),'Unknown Listening topic.');
  const e=catalog.entries.find(x=>x.id===topic&&x.skill==='poslech');
  must(e&&/^poslech\/[a-z0-9-]+\/index\.html$/.test(e.relative),'No approved source Listening card.');
  must(Array.isArray(e.languages)&&e.languages.length===1&&e.languages[0]==='en','Listening is English-only.');
  must(Array.isArray(e.levels)&&e.levels.length>0&&e.levels.every(l=>LEVELS.includes(l))&&
     new Set(e.levels).size===e.levels.length&&
     (!['ll-sad','ll-conlangs'].includes(topic)||e.levels.join(',')==='A1,A2,B1,B2,C1,C2'),'Invalid CEFR levels.');
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
  must(Array.isArray(v.sequence)&&
     (v.sequence.length===0&&v.matching||v.sequence.length>=2&&v.sequence.length<=20)&&
     v.sequence.every(x=>nonempty(x,2500))&&new Set(v.sequence).size===v.sequence.length,
    'Invalid reconstruction sequence.');
  for(const phase of ['facts','open']){
   must(Array.isArray(v[phase])&&
      (v[phase].length>=1&&v[phase].length<=12||phase==='facts'&&v.matching&&v[phase].length===0),
      'Invalid writing tasks.');
   for(const q of v[phase])must(plain(q)&&nonempty(q.title,2000)&&
     nonempty(q.answer,6000),'Missing writing reference.');
  }   // R67: common Listening schema now accepts authentic one-to-one matching.
   // Old sequence/cloze variants retain their unchanged checks and scoring.
   if(v.matching!==undefined){
    const m=v.matching;
    must(plain(m)&&Array.isArray(m.options)&&m.options.length>=3&&m.options.length<=12&&
     m.options.every(x=>nonempty(x,1000))&&new Set(m.options).size===m.options.length&&
     Array.isArray(m.items)&&m.items.length>=2&&m.items.length<=12,
     'Invalid matching bank.');
    const rights=new Set();
    for(const q of m.items){
     must(plain(q)&&nonempty(q.title,2000)&&
      Number.isInteger(q.correct)&&q.correct>=0&&q.correct<m.options.length&&
      !rights.has(q.correct),'Invalid matching solution.');
     rights.add(q.correct);
    }
   }
   return v;
  }
  function variant(data,level){
  must(LEVELS.includes(level)&&plain(data)&&own(data,level),'Missing CEFR variant.');
  return validate(data[level]);
 }
 function normalizeResponse(v,a){
  must(plain(a),'Answers must be an object.');
  const normalized={gist:[],detail:[],sequence:[],matching:[],facts:[],open:[]};
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
  }   const match=v.matching?.items||[],candidate=a.matching===undefined?[]:a.matching;
   must(Array.isArray(candidate)&&candidate.length<=match.length,'Invalid matching answers.');
   const matchUsed=new Set();
   for(let i=0;i<match.length;i++){
    const x=candidate[i];
    must(x===null||x===undefined||(Number.isInteger(x)&&x>=0&&x<v.matching.options.length),
     'Invalid matching letter.');
    if(Number.isInteger(x)){must(!matchUsed.has(x),'Matching answer used more than once.');matchUsed.add(x)}
    normalized.matching[i]=Number.isInteger(x)?x:null;
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
  }   const matching=v.matching?.items||[];
   for(let i=0;i<matching.length;i++){
    const q=matching[i],value=a.matching[i],filled=value!==null,ok=filled&&value===q.correct;
    if(ok)correct++;
    if(filled)answered++;
    reviewed.push({phase:'matching',number:i+1,question:q.title,
     answered:filled,correct:!!ok,
     chosen:filled?[v.matching.options[value]]:[],
     correctAnswers:[v.matching.options[q.correct]],reason:typeof q.why==='string'?q.why:''});
   }
   const writing=[];
   for(const part of ['facts','open'])for(let i=0;i<v[part].length;i++){
   const q=v[part][i];const answer=a[part][i].trim();
   if(answer)answered++;
   writing.push({phase:part,number:i+1,question:q.title,answer,
    reference:q.answer,criteria:typeof q.criteria==='string'?q.criteria:'',
    state:answer?'teacher_review_required':'not_answered',correct:null});
  }
  const objectiveMax=v.gist.length+v.detail.length+v.sequence.length+
    (v.matching?.items.length||0);
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
 /* R35 TEST-ONLY factual cloze. Every fact has a closed teacher-authored
  * answer key. Free-response interpretations are excluded from tests.
  * No answer bank or candidate solutions are exposed in the student UI. */
 const CLOZE_KEYS=Object.freeze({"ll-matthew-oscars":{"A1":[["3","three","3 children","three children"],["10","ten","10 years","ten years"]],"A2":[["2","two","2 brothers","two brothers","2 older brothers"],["camila","camilla","camila alves"]],"B1":[["jared leto","jennifer garner","leto","jared","garner","jennifer"],["2","two","two brothers","2 older brothers"],["15","fifteen","15 years old","fifteen years old"]],"B2":[["vallee","vallée","jean marc vallee","jean-marc vallée"],["jared leto and jennifer garner","jennifer garner and jared leto","jared leto jennifer garner","jennifer garner jared leto","jared leto and garner","jared leto garner","garner and jared leto","garner jared leto","leto and jennifer garner","leto jennifer garner","jennifer garner and leto","jennifer garner leto","leto and garner","leto garner","garner and leto","garner leto"],["gumbo","a pot of gumbo"]],"C1":[["vallee","vallée","jean marc vallee","jean-marc vallée"],["35","thirty-five","thirty five","35 years old"],["miller lite","miller light","miller"]],"C2":[["15 and 25","25 and 15","15 25","25 15","fifteen and twenty five","fifteen and twenty-five","25 and fifteen","15 and twenty-five"],["jared leto","leto","jared"]]},"ll-harrison-ford":{"A1":[["15","fifteen","15 years","fifteen years"],["carpenter","a carpenter","woodworker","a woodworker"]],"A2":[["15","fifteen","15 years","fifteen years","about 15 years","about fifteen years"],["carpentry","carpenter","woodworking","woodworker"]],"B1":[["15","fifteen","15 years","fifteen years","about 15 years","about fifteen years"],["carpentry","carpenter","woodworking","woodworker","a woodworker"],["george lucas","steven spielberg","lucas","spielberg"]],"B2":[["george lucas and steven spielberg","steven spielberg and george lucas","george lucas steven spielberg","steven spielberg george lucas","george lucas and spielberg","george lucas spielberg","spielberg and george lucas","spielberg george lucas","lucas and steven spielberg","lucas steven spielberg","steven spielberg and lucas","steven spielberg lucas","lucas and spielberg","lucas spielberg","spielberg and lucas","spielberg lucas"],["fred roos and pat mcqueeney","pat mcqueeney and fred roos","fred roos pat mcqueeney","pat mcqueeney fred roos","fred roos and mcqueeney","fred roos mcqueeney","mcqueeney and fred roos","mcqueeney fred roos","fred roos and pat mcqueenie","fred roos pat mcqueenie","pat mcqueenie and fred roos","pat mcqueenie fred roos","fred roos and mcqueenie","fred roos mcqueenie","mcqueenie and fred roos","mcqueenie fred roos","roos and pat mcqueeney","roos pat mcqueeney","pat mcqueeney and roos","pat mcqueeney roos","roos and mcqueeney","roos mcqueeney","mcqueeney and roos","mcqueeney roos","roos and pat mcqueenie","roos pat mcqueenie","pat mcqueenie and roos","pat mcqueenie roos","roos and mcqueenie","roos mcqueenie","mcqueenie and roos","mcqueenie roos"],["his wife calista and his family","calista and his family","calista and family","his wife and family","wife and family","calista and the family","his family and calista","family and calista","calista flockhart and family","calista flockhart and his family","his family and calista flockhart","family and calista flockhart"]],"C1":[["george lucas and steven spielberg","steven spielberg and george lucas","george lucas steven spielberg","steven spielberg george lucas","george lucas and spielberg","george lucas spielberg","spielberg and george lucas","spielberg george lucas","lucas and steven spielberg","lucas steven spielberg","steven spielberg and lucas","steven spielberg lucas","lucas and spielberg","lucas spielberg","spielberg and lucas","spielberg lucas"],["fred roos and pat mcqueeney","pat mcqueeney and fred roos","fred roos pat mcqueeney","pat mcqueeney fred roos","fred roos and mcqueeney","fred roos mcqueeney","mcqueeney and fred roos","mcqueeney fred roos","fred roos and pat mcqueenie","fred roos pat mcqueenie","pat mcqueenie and fred roos","pat mcqueenie fred roos","fred roos and mcqueenie","fred roos mcqueenie","mcqueenie and fred roos","mcqueenie fred roos","roos and pat mcqueeney","roos pat mcqueeney","pat mcqueeney and roos","pat mcqueeney roos","roos and mcqueeney","roos mcqueeney","mcqueeney and roos","mcqueeney roos","roos and pat mcqueenie","roos pat mcqueenie","pat mcqueenie and roos","pat mcqueenie roos","roos and mcqueenie","roos mcqueenie","mcqueenie and roos","mcqueenie roos"],["third","third year","3rd","3rd year","3","year 3"]],"C2":[["george lucas and steven spielberg","steven spielberg and george lucas","george lucas steven spielberg","steven spielberg george lucas","george lucas and spielberg","george lucas spielberg","spielberg and george lucas","spielberg george lucas","lucas and steven spielberg","lucas steven spielberg","steven spielberg and lucas","steven spielberg lucas","lucas and spielberg","lucas spielberg","spielberg and lucas","spielberg lucas"],["fred roos and pat mcqueeney","pat mcqueeney and fred roos","fred roos pat mcqueeney","pat mcqueeney fred roos","fred roos and mcqueeney","fred roos mcqueeney","mcqueeney and fred roos","mcqueeney fred roos","fred roos and pat mcqueenie","fred roos pat mcqueenie","pat mcqueenie and fred roos","pat mcqueenie fred roos","fred roos and mcqueenie","fred roos mcqueenie","mcqueenie and fred roos","mcqueenie fred roos","roos and pat mcqueeney","roos pat mcqueeney","pat mcqueeney and roos","pat mcqueeney roos","roos and mcqueeney","roos mcqueeney","mcqueeney and roos","mcqueeney roos","roos and pat mcqueenie","roos pat mcqueenie","pat mcqueenie and roos","pat mcqueenie roos","roos and mcqueenie","roos mcqueenie","mcqueenie and roos","mcqueenie roos"]]},"ll-peaky-no-fighting":{"A1":[["grace"],["john"]],"A2":[["grace"],["uniforms","uniform"]],"B1":[["grace"],["cavalry"],["john"]],"B2":[["cavalry"],["charlie"],["grace"]],"C1":[["grace"],["cavalry"],["charlie"]],"C2":[["grace"],["cavalry"]]}});
 /* Only superficial writing differences are ignored. Never use a fuzzy / substring
  * match: an incomplete person name or a wrong number must remain incorrect.
  * R64: function words that carry no listening evidence (articles, possessives, "about",
  * "at", "years old" ...) are dropped from BOTH the response and the key, and a closed list
  * of phonetic spellings of proper names heard only in the recording is folded to the key
  * spelling. A listening test must not fail a student for "the cavalry" or "Kamila". */
 const CLOZE_FILLER=new Set(['a','an','the','his','her','their','my','and','of','about','around',
  'approximately','roughly','at','in','age','aged','year','years','yrs','old','he','is','was','it','its']);
 const CLOZE_SPELLING=Object.freeze({camilla:'camila',kamila:'camila',kamilla:'camila',
  valle:'vallee',valee:'vallee',valley:'vallee',vallet:'vallee',
  stephen:'steven',stefan:'steven',speilberg:'spielberg',spilberg:'spielberg',
  mcqueeny:'mcqueeney',mcqueenie:'mcqueeney',macqueeney:'mcqueeney',mcqueney:'mcqueeney',mcquinney:'mcqueeney',
  roose:'roos',rooz:'roos',letto:'leto',calvary:'cavalry',cavalery:'cavalry',cavallry:'cavalry',kavalry:'cavalry',
  kids:'children',kid:'children',child:'children'});
 function normalizeCloze(value){
  must(typeof value==='string'&&value.length<=120,'Invalid short cloze response.');
  const base=normalizeClozeBase(value);
  const kept=base.split(' ').filter(w=>w&&!CLOZE_FILLER.has(w)).map(w=>CLOZE_SPELLING[w]||w).join(' ');
  return kept||base;
 }
 function normalizeClozeBase(value){
  return value.normalize('NFKD').toLowerCase()
   .replace(/[\u0300-\u036f]/g,'')
   .replace(/\bthirty[ -]?five\b/g,'35')
   .replace(/\btwenty[ -]?five\b/g,'25')
   .replace(/\bfifteen\b/g,'15')
   .replace(/\bten\b/g,'10')
   .replace(/\bthree\b/g,'3')
   .replace(/\btwo\b/g,'2')
   .replace(/&/g,' and ')
   .replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
 }
 function cloze(v,topic,level){
  validate(v);
  must(ALL_TOPICS.includes(topic)&&LEVELS.includes(level),'Unknown cloze topic or level.');
   if(v.facts.length===0)return [];
  const keys=CLOZE_KEYS[topic]?.[level];
  must(Array.isArray(keys)&&keys.length===v.facts.length,'Incomplete cloze answer key.');
  return v.facts.map((fact,i)=>{
   const accepted=keys[i];
   must(Array.isArray(accepted)&&accepted.length>=1&&
    accepted.every(a=>typeof a==='string'&&a.length>=1&&a.length<=120),
    'Invalid cloze answer key.');
   return {question:fact.title,correctAnswer:accepted[0],accepted};
  });
 }
 function assessAuto(v,responses,topic,level){
  validate(v);
  must(plain(responses),'Invalid automatic test answers.');
  // Legacy free-text fields are excluded from auto-graded test totals.
  const base=assess(v,{...responses,facts:[],open:[]});
  const tasks=cloze(v,topic,level);
  const picks=responses.cloze===undefined?[]:responses.cloze;
  must(Array.isArray(picks)&&picks.length<=tasks.length,'Invalid cloze answers.');
  let answered=0,correct=0;
  const clozeReview=tasks.map((task,i)=>{
   const raw=picks[i]===null||picks[i]===undefined?'':picks[i];
   const selected=normalizeCloze(raw);
   if(selected)answered++;
   const right=selected!==''&&task.accepted.some(key=>normalizeCloze(key)===selected);
   if(right)correct++;
   return {phase:'cloze',number:i+1,question:task.question,answered:!!selected,
    correct:right,chosen:selected?[String(raw).trim()]:[],
    correctAnswers:[task.correctAnswer],reason:''};
  });
  const objectiveCorrect=base.objectiveCorrect+correct;
  const objectiveMax=base.objectiveMax+tasks.length;
  const totalAnswered=base.answered+answered;
  return {
   ...base,assessmentMode:'AUTO_CLOSED',autoClosed:true,
   objectiveCorrect,objectiveMax,objectivePercent:
    Math.round(objectiveCorrect/objectiveMax*10000)/100,
   allTaskCount:objectiveMax,answered:totalAnswered,
   unanswered:objectiveMax-totalAnswered,writing:[],writingReviewCount:0,
   reviewed:[...base.reviewed,...clozeReview]
  };
 }
 function sourceLinks(html){
  const sources=extractJson(html,'SOURCES');
  const urls=[];
  for(const [name,url]of Object.entries(sources)){
   if(typeof url!=='string')continue;
   let parsed;try{parsed=new URL(url)}catch(_){continue}
   if(parsed.protocol!=='https:')continue;
   if(!['www.youtube.com','youtube.com','www.facebook.com','facebook.com','x.com','www.netflix.com','ed.ted.com'].includes(parsed.hostname))continue;
   urls.push({name,url:parsed.href});
  }
  must(urls.length>0,'No approved public media source.');
  return urls;
 }
 const api={LEVELS,TOPICS,ALL_TOPICS,PHASES,extractJson,catalogEntry,variant,validate,
   normalizeResponse,assess,cloze,assessAuto,sourceLinks};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHListeningCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
