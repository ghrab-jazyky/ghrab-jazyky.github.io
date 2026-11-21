"use strict";
/* F2.1E: preserve genuine wayfinding decisions. The problem statement must
 * not contain the answer to a task called "Find the Right Line".
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const L=require("../authoring/city-quest-f2-1d/metro-language.js");
const G=require("../authoring/city-quest-f2-1c/metro-game.js");
const M=require("../authoring/city-quest-f2-1b/metro-network.js");
test("The correct line and interchange are not given away in the problem statement",()=>{
 for(const lang of L.languages)for(const level of L.levels){
  const fifth=L.pack(lang,level,5),sixth=L.pack(lang,level,6),seventh=L.pack(lang,level,7);
  assert.doesNotMatch(fifth.goals[5],/\bM1\b/,"Station 05 should demand a map decision");
  assert.doesNotMatch(sixth.goals[6],/\bM2\b|\bM3\b|\bUniversity\b/,
   "Station 06 should demand choosing the connection");
  assert.doesNotMatch(sixth.pair[6],/\bM2\b|\bM3\b|\bUniversity\b/,
   "Pair partner should not have the interchange spoiled");
  assert.doesNotMatch(seventh.goals[7],/\bUniversity\b|\bM2\b|\bM3\b/,
   "Station 07 may reveal the closed M1 segment, not the alternative");
  assert.ok(seventh.goals[7].includes("Old Town")&&seventh.goals[7].includes("Museum Quarter"));
  for(const n of [5,6,7,8])assert.ok(L.model(lang,level,n).length>=40,
   "After solving, a target-language example is available in the self-check");
 }
 for(const [n,pattern] of [[5,/\bM1\b/],[6,/\bM2\b|\bM3\b|\bUniversity\b/],[7,/\bUniversity\b|\bM2\b|\bM3\b/]])
  assert.doesNotMatch(G.definitions[n].goal,pattern,"Canonical mission "+n+" should be spoiler-free");
});
test("Canonical routing remains strict after copy changes; notices reveal closure, not detour",()=>{
 assert.equal(G.validate(),true);
 const disruption=M.scenario("metro_07_b1");
 assert.ok(disruption.closedEdges.length>0);
 assert.equal(M.closed("old_town","museum_quarter","M1",disruption.closedEdges),true);
 for(const lang of L.languages){
  const c=L.pack(lang,"B1",7);
  assert.ok(c.phases.notice.includes("Old Town"));
  assert.ok(c.phases.notice.includes("Museum Quarter"));
  assert.ok(!c.phases.notice.includes("University"),
   "Service notice should not reveal the successful detour");
 }
});
