import {requireThat} from './rules.mjs';import {hash,equal,password,random} from './crypto.mjs';import {initialRows} from './initialize.mjs';import {deviceCookie} from './auth.mjs';
export async function setupStatus(store,env,at){const first=!await store.one('SELECT id FROM users LIMIT 1'),available=!!env.BOOTSTRAP_HASH&&Number(env.BOOTSTRAP_UNTIL)>at&&!await store.one('SELECT id FROM meta WHERE id=?','bootstrap:'+env.BOOTSTRAP_HASH);return {available,mode:first?'new':'owner'};}
export async function setup(store,env,body,at){
 requireThat((await setupStatus(store,env,at)).available,'El enlace privado ya fue usado, venció o no está habilitado.',409,'SETUP_CLOSED');
 requireThat(typeof body.token==='string'&&/^[a-f0-9]{64}$/.test(body.token)&&equal(await hash(body.token),env.BOOTSTRAP_HASH),'Enlace privado inválido.',403);
 const first=!await store.one('SELECT id FROM users LIMIT 1'),statements=[store.stmt('INSERT INTO meta(id,value) VALUES(?,?)',['bootstrap:'+env.BOOTSTRAP_HASH,String(at)])];let user;
 if(first){
  requireThat(body.emptyConfirmed===true&&['synthetic','real'].includes(body.sourceKind),'Confirma que se trata de una instalación nueva sin datos anteriores.');requireThat(env.ENVIRONMENT!=='staging'||body.sourceKind==='synthetic','Esta configuración no permite incorporar datos operativos.');
  const rows=await initialRows({...body,at},env);user=rows.user;statements.push(store.stmt('INSERT INTO settings VALUES(?,?,?,?)',Object.values(rows.settings)));const fields=Object.keys(user);statements.push(store.stmt(`INSERT INTO users(${fields.join(',')}) VALUES(${fields.map(()=>'?').join(',')})`,Object.values(user)));
  for(let offset=0;offset<rows.cards.length;offset+=12){const cards=rows.cards.slice(offset,offset+12);statements.push(store.stmt('INSERT INTO cards(id,token_hash,token_box,state,revision) VALUES '+cards.map(()=>'(?,?,?,?,?)').join(','),cards.flatMap(c=>[c.id,c.token_hash,c.token_box,c.state,c.revision])));}
  statements.push(store.stmt("INSERT INTO meta(id,value) VALUES('authority',?),('sourceKind',?)",[env.ENVIRONMENT==='staging'?'cloud-test':'inactive',body.sourceKind]));
 }else{
  user=await store.one("SELECT * FROM users WHERE COALESCE(login_name,name)=? AND active=1 AND role='admin'",String(body.name||'').trim().toLowerCase());requireThat(typeof body.pin==='string'&&body.pin.length<=128&&equal(await password(body.pin,user?.salt||'dummy'),user?.hash||''),'Usuario o PIN incorrectos.',403);
 }
 const token=random(),device=crypto.randomUUID();statements.push(store.stmt('INSERT INTO devices(id,user_id,token_hash,label,approved_by,created,expires,user_revision) VALUES(?,?,?,?,?,?,?,?)',[device,user.id,await hash(token),'Navegador del propietario',user.id,at,at+31536000000,user.revision]));
 statements.push(store.stmt('INSERT INTO audit(at,actor,action,entity,detail) VALUES(?,?,?,?,?)',[at,user.name,first?'cloud_initialized':'owner_device_recovered',device,JSON.stringify({privateBootstrap:true,sourceKind:first?body.sourceKind:null})]));
 await store.batch(statements);return {data:{ok:true,message:'Acceso preparado. Inicia sesión con tu usuario y PIN.'},cookies:[deviceCookie(token)]};
}
