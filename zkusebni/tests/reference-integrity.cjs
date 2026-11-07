/* Language Skills Hub R5: verify reference originals remain intact and pilot adapters parse.
 * Run: node zkusebni/tests/reference-integrity.cjs
 * This test performs no network requests and never loads teacher answer keys.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const original=[
 {id:'cl-umela-inteligence',original:'reference/konverzace/umela-inteligence/index.html',
  integrated:'integrace/konverzace/umela-inteligence/index.html',
  sha:'0598c67e27a126385875155310a042104c2f1fafa59cbec0884d4deef58a7813'},
 {id:'rl-asteroids',original:'nahledy/cteni/asteroids/index.html',
  integrated:'integrace/cteni/asteroids/index.html',
  sha:'fc667a52f5f48407aa10dea31adda836ffdc88008e206a46727e94cc9991f82b'},
 {id:'ll-matthew-oscars',original:'reference/poslech/matthew-mcconaughey/index.html',
  integrated:'integrace/poslech/matthew-mcconaughey/index.html',
  sha:'403022392cbd045cef72ed3554960f922f81545e5e077ad2d1fc9be2ad91a1df'}
];
const inventory=JSON.parse(read('data/reference-pilots.json'));
assert.equal(inventory.schemaVersion,1);
assert.equal(inventory.approvedForTeaching,false);
assert.equal(inventory.entries.length,28,'Pilot consists of 3 references, 19 Conversation candidates, 2 Listening candidates and 4 Reading candidates');
assert.equal(inventory.entries.filter(e=>e.isReference).length,3);
assert.equal(inventory.entries.filter(e=>!e.isReference).length,25);
assert.equal(new Set(inventory.entries.map(e=>e.id)).size,28);
const isJS=s=>!/^\s*(?:\{)/.test(s);
for(const t of original){
 const before=read(t.original),after=read(t.integrated);
 const ref=inventory.entries.find(e=>e.id===t.id);
 assert.ok(ref,'Missing reference '+t.id);
 assert.equal(ref.studentPath,t.integrated.replace(/index\.html$/,''));
 assert.equal(ref.fixedVariantSupported,true);
 assert.equal(ref.practice,'preview');
 assert.equal(ref.test,'not-ready');
 assert.equal(ref.selfContainedHtml,true);
 const checksum=crypto.createHash('sha256').update(before,'utf8').digest('hex');
 assert.equal(checksum,t.sha,'Original checksum mismatch for '+t.id);
 const adapter=/<script>\n\/\* LSH-R5 variant bridge:[\s\S]*?<\/script>\n/g;
 assert.equal([...after.matchAll(adapter)].length,1,'Exactly one adapter required');
 const restored=after.replace(adapter,'');
 assert.equal(restored,before,'Original student data changed in '+t.id);
 assert.ok(after.includes('window.LSH_OFFLINE_QS||location.search'),'Offline preset missing');
 assert.ok(after.includes("p.get('zamek')==='1'"),'Fixed variant lock missing');
 const scripts=[...after.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 assert.ok(scripts.length>=2,'Expected inline script plus adapter');
 for(let n=0;n<scripts.length;n++){
  const code=scripts[n][1];
  if(isJS(code))new vm.Script(code,{filename:t.integrated+'#'+n});
 }
 console.log('PASS',t.id,'source intact; JS scripts:',scripts.length);
}


function parseConversationContent(html) {
 const key='const CONTENT = ';
 const at=html.indexOf(key);
 assert.ok(at>=0,'Conversation CONTENT data object missing');
 const start=html.indexOf('{',at+key.length);
 assert.ok(start>at,'Conversation data opening brace missing');
 let depth=0,quote=false,escape=false;
 for(let i=start;i<html.length;i++){
  const ch=html[i];
  if(quote){
   if(escape)escape=false;
   else if(ch==='\\')escape=true;
   else if(ch==='"')quote=false;
   continue;
  }
  if(ch==='"'){quote=true;continue;}
  if(ch==='{')depth++;
  if(ch==='}'&&--depth===0)return JSON.parse(html.slice(start,i+1));
 }
 throw new Error('Conversation CONTENT data object incomplete');
}
function verifyConversationVariants(data,topicId){
 const langs=['en','es','de','fr'],levels=['A1','A2','B1','B2','C1','C2'];
 assert.deepEqual(Object.keys(data).sort(),langs.slice().sort(),'Unexpected language coverage in '+topicId);
 let variants=0,stations=0,questions=0;
 for(const lang of langs){
  assert.deepEqual(Object.keys(data[lang].levels).sort(),levels.slice().sort(),'Incomplete CEFR levels');
  for(const level of levels){
   const d=data[lang].levels[level];
   assert.equal(d.stations.length,8,'Wrong Conversation station count');
   assert.equal(d.vocab.length,12,'Wrong vocabulary size');
   assert.equal(d.toolkit.length,4,'Wrong toolkit size');
   const seen=new Set();
   for(const st of d.stations){
    assert.ok(typeof st.title==='string'&&st.title.trim()&&typeof st.main==='string'&&st.main.trim(),'Missing station prompt');
    assert.ok(Array.isArray(st.questions)&&st.questions.length===3,'Wrong number of follow-up questions');
    assert.ok(Array.isArray(st.support)&&st.support.length>0,'Missing differentiated support');
    assert.ok(typeof st.challenge==='string'&&st.challenge.trim(),'Missing Challenge');
    assert.ok(typeof st.stretch==='string'&&st.stretch.trim(),'Missing Stretch');
    for(const q of st.questions){
     assert.ok(typeof q==='string'&&q.trim(),'Missing question');
     const norm=q.trim().toLocaleLowerCase();
     assert.ok(!seen.has(norm),'Duplicate follow-up question inside variant');
     seen.add(norm);questions++;
    }
    if(['B2','C1','C2'].includes(level))
     assert.ok(Array.isArray(st.explanations)&&st.explanations.length===3,'Upper-level Explain missing');
    stations++;
   }
   variants++;
  }
 }
 assert.equal(variants,24);assert.equal(stations,192);assert.equal(questions,576);
 return {variants,stations,questions};
}

/* Stage R5E: two already-public conversation HTML files remain byte-exact
 * and are surfaced only as unapproved pilots. Git blob SHA verifies bytes. */
