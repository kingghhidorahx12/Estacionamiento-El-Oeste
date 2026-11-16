import test from 'node:test';import assert from 'node:assert/strict';import {SqliteD1,seed} from './helpers.mjs';import {Api} from '../lib/api.mjs';import {Store} from '../lib/store.mjs';import {fingerprint} from '../lib/crypto.mjs';
test('500 vehicles in concurrent waves of 20 preserve capacity, payment uniqueness and reports',async()=>{
 const db=new SqliteD1(),f=await seed(db),start=performance.now();
 try{
  async function call(user,path,body){return new Api(new Store(db),f.env,user,f.at).write(path,body,crypto.randomUUID(),await fingerprint(path,body,f.env.REQUEST_KEY));}
  for(let wave=0;wave<25;wave++){const entries=await Promise.all(Array.from({length:20},(_,i)=>call(f.users[1+i%2],'entry',{card:i+1,vehicle:{plate:'TEST'+wave+'X'+i},service:{mode:'hourly'}})));assert.equal(db.db.prepare("SELECT count(*) n FROM stays WHERE state='active'").get().n,20);await Promise.all(entries.map((s,i)=>call(f.users[1+i%2],'checkout',{id:s.id,expectedTotal:1000,paymentConfirmed:true,vehicleConfirmed:true})));}
  const row=db.db.prepare('SELECT count(*) n,sum(total) total,count(DISTINCT stay_id) unique_stays FROM payments').get();assert.deepEqual({...row},{n:500,total:500000,unique_stays:500});const report=await new Api(new Store(db),f.env,f.users[0],f.at).history('2026-11-12','2026-11-12');assert.equal(report.total,500000);assert.equal(report.days[0].entries,500);assert.equal(report.days[0].exits,500);
  const pages=db.db.prepare('PRAGMA page_count').get().page_count,size=db.db.prepare('PRAGMA page_size').get().page_size;console.log('SIMULATED SQLite load: 500 vehicles, 20 concurrent; wallMs',Math.round(performance.now()-start),'databaseBytes',pages*size,'not cloud CPU/billing');
 }finally{db.db.close();}
});
