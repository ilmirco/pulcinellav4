(()=>{
 'use strict';
 const video=document.getElementById('hero-fire-video');
 if(!video)return;
 const mobile=matchMedia('(max-width:820px)');
 let webmFailed=false;
 function select(){
  const mode=mobile.matches?'mobile':'desktop';
  const webm=mode==='mobile'&&!webmFailed&&video.dataset.mobileWebm&&video.canPlayType('video/webm; codecs="vp9"');
  const src=webm?video.dataset.mobileWebm:video.dataset[mode+'Src'];
  video.poster=video.dataset[mode+'Poster'];
  video.dataset.src=src;
  if(video.getAttribute('src')&&video.getAttribute('src')!==src){
   video.closest('.hero-video-preview').dataset.videoReady='false';
   video.src=src;video.load();
   if(!document.hidden&&!matchMedia('(prefers-reduced-motion:reduce)').matches&&video.getBoundingClientRect().bottom>0)video.play().catch(()=>{});
  }
 }
 // Catch a failed WebM before the playback controller marks the hero unavailable.
 video.addEventListener('error',event=>{
  if(!mobile.matches||webmFailed||!video.dataset.mobileWebm||!video.currentSrc.endsWith(video.dataset.mobileWebm))return;
  webmFailed=true;event.stopImmediatePropagation();select();
 },true);
 select();mobile.addEventListener('change',select);
})();
