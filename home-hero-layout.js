/* Run in the head so returning from the configurator restores layout before paint. */
(()=>{
 'use strict';
 const root=document.documentElement;
 const mobile=matchMedia('(max-width:820px)');
 const storageKey='pulcinella-mobile-hero-layout-v1';
 const entrancePreview=new URL(location.href).searchParams.has('heroMotion');
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
  if(!layoutWidth&&!entrancePreview){
   try{
    const saved=JSON.parse(sessionStorage.getItem(storageKey));
    if(saved?.width===width&&Number.isFinite(saved.height)&&saved.height>=100&&saved.height<=10000)height=saved.height;
   }catch{}
  }
  layoutWidth=width;
  root.style.setProperty('--mobile-hero-height',height+'px');
  root.classList.toggle('mobile-hero-compact',height<=620);
  if(!entrancePreview)try{sessionStorage.setItem(storageKey,JSON.stringify({width,height}));}catch{}
 }
 size();
 addEventListener('resize',size,{passive:true});
 addEventListener('pageshow',size);
 mobile.addEventListener('change',size);
})();

/* First-visit mobile reveal. Geometry and video framing stay owned by the layout above. */
(()=>{
 'use strict';
 const root=document.documentElement,mobile=matchMedia('(max-width:820px)'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
 const navigation=performance.getEntriesByType('navigation')[0]?.type;
 const requested=new URL(location.href).searchParams.get('heroMotion');
 const force=requested==='title';
 root.dataset.heroEntranceVariant='title';
 let internal=false;
 try{internal=!!document.referrer&&new URL(document.referrer).origin===location.origin;}catch{}
 if(!mobile.matches||location.hash||navigation==='back_forward'||(internal&&navigation!=='reload'&&!force)){
  root.dataset.heroEntrance='skipped';return;
 }
 let active=true,titleFrame=0,titleTimer=0;
 root.dataset.heroEntrance=reduce.matches?'reduced':'preparing';
 function finish(reason){
  if(!active)return;active=false;clearTimeout(fallback);
  cancelAnimationFrame(titleFrame);clearTimeout(titleTimer);document.removeEventListener('DOMContentLoaded',prepareTitle);
  root.dataset.heroEntrance='complete';root.dataset.heroEntranceReason=reason;
  document.removeEventListener('animationend',onEnd);
  document.removeEventListener('pointerdown',onInput,true);
  document.removeEventListener('keydown',onInput,true);
  document.removeEventListener('visibilitychange',onVisibility);
  removeEventListener('scroll',onScroll);removeEventListener('pageshow',onPageShow);
  mobile.removeEventListener('change',onPreference);reduce.removeEventListener('change',onPreference);
 }
 function onEnd(event){
  if(event.animationName==='hero-title-expand'&&event.target.classList.contains('vhs-film'))finish('finished');
  else if(event.animationName==='hero-entry-fade'&&root.dataset.heroEntrance==='reduced'&&event.target.classList.contains('hero-video-backdrop'))finish('reduced');
 }
 function onInput(){finish('interaction');}
 function onScroll(){if(scrollY>8)finish('scroll');}
 function onVisibility(){if(document.hidden)finish('hidden');}
 function onPageShow(event){if(event.persisted)finish('restored');}
 function onPreference(){finish('preference');}
 function prepareTitle(){
  if(!active)return;
  const film=document.querySelector('.vhs-film'),title=document.querySelector('.firma-video-copy h1');
  if(!film||!title){finish('missing-title');return;}
  // Measure the real heading, including its responsive font metrics, before revealing it.
  Promise.race([document.fonts?.ready||Promise.resolve(),new Promise(resolve=>{titleTimer=setTimeout(resolve,180);})]).then(()=>{
   clearTimeout(titleTimer);
   if(!active)return;
   titleFrame=requestAnimationFrame(()=>{
    if(!active)return;
    const frame=film.getBoundingClientRect(),heading=title.getBoundingClientRect();
    const geometry={
     'title-origin-x':heading.left-frame.left+heading.width/2,
     'title-origin-y':heading.top-frame.top+heading.height/2,
     'title-inset-top':Math.max(0,heading.top-frame.top-6),
     'title-inset-right':Math.max(0,frame.right-heading.right-10),
     'title-inset-bottom':Math.max(0,frame.bottom-heading.bottom-6),
     'title-inset-left':Math.max(0,heading.left-frame.left-10)
    };
    for(const [key,value] of Object.entries(geometry))film.style.setProperty('--'+key,value+'px');
    // Every side travels the same distance on the same clock. The film's own
    // rounded clipping stops the visible edge as soon as it reaches the perimeter.
    const expansion=Math.max(...['top','right','bottom','left'].map(side=>geometry['title-inset-'+side]));
    film.style.setProperty('--title-expand-distance',expansion+'px');
    root.dataset.heroEntrance='playing';
   });
  });
 }
 document.addEventListener('animationend',onEnd);
 document.addEventListener('pointerdown',onInput,{capture:true,passive:true});
 document.addEventListener('keydown',onInput,true);
 document.addEventListener('visibilitychange',onVisibility);
 addEventListener('scroll',onScroll,{passive:true});addEventListener('pageshow',onPageShow);
 mobile.addEventListener('change',onPreference);reduce.addEventListener('change',onPreference);
 // Fail open if an interrupted load prevents the animationend notification.
 const fallback=setTimeout(()=>finish('fallback'),3000);
 if(!reduce.matches){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prepareTitle,{once:true});else prepareTitle();
 }
})();
