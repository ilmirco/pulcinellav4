(function(root){
  'use strict';
  function create({getDesign,isReady,choose,empty,select,createRecipePreviews}){
    const P=root.Pulcinella,Q=root.PizzaFormats,I=root.PizzaI18n,$=s=>document.querySelector(s),dialog=$('#pizza-picker-dialog'),search=$('#pizza-picker-search'),list=$('#pizza-picker-list');
    const previews=createRecipePreviews(list);let renderKey='';
    const fold=value=>value.toLocaleLowerCase(I.locale).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
    function render(){
      const design=getDesign(),query=fold(search.value.trim()),key=JSON.stringify([design.format,design.meterParts,design.active,Q.sections(design),I.language,query,isReady()]);if(key===renderKey)return;renderKey=key;
      const focused=document.activeElement?.closest('[data-picker-recipe]')?.dataset.pickerRecipe,top=list.scrollTop,selected=P.match(Q.current(design))?.id||(Object.keys(Q.current(design)).length?null:'empty'),parts=$('#pizza-picker-parts');
      $('#pizza-picker-context').textContent=design.format==='round'?Q.formats.round.name:Q.formats[design.format].name+' · '+Q.partLabel(design,design.active);
      const focusedPart=document.activeElement?.closest('[data-picker-part]')?.dataset.pickerPart;parts.hidden=design.format==='round';parts.replaceChildren();
      if(!parts.hidden)Q.sections(design).forEach((_,index)=>{const button=el('button','','');button.type='button';button.dataset.pickerPart=String(index);button.setAttribute('aria-pressed',String(index===design.active));button.disabled=!isReady();button.append(el('small','',Q.partLabel(design,index)),el('span','',Q.sectionName(design,index)));parts.append(button);});
      previews.reset();list.replaceChildren();
      const add=(id,name,detail,cost)=>{const button=el('button','pizza-picker-item'),thumb=el('span','pizza-thumb recipe-preview is-loading'),copy=el('span','pizza-picker-copy'),heading=el('span','pizza-picker-item-heading'),title=el('strong','',name),price=el('span','pizza-picker-cost',cost),description=el('span','pizza-picker-description',detail),check=el('span','pizza-picker-check','✓');button.type='button';button.dataset.pickerRecipe=id;button.setAttribute('aria-pressed',String(id===selected));button.disabled=!isReady();thumb.setAttribute('aria-hidden','true');check.setAttribute('aria-hidden','true');heading.append(title,price);copy.append(heading,description);button.append(thumb,copy,check);list.append(button);previews.watch(thumb,id);};
      const dough=I.text('Solo impasto');if(!query||fold(dough).includes(query))add('empty',dough,I.text('Scegli gli ingredienti'),'');
      for(const recipe of P.menu){const aliases=Object.values(I.catalog[recipe.name]||{}).join(' '),description=P.ingredients.filter(item=>recipe.servings[item.id]).map(item=>item.name).join(', ');if(query&&!fold(recipe.name+' '+recipe.id+' '+aliases+' '+description).includes(query))continue;add(recipe.id,recipe.name,description,design.format==='round'?P.money(recipe.price):'');}
      $('#pizza-picker-empty').hidden=list.children.length>0;list.scrollTop=top;
      if(focusedPart!==undefined)parts.querySelector('[data-picker-part="'+focusedPart+'"]')?.focus({preventScroll:true});
      if(focused)list.querySelector('[data-picker-recipe="'+focused+'"]')?.focus({preventScroll:true});
    }
    function sync(){$('#pizza-picker-open').disabled=!isReady();if(dialog.open)render();}
    function open(){if(!isReady()||dialog.open)return;search.value='';renderKey='';dialog.showModal();render();list.scrollTop=0;search.focus({preventScroll:true});}
    $('#pizza-picker-open').addEventListener('click',open);
    search.addEventListener('input',render);search.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();list.querySelector('button:not(:disabled)')?.focus();}});
    list.addEventListener('click',event=>{const button=event.target.closest('[data-picker-recipe]');if(!button||button.disabled)return;const id=button.dataset.pickerRecipe;if(id==='empty')empty();else choose(id);if(getDesign().format==='meter'){renderKey='';render();}else dialog.close();});
    $('#pizza-picker-parts').addEventListener('click',event=>{const button=event.target.closest('[data-picker-part]');if(button&&!button.disabled)select(Number(button.dataset.pickerPart));});
    return{sync,open};
  }
  root.PizzaPickerUI={create};
})(window);
