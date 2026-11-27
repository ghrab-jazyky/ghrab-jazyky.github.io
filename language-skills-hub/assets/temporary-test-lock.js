/* E1-E6: temporary Reading/Listening TEST maintenance notice.
 * UI-only on public GitHub Pages. This is NOT authentication or access control.
 * Remove this module and its call sites after development is completed.
 */
(function(root){
 'use strict';
 const KEY='lsh:temporary-test-lock:developer:v1';
 const DIALOG_ID='lshTemporaryTestNotice';
 const PREVIEW_ON='#lsh-test-preview=on';
 const PREVIEW_OFF='#lsh-test-preview=off';
 // Optional direct link avoids F12/console. This remains a publicly inspectable
 // client-side convenience flag, never authentication or authorization.
 function applyPreviewLink(){
  const hash=root.location.hash;
  if(hash!==PREVIEW_ON&&hash!==PREVIEW_OFF)return null;
  try{
   if(hash===PREVIEW_ON)root.localStorage.setItem(KEY,'enabled');
   else root.localStorage.removeItem(KEY);
  }catch(_){return null}
  try{
   root.history?.replaceState(root.history.state,'',root.location.pathname+root.location.search);
  }catch(_){}
  return hash===PREVIEW_ON?'on':'off';
 }
 let previewLinkAction=applyPreviewLink();
 // Also support a preview link pasted into the address bar of an already-open
 // catalog page. That navigation changes only the fragment (no page reload).
 root.addEventListener('hashchange',()=>{
  const action=applyPreviewLink();
  if(action){
   previewLinkAction=action;
   announcePreviewLink();
  }
 });
 function isLocalPreview(){
  return root.location.protocol==='http:' &&
   (root.location.hostname==='127.0.0.1'||root.location.hostname==='localhost');
 }
 function hasPreviewAccess(){
  // Local automated regressions run on loopback. Public GitHub Pages never does.
  if(isLocalPreview())return true;
  try{return root.localStorage.getItem(KEY)==='enabled'}catch(_){return false}
 }
 function isLocked(){return !hasPreviewAccess()}
 function el(tag,cls,value){
  const node=root.document.createElement(tag);
  if(cls)node.className=cls;
  if(value!==undefined)node.textContent=value;
  return node;
 }
 function announcePreviewLink(){
  if(!previewLinkAction)return;
  const show=()=>{
   root.document.getElementById('lshTemporaryTestPreviewStatus')?.remove();
   const note=el('div','lsh-temporary-test-preview-status');
   note.id='lshTemporaryTestPreviewStatus';
   note.setAttribute('role','status');
   note.appendChild(el('span',null,previewLinkAction==='on'
    ?'Vývojářský přístup k testům je na tomto zařízení aktivní.'
    :'Vývojářský přístup k testům byl na tomto zařízení vypnut.'));
   const close=el('button','lsh-temporary-test-preview-dismiss','Zavřít');
   close.type='button';
   close.addEventListener('click',()=>note.remove());
   note.appendChild(close);
   root.document.body.appendChild(note);
  };
  if(root.document.readyState==='loading')
   root.document.addEventListener('DOMContentLoaded',show,{once:true});
  else if(root.document.body)show();
 }
 announcePreviewLink();
 function showNotice(options={}){
  if(!isLocked())return;
  const back=options.returnToCatalog||null;
  const christmas=options.activity==='christmas-quest';
  if(!root.document.body){
   root.document.addEventListener('DOMContentLoaded',()=>showNotice(options),{once:true});
   return;
  }
  let dialog=root.document.getElementById(DIALOG_ID);
  if(dialog){
   if(!dialog.open&&typeof dialog.showModal==='function')dialog.showModal();
   return;
  }
  const oldFocus=root.document.activeElement;
  dialog=el('dialog','lsh-temporary-test-dialog');
  dialog.id=DIALOG_ID;
  dialog.setAttribute('aria-labelledby','lshTemporaryTestTitle');
  dialog.setAttribute('aria-describedby','lshTemporaryTestDescription');
  const heading=el('h2','lsh-temporary-test-title',christmas?'Christmas Quest je zatím ve vývoji':'Testovací část se právě upravuje');
  heading.id='lshTemporaryTestTitle';
  const copy=el('div','lsh-temporary-test-description');
  copy.id='lshTemporaryTestDescription';
  copy.append(
   el('p',null,'Milá kolegyně, milý kolego,'),
   el('p',null,christmas?'hru právě dokončuji a testuji, proto zatím není dostupná k běžnému použití.':'vážím si toho, že chceš vyzkoušet testy v Reading a Listening Labs. Právě na nich provádím větší úpravy, a proto jsou dočasně nedostupné.'),
   el('p',null,'Ostatní části LSH můžeš dál používat. Prosím tě o trpělivost a zkus to později.'),
   el('p','lsh-temporary-test-signature','Děkuji za pochopení! Daniel')
  );
  const actions=el('div','lsh-temporary-test-actions');
  const closeButton=el('button','lsh-temporary-test-close',
   back?'Rozumím – zpět do katalogu':'Rozumím');
  closeButton.type='button';
  actions.append(closeButton);
  dialog.append(heading,copy,actions);
  function close(){
   if(dialog.open&&typeof dialog.close==='function')dialog.close();
   dialog.remove();
   if(back){
    root.location.replace(new URL(back,root.document.baseURI).href);
   }else if(oldFocus&&oldFocus.isConnected&&typeof oldFocus.focus==='function'){
    oldFocus.focus();
   }
  }
  closeButton.addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
  root.document.body.appendChild(dialog);
  if(typeof dialog.showModal==='function')dialog.showModal();
  else dialog.setAttribute('open','');
  closeButton.focus();
 }
 function guardTeacherPage(returnToCatalog){
  const permitted=hasPreviewAccess();
  root.document.documentElement.dataset.lshTemporaryTestAccess=permitted?'developer':'locked';
  if(!permitted)showNotice({returnToCatalog});
  return permitted;
 }
 root.LSHTemporaryTestLock=Object.freeze({
  hasPreviewAccess,isLocked,showNotice,guardTeacherPage
 });
})(window);
