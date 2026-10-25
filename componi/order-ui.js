(function(root){
  'use strict';
  function create({getDesign,setDesign,isReady,announce,focusComposer,renderThumbnail,onPizzaAdded,onDraftChange}){
    const O=root.PizzaOrder,P=root.Pulcinella,Q=root.PizzaFormats,I=root.PizzaI18n,$=s=>document.querySelector(s),storage='pulcinella-order-v1';
    let order=O.create(),editingId=null,beforeEdit=null,category='sfizi',pdfURL=null,pdfGeneration=0,pdfTimer;
    const variants=new Map(),dietDrafts=new Map(),noteDrafts=new Map();let dietFormat=null;
    try{order=O.normalize(JSON.parse(localStorage.getItem(storage)));}catch{}
    function notify(message){$('#order-live').textContent=message;announce(message);}
    function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;}
    function button(text,label,action,id){const b=el('button','',text);b.type='button';b.setAttribute('aria-label',label);b.dataset.orderAction=action;b.dataset.line=id;return b;}
    function persist(){try{localStorage.setItem(storage,JSON.stringify(order));$('#order-storage-note').hidden=true;}catch{$('#order-storage-note').hidden=false;}}
    const dietKey=d=>d.format==='meter'?'meter-'+Q.count(d):d.format;
    function opts(){const d=getDesign();return O.options(dietDrafts.get(dietKey(d)),d);}
    function setOpts(value={},design=getDesign()){dietDrafts.set(dietKey(design),O.options(value,design));}
    function note(){return O.pizzaNote(noteDrafts.get(dietKey(getDesign())));}
    function syncNote(){
      const value=noteDrafts.get(dietKey(getDesign()))||'',field=$('#pizza-note');
      if(document.activeElement!==field)field.value=value;
      $('#pizza-note-details').classList.toggle('has-note',!!value.trim());
      $('#pizza-note-status').textContent=I.text(value.trim()?'Aggiunte':'Facoltative');
    }
    function setNote(value='',design=getDesign()){
      noteDrafts.set(dietKey(design),O.pizzaNote(value));
      $('#pizza-note-details').open=!!O.pizzaNote(value);
    }
    function syncDiet(){
      const d=getDesign(),round=d.format==='round',o=opts(),parts=Q.sections(d),area=$('#lactose-free-tastes');
      $('#gluten-free-option').hidden=!round;$('#pizza-gluten-free').disabled=!round;$('#pizza-gluten-free').checked=o.glutenFree;
      $('#gluten-free-unavailable').hidden=round;$('#lactose-free-round').hidden=!round;$('#pizza-lactose-free').disabled=!round;$('#pizza-lactose-free').checked=o.lactoseFreeSections[0];
      $('#lactose-free-long').hidden=round;
      if(dietFormat!==dietKey(d)){
        area.replaceChildren();
        if(!round)parts.forEach((part,i)=>{const label=el('label'),input=el('input'),name=el('span','diet-taste-name');input.type='checkbox';input.id='pizza-lactose-free-'+i;input.dataset.lactoseTaste=String(i);label.append(input,name);area.append(label);});
        dietFormat=dietKey(d);
      }
      if(!round)parts.forEach((part,i)=>{area.children[i].querySelector('input').checked=o.lactoseFreeSections[i];area.children[i].querySelector('.diet-taste-name').textContent=`${Q.partLabel(d,i)} · ${Q.sectionName(d,i)}`;});
      $('#lactose-free-tariff').textContent=d.format==='half'?'Un gusto + €1,50 · Tutta la pizza + €3,00':Q.count(d)===2?'Una metà + €3,00 · Tutto il metro + €6,00':'Un gusto + €3,00 · Due gusti + €4,50 · Tutta la pizza + €6,00';
      const diet=O.dietQuote(d,o),price=Q.quote(d).total;
      $('#diet-surcharge').hidden=!diet.supplement;
      $('#diet-surcharge').textContent=`Supplementi selezionati: + ${P.money(diet.supplement)}`+(price===null?'':` · Pizza con supplementi: ${P.money(price+diet.supplement)}`);
    }
    function sync(){
      const disabled=!isReady()||!O.canAddPizza(getDesign()),label=editingId?'Aggiorna nell’ordine':'Aggiungi all’ordine';
      $('#add-order').disabled=$('#mobile-add-order').disabled=disabled;$('#add-order').textContent=label;
      const base=Q.quote(getDesign()).total,diet=O.dietQuote(getDesign(),opts()).supplement;$('#mobile-add-order').replaceChildren(el('span','mobile-action-label',label),el('strong','mobile-action-price',base===null?'':P.money(base+diet)));$('#mobile-add-order').setAttribute('aria-label',label);
      $('#cancel-order-edit').hidden=!editingId;$('#editing-order-note').hidden=!editingId;
      syncDiet();syncNote();onDraftChange?.();
    }
    async function preparePDF(){
      const generation=++pdfGeneration,link=$('#order-pdf');link.download='pulcinella-order-'+root.PizzaI18n.language+'.pdf';link.removeAttribute('href');link.setAttribute('aria-disabled','true');link.textContent=order.lines.length?'Prepariamo il PDF…':'Scarica PDF';
      if(pdfURL){URL.revokeObjectURL(pdfURL);pdfURL=null;}if(!order.lines.length)return;
      try{const bytes=await root.PizzaOrderPDF.generate(O.normalize(order));if(generation!==pdfGeneration)return;pdfURL=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));link.href=pdfURL;link.removeAttribute('aria-disabled');link.textContent='Scarica PDF';}
      catch{if(generation===pdfGeneration){link.textContent='Riprova a creare il PDF';link.removeAttribute('aria-disabled');announce('Non è stato possibile preparare il PDF. Tocca per riprovare.');}}
    }
    function render(){
      const list=$('#order-lines'),focus=document.activeElement?.closest('[data-order-action]'),focusKey=focus?{action:focus.dataset.orderAction,id:focus.dataset.line}:null;
      list.replaceChildren();const total=O.totals(order);
      for(const id of ['order-count','mobile-order-count']){const counter=$('#'+id),changed=counter.textContent!==String(total.count);counter.textContent=String(total.count);if(changed&&!root.matchMedia('(prefers-reduced-motion: reduce)').matches)counter.animate?.([{transform:'scale(.8)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:180,easing:'ease-out'});}$('#order-empty').hidden=!!order.lines.length;
      $('#mobile-order-open').setAttribute('aria-label',`Consulta il tuo ordine, ${total.count} ${total.count===1?'articolo':'articoli'}`);
      $('#order-quantity').textContent=`${total.count} ${total.count===1?'articolo':'articoli'}`;
      $('#order-total-label').textContent=total.pending?'Totale voci con prezzo':'Totale ordine';$('#order-total').textContent=P.money(total.known);
      $('#order-pending').hidden=!total.pending;$('#order-pending').textContent=`${total.pending} ${total.pending===1?'articolo con prezzo':'articoli con prezzo'} da confermare`;
      $('#order-notes-field').hidden=!order.lines.length;if(document.activeElement!==$('#order-notes'))$('#order-notes').value=order.note;
      order.lines.forEach((line,index)=>{
        const item=O.describe(line),row=el('li','order-line');row.dataset.orderLine=line.id;
        const heading=el('div','order-line-heading'),title=el('h3','',item.title),price=el('strong','order-line-price',item.unit===null?'Da confermare':P.money(item.unit*line.quantity));heading.append(title,price);
        const desc=el('div','order-line-description');if(item.subtitle)desc.append(el('p','order-line-subtitle',item.subtitle));
        if(line.kind==='pizza'){
          if(line.design.format!=='round')desc.append(el('p','order-line-tastes',Q.sections(line.design).map((_,n)=>Q.partLabel(line.design,n)+' · '+Q.sectionName(line.design,n)).join('\n')));
          if(item.variations)desc.append(el('p','order-line-variations',item.variations));
          const details=el('details','order-line-ingredients');details.append(el('summary','',I.text('Ingredienti')),el('p','order-line-detail',item.detail));desc.append(details);
        }else desc.append(el('p','order-line-detail',item.detail));
        if(item.note){const p=el('p','order-line-note'),value=el('span','',item.note);value.setAttribute('data-no-translate','');p.append(el('strong','',I.text('Note pizza')+': '),value);desc.append(p);}
        const controls=el('div','order-line-controls'),amount=el('div','order-amount');
        const minus=button('−',`Riduci quantità di ${item.title}`,'minus',line.id),plus=button('+',`Aumenta quantità di ${item.title}`,'plus',line.id);plus.disabled=line.quantity>=O.MAX_QUANTITY;
        amount.append(minus,el('span','',String(line.quantity)),plus);controls.append(amount);
        if(item.unit!==null&&line.quantity>1)controls.append(el('small','order-unit-price',P.money(item.unit)+' ciascuno'));
        const actions=el('div','order-line-links');if(line.kind==='pizza')actions.append(button('Modifica',`Modifica ${item.title}, riga ${index+1}`,'edit',line.id));actions.append(button('Rimuovi',`Rimuovi ${item.title}, riga ${index+1}`,'remove',line.id));controls.append(actions);
        const content=el('div','order-line-content');content.append(heading,desc,controls);
        if(line.kind==='pizza'){row.classList.add('has-thumbnail');const thumb=el('div','pizza-thumb is-loading');thumb.setAttribute('aria-hidden','true');row.append(thumb);if($('#order-dialog').open)renderThumbnail(thumb,line.design);}
        row.append(content);list.append(row);
      });
      if(focusKey){const next=list.querySelector(`[data-order-action="${focusKey.action}"][data-line="${focusKey.id}"]`);if(next&&!next.disabled)next.focus({preventScroll:true});else if(focus?.isConnected===false)$('#order-new-pizza').focus({preventScroll:true});}
      if($('#order-dialog').open)preparePDF();else{++pdfGeneration;$('#order-pdf').removeAttribute('href');if(pdfURL){URL.revokeObjectURL(pdfURL);pdfURL=null;}}onDraftChange?.();
    }
    function setView(view){$('#order-dialog').dataset.mobileView=view;for(const b of document.querySelectorAll('[data-order-view]'))b.setAttribute('aria-pressed',String(b.dataset.orderView===view));$('#order-dialog').scrollTop=0;}
    function open(){if(!$('#order-dialog').open)$('#order-dialog').showModal();render();setView('basket');$('#order-dialog').scrollTop=0;}
    function renderCatalog(){
      const area=$('#order-catalog');area.replaceChildren();
      for(const b of $('#order-categories').children)b.setAttribute('aria-pressed',String(b.dataset.orderCategory===category));
      for(const product of O.catalog.filter(p=>p.category===category)){
        const card=el('article','order-product'),title=el('h3','',product.name);card.append(title,el('p','',product.description));
        const controls=el('div','order-product-controls');
        if(product.variants.length>1){const select=el('select');select.id='order-variant-'+product.id;select.setAttribute('aria-label',`Porzione di ${product.name}`);
          for(const v of product.variants){const option=el('option','',`${v.label} · ${P.money(v.price)}`);option.value=v.id;select.append(option);}select.value=variants.get(product.id)||product.variants[0].id;select.addEventListener('change',()=>variants.set(product.id,select.value));controls.append(select);
        }else controls.append(el('strong','order-product-price',P.money(product.variants[0].price)));
        const add=el('button','order-product-add','Aggiungi +');add.type='button';add.setAttribute('aria-label',`Aggiungi ${product.name}`);add.dataset.product=product.id;controls.append(add);card.append(controls);area.append(card);
      }
    }
    function apply(next,message){const before=JSON.stringify(order);order=O.normalize(next);if(JSON.stringify(order)===before){notify('Hai raggiunto il limite di quantità per questa voce.');return false;}persist();render();if(message)notify(message);return true;}
    function addPizza(){
      if(!isReady()||!O.canAddPizza(getDesign()))return;
      const value={design:getDesign(),options:opts(),note:note()},updated=!!editingId,next=editingId?O.updatePizza(order,editingId,value.design,value.options,value.note):O.addPizza(order,value.design,value.options,value.note);
      if((editingId&&JSON.stringify(next)===JSON.stringify(order))||apply(next)){editingId=null;beforeEdit=null;sync();if(onPizzaAdded)onPizzaAdded(value,{updated});else open();}
    }
    $('#add-order').addEventListener('click',addPizza);$('#mobile-add-order').addEventListener('click',addPizza);
    $('#order-open').addEventListener('click',open);$('#mobile-order-open').addEventListener('click',open);
    $('#order-menu-jump').addEventListener('click',()=>{setView('menu');$('#order-menu-title').focus({preventScroll:true});});
    for(const b of document.querySelectorAll('[data-order-view]'))b.addEventListener('click',()=>setView(b.dataset.orderView));
    $('#cancel-order-edit').addEventListener('click',()=>{const previous=beforeEdit;editingId=null;beforeEdit=null;setOpts();setNote();if(previous){setOpts(previous.options,previous.design);setNote(previous.note,previous.design);setDesign(previous.design);}sync();announce('Modifica annullata. La pizza nell’ordine resta uguale.');});
    function startNewPizza(){editingId=null;beforeEdit=null;for(const id of ['search','pizza-search']){const input=$('#'+id);input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));}root.dispatchEvent(new Event('pizza-new-composition'));const next=Q.chooseRecipe(Q.setFormat(getDesign(),'round'),'margherita');setOpts({},next);setNote('',next);setDesign(next);sync();if($('#order-dialog').open)$('#order-dialog').close();focusComposer('menu');announce('Componi la prossima pizza e aggiungila all’ordine.');}
    $('#order-new-pizza').addEventListener('click',startNewPizza);
    function restore(value,{panel='recipe'}={}){setOpts(value.options,value.design);setNote(value.note,value.design);setDesign(value.design);sync();focusComposer(panel);}
    $('#order-lines').addEventListener('click',e=>{
      const b=e.target.closest('[data-order-action]');if(!b)return;const entry=order.lines.find(l=>l.id===b.dataset.line);if(!entry)return;
      const action=b.dataset.orderAction;
      if(action==='edit'&&entry.kind==='pizza'){beforeEdit={design:getDesign(),options:opts(),note:note()};editingId=entry.id;setOpts(entry.options,entry.design);setNote(entry.note,entry.design);setDesign(entry.design);sync();$('#order-dialog').close();focusComposer('recipe');announce('Modifica la pizza, poi usa Aggiorna nell’ordine.');return;}
      apply(O.setQuantity(order,entry.id,action==='remove'?0:entry.quantity+(action==='plus'?1:-1)),action==='remove'?'Articolo rimosso dall’ordine.':'Quantità aggiornata.');
    });
    $('#order-catalog').addEventListener('click',e=>{const b=e.target.closest('[data-product]');if(!b)return;const p=O.byId[b.dataset.product],variantId=$('#order-variant-'+p.id)?.value||p.variants[0].id;apply(O.addExtra(order,p.id,variantId),p.name+' aggiunto all’ordine.');});
    $('#order-categories').addEventListener('click',e=>{const b=e.target.closest('[data-order-category]');if(b){category=b.dataset.orderCategory;renderCatalog();}});
    $('#order-notes').addEventListener('input',e=>{order.note=e.target.value.slice(0,600);persist();clearTimeout(pdfTimer);++pdfGeneration;$('#order-pdf').removeAttribute('href');$('#order-pdf').setAttribute('aria-disabled','true');$('#order-pdf').textContent='Prepariamo il PDF…';pdfTimer=setTimeout(preparePDF,250);});
    $('#pizza-note').addEventListener('input',e=>{noteDrafts.set(dietKey(getDesign()),e.target.value.slice(0,O.MAX_PIZZA_NOTE));syncNote();onDraftChange?.();});
    $('#order-pdf').addEventListener('click',e=>{if(!$('#order-pdf').getAttribute('href')){e.preventDefault();if($('#order-pdf').getAttribute('aria-disabled')!=='true')preparePDF();}});
    $('#pizza-options').addEventListener('change',e=>{
      const o=opts();
      if(e.target.id==='pizza-gluten-free')o.glutenFree=e.target.checked;
      else if(e.target.id==='pizza-lactose-free')o.lactoseFreeSections[0]=e.target.checked;
      else if(e.target.hasAttribute('data-lactose-taste'))o.lactoseFreeSections[Number(e.target.dataset.lactoseTaste)]=e.target.checked;
      else return;
      setOpts(o);sync();
    });
    window.addEventListener('pagehide',()=>{if(pdfURL)URL.revokeObjectURL(pdfURL);});
    function refreshLanguage(){renderCatalog();render();sync();$('#order-live').textContent='';}
    renderCatalog();render();sync();return{sync,refreshLanguage,open,startNewPizza,restore,options:opts,note,snapshot:()=>O.normalize(order)};
  }
  root.PizzaOrderUI={create};
})(window);
