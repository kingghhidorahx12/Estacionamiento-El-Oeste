
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {pbkdf2Sync} from 'node:crypto';import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {Store} from '../lib/store.mjs';import {Api} from '../lib/api.mjs';import {fingerprint} from '../lib/crypto.mjs';import {seed,runtimeMigrationSql} from './helpers.mjs';

test('actual workerd WebCrypto preserves the Java PBKDF2 rounds; D1 binding commits and rolls back guarded batches',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({name:'oeste-test',compatibilityDate:'2026-11-16',modules:true,script:`export default {async fetch(){try{const start=performance.now(),encoder=new TextEncoder(),key=await crypto.subtle.importKey('raw',encoder.encode('65432198'),'PBKDF2',false,['deriveBits']),bytes=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode('synthetic-salt'),iterations:210000,hash:'SHA-256'},key,256);return Response.json({hash:[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join(''),wallMs:performance.now()-start});}catch(e){return Response.json({error:String(e)},{status:500});}}}`,d1Databases:{DB:'oeste-workerd-test'}}));
 try{
  const response=await mf.dispatchFetch('http://localhost/'),data=await response.json();
  assert.equal(response.status,200,JSON.stringify(data));
  assert.equal(data.hash,pbkdf2Sync('65432198','synthetic-salt',210000,32,'sha256').toString('hex'));
  console.log('workerd PBKDF2 wall ms (not cloud CPU):',data.wallMs);

  const db=await mf.getD1Database('DB');
  for(const name of ['0001_authority.sql','0002_devices.sql','0003_capacity_60.sql','0004_management.sql','0005_bathrooms.sql','0006_login_identifier.sql'])await db.exec(runtimeMigrationSql(name));

  const f=await seed(db);
  const request={card:1,vehicle:{plate:'WORKERD123'},service:{mode:'hourly'}},key=crypto.randomUUID(),fp=await fingerprint('entry',request,f.env.REQUEST_KEY),api=()=>new Api(new Store(db),f.env,f.users[1],f.at);

  const results=await Promise.allSettled([api().write('entry',request,key,fp),api().write('entry',request,crypto.randomUUID(),fp)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await db.prepare("SELECT count(*) n FROM stays WHERE state='active'").first()).n,1);

  const stay=await db.prepare('SELECT id FROM stays WHERE card_id=1').first(),body={id:stay.id,expectedTotal:1000,paymentConfirmed:true,vehicleConfirmed:true};
  const paid=await api().write('checkout',body,crypto.randomUUID(),await fingerprint('checkout',body,f.env.REQUEST_KEY));
  assert.equal(paid.total,1000);
  assert.equal((await db.prepare('SELECT count(*) n FROM payments').first()).n,1);

  const query=await db.prepare('EXPLAIN QUERY PLAN SELECT id FROM payments WHERE actor=? AND paid>=? AND paid<?').bind(f.users[1].name,f.at,f.at+86400000).all();
  assert.ok(query.results.some(r=>String(r.detail).includes('payments_actor_time')));
  console.log('actual local D1 payment index plan:',query.results.map(r=>r.detail));
 }finally{await mf.dispose();}
});
