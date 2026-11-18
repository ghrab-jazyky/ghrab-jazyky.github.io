/* RL-02 pilot: text-range annotations without altering reading/question DOM.
 * Notes are never graded or transmitted; secure-test save/restore is caller-owned.
 */
(function(root){
 'use strict';
 const COLORS=Object.freeze(['yellow','green','pink']);
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
  const highlightKeys=['yellow','green','pink','underline','note'];
  const getAnchor=id=>{
   for(const container of containers){
    for(const el of container.querySelectorAll('[data-annotation-anchor]'))
     if(el.dataset.annotationAnchor===id)return el;
   }
   return null;
  };
  function paint(){
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
  host.querySelector('[data-anno-toggle]')?.addEventListener('click',()=>{
   if(hasLocked())return;
   enabled=!enabled;
   host.classList.toggle('lsh-anno-enabled',enabled);
   host.querySelector('[data-anno-toggle]').setAttribute('aria-pressed',String(enabled));
   host.querySelector('[data-anno-toggle]').textContent=enabled?'Vypnout poznámky':'Zapnout poznámky';
   host.querySelector('[data-anno-controls]').hidden=!enabled;
   if(noteBox)noteBox.hidden=true;
   noteDraft=null;editingIndex=null;
   clearSelection();
   if(!enabled){for(const key of highlightKeys)root.CSS.highlights.delete('lsh-anno-'+key);}
   else paint();
   setStatus(enabled?'Označte libovolnou část textu nebo otázky.':'Poznámky skryty, nikoli smazány.');
  });
  host.querySelectorAll('[data-anno-color]').forEach(button=>button.addEventListener('click',()=>{
   color=button.dataset.annoColor;host.querySelectorAll('[data-anno-color]').forEach(x=>
    x.setAttribute('aria-pressed',String(x===button)));
   add('highlight');
  }));
  host.querySelector('[data-anno-underline]')?.addEventListener('click',()=>add('underline'));
  host.querySelector('[data-anno-start-note]')?.addEventListener('click',()=>{
   if(!selected){setStatus('Nejdříve označte část textu nebo otázky.');return;}
   noteDraft=selected;editingIndex=null;
   if(noteBox)noteBox.hidden=false;
   if(noteInput){noteInput.value='';noteInput.focus({preventScroll:true})}
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
  // Touch selection may settle before pointerup/touchend; track native selection changes as well.
  root.document?.addEventListener('selectionchange',()=>{if(enabled)capture()});
  for(const container of containers){
   container.addEventListener('pointerup',()=>root.setTimeout(capture,0));
   container.addEventListener('keyup',capture);
   container.addEventListener('touchend',()=>root.setTimeout(capture,200),{passive:true});
  }
  function snapshot(){return normalized(items)}
  function restore(value){
   items=normalized(value);clearSelection();noteDraft=null;editingIndex=null;
   if(noteBox)noteBox.hidden=true;
   if(enabled)paint();else renderList();
  }
  function refresh(){
   if(hasLocked()){clearSelection();if(noteBox)noteBox.hidden=true}
   if(enabled)paint();
  }
  setStatus('Anotační režim je vypnutý.');
  renderList();
  return Object.freeze({snapshot,restore,refresh});
 }
 const api=Object.freeze({mount,normalized,COLORS,TYPES});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.LSHReadingAnnotations=api;
})(typeof globalThis!=='undefined'?globalThis:this);
