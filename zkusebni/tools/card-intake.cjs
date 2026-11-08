#!/usr/bin/env node
/* LSH card intake v1: public STUDENT HTML only, never teacher keys.
   Usage:
   node zkusebni/tools/card-intake.cjs --verify
   node zkusebni/tools/card-intake.cjs --self-test
   node zkusebni/tools/card-intake.cjs --batch ./incoming/cards.json
   node zkusebni/tools/card-intake.cjs --batch ./incoming/cards.json --apply
   node zkusebni/tools/card-intake.cjs --audit-export ./out/claude
*/
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const LEVELS=['A1','A2','B1','B2','C1','C2'];
const LANGS=['en','es','de','fr'];
const PREFIX={konverzace:'cl',cteni:'rl',poslech:'ll'};
const SKILLS=Object.keys(PREFIX);
const FILES={catalog:'data/reference-pilots.json',tracker:'data/unification-tracker.json',queue:'data/claude-audit-queue.json'};
const existing=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const load=p=>JSON.parse(existing(p));
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const blob=s=>{const b=Buffer.from(s,'utf8');return crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex')};
const fail=m=>{throw Error('LSH INTAKE: '+m)};
const within=(base,target)=>{const rel=path.relative(base,target);return rel&&!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)};
const ensure=(value,message)=>{if(!value)fail(message)};
const safeId=id=>typeof id==='string'&&/^(cl|rl|ll)-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
const safePath=s=>typeof s==='string'&&/^[a-z0-9/-]+\.html$/.test(s)&&!s.includes('//');
const opts=process.argv.slice(2);
const arg=name=>{const i=opts.indexOf(name);return i>=0?opts[i+1]:null};
const has=name=>opts.includes(name);
function inspectScript(html,label){
 const inline=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 inline.forEach((m,i)=>{if(m[1].trim())new vm.Script(m[1],{filename:label+'#'+i});});
 ensure(!/<script[^>]+src=["']https?:/i.test(html),label+': external JS dependencies are not admitted');
}
function dataObject(html,label){
 const pos=html.indexOf(label),start=html.indexOf('{',pos+label.length);
 ensure(pos>=0&&start>pos,'Cannot find '+label);
 let depth=0,quoted=false,escaped=false;
 for(let i=start;i<html.length;i++){
  const c=html[i];
  if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue}
  if(c==='"'){quoted=true;continue}
  if(c==='{')depth++;
  else if(c==='}'&&--depth===0){try{return JSON.parse(html.slice(start,i+1))}catch(error){fail('Data JSON invalid: '+error.message)}}
 }
 fail('Unterminated '+label);
}
function auditSource(skill,html){
 ensure(html.length>1000&&Buffer.byteLength(html)<6*1024*1024,'HTML size out of range');
 ensure(/<html[\s>]/i.test(html)&&/<\/html>/i.test(html)&&html.includes('</body>')&&html.split('</body>').length===2,'HTML structure incomplete');
 ensure(!/-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----|(?:sk-(?:proj-)?[A-Za-z0-9_-]{22,})|ghp_[A-Za-z0-9]{25,}|(?:OPENAI|ANTHROPIC)_API_KEY|teacher[_-]answer[_-]key(?:\.json)?/i.test(html),'Potential private material in public student HTML');
 inspectScript(html,'student-source');
 const data=dataObject(html,skill==='konverzace'?'const CONTENT = ':'const DATA=');
 const langs=skill==='poslech'?['en']:LANGS;
 let count=0,exercises=0;
 for(const lang of langs){
  const byLevel=skill==='poslech'?data:(skill==='konverzace'?data[lang]?.levels:data[lang]);
  ensure(byLevel&&typeof byLevel==='object','Missing language '+lang);
  for(const level of LEVELS){
   const v=byLevel[level];ensure(v&&typeof v==='object','Missing level '+lang+'/'+level);
   if(skill==='konverzace'){
    ensure(Array.isArray(v.stations)&&v.stations.length===8,'Conversation must have eight stations');
    ensure(v.stations.every(x=>Array.isArray(x.questions)&&x.questions.length===3&&x.title&&x.main),'Conversation station incomplete');
    ensure(Array.isArray(v.vocab)&&v.vocab.length===12&&Array.isArray(v.toolkit)&&v.toolkit.length===4,'Conversation vocabulary/toolkit mismatch');
    exercises+=24;
   }else if(skill==='cteni'){
    const expected={A1:9,A2:9,B1:12,B2:18,C1:21,C2:21}[level];
    ensure(Array.isArray(v.paragraphs)&&v.paragraphs.length>0&&Array.isArray(v.questions)&&v.questions.length===expected,'Reading paragraphs/questions deviate from reference at '+lang+'/'+level);
    exercises+=v.questions.length;
   }else {
    ensure(v.goal&&v.duration,'Listening goal/duration missing at '+level);
   }
   count++;
  }
 }
 ensure(count===langs.length*6,'CEFR variants missing');
 const target=skill==='konverzace'?html.includes('CATALOG_PRESET_V1')&&html.includes('assets/lsh/v3/card-bridge.js')&&html.includes('assets/lsh/v2/lock.js')?'clb-shared':'standalone':'standalone';
 const requirements={konverzace:['id="languageSelect"','id="levelSwitch"','function switchVariant','const ORDER'],
 cteni:['id="language"','id="levels"','let state=','function render(){','function save(){','const LEVELS='],
 poslech:['id="levelPills"','const LEVEL_IDS','function renderLevel','function persist']};
 if(target==='standalone')for(const key of requirements[skill])ensure(html.includes(key),'Unsupported card runtime: missing '+key);
 if(target==='clb-shared'){
  ensure(/data-lsh-topic-id="cl-[a-z0-9-]+"/.test(html),'Missing Conversation Lab topic-id marker');
  const assets=[...html.matchAll(/<(?:script|link|img|source|video|audio)[^>]*(?:src|href)\s*=\s*["']([^"']+)["']/gi)].map(x=>x[1]);
  const expected=['../../assets/lsh/v2/lock.js','../../assets/lsh/v3/card-bridge.css','../../assets/lsh/v3/model.js','../../assets/lsh/v3/store.js','../../assets/lsh/v3/card-bridge.js'];
  ensure(JSON.stringify(assets)===JSON.stringify(expected),'Unexpected shared-runtime dependencies');
  ensure(html.split('const clbPreset = new URLSearchParams(window.location.search);').length===2,'Shared Conversation preset bridge missing');
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const matches=[...html.matchAll(/sha256-([A-Za-z0-9+/]{43}=)/g)];
  ensure(scripts.length===1&&matches.length===1,'Unexpected Conversation CSP script policy');
  const actual=crypto.createHash('sha256').update(scripts[0][1],'utf8').digest('base64');
  ensure(actual===matches[0][1],'Conversation script differs from the declared CSP SHA-256');
 }else{
  ensure(!/<script\b[^>]*\bsrc\s*=/i.test(html),'Standalone student HTML has external scripts; supply a complete package');
  ensure(!/<link\b[^>]*\brel\s*=\s*["']stylesheet["'][^>]*\bhref\s*=/i.test(html),'Standalone student HTML has external stylesheets');
 }
 return {languages:langs,levels:LEVELS,variants:count,exerciseRecords:exercises,type:target};
}
function referenceBridge(skill){
 const source=skill==='konverzace'?'integrace/konverzace/umela-inteligence/index.html':skill==='cteni'?'integrace/cteni/asteroids/index.html':'integrace/poslech/matthew-mcconaughey/index.html';
 const c=existing(source),parts=c.match(/<script>\n\/\* LSH-R5 variant bridge:[\s\S]*?<\/script>\n/g);
 ensure(parts&&parts.length===1,'One reference integration script required for '+skill);
 return parts[0];
}
function readQueue(catalog){
 if(fs.existsSync(path.join(ROOT,FILES.queue)))return load(FILES.queue);
 const topics=catalog.entries.map(e=>({
  id:e.id,skill:e.skill,title:e.title,studentPath:e.studentPath,
  sourcePath:e.sourceOriginalPath||(
   e.id==='cl-umela-inteligence'?'reference/konverzace/umela-inteligence/index.html':
   e.id==='rl-asteroids'?'nahledy/cteni/asteroids/index.html':
   e.id==='ll-matthew-oscars'?'reference/poslech/matthew-mcconaughey/index.html':
   e.skill==='cteni'?'nahledy/cteni/'+e.studentPath.split('/')[2]+'/index.html':
   e.skill==='poslech'?'nahledy/poslech/'+e.studentPath.split('/')[2]+'/index.html':
   'konverzace/'+e.studentPath.split('/')[1]+'/index.html'),
  status:'PENDING',reviewer:'Claude',teacherApproval:false,reviewedSourceSha256:null,findingsSummary:null
 }));
 // For existing non-references the source path is not always the same as the integrated path.
 for(const e of topics)if(e.skill==='poslech'){
  if(e.id==='ll-harrison-ford')e.sourcePath='nahledy/poslech/harrison-ford/index.html';
  if(e.id==='ll-peaky-no-fighting')e.sourcePath='nahledy/poslech/peaky-blinders/index.html';
 }
 return {schemaVersion:1,policy:'Public metadata only. Full teacher keys and any identifiable student data stay private. Claude review never means automatic teacher approval.',topics};
}
function validateAll(){
 const catalog=load(FILES.catalog),tracker=load(FILES.tracker),queue=readQueue(catalog);
 assert.equal(catalog.approvedForTeaching,false,'Pilot cannot self-approve');
 assert.ok(catalog.entries.length>=29&&catalog.entries.length<=500,'Catalog bounds');
 assert.equal(new Set(catalog.entries.map(x=>x.id)).size,catalog.entries.length);
 assert.equal(tracker.migrationProgress.pilotCatalogEntries,catalog.entries.length);
 assert.equal(queue.topics.length,catalog.entries.length);
 assert.equal(new Set(queue.topics.map(x=>x.id)).size,queue.topics.length);
 const ids=new Set(tracker.topics.map(x=>x.id));
 for(const entry of catalog.entries){
  ensure(safeId(entry.id)&&SKILLS.includes(entry.skill)&&entry.id.startsWith(PREFIX[entry.skill]+'-'),'Bad ID/skill: '+entry.id);
  ensure(entry.studentPath&&entry.studentPath.endsWith('/')&&fs.existsSync(path.join(ROOT,entry.studentPath,'index.html')),'Missing linked student HTML: '+entry.id);
  ensure(entry.test==='not-ready'&&entry.practice==='preview'&&entry.fixedVariantSupported===true,'Unsafe release status: '+entry.id);
  ensure(ids.has(entry.id),'Tracker missing: '+entry.id);
  ensure(queue.topics.some(q=>q.id===entry.id&&q.teacherApproval===false),'Audit queue missing or prematurely approved: '+entry.id);
  const audit=queue.topics.find(q=>q.id===entry.id);
  if(audit.status!=='PENDING'&&audit.reviewedSourceSha256){ensure(fs.existsSync(path.join(ROOT,audit.sourcePath)),'Reviewed source missing');ensure(hash(existing(audit.sourcePath))===audit.reviewedSourceSha256,'Stale Claude review for '+entry.id+'; re-audit required');}
  if(entry.integrationVersion==='INTAKE_V1'){
   ensure(entry.selfContainedHtml||entry.offlineBundle==='clb-v1','Non-standalone new card lacks full offline bundle');
   ensure(entry.sourceOriginalPath&&safePath(entry.sourceOriginalPath),'Missing intake source path: '+entry.id);
   const orig=existing(entry.sourceOriginalPath),current=existing(entry.studentPath+'index.html');
   ensure(blob(orig)===entry.sourceGitBlob,'Source blob changed: '+entry.id);
   const b=referenceBridge(entry.skill),removed=current.replace(b,'');
   if(entry.skill==='konverzace'&&entry.selfContainedHtml===false)ensure(orig===current,'Shared-source file drift: '+entry.id);
   else ensure(current.includes(b)&&removed===orig,'Integrated HTML differs from source+adapter: '+entry.id);
  }
 }
 return {entries:catalog.entries.length,queued:queue.topics.length};
}
function importBatch(file,apply){
 const abs=path.resolve(file),base=path.dirname(abs);
 const spec=JSON.parse(fs.readFileSync(abs,'utf8'));
 ensure(spec.schemaVersion===1&&Array.isArray(spec.cards)&&spec.cards.length>0&&spec.cards.length<=12,'Batch schemaVersion 1, cards[1..12] required');
 const catalog=load(FILES.catalog),tracker=load(FILES.tracker),queue=readQueue(catalog);
 const known=new Set(catalog.entries.map(x=>x.id)),planned=[];
 for(const card of spec.cards){
  ensure(card&&safeId(card.id)&&SKILLS.includes(card.skill)&&card.id.startsWith(PREFIX[card.skill]+'-'),'Invalid card ID/skill');
  ensure(!known.has(card.id),'Duplicate card ID: '+card.id);
  ensure(typeof card.sourceFile==='string'&&/\.html$/i.test(card.sourceFile),'sourceFile must be an HTML file');
  const absSource=path.resolve(base,card.sourceFile);
  ensure(within(base,absSource),'sourceFile must stay inside batch directory');
  const real=fs.realpathSync(absSource);
  ensure(within(base,real),'sourceFile symlink leaves batch directory');
  ensure(typeof card.title==='string'&&card.title.trim().length>=3&&card.title.length<=125,'Missing/long title');
  ensure(typeof card.summary==='string'&&card.summary.trim().length>=25&&card.summary.length<=400,'Summary must describe what happens in this specific card');
  ensure(typeof card.version==='string'&&card.version.length>0&&card.version.length<=45,'Source version required');
  const source=fs.readFileSync(absSource,'utf8'),audit=auditSource(card.skill,source);
  const slug=card.id.slice(3);
  const originalPath=audit.type==='clb-shared'?'konverzace/'+slug+'/index.html':'podklady/'+card.skill+'/'+slug+'/index.html';
  const newPath=audit.type==='clb-shared'?originalPath:'integrace/'+card.skill+'/'+slug+'/index.html';
  ensure(!fs.existsSync(path.join(ROOT,originalPath))&&!fs.existsSync(path.join(ROOT,newPath)),'New file path already exists: '+card.id);
  if(audit.type==='clb-shared')ensure(source.includes('data-lsh-topic-id="'+card.id+'"'),'CLB source topic ID differs from intake request');
  const output=audit.type==='clb-shared'?source:source.replace('</body>',referenceBridge(card.skill)+'</body>');
  ensure(output!=='','Cannot construct HTML');
  const summary=card.summary.trim(),title=card.title.trim(),focus=typeof card.focus==='string'&&card.focus.trim()?card.focus.trim(): 'Aktivita k nezávislé revizi';
  const pilot={id:card.id,skill:card.skill,title,summary,focus,languages:audit.languages,levels:LEVELS.slice(),
   sourceVersion:card.version+' · automatický příjem INTAKE_V1',studentPath:newPath.replace(/index\.html$/,''),
   selfContainedHtml:audit.type!=='clb-shared',mediaExternal:card.skill==='poslech',practice:'preview',
   ...(audit.type==='clb-shared'?{offlineBundle:'clb-v1'}:{}),
   fixedVariantSupported:true,test:'not-ready',integrationVersion:'INTAKE_V1',
   defaultLanguage:'en',defaultLevel:card.defaultLevel&&LEVELS.includes(card.defaultLevel)?card.defaultLevel:'B1',
   practiceQueryFlag:'practice=1',isReference:false,reviewState:'NEW_CARD_AUDIT_PENDING',
   sourceOriginalPath:originalPath,sourceGitBlob:blob(source),sourceSha256:hash(source),
   contentNote:(card.contentNote||'Nová karta bez nezávislé jazykové a pedagogické kontroly. Nepoužívat pro známkování.').slice(0,500)};
  planned.push({pilot,source,output,originalPath,newPath,variants:audit.variants,exerciseRecords:audit.exerciseRecords});
  known.add(card.id);
 }
 const result=planned.map(p=>({id:p.pilot.id,path:p.newPath,sourceSha256:p.pilot.sourceSha256,variants:p.variants,exerciseRecords:p.exerciseRecords}));
 if(!apply){console.log(JSON.stringify({mode:'dry-run',safeToApply:true,cards:result},null,2));return}
 // A failed bulk import must not leave half a card or partially updated ledgers.
 // The lock serialises cooperating importers; each ledger replacement is atomic.
 const lockPath=path.join(ROOT,'data/.card-intake.lock');
 let lockFd=null;
 try{
  lockFd=fs.openSync(lockPath,'wx');
  validateAll(); // Refuse to modify an already inconsistent catalogue.
  const originals=new Map(Object.values(FILES).map(f=>[f,fs.readFileSync(path.join(ROOT,f))]));
  const created=[],changedLedgers=[],staged=new Set();
  const inject=process.env.CI==='true'?process.env.LSH_INTAKE_TEST_FAILURE:null;
  const tempPath=relative=>path.join(ROOT,'data/.intake-'+path.basename(relative)+'-'+process.pid+'-'+crypto.randomBytes(8).toString('hex')+'.tmp');
  const putLedger=(relative,bytes)=>{
   const dest=path.join(ROOT,relative),expected=originals.get(relative);
   ensure(fs.readFileSync(dest).equals(expected),'Ledger modified during import: '+relative);
   const tmp=tempPath(relative);staged.add(tmp);
   fs.writeFileSync(tmp,bytes,{flag:'wx'});
   fs.renameSync(tmp,dest);staged.delete(tmp);
   changedLedgers.push(relative);
   if(inject==='after-first-ledger'&&changedLedgers.length===1)fail('Injected failure after first ledger (CI rollback test)');
  };
  const restoreLedger=(relative)=>{
   const dest=path.join(ROOT,relative),tmp=tempPath(relative);
   staged.add(tmp);fs.writeFileSync(tmp,originals.get(relative),{flag:'wx'});
   fs.renameSync(tmp,dest);staged.delete(tmp);
  };
  try{
   for(const p of planned){
    const files=p.newPath===p.originalPath?[[p.originalPath,p.source]]:[[p.originalPath,p.source],[p.newPath,p.output]];
    for(const [destination,content] of files){
     const absolute=path.join(ROOT,destination);
     fs.mkdirSync(path.dirname(absolute),{recursive:true});
     const fd=fs.openSync(absolute,'wx');
     created.push(absolute); // Tracked even if writing its contents subsequently fails.
     try{fs.writeFileSync(fd,content,'utf8')}finally{fs.closeSync(fd)}
     if(inject==='after-first-file'&&created.length===1)fail('Injected failure after first file (CI rollback test)');
    }
   catalog.entries.push(p.pilot);
   tracker.topics.push({id:p.pilot.id,skill:p.pilot.skill,title:p.pilot.title,origin:'card-intake-v1',
    isReference:false,practiceState:'NEW_CARD_AUDIT_PENDING',urlAndQr:'URL_INTEGRATED_QA_PENDING',
    browserAndPedagogyQA:'QA_PENDING',separateTestMode:'NOT_DESIGNED_OR_APPROVED',
    publicRelease:'BLOCKED_PENDING_REVIEW',
    technicalNote:'Imported public student source with SHA-256 '+p.pilot.sourceSha256+'; pending Claude audit, teacher approval and real-device QA.'});
   tracker.currentPopulation[p.pilot.skill]++;
   tracker.currentPopulation.total++;
   tracker.migrationProgress.pilotCatalogEntries++;
   tracker.migrationProgress.allTechnicalCandidatesIndexed++;
   if(!tracker.statusVocabulary.includes('NEW_CARD_AUDIT_PENDING'))tracker.statusVocabulary.push('NEW_CARD_AUDIT_PENDING');
   queue.topics.push({id:p.pilot.id,skill:p.pilot.skill,title:p.pilot.title,
    studentPath:p.pilot.studentPath,sourcePath:p.originalPath,sourceSha256:p.pilot.sourceSha256,
    status:'PENDING',reviewer:'Claude',teacherApproval:false,reviewedSourceSha256:null,findingsSummary:null});
   }
   catalog.collectionVersion='INTAKE_V1-'+new Date().toISOString().slice(0,10);
   tracker.version='INTAKE_V1-'+new Date().toISOString().slice(0,10);
   for(const [relative,obj] of [[FILES.catalog,catalog],[FILES.tracker,tracker],[FILES.queue,queue]]){
    putLedger(relative,Buffer.from(JSON.stringify(obj,null,2)+'\n','utf8'));
   }
   const verification=validateAll();
   console.log(JSON.stringify({mode:'applied',cards:result,verification},null,2));
  }catch(error){
   const rollbackErrors=[];
   // Reverse completed ledger swaps first, then remove only files created by us.
   for(const relative of changedLedgers.reverse())try{restoreLedger(relative)}catch(e){rollbackErrors.push(e)}
   for(const absolute of created.reverse())try{fs.rmSync(absolute,{force:true})}catch(e){rollbackErrors.push(e)}
   for(const absolute of staged)try{fs.rmSync(absolute,{force:true})}catch(e){rollbackErrors.push(e)}
   if(rollbackErrors.length)throw new AggregateError([error,...rollbackErrors],
    'Import failed and one or more rollback operations also failed; inspect the working tree');
   throw error;
  }
 }finally{
  if(lockFd!==null){fs.closeSync(lockFd);fs.rmSync(lockPath,{force:true})}
 }
}
function auditExport(out){
 const catalog=load(FILES.catalog),queue=readQueue(catalog);
 fs.mkdirSync(out,{recursive:true});let index='# Claude audit — postupná kontrola '+queue.topics.length+' karet\n\n';
 index+='Tento export je pracovní fronta, ne potvrzení provedeného auditu. Před publikací rozhoduje učitel. Nepřidávejte učitelské klíče ani data žáků do public repo.\n\n';
 const batches={konverzace:[],cteni:[],poslech:[]};
 for(const t of queue.topics){
  const e=catalog.entries.find(x=>x.id===t.id);ensure(e,'Audit queue points to missing card '+t.id);
  const src=t.sourcePath&&fs.existsSync(path.join(ROOT,t.sourcePath))?existing(t.sourcePath):null;
  const sha=src?hash(src):'SOURCE_NOT_LOCAL';
  const prompt=[
   '# CLAUDE — nezávislý audit '+e.title,'',
   'Karta: '+t.id+' · '+e.skill+' · '+e.languages.join('/')+' · '+e.levels.join('/'),
   'Zdroj ve školním GitHub repozitáři: zkusebni/'+(t.sourcePath||e.studentPath+'index.html'),
   'SHA-256 aktuálního zdroje: '+sha,
   'Audit nesmí měnit originál. Ověřte pedagogický obsah přímo v přiloženém studentském HTML, nikoli podle anotace.',
   'Nezávisle zkontrolujte všechny deklarované jazyky a úrovně, správnost a idiomatičnost, CEFR progresi, věkovou vhodnost, instrukce, interakce, vizuální UX, chyby v úlohách, výběr textu/videa, klíč a prokazatelnou evidenci (klíč jen pokud je předán bezpečně zvlášť).',
   'Specifická reference: '+(e.skill==='konverzace'?'Umělá inteligence: 8 stanovišť, 3 otázky/stanoviště, Support / Challenge / Stretch, 12 slov, 4 jazykové opory':e.skill==='cteni'?'Asteroids v2.3: evidence, offline slovník, 4 jazyky × 6 úrovní, 9/9/12/18/21/21 úloh':'Matthew v3: Before → First → Second → Third (Written Evidence + Reconstruction) → Optional Language → After; poslechy EN A1–C2'),
   'Výstup: seznam konkrétních chyb P0/P1/P2 s umístěním language/level/exercise, původním a navrženým opraveným textem; rozdělte ověřené chyby a domněnky.',
   'Uveďte také jaká zařízení / média nebyla reálně otestována; netvrďte, že je vše PASS, pouze z důvodu automatických kontrol.',
   'Nikdy neoznačujte kartu ani Test jako schválené. Učitel musí výslovně potvrdit výsledek.',
   'Doložte v reviewedVariants každou skutečně kontrolovanou jazykovou a CEFR variantu zvlášť. Přidejte konkrétní source-specific evidence délky alespoň 20 znaků. Kontrola jen EN B2 nepostačuje; nevymýšlejte neověřené varianty.',
   'V unverifiedChecks povinně vyjmenujte netestovaná zařízení, externí video, školní Wi-Fi, offline režim či nedodaný soukromý učitelský klíč. Pole [] použijte jen po skutečném ověření.',
   'Strojově čitelný JSON: {"topicId":"'+t.id+'","sourceSha256":"'+sha+'","reviewedVariants":[{"language":"en","level":"A1","evidence":"Konkrétní poznatek ze skutečné EN A1 varianty"}],"unverifiedChecks":["Nativní iOS nebyl fyzicky testován"],"findings":[{"severity":"P1","language":"es","level":"A1","location":"stanoviště a otázka","observed":"Původní text","proposed":"Konkrétní oprava","evidence":"Důkaz ze zdroje"}],"status":"REVIEWED_WITH_FINDINGS|REVIEWED_NO_FINDINGS","requiresTeacherDecision":true}. Rozepište všechny varianty, ukázka obsahuje pouze jednu.',
   ''
  ].join('\n');
  fs.writeFileSync(path.join(out,t.id+'.md'),prompt);batches[e.skill].push(t.id);
  index+='- [ ] '+e.title+' ('+e.skill+') — '+t.id+' — '+t.status+' · '+t.id+'.md\n';
 }
 for(const [k,ids] of Object.entries(batches)){
  index+='\n## '+k+' — '+ids.length+' karet\n';
  for(let i=0;i<ids.length;i+=5)index+='\nBalíček '+(i/5+1)+': '+ids.slice(i,i+5).join(', ')+'\n';
 }
 fs.writeFileSync(path.join(out,'INDEX.md'),index);
 console.log(JSON.stringify({packets:queue.topics.length,folder:out,batches:Object.fromEntries(Object.entries(batches).map(([k,v])=>[k,Math.ceil(v.length/5)]))}));
}
function selfTest(){
 const reading=existing('nahledy/cteni/asteroids/index.html');
 const conversation=existing('reference/konverzace/umela-inteligence/index.html');
 const listening=existing('reference/poslech/matthew-mcconaughey/index.html');
 const a=SKILLS.map((skill,i)=>auditSource(skill,[conversation,reading,listening][i]));
 assert.equal(a[0].variants,24);assert.equal(a[1].exerciseRecords,360);assert.equal(a[2].variants,6);
 for(const skill of SKILLS)assert.ok(referenceBridge(skill).startsWith('<script>\n/* LSH-R5'));
 console.log('PASS intake self-test: Conversation/Reading/Listening reference contract and adapters');
}
try{
 if(has('--help')||opts.length===0)console.log('Usage: --verify | --self-test | --batch path/to/cards.json [--apply] | --audit-export output-folder');
 else if(has('--verify'))console.log('PASS card intake verification',JSON.stringify(validateAll()));
 else if(has('--self-test'))selfTest();
 else if(has('--batch')){ensure(arg('--batch'),'Provide --batch path');importBatch(arg('--batch'),has('--apply'))}
 else if(has('--audit-export')){ensure(arg('--audit-export'),'Provide output folder');auditExport(path.resolve(arg('--audit-export')))}
 else fail('Unknown command');
}catch(error){console.error(error.stack||String(error));process.exitCode=1}
