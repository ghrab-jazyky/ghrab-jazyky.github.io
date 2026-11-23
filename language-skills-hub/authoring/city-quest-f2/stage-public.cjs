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
// The on-site catalog links to /language-skills-hub/konverzace/city-quest-f2/index.html.
// This is an additive ONE-FILE overlay candidate, never a full Pages site root.
const relativeOutput="language-skills-hub/konverzace/city-quest-f2/index.html";
const output=path.join(publish,...relativeOutput.split("/"));
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
 const findFiles=(dir,prefix="")=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const name=prefix?prefix+"/"+entry.name:entry.name;
  if(entry.isDirectory())return findFiles(path.join(dir,entry.name),name);
  check(entry.isFile(),"unexpected non-file publication item "+name);
  return [name];
 });
 const publishedFiles=findFiles(publish);
 check(publishedFiles.length===1&&publishedFiles[0]===relativeOutput,
  "staged publication must contain ONLY the exact catalog-linked HTML file");
 const catalog=JSON.parse(fs.readFileSync(path.join(root,"language-skills-hub/data/cards.json"),"utf8"));
 const card=catalog.entries.filter(x=>x.id==="cl-city-quest-f2");
 check(card.length===1&&"language-skills-hub/"+card[0].relative===relativeOutput,
  "publication path must exactly match the live catalog card");
 const evidence={status:"REVIEW_ONLY_NOT_DEPLOYED",relativeOutput,
  source:"CITY_QUEST_F2_OFFLINE_PREVIEW.html",sha256:sha(html,"hex"),
  bytes:Buffer.byteLength(html,"utf8"),files:publishedFiles,externalResources:0};
 fs.writeFileSync(manifest,JSON.stringify(evidence,null,2)+"\n");
 console.log(JSON.stringify(evidence));
}
if(require.main===module)run();
module.exports={run};
