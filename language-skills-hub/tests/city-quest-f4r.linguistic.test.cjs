"use strict";
/* F4R P2 linguistic regression — independent, explicit register contract.
 * This checks authored strings and CEFR variation, not native-speaker approval.
 * The City French pack uses learner "vous"; Metro, PA, map tools and pedagogic
 * rail must never switch to learner "tu" during the same session.
 */
const {test}=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const City=require("../authoring/city-quest-f2/content-a.js");
require("../authoring/city-quest-f2/content-b.js");
const Metro=require("../authoring/city-quest-f2-1d/metro-language.js");
const PA=require("../authoring/city-quest-f3b/metro-public-address.js");
const Game=require("../authoring/city-quest-f2-1c/metro-game.js");
const root=path.resolve(__dirname,"..");
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
function flatten(value,prefix="root"){
 if(typeof value==="string")return[{path:prefix,text:value}];
 if(Array.isArray(value))return value.flatMap((x,i)=>flatten(x,prefix+"["+i+"]"));
 if(value&&typeof value==="object")return Object.entries(value).flatMap(([k,v])=>flatten(v,prefix+"."+k));
 return[];
}
const informalPronoun=/(?<!\p{L})(?:tu|ton|ta|tes|toi)(?!\p{L})/giu;
const metroInformalVerb=/(?<!\p{L})(?:choisis|prends|rejoins|trouve|explique|vérifie|avance|descends|autoévalue|formule|anticipe|détermine|reformule|adapte)(?!\p{L})/giu;
test("F4R FR learner register: all city UI, metro instruction/model, CEFR and PA text consistently use vous",()=>{
 const sections=[
  ["city UI",City.packs.fr.ui],
  ["metro",Metro.content.fr],
  ["public address",PA.dict.fr],
  ["CEFR PA",PA.levelPrompt.fr]
 ];
 for(const [section,data] of sections)for(const {path:p,text} of flatten(data,section)){
  assert.doesNotMatch(text,informalPronoun,p+": informal learner pronoun");
  if(section!=="city UI")assert.doesNotMatch(text,metroInformalVerb,p+": informal instruction form");
 }
});
test("F4R FR C1/C2 editorial spot-check: precise register, grammar, route and self-assessment",()=>{
 const fr=Metro.content.fr;
 assert.match(fr.header,/Explorez Riverton/);
 assert.match(fr.overview,/Choisissez.*Avancez.*autoévaluez votre/);
 assert.match(fr.goals[5],/Trouvez.*Utilisez/);
 assert.match(fr.goals[7],/Rejoignez Museum Quarter/);
 assert.match(fr.phases.enter,/Vous êtes.*Entrez/);
 assert.match(fr.phases.board,/Vous avez choisi.*Montez/);
 assert.match(fr.phases.speech,/Expliquez.*autoévaluez votre réponse/);
 assert.match(fr.levels.B1.extension,/Présentez.*vérifiez.*votre partenaire/);
 assert.match(fr.levels.B2.task,/Expliquez.*comparez-le/);
 assert.match(fr.levels.C1.task,/Anticipez.*indiquez/);
 assert.match(fr.levels.C2.task,/Évaluez.*restez précis.*adaptez votre/);
 assert.match(fr.models[5],/M1.*East Gardens.*quai 2.*Museum Quarter/);
 assert.match(fr.models[6],/Market Square.*Changez à University.*Harbour.*Stadium/);
 assert.match(fr.models[7],/M1.*Old Town.*Museum Quarter.*M2.*University.*M3/);
 assert.match(fr.models[8],/Marchez.*Market Square.*University.*Museum Quarter.*marchez vers le nord.*City Museum/);
 assert.equal(fr.levels.C1.criteria.length,3);
 assert.equal(fr.levels.C2.criteria.length,3);
 assert.match(fr.labels.verified,/sans enregistrement ni note automatique/);
 assert.match(PA.dict.fr.speaking[1],/Expliquez votre trajet/);
 assert.match(PA.dict.fr.boarding[1],/Éloignez-vous des portes/);
});
test("F4R no regressive changes to other languages or 64 metro CEFR authoring profiles",()=>{
 assert.deepEqual(Metro.languages,["en","es","de","fr"]);
 assert.deepEqual(Metro.levels,["B1","B2","C1","C2"]);
 assert.equal(Metro.validate(),true);
 assert.equal(PA.validate(),true);
 let combinations=0;
 for(const lang of Metro.languages)for(const level of Metro.levels)for(const station of Metro.missions){
  const copy=Metro.pack(lang,level,station);
  const model=Metro.model(lang,level,station);
  assert.ok(copy.titleMission&&copy.cefr.task&&model.length>40);
  assert.equal(copy.cefr.criteria.length,3);
  assert.ok(model.includes(station===5?"Museum Quarter":station===6?"Stadium":station===7?"University":"City Museum"));
  combinations++;
 }
 assert.equal(combinations,64);
 const game=Game.start(5);
 const pa=PA.pack("fr","C2",game);
 assert.equal(pa.locale,"fr");
 assert.match(pa.focus,/Proposez/);
 assert.doesNotMatch(pa.body,informalPronoun);
});
test("F4R French gallery and map inspection remain formally addressed; audio is still a text simulation",()=>{
 const preview=read("konverzace/city-quest-f2/metro-preview.js");
 const f2=read("konverzace/city-quest-f2/f2.js");
 assert.match(preview,/heading:"Découvrez une autre façon de parcourir la ville\."/);
 assert.match(preview,/intro:"Explorez le réseau fictif et suivez/);
 assert.match(preview,/hint:"Consultez les stations sans déplacer le voyageur\./);
 assert.match(f2,/note:"Expliquez vos choix à l'oral\./);
 assert.doesNotMatch(PA.dict.fr.marker,/AUDIO|ENREGISTREMENT/);
 assert.match(PA.dict.fr.marker,/SIMULATION ÉCRITE/);
});