const migrants=[
 {id:'cl-socialni-media',file:'konverzace/socialni-media/index.html',blob:'c81683e238dcdb96f3d4f39768a5d2d0d9b5f0da'},
 {id:'cl-hrani-her',file:'konverzace/hrani-her/index.html',blob:'1cafcbaa0a9f35d2ff1d0a152e915c5010743364'},
 {id:'cl-rodina',file:'konverzace/rodina/index.html',blob:'d93d87f587f29c7afa5c1946faa7c81f608ab855'},
 {id:'cl-prazdniny',file:'konverzace/prazdniny/index.html',blob:'7c92c7808b7eac5c1a8f489921914ca3b85e97ec'},
 {id:'cl-jidlo-piti-restaurace',file:'konverzace/jidlo-piti-restaurace/index.html',blob:'9d16d00de0e79baea3f9f87201678c326bc80989'},
 {id:'cl-vanoce',file:'konverzace/vanoce/index.html',blob:'e07f24575f2dc131c3ad9226f10b78579295df03'},
 {id:'cl-zivot-bez-ai',file:'konverzace/zivot-bez-ai/index.html',blob:'90c94f4c90e56555c7bb9d7c7fdb02c9851b65cb'},
 {id:'cl-socialni-site-a-dusevni-zdravi',file:'konverzace/socialni-site-a-dusevni-zdravi/index.html',blob:'6d5928d4d14eda3273814465ff3c7db0bd6e7b1a'},
 {id:'cl-jak-se-ucit-na-testy',file:'konverzace/jak-se-ucit-na-testy/index.html',blob:'5ce6a37ff31549d5cb176439aa18ff54266861cb'},
 {id:'cl-tlak-na-vykon',file:'konverzace/tlak-na-vykon/index.html',blob:'e619a6e5bc68097a0cbeafc4a9049c2225e38937'},
 {id:'cl-pratele',file:'konverzace/pratele/index.html',blob:'38e19362fa8dd00fdc59155456ac480ebe32ec84'},
 {id:'cl-problemy-teenageru',file:'konverzace/problemy-teenageru/index.html',blob:'bb1c1a33196683a41087f37ffba3742cc9f8c1b9'},
 {id:'cl-muzi-a-zeny',file:'konverzace/muzi-a-zeny/index.html',blob:'89973450f1f58540cb94a1ab243ebc3fe2195d9c'},
 {id:'cl-spolecenske-problemy',file:'konverzace/spolecenske-problemy/index.html',blob:'d19ecac6914e3f79cf45e074fad9db4df397a3c2'},
 {id:'cl-majetkove-nerovnosti',file:'konverzace/majetkove-nerovnosti/index.html',blob:'725d215eb9cef83f8e362cfec254fc78e146c05e'},
 {id:'cl-volny-cas-a-konicky',file:'konverzace/volny-cas-a-konicky/index.html',blob:'cc975658abcddeb9e00299781dfb956d1c63e402'},
 {id:'cl-nemoci-u-lekare',file:'konverzace/nemoci-u-lekare/index.html',blob:'c710e3d8d3cd74eb2993ee98b0fcf39c31961597'},
 {id:'cl-svetova-politika',file:'konverzace/svetova-politika/index.html',blob:'c651c7fc9e96ece021d87f53fdf56307e84887e8'},
 {id:'cl-ceny-nemovitosti',file:'konverzace/ceny-nemovitosti/index.html',blob:'b3003f1be2ffec6db7308385807b059793e3a648'}
];
for(const candidate of migrants){
 const buffer=fs.readFileSync(path.join(root,candidate.file));
 const gitBlob=Buffer.concat([Buffer.from('blob '+buffer.length+'\0'),buffer]);
 const checksum=crypto.createHash('sha1').update(gitBlob).digest('hex');
 assert.equal(checksum,candidate.blob,'Original migrated candidate source changed: '+candidate.id);
 const html=buffer.toString('utf8');
 const item=inventory.entries.find(x=>x.id===candidate.id);
 assert.ok(item&&item.isReference===false&&item.test==='not-ready','Candidate must remain unapproved');
 assert.equal(item.studentPath,candidate.file.replace(/index\.html$/,''));
 assert.equal(item.selfContainedHtml,false,'Cannot claim standalone offline HTML with relative JS assets');
 for(const piece of ['data-lsh-topic-id="'+candidate.id+'"','id="languageSelect"','id="levelSwitch"',
   '../../assets/lsh/v2/lock.js','../../assets/lsh/v3/model.js',
   '../../assets/lsh/v3/store.js','../../assets/lsh/v3/card-bridge.js',
   'CATALOG_PRESET_V1','const clbPreset = new URLSearchParams(window.location.search)']){
  assert.ok(html.includes(piece),'Missing URL/CEFR/bridge contract: '+piece+' in '+candidate.id);
 }
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 const inline=scripts.map(x=>x[1]).filter(x=>x.trim());
 assert.equal(inline.length,1,'Expected single existing inline Conversation engine');
 new vm.Script(inline[0],{filename:candidate.file});
 const token=html.match(/sha256-([A-Za-z0-9+/=]+)/)?.[1];
 assert.ok(token,'Original Conversation CSP hash missing');
 assert.equal(crypto.createHash('sha256').update(inline[0]).digest('base64'),token,
  'Conversation inline CSP hash must match source; UI scripts would otherwise be blocked');
 const coverage=verifyConversationVariants(parseConversationContent(html),candidate.id);
 console.log('PASS',candidate.id,'original source and CSP intact; URL + bridge; '+coverage.variants+' variants / '+coverage.stations+' stations / '+coverage.questions+' follow-ups');
}


