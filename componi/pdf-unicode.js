(function(root){
  'use strict';
  // Browser Canvas uses the same Unicode font fallback as the interface. Pages
  // containing non-WinAnsi characters are embedded at 2.5× A4 resolution so
  // Cyrillic, Chinese and free-text notes are never replaced with question marks.
  function create({document:doc,width,height}){
    if(!root.document)throw new Error('Unicode PDF rendering requires browser Canvas.');
    const probe=root.document.createElement('canvas').getContext('2d');
    const font=(family,weight)=>({css:size=>`${weight} ${size}px ${family}`,encodeText:value=>value,widthOfTextAtSize(value,size){probe.font=this.css(size);return probe.measureText(value).width;}});
    const body='"DM Sans",Lato,"Segoe UI","Microsoft YaHei","PingFang SC",sans-serif';
    const fonts={regular:font(body,'400'),bold:font(body,'700'),serif:font(body,'700')};
    const pages=[];
    const cssColor=color=>`rgb(${Math.round(color.red*255)},${Math.round(color.green*255)},${Math.round(color.blue*255)})`;
    function addPage(){
      const canvas=root.document.createElement('canvas'),scale=2.5;canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);
      const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
      const real=doc.addPage([width,height]);
      const page={canvas,real,
        drawText(value,{x,y,size,font,color}){ctx.fillStyle=cssColor(color);ctx.font=font.css(size);ctx.fillText(value,x,height-y);},
        drawRectangle({x,y,width:w,height:h,color}){ctx.fillStyle=cssColor(color);ctx.fillRect(x,height-y-h,w,h);},
        drawLine({start,end,thickness,color}){ctx.strokeStyle=cssColor(color);ctx.lineWidth=thickness;ctx.beginPath();ctx.moveTo(start.x,height-start.y);ctx.lineTo(end.x,height-end.y);ctx.stroke();}
      };pages.push(page);return page;
    }
    async function finish(){for(const page of pages){const image=await doc.embedPng(page.canvas.toDataURL('image/png'));page.real.drawImage(image,{x:0,y:0,width,height});}}
    return{fonts,addPage,finish};
  }
  const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PizzaUnicodePDF=api;
})(typeof window!=='undefined'?window:globalThis);
