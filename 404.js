(() => {
  'use strict';
  const fields=['label','title','description','home','menu','compose','privacy','language'];
  const copy={
    it:['Pagina non trovata','Questa pagina non è nel menù.','Il collegamento potrebbe essere cambiato. Riparti dalla home oppure scegli la tua prossima pizza.','Torna alla home','Scopri il menù','Componi la tua pizza','Privacy e dati','Seleziona la lingua'],
    en:['Page not found','This page is off the menu.','The link may have changed. Head back to the homepage or choose your next pizza.','Back to home','Explore the menu','Build your pizza','Privacy and your data','Choose your language'],
    fr:['Page introuvable','Cette page n’est pas au menu.','Le lien a peut-être changé. Revenez à l’accueil ou choisissez votre prochaine pizza.','Retour à l’accueil','Découvrir le menu','Composez votre pizza','Confidentialité et données','Choisir la langue'],
    de:['Seite nicht gefunden','Diese Seite steht nicht auf der Karte.','Der Link hat sich vielleicht geändert. Zurück zur Startseite oder zur nächsten Pizza.','Zur Startseite','Speisekarte ansehen','Pizza zusammenstellen','Datenschutz und Daten','Sprache wählen'],
    es:['Página no encontrada','Esta página no está en el menú.','Puede que el enlace haya cambiado. Vuelve al inicio o elige tu próxima pizza.','Volver al inicio','Descubre el menú','Crea tu pizza','Privacidad y datos','Selecciona el idioma'],
    pt:['Página não encontrada','Esta página não está no menu.','A ligação pode ter mudado. Volte ao início ou escolha a sua próxima pizza.','Voltar ao início','Descubra o menu','Crie a sua pizza','Privacidade e dados','Selecionar idioma'],
    zh:['未找到页面','这页不在菜单上。','链接可能已更改。请返回首页，或选择您的下一份披萨。','返回首页','查看菜单','定制你的披萨','隐私与数据','选择语言'],
    sv:['Sidan hittades inte','Den här sidan finns inte på menyn.','Länken kan ha ändrats. Gå tillbaka till startsidan eller välj din nästa pizza.','Till startsidan','Se menyn','Skapa din pizza','Integritet och data','Välj språk'],
    nl:['Pagina niet gevonden','Deze pagina staat niet op het menu.','De link is misschien gewijzigd. Ga terug naar de homepage of kies je volgende pizza.','Naar de homepage','Bekijk het menu','Stel je pizza samen','Privacy en gegevens','Kies je taal'],
    ru:['Страница не найдена','Этой страницы нет в меню.','Возможно, ссылка изменилась. Вернитесь на главную или выберите свою следующую пиццу.','На главную','Посмотреть меню','Соберите свою пиццу','Конфиденциальность и данные','Выберите язык']
  };
  const select=document.querySelector('#lang-selector');
  function apply(value,persist=false){
    const lang=Object.hasOwn(copy,value)?value:'it';
    const text=Object.fromEntries(fields.map((field,i)=>[field,copy[lang][i]]));
    document.documentElement.lang=lang;document.title=text.label+' | Pizzeria Pulcinella';
    document.querySelector('meta[name=description]').content=text.description;
    document.querySelectorAll('[data-error-copy]').forEach(node=>node.textContent=text[node.dataset.errorCopy]);
    select.value=lang;select.setAttribute('aria-label',text.language);
    document.querySelector('#home-language-flag').dataset.language=lang;
    document.querySelectorAll('[data-error-home]').forEach(link=>link.href='/?lang='+lang);
    document.querySelector('#error-menu').href='/?lang='+lang+'#menu';
    document.querySelector('#error-compose').href='/componi/?lang='+lang;
    document.querySelector('#error-privacy').href='/privacy.html?lang='+lang;
    // Keep the requested missing path; changing the language must not hide the 404.
    if(persist){try{localStorage.setItem('preferredLanguage',lang);}catch{}const url=new URL(location.href);url.searchParams.set('lang',lang);history.replaceState(null,'',url.pathname+url.search+url.hash);}
  }
  let saved;try{saved=localStorage.getItem('preferredLanguage');}catch{}
  const requested=new URL(location.href).searchParams.get('lang');
  apply(Object.hasOwn(copy,requested)?requested:saved);
  select.addEventListener('change',()=>apply(select.value,true));
  window.addEventListener('storage',event=>{if(event.key==='preferredLanguage')apply(event.newValue);});
})();
