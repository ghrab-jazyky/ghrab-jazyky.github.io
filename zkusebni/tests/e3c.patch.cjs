/* LSH E3C deterministic card patcher; no changes to Conversation engine or pedagogical content.
   API: patchCard(originalHtml, canonicalTopicId).
   Stored as a build/audit aid, NOT loaded by students. */
'use strict';
function patchCard(source,topicId) {
  if (typeof source!=='string' || typeof topicId!=='string' ||
    !/^cl-[a-z0-9-]+$/.test(topicId)) throw new Error('Invalid card source or canonical ID');
  const htmlTag=source.match(/<html\b[^>]*>/i);
  if (!htmlTag || source.includes('data-lsh-topic-id')) throw new Error('Card already integrated or malformed');
  const anchor='style-src &#x27;unsafe-inline&#x27;';
  if (source.split(anchor).length!==2) throw new Error('Unexpected CSP style-src policy');
  if (source.split('</head>').length!==2 || source.split('</body>').length!==2) throw new Error('Unexpected HTML structure');
  const originals=source.match(/<script>([\s\S]*?)<\/script>/g);
  if (!originals || originals.length!==1) throw new Error('Unexpected inline engine count');
  for(const required of ['id="languageSelect"','id="levelSwitch"',
    'id="vocabGrid"','id="lookupPopover"','id="lookupExpression"','id="lookupTranslation"']){
    if(!source.includes(required)) throw new Error('Card missing DOM hook: '+required);
  }
  let result=source.replace(htmlTag[0],htmlTag[0].replace(/>$/,' data-lsh-topic-id="'+topicId+'">'));
  result=result.replace(anchor,"style-src &#x27;self&#x27; &#x27;unsafe-inline&#x27;");
  result=result.replace('</head>','<link rel="stylesheet" href="../../assets/lsh/v3/card-bridge.css">\n</head>');
  result=result.replace('</body>',[
    '<script defer src="../../assets/lsh/v3/model.js"></script>',
    '<script defer src="../../assets/lsh/v3/store.js"></script>',
    '<script defer src="../../assets/lsh/v3/card-bridge.js"></script>',
    '</body>'
  ].join('\n'));
  const patchedInline=result.match(/<script>([\s\S]*?)<\/script>/g);
  if(!patchedInline || patchedInline.length!==1 || patchedInline[0]!==originals[0])
    throw new Error('Inline Conversation engine changed!');
  if(result.length<=source.length || !result.includes('data-lsh-topic-id="'+topicId+'"'))
    throw new Error('Expected bridge was not injected');
  return result;
}
if(typeof module!=='undefined' && module.exports) module.exports={patchCard};