/* R5G: Listening source data remain byte-identical when the URL bridge is removed.
 * Media verification and pedagogical restructuring are deliberately separate. */
const additionalListening=[
 {id:'ll-harrison-ford',original:'nahledy/poslech/harrison-ford/index.html',integrated:'integrace/poslech/harrison-ford/index.html',blob:'f816dbbbc2d9d2e7fc5b7a4c40d9e7dcfb331dbc'},
 {id:'ll-peaky-no-fighting',original:'nahledy/poslech/peaky-blinders/index.html',integrated:'integrace/poslech/peaky-blinders/index.html',blob:'cfda1197882b8107ddce2f80665abd681526efc5'}
];
for(const t of additionalListening){
 const originalBuffer=fs.readFileSync(path.join(root,t.original));
 const gitSha=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+originalBuffer.length+'\0'),originalBuffer])).digest('hex');
 assert.equal(gitSha,t.blob,'Listening original source has moved');
 const before=originalBuffer.toString('utf8'),after=read(t.integrated);
 const a=/<script>\n\/\* LSH-R5 variant bridge:[\s\S]*?<\/script>\n/g;
 assert.equal([...after.matchAll(a)].length,1,'Exactly one listener adapter required');
 assert.equal(after.replace(a,''),before,'Listening questions or UI original modified: '+t.id);
 assert.ok(after.includes('window.LSH_OFFLINE_QS||location.search'));
 assert.ok(after.includes("qp.get('zamek')==='1'"));
 const entry=inventory.entries.find(x=>x.id===t.id);
 assert.ok(entry&&entry.isReference===false&&entry.mediaExternal===true&&entry.selfContainedHtml===true);
 assert.equal(entry.studentPath,t.integrated.replace(/index\.html$/,''));
 assert.equal(entry.languages.length,1);assert.equal(entry.languages[0],'en');
 assert.equal(entry.test,'not-ready');
 assert.ok(entry.contentNote&&entry.contentNote.length>20,'External media warning missing');
 const scripts=[...after.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 for(let i=0;i<scripts.length;i++)if(scripts[i][1].trim())new vm.Script(scripts[i][1],{filename:t.id+'#'+i});
 console.log('PASS',t.id,'Listening source unmodified, EN-only adapter and video caution present');
}

