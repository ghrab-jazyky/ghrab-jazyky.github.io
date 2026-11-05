/* E4G: generic fail-closed local collection integrity gate.
   No student HTML, teacher key, responses, remote requests or deployment.
   An intact collection permits LOCAL numerical scoring only; never pedagogy approval. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const FILES=[
 'manifest.json','RESPONSES_BLIND.csv','RESPONSES_WITH_TEXT.csv',
 'ASSESSOR_DECLARATIONS.csv','QUESTION_REVIEW_NOTES_TEMPLATE.csv'
];
function sha(data){return crypto.createHash('sha256').update(data).digest('hex');}
function readJSON(file){const text=fs.readFileSync(file,'utf8');return JSON.parse(text);}
function verify(folder,sourceHTML){
 if(typeof folder!=='string'||typeof sourceHTML!=='string')throw Error('Folder and original student HTML are required');
 const p=path.resolve(folder);
 const statusPath=path.join(p,'COLLECTION_STATUS.json'),readyPath=path.join(p,'COLLECTION_READY.json');
 if(!fs.existsSync(statusPath)||!fs.existsSync(readyPath))
   throw Error('Collection incomplete or invalid: no valid E4G ready marker');
 const status=readJSON(statusPath),ready=readJSON(readyPath);
 if(status.status!=='COMPLETE_NEEDS_MANUAL_VALIDATION'||
    status.collection_ready!==true||status.submitted_cases!==80||
    status.submitted_answers!==528||!Array.isArray(status.issues)||status.issues.length!==0||
    ready.kind!=='LSH_E4G_COLLECTION_READY_V1'||
    ready.status!==status.status||ready.required_cases!==80||
    ready.required_answers!==528||ready.release_decision!=='NO_GO')
   throw Error('Collection has not passed all 80-case and 528-answer intake checks');
 if(ready.source_sha256!==sha(sourceHTML))
   throw Error('Original student card fingerprint mismatch');
 const names=Object.keys(ready.files_sha256||{}).sort();
 if(JSON.stringify(names)!==JSON.stringify(FILES.slice().sort()))
   throw Error('Integrity declaration does not enumerate exactly the expected files');
 for(const name of FILES){
   if(name!==path.basename(name))throw Error('Unsafe declared filename');
   const file=path.join(p,name);
   const contents=fs.readFileSync(file);
   if(sha(contents)!==ready.files_sha256[name])
     throw Error('Collection file changed after verification: '+name);
 }
 return Object.freeze({kind:'LSH_E4G_LOCAL_SCORING_PRECHECK',verified:true,
   checkedFiles:FILES.length,requiredCases:80,requiredAnswers:528,releaseDecision:'NO_GO'});
}
module.exports={verify,FILES,sha};
if(require.main===module){
 const [folder,original]=process.argv.slice(2);
 try{
  if(!folder||!original)throw Error('Usage: node e4g-collection-gate.cjs COLLECTED_DIR ORIGINAL_STUDENT.html');
  const result=verify(folder,fs.readFileSync(original,'utf8'));
  console.log(JSON.stringify(result,null,2));
 }catch(error){console.error('E4G GATE REJECTED: '+error.message);process.exitCode=1;}
}
