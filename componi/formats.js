(function(root){
  'use strict';
  const I=typeof module!=='undefined'&&module.exports?require('./i18n.js'):root.PizzaI18n;
  const P=typeof module!=='undefined'&&module.exports?require('./pizza.js'):root.Pulcinella;
  const formats=Object.freeze({round:{id:'round',name:'Tonda',count:1,length:null,width:null},half:{id:'half',name:'½ metro',count:2,length:50,width:35,marinara:1200,margherita:1300,mixed:1700,supplements:[0,200,200]},meter:{id:'meter',name:'1 metro',count:3,counts:[2,3],length:100,width:35,marinara:2300,margherita:2500,mixed:3200,supplements:[0,200,300,400],halfSupplements:[0,200,400]}});
  Object.values(formats).forEach(format=>I.bind(format,['name']));
  const atlasFiles=['metro-impasto-v17.webp','metro-pomodoro-v17.webp','metro-pomodoro-extra-v17.webp'];
  const halfFiles=Object.freeze(Array.from({length:3},(_,tomato)=>Object.freeze(Array.from({length:3},(_,fior)=>`mezzo-${tomato}${fior}-v21.png`))));
  function photoFiles(raw){const d=normalize(raw);return [...new Set(sections(d).flatMap(s=>Object.values(P.baseLayers(s)).filter(index=>index!==null).map(index=>d.format==='round'?P.baseAssets.flat()[index]:d.format==='half'?halfFiles.flat()[index]:atlasFiles[Math.floor(index/3)])))];}
  const defaults=['margherita','funghi','diavola'].map(id=>P.menu.find(r=>r.id===id).servings);
  const clone=s=>({...P.normalize(s)});
  const draftKey=s=>s.format==='meter'&&s.meterParts===2?'meterHalves':s.format;
  function create(round=defaults[0]){return{format:'round',meterParts:3,active:0,drafts:{round:[clone(round)],half:defaults.slice(0,2).map(clone),meter:defaults.map(clone),meterHalves:defaults.slice(0,2).map(clone)},recipes:{round:[P.match(round)?.id||null],half:['margherita','funghi'],meter:['margherita','funghi','diavola'],meterHalves:['margherita','funghi']}};}
  function normalize(raw){
    const out=create();if(!raw||typeof raw!=='object')return out;
    for(const [id,f] of Object.entries(formats))for(let n=0;n<f.count;n++)if(raw.drafts?.[id]?.[n]&&typeof raw.drafts[id][n]==='object')out.drafts[id][n]=clone(raw.drafts[id][n]);
    out.drafts.meterHalves=out.drafts.meter.slice(0,2).map(clone);
    for(let n=0;n<2;n++)if(raw.drafts?.meterHalves?.[n]&&typeof raw.drafts.meterHalves[n]==='object')out.drafts.meterHalves[n]=clone(raw.drafts.meterHalves[n]);
    for(const key of Object.keys(out.drafts))out.recipes[key]=out.drafts[key].map((part,n)=>{const saved=raw.recipes?.[key]?.[n];return saved===null?null:P.menu.some(r=>r.id===saved)?saved:P.match(part)?.id||null;});
    if(Object.hasOwn(formats,raw.format))out.format=raw.format;
    out.meterParts=raw.meterParts===2?2:3;
    out.active=Number.isInteger(raw.active)?Math.max(0,Math.min(out.drafts[draftKey(out)].length-1,raw.active)):0;return out;
  }
  function sections(raw){const s=normalize(raw);return s.drafts[draftKey(s)];}
  function count(raw){return sections(raw).length;}
  function partLabel(raw,index){const s=normalize(raw);return I.text(s.format==='meter'&&s.meterParts===2?'Metà {n}':'Gusto {n}',{n:index+1});}
  function current(raw){const s=normalize(raw);return s.drafts[draftKey(s)][s.active];}
  function setFormat(raw,id){const s=normalize(raw);if(Object.hasOwn(formats,id)){s.format=id;s.active=0;}return s;}
  function setMeterParts(raw,n){const s=normalize(raw);if(n===2||n===3){s.meterParts=n;s.active=0;}return s;}
  function select(raw,index){const s=normalize(raw);if(Number.isInteger(index)&&index>=0&&index<s.drafts[draftKey(s)].length)s.active=index;return s;}
  function update(raw,servings,{recipeId}={}){const s=normalize(raw);s.drafts[draftKey(s)][s.active]=clone(servings);if(recipeId!==undefined)s.recipes[draftKey(s)][s.active]=P.menu.some(r=>r.id===recipeId)?recipeId:null;return s;}
  function chooseRecipe(raw,id){const r=P.menu.find(item=>item.id===id);return r?update(raw,r.servings,{recipeId:id}):normalize(raw);}
  function reference(raw,index){const s=normalize(raw);return P.menu.find(r=>r.id===s.recipes[draftKey(s)][index??s.active])||null;}
  function sectionName(raw,index){const s=normalize(raw),n=index??s.active,part=sections(s)[n],base=reference(s,n);return P.match(part)?.name||(base?I.text('{name} personalizzata',{name:base.name}):partName(part));}
  function variations(raw){const s=normalize(raw);return sections(s).map((part,index)=>{const base=reference(s,index);const items=base?P.ingredients.flatMap(i=>{const before=base.servings[i.id]||0,after=part[i.id]||0;if(before===after)return[];const key=after===0?'Senza {ingredient}':after===2?'Doppia porzione di {ingredient}':before===2?'Porzione standard di {ingredient}':'Con {ingredient}';return[{id:i.id,before,after,text:I.text(key,{ingredient:i.name})}];}):[];return{index,label:partLabel(s,index),base:base?.name||null,items};});}
  function variationSummary(raw){const s=normalize(raw);return variations(s).filter(v=>v.items.length).map(v=>(s.format==='round'?'':v.label+': ')+v.items.map(i=>i.text).join(', ')).join('\n');}
  function same(a,b){return JSON.stringify(normalize(a))===JSON.stringify(normalize(b));}
  function partName(s){return P.match(s)?.name||I.text(Object.keys(P.normalize(s)).length?'Personalizzata':'Solo impasto');}
  function longTariff(parts){const ids=parts.map(x=>P.match(x)?.id);return ids.every(id=>id==='marinara')?'marinara':ids.every(id=>id==='margherita'||id==='marinara')?'margherita':'mixed';}
  function title(raw){
    const s=normalize(raw),f=formats[s.format],parts=sections(s);if(s.format==='round')return sectionName(s,0);
    const tariff=longTariff(parts),name=tariff==='marinara'?'Marinara':tariff==='mixed'?I.text('Mista'):parts.every(x=>P.match(x)?.id==='margherita')?'Margherita':I.text('Margherita e Marinara');
    return `${f.name} ${name}`;
  }
  function premium(s){return ['porcini','friarielli','bufala','sausage','bresaola'].some(id=>s[id]>0)||s.fior===2;}
  function validate(raw){
    const s=normalize(raw),parts=sections(s);if(s.format==='round')return{valid:true,message:''};
    if(parts.some(x=>!Object.keys(x).length))return{valid:false,message:I.text('Completa tutti i gusti prima di salvare.')};
    return{valid:true,message:''};
  }
  function quote(raw){
    const s=normalize(raw),parts=sections(s),f=formats[s.format];
    if(s.format==='round'){const r=P.match(parts[0]);return{total:r?.price??null,base:r?.price??null,supplement:0,premiumSections:0,extraUnknown:!r};}
    const base=f[longTariff(parts)];
    const premiumSections=parts.filter(premium).length,supplement=(s.format==='meter'&&s.meterParts===2?f.halfSupplements:f.supplements)[premiumSections];
    const extraUnknown=parts.some(x=>Object.entries(x).some(([id,n])=>n===2&&id!=='fior'));
    return{total:validate(s).valid&&!extraUnknown?base+supplement:null,base,supplement,premiumSections,extraUnknown};
  }
  function summary(raw){const s=normalize(raw);if(s.format==='round')return P.summary(current(s))||I.text('Solo impasto');return sections(s).map((p,i)=>`${partLabel(s,i)} · ${sectionName(s,i)}: ${P.summary(p)||I.text('Solo impasto')}`).join('\n');}
  function geometry(id){const f=formats[id]||formats.round;if(f.id==='round')return{width:1,height:1,aspect:1};const width=(f.length+8)*10,height=430;return{width,height,aspect:width/height,left:40,right:width-40,top:40,bottom:390,innerLeft:60,innerRight:width-60,innerTop:60,innerBottom:370};}
  function zones(raw){const s=normalize(typeof raw==='string'?{format:raw}:raw),g=geometry(s.format),n=count(s);if(s.format==='round')return[];const span=(g.right-g.left)/n;return Array.from({length:n},(_,i)=>({index:i,left:g.left+span*i,right:g.left+span*(i+1),top:g.innerTop,bottom:g.innerBottom}));}
  function hit(raw,x,y){
    if((typeof raw==='string'&&!Object.hasOwn(formats,raw))||!Number.isFinite(x)||!Number.isFinite(y))return null;
    const s=normalize(typeof raw==='string'?{format:raw}:raw);if(s.format==='round')return Math.hypot(x-.5,y-.5)<.48?0:null;
    const g=geometry(s.format),n=count(s);if(x*g.width<g.left||x*g.width>g.right||y*g.height<g.top||y*g.height>g.bottom)return null;
    return Math.max(0,Math.min(n-1,Math.floor((x*g.width-g.left)/(g.right-g.left)*n)));
  }
  function longPieces(raw,{scaleFor=()=>1}={}){
    const s=normalize(raw);if(s.format==='round')return P.pieces(current(s),{scaleFor});
    const g=geometry(s.format),regions=zones(s),out=[];
    sections(s).forEach((part,index)=>{
      const z=regions[index];
      const counters={},placed={};
      for(const piece of P.pieces(part,{scaleFor,arrange:false,density:s.format==='meter'?3/count(s):1})){
        if(piece.type==='fior')continue;
        const key=piece.type+':'+piece.portion,n=counters[key]||0;counters[key]=n+1;
        const diameter=piece.size*350,margin=diameter*scaleFor(piece.type)*.72;
        const rng=P.random(P.hash(`long:${piece.type}:${index}:${piece.portion}:${n}`)),previous=placed[piece.type]||(placed[piece.type]=[]);
        // Best-candidate scattering avoids repeated diagonal rows and keeps the first portion fixed.
        let x,y,best=-1;
        for(let attempt=0;attempt<12;attempt++){const cx=z.left+margin+rng()*(z.right-z.left-2*margin),cy=z.top+margin+rng()*(z.bottom-z.top-2*margin),distance=previous.length?Math.min(...previous.map(p=>(p.x-cx)**2+(p.y-cy)**2)):1;if(distance>best){best=distance;x=cx;y=cy;}}
        if(piece.garnish){x=(z.left+z.right)/2+(piece.x-.5)*350;y=(z.top+z.bottom)/2+(piece.y-.5)*350;}
        previous.push({x,y});
        out.push({...piece,x:x/g.width,y:y/g.height,size:diameter/g.height,rotation:piece.rotation+index*.63,variant:(piece.variant+index*5)%16,section:index,coBaked:P.visualFior(part)>0,baseIndex:(part.tomato||0)*3+P.visualFior(part)});
      }
    });
    return P.separateMeats(out,{scaleFor,width:g.width,height:g.height,regionFor:p=>regions[p.section]}).sort((a,b)=>a.layer-b.layer||a.portion-b.portion);
  }
  const api={formats,atlasFiles,halfFiles,photoFiles,create,normalize,current,sections,count,partLabel,setFormat,setMeterParts,select,update,chooseRecipe,reference,sectionName,variations,variationSummary,same,partName,title,premium,validate,quote,summary,geometry,zones,hit,longPieces};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PizzaFormats=api;
})(typeof window!=='undefined'?window:globalThis);
