(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports,P=node?require('./pizza.js'):root.Pulcinella,M=node?require('./materials.js'):root.PizzaMaterials,Q=node?require('./formats.js'):root.PizzaFormats;
  function sprite(id){
    const item=P.byId[id];if(!item||id==='oregano')return null;
    if(M.replacements[id]){const[atlas,cells]=M.replacements[id];return{file:M.atlases[atlas],cells,crumbs:id==='friarielli'};}
    if(id==='pancetta')return{file:M.atlases.precedente,cells:[8],crumbs:false};
    if(id==='wurstel')return{file:M.atlases.pizzeria,cells:[8,9,10,11],crumbs:false};
    if(id==='garlic')return{file:M.atlases.classici,cells:[12,13,14],crumbs:false};
    return{file:M.atlases[item.atlas],cells:[item.cell],crumbs:['grana','ricotta'].includes(id)};
  }
  function ingredients(raw){const ids=new Set(Q.sections(raw).flatMap(part=>Object.keys(part)).filter(id=>!['tomato','fior'].includes(id)));if(ids.has('olive'))ids.add('black-olive');return [...ids];}
  const garnish=raw=>Q.sections(raw).some(part=>P.oliveGarnish(part));
  function files(raw){return [...new Set([...Q.photoFiles(raw),...ingredients(raw).flatMap(id=>[sprite(id)?.file,M.coBaked[id]?M.cookedAtlas(id):null]).filter(Boolean),...(garnish(raw)?[M.atlases.garnishOlives]:[])])];}
  const api={sprite,ingredients,garnish,files};if(node)module.exports=api;else root.PizzaIngredientAssets=api;
})(typeof window!=='undefined'?window:globalThis);
