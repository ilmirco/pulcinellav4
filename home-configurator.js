(() => {
  const copy = {
    it: ['Componi la tua pizza', 'La tua pizza, come piace a te.', 'Scegli una pizza del menu o crea la tua combinazione di ingredienti.'],
    en: ['Build your pizza', 'Your pizza, your way.', 'Choose a pizza from the menu or create your own combination of ingredients.'],
    fr: ['Composez votre pizza', 'Votre pizza, à votre goût.', 'Choisissez une pizza du menu ou composez votre propre recette.'],
    de: ['Pizza zusammenstellen', 'Deine Pizza, ganz nach deinem Geschmack.', 'Wähle eine Pizza aus der Speisekarte oder kombiniere deine Lieblingszutaten.'],
    es: ['Crea tu pizza', 'Tu pizza, a tu gusto.', 'Elige una pizza del menú o crea tu propia combinación de ingredientes.'],
    pt: ['Crie a sua pizza', 'A sua pizza, ao seu gosto.', 'Escolha uma pizza do menu ou crie a sua combinação de ingredientes.'],
    zh: ['定制你的披萨', '你的披萨，由你选择。', '从菜单中选择披萨，或搭配你喜欢的食材。'],
    sv: ['Skapa din pizza', 'Din pizza, precis som du vill ha den.', 'Välj en pizza från menyn eller kombinera dina favoritingredienser.'],
    nl: ['Stel je pizza samen', 'Jouw pizza, zoals jij die wilt.', 'Kies een pizza van het menu of combineer je favoriete ingrediënten.'],
    ru: ['Соберите свою пиццу', 'Ваша пицца — на ваш вкус.', 'Выберите пиццу из меню или создайте свою комбинацию ингредиентов.']
  };
  const mapCopy={it:'Apri Google Maps',en:'Open Google Maps',fr:'Ouvrir Google Maps',de:'Google Maps öffnen',es:'Abrir Google Maps',pt:'Abrir Google Maps',zh:'打开 Google Maps',sv:'Öppna Google Maps',nl:'Open Google Maps',ru:'Открыть Google Maps'};
  function update() {
    const entries = copy[document.documentElement.lang] || copy.it;
    document.querySelector('#home-language-flag').dataset.language=copy[document.documentElement.lang]?document.documentElement.lang:'it';
    const lang=copy[document.documentElement.lang]?document.documentElement.lang:'it';
    document.querySelectorAll('a[href^="privacy.html"]').forEach(link=>link.href='privacy.html?lang='+lang);
    const map=document.querySelector('[data-map-link]');if(map){map.setAttribute('aria-label',mapCopy[lang]);map.querySelector('[data-map-label]').textContent=mapCopy[lang];}
    document.querySelectorAll('[data-config-copy]').forEach(el => {
      el.textContent = entries[Number(el.dataset.configCopy)];
      if(el.tagName==='A'&&el.dataset.configCopy==='0')el.href='componi/?lang='+document.documentElement.lang;
    });
  }
  function syncPreferred(){try{const lang=localStorage.getItem('preferredLanguage');if(copy[lang]&&lang!==document.documentElement.lang){window.switchLanguage(lang);document.querySelector('#lang-selector').value=lang;}}catch{}update();}
  document.addEventListener('DOMContentLoaded', syncPreferred);
  window.addEventListener('pageshow',syncPreferred);
  window.addEventListener('storage',event=>{if(event.key==='preferredLanguage')syncPreferred();});
  document.querySelector('#lang-selector').addEventListener('change',()=>{update();const url=new URL(location.href);if(url.searchParams.has('lang')){url.searchParams.set('lang',document.documentElement.lang);history.replaceState(null,'',url.pathname+url.search+url.hash);}});
})();
