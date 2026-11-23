"use strict";
/* Synthetic positive signoff is constructed only in memory, NEVER saved
 * into the user's real pending review matrix. */
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs");
const gate=require("../authoring/city-quest-f5c/release-readiness.cjs");
const matrix=gate.parseMatrix(fs.readFileSync(
 "language-skills-hub/authoring/city-quest-f4/F4_256_variant_release_review_matrix.csv","utf8"));
const approvals=JSON.parse(fs.readFileSync(
 "language-skills-hub/authoring/city-quest-f5c/F5C_RELEASE_APPROVALS.json","utf8"));
const manifest=JSON.parse(fs.readFileSync(".release-city-quest-f5c/REVIEW_MANIFEST.json","utf8"));
const fakeEvidence="Review Specialist | 2026-11-23 | synthetic-fixture-ONLY";
test("F5C release must remain NO-GO until every human and site gate is evidenced",()=>{
 const r=gate.evaluate({matrix,approvals,manifest});
 assert.equal(r.status,"NO_GO");
 assert.equal(r.deployPerformed,false);
 assert.equal(r.counts.rows,256);
 assert.equal(r.counts.pending,1024);
 assert.equal(r.counts.manualPending,gate.manualNames.length);
 assert.equal(r.eligible,false);
});
test("F5C cannot accept incomplete, unsigned or stale manual approvals",()=>{
 const signed=structuredClone(matrix);
 for(const row of signed.rows)for(let i=0;i<4;i++){
  row[4+i]="PASS";row[9+i]=fakeEvidence;
 }
 const conf=structuredClone(approvals);
 conf.releaseDecision="GO";conf.approvedArtifactSha256=manifest.sha256;
 for(const name of gate.manualNames)conf.manualGates[name]={
  status:"PASS",reviewer:"Review Specialist",date:"2026-11-23",
  evidence:"synthetic-fixture-ONLY"
 };
 const accepted=gate.evaluate({matrix:signed,approvals:conf,manifest});
 assert.equal(accepted.eligible,true,"Synthetic fully-signed fixture demonstrates gate can open");
 const unsigned=structuredClone(signed);unsigned.rows[0][9]="";
 assert.equal(gate.evaluate({matrix:unsigned,approvals:conf,manifest}).eligible,false);
 const stale=structuredClone(conf);stale.approvedArtifactSha256="a".repeat(64);
 assert.equal(gate.evaluate({matrix:signed,approvals:stale,manifest}).eligible,false);
 const incomplete=structuredClone(conf);incomplete.manualGates.voiceOver.status="PENDING";
 assert.equal(gate.evaluate({matrix:signed,approvals:incomplete,manifest}).eligible,false);
 const fakeDate=structuredClone(conf);fakeDate.manualGates.ownerFinalGo.date="2026-02-31";
 assert.equal(gate.evaluate({matrix:signed,approvals:fakeDate,manifest}).eligible,false);
 const duplicated=structuredClone(signed);duplicated.rows[1]=duplicated.rows[0].slice();
 assert.equal(gate.evaluate({matrix:duplicated,approvals:conf,manifest}).eligible,false);
 const veto=structuredClone(conf);veto.releaseDecision="NO_GO";
 assert.equal(gate.evaluate({matrix:signed,approvals:veto,manifest}).eligible,false);
});
