#!/usr/bin/env node
"use strict";
/*
 * City Quest F1 — complete offline HTML distribution.
 * A single review file embeds the tested F0.1 illustrated map and all eight F1
 * station engines without any network calls. CSP uses SHA-256 source hashes.
 */
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const root=path.resolve(__dirname,"../../../");
const f0=path.join(root,"language-skills-hub/konverzace/city-quest-f0");
const f1=path.join(root,"language-skills-hub/konverzace/city-quest-f1");
const output=path.join(root,".review-city-quest-f1/CITY_QUEST_F1_OFFLINE_PREVIEW.html");
const read=p=>fs.readFileSync(p,"utf8");
const one=(s,from,to)=>{
 if(s.split(from).length!==2)throw new Error("Expected one occurrence: "+from.slice(0,100));
 return s.replace(from,to);
};
const hash=x=>crypto.createHash("sha256").update(x,"utf8").digest("base64");
const css=read(path.join(f0,"style.css"))+"\n\n"+read(path.join(f1,"f1.css"));
const js=[
 read(path.join(root,"language-skills-hub/authoring/city-quest-f0/engine.js")),
 read(path.join(f0,"city-art.js")),
 read(path.join(f0,"app.js")),
 read(path.join(root,"language-skills-hub/authoring/city-quest-f1/engine.js")),
 read(path.join(f1,"f1.js"))
].join("\n;\n");
let html=read(path.join(f1,"index.html"));
for(const item of [
 '<link rel="stylesheet" href="../city-quest-f0/style.css">',
 '<link rel="stylesheet" href="f1.css">',
 '<script defer src="../../authoring/city-quest-f0/engine.js"></script>',
 '<script defer src="../city-quest-f0/city-art.js"></script>',
 '<script defer src="../city-quest-f0/app.js"></script>',
 '<script defer src="../../authoring/city-quest-f1/engine.js"></script>',
 '<script defer src="f1.js"></script>'
])html=one(html,item,"");
const csp="default-src 'none'; script-src 'sha256-"+hash(js)+"'; style-src 'sha256-"+hash(css)+"'; img-src data:; font-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-src 'none'";
const meta=/<meta http-equiv="Content-Security-Policy" content="[^"]+">/;
if(!meta.test(html))throw Error("CSP meta element is absent");
html=html.replace(meta,'<meta http-equiv="Content-Security-Policy" content="'+csp+'">');
html=one(html,"</head>","<style>"+css+"</style>\n</head>");
html=one(html,"</body>","<script>"+js+"</script>\n</body>");
if(!process.argv.includes("--write"))throw Error("Use --write to create isolated HTML review output.");
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,html,"utf8");
console.log("F1 review file: "+output);
console.log("Bytes: "+Buffer.byteLength(html)+" SHA-256 "+crypto.createHash("sha256").update(html).digest("hex"));
