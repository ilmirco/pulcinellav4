(() => {
  'use strict';
  function mount(select){
    const wrapper=select.parentElement;if(wrapper.classList.contains('language-picker'))return;
    const label=option=>option.textContent.replace(/[\u{1F1E6}-\u{1F1FF}]/gu,'').trim();
    const trigger=document.createElement('button'),name=document.createElement('span'),list=document.createElement('ul'),flag=wrapper.querySelector('.language-flag');
    const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg'),path=document.createElementNS('http://www.w3.org/2000/svg','path');
    trigger.type='button';trigger.className='language-picker-trigger';trigger.id=select.id+'-trigger';trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');trigger.setAttribute('data-no-translate','');
    name.className='language-picker-name';arrow.setAttribute('viewBox','0 0 20 20');arrow.setAttribute('aria-hidden','true');path.setAttribute('d','m5 8 5 5 5-5');arrow.append(path);
    list.className='language-picker-options';list.id=select.id+'-options';list.setAttribute('role','listbox');list.setAttribute('data-no-translate','');list.hidden=true;
    trigger.setAttribute('aria-controls',list.id);trigger.append(flag,name,arrow);
    const items=Array.from(select.options).map(option=>{
      const item=document.createElement('li'),icon=document.createElement('span'),text=document.createElement('span'),check=document.createElement('span');
      item.id=select.id+'-option-'+option.value;item.dataset.language=option.value;item.setAttribute('role','option');item.tabIndex=-1;
      icon.className='language-flag';icon.dataset.language=option.value;icon.setAttribute('aria-hidden','true');text.textContent=label(option);text.lang=option.value;
      check.className='language-picker-check';check.textContent='✓';check.setAttribute('aria-hidden','true');item.append(icon,text,check);list.append(item);return item;
    });
    function update(){const selected=select.selectedOptions[0];if(!selected)return;flag.dataset.language=selected.value;name.textContent=label(selected);const aria=select.getAttribute('aria-label')||'Lingua';trigger.setAttribute('aria-label',aria+': '+label(selected));list.setAttribute('aria-label',aria);for(const item of items)item.setAttribute('aria-selected',String(item.dataset.language===selected.value));}
    function close(focus=false){list.hidden=true;trigger.setAttribute('aria-expanded','false');typed='';clearTimeout(typingTimer);items.forEach(item=>item.tabIndex=-1);if(focus)trigger.focus({preventScroll:true});}
    function fit(){wrapper.style.setProperty('--language-menu-height',Math.max(100,innerHeight-trigger.getBoundingClientRect().bottom-16)+'px');}
    function focusItem(item){items.forEach(candidate=>candidate.tabIndex=candidate===item?0:-1);item.focus({preventScroll:true});item.scrollIntoView({block:'nearest'});}
    function open(last=false){update();fit();list.hidden=false;trigger.setAttribute('aria-expanded','true');focusItem(last?items.at(-1):items.find(item=>item.dataset.language===select.value)||items[0]);}
    function choose(item){select.value=item.dataset.language;select.dispatchEvent(new Event('change',{bubbles:true}));update();close(true);}
    trigger.addEventListener('click',()=>list.hidden?open():close(true));
    trigger.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();open(event.key==='ArrowUp'||event.key==='End');if(event.key==='Home')focusItem(items[0]);}});
    list.addEventListener('click',event=>{const item=event.target.closest('[role="option"]');if(item)choose(item);});
    let typed='',typingTimer;
    list.addEventListener('keydown',event=>{
      const index=items.indexOf(document.activeElement);let next;
      if(event.key==='ArrowDown')next=(index+1)%items.length;else if(event.key==='ArrowUp')next=(index+items.length-1)%items.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=items.length-1;
      else if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);return;}
      else if(event.key==='Tab'){close(true);return;}
      else if(event.key==='Enter'||event.key===' '){event.preventDefault();if(index>=0)choose(items[index]);return;}
      else if(event.key.length===1&&!event.ctrlKey&&!event.altKey&&!event.metaKey){typed+=event.key.toLocaleLowerCase();clearTimeout(typingTimer);typingTimer=setTimeout(()=>typed='',650);const match=items.find(item=>item.textContent.replace('✓','').trim().toLocaleLowerCase().startsWith(typed));if(match){event.preventDefault();focusItem(match);}return;}
      if(next!==undefined){event.preventDefault();focusItem(items[next]);}
    });
    document.addEventListener('pointerdown',event=>{if(!wrapper.contains(event.target))close();});
    document.addEventListener('focusin',event=>{if(!wrapper.contains(event.target))close();});
    window.addEventListener('resize',()=>{if(!list.hidden)fit();});
    select.addEventListener('change',update);window.addEventListener('pizza-language-change',update);window.addEventListener('pageshow',()=>{update();close();});
    new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    new MutationObserver(update).observe(select,{attributes:true,attributeFilter:['aria-label']});
    wrapper.append(trigger,list);wrapper.classList.add('language-picker');select.hidden=true;update();
  }
  function init(){document.querySelectorAll('#config-language,#lang-selector').forEach(mount);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
