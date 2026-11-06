'use strict';
// R4D: public student-only Listening reference; private teacher key is never committed.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const student='reference/poslech/matthew-mcconaughey/index.html';
const expectedSha='403022392cbd045cef72ed3554960f922f81545e5e077ad2d1fc9be2ad91a1df';
const expectedDataSha='6b95af7f65ca5fd63032a1dc881be7e22937ec169280b4d9339bf12b58313fc6';
function source(){
 const html=read(student).toString('utf8');
 const m=html.match(/const DATA=([\s\S]*?);\r?\nconst SOURCES=/);
 assert.ok(m,'Reference task data must remain literal JSON');
 return {html, data:JSON.parse(m[1]), dataLiteral:m[1]};
}
test('R4D: Listening reference student HTML exact, not a teacher key or graded TEST mode',()=>{
 const studentBytes=read(student),{html,dataLiteral}=source();
 assert.equal(studentBytes.length,101767);
 assert.equal(sha(studentBytes),expectedSha);
 assert.equal(sha(Buffer.from(dataLiteral,'utf8')),expectedDataSha);
 const files=fs.readdirSync(path.join(root,'reference','poslech','matthew-mcconaughey')).sort();
 assert.deepEqual(files,['index.html'],'No private teacher key is allowed in public student directory');
 const meta=JSON.parse(read('data/listening-reference-provenance.json'));
 const inv=JSON.parse(read('data/editorial-inventory.json'));
 const approvedManifest=JSON.parse(read('data/manifest.json'));
 assert.equal(meta.studentReferenceSha256,expectedSha);
 assert.equal(meta.sourceTaskDataSha256,expectedDataSha);
 assert.equal(meta.teacherKeyIsPublic,false);
 assert.equal(meta.gradedTestModeImplemented,false);
 assert.equal(meta.visibility,'PUBLIC_TEST_ONLY');
 assert.equal(inv.referenceCandidates.poslech.id,'ll-matthew-oscars');
 assert.equal(inv.referenceCandidates.poslech.referenceVersion,'v3');
 assert.equal(inv.referenceCandidates.poslech.approved,false);
 assert.equal(inv.topics.find(t=>t.id==='ll-matthew-oscars').sourceState,'public-test-preview');
 assert.equal(approvedManifest.topics.some(t=>t.id==='ll-matthew-oscars'),false);
 const previewHub=read('nahledy/index.html').toString();
 assert.match(previewHub,/reference\/poslech\/matthew-mcconaughey\//);
 assert.match(previewHub,/Starší původní verze v1 pro srovnání/);
 assert.ok(fs.existsSync(path.join(root,'nahledy','poslech','matthew-mcconaughey','index.html')),
    'Legacy v1 preview must remain accessible');
 assert.doesNotMatch(html,/(?:<script[^>]+src=|<form[^>]+action=|name="studentId")/i);
});
test('R4D: six listening levels have three pass stages and separate ungraded writing and vocabulary',()=>{
 const {data,html}=source();
 const counts={A1:[3,4,3,4,3],A2:[3,5,4,4,3],B1:[3,6,5,5,5],B2:[3,6,6,6,5],C1:[3,7,6,6,6],C2:[4,7,6,6,6]};
 assert.deepEqual(Object.keys(data),Object.keys(counts));
 let closed=0, corePoints=0;
 for(const [level,[gist,detail,sequence,vocab,written]] of Object.entries(counts)){
  const d=data[level];
  assert.equal(d.gist.length,gist,level+' first');
  assert.equal(d.detail.length,detail,level+' second');
  assert.equal(d.sequence.length,sequence,level+' reconstruction');
  assert.equal(d.vocab.length,vocab,level+' optional vocab');
  assert.equal(d.facts.length+d.open.length,written,level+' written');
  assert.ok(d.talk.length>=2,level+' after listening');
  for(const q of [...d.gist,...d.detail]){
   closed++;
   assert.ok(Array.isArray(q.options)&&q.options.length>=3);
   if(q.type==='multi'){
    assert.ok(Array.isArray(q.correct)&&q.correct.length>=2);
    assert.ok(q.correct.every(n=>Number.isInteger(n)&&n>=0&&n<q.options.length));
   }else{
    assert.equal(q.type,'single');
    assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length);
   }
  }
  corePoints+=gist+detail+sequence;
 }
 assert.equal(corePoints,84);
 assert.equal(closed,54);
 for(const id of ['gist','detail','evidence','language','thinking','finish','checkFirstBtn','checkSecondBtn','checkThirdBtn','checkVocabBtn','checkBtn','scoreNumber','reviewSummary']){
  assert.equal(html.split('id="'+id+'"').length-1,1,'Missing/duplicate UI id '+id);
 }
 for(const label of ['FIRST LISTENING','SECOND LISTENING','THIRD LISTENING','Listen for the Big Picture','Listen and Interpret','Written Evidence','Reconstruct the Speech','Language of the Speech','Beyond the Speech','Check All Listening Tasks']){
  assert.ok(html.includes(label),'Required section '+label);
 }
 assert.match(html,/function getMax\(\)\{const d=DATA\[current\];return d\.gist\.length\+d\.detail\.length\+d\.sequence\.length;\}/);
 assert.match(html,/No numerical points assigned to writing/);
 assert.match(html,/Optional activity\. Not checked yet/);
 assert.match(html,/feedback\.tentative/);
 assert.doesNotMatch(html,/\bgradedTestMode\s*=\s*true\b/);
 const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(js);
 assert.doesNotThrow(()=>new vm.Script(js,{filename:'matthew-v3-student.js'}));
});
