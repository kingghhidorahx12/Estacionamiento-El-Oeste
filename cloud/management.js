/* Account and delivery controls. No credentials or photos are persisted here. */
function managementForm(id,run){
 const form=document.getElementById(id);
 form.addEventListener('submit',async event=>{
  event.preventDefault();event.stopImmediatePropagation();if(form.dataset.sending||!form.reportValidity())return;
  form.dataset.sending='1';const button=form.querySelector('[type=submit]'),error=form.querySelector('[role=alert]');button.disabled=true;
  try{await run(form);}catch(e){if(error)error.textContent=e.message;else toast(e.message);}finally{delete form.dataset.sending;button.disabled=false;}
 });
}
function managementActions(label,body){return '<div class="modal-actions"><button class="secondary" type="button" data-action="close-modal">Cancelar</button><button class="'+(body?'danger':'primary')+'" type="submit">'+label+'</button></div><p class="error gap-top" role="alert"></p>';}
function deviceItem(d){
 const active=d.state==='active',status={revoked:'Retirado',expired:'Vencido',inactive:'Usuario inactivo'};
 return `<section class="device-item"><div><b>${esc(d.label)}</b>${d.current?'<span class="device-current">Este navegador</span>':''}<p>${esc(d.name)} <span class="muted">· ${esc(d.login)}</span></p><small>Autorizado: ${dateTime(d.created)}<br>Referencia ${esc(d.id.slice(0,8))}${active?'':' · '+esc(status[d.state]||d.state)}</small></div>${active?`<div class="device-actions"><button class="secondary" data-management="rename-device" data-id="${esc(d.id)}" data-label="${esc(d.label)}">Cambiar nombre</button>${d.current?'':`<button class="ghost" data-management="revoke-device" data-id="${esc(d.id)}" data-label="${esc(d.label)}">Retirar acceso</button>`}</div>`:''}</section>`;
}
async function cloudDeviceManager(){
 const result=await request('devices'),active=result.devices.filter(d=>d.state==='active'),past=result.devices.filter(d=>d.state!=='active');
 openModal('Dispositivos autorizados',`<div id="device-manager"><section class="device-guide"><h3>Autorizar un dispositivo nuevo</h3><ol><li>Abre El Oeste en el nuevo dispositivo e ingresa con su usuario y PIN.</li><li>Busca aquí la solicitud y comprueba que su código coincide.</li></ol><button class="secondary" data-management="devices-refresh">${icon('refresh')} Actualizar solicitudes</button></section><div class="section-heading"><h3>Solicitudes pendientes <span class="count">${result.requests.length}</span></h3></div>${result.requests.length?result.requests.map(r=>`<section class="device-item"><div><b class="approval-code">${esc(r.code)}</b><p>${esc(r.name)} · ${esc(r.label)}</p><small>Vence: ${dateTime(r.expires)}</small></div><div class="device-actions"><button class="primary" data-management="approve-device" data-id="${esc(r.id)}" data-code="${esc(r.code)}" data-label="${esc(r.label)}">Autorizar</button><button class="ghost" data-management="deny-device" data-id="${esc(r.id)}">Rechazar</button></div></section>`).join(''):'<p class="muted gap-top">No hay solicitudes pendientes. Cuando el nuevo dispositivo intente entrar, aparecerá aquí.</p>'}<h3 class="gap-top">Accesos vigentes</h3>${active.map(deviceItem).join('')||'<p class="muted gap-top">No hay accesos vigentes.</p>'}${past.length?`<details class="gap-top"><summary>Accesos retirados o vencidos (${past.length})</summary>${past.map(deviceItem).join('')}</details>`:''}</div>`);
}
function cloudDeleteUser(id){
 const u=state.users.find(u=>u.id===id);if(!u||u.name===state.login)return;
 openModal('Eliminar acceso',`<form class="management-form" id="delete-user-form"><p>¿Eliminar el acceso de <b>${esc(u.display_name||u.name)}</b> (${esc(u.login_name||u.name)})?</p><p class="note gap-top">Ya no podrá entrar y se retirarán sus dispositivos. Sus movimientos y pagos conservarán su historial.</p>${managementActions('Eliminar acceso',true)}</form>`);
 managementForm('delete-user-form',async()=>{await request('user-delete',{id,confirmed:true});closeModal();await refresh();toast('Acceso eliminado. Historial conservado.');});
}
async function cloudApplication(){
 $('#main').innerHTML=heading('APLICACIÓN','El Oeste','Consulta y actualiza la aplicación.')+`<section class="panel application-info"><h2>Actualizar aplicación</h2><p class="gap-top">Recarga para obtener la versión más reciente. Tus registros se conservan.</p><button class="primary gap-top" data-action="reload-cloud">${icon('refresh')} Recargar aplicación</button></section>`;
}
document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-management],[data-user-delete]');if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();button.disabled=true;
 try{
  const {management:action,id,label,code}=button.dataset;
  if(button.dataset.userDelete){cloudDeleteUser(button.dataset.userDelete);return;}
  if(action==='devices-refresh'){await cloudDeviceManager();return;}
  if(action==='deny-device'){await request('device-deny',{id});await cloudDeviceManager();toast('Solicitud rechazada.');return;}
  if(action==='approve-device'){
   openModal('Autorizar dispositivo',`<form class="management-form" id="approve-device-form"><p>Comprueba que este código aparece en el dispositivo <b>${esc(label)}</b>:</p><p class="approval-code gap-top">${esc(code)}</p>${managementActions('Coincide · Autorizar',false)}</form>`);
   managementForm('approve-device-form',async()=>{await request('device-approve',{id,confirmed:true});await cloudDeviceManager();toast('Dispositivo autorizado. Ya puede entrar con su PIN.');});return;
  }
  if(action==='rename-device'){
   openModal('Nombre del dispositivo',`<form class="management-form" id="rename-device-form"><label>Nombre para identificarlo<input name="label" required minlength="3" maxlength="80" value="${esc(label)}" placeholder="Ej. Celular de recepción"></label>${managementActions('Guardar nombre',false)}</form>`);
   managementForm('rename-device-form',async f=>{await request('device-rename',{id,label:f.elements.label.value});await cloudDeviceManager();});return;
  }
  if(action==='revoke-device'){
   openModal('Retirar acceso',`<form class="management-form" id="revoke-device-form"><p>¿Retirar la autorización de <b>${esc(label)}</b>?</p><p class="fine gap-top">Se cerrarán sus sesiones. Para volver a entrar necesitará autorización del administrador.</p>${managementActions('Retirar acceso',true)}</form>`);
   managementForm('revoke-device-form',async()=>{await request('device-revoke',{id,reason:'Acceso retirado por el administrador desde Equipo.'});await cloudDeviceManager();toast('Autorización retirada.');});
  }
 }catch(e){toast(e.message);}finally{button.disabled=false;}
});
