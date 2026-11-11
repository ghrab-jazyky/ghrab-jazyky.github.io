/* LSH My Vocabulary R40: deterministic test checks; no AI and no network.
 * All student-written answers are compared case/accent/punctuation-insensitively,
 * with exact equality (never fuzzy or partial substring matching). */
(function(root,factory){
 'use strict';const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSH_VOCAB_PRACTICE=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function fold(value){
  return String(value==null?'':value).normalize('NFKD')
   .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('und')
   .replace(/[’‘]/g,"'").replace(/[–—‐‑]/g,'-')
   .replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
 }
 function allowed(meaning){
  const raw=String(meaning||'').trim();if(!raw)return [];
  // Semi-colon/slash represent explicit dictionary alternatives, not loose matches.
  const variants=[raw,...raw.split(/\s*[;/|]\s*/).filter(Boolean)];
  return [...new Set(variants.map(fold).filter(Boolean))];
 }
 function checkAnswer(meaning,answer){
  const attempt=fold(answer);
  return !!attempt&&allowed(meaning).includes(attempt);
 }
 function shuffle(items,random=Math.random){
  const result=items.slice();
  for(let i=result.length-1;i>0;i--){
   const j=Math.floor(random()*(i+1));
   [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
 }
 function selectForTest(words,limit=30,random=Math.random){
  if(!Array.isArray(words))throw Error('Invalid test word selection');
  return shuffle(words.filter(w=>w.translationCs&&fold(w.translationCs)),random)
   .slice(0,limit);
 }
 function grade(deck,answers){
  if(!Array.isArray(deck)||!Array.isArray(answers)||answers.length!==deck.length)
   throw Error('Incomplete submitted test');
  const rows=deck.map((word,i)=>({
   id:word.id,term:word.term,language:word.language,
   answer:String(answers[i]||''),correctAnswer:word.translationCs,
   correct:checkAnswer(word.translationCs,answers[i])
  }));
  return {correct:rows.filter(x=>x.correct).length,total:rows.length,rows};
 }
 function matchingDeck(words,count=4,random=Math.random){
  if(!Array.isArray(words))throw Error('Invalid matching selection');
  const unique=new Set(),pool=[];
  for(const w of shuffle(words,random)){
   const meaning=fold(w.translationCs);
   // Matching cards must never show two indistinguishable definitions.
   if(!meaning||unique.has(meaning))continue;
   unique.add(meaning);pool.push(w);
  }
  return pool.slice(0,count);
 }
 return Object.freeze({fold,allowed,checkAnswer,shuffle,selectForTest,grade,matchingDeck});
});
