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
   text:item.text,kind:item.kind,color:item.color,note:item.note}));
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
 function mount(config){
  const host=config?.host,containers=config?.containers||[];
  if(!host||!Array.isArray(containers)||!containers.length)
   throw new Error('Invalid Reading annotation mount');
  if(!root.CSS?.highlights||typeof root.Highlight!=='function')
   throw new Error('CSS text highlight API unavailable');
  let items=[],selected=null,enabled=false,noteDraft=null,editingIndex=null,color='yellow';
   let armed='highlight'; // Tool-first touch workflow; desktop select-then-tool remains supported.
   const toggle=config.toggle||host.querySelector('[data-anno-toggle]');
   if(!toggle)throw new Error('Missing Reading annotation toggle');
  const status=host.querySelector('[data-anno-status]');
  const list=host.querySelector('[data-anno-list]');
  const noteBox=host.querySelector('[data-anno-note-box]');
  const noteInput=host.querySelector('[data-anno-note]');
  const hasLocked=()=>typeof config.canEdit==='function'&&!config.canEdit();
  const isTarget=node=>containers.some(parent=>parent.contains(node));
  const targetFor=node=>{
   const element=node?.nodeType===Node.ELEMENT_NODE?node:node?.parentElement;
   const target=element?.closest('[data-annotation-anchor]');
   return target&&isTarget(target)?target:null;
  };
  const clearSelection=()=>{selected=null};
  const setStatus=message=>{if(status)status.textContent=message};
  const save=()=>{try{return config.onChange?.(snapshot())!==false}catch(_){return false}};
  const highlightKeys=[...COLORS,'underline','note'];
  const getAnchor=id=>{
   for(const container of containers){
    for(const el of container.querySelectorAll('[data-annotation-anchor]'))
     if(el.dataset.annotationAnchor===id)return el;
   }
   return null;
  };
  // CSS Highlights preserve the original question and answer DOM, but do not
  // receive pointer events. Hit-test only stored note ranges on the source text.
  const popup=root.document.createElement('aside');
  popup.className='lsh-annotation-popover';popup.hidden=true;
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
    const range=bounds(anchor,item.start,item.end);
    if(!range||range.toString()!==item.text)continue;
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
   const range=anchor&&bounds(anchor,item.start,item.end);
   const noteRect=range?.getBoundingClientRect();
   const buttonRect=button.getBoundingClientRect();
   const rect=noteRect&&noteRect.bottom>0&&noteRect.top<root.innerHeight?noteRect:buttonRect;
   showNote(index,rect.left,rect.bottom,true,button);
  }
  function paint(){
   hideNote();
   const groups=Object.fromEntries(highlightKeys.map(key=>[key,[]]));
   for(const item of items){
    const target=getAnchor(item.anchor);
    if(!target)continue;
    const range=bounds(target,item.start,item.end);
    if(!range||range.toString()!==item.text)continue;
    groups[item.kind==='highlight'?item.color:item.kind].push(range);
   }
   for(const key of highlightKeys){
    const name='lsh-anno-'+key;
    root.CSS.highlights.set(name,new root.Highlight(...groups[key]));
   }
   renderList();
  }
  function renderList(){
   if(!list)return;
   list.replaceChildren();
   items.forEach((item,index)=>{
    const row=document.createElement('div');row.className='lsh-annotation-item';
    const description=document.createElement('span');description.className='lsh-annotation-item-label';
    const snippet=item.text.length>65?item.text.slice(0,62)+'…':item.text;
    description.textContent=(item.kind==='underline'?'Podtržení':item.kind==='note'?'Poznámka':'Zvýraznění')+
     ' · '+snippet+(item.note?' — '+item.note:'');
    const remove=document.createElement('button');remove.type='button';
    remove.className='action ghost';remove.textContent='Smazat';
    remove.setAttribute('aria-label','Smazat anotaci '+(index+1));
    remove.addEventListener('click',()=>{
     if(hasLocked())return;
     items.splice(index,1);paint();setStatus(save()?'Anotace odstraněna.':'Anotaci nelze trvale uložit.');
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
      editingIndex=index;noteDraft=null;
      if(noteBox)noteBox.hidden=false;
      if(noteInput){noteInput.value=item.note;noteInput.focus({preventScroll:true})}
      return;
     }
     if(item.kind==='underline'){item.kind='highlight';item.color=color;}
     else item.color=COLORS[(COLORS.indexOf(item.color)+1)%COLORS.length];
     paint();setStatus(save()?'Anotace upravena.':'Anotaci nelze trvale uložit.');
    });
    actions.append(edit,remove);row.append(description,actions);list.appendChild(row);
   });
  }
  function capture(){
   if(!enabled||hasLocked())return;
   const sel=root.getSelection?.();
   if(!sel||sel.rangeCount!==1||sel.isCollapsed)return;
   const range=sel.getRangeAt(0);
   const startTarget=targetFor(range.startContainer),endTarget=targetFor(range.endContainer);
   if(!startTarget||startTarget!==endTarget)return;
   let start,end;
   try{
    start=offset(range.startContainer,range.startOffset,startTarget);
    end=offset(range.endContainer,range.endOffset,startTarget);
   }catch(_){return;}
   const text=range.toString();
   if(start>=end||!text.trim())return;
   if(text.length>MAX_LENGTH){setStatus('Vyberte kratší úsek textu (nejvýše 600 znaků).');return;}
   selected={anchor:startTarget.dataset.annotationAnchor,start,end,text};
   setStatus('Označený text připraven: '+text.slice(0,55)+(text.length>55?'…':''));
  }
  function add(kind,note=''){
   if(!enabled||hasLocked()){setStatus('Anotace jsou teď nedostupné.');return;}
   if(!selected){setStatus('Nejdříve označte text nebo část otázky.');return;}
   if(items.length>=MAX_ITEMS){setStatus('Limit 80 anotací v této kartě.');return;}
   if(kind==='note'&&!note.trim()){setStatus('Napište poznámku.');return;}
   const item={...selected,kind,color,note:note.slice(0,MAX_NOTE)};
   items.push(item);clearSelection();root.getSelection?.()?.removeAllRanges();
   paint();setStatus(save()?'Anotace uložena.':'Anotaci nelze trvale uložit.');
  }
  function setModeButton(button,kind){
   armed=kind;
   if(kind==='highlight')color=button.dataset.annoColor;
   host.querySelectorAll('[data-anno-color],[data-anno-underline],[data-anno-start-note]')
    .forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
  }
  function startNote(){
   if(!selected){setStatus('Vyberte slovo nebo úsek textu pro poznámku.');return;}
   noteDraft=selected;editingIndex=null;clearSelection();
   if(noteBox)noteBox.hidden=false;
   if(noteInput){noteInput.value='';noteInput.focus({preventScroll:true})}
  }
  function applyArmedSelection(){
   if(!enabled||hasLocked()||!selected||!armed)return;
   if(armed==='note')startNote();
   else add(armed);
  }
  toggle?.addEventListener('click',()=>{
   if(hasLocked())return;
   enabled=!enabled;
   hideNote();
   host.classList.toggle('lsh-anno-enabled',enabled);
   toggle.setAttribute('aria-pressed',String(enabled));
   toggle.textContent=enabled?'Vypnout poznámky':'Zapnout poznámky';
   host.querySelector('[data-anno-controls]').hidden=!enabled;
   if(noteBox)noteBox.hidden=true;
   noteDraft=null;editingIndex=null;
   clearSelection();
   if(!enabled){for(const key of highlightKeys)root.CSS.highlights.delete('lsh-anno-'+key);}
   else paint();
   config.onToggle?.(enabled);
   setStatus(enabled?
    'Vyberte barvu nebo podtržení a označte prstem text. Na počítači lze také nejprve označit a pak kliknout na nástroj.':
    'Poznámky jsou skryté, nikoli smazané.');
  });
  host.querySelectorAll('[data-anno-color]').forEach(button=>button.addEventListener('click',()=>{
   setModeButton(button,'highlight');
   if(selected)add('highlight');
   else setStatus('Barva vybrána. Na telefonu dlouze podržte slovo nebo označte pasáž.');
  }));
  host.querySelector('[data-anno-underline]')?.addEventListener('click',event=>{
   setModeButton(event.currentTarget,'underline');
   if(selected)add('underline');
   else setStatus('Podtržení vybráno. Označte slovo nebo pasáž.');
  });
  host.querySelector('[data-anno-start-note]')?.addEventListener('click',event=>{
   setModeButton(event.currentTarget,'note');
   startNote();
  });
  host.querySelector('[data-anno-save-note]')?.addEventListener('click',()=>{
   if(hasLocked())return;
   const content=(noteInput?.value||'').trim();
   if(!content){setStatus('Napište poznámku.');return;}
   if(editingIndex!==null&&items[editingIndex]?.kind==='note'){
    items[editingIndex].note=content.slice(0,MAX_NOTE);
    paint();setStatus(save()?'Poznámka upravena.':'Poznámku nelze trvale uložit.');
   }else{
    selected=noteDraft;if(!selected)return;
    add('note',content);
   }
   if(noteBox)noteBox.hidden=true;noteDraft=null;editingIndex=null;
  });
  // Native touch text selection finishes after long press / dragging handles.
  // Wait for the browser selection to settle before applying the chosen tool.
  let lastTouchSignature='',lastTouchAt=0;
  function applyAfterTouch(){
   if(!enabled||hasLocked()||!armed)return;
   capture();
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
    root.setTimeout(capture,0);
    if(event.pointerType==='touch')root.setTimeout(applyAfterTouch,260);
   });
   container.addEventListener('keyup',capture);
   container.addEventListener('touchend',()=>root.setTimeout(applyAfterTouch,220),{passive:true});
  }
  // Desktop: passive hover preview. Touch/mouse click: pinned, dismissible note.
  // Never intercept answer controls or interfere with native text selection.
  for(const container of containers){
   container.addEventListener('pointermove',event=>{
    if(!enabled||hasLocked()||popupPinned||event.pointerType!=='mouse'||event.buttons)return;
    if(root.getSelection?.()&&!root.getSelection().isCollapsed){hideNote();return}
    const index=noteAtPoint(event.clientX,event.clientY,event.target);
    if(index<0){hideNote();return}
    showNote(index,event.clientX,event.clientY);
   });
   container.addEventListener('pointerleave',()=>{if(!popupPinned)hideNote()});
   container.addEventListener('click',event=>{
    if(!enabled||hasLocked()||!root.getSelection?.()?.isCollapsed)return;
    const index=noteAtPoint(event.clientX,event.clientY,event.target);
    if(index<0)return;
    const answerControl=event.target.closest?.('label,button,input,select');
    if(answerControl){
     // Native answer clicks can repaint their question. Show after that paint.
     const x=event.clientX,y=event.clientY;
     root.setTimeout(()=>{if(enabled&&!hasLocked()&&items[index]?.kind==='note')
      showNote(index,x,y,true)},0);
    }else{
     showNote(index,event.clientX,event.clientY,true);
     // The dictionary's quick-tap must not replace an open note preview.
     event.stopPropagation();
    }
   });
  }
  root.document.addEventListener('pointerdown',event=>{
   if(popupPinned&&!popup.contains(event.target))hideNote();
  },true);
  root.document.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&!popup.hidden)hideNote(true);
  });
  root.addEventListener('scroll',event=>{if(event.target!==popup&&!popup.contains(event.target))hideNote()},true);
  root.addEventListener('resize',()=>hideNote());
  function snapshot(){return normalized(items)}
  function restore(value){
   hideNote();items=normalized(value);clearSelection();noteDraft=null;editingIndex=null;
   if(noteBox)noteBox.hidden=true;
   if(enabled)paint();else renderList();
  }
  function refresh(){
   if(hasLocked()){hideNote();clearSelection();if(noteBox)noteBox.hidden=true}
   if(enabled)paint();
  }
  config.onToggle?.(false);
  setStatus('Anotační režim je vypnutý.');
  renderList();
  return Object.freeze({snapshot,restore,refresh});
 }
 const api=Object.freeze({mount,normalized,COLORS,TYPES});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHReadingAnnotations=api;
})(typeof globalThis!=='undefined'?globalThis:this);
