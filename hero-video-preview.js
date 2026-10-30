(()=>{
  'use strict';
  const hero=document.querySelector('.hero-video-preview');
  if(!hero)return;
  const video=hero.querySelector('video'),button=hero.querySelector('.hero-video-toggle');
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const labels={
    it:['Metti in pausa il video del forno','Riproduci il video del forno'],
    en:['Pause oven video','Play oven video'],es:['Pausar el vídeo del horno','Reproducir el vídeo del horno'],
    pt:['Pausar o vídeo do forno','Reproduzir o vídeo do forno'],fr:['Mettre en pause la vidéo du four','Lire la vidéo du four'],
    de:['Ofenvideo pausieren','Ofenvideo abspielen'],sv:['Pausa ugnsvideon','Spela ugnsvideon'],
    nl:['Ovenvideo pauzeren','Ovenvideo afspelen'],ru:['Приостановить видео печи','Воспроизвести видео печи'],zh:['暂停烤炉视频','播放烤炉视频']
  };
  let visible=false,userPaused=false,failed=false,pending=false;
  video.muted=true;
  function wanted(){return visible&&!document.hidden&&!reduce.matches&&!userPaused&&!failed;}
  function sync(){
    const language=document.documentElement.lang.split('-')[0];
    if(button){
      button.hidden=reduce.matches||failed;
      button.setAttribute('aria-label',(labels[language]||labels.it)[userPaused?1:0]);
      button.setAttribute('aria-pressed',String(userPaused));
    }
    hero.dataset.videoState=failed?'unavailable':reduce.matches?'reduced':userPaused?'paused':document.hidden?'hidden':visible?(video.paused?'loading':'playing'):'offscreen';
    if(!wanted()){video.pause();return;}
    if(!video.getAttribute('src')){video.src=video.dataset.src;video.load();}
    if(video.paused&&!pending){
      pending=true;
      video.play().catch(()=>{if(wanted()){userPaused=true;}}).finally(()=>{pending=false;if(!wanted())video.pause();syncLabel();});
    }
  }
  function syncLabel(){
    const language=document.documentElement.lang.split('-')[0];
    button?.setAttribute('aria-label',(labels[language]||labels.it)[userPaused?1:0]);
    button?.setAttribute('aria-pressed',String(userPaused));
    if(userPaused)hero.dataset.videoState='paused';
  }
  video.addEventListener('playing',()=>{hero.dataset.videoReady='true';hero.dataset.videoState='playing';if(!wanted())sync();});
  video.addEventListener('error',()=>{failed=true;hero.dataset.videoReady='false';sync();});
  button?.addEventListener('click',()=>{userPaused=!userPaused;sync();});
  document.addEventListener('visibilitychange',sync);
  reduce.addEventListener('change',sync);
  new MutationObserver(syncLabel).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(hero);
  else{visible=true;}
  sync();
})();
