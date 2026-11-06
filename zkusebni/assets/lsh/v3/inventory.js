/* R3B: publicly safe editorial inventory. No student URLs, answer keys, private links or launch controls. */
(function () {
  'use strict';
  const allowedSkills = new Set(['konverzace','cteni','poslech']);
  const sourceLabels = Object.freeze({
    'private-source-verified': 'Původní soubor dohledán · soukromě',
    'public-test-preview': 'Studentské HTML online · TEST · pedagogicky neschváleno',
    'previously-audited-needs-restoration': 'Starší audit doložen · zdroj obnovit',
    'planned-only': 'Téma zaevidováno · podklady chybí'
  });
  const statusLabels = Object.freeze({
    'PLANOVANO': 'Plánováno',
    'CEKA_NA_PODKLADY': 'Čeká na podklady',
    'CEKA_NA_REFERENCI': 'Čeká na referenční kartu',
    'CEKA_NA_NEZAVISLOU_REVIZI': 'Čeká na nezávislé hodnocení',
    'CEKA_NA_INTEGRACNI_AUDIT': 'Čeká na integrační audit'
  });
  function node(tag,text,css){
    const element=document.createElement(tag);
    if(typeof text==='string')element.textContent=text;
    if(css)element.className=css;
    return element;
  }
  function validate(inventory){
    if(!inventory||inventory.schemaVersion!==1||typeof inventory.inventoryVersion!=='string'||
       typeof inventory.releasePolicy!=='string'||!Array.isArray(inventory.topics)||
       inventory.topics.length>100)throw new Error('Inventory schema invalid');
    const refs=inventory.referenceCandidates;
    if(!refs||typeof refs!=='object')throw new Error('Reference candidates missing');
    const ids=new Set();
    for(const skill of allowedSkills){
      const ref=refs[skill];
      if(!ref||typeof ref.id!=='string'||ref.approved!==false)
        throw new Error('Reference must be a pending proposal');
    }
    for(const t of inventory.topics){
      if(!t||typeof t!=='object'||!allowedSkills.has(t.skill)||
         !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(t.id)||ids.has(t.id)||
         !sourceLabels[t.sourceState]||!statusLabels[t.state]||
         typeof t.title!=='string'||t.title.trim().length===0||t.title.length>160||
         typeof t.scope!=='string'||t.scope.length>200||
         typeof t.note!=='string'||t.note.length>500||
         (t.version!==null && (typeof t.version!=='string'||t.version.length>120)))
        throw new Error('Inventory item invalid');
      // An editorial catalog never contains active student links or private teacher data.
      if(Object.keys(t).some(key=>!['id','skill','title','version','sourceState','state','scope','note'].includes(key)))
        throw new Error('Inventory contains an undocumented field');
      ids.add(t.id);
    }
    if(!ids.has(refs.cteni.id)||!ids.has(refs.poslech.id))
      throw new Error('Missing Reading/Listening reference candidate');
    return inventory;
  }
  async function render(){
    const skill=document.body&&document.body.dataset.page;
    const list=document.getElementById('editorialInventoryList');
    if(!list||!allowedSkills.has(skill))return;
    const summary=document.getElementById('editorialInventorySummary');
    const candidate=document.getElementById('editorialReferenceCandidate');
    try{
      const config=window.LSH_CONFIG,core=window.LSH_CORE;
      if(!config||config.basePath!=='/zkusebni/'||!core)throw new Error('Unexpected staging config');
      const url=new URL('data/editorial-inventory.json',new URL(config.basePath,location.origin));
      const response=await fetch(url.href,{cache:'no-store'});
      if(!response.ok)throw new Error('Inventory not available');
      const inventory=validate(await response.json());
      const entries=inventory.topics.filter(t=>t.skill===skill);
      summary.textContent=skill==='konverzace'
        ? entries.length+' další téma v přípravě. Stávající konverzační karty jsou výše v katalogu.'
        : entries.length+' témat evidováno. Nejsou schválená pro běžný studentský katalog; testovací HTML najdete nad tímto přehledem.';
      const refId=inventory.referenceCandidates[skill].id;
      let refTitle=entries.find(t=>t.id===refId)?.title;
      if(skill==='konverzace'){
        const manifest=await fetch(new URL('data/manifest.json',new URL(config.basePath,location.origin)),{cache:'no-store'});
        if(!manifest.ok)throw new Error('Manifest not available');
        const m=await manifest.json();core.validateManifest(m);
        refTitle=m.topics.find(t=>t.id===refId&&t.skill==='konverzace')?.title;
      }
      candidate.textContent=refTitle
        ? 'Navržený referenční vzor: '+refTitle+' · čeká na schválení po důkladné kontrole.'
        : 'Referenční kartu zatím nelze ověřit. Nepoužívat jako schválený vzor.';
      const rows=entries.map(t=>{
        const item=node('article',null,'inventory-card');
        const top=node('div',null,'inventory-card-top');
        top.append(node('h3',t.title),node('span',statusLabels[t.state],'inventory-state'));
        const properties=node('p',(t.version?'Verze: '+t.version+' · ':'')+t.scope,'inventory-properties');
        const evidence=node('p',sourceLabels[t.sourceState],'inventory-source');
        const note=node('p',t.note,'inventory-note');
        item.append(top,properties,evidence,note);
        return item;
      });
      list.replaceChildren(...rows);
      if(!entries.length)list.append(node('p','Zatím není evidováno žádné další téma.'));
    }catch(error){
      console.error('Editorial inventory unavailable',error);
      if(summary)summary.textContent='Přehled připravovaných karet se nepodařilo načíst.';
      if(candidate)candidate.textContent='Referenční kandidát momentálně není k dispozici.';
      list.replaceChildren(node('p','Studentský katalog nadále funguje nezávisle na tomto přehledu.','inventory-note'));
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});
  else render();
})();
