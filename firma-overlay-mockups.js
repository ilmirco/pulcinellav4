(() => {
 'use strict';
 const header=document.querySelector('.site-header');
 const toggle=header?.querySelector('.firma-menu-toggle');
 const menu=header?.querySelector('#firma-mockup-nav');
 if(!toggle||!menu)return;
 const wide=matchMedia('(min-width:1100px)');
 const close=(restoreFocus=false)=>{toggle.setAttribute('aria-expanded','false');menu.classList.remove('is-open');if(restoreFocus)toggle.focus();};
 toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));menu.classList.toggle('is-open',open);});
 menu.addEventListener('click',event=>{if(event.target.closest('a'))close();});
 document.addEventListener('click',event=>{if(!menu.contains(event.target)&&!toggle.contains(event.target))close();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){close(true);event.preventDefault();}});
 wide.addEventListener('change',()=>close());
 // Keep the local comparison links in the language selected by the visitor.
 const updateLinks=()=>{for(const link of document.querySelectorAll('.vhs-study-tools a')){const url=new URL(link.href);url.searchParams.set('lang',document.documentElement.lang||'it');link.href=url.href;}};
 updateLinks();new MutationObserver(updateLinks).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
