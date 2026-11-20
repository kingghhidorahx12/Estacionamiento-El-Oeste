import {cp,mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),out=resolve(root,'build/cloud-assets');
if(!out.startsWith(resolve(root,'build')+'/')&&!out.startsWith(resolve(root,'build')+'\\'))throw new Error('Output outside project build directory');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(resolve(root,'web'),out,{recursive:true});
// Connection onboarding belongs only to the historical Android server.
for(const file of ['connect.html','connect.js','connect.css','vehicle-vision.js'])await rm(resolve(out,file),{force:true});
let html=await readFile(resolve(out,'index.html'),'utf8');html=html.replace('<script src="/app.js"','<script src="/cloud-client.js" defer></script><script src="/app.js"').replace('</head>','<link rel="stylesheet" href="/cloud.css"></head>').replace('Usa tu usuario y PIN personal.','Usa tu usuario y PIN personal.').replace('<p id="login-error"','<p id="cloud-device-approval" class="note" hidden></p><p id="login-error"').replace('Conéctate al Wi-Fi del estacionamiento.<br>La tablet debe estar encendida y el servidor activo.','Puedes usar Wi-Fi o datos móviles. La operación requiere conexión con el servidor.').replace('Sin conexión con la tablet. Comprueba el Wi-Fi y el servidor local. Los movimientos no se confirman hasta reconectar.','Sin conexión. Reconecta con Wi-Fi o datos móviles; no se confirman movimientos hasta consultar el servidor.').replace('Servidor local · MXN','Servidor Cloudflare · MXN');
// Cloud owns one ordered stylesheet; Android keeps the historical styles.
html=html.replace('<link rel="stylesheet" href="/style.css">','').replace('<link rel="stylesheet" href="/atelier.css">','').replace('<link rel="stylesheet" href="/cards-print.css">','').replace('<link rel="stylesheet" href="/cloud.css">','<link rel="stylesheet" href="/cloud.css"><link rel="stylesheet" href="/cards-print.css">')
 .replace('content="#102d48"','content="#244743"').replace('Operación local','El Oeste · Estacionamiento')
 .replace('<body>','<body><div id="cloud-loading" role="status"><div><img src="/assets/mark.svg" alt="" width="64" height="64"><strong>EL OESTE</strong><p>Preparando tu acceso…</p></div></div>')
 .replace('<span class="connection-dot" title="Estado del servidor"></span>','<span class="connection-state"><span class="connection-dot" title="Estado del servidor"></span><span class="connection-label">En línea</span></span>')
 .replace('Resumen del negocio','Resumen')
 .replace('<span>Escanear tarjeta<small>Entrada o salida automática</small></span>','<span>Escanear tarjeta<small>Entrada / Salida automática</small></span>')
 .replace('<span>Usar número<small>Sin cámara</small></span>','<span>Usar número<small>Sin cámara</small></span>');
