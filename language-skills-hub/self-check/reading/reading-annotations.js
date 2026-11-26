/* RL-02 pilot: text-range annotations without altering reading/question DOM.
 * Notes are never graded or transmitted; secure-test save/restore is caller-owned.
 */
(function(root){
 'use strict';
 const COLORS=Object.freeze(['yellow','green','pink','blue']);
 const TYPES=Object.freeze(['highlight','underline','note']);
 const MAX_ITEMS=80,MAX_NOTE=500,MAX_LENGTH=600;
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 function normalized(items){
  if(!Array.isArray(items))return [];
  return items.slice(0,MAX_ITEMS).filter(item=>
   item&&typeof item==='object'&&
   typeof item.anchor==='string'&&/^[a-z0-9:_-]{1,140}$/i.test(item.anchor)&&
   Number.isInteger(item.start)&&item.start>=0&&
   Number.isInteger(item.end)&&item.end>item.start&&item.end-item.start<=MAX_LENGTH&&
   TYPES.includes(item.kind)&&COLORS.includes(item.color)&&
   typeof item.note==='string'&&item.note.length<=MAX_NOTE&&
   typeof item.text==='string'&&item.text.length<=MAX_LENGTH
  ).map(item=>({anchor:item.anchor,start:item.start,end:item.end,
   text:item.text,kind:item.kind,color:item.color,note:item.note,
    ...(typeof item.id==='string'&&/^[a-z0-9_-]{1,100}$/i.test(item.id)?{id:item.id}:{}),
    ...(item.basis==='source-v1'?{basis:item.basis}:{})}));
 }
 function offset(node,at,target){
  const range=document.createRange();
  range.selectNodeContents(target);
  range.setEnd(node,at);
  return range.toString().length;
 }
 function bounds(target,start,end){
  if(start>=end)return null;
  const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT);
  let node,position=0,begin=null,finish=null;
  while((node=walker.nextNode())){
   const next=position+node.textContent.length;
   if(!begin&&start>=position&&start<=next)begin={node,offset:start-position};
   if(begin&&end>=position&&end<=next){finish={node,offset:end-position};break;}
   position=next;
  }
  if(!begin||!finish)return null;
  try{
   const range=document.createRange();
   range.setStart(begin.node,begin.offset);range.setEnd(finish.node,finish.offset);
   return range;
  }catch(_){return null}
 }
 // Resolve canonical source offsets, including the temporarily concealed sentence.
 function sourceRange(item,map){
  if(typeof item.text!=='string'||!item.text.length||item.end-item.start!==item.text.length)return null;
  if(!map)return item.basis==='source-v1'?null:{start:item.start,end:item.end};
  const {source,shift=0,min=0,gapShift=0,gapPrefix=0}=map;
  const offsets=item.basis==='source-v1'?[item.start]:
   [...new Set([item.start,...(gapShift&&item.start>=gapPrefix?[item.start+gapShift]:[])])];
  const matches=offsets.filter(start=>source.slice(start,start+item.text.length)===item.text);
  if(matches.length!==1||matches[0]-shift<min)return null;
  return {start:matches[0]-shift,end:matches[0]-shift+item.text.length};
 }
 function mount(config){
  const host=config?.host,containers=config?.containers||[];
  if(!host||!Array.isArray(containers)||!containers.length)
   throw new Error('Invalid Reading annotation mount');
  if(!root.CSS?.highlights||typeof root.Highlight!=='function')
   throw new Error('CSS text highlight API unavailable');
  let items=[],selected=null,enabled=false,noteDraft=null,editingId=null,color='yellow';
  const undoHistory=[];const MAX_UNDO=20;
  let idSequence=0,interactionEpoch=0,inputMethod=null,confirmPress=null,editorReturn=null;
  const newId=()=>root.crypto?.randomUUID?.()||('a-'+Date.now().toString(36)+'-'+(++idSequence)+'-'+Math.random().toString(36).slice(2));
  function withIds(value){
   const used=new Set();
   return normalized(value).map((item,index)=>{
    let id=item.id||'legacy-'+index;
    while(used.has(id))id='legacy-'+index+'-'+(++idSequence);
    used.add(id);return {...item,id};
   });
  }
  let armed=null; // Explicit tool activation; a selected tool remains armed for repeated ranges.
   const toggle=config.toggle||host.querySelector('[data-anno-toggle]');
   if(!toggle)throw new Error('Missing Reading annotation toggle');
  const status=host.querySelector('[data-anno-status]');
  const list=host.querySelector('[data-anno-list]');
  const noteBox=host.querySelector('[data-anno-note-box]');
  const noteInput=host.querySelector('[data-anno-note]');
  const clearAll=host.querySelector('[data-anno-clear-all]');
  const clearConfirm=host.querySelector('[data-anno-clear-confirm]');
  const clearConfirmAction=host.querySelector('[data-anno-clear-confirm-action]');
  const clearCancel=host.querySelector('[data-anno-clear-cancel]');
  const noteCancel=document.createElement('button');
  noteCancel.type='button';noteCancel.className='action';noteCancel.textContent='Zrušit';
  noteCancel.dataset.annoCancelNote='';
  if(noteBox)noteBox.appendChild(noteCancel);
  // F3: enhance both existing Reading surfaces in place. Do not clone
  // selectable reading DOM or create additional primary tool identities.
  const primary=host.querySelector('.lsh-annotation-buttons');
  const toolButtons=Array.from(host.querySelectorAll('[data-anno-color],[data-anno-underline],[data-anno-start-note]'));
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const makeButton=(cls,text)=>{const el=make('button',cls,text);el.type='button';return el;};
   const setText=(el,value)=>{if(el.textContent!==value)el.textContent=value;};
  const activeLabel=make('span','lsh-anno-active-label','Žádný nástroj');
  activeLabel.dataset.annoActiveTool='';
  const head=host.querySelector('.lsh-annotation-head');head?.appendChild(activeLabel);
  const help=host.querySelector('.lsh-annotation-help');
  if(help){const details=make('details','lsh-anno-help');details.append(make('summary',null,'Jak anotovat'));help.before(details);details.append(help);}
  const undo=makeButton('action lsh-anno-undo','↶ Zpět');undo.dataset.annoUndo='';
  undo.setAttribute('aria-label','Vrátit poslední změnu');undo.title='Vrátit poslední změnu (nejvýše 20 změn v aktuální variantě, do obnovení stránky)';undo.disabled=true;
  primary?.append(undo);
  const library=make('details','lsh-anno-library');library.open=true;library.dataset.annoLibrary='';
  const librarySummary=make('summary','lsh-anno-library-summary');
  const libraryCount=make('span','lsh-anno-count','0');libraryCount.dataset.annoCount='';
  librarySummary.append(make('strong',null,'Moje anotace'),libraryCount);library.append(librarySummary);
  const empty=make('p','lsh-anno-empty','Zatím zde nejsou žádné anotace.');
  const manage=make('div','lsh-anno-manage');
  if(clearAll){clearAll.textContent='Smazat vše';manage.append(clearAll);}
  if(list){list.before(library);library.append(manage);if(clearConfirm)library.append(clearConfirm);library.append(empty,list);list.tabIndex=0;list.setAttribute('role','region');}
  const noteQuote=make('blockquote','lsh-anno-editor-quote');noteQuote.dataset.annoEditorQuote='';
  const noteCount=make('span','lsh-anno-editor-count','0 / '+MAX_NOTE);noteCount.dataset.annoNoteCount='';
  noteCount.id=(host.id||'readingAnnotations')+'-note-count';
  const noteActions=make('div','lsh-anno-editor-actions');
  if(noteBox&&noteInput){
   noteBox.prepend(noteQuote);noteInput.after(noteCount);
   noteInput.setAttribute('aria-describedby',noteCount.id);noteInput.addEventListener('input',updateEditorCount);
   const saveNote=host.querySelector('[data-anno-save-note]');
   if(saveNote)noteActions.append(saveNote);noteActions.append(noteCancel);noteBox.append(noteActions);
  }
  function updateEditorCount(){noteCount.textContent=(noteInput?.value.length||0)+' / '+MAX_NOTE;}
  function closeEditor(restoreFocus=false){
   const previous=editorReturn;editorReturn=null;noteDraft=null;editingId=null;
   if(noteInput)noteInput.value='';
   if(noteBox)noteBox.hidden=true;
   noteQuote.textContent='';updateEditorCount();syncChrome();
   if(restoreFocus)focusReturn(previous,true);
  }
  const editorOpen=()=>!!noteBox&&!noteBox.hidden;
  noteCancel.addEventListener('click',()=>{closeEditor(true);cancelPending();setStatus('Úprava poznámky zrušena.')});
  // The first click chooses a tool; no colour is implicitly active.
  host.querySelectorAll('[data-anno-color],[data-anno-underline],[data-anno-start-note]')
   .forEach(button=>button.setAttribute('aria-pressed','false'));
  const hasLocked=()=>typeof config.canEdit==='function'&&!config.canEdit();
  const isTarget=node=>containers.some(parent=>parent.contains(node));
  const targetFor=node=>{
   const element=node?.nodeType===Node.ELEMENT_NODE?node:node?.parentElement;
   const target=element?.closest('[data-annotation-anchor]');
   return target&&isTarget(target)?target:null;
  };
  const clearSelection=()=>{selected=null;confirmPress=null;syncConfirmation()};
  const setStatus=(message,urgent=false)=>{if(status)status.textContent=message;dockMessage.textContent=message;dockNotice.textContent=urgent?message:'';dockNotice.hidden=!urgent;syncChrome()};
  let saveError='';
  const save=()=>{saveError='';try{
   const result=config.onChange?.(snapshot());
   if(typeof result==='string'){saveError=result;return false;}
   return result!==false;
  }catch(_){return false}};
  // Roll back every mutation if persistence rejects it.
  function commit(next,message,remember=true){
   const previous=items;items=next;
   if(!save()){
    items=previous;
    setStatus(saveError||'Změnu nelze trvale uložit. Původní anotace zůstaly zachované.',true);
    return false;
   }
   if(remember){undoHistory.push(previous);if(undoHistory.length>MAX_UNDO)undoHistory.shift();}
   interactionEpoch++;hideNote();paint();setStatus(message);return true;
  }
  const highlightKeys=[...COLORS,'underline','note'];
  const getAnchor=id=>{
   for(const container of containers){
    for(const el of container.querySelectorAll('[data-annotation-anchor]'))
     if(el.dataset.annotationAnchor===id)return el;
   }
   return null;
  };
  function itemRange(target,item){
   if(!target)return null;
   const pos=sourceRange(item,config.anchorMapping?.(target));
   if(!pos)return null;
   const range=bounds(target,pos.start,pos.end);
   return range&&range.toString()===item.text?range:null;
  }
  // F2: touch, pen and keyboard selection require an explicit confirmation.
  const confirmBar=document.createElement('div');
  confirmBar.className='lsh-anno-confirm-selection';confirmBar.hidden=true;confirmBar.lang='cs';
  confirmBar.setAttribute('role','group');confirmBar.setAttribute('aria-label','Potvrdit označený text');
  const confirmLabel=document.createElement('span');confirmLabel.className='lsh-anno-confirm-label';
  const applySelection=document.createElement('button');applySelection.type='button';
  applySelection.dataset.annoApplySelection='';applySelection.textContent='Použít nástroj';
  const cancelSelection=document.createElement('button');cancelSelection.type='button';
  cancelSelection.dataset.annoCancelSelection='';cancelSelection.textContent='Zrušit výběr';
  confirmBar.append(confirmLabel,applySelection,cancelSelection);document.body.appendChild(confirmBar);
  const toolName=()=>armed==='note'?'Poznámka':armed==='underline'?'Podtržení':({yellow:'Žluté zvýraznění',green:'Zelené zvýraznění',pink:'Růžové zvýraznění',blue:'Modré zvýraznění'}[color]);
  function viewport(){
   const v=root.visualViewport;
   return {left:v?.offsetLeft||0,top:v?.offsetTop||0,width:v?.width||root.innerWidth,height:v?.height||root.innerHeight};
  }
  // The quick palette is an optional shortcut to the same actions, not
  // a second annotation engine. It stays collapsed unless explicitly opened.
  const dock=make('aside','lsh-anno-dock');dock.hidden=true;dock.lang='cs';dock.setAttribute('aria-label','Rychlé anotační nástroje');
  const dockToggle=makeButton('lsh-anno-dock-toggle','Nástroje');dockToggle.dataset.annoDockToggle='';
  dockToggle.setAttribute('aria-expanded','false');dockToggle.setAttribute('aria-controls',(host.id||'readingAnnotations')+'-quick');
  const dockPanel=make('div','lsh-anno-dock-panel');dockPanel.hidden=true;dockPanel.id=dockToggle.getAttribute('aria-controls');
  const dockTitle=make('strong','lsh-anno-dock-title','Anotace');
  const dockTools=make('div','lsh-anno-dock-tools');
  const dockMessage=make('p','lsh-anno-dock-message');
  const dockNotice=make('p','lsh-anno-dock-notice');dockNotice.hidden=true;
  const dockNotes=makeButton('lsh-anno-quick-button','Moje anotace (0)');dockNotes.dataset.annoDockNotes='';
  const dockUndo=makeButton('lsh-anno-quick-button','↶ Zpět');dockUndo.dataset.annoQuickUndo='';dockUndo.setAttribute('aria-label','Vrátit poslední změnu');
  const shortcuts=toolButtons.map(source=>{
   const key=source.dataset.annoColor||(source.hasAttribute('data-anno-underline')?'underline':'note');
   const button=makeButton('lsh-anno-quick-button',source.textContent);
   button.dataset.annoQuickTool=key;button.dataset.annoSwatch=key;button.setAttribute('aria-pressed','false');
   button.addEventListener('click',()=>{
    if(!enabled||hasLocked()||editorOpen()||selected||confirmPress||source.disabled)return;
    source.click();setDockOpen(false,true);
   });
   dockTools.append(button);return {source,button,key};
  });
  const dockActions=make('div','lsh-anno-dock-actions');dockActions.append(dockUndo,dockNotes);
  dockPanel.append(dockTitle,dockTools,dockActions,dockMessage);
  dock.append(dockNotice,dockPanel,dockToggle);document.body.appendChild(dock);
  let dockFrame=0,dockOpen=false;
  function setDockOpen(open,focus=false){
   dockOpen=open;dockPanel.hidden=!open;dockToggle.setAttribute('aria-expanded',String(open));
   if(focus)dockToggle.focus({preventScroll:true});
   scheduleDock();
  }
  function positionDock(){
   dockFrame=0;
   const v=viewport(),r=primary?.getBoundingClientRect(),topbar=document.querySelector('.topbar');
   const sticky=topbar&&getComputedStyle(topbar).position==='sticky'?topbar.getBoundingClientRect():null;
   const top=Math.max(v.top,sticky&&sticky.bottom>v.top&&sticky.top<=v.top+4?sticky.bottom:v.top);
   const visibleHeight=r?Math.max(0,Math.min(r.bottom,v.top+v.height)-Math.max(r.top,top)):0;
   const toolbarInView=!!r&&r.height>0&&visibleHeight>=Math.min(r.height,54);
   const available=enabled&&!hasLocked()&&!editorOpen()&&!selected&&!confirmPress&&!popupPinned&&!toolbarInView&&v.height>=220;
   dock.hidden=!available;
   if(!available){if(dockOpen)setDockOpen(false);return;}
   const returnButton=document.getElementById('backToQuestion');
   const returnVisible=returnButton&&!returnButton.hidden&&returnButton.getClientRects().length;
   const offset=returnVisible?76:12;
   dock.style.maxWidth=Math.min(340,Math.max(0,v.width-24))+'px';
   dockPanel.style.maxHeight=Math.max(76,Math.min(340,v.height-offset-76))+'px';
   const size=dock.getBoundingClientRect();
   dock.style.left=Math.max(v.left+12,v.left+v.width-size.width-12)+'px';
   dock.style.top=Math.max(v.top+8,v.top+v.height-size.height-offset)+'px';
  }
  function scheduleDock(){
   if(!dockFrame)dockFrame=root.requestAnimationFrame(positionDock);
  }
  function syncChrome(){
   const active=armed?toolName():'Žádný nástroj';
   setText(activeLabel,armed?'Aktivní: '+active:active);activeLabel.dataset.annoSwatch=armed==='highlight'?color:armed||'none';
   const unavailable=!enabled||hasLocked()||editorOpen()||!!(clearConfirm&&!clearConfirm.hidden);
   undo.disabled=unavailable||!undoHistory.length;dockUndo.disabled=undo.disabled;
   setText(libraryCount,String(items.length));setText(dockNotes,'Moje anotace ('+items.length+')');
   empty.hidden=items.length!==0;if(list)list.hidden=!items.length;
   setText(dockTitle,armed?'Aktivní: '+active:'Vyberte nástroj');
   const short=armed==='highlight'?({yellow:'žlutě',green:'zeleně',pink:'růžově',blue:'modře'}[color]):armed==='underline'?'podtržení':armed==='note'?'poznámka':'';
   setText(dockToggle,short?'Nástroje · '+short:'Nástroje');dockToggle.dataset.annoSwatch=armed==='highlight'?color:armed||'none';
   for(const {source,button} of shortcuts){button.setAttribute('aria-pressed',source.getAttribute('aria-pressed')||'false');button.disabled=unavailable||source.disabled;}
   scheduleDock();
  }
  function undoLast(){
   if(!enabled||hasLocked()||editorOpen()||!undoHistory.length||(clearConfirm&&!clearConfirm.hidden))return;
   const previous=undoHistory.at(-1);
   if(commit(previous,'Poslední změna vrácena.',false)){undoHistory.pop();cancelPending();syncChrome();}
  }
  undo.addEventListener('click',undoLast);dockUndo.addEventListener('click',undoLast);
  dockToggle.addEventListener('click',()=>setDockOpen(!dockOpen));
  dockNotes.addEventListener('click',()=>{
   if(!enabled||hasLocked()||editorOpen())return;
   library.open=true;setDockOpen(false);librarySummary.scrollIntoView({block:'center',behavior:'instant'});librarySummary.focus({preventScroll:true});
  });
  document.addEventListener('pointerdown',event=>{if(dockOpen&&!dock.contains(event.target))setDockOpen(false);},true);
  if(typeof IntersectionObserver==='function'&&primary)new IntersectionObserver(scheduleDock,{threshold:[0,.25,.5,1]}).observe(primary);
  if(typeof ResizeObserver==='function'&&primary)new ResizeObserver(scheduleDock).observe(primary);
  function positionConfirmation(){
   if(confirmBar.hidden)return;
   const v=viewport();confirmBar.style.width=Math.min(360,Math.max(0,v.width-20))+'px';
   const size=confirmBar.getBoundingClientRect(),record=selected||confirmPress?.record;
   const range=record&&itemRange(getAnchor(record.anchor),record),rect=range?.getBoundingClientRect();
   const bottom=v.top+v.height-size.height-12;
   const top=rect&&rect.bottom>bottom-24&&rect.top-size.height-20>=v.top+10?rect.top-size.height-20:bottom;
   confirmBar.style.left=v.left+(v.width-size.width)/2+'px';confirmBar.style.top=Math.max(v.top+8,top)+'px';
  }
  function syncConfirmation(){
   const visible=enabled&&!hasLocked()&&!editorOpen()&&!!armed&&!!(selected||confirmPress?.record)&&['touch','pen','keyboard'].includes(inputMethod);
   confirmBar.hidden=!visible;
   if(visible){confirmLabel.textContent=toolName();positionConfirmation()}
   syncChrome();
  }
  function cancelPending(removeRange=true){
   interactionEpoch++;clearSelection();
   const sel=root.getSelection?.();
   if(removeRange&&sel&&!sel.isCollapsed&&targetFor(sel.anchorNode))sel.removeAllRanges();
  }
  applySelection.addEventListener('pointerdown',event=>{
   if(!enabled||hasLocked()||editorOpen())return;
   capture();if(!selected)return;
   confirmPress={record:{...selected},epoch:interactionEpoch,tool:armed,color};
   if(event.pointerType==='mouse')event.preventDefault();
  });
  applySelection.addEventListener('click',()=>{
   if(!enabled||hasLocked()||editorOpen())return;
   const pending=confirmPress;confirmPress=null;
   if(pending&&pending.epoch===interactionEpoch&&pending.tool===armed&&pending.color===color)selected=pending.record;
   else capture();
   applyArmedSelection();syncConfirmation();
  });
  cancelSelection.addEventListener('pointerdown',event=>{
   if(event.pointerType==='mouse')event.preventDefault();
   if(selected)confirmPress={record:{...selected},epoch:interactionEpoch,tool:armed,color};
  });
  cancelSelection.addEventListener('click',()=>{cancelPending();setStatus('Výběr zrušen.')});
  confirmBar.addEventListener('pointercancel',()=>{confirmPress=null;capture()});
  function resetTool(){
   armed=null;inputMethod=null;
   host.querySelectorAll('[data-anno-color],[data-anno-underline],[data-anno-start-note]').forEach(el=>el.setAttribute('aria-pressed','false'));
   cancelPending();
  }
  function keyboardTargets(){
   for(const container of containers)for(const target of container.querySelectorAll('[data-annotation-anchor]')){
    if(enabled&&!hasLocked()){
     if(!target.hasAttribute('tabindex')){target.tabIndex=0;target.dataset.annoKeyboardFocus='';}
    }else if(target.hasAttribute('data-anno-keyboard-focus')){
     target.removeAttribute('tabindex');target.removeAttribute('data-anno-keyboard-focus');
    }
   }
  }
  function focusReturn(ref,scroll=false){
   if(!ref)return;
   const target=ref.anchor?getAnchor(ref.anchor):Array.from(list?.querySelectorAll('[data-annotation-id]')||[]).find(row=>row.dataset.annotationId===ref.id)?.querySelector('[data-anno-action="'+ref.action+'"]');
   if(target?.isConnected&&target.getClientRects().length){
    target.focus({preventScroll:true});
    if(scroll)target.scrollIntoView({block:'nearest',behavior:'instant'});
   }else if(ref.id&&clearAll&&!clearAll.disabled)clearAll.focus({preventScroll:true});
  }
  function openEditor(ref){
   editorReturn=ref;
   const record=noteDraft||items.find(item=>item.id===editingId);
   noteQuote.textContent=record?'„'+record.text+'“':'';updateEditorCount();syncConfirmation();
   if(noteInput){noteInput.focus({preventScroll:true});noteBox?.scrollIntoView({block:'nearest',behavior:'instant'});}
  }
  function keyboardSelect(event,anchor){
   const sel=root.getSelection?.(),str=anchor.textContent||'',size=str.length;
   if(!sel||!size)return false;
   let fixed=(event.key==='ArrowLeft'||event.key==='Home')?size:0,cursor=fixed;
   if(sel.rangeCount&&targetFor(sel.anchorNode)===anchor&&targetFor(sel.focusNode)===anchor){
    try{fixed=offset(sel.anchorNode,sel.anchorOffset,anchor);cursor=offset(sel.focusNode,sel.focusOffset,anchor)}catch(_){}
   }
   const steps=[0];let count=0;
   const graphemes=typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(str),x=>x.segment):Array.from(str);
   for(const ch of graphemes){count+=ch.length;steps.push(count)}
   if(event.key==='Home')cursor=0;
   else if(event.key==='End')cursor=size;
   else if(event.key==='ArrowLeft')cursor=steps.filter(x=>x<cursor).at(-1)??0;
   else cursor=steps.find(x=>x>cursor)??size;
   const lo=Math.min(fixed,cursor),hi=Math.max(fixed,cursor);
   if(lo===hi){
    const unit=lo<size?bounds(anchor,lo,lo+1):bounds(anchor,lo-1,lo);
    if(unit){unit.collapse(lo<size);sel.removeAllRanges();sel.addRange(unit)}
    else sel.removeAllRanges();
   }else{
    const range=bounds(anchor,lo,hi);if(!range)return false;
    sel.removeAllRanges();
    if(typeof sel.setBaseAndExtent==='function'&&fixed>cursor)sel.setBaseAndExtent(range.endContainer,range.endOffset,range.startContainer,range.startOffset);
    else sel.addRange(range);
   }
   capture();return true;
  }
  // CSS Highlights preserve the original question and answer DOM, but do not
  // receive pointer events. Hit-test only stored note ranges on the source text.
  const popup=root.document.createElement('aside');
  popup.className='lsh-annotation-popover';popup.hidden=true;popup.lang='cs';
  popup.setAttribute('aria-label','Uložená poznámka');
  const popupLabel=root.document.createElement('strong');
  popupLabel.className='lsh-annotation-popover-label';popupLabel.textContent='Poznámka';
  const popupQuote=root.document.createElement('div');
  popupQuote.className='lsh-annotation-popover-quote';
  const popupText=root.document.createElement('p');
  popupText.className='lsh-annotation-popover-text';
  const popupClose=root.document.createElement('button');
  popupClose.type='button';popupClose.className='lsh-annotation-popover-close';
  popupClose.textContent='Zavřít';popupClose.setAttribute('aria-label','Zavřít poznámku');
  popup.append(popupLabel,popupQuote,popupText,popupClose);
  root.document.body.appendChild(popup);
  let popupIndex=-1,popupPinned=false,popupReturnFocus=null,popupPoint=null;
  function hideNote(restoreFocus=false){
   if(popup.hidden)return;
   popup.hidden=true;popupIndex=-1;popupPinned=false;popupPoint=null;
   popup.classList.remove('lsh-annotation-popover-pinned');
   if(restoreFocus&&popupReturnFocus)focusReturn(popupReturnFocus,true);
   scheduleDock();
   popupReturnFocus=null;
  }
  popupClose.addEventListener('click',()=>hideNote(true));
  function noteAtPoint(x,y,origin){
   const anchor=targetFor(origin);
   if(!anchor)return -1;
   for(let i=items.length-1;i>=0;i--){
    const item=items[i];
    if(item.kind!=='note'||!item.note.trim()||item.anchor!==anchor.dataset.annotationAnchor)continue;
    const range=itemRange(anchor,item);
    if(!range)continue;
    for(const rect of range.getClientRects()){
     if(x>=rect.left-1&&x<=rect.right+1&&y>=rect.top-1&&y<=rect.bottom+1)return i;
    }
   }
   return -1;
  }
  function showNote(index,x,y,pinned=false,returnFocus=null){
   if(!enabled||hasLocked()||items[index]?.kind!=='note'){hideNote();return}
   const item=items[index];
   if(popupIndex!==index||popupPinned!==pinned){
    popupQuote.textContent='„'+item.text+'“';
    popupText.textContent=item.note;
   }
   popupIndex=index;popupPinned=pinned;popupReturnFocus=returnFocus;popupPoint={x,y};
   popup.hidden=false;popup.setAttribute('role',pinned?'dialog':'tooltip');
   popup.classList.toggle('lsh-annotation-popover-pinned',pinned);
   popupClose.hidden=!pinned;positionPopup();scheduleDock();
   if(pinned&&returnFocus)popupClose.focus({preventScroll:true});
   }
   function positionPopup(){
    if(popup.hidden||!popupPoint)return;
    const v=viewport(),{x,y}=popupPoint;
    popup.style.width=Math.min(340,Math.max(0,v.width-20))+'px';
    popup.style.maxHeight=Math.max(0,Math.min(320,v.height*.42,v.height-20))+'px';
    const size=popup.getBoundingClientRect();
    const left=Math.min(Math.max(v.left+10,x+10),Math.max(v.left+10,v.left+v.width-size.width-10));
    const below=y+16,limit=v.top+v.height-size.height-10;
    const top=Math.max(v.top+10,Math.min(limit,below<=limit?below:y-size.height-16));
    popup.style.left=left+'px';popup.style.top=top+'px';
   }
  function openNoteFromList(index,button){
   if(!enabled||hasLocked())return;
   const item=items[index],anchor=getAnchor(item.anchor);
   const range=itemRange(anchor,item);
   const noteRect=range?.getBoundingClientRect();
   const buttonRect=button.getBoundingClientRect();
   const rect=noteRect&&noteRect.bottom>0&&noteRect.top<root.innerHeight?noteRect:buttonRect;
   showNote(index,rect.left,rect.bottom,true,{id:item.id,action:'view'});
  }
  function paint(){
   // The card may repaint while the cursor is over the note. Preserve a
   // preview when its original anchored text still exists after the repaint.
   if(popupIndex>=0){
    const active=items[popupIndex],anchor=active&&getAnchor(active.anchor);
    const range=active&&itemRange(anchor,active);
    if(!enabled||!active||active.kind!=='note'||!range)hideNote();
   }
   const groups=Object.fromEntries(highlightKeys.map(key=>[key,[]]));
   for(const item of items){
    const target=getAnchor(item.anchor);
    if(!target)continue;
    const range=itemRange(target,item);
    if(!range)continue;
    groups[item.kind==='highlight'?item.color:item.kind].push(range);
   }
   for(const key of highlightKeys){
    const name='lsh-anno-'+key;
    root.CSS.highlights.set(name,new root.Highlight(...groups[key]));
   }
   renderList();
  }
  function renderList(){
   if(clearAll)clearAll.disabled=!items.length||hasLocked();
   syncChrome();if(!list)return;
   const oldScroll=list.scrollTop;
   const focused=list.contains(document.activeElement)?document.activeElement:null;
   const focusRef=focused?{id:focused.closest('[data-annotation-id]')?.dataset.annotationId,action:focused.dataset.annoAction}:null;
   list.replaceChildren();
   items.forEach((item,index)=>{
    const row=document.createElement('div');row.className='lsh-annotation-item';row.dataset.annotationId=item.id;
    const description=make('div','lsh-annotation-item-label');
    const snippet=item.text.length>130?item.text.slice(0,127)+'…':item.text;
    const kind=make('span','lsh-anno-item-kind',item.kind==='underline'?'Podtržení':item.kind==='note'?'Poznámka':({yellow:'Žluté zvýraznění',green:'Zelené zvýraznění',pink:'Růžové zvýraznění',blue:'Modré zvýraznění'}[item.color]));
    kind.dataset.annoSwatch=item.kind==='highlight'?item.color:item.kind;
    description.append(kind,make('div','lsh-anno-item-quote','„'+snippet+'“'));
    if(item.note)description.append(make('div','lsh-anno-item-note',item.note));
    if(!itemRange(getAnchor(item.anchor),item))description.append(make('span','lsh-anno-item-unavailable','Úsek není právě zobrazen.'));
    const remove=document.createElement('button');remove.type='button';
    remove.className='action ghost';remove.textContent='Smazat';
    remove.setAttribute('aria-label','Smazat anotaci '+(index+1));remove.dataset.annoAction='remove';
    remove.addEventListener('click',()=>{
     if(hasLocked())return;
     if(commit(items.filter(record=>record.id!==item.id),'Anotace odstraněna.')&&editingId===item.id)closeEditor();
    });
    const actions=document.createElement('span');actions.className='lsh-annotation-actions';
    if(item.kind==='note'){
     const show=document.createElement('button');show.type='button';
     show.className='action ghost lsh-annotation-view-note';show.textContent='Zobrazit';
     show.setAttribute('aria-label','Zobrazit poznámku '+(index+1));show.dataset.annoAction='view';
     show.addEventListener('click',()=>openNoteFromList(index,show));
     actions.appendChild(show);
    }
    const edit=document.createElement('button');edit.type='button';edit.className='action ghost';
    edit.textContent=item.kind==='note'?'Upravit poznámku':item.kind==='underline'?'Zvýraznit':'Změnit barvu';
    edit.setAttribute('aria-label','Upravit anotaci '+(index+1));edit.dataset.annoAction='edit';
    edit.addEventListener('click',()=>{
     if(hasLocked())return;
     if(item.kind==='note'){
      if(editorOpen()){setStatus('Nejprve uložte nebo zrušte rozpracovanou poznámku.');return;}
      editingId=item.id;noteDraft=null;
      if(noteBox)noteBox.hidden=false;
      if(noteInput)noteInput.value=item.note;
     openEditor({id:item.id,action:'edit'});
      return;
     }
     const changed=item.kind==='underline'?{...item,kind:'highlight',color}:
      {...item,color:COLORS[(COLORS.indexOf(item.color)+1)%COLORS.length]};
     commit(items.map(record=>record.id===item.id?changed:record),'Anotace upravena.');
    });
    actions.append(edit,remove);row.append(description,actions);list.appendChild(row);
    });
    list.scrollTop=oldScroll;
   if(focusRef?.id&&focusRef.action)focusReturn(focusRef);
    }
    function capture(){
   const ok=readSelection();syncConfirmation();return ok;
  }
  function readSelection(){
   selected=null;
   if(!enabled||hasLocked()||editorOpen())return false;
   const sel=root.getSelection?.();
   if(!sel||sel.rangeCount!==1||sel.isCollapsed)return;
   const range=sel.getRangeAt(0);
   const startTarget=targetFor(range.startContainer),endTarget=targetFor(range.endContainer);
   if(!startTarget||startTarget!==endTarget){setStatus('Označte úsek uvnitř jednoho odstavce nebo jedné otázky.');return false;}
   let start,end;
   try{
    start=offset(range.startContainer,range.startOffset,startTarget);
    end=offset(range.endContainer,range.endOffset,startTarget);
   }catch(_){return;}
   const text=range.toString();
   if(start>=end||!text.trim())return;
   if(text.length>MAX_LENGTH){setStatus('Vyberte kratší úsek textu (nejvýše 600 znaků).');return;}
   const map=config.anchorMapping?.(startTarget);
   if(map){
    if(start<map.min||map.source.slice(start+map.shift,end+map.shift)!==text){
     setStatus('Vyberte pouze skutečný text, nikoli značku chybějící věty.');return false;
    }
    selected={anchor:startTarget.dataset.annotationAnchor,start:start+map.shift,end:end+map.shift,text,basis:'source-v1'};
   }else selected={anchor:startTarget.dataset.annotationAnchor,start,end,text};
   setStatus('Označený text připraven: '+text.slice(0,55)+(text.length>55?'…':''));
   return true;
  }
  function add(kind,note=''){
   if(!enabled||hasLocked()){setStatus('Anotace jsou teď nedostupné.');return false;}
   if(!selected||!itemRange(getAnchor(selected.anchor),selected)){clearSelection();setStatus('Nejdříve označte text nebo část otázky.');return false;}
   if(items.length>=MAX_ITEMS){setStatus('Limit 80 anotací v této variantě.',true);return false;}
   if(kind==='note'&&!note.trim()){setStatus('Napište poznámku.');return false;}
   const item={...selected,id:newId(),kind,color,note:note.slice(0,MAX_NOTE)};
   if(!commit([...items,item],'Anotace uložena.'))return false;
   clearSelection();root.getSelection?.()?.removeAllRanges();return true;
  }
  function setModeButton(button,kind){
   interactionEpoch++;confirmPress=null;
   const same=armed===kind&&(kind!=='highlight'||color===button.dataset.annoColor);
   armed=same&&!selected?null:kind;
   if(kind==='highlight'&&armed)color=button.dataset.annoColor;
   host.querySelectorAll('[data-anno-color],[data-anno-underline],[data-anno-start-note]')
    .forEach(el=>el.setAttribute('aria-pressed',String(Boolean(armed)&&el===button)));
   syncConfirmation();
   // Tool changes cannot silently replace an open editor.
  }
  function startNote(){
   if(editorOpen()){setStatus('Nejprve uložte nebo zrušte rozpracovanou poznámku.');return;}
   if(!selected||!itemRange(getAnchor(selected.anchor),selected)){setStatus('Vyberte slovo nebo úsek textu pro poznámku.');return;}
   noteDraft=selected;const anchor=selected.anchor;editingId=null;clearSelection();
   root.getSelection?.()?.removeAllRanges();
   if(noteBox)noteBox.hidden=false;
   if(noteInput)noteInput.value='';openEditor({anchor});
  }
  function applyArmedSelection(){
   if(!enabled||hasLocked()||editorOpen()||!selected||!armed)return;
   if(armed==='note')startNote();
   else add(armed);
  }
  toggle?.addEventListener('click',()=>{
   if(hasLocked())return;
   if(editorOpen()){setStatus('Nejprve uložte nebo zrušte rozpracovanou poznámku.');return;}
   interactionEpoch++;
   enabled=!enabled;
   hideNote();
   host.classList.toggle('lsh-anno-enabled',enabled);
   toggle.setAttribute('aria-pressed',String(enabled));
   toggle.textContent=enabled?'Vypnout poznámky':'Zapnout poznámky';
   host.querySelector('[data-anno-controls]').hidden=!enabled;
   if(noteBox)noteBox.hidden=true;
   if(clearConfirm)clearConfirm.hidden=true;
   closeEditor();
   clearSelection();
   if(!enabled){resetTool();for(const key of highlightKeys)root.CSS.highlights.delete('lsh-anno-'+key);}
   else paint();
   keyboardTargets();
   config.onToggle?.(enabled);
   setStatus(enabled?
    'Myš: označujte opakovaně. Prst a stylus: dokončete výběr a potvrďte nástroj. Klávesnice: Tab, Shift+šipka a Enter.':
    'Poznámky jsou skryté, nikoli smazané.');
  });
  // Keep a live selection while clicking a tool; elsewhere collapse invalidates it.
  host.addEventListener('pointerdown',event=>{
   if(event.pointerType==='mouse'&&event.target.closest?.('[data-anno-color],[data-anno-underline],[data-anno-start-note]')&&capture())
    event.preventDefault();
  });
  host.querySelectorAll('[data-anno-color]').forEach(button=>button.addEventListener('click',()=>{
   if(editorOpen()||hasLocked())return;
   setModeButton(button,'highlight');
   if(selected)add('highlight');
   else setStatus(armed?'Barva je aktivní. Označujte další pasáže.':'Zvýrazňování vypnuto.');
  }));
  host.querySelector('[data-anno-underline]')?.addEventListener('click',event=>{
   if(editorOpen()||hasLocked())return;
   setModeButton(event.currentTarget,'underline');
   if(selected)add('underline');
   else setStatus(armed?'Podtržení je aktivní. Označujte další pasáže.':'Podtržení vypnuto.');
  });
  host.querySelector('[data-anno-start-note]')?.addEventListener('click',event=>{
   if(editorOpen()||hasLocked())return;
   setModeButton(event.currentTarget,'note');
   if(selected)startNote();
   else setStatus(armed?'Poznámky jsou aktivní. Označte text pro vložení poznámky.':'Vkládání poznámek vypnuto.');
  });
  clearAll?.addEventListener('click',()=>{
   if(!enabled||hasLocked()||!items.length||editorOpen())return;
   if(!clearConfirm)return;
   clearConfirm.hidden=false;
   clearConfirmAction?.focus({preventScroll:true});
   setStatus('Smazání všech anotací vyžaduje potvrzení.');
  });
  clearCancel?.addEventListener('click',()=>{
   if(clearConfirm)clearConfirm.hidden=true;
   clearAll?.focus({preventScroll:true});
   setStatus('Smazání zrušeno. Anotace zůstaly zachované.');
  });
  clearConfirmAction?.addEventListener('click',()=>{
   if(!enabled||hasLocked()||!items.length||editorOpen())return;
   if(!commit([],'Všechna zvýraznění, podtržení i poznámky této varianty byly smazány.'))return;
   if(clearConfirm)clearConfirm.hidden=true;
   closeEditor();clearSelection();syncChrome();
  });
  host.querySelector('[data-anno-save-note]')?.addEventListener('click',()=>{
   if(hasLocked()||!enabled||!editorOpen())return;
   const content=(noteInput?.value||'').trim();
   if(!content){setStatus('Napište poznámku.');return;}
   if(editingId!==null){
    if(!items.some(item=>item.id===editingId&&item.kind==='note')){setStatus('Původní poznámka již neexistuje.');return;}
    if(!commit(items.map(item=>item.id===editingId?{...item,note:content.slice(0,MAX_NOTE)}:item),'Poznámka upravena.'))return;
   }else{
    selected=noteDraft;if(!selected||!add('note',content))return;
   }
   closeEditor(true);
   });
   // Native selection can outlive a touch pointer (selection handles).
  // Only mouse release commits automatically; touch/pen never write on a timer.
  root.document?.addEventListener('selectionchange',()=>{if(enabled)capture()});
  for(const container of containers){
   container.addEventListener('pointerdown',event=>{
    if(!enabled||hasLocked()||editorOpen()||event.target.closest?.('button,input,select,textarea,a'))return;
    interactionEpoch++;confirmPress=null;selected=null;
    inputMethod=event.pointerType||'mouse';syncConfirmation();
   });
   container.addEventListener('touchstart',()=>{
    if(enabled&&!hasLocked()&&!editorOpen()){inputMethod='touch';confirmPress=null;}
   },{passive:true});
   container.addEventListener('pointercancel',event=>{
    if(event.pointerType==='mouse')cancelPending();
    else if(enabled){inputMethod=event.pointerType||'touch';capture();}
   });
   container.addEventListener('pointerup',event=>{
    const epoch=interactionEpoch;
    if(event.pointerType==='mouse'&&event.button===0){
     inputMethod='mouse';
     root.setTimeout(()=>{
      if(epoch!==interactionEpoch||!enabled||hasLocked()||editorOpen()||!armed||inputMethod!=='mouse')return;
      if(!root.getSelection?.()||root.getSelection().isCollapsed){clearSelection();return;}
      clearSelection();capture();applyArmedSelection();
     },0);
    }else{
     if(event.pointerType==='touch'||event.pointerType==='pen')inputMethod=event.pointerType;
     root.setTimeout(()=>{if(epoch===interactionEpoch)capture()},0);
    }
    if(event.pointerType==='touch'||event.pointerType==='pen'){
     const index=noteAtPoint(event.clientX,event.clientY,event.target);
     if(index>=0&&root.getSelection?.()?.isCollapsed){
      const x=event.clientX,y=event.clientY,id=items[index]?.id;
      root.setTimeout(()=>{
       const current=items.findIndex(item=>item.id===id);
       if(epoch===interactionEpoch&&current>=0&&enabled&&!hasLocked()&&root.getSelection?.()?.isCollapsed)showNote(current,x,y,true);
      },0);
     }
    }
   });
   container.addEventListener('touchend',()=>{
    if(enabled&&!hasLocked()){inputMethod='touch';capture();}
   },{passive:true});
   container.addEventListener('keydown',event=>{
    if(!enabled||hasLocked()||editorOpen()||event.ctrlKey||event.altKey||event.metaKey)return;
    const anchor=targetFor(event.target);
    if(!anchor||event.target!==anchor)return;
    if(event.shiftKey&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
     event.preventDefault();inputMethod='keyboard';confirmPress=null;keyboardSelect(event,anchor);
    }else if(event.key==='Enter'&&!event.shiftKey){
     inputMethod='keyboard';
     if(capture()&&armed){event.preventDefault();applyArmedSelection();}
    }
   });
   container.addEventListener('keyup',event=>{
    if(inputMethod==='keyboard'&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key))capture();
   });
  }
  // Desktop: passive hover preview. Touch/mouse click: pinned, dismissible note.
  // Never intercept answer controls or interfere with native text selection.
  root.document.addEventListener('pointermove',event=>{
   if(!enabled||hasLocked()||popupPinned||event.pointerType!=='mouse'||event.buttons)return;
   if(root.getSelection?.()&&!root.getSelection().isCollapsed){hideNote();return}
   const index=noteAtPoint(event.clientX,event.clientY,event.target);
   if(index<0){hideNote();return}
   showNote(index,event.clientX,event.clientY);
  });
  // Hover remains live until the pointer moves off annotated text. Removing
  // a hovered question during a repaint can emit pointerout with a null
  // relatedTarget, so that event is not a reliable viewport-exit signal.
  root.addEventListener('blur',()=>{if(!popupPinned)hideNote();if(enabled)cancelPending()});
  document.addEventListener('visibilitychange',()=>{if(enabled&&document.hidden)cancelPending()});
  for(const container of containers){
   container.addEventListener('click',event=>{
    if(!enabled||hasLocked())return;
    if(event.target.closest?.('button,input,select,textarea,a'))return;
    if(!root.getSelection?.()?.isCollapsed){
     if(targetFor(event.target)){event.preventDefault();event.stopPropagation();}
     return;
    }
    const index=noteAtPoint(event.clientX,event.clientY,event.target);
    if(index<0)return;
    // Capture before the card's text-to-question handler.
    event.preventDefault();event.stopPropagation();
    showNote(index,event.clientX,event.clientY,true);
    },true);
  }
  root.document.addEventListener('pointerdown',event=>{
   if(popupPinned&&!popup.contains(event.target))hideNote();
   if(!confirmBar.contains(event.target))confirmPress=null;
  },true);
  root.document.addEventListener('pointerup',event=>{
   if(confirmPress&&!confirmBar.contains(event.target)){confirmPress=null;capture();}
  },true);
  root.document.addEventListener('keydown',event=>{
   if(event.key!=='Escape'||!enabled||hasLocked())return;
   if(dockOpen){event.preventDefault();setDockOpen(false,true);return;}
   if(!popup.hidden){hideNote(true);return;}
   if(editorOpen()){event.preventDefault();closeEditor(true);cancelPending();setStatus('Úprava poznámky zrušena.');return;}
   if(selected||confirmPress){event.preventDefault();cancelPending();setStatus('Výběr zrušen.');}
  });
  // Automatic browser scrolls (e.g. restoring focus or revealing an answer)
  // must not dismiss an open note. Intentional wheel/touch scrolling can
  // dismiss a transient hover preview; a pinned note has an explicit close.
  root.document.addEventListener('wheel',()=>{if(!popupPinned)hideNote()},{passive:true});
  root.document.addEventListener('touchmove',()=>{if(!popupPinned)hideNote()},{passive:true});
  function adjustViewport(){if(popupPinned)positionPopup();else hideNote();positionConfirmation();scheduleDock()}
  root.addEventListener('resize',adjustViewport);
  root.visualViewport?.addEventListener('resize',adjustViewport);
  root.visualViewport?.addEventListener('scroll',adjustViewport);
  document.addEventListener('scroll',()=>{if(!confirmBar.hidden)positionConfirmation();scheduleDock()},{capture:true,passive:true});
  function snapshot(){return normalized(items)}
  function restore(value){
   interactionEpoch++;hideNote();items=withIds(value);undoHistory.length=0;resetTool();closeEditor();
   root.getSelection?.()?.removeAllRanges();
   if(clearConfirm)clearConfirm.hidden=true;
   if(enabled)paint();else renderList();keyboardTargets();
   }
   function refresh(){
    if(hasLocked()){
     hideNote();resetTool();closeEditor();
     if(clearConfirm)clearConfirm.hidden=true;
    }else if(selected||confirmPress){
     const record=selected||confirmPress.record;
     if(!itemRange(getAnchor(record.anchor),record))cancelPending();
     else capture();
    }
    if(enabled)paint();keyboardTargets();syncChrome();
   }
  config.onToggle?.(false);
  setStatus('Anotační režim je vypnutý.');
  renderList();
  return Object.freeze({snapshot,restore,refresh,hasDraft:editorOpen,isEnabled:()=>enabled});
 }
 const api=Object.freeze({mount,normalized,sourceRange,COLORS,TYPES});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHReadingAnnotations=api;
})(typeof globalThis!=='undefined'?globalThis:this);
