#!/usr/bin/env node
/* LSH R10: one offline pedagogical-review bundle for the whole technical catalog.
 * Generates ALL relevant R8/R7 candidates in disposable folders. Includes the
 * 4 remaining current pilots and the five shared Conversation runtime assets.
 * Never edits the repository or exposes private teacher answer keys.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const STAGE=path.resolve(__dirname,'..'),REPO=path.resolve(STAGE,'..');
const DIR=process.argv[2]&&path.resolve(process.argv[2]);
assert.ok(DIR,'Usage: node tools/r10-unified-review-bundle.cjs <output-directory>');
assert.ok(!DIR.startsWith(REPO+path.sep)&&DIR!==REPO,
 'For safety, review bundles may not be generated inside the public repository');
assert.ok(!fs.existsSync(DIR)||fs.readdirSync(DIR).length===0,
 'Output directory must be new or completely empty');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'lsh-r10-sources-'));
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const read=file=>fs.readFileSync(file);
const a=(expr,msg)=>assert.ok(expr,msg);
const safeFile=(base,file)=>{
 a(typeof file==='string'&&!file.includes('\\')&&file.indexOf('..')<0,'Unsafe input file path');
 const result=path.resolve(base,file);
 a(result.startsWith(base+path.sep),'Path escapes its source directory');
 return result;
};
const clean=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const codePaths={
 conversation:'tools/conversation-r8-source-recovery.cjs',
 reading:'tools/reading-r7-candidates.cjs',
 listening:'tools/listening-r7-three-phase-candidates.cjs'
};
const languages=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
try{
 const generated={};
 for(const [key,relative] of Object.entries(codePaths)){
  const dest=path.join(scratch,key);
  const result=execFileSync(process.execPath,[path.join(STAGE,relative),dest],
    {encoding:'utf8',timeout:180000,maxBuffer:5*1024*1024});
  a(result.includes('PASS '),'Source-specific generator did not report PASS: '+key);
  generated[key]=dest;
 }
 const R8=json(path.join(generated.conversation,'R8_RECOVERY_MANIFEST.json'));
 const RR=json(path.join(generated.reading,'R7_CANDIDATES_MANIFEST.json'));
 const LR=json(path.join(generated.listening,'LISTENING_R7_UI_MANIFEST.json'));
 const catalog=json(path.join(STAGE,'data/reference-pilots.json'));
 a(catalog.approvedForTeaching===false&&Array.isArray(catalog.entries)&&catalog.entries.length>=29,
  'Review bundle must be derived from the unapproved complete pilot catalog');
 a(R8.kind==='R8_SOURCE_CONTENT_RECOVERY_CANDIDATES_ONLY'&&
   R8.originalSourcesUnchanged===true&&R8.teacherApproval===false&&R8.published===false&&
   R8.approvedForRelease===false&&R8.catalogUpdated===false&&R8.cards.length===21,
  'Unexpected Conversation R8 approval/source state');
 a(RR.kind==='READING_R7_CANDIDATES_ONLY'&&RR.teacherApproval===false&&
   RR.approvedForRelease===false&&RR.privateTeacherKeyRevalidationRequired===true&&
   RR.cards.length===2,'Unexpected Reading R7 approval/key state');
 a(LR.kind==='LISTENING_R7_THREE_PASS_CANDIDATES'&&LR.teacherApproval===false&&
   LR.releaseApproved===false&&LR.mediaVerified===false&&LR.cards.length===2,
  'Unexpected Listening R7 approval/media state');
 const r8=new Map(R8.cards.map(x=>[x.id,x]));
 const rr=new Map(RR.cards.map(x=>[x.topicId,x]));
 const lr=new Map(LR.cards.map(x=>[x.id,x]));
 a(new Set(catalog.entries.map(x=>x.id)).size===catalog.entries.length,'Duplicate catalog IDs');
 for(const map of [r8,rr,lr])for(const id of map.keys())
  a(catalog.entries.some(x=>x.id===id),'Candidate missing from source catalog: '+id);
 const entries=[],counts={konverzace:0,cteni:0,poslech:0},tiers={R8:0,READING_R7:0,LISTENING_R7:0,CURRENT_PILOT:0};
 fs.mkdirSync(DIR,{recursive:true});
 for(const e of catalog.entries){
  a(['konverzace','cteni','poslech'].includes(e.skill),'Unknown skill for '+e.id);
  a(e.practice==='preview'&&e.test==='not-ready','Unapproved pilot was silently upgraded: '+e.id);
  a(e.teacherKeyUrl==null,'Public catalog unexpectedly contains teacher key URL: '+e.id);
  a(/^(cl|rl|ll)-[a-z0-9-]+$/.test(e.id),'Invalid ID: '+e.id);
  const expectedPrefix={konverzace:'cl-',cteni:'rl-',poslech:'ll-'}[e.skill];
  a(e.id.startsWith(expectedPrefix),'Wrong skill prefix for '+e.id);
  a(Array.isArray(e.levels)&&levels.every(l=>e.levels.includes(l)),'Incomplete level matrix: '+e.id);
  a(Array.isArray(e.languages)&&e.languages.length>=1&&e.languages.every(l=>languages.includes(l)),
   'Invalid languages: '+e.id);
  const relative=e.skill+'/'+e.id.slice(3)+'/index.html';
  let src,tier,expectedHash;
  if(r8.has(e.id)){
   const c=r8.get(e.id);
   a(e.skill==='konverzace'&&c.teacherApproval===false&&c.published===false,
    'Invalid R8 card metadata');
   src=safeFile(generated.conversation,c.file);
   expectedHash=c.repairedCandidateSha256;tier='R8';
  }else if(rr.has(e.id)){
   const c=rr.get(e.id);
   a(e.skill==='cteni'&&c.teacherApproval===false&&c.published===false,'Invalid Reading candidate');
   src=safeFile(generated.reading,c.candidateFile);
   expectedHash=c.candidateSha256;tier='READING_R7';
  }else if(lr.has(e.id)){
   const c=lr.get(e.id);
   a(e.skill==='poslech'&&c.teacherApproval===false&&c.mediaVerified===false,
    'Invalid Listening candidate');
   src=safeFile(generated.listening,c.candidate);
   expectedHash=c.candidateSHA256;tier='LISTENING_R7';
  }else{
   a(typeof e.studentPath==='string'&&/^(integrace\/|konverzace\/)/.test(e.studentPath),
    'Unexpected canonical student source path: '+e.id);
   src=safeFile(STAGE,e.studentPath+'index.html');
   tier='CURRENT_PILOT';
   a(e.selfContainedHtml===true,'Fallback card requires separate runtime support: '+e.id);
  }
  const bytes=read(src),hash=digest(bytes);
  if(expectedHash)assert.equal(hash,expectedHash,'Changed candidate bytes: '+e.id);
  a(bytes.toString('utf8',0,300).includes('<html'),'Missing HTML document: '+e.id);
  const target=path.join(DIR,relative);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,bytes,{flag:'wx'});
  counts[e.skill]++;tiers[tier]++;
  entries.push({id:e.id,skill:e.skill,title:e.title,relative,sourceTier:tier,
   languageCoverage:e.languages,cefrLevels:e.levels,
   sha256:hash,bytes:bytes.length,teacherApproval:false,published:false,
   keySynchronizationNeeded:tier==='READING_R7',
   mediaValidationNeeded:e.skill==='poslech'&&e.mediaExternal===true});
 }
 a(counts.konverzace===21&&counts.cteni===5&&counts.poslech===3,
  'Unexpected 29-card catalog composition; review scope requires regeneration');
 assert.deepEqual(tiers,{R8:21,READING_R7:2,LISTENING_R7:2,CURRENT_PILOT:4},
  'Unapproved source update changed the 25 candidate / 4 original breakdown');
 // The repaired R8 Conversation HTML is not fully self-contained; copy the
 // exact runtime dependencies to match ../../assets/... references.
 const assets=[
  'assets/lsh/v2/lock.js',
  'assets/lsh/v3/card-bridge.css',
  'assets/lsh/v3/model.js',
  'assets/lsh/v3/store.js',
  'assets/lsh/v3/card-bridge.js'
 ];
 const assetDigests={};
 for(const asset of assets){
  const input=safeFile(STAGE,asset),bytes=read(input);
  const target=path.join(DIR,asset);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,bytes,{flag:'wx'});
  assetDigests[asset]=digest(bytes);
 }
 for(const e of entries.filter(x=>x.skill==='konverzace')){
  const html=read(path.join(DIR,e.relative)).toString('utf8');
  for(const asset of assets){
   const link='../../'+asset;
   a(html.includes(link),'Missing expected offline runtime dependency '+e.id+': '+asset);
   a(fs.existsSync(path.resolve(path.dirname(path.join(DIR,e.relative)),link)),
    'Broken relative asset link '+e.id+': '+asset);
  }
 }
 const publicRelease={teacherApproval:false,approvedForRelease:false,published:false,
  testModeReady:false,privateTeacherKeysBundled:false};
 const manifest={schemaVersion:1,kind:'R10_UNIFIED_OFFLINE_REVIEW_ONLY',
  sourceStatus:'PILOT_NOT_APPROVED',catalogSize:entries.length,counts,tiers,
  sourceCommit:process.env.GITHUB_SHA||null,
  ...publicRelease,notes:[
  'Technical candidate review bundle only. Source-correctness and CEFR require teacher approval.',
  'Reading R7 private keys must be synchronized OUTSIDE this public repository.',
  'Listening R7 media availability and age suitability remain unverified.',
  'Do not publish, grade pupils, or merge into main based on this artifact.'
 ],assets:assetDigests,entries};
 fs.writeFileSync(path.join(DIR,'R10_REVIEW_MANIFEST.json'),JSON.stringify(manifest,null,2)+'\n');
 const rows=entries.map(e=>{
  const status={R8:'R8 · původní obsah obnoven',READING_R7:'R7 · oprava úloh',
   LISTENING_R7:'R7 · tři poslechy',CURRENT_PILOT:'Původní pilot'}[e.sourceTier];
  return '<article class="item" data-skill="'+clean(e.skill)+'"><div class="meta">'+
   clean(e.skill)+' · '+clean(status)+' · Neschváleno</div><h3>'+clean(e.title)+'</h3>'+
   '<p>'+clean(e.languageCoverage.join(', ').toUpperCase())+' · A1–C2</p>'+
   '<a href="'+clean(e.relative)+'?practice=1">Otevřít kartu k revizi</a></article>';
 }).join('\n');
 const html=['<!doctype html><html lang="cs"><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<meta name="robots" content="noindex,nofollow"><title>Language Skills Hub | Kontrola 29 karet</title>',
  '<style>:root{color-scheme:dark;font:16px/1.5 system-ui,Arial;background:#091522;color:#edf6ff}',
  '*{box-sizing:border-box}body{max-width:1200px;margin:auto;padding:clamp(14px,3vw,36px)}',
  'h1{font-size:clamp(1.5rem,3vw,2.3rem);line-height:1.2}h2{margin-top:2rem}',
  '.notice{padding:14px 18px;border:2px solid #e8bc67;border-radius:13px;background:#252215}',
  '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,270px),1fr));gap:13px}',
  '.item{background:#16263a;border:1px solid #49617c;border-radius:12px;padding:16px}',
  '.meta{font-size:.79rem;letter-spacing:.02em;color:#a9d9ed}.item h3{margin:8px 0}',
  'a{display:inline-block;color:#8deeff;text-underline-offset:3px;font-weight:650}',
  'a:focus{outline:3px solid #e8bc67;outline-offset:4px}p{color:#d1dfea}',
  '</style></head><body>',
  '<header><p>LANGUAGE SKILLS HUB · OFFLINE QA · R10</p><h1>Jednotná kontrola všech 29 karet</h1>',
  '<div class="notice"><strong>NEPUBLIKOVAT / NEPOUŽÍVAT KE ZNÁMKOVÁNÍ.</strong> '+
   'Jde o izolované kandidáty pro pedagogickou a jazykovou přejímku. '+ 
   'Žádná z karet není tímto balíčkem automaticky schválena.</div>',
  '<p>21 Conversation · 5 Reading · 3 Listening. Otevřete karty z rozbaleného ZIPu. '+
   'Externí poslechová videa nemusí bez internetu fungovat. Učitelské klíče nejsou součástí balíčku.</p></header>',
  '<main>',
  ...['konverzace','cteni','poslech'].map(skill=>'<section><h2>'+
   {konverzace:'Conversation Lab',cteni:'Reading Lab',poslech:'Listening Lab'}[skill]+
   ' ('+counts[skill]+')</h2><div class="grid">'+
   rows.split('\n').filter(row=>row.includes('data-skill="'+skill+'"')).join('\n')+
   '</div></section>'),
  '</main><footer><p>Nejdřív kontrola jazyků, CEFR, správnosti odpovědí a médií; '+ 
   'potom teprve rozhodnutí o vydání. Zdrojové otisky viz R10_REVIEW_MANIFEST.json.</p></footer>',
  '</body></html>'].join('\n');
 fs.writeFileSync(path.join(DIR,'index.html'),html,{flag:'wx'});
 const lines=['# Language Skills Hub R10 — jednotná offline přejímka','',
  '**DRAFT / JEN KONTROLA.** Žádné zveřejnění, výsledky žáků ani učitelské klíče.',
  'Obsah: 21 kandidátů Conversation R8, 2 Reading R7, 2 Listening R7 a 4 beze změny.',
  'Rozbalte CELÝ ZIP a otevřete soubor index.html. Pro Conversation zachovejte adresář assets/.',
  'Pozor: externí média Listening bez internetu nejsou dostupná; samotný HTML může být offline.',
  '',
  '## Povinná kontrola před schválením',
  '- [ ] Jazyková přirozenost EN/ES/DE/FR a úrovně A1–C2 v každém dostupném tématu',
  '- [ ] Tematická relevance všech otázek, Support/Challenge/Stretch a slovní zásoby',
  '- [ ] Reading: obsahová správnost a synchronizace SOUKROMÝCH učitelských klíčů pro 17 změn',
  '- [ ] Listening: skutečně funkční média a věková vhodnost; tři oddělené poslechy',
  '- [ ] Mobile/iPad Safari, QR, místní slovníček a srozumitelné ovládání v učebně',
  '- [ ] Jasné rozhodnutí učitele o každé sadě; poté samostatná kontrola vydávací větve',
  '',
  '## Přehled všech témat k přejímce',''];
 for(const skill of ['konverzace','cteni','poslech']){
  lines.push('### '+skill,'');
  for(const e of entries.filter(x=>x.skill===skill))
   lines.push('- [ ] '+e.title+' ('+e.id+') · '+e.sourceTier+' · '+e.languageCoverage.join('/')+' A1–C2');
  lines.push('');
 }
 lines.push('**Nevkládejte jména žáků ani soukromé klíče do tohoto checklistu nebo veřejného GitHubu.**','');
 fs.writeFileSync(path.join(DIR,'REVIEW_CHECKLIST.md'),lines.join('\n'),{flag:'wx'});
 console.log('PASS R10 unified offline review: '+entries.length+' cards; 21 R8 + 2 Reading R7 + 2 Listening R7 + 4 original pilots; 5 runtime assets; NO APPROVAL/DEPLOY');
}finally{
 fs.rmSync(scratch,{recursive:true,force:true,maxRetries:3,retryDelay:100});
}
