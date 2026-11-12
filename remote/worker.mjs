const CATEGORIES=new Set(['parking_hourly_normal','parking_hourly_preferred','time_free_normal','time_free_preferred','day_addon','wash_auto','wash_camioneta','wash_van','wash_pickup','pension_temporary','pension_monthly_12','pension_monthly_24','lost_card']);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const assert=(value,message)=>{if(!value)throw new Error(message);};
const integer=n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000;
const b64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
let jwks=null,jwksAt=0;
async function owner(request,env){
  const team=env.ACCESS_TEAM_DOMAIN,aud=env.ACCESS_AUD;
  if(!team?.match(/^[a-z0-9-]+\.cloudflareaccess\.com$/)||!aud||aud.startsWith('REEMPLAZAR'))return false;
  try{
    const jwt=request.headers.get('Cf-Access-Jwt-Assertion')||'',parts=jwt.split('.');if(parts.length!==3)return false;
    const header=JSON.parse(new TextDecoder().decode(b64(parts[0]))),payload=JSON.parse(new TextDecoder().decode(b64(parts[1])));
    if(header.alg!=='RS256'||payload.iss!=='https://'+team||!Array.isArray(payload.aud)||!payload.aud.includes(aud)||!payload.exp||payload.exp*1000<Date.now()||payload.nbf*1000>Date.now())return false;
    if(!jwks||Date.now()-jwksAt>3600000){const response=await fetch('https://'+team+'/cdn-cgi/access/certs');if(!response.ok)return false;jwks=await response.json();jwksAt=Date.now();}
    const jwk=jwks.keys.find(k=>k.kid===header.kid);if(!jwk)return false;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,b64(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
  }catch{return false;}
}
async function digest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(v=>v.toString(16).padStart(2,'0')).join('');}
export function validateEvent(e){
  assert(Object.keys(e).every(k=>['id','installation','epoch','seq','paid','actor','total','lines'].includes(k)),'Unexpected event fields');
  assert(/^[a-f0-9]{64}$/.test(e.epoch)&&/^[a-f0-9]{64}$/.test(e.installation)&&/^[a-f0-9-]{36}$/.test(e.id),'Invalid identifiers');
  assert(Number.isSafeInteger(e.seq)&&e.seq>0&&Number.isSafeInteger(e.paid)&&e.paid>1577836800000,'Invalid time or sequence');
  assert(typeof e.actor==='string'&&/^[a-zA-Z0-9._-]{3,40}$/.test(e.actor),'Invalid actor');
  assert(integer(e.total)&&Array.isArray(e.lines)&&e.lines.length>0&&e.lines.length<=12,'Invalid payment');
  let sum=0;for(const l of e.lines){assert(Object.keys(l).every(k=>k==='category'||k==='cents')&&CATEGORIES.has(l.category)&&integer(l.cents),'Invalid category');sum+=l.cents;}
  assert(sum===e.total,'Unbalanced payment');return e;
}
async function ingest(request,env){
  if(!env.SYNC_TOKEN||env.SYNC_TOKEN.length<32||request.headers.get('Authorization')!=='Bearer '+env.SYNC_TOKEN)return json({error:'Unauthorized'},401);
  const raw=await request.text();if(raw.length>131072)return json({error:'Too large'},413);
  const body=JSON.parse(raw);assert(Array.isArray(body.events)&&body.events.length<=50,'Invalid batch');
  const snapshot=body.snapshot;assert(snapshot&&Object.keys(snapshot).every(k=>['installation','at','occupancy','entries','exits'].includes(k))&&/^[a-f0-9]{64}$/.test(snapshot.installation)&&Number.isSafeInteger(snapshot.at)&&Number.isInteger(snapshot.occupancy)&&snapshot.occupancy>=0&&snapshot.occupancy<=30&&Number.isInteger(snapshot.entries)&&snapshot.entries>=0&&Number.isInteger(snapshot.exits)&&snapshot.exits>=0,'Invalid snapshot');
  const batch=[],fingerprints=[];
  for(const e of body.events){validateEvent(e);assert(e.installation===snapshot.installation,'Installation mismatch');const safe={installation:e.installation,id:e.id,epoch:e.epoch,seq:e.seq,paid:e.paid,actor:e.actor,total:e.total,lines:e.lines.map(l=>({category:l.category,cents:l.cents}))};const fp=await digest(JSON.stringify(safe));fingerprints.push([e,fp]);
    const old=await env.DB.prepare('SELECT fingerprint FROM payments WHERE installation=? AND (id=? OR (epoch=? AND seq=?))').bind(e.installation,e.id,e.epoch,e.seq).first();assert(!old||old.fingerprint===fp,'Immutable payment conflict');
    batch.push(env.DB.prepare('INSERT OR IGNORE INTO payments VALUES(?,?,?,?,?,?,?,?,?)').bind(e.installation,e.id,e.epoch,e.seq,e.paid,e.actor,e.total,JSON.stringify(safe.lines),fp));
  }
  batch.push(env.DB.prepare('INSERT INTO snapshots VALUES(?,?,?,?,?,?) ON CONFLICT(installation) DO UPDATE SET at=excluded.at,occupancy=excluded.occupancy,entries=excluded.entries,exits=excluded.exits,confirmed=excluded.confirmed WHERE excluded.at>=snapshots.at').bind(snapshot.installation,snapshot.at,snapshot.occupancy,snapshot.entries,snapshot.exits,Date.now()));
  await env.DB.batch(batch);
  for(const [e,fp] of fingerprints){const row=await env.DB.prepare('SELECT fingerprint FROM payments WHERE installation=? AND id=? AND seq=?').bind(e.installation,e.id,e.seq).first();assert(row?.fingerprint===fp,'Payment confirmation conflict');}
  return json({ok:true,accepted:body.events.length});
}
export default {async fetch(request,env){try{const url=new URL(request.url);
  if(url.pathname==='/ingest'){if(request.method!=='POST')return json({error:'Method not allowed'},405);return await ingest(request,env);}
  if(!await owner(request,env))return json({error:'Acceso exclusivo del propietario mediante Cloudflare Access.'},401);
  if(request.method!=='GET')return json({error:'Panel de sólo consulta.'},405);
  if(url.pathname==='/api/report'){
    const date=url.searchParams.get('date');assert(/^\d{4}-\d{2}-\d{2}$/.test(date),'Invalid date');const start=Date.parse(date+'T00:00:00-06:00');assert(Number.isFinite(start),'Invalid date');
    const {results:rows}=await env.DB.prepare('SELECT id,paid,actor,total,lines FROM payments WHERE paid>=? AND paid<? ORDER BY paid DESC LIMIT 1000').bind(start,start+86400000).all();
    const categories=Object.fromEntries([...CATEGORIES].map(k=>[k,0])),employees={};let total=0;
    for(const p of rows){total+=p.total;employees[p.actor]=(employees[p.actor]||0)+p.total;for(const l of JSON.parse(p.lines))categories[l.category]+=l.cents;}
    const {results:snapshots}=await env.DB.prepare('SELECT at,occupancy,entries,exits,confirmed FROM snapshots').all();
    return json({date,total,categories,employees,payments:rows,snapshots,truncated:rows.length===1000});
  }
  const response=await env.ASSETS.fetch(request);const secure=new Response(response.body,response);secure.headers.set('Cache-Control','no-store');secure.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'; base-uri 'none'");secure.headers.set('X-Content-Type-Options','nosniff');return secure;
}catch(e){return json({error:'No se procesó la solicitud; verifica la configuración y los datos.'},400);}}};
