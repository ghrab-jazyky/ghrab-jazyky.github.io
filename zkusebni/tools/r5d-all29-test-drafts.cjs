#!/usr/bin/env node
/* LSH R5D: produce 54 unapproved, SHORT test-form previews from exactly
 * three SHA-pinned references. No answer keys, marks, rubric, student names,
 * saving, network media, or deployment. Only write OUTSIDE this repository.
 * Example: node zkusebni/tools/r5d-test-drafts.cjs /tmp/lsh-r5d-preview
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const REPO=path.resolve(ROOT,'..');
const arg=process.argv[2];
if(!arg)throw Error('Provide an external output directory. Never generate into public /zkusebni.');
const OUT=path.resolve(arg);
if(OUT===REPO||OUT.startsWith(REPO+path.sep))throw Error('R5D safety: output inside Git worktree forbidden');
const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'data/r5d-test-draft-plan.json'),'utf8'));
assert.equal(cfg.schemaVersion,1);
assert.equal(cfg.stage,'R5D_TEST_DRAFTS');
assert.equal(cfg.status,'REVIEW_ONLY_NOT_READY');
for(const f of ['teacherApproval','approvedForRelease','published','automaticScoring','collectStudentIdentity','linkedInCatalog'])
 assert.equal(cfg[f],false,'Unsafe R5D release/assessment flag: '+f);
assert.equal(cfg.variantCount,54);assert.equal(cfg.topicCount,3);
const pinPlan=JSON.parse(fs.readFileSync(path.join(ROOT,'data/r5d-all29-source-pins.json'),'utf8'));
assert.equal(pinPlan.schemaVersion,1);assert.equal(pinPlan.stage,'R5D_ALL29_DRAFTS');
assert.equal(pinPlan.status,'NOT_READY_UNAPPROVED');
assert.equal(pinPlan.topics,29);assert.equal(pinPlan.totalVariants,642);
for(const f of ['teacherApproval','approvedForRelease','published','automaticScoring','collectStudentIdentity','catalogLinked'])assert.equal(pinPlan[f],false);
assert.equal(pinPlan.entries.length,29);
const levels=['A1','A2','B1','B2','C1','C2'];
const sha256=v=>crypto.createHash('sha256').update(v).digest('hex');
const gitBlob=b=>crypto.createHash('sha1').update(Buffer.concat([
 Buffer.from('blob '+b.length+'\0','utf8'),b])).digest('hex');
const catalogBuffer=fs.readFileSync(path.join(ROOT,'data/reference-pilots.json'));
assert.equal(gitBlob(catalogBuffer),pinPlan.sourceCatalogGitBlob,'R5D pinned catalog changed');
const catalog=JSON.parse(catalogBuffer.toString('utf8'));
assert.equal(catalog.approvedForTeaching,false);
assert.equal(catalog.entries.length,29);
assert.deepEqual(pinPlan.entries.map(x=>x.topicId),catalog.entries.map(x=>x.id),'R5D inventory diverged from catalog');
for(const [i,e] of pinPlan.entries.entries()){
 assert.equal(e.skill,catalog.entries[i].skill);
 assert.equal(e.path,catalog.entries[i].studentPath+'index.html');
 assert.deepEqual(e.languages,catalog.entries[i].languages);
 assert.deepEqual(e.levels,catalog.entries[i].levels);
 assert.ok(e.path.endsWith('/index.html')&&!e.path.includes('..'),'Unsafe source path');
 assert.ok(/^[a-f0-9]{40}$/.test(e.gitBlob));
 assert.ok(/^(cl|rl|ll)-[a-z0-9-]+$/.test(e.topicId));
}
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);
const L={
 en:{warning:'DRAFT ONLY – NOT APPROVED FOR ASSESSMENT',test:'Short test-form prototype',
  note:'Teacher review required. No marks, automatic checking or submission. This is not a secure exam.',
  reading:'Read the text and select the best answer.',listening:'The teacher plays the recording. Media and replay conditions have not been approved.',
  speaking:'Discuss the questions. Your teacher observes; there is no automatic score.',
  first:'First Listening · main message',second:'Second Listening · details',
  third:'Third Listening · written evidence and sequence',reorder:'Number the events in the order you hear them.',
  print:'For a printable worksheet, use the browser Print command.',written:'Write your response.',target:'CEFR level'},
 es:{warning:'BORRADOR – NO APROBADO PARA EVALUACIÓN',test:'Prototipo de prueba breve',
  note:'Requiere revisión docente. Sin nota, corrección automática ni envío. No es un examen seguro.',
  reading:'Lee el texto y selecciona la mejor respuesta.',listening:'El docente reproduce el audio. El acceso y las repeticiones no están aprobados.',
  speaking:'Habla de las preguntas. Evalúa el docente; no hay nota automática.',
  first:'Primera escucha · idea general',second:'Segunda escucha · detalles',
  third:'Tercera escucha · evidencia y orden',reorder:'Numera los momentos en el orden en que los escuchas.',
  print:'Para imprimir, usa la función Imprimir del navegador.',written:'Escribe tu respuesta.',target:'Nivel MCER'},
 de:{warning:'ENTWURF – NICHT ALS PRÜFUNG FREIGEGEBEN',test:'Entwurf einer kürzeren Prüfung',
  note:'Lehrkraft muss prüfen. Keine Note, automatische Bewertung oder Übermittlung. Keine sichere Prüfung.',
  reading:'Lies den Text und wähle die beste Antwort.',listening:'Die Lehrkraft spielt das Video ab. Zugang und Wiederholungen sind nicht freigegeben.',
  speaking:'Sprecht über die Fragen. Die Lehrkraft beurteilt; keine automatische Note.',
  first:'Erstes Hören · Hauptaussage',second:'Zweites Hören · Einzelheiten',
  third:'Drittes Hören · Belege und Reihenfolge',reorder:'Nummeriere die Aussagen in der richtigen Hörreihenfolge.',
  print:'Zum Drucken nutze die Druckfunktion des Browsers.',written:'Schreibe deine Antwort.',target:'GER-Niveau'},
 fr:{warning:'BROUILLON – NON VALIDÉ POUR UNE ÉVALUATION',test:'Prototype de test raccourci',
  note:'Validation de l’enseignant nécessaire. Sans note, correction automatique ni envoi. Pas un examen sécurisé.',
  reading:'Lis le texte et choisis la meilleure réponse.',listening:'Le professeur lance la vidéo. L’accès et les répétitions ne sont pas validés.',
  speaking:'Discute des questions. Le professeur évalue ; aucune note automatique.',
  first:'Première écoute · idée générale',second:'Deuxième écoute · détails',
  third:'Troisième écoute · preuves et ordre',reorder:'Numérote les moments dans l’ordre où tu les entends.',
  print:'Pour imprimer, utilise la fonction Imprimer du navigateur.',written:'Écris ta réponse.',target:'Niveau CECR'}
};
const CSS=[
 ':root{color-scheme:light;--ink:#1c2942;--muted:#52617b;--line:#dce3ed;--bg:#f3f6fa;--card:#fff;--accent:#16487d}',
 '*{box-sizing:border-box}html,body{margin:0;min-width:0;overflow-x:hidden}',
 'body{font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg)}',
 'main{max-width:850px;margin:auto;padding:clamp(14px,3vw,36px)}',
 '.warning{padding:14px 16px;border:2px solid #995321;border-radius:12px;background:#fff4e7;font-weight:800}',
 'h1{font-size:clamp(1.45rem,4vw,2.2rem);line-height:1.15}h2{font-size:1.2rem}',
 '.meta{color:var(--muted);font-weight:600}',
 'article,.reading,.task{padding:18px;margin:16px 0;background:var(--card);border:1px solid var(--line);border-radius:14px;break-inside:avoid}',
 '.reading p{margin:12px 0}fieldset{min-width:0;border:0;margin:0;padding:0}legend{font-weight:750;padding:0 0 10px}',
 '.options{display:grid;gap:9px}.options label{display:flex;gap:10px;align-items:start;border:1px solid var(--line);border-radius:10px;padding:10px;cursor:pointer}',
 'input[type=radio]{flex:none;min-width:18px;min-height:18px;margin-top:3px;accent-color:var(--accent)}',
 '.number{width:60px;font:inherit;padding:9px;border:1px solid var(--line);border-radius:8px}',
 'textarea{width:100%;min-height:100px;resize:vertical;font:inherit;padding:10px;border:1px solid var(--line);border-radius:8px}',
 '.footer{font-size:.85rem;color:var(--muted);margin-top:30px}',
 'a{color:var(--accent)}:focus-visible{outline:3px solid #c07821;outline-offset:3px}',
 '@media(max-width:480px){article,.reading,.task{padding:13px}main{padding:12px}}',
 '@media print{body{background:white}main{max-width:none;padding:0}.warning{font-size:12px}article,.reading,.task{box-shadow:none;break-inside:avoid}textarea{min-height:80px}}'
].join('\n');
function htmlPage(lang,level,heading,subheading,body){
 const ui=L[lang];
 return '<!doctype html>\n<html lang="'+esc(lang)+'"><head><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+
  '<meta name="robots" content="noindex,nofollow">'+
  '<title>'+esc(heading)+' · R5D draft</title><style>'+CSS+'</style></head>'+
  '<body><main><p class="warning" role="note">'+esc(ui.warning)+'</p>'+
  '<header><p class="meta">R5D · '+esc(ui.test)+' · '+esc(ui.target)+' '+esc(level)+'</p>'+
  '<h1>'+esc(heading)+'</h1><p>'+esc(subheading)+'</p></header>'+
  body+'<p class="footer">'+esc(ui.note)+' '+esc(ui.print)+'</p></main></body></html>\n';
}
function group(question,choices,key){
 assert.ok(Array.isArray(choices)&&choices.length>=2);
 return '<fieldset class="task"><legend>'+esc(question)+'</legend><div class="options">'+
 choices.map((v,i)=>'<label><input type="radio" name="q-'+esc(key)+'" value="'+i+'">'+
 '<span>'+esc(v)+'</span></label>').join('')+'</div></fieldset>';
}
function dataFrom(buffer,marker,endMark,topic){
 const s=buffer.toString('utf8'),start=s.indexOf(marker);
 assert.ok(start>=0,topic+' data marker missing');
 const after=s.slice(start+marker.length);
 const end=after.indexOf(endMark);
 assert.ok(end>=0,topic+' end of data missing');
 return JSON.parse(after.slice(0,end));
}
function conversation(data,lang,level,cfg,title){
 const stations=data[lang].levels[level].stations;
 assert.equal(stations.length,8);
 const select=cfg.stationIndices;
 assert.deepEqual(select,[0,3,6]);
 const body=select.map((index,n)=>{
  const st=stations[index];
  assert.ok(st.main&&st.questions[cfg.additionalQuestionIndex]);
  return '<article><h2>'+esc((n+1)+'. '+st.title)+'</h2>'+
   '<p><strong>'+esc(st.main)+'</strong></p>'+
   '<p>'+esc(st.questions[cfg.additionalQuestionIndex])+'</p>'+
   '<p aria-label="Notes">_____________________________________________</p></article>';
 }).join('');
 return {html:htmlPage(lang,level,title+' · '+level,L[lang].speaking,body),
  taskIds:select.map(i=>'station-'+(i+1)+'-main-and-followup'),count:select.length};
}
function reading(data,lang,level,cfg){
 const d=data[lang][level];
 assert.ok(Array.isArray(d.paragraphs)&&d.paragraphs.length>=3);
 const tabs=['A1','A2'].includes(level)?cfg.lowerTabs:level==='B1'?cfg.b1Tabs:level==='C2'?cfg.c2Tabs:cfg.higherTabs;
 const used=new Map(),selected=[];
 for(const tab of tabs){
  const options=d.questions.filter(q=>q.tab===tab&&Array.isArray(q.choices)&&q.choices.length>=2);
  const n=used.get(tab)||0;
  assert.ok(options[n],lang+'/'+level+' cannot select '+tab+' #'+n);
  selected.push(options[n]);used.set(tab,n+1);
 }
 const count=['A1','A2'].includes(level)?cfg.shortLevelCount:cfg.longLevelCount;
 assert.equal(selected.length,count);
 assert.equal(new Set(selected.map(q=>q.id)).size,count);
 const body='<section class="reading"><h2>'+esc(d.title)+'</h2>'+
  d.paragraphs.map(p=>'<p>'+esc(p)+'</p>').join('')+'</section>'+
  '<h2>'+esc(L[lang].reading)+'</h2>'+
  selected.map((q,i)=>group((i+1)+'. '+q.q,q.choices,q.id)).join('');
 return {html:htmlPage(lang,level,d.title+' · '+level,L[lang].reading,body),
  taskIds:selected.map(q=>q.id),count};
}
function listening(data,lang,level,cfg,title){
 assert.equal(lang,'en');
 const d=data[level];
 for(const key of ['gist','detail','open','sequence'])assert.ok(Array.isArray(d[key]),key+' missing in '+level);
 assert.ok(d.gist.length>=cfg.gistCount&&d.detail.length>=cfg.detailCount&&d.open.length>=cfg.openCount);
 assert.ok(d.sequence.length>=cfg.sequenceMin);
 const gist=d.gist.slice(0,cfg.gistCount),detail=d.detail.slice(0,cfg.detailCount);
 // Never copy item.correct, item.why, facts.answer, or open.answer/criteria.
 // A one-step rotation deliberately prevents the canonical order appearing in UI.
 const sequence=d.sequence.slice(1).concat(d.sequence[0]);
 assert.notDeepEqual(sequence,d.sequence,'Sequence accidentally reveals order');
 const phase=(name,items,prefix)=>'<section><h2>'+esc(name)+'</h2>'+
  items.map((q,i)=>group((i+1)+'. '+q.title,q.options,prefix+'-'+i)).join('')+'</section>';
 const open=d.open[0];
 assert.ok(open.title);
 const order='<article><h2>'+esc(L.en.reorder)+'</h2>'+sequence.map((line,i)=>
  '<p><label><input class="number" type="number" min="1" max="'+sequence.length+
  '" aria-label="Position '+(i+1)+'"> '+esc(line)+'</label></p>').join('')+'</article>';
 const body='<p>'+esc(L.en.listening)+'</p>'+
  phase(L.en.first,gist,'gist')+phase(L.en.second,detail,'detail')+
  '<section><h2>'+esc(L.en.third)+'</h2><article><p><strong>'+esc(open.title)+'</strong></p>'+
  '<label>'+esc(L.en.written)+'<textarea aria-label="Written evidence"></textarea></label></article>'+
  order+'</section>';
 return {html:htmlPage('en',level,title+' · '+level,L.en.listening,body),
  taskIds:['gist-0','gist-1','detail-0','detail-1','written-0','sequence'],
  count:6};
}
fs.mkdirSync(OUT,{recursive:true});
const variants=[];
for(const entry of pinPlan.entries){
 const buffer=fs.readFileSync(path.join(ROOT,entry.path));
 assert.equal(gitBlob(buffer),entry.gitBlob,'Pinned catalog source changed '+entry.topicId);
 const originalSha256=sha256(buffer);
 const baseMeta=cfg.sources.find(x=>x.skill===entry.skill);
 assert.ok(baseMeta,'Missing skill-level teacher metadata');
 const marker=entry.skill==='konverzace'?'const CONTENT = ':'const DATA=';
 const endMark=entry.skill==='konverzace'?';\nconst ORDER =':entry.skill==='cteni'?';\n':' ;';
 const d=dataFrom(buffer,marker,entry.skill==='poslech'?';\nconst SOURCES=':endMark,entry.topicId);
 for(const lang of entry.languages)for(const level of levels){
  const result=entry.skill==='konverzace'?
   conversation(d,lang,level,cfg.pedagogy.conversation,entry.title):
   entry.skill==='cteni'?reading(d,lang,level,cfg.pedagogy.reading):
   listening(d,lang,level,cfg.pedagogy.listening,entry.title);
  assert.ok(!result.html.includes('<script'), 'R5D preview must be static');
  assert.ok(!/(?:localStorage|sessionStorage|indexedDB|fetch\(|<iframe|<form\b|name="studentName")/i.test(result.html));
  assert.ok(!/(?:\bcorrect\b\s*:|\banswer\b\s*:|\bexplanation\b\s*:|\bevidence\b\s*:)/.test(result.html));
  const relative='test-drafts/'+entry.skill+'/'+entry.topicId+'/'+lang+'/'+level+'.html';
  const target=path.join(OUT,relative);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,result.html,{encoding:'utf8',flag:'wx',mode:0o600});
  variants.push({topicId:entry.topicId,skill:entry.skill,language:lang,level,
   file:relative,sha256:sha256(result.html),sourceGitBlob:entry.gitBlob,sourceSha256:originalSha256,
   sourceKind:pinPlan.sourceCandidateType,
   taskIds:result.taskIds,taskCount:result.count,teacherApproval:false,
   automaticScoring:false,notesForTeacher:{
    targetLevel:level,targetGroup:baseMeta.targetGroup,estimatedDuration:baseMeta.durationEstimate,
    objective:cfg.pedagogy[entry.skill==='konverzace'?'conversation':entry.skill==='cteni'?'reading':'listening'].objective,
    weaker:cfg.pedagogy[entry.skill==='konverzace'?'conversation':entry.skill==='cteni'?'reading':'listening'].weaker,
    stronger:cfg.pedagogy[entry.skill==='konverzace'?'conversation':entry.skill==='cteni'?'reading':'listening'].stronger
   }});
 }
}
assert.equal(variants.length,642);
assert.deepEqual(Object.fromEntries(['konverzace','cteni','poslech'].map(x=>[x,variants.filter(v=>v.skill===x).length])),
 {konverzace:504,cteni:120,poslech:18});
assert.equal(new Set(variants.map(v=>v.file)).size,642);
const manifest={schemaVersion:1,stage:'R5D_ALL29_TEST_DRAFTS',state:'DRAFT_NOT_READY',
 source:'29_SHA1_PINNED_UNAPPROVED_CATALOG_STUDENT_SOURCES',
 sourceCatalogGitBlob:pinPlan.sourceCatalogGitBlob,
 totalVariants:642,topics:29,teacherApproval:false,published:false,gradePolicyApproved:false,
 noKeys:true,noStudentIdentity:true,variants};
fs.writeFileSync(path.join(OUT,'R5D_ALL29_DRAFT_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
const intro=[
 '# R5D – 642 izolovaných návrhů kratších testovacích zadání pro 29 témat',
 '',
 '**NEPOUŽÍVAT KE ZNÁMKOVÁNÍ. NENÍ SCHVÁLENO. NIC NENÍ NASAZENO.**',
 '',
 '- 504× Conversation (21 témat): tři z osmi původních stanovišť, vždy hlavní a jedna doplňující otázka, bez rubriky.',
 '- 120× Reading (5 témat): 5 otázek A1/A2, 6 otázek B1–C2, plný původní text, bez odpovědních klíčů.',
 '- 18× Listening (3 témata): dvě hlavní otázky, dvě detailní, jedna písemná a rekonstrukce v úmyslně zpřeházeném pořadí.',
 '- Zdrojově jsou použity současné neschválené katalogové studentské HTML; izolované opravy R7/R8 nejsou automaticky zahrnuty.',
 '- Žádné automatické bodování, známkování, osobní údaje, uložení, přenos odpovědí, externí média ani teacher keys.',
 '- Každý výstup má úroveň, doporučenou cílovou skupinu, orientační čas a pedagogické varianty v JSON manifestu.',
 '- Původní studentské soubory jsou ověřené Git blob SHA1 i SHA-256 a beze změn.',
 '',
 '## Povinné rozhodnutí před vydáním',
 'Schválit výběr otázek pro každou úroveň, konkrétní podmínky testu, povolené opory a počet přehrání; stanovit již existující nebo výslovně schválená hodnoticí kritéria a odevzdání. Zajistit fyzické UAT na školní síti. Teprve poté uvažovat o aktivaci tlačítka Testování.',
 '',
 'Všechny soubory vznikly mimo Git worktree. Pouze review podklady; nejsou připojeny k žádné katalogové položce.'
].join('\n')+'\n';
fs.writeFileSync(path.join(OUT,'README_R5D.md'),intro,{flag:'wx',mode:0o600});
const links=variants.map(v=>'<li><a href="'+esc(v.file)+'">'+esc(v.topicId+' · '+v.language.toUpperCase()+' '+v.level)+'</a></li>').join('');
fs.writeFileSync(path.join(OUT,'index.html'),htmlPage('en','A1','R5D · teacher-only draft preview index',
 'Not approved, not scored, not deployed. For review by a teacher only.',
 '<ul>'+links+'</ul>'),{flag:'wx',mode:0o600});
console.log('PASS R5D ALL29 642 review-only standalone HTML drafts (504 Conversation, 120 Reading, 18 Listening)');
console.log('PASS pinned catalog + 29 Git source blobs, SHA256 output, no keys/grades/student IDs, no repository writes');
console.log('R5D_REVIEW_OUTPUT '+OUT);
