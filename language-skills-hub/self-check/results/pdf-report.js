/* R34: fully local, readable PDF dossier of the entire submitted test.
 * Raster PDF pages keep diacritics and long student answers legible without
 * third-party fonts, network services or CDN scripts. No student identity.
 * The output is a student-controlled, unverified document. */
(function(host){
 'use strict';
 const W=595,H=842,SCALE=2,MARGIN=43,RIGHT=W-MARGIN,BOTTOM=794;
 const encoder=new TextEncoder();
 const clean=s=>String(s===undefined||s===null?'':s)
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'')
  .slice(0,12000);
 const labeledOptions=items=>items.map((item,i)=>{
  const label=String.fromCharCode(65+i)+'. ';
  const value=clean(item);
  return value.startsWith(label)?value:label+value;
 });
 const SECURITY_LABELS=Object.freeze({
  hidden:'Stránka byla skryta nebo došlo k přepnutí aplikace',
  'fullscreen-exit':'Opuštění režimu celé obrazovky',
  'fullscreen-denied':'Režim celé obrazovky nebyl dostupný',
  'focus-loss':'Ztráta fokusu testového okna',
  'viewport-change':'Výrazná změna velikosti okna',
  'restricted-viewport':'Omezené nebo rozdělené okno',
  clipboard:'Operace se schránkou',
  'context-menu':'Kontextová nabídka nebo chráněná klávesová zkratka',
  'page-leave':'Opuštění testové stránky',
  reload:'Obnovení stránky během testu',
  'concurrent-tab':'Souběžný aktivní test v jiné záložce',
  'print-attempt':'Pokus o tisk nebo náhled tisku',
  'teacher-resume':'Test znovu zpřístupněn učitelem'
 });
 const safeTime=t=>Number.isSafeInteger(t)&&t>=0&&t<=8640000000000000;
 function securityFromAttempt(state){
  if(!state||!safeTime(state.startedAt))return {
   monitored:false,tabMonitoringAvailable:false,startedAt:null,events:[]
  };
  const startedAt=state.startedAt,events=[];
  if(Array.isArray(state.incidents))for(const item of state.incidents.slice(0,40)){
   if(item&&Object.hasOwn(SECURITY_LABELS,item.kind)&&
    item.kind!=='teacher-resume'&&safeTime(item.at)){
    events.push({kind:item.kind,at:item.at});
   }
  }
  if(Array.isArray(state.resumptions))for(const at of state.resumptions.slice(0,40)){
   if(safeTime(at))events.push({kind:'teacher-resume',at});
  }
  // Stable ordering for equal timestamps; preserve the local sequence.
  events.sort((a,b)=>a.at-b.at);
  // R64: identify the attempt so a changed limit or a different link is visible to the teacher.
  const code=typeof state.attemptCode==='string'&&/^[a-z0-9_-]{6,40}$/i.test(state.attemptCode)?state.attemptCode:null;
  const lim=Number.isSafeInteger(state.limitMinutes)&&state.limitMinutes>0&&state.limitMinutes<=600?state.limitMinutes:null;
  const asked=Number.isSafeInteger(state.requestedMinutes)&&state.requestedMinutes>0&&state.requestedMinutes<=600?state.requestedMinutes:null;
  return {
   monitored:true,tabMonitoringAvailable:state.tabMonitoringAvailable===true,
   startedAt,events,attemptCode:code,limitMinutes:lim,requestedMinutes:asked,
   submittedAt:safeTime(state.submittedAt)?state.submittedAt:null
  };
 }
 function securityDetails(report){
  const s=report.security;
  if(!s||!s.monitored)return [
   'Bezpečnostní dohled: TEST BEZ DOHLEDU – odkaz neobsahoval časový limit, zámek nebyl aktivní.',
   'Absence záznamu neprokazuje, že k incidentu nedošlo.'
  ];
  const count=s.events.filter(e=>e.kind!=='teacher-resume').length;
  const out=[
   'Zdroj: lokální paměť prohlížeče studenta. Záznam není nezávisle ověřený.',
   'Detekce souběžných záložek: '+(s.tabMonitoringAvailable?'rozhraní dostupné':'nedostupná'),
   'Zaznamenané zámky: '+count+'; zaznamenaná odemčení: '+
    s.events.filter(e=>e.kind==='teacher-resume').length
  ];
  const stamp=t=>new Date(t).toLocaleString('cs-CZ');
  if(s.attemptCode)out.push('Kód pokusu: '+s.attemptCode+' (jeden pokus na zařízení)');
  if(s.limitMinutes)out.push('Časový limit: '+s.limitMinutes+' min'+
   (s.requestedMinutes&&s.requestedMinutes!==s.limitMinutes?
    ' – POZOR: adresa při tomto otevření žádala '+s.requestedMinutes+' min; platí limit prvního otevření':''));
  out.push('Zahájeno (hodiny zařízení, neověřeno): '+stamp(s.startedAt)+
   (s.submittedAt?'; odevzdáno: '+stamp(s.submittedAt):''));
  if(s.events.length===0)out.push('Nejsou zaznamenány události; to není důkaz bezchybného průběhu.');
  else for(const item of s.events){
   const seconds=Math.max(0,Math.floor((item.at-s.startedAt)/1000));
   const duration=String(Math.floor(seconds/60)).padStart(2,'0')+':'+
    String(seconds%60).padStart(2,'0');
   out.push(duration+' | '+new Date(item.at).toLocaleString('cs-CZ')+
    ' | '+SECURITY_LABELS[item.kind]);
  }
  return out;
 }
 const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
 function check(ok,msg){if(!ok)throw new Error(msg)}
 function normalize(report){
  check(report&&typeof report==='object'&&
   ['reading','listening'].includes(report.skill)&&
   Array.isArray(report.questions)&&report.questions.length>=1&&report.questions.length<=150,
   'Invalid complete test report.');
  check(report.summary&&Number.isInteger(report.summary.grade)&&
   report.summary.grade>=1&&report.summary.grade<=5&&
   Number.isInteger(report.summary.earned)&&
   Number.isInteger(report.summary.max)&&report.summary.max>0&&
   report.summary.earned<=report.summary.max,'Invalid grade data.');
  check(finite(report.summary.percent,0,100),'Invalid percentage.');
  if(report.summary.roundedPercent!==undefined)
   check(Number.isInteger(report.summary.roundedPercent)&&
    finite(report.summary.roundedPercent,0,100),'Invalid grading percentage.');
  check(report.questions.every(q=>q&&typeof q.correct==='boolean'&&
   Number.isInteger(q.awarded)&&[0,1].includes(q.awarded)&&
   typeof q.question==='string'&&
   typeof q.correctAnswer==='string'),'Invalid detailed answers.');
  if(report.security!==undefined){
   const sec=report.security;
   check(sec&&typeof sec==='object'&&typeof sec.monitored==='boolean'&&
    typeof sec.tabMonitoringAvailable==='boolean'&&
    (sec.startedAt===null||safeTime(sec.startedAt))&&
    Array.isArray(sec.events)&&sec.events.length<=80&&
    sec.events.every(e=>e&&Object.hasOwn(SECURITY_LABELS,e.kind)&&safeTime(e.at)),
    'Invalid local security events.');
  }
  return report;
 }
 function fullText(report){
  normalize(report);
  const lines=[
   'LANGUAGE SKILLS HUB | KOMPLETNI PROTOKOL TESTU',
   'NEOVERENY MISTNI VYSLEDEK - potvrzeni ucitelem je nezbytne',
   'Laborator: '+(report.skill==='reading'?'Reading Lab':'Listening Lab'),
   'Tema: '+clean(report.topic),
   'Jazyk / uroven: '+clean(report.language).toUpperCase()+' / '+clean(report.level),
   'Body: '+report.summary.earned+' / '+report.summary.max,
   'Uspesnost: '+report.summary.percent+' %',
   ...(Number.isInteger(report.summary.roundedPercent)?
    ['Pro znamku matematicky zaokrouhleno na: '+report.summary.roundedPercent+' %']:[]),
   'Navrh znamky: '+report.summary.grade,
   'Vytvoreno: '+new Date(report.generatedAt||Date.now()).toISOString()
  ];
  if(report.skill==='reading'&&report.readingText){
   lines.push('','VYCHOZI CTENY TEXT',clean(report.readingText));
  }
  report.questions.forEach((q,i)=>{
   lines.push('',(i+1)+'. '+clean(q.question));
   if(Array.isArray(q.options)&&q.options.length){
    lines.push('Nabidka odpovedi:');
    labeledOptions(q.options).forEach(option=>lines.push(option));
   }
   lines.push('Odpoved studenta: '+clean(q.studentAnswer||'Bez odpovedi'),
    'Spravna odpoved: '+clean(q.correctAnswer),
    'Vysledek: '+(q.correct?'SPRAVNE':'CHYBNE')+' | '+q.awarded+'/1 bod');
   if(q.explanation)lines.push('Vysvetleni: '+clean(q.explanation));
  });
  if(report.reflection){
   lines.push('','VOLITELNA REFLEXE (NEHODNOCENO)',clean(report.reflection));
  }
  lines.push('','BEZPECNOSTNI PROTOKOL (ORIENTACNI ZAZNAM)',...securityDetails(report));
  lines.push('','Tento soubor muze student upravit; nepotvrzuje identitu ani autentičnost vysledku.');
  return lines.join('\n');
 }
 async function copy(report,board,doc){
  const text=fullText(report),clipboard=board||(host.navigator&&host.navigator.clipboard);
  if(clipboard&&typeof clipboard.writeText==='function'){
   try{await clipboard.writeText(text);return true}catch(_){}
  }
  const documentRef=doc||host.document;
  check(documentRef&&documentRef.body&&typeof documentRef.execCommand==='function',
   'Clipboard unavailable.');
  const t=documentRef.createElement('textarea');
  t.value=text;t.readOnly=true;t.style.position='fixed';t.style.left='-10000px';
  documentRef.body.appendChild(t);
  try{t.focus();t.select();check(documentRef.execCommand('copy')===true,'Copy failed.')}
  finally{t.remove()}
  return true;
 }
 function renderPages(report,documentRef,schoolLogo){
  normalize(report);
  check(schoolLogo&&schoolLogo.naturalWidth>0&&schoolLogo.naturalHeight>0,'Official school logo not loaded.');
  check(documentRef&&typeof documentRef.createElement==='function','No document canvas');
  const canvas=documentRef.createElement('canvas');
  canvas.width=W*SCALE;canvas.height=H*SCALE;
  const ctx=canvas.getContext('2d');
  check(ctx&&typeof canvas.toDataURL==='function','Canvas unavailable');
  ctx.scale(SCALE,SCALE);
  let y=0,pageNo=0,images=[];
  const ink='#1b2b3c',light='#557083',green='#14663a',red='#a32b2b';
  function font(size=10,weight=400){ctx.font=weight+' '+size+'px Arial, sans-serif'}
  function lines(value,maxWidth,size=10,weight=400){
   font(size,weight);
   const out=[];
   for(const para of clean(value).split(/\r?\n/)){
    if(!para){out.push('');continue}
    let line='';
    for(const word of para.split(/\s+/)){
     if(!word)continue;
     const trial=line?line+' '+word:word;
     if(ctx.measureText(trial).width<=maxWidth){line=trial;continue}
     if(line){out.push(line);line=''}
     if(ctx.measureText(word).width<=maxWidth){line=word;continue}
     let part='';
     for(const ch of word){
      if(part&&ctx.measureText(part+ch).width>maxWidth){out.push(part);part=''}
      part+=ch;
     }
     line=part;
    }
    out.push(line);
   }
   return out;
  }
  function footer(){
   ctx.fillStyle='#e7eff5';ctx.fillRect(MARGIN,813,RIGHT-MARGIN,1);
   font(8,400);ctx.fillStyle=light;
   ctx.fillText('Language Skills Hub | neovereny mistni protokol | bez identifikace zaka',MARGIN,827);
   const label=String(pageNo);ctx.fillText(label,RIGHT-ctx.measureText(label).width,827);
  }
  function startPage(){
   pageNo++;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
   ctx.fillStyle='#1b425e';ctx.fillRect(0,0,W,9);
   // Exact canonical GO-heart school logo from AI Studio GHRAB.
   // Draw as a square: never stretch or recolor the original school mark.
   ctx.drawImage(schoolLogo,MARGIN-7,8,60,60);
   font(10,700);ctx.fillStyle='#244965';
   ctx.fillText('Gymnázium, Ostrava-Hrabůvka',MARGIN+72,35);
   font(8,400);ctx.fillStyle='#557083';
   ctx.fillText('LANGUAGE SKILLS HUB  |  VÝSLEDKOVÝ PROTOKOL',MARGIN+72,50);
   y=76;
  }
  function flush(){
   footer();
   const data=canvas.toDataURL('image/jpeg',.86);
   check(data.startsWith('data:image/jpeg;base64,'),'JPEG encoding failed.');
   const binary=atob(data.split(',')[1]),bytes=new Uint8Array(binary.length);
   for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
   images.push(bytes);
  }
  function newPage(){flush();startPage()}
  function reserve(height){
   if(y+height>BOTTOM)newPage();
  }
  function rule(){
   reserve(14);ctx.fillStyle='#dfe7ed';ctx.fillRect(MARGIN,y,RIGHT-MARGIN,1);y+=13;
  }
  function paragraph(label,value,opts={}){
   const size=opts.size||10,leading=opts.leading||14,color=opts.color||ink;
   const weight=opts.weight||400,max=RIGHT-MARGIN;
   const layout=lines(value,max,size,weight);
   if(label){
    reserve(19);font(9,700);ctx.fillStyle=light;ctx.fillText(clean(label),MARGIN,y+11);y+=17;
   }
   for(const line of layout){
    reserve(leading);
    font(size,weight);ctx.fillStyle=color;
    ctx.fillText(line,MARGIN,y+size);
    y+=leading;
   }
   y+=opts.after===undefined?6:opts.after;
  }
  startPage();
  paragraph(null,'VÝSLEDKOVÝ PROTOKOL TESTU',{size:20,weight:700,leading:26,color:'#16344e',after:3});
  paragraph(null,report.skill==='reading'?'READING LAB':'LISTENING LAB',
   {size:10,weight:700,color:light,after:13});
  paragraph('TÉMA',report.topic,{size:13,weight:700,leading:17,after:7});
  paragraph('JAZYK / ÚROVEŇ',clean(report.language).toUpperCase()+' / '+clean(report.level),{after:5});
  paragraph('CELKOVÝ VÝSLEDEK',
   'BODY '+report.summary.earned+' / '+report.summary.max+
   '     ÚSPĚŠNOST '+report.summary.percent+' %     NÁVRH ZNÁMKY '+report.summary.grade,
   {weight:700,size:11,leading:16,after:5});
  if(Number.isInteger(report.summary.roundedPercent))
   paragraph(null,'PRO ZNÁMKU ZAOKROUHLENO NA '+report.summary.roundedPercent+
    ' % (0,5 NAHORU)',{size:9,leading:14,after:7});
  const stamp=new Date(report.generatedAt||Date.now()).toLocaleString('cs-CZ');
  paragraph('VYTVOŘENO',stamp,{size:9,after:6});
  paragraph(null,'UPOZORNĚNÍ: Výsledek vytvořilo studentské zařízení. Identita studenta a pravost obsahu nejsou technicky ověřené. Učitel rozhoduje o případném zápisu známky.',
   {size:9,leading:13,color:'#8c4b13',after:17});
  if(report.skill==='reading'&&report.readingText){
   paragraph(null,'VÝCHOZÍ ČTENÝ TEXT',{size:12,weight:700,color:'#16344e',after:11});
   paragraph(null,report.readingText,{size:10,leading:15,after:20});
  }
  paragraph(null,'PŘEHLED VŠECH ÚLOH A ODPOVĚDÍ',
   {size:12,weight:700,color:'#16344e',after:12});
  const paraHeight=(text,size,leading,after,label=false,weight=400)=>
   (label?17:0)+lines(text,RIGHT-MARGIN,size,weight).length*leading+after;
  const questionHeight=q=>{
   let h=13+paraHeight((q.question||''),10.5,15,5,false,700);
   if(Array.isArray(q.options)&&q.options.length)
    h+=paraHeight(labeledOptions(q.options).join('\n'),9,13,6,true);
   h+=paraHeight(q.studentAnswer||'Bez odpovědi',10,14,5,true);
   h+=paraHeight(q.correctAnswer,10,14,5,true);
   h+=paraHeight((q.correct?'SPRÁVNĚ':'CHYBNĚ')+' '+q.awarded+' / 1 bod',10,14,9,false,700);
   if(q.explanation)h+=paraHeight(q.explanation,9,13,8,true);
   return h+10;
  };
  report.questions.forEach((q,i)=>{
   reserve(Math.min(BOTTOM-55,questionHeight(q)));rule();
   paragraph(null,(i+1)+'. '+clean(q.question),
    {size:10.5,weight:700,leading:15,after:5});
   if(Array.isArray(q.options)&&q.options.length){
    paragraph('NABÍZENÉ ODPOVĚDI',
     labeledOptions(q.options).join('\n'),
     {size:9,leading:13,after:6});
   }
   paragraph('ODPOVĚĎ STUDENTA',q.studentAnswer||'Bez odpovědi',{size:10,leading:14,after:5});
   paragraph('SPRÁVNÁ ODPOVĚĎ',q.correctAnswer,{size:10,leading:14,after:5});
   paragraph(null,(q.correct?'SPRÁVNĚ':'CHYBNĚ')+'    '+q.awarded+' / 1 bod',
    {size:10,weight:700,color:q.correct?green:red,after:9});
   if(q.explanation)paragraph('VYSVĚTLENÍ',q.explanation,
    {size:9,leading:13,color:light,after:8});
  });
  if(report.reflection){
   rule();
   paragraph(null,'DOPLŇUJÍCÍ REFLEXE STUDENTA (NEHODNOCENO)',
    {size:11,weight:700,color:'#16344e',after:10});
   paragraph(null,report.reflection,{size:10,leading:14,after:10});
  }
  rule();
  paragraph(null,'BEZPEČNOSTNÍ PROTOKOL TESTU',
   {size:12,weight:700,color:'#16344e',after:8});
  for(const line of securityDetails(report)){
   paragraph(null,line,{size:9,leading:13,color:light,after:3});
  }
  paragraph(null,'POZOR: Záznam vznikl jen v prohlížeči studenta. Nelze jej považovat za nezfalšovatelný důkaz podvádění ani důkaz absence incidentů.',
   {size:9,leading:13,color:'#8c4b13',after:12});
  rule();
  paragraph(null,'PODKLAD PRO KONZULTACI S UČITELEM / ZÁKONNÝM ZÁSTUPCEM',
   {size:10,weight:700,after:5});
  paragraph(null,'PDF neobsahuje jméno ani e-mail studenta. Určení odesílatele probíhá mimo tento dokument prostřednictvím školního e-mailu.',
   {size:9,leading:13,color:light,after:5});
  flush();
  return images;
 }
 function pdfBytes(images){
  check(Array.isArray(images)&&images.length>0&&images.length<=100,'Invalid PDF pages');
  const objs=new Map();
  const pages=images.map((_,i)=>3+i*3);
  objs.set(1,encoder.encode('<< /Type /Catalog /Pages 2 0 R >>'));
  objs.set(2,encoder.encode('<< /Type /Pages /Kids ['+pages.map(n=>n+' 0 R').join(' ')+'] /Count '+images.length+' >>'));
  images.forEach((img,i)=>{
   const n=pages[i],stream='q\n'+W+' 0 0 '+H+' 0 0 cm\n/Im1 Do\nQ\n';
   const streamBytes=encoder.encode(stream);
   objs.set(n,encoder.encode('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+
    '] /Resources << /XObject << /Im1 '+(n+2)+' 0 R >> >> /Contents '+(n+1)+' 0 R >>'));
   objs.set(n+1,[encoder.encode('<< /Length '+streamBytes.length+' >>\nstream\n'),
    streamBytes,encoder.encode('endstream')]);
   objs.set(n+2,[encoder.encode('<< /Type /XObject /Subtype /Image /Width '+(W*SCALE)+
    ' /Height '+(H*SCALE)+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+img.length+' >>\nstream\n'),
    img,encoder.encode('\nendstream')]);
  });
  const chunks=[],offsets=[0];let count=0;
  const add=bytes=>{chunks.push(bytes);count+=bytes.length};
  const bytes=s=>encoder.encode(s);
  add(bytes('%PDF-1.4\n'));
  const max=2+images.length*3;
  for(let n=1;n<=max;n++){
   offsets[n]=count;add(bytes(n+' 0 obj\n'));
   const obj=objs.get(n);
   if(Array.isArray(obj))for(const chunk of obj)add(chunk);
   else add(obj);
   add(bytes('\nendobj\n'));
  }
  const xref=count;
  add(bytes('xref\n0 '+(max+1)+'\n0000000000 65535 f \n'));
  for(let n=1;n<=max;n++)add(bytes(String(offsets[n]).padStart(10,'0')+' 00000 n \n'));
  add(bytes('trailer\n<< /Size '+(max+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n'));
  const pdf=new Uint8Array(count);let off=0;
  for(const chunk of chunks){pdf.set(chunk,off);off+=chunk.length}
  return pdf;
 }
 async function loadSchoolLogo(documentRef){
  check(documentRef&&documentRef.baseURI&&documentRef.defaultView,'Document required for official school logo.');
  const ImageCtor=documentRef.defaultView.Image;
  check(typeof ImageCtor==='function','Image decoder unavailable.');
  const img=new ImageCtor();
  img.src=new URL('../../assets/school-logo.png',documentRef.baseURI).href;
  if(typeof img.decode==='function')await img.decode();
  else await new Promise((resolve,reject)=>{
   if(img.complete&&img.naturalWidth){resolve();return}
   img.onload=resolve;img.onerror=()=>reject(new Error('School logo unavailable.'));
  });
  check(img.naturalWidth===384&&img.naturalHeight===384,
   'Official school logo size mismatch.');
  return img;
 }
 async function generate(report,doc){
  const d=doc||host.document;
  const image=await loadSchoolLogo(d);
  return pdfBytes(renderPages(report,d,image));
 }
 async function download(report,doc){
  const documentRef=doc||host.document;
  const pdf=await generate(report,documentRef);
  const objectUrl=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));
  const stamp=new Date(report.generatedAt||Date.now()).toISOString().replace(/[:.]/g,'-');
  const name='lsh-'+report.skill+'-'+clean(report.topicId).replace(/[^a-z0-9_-]/gi,'-')+
   '-'+clean(report.level).toLowerCase()+'-'+stamp+'.pdf';
  const a=documentRef.createElement('a');a.href=objectUrl;a.download=name;a.hidden=true;
  documentRef.body.appendChild(a);
  try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),2000)}
  return name;
 }
 const api=Object.freeze({normalize,securityFromAttempt,securityDetails,fullText,copy,renderPages,pdfBytes,loadSchoolLogo,generate,download});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else host.LSHPdfReport=api;
})(typeof window!=='undefined'?window:this);
