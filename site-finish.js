/* Luci finite: un'animazione interrotta resta in attesa e riparte quando visibile. */
(() => {
 'use strict';
 const start=()=>{
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const active=new Map(),records=new Map(),observers=[];
  const reduced=()=>media.matches;
  const unavailable=button=>button.matches(':disabled,[aria-disabled=true]')||document.hidden;
  const stopSurface=surface=>{if(!surface)return;active.get(surface)?.cancel();active.delete(surface);};
  const stop=record=>{stopSurface(record.sweep);stopSurface(record.ripple);if(record.sweep&&!record.complete)record.button.dataset.lightState=reduced()?'reduced':'waiting';};
  const stopAll=()=>records.forEach(stop);
  const classify=record=>{
   const values=getComputedStyle(record.button).backgroundColor.match(/[\d.]+/g)?.map(Number)||[];
   const light=values.length<3||(values.length>3&&values[3]<.2)||(values[0]*.2126+values[1]*.7152+values[2]*.0722)>190;
   record.button.classList.toggle('direction-neutral-light',light);
  };
  const animate=(record,surface,frames,duration,complete)=>{
   stopSurface(surface);
   const animation=surface.animate(frames,{duration,iterations:1,easing:'cubic-bezier(.22,.61,.36,1)'});
   active.set(surface,animation);
   animation.finished.then(()=>{if(active.get(surface)!==animation)return;active.delete(surface);animation.cancel();complete?.();}).catch(()=>{});
  };
  const sweep=record=>{
   if(!record.sweep||record.complete||!record.visible||reduced()||unavailable(record.button)||active.has(record.sweep))return;
   classify(record);record.button.dataset.lightState='playing';
   record.button.dataset.lightRuns=String(Number(record.button.dataset.lightRuns||0)+1);
   animate(record,record.sweep,[{opacity:0,transform:'translateX(-110%)'},{opacity:1,offset:.25},{opacity:1,offset:.7},{opacity:0,transform:'translateX(110%)'}],1000,()=>{
    if(record.sweep.parentElement!==record.button){record.button.dataset.lightState='waiting';return;}
    record.complete=true;record.button.dataset.lightState='complete';record.button.dataset.lightCompletions=String(Number(record.button.dataset.lightCompletions||0)+1);
   });
  };
  const ripple=(record,point)=>{
   if(!record.ripple||reduced()||unavailable(record.button))return;
   classify(record);const rect=record.button.getBoundingClientRect();
   const x=(point?point.x-rect.left:rect.width/2)-90,y=(point?point.y-rect.top:rect.height/2)-90;
   animate(record,record.ripple,[{opacity:.8,transform:'translate('+x+'px,'+y+'px) scale(.1)'},{opacity:0,transform:'translate('+x+'px,'+y+'px) scale('+Math.max(rect.width,rect.height)/75+')'}],450);
  };
  document.querySelectorAll('html.site-finish[data-button-variant="fume-luce"]').forEach(scope=>{
   const kind=scope.dataset.buttonVariant,hasSweep=kind!=='fume',hasRipple=kind!=='luce';
   const buttons=[...scope.querySelectorAll('.direction-btn,.hero-configurator-actions>a,.configurator-link,.home-order-button,.primary-button')];
   const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>entries.forEach(entry=>{
    const record=records.get(entry.target);record.visible=entry.isIntersecting;if(record.visible)sweep(record);else stop(record);
   }),{threshold:.6}):null;
   if(observer)observers.push({observer,buttons});
   buttons.forEach(button=>{
    if(records.has(button))return;
    const record={button,complete:false,visible:false,sweep:null,ripple:null};records.set(button,record);
    button.classList.add('direction-luminous');button.dataset.lightState=hasSweep?'waiting':'ripple';
    const layer=className=>{const node=document.createElement('span');node.className=className;node.setAttribute('aria-hidden','true');button.append(node);return node;};
    if(hasSweep)record.sweep=layer('direction-light');
    if(hasRipple){record.ripple=layer('direction-ripple');button.addEventListener('pointerdown',event=>{if(event.button===0)ripple(record,{x:event.clientX,y:event.clientY});});}
    classify(record);observer?.observe(button);
   });
  });
  const refresh=()=>{records.forEach(classify);observers.forEach(({observer,buttons})=>buttons.forEach(button=>{if(!records.get(button).complete){observer.unobserve(button);observer.observe(button);}}));};
  const availability=new MutationObserver(entries=>entries.forEach(entry=>{
   const record=records.get(entry.target);if(!record)return;
   // Il traduttore può sostituire textContent del link: ripristina solo le nostre decorazioni.
   const layers=[record.sweep,record.ripple].filter(Boolean);
   if(layers.some(layer=>layer.parentElement!==record.button)){
    stop(record);record.button.classList.add('direction-luminous');
    layers.forEach(layer=>{if(layer.parentElement!==record.button)record.button.append(layer);});classify(record);
   }
   if(unavailable(record.button))stop(record);else sweep(record);
  }));
  records.forEach(record=>availability.observe(record.button,{childList:true,attributes:true,attributeFilter:['disabled','aria-disabled','hidden']}));
  const update=()=>{stopAll();if(!reduced())refresh();};
  media.addEventListener('change',update);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAll();else refresh();});
  let resizeFrame=0;addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(refresh);});
  document.fonts?.ready.then(refresh);update();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
