(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const P=node?require('./pizza.js'):root.Pulcinella,Q=node?require('./formats.js'):root.PizzaFormats,O=node?require('./order.js'):root.PizzaOrder,I=node?require('./i18n.js'):root.PizzaI18n;
  const MAX_FAVORITES=24;
  const create=()=>({version:1,nextId:1,items:[]});
  function composition(value){const design=Q.normalize(value.design);return{design,options:O.options(value.options,design),note:O.pizzaNote(value.note)};}
  function key(value){const c=composition(value);return JSON.stringify([c.design.format,Q.sections(c.design).map(p=>P.ingredients.map(i=>p[i.id]||0)),c.options,c.note]);}
  function normalize(raw){
    const out=create(),ids=new Set(),keys=new Set();
    for(const item of Array.isArray(raw?.items)?raw.items.slice(0,MAX_FAVORITES):[]){
      if(!item?.design?.drafts||!Q.formats[item.design.format]||!O.canAddPizza(item.design))continue;
      const c=composition(item),k=key(c);if(keys.has(k))continue;keys.add(k);
      let id=typeof item.id==='string'&&/^f\d{1,9}$/.test(item.id)?item.id:'';
      if(!id||ids.has(id)){do{id='f'+out.nextId++;}while(ids.has(id));}ids.add(id);out.nextId=Math.max(out.nextId,Number(id.slice(1))+1);out.items.push({id,...c});
    }
    return out;
  }
  function find(raw,value){return normalize(raw).items.find(item=>key(item)===key(value))||null;}
  function add(raw,value){const state=normalize(raw);if(!value?.design||!O.canAddPizza(value.design)||find(state,value)||state.items.length>=MAX_FAVORITES)return state;state.items.push({id:'f'+state.nextId++,...composition(value)});return state;}
  function remove(raw,id){const state=normalize(raw);state.items=state.items.filter(item=>item.id!==id);return state;}
  function pizzaText(value){
    const c=composition(value),d=O.describe({kind:'pizza',...c}),lines=[d.title,d.subtitle,d.detail];
    if(d.variations)lines.push(I.text('Variazioni')+': '+d.variations);
    if(d.note)lines.push(I.text('Note pizza')+': '+d.note);
    lines.push(d.unit===null?I.text('Prezzo da confermare'):P.money(d.unit));return lines.filter(Boolean).join('\n');
  }
  function orderText(raw){
    const order=O.normalize(raw),total=O.totals(order),lines=[I.text('Il tuo ordine')+' · Pizzeria Pulcinella'];
    order.lines.forEach(line=>{const d=O.describe(line);lines.push('',line.quantity+' × '+d.title,d.subtitle,d.detail);if(d.variations)lines.push(I.text('Variazioni')+': '+d.variations);if(d.note)lines.push(I.text('Note pizza')+': '+d.note);lines.push(d.unit===null?I.text('Prezzo da confermare'):P.money(d.unit*line.quantity));});
    if(order.note.trim())lines.push('',I.text('Le tue note')+': '+order.note);
    lines.push('',I.text(total.pending?'Totale voci con prezzo':'Totale ordine')+': '+P.money(total.known));
    if(total.pending)lines.push(I.text('Prezzi da confermare con la pizzeria.'));
    lines.push(I.text('Per ordinare, chiama 339 8390660'));return lines.filter(line=>line!==undefined).join('\n');
  }
  const api={MAX_FAVORITES,create,composition,key,normalize,find,add,remove,pizzaText,orderText};
  if(node)module.exports=api;else root.PizzaPersonal=api;
})(typeof window!=='undefined'?window:globalThis);
