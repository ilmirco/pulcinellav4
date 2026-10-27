(function(root){
  'use strict';
  const I=typeof module!=='undefined'&&module.exports?require('./i18n.js'):root.PizzaI18n;
  // count = pieces in ONE complete visual serving. Sizes are fractions of pizza diameter.
  const rows = [
    ['tomato','Pomodoro','base','formaggi',9,1,.79,0],
    ['fior','Fior di latte','formaggi','formaggi',0,19,.16,1],
    ['mushroom','Funghi freschi','orto','orto',0,36,0.115,3],
    ['salami','Salamino piccante','salumi','carni',0,18,0.115,3],
    ['ham','Prosciutto cotto','salumi','carni',1,12,0.17,3],
    ['cherry','Pomodorini freschi','orto','orto',1,28,0.085,3],
    ['rocket','Rucola','orto','orto',3,88,0.105,5],
    ['olive','Olive','orto','orto',9,16,0.058,4],
    ['green-olive','Olive verdi','orto','orto',9,16,0.058,4],
    ['black-olive','Olive nere','orto','orto',8,16,0.058,4],
    ['pepper','Peperoni grigliati','orto','orto',4,18,0.145,3],
    ['aubergine','Melanzane grigliate','orto','orto',5,14,0.15,3],
    ['zucchini','Zucchine grigliate','orto','orto',6,16,0.13,3],
    ['tropea','Cipolla di Tropea','orto','orto',7,26,0.11,4],
    ['artichoke','Carciofini','orto','orto',10,9,0.125,3],
    ['porcini','Funghi porcini trifolati','orto','orto',11,20,0.16,3],
    ['fries','Patate fritte','orto','orto',12,54,0.135,4],
    ['friarielli','Friarelli · rape saltate','orto','orto',13,36,0.12,3],
    ['wurstel','Würstel','salumi','carni',4,28,0.08,3],
    ['sausage','Salsiccia fresca','salumi','carni',3,28,0.085,3],
    ['prosciutto','Prosciutto crudo','salumi','carni',2,10,0.2,4],
    ['speck','Speck','salumi','carni',5,13,0.17,4],
    ['guanciale','Guanciale di maiale','salumi','carni',6,14,0.165,3],
    ['bacon','Bacon','salumi','carni',7,16,0.15,3],
    ['pancetta','Pancetta fumè','salumi','carni',8,20,0.145,3],
    ['bresaola','Bresaola','salumi','carni',9,10,0.21,4],
    ['nduja','Nduja calabrese','salumi','carni',10,23,0.105,3],
    ['bufala','Mozzarella di bufala','formaggi','formaggi',1,12,0.2,2],
    ['grana','Grana a scaglie','formaggi','formaggi',2,60,0.07,6],
    ['ricotta','Ricotta fresca','formaggi','formaggi',3,14,0.145,2],
    ['fontina','Fontina','formaggi','formaggi',4,18,0.13,1],
    ['provola','Provola','formaggi','formaggi',5,18,0.13,1],
    ['gorgonzola','Gorgonzola','formaggi','formaggi',6,20,0.09,2],
    ['scamorza','Scamorza affumicata','formaggi','formaggi',7,16,0.135,1],
    ['smoked-provola','Provola affumicata','formaggi','formaggi',8,18,0.135,1],
    ['tuna','Tonno','mare','carni',11,26,0.115,3],
    ['anchovy','Acciughe','mare','carni',12,13,0.125,3],
    ['caper','Capperi','orto','carni',13,30,0.03,4],
    ['garlic','Aglio','extra','carni',14,22,0.048,4],
    ['oregano','Origano','extra','carni',15,240,0.0185,5],
    ['walnut','Noci','extra','orto',14,18,0.06,4],
    ['chili','Peperoncino','extra','orto',15,22,0.05,4]
  ];
  const ingredients = rows.map(([id,name,category,atlas,cell,count,size,layer])=>Object.freeze(I.bind({id,name,originalName:name,category,atlas,cell,count,size,layer},['name'])));
  const byId = Object.fromEntries(ingredients.map(i=>[i.id,i]));
  const categories = {all:'Tutti',orto:'Verdure',salumi:'Salumi',formaggi:'Formaggi',mare:'Mare',extra:'Aromi',base:'Base'};
  I.bind(categories,Object.keys(categories));
  const menuRows = [
    ['marinara','Marinara',450,'tomato oregano garlic'],
    ['margherita','Margherita',550,'tomato fior olive'],
    ['funghi','Funghi freschi',700,'mushroom tomato fior'],
    ['wurstel','Würstel',700,'wurstel tomato fior'],
    ['primavera','Primavera',750,'cherry rocket tomato fior'],
    ['bufalona','Bufalona',750,'bufala olive tomato'],
    ['chips','Chips',750,'fries tomato fior'],
    ['salsiccia','Salsiccia',750,'sausage tomato fior'],
    ['napoli','Napoli',750,'anchovy oregano caper black-olive tomato fior'],
    ['diavola','Diavola',750,'salami tomato fior'],
    ['prosciutella','Prosciutella',750,'ham olive tomato fior'],
    ['verdure','Verdure',850,'pepper aubergine zucchini tomato fior'],
    ['prosciutto-funghi','Prosciutto e funghi',850,'ham mushroom olive tomato fior'],
    ['tonno-cipolla','Tonno e cipolla',850,'tuna tropea tomato fior'],
    ['contadina','Contadina',850,'salami mushroom tomato fior'],
    ['quattro-formaggi','Quattro formaggi',850,'fior fontina provola gorgonzola tomato'],
    ['america','America',900,'wurstel fries tomato fior'],
    ['quattro-stagioni','Quattro stagioni',900,'ham mushroom artichoke olive tomato fior'],
    ['prelibatezza','Prelibatezza',950,'prosciutto grana rocket tomato fior'],
    ['capricciosa','Capricciosa',950,'artichoke pepper salami caper black-olive tomato fior'],
    ['caprese','Caprese',1000,'cherry prosciutto grana rocket fior'],
    ['anima-core','Anima e core',800,'bufala cherry'],
    ['calabrese','Calabrese',800,'nduja tropea oregano tomato fior'],
    ['dolcepiccante','Dolcepiccante',850,'nduja ricotta tomato fior'],
    ['guancia','Guancia a guancia',850,'guanciale provola tomato fior'],
    ['bomba','Bomba',850,'salami gorgonzola chili tomato fior'],
    ['tirolese','Tirolese',850,'speck scamorza tomato fior'],
    ['campagnola','Campagnola',900,'sausage mushroom tomato fior'],
    ['pulcinella','Pulcinella',900,'ricotta grana rocket cherry walnut fior'],
    ['pepper-dry','Pepper dry',900,'pepper sausage tomato fior'],
    ['ghiottona','Ghiottona',900,'sausage fries tomato fior'],
    ['fume','Fumè',900,'smoked-provola pancetta rocket tomato fior'],
    ['golosa','Golosa',900,'salami fries tomato fior'],
    ['fuoco','Fuoco',900,'nduja pepper salami chili tomato fior'],
    ['brooklyn','Brooklyn',950,'bacon tropea fries tomato fior'],
    ['friarelli','Friarelli',1000,'friarielli sausage fior'],
    ['sottobosco','Sottobosco',1000,'porcini sausage grana tomato fior'],
    ['bresaola','Bresaola',1000,'bresaola rocket grana tomato fior'],
    ['consigliata','Consigliata',1000,'speck bufala grana rocket cherry'],
    ['porcina','Porcina',1000,'porcini gorgonzola provola fior']
  ];
  const menu = menuRows.map(([id,name,price,ids],i)=>({id,name,price,number:i+1,servings:Object.fromEntries(ids.split(' ').map(x=>[x,1]))}));
  menu.forEach(recipe=>I.bind(recipe,['name']));
  const MAX_SERVINGS = 2;
  const EXTRA_RATIO = .7, FOOD_RADIUS = .428;
  function pieceCount(id,selection){const count=byId[id]?.count||0;return selection===2?count+Math.round(count*EXTRA_RATIO):selection===1?count:0;}
  // Rows = tomato portions; columns = fior di latte portions. Each is a coherent baked pizza.
  const baseAssets = Object.freeze([
    Object.freeze(['base-impasto.png','base-bianca.png','base-bianca-fior-doppio.png']),
    Object.freeze(['base-rossa.png','base-rossa-fior-v26.png','base-rossa-fior-doppio.png']),
    Object.freeze(['base-pomodoro-doppio.png','base-pomodoro-doppio-fior.png','base-pomodoro-doppio-fior-doppio.png'])
  ]);
  function normalize(raw){
    const safe={};
    if(!raw || typeof raw!=='object' || Array.isArray(raw))return safe;
    for(const i of ingredients){const n=raw[i.id];if(typeof n==='number' && Number.isFinite(n) && n>=1)safe[i.id]=Math.min(MAX_SERVINGS,Math.floor(n));}
    if(typeof raw.onion==='number'&&Number.isFinite(raw.onion)&&raw.onion>=1)safe.tropea=Math.min(MAX_SERVINGS,Math.max(safe.tropea||0,Math.floor(raw.onion)));
    // Restore the former menu Capricciosa with its corrected black olives.
    if(safe.olive&&!safe['black-olive']&&Object.keys(safe).sort().join(',')==='artichoke,caper,fior,olive,pepper,salami,tomato'){safe['black-olive']=safe.olive;delete safe.olive;}
    return safe;
  }
  function change(raw,id,delta){
    const result=normalize(raw);if(!byId[id] || !Number.isFinite(delta))return result;
    const n=Math.max(0,Math.min(MAX_SERVINGS,(result[id]||0)+Math.trunc(delta)));
    if(n)result[id]=n;else delete result[id];return result;
  }
  // White pizzas use the richer photo base; recipe quantities and supplements stay separate.
  function visualFior(raw){const s=normalize(raw);return !s.tomato&&(s.fior||s.bufala)?2:s.fior||0;}
  function baseFor(raw){const s=normalize(raw);return baseAssets[s.tomato||0][visualFior(s)];}
  function baseLayers(raw){
    const s=normalize(raw),tomato=Math.min(s.tomato||0,1),fior=visualFior(s);
    return{foundation:tomato*3+(tomato?Math.min(fior,1):fior),tomato:s.tomato===2?6+Math.min(fior,1):null,fior:tomato&&fior===2?5:null,...(!tomato&&!fior?{rim:4}:{})};
  }
  function same(a,b){const x=normalize(a),y=normalize(b);return ingredients.every(i=>(x[i.id]||0)===(y[i.id]||0));}
  function match(raw){const servings=normalize(raw);return menu.find(r=>same(servings,r.servings))||null;}
  function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
  function random(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function oliveGarnish(raw){
    const s=normalize(raw),base={...s};if(base.tomato)base.tomato=1;if(base.fior)base.fior=1;
    if(match(base)?.id==='margherita')return true;
    if(s.olive!==1||!s.ham||!s.tomato||!s.fior)return false;
    return Object.keys(s).every(id=>['tomato','fior','ham','olive','mushroom'].includes(id));
  }
  function pieces(raw,{scaleFor=()=>1,arrange=true,density=1}={}){
    const servings=normalize(raw), out=[],garnish=oliveGarnish(servings);
    for(const item of ingredients){
      if(item.id==='tomato')continue;
      // Only the designated recipes use the pizzeria's central three-olive garnish.
      if(garnish&&item.id==='olive'){
        for(const [type,x,y,rotation,variant,size] of [['olive',.426,.446,.15,0,.079],['olive',.562,.47,-.15,1,.074],['black-olive',.492,.586,.12,0,.078]])
          out.push({type,oliveColor:type==='black-olive'?'black':'green',portion:1,x,y,rotation,size,layer:4,variant,mirror:false,aspect:1,garnish:true});
        continue;
      }
      for(let portion=0;portion<(servings[item.id]||0);portion++){
        const rng=random(hash(item.id+':'+portion));const phase=rng()*Math.PI*2;
        const count=Math.round((portion===0?item.count:Math.round(item.count*EXTRA_RATIO))*density);
        for(let n=0;n<count;n++){
          const size=item.size*(.92+rng()*.18),visualScale=scaleFor(item.id);
          // Cover the whole edible disc; keep large pieces within the rim.
          const limit=Math.max(.23,FOOD_RADIUS-size*visualScale*.55);
          const r=limit*Math.pow((n+.55)/count,.44),angle=n*2.399963229728653+phase+(rng()-.5)*.42;
          const oliveColor=item.id==='olive'?(n%3===2?'black':'green'):item.id==='green-olive'?'green':item.id==='black-olive'?'black':null;
          out.push({type:item.id,...(oliveColor?{oliveColor}:{}),portion:portion+1,x:.5+Math.cos(angle)*r,y:.5+Math.sin(angle)*r,rotation:rng()*Math.PI*2,size,layer:item.layer,variant:(n*7+portion*11+hash(item.id))%16,mirror:rng()>.5,aspect:['wurstel','zucchini','bresaola','grana','olive','green-olive','black-olive'].includes(item.id)?1:.94+rng()*.1});
        }
      }
    }
    return (arrange?separateMeats(out,{scaleFor}):out).sort((a,b)=>a.layer-b.layer || a.portion-b.portion);
  }
  function separateMeats(pieces,{scaleFor=()=>1,width=1,height=1,regionFor}={}){
    const out=pieces.map(p=>({...p})),placed=[],counters={};
    const meats=out.filter(p=>p.type==='salami'||p.type==='nduja').sort((a,b)=>a.portion-b.portion||(a.type===b.type?0:a.type==='salami'?-1:1));
    for(let n=0;n<meats.length;n++){
      const p=meats[n],opponents=placed.filter(q=>q.section===p.section&&q.type!==p.type),own=placed.filter(q=>q.section===p.section&&q.type===p.type);
      const key=`${p.type}:${p.portion}:${p.section||0}`,index=counters[key]||0;counters[key]=index+1;
      const radius=p.size*height*scaleFor(p.type)*.5;
      const gap=(x,y)=>Math.min(...opponents.map(q=>Math.hypot(x-q.x*width,y-q.y*height)-radius-q.size*height*scaleFor(q.type)*.5));
      if(opponents.length&&gap(p.x*width,p.y*height)<height*.002){
        const rng=random(hash(`separate:${key}:${index}`)),z=regionFor?.(p);let best=-Infinity,bx=p.x*width,by=p.y*height;
        for(let attempt=0;attempt<512;attempt++){
          let x,y;if(z){const margin=radius*1.44;x=z.left+margin+rng()*(z.right-z.left-2*margin);y=z.top+margin+rng()*(z.bottom-z.top-2*margin);}else{const r=(FOOD_RADIUS-radius*1.1)*Math.sqrt(rng()),angle=rng()*Math.PI*2;x=.5+Math.cos(angle)*r;y=.5+Math.sin(angle)*r;}
          const clearance=gap(x,y),space=own.length?Math.min(...own.map(q=>Math.hypot(x-q.x*width,y-q.y*height))):height;
          const score=clearance>=height*.002?height+Math.min(space,height*.15):clearance;
          if(score>best){best=score;bx=x;by=y;}
        }
        p.x=bx/width;p.y=by/height;
      }
      placed.push(p);
    }
    return out;
  }
  function summary(raw){const s=normalize(raw),garnish=oliveGarnish(s);return ingredients.filter(i=>s[i.id]).map(i=>`${garnish&&i.id==='olive'?I.text('2 olive verdi e 1 oliva nera'):i.name}${s[i.id]===2?' ('+I.text('doppia porzione')+')':''}`).join(', ');}
  function money(cents){return new Intl.NumberFormat(I.locale,{style:'currency',currency:'EUR'}).format(cents/100);}
  const api={ingredients,byId,categories,menu,MAX_SERVINGS,EXTRA_RATIO,FOOD_RADIUS,pieceCount,baseAssets,baseFor,baseLayers,visualFior,oliveGarnish,normalize,change,same,match,pieces,separateMeats,summary,money,random,hash};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Pulcinella=api;
})(typeof window!=='undefined'?window:globalThis);
