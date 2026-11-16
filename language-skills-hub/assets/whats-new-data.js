/* LSH user-facing changelog – strict reader-side contract. */
(function (global) {
 'use strict';
 const ROOT=['kind','schemaVersion','latestAnnouncementSequence','contentRevision','releases'];
 const RELEASE=['id','sequence','publishedAt','title','changes'];
 const CHANGE=['id','area','category','title','description','teacherBenefit'];
 const AREAS=new Set(['hub','conversation','reading','listening']);
 const CATEGORIES=new Set(['functionality','content','language','methodology','interface','testing']);
 const MAX=2147483647;
 const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
 const keys=(x,required)=>object(x)&&Object.keys(x).length===required.length&&required.every(k=>Object.hasOwn(x,k));
 const number=x=>Number.isSafeInteger(x)&&x>=0&&x<=MAX;
 const text=(x,min,max)=>typeof x==='string'&&x.trim()===x&&x.length>=min&&x.length<=max&&!/[<>\x00-\x1f]/.test(x);
 function dateValid(s) {
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
  const d=new Date(s+'T00:00:00Z');
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;
 }
 function valid(data) {
  if(!keys(data,ROOT)||data.kind!=='LSH_TEACHER_CHANGELOG_V1'||data.schemaVersion!==1||
     !number(data.latestAnnouncementSequence)||!number(data.contentRevision)||
     !Array.isArray(data.releases)||data.releases.length>200)return false;
  const releaseIds=new Set(),changeIds=new Set(),sequences=new Set();
  let prevSeq=Infinity,prevDate='9999-12-31';
  for(const release of data.releases) {
   if(!keys(release,RELEASE)||typeof release.id!=='string'||release.id.length>96||
      !/^lsh-\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(release.id)||releaseIds.has(release.id)||
      !number(release.sequence)||release.sequence<1||release.sequence>=prevSeq||sequences.has(release.sequence)||
      !dateValid(release.publishedAt)||release.publishedAt>prevDate||
      !release.id.startsWith('lsh-'+release.publishedAt+'-')||!text(release.title,5,120)||
      !Array.isArray(release.changes)||release.changes.length<1||release.changes.length>25)return false;
   releaseIds.add(release.id);sequences.add(release.sequence);
   prevSeq=release.sequence;prevDate=release.publishedAt;
   for(const c of release.changes) {
    if(!keys(c,CHANGE)||typeof c.id!=='string'||c.id.length>96||
       !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.id)||changeIds.has(c.id)||
       !AREAS.has(c.area)||!CATEGORIES.has(c.category)||
       !text(c.title,5,110)||!text(c.description,20,700)||!text(c.teacherBenefit,15,240))return false;
    changeIds.add(c.id);
   }
  }
  return data.latestAnnouncementSequence===(data.releases[0]?data.releases[0].sequence:0);
 }
 const api=Object.freeze({valid});
 global.LSHWhatsNewData=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
