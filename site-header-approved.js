(() => {
 'use strict';
 const header=document.querySelector('.site-header[data-approved-header]');
 if(!header)return;
 const actions=header.querySelector('.site-header-actions'),menu=header.querySelector('.site-header-links');
 const toggle=document.createElement('button');
 toggle.type='button';toggle.className='site-header-menu-toggle';
 menu.id='approved-site-navigation';
 toggle.setAttribute('aria-controls',menu.id);toggle.setAttribute('aria-expanded','false');
 toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span class="approved-header-label" data-site-nav="nav_menu">Il Menu</span>';
 actions.insertBefore(toggle,menu);
 const close=(focus=false)=>{toggle.setAttribute('aria-expanded','false');menu.classList.remove('is-open');if(focus)toggle.focus();};
 toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));menu.classList.toggle('is-open',open);});
 menu.addEventListener('click',event=>{if(event.target.closest('a'))close();});
 document.addEventListener('click',event=>{if(!menu.contains(event.target)&&!toggle.contains(event.target))close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){close(true);event.preventDefault();}});
 let pending=0;
 function update(){
  pending=0;
  const copy=window.PULCINELLA_HEADER_COPY?.[document.documentElement.lang]||window.PULCINELLA_HEADER_COPY?.it;
  if(copy)toggle.querySelector('span').textContent=copy.nav_menu;
  header.classList.remove('is-compact');
  if(innerWidth>=1100){
   const brand=header.querySelector('.site-header-brand-wrap'),row=header.querySelector('.site-header-row');
   header.classList.toggle('is-compact',brand.getBoundingClientRect().width+Math.max(actions.scrollWidth,actions.getBoundingClientRect().width)+16>row.clientWidth+1);
  }
  if(getComputedStyle(toggle).display==='none')close();
 }
 const schedule=()=>{if(!pending)pending=requestAnimationFrame(update);};
 addEventListener('resize',schedule);addEventListener('pageshow',schedule);
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 update();
})();
