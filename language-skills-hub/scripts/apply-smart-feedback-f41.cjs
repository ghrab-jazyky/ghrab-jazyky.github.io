#!/usr/bin/env node
'use strict';
// F4.1: exact review-driven static feedback edits; source DATA untouched.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash,webcrypto}=require('node:crypto');
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const root=path.resolve(__dirname,'..'),repo=path.dirname(root),core=require('../self-check/reading/reading-core.js');
const BASE='c8d3fbf855bbd387c4589b7536501b727b1e47c7',OLD_SHA='3661b936059d812991fd1ee0b6662d9e817ae74ddd643a81807eaca4c7106bf8',OLD_BLOB='bc02c45a471db70a186088015a095318bb72b191';
const sha=s=>createHash('sha256').update(s).digest('hex'),blob=s=>createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
const read=p=>fs.readFileSync(path.join(repo,p),'utf8'),write=(p,s)=>{fs.mkdirSync(path.dirname(path.join(repo,p)),{recursive:true});fs.writeFileSync(path.join(repo,p),s)};
const prefix='language-skills-hub/',card=prefix+'cteni/asteroids/index.html';
const html=read(card),data=core.parseReadingData(html),bank=core.parseSmartFeedback(html),original=structuredClone(bank);
assert.equal(sha(html),OLD_SHA);assert.equal(blob(html),OLD_BLOB);
const marker='<script type="application/json" id="lsh-smart-feedback-asteroids-v1">';
const embed=b=>marker+JSON.stringify(b).replace(/</g,'\\u003c')+'</script>\n';
assert.equal(html.split(embed(original)).length,2);
assert.equal(sha(html.replace(embed(original),'')),'59167c05eb80b492300b368fc0a1f45f19c1af6631d4a19c560dae98e0d45bac');
const changes=[],lang=['en','es','de','fr'],variants={};
for(const l of core.LANGUAGES)for(const level of core.LEVELS)variants[l+'/'+level]=core.variantFromData(data,l,level);
const reason={
 D01:'Remove non-existent road metaphor in DE/A2',D02:'Do not attribute object size to C1 source',
 D04:'Distinguish outer Solar System from asteroid belt',D05:'Supply direct evidence of monitoring',
 D06:'Complete media criticism',D07:'Retain negation and antecedent',D08:'Contextualize proportionate decisions',
 D09:'Include thermal radiation explanation',D10:'Restore mandatory independent observation',
 D11:'Use actual tampoco es ... ni syntax',D12:'Do not claim prevention is expensive',
 D13:'Locate noun antecedent rather than grammatical subject',D14:'Remove repeated adjective',
 D15:'Consistent singular informal imperative',D16:'Name subject of learning in source evidence',
 D17:'Resolve pronoun It with Ceres',D18:'Identify overgeneralization, not grammatical negation',
 D19:'Use contextual substitution instead of sound similarity in German',
 D20:'Clarify resource competition and prevention evidence',D21:'Limit inference to noncollision target and no universal guarantee',
 D23:'Use exact German lexical anchor',D24:'Identify concrete sentences for A1'
};
function edit(group,l,level,suffix,fn){
 const variant=l+'/'+level,id=l+'-'+level.toLowerCase()+'-'+suffix,v=variants[variant],f=bank.variants[variant].questions[id],q=v.questions.find(x=>x.id===id);
 assert.ok(f&&q,id);const old=structuredClone(f);fn(f,v,q);assert.notDeepEqual(f,old,group+' '+id);
 assert.equal(f.correctIndex,old.correctIndex);assert.deepEqual(Object.keys(f.distractors),Object.keys(old.distractors));
 changes.push({group,variant,id,reason:reason[group],old,new:structuredClone(f)});
}
function full(v,p,needle){
 const s=v.paragraphs[p];assert.equal(s.split(needle).length,2,needle);
 const at=s.indexOf(needle),start=s.lastIndexOf('. ',at)+2,from=start===1?0:start;
 const stop=s.indexOf('. ',at+needle.length);
 const text=s.slice(from,stop===-1?s.length:stop+1);
 assert.ok(text.includes(needle)&&text.length<=900&&text.trim()===text,text);
 return {p,text};
}
edit('D01','de','A2','detail-3',f=>{
 f.distractors[2].whyWrong='Text říká, že kameny nejsou natěsnané vedle sebe a je mezi nimi hodně prázdného prostoru. O skutečných silnicích se nezmiňuje.';
 f.distractors[2].tip='Najdi větu se slovem zwischen a ověř, co se podle ní mezi kameny nachází.';
});
for(const [l,i] of [['en',0],['es',2],['de',2],['fr',0]])edit('D02',l,'C1','structure-1',f=>{
 f.distractors[i].whyWrong='Předchozí text řeší technické podmínky odklonu, ale následující odstavec porovnává méně nápadné nezbytné úkoly s mediálně atraktivními záběry. Věta o velikosti by tuto myšlenku nerozvíjela.';
});
edit('D04','es','A1','scan-2',f=>{
 f.distractors[2].whyWrong='Možnost označuje vnější sluneční soustavu. Text ale hledané místo mezi Marsem a Jupiterem nazývá cinturón de asteroides, tedy pás asteroidů.';
 f.distractors[2].tip='Ověř celý název místa, nejen slovo sistema.';
});
const monitor={en:'Scientists use telescopes to find them',es:'Los científicos utilizan telescopios',de:'Wissenschaftler entdecken sie mit Teleskopen',fr:'Les scientifiques utilisent des télescopes'};
for(const l of lang)edit('D05',l,'A2','gist-2',(f,v)=>{f.evidence.unshift(full(v,1,monitor[l]));});
for(const [l,i,needle] of [['es',1,'los medios de comunicación suelen reducir esta diferencia'],['de',0,'In Nachrichtenmeldungen wird dieser Unterschied häufig']])edit('D06',l,'C1','gist-2',(f,v)=>{f.evidence[i]=full(v,0,needle);});
edit('D07','en','C1','structure-3',(f,v)=>{f.evidence[0]=full(v,0,"The familiar label 'near-Earth'");});
edit('D07','de','C1','structure-3',(f,v)=>{f.evidence=[full(v,0,'Die Bezeichnung „erdnah“'),full(v,0,'Diese Unterscheidung ist wichtig')];});
const risk={en:['Risk communication must avoid two opposite errors','Planetary defence becomes credible'],es:['La comunicación del riesgo debe evitar dos errores opuestos','La defensa planetaria resulta creíble'],de:['Gute Risikokommunikation muss zwei gegensätzliche Fehler vermeiden','Planetare Verteidigung wird nicht dadurch glaubwürdig'],fr:['Communiquer sur les risques suppose d’éviter deux erreurs opposées','La défense planétaire devient crédible']};
for(const l of lang)edit('D08',l,'C1','vocab-2',(f,v)=>{const p=f.evidence[0].p;f.evidence=risk[l].map(n=>full(v,p,n));});
for(const l of lang)edit('D09',l,'C1','vocab-3',(f,v)=>{f.evidence=[full(v,f.evidence[0].p,f.evidence[0].text)];});
for(const l of ['de','fr'])edit('D10',l,'C1','inference-2',f=>{f.correctWhy='Účinnost se musí potvrdit následnými nezávislými pozorováními skutečné změny dráhy. Samotný snímek nárazu dokládá kontakt, nikoli výsledek odklonu.';});
edit('D11','es','C2','scan-1',f=>{f.unanswered.tip='Najdi konstrukci tampoco es neutral ni completa: neutral stojí za tampoco es, completa za ni. Ověř obě negované vlastnosti.';});
edit('D12','de','C2','structure-3',f=>{f.distractors[3].whyWrong='Soutěž o prostředky na prevenci je dřívější politické téma. Darin odkazuje na schopnost měnit rozhodnutí při nových datech, nikoli na otázku financování.';});
for(const [l,i] of [['en',1],['es',0],['de',1],['fr',2]])edit('D13',l,'B1','structure-2',f=>{f.distractors[i].tip='Hledej dříve zmíněná podstatná jména. Dosaď každé za přivlastňovací výraz a ověř, které z nich může mít oběžnou dráhu.';});
for(const l of ['es','de','fr'])edit('D14',l,'B1','scan-3',f=>{f.correctWhy=f.correctWhy.replace('malá malá družice','malá družice');});
for(const l of ['es','de','fr'])edit('D15',l,'C1','structure-3',f=>{f.unanswered.tip=f.unanswered.tip.replace('určete','urči');});
const photos={en:'The students looked at photos of asteroids',es:'Los alumnos miraron fotografías de asteroides',de:'Die Schülerinnen und Schüler sahen Fotos von Asteroiden an',fr:'Les élèves ont regardé des photos d’astéroïdes'};
for(const l of lang)edit('D16',l,'A2','gist-1',(f,v)=>{f.evidence.splice(1,0,full(v,0,photos[l]));});
edit('D17','en','A1','scan-2',(f,v)=>{f.evidence=[{p:2,text:'The biggest asteroid is called Ceres. It is almost one thousand kilometres wide.'}];assert.ok(v.paragraphs[2].includes(f.evidence[0].text));});
for(const l of lang)edit('D18',l,'C2','critical-1',f=>{f.unanswered.tip='Označ si výraz nad rámec důkazu a vyhledej tvrzení, které nepodloženě zobecňuje jeden experiment.';});
edit('D19','de','C1','vocab-3',f=>{f.distractors[2].tip='Dosaď význam do věty o vztahu dvou metod. Může přístroj druhý přístroj pochválit, nebo ho doplňuje o další schopnost?';});
const invest={en:'It would be irresponsible to promise absolute safety',es:'Sería irresponsable prometer seguridad absoluta',de:'Absolute Sicherheit zu versprechen wäre unverantwortlich',fr:'Promettre une sécurité absolue serait irresponsable'};
for(const l of lang)edit('D20',l,'C2','structure-1',(f,v)=>{
 f.correctWhy='Doplněná věta zavádí politické dilema: prostředky na prevenci vzácných katastrof soupeří s aktuálními potřebami a přínos prevence je málo viditelný. Následující věty rozvíjejí odpovědné investice a důvěru.';
 const ev=full(v,f.evidence[0].p,invest[l]);if(l==='de')f.evidence.push(ev);else f.evidence[1]=ev;
});
const dart={en:['inference-3',3,'The technique was tested on an asteroid','The experiment demonstrated that a spacecraft could alter'],es:['inference-2',2,'Además, DART se probó','El experimento mostró que una nave puede modificar'],de:['inference-2',2,'DART traf ein Objekt','Der Test zeigte jedoch nicht'],fr:['inference-2',2,'Le test DART a porté','Le test a prouvé qu’une sonde pouvait modifier']};
for(const l of lang)edit('D21',l,'B2',dart[l][0],(f,v)=>{
 const [,p,first,second]=dart[l];
 f.correctWhy='Zkouška proběhla na cíli, který nebyl na kolizní dráze se Zemí; nešlo o odvracení skutečné hrozby. Výsledek proto nedokládá účinnost za všech podmínek reálného zásahu.';
 f.evidence=[full(v,p,first),full(v,p,second)];
 if(l==='es')f.distractors[2].whyWrong='Z experimentu na cíli mimo kolizní dráhu nelze vyvodit, že všechny další mise budou mířit pouze na nebezpečná tělesa. Článek takový plán neuvádí.';
 if(l==='de'||l==='fr')f.distractors[l==='de'?0:1].tip='Nezaměň cíl mimo kolizní dráhu za předpovězenou hrozbu.';
});
edit('D23','de','C2','matching-1',f=>{f.unanswered.tip='Vyhledej spojení procentní hodnoty, předpokladů a zdánlivé přesnosti (Präzision).';});
for(const l of lang)edit('D24',l,'A1','gist-2',f=>{f.unanswered.tip='Najdi otázku na srážku se Zemí a potom větu, která vysvětluje, proč vědci sledují oblohu.';});
assert.equal(changes.length,59);assert.equal(new Set(changes.map(c=>c.id)).size,57);assert.equal(new Set(changes.map(c=>c.variant)).size,24);assert.equal(new Set(changes.map(c=>c.group)).size,22);
const pending=[
 {group:'D03',severity:'P0',status:'PENDING_OWNER_SOURCE_APPROVAL',ids:['es-c2-critical-3','de-c2-critical-3','fr-c2-critical-3'],proposal:{es:'Según el autor, ¿qué condición adicional es decisiva para que una desviación sea eficaz, más allá de acertar en el asteroide?',de:'Welche zusätzliche Voraussetzung ist laut Text für eine wirksame Ablenkung entscheidend, über das bloße Treffen des Asteroiden hinaus?',fr:'Selon le texte, quelle condition supplémentaire est décisive pour une déviation efficace, au-delà de la capacité à atteindre l’astéroïde ?'},note:'Current key best supported, but another option may be interpreted as necessary. Do not silently change DATA or claim the item is resolved.'},
 {group:'D22',severity:'P2',status:'SOURCE_NOTE_PENDING_OWNER_APPROVAL',ids:['es-b2-inference-3','de-b2-inference-3','fr-b2-inference-3'],note:'Source options use stronger frequency than text; optional separate source revision. Current keys and feedback preserved.'}
];
const next=html.replace(embed(original),embed(bank)),newSha=sha(next),newBlob=blob(next);
assert.notEqual(newSha,OLD_SHA);
assert.deepEqual(core.parseReadingData(next),data);
assert.deepEqual(core.parseSmartFeedback(next),bank);
assert.equal(next.replace(embed(bank),''),html.replace(embed(original),''));
function one(s,a,b){assert.equal(s.split(a).length,2,a);return s.replace(a,b);}
async function run(){
 let n=0,distractors=0,citations=0;
 for(const [key,v] of Object.entries(variants)){
  const [l,level]=key.split('/'),valid=await core.validateSmartFeedback(next,'rl-asteroids',l,level,v),old=original.variants[key];
  assert.equal(valid.sourceFingerprint,old.sourceFingerprint);
  for(const q of v.questions){
   const f=valid.questions[q.id],o=old.questions[q.id];assert.equal(f.correctIndex,o.correctIndex);assert.deepEqual(Object.keys(f.distractors),Object.keys(o.distractors));
   assert.equal(new Set(Object.values(f.distractors).map(x=>x.whyWrong)).size,Object.keys(f.distractors).length,q.id);
   n++;distractors+=Object.keys(f.distractors).length;citations+=f.evidence.length;
  }
 }
 assert.equal(n,360);assert.equal(distractors,969);
 const audit={baseline:BASE,oldCardSha256:OLD_SHA,oldCardBlob:OLD_BLOB,cardSha256:newSha,cardBlob:newBlob,reviewType:'F4.1 implementation-team corrective review; not external sign-off',changes,pending,counts:{variants:24,questions:n,distractors,citations,edits:59,editedQuestions:57,groups:22}};
 const files=new Map([[card,next]]);
 for(const [key,v] of Object.entries(bank.variants)){
  const [l,level]=key.split('/'),p=prefix+(key==='en/B2'?'docs/smart-feedback-asteroids-f1/en-B2.json':'docs/smart-feedback-asteroids-f2/'+l+'-'+level+'.json');
  const raw=read(p),o=JSON.parse(raw);assert.equal(raw,JSON.stringify(o,null,2)+'\n');
  if(key==='en/B2'){assert.deepEqual(o.variants[key],original.variants[key]);o.variants[key]=v;files.set(p,JSON.stringify(o,null,2)+'\n');}
  else {assert.deepEqual(o,original.variants[key]);files.set(p,JSON.stringify(v,null,2)+'\n');}
 }
 const version=prefix+'version.json';files.set(version,one(read(version),OLD_SHA,newSha));
 for(const p of [prefix+'tests/city-quest-d3-integrity.test.cjs','tools/build-lsh-pages-preview.cjs']){
  let s=one(one(read(p),OLD_SHA,newSha),OLD_BLOB,newBlob);
  if(p.startsWith('tools/'))s=one(s,"sourceCommit:'5809a6c3f35bbedde852295f1c6508888ed37f0c',","sourceCommit:'5809a6c3f35bbedde852295f1c6508888ed37f0c',didacticRevisionBase:'"+BASE+"',cardRevision:'F4.1',");
  files.set(p,s);
 }
 const dir=prefix+'docs/smart-feedback-asteroids-f41/';
 files.set(dir+'REVIEW_CHANGES.json',JSON.stringify(audit,null,2)+'\n');
 files.set(dir+'DECISION.md','# F4.1 corrective review (NO DEPLOY)\n\nAudited predecessor: '+BASE+'\n\nCard SHA-256: '+newSha+'\n\n22 feedback finding groups, 59 edits, 57 unique questions, all 24 variants. Source DATA, answer indices, scores, fingerprints and runtime unchanged. Full old/new records in REVIEW_CHANGES.json. D03 P0 requires owner source decision, D22 P2 source-note deferred. External independent sign-off and physical device evidence remain PENDING. No release approval. Re-run exact-head F4 after commit.\n');
 const p=prefix+'tests/smart-feedback-asteroids-f3.test.cjs';
 let historic=one(read(p),"const current=fs.readFileSync(path.join(repo,pathName),'utf8');",
  "const latest=fs.readFileSync(path.join(repo,pathName),'utf8');\nconst current=execFileSync('git',['show','"+BASE+":'+pathName],{cwd:repo,maxBuffer:6000000}).toString('utf8');");
 historic+="\ntest('F4.1 exhaustive corrective ledger, no unlisted change or source drift',()=>{\n const a=JSON.parse(fs.readFileSync(path.join(root,'docs/smart-feedback-asteroids-f41/REVIEW_CHANGES.json'),'utf8'));\n assert.equal(a.baseline,'c8d3fbf855bbd387c4589b7536501b727b1e47c7');\n assert.equal(sha(current),a.oldCardSha256);assert.equal(sha(latest),a.cardSha256);\n assert.equal(createHash('sha1').update('blob '+Buffer.byteLength(latest)+'\\0').update(latest).digest('hex'),a.cardBlob);\n const expected=core.parseSmartFeedback(current),data=core.parseReadingData(latest);\n assert.deepEqual(data,core.parseReadingData(current));\n assert.equal(a.changes.length,59);assert.equal(new Set(a.changes.map(e=>e.id)).size,57);\n assert.deepEqual([...new Set(a.changes.map(e=>e.group))].sort(),['D01','D02','D04','D05','D06','D07','D08','D09','D10','D11','D12','D13','D14','D15','D16','D17','D18','D19','D20','D21','D23','D24']);\n for(const e of a.changes){\n  assert.deepEqual(expected.variants[e.variant].questions[e.id],e.old,e.id);\n  assert.notDeepEqual(e.old,e.new,e.id);assert.equal(e.old.correctIndex,e.new.correctIndex);\n  assert.deepEqual(Object.keys(e.old.distractors),Object.keys(e.new.distractors));assert.ok(e.reason.length>10);\n  expected.variants[e.variant].questions[e.id]=e.new;\n }\n assert.deepEqual(expected,core.parseSmartFeedback(latest));\n for(const e of a.pending)for(const id of e.ids)assert.ok(!a.changes.some(c=>c.id===id),id+' source decision pending');\n});\n";files.set(p,historic);
 for(const [p,s] of files)write(p,s);
 console.log('PASS F4.1: '+JSON.stringify(audit.counts)+'; old DATA byte-identical; D03/D22 source decisions pending; SHA256 '+newSha);
}
run().catch(e=>{console.error(e);process.exitCode=1;});
