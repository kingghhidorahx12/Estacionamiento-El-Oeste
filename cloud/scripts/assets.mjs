import {cp,mkdir,readFile,writeFile,rm,readdir} from 'node:fs/promises';import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),out=resolve(root,'build/cloud-assets');
if(!out.startsWith(resolve(root,'build')+'/')&&!out.startsWith(resolve(root,'build')+'\\'))throw new Error('Output outside project build directory');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});await cp(resolve(root,'web'),out,{recursive:true});
// Connection onboarding belongs only to the historical Android server.
for(const file of ['connect.html','connect.js','connect.css','vehicle-vision.js'])await rm(resolve(out,file),{force:true});
let html=await readFile(resolve(out,'index.html'),'utf8');html=html.replace('<script src="/app.js"','<script src="/cloud-client.js" defer></script><script src="/app.js"').replace('</head>','<link rel="stylesheet" href="/cloud.css"></head>').replace('Usa tu usuario y PIN personal.','Usa tu usuario y PIN personal.').replace('<p id="login-error"','<p id="cloud-device-approval" class="note" hidden></p><p id="login-error"').replace('Conéctate al Wi-Fi del estacionamiento.<br>La tablet debe estar encendida y el servidor activo.','Puedes usar Wi-Fi o datos móviles. La operación requiere conexión con el servidor.').replace('Sin conexión con la tablet. Comprueba el Wi-Fi y el servidor local. Los movimientos no se confirman hasta reconectar.','Sin conexión. Reconecta con Wi-Fi o datos móviles; no se confirman movimientos hasta consultar el servidor.').replace('Servidor local · MXN','Servidor Cloudflare · MXN');
await writeFile(resolve(out,'index.html'),html);await cp(resolve(root,'cloud/client.js'),resolve(out,'cloud-client.js'));await cp(resolve(root,'cloud/style.css'),resolve(out,'cloud.css'));
let app=await readFile(resolve(out,'app.js'),'utf8');const replace=(old,value)=>{if(!app.includes(old))throw new Error('Web source changed; review cloud adaptation: '+old.slice(0,60));app=app.replace(old,value);};
replace('async function request(path,body) {','async function request(path,body) {\n  return cloudRequest(path,body);\n  /* Historical local transport below remains unreachable in the cloud build. */');
replace("password:f.elements.password.value}","password:f.elements.password.value}");
replace("csrf=state.csrf;$('#login')","csrf=state.csrf;cloudRecover();$('#login')");
replace("if(render)await renderTab();","if(render)await renderTab();cloudAuthority();");
replace("buttons.forEach(b=>{b.disabled=false;","buttons.forEach(b=>{b.disabled=document.documentElement.classList.contains('cloud-offline')&&b.type==='submit'&&['entry-form','checkout-form'].includes(f.id);");
replace("['perifericos','print','Periféricos','Impresora USB o LAN']","['perifericos','print','Periféricos','Impresión desde este dispositivo']");
replace('Guarda el archivo cifrado fuera de la tablet y conserva su contraseña.','Guarda el archivo cifrado fuera del servidor y conserva su contraseña.');
replace("['actualizaciones','download','Actualizaciones','Preparar en la tablet']","['actualizaciones','download','Aplicación','Versión publicada']");
replace("${state.sync?.last?'Última sincronización: '+dateTime(Number(state.sync.last)):'Sin sincronización remota confirmada'} · ${state.sync?.pending||0} pagos pendientes de envío","Actualizado: ${dateTime(state.serverTime)} · Servidor principal Cloudflare");
replace("if(state&&!document.hidden&&!busy)refresh(tab==='inicio'&&!$('#modal').open);},15000)","if(state&&!document.hidden&&!busy&&Date.now()-cloudLastAction<120000)refresh(tab==='inicio'&&!$('#modal').open);},60000)");
replace("perifericos:peripheralsView","perifericos:cloudPeripherals");
replace("async function updatesView(){","async function updatesView(){\n $('#main').innerHTML=heading('APLICACIÓN','El Oeste en Cloudflare','Las actualizaciones se publican en el servidor. Recarga para obtener la versión vigente.')+'<section class=\"panel\"><p>Entradas, salidas y cobros comparten una sola base principal. La tablet Android no es necesaria para esta URL.</p><button class=\"primary gap-top\" data-action=\"reload-cloud\">Recargar aplicación</button></section>';return;\n");
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
const a=app.indexOf('<form id="restore-form"'),b=app.indexOf('</form>',a);if(a<0||b<0)throw new Error('Restore form changed');app=app.slice(0,a)+'<section class="panel"><h3>Restauración controlada</h3><p class="gap-top">Una copia se valida primero en una D1 vacía. El corte requiere congelar la autoridad anterior y conciliar pagos posteriores. No se sobrescriben cobros desde este navegador.</p></section>'+app.slice(b+7);
app=app.replace("function userUpdate(id){const u=state.users.find(u=>u.id===id);", "function userUpdate(id){const u=state.users.find(u=>u.id===id);").replace("Guardar acceso</button></div></form>`);}","Guardar acceso</button></div></form>`);$('#user-update-form').elements.identity.value=u.identity||'';}");
await writeFile(resolve(out,'app.js'),app);
async function files(dir){const result=[];for(const e of await readdir(dir,{withFileTypes:true}))e.isDirectory()?result.push(...await files(resolve(dir,e.name))):result.push(resolve(dir,e.name));return result;}
const digest=createHash('sha256');for(const file of (await files(out)).sort())if(file!==resolve(out,'sw.js'))digest.update(file.slice(out.length)).update(await readFile(file));
let sw=await readFile(resolve(out,'sw.js'),'utf8');sw=sw.replace("const CACHE='oeste-shell-v9'","const CACHE='oeste-cloud-shell-"+digest.digest('hex').slice(0,16)+"'").replace("const FILES=['/'","const FILES=['/cloud-client.js','/cloud.css','/'").replace("k.startsWith('oeste-shell-')","k.startsWith('oeste-cloud-shell-')").replace('Servidor local sin conexión','Servidor sin conexión');await writeFile(resolve(out,'sw.js'),sw);
console.log('Cloud assets prepared from existing web UI; no credentials, production QR, data or Android distribution changes.');
