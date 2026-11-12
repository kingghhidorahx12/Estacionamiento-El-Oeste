import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../remote/worker.mjs';

class D1 {
 constructor(){this.db=new DatabaseSync(':memory:');this.db.exec(readFileSync(new URL('../remote/schema.sql',import.meta.url),'utf8'));}
 prepare(sql){const db=this.db;return {args:[],bind(...args){this.args=args;return this;},async first(){return db.prepare(sql).get(...this.args)||null;},async all(){return {results:db.prepare(sql).all(...this.args)};},run(){return db.prepare(sql).run(...this.args);}};}
 async batch(statements){this.db.exec('BEGIN');try{const values=statements.map(s=>s.run());this.db.exec('COMMIT');return values;}catch(e){this.db.exec('ROLLBACK');throw e;}}
}
const installation='a'.repeat(64),epoch='b'.repeat(64),secret='test-only-sync-secret-at-least-32-characters';
const event=(id='11111111-1111-1111-1111-111111111111')=>({installation,epoch,id,seq:1,paid:Date.parse('2026-11-12T10:00:00-06:00'),actor:'empleado',total:15000,lines:[{category:'wash_auto',cents:12000},{category:'day_addon',cents:3000}]});
const snapshot={installation,at:Date.parse('2026-11-12T10:00:00-06:00'),occupancy:1,entries:1,exits:0};
const ingest=(env,events)=>worker.fetch(new Request('https://oeste.invalid/ingest',{method:'POST',headers:{Authorization:'Bearer '+secret},body:JSON.stringify({events,snapshot})}),env);
test('real SQL: duplicate batches are reconciled exactly once and conflicts never overwrite cash',async()=>{
 const env={DB:new D1(),SYNC_TOKEN:secret};assert.equal((await ingest(env,[event()])).status,200);assert.equal((await ingest(env,[event()])).status,200);assert.equal(env.DB.db.prepare('SELECT COUNT(*) n FROM payments').get().n,1);assert.equal(env.DB.db.prepare('SELECT SUM(total) n FROM payments').get().n,15000);
 const altered=event();altered.total=16000;altered.lines[0].cents=13000;assert.equal((await ingest(env,[altered])).status,400);assert.equal(env.DB.db.prepare('SELECT SUM(total) n FROM payments').get().n,15000);
 const restored=event('22222222-2222-2222-2222-222222222222');restored.epoch='c'.repeat(64);assert.equal((await ingest(env,[restored])).status,200);assert.equal(env.DB.db.prepare('SELECT COUNT(*) n FROM payments').get().n,2,'new restore epoch can start with sequence 1 without overwriting history');
 assert.equal((await ingest(env,[])).status,200,'occupancy can update without a new payment');env.DB.db.close();
});
test('replica verifies signed owner identity, blocks writes, and rejects a forged JWT',async()=>{
 const env={DB:new D1(),SYNC_TOKEN:secret,ACCESS_TEAM_DOMAIN:'oeste-test.cloudflareaccess.com',ACCESS_AUD:'owner-audience',ASSETS:{fetch:async()=>new Response('<html>owner</html>')}};
 await ingest(env,[event()]);const keys=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);const jwk=await crypto.subtle.exportKey('jwk',keys.publicKey);jwk.kid='test-key';
 const encode=data=>Buffer.from(JSON.stringify(data)).toString('base64url'),header=encode({alg:'RS256',kid:'test-key'}),claims=encode({iss:'https://'+env.ACCESS_TEAM_DOMAIN,aud:[env.ACCESS_AUD],exp:Math.floor(Date.now()/1000)+600}),unsigned=header+'.'+claims,signature=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',keys.privateKey,new TextEncoder().encode(unsigned))).toString('base64url'),jwt=unsigned+'.'+signature;
 const originalFetch=globalThis.fetch;globalThis.fetch=async url=>{assert.equal(String(url),'https://'+env.ACCESS_TEAM_DOMAIN+'/cdn-cgi/access/certs');return new Response(JSON.stringify({keys:[jwk]}));};
 try{const headers={'Cf-Access-Jwt-Assertion':jwt};const report=await worker.fetch(new Request('https://oeste.invalid/api/report?date=2026-11-12',{headers}),env);assert.equal(report.status,200);assert.equal((await report.json()).total,15000);
 assert.equal((await worker.fetch(new Request('https://oeste.invalid/api/checkout',{method:'POST',headers}),env)).status,405);
 const fake=header+'.'+encode({iss:'https://'+env.ACCESS_TEAM_DOMAIN,aud:[env.ACCESS_AUD],exp:9999999999})+'.'+signature;assert.equal((await worker.fetch(new Request('https://oeste.invalid/',{headers:{'Cf-Access-Jwt-Assertion':fake}}),env)).status,401);
 }finally{globalThis.fetch=originalFetch;env.DB.db.close();}
});