/* R5H: four Reading integrations preserve the full original material.
 * This is structural/URL QA; it does NOT certify semantics, answer keys or CEFR authenticity. */
const additionalReading=[
 {id:'rl-can-mistakes',original:'nahledy/cteni/can-mistakes/index.html',integrated:'integrace/cteni/can-mistakes/index.html',blob:'ca88591cbe890d6166605f5133486f5fc17a865e'},
 {id:'rl-plastic-ocean',original:'nahledy/cteni/plastic-ocean/index.html',integrated:'integrace/cteni/plastic-ocean/index.html',blob:'444c7f027fb6f4c0fb9170aecf085363f90b5da3'},
 {id:'rl-email-friend',original:'nahledy/cteni/email-friend/index.html',integrated:'integrace/cteni/email-friend/index.html',blob:'9178645eaa2d4fcd522a8a52bf2cd4741dfce05f'},
 {id:'rl-instant-messages',original:'nahledy/cteni/instant-messages/index.html',integrated:'integrace/cteni/instant-messages/index.html',blob:'274140b4799bfaef6125063e554b86d741d01289'}
];
const referenceReadingAdapter=read('integrace/cteni/asteroids/index.html').match(/<script>\n\/\* LSH-R5 variant bridge:[\s\S]*?<\/script>\n/g);
assert.ok(referenceReadingAdapter&&referenceReadingAdapter.length===1);
for(const item of additionalReading){
 const buffer=fs.readFileSync(path.join(root,item.original));
 const blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+buffer.length+'\0'),buffer])).digest('hex');
 assert.equal(blob,item.blob,'Reading original changed: '+item.id);
 const originalHtml=buffer.toString('utf8');
 const linkedHtml=read(item.integrated);
 const markers=linkedHtml.match(/<script>\n\/\* LSH-R5 variant bridge:[\s\S]*?<\/script>\n/g);
 assert.ok(markers&&markers.length===1,'Expected one Reading bridge: '+item.id);
 assert.equal(markers[0],referenceReadingAdapter[0],'Reading adapter differs from reference: '+item.id);
 assert.equal(linkedHtml.replace(markers[0],''),originalHtml,'Original Reading material was altered: '+item.id);
 assert.ok(linkedHtml.includes('window.LSH_OFFLINE_QS||location.search'));
 assert.ok(linkedHtml.includes("p.get('zamek')==='1'"));
 const at=originalHtml.indexOf('const DATA='),end=originalHtml.indexOf(';\n',at);
 assert.ok(at>=0&&end>at,'Reading data missing');
 const data=JSON.parse(originalHtml.slice(at+'const DATA='.length,end));
 assert.deepEqual(Object.keys(data).sort(),['de','en','es','fr']);
 let count=0,questions=0;
 for(const language of ['en','es','de','fr']){
  assert.deepEqual(Object.keys(data[language]).sort(),['A1','A2','B1','B2','C1','C2']);
  for(const level of ['A1','A2','B1','B2','C1','C2']){
   const v=data[language][level];
   assert.ok(v.title&&Array.isArray(v.paragraphs)&&v.paragraphs.length>0);
   assert.ok(Array.isArray(v.questions)&&v.questions.length==={A1:9,A2:9,B1:12,B2:18,C1:21,C2:21}[level], 'Unexpected Reading CEFR exercise count: '+item.id+'/'+language+'/'+level);
   questions+=v.questions.length;count++;
  }
 }
 assert.equal(count,24);assert.equal(questions,360);
 const entry=inventory.entries.find(v=>v.id===item.id);
 assert.ok(entry&&entry.skill==='cteni'&&entry.test==='not-ready'&&entry.reviewState==='URL_INTEGRATED_CONTENT_QA_PENDING');
 assert.equal(entry.studentPath,item.integrated.replace(/index\.html$/,''));
 assert.equal(entry.sourceGitBlob,item.blob);
 assert.equal(entry.selfContainedHtml,true);
 const scripts=[...linkedHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
 for(let i=0;i<scripts.length;i++)if(scripts[i][1].trim())new vm.Script(scripts[i][1],{filename:item.id+'#'+i});
 console.log('PASS',item.id,'preserved original; 24 variants / 360 exercises; adapter JS valid');
}

