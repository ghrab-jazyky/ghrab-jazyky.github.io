#!/usr/bin/env node
'use strict';
// The authoring JSON and template were recovered from the previously generated HTML.
// --check is deliberately read-only; --write is an explicit file replacement.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const dir = __dirname;
const output = path.resolve(dir, '../../konverzace/plural/index.html');
const read = file => fs.readFileSync(path.join(dir, file), 'utf8');
const content = read('content.json').trimEnd();
const glossary = read('glossary.json').trimEnd();
if (!content.startsWith('{') || !glossary.startsWith('{')) throw Error('Expected JSON objects');
JSON.parse(content); JSON.parse(glossary);

function replaceOne(source, marker, replacement) {
  if (source.split(marker).length !== 2) throw Error('Marker must appear exactly once: '+marker);
  return source.replace(marker, replacement);
}

let html = read('template.html');
html = replaceOne(html, '__PLURAL_CONTENT_JSON__', content);
html = replaceOne(html, '__PLURAL_GLOSSARY_JSON__', glossary);
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (inline.length !== 1) throw Error('Expected exactly one inline script');
const hash = crypto.createHash('sha256').update(inline[0][1], 'utf8').digest('base64');
html = replaceOne(html, '__PLURAL_INLINE_SHA__', hash);
const sha256 = crypto.createHash('sha256').update(html, 'utf8').digest('hex');

const [mode, ...rest] = process.argv.slice(2);
if (rest.length || !['--check', '--write'].includes(mode)) {
  console.error('Usage: node build.cjs --check|--write');
  process.exitCode = 2;
} else if (mode === '--write') {
  fs.writeFileSync(output, html, 'utf8');
  console.log('Written '+output+' SHA-256 '+sha256);
} else {
  const current = fs.readFileSync(output, 'utf8');
  if (current !== html) {
    console.error('Plural HTML differs from generated authoring output. Expected SHA-256 '+sha256);
    process.exitCode = 1;
  } else {
    console.log('Byte-for-byte Plural HTML reproduction verified. SHA-256 '+sha256);
  }
}
