"use strict";
/* F5C N03 P1: single stand-alone game card has a safe target, five localized
 * strings and a visible classification independent of Conversation Lab. */
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=(rel)=>fs.readFileSync(path.join(root,rel),"utf8");
const cards=JSON.parse(read("data/cards.json"));
const i18n=JSON.parse(read("data/catalog-i18n.json"));
test("City Quest has exactly one valid stand-alone interactive game card",()=>{
 assert.equal(cards.kind,"LSH_PUBLIC_PRACTICE_R17");
 const all=cards.entries.filter(e=>e.id==="cl-city-quest-f2");
 assert.equal(all.length,1,"Card ID must not collide with existing catalog");
 const c=all[0];
 assert.equal(c.skill,"konverzace","City Quest remains browsable under speaking topics");
 assert.equal(c.cardType,"interactive-language-game","Separate type badge is mandatory");
 assert.deepEqual(c.languages,["en","es","de","fr"]);
 assert.deepEqual(c.levels,["A1","A2","B1","B2","C1","C2"]);
 assert.equal(c.relative,"konverzace/city-quest-f2/index.html");
 assert.ok(fs.existsSync(path.join(root,c.relative)),"Link must resolve inside the LSH tree");
 const translated=i18n.entries[c.id];
 assert.deepEqual(Object.keys(translated).sort(),["cs","de","en","es","fr"]);
 for(const lang of ["cs","en","es","de","fr"]){
  assert.ok(translated[lang].title.length>8,lang+": card title missing");
  assert.ok(translated[lang].summary.length>40,lang+": card purpose missing");
 }
});
test("Game badge is actually rendered and localized in the hub and in the game",()=>{
 const js=read("assets/hub.js"),css=read("assets/hub.css"),html=read("konverzace/city-quest-f2/index.html");
 assert.match(js,/e\.cardType==="interactive-language-game"/);
 assert.match(js,/catalog-game-label/);
 for(const lang of ["cs","en","es","de","fr"])
  assert.match(js,new RegExp("\\b"+lang+":"));
 assert.match(css,/\.catalog-game-label/);
 assert.match(html,/id="cityQuestGameType"/);
 assert.match(html,/Interactive language game/);
});
