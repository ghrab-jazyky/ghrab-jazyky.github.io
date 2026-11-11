#!/usr/bin/env node
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const core=require('../self-check/listening/listening-core.js');
const teacher=require('../self-check/practice-answers/teacher-key.js');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8'));
const listens=catalog.entries.filter(e=>e.skill==='poslech');
function source(e){
 return core.extractJson(fs.readFileSync(path.join(root,e.lockSource||e.relative),'utf8'),'DATA');
}
function verdict(topic,level,i,value){
 const e=listens.find(x=>x.id===topic),v=core.variant(source(e),level);
 const c=Array.from({length:i+1},()=>''),idx=i;c[idx]=value;
 const checked=core.assessAuto(v,{cloze:c},topic,level).reviewed.filter(x=>x.phase==='cloze');
 return checked[idx].correct;
}
test('R38: all 18 teacher practice keys exactly match source content for every task',()=>{
 assert.equal(listens.length,3);
 let variants=0,items=0,clozes=0,missing=[];
 for(const e of listens){
  const data=source(e);
  if(e.lockSource){
   const canonical=core.extractJson(fs.readFileSync(path.join(root,e.relative),'utf8'),'DATA');
   assert.deepEqual(data,canonical,e.id+' locked and canonical card content diverged');
  }
  for(const level of core.LEVELS){
   const v=core.variant(data,level),k=teacher.buildListening(v,e,'en',level);
   teacher.validate(k);
   assert.equal(k.topicId,e.id);
   assert.equal(k.level,level);
   const rows=k.groups.flatMap(x=>x.items);
   const has=(q,a)=>rows.some(x=>x.question===q&&x.answer===a);
   for(const part of ['gist','detail'])for(const q of v[part]){
    const answers=(Array.isArray(q.correct)?q.correct:[q.correct]).map(i=>q.options[i]).join(' / ');
    if(!has(q.title,answers))missing.push(e.id+' '+level+' '+q.title);
   }
   for(const q of [...v.facts,...v.open])if(!has(q.title,q.answer))
    missing.push(e.id+' '+level+' '+q.title);
   for(const [i,q] of v.sequence.entries())if(!has('Pozice '+(i+1),q))
    missing.push(e.id+' '+level+' sequence '+i);
   for(const q of v.vocab)if(!has(q.term,q.meaning))
    missing.push(e.id+' '+level+' vocab '+q.term);
   items+=rows.length;clozes+=core.cloze(v,e.id,level).length;variants++;
  }
 }
 assert.deepEqual(missing,[]);
 assert.equal(variants,18);
 assert.equal(items,530);
 assert.equal(clozes,45);
});
test('R38: corrected A2 open models identify the person and use correct grammar',()=>{
 const m=listens.find(e=>e.id==='ll-matthew-oscars');
 const h=listens.find(e=>e.id==='ll-harrison-ford');
 const mModel=core.variant(source(m),'A2').open.find(q=>q.title==='Choose one person he talks about. What does he say about him or her?');
 const hModel=core.variant(source(h),'A2').open.find(q=>q.title==='How did the people he found at college help him?');
 assert.equal(mModel.answer,'He thanks his mother for teaching him and his brothers to respect themselves.');
 assert.equal(hModel.answer,'They helped him find friends and a group where he felt he belonged.');
 const teacherM=teacher.buildListening(core.variant(source(m),'A2'),m,'en','A2');
 const teacherH=teacher.buildListening(core.variant(source(h),'A2'),h,'en','A2');
 assert.ok(teacherM.groups.flatMap(g=>g.items).some(x=>x.answer===mModel.answer));
 assert.ok(teacherH.groups.flatMap(g=>g.items).some(x=>x.answer===hModel.answer));
});
test('R38: accept correct names, surnames, professional synonyms, and permutations',()=>{
 const accepted=[
  ['ll-matthew-oscars','A2',1,['Camila','Camilla','cAmIlLa']],
  ['ll-matthew-oscars','B1',0,['Leto','Jared','Garner','Jennifer','Jared Leto','Jennifer Garner']],
  ['ll-matthew-oscars','B2',1,['Leto and Garner','Garner, Leto',
     'Jared Leto and Garner','Garner and Jared Leto']],
  ['ll-matthew-oscars','C1',2,['Miller','Miller Lite','MILLER LIGHT']],
  ['ll-matthew-oscars','C2',1,['Leto','Jared','Jared Leto']],
  ['ll-harrison-ford','A1',1,['carpenter','a carpenter','woodworker','a woodworker']],
  ['ll-harrison-ford','A2',1,['carpentry','woodworking','woodworker']],
  ['ll-harrison-ford','B1',1,['carpentry','carpenter','woodworking','woodworker']],
  ['ll-harrison-ford','B2',0,['Lucas and Spielberg','Spielberg, Lucas','George Lucas & Spielberg']],
  ['ll-harrison-ford','B2',1,['Roos and McQueeney','Roos, McQueenie',
    'Fred Roos and Pat McQueenie','Pat McQueeney & Roos']],
  ['ll-harrison-ford','B2',2,['Calista Flockhart and family','his family and Calista Flockhart']],
  ['ll-harrison-ford','C1',0,['Lucas and Spielberg','Spielberg and Lucas']],
  ['ll-harrison-ford','C1',1,['Roos and McQueeney','McQueenie and Roos']],
  ['ll-harrison-ford','C2',0,['Lucas and Spielberg','Spielberg and Lucas']],
  ['ll-harrison-ford','C2',1,['Roos and McQueeney','McQueenie and Roos']],
 ];
 for(const [topic,level,index,aliases] of accepted)for(const alias of aliases)
  assert.equal(verdict(topic,level,index,alias),true,
   topic+' '+level+' '+index+' rejected valid '+JSON.stringify(alias));
});
test('R38: retain strict factual grading and grammatical fitness',()=>{
 const wrong=[
  ['ll-harrison-ford','A1',1,['carpentry','woodworking','a carpentry']],
  ['ll-harrison-ford','B2',0,['Lucas','Spielberg','Lucas and Batman','Lucas and Spielberg and Roos']],
  ['ll-harrison-ford','B2',1,['Roos','McQueeney','Roos and Ford']],
  ['ll-harrison-ford','B2',2,['Calista','family','Calista and Spielberg']],
  ['ll-harrison-ford','C1',0,['George Lucas','Steven Spielberg','Lucas and Ford']],
  ['ll-matthew-oscars','B2',1,['Leto','Garner','Leto and Ford']],
  ['ll-matthew-oscars','A2',1,['Carla']],
  ['ll-matthew-oscars','C1',2,['Budweiser','Miller time']],
  ['ll-peaky-no-fighting','A1',0,['Grace and John','Gracie']]
 ];
 for(const [topic,level,index,aliases] of wrong)for(const alias of aliases)
  assert.equal(verdict(topic,level,index,alias),false,
   topic+' '+level+' '+index+' falsely accepted '+JSON.stringify(alias));
});
