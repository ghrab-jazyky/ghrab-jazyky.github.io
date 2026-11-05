#!/usr/bin/env node
/*
 * Reading Lab v3.4 — conservative, read-only student HTML preflight.
 * Does NOT execute untrusted HTML or JavaScript. Does NOT infer pedagogical PASS
 * from the mere presence of strings. It never authorizes a release.
 *
 * node zkusebni/tools/reading-v34-preflight.cjs "/path/card.html"
 */
'use strict';
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');

const TARGET='Reading Lab MASTER PROMPT v3.4 (2026-11-05)';
const MAX_BYTES=75*1024*1024;
function attr(attrs,name){
  const re=new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(?:"([^"]*)"|\\x27([^\\x27]*)\\x27|([^\\s>]+))','i');
  const m=attrs.match(re);
  return m?(m[1]??m[2]??m[3]):null;
}
function tags(html,tag){
  return [...html.matchAll(new RegExp('<'+tag+'\\b([^>]*)>','gi'))].map(m=>m[1]);
}
function check(id,status,detail,section){
  return {id,status,detail,section};
}
function run(html,info={}){
  if(typeof html!=='string')throw new TypeError('HTML text required');
  const checks=[];
  const add=(id,status,detail,section)=>checks.push(check(id,status,detail,section));
  const bytes=Buffer.byteLength(html,'utf8');
  const hash=crypto.createHash('sha256').update(html,'utf8').digest('hex');
  const doctype=/<!doctype\s+html\b/i.test(html);
  const hasDoc=/<html\b[^>]*>[\s\S]*<body\b[^>]*>[\s\S]*<\/body>[\s\S]*<\/html\s*>/i.test(html);
  add('html-document',doctype&&hasDoc?'PASS':'FAIL',
    'DOCTYPE html and a complete HTML/body structure', '§12');
  add('utf8',/<meta\b[^>]*charset\s*=\s*["']?utf-8\b/i.test(html)?'PASS':'FAIL',
    'UTF-8 meta charset is required for EN/ES/DE/FR', '§12');
  const v=tags(html,'meta').find(a=>(attr(a,'name')||'').toLowerCase()==='viewport');
  const vp=v?attr(v,'content')||'':'';
  const zoomBlocked=/user-scalable\s*=\s*(?:no|0)|maximum-scale\s*=\s*1(?:\D|$)/i.test(vp);
  add('zoom-and-viewport',(!v||zoomBlocked)?'FAIL':'PASS',
    !v?'No viewport meta found':zoomBlocked?'Browser zoom is explicitly restricted':'Viewport permits browser zoom','§8');
  const js=tags(html,'script');
  const css=tags(html,'style');
  add('inline-javascript',js.length&&js.some(a=>attr(a,'src')===null)?'PASS':'REVIEW',
    'Inline scripts found: '+js.filter(a=>attr(a,'src')===null).length,
    '§12');
  add('inline-css',css.length?'PASS':'REVIEW','Inline style blocks found: '+css.length,'§12');
  const external=[];
  for(const a of js){const src=attr(a,'src');if(src!==null)external.push('script src='+src.slice(0,160));}
  for(const a of tags(html,'link')){
    const rel=(attr(a,'rel')||'').toLowerCase().split(/\s+/);
    if(rel.includes('stylesheet'))external.push('stylesheet href='+(attr(a,'href')||'<missing>').slice(0,160));
  }
  for(const tag of ['img','audio','video','source','iframe','object','embed']){
    for(const a of tags(html,tag)){
      const src=attr(a,tag==='object'?'data':'src');
      if(tag==='iframe'||tag==='object'||tag==='embed')
        external.push(tag+' element cannot be a standalone asset');
      else if(src&&!/^(?:data:|blob:|#)/i.test(src))
        external.push(tag+' src='+src.slice(0,160));
    }
  }
  if(/@import\s+(?:url\()?/i.test(html))external.push('CSS @import');
  if(/url\(\s*["']?\s*(?:https?:\/\/|\/\/)/i.test(html))external.push('remote CSS url()');
  add('self-contained-assets',external.length?'FAIL':'PASS',
    external.length?external.slice(0,20).join('; '):'No external scripts, stylesheets or media references detected','§12');
  add('no-remote-fonts-cdn',/(?:<script\b[^>]*src\s*=|<link\b[^>]*stylesheet[^>]*href\s*=)/i.test(html)&&external.length?'FAIL':'PASS',
    'External dependencies not allowed in standalone offline card','§9, §12');
  const teacherLeaks=[];
  for(const a of tags(html,'a')){
    const href=attr(a,'href');
    if(href&&/\/(?:teacher[-_]?key|ucitel[-_]?sky[-_]?klic|teacher[-_]?catalog|admin\/keys|keys\/teacher)\b/i.test(href))
      teacherLeaks.push(href.slice(0,160));
  }
  add('student-teacher-boundary',teacherLeaks.length?'FAIL':'PASS',
    teacherLeaks.length?'Suspicious teacher-facing student link(s): '+teacherLeaks.join('; '):
      'No obvious teacher-key or protected catalog links in anchor tags','§12A');
  // String presence is NOT functional proof: never mark these as PASS by grep alone.
  const hints=[
    ['24-variants','en,es,de,fr','§4, §5, §13A'],
    ['reading-tabs','tablist, tabpanel, and 3/3/4/6/7/7 strategies','§6, §13A'],
    ['360-tasks','360 unique tasks and stable evidence anchors','§6, §7, §13A'],
    ['dictionary-off','default dictionary OFF and 100% local coverage','§8, §9, §13'],
    ['dictionary-identity','IndexedDB reading-lab-vocabulary, backup reading-lab-vocabulary-backup and v1.2 shared module','§12A'],
    ['answer-session-isolation','topicId- and version-scoped sessionStorage with in-memory fallback','§8, §10'],
    ['first-attempt','first attempt captured on CHECK, not on input or Clear','§8, §10'],
    ['evidence-navigation','exact evidence anchors, numbered paragraphs and return to question','§7, §8'],
    ['safe-student-content','no telemetry, no personal identifiers, no external requests and no executable injected input','§10'],
    ['english-default','English on every fresh open unless URL lang= explicitly selects another','§1, §8'],
    ['pedagogical-qa','teacher key consistency, CEFR, all evidence, blind tests by tab and device coverage','§13']
  ];
  for(const [id,expectation,section] of hints){
    const indicators=({
      'dictionary-identity':['reading-lab-vocabulary','reading-lab-vocabulary-backup'],
      'answer-session-isolation':['sessionStorage','topicId'],
      'first-attempt':['firstAttempt'],
      'evidence-navigation':['evidence'],
      'english-default':['en'],
      'reading-tabs':['tablist','tabpanel']
    })[id]||[];
    const found=indicators.filter(word=>html.includes(word));
    const absent=indicators.filter(word=>!html.includes(word));
    add(id,'REVIEW',
      expectation+' — static hints found: '+(found.join(', ')||'none')+
      (absent.length?'; not found: '+absent.join(', '):'')+
      '. Presence/absence alone does not establish runtime conformance.',
      section);
  }
  const counts={PASS:0,FAIL:0,REVIEW:0};
  for(const c of checks)counts[c.status]++;
  return {
    tool:'LSH E4B read-only preflight v1',standard:TARGET,
    file:info.file||null,sha256:hash,bytes,checks,counts,
    validationKind:'STATIC_ONLY',actualReferenceExecuted:false,
    verdict:counts.FAIL?'STATIC_FAILURE':'STATIC_PRECHECK_ONLY',
    releaseDecision:'NO_GO',
    disclaimer:'Never publish, merge or label a real Reading Lab card compliant based on this scanner. Manual and browser QA of a real approved HTML, secure key storage, and teacher approval remain mandatory.'
  };
}
function main(){
  if(process.argv.length!==3){
    process.stderr.write('Usage: node reading-v34-preflight.cjs path/to/Reading_Lab_Card.html\n');
    process.exitCode=2;return;
  }
  const file=path.resolve(process.argv[2]);
  try{
    const stat=fs.statSync(file);
    if(!stat.isFile()||stat.size>MAX_BYTES)throw new Error('File too large or not regular');
    const html=fs.readFileSync(file,'utf8');
    const report=run(html,{file:path.basename(file)});
    process.stdout.write(JSON.stringify(report,null,2)+'\n');
    if(report.counts.FAIL)process.exitCode=1;
  }catch(e){
    process.stderr.write('Preflight failed: '+e.message+'\n');
    process.exitCode=2;
  }
}
if(require.main===module)main();
else module.exports={run,attr,tags,MAX_BYTES};
