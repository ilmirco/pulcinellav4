(() => {
 'use strict';
 const header=document.querySelector('.firma-overlay-wordmark .site-header');
 if(!header)return;
 const row=header.querySelector('.site-header-row');
 const brand=header.querySelector('.site-header-brand-wrap');
 const actions=header.querySelector('.site-header-actions');
 const menu=header.querySelector('.site-header-links');
 const toggle=header.querySelector('.firma-menu-toggle');
 const title=document.querySelector('.firma-video-copy h1');
 if(!title)return;
 // The fixed tricolour strip occupies the first six pixels of the viewport.
 const titleHasLeft=()=>title.getBoundingClientRect().bottom<=6;
 let pending=0;
 function update(){
  pending=0;
  const scrolled=titleHasLeft();
  header.classList.toggle('is-scrolled',scrolled);
  header.classList.remove('firma-nav-compact');
  // Reserve space for the logo in both states; never reflow navigation on scroll.
  if(innerWidth>=1100){
   const required=brand.getBoundingClientRect().width+Math.max(actions.scrollWidth,actions.getBoundingClientRect().width)+16;
   header.classList.toggle('firma-nav-compact',required>row.clientWidth+1);
  }
  if(getComputedStyle(toggle).display==='none'){
   toggle.setAttribute('aria-expanded','false');menu.classList.remove('is-open');
  }
 }
 const schedule=()=>{if(!pending)pending=requestAnimationFrame(update);};
 // Observe the real heading rather than an arbitrary scroll distance or the subtitle.
 new IntersectionObserver(schedule,{rootMargin:'-6px 0px 0px 0px',threshold:0}).observe(title);
 new ResizeObserver(schedule).observe(title);
 addEventListener('resize',schedule);
 addEventListener('pageshow',schedule);
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 update();
})();
