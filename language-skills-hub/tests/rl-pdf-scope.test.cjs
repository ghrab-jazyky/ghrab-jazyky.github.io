'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

const script = path.resolve(__dirname, '../scripts/pdf-scope.sh');
function classify(paths) {
  return execFileSync('bash', [script], {
    input: paths.join('\n') + '\n',
    encoding: 'utf8',
    timeout: 10000
  }).trim();
}

const protectedPaths = [
  'language-skills-hub/cteni/asteroids/index.html',
  'language-skills-hub/data/cards.json',
  'language-skills-hub/assets/school-logo.png',
  'language-skills-hub/assets/hub.js',
  'language-skills-hub/assets/hub.css',
  'language-skills-hub/index.html',
  'language-skills-hub/self-check/reading/reading-core.js',
  'language-skills-hub/self-check/reading/reading-annotations.js',
  'language-skills-hub/self-check/reading/reading-annotations.css',
  'language-skills-hub/self-check/reading/reading-practice-annotations.js',
  'language-skills-hub/self-check/reading/reading.js',
  'language-skills-hub/self-check/reading/index.html',
  'language-skills-hub/self-check/reading/print-core.js',
  'language-skills-hub/self-check/reading/print-page.css',
  'language-skills-hub/self-check/reading/print-page.html',
  'language-skills-hub/self-check/reading/print-page.js',
  'language-skills-hub/printouts/rl-asteroids/en/B1/practice-all.pdf',
  'language-skills-hub/printouts/rl-asteroids/manifest-all.json',
  'language-skills-hub/scripts/build-reading-print-pdfs.cjs',
  'language-skills-hub/scripts/verify-reading-print-assets.cjs',
  'language-skills-hub/scripts/pdf-content-sha256.cjs',
  'language-skills-hub/scripts/pdf-scope.sh',
  'language-skills-hub/tests/rl-pdf-all-variants.test.cjs',
  'language-skills-hub/tests/rl-pdf-scope.test.cjs',
  '.github/workflows/lsh-reading-pdf-release-gate.yml',
  '.github/workflows/lsh-reading-print-assets.yml'
];
for (const file of protectedPaths) {
  test('Asteroids PDF input is protected: ' + file, () => {
    assert.equal(classify([file]), 'true');
  });
}
test('unrelated files do not run costly PDF checks', () => {
  const unrelated = [
    'language-skills-hub/cteni/other-card/index.html',
    'language-skills-hub/self-check/listening/reading-core.js',
    'language-skills-hub/assets/other-logo.png',
    'language-skills-hub/docs/teacher-notes.md',
    '.github/workflows/unrelated.yml'
  ];
  for (const file of unrelated) assert.equal(classify([file]), 'false');
  assert.equal(classify([]), 'false');
});
test('mixed list is relevant irrespective of ordering or trailing newline', () => {
  assert.equal(classify(['README.md', 'language-skills-hub/data/cards.json']), 'true');
  assert.equal(classify(['language-skills-hub/data/cards.json', 'README.md']), 'true');
});
