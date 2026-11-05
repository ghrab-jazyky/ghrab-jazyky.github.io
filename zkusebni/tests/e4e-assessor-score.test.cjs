/* E4E synthetic-only regression for 80-case independent assessor QA scorer.
   These invented fixtures contain no actual Reading Lab content or teacher key. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {assess,expected,EXPECTED_HEADER,ASSIGN_HEADER}=require('../tools/reading-v34-assessor-score.cjs');
const LANGS=['en','es','de','fr'],LEVELS=['A1','A2','B1','B2','C1','C2'];
const TABS={A1:['gist','scan','detail'],A2:['gist','scan','detail'],
  B1:['gist','scan','detail','structure'],
  B2:['gist','scan','detail','inference','matching','structure'],
  C1:['gist','scan','detail','inference','vocab','matching','structure'],
  C2:['gist','scan','inference','tone','critical','matching','structure']};
function fixture(){
 const data={};
 for(const lang of LANGS){data[lang]={};
  for(const level of LEVELS){
   const tabs=TABS[level].map(id=>({id,title:id}));
   const questions=[];let i=0;
   for(const tab of tabs)for(let n=0;n<3;n++){
    const count=['A1','A2','B1'].includes(level)?3:4;
    questions.push({id:lang+'-'+level.toLowerCase()+'-'+String(++i).padStart(2,'0'),tab:tab.id,
      choices:Array.from({length:count},(_,j)=>'fictional option '+j),answer:i%count,q:'Synthetic question'});
   }
   data[lang][level]={title:'Completely fictional card',paragraphs:[
      'This is a deliberately invented very long paragraph that has no connection to any actual submitted Reading Lab student text and contains only generic filler characters.'
    ],tabs,questions};
  }
 }
 const html='<!doctype html><script>const DATA='+JSON.stringify(data)+';</script>';
 const e=expected(data),manifest={metadata:{sourceSHA256:crypto.createHash('sha256').update(html).digest('hex')},
  cases:[...e.cases.values()].map(c=>({kind:c.mode,id:c.id,lang:c.lang,level:c.level,
    tab:c.tab,questionCount:c.questionCount}))};
 const blank={blind:[EXPECTED_HEADER],fulltext:[EXPECTED_HEADER]};
 const filled={blind:[EXPECTED_HEADER],fulltext:[EXPECTED_HEADER]};
 for(const q of e.rows.values()){
  blank[q.mode].push([q.mode,q.id,q.questionId,''].join(','));
  filled[q.mode].push([q.mode,q.id,q.questionId,'A'].join(','));
 }
 const csv=rows=>rows.join('\n')+'\n';
 const assignments=[ASSIGN_HEADER];
 for(const c of e.cases.values()){
  const alias='Assessor_'+c.id.replace(/[^a-zA-Z0-9]/g,'_');
  assignments.push([c.id,alias,'YES',c.mode==='blind'?'NO':'YES','NO',
    c.mode==='blind'?'NO':'YES',c.mode==='blind'?'NO':'YES','YES'].join(','));
 }
 return {html,data,e,manifest,blank,filled,csv,assignments:csv(assignments)};
}
const makeArgs=f=>({studentHTML:f.html,manifest:f.manifest,blindCSV:f.csv(f.blank.blind),withTextCSV:f.csv(f.blank.fulltext)});
test('80 exact synthetic cases / 528 answer slots: blank pack stays NOT EVALUATED',()=>{
 const f=fixture(),r=assess(makeArgs(f));
 assert.equal(r.counts.blindCases,56);
 assert.equal(r.counts.withTextCases,24);
 assert.equal(r.counts.blindSlots,168);
 assert.equal(r.counts.withTextSlots,360);
 assert.equal(r.counts.responseRowsPresent,528);
 assert.equal(r.counts.unansweredSlots,528);
 assert.equal(r.counts.scoredCases,0);
 assert.equal(r.status,'WAITING_FOR_INDEPENDENT_RESPONSES');
 assert.equal(r.releaseDecision,'NO_GO');
 assert.equal(r.counts.issues,0);
});
test('A truncated CSV never masquerades as an assessment of all 56 blind tabs',()=>{
 const f=fixture();const args=makeArgs(f);
 args.blindCSV=f.csv(f.blank.blind.slice(0,4));
 const r=assess(args);
 assert.equal(r.status,'INVALID_INPUT');
 assert.equal(r.counts.responseRowsPresent,363);
 assert.equal(r.issues.filter(x=>x.code==='MISSING_RESPONSE_ROW').length,165);
 assert.equal(r.releaseDecision,'NO_GO');
});
test('Reject duplicate rows, spurious case IDs and inconsistent mapping',()=>{
 const f=fixture(),args=makeArgs(f);
 args.blindCSV+=f.blank.blind[1]+'\n';
 let r=assess(args);
 assert.ok(r.issues.some(x=>x.code==='DUPLICATE_RESPONSE'));
 args.blindCSV=f.csv([...f.blank.blind,'blind,blind-en-C1-invalid,en-c1-01,A']);
 r=assess(args);
 assert.ok(r.issues.some(x=>x.code==='UNEXPECTED_RESPONSE'));
});
test('Invalid choice letter and beyond-three-option response must be rejected',()=>{
 const f=fixture(),args=makeArgs(f);
 const id=f.blank.fulltext[1].split(',').slice(0,3).join(',');
 args.withTextCSV=args.withTextCSV.replace(id+',',id+',E');
 let r=assess(args);
 assert.ok(r.issues.some(x=>x.code==='OUT_OF_RANGE_CHOICE'));
 args.withTextCSV=f.csv(f.blank.fulltext).replace(id+',',id+',??');
 r=assess(args);assert.ok(r.issues.some(x=>x.code==='INVALID_CHOICE'));
});
test('Original Reading HTML fingerprint cannot be silently substituted',()=>{
 const f=fixture();f.manifest.metadata.sourceSHA256='0'.repeat(64);
 const r=assess(makeArgs(f));
 assert.equal(r.status,'INVALID_INPUT');
 assert.ok(r.issues.some(x=>x.code==='SOURCE_HASH'));
});
test('Altered manifest cases must be detected',()=>{
 const f=fixture();f.manifest.cases.pop();
 let r=assess(makeArgs(f));assert.ok(r.issues.some(x=>x.code==='CASE_MANIFEST_COUNT'));
 assert.ok(r.issues.some(x=>x.code==='MISSING_MANIFEST_CASE'));
});
test('Submitted letters can be scored but never qualify for release or independence',()=>{
 const f=fixture();
 const r=assess({...makeArgs(f),blindCSV:f.csv(f.filled.blind),withTextCSV:f.csv(f.filled.fulltext)});
 assert.equal(r.counts.scoredCases,80);
 assert.equal(r.counts.unansweredSlots,0);
 assert.equal(r.status,'SCORED_BUT_ASSESSOR_EVIDENCE_MISSING');
 assert.equal(r.releaseDecision,'NO_GO');
 assert.ok(!JSON.stringify(r).includes('fictional option'));
});
test('Correctly self-declared assessor sessions still require teacher/manual review',()=>{
 const f=fixture();const r=assess({...makeArgs(f),blindCSV:f.csv(f.filled.blind),
  withTextCSV:f.csv(f.filled.fulltext),assignmentsCSV:f.assignments});
 assert.equal(r.status,'SCORED_SELF_DECLARED_REQUIRES_MANUAL_REVIEW');
 assert.equal(r.counts.assignmentDeclarations,80);
 assert.equal(r.releaseDecision,'NO_GO');
});
test('Assessor may receive at most one blind tab per CEFR level',()=>{
 const f=fixture(),lines=f.assignments.trim().split('\n');
 const b1=lines.findIndex(l=>l.startsWith('blind-en-C1-gist,'));
 const b2=lines.findIndex(l=>l.startsWith('blind-en-C1-scan,'));
 assert.ok(b1>0&&b2>0);
 const a=lines[b1].split(',');
 const b=lines[b2].split(',');
 b[1]=a[1];lines[b2]=b.join(',');
 const r=assess({...makeArgs(f),assignmentsCSV:lines.join('\n')+'\n'});
 assert.ok(r.issues.some(x=>x.code==='MULTIPLE_TABS_SAME_ASSESSOR_LEVEL'));
 assert.equal(r.status,'INVALID_INPUT');
});
test('An assessor who saw the article or answer key cannot pass blind policy',()=>{
 const f=fixture(),s=f.assignments.replace(/(blind-en-C1-gist,[^,]+,YES,)NO,NO,NO/,'$1YES,NO,NO');
 assert.notEqual(s,f.assignments);
 const r=assess({...makeArgs(f),assignmentsCSV:s});
 assert.ok(r.issues.some(x=>x.code==='ASSIGNMENT_POLICY'));
});
test('Packet audit finds missing case file and leaked source paragraph',()=>{
 const f=fixture(),packets={};
 for(const c of f.e.cases.values()){
  const rel=(c.mode==='blind'?'blind_one_tab_only':'with_text_one_variant_only')+'/'+c.id+'.txt';
  packets[rel]='Synthetic '+c.id+'\n'+c.items.map(k=>f.e.rows.get(k).questionId+' | invented question').join('\n');
 }
 let r=assess({...makeArgs(f),packets});
 assert.equal(r.packetCoverage.found,80);assert.equal(r.counts.issues,0);
 const id='blind-en-C1-gist',key='blind_one_tab_only/'+id+'.txt';
 packets[key]+='\n'+f.data.en.C1.paragraphs[0];
 r=assess({...makeArgs(f),packets});
 assert.ok(r.issues.some(x=>x.code==='BLIND_ARTICLE_LEAK'));
 delete packets[key];
 r=assess({...makeArgs(f),packets});
 assert.ok(r.issues.some(x=>x.code==='MISSING_PACKET'));
});
