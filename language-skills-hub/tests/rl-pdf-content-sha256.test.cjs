'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {pdfContentSha256}=require('../scripts/pdf-content-sha256.cjs');
const sample=({created="20261121073028",modified="20261121073028",stream="image-binary-\x00\xFF"}={})=>
 Buffer.concat([
  Buffer.from('%PDF-1.7\n1 0 obj\n<< /CreationDate (D:'+created+"+00'00')"+
   ' /ModDate (D:'+modified+"+00'00') >>\nendobj\nstream\n",'latin1'),
  Buffer.from(stream,'latin1'),
  Buffer.from('\nendstream\n%%EOF\n','latin1')
 ]);
test('metadata timestamp changes do not affect the canonical whole-PDF hash',()=>{
 const old=sample(),fresh=sample({created:'20261223104557',modified:'20261223104557'});
 assert.notDeepEqual(old,fresh);
 assert.equal(pdfContentSha256(old),pdfContentSha256(fresh));
});
test('a damaged or changed image stream changes the whole-PDF hash',()=>{
 const good=sample(),bad=sample({stream:'image-binary-\x00\xFE'});
 assert.notEqual(pdfContentSha256(good),pdfContentSha256(bad));
});
test('same-length modification to any other PDF byte is detected',()=>{
 const good=sample(),bad=Buffer.from(good);
 const offset=bad.indexOf(Buffer.from('endstream'));
 bad[offset]=0x58;
 assert.notEqual(pdfContentSha256(good),pdfContentSha256(bad));
});
test('missing or duplicated metadata fields fail closed',()=>{
 assert.throws(()=>pdfContentSha256(Buffer.from('%PDF-1.7\n%%EOF\n')),/CreationDate/);
 const duplicate=Buffer.concat([sample(),Buffer.from("/CreationDate (D:20261121073028+00'00')")]);
 assert.throws(()=>pdfContentSha256(duplicate),/CreationDate/);
});
test('malformed timestamp and non-PDF input are rejected',()=>{
 assert.throws(()=>pdfContentSha256(sample({created:'2026112107bad!'})),/CreationDate/);
 assert.throws(()=>pdfContentSha256(Buffer.from('NOT PDF')),/signature/);
});
test('normalization never mutates the input PDF Buffer',()=>{
 const original=sample(),snapshot=Buffer.from(original);
 pdfContentSha256(original);
 assert.deepEqual(original,snapshot);
});
