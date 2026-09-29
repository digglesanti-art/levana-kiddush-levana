import {t} from './i18n.js';
export function localize(root,lang){
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==='he'?'rtl':'ltr';
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
    const n=walker.currentNode, v=n.textContent, trimmed=v.trim();
    if(trimmed){const next=t(trimmed,lang);if(next!==trimmed)n.textContent=v.replace(trimmed,next)}
  }
  root.querySelectorAll('[placeholder],[aria-label]').forEach(el=>{for(const key of ['placeholder','aria-label']){const raw=el.dataset['original'+key.replace('-','') ]||el.getAttribute(key);if(!raw)continue;el.dataset['original'+key.replace('-','')]=raw;el.setAttribute(key,t(raw,lang))}})
}
