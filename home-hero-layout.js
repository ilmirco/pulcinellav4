/* Run in the head so returning from the configurator restores layout before paint. */
(()=>{
 'use strict';
 const root=document.documentElement;
 const mobile=matchMedia('(max-width:820px)');
 const storageKey='pulcinella-mobile-hero-layout-v1';
 let layoutWidth=0;
 function size(){
  const width=root.clientWidth;
  if(!mobile.matches){
   layoutWidth=0;
   root.style.removeProperty('--mobile-hero-height');
   root.classList.remove('mobile-hero-compact');
   return;
  }
  // Height-only changes come from browser chrome or the keyboard, not rotation.
  if(width===layoutWidth)return;
  let height=innerHeight;
  if(!layoutWidth){
   try{
    const saved=JSON.parse(sessionStorage.getItem(storageKey));
    if(saved?.width===width&&Number.isFinite(saved.height)&&saved.height>=100&&saved.height<=10000)height=saved.height;
   }catch{}
  }
  layoutWidth=width;
  root.style.setProperty('--mobile-hero-height',height+'px');
  root.classList.toggle('mobile-hero-compact',height<=620);
  try{sessionStorage.setItem(storageKey,JSON.stringify({width,height}));}catch{}
 }
 size();
 addEventListener('resize',size,{passive:true});
 addEventListener('pageshow',size);
 mobile.addEventListener('change',size);
})();
