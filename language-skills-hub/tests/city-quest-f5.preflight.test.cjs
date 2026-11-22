"use strict";
/* F5 source handoff preflight: ensure complete evidence, true review status,
 * and explicit no-merge boundaries. Does NOT certify human sign-offs.
 */
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");
const f4sha="73d2781ab51feaa95b2c5b014e24570b4d1f5d93";

test("F5 pins exact successful F4 source and avoids automatic production approval",()=>{
 const m=JSON.parse(read("authoring/city-quest-f5/F5_EVIDENCE_MANIFEST.json"));
 assert.equal(m.reference_code_commit,f4sha);
 assert.equal(m.f4_workflow_run.id,45025682912);
 assert.equal(m.f4_workflow_run.conclusion,"success");
 assert.equal(m.city_quest_workflows.relevant_total,11);
 assert.equal(m.city_quest_workflows.success,11);
 assert.equal(m.city_quest_workflows.failed,0);
 assert.equal(m.artifacts.offline_html.bytes,421002);
 assert.match(m.artifacts.offline_html.sha256,/^[a-f0-9]{64}$/);
 assert.equal(m.human_approval_status.release,"NO-GO");
 assert.match(m.human_approval_status.physical_ios_android_screenreaders,/NOT TESTED/);
 assert.equal(m.main_divergence_at_prepare.status,"diverged");
 assert.equal(m.main_divergence_at_prepare.revalidate_before_merge,true);
});

test("F5 preserves 256 disjoint variants and all original human gates PENDING",()=>{
 const lines=read("authoring/city-quest-f4/F4_256_variant_release_review_matrix.csv").trim().split(/\r?\n/);
 const parse=line=>line.slice(1,-1).split('","');
 const headers=parse(lines.shift());
 const expectedHeaders=["language","cefr","mission","mode","linguistic_review","pedagogical_review","accessibility_review","owner_approval","notes"];
 assert.deepEqual(headers,expectedHeaders);
 const rows=lines.map(line=>Object.fromEntries(headers.map((h,i)=>[h,parse(line)[i]])));
 assert.equal(rows.length,256);
 const actual=new Set(rows.map(r=>[r.language,r.cefr,r.mission,r.mode].join("|")));
 assert.equal(actual.size,256);
 const expected=new Set();
 for(const language of ["en","es","de","fr"]){
  for(const level of ["A1","A2","B1","B2","C1","C2"]){
   for(let mission=1;mission<=8;mission++)expected.add([language,level,String(mission).padStart(2,"0"),"CITY"].join("|"));
   if(["B1","B2","C1","C2"].includes(level))
    for(let mission=5;mission<=8;mission++)expected.add([language,level,String(mission).padStart(2,"0"),"METRO"].join("|"));
  }
 }
 assert.equal(expected.size,256);
 assert.deepEqual([...actual].sort(),[...expected].sort());
 for(const row of rows)for(const col of ["linguistic_review","pedagogical_review","accessibility_review","owner_approval"])
  assert.equal(row[col],"PENDING",row.language+"/"+row.cefr+"/"+row.mission+"/"+row.mode+"/"+col);
});

test("F5 manual device cases are expressly unreviewed",()=>{
 const lines=read("authoring/city-quest-f5/F5_MANUAL_DEVICE_AND_CONTENT_QA.csv").trim().split(/\r?\n/);
 assert.equal(lines.length,33,"32 manual QA cases + 1 header");
 assert.match(lines[0],/review_status/);
 for(const line of lines.slice(1)){
  assert.match(line,/"NOT TESTED","",""$/);
  assert.doesNotMatch(line,/"PASS"/);
 }
});

test("F5 handoff explicitly contains review, integration and no-release instructions",()=>{
 const prompt=read("authoring/city-quest-f5/F5_CLAUDE_MASTER_PROMPT_CZ.md");
 const plan=read("authoring/city-quest-f5/F5_INTEGRACNI_PLAN_CZ.md");
 const gates=read("authoring/city-quest-f5/F5_GATE_PLAN_AKCEPTACE_CZ.md");
 const quality=read("authoring/city-quest-f5/F5_PREMIOVY_PRODUKT_A_DIDAKTIKA_CZ.md");
 for(const token of ["CLAUDE_F5_VERDICT.md","CLAUDE_F5_FINDINGS.csv","CLAUDE_F5_LANGUAGE_REVIEW.csv",
  "CLAUDE_F5_TEST_EVIDENCE.md","CLAUDE_F5_RELEASE_PLAN.md","CLAUDE_F5_PREMIUM_DIDACTIC_QA.md","256","VoiceOver","TalkBack","\`main\`"]){
  assert.ok(prompt.includes(token),"Master prompt missing "+token);
 }
 assert.match(plan,/270 ahead/);
 assert.match(plan,/100 behind/);
 assert.match(gates,/NO-GO/);
 assert.match(prompt,/NEPROVÁDĚJ žádný merge/);
 assert.match(prompt,/F5_PREMIOVY_PRODUKT_A_DIDAKTIKA_CZ\.md/);
 assert.match(quality,/Interaktivní jazyková hra/);
 assert.match(quality,/CITY 01/);
 assert.match(quality,/METRO 08/);
 assert.match(quality,/Mobile|mobile|MOBIL/);
 assert.ok(fs.existsSync(path.join(root,"konverzace/city-quest-f2/index.html")));
});
