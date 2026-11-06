'use strict';
// Synthetic-only checks. No genuine Reading source, student data or teacher key is used.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const core=require('../assets/lsh/v2/core.js');
const scanner=require('../assets/lsh/v3/qr-scanner.js');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/manifest.json'),'utf8'));
const origin='https://ghrab-jazyky.github.io',base='/zkusebni/';

function makeFixture(skill,slug,shortCode,approved){
  const proto=manifest.topics.find(t=>t.skill==='konverzace');
  return {...JSON.parse(JSON.stringify(proto)),id:(skill==='cteni'?'rl-':'ll-')+slug,
    skill,slug,shortCode,cardPath:skill+'/'+slug+'/',
    title:'Synthetic fixture: '+slug,summary:'Only an in-memory future-release test.',
    version:'synthetic-only',status:approved?'PUBLIKOVANO':'ROZPRACOVANO',
    publishedAt:approved?'2026-11-06T07:00:00Z':null,demo:false};
}

test('R3A: current pilot keeps the Reading demo isolated; never lists it in the unified selector',()=>{
  core.validateManifest(manifest);
  const all=core.selectCatalogTopics(manifest);
  const reading=core.selectCatalogTopics(manifest,'cteni');
  assert.equal(all.filter(t=>t.skill==='cteni').length,0);
  assert.equal(reading.length,1);
  assert.ok(reading.every(t=>t.demo===true));
  assert.equal(core.isEntryShareable(reading[0],manifest),true);
});

test('R3A: future independently approved Reading/Listening work in both catalogs and QR without leaking drafts',()=>{
  const m=structuredClone(manifest);
  const reading=makeFixture('cteni','synthetic-approved','R3AA',true);
  const listening=makeFixture('poslech','synthetic-approved','P3AA',true);
  const readingDraft=makeFixture('cteni','synthetic-draft','R3AB',false);
  const listeningDraft=makeFixture('poslech','synthetic-draft','P3AB',false);
  m.topics.push(reading,listening,readingDraft,listeningDraft);
  core.validateManifest(m);
  const selected=core.selectCatalogTopics(m);
  assert.ok(selected.some(t=>t.id===reading.id));
  assert.ok(selected.some(t=>t.id===listening.id));
  assert.ok(!selected.some(t=>t.id===readingDraft.id||t.id===listeningDraft.id||t.demo));
  assert.deepEqual(core.selectCatalogTopics(m,'cteni').map(t=>t.id),[reading.id]);
  assert.deepEqual(core.selectCatalogTopics(m,'poslech').map(t=>t.id),[listening.id]);
  const oldDemo=m.topics.find(t=>t.skill==='cteni'&&t.demo);
  assert.equal(core.isEntryShareable(oldDemo,m),false,'Demo links are retired when approved Reading exists');
  assert.equal(core.resolveShortCode(oldDemo.shortCode,m),null);
  assert.equal(scanner.scanTarget(origin+base+oldDemo.cardPath,origin,base,m),null);
  const missingDemoFlag={...reading};
  delete missingDemoFlag.demo;
  assert.equal(core.isUnifiedSelectable(missingDemoFlag),false,'Publication needs explicit demo:false');
  assert.equal(core.resolveShortCode('R3AA-ENB1',m).entry.id,reading.id);
  assert.equal(core.resolveShortCode('P3AA-ENB1',m).entry.id,listening.id);
  assert.equal(core.resolveShortCode('R3AB-ENB1',m),null);
  assert.equal(core.resolveShortCode('P3AB-ENB1',m),null);
  const publishedUrl=origin+base+reading.cardPath+'?lang=en&level=B1';
  const draftUrl=origin+base+readingDraft.cardPath+'?lang=en&level=B1';
  assert.deepEqual(scanner.scanTarget(publishedUrl,origin,base,m),{kind:'url',value:publishedUrl});
  assert.equal(scanner.scanTarget(draftUrl,origin,base,m),null);
  assert.equal(scanner.scanTarget('R3AB-ENB1',origin,base,m),null);
  assert.deepEqual(scanner.scanTarget('R3AA-ENB1',origin,base,m),{kind:'code',value:'R3AA-ENB1'});
});

test('R3A: no unpublished real Reading/Listening HTML can be committed to public staging',()=>{
  for(const skill of ['cteni','poslech']){
    const allowed=new Set(manifest.topics.filter(t=>t.skill===skill&&core.isEntryShareable(t,manifest)).map(t=>t.slug));
    const dirs=fs.readdirSync(path.join(root,skill),{withFileTypes:true}).filter(x=>x.isDirectory());
    for(const dir of dirs){
      assert.ok(allowed.has(dir.name),'Unapproved public '+skill+' HTML directory: '+dir.name);
      assert.ok(fs.existsSync(path.join(root,skill,dir.name,'index.html')),'Missing student entry: '+dir.name);
    }
    for(const item of manifest.topics.filter(t=>t.skill===skill&&!t.demo)){
      assert.equal(item.status,'PUBLIKOVANO','Public manifest must not include unpublished real '+skill+' card');
      assert.ok(item.publishedAt,'Approved '+skill+' card needs publication date');
      assert.ok(dirs.some(d=>d.name===item.slug),'Approved '+skill+' card must have a published index.html');
    }
  }
});

// The legacy root is ALSO public GitHub Pages. It must never become a
// back-door publishing location for private review or unapproved student cards.
test('R3A: legacy public root contains only its known fictional Reading demo',()=>{
  const publicRoot=path.resolve(root,'..');
  const legacy=JSON.parse(fs.readFileSync(path.join(publicRoot,'data/manifest.json'),'utf8'));
  assert.ok(legacy.topics.filter(t=>t.skill==='cteni'||t.skill==='poslech').every(t=>t.demo===true),
    'Do not add real Reading/Listening topics to legacy root manifest');
  for(const skill of ['cteni','poslech']){
    const dirs=fs.readdirSync(path.join(publicRoot,skill),{withFileTypes:true})
      .filter(item=>item.isDirectory()).map(item=>item.name).sort();
    assert.deepEqual(dirs,skill==='cteni'?['muzeum-niva']:[],
      'Unexpected public Reading/Listening directory under legacy root: '+skill);
  }
});
