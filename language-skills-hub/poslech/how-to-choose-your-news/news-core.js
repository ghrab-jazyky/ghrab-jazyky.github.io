/* LSH How to Choose Your News: separately authored practice/test data, E3. */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHNewsListening=api;
})(typeof window!=='undefined'?window:this,function(){
 'use strict';
 const LEVELS=Object.freeze(['A1','A2','B1','B2','C1','C2']);
 const REQUIRED=Object.freeze(['A1','A2','A3','A4','A5','A6','B1','B2','B3','B4','B5','B6','C1','C2','C3','C4','C5']);
 const TNS=Object.freeze(['TRUE','FALSE','NOT STATED']);
 const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const check=(yes,msg)=>{if(!yes)throw Error('News Listening: '+msg);};
 const text=x=>typeof x==='string'&&x.trim().length>0&&x.length<=2000;
 const code=q=>q.type==='mc'?q.correct.charCodeAt(0)-65:
  q.type==='tns'?TNS.indexOf(q.correct):q.correct.charCodeAt(0)-65;
 function validateBank(bank,level,mode){
  check(bank&&Array.isArray(bank.questionBank)&&bank.questionBank.length===17,
   mode+' requires exactly 17 tasks at '+level);
  check(Array.isArray(bank.matchingBank)&&bank.matchingBank.length===7,
   mode+' needs exactly 7 matching options at '+level);
  check(bank.matchingBank.every((row,i)=>Array.isArray(row)&&row.length===2&&
   row[0]===String.fromCharCode(65+i)&&text(row[1])),'Invalid matching key '+mode+' '+level);
  check(new Set(bank.matchingBank.map(x=>x[1])).size===7,'Repeated matching option '+mode+' '+level);
  const found=new Set(),used=new Set();
  for(const q of bank.questionBank){
   check(q&&REQUIRED.includes(q.id)&&!found.has(q.id),'Missing or duplicate task '+mode+' '+level);
   found.add(q.id);
   check(text(q.question)&&text(q.explanation)&&text(q.evidence),'Missing pedagogical evidence '+mode+' '+level+' '+q.id);
   if(q.type==='mc'){
    check(q.id[0]==='A'&&Array.isArray(q.options)&&q.options.length===4&&
     q.options.every(text)&&new Set(q.options).size===4&&/^[A-D]$/.test(q.correct),
     'Invalid MC '+mode+' '+level+' '+q.id);
   }else if(q.type==='tns'){
    check(q.id[0]==='B'&&TNS.includes(q.correct),'Invalid TNS '+mode+' '+level+' '+q.id);
   }else if(q.type==='match'){
    check(q.id[0]==='C'&&/^[A-G]$/.test(q.correct)&&!used.has(q.correct),
     'Invalid matching '+mode+' '+level+' '+q.id);
    used.add(q.correct);
   }else check(false,'Unsupported task type '+mode+' '+level+' '+q.id);
  }
  check(REQUIRED.every(id=>found.has(id))&&used.size===5,'Incomplete bank '+mode+' '+level);
  const distribution=TNS.map(value=>bank.questionBank.filter(q=>q.type==='tns'&&q.correct===value).length);
  check(distribution.every(n=>n===2),'Each T/F/NS answer must occur twice '+mode+' '+level);
  return bank;
 }
 function validate(data){
  check(data&&data.kind==='LSH_HCYNEWS_LISTENING_A1C2_E2_V1'&&
   data.id==='ll-how-to-choose-your-news'&&data.language==='en','Unexpected content identifier');
  check(Array.isArray(data.levels)&&data.levels.join(',')===LEVELS.join(','),'Invalid CEFR selection');
  check(data.variants&&data.practiceVariants&&data.practice,'Missing separate modes');
  check(data.video==='https://www.youtube.com/watch?v=q-Y-z6HmRgI'&&
   data.source==='https://ed.ted.com/lessons/how-to-choose-your-news-damon-brown',
   'Unexpected original video or source');
  for(const level of LEVELS){
   const t=validateBank(data.variants[level],level,'test');
   const p=validateBank(data.practiceVariants[level],level,'practice');
   const stems=new Set(t.questionBank.map(x=>x.question.trim().toLowerCase()));
   check(p.questionBank.every(x=>!stems.has(x.question.trim().toLowerCase())),
    'Practice leaks a test question at '+level);
   const scaffold=data.practice[level];
   check(scaffold&&text(scaffold.objective)&&Array.isArray(scaffold.pre)&&
    scaffold.pre.length>=1&&scaffold.pre.every(text)&&Array.isArray(scaffold.after)&&
    scaffold.after.length>=1&&scaffold.after.every(text)&&
    Array.isArray(scaffold.vocabulary)&&scaffold.vocabulary.length>=5&&
    scaffold.vocabulary.every(x=>text(x.term)&&text(x.meaning)&&text(x.cs)),
    'Incomplete teaching scaffolding at '+level);
   const variant=data[level];
   check(variant&&variant.goal&&variant.gist?.length===6&&variant.detail?.length===6&&
    variant.matching?.items?.length===5&&variant.matching?.options?.length===7&&
    variant.sequence?.length===0&&variant.facts?.length===0&&variant.open?.length>=2,
    'Invalid shared LSH test variant at '+level);
   for(const q of t.questionBank){
    const group=q.type==='mc'?variant.gist:q.type==='tns'?variant.detail:variant.matching.items;
    const mapped=group.find(x=>x.id===q.id);
    check(mapped&&mapped.title===q.question&&mapped.correct===code(q)&&
     mapped.why===q.explanation,'Test data mapping mismatch '+level+' '+q.id);
   }
   check(variant.matching.options.every((v,i)=>v===t.matchingBank[i][1]),
    'Test matching options differ from bank at '+level);
  }
  check(JSON.stringify(data.questionBank)===JSON.stringify(data.variants.B2.questionBank)&&
   JSON.stringify(data.matchingBank)===JSON.stringify(data.variants.B2.matchingBank),
   'E1 B2 canonical bank changed');
  return data;
 }
 function normalizeResponses(raw){
  const answers={};
  for(const id of REQUIRED){
   const value=raw&&has(raw,id)?raw[id]:'';
   answers[id]=typeof value==='string'&&value.length<=40?value.trim().toUpperCase():'';
  }
  return answers;
 }
 function gradeAnswers(data,responses,level='B2',mode='practice'){
  check(LEVELS.includes(level),'Unexpected level');
  check(['test','practice'].includes(mode),'Unexpected mode');
  validate(data);
  const bank=data[mode==='test'?'variants':'practiceVariants'][level],
   answers=normalizeResponses(responses),choices=Object.fromEntries(bank.matchingBank),used=new Set();
  const reviewed=bank.questionBank.map(q=>{
   const value=answers[q.id];
   const allowed=q.type==='mc'?['A','B','C','D']:q.type==='tns'?TNS:Object.keys(choices);
   check(!value||allowed.includes(value),'Invalid response '+level+' '+q.id);
   if(q.type==='match'&&value){
    check(!used.has(value),'Matching letter used more than once');used.add(value);
   }
   const display=v=>!v?'Not answered':q.type==='mc'?v+' — '+q.options[v.charCodeAt(0)-65]:
    q.type==='match'?v+' — '+choices[v]:v;
   return {id:q.id,question:q.question,type:q.type,answer:value,
    correctAnswer:q.correct,answered:!!value,correct:value===q.correct,
    selectedLabel:display(value),expectedLabel:display(q.correct),
    reason:q.explanation,evidence:q.evidence};
  });
  return {kind:'LSH_HCYNEWS_LOCAL_REVIEW_E3',mode,level,
   items:reviewed,total:17,correct:reviewed.filter(x=>x.correct).length,
   answered:reviewed.filter(x=>x.answered).length};
 }
 function practiceVariant(data,level,testVariant){
  validate(data);
  check(LEVELS.includes(level)&&testVariant&&typeof testVariant==='object',
   'Cannot build practice variant');
  const bank=data.practiceVariants[level],mc=[],detail=[],items=[];
  const options=bank.matchingBank.map(x=>x[1]);
  for(const q of bank.questionBank){
   if(q.type==='mc')mc.push({id:q.id,title:q.question,type:'single',options:q.options,
    correct:code(q),why:q.explanation,evidence:q.evidence});
   else if(q.type==='tns')detail.push({id:q.id,title:q.question,type:'single',
    options:[...TNS],correct:code(q),why:q.explanation,evidence:q.evidence});
   else items.push({id:q.id,title:q.question,correct:code(q),
    why:q.explanation,evidence:q.evidence});
  }
  return {...testVariant,gist:mc,detail,matching:{options,items}};
 }
 return Object.freeze({LEVELS,REQUIRED,TNS,validate,normalizeResponses,gradeAnswers,practiceVariant});
});
