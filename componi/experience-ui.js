(function(root){
  'use strict';
  function create({getComposition,getOrder,isReady,restore,startNewPizza,openOrder,renderThumbnail,makePizzaFile,makeOrderFile,announce}){
    const F=root.PizzaPersonal,Q=root.PizzaFormats,O=root.PizzaOrder,I=root.PizzaI18n,$=s=>document.querySelector(s),storage='pulcinella-favorites-v1';
    let favorites=F.create(),revision=0,favoriteKeys=new Map(),favoritesView=false,favoritesRenderKey='',variationKey='',shareGeneration=0,shareURL=null,shareFile=null,shareText='';
    const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
    function readFavorites(){try{favorites=F.normalize(JSON.parse(localStorage.getItem(storage)));}catch{favorites=F.create();}reindex();}
    function reindex(){favoriteKeys=new Map(favorites.items.map(item=>[F.key(item),item]));revision++;}
    function persist(){reindex();try{localStorage.setItem(storage,JSON.stringify(favorites));$('#favorites-storage-note').hidden=true;}catch{$('#favorites-storage-note').hidden=false;announce('Preferite conservate solo per questa sessione.');}}
    function current(){return F.composition(getComposition());}
    function renderVariations(value){
      const key=JSON.stringify([value.design,I.language]);if(key===variationKey)return;variationKey=key;
      const host=$('#recipe-variations'),group=Q.variations(value.design)[value.design.active];host.replaceChildren();host.hidden=!group?.items.length;
      if(!group?.items.length)return;host.append(el('p','variations-label',I.text('Variazioni')));
      const list=el('ul','variation-chips');for(const item of group.items)list.append(el('li',item.after===0?'is-removed':'',item.text));host.append(list);
    }
    function renderFavorites(){
      if(!favoritesView)return;
      const query=$('#pizza-search').value.trim().toLocaleLowerCase(I.locale).normalize('NFD').replace(/[\u0300-\u036f]/g,''),key=[revision,I.language,query,isReady()].join(':');
      if(key===favoritesRenderKey)return;favoritesRenderKey=key;
      const grid=$('#favorites-grid');grid.replaceChildren();
      for(const item of favorites.items){
        const desc=O.describe({kind:'pizza',...item}),search=(desc.title+' '+desc.detail+' '+item.note).toLocaleLowerCase(I.locale).normalize('NFD').replace(/[\u0300-\u036f]/g,'');if(query&&!search.includes(query))continue;
        const row=el('div','favorite-row'),load=el('button','favorite-load'),thumb=el('span','pizza-thumb is-loading'),body=el('span','favorite-copy'),remove=el('button','favorite-remove','×');
        load.type=remove.type='button';load.dataset.favoriteLoad=item.id;load.disabled=!isReady();load.setAttribute('aria-label',I.text('Carica {name}',{name:desc.title}));thumb.setAttribute('aria-hidden','true');
        body.append(el('strong','',desc.title),el('span','',desc.subtitle),el('small','',desc.detail));load.append(thumb,body);
        remove.dataset.favoriteRemove=item.id;remove.setAttribute('aria-label',I.text('Rimuovi dai preferiti')+': '+desc.title);row.append(load,remove);grid.append(row);renderThumbnail(thumb,item.design);
      }
      const empty=$('#favorites-empty');empty.hidden=grid.children.length>0;empty.textContent=I.text(favorites.items.length?'Nessuna pizza trovata.':'Le pizze che salvi le ritrovi qui.');
    }
    function sync(){
      const value=current(),saved=favoriteKeys.get(F.key(value)),valid=isReady()&&O.canAddPizza(value.design),button=$('#favorite-current');
      button.disabled=$('#share-pizza').disabled=!valid;button.setAttribute('aria-pressed',String(!!saved));button.querySelector('span').textContent=I.text(saved?'Salvata nei preferiti':'Salva nei preferiti');
      $('#favorites-count').textContent=String(favorites.items.length);$('#share-order').disabled=!getOrder().lines.length;renderVariations(value);renderFavorites();
    }
    $('#favorite-current').addEventListener('click',()=>{
      if(!isReady())return;const value=current(),saved=favoriteKeys.get(F.key(value));
      if(!saved&&favorites.items.length>=F.MAX_FAVORITES){announce(I.text('Puoi salvare fino a {n} pizze preferite.',{n:F.MAX_FAVORITES}));return;}
      favorites=saved?F.remove(favorites,saved.id):F.add(favorites,value);persist();sync();announce(saved?'Preferita rimossa.':'Preferita salvata.');
    });
    $('#favorites-toggle').addEventListener('click',()=>{
      favoritesView=!favoritesView;$('#menu-tools').dataset.favoritesView=String(favoritesView);$('#favorites-panel').hidden=!favoritesView;$('#favorites-toggle').setAttribute('aria-pressed',String(favoritesView));$('#favorites-toggle').setAttribute('aria-label',I.text(favoritesView?'Mostra le pizze del menu':'Mostra le pizze preferite'));renderFavorites();
    });
    $('#pizza-search').addEventListener('input',renderFavorites);
    root.addEventListener('pizza-new-composition',()=>{favoritesView=false;$('#menu-tools').dataset.favoritesView='false';$('#favorites-panel').hidden=true;$('#favorites-toggle').setAttribute('aria-pressed','false');$('#favorites-toggle').setAttribute('aria-label',I.text('Mostra le pizze preferite'));});
    $('#favorites-grid').addEventListener('click',event=>{
      const load=event.target.closest('[data-favorite-load]'),remove=event.target.closest('[data-favorite-remove]');
      if(load&&!load.disabled){const item=favorites.items.find(item=>item.id===load.dataset.favoriteLoad);if(item)restore(item);}
      else if(remove){favorites=F.remove(favorites,remove.dataset.favoriteRemove);persist();sync();$('#favorites-toggle').focus({preventScroll:true});announce('Preferita rimossa.');}
    });
    const notice=$('#added-notice');
    let noticeTimer,noticeHideTimer,noticeDeadline=0,noticeRemaining=6000,noticeOrigin,noticeHovered=false;
    function pauseNotice(){if(noticeTimer){clearTimeout(noticeTimer);noticeTimer=null;noticeRemaining=Math.max(0,noticeDeadline-Date.now());}}
    function dismissNotice(restoreFocus=false){
      pauseNotice();clearTimeout(noticeHideTimer);
      if(restoreFocus&&notice.contains(document.activeElement)&&noticeOrigin?.isConnected&&!noticeOrigin.disabled)noticeOrigin.focus({preventScroll:true});
      notice.classList.remove('is-visible');notice.inert=true;noticeHovered=false;
      noticeHideTimer=setTimeout(()=>{notice.hidden=true;},180);
    }
    function resumeNotice(){
      if(notice.hidden||!notice.classList.contains('is-visible')||noticeHovered||notice.contains(document.activeElement)||noticeTimer)return;
      noticeDeadline=Date.now()+noticeRemaining;noticeTimer=setTimeout(()=>{noticeTimer=null;dismissNotice();},noticeRemaining);
    }
    function confirm(value,{updated=false}={}){
      pauseNotice();clearTimeout(noticeHideTimer);noticeRemaining=6000;
      if(!notice.contains(document.activeElement))noticeOrigin=document.activeElement;
      notice.hidden=false;notice.inert=false;
      const desc=O.describe({kind:'pizza',...value});$('#added-title').textContent=I.text(updated?'Pizza aggiornata':'Pizza aggiunta');$('#added-name').textContent=desc.title;$('#added-format').textContent=desc.subtitle;renderThumbnail($('#added-thumbnail'),value.design);
      // Establish the entry position before enabling the transition; never move focus.
      notice.getBoundingClientRect();notice.classList.add('is-visible');resumeNotice();
    }
    notice.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){noticeHovered=true;pauseNotice();}});
    notice.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse'){noticeHovered=false;resumeNotice();}});
    notice.addEventListener('focusin',pauseNotice);
    notice.addEventListener('focusout',()=>queueMicrotask(resumeNotice));
    $('#added-dismiss').addEventListener('click',()=>dismissNotice(true));
    $('#added-continue').addEventListener('click',()=>{dismissNotice(true);startNewPizza();});
    $('#added-order').addEventListener('click',()=>{dismissNotice(true);openOrder();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!notice.hidden&&!document.querySelector('dialog[open]'))dismissNotice(true);});
    root.addEventListener('pagehide',()=>{pauseNotice();clearTimeout(noticeHideTimer);notice.hidden=true;notice.inert=true;notice.classList.remove('is-visible');noticeHovered=false;});
    const noticeBar=$('.mobile-bar');
    function positionNotice(){notice.style.setProperty('--notice-bar-height',(noticeBar?.getBoundingClientRect().height||0)+'px');}
    if(root.ResizeObserver&&noticeBar)new ResizeObserver(positionNotice).observe(noticeBar);
    root.addEventListener('resize',positionNotice,{passive:true});positionNotice();
    function clearShare(){shareGeneration++;shareFile=null;if(shareURL){URL.revokeObjectURL(shareURL);shareURL=null;}$('#share-download').removeAttribute('href');}
    async function openShare(value,orderMode=false){
      clearShare();const generation=shareGeneration,dialog=$('#share-dialog'),download=$('#share-download'),native=$('#share-native');
      shareText=orderMode?F.orderText(value):['Pizzeria Pulcinella · Patù',F.pizzaText(value),'pulcinellapatu.it'].join('\n');$('#share-title').textContent=I.text(orderMode?'Condividi l’ordine':'Condividi la pizza');
      const description=$('#share-description');description.setAttribute('data-no-translate','');description.textContent=shareText;
      $('#share-status').textContent=I.text('Prepariamo la condivisione…');$('#share-manual-copy').hidden=true;download.hidden=true;native.disabled=true;native.hidden=typeof navigator.share!=='function';
      $('#share-thumbnail').hidden=orderMode;if(!orderMode)renderThumbnail($('#share-thumbnail'),value.design);dialog.showModal();
      try{
        const file=await(orderMode?makeOrderFile(value):makePizzaFile(value));if(generation!==shareGeneration||!dialog.open)return;
        shareFile=file;shareURL=URL.createObjectURL(file);download.href=shareURL;download.download=file.name;download.textContent=I.text(orderMode?'Scarica PDF':'Scarica immagine');download.hidden=false;native.disabled=false;$('#share-status').textContent='';
      }catch{if(generation===shareGeneration){$('#share-status').textContent=I.text('Impossibile preparare il file. Puoi copiare il riepilogo.');native.disabled=false;}}
    }
    $('#share-pizza').addEventListener('click',()=>{if(isReady())openShare(current());});
    $('#share-order').addEventListener('click',()=>{const order=getOrder();if(order.lines.length)openShare(order,true);});
    $('#share-native').addEventListener('click',async()=>{
      if(typeof navigator.share!=='function')return;let files=false;try{files=!!shareFile&&!!navigator.canShare?.({files:[shareFile]});}catch{}
      try{await navigator.share({title:$('#share-title').textContent,text:shareText,...(files?{files:[shareFile]}:{})});}
      catch(error){if(error.name!=='AbortError')$('#share-status').textContent=I.text('Condivisione non disponibile. Puoi copiare il riepilogo.');}
    });
    $('#share-copy').addEventListener('click',async()=>{
      try{if(!navigator.clipboard?.writeText)throw new Error('No clipboard');await navigator.clipboard.writeText(shareText);$('#share-status').textContent=I.text('Riepilogo copiato.');}
      catch{const field=$('#share-manual-copy');field.value=shareText;field.hidden=false;field.focus();field.select();}
    });
    $('#share-dialog').addEventListener('close',clearShare);root.addEventListener('pagehide',clearShare);
    root.addEventListener('storage',event=>{if(event.key===storage){readFavorites();sync();}});
    root.addEventListener('pizza-panel-change',event=>{if(event.detail.panel==='menu')renderFavorites();});
    function refreshLanguage(){dismissNotice();favoritesRenderKey=variationKey='';sync();$('#favorites-toggle').setAttribute('aria-label',I.text(favoritesView?'Mostra le pizze del menu':'Mostra le pizze preferite'));if($('#share-dialog').open)$('#share-dialog').close();}
    readFavorites();sync();return{sync,confirm,refreshLanguage};
  }
  root.PizzaExperienceUI={create};
})(window);
