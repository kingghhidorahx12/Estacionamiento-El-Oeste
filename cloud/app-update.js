// A document and its controls must come from the same published UI revision.
let cloudUpdatePending=false,cloudUpdateNavigating=false;
function cloudApplyUpdate(){
 if(!cloudUpdatePending||cloudUpdateNavigating||document.hidden||typeof busy!=='undefined'&&busy||document.querySelector('dialog[open],[data-sending]')||document.querySelector('input:focus,select:focus,textarea:focus')||document.querySelector('#login-form input[name=password]')?.value)return;
 cloudUpdateNavigating=true;location.reload();
}
function cloudInstallUpdates(){
 const version=document.documentElement.dataset.cloudVersion;
 navigator.serviceWorker.addEventListener('message',event=>{
  if(event.data?.type!=='cloud-ui-version'||event.data.version===version)return;
  cloudUpdatePending=true;cloudApplyUpdate();
 });
 navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).then(registration=>{
  registration.update().catch(()=>{});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){registration.update().catch(()=>{});cloudApplyUpdate();}});
 }).catch(()=>{});
 document.addEventListener('focusout',()=>setTimeout(cloudApplyUpdate,0));
 document.addEventListener('click',()=>setTimeout(cloudApplyUpdate,0));
 document.querySelector('#modal')?.addEventListener('close',cloudApplyUpdate);
}
async function cloudReloadApplication(){
 const registration=await navigator.serviceWorker?.getRegistration().catch(()=>null);
 registration?.update().catch(()=>{});
 const url=new URL(location.href);url.searchParams.set('v',document.documentElement.dataset.cloudVersion);location.replace(url.href);
}
