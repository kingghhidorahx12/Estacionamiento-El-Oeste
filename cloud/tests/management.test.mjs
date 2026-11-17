import test from 'node:test';import assert from 'node:assert/strict';
import {createWorker} from '../worker.mjs';import {SqliteD1,seed} from './helpers.mjs';
async function fixture(){
 const db=new SqliteD1(),f=await seed(db),env={...f.env},worker=createWorker({clock:()=>f.at}),auth={};
 await db.prepare("INSERT INTO meta VALUES('sourceKind','synthetic')").run();
 async function call(path,{actor='owner',body,key=crypto.randomUUID(),device,epoch,csrf,origin='https://oeste.test'}={}){
  const user=f.users.find(u=>u.id===actor),credentials=auth[actor]||{},headers={Cookie:[credentials.token,device===null?'':'__Host-oeste-device='+(device||user.deviceToken)].filter(Boolean).join('; '),'CF-Connecting-IP':'192.0.2.1'};
  if(body!==undefined)Object.assign(headers,{'Content-Type':'application/json',Origin:origin,'X-CSRF':csrf??credentials.csrf??'','Idempotency-Key':key});if(epoch!==undefined)headers['X-Oeste-Epoch']=epoch;
  const r=await worker.fetch(new Request('https://oeste.test/api/'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)}),env);
  return {status:r.status,data:await r.json(),cookie:r.headers.getSetCookie().map(x=>x.split(';')[0]).join('; ')};
 }
 async function login(actor='owner',options={}){const u=f.users.find(u=>u.id===actor),r=await call('login',{actor,body:{name:u.name,password:'65432198',deviceLabel:'Celular de recepción'},...options});if(r.status===200)auth[actor]={token:r.cookie,csrf:r.data.csrf};return r;}
 await login();return {...f,db,env,auth,call,login,close:()=>db.db.close()};
}
async function visit(f,card=1,actor='owner'){return (await f.call('entry',{actor,body:{card,vehicle:{plate:'PRUEBA'+card},service:{mode:'hourly'}}})).data;}
test('device administration identifies the current browser, approves distinct tokens, renames and denies requests',async()=>{const f=await fixture();try{
 const p=await f.login('owner',{device:null});assert.equal(p.status,202);const initial=(await f.call('devices')).data;assert.equal(initial.devices.filter(d=>d.current).length,1);const r=initial.requests.find(r=>r.code===p.data.requestCode);assert.ok(r);
 assert.equal((await f.call('device-approve',{body:{id:r.id,confirmed:true}})).status,200);
 const list=(await f.call('devices')).data;assert.equal(list.devices.filter(d=>d.current).length,1);assert.equal(list.devices.filter(d=>d.login==='ownercase').length,2);assert.ok(!JSON.stringify(list).includes('token_hash'));
 assert.equal((await f.call('device-rename',{body:{id:r.id,label:'Celular del cliente'}})).status,200);assert.equal((await f.call('devices')).data.devices.find(d=>d.id===r.id).label,'Celular del cliente');
 const pending=await f.login('employee',{device:null}),req=(await f.call('devices')).data.requests.find(r=>r.code===pending.data.requestCode);assert.equal((await f.call('device-deny',{body:{id:req.id}})).status,200);assert.equal((await f.call('device-approve',{body:{id:req.id,confirmed:true}})).status,409);
 await f.login('employee');assert.equal((await f.call('devices',{actor:'employee'})).status,403);assert.equal((await f.call('device-rename',{actor:'employee',body:{id:r.id,label:'No permitido'}})).status,403);
 }finally{f.close();}});
test('deleting an employee revokes sessions and pending requests while preserving payments, identity and audit',async()=>{const f=await fixture();try{
 await f.login('employee');const s=await visit(f,1,'employee');await f.call('checkout',{actor:'employee',body:{id:s.id,expectedTotal:1000,paymentConfirmed:true,vehicleConfirmed:true}});await f.login('employee',{device:null});
 const key=crypto.randomUUID(),body={id:'employee',confirmed:true};assert.equal((await f.call('user-delete',{key,body})).status,200);assert.equal((await f.call('user-delete',{key,body})).status,200);
 assert.equal((await f.call('state',{actor:'employee'})).status,401);assert.equal((await f.login('employee')).status,401);assert.equal((await f.call('state')).data.users.some(u=>u.id==='employee'),false);
 const u=f.db.db.prepare("SELECT * FROM users WHERE id='employee'").get();assert.equal(u.active,0);assert.ok(u.deleted_at);assert.equal(f.db.db.prepare('SELECT count(*) n FROM payments').get().n,1);assert.equal(f.db.db.prepare('SELECT actor FROM payments').get().actor,'empleadouno');assert.equal(f.db.db.prepare("SELECT count(*) n FROM device_requests WHERE user_id='employee' AND state='pending'").get().n,0);
 assert.equal((await f.call('user-update',{body:{id:'employee',role:'employee',active:true}})).status,409);assert.equal(f.db.db.prepare("SELECT count(*) n FROM audit WHERE action='user_deleted'").get().n,1);
 assert.equal((await f.call('user-delete',{body:{id:'owner',confirmed:true}})).status,409);
 }finally{f.close();}});
