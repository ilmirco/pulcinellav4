(()=>{
 'use strict';
 const video=document.getElementById('hero-fire-video');
 if(!video)return;
 const mobile=matchMedia('(max-width:820px)');
 const root=document.documentElement;
 let layoutWidth=0;
 function sizeMobileHero(){
  const width=root.clientWidth;
  if(!mobile.matches){
   layoutWidth=0;
   root.style.removeProperty('--mobile-hero-height');
   document.body.classList.remove('mobile-hero-compact');
   return;
  }
  // Browser chrome changes height during scrolling. Keep the initial layout
  // until a real width change (including phone rotation), not every resize.
  if(width===layoutWidth)return;
  layoutWidth=width;
  root.style.setProperty('--mobile-hero-height',innerHeight+'px');
  document.body.classList.toggle('mobile-hero-compact',innerHeight<=620);
 }
 function select(){
  const mode=mobile.matches?'mobile':'desktop',src=video.dataset[mode+'Src'];
  video.poster=video.dataset[mode+'Poster'];
  video.dataset.src=src;
  if(video.getAttribute('src')&&video.getAttribute('src')!==src){
   video.src=src;video.load();
   if(!document.hidden&&!matchMedia('(prefers-reduced-motion:reduce)').matches&&video.getBoundingClientRect().bottom>0)video.play().catch(()=>{});
  }
 }
 sizeMobileHero();select();
 addEventListener('resize',sizeMobileHero,{passive:true});
 mobile.addEventListener('change',()=>{sizeMobileHero();select();});
})();