const ui=read('assets/lsh/v4/reference-pilots.js');
new vm.Script(ui,{filename:'reference-pilots.js'});

const validatorBlock=ui.match(/function isValid\(v\)\{[\s\S]*?\n\}/);
assert.ok(validatorBlock,'Catalog entry validation function missing');
const validateEntry=vm.runInNewContext('('+validatorBlock[0]+')',{
 SKILLS:{konverzace:'Conversation Lab',cteni:'Reading Lab',poslech:'Listening Lab'},
 LANGS:{en:'EN',es:'ES',de:'DE',fr:'FR'},
 LEVELS:['A1','A2','B1','B2','C1','C2']
});
for(const entry of inventory.entries)
 assert.ok(validateEntry(entry),'Pilot entry fails actual browser schema: '+entry.id);
console.log('PASS',inventory.entries.length,'public catalog records validate');

for(const feature of ['function refreshShare()','function saveHtml()',"url.searchParams.set('zamek','1')",
 "url.searchParams.set('practice','1')",'LSH_OFFLINE_QS']){
 assert.ok(ui.includes(feature),'Missing catalog feature: '+feature);
}

/* Verify every pilot URL variant without trusting a card's advertised label. */
const block=ui.match(/function urlOf\(entry,mode,lang,level\)\{[\s\S]*?\n\}/);
assert.ok(block,'Missing URL builder');
const makeUrl=vm.runInNewContext('const ROOT="/zkusebni/"; const location={origin:"https://ghrab-jazyky.github.io"};('+block[0]+')',{URL,Error});
let checkedVariants=0;
for(const entry of inventory.entries){
 const free=new URL(makeUrl(entry,'free',entry.defaultLanguage,entry.defaultLevel));
 assert.equal(free.searchParams.get('practice'),'1');
 assert.equal(free.searchParams.has('zamek'),false);
 assert.equal(free.searchParams.has('level'),false);
 for(const language of entry.languages){
  for(const level of entry.levels){
   const target=new URL(makeUrl(entry,'fixed',language,level));
   assert.equal(target.origin,'https://ghrab-jazyky.github.io');
   assert.equal(target.pathname,'/zkusebni/'+entry.studentPath);
   assert.equal(target.searchParams.get('lang'),language);
   assert.equal(target.searchParams.get('level'),level);
   assert.equal(target.searchParams.get('zamek'),'1');
   assert.equal(target.searchParams.get('practice'),'1');
   checkedVariants++;
  }
 }
 if(entry.skill==='poslech')assert.throws(()=>makeUrl(entry,'fixed','es','B2'));
}
assert.equal(checkedVariants,inventory.entries.reduce((a,e)=>a+e.languages.length*e.levels.length,0));
assert.equal(checkedVariants,618,'Expected 618 checked fixed URLs');
console.log('PASS',checkedVariants,'fixed URLs + 28 free URLs across pilots');

const doc=read('reference-karty/index.html');
for(const required of ['id="refMode"','id="refShareLang"','id="refShareLevel"','id="refSaveHtml"','id="refQr"']){
 assert.ok(doc.includes(required),'Missing dialog control: '+required);
}
console.log('PASS R5H pilot catalog: 3 references, 19 Conversation originals, 2 Listening URL bridges, 4 Reading URL bridges');
