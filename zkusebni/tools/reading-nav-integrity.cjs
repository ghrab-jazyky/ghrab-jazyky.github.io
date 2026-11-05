#!/usr/bin/env node
/*
  Reading Lab v3.4 E4D: source-to-candidate patch integrity gate.
  Requires original and generated standalone student HTML. Never evaluates either.
  PASS only means the patch inserted exactly the canonical CSS/JS and changed
  NOTHING else (answers, texts, vocab, topicId included). No release approval.
  Usage: node reading-nav-integrity.cjs ORIGINAL.html PATCHED.html
*/
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const MAX=75*1024*1024;
const moduleDir=__dirname;
const read=p=>{
  const st=fs.statSync(p);
  if(!st.isFile()||st.size>MAX)throw Error('Invalid file or exceeds size limit: '+path.basename(p));
  return fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
};
const sha=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
function review(original,patched,css,js){
  const findings=[];
  const put=(id,ok,detail)=>findings.push({id,status:ok?'PASS':'FAIL',detail});
  const occurrences=(h,n)=>h.split(n).length-1;
  put('single-style-anchor',occurrences(original,'</style>')===1,'Original card must have exactly one inline CSS section');
  put('single-body-end',occurrences(original,'</body>')===1,'Original card must have exactly one closing body');
  put('unpatched-original',!original.includes('Reading Lab universal question<->text navigation, v2.2.'),'Original must be an unpatched card');
  const expected=original.replace('</style>','\n'+css+'\n</style>').replace('</body>','<script>\n'+js+'\n</script>\n</body>');
  put('canonical-patch-byte-exact',patched===expected,
    'Generated HTML must differ from source ONLY by the exact canonical embedded JS/CSS. All reading data, answers, vocabulary, topicId and session keys remain unchanged.');
  put('one-nav-module',occurrences(patched,'Reading Lab universal question<->text navigation, v2.2.')===1,
    'Expected exactly one embedded shared navigation v2.2 module');
  put('no-external-dependencies',!/<script\b[^>]*\bsrc\s*=|<link\b[^>]*\brel\s*=\s*["']?stylesheet/i.test(patched),
    'No added external script/style dependencies are permitted in student HTML');
  const failed=findings.filter(x=>x.status==='FAIL');
  return {tool:'Reading Lab E4D canonical nav patch integrity',standard:'Reading Lab v3.4, navigation v2.2',
    originalSHA256:sha(original),patchedSHA256:sha(patched),results:findings,
    counts:{passed:findings.length-failed.length,failed:failed.length},
    verdict:failed.length?'PATCH_INTEGRITY_FAIL':'PATCH_INTEGRITY_PASS',releaseDecision:'NO_GO',
    limitation:'Does not establish CEFR quality, correct answers, runtime WebKit/iOS behavior, IndexedDB persistence or teacher approval.'};
}
function main(){
 if(process.argv.length!==4){console.error('Usage: node reading-nav-integrity.cjs ORIGINAL.html PATCHED.html');process.exitCode=2;return;}
 try{
  const orig=read(process.argv[2]),patched=read(process.argv[3]),
    css=read(path.join(moduleDir,'reading-nav-v2_2.css')),
    js=read(path.join(moduleDir,'reading-nav-v2_2.js'));
  const report=review(orig,patched,css,js);process.stdout.write(JSON.stringify(report,null,2)+'\n');
  if(report.counts.failed)process.exitCode=1;
 }catch(e){console.error('Integrity failure: '+e.message);process.exitCode=2;}
}
if(require.main===module)main();else module.exports={review};
