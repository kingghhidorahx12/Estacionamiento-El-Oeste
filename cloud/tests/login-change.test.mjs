import test from 'node:test';import assert from 'node:assert/strict';
import {createWorker} from '../worker.mjs';import {SqliteD1,seed} from './helpers.mjs';
test('changing the login and PIN preserves the current trusted session, closes others and keeps ledger identity',async()=>{
 const db=new SqliteD1(),f=await seed(db),worker=createWorker({clock:()=>f.at}),owner=f.users[0];
 const call=async(path,{body,auth={},key=crypto.randomUUID()}={})=>{const headers={Cookie:['__Host-oeste-device='+owner.deviceToken,auth.cookie].filter(Boolean).join('; '),'CF-Connecting-IP':'192.0.2.1'};if(body!==undefined)Object.assign(headers,{'Content-Type':'application/json',Origin:'https://oeste.test','X-CSRF':auth.csrf||'','Idempotency-Key':key});const r=await worker.fetch(new Request('https://oeste.test/api/'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)}),f.env);const data=await r.json();return {status:r.status,data,cookie:r.headers.getSetCookie().map(v=>v.split(';')[0]).join('; '),csrf:data.csrf};};
 try{
  const a=await call('login',{body:{name:owner.name,password:'65432198'}}),b=await call('login',{body:{name:owner.name,password:'65432198'}});assert.equal(a.status,200);
  const entry=await call('entry',{auth:a,body:{card:1,vehicle:{plate:'SYNTHETIC1'},service:{mode:'hourly'}}});assert.equal(entry.status,200);
  assert.equal((await call('checkout',{auth:a,body:{id:entry.data.id,expectedTotal:1000,paymentConfirmed:true,vehicleConfirmed:true}})).status,200);
  const key=crypto.randomUUID(),body={id:owner.id,loginName:'ManagerNew',displayName:'Manager New',pin:'97531864',role:'admin',active:true};
  const changed=await call('user-update',{auth:a,key,body});assert.equal(changed.status,200);assert.equal(changed.data.loginName,'managernew');assert.equal(changed.data.reauthenticate,false);
  assert.equal((await call('user-update',{auth:a,key,body})).status,200);assert.equal((await call('state',{auth:b})).status,401);
  const state=await call('state',{auth:a});assert.equal(state.status,200);assert.equal(state.data.accountLogin,'managernew');assert.equal(state.data.login,owner.name);
  assert.equal(db.db.prepare('SELECT actor FROM payments').get().actor,owner.name);assert.equal(db.db.prepare('SELECT name FROM users WHERE id=?').get(owner.id).name,owner.name);
  assert.equal((await call('login',{body:{name:owner.name,password:'65432198'}})).status,401);
  assert.equal((await call('login',{body:{name:'MANAGERNEW',password:'97531864'}})).status,200);
  assert.equal((await call('user-update',{auth:a,body:{...body,loginName:f.users[1].name}})).data.code,'LOGIN_TAKEN');
  assert.equal((await call('user-delete',{auth:a,body:{id:f.users[1].id,confirmed:true}})).status,200);
  assert.equal((await call('user-update',{auth:a,body:{...body,loginName:f.users[1].name}})).status,200);
  const reused=await call('login',{body:{name:f.users[1].name,password:'97531864'}});assert.equal(reused.status,200);assert.equal(reused.data.role,'admin');
  const archived=db.db.prepare('SELECT name,active,deleted_at FROM users WHERE id=?').get(f.users[1].id);assert.equal(archived.name,f.users[1].name);assert.equal(archived.active,0);assert.ok(archived.deleted_at);
 }finally{db.db.close();}
});
