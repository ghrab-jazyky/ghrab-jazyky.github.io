/* R63: local same-origin active-test collision detector, not a proctor or proof.
 * BroadcastChannel messages carry only ephemeral per-page random IDs, never
 * student names, answers, session URLs, grades, or topic identifiers.
 * Browser profiles, private windows and different devices cannot be correlated.
 */
(function(root){
 'use strict';
 const CHANNEL='lsh-active-tests-v1';
 function mount(options){
  if(!options||typeof options.onConflict!=='function')
   throw new Error('Missing conflict handler');
  let channel=null,active=false,disposed=false,ticker=null;
  let token=null;
  try{
   const bytes=new Uint8Array(12);
   if(root.crypto&&typeof root.crypto.getRandomValues==='function'){
    root.crypto.getRandomValues(bytes);
    token=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
   }
  }catch(_){token=null;}
  try{
   if(token)channel=options.channelFactory?
    options.channelFactory(CHANNEL):new root.BroadcastChannel(CHANNEL);
  }catch(_){channel=null;}
  const available=!!channel;
  function send(type){
   if(disposed||!active||!channel)return;
   try{channel.postMessage({v:1,type,id:token});}catch(_){}
  }
  if(channel){
   channel.onmessage=event=>{
    if(!active||disposed||!event||!event.data)return;
    const m=event.data;
    if(m.v!==1||typeof m.id!=='string'||!/^[a-f0-9]{24}$/.test(m.id)||
     m.id===token)return;
    if(m.type==='probe')send('active');
    if(m.type==='active'){
     try{options.onConflict()}catch(_){}
    }
   };
  }
  function activate(){
   if(disposed||active)return available;
   active=true;
   send('active');send('probe');
   if(available&&typeof root.setInterval==='function'){
    ticker=root.setInterval(()=>send('active'),2500);
   }
   return available;
  }
  function probe(){if(active){send('active');send('probe');}}
  function deactivate(){
   active=false;
   if(ticker!==null){root.clearInterval(ticker);ticker=null;}
  }
  function dispose(){
   if(disposed)return;
   deactivate();disposed=true;
   if(channel){
    channel.onmessage=null;
    try{channel.close();}catch(_){}
    channel=null;
   }
  }
  return Object.freeze({available,activate,probe,deactivate,dispose});
 }
 const api=Object.freeze({mount});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHTabGuard=api;
})(typeof window!=='undefined'?window:globalThis);