test('administrators can delete another administrator, but concurrent removal cannot eliminate both',async()=>{const f=await fixture();try{
 assert.equal((await f.call('user-update',{body:{id:'employee2',role:'admin',active:true}})).status,200);await f.login('employee2');
 const result=await Promise.all([f.call('user-delete',{body:{id:'employee2',confirmed:true}}),f.call('user-delete',{actor:'employee2',body:{id:'owner',confirmed:true}})]);
 assert.equal(result.filter(r=>r.status===200).length,1);assert.equal(f.db.db.prepare("SELECT count(*) n FROM users WHERE role='admin' AND active=1 AND deleted_at IS NULL").get().n,1);
 }finally{f.close();}});
test('delivery cleanup rolls back completely on failure, is idempotent and blocks stale operations after reset',async()=>{const f=await fixture();try{
 const s=await visit(f),payKey=crypto.randomUUID(),payment={id:s.id,expectedTotal:1000,paymentConfirmed:true,vehicleConfirmed:true};await f.call('checkout',{key:payKey,body:payment});await visit(f,2);
 f.db.db.exec("UPDATE cards SET state='suspended' WHERE id=60");
 assert.equal((await f.call('monthly',{body:{mode:'24h',start:f.at,end:f.at+86400000,vehicle:{plate:'MENSUAL',type:'auto',color:'Blanco'},manualDatesConfirmed:true,payNow:false}})).status,200);
 const tokens=f.db.db.prepare('SELECT id,token_hash,token_box FROM cards ORDER BY id').all(),settings=f.db.db.prepare('SELECT * FROM settings').all(),users=f.db.db.prepare('SELECT * FROM users').all();assert.throws(()=>f.db.db.exec('DELETE FROM payments'),/IMMUTABLE/);
 const preview=(await f.call('delivery-status')).data;assert.equal(preview.allowed,true);assert.equal(preview.counts.payments,1);assert.equal(preview.counts.monthly,1);
 const body={snapshot:preview.snapshot,pin:'65432198',confirmed:true,confirmation:'LIMPIAR'},key=crypto.randomUUID();f.db.failAt=18;assert.equal((await f.call('delivery-reset',{key,body})).status,503);
 assert.equal(f.db.db.prepare('SELECT count(*) n FROM stays').get().n,2);assert.equal(f.db.db.prepare('SELECT count(*) n FROM payments').get().n,1);assert.equal(f.db.db.prepare('SELECT count(*) n FROM maintenance_reset_gate').get().n,0);assert.equal((await f.call('operation?key='+key)).data.found,false);
 const reset=await f.call('delivery-reset',{key,body});assert.equal(reset.status,200);assert.equal(reset.data.operationEpoch,'1');assert.equal((await f.call('delivery-reset',{key,body})).status,200);
 for(const table of ['stays','payments','monthly','maintenance_reset_gate'])assert.equal(f.db.db.prepare('SELECT count(*) n FROM '+table).get().n,0);
 assert.deepEqual(f.db.db.prepare('SELECT id,token_hash,token_box FROM cards ORDER BY id').all(),tokens);assert.deepEqual(f.db.db.prepare('SELECT * FROM users').all(),users);assert.deepEqual(f.db.db.prepare('SELECT * FROM settings').all(),settings);
 assert.equal(f.db.db.prepare('SELECT state FROM cards WHERE id=2').get().state,'available');assert.equal(f.db.db.prepare('SELECT state FROM cards WHERE id=60').get().state,'suspended');
 assert.equal((await f.call('operation?key='+payKey)).data.found,false);assert.equal((await f.call('checkout',{key:payKey,body:payment,epoch:'0'})).data.code,'STALE_STATE');
 assert.equal((await f.call('entry',{body:{card:3,vehicle:{plate:'ANTIGUA'},service:{mode:'hourly'}}})).data.code,'STALE_STATE');assert.equal((await f.call('state')).data.operationEpoch,'1');
 assert.equal((await f.call('entry',{epoch:'1',body:{card:3,vehicle:{plate:'NUEVA'},service:{mode:'hourly'}}})).status,200);assert.equal(f.db.db.prepare("SELECT count(*) n FROM audit WHERE action='delivery_reset'").get().n,1);
 }finally{f.close();}});
test('cleanup requires admin, CSRF, PIN, confirmation, a fresh preview and explicitly synthetic installation',async()=>{const f=await fixture();try{
 await visit(f);await f.login('employee');assert.equal((await f.call('delivery-status',{actor:'employee'})).status,403);assert.equal((await f.call('user-delete',{actor:'employee',body:{id:'owner',confirmed:true}})).status,403);
 const p=(await f.call('delivery-status')).data,body={snapshot:p.snapshot,pin:'65432198',confirmed:true,confirmation:'LIMPIAR'};
 assert.equal((await f.call('delivery-reset',{body,csrf:'forged'})).status,403);assert.equal((await f.call('delivery-reset',{body:{...body,pin:'000000'}})).status,401);assert.equal((await f.call('delivery-reset',{body:{...body,confirmed:false}})).status,400);
 await visit(f,2);assert.equal((await f.call('delivery-reset',{body})).data.code,'RESET_CHANGED');
 f.db.db.exec("UPDATE meta SET value='real' WHERE id='sourceKind'");assert.equal((await f.call('delivery-status')).data.allowed,false);assert.equal((await f.call('delivery-reset',{body})).data.code,'RESET_UNAVAILABLE');
 f.db.db.exec("UPDATE meta SET value='synthetic' WHERE id='sourceKind'");f.env.ENVIRONMENT='production';assert.equal((await f.call('delivery-status')).data.allowed,false);assert.equal((await f.call('delivery-reset',{body})).data.code,'RESET_UNAVAILABLE');assert.equal(f.db.db.prepare('SELECT count(*) n FROM stays').get().n,2);
 }finally{f.close();}});
