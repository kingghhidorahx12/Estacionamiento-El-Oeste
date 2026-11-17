import {Fault,requireThat,CAPACITY} from './rules.mjs';
import {seal,open,equal} from './crypto.mjs';
export class Store{
 constructor(db){this.db=db.withSession?db.withSession('first-primary'):db;this.queries=0;this.rowsRead=0;this.rowsWritten=0;this.duration=0;}
 stmt(sql,args=[]){this.queries++;return this.db.prepare(sql).bind(...args);}
 metrics(result){const m=result?.meta||{};this.rowsRead+=m.rows_read||0;this.rowsWritten+=m.rows_written||0;this.duration+=m.duration||0;return result;}
 async all(sql,...args){const r=this.metrics(await this.stmt(sql,args).all());return r.results||[];}
 async one(sql,...args){return (await this.all(sql,...args))[0]||null;}
 async run(sql,...args){return this.metrics(await this.stmt(sql,args).run());}
 async batch(statements){const results=await this.db.batch(statements);for(const r of results)this.metrics(r);return results;}
}
export async function operation(store,user,key,fp,secret){const old=await store.one('SELECT fingerprint,result_box,id FROM operations WHERE user_id=? AND request_key=?',user.id,key);if(!old)return null;requireThat(equal(old.fingerprint,fp),'Identificador reutilizado con datos distintos.',409,'KEY_CONFLICT');return await open(old.result_box,secret,'operation:'+old.id);}
export class Transaction{
 constructor(store,user,key,fp,kind,at,env,result){Object.assign(this,{store,user,key,fp,kind,at,env,result});this.id=crypto.randomUUID();this.statements=[];}
 exists(){return 'EXISTS(SELECT 1 FROM operations WHERE id=?)';}
 guard(condition,args=[],message='OESTE_CONFLICT'){this.statements.push(this.store.stmt(`INSERT INTO tx_guard(operation_id,ok) SELECT ?,CASE WHEN (${condition}) THEN 1 ELSE 0 END WHERE ${this.exists()} ON CONFLICT(operation_id) DO UPDATE SET ok=excluded.ok`,[this.id,...args,this.id]));return this;}
 write(sql,args=[]){this.statements.push(this.store.stmt(sql,[...args,this.id]));return this;}
 audit(action,entity,detail){return this.write(`INSERT INTO audit(at,actor,action,entity,detail) SELECT ?,?,?,?,? WHERE ${this.exists()}`,[this.at,this.user.name,action,entity,JSON.stringify(detail)]);}
 async commit(){
  const box=await seal(this.result,this.env.DATA_KEY,'operation:'+this.id);
  const first=this.store.stmt('INSERT INTO operations(id,user_id,request_key,fingerprint,kind,result_box,at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id,request_key) DO NOTHING',[this.id,this.user.id,this.key,this.fp,this.kind,box,this.at]);
  // Every mutation and guard is conditional on this execution's unique ID.
  // A replay executes none of them; any failed guard rolls back the complete batch.
  const final=this.store.stmt('DELETE FROM tx_guard WHERE operation_id=?',[this.id]);
  try{await this.store.batch([first,...this.statements,final]);}catch(error){if(/OESTE_CAPACITY/.test(String(error)))throw new Fault(`Capacidad máxima: ${CAPACITY} vehículos.`,409,'CAPACITY');if(/CHECK constraint|UNIQUE constraint|OESTE_CONFLICT/.test(String(error)))throw new Fault('La operación cambió en otro dispositivo. Actualiza y revisa antes de confirmar.',409,'CONFLICT');throw error;}
  return await operation(this.store,this.user,this.key,this.fp,this.env.DATA_KEY);
 }
}
