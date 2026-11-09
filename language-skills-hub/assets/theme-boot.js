/* R18: synchronous first-paint theme, no dependencies or analytics. */
(function(){
 'use strict';
 var mode='dark';
 try{if(window.localStorage.getItem('lsh:catalog-theme:v1')==='light')mode='light';}
 catch(_){}
 document.documentElement.setAttribute('data-theme',mode);
})();