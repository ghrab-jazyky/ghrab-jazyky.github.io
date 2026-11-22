"use strict";
/* F3D acceptance matrix is a queue for HUMAN validation, not a claim that
 * 192 linguistic reviews already happened. This test proves its completeness.
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const csv=fs.readFileSync(path.resolve(__dirname,"../authoring/city-quest-f3d/F3D_192_variant_teacher_acceptance_matrix.csv"),"utf8");
const rows=csv.trimEnd().split(/\r?\n/).map(line=>
 [...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(x=>x[1].replaceAll('""','"')));
const header=rows.shift();
const expected=["language","cefr","mission","mission_type","scene_default_for_review",
 "teacher_linguistic","teacher_pedagogy","teacher_accessibility","owner_approval","notes"];
test("F3D manual acceptance matrix is exactly 192 unique four-language x six-CEFR x eight-mission entries",()=>{
 assert.deepEqual(header,expected);
 assert.equal(rows.length,192);
 const combo=new Set(),counts={CITY:0,METRO_PILOT:0};
 for(const row of rows){
  assert.equal(row.length,expected.length);
  const [lang,level,num,type,scene,...rest]=row,mission=Number(num);
  assert.ok(["en","es","de","fr"].includes(lang));
  assert.ok(["A1","A2","B1","B2","C1","C2"].includes(level));
  assert.ok(Number.isInteger(mission)&&mission>=1&&mission<=8);
  assert.ok(["explore","route","dialogue","guided","transit","repair","detour","quest"].includes(type));
  const shouldMetro=!["A1","A2"].includes(level)&&mission>=5;
  assert.equal(scene,shouldMetro?"METRO_PILOT":"CITY");
  assert.ok(!combo.has(lang+"-"+level+"-"+num),"Duplicate "+lang+"-"+level+"-"+num);
  combo.add(lang+"-"+level+"-"+num);counts[scene]++;
  for(const status of row.slice(5,9))
   assert.equal(status,"PENDING","No automated system may invent a completed human review.");
  assert.ok(!/student.name|email|phone|personal.info/i.test(row.join(",")));
 }
 assert.deepEqual(counts,{CITY:128,METRO_PILOT:64});
});
