(function(root){
  'use strict';
  function create({P,M,Q,assets,drawPiece}){
    const bases=new Map(),sources=new Map(),surfaces=new Map(),buffers=new Map();
    function layer(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
    function source(format,index){
          const key=format+':'+index;if(sources.has(key))return sources.get(key);
          const file=format==='half'?Q.halfFiles.flat()[index]:Q.atlasFiles[Math.floor(index/3)],image=assets[file];
          if(!image)throw new Error('Fotografia della base non ancora caricata');
          const w=image.naturalWidth,h=format==='half'?image.naturalHeight:Math.floor(image.naturalHeight/3),row=format==='half'?0:index%3;
          const tile=layer(w,h),ctx=tile.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,row*h,w,h,0,0,w,h);
          const pixels=ctx.getImageData(0,0,w,h),d=M.cleanAlpha(pixels.data,w,h);let x0=w,y0=h,x1=0,y1=0;
          for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>150){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
          if(x1<=x0||y1<=y0)throw new Error('Base rettangolare non disponibile');
          if(index>=3)for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=(y*w+x)*4;if(d[i+3]&&x>x0+(x1-x0)*.055&&x<x1-(x1-x0)*.055&&y>y0+(y1-y0)*.075&&y<y1-(y1-y0)*.075)M.toneTomato(d,i);}
          ctx.putImageData(pixels,0,0);const result=layer(x1-x0+1,y1-y0+1);result.getContext('2d').drawImage(tile,x0,y0,result.width,result.height,0,0,result.width,result.height);
          sources.set(key,result);if(sources.size>6)sources.delete(sources.keys().next().value);return result;
    }
    function prepare(format,indices){
      for(const index of new Set(indices)){
          const key=format+':'+index;if(bases.has(key)){const cached=bases.get(key);bases.delete(key);bases.set(key,cached);continue;}
          const plan=P.baseLayers({tomato:Math.floor(index/3),fior:index%3}),extra=n=>n===null?null:source(format,n);
          const result=root.PizzaBaseSurface.compose(source(format,plan.foundation),extra(plan.tomato),extra(plan.fior),'rectangle');
          bases.set(key,result);if(bases.size>6)bases.delete(bases.keys().next().value);
      }
    }
    function photo(ctx,index,format,w,h){const img=bases.get(format+':'+index),g=Q.geometry(format);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(img,g.left/g.width*w,g.top/g.height*h,(g.right-g.left)/g.width*w,(g.bottom-g.top)/g.height*h);}
    function surface(design,w,h){
      const parts=Q.sections(design),key=design.format+':'+w+':'+parts.map(p=>(p.tomato||0)*3+P.visualFior(p)).join(',');
      if(surfaces.has(key))return surfaces.get(key);
      const g=Q.geometry(design.format),c=layer(w,h),ctx=c.getContext('2d');
      photo(ctx,(parts[0].tomato||0)*3+P.visualFior(parts[0]),design.format,w,h);
      Q.zones(design).forEach((z,index)=>{
        if(!index)return;const overlay=layer(w,h),paint=overlay.getContext('2d'),mask=layer(w,h),maskCtx=mask.getContext('2d'),left=z.left/g.width*w;
        photo(paint,(parts[index].tomato||0)*3+P.visualFior(parts[index]),design.format,w,h);
        const blend=maskCtx.createLinearGradient(left,0,left+12/g.width*w,0);blend.addColorStop(0,'transparent');blend.addColorStop(1,'#000');maskCtx.fillStyle=blend;maskCtx.fillRect(left,g.innerTop/g.height*h,(Math.min(z.right,g.innerRight)-z.left)/g.width*w,(g.innerBottom-g.innerTop)/g.height*h);
        paint.globalCompositeOperation='destination-in';paint.drawImage(mask,0,0);ctx.drawImage(overlay,0,0);
      });
      const cheese=layer(w,h),cheeseCtx=cheese.getContext('2d',{willReadFrequently:true});cheeseCtx.drawImage(c,0,0);const pixels=cheeseCtx.getImageData(0,0,w,h),d=pixels.data;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;d[i+3]=x>g.innerLeft/g.width*w&&x<g.innerRight/g.width*w&&y>g.innerTop/g.height*h&&y<g.innerBottom/g.height*h?Math.round(d[i+3]*M.cheeseCoverage(d[i],d[i+1],d[i+2])):0;}
      cheeseCtx.putImageData(pixels,0,0);const entry={base:c,cheese};surfaces.set(key,entry);if(surfaces.size>2)surfaces.delete(surfaces.keys().next().value);return entry;
    }
    function draw(target,raw){
      const design=Q.normalize(raw),g=Q.geometry(design.format),w=target.width,h=Math.round(w/g.aspect);prepare(design.format,Q.sections(design).map(p=>(p.tomato||0)*3+P.visualFior(p)));if(target.height!==h)target.height=h;
      const ctx=target.getContext('2d'),parts=Q.sections(design),all=Q.longPieces(design,{scaleFor:id=>M.profile(id).scale}).map(p=>({...p,y:p.y*h/w,size:p.size*h/w,coBaked:M.withCheese(p.type,P.visualFior(parts[p.section]))}));
      const base=surface(design,w,h);ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(base.base,0,0);
      const key=w+'x'+h;if(!buffers.has(key)){buffers.set(key,{baked:layer(w,h),readable:layer(w,h),edge:layer(w,h),tone:layer(w,h),fresh:layer(w,h)});if(buffers.size>2)buffers.delete(buffers.keys().next().value);}
      const work=buffers.get(key);for(const c of Object.values(work)){const cctx=c.getContext('2d');cctx.globalCompositeOperation='source-over';cctx.globalAlpha=1;cctx.clearRect(0,0,w,h);}
      const baked=work.baked.getContext('2d'),readable=work.readable.getContext('2d'),edge=work.edge.getContext('2d'),tone=work.tone.getContext('2d'),fresh=work.fresh.getContext('2d');
      for(const p of all){const m=M.profile(p.type);if(m.melted)drawPiece(ctx,P.byId[p.type],p,w);else if(m.relief){drawPiece(m.readable?readable:baked,P.byId[p.type],p,w);if(P.visualFior(parts[p.section]))drawPiece(edge,P.byId[p.type],p,w,true,.75);}else drawPiece(fresh,P.byId[p.type],p,w);}
      tone.drawImage(base.base,0,0);tone.globalCompositeOperation='destination-in';tone.drawImage(work.baked,0,0);baked.save();baked.globalCompositeOperation='soft-light';baked.globalAlpha=.3;baked.drawImage(work.tone,0,0);baked.restore();ctx.drawImage(work.baked,0,0);ctx.drawImage(work.readable,0,0);
      edge.globalCompositeOperation='source-in';edge.drawImage(base.cheese,0,0);ctx.save();ctx.globalAlpha=.85;ctx.drawImage(work.edge,0,0);ctx.restore();ctx.drawImage(work.fresh,0,0);
      for(const key of ['base','servings','oliveGarnish','surfaceBlend','pieceCount','ovenCount','finishCount','foundation'])delete target.dataset[key];
      target.dataset.baseMode='ingredient-layers-v33';
      target.dataset.format=design.format;target.dataset.sections=JSON.stringify(parts);target.dataset.activeSection=String(design.active);target.dataset.toppingCount=String(all.length);target.dataset.sectionCounts=JSON.stringify(parts.map((_,i)=>all.filter(p=>p.section===i).length));target.dataset.coBakedCount=String(all.filter(p=>p.coBaked).length);target.dataset.dimensions=`${Q.formats[design.format].length}x35`;target.dataset.baseIndices=JSON.stringify(parts.map(p=>(p.tomato||0)*3+P.visualFior(p)));target.dataset.integration='rectangular-co-baked-v19';target.dataset.meltedCount=String(all.filter(p=>M.profile(p.type).melted).length);target.dataset.bufalaStyle='melted-white-islands';
      const counts={};for(const p of all)counts[p.type]=(counts[p.type]||0)+1;target.dataset.ingredientCounts=JSON.stringify(counts);target.dataset.visualFior=JSON.stringify(parts.map(p=>P.visualFior(p)));
      target.dataset.basePhotoSource=design.format==='half'?'dedicated-half-v21':'native-metre-v21';target.dataset.basePhotoFiles=JSON.stringify(Q.photoFiles(design));target.dataset.basePhotoSizes=JSON.stringify(parts.map(p=>{const img=bases.get(design.format+':'+((p.tomato||0)*3+P.visualFior(p)));return{width:img.width,height:img.height};}));
    }
    return{draw};
  }
  root.PizzaLongRenderer={create};
})(window);
