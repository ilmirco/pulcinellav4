(function(root){
  'use strict';
  const atlases=Object.freeze({orto:'orto-naturale.png',carni:'carni-naturali.png',formaggi:'formaggi-naturali.png',classici:'classici-naturali.png',pizzeria:'ingredienti-pizzeria.png',precedente:'carni.png',fornoCarni:'forno-carni-v15.png',fornoOrto:'forno-orto-v15.png',cotti:'cotti-mozzarella-v15.png',finiture:'finiture-v15.png',condimenti:'condimenti-v18.png',salumiV19:'salumi-v19.png',verdureV19:'verdure-v19.png',garnishOlives:'olive-intere-v29.png'});
  const garnishOlives=Object.freeze({green:Object.freeze([0,6]),black:Object.freeze([14])});
  const coBaked=Object.freeze({ham:[2,3],sausage:[4,5,6,7],mushroom:[8,9,10,11],friarielli:[8,9,10,11]});
  function withCheese(id,fior){return fior>0&&Object.hasOwn(coBaked,id);}
  function cookedAtlas(id){return id==='ham'?atlases.salumiV19:id==='friarielli'?atlases.verdureV19:id==='sausage'?atlases.condimenti:atlases.cotti;}
  const replacements=Object.freeze({bufala:['condimenti',[0,1,2,3]],ham:['salumiV19',[0,1]],guanciale:['salumiV19',[4,5,6,7]],tuna:['salumiV19',[8,9,10,11]],nduja:['salumiV19',[12,13]],ricotta:['salumiV19',[14,15]],sausage:['condimenti',[8,9,10,11]],grana:['fornoCarni',[8,9,10,11]],olive:['fornoCarni',[12,13,14]],'green-olive':['fornoCarni',[12,13,14]],'black-olive':['fornoCarni',[15]],friarielli:['verdureV19',[8,9,10,11]],porcini:['verdureV19',[12,13,14,15]],mushroom:['fornoOrto',[4,5,6,7]],salami:['condimenti',[12,13,14,15]],pepper:['verdureV19',[0,1,2,3]],aubergine:['fornoOrto',[13]],zucchini:['verdureV19',[4,5,6,7]],tropea:['fornoOrto',[15]],rocket:['finiture',[0,1,2,3,4,5,6,7]],bresaola:['finiture',[8,9,10,11]],prosciutto:['finiture',[12,13,14,15]]});
  const locked=new Set(['olive','green-olive','black-olive','wurstel','zucchini','bresaola','grana','oregano','caper']);
  const readable=new Set(['ham','tuna','nduja','guanciale','porcini','sausage','salami']);
  // Rendering choices, not a claim about the pizzeria's preparation procedure.
  const finish=new Set(['rocket','cherry','prosciutto','speck','bresaola','grana','ricotta','walnut','fries','oregano']);
  const scales={mushroom:.9,porcini:.95,salami:.95,ham:.95,cherry:.96,rocket:1.05,olive:.9,'green-olive':.9,'black-olive':.9,pepper:.95,aubergine:.97,zucchini:.96,tropea:.9,onion:.9,artichoke:.95,fries:1,friarielli:.98,wurstel:1,sausage:1,prosciutto:1,speck:.98,guanciale:.98,bacon:.98,pancetta:1,bresaola:1,nduja:1,bufala:.96,grana:1,ricotta:.98,fontina:1.1,provola:1.1,gorgonzola:1.05,scamorza:1.1,'smoked-provola':1.1,tuna:.98,anchovy:1,caper:.98,garlic:.9,oregano:.93,walnut:1,chili:.95};
  function profile(id){
    const fresh=finish.has(id),olive=id==='olive'||id==='green-olive'||id==='black-olive';
    const sink=fresh||olive?0:id==='sausage' ? .44 : readable.has(id) ? .32 : ['fontina','provola','scamorza','smoked-provola','gorgonzola'].includes(id) ? .45 : .88;
    return{fresh,readable:readable.has(id),melted:id==='bufala',scale:scales[id]||1,sink,locked:locked.has(id),relief:!fresh&&!olive};
  }
  // Small elastic shape changes and neutral exposure changes; round slices and straight slivers stay intact.
  function variation(id,index){const n=index%16;return{bend:locked.has(id)?0:.018+(n%4)*.009,phase:n*2.399963,stretch:locked.has(id)?1:.92+(n%5)*.027,exposure:.976+(n%7)*.008};}
  function rowWarp(t,width,v){const wave=Math.sin(t*Math.PI*2+v.phase);return{offset:width*v.bend*wave,scale:1+v.bend*Math.cos(t*Math.PI*3+v.phase)};}
  function smooth(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
  function fit(width,height,span){const ratio=span/Math.max(width,height,1);return{width:width*ratio,height:height*ratio};}
  function cheeseCoverage(r,g,b){return smooth(.66,.88,g/(r+1))*smooth(.36,.68,b/(r+1))*smooth(118,185,g);}
  function toneTomato(data,i){
    const r=data[i],g=data[i+1],b=data[i+2];
    const weight=smooth(.4,.62,(r-g)/(r+1))*smooth(95,160,r);
    if(!weight)return;
    const grey=r*.2126+g*.7152+b*.0722,mix=.16*weight,light=1-.025*weight;
    data[i]=(r+(grey-r)*mix)*light;data[i+1]=(g+(grey-g)*mix)*light;data[i+2]=(b+(grey-b)*mix)*light;
  }
  function cleanAlpha(data,w,h,crumbs=false){
    const n=w*h,labels=new Int32Array(n),queue=new Int32Array(n),areas=[0];let label=0;
    // Separate the food from tiny disconnected remnants of the generated matte.
    for(let start=0;start<n;start++){
      if(labels[start]||data[start*4+3]<150)continue;
      label++;let head=0,tail=1;queue[0]=start;labels[start]=label;
      while(head<tail){const at=queue[head++],x=at%w;
        for(const next of [x?at-1:-1,x<w-1?at+1:-1,at>=w?at-w:-1,at<n-w?at+w:-1]){
          if(next>=0&&!labels[next]&&data[next*4+3]>=150){labels[next]=label;queue[tail++]=next;}
        }
      }
      areas.push(tail);
    }
    let largest=0,main=0;for(let i=1;i<areas.length;i++)if(areas[i]>largest){largest=areas[i];main=i;}
    const cut=Math.max(3,largest*.0005),keep=new Uint8Array(n);
    for(let i=0;i<n;i++)if(labels[i]&&(crumbs?areas[labels[i]]>=cut:labels[i]===main))keep[i]=1;
    // Keep a narrow natural antialiased edge around each retained solid region.
    for(let i=0;i<n;i++){
      const a=data[i*4+3];if(!a)continue;let retain=keep[i];
      if(!retain){const x=i%w,y=Math.floor(i/w);for(let dy=-2;dy<=2&&!retain;dy++)for(let dx=-2;dx<=2;dx++)if(x+dx>=0&&x+dx<w&&y+dy>=0&&y+dy<h&&keep[(y+dy)*w+x+dx]){retain=1;break;}}
      data[i*4+3]=retain?Math.round(255*smooth(.18,.94,a/255)):0;
    }
    return data;
  }
  function edgeAlpha(data,w,h,strength=.76){
    const out=new Uint8ClampedArray(w*h*4),radius=Math.max(2,Math.round(Math.min(w,h)*.15));
    const alpha=(x,y)=>x<0||y<0||x>=w||y>=h?0:data[(y*w+x)*4+3]/255;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const at=(y*w+x)*4,a=data[at+3]/255;if(!a)continue;
      let inner=0;
      for(const ring of [.35,.7,1]){let minimum=1;for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[-.7,-.7],[.7,-.7],[-.7,.7],[.7,.7]])minimum=Math.min(minimum,alpha(x+Math.round(dx*radius*ring),y+Math.round(dy*radius*ring)));inner+=minimum/3;}
      const arcs=.28+.72*smooth(-.35,.8,Math.sin(x/w*9+y/h*5)+Math.sin(y/h*13-x/w*4)*.4);
      // Melt reaches farther up the lower contour; irregular arcs keep the food readable.
      const contact=.65+.35*smooth(.2,.85,y/h);
      out[at]=out[at+1]=out[at+2]=255;out[at+3]=Math.round(255*a*(1-inner)*strength*arcs*contact);
    }
    return out;
  }
  function cookingAlpha(data,w,h){
    const out=edgeAlpha(data,w,h,1),radius=Math.max(2,Math.round(Math.min(w,h)*.07));
    const light=(x,y)=>{const i=(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4;return data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722;};
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=(y*w+x)*4,a=data[i+3]/255;if(a<.8)continue;
      const center=light(x,y),around=(light(x-radius,y)+light(x+radius,y)+light(x,y-radius)+light(x,y+radius))/4;
      // Thin folds and low creases collect a little melted cheese, without hiding browned tops.
      const valley=smooth(10,42,around-center)*smooth(42,100,center);
      const broken=smooth(.35,.85,Math.sin(x/w*17+y/h*8)*.5+.5);
      out[i+3]=Math.max(out[i+3],Math.round(a*valley*broken*64));
    }
    return out;
  }
  const api={atlases,garnishOlives,coBaked,withCheese,cookedAtlas,replacements,profile,variation,rowWarp,smooth,fit,cheeseCoverage,toneTomato,cleanAlpha,edgeAlpha,cookingAlpha};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PizzaMaterials=api;
})(typeof window!=='undefined'?window:globalThis);
