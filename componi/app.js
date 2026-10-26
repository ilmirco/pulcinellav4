(() => {
  'use strict';
  const P=window.Pulcinella, M=window.PizzaMaterials, Q=window.PizzaFormats, $=s=>document.querySelector(s);
  const I=window.PizzaI18n,V=window.PizzaPreviewEngine,T=window.PizzaIngredientAssets;
  let mobileUI,experienceUI,pizzaPickerUI,lastPreviewKey='';
  const canvas=$('#pizza-canvas');
  let releaseAssets;const assetsReady=new Promise(resolve=>{releaseAssets=resolve;});
  const thumbnailCache=new Map(),pantryCards=new Map();
  const assets={},sprites={},naturalSources={},iconURLs={},history=[],pendingAssets=new Map();
  const atlasFiles=new Set(Object.values(M.atlases)),atlasImages=new Map(),preparedIngredients=new Set(),ingredientJobs=new Map();let garnishJob,garnishReady=false;
  const seams=new WeakMap(),surfaceCache=new Map(),workLayers=new Map(),baseComposites=new Map();
  let design=Q.create(),servings=Q.current(design), filter='all', query='', ready=false, previewBusy=false, previewToken=0,drag=null, suppress=null, toastTimer, downloadUrl;
  const longRenderer=window.PizzaLongRenderer.create({P,M,Q,assets,drawPiece});
  const assetURL=key=>window.PULCINELLA_ASSETS?.[key]||`assets/${window.PULCINELLA_ASSET_FILES?.[key]||key}`;
  const previewFrames=V.createFrameCache(3);
  const baseWarmup=V.createWarmup({has:file=>!!assets[file],load:file=>loadImage(file,'low'),schedule:job=>window.requestIdleCallback?window.requestIdleCallback(job,{timeout:1000}):setTimeout(job,0),cancel:handle=>window.cancelIdleCallback?window.cancelIdleCallback(handle):clearTimeout(handle)});
  window.addEventListener('pagehide',()=>baseWarmup.stop());
  // The standard tomato/mozzarella photo is already approved in the home: preserve its colour.
  function loadImage(file,priority='auto'){
    if(atlasImages.has(file)){const image=atlasImages.get(file);atlasImages.delete(file);atlasImages.set(file,image);return Promise.resolve(image);}
    if(assets[file])return Promise.resolve(assets[file]);if(pendingAssets.has(file))return pendingAssets.get(file);
    const promise=(async()=>{const image=new Image();image.fetchPriority=priority==='low'?'low':'auto';image.src=assetURL(file);await image.decode();if(atlasFiles.has(file)){atlasImages.set(file,image);while(atlasImages.size>3)atlasImages.delete(atlasImages.keys().next().value);return image;}assets[file]=P.baseAssets.slice(1).flat().includes(file)&&file!==P.baseAssets[1][1]?toneBase(image):image;return assets[file];})().finally(()=>pendingAssets.delete(file));
    pendingAssets.set(file,promise);return promise;
  }
  function ensureDesignAssets(snapshot){return Promise.all([...Q.photoFiles(snapshot).map(file=>loadImage(file)),...T.ingredients(snapshot).map(prepareIngredient),...(T.garnish(snapshot)?[prepareGarnish()]:[])]);}
  function designAssetsReady(snapshot){return Q.photoFiles(snapshot).every(file=>!!assets[file])&&T.ingredients(snapshot).every(id=>preparedIngredients.has(id))&&(!T.garnish(snapshot)||garnishReady);}
  function roundSurface(raw){
    const plan=P.baseLayers(raw),foundation=assets[P.baseAssets.flat()[plan.foundation]];
    if(plan.tomato===null&&plan.fior===null)return foundation;
    const key=JSON.stringify(plan);if(baseComposites.has(key))return baseComposites.get(key);
    const source=index=>index===null?null:assets[P.baseAssets.flat()[index]];
    const result=window.PizzaBaseSurface.compose(foundation,source(plan.tomato),source(plan.fior),'round');
    baseComposites.set(key,result);if(baseComposites.size>2)baseComposites.delete(baseComposites.keys().next().value);return result;
  }
  // Each opening starts from Margherita; the order has its own persistent store.
  // A back/forward-cache return is also a new opening of the configurator.
  window.addEventListener('pageshow',event=>{if(event.persisted)window.location.reload();});
  function announce(message){message=I.text(message);clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2700);}
  function applyDesign(next){design=Q.normalize(next);servings=Q.current(design);}
  function commitDesign(next){next=Q.normalize(next);if(Q.same(design,next))return false;history.push(Q.normalize(design));if(history.length>60)history.shift();applyDesign(next);render();return true;}
  function commit(next,recipeId){return commitDesign(Q.update(design,next,{recipeId}));}
  function selectActive(index){applyDesign(Q.select(design,index));render();}
  function add(id){if(!ready||!P.byId[id])return;if((servings[id]||0)>=2){announce(`${P.byId[id].name}: doppia porzione già selezionata.`);return;}commit(P.change(servings,id,1));announce(`${design.format==='round'?'':`${Q.partLabel(design,design.active)} · `}${P.byId[id].name}: ${servings[id]===2?'doppia porzione':'porzione standard'}.`);$('#pizza-stage').classList.remove('received');requestAnimationFrame(()=>$('#pizza-stage').classList.add('received'));}
  function remove(id){if(!ready)return;const name=P.byId[id]?.name;if(commit(P.change(servings,id,-1)))announce(`${name}: ${servings[id]?'una porzione':'rimosso dalla pizza'}.`);}
  function choose(id){const recipe=P.menu.find(x=>x.id===id);if(!recipe)return;commit(recipe.servings,id);announce(`Ricetta ${recipe.name} pronta. Ora personalizzala.`);}
  function makeButton(text,label,action,id,disabled){const b=document.createElement('button');b.type='button';b.className='quantity-button';b.textContent=text;b.setAttribute('aria-label',label);b.dataset.action=action;b.dataset.ingredient=id;b.disabled=disabled;return b;}
  function photo(id){
    const file=window.PULCINELLA_INGREDIENT_ICONS?.[id];
    if(file){const img=document.createElement('img');img.src=assetURL(file);img.className='ingredient-photo';img.alt='';img.draggable=false;img.width=65;img.height=54;img.loading='lazy';img.decoding='async';img.onerror=()=>{img.onerror=null;Promise.all((id==='olive'?['olive','green-olive','black-olive']:[id]).map(prepareIngredient)).then(()=>{img.src=(id==='olive'?oliveIcon():sprites[id]).toDataURL('image/png');}).catch(()=>{});};return img;}
    // Avoid duplicating a full pizza data URI in every card during initial loading.
    if(!sprites[id]){const placeholder=document.createElement('span');placeholder.className='ingredient-photo is-skeleton';placeholder.setAttribute('aria-hidden','true');return placeholder;}
    const img=document.createElement('img');img.src=iconURLs[id]||(iconURLs[id]=(id==='olive'?oliveIcon():sprites[id]).toDataURL('image/png'));img.className='ingredient-photo';img.alt='';img.draggable=false;img.width=65;img.height=54;return img;
  }
  function oliveIcon(){const c=makeLayer(96),ctx=c.getContext('2d');for(const [id,x,y,rotation] of [['green-olive',.3,.33,-.2],['green-olive',.68,.38,.2],['black-olive',.5,.7,.15]])drawPiece(ctx,P.byId[id],{x,y,rotation,size:.61,variant:0,mirror:false,aspect:1},96);return c;}
  function renderPantry(){
    const grid=$('#ingredients-grid'),top=grid.scrollTop;
    const focus=document.activeElement?.closest?.('[data-action]');const focusKey=focus?{action:focus.dataset.action,id:focus.dataset.ingredient}:null;
    const fragment=document.createDocumentFragment();
    const results=P.ingredients.filter(i=>(filter==='all'||i.category===filter)&&(i.name+' '+i.originalName+' '+Object.values(I.catalog[i.originalName]||{}).join(' ')).toLocaleLowerCase(I.locale).normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(query));
    $('#available-count').textContent=`${P.ingredients.length} ingredienti`;
    $('#no-results').hidden=results.length>0;
    for(const i of results){
      const n=servings[i.id]||0;let card=pantryCards.get(i.id);
      if(!card){
        card=document.createElement('div');card.dataset.card=i.id;const add=document.createElement('button');add.type='button';add.className='ingredient-add';add.dataset.action='add';add.dataset.ingredient=i.id;
        const visual=document.createElement('span');visual.className='ingredient-visual';visual.append(photo(i.id));add.append(visual);const name=document.createElement('span');name.className='ingredient-name';add.append(name);
        const controls=document.createElement('div');controls.className='ingredient-quantity';const quantity=document.createElement('span');quantity.className='quantity-value';controls.append(makeButton('−','','remove',i.id,true),quantity,makeButton('+','','plus',i.id,true));
        const grip=document.createElement('button');grip.type='button';grip.className='ingredient-drag';grip.innerHTML='<svg class="hand-open" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 13V6.5a1.25 1.25 0 0 1 2.5 0V11 5a1.25 1.25 0 0 1 2.5 0v6-4.5a1.25 1.25 0 0 1 2.5 0V12 9a1.25 1.25 0 0 1 2.5 0v5.5c0 3.6-2.1 6-5.4 6h-.7c-1.8 0-3.1-.8-4.2-2.2l-3.1-4.1a1.3 1.3 0 0 1 1.9-1.7L8 14.2"/></svg><svg class="hand-closed" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 12V9.5a1.3 1.3 0 0 1 2.6 0v1-2a1.3 1.3 0 0 1 2.6 0v2-1.3a1.3 1.3 0 0 1 2.6 0v1.7-.5a1.3 1.3 0 0 1 2.6 0v4.1c0 3.6-2.1 6-5.4 6H12c-1.8 0-3.1-.8-4.1-2.2L5.3 15a1.3 1.3 0 0 1 1.9-1.7l2.1 2.3h3.2"/></svg>';grip.dataset.ingredient=i.id;grip.tabIndex=-1;grip.setAttribute('aria-hidden','true');card.append(add,grip,controls);pantryCards.set(i.id,card);
      }
      const old=card.dataset.quantity;card.dataset.quantity=String(n);card.className=`ingredient${n?' selected':''}${n===2?' at-limit':''}`;
      const button=card.querySelector('.ingredient-add');button.disabled=!ready||n===2;button.setAttribute('aria-label',`${i.name}: aumenta la quantità (${n} di 2)`);button.querySelector('.ingredient-name').textContent=i.name;
      if(ready&&button.querySelector('.is-skeleton'))button.querySelector('.is-skeleton').replaceWith(photo(i.id));
      const minus=card.querySelector('[data-action="remove"]'),plus=card.querySelector('[data-action="plus"]');minus.disabled=!ready||n===0;plus.disabled=!ready||n===2;minus.setAttribute('aria-label',`Riduci la quantità di ${i.name}`);plus.setAttribute('aria-label',`Aumenta la quantità di ${i.name}`);
      const quantity=card.querySelector('.quantity-value');quantity.innerHTML=`<strong>${n}</strong><span class="quantity-limit"> / 2</span><span class="quantity-kind" aria-hidden="true">${n===2?'Doppia':n===1?'Standard':'Assente'}</span>`;quantity.setAttribute('aria-label',`${n} ${n===1?'aggiunta':'aggiunte'} su 2: ${n===2?'doppia porzione':n===1?'standard':'nessuna'}`);
      if(old!==undefined&&old!==String(n)&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)quantity.animate?.([{transform:'translateY(3px)',opacity:.5},{transform:'translateY(0)',opacity:1}],{duration:160,easing:'ease-out'});
      const grip=card.querySelector('.ingredient-drag');grip.disabled=!ready||n===2;grip.title=`Trascina ${i.name} sulla pizza`;fragment.append(card);
    }
    grid.replaceChildren(fragment);
    grid.scrollTop=top;
    if(focusKey){const next=grid.querySelector(`[data-action="${focusKey.action}"][data-ingredient="${focusKey.id}"]`);if(next&&!next.disabled)next.focus({preventScroll:true});else if(next)next.closest('.ingredient').querySelector('[data-action="remove"]')?.focus({preventScroll:true});}
  }
  function renderRecipe(){
    const container=$('#recipe-items'),top=container.scrollTop;
    const focused=document.activeElement?.closest?.('.recipe-row [data-action]');const focusKey=focused?{id:focused.dataset.ingredient,action:focused.dataset.action}:null;
    container.replaceChildren();const chosen=P.ingredients.filter(i=>servings[i.id]);
    for(const i of chosen){
      const n=servings[i.id],row=document.createElement('div');row.className='recipe-row';row.dataset.recipe=i.id;
      const title=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=i.name;small.textContent=n===2?'Doppia porzione':'Porzione standard';title.append(strong,small);
      const controls=document.createElement('div');controls.className='recipe-quantity';const q=document.createElement('span');q.className='quantity-value';q.textContent=n===2?'2×':'1×';controls.append(makeButton('−',`Riduci la quantità di ${i.name} dalla ricetta`,'remove',i.id,!ready),q,makeButton('+',`Aumenta la quantità di ${i.name} alla ricetta`,'plus',i.id,!ready||n===2));row.append(title,controls);container.append(row);
    }
    container.scrollTop=top;
    if(focusKey){const next=container.querySelector(`[data-action="${focusKey.action}"][data-ingredient="${focusKey.id}"]`);if(next&&!next.disabled)next.focus({preventScroll:true});else if(next)next.closest('.recipe-row').querySelector('[data-action="remove"]')?.focus({preventScroll:true});else $('#recipe-title').focus({preventScroll:true});}
    $('#empty-recipe').hidden=chosen.length!==0;$('#ingredient-count').textContent=`${chosen.length} ingredient${chosen.length===1?'e':'i'}`;
    const matched=P.match(servings),name=Q.sectionName(design,design.active),long=design.format!=='round',quote=Q.quote(design);
    $('#recipe-name').textContent=long?`${Q.partLabel(design,design.active)} · ${name}`:name;$('#mobile-name').textContent=Q.title(design);$('#stage-label').textContent=long?`${Q.partLabel(design,design.active)} · ${name}`:name;
    $('#total').textContent=quote.total!==null?P.money(quote.total):'Da confermare';$('#total').classList.toggle('custom',quote.total===null);
    $('#price-label').hidden=!long&&!!matched;$('#price-label').textContent=long?'Prezzo della pizza intera':matched?'':'Prezzo personalizzato';
    $('#price-note').textContent=long?`Base ${P.money(quote.base)}${quote.supplement?` + ${P.money(quote.supplement)} di supplemento unico (${quote.premiumSections} ${quote.premiumSections===1?'gusto speciale':'gusti speciali'})`:'. Nessun supplemento speciale'}.${quote.extraUnknown?' Prezzo delle altre doppie porzioni da confermare con la pizzeria.':''}`:matched?'':'Per variazioni e quantità extra, chiedi il prezzo alla pizzeria.';
    $('#price-note').hidden=!$('#price-note').textContent;
    const check=Q.validate(design);$('#format-warning').hidden=check.valid;$('#format-warning').textContent=check.message;
    $('#pizza-instructions').hidden=!long;
    $('#pizza-instructions span').textContent=long?`Parte ${design.active+1} di ${Q.count(design)}. Tocca un’altra parte per modificarla.`:'';
    $('.drop-zone span').textContent=long?'Lascia sul gusto che vuoi condire':'Lascia qui: una porzione su tutta la pizza';
  }
  function renderSections(){
    const long=design.format!=='round',g=Q.geometry(design.format),focus=document.activeElement?.closest('[data-section]'),group=focus?.parentElement.id,index=focus?.dataset.section;
    for(const id of ['flavor-tabs','all-flavors']){const container=$('#'+id);container.hidden=!long;container.replaceChildren();if(long)Q.sections(design).forEach((part,n)=>{const b=document.createElement('button');b.type='button';b.dataset.section=n;b.disabled=!ready;b.setAttribute('aria-pressed',String(n===design.active));const label=document.createElement('span'),name=document.createElement('strong');label.textContent=Q.partLabel(design,n);name.textContent=Q.partName(part);b.append(label,name);container.append(b);});}
    if(group&&index!==undefined)$('#'+group)?.querySelector(`[data-section="${index}"]`)?.focus({preventScroll:true});
    $('#pizza-stage').classList.toggle('is-long',long);$('#pizza-stage').style.setProperty('--pizza-aspect',g.aspect);
    for(const b of $('#format-picker').children){b.setAttribute('aria-pressed',String(b.dataset.format===design.format));b.disabled=!ready;}
    $('#meter-split').hidden=design.format!=='meter';
    for(const b of $('#meter-split').querySelectorAll('[data-meter-parts]')){b.disabled=!ready;b.setAttribute('aria-pressed',String(Number(b.dataset.meterParts)===Q.count(design)));}
  }
  function spriteFor(item,p){
    if(p.garnish){const whole=sprites['garnish-'+p.oliveColor];if(whole)return whole[p.variant%whole.length];}
    if(item.id==='olive'&&p.oliveColor==='black'){const black=sprites['black-olive-variants'];return black?black[p.variant%black.length]:sprites['black-olive'];}
    const sourceId=p.coBaked?item.id+'-baked':item.id;
    if(naturalSources[sourceId]){
      const source=naturalSources[sourceId],index=p.variant%16,key=sourceId+'-natural-'+index;
      return sprites[key]||(sprites[key]=naturalVariant(source[index%source.length],item.id,index));
    }
    const variants=sprites[item.id+'-variants'];
    return variants?variants[p.variant%variants.length]:sprites[item.id];
  }
  function makeLayer(size){const c=document.createElement('canvas');c.width=c.height=size;return c;}
  function edgeFor(sprite){
    if(seams.has(sprite))return seams.get(sprite);
    // Contact is a soft effect: a compact mask avoids blocking interactions on first use.
    const ratio=Math.min(1,96/Math.max(sprite.width,sprite.height)),w=Math.max(1,Math.round(sprite.width*ratio)),h=Math.max(1,Math.round(sprite.height*ratio)),c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d'),mask=ctx.createImageData(w,h);
    ctx.drawImage(sprite,0,0,w,h);mask.data.set(M.cookingAlpha(ctx.getImageData(0,0,w,h).data,w,h));ctx.putImageData(mask,0,0);seams.set(sprite,c);return c;
  }
  function drawPiece(ctx,item,p,size,edge=false,depth=1){
    const sprite=spriteFor(item,p);if(!sprite)return;
    const material=M.profile(item.id),image=edge?edgeFor(sprite):sprite;
    // Fit the longest side: a narrow mushroom sliver must not become an oversized strip.
    const fit=M.fit(sprite.width,sprite.height,p.size*size*material.scale),w=fit.width,h=fit.height;
    ctx.save();ctx.translate(p.x*size,p.y*size);ctx.rotate(p.rotation);ctx.scale(p.mirror?-1:1,p.aspect||1);
    if(edge){ctx.globalAlpha=Math.min(1,material.sink*depth*(p.coBaked ? .65 : 1));}
    else if(item.id==='oregano'){ctx.globalAlpha=.88+(p.variant%4)*.04;}
    else{
      // A flat contact shadow, rather than the elevated shadow of a cutout.
      ctx.shadowColor=material.melted?'#60471e0d':material.fresh?'#321e0d20':'#52301830';ctx.shadowBlur=size*(material.melted ? .0006 : .0012);ctx.shadowOffsetY=material.melted?0:size*.00045;
    }
    ctx.drawImage(image,-w/2,-h/2,w,h);ctx.restore();
  }
  function cheeseSurface(base,image){
    if(surfaceCache.has(base))return surfaceCache.get(base);
    const size=600,c=makeLayer(size),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,size,size);
    const pixels=ctx.getImageData(0,0,size,size),d=pixels.data;
    // Retain the real cheese pixels from this base, excluding tomato and the crust.
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=(y*size+x)*4,r=Math.hypot(x/size-.5,y/size-.5);
      d[i+3]=r<.418?Math.round(d[i+3]*M.cheeseCoverage(d[i],d[i+1],d[i+2])):0;
    }
    ctx.putImageData(pixels,0,0);
    // A few pixels of molten cheese spread from the real cheese patches over the food edge.
    const melt=makeLayer(size),meltCtx=melt.getContext('2d');
    meltCtx.filter='blur(1.2px)';
    for(const [dx,dy] of [[0,0],[-4,0],[4,0],[0,-4],[0,4],[-3,-3],[3,3]])meltCtx.drawImage(c,dx,dy);
    surfaceCache.set(base,melt);return melt;
  }
  function layersFor(size){
    if(!workLayers.has(size))workLayers.set(size,{baked:makeLayer(size),readable:makeLayer(size),tone:makeLayer(size),edge:makeLayer(size),contact:makeLayer(size),finish:makeLayer(size)});
    const layers=workLayers.get(size);for(const c of Object.values(layers)){const ctx=c.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.clearRect(0,0,size,size);}return layers;
  }
  function draw(target,raw){
    const ctx=target.getContext('2d'),size=target.width,safe=P.normalize(raw),fior=P.visualFior(safe);
    ctx.clearRect(0,0,size,size);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    const base=P.baseFor(safe),baseImage=roundSurface(safe),foundation=assets[P.baseAssets.flat()[P.baseLayers(safe).foundation]];
    if(foundation)ctx.drawImage(foundation,0,0,size,size);
    // Always scale the same original photograph for the rim. Drawing a canvas
    // instead can use different browser resampling, even for untouched pixels.
    if(baseImage&&baseImage!==foundation){ctx.save();ctx.beginPath();ctx.arc(size*.5,size*.5,size*.418,0,Math.PI*2);ctx.clip();ctx.drawImage(baseImage,0,0,size,size);ctx.restore();}
    const allPieces=P.pieces(safe,{scaleFor:id=>M.profile(id).scale}).map(p=>({...p,coBaked:M.withCheese(p.type,fior)})),pieces=allPieces.filter(p=>p.type!=='fior');
    const melted=pieces.filter(p=>M.profile(p.type).melted),oven=pieces.filter(p=>!M.profile(p.type).melted&&!M.profile(p.type).fresh&&M.profile(p.type).relief),fresh=pieces.filter(p=>!M.profile(p.type).melted&&(M.profile(p.type).fresh||!M.profile(p.type).relief));
    ctx.save();ctx.beginPath();ctx.arc(size*.5,size*.5,size*.432,0,Math.PI*2);ctx.clip();
    const layer=layersFor(size),baked=layer.baked.getContext('2d'),readable=layer.readable.getContext('2d'),edge=layer.edge.getContext('2d'),tone=layer.tone.getContext('2d');
    // Buffalo mozzarella forms distinct white melted islands below the toppings.
    // Its own photographic colour is preserved instead of taking the red meat/sauce tint.
    for(const piece of melted)drawPiece(ctx,P.byId[piece.type],piece,size);
    if(oven.length){
      for(const piece of oven){drawPiece(M.profile(piece.type).readable?readable:baked,P.byId[piece.type],piece,size);drawPiece(edge,P.byId[piece.type],piece,size,true,fior===2?1.18:1);}
      // The food shares the warm surface illumination and local tomato/cheese colour.
      tone.drawImage(baseImage,0,0,size,size);tone.globalCompositeOperation='destination-in';tone.drawImage(layer.baked,0,0);
      baked.save();baked.globalCompositeOperation='soft-light';baked.globalAlpha=.3;baked.drawImage(layer.tone,0,0);baked.globalCompositeOperation='multiply';baked.globalAlpha=.07;baked.drawImage(layer.tone,0,0);baked.restore();
      ctx.drawImage(layer.baked,0,0);
      ctx.drawImage(layer.readable,0,0);
      // Wet sauce meniscus: let the actual base reappear softly along part of each contour.
      const contact=layer.contact.getContext('2d');contact.drawImage(layer.edge,0,0);contact.globalCompositeOperation='source-in';contact.drawImage(baseImage,0,0,size,size);
      ctx.save();ctx.globalAlpha=.38;ctx.filter=`blur(${size*.0008}px)`;ctx.drawImage(layer.contact,0,0);ctx.restore();
      // Melted mozzarella occludes only irregular edge bands; no cheese on cheese-free pizzas.
      edge.globalCompositeOperation='source-in';edge.drawImage(fior?cheeseSurface(base,baseImage):baseImage,0,0,size,size);
      ctx.save();ctx.globalAlpha=fior ? .94 : .1;ctx.drawImage(layer.edge,0,0);ctx.restore();
    }
    if(fresh.length){
      const finish=layer.finish.getContext('2d');for(const piece of fresh)drawPiece(finish,P.byId[piece.type],piece,size);
      tone.clearRect(0,0,size,size);tone.globalCompositeOperation='source-over';tone.drawImage(baseImage,0,0,size,size);tone.globalCompositeOperation='destination-in';tone.drawImage(layer.finish,0,0);
      finish.save();finish.globalCompositeOperation='soft-light';finish.globalAlpha=.12;finish.drawImage(layer.tone,0,0);finish.restore();ctx.drawImage(layer.finish,0,0);
    }
    ctx.restore();
    target.dataset.base=base;target.dataset.toppingCount=String(pieces.length);
    target.dataset.foundation=P.baseAssets.flat()[P.baseLayers(safe).foundation];target.dataset.baseMode='ingredient-layers-v33';
    target.dataset.ovenCount=String(oven.length);target.dataset.finishCount=String(fresh.length);target.dataset.surfaceBlend=fior?'cheese-contact':'base-contact';
    target.dataset.pieceCount=String(allPieces.length);target.dataset.servings=JSON.stringify(safe);
    target.dataset.oliveGarnish=P.oliveGarnish(safe)?'2-green-1-black':'regular';
    target.dataset.oreganoStyle='visible-flakes';target.dataset.integration='cooked-relief-v19';
    const counts={};for(const p of pieces)counts[p.type]=(counts[p.type]||0)+1;target.dataset.ingredientCounts=JSON.stringify(counts);target.dataset.visualFior=String(fior);
    target.dataset.meltedCount=String(melted.length);target.dataset.bufalaStyle='melted-white-islands';
    target.dataset.shapeVariants='16';target.dataset.granaStyle='thin-straight-slivers';
    target.dataset.coBakedCount=String(pieces.filter(p=>p.coBaked).length);
  }
  function drawDesign(target,raw){const s=Q.normalize(raw);if(s.format==='round'){if(target.height!==target.width)target.height=target.width;draw(target,Q.current(s));target.dataset.format='round';target.dataset.sections=JSON.stringify(Q.sections(s));target.dataset.activeSection='0';for(const key of ['dimensions','baseIndices','sectionCounts','basePhotoSource','basePhotoFiles','basePhotoSizes'])delete target.dataset[key];}else longRenderer.draw(target,s);target.setAttribute('aria-label',`${Q.title(s)}: ${Q.summary(s)}. Massimo due porzioni per ingrediente in ciascun gusto.`);}
  function syncControls(){$('#undo').disabled=!ready||history.length===0;$('#save').disabled=$('#mobile-save').disabled=!ready||previewBusy||!Q.validate(design).valid;$('#mobile-zoom').disabled=!ready||previewBusy;$('#reset').disabled=!ready;$('#empty').disabled=!ready;orderUI.sync();mobileUI?.sync();pizzaPickerUI?.sync();}
  function showLoading(){$('#loading').classList.remove('is-error');$('#loading').hidden=false;$('#loading-message').textContent='Prepariamo la tua pizza…';$('#preview-retry').hidden=true;}
  function previewError(){previewBusy=true;$('#pizza-stage').setAttribute('aria-busy','false');$('#loading').classList.add('is-error');$('#loading').hidden=false;$('#loading-message').textContent='La base non è stata caricata. Riprova.';$('#preview-retry').hidden=false;syncControls();}
  async function renderPreview(){
    const snapshot=Q.normalize(design),token=++previewToken,width=previewWidth(),key=V.frameKey(snapshot,width);
    try{
      if(!designAssetsReady(snapshot)){previewBusy=true;$('#pizza-stage').setAttribute('aria-busy','true');syncControls();await ensureDesignAssets(snapshot);}
      if(token!==previewToken)return;
      if(lastPreviewKey!==key){
        let frame=previewFrames.get(key);
        if(!frame){frame=document.createElement('canvas');frame.width=width;frame.height=width;drawDesign(frame,snapshot);previewFrames.set(key,frame);}
        // Keep the previous pizza intact until its replacement is complete.
        if(canvas.width!==frame.width)canvas.width=frame.width;if(canvas.height!==frame.height)canvas.height=frame.height;
        const context=canvas.getContext('2d');context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(frame,0,0);
        for(const name of Object.keys(canvas.dataset))delete canvas.dataset[name];Object.assign(canvas.dataset,frame.dataset);lastPreviewKey=key;
      }
      canvas.dataset.activeSection=String(snapshot.format==='round'?0:snapshot.active);canvas.setAttribute('aria-label',`${Q.title(snapshot)}: ${Q.summary(snapshot)}. Massimo due porzioni per ingrediente in ciascun gusto.`);
      previewBusy=false;$('#pizza-stage').setAttribute('aria-busy','false');$('#loading').hidden=true;$('#preview-retry').hidden=true;
      if($('#zoom-dialog').open)refreshZoom();syncControls();baseWarmup.warm(V.warmingFiles(snapshot));
    }catch{if(token===previewToken)previewError();}
  }
  function render(){renderSections();renderPantry();renderRecipe();syncControls();if(ready)renderPreview();}
  function focusComposer(panel='ingredients'){if(mobileUI?.matches){mobileUI.setPanel(panel,{focus:true});return;}requestAnimationFrame(()=>{const field=panel==='recipe'?$('#recipe-title'):$('#pizza-picker-open');field.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});field.focus({preventScroll:true});});}
  function trimSprite(image,cell,crumbs=false){
    const tile=document.createElement('canvas'),w=Math.floor(image.naturalWidth/4),h=Math.floor(image.naturalHeight/4);tile.width=w;tile.height=h;
    const ctx=tile.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,(cell%4)*w,Math.floor(cell/4)*h,w,h,0,0,w,h);
    const data=ctx.getImageData(0,0,w,h),pixels=M.cleanAlpha(data.data,w,h,crumbs);ctx.putImageData(data,0,0);let x0=w,y0=h,x1=0,y1=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>20){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
    if(x0>x1||y0>y1){const empty=document.createElement('canvas');empty.width=empty.height=1;return empty;}
    x0=Math.max(0,x0-2);y0=Math.max(0,y0-2);x1=Math.min(w-1,x1+2);y1=Math.min(h-1,y1+2);
    const result=document.createElement('canvas');result.width=x1-x0+1;result.height=y1-y0+1;result.getContext('2d').drawImage(tile,x0,y0,result.width,result.height,0,0,result.width,result.height);return result;
  }
  function prepareIngredient(id){
    if(preparedIngredients.has(id))return Promise.resolve(sprites[id]);if(ingredientJobs.has(id))return ingredientJobs.get(id);
    const job=(async()=>{
      if(id==='oregano'){sprites['oregano-variants']=Array.from({length:12},(_,n)=>herbFragment(n));sprites.oregano=herbIcon();}
      else{
        const spec=T.sprite(id);if(!spec)return;
        const image=await loadImage(spec.file),variants=spec.cells.map(cell=>trimSprite(image,cell,spec.crumbs));
        sprites[id+'-variants']=variants;sprites[id]=variants[0];
        if(!['tomato','fior'].includes(id)&&!M.profile(id).locked)naturalSources[id]=variants;
        if(M.coBaked[id]){const baked=await loadImage(M.cookedAtlas(id));naturalSources[id+'-baked']=M.coBaked[id].map(cell=>trimSprite(baked,cell,id==='friarielli'));}
      }
      preparedIngredients.add(id);return sprites[id];
    })().finally(()=>ingredientJobs.delete(id));ingredientJobs.set(id,job);return job;
  }
  function prepareGarnish(){
    if(garnishReady)return Promise.resolve();if(garnishJob)return garnishJob;
    garnishJob=loadImage(M.atlases.garnishOlives).then(image=>{for(const[color,cells]of Object.entries(M.garnishOlives))sprites['garnish-'+color]=cells.map(cell=>trimSprite(image,cell));garnishReady=true;}).finally(()=>{garnishJob=null;});return garnishJob;
  }
  async function loadAssets(){
    showLoading();
    const icons=window.PULCINELLA_INGREDIENT_ICONS||{};
    if(!P.ingredients.every(item=>icons[item.id]))await Promise.all(P.ingredients.map(item=>prepareIngredient(item.id)));
    await ensureDesignAssets(design);ready=true;releaseAssets();$('#loading').hidden=true;render();
  }
  function naturalVariant(source,id,index){
    const v=M.variation(id,index),pad=Math.ceil(Math.max(source.width,source.height)*.065),c=document.createElement('canvas');
    c.width=source.width+pad*2;c.height=source.height+pad*2;
    const ctx=c.getContext('2d');ctx.filter=`brightness(${v.exposure})`;
    // Fine scan strips bend the silhouette without stretching a narrow ingredient into a broad sheet.
    for(let y=0;y<source.height;y+=2){const h=Math.min(2,source.height-y),row=M.rowWarp(y/source.height,source.width,v),w=source.width*row.scale*v.stretch;
      ctx.drawImage(source,0,y,source.width,h,pad+(source.width-w)/2+row.offset,pad+y,w,h);
    }
    return c;
  }
  function herbFragment(n){
    const c=makeLayer(32),ctx=c.getContext('2d'),rng=P.random(7701+n*37);
    ctx.fillStyle=['#59633d','#6c7048','#485633','#77744a'][n%4];ctx.beginPath();
    for(let j=0;j<7;j++){const angle=j/7*Math.PI*2,r=8+rng()*6;const x=16+Math.cos(angle)*r,y=16+Math.sin(angle)*r*.6;j?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();
    ctx.strokeStyle='#a3956b66';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(7,17);ctx.lineTo(24,14);ctx.stroke();return c;
  }
  function herbIcon(){
    const c=makeLayer(100),ctx=c.getContext('2d'),rng=P.random(320);
    for(let n=0;n<65;n++){const r=Math.sqrt(rng())*37,a=rng()*Math.PI*2;ctx.save();ctx.translate(50+Math.cos(a)*r,50+Math.sin(a)*r*.7);ctx.rotate(a);ctx.drawImage(sprites['oregano-variants'][n%12],-3,-3,6,6);ctx.restore();}return c;
  }
  function toneBase(image){
    const c=makeLayer(image.naturalWidth),ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
    const size=c.width,pixels=ctx.getImageData(0,0,size,size),d=pixels.data;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)if((x/size-.5)**2+(y/size-.5)**2<.425**2){const i=(y*size+x)*4;if(d[i+3])M.toneTomato(d,i);}
    ctx.putImageData(pixels,0,0);return c;
  }
  function pointSection(x,y){const r=canvas.getBoundingClientRect();return Q.hit(design,(x-r.left)/r.width,(y-r.top)/r.height);}
  function pointInside(x,y){return pointSection(x,y)!==null;}
  canvas.addEventListener('click',e=>{if(ready&&design.format!=='round'){const index=pointSection(e.clientX,e.clientY);if(index!==null)selectActive(index);}});
  document.addEventListener('pointerdown',e=>{
    const source=e.target.closest('.ingredient-add,.ingredient-drag');if(!source||source.disabled||e.button!==0||!ready)return;
    // Only the hand or the actual photo can start a touch drag. The photo arms
    // after a short hold; touch-action is reserved up front so the browser cannot steal it.
    if(e.isPrimary===false)return;
    const hand=source.classList.contains('ingredient-drag'),photoTarget=e.target.closest('.ingredient-visual');
    if(e.pointerType==='touch'&&!hand&&!photoTarget)return;
    const hold=e.pointerType==='touch'&&!hand;
    drag={id:source.dataset.ingredient,source,pointer:e.pointerId,x:e.clientX,y:e.clientY,currentY:e.clientY,moved:false,ghost:null,armed:!hold,hold:null};source.setPointerCapture(e.pointerId);
    const grip=source.closest('.ingredient')?.querySelector('.ingredient-drag');drag.grip=grip;
    if(hold){const pending=drag;drag.hold=setTimeout(()=>{if(drag!==pending)return;drag.armed=true;grip?.classList.add('is-grabbed');},280);}else grip?.classList.add('is-grabbed');
  });
  document.addEventListener('pointermove',e=>{
    if(!drag||drag.pointer!==e.pointerId)return;
    drag.currentY=e.clientY;
    if(!drag.armed){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>10)endDrag(e,true);return;}
    if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7){drag.moved=true;mobileUI?.revealPizza();document.body.classList.add('ingredient-dragging');drag.ghost=document.createElement('div');drag.ghost.className='drag-ghost'+(e.pointerType==='touch'?' is-touch':'');drag.ghost.append(photo(drag.id));document.body.append(drag.ghost);requestAnimationFrame(scrollWhileDragging);}
    if(!drag.moved)return;e.preventDefault();drag.ghost.style.left=`${e.clientX}px`;drag.ghost.style.top=`${e.clientY}px`;$('#pizza-stage').classList.toggle('drag-over',pointInside(e.clientX,e.clientY));
  },{passive:false});
  function scrollWhileDragging(){if(!drag?.moved)return;const y=drag.currentY,edge=70;let speed=0;if(!mobileUI?.matches){if(y<edge)speed=-Math.min(16,(edge-y)/4);else if(y>window.innerHeight-edge)speed=Math.min(16,(y-window.innerHeight+edge)/4);if(speed)window.scrollBy(0,speed);}requestAnimationFrame(scrollWhileDragging);}
  function endDrag(e,cancel=false){if(!drag||drag.pointer!==e.pointerId)return;const d=drag;drag=null;clearTimeout(d.hold);d.grip?.classList.remove('is-grabbed');d.ghost?.remove();document.body.classList.remove('ingredient-dragging');$('#pizza-stage').classList.remove('drag-over');if(d.source.hasPointerCapture?.(d.pointer))d.source.releasePointerCapture(d.pointer);if(d.moved||cancel){suppress={id:d.id,until:performance.now()+700};const index=pointSection(e.clientX,e.clientY);if(d.moved&&!cancel&&index!==null){if(index!==design.active)selectActive(index);add(d.id);}}}
  document.addEventListener('pointerup',e=>endDrag(e));document.addEventListener('pointercancel',e=>endDrag(e,true));
  document.addEventListener('lostpointercapture',e=>{if(e.target===drag?.source)endDrag(e,true);});
  const cancelDrag=()=>{if(drag)endDrag({pointerId:drag.pointer,clientX:-1,clientY:-1},true);};
  window.addEventListener('pagehide',cancelDrag);window.addEventListener('blur',cancelDrag);document.addEventListener('keydown',e=>{if(e.key==='Escape')cancelDrag();});
  document.addEventListener('click',e=>{
    const section=e.target.closest('[data-section]');if(section&&!section.disabled){selectActive(Number(section.dataset.section));return;}
    const split=e.target.closest('[data-meter-parts]');if(split&&!split.disabled){if(Number(split.dataset.meterParts)!==Q.count(design))commitDesign(Q.setMeterParts(design,Number(split.dataset.meterParts)));announce(Q.count(design)===2?'Metro diviso a metà: scegli i due gusti.':'Metro diviso in tre parti: scegli i tre gusti.');return;}
    const format=e.target.closest('#format-picker [data-format]');if(format&&!format.disabled){if(format.dataset.format!==design.format)commitDesign(Q.setFormat(design,format.dataset.format));announce(`Formato ${Q.formats[design.format].name}. ${design.format==='round'?'Un gusto':`${Q.count(design)} gusti da comporre separatamente`}.`);return;}
    const button=e.target.closest('[data-action]');if(!button||button.disabled)return;const id=button.dataset.ingredient;
    if(suppress&&button.dataset.action==='add'&&suppress.id===id&&performance.now()<suppress.until){suppress=null;return;}
    if(button.dataset.action==='remove')remove(id);else add(id);
  });
  $('#filters').innerHTML=Object.entries(P.categories).map(([id,name])=>`<button type="button" data-filter="${id}" aria-pressed="${id==='all'}">${name}</button>`).join('');
  $('#filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;filter=b.dataset.filter;for(const x of $('#filters').children)x.setAttribute('aria-pressed',String(x===b));$('#ingredients-grid').scrollTop=0;renderPantry();});
  $('#search').addEventListener('input',e=>{query=e.target.value.toLocaleLowerCase(I.locale).normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();$('#ingredients-grid').scrollTop=0;renderPantry();});
  document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{if(ready)choose(b.dataset.preset);}));
  $('#undo').addEventListener('click',()=>{if(history.length){applyDesign(history.pop());render();announce('Ultima modifica annullata.');}});
  $('#reset').addEventListener('click',()=>{commit(P.menu.find(r=>r.id==='margherita').servings,'margherita');announce(design.format==='round'?'Si riparte dalla Margherita del menu.':`${Q.partLabel(design,design.active)} riportato alla Margherita.`);});
  $('#empty').addEventListener('click',()=>{commit({},null);announce(`${design.format==='round'?'':`${Q.partLabel(design,design.active)} · `}Solo impasto: scegli tutti gli ingredienti, anche la base.`);});
  function refreshZoom(){drawDesign($('#zoom-canvas'),design);$('#zoom-title').textContent=Q.title(design);$('#zoom-dialog').classList.toggle('is-long',design.format!=='round');$('.zoom-hint').hidden=!$('#zoom-dialog').classList.contains('detail-zoom');}
  $('#mobile-zoom').addEventListener('click',()=>{if(!ready||previewBusy)return;$('#zoom-dialog').classList.remove('detail-zoom');$('#zoom-detail').setAttribute('aria-pressed','false');$('#zoom-detail').textContent='Vedi i dettagli +';refreshZoom();$('#zoom-dialog').showModal();$('.zoom-frame').scrollLeft=0;});
  $('#zoom-detail').addEventListener('click',()=>{const detail=$('#zoom-dialog').classList.toggle('detail-zoom');$('#zoom-detail').setAttribute('aria-pressed',String(detail));$('#zoom-detail').textContent=detail?'Mostra tutta la pizza':'Vedi i dettagli +';$('.zoom-hint').hidden=!detail;$('.zoom-frame').scrollLeft=detail?($('.zoom-frame').scrollWidth-$('.zoom-frame').clientWidth)*design.active/Math.max(1,Q.count(design)-1):0;});
  $('#mobile-recipe').addEventListener('click',()=>{if(mobileUI?.matches){mobileUI.setPanel('recipe');return;}const title=$('#recipe-title');title.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});title.focus({preventScroll:true});});
  $('#mobile-ingredients').addEventListener('click',()=>{if(mobileUI?.matches){mobileUI.setPanel('ingredients');return;}const title=$('#pantry-title');title.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});title.focus({preventScroll:true});});
  if('ResizeObserver' in window)new ResizeObserver(entries=>{document.documentElement.style.setProperty('--preview-height',`${Math.ceil(entries[0].borderBoxSize?.[0]?.blockSize||entries[0].target.getBoundingClientRect().height)}px`);}).observe($('.pizza-preview'));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.close).close()));
  function wrap(ctx,text,max){const lines=[];let line='';const tokens=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter(I.locale,{granularity:'word'}).segment(text)].map(x=>x.segment):Array.from(text);for(const token of tokens){if(line&&ctx.measureText(line+token).width>max){lines.push(line.trimEnd());line=token.trimStart();}else line+=token;}if(line)lines.push(line.trimEnd());return lines;}
  async function exportImage(snapshot,composition={}){
    await document.fonts.ready;await ensureDesignAssets(snapshot);
    const out=document.createElement('canvas'),ctx=out.getContext('2d');out.width=1200;
    const long=snapshot.format!=='round',quote=Q.quote(snapshot),photoWidth=long?1040:920,photoHeight=photoWidth/Q.geometry(snapshot.format).aspect,titleY=160+photoHeight+70;
    const dietary=window.PizzaOrder.dietQuote(snapshot,composition.options),note=window.PizzaOrder.pizzaNote(composition.note),variations=Q.variationSummary(snapshot),summary=[Q.summary(snapshot),...(composition.options?dietary.labels:[]),variations?I.text('Variazioni')+': '+variations:'',note?I.text('Note pizza')+': '+note:''].filter(Boolean).join('\n');
    const total=quote.total===null?null:quote.total+(composition.options?dietary.supplement:0);
    ctx.font='28px "DM Sans",Lato,sans-serif';const lines=summary.split('\n').flatMap(text=>wrap(ctx,text,1040));out.height=Math.ceil(titleY+100+lines.length*40+180);
    ctx.fillStyle='#fafaf5';ctx.fillRect(0,0,out.width,out.height);ctx.fillStyle='#1a6b2a';ctx.fillRect(0,0,400,8);ctx.fillStyle='#fff';ctx.fillRect(400,0,400,8);ctx.fillStyle='#cc1515';ctx.fillRect(800,0,400,8);
    if(assets.logo)ctx.drawImage(assets.logo,80,40,280,103);
    ctx.fillStyle='#1a6b2a';ctx.font='bold 22px "DM Sans",Lato,sans-serif';ctx.textAlign='right';ctx.fillText(I.text('LA MIA PIZZA PULCINELLA'),1120,97);ctx.textAlign='left';
    const pizza=document.createElement('canvas');pizza.width=photoWidth;drawDesign(pizza,snapshot);ctx.drawImage(pizza,(1200-photoWidth)/2,160,photoWidth,photoHeight);
    ctx.fillStyle='#333333';ctx.font='600 44px "DM Sans",Lato,sans-serif';ctx.fillText(Q.title(snapshot)+(long?` · ${Q.formats[snapshot.format].length} × 35 cm`:''),80,titleY);ctx.font='28px "DM Sans",Lato,sans-serif';ctx.fillStyle='#626656';lines.forEach((line,i)=>ctx.fillText(line,80,titleY+60+i*40));
    const baseY=out.height-140;ctx.fillStyle='#1a6b2a';ctx.font='bold 23px "DM Sans",Lato,sans-serif';ctx.fillText(I.text(total!==null?`Prezzo: ${P.money(total)}`:'Prezzo personalizzato da confermare con la pizzeria'),80,baseY);ctx.font='20px "DM Sans",Lato,sans-serif';if(long)ctx.fillText(I.text(`Base ${P.money(quote.base)} · Supplemento unico ${P.money(quote.supplement)}`),80,baseY+31);ctx.fillStyle='#6a6d60';ctx.font='20px "DM Sans",Lato,sans-serif';ctx.fillText('Patù · Via Giuseppe Garibaldi, 24 · 339 8390660 · pulcinellapatu.it',80,baseY+70);
    return new Promise((resolve,reject)=>out.toBlob(blob=>blob?resolve(blob):reject(new Error('Esportazione non disponibile.')),'image/png'));
  }
  let imageGeneration=0;
  async function showResult(){const generation=++imageGeneration;if(!ready||previewBusy||!Q.validate(design).valid)return;const snapshot=Q.normalize(design);drawDesign($('#result-canvas'),snapshot);$('#result-dialog').classList.toggle('is-long',snapshot.format!=='round');$('#result-summary').textContent=Q.title(snapshot)+'\n'+Q.summary(snapshot);const link=$('#download');link.download='pulcinella-pizza-'+I.language+'.png';link.removeAttribute('href');link.textContent='Prepariamo la tua immagine…';link.setAttribute('aria-disabled','true');$('#result-dialog').showModal();
    try{const blob=await exportImage(snapshot);if(generation!==imageGeneration)return;if(downloadUrl)URL.revokeObjectURL(downloadUrl);downloadUrl=URL.createObjectURL(blob);link.href=downloadUrl;link.innerHTML='Scarica pizza e ricetta <span aria-hidden="true">↓</span>';link.removeAttribute('aria-disabled');}catch{link.textContent='Immagine non disponibile';announce('Non è stato possibile creare il PNG. Riprova a salvare.');}}
  $('#save').addEventListener('click',showResult);$('#mobile-save').addEventListener('click',showResult);
  window.addEventListener('pagehide',()=>{if(downloadUrl)URL.revokeObjectURL(downloadUrl);});
  const mobileLayout=window.matchMedia('(max-width: 820px), (max-width:1100px) and (max-height:500px)');
  function previewWidth(){return mobileLayout.matches?Math.min(1280,Math.max(720,Math.ceil(canvas.getBoundingClientRect().width*Math.min(3,window.devicePixelRatio||1)/16)*16)):1200;}
  function syncPreviewResolution(){if(ready&&canvas.width!==previewWidth())renderPreview();}
  mobileLayout.addEventListener('change',syncPreviewResolution);syncPreviewResolution();
  async function thumbnail(raw){
    const snapshot=Q.normalize(raw),key=JSON.stringify([snapshot.format,Q.sections(snapshot)]);if(thumbnailCache.has(key))return thumbnailCache.get(key);
    const pending=(async()=>{await assetsReady;await ensureDesignAssets(snapshot);const target=document.createElement('canvas');target.width=240;target.height=240;drawDesign(target,snapshot);return target.toDataURL('image/webp',.78);})();thumbnailCache.set(key,pending);if(thumbnailCache.size>64)thumbnailCache.delete(thumbnailCache.keys().next().value);pending.catch(()=>thumbnailCache.delete(key));return pending;
  }
  function renderThumbnail(host,raw){
    const key=JSON.stringify([raw.format,Q.sections(raw)]);host.dataset.thumbnail=key;host.classList.add('is-loading');
    return thumbnail(raw).then(url=>{if(!host.isConnected||host.dataset.thumbnail!==key)return;const image=new Image();image.alt='';image.width=240;image.height=Math.round(240/Q.geometry(raw.format).aspect);image.decoding='async';image.onload=()=>host.classList.remove('is-loading');image.src=url;host.replaceChildren(image);if(image.complete)host.classList.remove('is-loading');}).catch(()=>{if(host.isConnected){host.classList.remove('is-loading');host.textContent=I.text('Anteprima non disponibile');}});
  }
  function createRecipePreviews(container){
    const snapshots=new WeakMap();let generation=0,queue=[],running=false;
    async function paint(){if(running)return;running=true;try{while(queue.length){const item=queue.shift();if(item.generation!==generation||!item.host.isConnected)continue;await renderThumbnail(item.host,item.snapshot);await new Promise(resolve=>requestAnimationFrame(resolve));}}finally{running=false;}}
    function enqueue(host){
      const snapshot=snapshots.get(host);if(!snapshot)return;snapshots.delete(host);
      const item={host,snapshot,generation},file=window.PULCINELLA_RECIPE_PREVIEWS?.[host.dataset.previewRecipe];
      const fallback=()=>{if(item.generation!==generation||!host.isConnected)return;queue.push(item);paint();};
      if(!file){fallback();return;}
      // Ready-made WebP images load in parallel; avoid running the full renderer on phones.
      const image=new Image();image.alt='';image.width=image.height=240;image.decoding='async';image.draggable=false;
      image.onload=()=>{if(item.generation===generation)host.classList.remove('is-loading');};
      image.onerror=fallback;image.src=assetURL(file);host.replaceChildren(image);
      if(image.complete&&image.naturalWidth)host.classList.remove('is-loading');
    }
    const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);enqueue(entry.target);}},{root:container,rootMargin:'100px'}):null;
    return{reset(){generation++;queue=[];observer?.disconnect();},watch(host,id){const recipe=P.menu.find(item=>item.id===id),snapshot=Q.create(recipe?.servings||{});host.dataset.previewRecipe=id;snapshots.set(host,snapshot);if(observer)observer.observe(host);else enqueue(host);}};
  }
  const orderUI=window.PizzaOrderUI.create({getDesign:()=>Q.normalize(design),setDesign:next=>commitDesign(next),isReady:()=>ready&&!previewBusy,announce,focusComposer,renderThumbnail,onPizzaAdded:(value,meta)=>experienceUI?.confirm(value,meta),onDraftChange:()=>experienceUI?.sync()});
  mobileUI=window.PizzaMobileUI.create({getDesign:()=>Q.normalize(design),isReady:()=>ready,choose,empty:()=>$('#empty').click(),undo:()=>$('#undo').click(),reset:()=>$('#reset').click(),onLayout:render,createRecipePreviews});
  pizzaPickerUI=window.PizzaPickerUI.create({getDesign:()=>Q.normalize(design),isReady:()=>ready,choose,empty:()=>$('#empty').click(),select:selectActive,createRecipePreviews});
  experienceUI=window.PizzaExperienceUI.create({getComposition:()=>({design:Q.normalize(design),options:orderUI.options(),note:orderUI.note()}),getOrder:orderUI.snapshot,isReady:()=>ready&&!previewBusy,restore:value=>orderUI.restore(value,{panel:mobileUI.matches?'menu':'recipe'}),startNewPizza:orderUI.startNewPizza,openOrder:orderUI.open,renderThumbnail,announce,makePizzaFile:async value=>new File([await exportImage(value.design,value)],'pulcinella-pizza-'+I.language+'.png',{type:'image/png'}),makeOrderFile:async order=>new File([await window.PizzaOrderPDF.generate(order)],'pulcinella-ordine-'+I.language+'.pdf',{type:'application/pdf'})});
  $('#preview-retry').addEventListener('click',()=>{if(ready)renderPreview();else loadAssets().catch(previewError);});
  let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>syncPreviewResolution());},{passive:true});
  window.addEventListener('pizza-language-change',()=>{
    for(const b of $('#filters').children)b.textContent=P.categories[b.dataset.filter];
    render();orderUI.refreshLanguage();experienceUI.refreshLanguage();
    if($('#zoom-dialog').open)refreshZoom();
    if($('#result-dialog').open){$('#result-dialog').close();showResult();}
    $('#toast').classList.remove('show');
  });
  render();loadAssets().then(async()=>{try{const logo=new Image();logo.src=assetURL('logo.svg');await logo.decode();assets.logo=logo;}catch{}}).catch(()=>{previewError();announce('Caricamento delle immagini non riuscito.');});
})();
