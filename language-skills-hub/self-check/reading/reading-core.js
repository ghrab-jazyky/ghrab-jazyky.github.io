/* Language Skills Hub R23: a transparent, public-data, NON-GRADED local self-check.
 * The original Reading practice HTML and question content remain unchanged.
 * This module never contains secret teacher keys or trustworthy exam controls.
 */
(function(root){
 'use strict';
 const LANGUAGES=Object.freeze(['en','es','de','fr']);
 const LEVELS=Object.freeze(['A1','A2','B1','B2','C1','C2']);
 const KINDS=Object.freeze(['mc','match','gap']);
 const TOPIC=/^rl-[a-z0-9-]{3,76}$/;
 const SOURCE=/^cteni\/[a-z0-9-]+\/index\.html$/;
 const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
 const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  Object.getPrototypeOf(x)===Object.prototype;
 function ensure(condition,message){if(!condition)throw new Error(message)}
 function textOK(s,max){return typeof s==='string'&&s.trim().length>0&&s.length<=max}
 function parseReadingData(html){
  ensure(typeof html==='string'&&html.length>0&&html.length<=2500000,'Neplatná zdrojová karta Reading.');
  const match=/\bconst\s+DATA\s*=\s*\{/g.exec(html);
  ensure(match,'Zdroj neobsahuje čtecí data.');
  const start=match.index+match[0].length-1;
  let depth=0,quoted=false,escaped=false,end=-1;
  for(let i=start;i<html.length;i++){
   const ch=html[i];
   if(quoted){
    if(escaped)escaped=false;
    else if(ch==='\\')escaped=true;
    else if(ch==='"')quoted=false;
   }else if(ch==='"'){quoted=true;}
   else if(ch==='{')depth++;
   else if(ch==='}'){
    depth--;
    if(depth===0){end=i+1;break;}
   }
  }
  ensure(end>start,'Neúplná datová část čtecí karty.');
  let data;
  try{data=JSON.parse(html.slice(start,end));}
  catch(_){throw new Error('Nečitelná datová část čtecí karty.');}
  ensure(plain(data),'Nesprávný formát čtecí karty.');
  return data;
 }
 function readingEntry(catalog,topicId){
  ensure(plain(catalog)&&Array.isArray(catalog.entries),'Katalog není dostupný.');
  ensure(typeof topicId==='string'&&TOPIC.test(topicId),'Nesprávné téma.');
  const entry=catalog.entries.find(x=>x.id===topicId&&x.skill==='cteni');
  ensure(entry&&SOURCE.test(entry.relative),'Téma nemá schválený zdroj Reading.');
  ensure(Array.isArray(entry.languages)&&Array.isArray(entry.levels),'Chybné varianty tématu.');
  return entry;
 }
 function variantFromData(data,language,level){
  ensure(LANGUAGES.includes(language),'Nepodporovaný jazyk.');
  ensure(LEVELS.includes(level),'Nepodporovaná úroveň.');
  ensure(plain(data)&&own(data,language)&&plain(data[language])&&
   own(data[language],level),'Požadovaná varianta neexistuje.');
  return validateVariant(data[language][level]);
 }
 function validateVariant(v){
  ensure(plain(v)&&textOK(v.title,200),'Chybí název textu.');
  ensure(Array.isArray(v.paragraphs)&&v.paragraphs.length>=1&&
   v.paragraphs.length<=50&&v.paragraphs.every(p=>textOK(p,10000)),'Chybné odstavce textu.');
  ensure(Array.isArray(v.tabs)&&v.tabs.length>=1&&v.tabs.length<=12,'Chybí čtenářské oddíly.');
  const tabs=new Set();
  for(const tab of v.tabs){
   ensure(plain(tab)&&/^[a-z][a-z0-9-]{1,50}$/.test(tab.id)&&
    textOK(tab.title,160)&&!tabs.has(tab.id),'Chybný čtenářský oddíl.');
   tabs.add(tab.id);
  }
  ensure(Array.isArray(v.questions)&&v.questions.length>=1&&
   v.questions.length<=80,'Nesprávný počet otázek.');
  const ids=new Set();let gaps=0;
  for(const q of v.questions){
   ensure(plain(q)&&/^[a-z0-9-]{4,120}$/.test(q.id)&&!ids.has(q.id),'Chybné nebo duplicitní ID otázky.');
   ids.add(q.id);
   ensure(tabs.has(q.tab)&&KINDS.includes(q.kind)&&textOK(q.q,2000),'Chybný typ nebo zadání otázky.');
   ensure(Array.isArray(q.choices)&&q.choices.length>=2&&q.choices.length<=8&&
    q.choices.every(c=>textOK(c,3000)),'Chybné nabízené odpovědi.');
   ensure(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length,
    'Chybné vyhodnocení otázky.');
   if(q.kind==='gap')gaps++;
  }
  ensure(gaps<=1,'Nepodporovaný počet textových mezer.');
  if(gaps){
   ensure(plain(v.gap)&&Number.isInteger(v.gap.p)&&
    v.gap.p>=0&&v.gap.p<v.paragraphs.length&&textOK(v.gap.sentence,4000)&&
    v.paragraphs[v.gap.p].includes(v.gap.sentence),'Mezera neodpovídá originálnímu textu.');
   const gapQuestion=v.questions.find(q=>q.kind==='gap');
   ensure(gapQuestion.choices[gapQuestion.answer]===v.gap.sentence,
    'Mezera a její správná věta nejsou shodné.');
  }
  if(v.open!==undefined)ensure(typeof v.open==='string'&&v.open.length<=2500,
   'Nesprávná otevřená otázka.');
  return v;
 }
 function readingParagraphParts(v,index){
  validateVariant(v);
  const original=v.paragraphs[index];
  ensure(typeof original==='string','Neexistující odstavec.');
  if(!v.gap||v.gap.p!==index)return [{kind:'text',text:original}];
  const sentence=v.gap.sentence,at=original.indexOf(sentence);
  ensure(at>=0,'Chybí textová mezera.');
  return [
   {kind:'text',text:original.slice(0,at)},
   {kind:'gap',text:'[…]'},
   {kind:'text',text:original.slice(at+sentence.length)}
  ];
 }
 function score(v,answers){
  validateVariant(v);
  ensure(plain(answers)||Object.getPrototypeOf(answers)===null,'Chybný formát odpovědí.');
  let answered=0,correct=0;
  const details=v.questions.map(q=>{
   const present=own(answers,q.id)&&answers[q.id]!==''&&answers[q.id]!==null;
   const selected=present?Number(answers[q.id]):null;
   ensure(!present||(Number.isInteger(selected)&&selected>=0&&selected<q.choices.length),
    'Neplatná odpověď: '+q.id);
   if(present)answered++;
   const passed=present&&selected===q.answer;
   if(passed)correct++;
   return {
    id:q.id,kind:q.kind,prompt:q.q,answered:present,
    selectedIndex:selected,selectedAnswer:present?q.choices[selected]:null,
    correctIndex:q.answer,correctAnswer:q.choices[q.answer],
    explanation:typeof q.explanation==='string'?q.explanation:'',
    correct:passed
   };
  });
  return {
   total:v.questions.length,answered,unanswered:v.questions.length-answered,
   correct,points:correct,maxPoints:v.questions.length,
   percentage:Math.round(correct/v.questions.length*10000)/100,
   schoolGrade:null,officialGrade:false,
   localOnly:true,details
  };
 }

 // F1: presentation-only, no requests and no changes to source/scoring.
 const SF_ID='lsh-smart-feedback-asteroids-v1';
 const SF_TOPIC='rl-asteroids';
 const sfKeys=(obj,keys)=>plain(obj)&&Object.keys(obj).length===keys.length&&keys.every(k=>own(obj,k));
 const sfText=(s,max)=>textOK(s,max)&&!/<[!/?a-z]/i.test(s)&&!/\b(?:TODO|TBD|FIXME|placeholder)\b/i.test(s);
 function sfCanonical(x){
  if(Array.isArray(x))return x.map(sfCanonical);
  if(plain(x))return Object.fromEntries(Object.keys(x).sort().map(k=>[k,sfCanonical(x[k])]));
  ensure(x===null||typeof x==='string'||typeof x==='boolean'||(typeof x==='number'&&Number.isFinite(x)),
   'Unsupported fingerprint value');
  return x;
 }
 async function smartFeedbackFingerprint(topic,language,level,v){
  const payload=JSON.stringify(sfCanonical([topic,language,level,v]));
  const digest=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
 }
 function parseSmartFeedback(html){
  ensure(typeof html==='string'&&html.length<=2500000,'Invalid Smart Feedback source');
  const marker='<script type="application/json" id="'+SF_ID+'">';
  ensure(html.split(SF_ID).length===2&&html.split(marker).length===2,'Missing or repeated Smart Feedback marker');
  const start=html.indexOf(marker)+marker.length,end=html.indexOf('</script>',start);
  ensure(end>start&&end-start<=650000,'Invalid Smart Feedback payload');
  const raw=html.slice(start,end),parsed=JSON.parse(raw);
  ensure(raw===JSON.stringify(parsed).replace(/</g,'\\u003c'),'Noncanonical Smart Feedback payload');
  return parsed;
 }
 async function validateSmartFeedback(html,topic,language,level,v){
  ensure(topic===SF_TOPIC&&LANGUAGES.includes(language)&&LEVELS.includes(level),'Unsupported Smart Feedback variant');
  validateVariant(v);
  const bank=parseSmartFeedback(html);
  ensure(sfKeys(bank,['schemaVersion','topicId','feedbackLanguage','variants'])&&bank.schemaVersion===1&&
   bank.topicId===topic&&bank.feedbackLanguage==='cs'&&sfKeys(bank.variants,LANGUAGES.flatMap(l=>LEVELS.map(v=>l+'/'+v))),'Invalid Smart Feedback bank');
  const selected=bank.variants[language+'/'+level];
  ensure(sfKeys(selected,['sourceFingerprint','questions'])&&/^[a-f0-9]{64}$/.test(selected.sourceFingerprint)&&
   selected.sourceFingerprint===await smartFeedbackFingerprint(topic,language,level,v),'Stale Smart Feedback bank');
  ensure(sfKeys(selected.questions,v.questions.map(q=>q.id)),'Smart Feedback question coverage mismatch');
  for(const q of v.questions){
   const f=selected.questions[q.id],expected=q.choices.map((_,i)=>String(i)).filter(i=>Number(i)!==q.answer);
   ensure(sfKeys(f,['correctIndex','correctWhy','evidence','distractors','unanswered'])&&f.correctIndex===q.answer&&
    sfText(f.correctWhy,800)&&Array.isArray(f.evidence)&&f.evidence.length>=1&&f.evidence.length<=3&&
    sfKeys(f.distractors,expected)&&sfKeys(f.unanswered,['tip'])&&sfText(f.unanswered.tip,350),'Invalid feedback: '+q.id);
   const seen=new Set();
   for(const e of f.evidence){
    ensure(sfKeys(e,['p','text'])&&Number.isInteger(e.p)&&e.p>=0&&e.p<v.paragraphs.length&&
     textOK(e.text,900)&&!/<[!/?a-z]/i.test(e.text)&&v.paragraphs[e.p].includes(e.text),'Invalid evidence: '+q.id);
    const key=JSON.stringify([e.p,e.text]);ensure(!seen.has(key),'Repeated evidence: '+q.id);seen.add(key);
   }
   for(const i of expected){
    const d=f.distractors[i];
    ensure(sfKeys(d,['whyWrong','tip'])&&sfText(d.whyWrong,800)&&sfText(d.tip,350),'Invalid distractor: '+q.id);
   }
   if(q.kind==='gap')ensure(f.evidence.some(e=>e.p===v.gap.p&&e.text.includes(v.gap.sentence)),'Missing gap evidence: '+q.id);
  }
  return selected;
 }
 function resolveSmartFeedback(item,bank,v){
  if(!item||item.correct===true||!bank||!plain(bank.questions))return null;
  const q=v.questions.find(q=>q.id===item.id);
  if(!q||!own(bank.questions,q.id)||item.correctIndex!==q.answer||item.correctAnswer!==q.choices[q.answer]||
   item.prompt!==q.q)return null;
  const f=bank.questions[q.id];
  if(f.correctIndex!==q.answer)return null;
  const shared={correctWhy:f.correctWhy,evidence:f.evidence.map(e=>({p:e.p,text:e.text}))};
  if(item.answered===false&&item.selectedIndex===null&&item.selectedAnswer===null)
   return {...shared,status:'unanswered',tip:f.unanswered.tip};
  const i=item.selectedIndex;
  if(item.answered!==true||!Number.isInteger(i)||i<0||i>=q.choices.length||i===q.answer||
   item.selectedAnswer!==q.choices[i]||!own(f.distractors,String(i)))return null;
  const d=f.distractors[String(i)];
  return {...shared,status:'wrong',whyWrong:d.whyWrong,tip:d.tip};
 }
 const api={LANGUAGES,LEVELS,KINDS,parseReadingData,readingEntry,
  variantFromData,validateVariant,readingParagraphParts,score,
  parseSmartFeedback,smartFeedbackFingerprint,validateSmartFeedback,resolveSmartFeedback};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHReadingCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