html=html.replace('<p id="cloud-device-approval"','<details class="gap-top"><summary>Nombrar este dispositivo · opcional</summary><label class="gap-top">Nombre del dispositivo<input name="deviceLabel" minlength="3" maxlength="80" placeholder="Ej. Celular de recepción" autocomplete="off"></label></details><p id="cloud-device-approval"');
await writeFile(resolve(out,'index.html'),html);await writeFile(resolve(out,'cloud-client.js'),(await readFile(resolve(root,'cloud/client.js'),'utf8'))+'\n'+(await readFile(resolve(root,'cloud/management.js'),'utf8')));await cp(resolve(root,'cloud/style.css'),resolve(out,'cloud.css'));await cp(resolve(root,'cloud/ocr.js'),resolve(out,'ocr.js'));
const manifest=JSON.parse(await readFile(resolve(out,'manifest.webmanifest'),'utf8'));
manifest.theme_color='#244743';manifest.background_color='#f2eee4';
await writeFile(resolve(out,'manifest.webmanifest'),JSON.stringify(manifest,null,2)+'\n');
let app=await readFile(resolve(out,'app.js'),'utf8');const replace=(old,value)=>{if(!app.includes(old))throw new Error('Web source changed; review cloud adaptation: '+old.slice(0,60));app=app.replace(old,value);};
replace('async function request(path,body) {','async function request(path,body) {\n  return cloudRequest(path,body);\n  /* Historical local transport below remains unreachable in the cloud build. */');
replace("password:f.elements.password.value}","password:f.elements.password.value,deviceLabel:f.elements.deviceLabel?.value||'Navegador nuevo'}");
replace("csrf=state.csrf;$('#login')","csrf=state.csrf;cloudRecover();$('#login')");
replace("if(render)await renderTab();","if(render)await renderTab();cloudAuthority();");
// Match the QR video's actual DOM; it has no .camera-wrap parent.
replace('<video id="camera" class="gap-top" playsinline muted autoplay></video>','<video id="camera" class="scan-camera gap-top" playsinline muted autoplay></video>');
replace('Apunta al QR. Una tarjeta libre abre la entrada; una asignada abre su salida.','Apunta al QR de la tarjeta.');
replace('Lectura en este teléfono. No se registra ningún movimiento al escanear.','El movimiento se registra al confirmarlo.');
replace('Selecciona el número</option>','Selecciona</option>');
replace("if(!$('#modal').open)$('#modal').showModal();","if(!$('#modal').open)$('#modal').showModal();$('#modal').scrollTop=0;");
replace("buttons.forEach(b=>{b.disabled=false;","buttons.forEach(b=>{b.disabled=document.documentElement.classList.contains('cloud-offline')&&b.type==='submit'&&['entry-form','checkout-form'].includes(f.id);");
replace("['perifericos','print','Periféricos','Impresora USB o LAN']","['perifericos','print','Periféricos','Impresión desde este dispositivo']");
replace('Guarda el archivo cifrado fuera de la tablet y conserva su contraseña.','Guarda el archivo cifrado fuera del servidor y conserva su contraseña.');
replace("['actualizaciones','download','Actualizaciones','Preparar en la tablet']","['actualizaciones','download','Aplicación','Versión publicada']");
replace("${state.sync?.last?'Última sincronización: '+dateTime(Number(state.sync.last)):'Sin sincronización remota confirmada'} · ${state.sync?.pending||0} pagos pendientes de envío","Actualizado: ${dateTime(state.serverTime)} · Servidor principal Cloudflare");
replace("if(state&&!document.hidden&&!busy)refresh(tab==='inicio'&&!$('#modal').open);},15000)","if(state&&!document.hidden&&!busy&&Date.now()-cloudLastAction<120000)refresh(tab==='inicio'&&!$('#modal').open);},60000)");
replace("perifericos:peripheralsView","perifericos:cloudPeripherals");
replace("async function updatesView(){","async function updatesView(){return cloudApplication();\n");
replace("async function action(name,target){","async function action(name,target){\n if(name==='reload-cloud'){location.reload();return;}\n");
replace("async function action(name,target){","async function action(name,target){\n if(name==='cloud-devices'){await cloudDevices();return;}\n");
replace('<summary>Agregar usuario</summary>','<summary>Agregar usuario</summary>');
replace("function usersView(){$('#main').innerHTML=", "function usersView(){$('#main').innerHTML='<div class=\"compact-actions\"><button class=\"secondary\" data-action=\"cloud-devices\">Teléfonos autorizados</button></div>'+");
replace('\nrefresh();','\nif(!location.hash.startsWith(\'#setup=\'))refresh();');
replace("if(name==='print-receipt')return printReceipt(target.dataset.id);","if(name==='print-receipt'){const value=await request('print-receipt',{id:target.dataset.id});cloudPrint(value.receipt);return;}");
replace("Object.fromEntries(new FormData(f)));await refresh();toast('Usuario creado.')","Object.fromEntries(new FormData(f)));await refresh();toast('Usuario creado.')");
replace("<label class=\"gap-top\">Permiso<select name=\"role\">","${cloudUserFields()}<label class=\"gap-top\">Permiso<select name=\"role\">");
replace("<label>Permiso<select name=\"role\">","${cloudUserFields()}<label>Permiso<select name=\"role\">");
replace("function userUpdate(id){const u=state.users.find(u=>u.id===id);","function userUpdate(id){const u=state.users.find(u=>u.id===id);");
replace("pin:f.elements.pin.value,displayName:f.elements.displayName.value}","pin:f.elements.pin.value,displayName:f.elements.displayName.value,identity:f.elements.identity.value}");
// Preserve optional historical identity metadata while editing.
replace("function backupsView(){","function backupsView(){");
// Restoration is a protected migration into an empty D1, never an in-place
// replacement of newer production payments from a browser upload.
const a=app.indexOf('<form id="restore-form"'),b=app.indexOf('</form>',a);if(a<0||b<0)throw new Error('Restore form changed');app=app.slice(0,a)+'<section class="panel"><h3>Restauración controlada</h3><p class="gap-top">La recuperación de un respaldo requiere revisión administrativa para proteger los registros y cobros existentes.</p></section>'+app.slice(b+7);
app=app.replace("function userUpdate(id){const u=state.users.find(u=>u.id===id);", "function userUpdate(id){const u=state.users.find(u=>u.id===id);").replace("Guardar acceso</button></div></form>`);}","Guardar acceso</button></div></form>`);$('#user-update-form').elements.identity.value=u.identity||'';}");
// Replace whole view functions, never layer duplicate historical declarations.
// Keep the submitters, delegated actions and API payloads from web unchanged.
const ui=(await readFile(resolve(root,'cloud/ui.js'),'utf8'))+'\n'+(await readFile(resolve(root,'cloud/ocr-camera.js'),'utf8'));
for(const name of ['heading','empty','home','renderVehicles','adminView','entryView','updateEntry','checkoutView','monthlyView','usersView','userUpdate','photo','capture','recognize']){
 const start=app.search(new RegExp('^(?:async )?function '+name+'\\(','m'));
 if(start<0)throw new Error('Missing historical view: '+name);
 const after=app.slice(start+1).search(/\n(?:async )?function \w+\(/);
 if(after<0)throw new Error('Missing view boundary: '+name);
 app=app.slice(0,start)+app.slice(start+1+after+1);
}
replace("if(!location.hash.startsWith('#setup='))refresh();",()=>ui+"\nif(!location.hash.startsWith('#setup='))refresh();");
app=app.replaceAll('Servidor de prueba','Aplicación');
await writeFile(resolve(out,'app.js'),app);
async function files(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true}))e.isDirectory()?result.push(...await files(resolve(dir,e.name))):result.push(resolve(dir,e.name));return result;}
const digest=createHash('sha256');for(const file of (await files(out)).sort())if(file!==resolve(out,'sw.js'))digest.update(file.slice(out.length)).update(await readFile(file));
let sw=await readFile(resolve(out,'sw.js'),'utf8');sw=sw.replace("const CACHE='oeste-shell-v9'","const CACHE='oeste-cloud-shell-"+digest.digest('hex').slice(0,16)+"'").replace("const FILES=['/'","const FILES=['/cloud-client.js','/cloud.css','/'").replace("k.startsWith('oeste-shell-')","k.startsWith('oeste-cloud-shell-')").replace('Servidor local sin conexión','Servidor sin conexión');await writeFile(resolve(out,'sw.js'),sw);
console.log('Cloud assets prepared from existing web UI; no credentials, production QR, data or Android distribution changes.');
