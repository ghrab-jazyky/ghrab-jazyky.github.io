/* R40: Reading cards keep their proven dictionary/save logic.
 * This bridge makes the existing My Vocabulary button open the shared
 * Conversation + Reading + Listening library. It does not erase legacy data. */
(function(root){
 'use strict';
 if(!root.document)return;
 function init(){
  const b=document.getElementById('rl-vocab-button');
  if(!b){console.warn('LSH vocabulary bridge: Reading button not found');return}
  const target=new URL('../../slovnicek/index.html',document.baseURI);
  target.searchParams.set('zpet',location.pathname+location.search);
  b.dataset.lshSharedVocabulary='true';
  b.title='My Vocabulary – společný slovníček, hry, zkoušení, záloha a obnova';
  b.addEventListener('click',function(ev){
   ev.preventDefault();
   ev.stopImmediatePropagation();
   location.assign(target.href);
  },{capture:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})(typeof window!=='undefined'?window:globalThis);
