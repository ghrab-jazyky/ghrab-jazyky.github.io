'use strict';
/* Exact byte integrity for the Reading Lab card corpus.
 * RL-02 originally normalized out its approved annotation hooks to compare
 * against the historical pre-annotation digest. Since the approved R12
 * Asteroids revision (#162) and D2 manifest reconciliation, contentHashes
 * denotes the actual published bytes, including all annotation hooks.
 * Keep the existing hook-shape checks, but hash the original content.
 * No arbitrary byte changes may be hidden by normalization.
 */
const stylesheet='<link rel="stylesheet" href="../../self-check/reading/reading-annotations.css">\n';
const scripts='<!-- RL-02: independent text annotation layer; no changes to original card data. -->\n'+
 '<script defer src="../../self-check/reading/reading-annotations.js"></script>\n'+
 '<script defer src="../../self-check/reading/reading-practice-annotations.js"></script>\n';
function integrityContent(topic,contents){
 if(topic!=='rl-asteroids')return contents;
 const source=Buffer.isBuffer(contents)?contents.toString('utf8'):String(contents);
 if(source.split(stylesheet).length!==2||source.split(scripts).length!==2)
  throw new Error('Asteroids must contain exactly one approved RL-02 annotation hook');
 const normalized=source.replace(stylesheet,'').replace(scripts,'');
 if(normalized.includes('reading-practice-annotations.js')||
    normalized.includes('reading-annotations.css'))
  throw new Error('Unrecognized Asteroids annotation modification');
 return contents;
}
module.exports={integrityContent};
