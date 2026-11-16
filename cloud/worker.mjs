import {Fault,requireThat} from './lib/rules.mjs';
import {Api} from './lib/api.mjs';
import {Store,operation} from './lib/store.mjs';
import {fingerprint,hash,open} from './lib/crypto.mjs';
import {requestIdentity,originCheck,session,login,cookie,cookieToken} from './lib/auth.mjs';
import {setupStatus,setup} from './lib/setup.mjs';
const headers={
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Strict-Transport-Security':'max-age=31536000',
 'Content-Security-Policy':"default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'",
 'Permissions-Policy':'camera=(self), microphone=(), geolocation=()','X-Frame-Options':'DENY'
};
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,...extra}});
async function expandResult(result,store){if(!result?.backupRef)return result;const rows=await store.all('SELECT data FROM backup_chunks WHERE operation_id=? ORDER BY chunk_index',result.backupRef);requireThat(rows.length>0,'Respaldo no disponible; genera una copia nueva.',409);return {backup:JSON.parse(rows.map(x=>x.data).join(''))};}
async function bodyJson(request,path){const max=65536,length=Number(request.headers.get('Content-Length')||0);requireThat(length<=max,'Solicitud demasiado grande.',413);const chunks=[],reader=request.body?.getReader();let bytes=0;if(reader){for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>max){await reader.cancel();throw new Fault('Solicitud demasiado grande.',413);}chunks.push(value);}}const joined=new Uint8Array(bytes);let offset=0;for(const c of chunks){joined.set(c,offset);offset+=c.length;}try{const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(joined));requireThat(value&&typeof value==='object'&&!Array.isArray(value),'Solicitud inválida.');requireThat(!Object.keys(value).some(k=>/^(photo|image|photograph|foto)$/i.test(k)),'No se reciben fotografías.');return value;}catch(e){if(e instanceof Fault)throw e;throw new Fault('JSON inválido.');}finally{joined.fill(0);}}
export function createWorker({clock=Date.now}={}){return {async fetch(request,env,context){
 const started=performance.now(),at=clock(),url=new URL(request.url),path=url.pathname.replace(/^\/api\//,''),isApi=url.pathname.startsWith('/api/');let store,status=500,identity;
 try{
  // Health reveals no configuration, installation, user, QR or financial data.
  if(url.pathname==='/health'&&request.method==='GET'){status=200;return json({service:'el-oeste',version:'cloud-1',deploymentId:env.WORKER_VERSION?.id||'local',status:'reachable',configured:!!env.DATA_KEY&&!!env.REQUEST_KEY});}
  if(/^\/connect(?:\.html|\.js|\.css)?$/.test(url.pathname)){status=303;return new Response(null,{status:303,headers:{Location:'/',...headers}});}
  if(!isApi){requireThat(['GET','HEAD'].includes(request.method),'Método no admitido.',405);const response=await env.ASSETS.fetch(request),out=new Response(response.body,response);for(const [key,value]of Object.entries(headers))if(!['Content-Type','Cache-Control'].includes(key))out.headers.set(key,value);out.headers.set('Cache-Control',url.pathname.startsWith('/vendor/')||/\.(png|svg|ttf)$/.test(url.pathname)?'public, max-age=86400':'no-cache');status=response.status;return out;}
  identity=requestIdentity(request);requireThat(env.DB&&env.DATA_KEY&&env.REQUEST_KEY,'Servidor de ensayo pendiente de inicialización protegida.',503,'CONFIG');store=new Store(env.DB);
  requireThat(['GET','POST'].includes(request.method),'Método no admitido.',405);
  if(request.method==='POST')originCheck(request);
  if(path==='setup-status'&&request.method==='GET'){status=200;return json(await setupStatus(store,env,at));}
  if(path==='setup'&&request.method==='POST'){const result=await setup(store,env,await bodyJson(request,path),at);status=200;const response=json(result.data);for(const value of result.cookies)response.headers.append('Set-Cookie',value);return response;}
  if(path==='login'&&request.method==='POST'){const result=await login(store,request,env,identity,await bodyJson(request,path),at);status=result.status||200;const response=json(result.data,status);for(const value of result.cookies)response.headers.append('Set-Cookie',value);return response;}
  const user=await session(store,request,identity,at),api=new Api(store,env,user,at);
  if(request.method==='GET'){
   if(path==='operation'){
    const key=url.searchParams.get('key');requireThat(/^[a-zA-Z0-9_-]{16,100}$/.test(key||''),'Identificador inválido.');const prior=await store.one('SELECT id,result_box FROM operations WHERE user_id=? AND request_key=?',user.id,key);status=200;return json(prior?{found:true,result:await expandResult(await open(prior.result_box,env.DATA_KEY,'operation:'+prior.id),store)}:{found:false});
   }
   const result=await api.read(path,url.searchParams);status=200;return json(result);
  }
  requireThat(request.headers.get('X-CSRF')===user.csrf,'Sesión inválida; vuelve a iniciar sesión.',403,'CSRF');
  if(path==='logout'){await store.run('DELETE FROM sessions WHERE token=?',await hash(cookieToken(request)));status=200;return json({ok:true},200,{'Set-Cookie':cookie('',false)});}
  const body=await bodyJson(request,path);
  if(path==='scan'){const result=await api.scan(body);status=200;return json(result);}
  const key=request.headers.get('Idempotency-Key')||'';requireThat(/^[a-zA-Z0-9_-]{16,100}$/.test(key),'Falta el identificador único de operación.');const fp=await fingerprint(path,body,env.REQUEST_KEY),prior=await operation(store,user,key,fp,env.DATA_KEY);
  let result=prior;if(!result){try{result=await api.write(path,body,key,fp);}catch(error){const committed=await operation(store,user,key,fp,env.DATA_KEY);if(committed)result=committed;else throw error;}}status=200;return json(await expandResult(result,store));
 }catch(error){
  if(error instanceof Fault){status=error.status;return json({error:error.message,code:error.code},status);}
  // D1 errors can include SQL and bound values. Never log/echo the exception.
  const category=/iteration counts|Pbkdf2|PBKDF2/i.test(String(error?.message))?'CRYPTO_ITERATIONS':/D1_ERROR|SQLITE/.test(String(error?.message))?'DATABASE':'RUNTIME';
  status=503;return json({error:'No hay confirmación del servidor. Consulta el resultado de la operación o reintenta con el mismo identificador.',code:'RESULT_UNCERTAIN',category},503,{'Retry-After':'3'});
 }finally{
  if(env.METRICS==='safe')console.log(JSON.stringify({type:'oeste-request',operation:isApi?['login','state','entry','checkout','scan','history','operation'].includes(path)?path:'other':'asset',method:request.method,status,wallMs:Math.round((performance.now()-started)*100)/100,queries:store?.queries||0,rowsRead:store?.rowsRead||0,rowsWritten:store?.rowsWritten||0,d1Ms:store?.duration||0}));
 }
}};}
export default createWorker();
