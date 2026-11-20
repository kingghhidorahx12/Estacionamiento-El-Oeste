import {requireThat} from './rules.mjs';
import {hash,password,random,equal,fingerprint} from './crypto.mjs';
export const requestIdentity=request=>({email:request.headers.get('CF-Connecting-IP')||'local-unknown'});
export function originCheck(request){const url=new URL(request.url);requireThat(request.headers.get('Origin')===url.origin,'Origen no autorizado.',403,'ORIGIN');requireThat(request.headers.get('Content-Type')?.split(';')[0]==='application/json','Formato no autorizado.',415);}
export const cookie=(token,expires)=>`__Host-oeste=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${expires?43200:0}`;
export const deviceCookie=token=>`__Host-oeste-device=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`;
function tokenCookie(request,name){return (request.headers.get('Cookie')||'').match(new RegExp('(?:^|;\\s*)'+name+'=([a-f0-9]{64})(?:;|$)'))?.[1]||'';}
export const cookieToken=request=>tokenCookie(request,'__Host-oeste');
export async function session(store,request,identity,at){
 // Both cookies are needed for every role; the network is never an identity.
 const user=await store.one(`SELECT u.*,s.csrf,s.expires,s.token AS session_token,s.device_id
  FROM sessions s JOIN users u ON u.id=s.user_id JOIN devices d ON d.id=s.device_id
  WHERE s.token=? AND s.expires>? AND u.active=1 AND s.user_revision=u.revision
  AND d.user_id=u.id AND d.state='active' AND d.expires>? AND d.token_hash=?`,await hash(cookieToken(request)),at,at,await hash(tokenCookie(request,'__Host-oeste-device')));
 requireThat(user,'Inicia sesión para continuar.',401,'SESSION');return user;
}
export function admin(user){requireThat(user.role==='admin','Se requiere un usuario administrador.',403,'FORBIDDEN');}
export async function rateLimit(store,env,identity,name,at){
 // CF-Connecting-IP is overwritten by Cloudflare. Hash it; never store/log it.
 const buckets=await Promise.all(['network:'+identity.email,'login:'+name].map(x=>fingerprint('auth',x,env.REQUEST_KEY)));
 await store.batch(buckets.map(bucket=>store.stmt('INSERT INTO attempts(bucket,count,until_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=CASE WHEN attempts.until_at<=? THEN 1 ELSE min(attempts.count+1,10000) END,until_at=CASE WHEN attempts.until_at<=? THEN excluded.until_at ELSE attempts.until_at END',[bucket,at+900000,at,at])));
 const counts=await Promise.all(buckets.map(bucket=>store.one('SELECT count FROM attempts WHERE bucket=?',bucket)));
 requireThat(counts[0].count<=30&&counts[1].count<=5,'Demasiados intentos. Espera 15 minutos.',429,'RATE_LIMIT');return buckets[1];
}
export async function verifyAccount(store,env,identity,name,pin,unused,at,{authorization=false}={}){
 requireThat(typeof name==='string'&&name.trim().length<=40&&typeof pin==='string'&&pin.length<=128,'Credenciales inválidas.');name=name.trim().toLowerCase();
 const bucket=await rateLimit(store,env,identity,name,at),account=await store.one('SELECT * FROM users WHERE COALESCE(login_name,name)=?',name);
 const valid=equal(await password(pin,account?.salt||'dummy-salt'),account?.hash||'0'.repeat(64));
 requireThat(valid&&account?.active&&(!authorization||account.role==='admin'),'Usuario o PIN incorrectos.',401,'CREDENTIALS');
 return {account,bucket};
}
export async function login(store,request,env,identity,body,at){
 const {account,bucket}=await verifyAccount(store,env,identity,body.name,body.password,null,at),existing=tokenCookie(request,'__Host-oeste-device'),existingHash=await hash(existing);
 const device=await store.one("SELECT id FROM devices WHERE user_id=? AND token_hash=? AND state='active' AND expires>?",account.id,existingHash,at);
 if(!device){
  const known=existing&&(await store.one("SELECT id FROM devices WHERE token_hash=? AND state='active' AND expires>?",existingHash,at)||await store.one("SELECT id FROM device_requests WHERE token_hash=? AND state='pending' AND expires>?",existingHash,at)),deviceToken=known?existing:random(),tokenHash=await hash(deviceToken);
  let pending=await store.one("SELECT id,code,label FROM device_requests WHERE user_id=? AND token_hash=? AND state='pending' AND expires>? AND user_revision=?",account.id,tokenHash,at,account.revision);
  if(!pending){pending={id:crypto.randomUUID(),code:random().slice(0,10).toUpperCase(),label:String(body.deviceLabel||'Teléfono nuevo').trim()};requireThat(pending.label.length>=3&&pending.label.length<=80,'Nombre del teléfono: de 3 a 80 caracteres.');await store.run("INSERT INTO device_requests(id,user_id,token_hash,code,label,created,expires,user_revision) SELECT ?,id,?,?,?,?,?,revision FROM users WHERE id=? AND active=1 AND revision=?",pending.id,tokenHash,pending.code,pending.label,at,at+900000,account.id,account.revision);}
  await store.run('DELETE FROM attempts WHERE bucket=?',bucket);
  return {status:202,data:{needsApproval:true,requestCode:pending.code,message:'El administrador debe autorizar este teléfono desde Equipo.'},cookies:[deviceCookie(deviceToken)]};
 }
 const token=random(),csrf=random(),nonce='guard-login-'+await hash(token),guard=store.stmt("INSERT INTO attempts(bucket,count,until_at) SELECT ?,CASE WHEN EXISTS(SELECT 1 FROM users u JOIN devices d ON d.user_id=u.id WHERE u.id=? AND u.active=1 AND u.revision=? AND d.id=? AND d.state='active' AND d.expires>?) THEN 1 ELSE NULL END,0",[nonce,account.id,account.revision,device.id,at]);
 await store.batch([guard,store.stmt('INSERT INTO sessions(token,user_id,identity,csrf,expires,user_revision,device_id) VALUES(?,?,?,?,?,?,?)',[await hash(token),account.id,account.identity,csrf,at+43200000,account.revision,device.id]),store.stmt('DELETE FROM attempts WHERE bucket IN (?,?)',[bucket,nonce])]);
 return {data:{csrf,name:account.display_name,role:account.role},cookies:[cookie(token,true)]};
}
