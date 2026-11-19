'use strict';
/* Exact content integrity for the immutable Reading Lab card corpus.
 * RL-02 adds only two audited script tags and one stylesheet to Asteroids.
 * Strip those exact, versioned, additive tags BEFORE comparing with the
 * existing goldens in version.json. Never update baseline content hashes
 * merely because an application shell gains a presentation enhancement.
 * Every unlisted byte change still fails the original integrity gate.
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
 return Buffer.isBuffer(contents)?Buffer.from(normalized,'utf8'):normalized;
}
module.exports={integrityContent};
