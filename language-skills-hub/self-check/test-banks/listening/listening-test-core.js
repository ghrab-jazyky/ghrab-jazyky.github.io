/* R34 Listening test BLUEPRINT validator. Structural subsets from practice,
 * NOT independently authored listening assessment; absolutely no publishing.
 * Does not fetch or expose any protected recording/transcript.
 */
(function(root){
 'use strict';
 const KIND='LSH_LISTENING_TEST_BLUEPRINT_DRAFT_R34_V1';
 const TOPICS=Object.freeze(['ll-matthew-oscars','ll-harrison-ford','ll-peaky-no-fighting']);
 const LEVELS=Object.freeze(['A1','A2','B1','B2','C1','C2']);
 const PARTS=Object.freeze({gist:2,detail:3,sequence:3,facts:1,open:1});
 function check(ok,message){if(!ok)throw new Error(message)}
 function validate(blueprint,practice,sourceHash,selection){
  check(blueprint&&typeof blueprint==='object'&&!Array.isArray(blueprint)&&
   blueprint.kind===KIND,'Invalid Listening assessment blueprint');
  check(blueprint.status==='DRAFT_PENDING_TEACHER_CONTENT_APPROVAL'&&
   blueprint.published===false,'Unapproved Listening blueprint cannot be published');
  check(TOPICS.includes(blueprint.topic)&&blueprint.language==='en'&&
   LEVELS.includes(blueprint.level),'Unsupported Listening assessment variant');
  if(selection)check(selection.topic===blueprint.topic&&selection.level===blueprint.level,
   'Wrong Listening topic or CEFR blueprint');
  check(/^[a-f0-9]{64}$/.test(sourceHash)&&
   blueprint.sourcePracticeContentHash===sourceHash,'Listening source checksum changed');
  check(blueprint.reviewStatus==='STRUCTURAL_SELECTION_NOT_INDEPENDENT_CONTENT'&&
   blueprint.editorialStatus==='REQUIRES_NEW_LISTENING_ITEMS_AND_AUDIO_VALIDATION',
   'Selected practice items must never masquerade as independent test content');
  check(blueprint.listensSuggested===2&&
   Number.isInteger(blueprint.durationMinutesSuggested)&&
   blueprint.durationMinutesSuggested>=5&&blueprint.durationMinutesSuggested<=120,
   'Invalid Listening timing policy');
  check(practice&&typeof practice==='object'&&
   blueprint.selections&&typeof blueprint.selections==='object',
   'Missing Listening source or selection');
  for(const [phase,size] of Object.entries(PARTS)){
   const data=practice[phase],selected=blueprint.selections[phase];
   check(Array.isArray(data)&&Array.isArray(selected)&&selected.length===size&&
    selected.every(n=>Number.isInteger(n)&&n>=0&&n<data.length)&&
    new Set(selected).size===size&&
    selected.every((n,i)=>i===0||n>selected[i-1]),
    'Invalid selected Listening tasks: '+phase);
  }
  return true;
 }
 function makeQaVariant(blueprint,practice,sourceHash,selection){
  validate(blueprint,practice,sourceHash,selection);
  const result={goal:practice.goal};
  for(const phase of Object.keys(PARTS)){
   result[phase]=blueprint.selections[phase].map(i=>JSON.parse(JSON.stringify(practice[phase][i])));
  }
  return result;
 }
 const api=Object.freeze({KIND,TOPICS,LEVELS,PARTS,validate,makeQaVariant});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHListeningTestBlueprint=api;
})(typeof window!=='undefined'?window:this);
