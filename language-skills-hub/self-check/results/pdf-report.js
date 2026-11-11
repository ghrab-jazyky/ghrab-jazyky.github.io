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
  check(report.questions.every(q=>q&&typeof q.correct==='boolean'&&
   Number.isInteger(q.awarded)&&[0,1].includes(q.awarded)&&
   typeof q.question==='string'&&
   typeof q.correctAnswer==='string'),'Invalid detailed answers.');
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
   'Navrh znamky: '+report.summary.grade,
   'Vytvoreno: '+new Date(report.generatedAt||Date.now()).toISOString()
  ];
  if(report.skill==='reading'&&report.readingText){
   lines.push('','VYCHOZI CTENY TEXT',clean(report.readingText));
  }
  report.questions.forEach((q,i)=>{
   lines.push('',(i+1)+'. '+clean(q.question),
    'Odpoved studenta: '+clean(q.studentAnswer||'Bez odpovedi'),
    'Spravna odpoved: '+clean(q.correctAnswer),
    'Vysledek: '+(q.correct?'SPRAVNE':'CHYBNE')+' | '+q.awarded+'/1 bod');
   if(q.explanation)lines.push('Vysvetleni: '+clean(q.explanation));
  });
  if(report.reflection){
   lines.push('','VOLITELNA REFLEXE (NEHODNOCENO)',clean(report.reflection));
  }
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
 function renderPages(report,documentRef){
  normalize(report);
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
   font(9,700);ctx.fillStyle='#31546e';
   ctx.fillText('GYMNAZIUM OSTRAVA-HRABUVKA  /  LANGUAGE SKILLS HUB',MARGIN,30);
   y=51;
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
  report.questions.forEach((q,i)=>{
   reserve(99);rule();
   paragraph(null,(i+1)+'. '+clean(q.question),
    {size:10.5,weight:700,leading:15,after:5});
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
 function generate(report,doc){
  return pdfBytes(renderPages(report,doc||host.document));
 }
 function download(report,doc){
  const documentRef=doc||host.document;
  const pdf=generate(report,documentRef);
  const objectUrl=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));
  const stamp=new Date(report.generatedAt||Date.now()).toISOString().replace(/[:.]/g,'-');
  const name='lsh-'+report.skill+'-'+clean(report.topicId).replace(/[^a-z0-9_-]/gi,'-')+
   '-'+clean(report.level).toLowerCase()+'-'+stamp+'.pdf';
  const a=documentRef.createElement('a');a.href=objectUrl;a.download=name;a.hidden=true;
  documentRef.body.appendChild(a);
  try{a.click()}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),2000)}
  return name;
 }
 const api=Object.freeze({normalize,fullText,copy,renderPages,pdfBytes,generate,download});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else host.LSHPdfReport=api;
})(typeof window!=='undefined'?window:this);
