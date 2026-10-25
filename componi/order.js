(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const I=node?require('./i18n.js'):root.PizzaI18n;
  const P=node?require('./pizza.js'):root.Pulcinella,Q=node?require('./formats.js'):root.PizzaFormats;
  const categoryNames={focacce:'Focacce e puccia',sfizi:'Sfizi e patatine',rosticceria:'Rosticceria'};
  const variant=(id,label,price)=>({id,label,price});
  const single=price=>[variant('standard','',price)];
  const fried=()=>[variant('portion','Porzione',500),variant('kg','1 kg',1700)];
  const catalog=[
    {id:'focaccia-classica',name:'Focaccia Classica',category:'focacce',description:'Prosciutto crudo, grana, rucola, maionese, pomodorini freschi, fior di latte',variants:single(750)},
    {id:'focaccia-moderna',name:'Focaccia Moderna',category:'focacce',description:'Tonno, pomodorini freschi, rucola, maionese, insalata, fior di latte',variants:single(750)},
    {id:'focaccia-salentina',name:'Focaccia Salentina',category:'focacce',description:'Salamino piccante, insalata, maionese, pomodorini freschi, fior di latte',variants:single(750)},
    {id:'puccia-kebab',name:'Puccia Kebab',category:'focacce',description:'Patate fritte, cipolla di Tropea, kebab, insalata, rucola, maionese, ketchup',variants:single(850)},
    {id:'mezza-pizza',name:'Mezza pizza',category:'sfizi',description:'Margherita',variants:single(250)},
    {id:'calzone-medio',name:'Calzone medio',category:'sfizi',description:'Pomodoro, mozzarella, prosciutto cotto',variants:single(250)},
    {id:'pittule',name:'Pittule',category:'sfizi',description:'Naturali oppure con Nutella',variants:[variant('natural','Naturali',400),variant('nutella','Con Nutella',500)]},
    {id:'fries',name:'Patatine fritte',category:'sfizi',description:'Scegli la misura della porzione',variants:[variant('small','Piccola',400),variant('medium','Media',500),variant('large','Grande',600)]},
    ...[['calzoncini','Calzoncini'],['chele','Chele di granchio'],['crocchette','Crocchette di patate'],['ascolane','Olive ascolane'],['arancini','Arancini di riso']].map(([id,name])=>({id,name,category:'rosticceria',description:'Disponibili a porzione o al chilo',variants:fried()}))
  ];
  I.bind(categoryNames,Object.keys(categoryNames));
  catalog.forEach(product=>{I.bind(product,['name','description']);product.variants.forEach(v=>I.bind(v,['label']));});
  const byId=Object.fromEntries(catalog.map(p=>[p.id,p]));
  const MAX_QUANTITY=99,MAX_LINES=100;
  const MAX_PIZZA_NOTE=240;
  function pizzaNote(value){return typeof value==='string'?value.replace(/\r\n?/g,'\n').trim().slice(0,MAX_PIZZA_NOTE):'';}
  const source={url:'https://www.pulcinellapatu.it/#menu',checked:'2026-10-20',dietClarified:'Chiarimento utente del 20 ottobre 2026',diet:{glutenFree:450,lactoseFree:{round:[0,150],half:[0,150,300],meter:[0,300,450,600],meterHalves:[0,300,600]}}};
  function options(raw,design){
    const d=Q.normalize(design),count=Q.count(d);
    // Legacy whole-pizza lactose-free selections apply to every taste.
    const lactoseFreeSections=Array.from({length:count},(_,i)=>Array.isArray(raw?.lactoseFreeSections)?raw.lactoseFreeSections[i]===true:raw?.lactoseFree===true);
    return{glutenFree:d.format==='round'&&raw?.glutenFree===true,lactoseFreeSections};
  }
  function dietQuote(design,raw){
    const d=Q.normalize(design),o=options(raw,d),count=o.lactoseFreeSections.filter(Boolean).length,labels=[];
    if(o.glutenFree)labels.push(I.text('Senza glutine'));
    if(count){
      const tastes=count===o.lactoseFreeSections.length?I.text('tutti i gusti'):Q.sections(d).flatMap((s,i)=>o.lactoseFreeSections[i]?[`${Q.partLabel(d,i).toLowerCase()} (${Q.sectionName(d,i)})`]:[]).join(', ');
      labels.push(I.text('Mozzarella senza lattosio')+(d.format==='round'?'':': '+tastes));
    }
    const tariff=d.format==='meter'&&Q.count(d)===2?'meterHalves':d.format;
    return{options:o,supplement:(o.glutenFree?source.diet.glutenFree:0)+source.diet.lactoseFree[tariff][count],labels};
  }
  function quantity(raw){return typeof raw==='number'&&Number.isFinite(raw)&&raw>=1?Math.min(MAX_QUANTITY,Math.floor(raw)):0;}
  function create(){return{version:1,nextId:1,lines:[],note:''};}
  function canAddPizza(raw){const d=Q.normalize(raw);return Q.validate(d).valid&&Q.sections(d).every(s=>Object.keys(s).length>0);}
  function normalize(raw){
    const out=create();if(!raw||typeof raw!=='object')return out;
    out.note=typeof raw.note==='string'?raw.note.slice(0,600):'';
    const ids=new Set();out.nextId=Number.isSafeInteger(raw.nextId)&&raw.nextId>0?Math.min(raw.nextId,100000000):1;
    for(const rawLine of Array.isArray(raw.lines)?raw.lines.slice(0,MAX_LINES):[]){
      if(!rawLine||!quantity(rawLine.quantity))continue;
      let line;
      if(rawLine.kind==='pizza'&&rawLine.design&&canAddPizza(rawLine.design))line={kind:'pizza',design:Q.normalize(rawLine.design),options:options(rawLine.options,rawLine.design),note:pizzaNote(rawLine.note)};
      if(rawLine.kind==='extra'&&byId[rawLine.product]?.variants.some(v=>v.id===rawLine.variant))line={kind:'extra',product:rawLine.product,variant:rawLine.variant};
      if(!line)continue;
      let id=typeof rawLine.id==='string'&&/^r\d{1,9}$/.test(rawLine.id)?rawLine.id:'';
      if(!id||ids.has(id)){do{id='r'+out.nextId++;}while(ids.has(id));}
      out.nextId=Math.max(out.nextId,Number(id.slice(1))+1);ids.add(id);out.lines.push({id,...line,quantity:quantity(rawLine.quantity)});
    }
    return out;
  }
  function pizzaKey(d,o,note){return JSON.stringify([d.format,Q.sections(d),options(o,d),pizzaNote(note)]);}
  function addPizza(raw,design,opts,note){
    const s=normalize(raw),d=Q.normalize(design);if(!canAddPizza(d))return s;
    const key=pizzaKey(d,opts,note),found=s.lines.find(l=>l.kind==='pizza'&&pizzaKey(l.design,l.options,l.note)===key);
    if(found)found.quantity=Math.min(MAX_QUANTITY,found.quantity+1);
    else if(s.lines.length<MAX_LINES)s.lines.push({id:'r'+s.nextId++,kind:'pizza',design:d,options:options(opts,d),note:pizzaNote(note),quantity:1});
    return s;
  }
  function addExtra(raw,product,variantId){
    const s=normalize(raw);if(!byId[product]?.variants.some(v=>v.id===variantId))return s;
    const found=s.lines.find(l=>l.kind==='extra'&&l.product===product&&l.variant===variantId);
    if(found)found.quantity=Math.min(MAX_QUANTITY,found.quantity+1);
    else if(s.lines.length<MAX_LINES)s.lines.push({id:'r'+s.nextId++,kind:'extra',product,variant:variantId,quantity:1});return s;
  }
  function setQuantity(raw,id,value){const s=normalize(raw),n=quantity(value);s.lines=s.lines.flatMap(l=>l.id!==id?[l]:n?[{...l,quantity:n}]:[]);return s;}
  function updatePizza(raw,id,design,opts,note){const s=normalize(raw);if(canAddPizza(design))s.lines=s.lines.map(l=>l.id===id&&l.kind==='pizza'?{...l,design:Q.normalize(design),options:options(opts,design),note:note===undefined?l.note:pizzaNote(note)}:l);return s;}
  function describe(line){
    if(line.kind==='extra'){const p=byId[line.product],v=p.variants.find(v=>v.id===line.variant);return{title:p.name,subtitle:v.label,detail:p.description,unit:v.price};}
    const d=Q.normalize(line.design),q=Q.quote(d),diet=dietQuote(d,line.options);
    const subtitle=[d.format==='round'?I.text('Tonda'):`${Q.formats[d.format].length} × 35 cm · ${I.text('{n} gusti',{n:Q.count(d)})}${d.format==='meter'&&Q.count(d)===2?' · '+I.text('metà e metà'):''}`,...diet.labels].join(' · ');
    return{title:Q.title(d),subtitle,detail:Q.summary(d),variations:Q.variationSummary(d),note:pizzaNote(line.note),unit:q.total===null?null:q.total+diet.supplement};
  }
  function totals(raw){const s=normalize(raw);let known=0,pending=0,count=0;for(const l of s.lines){count+=l.quantity;const unit=describe(l).unit;if(unit===null)pending+=l.quantity;else known+=unit*l.quantity;}return{known,pending,count,total:pending?null:known,lines:s.lines.length};}
  const api={catalog,byId,categoryNames,source,MAX_QUANTITY,MAX_LINES,MAX_PIZZA_NOTE,pizzaNote,create,normalize,options,dietQuote,canAddPizza,addPizza,addExtra,setQuantity,updatePizza,describe,totals};
  if(node)module.exports=api;else root.PizzaOrder=api;
})(typeof window!=='undefined'?window:globalThis);
