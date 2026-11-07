'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const stage=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(stage,p),'utf8');
const manifest=JSON.parse(read('data/manifest.json'));
const core=require('../assets/lsh/v2/core.js');
test('RC1 is a staging-only pilot, not an approved Reading/Listening launch',()=>{
  core.validateManifest(manifest);
  assert.equal(manifest.environment,'staging');
  assert.equal(manifest.demoOnly,false);
  assert.match(manifest.releaseStatus,/TECHNICAL_PREVIEW_NOT_PEDAGOGICALLY_APPROVED/);
  const config=read('assets/lsh/v2/config.js');
  assert.match(config,/mode: 'staging'/);
  assert.match(config,/stage: 'RC1'/);
  assert.match(config,/basePath: '\/zkusebni\/'/);
  assert.match(config,/0\.4\.1-rc1-github-only/);
  const conversation=manifest.topics.filter(t=>t.skill==='konverzace');
  const reading=manifest.topics.filter(t=>t.skill==='cteni');
  const listening=manifest.topics.filter(t=>t.skill==='poslech');
  assert.equal(conversation.length,21);
  assert.equal(reading.filter(x=>x.demo===true).length,1);
  assert.ok(listening.every(x=>x.status==='PUBLIKOVANO'&&x.publishedAt));
  assert.ok(conversation.every(x=>x.variants.length===24));
  assert.ok(reading.filter(x=>!x.demo).every(x=>x.status==='PUBLIKOVANO'&&x.publishedAt));
  assert.ok(reading.filter(x=>x.demo).every(x=>x.status==='ROZPRACOVANO'&&x.publishedAt===null));
  for(const topic of manifest.topics){
    assert.equal(topic.hasTeacherKey,false);
    assert.equal(topic.teacherKeyUrl,null);
    assert.ok(fs.existsSync(path.join(stage,topic.cardPath,'index.html')),topic.cardPath);
  }
});
test('All public staging shell pages truthfully warn about pilot status and are noindex',()=>{
  for(const page of ['index.html','404.html','konverzace/index.html','cteni/index.html',
     'poslech/index.html','k/index.html','slovnicek/index.html','stazeno/index.html']){
    const html=read(page);
    assert.match(html,/name="robots" content="noindex,nofollow"/,page);
    assert.match(html,/TECHNICKÝ PILOT RC1/,page);
    assert.doesNotMatch(html,/ZKUŠEBNÍ VERZE E2|E2 \/ 0\.2\.1/,page);
  }
  // R5P homepage leads to a separate UNAPPROVED 29-card pilot. The legacy
  // publishing manifest remains protected by the original RC1 gates above.
  const home=read('index.html');
  assert.match(home,/Jednotný učitelský katalog zahrnuje konverzace, čtení i poslech/);
  assert.match(home,/technické náhledy bez dokončené jazykové a pedagogické kontroly/);
  for(const skill of ['konverzace','cteni','poslech'])
    assert.match(home,new RegExp('href="reference-karty/\\?skill='+skill+'"'));
  assert.match(read('cteni/index.html'),/pedagogické schválení/);
  assert.match(read('poslech/index.html'),/žádné poslechové karty/);
});
test('Teacher auth and content readiness must not be misrepresented as secure',()=>{
  for(const page of ['konverzace/index.html','cteni/index.html','poslech/index.html']){
    assert.match(read(page),/Nejde o uzam/,page);
  }
  assert.doesNotMatch(read('index.html'),/učitelské klíče.+zde|přihlášení přes Google/);
});
test('No teacher-answer-key files have entered public Reading or Listening dirs',()=>{
  for(const skill of ['cteni','poslech']){
    const base=path.join(stage,skill),stack=[base];
    while(stack.length){
      const dir=stack.pop();
      for(const item of fs.readdirSync(dir,{withFileTypes:true})){
        const name=item.name;
        assert.ok(!/(?:teacher.?key|ucitelsky.?klic|odpovedni.?klic|answer.?key)/i.test(name),
          'Potential teacher-key file name: '+name);
        if(item.isDirectory())stack.push(path.join(dir,name));
      }
    }
  }
});
test('Staging QR scope never redirects to the wrong root',()=>{
  const qr=require('../assets/lsh/v3/qr-scanner.js');
  const topic=manifest.topics.find(x=>x.skill==='konverzace');
  const good='https://ghrab-jazyky.github.io/zkusebni/'+topic.cardPath+'?lang=en&level=B2';
  assert.deepEqual(qr.scanTarget(good,'https://ghrab-jazyky.github.io','/zkusebni/',manifest),{kind:'url',value:good});
  assert.equal(qr.scanTarget(good.replace('/zkusebni/','/'), 'https://ghrab-jazyky.github.io','/zkusebni/',manifest),null);
});
