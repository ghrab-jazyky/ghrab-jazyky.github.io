#!/usr/bin/env node
"use strict";
/*
 * Isolated City Quest distribution staging. REVIEW ONLY.
 * Creates a deployable single-file candidate without exposing source folders,
 * F0/F1 prototypes, internal documents, test data or authoring filenames.
 * This script never publishes or modifies GitHub Pages.
 */
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const root=path.resolve(__dirname,"../../../");
const input=path.join(root,".review-city-quest-f2","CITY_QUEST_F2_OFFLINE_PREVIEW.html");
const publish=path.join(root,".release-city-quest-f5c","public");
const output=path.join(publish,"city-quest","index.html");
const manifest=path.join(root,".release-city-quest-f5c","REVIEW_MANIFEST.json");
function check(condition,message){if(!condition)throw Error("City Quest publication gate: "+message);}
function sha(text,encoding){return crypto.createHash("sha256").update(text,"utf8").digest(encoding);}
function run(){
 check(process.argv.includes("--write"),"explicit --write flag required");
 check(fs.existsSync(input),"build the single-file preview before staging");
 const html=fs.readFileSync(input,"utf8");
 const css=[...html.matchAll(/<style>([\s\S]*?)<\/style>/g)];
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
 check(css.length===1&&scripts.length===1,"expected exactly one inline stylesheet and script");
 const csp=(html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)||[])[1]||"";
 check(csp.includes("default-src 'none'")&&csp.includes("connect-src 'none'"),"fail-closed offline CSP missing");
 check(csp.includes("script-src 'sha256-"+sha(scripts[0][1],"base64")+"'"),"inline JavaScript CSP hash mismatch");
 check(csp.includes("style-src 'sha256-"+sha(css[0][1],"base64")+"'"),"inline CSS CSP hash mismatch");
 check(!/<script\b[^>]*\bsrc\s*=|<link\b[^>]*\bhref\s*=|<iframe\b|<object\b|<form\b|<img\b[^>]*\bsrc\s*=/i.test(html),
  "release contains external resources or additional HTML surfaces");
 check(!/https?:\/\/[^/"'\s]+/i.test(csp),"CSP must not allow external origins");
 // Remove previous staging contents: no accidental unrelated publication.
 fs.rmSync(publish,{recursive:true,force:true});
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,html,"utf8");
 const publicItems=fs.readdirSync(publish);
 const leafItems=fs.readdirSync(path.dirname(output));
 check(publicItems.length===1&&publicItems[0]==="city-quest"&&leafItems.length===1&&leafItems[0]==="index.html",
  "staged publication must contain exactly city-quest/index.html");
 const evidence={status:"REVIEW_ONLY_NOT_DEPLOYED",relativeOutput:"city-quest/index.html",
  source:"CITY_QUEST_F2_OFFLINE_PREVIEW.html",sha256:sha(html,"hex"),
  bytes:Buffer.byteLength(html,"utf8"),files:["city-quest/index.html"],externalResources:0};
 fs.writeFileSync(manifest,JSON.stringify(evidence,null,2)+"\n");
 console.log(JSON.stringify(evidence));
}
if(require.main===module)run();
module.exports={run};
