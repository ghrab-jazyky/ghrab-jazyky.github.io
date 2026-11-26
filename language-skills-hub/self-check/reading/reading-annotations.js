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
  let idSequence=0,interactionEpoch=0;
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
  function closeEditor(){
   noteDraft=null;editingId=null;
   if(noteInput)noteInput.value='';
   if(noteBox)noteBox.hidden=true;
  }
  const editorOpen=()=>!!noteBox&&!noteBox.hidden;
  noteCancel.addEventListener('click',()=>{closeEditor();clearSelection();setStatus('Úprava poznámky zrušena.')});
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
  const clearSelection=()=>{selected=null};
  const setStatus=message=>{if(status)status.textContent=message};
  let saveError='';
  const save=()=>{saveError='';try{
   const result=config.onChange?.(snapshot());
   if(typeof result==='string'){saveError=result;return false;}
   return result!==false;
  }catch(_){return false}};
  // Roll back every mutation if persistence rejects it.
  function commit(next,message){
   const previous=items;items=next;
   if(!save()){
    items=previous;
    setStatus(saveError||'Změnu nelze trvale uložit. Původní anotace zůstaly zachované.');
    return false;
   }
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
  let popupIndex=-1,popupPinned=false,popupReturnFocus=null;
  function hideNote(restoreFocus=false){
   if(popup.hidden)return;
   popup.hidden=true;popupIndex=-1;popupPinned=false;
   popup.classList.remove('lsh-annotation-popover-pinned');
   if(restoreFocus&&popupReturnFocus?.isConnected)popupReturnFocus.focus({preventScroll:true});
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
   popupIndex=index;popupPinned=pinned;popupReturnFocus=returnFocus;
   popup.hidden=false;popup.setAttribute('role',pinned?'dialog':'tooltip');
   popup.classList.toggle('lsh-annotation-popover-pinned',pinned);
   popupClose.hidden=!pinned;
   popup.style.left='0px';popup.style.top='0px';
   const size=popup.getBoundingClientRect();
   const left=Math.min(Math.max(10,x+10),Math.max(10,root.innerWidth-size.width-10));
   const below=y+16;
   const top=below+size.height<=root.innerHeight-10?below:Math.max(10,y-size.height-16);
   popup.style.left=left+'px';popup.style.top=top+'px';
  }
  function openNoteFromList(index,button){
   if(!enabled||hasLocked())return;
   const item=items[index],anchor=getAnchor(item.anchor);
   const range=itemRange(anchor,item);
   const noteRect=range?.getBoundingClientRect();
   const buttonRect=button.getBoundingClientRect();
   const rect=noteRect&&noteRect.bottom>0&&noteRect.top<root.innerHeight?noteRect:buttonRect;
   showNote(index,rect.left,rect.bottom,true,button);
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
   if(!list)return;
   list.replaceChildren();
   items.forEach((item,index)=>{
    const row=document.createElement('div');row.className='lsh-annotation-item';row.dataset.annotationId=item.id;
    const description=document.createElement('span');description.className='lsh-annotation-item-label';
    const snippet=item.text.length>65?item.text.slice(0,62)+'…':item.text;
    description.textContent=(item.kind==='underline'?'Podtržení':item.kind==='note'?'Poznámka':'Zvýraznění')+
     ' · '+snippet+(item.note?' — '+item.note:'')+
      (!itemRange(getAnchor(item.anchor),item)?' · Úsek není právě zobrazen.':'');
    const remove=document.createElement('button');remove.type='button';
    remove.className='action ghost';remove.textContent='Smazat';
    remove.setAttribute('aria-label','Smazat anotaci '+(index+1));
    remove.addEventListener('click',()=>{
     if(hasLocked())return;
     if(commit(items.filter(record=>record.id!==item.id),'Anotace odstraněna.')&&editingId===item.id)closeEditor();
    });
    const actions=document.createElement('span');actions.className='lsh-annotation-actions';
    if(item.kind==='note'){
     const show=document.createElement('button');show.type='button';
     show.className='action ghost lsh-annotation-view-note';show.textContent='Zobrazit';
     show.setAttribute('aria-label','Zobrazit poznámku '+(index+1));
     show.addEventListener('click',()=>openNoteFromList(index,show));
     actions.appendChild(show);
    }
    const edit=document.createElement('button');edit.type='button';edit.className='action ghost';
    edit.textContent=item.kind==='note'?'Upravit poznámku':item.kind==='underline'?'Zvýraznit':'Změnit barvu';
    edit.setAttribute('aria-label','Upravit anotaci '+(index+1));
    edit.addEventListener('click',()=>{
     if(hasLocked())return;
     if(item.kind==='note'){
      if(editorOpen()){setStatus('Nejprve uložte nebo zrušte rozpracovanou poznámku.');return;}
      editingId=item.id;noteDraft=null;
      if(noteBox)noteBox.hidden=false;
      if(noteInput){noteInput.value=item.note;noteInput.focus({preventScroll:true})}
      return;
     }
     const changed=item.kind==='underline'?{...item,kind:'highlight',color}:
      {...item,color:COLORS[(COLORS.indexOf(item.color)+1)%COLORS.length]};
     commit(items.map(record=>record.id===item.id?changed:record),'Anotace upravena.');
    });
    actions.append(edit,remove);row.append(description,actions);list.appendChild(row);
   });
  }
  function capture(){
   clearSelection();
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
   if(items.length>=MAX_ITEMS){setStatus('Limit 80 anotací v této variantě.');return false;}
   if(kind==='note'&&!note.trim()){setStatus('Napište poznámku.');return false;}
   const item={...selected,id:newId(),kind,color,note:note.slice(0,MAX_NOTE)};
   if(!commit([...items,item],'Anotace uložena.'))return false;
   clearSelection();root.getSelection?.()?.removeAllRanges();return true;
  }
  function setModeButton(button,kind){
   const same=armed===kind&&(kind!=='highlight'||color===button.dataset.annoColor);
   armed=same&&!selected?null:kind;
   if(kind==='highlight'&&armed)color=button.dataset.annoColor;
   host.querySelectorAll('[data-anno-color],[data-anno-underline],[data-anno-start-note]')
    .forEach(el=>el.setAttribute('aria-pressed',String(Boolean(armed)&&el===button)));
   // Tool changes cannot silently replace an open editor.
  }
  function startNote(){
   if(editorOpen()){setStatus('Nejprve uložte nebo zrušte rozpracovanou poznámku.');return;}
   if(!selected||!itemRange(getAnchor(selected.anchor),selected)){setStatus('Vyberte slovo nebo úsek textu pro poznámku.');return;}
   noteDraft=selected;editingId=null;clearSelection();
   root.getSelection?.()?.removeAllRanges();
   if(noteBox)noteBox.hidden=false;
   if(noteInput){noteInput.value='';noteInput.focus({preventScroll:true})}
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
   if(!enabled){for(const key of highlightKeys)root.CSS.highlights.delete('lsh-anno-'+key);}
   else paint();
   config.onToggle?.(enabled);
   setStatus(enabled?
    'Klikněte na nástroj a pak označujte text myší opakovaně. Dalším kliknutím nástroj vypnete. Na dotykové obrazovce text označte prstem.':
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
   if(!enabled||hasLocked()||!items.length)return;
   if(!commit([],'Všechna zvýraznění, podtržení i poznámky této varianty byly smazány.'))return;
   if(clearConfirm)clearConfirm.hidden=true;
   closeEditor();clearSelection();
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
   closeEditor();
  });
  // Native touch text selection finishes after long press / dragging handles.
  // Wait for the browser selection to settle before applying the chosen tool.
  let lastTouchSignature='',lastTouchAt=0;
  function applyAfterTouch(){
   if(!enabled||hasLocked()||editorOpen()||!armed)return;
   if(!root.getSelection?.()||root.getSelection().isCollapsed)return;
   clearSelection();capture();
   if(!selected)return;
   const signature=[selected.anchor,selected.start,selected.end,armed,color].join('|');
   const now=Date.now();
   if(signature===lastTouchSignature&&now-lastTouchAt<650)return;
   lastTouchSignature=signature;lastTouchAt=now;
   applyArmedSelection();
  }
  // Touch selection may settle before pointerup/touchend; track native selection changes as well.
  root.document?.addEventListener('selectionchange',()=>{if(enabled)capture()});
  for(const container of containers){
   container.addEventListener('pointerup',event=>{
    const epoch=interactionEpoch;
    if(event.pointerType==='mouse'&&event.button===0){
     // The completed drag, not selectionchange, commits exactly one annotation.
     // Clear stale selections first so a plain click cannot reapply an old range.
     root.setTimeout(()=>{
      if(epoch!==interactionEpoch||!enabled||hasLocked()||editorOpen()||!armed)return;
      if(!root.getSelection?.()||root.getSelection().isCollapsed){clearSelection();return;}
      clearSelection();capture();applyArmedSelection();
     },0);
    }else root.setTimeout(()=>{if(epoch===interactionEpoch)capture()},0);
    if(event.pointerType==='touch')root.setTimeout(()=>{if(epoch===interactionEpoch)applyAfterTouch()},260);
    // Some mobile browsers suppress a click following touch. Use pointer
    // release too, but never take over the native answer controls.
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
   container.addEventListener('keyup',capture);
   container.addEventListener('touchend',()=>{
    const epoch=interactionEpoch;
    root.setTimeout(()=>{if(epoch===interactionEpoch)applyAfterTouch()},220);
   },{passive:true});
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
  root.addEventListener('blur',()=>{if(!popupPinned)hideNote()});
  for(const container of containers){
   container.addEventListener('click',event=>{
    if(!enabled||hasLocked())return;
    if(event.target.closest?.('button,input,select,textarea,a'))return;
    if(!root.getSelection?.()?.isCollapsed){
     if(event.target.closest?.('label')&&targetFor(event.target))event.preventDefault();
     return;
    }
    const index=noteAtPoint(event.clientX,event.clientY,event.target);
    if(index<0)return;
    // Annotated label TEXT opens the note only; the radio itself still answers.
    if(event.target.closest?.('button,input,select,textarea,a'))return;
    event.preventDefault();event.stopPropagation();
    showNote(index,event.clientX,event.clientY,true);
   });
  }
  root.document.addEventListener('pointerdown',event=>{
   if(popupPinned&&!popup.contains(event.target))hideNote();
  },true);
  root.document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&!popup.hidden)hideNote(true);
  });
  // Automatic browser scrolls (e.g. restoring focus or revealing an answer)
  // must not dismiss an open note. Intentional wheel/touch scrolling can
  // dismiss a transient hover preview; a pinned note has an explicit close.
  root.document.addEventListener('wheel',()=>{if(!popupPinned)hideNote()},{passive:true});
  root.document.addEventListener('touchmove',()=>{if(!popupPinned)hideNote()},{passive:true});
  root.addEventListener('resize',()=>hideNote());
  function snapshot(){return normalized(items)}
  function restore(value){
   interactionEpoch++;hideNote();items=withIds(value);clearSelection();closeEditor();
   root.getSelection?.()?.removeAllRanges();
   if(clearConfirm)clearConfirm.hidden=true;
   if(enabled)paint();else renderList();
  }
  function refresh(){
   if(hasLocked()){
    hideNote();clearSelection();
    if(noteBox)noteBox.hidden=true;
    if(clearConfirm)clearConfirm.hidden=true;
   }
   if(enabled)paint();
  }
  config.onToggle?.(false);
  setStatus('Anotační režim je vypnutý.');
  renderList();
  return Object.freeze({snapshot,restore,refresh,hasDraft:editorOpen});
 }
 const api=Object.freeze({mount,normalized,sourceRange,COLORS,TYPES});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHReadingAnnotations=api;
})(typeof globalThis!=='undefined'?globalThis:this);
