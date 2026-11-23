#!/usr/bin/env node
"use strict";
/* Read-only City Quest manual-release gate. Never publishes, commits or deploys.
 * This is evidence completeness, NOT authentication of signers or human QA. */
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../../../");
const manualNames=[
 "independentClaudeReview","editorialFinalAcceptance","ownerVisualApproval",
 "physicalIPhoneSafari","physicalIPadSafariSplitView","physicalAndroidChrome",
 "voiceOver","talkBack","publicationIsolation","ownerFinalGo"
];
const expectedColumns=["language","cefr","mission","mode","linguistic_review",
 "pedagogical_review","accessibility_review","owner_approval","notes",
 "linguistic_evidence","pedagogical_evidence","accessibility_evidence","owner_evidence"];
const validStates=new Set(["PENDING","PASS","FAIL"]);
function parseMatrix(csv){
 const raw=csv.trimEnd().split(/\r?\n/).map(line=>[...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)]
  .map(m=>m[1].replaceAll('""','"')));
 return {columns:raw.shift(),rows:raw};
}
function realDate(d){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;
 const dt=new Date(d+"T00:00:00Z");
 return Number.isFinite(dt.getTime())&&dt.toISOString().slice(0,10)===d;
}
function hasEvidence(value){
 if(typeof value!=="string")return false;
 const match=value.match(/^(.{2,100}) \| (\d{4}-\d{2}-\d{2}) \| (.{5,500})$/);
 return Boolean(match&&realDate(match[2]));
}
function hasManualEvidence(record){
 return Boolean(record&&typeof record.reviewer==="string"&&record.reviewer.trim().length>=2
  &&realDate(record.date)&&typeof record.evidence==="string"&&record.evidence.trim().length>=5);
}
function evaluate({matrix,approvals,manifest}){
 const issues=[],counts={rows:0,city:0,metro:0,pending:0,pass:0,fail:0,invalid:0,
  manualPending:0,manualPass:0,manualFail:0};
 const note=s=>{if(issues.length<20)issues.push(s);};
 if(JSON.stringify(matrix?.columns)!==JSON.stringify(expectedColumns))note("Invalid matrix schema");
 const seen=new Set();
 for(const row of matrix?.rows||[]){
  counts.rows++;
  if(!Array.isArray(row)||row.length!==13){counts.invalid++;note("Matrix row must have 13 columns");continue;}
  const [lang,cefr,mission,mode]=row,key=[lang,cefr,mission,mode].join("/");
  const valid=["en","es","de","fr"].includes(lang)
   &&["A1","A2","B1","B2","C1","C2"].includes(cefr)
   &&/^(0[1-8])$/.test(mission)
   &&(mode==="CITY"||(mode==="METRO"&&!["A1","A2"].includes(cefr)&&Number(mission)>=5))
   &&!seen.has(key);
  if(!valid){counts.invalid++;note("Invalid or duplicated variant "+key);}
  seen.add(key);
  if(mode==="CITY")counts.city++;else if(mode==="METRO")counts.metro++;
  for(let i=0;i<4;i++){
   const state=row[4+i],proof=row[9+i];
   if(!validStates.has(state)){counts.invalid++;note("Invalid review state "+key+" criterion "+i);continue;}
   if(state==="PENDING"){counts.pending++;if(proof!==""){counts.invalid++;note("Unreviewed row has evidence "+key);}}
   else{
    if(state==="PASS")counts.pass++;else counts.fail++;
    if(!hasEvidence(proof)){counts.invalid++;note("Review decision lacks signed evidence "+key+" criterion "+i);}
   }
  }
 }
 if(counts.rows!==256||counts.city!==192||counts.metro!==64)
  note("Matrix requires exactly 192 CITY and 64 METRO variants");
 if(approvals?.schemaVersion!==1||!approvals?.manualGates||approvals.releaseDecision!=="GO"&&approvals.releaseDecision!=="NO_GO")
  note("Manual approval schema or release decision invalid");
 for(const name of manualNames){
  const entry=approvals?.manualGates?.[name];
  if(!entry||!validStates.has(entry.status)){counts.invalid++;note("Invalid manual gate "+name);continue;}
  if(entry.status==="PENDING")counts.manualPending++;
  else{
   if(entry.status==="PASS")counts.manualPass++;else counts.manualFail++;
   if(!hasManualEvidence(entry)){counts.invalid++;note("Missing reviewer/date/evidence for "+name);}
  }
 }
 if(Object.keys(approvals?.manualGates||{}).sort().join("|")!==manualNames.slice().sort().join("|"))
  note("Manual gate keys must match the release contract exactly");
 if(manifest?.status!=="REVIEW_ONLY_NOT_DEPLOYED"||
   JSON.stringify(manifest.files)!==JSON.stringify(["city-quest/index.html"])||
   manifest.externalResources!==0||!/^[a-f0-9]{64}$/.test(manifest.sha256||""))
  note("Publication manifest must be an isolated one-file review artifact");
 const hashMatches=manifest?.sha256&&approvals?.approvedArtifactSha256===manifest.sha256;
 const eligible=issues.length===0&&counts.invalid===0&&counts.rows===256&&counts.city===192&&counts.metro===64
  &&counts.pending===0&&counts.fail===0&&counts.manualPending===0&&counts.manualFail===0
  &&counts.manualPass===manualNames.length&&hashMatches&&approvals.releaseDecision==="GO";
 if(!hashMatches)note("Final human approval is not bound to the staged HTML SHA-256");
 if(approvals?.releaseDecision!=="GO")note("Owner releaseDecision remains NO_GO");
 return {status:eligible?"ELIGIBLE_FOR_SEPARATE_RELEASE_DECISION":"NO_GO",
  deployPerformed:false,eligible,counts,publicationHash:manifest?.sha256||null,
  approvedHash:approvals?.approvedArtifactSha256||null,issues};
}
function load(){
 const csv=fs.readFileSync(path.join(root,"language-skills-hub/authoring/city-quest-f4/F4_256_variant_release_review_matrix.csv"),"utf8");
 const a=JSON.parse(fs.readFileSync(path.join(__dirname,"F5C_RELEASE_APPROVALS.json"),"utf8"));
 const m=JSON.parse(fs.readFileSync(path.join(root,".release-city-quest-f5c/REVIEW_MANIFEST.json"),"utf8"));
 return evaluate({matrix:parseMatrix(csv),approvals:a,manifest:m});
}
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.length!==1||!["--report","--enforce"].includes(args[0]))
  throw Error("Use --report (read only) or --enforce (fail closed; still never deploys)");
 const r=load();
 process.stdout.write(JSON.stringify(r,null,2)+"\n");
 if(args[0]==="--enforce"&&!r.eligible)process.exitCode=1;
}
module.exports={parseMatrix,hasEvidence,hasManualEvidence,evaluate,load,manualNames,expectedColumns};
