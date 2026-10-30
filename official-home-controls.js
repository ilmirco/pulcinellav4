/* Preserve the live hero's intrinsic CTA widths without restoring its old visual layout. */
(()=>{
 const actions=document.querySelector('.hero-configurator-actions');
 if(!actions||!document.documentElement.classList.contains('official-home-controls'))return;
 const probe=document.createElement('div');
 probe.setAttribute('aria-hidden','true');probe.inert=true;
 Object.assign(probe.style,{position:'fixed',top:'-10000px',left:'0',height:'0',overflow:'hidden',visibility:'hidden',pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center'});
 const inner=document.createElement('div');inner.className='max-w-4xl mx-auto';
 const heading=document.createElement('div');heading.className='font-heading font-bold text-5xl md:text-7xl lg:text-8xl mb-6 leading-tight';heading.textContent='Pizzeria Pulcinella';
 const subtitle=document.createElement('p');subtitle.className='text-lg md:text-2xl mb-10 max-w-2xl mx-auto font-body opacity-95';
 inner.append(heading,subtitle);probe.append(inner);document.body.append(probe);
 let frame=0;
 function measure(){
  if(inner.lastElementChild!==subtitle)inner.lastElementChild.remove();
  if(document.body.classList.contains('firma-classic-preview')&&matchMedia('(max-width:820px)').matches){
   actions.style.removeProperty('--official-actions-width');return;
  }
  subtitle.textContent=document.querySelector('.vhs-subtitle')?.textContent||'';
  const clone=actions.cloneNode(true);
  for(const el of [clone,...clone.querySelectorAll('*')]){el.removeAttribute('id');el.removeAttribute('data-i18n');el.removeAttribute('data-config-copy');}
  clone.querySelectorAll('.direction-light,.direction-ripple').forEach(el=>el.remove());
  clone.className='official-actions-probe';
  const small=matchMedia('(max-width:639.98px)').matches;
  Object.assign(clone.style,{display:'grid',gridTemplateColumns:small?'minmax(0,1fr)':'repeat(3,minmax(0,1fr))',gridAutoRows:'1fr',alignItems:'stretch',width:'100%',maxWidth:small?'320px':'840px',gap:small?'12px':'16px',marginInline:'auto'});
  const realButtons=[...actions.children];
  [...clone.children].forEach((button,index)=>{
   const style=getComputedStyle(realButtons[index]);
   for(const key of ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','padding','borderWidth','borderStyle','boxSizing','minHeight','gap'])button.style[key]=style[key];
   Object.assign(button.style,{display:'flex',alignItems:'center',justifyContent:'center',width:'100%',minWidth:'0',overflowWrap:'anywhere'});
   button.className='';
   button.querySelectorAll('svg').forEach(svg=>Object.assign(svg.style,{width:'20px',height:'20px',flexShrink:'0'}));
  });
  inner.append(clone);
  probe.style.width=document.documentElement.clientWidth+'px';
  const width=Math.min(840,inner.getBoundingClientRect().width);
  actions.style.setProperty('--official-actions-width',width+'px');
 }
 const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
 new ResizeObserver(schedule).observe(document.documentElement);
 new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 addEventListener('pageshow',schedule);document.fonts.ready.then(schedule);schedule();
})();
