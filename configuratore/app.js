(() => {
 'use strict';
 const root=document.querySelector('#studies'),frame=document.querySelector('#render-engine');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const icons={arrow:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 8 5 5 5-5"/></svg>',filter:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/><circle cx="9" cy="6" r="2" fill="white"/><circle cx="15" cy="12" r="2" fill="white"/></svg>',hand:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 13V6.5a1.25 1.25 0 0 1 2.5 0V11 5a1.25 1.25 0 0 1 2.5 0v6-4.5a1.25 1.25 0 0 1 2.5 0V12 9a1.25 1.25 0 0 1 2.5 0v5.5c0 3.6-2.1 6-5.4 6h-.7c-1.8 0-3.1-.8-4.2-2.2l-3.1-4.1a1.3 1.3 0 0 1 1.9-1.7L8 14.2"/></svg>',cart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h14l-2 9H7L4 3H1M9 21h.01M17 21h.01"/></svg>'};
 const copies={it:{add:'Aggiungi',single:'Singola',standard:'Standard',double:'Doppia',doubleLong:'Doppia porzione',upgrade:'Raddoppia',reduce:'Riduci',extras:'Aggiunte',pizzas:'Pizze',ingredients:'Ingredienti',tip:'Tieni premuta la manina e trascina gli ingredienti sulla pizza.',order:'Aggiungi all’ordine',language:'Scegli la lingua',filters:'Filtra le aggiunte',format:'Formato della pizza',basket:'Il tuo ordine',empty:'La lista è ancora vuota.',added:'Pizza aggiunta',round:'Tonda',half:'½ metro',meter:'1 metro',all:'Tutti'},en:{add:'Add',single:'Single',standard:'Standard',double:'Double',doubleLong:'Double portion',upgrade:'Double it',reduce:'Reduce',extras:'Extras',pizzas:'Pizzas',ingredients:'Ingredients',tip:'Hold the hand and drag ingredients onto the pizza.',order:'Add to order',language:'Choose language',filters:'Filter ingredients',format:'Pizza size',basket:'Your order',empty:'Your list is empty.',added:'Pizza added',round:'Round',half:'½ metre',meter:'1 metre',all:'All'},es:{add:'Añadir',single:'Simple',standard:'Estándar',double:'Doble',doubleLong:'Doble porción',upgrade:'Duplicar',reduce:'Reducir',extras:'Extras',pizzas:'Pizzas',ingredients:'Ingredientes',tip:'Mantén pulsada la mano y arrastra los ingredientes a la pizza.',order:'Añadir al pedido',language:'Elige el idioma',filters:'Filtrar ingredientes',format:'Tamaño de pizza',basket:'Tu pedido',empty:'La lista está vacía.',added:'Pizza añadida',round:'Redonda',half:'½ metro',meter:'1 metro',all:'Todos'}};
 copies.it.standardLong='Porzione standard';copies.en.standardLong='Standard portion';copies.es.standardLong='Porción estándar';
 Object.assign(copies.it,{update:'Aggiorna nell’ordine',cancelEdit:'Annulla modifica',editing:'Stai modificando una pizza del tuo ordine.',options:'Note e richieste',updated:'Pizza aggiornata'});
 Object.assign(copies.en,{update:'Update in order',cancelEdit:'Cancel editing',editing:'You are editing a pizza in your order.',options:'Notes and requests',updated:'Pizza updated'});
 Object.assign(copies.es,{update:'Actualizar en el pedido',cancelEdit:'Cancelar edición',editing:'Estás editando una pizza de tu pedido.',options:'Notas y peticiones',updated:'Pizza actualizada'});
 const languages={it:'Italiano',en:'English',fr:'Français',de:'Deutsch',es:'Español',pt:'Português',zh:'中文',sv:'Svenska',nl:'Nederlands',ru:'Русский'};
 // Reuse the site's translations; only the compact studio-specific strings are new.
 const extraKeys=['single','upgrade','reduce','tip','language','filters','empty','options','tomato','division'];
 const extraCopies={
  fr:['Simple','Doubler','Réduire','Maintenez la main et glissez les ingrédients sur la pizza.','Choisir la langue','Filtrer les ajouts','La liste est encore vide.','Notes et demandes','Sauce tomate','Division de la pizza au mètre'],
  de:['Einfach','Verdoppeln','Reduzieren','Hand gedrückt halten und Zutaten auf die Pizza ziehen.','Sprache wählen','Extras filtern','Die Liste ist noch leer.','Notizen und Wünsche','Tomatensauce','Aufteilung der Meterpizza'],
  pt:['Simples','Duplicar','Reduzir','Mantenha a mão premida e arraste os ingredientes para a pizza.','Escolher idioma','Filtrar extras','A lista ainda está vazia.','Notas e pedidos','Molho de tomate','Divisão da pizza ao metro'],
  zh:['单份','加倍','减少','按住小手，将配料拖到披萨上。','选择语言','筛选加料','清单还是空的。','备注与要求','番茄酱','米长披萨分区'],
  sv:['Enkel','Dubbla','Minska','Håll in handen och dra ingredienserna till pizzan.','Välj språk','Filtrera tillägg','Listan är fortfarande tom.','Anteckningar och önskemål','Tomatsås','Indelning av meterpizzan'],
  nl:['Enkel','Verdubbelen','Verminderen','Houd het handje ingedrukt en sleep ingrediënten naar de pizza.','Taal kiezen','Extra’s filteren','De lijst is nog leeg.','Notities en verzoeken','Tomatensaus','Verdeling van de meterpizza'],
  ru:['Одна','Удвоить','Уменьшить','Удерживайте значок руки и перетаскивайте ингредиенты на пиццу.','Выбрать язык','Фильтр добавок','Список пока пуст.','Примечания и пожелания','Томатный соус','Разделение метровой пиццы']
 };
 for(const [lang,values]of Object.entries(extraCopies))copies[lang]={...Object.fromEntries(Object.entries(copies.it).map(([key,value])=>[key,window.PizzaTranslations?.[value]?.[lang]||value])),...Object.fromEntries(extraKeys.map((key,i)=>[key,values[i]]))};
 const requestedLanguage=new URL(location.href).searchParams.get('lang');let initialLanguage=Object.hasOwn(languages,requestedLanguage)?requestedLanguage:null;
 if(!initialLanguage)try{const saved=localStorage.getItem('preferredLanguage');if(Object.hasOwn(languages,saved))initialLanguage=saved;}catch{}
 initialLanguage||='it';
 const specs=[{id:'banco',title:'Banco bianco',subtitle:'Cartone bianco · granito',caption:'',type:'action',scene:390}];
 const fallbackIngredients=[['tomato','Pomodoro','base'],['fior','Fior di latte','formaggi'],['mushroom','Funghi freschi','orto'],['salami','Salamino piccante','salumi'],['ham','Prosciutto cotto','salumi'],['cherry','Pomodorini','orto']].map(([id,name,category])=>({id,name,category}));
 let api=null,Q=null,ingredients=fallbackIngredients,menu=[],queue=Promise.resolve(),drag=null;
 const models=specs.map((spec,index)=>{
  const m={...spec,lang:initialLanguage,panel:'extras',filter:'all',format:'round',aspect:1,servings:{tomato:1,fior:1,olive:1},price:'5,50 €',name:'Margherita',optionDrafts:new Map(),noteDrafts:new Map(),version:0,expanded:false};
  const section=document.createElement('section');section.className=`study mode-${m.id}${index===0?' is-current':''}`;section.dataset.study=m.id;
  section.innerHTML=`<div class="study-heading"><div><div class="study-number">0${index+1}</div><h2>${m.title}</h2><p>${m.subtitle}</p></div></div><div class="phone-shell"><div class="screen box-awaiting">
   <div class="worktop-backdrop" aria-hidden="true"></div>
   <header class="bench-heading"><a class="bench-brand" href="../?lang=it" aria-label="Pulcinella, torna alla home"><img src="../componi/assets/logo.svg" width="1688" height="621" alt="Pizzeria Pulcinella"></a><button class="language" type="button" data-action="language" aria-label="Scegli la lingua"><span class="flag" aria-hidden="true"></span>${icons.arrow}</button></header>
   <div class="scene"><div class="pack"><img class="carton-tray" src="cartone-aperto-v2.svg" width="1000" height="1000" alt="" aria-hidden="true"><div class="box-rear"><svg class="box-lid" viewBox="0 0 1160 410" preserveAspectRatio="none" aria-hidden="true"><image href="cartone-bianco.svg" width="1160" height="1358"/></svg><div class="box-brand"><img src="../componi/assets/logo.svg" width="1688" height="621" alt="Pizzeria Pulcinella"></div></div><svg class="box-base" viewBox="0 410 1160 948" preserveAspectRatio="none" aria-hidden="true"><image href="cartone-bianco.svg" width="1160" height="1358"/></svg><img class="pizza" src="margherita.webp" width="1200" height="1200" alt="Margherita"><div class="box-cover" aria-hidden="true"><img src="../componi/assets/logo.svg" alt=""></div></div></div>
   <div class="pizza-context"><div class="pizza-description"><strong class="pizza-name">Margherita</strong><p class="pantry-tip">Tieni premuta la manina e trascina gli ingredienti sulla pizza.</p><div class="order-edit-state" hidden><span>Stai modificando una pizza del tuo ordine.</span><button type="button" data-action="cancel-order-edit">Annulla modifica</button></div></div><button class="format" type="button" data-action="format" aria-label="Cambia formato della pizza"><span class="format-line"><span data-format-label>Tonda</span>${icons.arrow}</span></button></div>
   <div class="flavor-strip" aria-label="Scegli il gusto da modificare" hidden></div>
   <section class="pantry" aria-label="Ingredienti"><div class="shelf" id="shelf-${index}" role="tabpanel" aria-labelledby="tab-${index}-extras" tabindex="0"></div></section>
   <nav class="work-tabs" aria-label="Componi la tua pizza"><div class="work-tab-buttons" role="tablist" aria-label="Componi la pizza"><button role="tab" type="button" data-panel="extras" aria-selected="true" aria-controls="shelf-${index}" id="tab-${index}-extras">Aggiunte</button><button role="tab" type="button" data-panel="pizzas" aria-selected="false" aria-controls="shelf-${index}" id="tab-${index}-pizzas">Pizze</button><button role="tab" type="button" data-panel="ingredients" aria-selected="false" aria-controls="shelf-${index}" id="tab-${index}-ingredients">Ingredienti</button></div><button class="filter-button" type="button" data-action="filter" aria-label="Categorie">${icons.filter}</button></nav>
   <div class="checkout"><button class="add-order" type="button" data-action="order" disabled><span>Aggiungi all’ordine</span><strong class="price">5,50 €</strong></button><button class="cart" type="button" data-action="basket" aria-label="Consulta ordine" aria-haspopup="dialog" disabled>${icons.cart}<span class="cart-count">0</span></button></div>
   <div class="studio-notice" role="status" aria-live="polite"></div><dialog class="studio-dialog" aria-labelledby="dialog-title-${index}"><button class="dialog-close" type="button" data-action="close" aria-label="Chiudi">×</button><h3 id="dialog-title-${index}"></h3><div class="dialog-body"></div></dialog>
  </div></div><p class="study-caption">${m.caption}</p>`;
  root.append(section);m.section=section;m.screen=section.querySelector('.screen');m.shelf=section.querySelector('.shelf');m.dialog=section.querySelector('dialog');m.scroll={};m.renderedPanel=m.panel;
  const entryLid=m.screen.querySelector('.box-cover');entryLid.classList.add('entry-lid');dressLid(entryLid);
  const drawer=document.createElement('section');drawer.className='ingredients-drawer';drawer.setAttribute('aria-label','Scelta e modifica della pizza');const pantry=m.screen.querySelector('.pantry'),navigation=m.screen.querySelector('.work-tabs'),context=m.screen.querySelector('.pizza-context'),flavors=m.screen.querySelector('.flavor-strip');m.screen.insertBefore(drawer,context);drawer.append(context,flavors,navigation,pantry);
  return m;
 });
 const t=(m,key)=>copies[m.lang][key]||key;
 const toolLabels={it:['Annulla','Riparti dalla Margherita','La tua pizza da vicino'],en:['Undo','Start again with Margherita','Your pizza up close'],fr:['Annuler','Repartir de la Margherita','Votre pizza de près'],de:['Rückgängig','Mit Margherita neu beginnen','Deine Pizza aus der Nähe'],es:['Deshacer','Volver a la Margherita','Tu pizza de cerca'],pt:['Desfazer','Recomeçar com Margherita','A sua pizza de perto'],zh:['撤销','重新制作玛格丽特','近距离查看披萨'],sv:['Ångra','Börja om med Margherita','Din pizza på nära håll'],nl:['Ongedaan maken','Opnieuw beginnen met Margherita','Je pizza van dichtbij'],ru:['Отменить','Начать с Маргариты','Ваша пицца крупным планом']};
 const toolIcons=['<path d="M9 5 4 10l5 5M4 10h9a6 6 0 0 1 0 12"/>','<path d="M4 10a8 8 0 1 1 1 9M4 4v6h6"/>','<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6M10 7v6"/>'];
 for(const m of models){m.history=[];const tools=document.createElement('div');tools.className='workspace-tools';tools.setAttribute('role','group');tools.setAttribute('aria-label','Comandi della pizza');tools.innerHTML=['undo','reset','zoom'].map((action,n)=>`<button type="button" data-action="${action}" disabled${action==='zoom'?' aria-haspopup="dialog"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${toolIcons[n]}</svg></button>`).join('');m.screen.querySelector('.scene').append(tools);}
 function syncTools(m){m.screen.querySelector('.workspace-tools').setAttribute('aria-label',phrase(m,'Componi la tua pizza'));const labels=toolLabels[m.lang]||toolLabels.it;for(const [index,action]of ['undo','reset','zoom'].entries()){const button=m.screen.querySelector(`[data-action="${action}"]`);button.title=labels[index];button.setAttribute('aria-label',labels[index]);button.disabled=!api||(action==='undo'&&!m.history.length)||(action==='zoom'&&!m.previewReady);}}
 function rememberChange(m){if(!Q||!m.design)return;m.history.push(Q.normalize(m.design));if(m.history.length>50)m.history.shift();}
 function restoreDesign(m,design){m.design=Q.normalize(design);syncDesign(m);renderShelf(m);copy(m);measure(m);requestPreview(m);}
 const label=(m,item)=>{if(item.id==='tomato')return{it:'Salsa di pomodoro',en:'Tomato sauce',es:'Salsa de tomate'}[m.lang]||t(m,'tomato');try{return frame.contentWindow.PizzaI18n.catalog[item.originalName||item.name]?.[m.lang]||item.name;}catch{return item.name;}};
 const image=id=>'../componi/assets/'+window.PULCINELLA_INGREDIENT_ICONS[id];
 const translated=(m,name)=>frame.contentWindow.PizzaI18n?.catalog?.[name]?.[m.lang]||name;
 const phrase=(m,text,params={})=>(window.PizzaTranslations?.[text]?.[m.lang]||text).replace(/\{(\w+)\}/g,(_,key)=>params[key]??'');
 const draftKey=design=>design.format==='meter'?'meter-'+Q.count(design):design.format;
 function composition(m){const key=draftKey(m.design);return{design:Q.normalize(m.design),options:m.optionDrafts.get(key)||{},note:m.noteDrafts.get(key)||''};}
 function rememberDraft(m,value){const key=draftKey(value.design);m.optionDrafts.set(key,value.options);m.noteDrafts.set(key,value.note||'');}
 let orderVisible=false,orderFocus=null;
 function orderSurface(m,visible,restoreFocus=true){
  if(orderVisible===visible)return;orderVisible=visible;m.cancelSheet?.();
  if(visible){m.packingCancel?.();orderFocus=document.activeElement;root.inert=true;frame.classList.add('order-overlay');frame.inert=false;frame.removeAttribute('aria-hidden');frame.tabIndex=0;frame.title=t(m,'basket');}
  else{frame.classList.remove('order-overlay');frame.inert=true;frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;root.inert=false;if(restoreFocus)(orderFocus?.isConnected?orderFocus:m.screen.querySelector('.cart')).focus({preventScroll:true});}
 }
 function syncOrder(m){
  syncTools(m);
  const controller=api?.order,wasEditing=!!m.editingId;m.editingId=controller?.editing()||null;
  m.screen.querySelector('.cart').disabled=!controller;
  if(controller){const totals=controller.totals();m.screen.querySelector('.cart-count').textContent=totals.count;m.screen.querySelector('.cart').setAttribute('aria-label',t(m,'basket')+', '+totals.count);}
  m.screen.querySelector('.add-order>span').textContent=t(m,m.editingId?'update':'order');
  const state=m.screen.querySelector('.order-edit-state');state.hidden=!m.editingId;state.querySelector('span').textContent=t(m,'editing');state.querySelector('button').textContent=t(m,'cancelEdit');
  if(wasEditing!==!!m.editingId)measure(m);
 }
 function pizzaView(format){const g=Q.geometry(format);return format==='round'?{left:0,top:0,right:1,bottom:1,width:1,height:1,aspect:1}:{...g,left:g.left-1,top:g.top-1,right:g.right+1,bottom:g.bottom+1,aspect:(g.right-g.left+2)/(g.bottom-g.top+2)};}
 function pizzaHit(m,x,y){const r=m.screen.querySelector('.pizza').getBoundingClientRect(),v=pizzaView(m.format);return Q.hit(m.design,(v.left+(x-r.left)/r.width*(v.right-v.left))/v.width,(v.top+(y-r.top)/r.height*(v.bottom-v.top))/v.height);}
 function syncDesign(m){if(!Q||!m.design)return;m.servings=Q.current(m.design);m.format=m.design.format;m.aspect=pizzaView(m.format).aspect;m.screen.dataset.format=m.format;}
 function renderFlavors(m){
  const strip=m.screen.querySelector('.flavor-strip');strip.hidden=m.format==='round'||!m.design;
  if(strip.hidden){strip.replaceChildren();return;}
  const parts=Q.sections(m.design);strip.style.setProperty('--flavors',parts.length);
  strip.innerHTML=parts.map((part,n)=>{const name=translated(m,Q.sectionName(m.design,n));return`<button type="button" data-part="${n}" aria-pressed="${n===m.design.active}" aria-label="${Q.partLabel(m.design,n)}: ${esc(name)}"><span class="part-index">${n+1}</span><span>${esc(name)}</span></button>`;}).join('');
 }
 function selectPart(m,n){if(!Q||!m.design||n===m.design.active)return;m.design=Q.select(m.design,n);syncDesign(m);renderShelf(m);copy(m);requestPreview(m);}
 function portion(m,id,n){
  const name=esc(label(m,ingredients.find(item=>item.id===id)||{name:id}));
  const state=n?t(m,n===1?'single':'double').toLowerCase():'0';
  return`<div class="portion"><div class="portion-step" role="group" aria-label="${name}, ${state}"><button class="portion-minus" type="button" data-action="minus" data-id="${id}" aria-label="${t(m,'reduce')} ${name}" ${n===0?'disabled':''}>−</button><span class="portion-label">${state}</span><button class="portion-plus" type="button" data-action="plus" data-id="${id}" aria-label="${t(m,'add')} ${name}" ${n===2?'disabled':''}>+</button></div></div>`;
 }
 function renderShelf(m){
  m.scroll[m.renderedPanel]=m.shelf.scrollTop;
  const focus=document.activeElement?.closest('[data-action][data-id]');
  const focusId=focus&&m.shelf.contains(focus)?focus.dataset.id:null;
  m.shelf.className=m.panel==='extras'?'shelf':m.panel==='pizzas'?'choose-list pizza-grid':'choose-list recipe-list';
  m.screen.querySelector('.pantry').dataset.view=m.panel;
  if(m.panel==='extras'){
   m.shelf.innerHTML=ingredients.filter(item=>m.filter==='all'||item.category===m.filter).map(item=>{const n=m.servings[item.id]||0;return`<article class="ingredient${n?' selected':''}" data-ingredient="${item.id}"><img class="ingredient-image" src="${image(item.id)}" alt="" loading="lazy" draggable="false"><strong class="ingredient-title">${esc(label(m,item))}</strong><button class="hand" type="button" data-hand="${item.id}" aria-label="Trascina ${esc(label(m,item))}" ${n===2?'disabled':''}>${icons.hand}</button>${portion(m,item.id,n)}</article>`;}).join('');
  }else if(m.panel==='pizzas'){
   const choices=menu.length?[{id:'empty',name:'Solo impasto',servings:{}},...menu]:[];
   m.shelf.innerHTML=choices.map((item,index)=>{const file=frame.contentWindow.PULCINELLA_RECIPE_PREVIEWS?.[item.id],resolved=frame.contentWindow.PULCINELLA_ASSET_FILES?.[file]||file,selected=ingredients.every(i=>(m.servings[i.id]||0)===(item.servings[i.id]||0));return`<button class="recipe-choice" data-recipe="${item.id}" aria-pressed="${selected}"><small class="recipe-number" aria-hidden="true">${index?String(index).padStart(2,'0'):'+'}</small>${file?`<img src="../componi/assets/${resolved}" alt="" loading="lazy" decoding="async" width="240" height="240">`:''}<strong>${esc(label(m,item))}</strong><span class="recipe-card-price">${item.price!==undefined?new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(item.price/100):t(m,'ingredients')}</span></button>`;}).join('')||`<p class="empty-note">Prepariamo le anteprime…</p>`;
  }else{
   m.shelf.innerHTML=ingredients.filter(item=>m.servings[item.id]).map(item=>{const n=m.servings[item.id],name=esc(label(m,item));return`<div class="recipe-line"><div class="recipe-ingredient-name"><strong>${name}</strong><small>${t(m,n===2?'doubleLong':'standardLong')}</small></div><div class="recipe-quantity"><button class="recipe-minus" type="button" data-action="minus" data-id="${item.id}" aria-label="${t(m,'reduce')} ${name}">−</button><span class="recipe-quantity-value">${t(m,n===1?'single':'double').toLowerCase()}</span><button class="recipe-plus" type="button" data-action="plus" data-id="${item.id}" aria-label="${t(m,'add')} ${name}" ${n===2?'disabled':''}>+</button></div></div>`;}).join('')||`<p class="empty-note">Si parte dall’impasto.</p>`;
   m.shelf.insertAdjacentHTML('beforeend',`<button class="recipe-options" type="button" data-action="pizza-options">${t(m,'options')} <span aria-hidden="true">↗</span></button>`);
   m.shelf.insertAdjacentHTML('beforeend',`<button class="recipe-options" type="button" data-action="share-pizza" aria-haspopup="dialog">${phrase(m,'Condividi la pizza')} <span aria-hidden="true">↗</span></button>`);
   m.shelf.insertAdjacentHTML('beforeend',`<button class="recipe-options" type="button" data-action="download-pizza" aria-haspopup="dialog">${phrase(m,'Scarica immagine')} <span aria-hidden="true">↓</span></button>`);
  }
  m.shelf.scrollTop=m.scroll[m.panel]||0;m.renderedPanel=m.panel;
  m.shelf.setAttribute('aria-labelledby',m.screen.querySelector(`[data-panel="${m.panel}"]`).id);
  if(focusId){const next=m.shelf.querySelector(`[data-id="${focusId}"][data-action="${focus.dataset.action}"]:not(:disabled)`)||m.shelf.querySelector(`[data-id="${focusId}"]:not(:disabled)`);if(next)next.focus({preventScroll:true});else m.shelf.focus({preventScroll:true});}
 }
 function copy(m){
  m.screen.querySelectorAll('[data-panel]').forEach(button=>{button.textContent=t(m,button.dataset.panel);button.setAttribute('aria-selected',String(button.dataset.panel===m.panel));button.tabIndex=button.dataset.panel===m.panel?0:-1;});
  m.screen.querySelector('.pantry-tip').textContent=m.warning||t(m,'tip');m.screen.querySelector('.add-order>span').textContent=t(m,'order');m.screen.querySelector('[data-format-label]').textContent=m.format==='round'?t(m,'round'):(m.format==='half'?'0,5 m':'1 m')+' · '+phrase(m,'{n} gusti',{n:Q&&m.design?Q.count(m.design):2});const flag=m.screen.querySelector('.flag');flag.classList.add('language-flag');flag.dataset.lang=m.lang;flag.dataset.language=m.lang;m.screen.querySelector('.language').setAttribute('aria-label',t(m,'language'));document.documentElement.lang=m.lang;m.screen.querySelector('.bench-brand').href='../?lang='+m.lang;
  const filter=m.screen.querySelector('.filter-button');filter.dataset.filtered=String(m.filter!=='all');filter.setAttribute('aria-label',t(m,'filters')+(m.filter!=='all'?' · '+(api?.categories?.[m.filter]||m.filter):''));
  renderFlavors(m);
  syncOrder(m);
 }
 function requestPreview(m){
  const version=++m.version,snapshot=m.design&&Q?Q.normalize(m.design):null;
  m.previewReady=false;syncTools(m);
  m.screen.querySelector('.add-order').disabled=true;
  if(!api)return;
  queue=queue.catch(()=>{}).then(async()=>{
   if(version!==m.version)return;
   try{const result=await api.previewDesign(snapshot,{carton:true});if(version!==m.version)return;const photo=m.screen.querySelector('.pizza');photo.src=result.url;photo.alt=result.title;await photo.decode().catch(()=>{});if(version!==m.version)return;m.previewReady=true;m.name=result.name;m.title=result.title;m.parts=result.parts;m.price=result.total===null?translated(m,'Da confermare'):frame.contentWindow.Pulcinella.money(result.total+(api.order?.quote(snapshot,composition(m).options)||0));m.aspect=result.aspect;m.warning=result.valid?'':result.message;m.screen.querySelector('.pizza-name').textContent=translated(m,result.name);m.screen.querySelector('.format').setAttribute('aria-label',translated(m,result.name)+' · '+t(m,'format'));m.screen.querySelector('.price').textContent=result.total===null?'':m.price;m.screen.querySelector('.price').hidden=result.total===null;m.screen.querySelector('.add-order').disabled=!result.valid;copy(m);measure(m);openCarton(m);}
   catch{notice(m,'Anteprima non disponibile.');}
  });
 }
 function change(m,id,n,manual=false){n=Math.max(0,Math.min(2,n));const before=m.servings[id]||0;if(n===before)return;rememberChange(m);const source=m.shelf.querySelector(`[data-ingredient="${id}"] .ingredient-image`);if(n>before&&!manual&&source)flyIngredient(m,id,source.getBoundingClientRect());const next={...m.servings};if(n)next[id]=n;else delete next[id];if(Q&&m.design){m.design=Q.update(m.design,next);syncDesign(m);}else m.servings=next;renderShelf(m);copy(m);requestPreview(m);}
 function notice(m,text){const box=m.screen.querySelector('.studio-notice');clearTimeout(m.noticeTimer);box.textContent=text;box.classList.add('visible');m.noticeTimer=setTimeout(()=>box.classList.remove('visible'),2200);}
 function dialog(m,title,body){m.dialog.querySelector('h3').textContent=title;m.dialog.querySelector('.dialog-body').innerHTML=body;m.dialog.showModal();}
 function measure(m){
  if(!m.screen.clientWidth)return;
  const w=m.screen.clientWidth,h=m.screen.clientHeight,lid=0;
  m.screen.classList.toggle('compact',h<650);
  const fixed=['.bench-heading','.checkout','.pizza-context','.work-tabs','.flavor-strip'].reduce((sum,selector)=>sum+m.screen.querySelector(selector).getBoundingClientRect().height,0);
  const available=Math.max(90,w-66),maxScene=Math.max(156,h-fixed-(h<650?146:180));
  const scene=Math.min(maxScene,Math.max(156,available/m.aspect+8));
  const pack=Math.min(available,Math.max(90,(scene-8)*m.aspect));
  m.collapsedScene=scene;m.expandedScene=14;m.screen.style.setProperty('--worktop-height',(scene+18)+'px');
  if(!m.gesture)m.screen.style.setProperty('--scene-height',(m.expanded?m.expandedScene:scene)+'px');m.screen.style.setProperty('--pack-width',pack+'px');m.screen.style.setProperty('--pack-height',pack/m.aspect+'px');m.screen.style.setProperty('--lid-height',lid+'px');
  const topWidth=Math.min(pack*.58,Math.max(178,pack*.46)),bottomWidth=topWidth*.935,tl=(pack-topWidth)/2,bl=(pack-bottomWidth)/2,top=56*.25,bottom=56*.85,g=topWidth/bottomWidth-1;
  m.screen.querySelector('.box-brand img').style.transform=`matrix3d(${topWidth/1688},0,0,0,${(bl*(g+1)-tl)/621},${(bottom*(g+1)-top)/621},0,${g/621},0,0,1,0,${tl},${top},0,1)`;
 }
 function dressLid(cover){
  cover.innerHTML='<div class="cover-face cover-front"><img src="../componi/assets/logo.svg" alt=""></div><div class="cover-face cover-inside"><img src="../componi/assets/logo.svg" alt=""></div>';
 }
 function finishOpening(m){
  clearTimeout(m.entryFallback);m.entryAnimations?.forEach(animation=>animation.cancel());m.entryAnimations=null;
  m.screen.classList.remove('box-awaiting','box-opening');
 }
 function openCarton(m){
  if(m.opened)return;m.opened=true;clearTimeout(m.entryFallback);
  if(reduced.matches||document.hidden){finishOpening(m);return;}
  const lid=m.screen.querySelector('.entry-lid'),pack=m.screen.querySelector('.pack');
  const out=getComputedStyle(document.documentElement).getPropertyValue('--ease').trim();
  const move=getComputedStyle(document.documentElement).getPropertyValue('--ease-move').trim();
  m.screen.classList.remove('box-awaiting');m.screen.classList.add('box-opening');
  // The same hinged lid as the packing feedback, reversed; the final workspace stays lidless.
  const animations=[
   lid.animate([{transform:'perspective(6000px) rotateX(0deg)',opacity:1,offset:0},{transform:'perspective(6000px) rotateX(94deg)',opacity:1,offset:.84},{transform:'perspective(6000px) rotateX(108deg)',opacity:0,offset:1}],{duration:500,easing:move,fill:'forwards'}),
   pack.animate([{transform:'translateY(3px) scale(.985)'},{transform:'translateY(0) scale(1)'}],{duration:500,easing:out})
  ];
  m.entryAnimations=animations;
  Promise.allSettled(animations.map(animation=>animation.finished)).then(()=>{if(m.entryAnimations===animations)finishOpening(m);});
 }
 function setWorkspaceExpanded(m,expanded,animate=true){
  clearTimeout(m.sheetTimer);m.expanded=expanded;m.screen.classList.toggle('is-expanded',expanded);m.screen.classList.remove('sheet-dragging');m.screen.classList.toggle('sheet-settling',animate&&!reduced.matches);m.screen.style.setProperty('--scene-height',(expanded?m.expandedScene:m.collapsedScene)+'px');m.sheetTimer=setTimeout(()=>m.screen.classList.remove('sheet-settling'),260);
 }
 function flyIngredient(m,id,source){
  if(reduced.matches||source.width===0||source.top<m.screen.querySelector('.shelf,.choose-list').getBoundingClientRect().top-10)return;
  const pizza=m.screen.querySelector('.pizza').getBoundingClientRect(),img=new Image();
  const region=m.format!=='round'&&Q&&m.design?Q.zones(m.design)[m.design.active]:null,v=pizzaView(m.format),targetX=region?((region.left+region.right)/2-v.left)/(v.right-v.left):.5;
  img.src=image(id);img.alt='';img.className='ingredient-flight';img.style.cssText=`left:${source.left}px;top:${source.top}px;width:${source.width}px;height:${source.height}px`;
  document.body.append(img);
  const animation=img.animate([{transform:'translate(0,0) scale(1)',opacity:.95},{transform:`translate(${pizza.left+pizza.width*targetX-source.left-source.width*.5}px,${pizza.top+pizza.height*.5-source.top-source.height*.5}px) scale(.55)`,opacity:0}],{duration:280,easing:'cubic-bezier(.23,1,.32,1)'});
  animation.finished.catch(()=>{}).finally(()=>img.remove());
 }
 async function sendCarton(m){
  // Additional taps still add to the list, without restarting a carton mid-flight.
  m.opened=true;finishOpening(m);
  if(reduced.matches||m.packing)return;m.packing=true;
  if(m.expanded){setWorkspaceExpanded(m,false,false);await new Promise(resolve=>requestAnimationFrame(resolve));}
  if(!m.packing||reduced.matches){m.packing=false;return;}
  const pack=m.screen.querySelector('.pack'),source=pack.getBoundingClientRect(),lid=56,r={left:source.left,top:source.top-lid,width:source.width,height:source.height+lid},target=m.screen.querySelector('.cart').getBoundingClientRect(),flight=document.createElement('div');
  const move=getComputedStyle(document.documentElement).getPropertyValue('--ease-move').trim(),out=getComputedStyle(document.documentElement).getPropertyValue('--ease').trim();
  const dx=target.left+target.width*.5-r.left-r.width*.5,dy=target.top+target.height*.5-r.top-r.height*.5;
  flight.className='banco-flight';flight.setAttribute('aria-hidden','true');flight.inert=true;
  flight.style.cssText=`left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;--lid-height:${lid}px`;
  const snapshot=pack.cloneNode(true);snapshot.classList.remove('is-packing-source');flight.append(snapshot);
  const shadow=document.createElement('div');shadow.className='packing-shadow';flight.prepend(shadow);
  for(const side of ['left','right']){const flap=document.createElement('div');flap.className='packing-flap '+side;snapshot.append(flap);}
  const cover=flight.querySelector('.box-cover'),rear=flight.querySelector('.box-rear');cover.classList.add('packing-lid');
   dressLid(cover);
  document.body.append(flight);m.flight=flight;pack.classList.add('is-packing-source');
  const animations=[];
  const packingDuration=1500,time=ms=>Math.round(ms*packingDuration/2250);
  const play=(node,frames,options)=>{const animation=node.animate(frames,{fill:'forwards',...options,duration:time(options.duration),delay:time(options.delay||0)});animation.finished.catch(()=>{});animations.push(animation);return animation;};
  play(rear,[{opacity:1},{opacity:0}],{duration:180,easing:out});
  for(const flap of flight.querySelectorAll('.packing-flap'))play(flap,[{transform:`perspective(700px) rotateY(${flap.classList.contains('left')?-68:68}deg)`,opacity:0},{transform:'perspective(700px) rotateY(0deg)',opacity:1}],{duration:350,easing:out});
  play(cover,[{transform:'perspective(6000px) rotateX(102deg)',opacity:0,offset:0},{transform:'perspective(6000px) rotateX(101deg)',opacity:1,offset:.08},{transform:'perspective(6000px) rotateX(0deg)',opacity:1,offset:1}],{duration:950,delay:80,easing:move});
  play(shadow,[{transform:'translateY(0) scale(1)',opacity:.18},{transform:'translateY(10px) scale(.9)',opacity:.08}],{duration:300,delay:1000,easing:out});
  flight.dataset.phase='closing';
  const phases=[setTimeout(()=>{if(flight.isConnected)flight.dataset.phase='sealed';},time(1030)),setTimeout(()=>{
   if(!flight.isConnected)return;flight.dataset.phase='travelling';pack.classList.remove('is-packing-source');if(!reduced.matches)pack.animate([{opacity:0},{opacity:1}],{duration:250,easing:out});
  },time(1395))];
  m.packingCancel=()=>{phases.forEach(clearTimeout);animations.forEach(animation=>animation.cancel());flight.remove();pack.classList.remove('is-packing-source');m.flight=null;m.packing=false;};
  try{
   const travel=play(flight,[
    {transform:'translate(0,0) rotate(0deg) scale(1)',opacity:1,offset:0},
    {transform:'translate(0,0) rotate(0deg) scale(1)',opacity:1,offset:.46,easing:out},
    {transform:'translate(0,-12px) rotate(-2deg) scale(.97)',opacity:1,offset:.55},
    {transform:'translate(0,-12px) rotate(-2deg) scale(.97)',opacity:1,offset:.62,easing:move},
    {transform:`translate(${dx*.4}px,${dy*.25-24}px) rotate(4deg) scale(.65)`,opacity:1,offset:.79,easing:move},
    {transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(.08)`,opacity:.85,offset:.97},
    {transform:`translate(${dx}px,${dy}px) rotate(0deg) scale(.08)`,opacity:0,offset:1}
   ],{duration:2250,easing:'linear'});
   await travel.finished;if(!flight.isConnected)return;
   m.screen.querySelector('.cart').animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:220,easing:out});
  }catch{ /* Navigation and resize may end the visual feedback early. */ }
  finally{if(m.flight===flight){m.packingCancel?.();m.packingCancel=null;}}
 }
 for(const m of models){
  m.screen.addEventListener('pointerdown',()=>{m.suppressTabs=0;if(m.screen.matches('.box-awaiting,.box-opening')){m.opened=true;finishOpening(m);}},{capture:true,passive:true});
  m.screen.addEventListener('click',event=>{
   const button=event.target.closest('button');
   if(!button&&event.target.closest('.scene .pack')&&Q&&m.design&&m.format!=='round'){const part=pizzaHit(m,event.clientX,event.clientY);if(part!==null)selectPart(m,part);return;}
   if(!button||button.disabled)return;
   if(button.dataset.part!==undefined){selectPart(m,Number(button.dataset.part));return;}
   if(button.dataset.panel){if(event.detail>0&&performance.now()<(m.suppressTabs||0))return;m.panel=button.dataset.panel;copy(m);renderShelf(m);return;}
   if(button.dataset.recipe){const recipe=button.dataset.recipe==='empty'?{servings:{}}:menu.find(item=>item.id===button.dataset.recipe);if(recipe&&Q&&m.design){rememberChange(m);m.design=button.dataset.recipe==='empty'?Q.update(m.design,{}, {recipeId:null}):Q.chooseRecipe(m.design,recipe.id);syncDesign(m);renderShelf(m);copy(m);requestPreview(m);}return;}
   const id=button.dataset.id,n=m.servings[id]||0;
   switch(button.dataset.action){
    case'undo':if(m.history.length){restoreDesign(m,m.history.pop());notice(m,phrase(m,'Ultima modifica annullata.'));}break;
    case'reset':rememberChange(m);restoreDesign(m,Q.chooseRecipe(m.design,'margherita'));break;
    case'zoom':orderSurface(m,true);api.order.zoom(composition(m)).catch(()=>{orderSurface(m,false);notice(m,translated(m,'Anteprima non disponibile.'));});break;
    case'plus':change(m,id,n+1);break;case'minus':change(m,id,n-1);break;case'clear':change(m,id,0);break;case'standard':change(m,id,1);break;case'double':change(m,id,2);break;
    case'filter':dialog(m,t(m,'filters'),`<div class="filter-choices">${Object.entries(api?.categories||{all:'Tutti',orto:'Verdure',salumi:'Salumi',formaggi:'Formaggi'}).map(([id,name])=>`<button data-filter="${id}" aria-pressed="${m.filter===id}">${esc(name)}</button>`).join('')}</div>`);break;
    case'language':dialog(m,t(m,'language'),'<div class="language-choices">'+Object.entries(languages).map(([code,name])=>`<button type="button" data-lang="${code}"><span class="flag language-flag" data-language="${code}" aria-hidden="true"></span>${name}</button>`).join('')+'</div>');break;
    case'format':if(Q&&m.design)dialog(m,t(m,'format'),`<div class="format-choices">${['round','half','meter'].map(id=>`<button data-format="${id}" aria-pressed="${m.format===id}"><strong>${t(m,id)}</strong><small>${id==='round'?'':id==='half'?'50 × 35 cm · '+phrase(m,'{n} gusti',{n:2}):'100 × 35 cm'}</small></button>`).join('')}</div><div class="meter-division"><p>${(copies[m.lang].division||{it:'Suddivisione del metro',en:'Metre pizza sections',es:'División del metro'}[m.lang])}</p><div class="filter-choices">${[2,3].map(n=>`<button data-meter-parts="${n}" aria-pressed="${m.design.meterParts===n}">${phrase(m,n===2?'Metà e metà':'Tre gusti')}</button>`).join('')}</div></div>`);break;
    case'order':{const saved=api.order.save(composition(m));if(saved){syncOrder(m);notice(m,t(m,saved.updated?'updated':'added')+' · '+(m.title||m.name));sendCarton(m);}else notice(m,translated(m,'Hai raggiunto il limite di quantità per questa voce.'));break;}
    case'basket':orderSurface(m,true);api.order.open(composition(m));break;
    case'cancel-order-edit':api.order.cancel();break;
    case'pizza-options':orderSurface(m,true);api.order.options(composition(m));break;
    case'share-pizza':if(m.warning){notice(m,translated(m,m.warning));break;}orderSurface(m,true);api.order.share(composition(m));break;
    case'download-pizza':if(m.warning){notice(m,translated(m,m.warning));break;}orderSurface(m,true);api.order.download(composition(m));break;
    case'close':m.dialog.close();break;
   }
   if(button.dataset.filter){m.filter=button.dataset.filter;m.panel='extras';copy(m);renderShelf(m);m.dialog.close();}
    if(button.dataset.lang){m.lang=button.dataset.lang;const url=new URL(location.href);url.searchParams.set('lang',m.lang);history.replaceState(null,'',url);api.order.setLanguage(m.lang);copy(m);renderShelf(m);requestPreview(m);m.dialog.close();}
   if(button.dataset.format){if(m.format!==button.dataset.format)rememberChange(m);m.design=Q.setFormat(m.design,button.dataset.format);syncDesign(m);copy(m);renderShelf(m);measure(m);requestPreview(m);m.dialog.close();}
   if(button.dataset.meterParts){rememberChange(m);m.design=Q.setMeterParts(Q.setFormat(m.design,'meter'),Number(button.dataset.meterParts));syncDesign(m);copy(m);renderShelf(m);measure(m);requestPreview(m);m.dialog.close();}
  });
  const tabs=m.screen.querySelector('.work-tabs');
  function endSheet(event,cancelled=false){
   const g=m.gesture;if(!g||(event&&g.id!==event.pointerId))return;m.gesture=null;
   if(g.dragging){
    m.suppressTabs=performance.now()+350;
    const current=m.screen.querySelector('.scene').getBoundingClientRect().height,velocity=performance.now()-g.lastTime<90?g.velocity:0,distance=current-g.start;
    setWorkspaceExpanded(m,cancelled?g.expanded:velocity<-.35?true:velocity>.35?false:Math.abs(distance)>=32?distance<0:current<(m.expandedScene+m.collapsedScene)/2);
   }
   if(g.capture.hasPointerCapture(g.id))g.capture.releasePointerCapture(g.id);
  }
  m.cancelSheet=()=>endSheet(null,true);
  for(const handle of [tabs,m.screen.querySelector('.pizza-context')]){
   handle.addEventListener('contextmenu',event=>{if(!event.target.closest('button:not([role=tab])'))event.preventDefault();});
   handle.addEventListener('pointerdown',event=>{
    if(event.target.closest('button:not([role=tab])')||event.button!==0||event.isPrimary===false||m.gesture)return;
    clearTimeout(m.sheetTimer);m.screen.classList.remove('sheet-settling');
    // Capture on contact, before a fast first movement can leave a small label.
    // Keep tab buttons as the capture target so an ordinary tap still selects its tab.
    const capture=event.target.closest('button')||handle;
    m.gesture={id:event.pointerId,x:event.clientX,y:event.clientY,lastY:event.clientY,lastTime:performance.now(),velocity:0,start:m.screen.querySelector('.scene').getBoundingClientRect().height,expanded:m.expanded,capture,dragging:false};
    capture.setPointerCapture(event.pointerId);
   });
  }
  document.addEventListener('pointermove',event=>{
   const g=m.gesture;if(!g||g.id!==event.pointerId)return;const dy=event.clientY-g.y,now=performance.now();
   if(!g.dragging){if(Math.abs(event.clientX-g.x)>Math.abs(dy)+8){endSheet(event,true);return;}if(Math.abs(dy)<8)return;g.dragging=true;m.screen.classList.add('sheet-dragging');}
   g.velocity=(event.clientY-g.lastY)/Math.max(1,now-g.lastTime);g.lastY=event.clientY;g.lastTime=now;
   m.screen.style.setProperty('--scene-height',Math.max(m.expandedScene,Math.min(m.collapsedScene,g.start+dy))+'px');event.preventDefault();
  },{passive:false});
  document.addEventListener('pointerup',event=>endSheet(event));
  document.addEventListener('pointercancel',event=>endSheet(event,true));
  m.screen.addEventListener('lostpointercapture',event=>endSheet(event,true));
  tabs.addEventListener('keydown',event=>{
   const options=[...tabs.querySelectorAll('[role=tab]')],index=options.indexOf(document.activeElement);if(index<0)return;
   if(['ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();setWorkspaceExpanded(m,event.key==='ArrowUp');return;}
   const next=event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:-1;
   if(next<0)return;event.preventDefault();options[next].click();options[next].focus();
  });
  m.screen.addEventListener('pointerdown',event=>{
   const hand=event.target.closest('[data-hand]');if(!hand||hand.disabled||event.button!==0)return;
   drag={m,id:hand.dataset.hand,hand,pointer:event.pointerId,x:event.clientX,y:event.clientY,moved:false};hand.setPointerCapture(event.pointerId);hand.classList.add('is-grabbed');
  });
   renderShelf(m);copy(m);measure(m);m.entryFallback=setTimeout(()=>openCarton(m),1600);if(reduced.matches)openCarton(m);
 }
 document.addEventListener('pointermove',event=>{
  if(!drag||drag.pointer!==event.pointerId)return;
  if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>7){drag.moved=true;if(drag.m.expanded)setWorkspaceExpanded(drag.m,false,false);drag.m.screen.querySelector('.scene').classList.add('is-drop-target');const img=new Image();img.src=image(drag.id);img.className='drag-copy';img.alt='';document.body.append(img);drag.ghost=img;}
  if(drag.ghost){drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';event.preventDefault();}
 },{passive:false});
 function endDrag(event,cancel=false){if(!drag||event.pointerId!==drag.pointer)return;const d=drag;drag=null;d.hand.classList.remove('is-grabbed');d.m.screen.querySelector('.scene').classList.remove('is-drop-target');d.ghost?.remove();if(d.hand.hasPointerCapture(d.pointer))d.hand.releasePointerCapture(d.pointer);if(d.moved&&!cancel&&Q){const part=pizzaHit(d.m,event.clientX,event.clientY);if(part!==null){d.m.design=Q.select(d.m.design,part);syncDesign(d.m);change(d.m,d.id,(d.m.servings[d.id]||0)+1,true);}}}
 document.addEventListener('pointerup',event=>endDrag(event));document.addEventListener('pointercancel',event=>endDrag(event,true));
 function choose(id){for(const m of models)m.section.classList.toggle('is-current',m.id===id);document.querySelectorAll('[data-studio]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.studio===id)));requestAnimationFrame(()=>models.forEach(measure));}
 document.querySelectorAll('[data-studio]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.studio)));
 const params=new URLSearchParams(location.search);if(params.has('mobile')||params.has('solo'))document.body.classList.add('mobile-gallery');if(params.has('solo')){document.body.classList.add('solo-preview');const study=specs.find(item=>item.id===params.get('solo'));if(study)document.title=`0${specs.indexOf(study)+1} · ${study.title} · Pulcinella`;}choose(params.get('solo')||'banco');
 window.addEventListener('resize',()=>models.forEach(m=>{m.cancelSheet?.();m.packingCancel?.();if(m.entryAnimations){m.opened=true;finishOpening(m);}measure(m);}),{passive:true});
 async function connect(){
  const engine=frame.contentWindow?.PulcinellaStudioRenderer;if(!engine||!engine.previewDesign||api)return;api=engine;Q=frame.contentWindow.PizzaFormats;ingredients=engine.ingredients;menu=engine.menu;
  const child=frame.contentWindow,m=models[0];
  child.addEventListener('pizza-studio-order-state',()=>syncOrder(m));
  child.addEventListener('pizza-studio-order-visibility',event=>orderSurface(m,event.detail.visible));
  child.addEventListener('pizza-studio-compose',event=>{const value=event.detail;m.history=[];rememberDraft(m,value);m.design=Q.normalize(value.design);syncDesign(m);m.panel=value.panel==='menu'?'pizzas':'ingredients';orderSurface(m,false,false);renderShelf(m);copy(m);measure(m);requestPreview(m);m.shelf.focus({preventScroll:true});});
  child.addEventListener('pizza-studio-draft',event=>{rememberDraft(m,event.detail);requestPreview(m);});
  frame.allow='web-share';api.order.setLanguage(m.lang);
  models.forEach(m=>{m.design=Q.create(m.servings);syncDesign(m);copy(m);renderShelf(m);requestPreview(m);});
  document.body.dataset.renderer='ready';
 }
 frame.addEventListener('load',connect);connect();
 reduced.addEventListener('change',()=>{if(reduced.matches)models.forEach(m=>{m.opened=true;finishOpening(m);m.packingCancel?.();m.packing=false;});});
 window.addEventListener('pagehide',()=>{models.forEach(m=>{m.cancelSheet?.();m.opened=true;finishOpening(m);m.packingCancel?.();m.packing=false;clearTimeout(m.sheetTimer);clearTimeout(m.noticeTimer);});document.querySelectorAll('.ingredient-flight,.drag-copy').forEach(node=>node.remove());});
})();
