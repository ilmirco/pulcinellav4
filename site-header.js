(() => {
  'use strict';
  const header=document.querySelector('.site-header');if(!header)return;
  function update(){
    const lang=document.documentElement.lang||'it',copy=window.PULCINELLA_HEADER_COPY?.[lang]||window.PULCINELLA_HEADER_COPY?.it;
    if(copy)for(const link of header.querySelectorAll('[data-site-nav]'))link.textContent=copy[link.dataset.siteNav];
    const home=header.dataset.homePath||'./',config=header.dataset.configPath||'componi/';
    for(const link of header.querySelectorAll('[data-site-section]'))link.setAttribute('href',home+'?lang='+lang+link.dataset.siteSection);
    header.querySelector('.site-header-brand').setAttribute('href',home+'?lang='+lang);
    header.querySelector('.site-header-config')?.setAttribute('href',config+'?lang='+lang);
  }
  update();new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.addEventListener('pizza-language-change',update);window.addEventListener('pageshow',update);
})();
