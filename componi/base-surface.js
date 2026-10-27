(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports,M=node?require('./materials.js'):root.PizzaMaterials;
  const clamp=n=>Math.max(0,Math.min(1,n));
  function smooth(a,b,n){const t=clamp((n-a)/(b-a));return t*t*(3-2*t);}
  function interior(x,y,w,h,shape){
    const u=(x+.5)/w,v=(y+.5)/h;
    if(shape==='round')return 1-smooth(.385,.418,Math.hypot(u-.5,v-.5));
    return smooth(.075,.11,u)*(1-smooth(.89,.925,u))*smooth(.105,.145,v)*(1-smooth(.855,.895,v));
  }
  const red=(r,g,b)=>smooth(14,65,r-g)*smooth(10,55,r-b);
  // Add sauce only to sauce pixels, and melted cheese only where the cheese photo
  // has cheese. The foundation's alpha, shape and crust are never replaced.
  function blend(base,tomato,cheese,w,h,shape='round'){
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4,mask=interior(x,y,w,h,shape);if(!mask||!base[i+3])continue;
      if(tomato){
        const coverage=mask*red(base[i],base[i+1],base[i+2])*.72;
        const sourceRed=red(tomato[i],tomato[i+1],tomato[i+2])*tomato[i+3]/255;
        for(let c=0;c<3;c++){
          const dense=base[i+c]*[.98,.91,.93][c],value=dense*(1-sourceRed*.38)+tomato[i+c]*sourceRed*.38;
          base[i+c]=Math.round(base[i+c]*(1-coverage)+value*coverage);
        }
      }
      if(cheese){
        const coverage=mask*M.cheeseCoverage(cheese[i],cheese[i+1],cheese[i+2])*cheese[i+3]/255*.94;
        for(let c=0;c<3;c++)base[i+c]=Math.round(base[i+c]*(1-coverage)+cheese[i+c]*coverage);
      }
    }
    return base;
  }
  function compose(foundation,tomato,cheese,shape){
    if(!tomato&&!cheese)return foundation;
    const w=foundation.naturalWidth||foundation.width,h=foundation.naturalHeight||foundation.height;
    const c=root.document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(foundation,0,0,w,h);
    const pixels=ctx.getImageData(0,0,w,h),scratch=root.document.createElement('canvas');scratch.width=w;scratch.height=h;
    const paint=scratch.getContext('2d',{willReadFrequently:true});
    function sample(image){if(!image)return null;paint.clearRect(0,0,w,h);paint.drawImage(image,0,0,w,h);return paint.getImageData(0,0,w,h).data;}
    blend(pixels.data,sample(tomato),sample(cheese),w,h,shape);ctx.putImageData(pixels,0,0);return c;
  }
  // Keep the approved pizza silhouette and rim, filling only its middle with bare dough.
  function blendDough(dough,rim,w,h,shape='round'){
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const u=(x+.5)/w,v=(y+.5)/h,i=(y*w+x)*4;
      const mask=shape==='round'?1-smooth(.425,.445,Math.hypot(u-.5,v-.5)):
        smooth(.035,.065,u)*(1-smooth(.935,.965,u))*smooth(.055,.09,v)*(1-smooth(.91,.945,v));
      if(!mask)continue;
      for(let c=0;c<4;c++)rim[i+c]=Math.round(rim[i+c]*(1-mask)+dough[i+c]*mask);
    }
    return rim;
  }
  function composeDough(dough,rim,shape='round'){
    const w=rim.naturalWidth||rim.width,h=rim.naturalHeight||rim.height;
    const canvas=root.document.createElement('canvas');canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(rim,0,0,w,h);
    const pixels=ctx.getImageData(0,0,w,h),scratch=root.document.createElement('canvas');scratch.width=w;scratch.height=h;
    const paint=scratch.getContext('2d',{willReadFrequently:true});paint.drawImage(dough,0,0,w,h);
    blendDough(paint.getImageData(0,0,w,h).data,pixels.data,w,h,shape);ctx.putImageData(pixels,0,0);return canvas;
  }
  const api={interior,blend,compose,blendDough,composeDough};if(node)module.exports=api;else root.PizzaBaseSurface=api;
})(typeof window!=='undefined'?window:globalThis);
