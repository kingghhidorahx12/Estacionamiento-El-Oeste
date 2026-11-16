import {requireThat,validateConfig,defaults,amount} from './rules.mjs';import {random,hash,seal} from './crypto.mjs';
export const TABLE_FIELDS={settings:['version','body','created','actor'],users:['id','name','display_name','salt','hash','role','active','identity','totp_box','totp_step','revision'],cards:['id','token_hash','token_box','state','revision'],stays:['id','card_id','vehicle','service','entered','actor','state','exited','revision'],monthly:['id','mode','start_at','end_at','vehicle','actor','created','revision'],payments:['id','stay_id','monthly_id','lines','total','actor','paid'],audit:['id','at','actor','action','entity','detail'],meta:['id','value']};
export function reconcile(tables){
 const t=tables,cardIds=new Set(t.cards.map(c=>c.id)),active=t.stays.filter(s=>s.state==='active'),tokens=new Set(t.cards.map(c=>c.token_hash)),cardActive=new Set();requireThat(t.cards.length===60&&cardIds.size===60&&tokens.size===60&&Array.from({length:60},(_,i)=>i+1).every(id=>cardIds.has(id)),'Inventario incompleto.');requireThat(active.length<=30,'Ocupación inválida.');
 for(const s of active){requireThat(!cardActive.has(s.card_id),'Tarjeta con dos estancias activas.');cardActive.add(s.card_id);requireThat(['assigned','lost'].includes(t.cards.find(c=>c.id===s.card_id)?.state),'Estancia y tarjeta inconsistentes.');}
 for(const c of t.cards)requireThat(c.state!=='assigned'||cardActive.has(c.id),'Tarjeta asignada sin estancia.');
 requireThat(t.users.some(u=>u.active&&u.role==='admin'),'Falta administrador activo.');
 const paymentIds=new Set(),stayPaid=new Set(),monthlyPaid=new Set(),categories={};let total=0;
 for(const p of t.payments){requireThat(!paymentIds.has(p.id),'Pago duplicado.');paymentIds.add(p.id);if(p.stay_id){requireThat(!stayPaid.has(p.stay_id),'Estancia cobrada dos veces.');stayPaid.add(p.stay_id);requireThat(t.stays.some(s=>s.id===p.stay_id),'Pago sin estancia.');}if(p.monthly_id){requireThat(!monthlyPaid.has(p.monthly_id),'Mensualidad cobrada dos veces.');monthlyPaid.add(p.monthly_id);requireThat(t.monthly.some(m=>m.id===p.monthly_id),'Pago sin pensión.');}const lines=JSON.parse(p.lines);let sum=0;for(const l of lines){sum+=amount(l,'cents');categories[l.category]=(categories[l.category]||0)+l.cents;}requireThat(sum===amount(p,'total'),'Pago sin conciliar.');total+=sum;}
 const latest=[...t.settings].sort((a,b)=>b.version-a.version)[0];requireThat(latest,'Falta configuración.');validateConfig(JSON.parse(latest.body));
 return {counts:Object.fromEntries(Object.keys(TABLE_FIELDS).map(name=>[name,t[name].length])),active:active.length,payments:t.payments.length,total,categories,rateVersion:latest.version};
}
export async function convertDocument(document,mapping,env,at=Date.now()){
 requireThat(['mx.eloeste.servidor','mx.eloeste.cloud'].includes(document.application)&&document.schema===1,'Respaldo de otra aplicación o esquema.');const old=document.tables;requireThat(old&&Object.keys(TABLE_FIELDS).every(t=>Array.isArray(old[t])),'Respaldo incompleto.');
 const result=Object.fromEntries(Object.keys(TABLE_FIELDS).map(t=>[t,[]]));
 for(const name of ['settings','stays','monthly','payments','audit'])result[name]=old[name].map(row=>Object.fromEntries(TABLE_FIELDS[name].map(k=>[k,row[k]??(k==='revision'?0:null)])));
 for(const u of old.users){const identity=mapping.identities?.[u.name]||u.identity||'',mfa=mapping.mfa?.[u.name],secret=mfa?.secret||u.totpSecret;let totpBox=null;
  requireThat(!identity||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity),'Correo inválido para '+u.name);
  requireThat(typeof u.salt==='string'&&/^[a-f0-9]{64}$/.test(u.hash),'Hash de usuario incompatible.');
  if(secret)totpBox=await seal(secret,env.DATA_KEY,'totp:'+u.id);
  result.users.push({id:u.id,name:u.name,display_name:u.display_name||u.name,salt:u.salt,hash:u.hash,role:u.role,active:u.active,identity:identity.toLowerCase(),totp_box:totpBox,totp_step:-1,revision:0});
 }
 requireThat([35,60].includes(old.cards.length),'Inventario original incompleto.');
 for(const c of old.cards){requireThat(/^[a-f0-9]{64}$/.test(c.token),'QR original incompatible.');result.cards.push({id:c.id,token_hash:await hash(c.token),token_box:await seal(c.token,env.DATA_KEY,'card:'+c.id),state:c.state,revision:0});}
 for(let id=1;id<=60;id++)if(!result.cards.some(c=>c.id===id)){const token=random();result.cards.push({id,token_hash:await hash(token),token_box:await seal(token,env.DATA_KEY,'card:'+id),state:'available',revision:0});}
 let latest=[...result.settings].sort((a,b)=>b.version-a.version)[0];requireThat(latest,'Falta configuración.');let c=JSON.parse(latest.body),version=latest.version;
 const add=()=>{result.settings.push({version:++version,body:JSON.stringify(c),created:at,actor:'system'});};
 if(!Object.hasOwn(c,'freeNormal')){const d=defaults();for(const k of ['freeNormal','freePreferred','monthlyNightStart','monthlyNightEnd'])c[k]=d[k];c.monthly=d.monthly;add();}
 if(!Object.hasOwn(c,'normalFromStart')){Object.assign(c,{ordinary:1500,preferred:1000,graceMinutes:10,normalPartial:1000,normalFromStart:true});add();}
 if(!Object.hasOwn(c,'preferredFullHour')){Object.assign(c,{preferred:1000,freePreferred:4000,preferredFullHour:true});add();}
 result.meta=(old.meta||[]).filter(x=>['installation','lastBackup'].includes(x.id)).map(x=>({id:x.id,value:x.value}));result.meta.push({id:'authority',value:'inactive'},{id:'sourceKind',value:mapping.sourceKind},{id:'importedAt',value:String(at)});
 reconcile(result);result.audit.push({id:result.audit.reduce((n,a)=>Math.max(n,a.id),0)+1,at,actor:'system',action:'cloud_import_prepared',entity:'cloud',detail:JSON.stringify({sourceKind:mapping.sourceKind,sourceCreated:document.created})});
 return {tables:result,evidence:reconcile(result)};
}
const sqlValue=v=>v==null?'NULL':typeof v==='number'?(requireThat(Number.isSafeInteger(v),'Número no entero en importación.'),String(v)):"'"+String(v).replaceAll("'","''")+"'";
export function importSql(tables){const lines=['PRAGMA defer_foreign_keys=ON;'];for(const table of ['settings','users','cards','monthly','stays','payments','audit','meta'])for(const row of tables[table]){const fields=TABLE_FIELDS[table];lines.push(`INSERT INTO ${table}(${fields.join(',')}) VALUES(${fields.map(k=>sqlValue(row[k])).join(',')});`);}return lines.join('\n')+'\n';}
