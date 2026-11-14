#!/usr/bin/env node
'use strict';
// R64: factual cloze must accept answers that differ only by function words or by a
// phonetic spelling of a proper name, and must still reject wrong or incomplete facts.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),core=require('../self-check/listening/listening-core.js');
const entries=JSON.parse(fs.readFileSync(path.join(root,'data/cards.json'),'utf8')).entries.filter(e=>e.skill==='poslech'&&e.id!=='ll-sad');
const data=Object.fromEntries(entries.map(e=>[e.id,core.extractJson(fs.readFileSync(path.join(root,e.relative),'utf8'),'DATA')]));
function verdict(topic,level,index,answer){
 const cloze=[];cloze[index]=answer;
 return core.assessAuto(data[topic][level],{cloze},topic,level).reviewed.filter(x=>x.phase==='cloze')[index].correct;
}
const ACCEPT=[
 ['ll-peaky-no-fighting','B1',1,'the cavalry'],['ll-peaky-no-fighting','C2',1,'The Cavalry.'],['ll-peaky-no-fighting','B2',0,'calvary'],
 ['ll-peaky-no-fighting','A2',1,'the uniforms'],['ll-harrison-ford','B2',2,'his wife and his family'],
 ['ll-harrison-ford','B2',2,'Calista, his family'],['ll-harrison-ford','C1',2,'his third year'],['ll-harrison-ford','C1',2,'the third year'],
 ['ll-harrison-ford','A1',0,'about 15 years'],['ll-harrison-ford','B1',2,'Stephen Spielberg'],
 ['ll-matthew-oscars','A2',0,'two older brothers'],['ll-matthew-oscars','A1',0,'3 kids'],['ll-matthew-oscars','A1',1,'in 10 years'],
 ['ll-matthew-oscars','C1',1,'at 35'],['ll-matthew-oscars','A2',1,'Kamila'],['ll-matthew-oscars','A2',1,'Camila Alves'],
 ['ll-matthew-oscars','B2',0,'Valley'],['ll-matthew-oscars','C2',0,'at 15 and 25']
];
const REJECT=[
 ['ll-peaky-no-fighting','B1',1,'the army'],['ll-peaky-no-fighting','A1',0,'Polly'],['ll-harrison-ford','B2',2,'his wife'],
 ['ll-harrison-ford','B2',0,'Spielberg'],['ll-harrison-ford','A1',0,'50 years'],['ll-harrison-ford','C1',2,'second year'],
 ['ll-matthew-oscars','A2',0,'3'],['ll-matthew-oscars','B2',1,'Jared Leto'],['ll-matthew-oscars','C2',0,'15'],
 ['ll-matthew-oscars','A1',0,'the'],['ll-matthew-oscars','C1',1,'25'],['ll-matthew-oscars','B2',0,'Nolan']
];
test('R64: Listening cloze accepts function-word and proper-name spelling variants',()=>{
 for(const [t,l,i,a] of ACCEPT)assert.equal(verdict(t,l,i,a),true,t+' '+l+' #'+(i+1)+' must accept '+JSON.stringify(a));
});
test('R64: Listening cloze still rejects wrong, incomplete and empty-after-normalisation answers',()=>{
 for(const [t,l,i,a] of REJECT)assert.equal(verdict(t,l,i,a),false,t+' '+l+' #'+(i+1)+' must reject '+JSON.stringify(a));
});
