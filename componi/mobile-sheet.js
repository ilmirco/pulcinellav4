(function(root){
  'use strict';
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  function limits(height,barHeight,min,ratio,long,contentMin=100,coverHeight=0){const collapsed=clamp(Math.max(min,height*ratio),0,Math.max(0,height-barHeight-contentMin));return{collapsed,expanded:coverHeight>0?-coverHeight:0};}
  function destination(position,velocity,bounds){return Math.abs(velocity)>.35?velocity<0:position+velocity*150<(bounds.collapsed+bounds.expanded)/2;}
  function create({bar,workspace,layout,getFormat,handles=[]}){
    const I=root.PizzaI18n,preview=workspace.querySelector('.pizza-preview'),reduced=root.matchMedia('(prefers-reduced-motion: reduce)');
    let expanded=false,gesture=null,frame=0,settle=0,resizeFrame=0,suppress=false,suppressTimer,lastFormat='',lastBounds='';
    function bounds(){
      const style=getComputedStyle(workspace),lift=Math.max(0,-parseFloat(style.marginTop)||0),main=workspace.closest('main');
      // Cover the format controls too, stopping directly below the site header.
      const cover=Math.max(0,workspace.getBoundingClientRect().top-main.getBoundingClientRect().top+lift);
      return limits(workspace.clientHeight-lift,bar.offsetHeight,parseFloat(style.getPropertyValue('--sheet-preview-min'))||0,parseFloat(style.getPropertyValue('--sheet-preview-ratio'))||0,getFormat()!=='round',parseFloat(style.getPropertyValue('--sheet-content-min'))||100,cover);
    }
    function label(){bar.title=I.text('Trascina la barra in alto o in basso');}
    function position(){return preview.getBoundingClientRect().height+(parseFloat(getComputedStyle(workspace).marginTop)||0);}
    function write(value){workspace.style.setProperty('--composer-preview-height',Math.max(0,value)+'px');workspace.style.setProperty('--composer-sheet-lift',Math.max(0,-value)+'px');}
    function clear(){workspace.style.removeProperty('--composer-preview-height');workspace.style.removeProperty('--composer-sheet-lift');}
    function settled(){workspace.classList.remove('sheet-settling');root.dispatchEvent(new Event('resize'));}
    function setExpanded(value,animate=true){
      expanded=!!value;label();clearTimeout(settle);cancelAnimationFrame(frame);workspace.classList.remove('sheet-dragging','sheet-settling');
      if(!layout.matches){clear();return;}
      const range=bounds(),current=position(),target=expanded?range.expanded:range.collapsed;
      document.body.dataset.composerExpanded=String(expanded);lastBounds=JSON.stringify(range);lastFormat=getFormat();
      write(current);
      if(!animate||reduced.matches||Math.abs(current-target)<1){write(target);return;}
      // Both ends are explicit pixel tracks, so the grid can interpolate smoothly.
      frame=requestAnimationFrame(()=>{workspace.classList.add('sheet-settling');write(target);settle=setTimeout(settled,260);});
    }
    function cancel(){if(!gesture)return;const previous=gesture;gesture=null;cancelAnimationFrame(frame);workspace.classList.remove('sheet-dragging');if(bar.hasPointerCapture?.(previous.id))bar.releasePointerCapture(previous.id);setExpanded(expanded,false);}
    function sync(){
      label();if(!layout.matches){cancel();clear();delete document.body.dataset.composerExpanded;return;}
      if(workspace.classList.contains('sheet-settling'))return;
      const range=bounds(),key=JSON.stringify(range);if(!gesture&&(key!==lastBounds||lastFormat!==getFormat()))setExpanded(expanded,false);
    }
    // The tab bar and optional instruction rows share the same sheet gesture.
    for(const handle of [bar,...handles.filter(Boolean)])handle.addEventListener('pointerdown',event=>{
      if(!layout.matches||event.isPrimary===false||event.button!==0){if(event.isPrimary===false)cancel();return;}
      clearTimeout(settle);workspace.classList.remove('sheet-settling');const range=bounds();gesture={id:event.pointerId,x:event.clientX,y:event.clientY,start:position(),position:position(),lastY:event.clientY,lastTime:event.timeStamp,velocity:0,range,dragging:false};
    });
    root.addEventListener('pointermove',event=>{
      if(!gesture||event.pointerId!==gesture.id)return;const dy=event.clientY-gesture.y,dx=event.clientX-gesture.x;
      if(!gesture.dragging){if(Math.abs(dy)<8)return;if(Math.abs(dx)>Math.abs(dy)){cancel();return;}gesture.dragging=true;bar.setPointerCapture(event.pointerId);workspace.classList.add('sheet-dragging');}
      const elapsed=event.timeStamp-gesture.lastTime;if(elapsed>0)gesture.velocity=(event.clientY-gesture.lastY)/elapsed;
      gesture.lastY=event.clientY;gesture.lastTime=event.timeStamp;gesture.position=clamp(gesture.start+dy,gesture.range.expanded,gesture.range.collapsed);
      cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(gesture)write(gesture.position);});
    },{passive:true});
    root.addEventListener('pointerup',event=>{
      if(!gesture||event.pointerId!==gesture.id)return;const completed=gesture;gesture=null;cancelAnimationFrame(frame);workspace.classList.remove('sheet-dragging');
      if(completed.dragging){write(completed.position);suppress=true;clearTimeout(suppressTimer);suppressTimer=setTimeout(()=>{suppress=false;},450);const velocity=event.timeStamp-completed.lastTime>120?0:completed.velocity;setExpanded(destination(completed.position,velocity,completed.range));}
      if(bar.hasPointerCapture?.(completed.id))bar.releasePointerCapture(completed.id);
    });
    root.addEventListener('pointercancel',event=>{if(gesture?.id===event.pointerId)cancel();});
    // Touch implicitly captures the tab button. Transferring capture to the bar
    // emits a bubbling loss from that button; only loss FROM the bar cancels us.
    bar.addEventListener('lostpointercapture',event=>{if(event.target===bar&&gesture?.id===event.pointerId)cancel();});
    bar.addEventListener('click',event=>{if(suppress){event.preventDefault();event.stopImmediatePropagation();suppress=false;}},true);
    bar.addEventListener('keydown',event=>{if(['PageUp','PageDown','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();setExpanded(['PageUp','ArrowUp'].includes(event.key));}});
    const resize=()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(gesture)cancel();sync();});};
    // Lifting the panel resizes the workspace itself; do not interrupt its own gesture.
    new ResizeObserver(()=>{if(!gesture)sync();}).observe(workspace);root.addEventListener('resize',resize,{passive:true});root.addEventListener('pizza-language-change',label);root.addEventListener('pagehide',cancel);
    sync();return{sync,expand:(animate=true)=>setExpanded(true,animate),reveal(){if(layout.matches&&expanded)setExpanded(false,false);}};
  }
  const api={clamp,limits,destination,create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PizzaMobileSheet=api;
})(typeof window!=='undefined'?window:globalThis);
