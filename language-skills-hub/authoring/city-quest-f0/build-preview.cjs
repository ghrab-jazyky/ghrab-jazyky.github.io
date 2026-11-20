#!/usr/bin/env node
"use strict";
/*
 * City Quest F0.1 portable preview builder.
 * The generated HTML contains the locally authored map and full game logic.
 * No network, external resources, persistent personal data or production writes.
 * Output is a CI artifact, not a production page.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "../../../");
const cardDir = path.join(root, "language-skills-hub/konverzace/city-quest-f0");
const output = path.join(root, ".review-city-quest-f01/CITY_QUEST_F01_OFFLINE_PREVIEW.html");
const read = p => fs.readFileSync(p, "utf8");
const unique = (content, find, replace) => {
  if (content.split(find).length !== 2) throw Error("Expected one marker: " + find.slice(0,90));
  return content.replace(find, replace);
};
const hash = content => crypto.createHash("sha256").update(content,"utf8").digest("base64");
const css = read(path.join(cardDir,"style.css"));
const js = [
  read(path.join(root,"language-skills-hub/authoring/city-quest-f0/engine.js")),
  read(path.join(cardDir,"city-art.js")),
  read(path.join(cardDir,"app.js"))
].join("\n;\n");
let html = read(path.join(cardDir,"index.html"));
html = unique(html,'<link rel="stylesheet" href="style.css">','<style>'+css+'</style>');
html = unique(html,'<script defer src="../../authoring/city-quest-f0/engine.js"></script>',"");
html = unique(html,'<script defer src="city-art.js"></script>',"");
html = unique(html,'<script defer src="app.js"></script>',"");
const csp = "default-src 'none'; script-src 'sha256-"+hash(js)+"'; style-src 'sha256-"+hash(css)+"'; img-src data:; font-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-src 'none'";
html = html.replace(/<meta http-equiv="Content-Security-Policy" content="[^"]+">/,
  '<meta http-equiv="Content-Security-Policy" content="'+csp+'">');
if(!html.includes(csp))throw Error("CSP replacement failed");
html=unique(html,"</body>","<script>"+js+"</script>\n</body>");
if(!process.argv.includes("--write"))throw Error("Use --write to create an isolated offline preview.");
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,html,"utf8");
console.log("F0.1 portable preview: "+output);
console.log("Size: "+Buffer.byteLength(html)+" bytes, SHA-256 "+crypto.createHash("sha256").update(html).digest("hex"));
