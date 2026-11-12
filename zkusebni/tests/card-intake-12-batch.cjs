#!/usr/bin/env node
/* CI-only real 12-card intake E2E. Clone public staging into a disposable temp
 * tree; never mutate the actual worktree, public catalog, or teacher keys.
 * Tests all 3 skills together, real apply, duplicate rejection, offline flags.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const sourceStage=path.resolve(__dirname,'..');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-bulk12-private-'));
const stage=path.join(temporary,'stage');
const fixture=path.join(temporary,'incoming');
const sha=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const read=relative=>fs.readFileSync(path.join(stage,relative));
const data=relative=>JSON.parse(read(relative).toString('utf8'));
const call=(args,expectError=false)=>{
 try{
  const stdout=execFileSync(process.execPath,[path.join(stage,'tools/card-intake.cjs'),...args],
   {cwd:temporary,encoding:'utf8',timeout:120000,env:{...process.env,LSH_INTAKE_TEST_FAILURE:''}});
  if(expectError)throw Error('Expected importer to reject duplicated 12-card batch');
  return stdout;
 }catch(error){
  if(!expectError)throw error;
  assert.ok(error.status!==undefined&&error.status!==0,
   'Duplicate import must exit non-zero');
  return String(error.stderr||error.message);
 }
};
try{
 fs.cpSync(sourceStage,stage,{recursive:true,force:false,errorOnExist:false});
 fs.mkdirSync(fixture,{recursive:true});
 const baselineFiles=['data/reference-pilots.json','data/unification-tracker.json',
  'data/claude-audit-queue.json'];
 const baseline=Object.fromEntries(baselineFiles.map(p=>[p,sha(read(p))]));
 const seeds=[
  {skill:'konverzace',prefix:'cl',file:'konverzace/socialni-media/index.html'},
  {skill:'cteni',prefix:'rl',file:'nahledy/cteni/asteroids/index.html'},
  {skill:'poslech',prefix:'ll',file:'reference/poslech/matthew-mcconaughey/index.html'}
 ];
 const batch={schemaVersion:1,cards:[]};
 for(const seed of seeds){
  const original=read(seed.file).toString('utf8');
  for(let i=1;i<=4;i++){
   const id=seed.prefix+'-bulk-smoke-'+i;
   const sourceFile=seed.prefix+'-source-'+i+'.html';
   const content=seed.skill==='konverzace'?
    original.replace('data-lsh-topic-id="cl-socialni-media"',
     'data-lsh-topic-id="'+id+'"'):original;
   if(seed.skill==='konverzace')
    assert.notEqual(content,original,'Expected distinct Conversation topic marker');
   fs.writeFileSync(path.join(fixture,sourceFile),content,{flag:'wx'});
   batch.cards.push({id,skill:seed.skill,
    title:'Bulk staging smoke '+seed.prefix+' '+i,
    summary:'Synthetic isolated staging-only import proving the twelve-card intake transaction.',
    version:'CI-12-'+i,sourceFile});
  }
 }
 assert.equal(batch.cards.length,12);
 const batchPath=path.join(fixture,'cards.json');
 fs.writeFileSync(batchPath,JSON.stringify(batch,null,2)+'\n');
 const preview=JSON.parse(call(['--batch',batchPath]));
 assert.equal(preview.mode,'dry-run');
 assert.equal(preview.safeToApply,true);
 assert.equal(preview.cards.length,12);
 for(const [file,hash] of Object.entries(baseline))
  assert.equal(sha(read(file)),hash,'Dry-run must not alter '+file);
 const result=JSON.parse(call(['--batch',batchPath,'--apply']));
 assert.equal(result.mode,'applied');
 assert.equal(result.cards.length,12);
 assert.equal(result.verification.entries,41);
 assert.equal(result.verification.queued,41);
 const catalog=data('data/reference-pilots.json'),queue=data('data/claude-audit-queue.json'),
   tracker=data('data/unification-tracker.json');
 assert.equal(catalog.entries.length,41);
 assert.equal(queue.topics.length,41);
 assert.equal(tracker.topics.length,41);
 assert.equal(catalog.approvedForTeaching,false);
 assert.equal(tracker.approvedForRelease,false);
 assert.deepEqual(tracker.currentPopulation,
  {konverzace:25,cteni:9,poslech:7,total:41});
 for(const card of batch.cards){
  const c=catalog.entries.find(e=>e.id===card.id);
  const q=queue.topics.find(e=>e.id===card.id);
  const t=tracker.topics.find(e=>e.id===card.id);
  assert.ok(c&&q&&t,'All three indexes required for '+card.id);
  assert.equal(c.test,'not-ready');
  assert.equal(c.practice,'preview');
  assert.equal(c.reviewState,'NEW_CARD_AUDIT_PENDING');
  assert.equal(q.status,'PENDING');
  assert.equal(q.teacherApproval,false);
  assert.equal(t.publicRelease,'BLOCKED_PENDING_REVIEW');
  assert.ok(fs.existsSync(path.join(stage,c.studentPath,'index.html')));
 }
 const verify=call(['--verify']);
 assert.match(verify,/PASS card intake verification/);
 call(['--batch',batchPath],true);
 call(['--batch',batchPath,'--apply'],true);
 assert.equal(data('data/reference-pilots.json').entries.length,41,
  'Duplicate intake must leave catalog unchanged');
 assert.ok(!fs.existsSync(path.join(stage,'data/.card-intake.lock')));
 // The source staging tree was never passed as the import root.
 for(const [file,hash] of Object.entries(baseline)){
  assert.equal(sha(fs.readFileSync(path.join(sourceStage,file))),hash,
   'Protected original school staging file mutated: '+file);
 }
 console.log('PASS LSH isolated 12-card import: 4 Conversation + 4 Reading + 4 Listening, dry-run/apply/verify/duplicates');
 console.log('PASS catalog/tracker/Claude queue: 29 -> 41, all new cards unapproved; original worktree untouched');
}finally{
 fs.rmSync(temporary,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
