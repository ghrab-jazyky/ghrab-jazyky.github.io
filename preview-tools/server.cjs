'use strict';
// Offline-to-localhost preview of the exact GitHub Pages folder structure.
// Zero third-party modules; GET/HEAD only; never listens on a public interface.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const HUB=path.resolve(ROOT,'language-skills-hub');
const PORT=Number(process.env.LSH_PREVIEW_PORT||8765);
if(!Number.isSafeInteger(PORT)||PORT<1024||PORT>65535){
 console.error('Invalid local preview port.');process.exit(1);
}
const mime={
 '.html':'text/html; charset=utf-8',
 '.js':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8',
 '.json':'application/json; charset=utf-8',
 '.txt':'text/plain; charset=utf-8',
 '.svg':'image/svg+xml',
 '.png':'image/png',
 '.jpg':'image/jpeg',
 '.jpeg':'image/jpeg',
 '.webp':'image/webp',
 '.gif':'image/gif',
 '.ico':'image/x-icon',
 '.woff2':'font/woff2',
 '.mp3':'audio/mpeg',
 '.mp4':'video/mp4'
};
function answer(req,res){
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
 if(!['GET','HEAD'].includes(req.method)){
  res.writeHead(405,{...headers,Allow:'GET, HEAD'});res.end('Method not allowed');return;
 }
 let pathname;
 try{
  const input=new URL(req.url,'http://127.0.0.1');
  pathname=decodeURIComponent(input.pathname);
 }catch(_){res.writeHead(400,headers);res.end('Bad URL');return}
 if(!pathname.startsWith('/language-skills-hub/')||pathname.includes('\\')||
  pathname.includes('\0')){
  res.writeHead(404,headers);res.end('Only the Language Skills Hub is served');return;
 }
 let file=path.resolve(ROOT,'.'+pathname);
 if(file!==HUB&&!file.startsWith(HUB+path.sep)){
  res.writeHead(403,headers);res.end('Forbidden');return;
 }
 try{
  let info=fs.statSync(file);
  if(info.isDirectory()){
   file=path.join(file,'index.html');
   info=fs.statSync(file);
  }
  if(!info.isFile())throw new Error('Not a file');
  res.writeHead(200,{...headers,'Content-Type':mime[path.extname(file).toLowerCase()]||
   'application/octet-stream','Content-Length':info.size});
  if(req.method==='HEAD'){res.end();return;}
  const stream=fs.createReadStream(file);
  stream.on('error',()=>res.destroy());
  stream.pipe(res);
 }catch(_){res.writeHead(404,headers);res.end('File not found');}
}
if(require.main===module){
 const server=http.createServer(answer);
 server.listen(PORT,'127.0.0.1',()=>{
  console.log('');
  console.log('LANGUAGE SKILLS HUB – LOCAL NON-GRADED PREVIEW');
  console.log('Catalog:   http://127.0.0.1:'+PORT+'/language-skills-hub/');
  console.log('Reading:   http://127.0.0.1:'+PORT+'/language-skills-hub/self-check/reading/index.html?topic=rl-asteroids&lang=en&level=B2');
  console.log('Teacher:   http://127.0.0.1:'+PORT+'/language-skills-hub/self-check/listening/teacher.html?topic=ll-matthew-oscars&level=B2');
  console.log('Student:   http://127.0.0.1:'+PORT+'/language-skills-hub/self-check/listening/student.html?topic=ll-matthew-oscars&level=B2');
  console.log('Only this computer can connect. Press Ctrl+C to stop.');
  console.log('');
 });
 server.on('error',error=>{console.error(error.message);process.exitCode=1;});
}
module.exports={answer,ROOT,HUB};
