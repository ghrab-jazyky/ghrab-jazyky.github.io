"use strict";
/* F4 independent distribution and audit-scope test.
 * Does not import the app's own engine or use its unit-test helpers.
 * Human and device approval is recorded separately as pending.
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const file=path.resolve(".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
const src=file&&fs.readFileSync(file,"utf8");
const sha=d=>crypto.createHash("sha256").update(d,"utf8").digest("base64");
const hex=d=>crypto.createHash("sha256").update(d,"utf8").digest("hex");
test("F4 independent: generated file is self-contained, CSP SHA256 exact and network forbidden",()=>{
 assert.match(src,/^<!doctype html>/i);
 const meta=src.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
 assert.ok(meta,"Explicit CSP header required");
 const policy=meta[1];
 for(const word of ["default-src 'none'","connect-src 'none'","base-uri 'none'",
  "object-src 'none'","form-action 'none'","frame-src 'none'","font-src 'none'"])
  assert.ok(policy.includes(word),"Missing CSP boundary "+word);
 const scripts=[...src.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 const styles=[...src.matchAll(/<style>([\s\S]*?)<\/style>/g)];
 assert.equal(scripts.length,1,"Exactly one inline application script");
 assert.equal(styles.length,1,"Exactly one inline authored stylesheet");
 assert.ok(policy.includes("script-src 'sha256-"+sha(scripts[0][1])+"'"));
 assert.ok(policy.includes("style-src 'sha256-"+sha(styles[0][1])+"'"));
 assert.doesNotMatch(src,/<script[^>]*\bsrc=|<link[^>]*\bhref=|<iframe|<form|<object|<img[^>]*\bsrc=/i);
 // Do not introduce network, device tracking or persistent student data in JS.
 for(const dep of [/fetch\s*\(/, /new\s+WebSocket\s*\(/, /XMLHttpRequest\s*\(/,
  /navigator\.geolocation/, /navigator\.mediaDevices/, /localStorage\s*\./,
  /sessionStorage\s*\./, /indexedDB\./])
  assert.doesNotMatch(scripts[0][1],dep,"Forbidden runtime capability "+dep);
 console.log("F4 HTML integrity:",hex(src),"bytes",Buffer.byteLength(src,"utf8"));
});
function parse(csv){
 const all=csv.trimEnd().split(/\r?\n/).map(line=>[...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)]
  .map(x=>x[1].replaceAll('""','"')));
 const columns=all.shift();return{columns,rows:all};
}
test("F4 independent: 256 distinct review cases (192 city + 64 metro), none auto-approved",()=>{
 const m=parse(fs.readFileSync("language-skills-hub/authoring/city-quest-f4/F4_256_variant_release_review_matrix.csv","utf8"));
 assert.deepEqual(m.columns,["language","cefr","mission","mode","linguistic_review",
  "pedagogical_review","accessibility_review","owner_approval","notes"]);
 assert.equal(m.rows.length,256);
 const counts={CITY:0,METRO:0},set=new Set();
 for(const row of m.rows){
  assert.equal(row.length,9);
  const [lang,level,mission,mode]=row;
  assert.ok(["en","es","de","fr"].includes(lang));
  assert.ok(["A1","A2","B1","B2","C1","C2"].includes(level));
  assert.ok(+mission>=1&&+mission<=8);
  assert.ok(["CITY","METRO"].includes(mode));
  if(mode==="METRO")assert.ok(!["A1","A2"].includes(level)&&+mission>=5);
  const key=[lang,level,mission,mode].join(":");
  assert.ok(!set.has(key),"Duplicate "+key);set.add(key);counts[mode]++;
  assert.deepEqual(row.slice(4,8),["PENDING","PENDING","PENDING","PENDING"]);
 }
 assert.deepEqual(counts,{CITY:192,METRO:64});
 // F3D listed only 192 *primary* variants. The 64 B1-C2 city fallbacks
 // are also executable and require independent manual acceptance.
});
