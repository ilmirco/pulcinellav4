(()=>{
 'use strict';
 const video=document.getElementById('hero-fire-video');
 if(!video)return;
 const mobile=matchMedia('(max-width:820px)');
 function select(){
  const mode=mobile.matches?'mobile':'desktop',src=video.dataset[mode+'Src'];
  video.poster=video.dataset[mode+'Poster'];
  video.dataset.src=src;
  if(video.getAttribute('src')&&video.getAttribute('src')!==src){
   video.src=src;video.load();
   if(!document.hidden&&!matchMedia('(prefers-reduced-motion:reduce)').matches&&video.getBoundingClientRect().bottom>0)video.play().catch(()=>{});
  }
 }
 select();mobile.addEventListener('change',select);
})();
