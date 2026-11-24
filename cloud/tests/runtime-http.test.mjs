
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';import {hash} from '../lib/crypto.mjs';import {runtimeMigrationSql} from './helpers.mjs';

test('full Worker in workerd: private owner setup, PIN, browser approval, concurrency and exactly one payment without external auth',async()=>{
 const privateToken='c'.repeat(64),mf=new Miniflare(convertV4MiniflareOptions({name:'oeste-http',compatibilityDate:'2026-11-16',modules:true,script:readFileSync(new URL('../../build/cloud-worker/worker.js',import.meta.url),'utf8'),d1Databases:{DB:'runtime-http'},bindings:{DATA_KEY:'a'.repeat(64),REQUEST_KEY:'b'.repeat(64),BOOTSTRAP_HASH:await hash(privateToken),BOOTSTRAP_UNTIL:String(Date.now()+3600000),ENVIRONMENT:'staging',METRICS:'safe'}}));
 try{
  const db=await mf.getD1Database('DB');
  for(const name of ['0001_authority.sql','0002_devices.sql','0003_capacity_60.sql','0004_management.sql','0005_bathrooms.sql','0006_login_identifier.sql','0007_current_login_uniqueness.sql','0008_catalog_accounts.sql','0009_charge_voids.sql'])await db.exec(runtimeMigrationSql(name));

  async function call(path,{body,cookie='',csrf='',epoch,key=crypto.randomUUID()}={}){
   const start=performance.now(),headers={Cookie:cookie,'CF-Connecting-IP':'192.0.2.1'};
   if(body!==undefined)Object.assign(headers,{'Content-Type':'application/json',Origin:'https://oeste.test','X-CSRF':csrf,'Idempotency-Key':key});
   if(epoch!==undefined)headers['X-Oeste-Epoch']=epoch;
   const r=await mf.dispatchFetch('https://oeste.test/api/'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});
   return {status:r.status,data:await r.json(),cookie:r.headers.getSetCookie().map(x=>x.split(';')[0]).join('; '),wallMs:performance.now()-start};
  }

  const setup=await call('setup',{body:{token:privateToken,name:'OwnerCase',pin:'65432198',sourceKind:'synthetic',emptyConfirmed:true}});
  assert.equal(setup.status,200,JSON.stringify(setup.data));
  assert.equal((await call('setup',{body:{token:privateToken,name:'Replacement',pin:'65432198',sourceKind:'synthetic',emptyConfirmed:true}})).status,409);

  const owner=await call('login',{cookie:setup.cookie,body:{name:'OwnerCase',password:'65432198'}});
  assert.equal(owner.status,200,JSON.stringify(owner.data));
  const ownerAuth={cookie:setup.cookie+'; '+owner.cookie,csrf:owner.data.csrf};
  assert.equal((await call('state',{cookie:owner.cookie})).status,401);
  assert.equal((await call('users',{...ownerAuth,body:{name:'EmpleadoUno',password:'98765432',role:'employee'}})).status,200);

  const pending=await call('login',{body:{name:'EmpleadoUno',password:'98765432'}});
  assert.equal(pending.status,202);
  assert.equal((await call('state',{cookie:pending.cookie})).status,401);
  const requested=(await call('devices',ownerAuth)).data.requests.find(r=>r.code===pending.data.requestCode);
  assert.ok(requested);
  assert.equal((await call('device-approve',{...ownerAuth,body:{id:requested.id,confirmed:true}})).status,200);

  const employee=await call('login',{cookie:pending.cookie,body:{name:'EmpleadoUno',password:'98765432'}});
  assert.equal(employee.status,200);
  const auth={cookie:pending.cookie+'; '+employee.cookie,csrf:employee.data.csrf};
  console.log('HTTP workerd setup/login wall ms, not cloud CPU:',Math.round(setup.wallMs),Math.round(owner.wallMs),Math.round(employee.wallMs));

  assert.equal((await call('cards',auth)).status,403);
  const body={card:1,vehicle:{plate:'SYNTHETIC123'},service:{mode:'hourly'}};
  assert.equal((await call('entry',{...auth,csrf:'forged',body})).status,403);
  const race=await Promise.all([call('entry',{...auth,body}),call('entry',{...ownerAuth,body})]);
  assert.equal(race.filter(r=>r.status===200).length,1);

  const stay=race.find(r=>r.status===200).data,key=crypto.randomUUID(),payment={id:stay.id,expectedTotal:1000,paymentConfirmed:true,vehicleConfirmed:true};
  const double=await Promise.all([call('checkout',{...auth,key,body:payment}),call('checkout',{...auth,key,body:payment})]);
  assert.ok(double.every(r=>r.status===200),JSON.stringify(double));
  assert.equal(double[0].data.id,double[1].data.id);
  assert.equal((await call('operation?key='+key,auth)).data.result.id,double[0].data.id);
  assert.equal((await db.prepare('SELECT count(*) n FROM payments').first()).n,1);
  assert.equal((await call('state',auth)).data.report.total,1000);

  const tokens=JSON.stringify((await db.prepare('SELECT id,token_hash FROM cards ORDER BY id').all()).results);
  const preview=(await call('delivery-status',ownerAuth)).data;
  assert.equal(preview.allowed,true);
  assert.equal((await call('devices',ownerAuth)).data.devices.filter(d=>d.current).length,1);

  const resetBody={snapshot:preview.snapshot,confirmed:true,confirmation:'LIMPIAR',pin:'65432198'},resetKey=crypto.randomUUID();
  assert.equal((await call('delivery-reset',{...ownerAuth,key:resetKey,body:resetBody})).status,200);
  assert.equal((await call('delivery-reset',{...ownerAuth,key:resetKey,body:resetBody})).status,200);
  assert.equal((await db.prepare('SELECT count(*) n FROM payments').first()).n,0);
  assert.equal((await db.prepare('SELECT count(*) n FROM bathroom_payments').first()).n,0);
  assert.equal((await db.prepare('SELECT count(*) n FROM stays').first()).n,0);
  assert.equal((await db.prepare('SELECT count(*) n FROM maintenance_reset_gate').first()).n,0);
  assert.equal(JSON.stringify((await db.prepare('SELECT id,token_hash FROM cards ORDER BY id').all()).results),tokens);

  assert.equal((await call('checkout',{...auth,key,body:payment})).data.code,'STALE_STATE');
  assert.equal((await call('entry',{...ownerAuth,body})).data.code,'STALE_STATE');

  const next=await call('entry',{...ownerAuth,epoch:'1',body});
  assert.equal(next.status,200);
  const nextPayment=await call('checkout',{...ownerAuth,epoch:'1',body:{...payment,id:next.data.id}});
  assert.equal(nextPayment.status,200);
  await assert.rejects(db.prepare('DELETE FROM payments').run(),/IMMUTABLE_PAYMENT/);

  const employeeId=(await db.prepare("SELECT id FROM users WHERE name='empleadouno'").first()).id;
  assert.equal((await call('user-delete',{...ownerAuth,epoch:'1',body:{id:employeeId,confirmed:true}})).status,200);
  assert.equal((await call('state',auth)).status,401);
  assert.equal((await call('state',ownerAuth)).data.users.length,1);

  const ownerState=(await call('state',ownerAuth)).data,ownerId=ownerState.users.find(u=>u.role==='admin').id;
  const access=await call('user-update',{...ownerAuth,epoch:'1',body:{id:ownerId,loginName:'OperatorNew',displayName:'Operator New',role:'admin',active:true,pin:'97531864'}});
  assert.equal(access.status,200);assert.equal(access.data.reauthenticate,false);assert.equal((await call('state',ownerAuth)).data.accountLogin,'operatornew');
  assert.equal((await call('login',{cookie:setup.cookie,body:{name:'OwnerCase',password:'65432198'}})).status,401);
  assert.equal((await call('login',{cookie:setup.cookie,body:{name:'OPERATORNEW',password:'97531864'}})).status,200);
  const c=await call('customer-save',{...ownerAuth,epoch:'1',body:{name:'Cliente ficticio',plates:['SYN123'],active:true}});assert.equal(c.status,200);
  const version=(await call('state',ownerAuth)).data.version;
  const incoming=await call('catalog-entry',{...ownerAuth,epoch:'1',body:{version,eventId:null,card:5,profile:'presidencia',customerId:c.data.id,serviceId:'pension12',vehicle:{plate:'SYN123',type:'auto'}}});assert.equal(incoming.status,200,JSON.stringify(incoming.data));
  const closing=await call('catalog-checkout',{...ownerAuth,epoch:'1',body:{id:incoming.data.id,expectedTotal:5000,vehicleConfirmed:true,onAccount:true}});assert.equal(closing.status,200);assert.equal(closing.data.onAccount,true);
  assert.equal((await call('account?id='+c.data.id,ownerAuth)).data.balance,5000);
  const abono=await call('account-pay',{...ownerAuth,epoch:'1',body:{customerId:c.data.id,amount:1000,paymentConfirmed:true}});assert.equal(abono.status,200);
  assert.equal((await call('account?id='+c.data.id,ownerAuth)).data.balance,4000);
  await assert.rejects(db.prepare('DELETE FROM settlements').run(),/IMMUTABLE_PAYMENT/);
 }finally{await mf.dispose();}
});
