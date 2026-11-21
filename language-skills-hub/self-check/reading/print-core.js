/* RL-PDF-01: printable data projection, no answer key, no network.
 * Works in a static browser and can be unit-tested without the DOM.
 */
(function(root){
 'use strict';
 const MODES=Object.freeze(['practice','test']);
 const FORMATS=Object.freeze(['text','all']);
 function requireValid(ok,message){if(!ok)throw new Error(message);}
 function printable(variant,mode='practice',format='text'){
  requireValid(MODES.includes(mode),'Invalid reading print mode');
  requireValid(FORMATS.includes(format),'Invalid reading print format');
  requireValid(variant&&typeof variant==='object'&&
   typeof variant.title==='string'&&Array.isArray(variant.paragraphs)&&
   Array.isArray(variant.questions)&&Array.isArray(variant.tabs),
   'Invalid reading variant');
  const paragraphs=variant.paragraphs.map((original,index)=>{
   requireValid(typeof original==='string','Invalid reading paragraph');
   // Preserve the full practice-only text; a worksheet with the gap exercise must hide it.
    if((mode!=='test'&&format!=='all')||!variant.gap||variant.gap.p!==index)return original;
   const sentence=variant.gap.sentence;
   requireValid(typeof sentence==='string'&&sentence.length>0,'Invalid missing sentence');
   const at=original.indexOf(sentence);
   requireValid(at>=0,'Missing sentence is not present in its paragraph');
   return original.slice(0,at)+'[…]'+original.slice(at+sentence.length);
  });
  const sections=[];
  if(format==='all'){
   let ordinal=0;
   for(const tab of variant.tabs){
    const questions=variant.questions.filter(q=>q.tab===tab.id).map(q=>{
     ordinal++;
     // Intentionally omit answer, explanation, selectedIndex and other grading fields.
     return {number:ordinal,prompt:String(q.q),kind:String(q.kind),
      choices:q.choices.map(String)};
    });
    if(questions.length)sections.push({title:String(tab.title),questions});
   }
  }
  return {
   title:variant.title,paragraphs,sections,
   reflection:format==='all'&&typeof variant.open==='string'?variant.open:'',
   warmup:mode==='practice'&&format==='all'&&typeof variant.pre==='string'?variant.pre:'',
   hasGap:Boolean(variant.gap),mode,format
  };
 }
 const api=Object.freeze({printable,MODES,FORMATS});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHReadingPrintCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
