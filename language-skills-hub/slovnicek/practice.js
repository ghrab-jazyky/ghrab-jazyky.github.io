/* My Vocabulary v1 – original standalone games and objective test scorer.
   Student-provided vocabulary is never transmitted or evaluated by an external AI. */
(function(root,factory){
'use strict';
const api=factory();
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.LSH_VOCAB_PRACTICE=api;
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const compare=value=>String(value??'').normalize('NFKD')
 .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase()
 .replace(/[’‘]/g,"'").replace(/[‐‑‒–—]/g,'-')
 .replace(/[.,!?;:()[\]{}"'„“”]/g,' ')
 .replace(/\s+/g,' ').trim();
function meanings(word){
 if(!word||typeof word.translationCs!=='string')return [];
 return word.translationCs.split(/\s*[;|]\s*/).map(s=>s.trim()).filter(Boolean);
}
function scorable(word){return Boolean(word?.term?.trim()&&meanings(word).length)}
function gradeWritten(word,response){
 if(!scorable(word))return {correct:false,reason:'Toto slovíčko nemá český překlad.'};
 const normalized=compare(response);
 if(!normalized)return {correct:false,reason:'Prázdná odpověď.'};
 const accepted=meanings(word);
 return {correct:accepted.some(x=>compare(x)===normalized),accepted};
}
function shuffle(items,rng=Math.random){
 const out=[...items];
 for(let i=out.length-1;i>0;i--){
  const j=Math.floor(rng()*(i+1));const k=Math.max(0,Math.min(i,j));
  [out[i],out[k]]=[out[k],out[i]];
 }
 return out;
}
function selectChoices(target,words,rng=Math.random){
 if(!scorable(target))throw new Error('Word has no translation');
 const correct=meanings(target)[0],key=compare(correct);
 const distractors=shuffle(words.filter(w=>w.id!==target.id&&scorable(w)&&
    w.language===target.language&&compare(meanings(w)[0])!==key),rng);
 const unique=new Set([key]),items=[{id:target.id,label:correct,correct:true}];
 for(const w of distractors){
  const label=meanings(w)[0],k=compare(label);
  if(unique.has(k))continue;
  unique.add(k);items.push({id:w.id,label,correct:false});
  if(items.length===4)break;
 }
 if(items.length<2)throw new Error('Potřebuješ alespoň dvě různá slovíčka se stejným jazykem a překladem.');
 return shuffle(items,rng);
}
function buildMatch(words,rng=Math.random){
 const data=shuffle(words.filter(scorable),rng).slice(0,4);
 if(data.length<2)throw new Error('Vyber alespoň dvě slovíčka s českým překladem.');
 const unique=new Set();
 const pairs=[];
 for(const w of data){
  const label=meanings(w)[0],key=compare(label);
  if(unique.has(key))continue;
  unique.add(key);
  pairs.push({id:w.id,term:w.term,meaning:label});
 }
 if(pairs.length<2)throw new Error('Pro spojování potřebuješ různé české významy.');
 return {pairs,left:shuffle(pairs.map(p=>({id:p.id,label:p.term})),rng),
  right:shuffle(pairs.map(p=>({id:p.id,label:p.meaning})),rng)};
}
function summarize(results){
 const count=results.length,correct=results.filter(x=>x.correct===true).length;
 return {count,correct,wrong:count-correct,percent:count?Math.round(100*correct/count):0};
}
return Object.freeze({compare,meanings,scorable,gradeWritten,shuffle,selectChoices,buildMatch,summarize});
});
