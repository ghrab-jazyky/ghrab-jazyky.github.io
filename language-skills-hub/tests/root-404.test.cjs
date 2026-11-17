#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test');
const root=fs.readFileSync('404.html','utf8');
test('Shared GitHub Pages 404 directs users to production hub, not staging',()=>{
 assert.match(root,/<html lang="cs">/);
 assert.match(root,/href="\/language-skills-hub\/"/);
 assert.match(root,/Stránka nebyla nalezena/);
 assert.doesNotMatch(root,/zkusebni|staging|zkušební|E2 \/ 0\.2\.1/i);
 assert.doesNotMatch(root,/<script|https?:\/\//i);
 assert.match(root,/Content-Security-Policy/);
});
