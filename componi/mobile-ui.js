(function(root){
  'use strict';
  function create({getDesign,isReady,choose,empty,undo,reset,onLayout,createRecipePreviews}){
    const P=root.Pulcinella,Q=root.PizzaFormats,I=root.PizzaI18n,$=s=>document.querySelector(s);
    const layout=root.matchMedia('(max-width:820px) and (orientation:portrait), (max-width:500px)');
    const panels={ingredients:$('#ingredienti'),menu:$('#menu-tools'),recipe:$('.recipe')};
    const menuReturn=$('#menu-return'),menuReturnHome=menuReturn.parentElement;
    const tabs=[...document.querySelectorAll('[data-composer-panel]')];
    const sheet=root.PizzaMobileSheet.create({bar:$('#mobile-panel-bar'),workspace:$('.workspace'),toggle:$('#mobile-sheet-toggle'),layout,getFormat:()=>getDesign().format});
    $('#mobile-pantry-search').addEventListener('click',()=>{sheet.expand();$('#search').focus({preventScroll:true});});
    const previews=createRecipePreviews($('#mobile-menu-grid'));let active='ingredients',menuLanguage='',query='';
    function setPanel(name,{focus=false}={}){
      if(!panels[name])return;
      active=name;document.body.dataset.composerView=name;
      $('#mobile-composer-tabs').style.setProperty('--composer-tab-index',String(tabs.findIndex(tab=>tab.dataset.composerPanel===name)));
      tabs.forEach(tab=>{const selected=tab.dataset.composerPanel===name;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;});
      if(focus)tabs.find(tab=>tab.dataset.composerPanel===name).focus({preventScroll:true});
      root.dispatchEvent(new CustomEvent('pizza-panel-change',{detail:{panel:name}}));
    }
    tabs.forEach(tab=>tab.addEventListener('click',()=>setPanel(tab.dataset.composerPanel)));
    $('.skip-link').addEventListener('click',()=>{if(layout.matches)setPanel('ingredients');});
    $('#mobile-composer-tabs').addEventListener('keydown',event=>{
      const index=tabs.indexOf(document.activeElement);if(index<0)return;
      let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;
      event.preventDefault();setPanel(tabs[next].dataset.composerPanel,{focus:true});
    });
    $('#mobile-undo').addEventListener('click',undo);$('#mobile-reset').addEventListener('click',reset);
    $('#pizza-stage').addEventListener('click',()=>{if(layout.matches&&getDesign().format==='round'&&isReady())$('#mobile-zoom').click();});
    function renderMenu(){
      const grid=$('#mobile-menu-grid');previews.reset();grid.replaceChildren();
      const clean=value=>value.toLocaleLowerCase(I.locale).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      const add=(id,name,price,number)=>{const button=document.createElement('button');button.type='button';button.dataset.mobilePreset=id;button.className='mobile-menu-card';
        const n=document.createElement('small'),thumb=document.createElement('span'),title=document.createElement('strong'),cost=document.createElement('span');thumb.className='pizza-thumb recipe-preview is-loading';thumb.setAttribute('aria-hidden','true');n.textContent=number?String(number).padStart(2,'0'):'+';title.textContent=name;cost.textContent=price===null?I.text('Scegli gli ingredienti'):P.money(price);button.append(n,thumb,title,cost);grid.append(button);previews.watch(thumb,id);};
      if(!query||clean(I.text('Solo impasto')).includes(clean(query)))add('empty',I.text('Solo impasto'),null,null);
      for(const recipe of P.menu){const aliases=Object.values(I.catalog[recipe.name]||{}).join(' ');if(query&&!clean(recipe.name+' '+recipe.id+' '+aliases).includes(clean(query)))continue;add(recipe.id,recipe.name,recipe.price,recipe.number);}
      $('#mobile-menu-empty').hidden=grid.children.length>0;menuLanguage=I.language;
    }
    $('#pizza-search').addEventListener('input',event=>{query=event.target.value.trim();renderMenu();sync();});
    for(const input of [$('#search'),$('#pizza-search')])input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();input.blur();}});
    $('#mobile-menu-grid').addEventListener('click',event=>{const button=event.target.closest('[data-mobile-preset]');if(!button||button.disabled)return;if(button.dataset.mobilePreset==='empty')empty();else choose(button.dataset.mobilePreset);});
    function sync(){
      sheet.sync();
      if(!layout.matches)return;
      $('#composer-tab-ingredients').textContent=I.catalog['Aggiunte (catalogo)'][I.language];
      if(menuLanguage!==I.language)renderMenu();
      const design=getDesign(),current=P.match(Q.current(design)),selectedId=current?.id||(Object.keys(Q.current(design)).length?null:'empty');
      $('#stage-label').textContent=design.format==='round'?Q.title(design):Q.partLabel(design,design.active)+' · '+Q.sectionName(design,design.active);
      $('#mobile-undo').disabled=$('#undo').disabled;$('#mobile-reset').disabled=!isReady();
      for(const button of $('#mobile-menu-grid').children){button.disabled=!isReady();button.setAttribute('aria-pressed',String(button.dataset.mobilePreset===selectedId));const recipe=P.menu.find(item=>item.id===button.dataset.mobilePreset);if(recipe)button.lastElementChild.textContent=design.format==='round'?P.money(recipe.price):I.text('Scegli questo gusto');}
    }
    function updateLayout(){
      document.body.classList.toggle('mobile-composer',layout.matches);
      if(layout.matches)panels.recipe.append(menuReturn);else menuReturnHome.append(menuReturn);
      for(const [name,panel] of Object.entries(panels)){if(layout.matches){panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','composer-tab-'+name);}else{panel.removeAttribute('role');panel.removeAttribute('aria-labelledby');}}
      setPanel(active);sheet.sync();if(layout.matches)sync();
    }
    layout.addEventListener('change',()=>{updateLayout();onLayout();});updateLayout();
    return{sync,setPanel,revealPizza:()=>sheet.reveal(),get active(){return active;},get matches(){return layout.matches;}};
  }
  root.PizzaMobileUI={create};
})(window);
