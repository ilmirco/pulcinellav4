(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const P=node?require('./pizza.js'):root.Pulcinella,Q=node?require('./formats.js'):root.PizzaFormats;
  function warmingFiles(raw){
    const design=Q.normalize(raw),source=index=>design.format==='round'?P.baseAssets.flat()[index]:design.format==='half'?Q.halfFiles.flat()[index]:Q.atlasFiles[Math.floor(index/3)];
    const common=[{tomato:1,fior:1},{fior:1},{tomato:1},{},{tomato:2,fior:1},{tomato:1,fior:2},{tomato:2}];
    return [...new Set([...Q.photoFiles(design),...common.flatMap(part=>Object.values(P.baseLayers(part)).filter(index=>index!==null).map(source))])];
  }
  function frameKey(raw,width){const design=Q.normalize(raw);return JSON.stringify([design.format,width,Q.sections(design)]);}
  function createFrameCache(limit=3){
    const frames=new Map();
    return{get(key){if(!frames.has(key))return;const value=frames.get(key);frames.delete(key);frames.set(key,value);return value;},set(key,value){frames.delete(key);frames.set(key,value);while(frames.size>limit)frames.delete(frames.keys().next().value);return value;},get size(){return frames.size;}};
  }
  function createWarmup({has,load,schedule,cancel}){
    const failed=new Set();
    let queue=[],handle=null,running=false,stopped=false;
    function request(){if(stopped||running||handle!==null||!queue.length)return;handle=schedule(pump);}
    async function pump(){
      handle=null;if(stopped)return;const file=queue.shift();if(file===undefined)return;
      if(has(file)){request();return;}
      running=true;try{await load(file);}catch{failed.add(file);/* Foreground loading can still retry the file. */}
      finally{running=false;request();}
    }
    return{warm(files){queue=[...new Set(files)].filter(file=>!has(file)&&!failed.has(file));stopped=false;if(handle!==null){cancel(handle);handle=null;}request();},stop(){stopped=true;queue=[];if(handle!==null){cancel(handle);handle=null;}}};
  }
  const api={warmingFiles,frameKey,createFrameCache,createWarmup};if(node)module.exports=api;else root.PizzaPreviewEngine=api;
})(typeof window!=='undefined'?window:globalThis);
