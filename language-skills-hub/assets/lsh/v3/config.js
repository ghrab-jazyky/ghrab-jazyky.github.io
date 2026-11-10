/* Language Skills Hub: explicit production store, never share staging IndexedDB. */
'use strict';
window.LSH_CONFIG = Object.freeze({
  mode: 'production',
  stage: 'production',
  basePath: '/language-skills-hub/',
  release: 'R31',
  manifestPath: 'data/cards.json'
});
