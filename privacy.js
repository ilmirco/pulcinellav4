(() => {
  'use strict';
  const select=document.querySelector('#lang-selector');
  const titles=Array.from(document.querySelectorAll('.privacy-content h2'));
  const nodes=attribute=>Array.from(document.querySelectorAll('['+attribute+']'));
  const original={};
  nodes('data-copy').forEach(node=>original[node.dataset.copy]=node.textContent);
  original.language=select.getAttribute('aria-label');
  original.authority=document.querySelector('#privacy-authority').textContent;
  original.headings=titles.map(node=>node.textContent);
  original.body=[];
  nodes('data-body').forEach(node=>original.body[Number(node.dataset.body)]=node.textContent);
  const copy={it:original,...window.PulcinellaPrivacyCopy};
  const locales={it:'it-IT',en:'en-GB',fr:'fr-FR',de:'de-DE',es:'es-ES',pt:'pt-PT',zh:'zh-CN',sv:'sv-SE',nl:'nl-NL',ru:'ru-RU'};
  function apply(language,persist=false){
    const lang=Object.hasOwn(copy,language)?language:'it',text=copy[lang];
    document.documentElement.lang=lang;
    document.title=text.title+' | Pizzeria Pulcinella';
    document.querySelector('meta[name=description]').content=text.intro;
    nodes('data-copy').forEach(node=>node.textContent=text[node.dataset.copy]);
    titles.forEach((node,i)=>node.textContent=text.headings[i]);
    nodes('data-body').forEach(node=>node.textContent=text.body[Number(node.dataset.body)]);
    document.querySelector('#privacy-authority').textContent=text.authority;
    document.querySelector('#google-policy').href='https://policies.google.com/privacy?hl='+lang;
    document.querySelector('#updated-date').textContent=new Intl.DateTimeFormat(locales[lang],{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date('2026-10-25T12:00:00Z'));
    nodes('data-home-link').forEach(node=>node.href='./?lang='+lang);
    select.value=lang;select.setAttribute('aria-label',text.language);
    document.querySelector('#home-language-flag').dataset.language=lang;
    const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url.pathname+url.search+url.hash);
    if(persist)try{localStorage.setItem('preferredLanguage',lang);}catch{}
  }
  function initial(){
    const requested=new URL(location.href).searchParams.get('lang');let saved;
    try{saved=localStorage.getItem('preferredLanguage');}catch{}
    apply(Object.hasOwn(copy,requested)?requested:Object.hasOwn(copy,saved)?saved:'it');
  }
  select.addEventListener('change',()=>apply(select.value,true));
  window.addEventListener('storage',event=>{if(event.key==='preferredLanguage')apply(event.newValue);});
  initial();
})();
