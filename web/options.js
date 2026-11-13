'use strict';
// Keep selections and business values intact; only the visible order changes.
const optionCollator=new Intl.Collator('es-MX',{numeric:true,sensitivity:'base'});
function sortSelectOptions(root=document){
 const selects=root.matches?.('select')?[root]:[...root.querySelectorAll('select')];
 for(const select of selects){
  for(const group of [select,...select.querySelectorAll('optgroup')]){
   const options=[...group.children].filter(e=>e.tagName==='OPTION');
   const ordered=[...options].sort((a,b)=>a.value===''?-1:b.value===''?1:optionCollator.compare(a.textContent.trim(),b.textContent.trim()));
   if(options.every((o,i)=>o===ordered[i]))continue;
   const selected=[...select.options].filter(o=>o.selected);
   if(!select.multiple&&![...select.options].some(o=>o.defaultSelected)&&select.options[0])select.options[0].defaultSelected=true;
   for(const option of ordered)group.append(option);
   for(const option of select.options)option.selected=selected.includes(option);
  }
 }
}
new MutationObserver(records=>{
 for(const record of records){
  if(record.target.matches?.('select,optgroup'))sortSelectOptions(record.target.closest('select'));
  for(const node of record.addedNodes)if(node.nodeType===1)sortSelectOptions(node);
 }
}).observe(document.documentElement,{childList:true,subtree:true});
sortSelectOptions();
