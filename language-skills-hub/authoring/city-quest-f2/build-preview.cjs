#!/usr/bin/env node
"use strict";
/*
 * City Quest F2: 8-station multilingual review in ONE offline HTML file.
 * No network requests or CDNs. Exact SHA-256 CSP hashes allow only generated
 * local CSS and JS. The GitHub Actions artifact is the independent review copy.
 */
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const root=path.resolve(__dirname,"../../../");
const base=path.join(root,"language-skills-hub");
const read=p=>fs.readFileSync(path.join(base,p),"utf8");
const output=path.join(root,".review-city-quest-f2/CITY_QUEST_F2_OFFLINE_PREVIEW.html");
const styles=[
 "konverzace/city-quest-f0/style.css",
 "konverzace/city-quest-f1/f1.css",
 "konverzace/city-quest-f2/f2.css"
];
const scripts=[
 "authoring/city-quest-f0/engine.js",
 "konverzace/city-quest-f0/city-art.js",
 "konverzace/city-quest-f0/app.js",
 "authoring/city-quest-f1/engine.js",
 "authoring/city-quest-f2/content-a.js",
 "authoring/city-quest-f2/content-b.js",
 "authoring/city-quest-f2/engine.js",
 "konverzace/city-quest-f2/f2.js"
];
const css=styles.map(read).join("\n\n"),js=scripts.map(read).join("\n;\n");
const sha=data=>crypto.createHash("sha256").update(data,"utf8").digest("base64");
let html=read("konverzace/city-quest-f2/index.html");
const styleTokens=[
 '<link rel="stylesheet" href="../city-quest-f0/style.css">',
 '<link rel="stylesheet" href="../city-quest-f1/f1.css">',
 '<link rel="stylesheet" href="f2.css">'
];
const scriptTokens=[
 '<script defer src="../../authoring/city-quest-f0/engine.js"></script>',
 '<script defer src="../city-quest-f0/city-art.js"></script>',
 '<script defer src="../city-quest-f0/app.js"></script>',
 '<script defer src="../../authoring/city-quest-f1/engine.js"></script>',
 '<script defer src="../../authoring/city-quest-f2/content-a.js"></script>',
 '<script defer src="../../authoring/city-quest-f2/content-b.js"></script>',
 '<script defer src="../../authoring/city-quest-f2/engine.js"></script>',
 '<script defer src="f2.js"></script>'
];
for(const tok of styleTokens.concat(scriptTokens)){
 if(html.split(tok).length!==2)throw Error("Missing/duplicated resource: "+tok);
 html=html.replace(tok,"");
}
const csp="default-src 'none'; script-src 'sha256-"+sha(js)+"'; style-src 'sha256-"+sha(css)+"'; img-src data:; font-src 'none'; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-src 'none'";
const marker=/<meta http-equiv="Content-Security-Policy" content="[^"]+">/;
if(!marker.test(html))throw Error("CSP not found");
html=html.replace(marker,'<meta http-equiv="Content-Security-Policy" content="'+csp+'">');
html=html.replace("</head>","<style>"+css+"</style>\n</head>");
html=html.replace("</body>","<script>"+js+"</script>\n</body>");
if(!process.argv.includes("--write"))throw Error("Use --write to create review output");
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,html,"utf8");
console.log("City Quest F2 independent review: "+output);
console.log("Bytes: "+Buffer.byteLength(html)+"; languages: EN/ES/DE/FR; CEFR: A1–C2");
console.log("SHA-256: "+crypto.createHash("sha256").update(html).digest("hex"));
