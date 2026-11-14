/* Listening Studio presentation only. Never reads or modifies test answers. */
(()=>{'use strict';
function init(){
 const header=document.querySelector('.topbar');
 const levels=document.querySelector('.studio-levelbar');
 if(!header||!levels)return;

 // WebKit safety: ResizeObserver callbacks must not synchronously write layout-affecting
 // CSS variables. Schedule measurements outside the observer notification cycle.
 const root=document.documentElement;
 let queued=false;
 let previousTop=-1;
 let previousLevels=-1;
 function measureBars(){
  queued=false;
  const top=Math.ceil(header.getBoundingClientRect().height);
  const level=Math.ceil(levels.getBoundingClientRect().height);
  if(top!==previousTop){
   previousTop=top;
   root.style.setProperty('--studio-topbar-height',top+'px');
  }
  if(level!==previousLevels){
   previousLevels=level;
   root.style.setProperty('--studio-levelbar-height',level+'px');
  }
 }
 function scheduleBars(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(measureBars);
 }
 scheduleBars();
 window.addEventListener('resize',scheduleBars,{passive:true});
 if('ResizeObserver' in window){
  const observer=new ResizeObserver(scheduleBars);
  observer.observe(header);
  observer.observe(levels);
 }

 // Separate visual mirror. The approved practice assessment and persistence stay untouched.
 const old=document.getElementById('progressStatus');
 const dest=document.getElementById('studioProgressText');
 const oldBar=document.getElementById('progressBar');
 const mirror=document.getElementById('studioProgressBar');
 if(old&&dest&&oldBar&&mirror){
  const sync=()=>{
   const text=old.textContent;
   const width=oldBar.style.width||'0%';
   if(dest.textContent!==text)dest.textContent=text;
   if(mirror.style.width!==width)mirror.style.width=width;
  };
  sync();
  const mo=new MutationObserver(sync);
  mo.observe(old,{childList:true,characterData:true,subtree:true});
  mo.observe(oldBar,{attributes:true,attributeFilter:['style']});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
