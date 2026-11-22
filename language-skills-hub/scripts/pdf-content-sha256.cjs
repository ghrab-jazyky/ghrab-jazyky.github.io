'use strict';
/* Canonical SHA-256 of a Chromium-generated PDF.
 * Ignore ONLY the 14 decimal digits of the PDF Info dictionary's
 * CreationDate and ModDate. Every other byte, including fonts, drawings,
 * images, layout and stream compression, must match across rebuilds.
 *
 * A missing/duplicated/unexpected date field fails closed. Do not broaden
 * normalization without a reviewed, tested reproducibility investigation.
 */
const crypto=require('node:crypto');

function pdfContentSha256(bytes){
 if(!Buffer.isBuffer(bytes))throw new TypeError('Expected PDF Buffer');
 if(!bytes.subarray(0,8).toString('latin1').startsWith('%PDF'))
  throw Error('Missing PDF signature');
 const source=bytes.toString('latin1');
 const canonical=Buffer.from(bytes);
 for(const field of ['CreationDate','ModDate']){
  const pattern=new RegExp('/'+field+'\\s*\\(D:(\\d{14})(?:Z|[+-]\\d{2}\\x27\\d{2}\\x27)\\)','g');
  const matches=[...source.matchAll(pattern)];
  if(matches.length!==1)
   throw Error('Expected one well-formed PDF '+field+' field, saw '+matches.length);
  const match=matches[0],offset=match.index+match[0].indexOf(match[1]);
  if(offset<match.index)throw Error('Cannot locate timestamp for '+field);
  canonical.fill(0x30,offset,offset+14);
 }
 return crypto.createHash('sha256').update(canonical).digest('hex');
}
module.exports={pdfContentSha256};
