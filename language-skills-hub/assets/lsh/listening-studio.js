/* Presentational measurements and progress mirror only; practice and grading remain unchanged. */
(()=>{'use strict';
function init(){
 const header=document.querySelector('.topbar');
 const levels=document.querySelector('.studio-levelbar');
 if(!header||!levels)return;
 function size(){
  document.documentElement.style.setProperty('--studio-topbar-height',Math.ceil(header.getBoundingClientRect().height)+'px');
  document.documentElement.style.setProperty('--studio-levelbar-height',Math.ceil(levels.getBoundingClientRect().height)+'px');
 }
 size();window.addEventListener('resize',size,{passive:true});
 if('ResizeObserver' in window){const ro=new ResizeObserver(size);ro.observe(header);ro.observe(levels);}
 const old=document.getElementById('progressStatus'),dest=document.getElementById('studioProgressText');
 const oldBar=document.getElementById('progressBar'),mirror=document.getElementById('studioProgressBar');
 if(old&&dest&&oldBar&&mirror){
  const sync=()=>{
   dest.textContent=old.textContent;
   mirror.style.width=oldBar.style.width||'0%';
  };
  sync();
  const mo=new MutationObserver(sync);
  mo.observe(old,{childList:true,characterData:true,subtree:true});
  mo.observe(oldBar,{attributes:true,attributeFilter:['style']});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();