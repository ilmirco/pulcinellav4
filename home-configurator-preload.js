(function(root){
  'use strict';
  const automaticAllowed=connection=>!connection?.saveData&&!['slow-2g','2g'].includes(connection?.effectiveType);
  function createQueue(load,limit=2){
    const jobs=new Map(),queue=[];let running=0,stopped=false;
    function pump(){while(!stopped&&running<limit&&queue.length){const job=queue.shift();running++;Promise.resolve().then(()=>load(job.url)).then(()=>job.resolve(true),()=>job.resolve(false)).finally(()=>{running--;pump();});}}
    return{add(urls){if(stopped)return Promise.resolve(urls.map(()=>false));const pending=urls.map(url=>{if(jobs.has(url))return jobs.get(url);let resolve;const promise=new Promise(done=>{resolve=done;});jobs.set(url,promise);queue.push({url,resolve});return promise;});pump();return Promise.all(pending);},stop(){stopped=true;for(const job of queue.splice(0))job.resolve(false);}};
  }
  if(typeof module!=='undefined'&&module.exports){module.exports={automaticAllowed,createQueue};return;}
  let manifestPromise,controller=new AbortController(),queue=createQueue(load),generation=0;
  async function load(url){const response=await fetch(url,{credentials:'same-origin',cache:'default',priority:'low',signal:controller.signal});if(!response.ok)throw Error('Prefetch unavailable');await response.arrayBuffer();}
  function manifest(){return manifestPromise||(manifestPromise=fetch(new URL('configurator-startup.json',document.baseURI),{credentials:'same-origin',cache:'no-cache',priority:'low'}).then(response=>{if(!response.ok)throw Error('Manifest unavailable');return response.json();}).catch(error=>{manifestPromise=null;throw error;}));}
  async function warm(intent=false){
    if(!intent&&(!automaticAllowed(navigator.connection)||document.visibilityState!=='visible'))return;
    const current=++generation;document.documentElement.dataset.configuratorPreload='loading';
    try{
      const data=await manifest();if(current!==generation)return;const target=new URL('componi/',document.baseURI);target.searchParams.set('lang',document.documentElement.lang||'it');
      const resources=[target.href,...data.resources.map(file=>new URL(file,document.baseURI)).filter(url=>url.origin===location.origin).map(url=>url.href)];
      const results=await queue.add(resources);if(current===generation)document.documentElement.dataset.configuratorPreload=results.every(Boolean)?'ready':'partial';
    }catch{if(current===generation)document.documentElement.dataset.configuratorPreload='unavailable';}
  }
  function idle(){if(root.requestIdleCallback)root.requestIdleCallback(()=>warm(),{timeout:1500});else setTimeout(()=>warm(),0);}
  if(document.readyState==='complete')idle();else root.addEventListener('load',idle,{once:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')idle();});
  function intent(event){if(event.target.closest?.('a[data-config-copy="0"]'))warm(true);}
  document.addEventListener('pointerover',intent,{passive:true});document.addEventListener('focusin',intent);document.addEventListener('pointerdown',intent,{passive:true});
  document.querySelector('#lang-selector')?.addEventListener('change',()=>warm());
  root.addEventListener('pagehide',()=>{generation++;queue.stop();controller.abort();});
  root.addEventListener('pageshow',event=>{if(event.persisted){controller=new AbortController();queue=createQueue(load);idle();}});
})(typeof window!=='undefined'?window:globalThis);
