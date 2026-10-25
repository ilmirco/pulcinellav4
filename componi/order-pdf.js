(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports,O=node?require('./order.js'):root.PizzaOrder,P=node?require('./pizza.js'):root.Pulcinella;
  const lib=node?require('./vendor/pdf-lib.min.js'):root.PDFLib;
  const I=node?require('./i18n.js'):root.PizzaI18n,U=node?require('./pdf-unicode.js'):root.PizzaUnicodePDF;
  async function generate(raw,{date=new Date()}={}){
    const order=O.normalize(raw),totals=O.totals(order),{PDFDocument,StandardFonts,rgb}=lib;
    const doc=await PDFDocument.create();doc.setTitle(I.text('Il tuo ordine')+' - Pizzeria Pulcinella');doc.setAuthor('Pizzeria Pulcinella');doc.setCreationDate(date);
    const latinRegular=await doc.embedFont(StandardFonts.Helvetica),latinBold=await doc.embedFont(StandardFonts.HelveticaBold),latinSerif=await doc.embedFont(StandardFonts.TimesRomanBold);
    const content=[order.note,...order.lines.flatMap(line=>{const item=O.describe(line);return[item.title,item.subtitle,item.detail,item.variations||'',item.note||''];})].join(' ');
    const unicode=['zh','ru'].includes(I.language)||Array.from(content).some(character=>{try{latinRegular.encodeText(character);return false;}catch{return true;}});
    if(unicode&&root.document)await root.document.fonts.ready;
    const raster=unicode&&root.document?U.create({document:doc,width:595.28,height:841.89}):null;
    const {regular,bold,serif}=raster?raster.fonts:{regular:latinRegular,bold:latinBold,serif:latinSerif};
    const green=rgb(.1,.42,.16),ink=rgb(.16,.18,.14),muted=rgb(.38,.41,.34),lineColor=rgb(.84,.87,.81);
    const W=595.28,H=841.89,left=42,right=W-42,pages=[];let page,y,continuation='';
    function clean(text){return Array.from(String(text).replace(/[\u2011\u2013\u2014]/g,'-').replace(/\r/g,'')).map(c=>{try{regular.encodeText(c);return c;}catch{return '?';}}).join('');}
    function text(value,x,baseline,size=10,font=regular,color=ink){page.drawText(clean(value),{x,y:baseline,size,font,color});}
    function alignRight(value,x,baseline,size=10,font=regular,color=ink){const s=clean(value);text(s,x-font.widthOfTextAtSize(s,size),baseline,size,font,color);}
    function rule(baseline){page.drawLine({start:{x:left,y:baseline},end:{x:right,y:baseline},thickness:.6,color:lineColor});}
    function wrap(value,width,size=9,font=regular){
      const lines=[];for(const paragraph of String(value).split('\n')){let current='';for(const word of clean(paragraph).split(/\s+/).filter(Boolean)){
        const candidate=current?current+' '+word:word;if(font.widthOfTextAtSize(candidate,size)<=width){current=candidate;continue;}
        if(current){lines.push(current);current='';}for(const c of word){if(font.widthOfTextAtSize(current+c,size)>width){lines.push(current);current='';}current+=c;}
      }lines.push(current);}return lines;
    }
    function newPage(){
      page=raster?raster.addPage():doc.addPage([W,H]);pages.push(page);page.drawRectangle({x:0,y:H-5,width:W/3,height:5,color:green});page.drawRectangle({x:W*2/3,y:H-5,width:W/3,height:5,color:rgb(.8,.08,.08)});
      text('Pizzeria Pulcinella',left,H-48,23,serif,green);alignRight(date.toLocaleDateString(I.locale),right,H-45,9,regular,muted);
      text(I.text('Il tuo ordine'),left,H-76,17,bold);text('Patù · Via Giuseppe Garibaldi, 24 · 339 8390660',left,H-94,9,regular,muted);
      rule(H-108);text(I.text('Q.TÀ'),left,H-126,8,bold,muted);text(I.text('PIZZE E SFIZI'),left+42,H-126,8,bold,muted);alignRight(I.text('UNITARIO'),right-78,H-126,8,bold,muted);alignRight(I.text('IMPORTO'),right,H-126,8,bold,muted);y=H-149;
    }
    function ensure(height){if(y-height<60){newPage();if(continuation){text(continuation,left+42,y,10,bold,green);y-=18;}}}
    function paragraph(value,{size=9,font=regular,color=muted,x=left+42,width=right-left-42,leading=13}={}){
      for(const row of wrap(value,width,size,font)){ensure(leading);text(row,x,y,size,font,color);y-=leading;}
    }
    newPage();
    for(const entry of order.lines){
      const item=O.describe(entry);continuation='';ensure(78);continuation=I.text('{name} (segue)',{name:item.title});text(String(entry.quantity),left,y,11,bold);
      const titleLines=wrap(item.title,245,12,bold);text(titleLines[0],left+42,y,12,bold);
      alignRight(item.unit===null?I.text('Da conf.'):P.money(item.unit),right-78,y,10);
      alignRight(item.unit===null?I.text('Da conf.'):P.money(item.unit*entry.quantity),right,y,10,bold);
      y-=17;for(const row of titleLines.slice(1)){ensure(15);text(row,left+42,y,12,bold);y-=15;}
      if(item.subtitle)paragraph(item.subtitle,{font:bold,size:9,color:green});
      paragraph(item.detail);if(item.variations){y-=3;paragraph(I.text('Variazioni')+': '+item.variations,{size:9,color:ink});}if(item.note){y-=3;paragraph(I.text('Note pizza')+': '+item.note,{size:9,color:ink});}y-=9;ensure(9);rule(y);y-=23;
    }
    continuation='';if(order.note.trim()){ensure(58);text(I.text('Le tue note'),left,y,11,bold);y-=18;continuation=I.text('{name} (segue)',{name:I.text('Le tue note')});paragraph(order.note,{x:left,width:right-left,size:10,leading:15});y-=15;}
    continuation='';
    ensure(totals.pending?85:60);text(totals.pending?I.text('Totale voci con prezzo'):I.text('Totale ordine'),left,y,12,bold,green);alignRight(P.money(totals.known),right,y,18,bold,green);y-=22;
    if(totals.pending)paragraph(I.text(`${totals.pending} ${totals.pending===1?'articolo con prezzo':'articoli con prezzo'} da confermare con la pizzeria.`),{x:left,width:right-left,size:10,leading:15});
    y-=10;ensure(28);text(I.text('Per ordinare, chiama 339 8390660'),left,y,11,bold);
    for(let i=0;i<pages.length;i++){page=pages[i];text('pulcinellapatu.it',left,28,8,regular,muted);alignRight(`${i+1} / ${pages.length}`,right,28,8,regular,muted);}
    if(raster)await raster.finish();
    return doc.save();
  }
  const api={generate};if(node)module.exports=api;else root.PizzaOrderPDF=api;
})(typeof window!=='undefined'?window:globalThis);
