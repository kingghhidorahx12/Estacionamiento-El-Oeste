import test from 'node:test';import assert from 'node:assert/strict';
import {catalogConfig,validateCatalog,snapshotService,pricing,plateKey} from '../lib/catalog.mjs';import {civilEpoch} from '../lib/rules.mjs';
import {SqliteD1,seed} from './helpers.mjs';import {Store,operation} from '../lib/store.mjs';import {Api} from '../lib/api.mjs';import {fingerprint} from '../lib/crypto.mjs';
const config=()=>validateCatalog(catalogConfig()),at=civilEpoch('2026-11-23','07:00'),H=3600000;
test('catalogue keeps unassigned monthly types explicit, supports custom types and preserves normal print prices',()=>{
 const c=config();assert.equal(c.bathroomPrice,700);assert.equal(c.catalog.services.find(s=>s.id==='wash_moto').prices.normal,10000);assert.throws(()=>snapshotService(c,'monthly500','normal','auto',at),/Asigna/);
 assert.equal(snapshotService(c,'bathroom','presidencia','',at).base,500);for(const [type,total]of [['auto',15000],['camioneta',20000],['van',20000],['pickup',23000]]){const wash=snapshotService(c,'wash_'+type,'normal',type,at);assert.equal(pricing({entered:at,service:wash},at+H).total,total-3000);wash.parkingSelected=true;assert.equal(pricing({entered:at,service:wash},at+H).total,total);}
 c.catalog.vehicleTypes.push({id:'bus',name:'Autobús',active:true});const m=c.catalog.services.find(s=>s.id==='monthly500');m.vehicleTypes=['bus'];assert.equal(snapshotService(validateCatalog(c),'monthly500','normal','bus',at).base,50000);
 c.catalog.services.find(s=>s.id==='hourly').prices.normal=2000;assert.equal(validateCatalog(c).ordinary,2000);assert.equal(plateKey(' abc-123 a\n'),'ABC123A');
 c.catalog.services.find(s=>s.id==='hourly').active=false;assert.throws(()=>validateCatalog(c),/por hora/);
});
test('normal, preferential and Presidencia have independent hourly windows and time-free prices',()=>{
 const c=config();for(const [p,short,hour,free]of [['normal',1000,1500,5000],['preferred',1000,1000,4000],['presidencia',500,1000,3500]]){
  const s=snapshotService(c,'hourly',p,'auto',at);assert.equal(pricing({entered:at,service:s},at+10*60000).total,short);assert.equal(pricing({entered:at,service:s},at+10*60000+1).total,hour);assert.equal(pricing({entered:at,service:s},at+65*60000).total,hour+short);assert.equal(snapshotService(c,'free',p,'auto',at).base,free);
 }
});
test('expired pensions retain the initial price and upgrade only the current overdue block',()=>{
 const s=snapshotService(config(),'pension12','normal','auto',at),stay={entered:at,service:s},end=at+12*H;
 for(const [elapsed,total]of [[0,5000],[1,10000],[12*H,10000],[12*H+1,11000],[24*H,11000],[24*H+1,16000],[36*H,16000],[36*H+1,17000],[48*H,17000]])assert.equal(pricing(stay,end+elapsed).total,total,String(elapsed));
 const monthly={...s,kind:'monthly',base:50000,baseCovered:true,contractEnd:at+720*H};assert.equal(pricing({entered:at,service:monthly},monthly.contractEnd+1).total,5000);
});
test('time free becomes a night pension at closing and hourly at opening without overlapping periods',()=>{
 const entered=civilEpoch('2026-11-23','18:00'),s=snapshotService(config(),'free','normal','auto',entered),stay={entered,service:s};
 assert.equal(pricing(stay,civilEpoch('2026-11-23','20:00')).total,5000);assert.equal(pricing(stay,civilEpoch('2026-11-23','20:00')+1).total,10000);assert.equal(pricing(stay,civilEpoch('2026-11-24','08:00')).total,11500);
});
test('events extend existing coverage but price only entries made after activation; wash parking can be included',()=>{
 const c=config(),entered=civilEpoch('2026-11-23','18:00'),event={id:'event',business_date:'2026-11-23',state:'active',starts:civilEpoch('2026-11-23','19:00'),ends:civilEpoch('2026-11-24','03:00'),created:1,catalog:structuredClone(c.catalog)};c.catalog.services.find(s=>s.id==='free').eventPrices.normal=7000;
 const earlier=snapshotService(c,'free','normal','auto',entered);assert.equal(pricing({entered,service:earlier},civilEpoch('2026-11-24','02:00'),[event]).total,5000);
 const later=civilEpoch('2026-11-23','21:00'),s=snapshotService(c,'free','normal','auto',later,[event]);assert.equal(s.base,7000);assert.equal(pricing({entered:later,service:s},civilEpoch('2026-11-24','08:00'),[event]).total,13500);
 const wash=c.catalog.services.find(s=>s.id==='wash_auto');wash.parking='included';assert.equal(pricing({entered,service:snapshotService(c,wash.id,'normal','auto',entered)},entered+H).total,12000);wash.parking='addon';const w=snapshotService(c,wash.id,'normal','auto',entered);assert.equal(pricing({entered,service:w},entered+H).total,12000);w.parkingSelected=true;assert.equal(pricing({entered,service:w},entered+H).total,15000);
});
test('accounts close visits without income, accept partial payments once, and guard concurrent settlement',async()=>{
 const db=new SqliteD1(),f=await seed(db),store=new Store(db);let clock=at;const user=f.users[0];
 const call=async(path,body,key=crypto.randomUUID())=>{const fp=await fingerprint(path,body,f.env.REQUEST_KEY),prior=await operation(store,user,key,fp,f.env.DATA_KEY);return prior||new Api(store,f.env,user,clock).write(path,body,key,fp);};
 try{
  await assert.rejects(call('catalog-service',{version:1,eventId:null,serviceId:'bathroom',profile:'normal',quantity:1,onAccount:true,paymentConfirmed:true}),/Sólo Presidencia/);assert.equal((await store.one('SELECT count(*) n FROM service_charges')).n,0);
  const customer=await call('customer-save',{name:'Persona ficticia',plates:['ABC-123-A'],active:true});await assert.rejects(call('customer-save',{name:'Otra persona',plates:['ABC123A'],active:true}),/asignada/);
  const entered=await call('catalog-entry',{version:1,eventId:null,card:1,serviceId:'free',profile:'presidencia',customerId:customer.id,vehicle:{plate:'ABC123A',type:'auto'}});clock+=H;
  const stay=await store.one('SELECT * FROM stays WHERE id=?',entered.id),q=pricing(stay,clock);const key=crypto.randomUUID(),body={id:stay.id,expectedTotal:q.total,onAccount:true,vehicleConfirmed:true};await call('catalog-checkout',body,key);await call('catalog-checkout',body,key);
  assert.equal((await store.one('SELECT state FROM cards WHERE id=1')).state,'available');assert.equal((await store.one('SELECT count(*) n FROM settlements')).n,0);assert.equal((await new Api(store,f.env,user,clock).history('2026-11-23','2026-11-23')).total,0);
  await call('account-pay',{customerId:customer.id,amount:1000,paymentConfirmed:true});assert.equal((await new Api(store,f.env,user,clock).read('account',new URLSearchParams({id:customer.id}))).balance,2500);
  const races=await Promise.allSettled([call('account-pay',{customerId:customer.id,amount:2500,paymentConfirmed:true}),call('account-pay',{customerId:customer.id,amount:2500,paymentConfirmed:true})]);assert.equal(races.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await store.one('SELECT sum(total) total FROM settlements')).total,3500);assert.equal((await new Api(store,f.env,user,clock).history('2026-11-23','2026-11-23')).total,3500);await assert.rejects(store.run('DELETE FROM settlements'),/IMMUTABLE/);
 }finally{db.db.close();}
});
test('monthly pending payment does not grant access; a paid contract lasts exactly 30 days and only overdue pension is charged on exit',async()=>{
 const db=new SqliteD1(),f=await seed(db),store=new Store(db);let clock=at;const user=f.users[0],call=async(path,b)=>new Api(store,f.env,user,clock).write(path,b,crypto.randomUUID(),await fingerprint(path,b,f.env.REQUEST_KEY));
 try{
  const c=config();c.catalog.services.find(s=>s.id==='monthly500').vehicleTypes=['auto'];await call('catalog-save',{version:1,config:c});
  await assert.rejects(call('catalog-monthly',{version:2,eventId:null,profile:'normal',serviceId:'monthly500',vehicle:{plate:'MON123',type:'auto'},start:at,datesConfirmed:true,onAccount:true,paymentConfirmed:true}),/Sólo Presidencia/);assert.equal((await store.one('SELECT count(*) n FROM monthly')).n,0);
  const pending=await call('catalog-monthly',{version:2,eventId:null,profile:'normal',serviceId:'monthly500',vehicle:{plate:'MON123',type:'auto'},start:at,datesConfirmed:true,pending:true});
  const body={version:2,eventId:null,card:2,monthlyId:pending.id,profile:'normal',vehicle:{plate:'MON123',type:'auto'}};await assert.rejects(call('catalog-entry',body),/pago/);await assert.rejects(call('monthly-charge-pay',{id:pending.id,paymentConfirmed:true,expectedTotal:40000}),/saldo cambió/);await call('monthly-charge-pay',{id:pending.id,paymentConfirmed:true,expectedTotal:50000});
  const entry=await call('catalog-entry',body),contract=await store.one('SELECT * FROM monthly WHERE id=?',pending.id);assert.equal(contract.end_at,at+30*86400000);
  clock=contract.end_at+13*H;const stay=await store.one('SELECT * FROM stays WHERE id=?',entry.id);assert.equal(pricing(stay,clock).total,6000);await call('catalog-checkout',{id:entry.id,expectedTotal:6000,vehicleConfirmed:true,paymentConfirmed:true});assert.equal((await store.one('SELECT sum(total) n FROM settlements')).n,56000);assert.equal((await store.one('SELECT end_at FROM monthly WHERE id=?',pending.id)).end_at,contract.end_at);
 }finally{db.db.close();}
});
