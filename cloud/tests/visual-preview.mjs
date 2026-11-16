// Read-only visual scenarios and focused interactions against synthetic local
// data. Never bundled, deployed, or connected to the business installation.
import {createServer} from 'node:http';
import {harness,metricsScript} from './visual-harness.mjs';
import {readFile,access} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createWorker} from '../worker.mjs';
import {SqliteD1,seed} from './helpers.mjs';
import {Api} from '../lib/api.mjs';
import {Store} from '../lib/store.mjs';
import {fingerprint} from '../lib/crypto.mjs';
const root=resolve(fileURLToPath(new URL('../..',import.meta.url))),baseline=resolve(root,'.dev/ui-before-20261116');
try{await access(baseline);}catch{throw new Error('Prepara .dev/ui-before-20261116 con los assets del commit b491566 antes de comparar. No se etiqueta la versión actual como anterior.');}
const db=new SqliteD1(),at=Date.parse('2026-11-16T18:00:00Z'),f=await seed(db,{at}),worker=createWorker({clock:()=>at});let offline=false;
async function mutate(user,path,body,time=at){return new Api(new Store(db),f.env,user,time).write(path,body,crypto.randomUUID(),await fingerprint(path,body,f.env.REQUEST_KEY));}
for(let i=0;i<7;i++){const s=await mutate(f.users[1+i%2],'entry',{card:20+i,vehicle:{plate:'PAG'+(100+i)},service:{mode:'hourly'}},at-1800000);await mutate(f.users[1+i%2],'checkout',{id:s.id,expectedTotal:1500,paymentConfirmed:true,vehicleConfirmed:true});}
for(const [card,plate,service,elapsed]of [[1,'PZJ642E',{mode:'hourly'},2520000],[7,'NVS218A',{mode:'free',preferred:true},1800000],[14,'VAN314B',{mode:'wash_only',wash:'van'},900000]])await mutate(f.users[1],'entry',{card,vehicle:{plate,type:card===14?'van':'auto'},service},at-elapsed);
await mutate(f.users[0],'monthly',{mode:'24h',start:at-86400000,end:at+29*86400000,vehicle:{plate:'MNS240A',type:'auto',brand:'Ford',color:'Blanco'},manualDatesConfirmed:true,payNow:false});
const views=['inicio','entrada','salida','admin','reportes','pensiones','tarjetas','equipo','ajustes','respaldos','perifericos','actualizaciones','historial','login'];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ttf':'font/ttf','.wasm':'application/wasm','.gz':'application/gzip','.webmanifest':'application/manifest+json'};
const metrics=metricsScript;
const audit=new Map();
for(const [port,index]of [[4841,0],[4842,1],[4843,null]]){
 let cookie='';if(index!==null){const u=f.users[index],r=await worker.fetch(new Request(`http://127.0.0.1:${port}/api/login`,{method:'POST',headers:{Origin:`http://127.0.0.1:${port}`,'Content-Type':'application/json',Cookie:'__Host-oeste-device='+u.deviceToken,'CF-Connecting-IP':'127.0.0.1'},body:JSON.stringify({name:u.name,password:'65432198'})}),f.env);if(!r.ok)throw new Error('Synthetic session failed');cookie='__Host-oeste-device='+u.deviceToken+'; '+r.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');}
 createServer(async(req,res)=>{try{
  if(req.headers.host!=='127.0.0.1:'+port)throw 0;const url=new URL(req.url,'http://'+req.headers.host),before=url.searchParams.get('before')==='1',view=url.searchParams.get('screen')||'inicio',base=before?baseline:resolve(root,'build/cloud-assets');
  if(url.pathname==='/__metrics.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end(metrics);return;}
  const assets={async fetch(request){const pathname=new URL(request.url).pathname,filename=resolve(base,pathname==='/'?'index.html':'.'+pathname);if(!filename.startsWith(base+'/')&&!filename.startsWith(base+'\\'))return new Response('',{status:404});try{let body=await readFile(filename);if(filename.endsWith('index.html'))body=body.toString().replace(/(src|href)="(\/[^"]+\.(?:js|css))"/g,(_,attr,path)=>attr+'="'+path+'?before='+Number(before)+'&screen='+encodeURIComponent(view)+'"').replace('</body>','<script src="/__metrics.js" defer></script></body>');if(filename.endsWith('app.js')){body=body.toString().replace("tab=state.role==='admin'?(new URLSearchParams(location.search).get('view')==='perifericos'?'perifericos':'admin'):'inicio';",`tab=${JSON.stringify(view==='salida'?'inicio':views.includes(view)?view:'inicio')};`).replace('if(render)await renderTab();',`if(render)await renderTab();${view==='salida'?"if(!window.__modalFixture){window.__modalFixture=true;checkoutView(state.stays.find(s=>JSON.parse(s.service).mode==='hourly').id);}":''}`).replace("if('serviceWorker'in navigator", "if(false");}return new Response(body,{headers:{'Content-Type':mime[extname(filename)]||'application/octet-stream'}});}catch{return new Response('No disponible',{status:404});}}};
  if(offline&&url.pathname.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});res.end('{"error":"SIMULACIÓN: sin conexión"}');return;}
  const chunks=[];for await(const c of req)chunks.push(c);const h=new Headers(req.headers);h.set('CF-Connecting-IP','127.0.0.1');h.set('Cookie',cookie);const response=await worker.fetch(new Request(url,{method:req.method,headers:h,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}),{...f.env,ASSETS:assets}),out=Object.fromEntries(response.headers);delete out['x-frame-options'];out['content-security-policy']=out['content-security-policy']?.replace("frame-ancestors 'none'","frame-ancestors http://127.0.0.1:4840");res.writeHead(response.status,out);res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500);res.end('Error del escenario sintético');}}).listen(port,'127.0.0.1');
}
createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:4840');
 if(url.pathname==='/__audit'){
  if(req.method==='POST'){const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);if(body.length<16000){const d=JSON.parse(body);if(typeof d.id==='string'&&d.type==='layout')audit.set(d.id,d);}}
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify([...audit.values()]));return;
 }
 if(url.pathname==='/__connection'){offline=url.searchParams.get('offline')==='1';res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({offline}));return;}
 res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end(harness(url,views));
}).listen(4840,'127.0.0.1',()=>console.log('Revisión UI local: http://127.0.0.1:4840/ · Sólo datos sintéticos.'));
