(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const catalog=node?require('./i18n-catalog.js'):root.PizzaTranslations;
  const languages=['it','en','fr','de','es','pt','zh','sv','nl','ru'];
  const locales={it:'it-IT',en:'en-GB',fr:'fr-FR',de:'de-DE',es:'es-ES',pt:'pt-PT',zh:'zh-CN',sv:'sv-SE',nl:'nl-NL',ru:'ru-RU'};
  const names={it:'🇮🇹 Italiano',en:'🇬🇧 English',fr:'🇫🇷 Français',de:'🇩🇪 Deutsch',es:'🇪🇸 Español',pt:'🇵🇹 Português',zh:'🇨🇳 中文',sv:'🇸🇪 Svenska',nl:'🇳🇱 Nederlands',ru:'🇷🇺 Русский'};
  let language='it',revision=0,observer;
  if(!node){try{const requested=new URL(root.location.href).searchParams.get('lang'),saved=root.localStorage.getItem('preferredLanguage');language=languages.includes(requested)?requested:languages.includes(saved)?saved:'it';root.localStorage.setItem('preferredLanguage',language);}catch{}}
  const folded=new Map(Object.keys(catalog).map(key=>[key.toLocaleLowerCase('it'),key]));
  const patterns=Object.keys(catalog).filter(key=>/\{\w+\}/.test(key)).sort((a,b)=>b.replace(/\{\w+\}/g,'').length-a.replace(/\{\w+\}/g,'').length).map(key=>{
    const fields=[];let previous=0,expression='^';
    for(const m of key.matchAll(/\{(\w+)\}/g)){expression+=escape(key.slice(previous,m.index))+'([\\s\\S]+?)';fields.push(m[1]);previous=m.index+m[0].length;}
    return{key,fields,regex:new RegExp(expression+escape(key.slice(previous))+'$','u')};
  });
  function escape(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+');}
  function lookup(key){return language==='it'?key:catalog[key]?.[language]??key;}
  function text(value,params,depth=0){
    const original=String(value??'');
    if(params)return lookup(original).replace(/\{(\w+)\}/g,(_,name)=>String(params[name]??''));
    if(language==='it'||!original.trim())return original;
    const source=original.trim(),prefix=original.slice(0,original.indexOf(source)),suffix=original.slice(original.indexOf(source)+source.length);
    const surcharge=/^\+ €(\d+),(\d\d)$/.exec(source);
    if(surcharge)return prefix+'+ '+new Intl.NumberFormat(locales[language],{style:'currency',currency:'EUR'}).format(Number(surcharge[1])+Number(surcharge[2])/100)+suffix;
    let key=Object.hasOwn(catalog,source)?source:folded.get(source.toLocaleLowerCase('it'));
    if(key)return prefix+lookup(key)+suffix;
    if(depth<3)for(const pattern of patterns){const match=pattern.regex.exec(source);if(match){const values=Object.fromEntries(pattern.fields.map((field,index)=>[field,text(match[index+1],null,depth+1)]));return prefix+text(pattern.key,values,depth+1)+suffix;}}
    for(const separator of ['\n',' · '])if(source.includes(separator)){const parts=source.split(separator),translated=parts.map(part=>text(part,null,depth+1));if(translated.some((part,index)=>part!==parts[index]))return prefix+translated.join(separator)+suffix;}
    const sentences=source.split(/(\.\s+)/u);
    if(depth<3&&sentences.length>1){const translated=[];for(let i=0;i<sentences.length;i+=2){const ending=sentences[i+1]||'',fragment=sentences[i]+(ending?'.':'');translated.push(text(fragment,null,depth+1)+(ending?ending.slice(1):''));}const result=translated.join('');if(result!==source)return prefix+result+suffix;}
    return original;
  }
  function list(value){return String(value).split(', ').map(part=>text(part)).join(', ');}
  function bind(object,fields){for(const field of fields){const value=object[field];Object.defineProperty(object,field,{enumerable:true,configurable:false,get:()=>field==='description'?list(value):text(value)});}return object;}
  const sources=new WeakMap(),attributes=new WeakMap();
  const excluded=el=>el?.closest('script,style,noscript,[data-no-translate],#config-language');
  function translateNode(n){
    if(n.nodeType!==3||excluded(n.parentElement)||n.parentElement?.closest('textarea'))return;
    const current=n.nodeValue,previous=sources.get(n);
    if(previous?.last===current&&previous.revision===revision)return;
    const source=previous?.last===current?previous.source:current,last=text(source);
    sources.set(n,{source,last,revision});if(last!==current)n.nodeValue=last;
  }
  function translateAttributes(el){
    if(excluded(el)&&el.id!=='config-language')return;let saved=attributes.get(el);if(!saved){saved={};attributes.set(el,saved);}
    for(const name of ['aria-label','placeholder','title','alt']){
      if(!el.hasAttribute(name))continue;const current=el.getAttribute(name),previous=saved[name];
      if(previous?.last===current&&previous.revision===revision)continue;
      const source=previous?.last===current?previous.source:current,last=text(source);saved[name]={source,last,revision};if(last!==current)el.setAttribute(name,last);
    }
  }
  function localize(area=root.document){
    if(!area)return;if(area.nodeType===3){translateNode(area);return;}
    if(area.nodeType===1)translateAttributes(area);
    const walk=root.document.createTreeWalker(area,root.NodeFilter.SHOW_TEXT|root.NodeFilter.SHOW_ELEMENT);
    while(walk.nextNode()){if(walk.currentNode.nodeType===3)translateNode(walk.currentNode);else translateAttributes(walk.currentNode);}
  }
  let originalTitle='',originalDescription='';
  function updateMetadata(){const meta=root.document.querySelector('meta[name="description"]');if(meta&&originalDescription)meta.setAttribute('content',text(originalDescription));}
  function setLanguage(value,{persist=true,notify=true}={}){
    if(!languages.includes(value))return false;
    language=value;revision++;
    if(!node){
      if(persist)try{root.localStorage.setItem('preferredLanguage',value);}catch{}
      root.document.documentElement.lang=value;
      root.document.title=(originalTitle.startsWith('Anteprima')?text('Anteprima')+' · ':'')+text('Componi la tua pizza')+' · Pizzeria Pulcinella, Patù';
      updateMetadata();
      const select=root.document.querySelector('#config-language');if(select)select.value=value;
      const flag=root.document.querySelector('#language-flag');if(flag){flag.textContent=names[value].split(' ')[0];flag.dataset.language=value;}
      try{const url=new URL(root.location.href);url.searchParams.set('lang',value);root.history.replaceState(null,'',url);}catch{}
      if(notify)root.dispatchEvent(new CustomEvent('pizza-language-change',{detail:{language:value}}));
      localize();
    }
    return true;
  }
  function init(){
    originalTitle=root.document.title;root.document.documentElement.lang=language;
    root.document.title=(originalTitle.startsWith('Anteprima')?text('Anteprima')+' · ':'')+text('Componi la tua pizza')+' · Pizzeria Pulcinella, Patù';
    originalDescription=root.document.querySelector('meta[name="description"]')?.getAttribute('content')||'';updateMetadata();
    const select=root.document.querySelector('#config-language');
    if(select){for(const code of languages){const option=root.document.createElement('option');option.value=code;option.textContent=names[code];select.append(option);}select.value=language;select.addEventListener('change',()=>setLanguage(select.value));}
    const flag=root.document.querySelector('#language-flag');if(flag){flag.textContent=names[language].split(' ')[0];flag.dataset.language=language;}
    localize();
    observer=new MutationObserver(records=>{const areas=new Set();for(const record of records){if(record.type==='characterData')translateNode(record.target);else if(record.type==='attributes')translateAttributes(record.target);else for(const added of record.addedNodes)areas.add(added);}for(const area of areas)localize(area);});
    observer.observe(root.document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title','alt']});
  }
  const api={languages,locales,names,text,list,bind,localize,setLanguage,get language(){return language;},get locale(){return locales[language];},catalog};
  if(node)module.exports=api;else{root.PizzaI18n=api;init();}
})(typeof window!=='undefined'?window:globalThis);
