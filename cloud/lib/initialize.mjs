import {defaults,validateConfig,requireThat} from './rules.mjs';import {random,hash,seal,password,validPin} from './crypto.mjs';
export async function initialRows({name,identity,pin,at=Date.now()},env){
 const display=typeof name==='string'?name.trim():'',login=display.toLowerCase();requireThat(/^[a-z0-9._-]{3,40}$/.test(login),'Identificador de administrador inválido.');validPin(pin);identity=identity||'';requireThat(typeof identity==='string'&&(!identity||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity)),'Correo inválido.');
 const id=crypto.randomUUID(),salt=random(),user={id,name:login,display_name:display,salt,hash:await password(pin,salt),role:'admin',active:1,identity:identity.trim().toLowerCase(),totp_box:null,totp_step:-1,revision:0},cards=[];
 for(let n=1;n<=60;n++){const token=random();cards.push({id:n,token_hash:await hash(token),token_box:await seal(token,env.DATA_KEY,'card:'+n),state:'available',revision:0});}
 return {user,cards,settings:{version:1,body:JSON.stringify(validateConfig(defaults())),created:at,actor:login}};
}
export async function initialize(store,input,env){
 requireThat(!await store.one('SELECT id FROM users LIMIT 1'),'La base ya tiene usuarios; no se reinicializa.',409);const rows=await initialRows(input,env),tableFields={settings:['version','body','created','actor'],users:Object.keys(rows.user),cards:Object.keys(rows.cards[0])},statements=[];
 for(const [table,records]of [['settings',[rows.settings]],['users',[rows.user]],['cards',rows.cards]])for(const row of records){const fields=tableFields[table];statements.push(store.stmt(`INSERT INTO ${table}(${fields.join(',')}) VALUES(${fields.map(()=>'?').join(',')})`,fields.map(k=>row[k])));}
 statements.push(store.stmt('INSERT INTO audit(at,actor,action,entity,detail) VALUES(?,?,?,?,?)',[input.at||Date.now(),rows.user.name,'cloud_initialized','cloud','{"source":"controlled-initialization"}']));
 // Initial provisioning is performed only against an empty, non-operational D1.
 // Split-free one batch; never call this over a live installation.
 await store.batch(statements);return {id:rows.user.id};
}
