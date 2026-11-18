'use strict';
// Plural is a scoped grammar-flashcards subtype, not part of the legacy shared Conversation engine.
// These checks add coverage; they do not replace or weaken the legacy 22-card regressions.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const catalog=JSON.parse(read('data/cards.json'));
const i18n=JSON.parse(read('data/catalog-i18n.json'));
const manifest=JSON.parse(read('version.json'));
const html=read('konverzace/plural/index.html');
const levels=['A1','A2','B1','B2','C1','C2'],langs=['de','es','fr'];
function literal(name){
 const match=html.match(new RegExp('const '+name+' = (\\{[\\s\\S]*?\\});\\n'));
 assert.ok(match,'Missing '+name);return JSON.parse(match[1]);
}
test('plural exception is explicit and limited',()=>{
 const e=catalog.entries.filter(e=>e.id==='cl-plural');
 assert.equal(e.length,1);
 assert.equal(e[0].cardType,'grammar-flashcards');
 assert.equal(e[0].skill,'konverzace');
 assert.deepEqual(e[0].languages,langs);assert.deepEqual(e[0].levels,levels);
 assert.equal(e[0].relative,'konverzace/plural/index.html');
 assert.ok(catalog.entries.every(e=>e.id==='cl-plural'||e.cardType!=='grammar-flashcards'));
 assert.equal(catalog.gradedTestsEnabled,false);
});
test('catalog, localizations, manifest and card hash agree',()=>{
 assert.equal(catalog.entries.length,Object.keys(i18n.entries).length);
 assert.equal(catalog.entries.length,manifest.topicCount);
 assert.equal(manifest.variantCount,catalog.entries.reduce((n,e)=>n+e.languages.length*e.levels.length,0));
 for(const e of catalog.entries){
  assert.deepEqual(Object.keys(i18n.entries[e.id]||{}).sort(),['cs',...e.languages].sort(),e.id);
 }
 assert.equal(crypto.createHash('sha256').update(html).digest('hex'),manifest.contentHashes['cl-plural']);
});
test('flashcard engine is independent; all 144 stations have 10+3 items',()=>{
 const content=literal('CONTENT');assert.deepEqual(Object.keys(content).sort(),langs);
 let stations=0,items=0,advanced=0;
 for(const lang of langs){
  assert.deepEqual(Object.keys(content[lang].levels),levels);
  for(const lev of levels)for(const st of content[lang].levels[lev].stations){
   assert.equal(st.cards.length,10);assert.equal(st.extra.length,3);
   assert.ok(st.extra.every(c=>c.length===5&&c[4].length>20));
   if(['B1','B2','C1','C2'].includes(lev)){assert.ok(st.grammarTask?.length>15);advanced++;}
   stations++;items+=13;
  }
 }
 assert.equal(stations,144);assert.equal(items,1872);assert.equal(advanced,96);
});
test('CSP and existing LSH bridge/lock contract',()=>{
 assert.match(html,/data-lsh-topic-id="cl-plural"/);
 for(const id of ['languageSelect','levelSwitch','lookupPopover','vocabGrid'])
  assert.match(html,new RegExp('id="'+id+'"'));
 const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 assert.equal(inline.length,1);
 const hash=crypto.createHash('sha256').update(inline[0][1]).digest('base64');
 assert.ok(html.includes("'sha256-"+hash+"'"));assert.match(html,/connect-src 'none'/);
 for(const src of ['v2/lock.js','v3/model.js','v3/store.js','v3/card-bridge.js'])
  assert.ok(html.includes('../../assets/lsh/'+src),src);
});
test('shared vocabulary saves a singular term and leaves plural visually separate',()=>{
 assert.match(html,/make\('b','',singular\)/);
 assert.match(html,/make\('div','plural-form',`→ \$\{plural\}`\)/);
 const g=literal('CZ_GLOSSARY');
 for(const lang of langs){
  assert.ok(Object.keys(g.recommended[lang]).length>=400);
  assert.ok(Object.keys(g.recommended[lang]).every(term=>!term.includes('→')));
 }
 assert.equal(g.recommended.de['der vater'],'otec');
 assert.equal(g.recommended.es['el padre'],'otec');
 assert.equal(g.recommended.fr['le père'],'otec');
 assert.equal(g.words.fr['mères'],'matky');
});

test('V6 all 288 EXTRA editorial notes and 96 grammar tasks match exact authoring ledgers',()=>{
 const content=literal('CONTENT');
 const authoring='authoring/plural/';
 function rows(file){return read(authoring+file).trimEnd().split('\n').map(line=>{
  const i=line.indexOf('\t');
  assert.ok(i>0,'Missing tab in '+file);
  return [line.slice(0,i),line.slice(i+1)];
 });}
 let count=0;
 for(const lang of ['es','fr']){
  const seen=new Set();
  for(const [id,note] of rows('notes_'+lang+'_v6.tsv')){
   assert.ok(!seen.has(id),'Duplicate EXTRA '+id);seen.add(id);
   const m=id.match(/^(ES|FR)-(A1|A2|B1|B2|C1|C2)-S(0[1-8])-EXTRA-(0[1-3])$/);
   assert.ok(m,'Invalid EXTRA id '+id);
   assert.equal(content[lang].levels[m[2]].stations[+m[3]-1].extra[+m[4]-1][4],note,id);
   assert.ok(note.length>=30,id+' note too short');count++;
  }
  assert.equal(seen.size,144);
 }
 assert.equal(count,288);
 const seen=new Set();
 for(const [id,task] of rows('tasks_v6.tsv')){
  assert.ok(!seen.has(id),'Duplicate task '+id);seen.add(id);
  const m=id.match(/^(ES|FR|DE)-(B1|B2|C1|C2)-S(0[1-8])$/);
  assert.ok(m,'Invalid task id '+id);
  assert.equal(content[m[1].toLowerCase()].levels[m[2]].stations[+m[3]-1].grammarTask,task,id);
  assert.ok(task.length>60,id+' grammar task too short');
 }
 assert.equal(seen.size,96);
 const es=content.es.levels,fr=content.fr.levels;
 assert.match(es.A2.stations[4].extra[1][4],/pasa de aguda/);
 assert.equal(es.A1.stations[2].extra[2][1],'los arroces');
 assert.doesNotMatch(fr.C1.stations[0].extra[2][4],/bonus/);
 assert.doesNotMatch(html,/sigue recayendo en la penúltima|le bonus sert/);
 assert.equal(fr.A1.stations[2].extra[2][0],'le pois');
 assert.equal(es.A2.stations[7].extra[2][0],'la afición');
 assert.match(fr.C1.stations[0].extra[0][2],/zeť/);
 for(const lang of ['es','fr'])for(const lev of levels)for(const st of content[lang].levels[lev].stations){
  if(lang==='es'&&st.main.includes('Debatid'))assert.doesNotMatch(st.main,/Usa al menos/);
  if(lang==='fr'&&st.main.includes('Débattez'))assert.doesNotMatch(st.main,/Utilise au moins/);
 }
});
