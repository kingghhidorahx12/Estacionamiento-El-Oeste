import {admin} from './auth.mjs';
import {requireThat,amount,integer,line,businessDate,civilEpoch,nextDate,reason,vehicle} from './rules.mjs';
import {catalogConfig,validateCatalog,snapshotService,pricing,priceOf,plateKey,serviceCategory} from './catalog.mjs';
const json=v=>JSON.stringify(v),parse=v=>JSON.parse(v),DAY=86400000;
export async function eventsFor(api){return api.store.all("SELECT id,business_date,starts,ends,state,created FROM event_sessions WHERE state<>'cancelled' AND ends>=coalesce((SELECT min(entered) FROM stays WHERE state='active'),?) ORDER BY starts",api.at-DAY);}
export async function customerRows(api){
 const rows=await api.store.all(`SELECT c.*,coalesce((SELECT sum(q.total) FROM service_charges q WHERE q.customer_id=c.id AND NOT EXISTS(SELECT 1 FROM charge_voids v WHERE v.charge_id=q.id)),0)-coalesce((SELECT sum(a.cents) FROM charge_allocations a JOIN service_charges q ON q.id=a.charge_id WHERE q.customer_id=c.id AND NOT EXISTS(SELECT 1 FROM charge_voids v WHERE v.charge_id=q.id)),0) balance FROM customers c ORDER BY c.name COLLATE NOCASE`);
 const plates=await api.store.all('SELECT plate,customer_id FROM customer_plates ORDER BY plate');return rows.map(c=>({...c,plates:plates.filter(p=>p.customer_id===c.id).map(p=>p.plate)}));
}
export async function catalogState(api,config){return {customers:await customerRows(api),events:await eventsFor(api),catalog:catalogConfig(config).catalog};}
export async function catalogRead(api,path,params){
 if(path==='accounts')return {customers:await customerRows(api)};
 if(path==='account'){
  const id=params.get('id'),customer=await api.store.one('SELECT * FROM customers WHERE id=?',id);requireThat(customer,'Cliente desconocido.');
  const charges=await api.store.all('SELECT q.*,v.created voided_at,v.reason void_reason,v.actor voided_by,coalesce((SELECT sum(cents) FROM charge_allocations WHERE charge_id=q.id),0) paid FROM service_charges q LEFT JOIN charge_voids v ON v.charge_id=q.id WHERE q.customer_id=? ORDER BY q.created,q.id',id);
  const payments=await api.store.all('SELECT DISTINCT p.* FROM settlements p JOIN charge_allocations a ON a.payment_id=p.id JOIN service_charges q ON q.id=a.charge_id WHERE q.customer_id=? ORDER BY p.paid DESC',id);
  return {customer,charges,payments,balance:charges.reduce((n,q)=>n+(q.voided_at?0:q.total-q.paid),0)};
 }
 return null;
}
function portion(lines,offset,cents){const result=[];for(const l of lines){const skip=Math.min(offset,l.cents);offset-=skip;const n=Math.min(cents,l.cents-skip);if(n>0)result.push({...l,cents:n});cents-=n;if(!cents)break;}requireThat(cents===0,'El desglose no coincide con el saldo.');return result;}
function charge(api,tx,{stay=null,monthly=null,customer=null,lines,total}){
 const id=crypto.randomUUID();amount({total},'total');requireThat(lines.reduce((n,l)=>n+l.cents,0)===total,'Desglose inválido.');
 tx.write(`INSERT INTO service_charges(id,stay_id,monthly_id,customer_id,total,lines,actor,created) SELECT ?,?,?,?,?,?,?,? WHERE ${tx.exists()}`,[id,stay,monthly,customer,total,json(lines),api.user.name,api.at]);return {id,total,lines,paid:0};
}
function settle(api,tx,charges,cents){
 amount({cents},'cents');if(!cents)return {id:'covered-'+tx.id,total:0,lines:[],paid:api.at,covered:true,actor:api.user.name};
 const allocations=[],lines=[];let left=cents;
 for(const q of charges){const n=Math.min(left,q.total-q.paid);if(!n)continue;tx.guard('NOT EXISTS(SELECT 1 FROM charge_voids WHERE charge_id=?)',[q.id]);allocations.push({id:q.id,cents:n});lines.push(...portion(typeof q.lines==='string'?parse(q.lines):q.lines,q.paid,n));left-=n;if(!left)break;}
 requireThat(!left,'El abono supera el saldo pendiente.');const id=crypto.randomUUID();
 tx.write(`INSERT INTO settlements(id,total,lines,actor,paid) SELECT ?,?,?,?,? WHERE ${tx.exists()}`,[id,cents,json(lines),api.user.name,api.at]);
 tx.write(`INSERT INTO charge_allocations(payment_id,charge_id,cents) SELECT ?,json_extract(value,'$.id'),json_extract(value,'$.cents') FROM json_each(?) WHERE ${tx.exists()}`,[id,json(allocations)]);return {id,total:cents,lines,actor:api.user.name,paid:api.at};
}
async function profileCustomer(api,tx,b,config,allowContract=false){
 let allowed=config.catalog.customerTypes.some(p=>p.id===b.profile&&p.active&&!p.deleted);if(!allowed&&b.monthlyId){const m=await api.store.one('SELECT mode,vehicle,start_at,end_at FROM monthly WHERE id=?',b.monthlyId);allowed=!!m&&parse(m.mode).profile===b.profile&&plateKey(parse(m.vehicle).plate)===plateKey(b.vehicle?.plate)&&m.start_at<=api.at&&m.end_at>=api.at;}requireThat(allowed,'Selecciona un tipo de cliente vigente.');if(b.profile!=='presidencia'){requireThat(!b.customerId,'El cliente requiere perfil Presidencia.');return null;}
 const c=await api.store.one('SELECT * FROM customers WHERE id=?',b.customerId);let covered=false;
 if(c&&!c.active&&b.monthlyId&&allowContract){const m=await api.store.one('SELECT mode,vehicle,start_at,end_at FROM monthly WHERE id=?',b.monthlyId),mode=m&&parse(m.mode);covered=!!m&&mode.customerId===c.id&&mode.profile==='presidencia'&&plateKey(parse(m.vehicle).plate)===plateKey(b.vehicle?.plate)&&m.start_at<=api.at&&m.end_at>=api.at;}
 requireThat(c&&(c.active&&!c.deleted_at||covered),'Selecciona un cliente de Presidencia autorizado.');tx.guard('EXISTS(SELECT 1 FROM customers WHERE id=? AND revision=?)',[c.id,c.revision]);return c;
}
export async function catalogWrite(api,path,b,tx){
 const routes=['catalog-save','customer-save','customer-delete','event-start','event-end','catalog-entry','catalog-checkout','catalog-monthly','catalog-service','account-pay','account-charge-void','monthly-charge-pay'];if(!routes.includes(path))return null;
 if(path==='catalog-save'){
  admin(api.user);const c=validateCatalog(b.config),previous=await api.config();requireThat(previous.version===integer(b,'version'),'Actualiza la configuración antes de guardar.',409,'CONFIG_CHANGED');
  const old=catalogConfig(parse(previous.body)).catalog;
  for(const s of old.services)requireThat(c.catalog.services.some(v=>v.id===s.id),'Retira los servicios conservando su identificador e historial.');
  for(const p of old.customerTypes)requireThat(c.catalog.customerTypes.some(v=>v.id===p.id),'Los tipos de cliente eliminados conservan su identificador e historial.');
  for(const t of old.vehicleTypes)requireThat(c.catalog.vehicleTypes.some(v=>v.id===t.id),'Retira los tipos conservando su historial.');
  tx.guard('(SELECT max(version) FROM settings)=?',[previous.version]);tx.write(`INSERT INTO settings(version,body,created,actor) SELECT ?,?,?,? WHERE ${tx.exists()}`,[previous.version+1,json(c),api.at,api.user.name]);tx.result={version:previous.version+1};tx.audit('catalog_saved',String(previous.version+1),{deletedCustomerTypes:c.catalog.customerTypes.filter(p=>p.deleted&&!old.customerTypes.find(v=>v.id===p.id)?.deleted).map(p=>p.id),deletedServices:c.catalog.services.filter(s=>s.deleted&&!old.services.find(v=>v.id===s.id)?.deleted).map(s=>s.id),deletedVehicleTypes:c.catalog.vehicleTypes.filter(t=>t.deleted&&!old.vehicleTypes.find(v=>v.id===t.id)?.deleted).map(t=>t.id)});return tx.commit();
 }
 if(path==='customer-save'){
  admin(api.user);const name=String(b.name||'').trim(),plates=[...new Set((b.plates||[]).map(plateKey))];requireThat(name.length>=2&&name.length<=100&&plates.length<=30&&plates.every(p=>p.length>=3&&p.length<=20)&&typeof b.active==='boolean','Revisa el nombre y las placas del cliente.');
  const id=b.id||crypto.randomUUID(),old=b.id?await api.store.one('SELECT * FROM customers WHERE id=?',id):null;requireThat(!b.id||old&&!old.deleted_at,'Cliente desconocido o eliminado.');
  for(const p of plates)requireThat(!await api.store.one('SELECT plate FROM customer_plates WHERE plate=? AND customer_id<>?',p,id),'Una placa ya está asignada a otra persona.');
  if(old){tx.guard('EXISTS(SELECT 1 FROM customers WHERE id=? AND revision=?)',[id,old.revision]);tx.write(`UPDATE customers SET name=?,active=?,revision=revision+1 WHERE id=? AND ${tx.exists()}`,[name,b.active?1:0,id]);tx.write(`DELETE FROM customer_plates WHERE customer_id=? AND ${tx.exists()}`,[id]);}
  else tx.write(`INSERT INTO customers(id,name,active,created) SELECT ?,?,?,? WHERE ${tx.exists()}`,[id,name,b.active?1:0,api.at]);
  if(b.active)for(const p of plates)tx.write(`INSERT INTO customer_plates(plate,customer_id) SELECT ?,? WHERE ${tx.exists()}`,[p,id]);tx.result={id};tx.audit('customer_saved',id,{active:b.active});return tx.commit();
 }
 if(path==='customer-delete'){
  admin(api.user);requireThat(b.confirmed===true,'Confirma eliminar el cliente.');const c=await api.store.one('SELECT * FROM customers WHERE id=?',b.id);requireThat(c&&!c.deleted_at,'Cliente desconocido o eliminado.');requireThat(integer(b,'revision')===c.revision,'El cliente cambió. Actualiza antes de eliminarlo.',409,'CONFLICT');
  tx.guard('EXISTS(SELECT 1 FROM customers WHERE id=? AND revision=? AND deleted_at IS NULL)',[c.id,c.revision]);
  tx.write(`UPDATE customers SET active=0,deleted_at=?,revision=revision+1 WHERE id=? AND ${tx.exists()}`,[api.at,c.id]);tx.write(`DELETE FROM customer_plates WHERE customer_id=? AND ${tx.exists()}`,[c.id]);
  tx.result={id:c.id,deleted:true};tx.audit('customer_deleted',c.id,{});return tx.commit();
 }
 if(path==='event-start'){
  admin(api.user);const settings=await api.config(),c=catalogConfig(parse(settings.body));validateCatalog(c);const date=String(b.date||businessDate(api.at)),closing=b.closing||c.catalog.eventClosing;
  requireThat(/^\d{4}-\d{2}-\d{2}$/.test(date)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(closing),'Fecha u hora inválida.');const opening=civilEpoch(date,c.catalog.opening),end=civilEpoch(closing>c.catalog.opening?date:nextDate(date),closing);
  requireThat(api.at>=opening&&end>api.at,'El evento debe terminar después de su activación.');const previous=await api.store.one("SELECT * FROM event_sessions WHERE business_date=? AND state<>'cancelled'",date),id=previous?.id||crypto.randomUUID(),coverageEnd=Math.max(end,previous?.ends||end);requireThat(!previous||previous.state==='ended'||previous.ends<=api.at,'El modo evento ya está activo.');tx.guard('(SELECT max(version) FROM settings)=?',[settings.version]);
  if(previous){tx.guard('EXISTS(SELECT 1 FROM event_sessions WHERE id=? AND state=? AND starts=? AND ends=?)',[id,previous.state,previous.starts,previous.ends]);tx.write(`UPDATE event_sessions SET starts=?,ends=?,state='active',catalog=?,actor=? WHERE id=? AND ${tx.exists()}`,[api.at,coverageEnd,json(c.catalog),api.user.name,id]);}
  else tx.write(`INSERT INTO event_sessions(id,business_date,starts,ends,state,catalog,created,actor) SELECT ?,?,?,?,'active',?,?,? WHERE ${tx.exists()}`,[id,date,api.at,coverageEnd,json(c.catalog),api.at,api.user.name]);tx.result={id,starts:api.at,ends:coverageEnd};tx.audit('event_started',id,{date,end:coverageEnd,resumed:!!previous,previousStarts:previous?.starts??null});return tx.commit();
 }
 if(path==='event-end'){
  admin(api.user);const event=await api.store.one("SELECT * FROM event_sessions WHERE id=? AND state='active'",b.id);requireThat(event,'Evento desconocido o terminado.');requireThat(b.starts==null||b.starts===event.starts,'El modo evento cambió. Actualiza antes de confirmar.',409,'CONFIG_CHANGED');requireThat(b.confirmed===true,'Confirma finalizar el modo evento.');tx.guard("EXISTS(SELECT 1 FROM event_sessions WHERE id=? AND state='active' AND starts=?)",[event.id,event.starts]);
  // Price activation stops now; the granted extended coverage is preserved.
  tx.write(`UPDATE event_sessions SET state='ended' WHERE id=? AND ${tx.exists()}`,[event.id]);tx.audit('event_ended',event.id,{});tx.result={ok:true};return tx.commit();
 }
 if(path==='account-charge-void'){
  admin(api.user);requireThat(b.confirmed===true,'Confirma la anulación del cargo.');const why=reason(b),q=await api.store.one('SELECT q.*,coalesce((SELECT sum(cents) FROM charge_allocations WHERE charge_id=q.id),0) paid FROM service_charges q WHERE q.id=? AND q.customer_id=?',b.id,b.customerId);
  requireThat(q&&q.total>0,'Cargo de cuenta desconocido.');requireThat(!q.monthly_id,'Este cargo corresponde a una pensión; requiere su gestión específica.');requireThat(q.paid===0,'El cargo tiene abonos; no se puede anular desde aquí.',409,'CHARGE_HAS_PAYMENTS');requireThat(!await api.store.one('SELECT charge_id FROM charge_voids WHERE charge_id=?',q.id),'El cargo ya fue anulado.',409,'CHARGE_VOIDED');requireThat(amount(b,'expectedTotal')===q.total,'El importe cambió. Actualiza la cuenta.',409,'TOTAL_CHANGED');
  tx.guard("EXISTS(SELECT 1 FROM service_charges q WHERE q.id=? AND q.customer_id=? AND q.total=? AND q.monthly_id IS NULL AND (q.stay_id IS NULL OR EXISTS(SELECT 1 FROM stays s WHERE s.id=q.stay_id AND s.state='closed')))",[q.id,q.customer_id,q.total]);tx.guard('NOT EXISTS(SELECT 1 FROM charge_allocations WHERE charge_id=?)',[q.id]);tx.guard('NOT EXISTS(SELECT 1 FROM charge_voids WHERE charge_id=?)',[q.id]);
  tx.write(`INSERT INTO charge_voids(charge_id,reason,actor,created) SELECT ?,?,?,? WHERE ${tx.exists()}`,[q.id,why,api.user.name,api.at]);tx.audit('charge_voided',q.id,{customerId:q.customer_id,total:q.total,reason:why});tx.result={id:q.id,voided:true,total:q.total};return tx.commit();
 }
 if(path==='account-pay'){
  const customer=await api.store.one('SELECT * FROM customers WHERE id=?',b.customerId);requireThat(customer,'Cliente desconocido.');requireThat(b.paymentConfirmed===true,'Confirma el pago recibido.');const n=amount(b,'amount');requireThat(n>0,'El abono debe ser mayor a cero.');
  const rows=await api.store.all('SELECT q.*,coalesce((SELECT sum(cents) FROM charge_allocations WHERE charge_id=q.id),0) paid FROM service_charges q WHERE q.customer_id=? AND NOT EXISTS(SELECT 1 FROM charge_voids v WHERE v.charge_id=q.id) ORDER BY q.created,q.id',customer.id),balance=rows.reduce((v,q)=>v+q.total-q.paid,0);requireThat(n<=balance,'El abono supera el saldo pendiente.');
  tx.guard('(SELECT coalesce(sum(q.total),0) FROM service_charges q WHERE customer_id=? AND NOT EXISTS(SELECT 1 FROM charge_voids v WHERE v.charge_id=q.id))-(SELECT coalesce(sum(a.cents),0) FROM charge_allocations a JOIN service_charges q ON q.id=a.charge_id WHERE q.customer_id=?)=?',[customer.id,customer.id,balance]);
  tx.result=settle(api,tx,rows,n);tx.audit('account_payment',customer.id,{amount:n});return tx.commit();
 }
 if(path==='catalog-checkout'){
  const stay=await api.active(b.id),service=parse(stay.service);requireThat(service.schema===2,'Usa la salida correspondiente a este registro anterior.');api.guardStay(tx,stay);requireThat(b.vehicleConfirmed===true,'Confirma el vehículo.');const q=pricing(stay,api.at,await eventsFor(api)),displayedTotal=amount(b,'expectedTotal'),adjusted=b.resolvedTotal!=null;if(!adjusted)requireThat(displayedTotal===q.total,'El importe cambió. Actualiza antes de confirmar.',409,'TOTAL_CHANGED');
  let lines=q.lines,total=q.total;if(adjusted){const author=await api.cancelAuthorization(b,tx),why=reason(b);total=amount(b,'resolvedTotal');lines=total<=q.total?portion(lines,0,total):[...lines,line('administrative_adjustment','Ajuste de importe autorizado',total-q.total)];tx.audit('administrative_resolution',stay.id,{original:q.total,displayedTotal,total,reason:why,authorizedBy:author});}
  if(Number.isSafeInteger(b.received)&&!b.onAccount)requireThat(b.received>=total,'El efectivo recibido es insuficiente.');
  requireThat(b.onAccount===true||b.paymentConfirmed===true,'Confirma el pago o el registro a cuenta.');requireThat(!b.onAccount||service.profile==='presidencia'&&service.customerId,'Sólo Presidencia puede registrar a cuenta.');
  const c=charge(api,tx,{stay:stay.id,customer:service.customerId||null,lines,total});tx.result=b.onAccount?{id:c.id,total,onAccount:true,lines}:settle(api,tx,[c],total);if(Number.isSafeInteger(b.received)&&!b.onAccount)tx.result={...tx.result,received:b.received,change:b.received-total};
  tx.write(`UPDATE stays SET state='closed',exited=?,revision=revision+1 WHERE id=? AND ${tx.exists()}`,[api.at,stay.id]);tx.write(`UPDATE cards SET state='available',revision=revision+1 WHERE id=? AND state='assigned' AND ${tx.exists()}`,[stay.card_id]);tx.audit('checkout',stay.id,{charge:c.id,onAccount:!!b.onAccount,total});return tx.commit();
 }
 if(path==='monthly-charge-pay'){
  admin(api.user);requireThat(b.paymentConfirmed===true,'Confirma el pago recibido.');const q=await api.store.one('SELECT q.*,coalesce((SELECT sum(cents) FROM charge_allocations WHERE charge_id=q.id),0) paid FROM service_charges q WHERE q.monthly_id=?',b.id);requireThat(q&&q.total>q.paid,'Mensualidad pagada o desconocida.');if(b.expectedTotal!=null)requireThat(amount(b,'expectedTotal')===q.total-q.paid,'El saldo cambió. Actualiza antes de confirmar.',409,'TOTAL_CHANGED');tx.guard('(SELECT coalesce(sum(cents),0) FROM charge_allocations WHERE charge_id=?)=?',[q.id,q.paid]);tx.result=settle(api,tx,[q],q.total-q.paid);if(Number.isSafeInteger(b.received))tx.result={...tx.result,received:b.received,change:b.received-tx.result.total};tx.audit('monthly_paid',b.id,{payment:tx.result.id});return tx.commit();
 }
 const settings=await api.config(),config=catalogConfig(parse(settings.body));validateCatalog(config);const events=await eventsFor(api),customer=await profileCustomer(api,tx,b,config,path==='catalog-entry');requireThat(integer(b,'version')===settings.version,'Las tarifas cambiaron. Actualiza antes de confirmar.',409,'CONFIG_CHANGED');requireThat((events.find(e=>e.state==='active'&&e.starts<=api.at&&e.ends>api.at)?.id||null)===(b.eventId||null),'El modo de cobro cambió. Actualiza antes de confirmar.',409,'CONFIG_CHANGED');tx.guard('(SELECT max(version) FROM settings)=?',[settings.version]);
 if(path==='catalog-service'){
  requireThat(!b.onAccount||!!customer,'Sólo Presidencia puede registrar a cuenta.');
  const service=snapshotService(config,b.serviceId,b.profile,b.vehicleType||'',api.at,events),definition=config.catalog.services.find(s=>s.id===b.serviceId);requireThat(service.kind==='bathroom'||service.kind==='fixed'&&service.parking==='none','Este servicio requiere una entrada o contrato.');const quantity=integer(b,'quantity');requireThat(quantity>0&&quantity<=50,'Cantidad de 1 a 50.');const total=service.base*quantity;amount({total},'total');
  requireThat(b.onAccount===true&&customer||b.paymentConfirmed===true,'Confirma el cobro o el registro a cuenta.');const lines=[{...line(service.category,definition.name+' · '+quantity,total),quantity,unitPrice:service.base}],c=charge(api,tx,{customer:customer?.id,lines,total});tx.result=b.onAccount?{id:c.id,total,onAccount:true,lines}:settle(api,tx,[c],total);tx.audit('service_charge',c.id,{serviceId:b.serviceId,quantity,onAccount:!!b.onAccount});return tx.commit();
 }
 const v=vehicle({...b.vehicle,type:''});v.type=String(b.vehicle?.type||'');v.plate=plateKey(v.plate);requireThat(!!b.monthlyId||!v.type||config.catalog.vehicleTypes.some(t=>t.id===v.type&&t.active),'Selecciona un tipo de vehículo vigente.');
 if(path==='catalog-monthly'){
  requireThat(!b.onAccount||!!customer,'Sólo Presidencia puede registrar a cuenta.');
  admin(api.user);const start=integer(b,'start'),end=start+30*DAY;requireThat(start>0&&b.datesConfirmed===true,'Confirma el inicio y vencimiento.');const service=snapshotService(config,b.serviceId,b.profile,v.type,api.at,events);requireThat(service.kind==='monthly'&&service.durationHours===720,'La mensualidad debe cubrir 30 días.');
  const id=crypto.randomUUID(),mode={...service,name:service.serviceLabel,price:service.base,customerId:customer?.id||null,creditApproved:b.onAccount===true};tx.write(`INSERT INTO monthly(id,mode,start_at,end_at,vehicle,actor,created) SELECT ?,?,?,?,?,?,? WHERE ${tx.exists()}`,[id,json(mode),start,end,json(v),api.user.name,api.at]);
  const lines=[line('pension_monthly',service.serviceLabel,service.base)],c=charge(api,tx,{monthly:id,customer:customer?.id,lines,total:service.base});requireThat(b.onAccount===true&&customer||b.paymentConfirmed===true||b.pending===true,'Confirma el pago, registro pendiente o a cuenta.');tx.result=b.onAccount?{id,total:service.base,onAccount:true}:b.pending?{id,total:service.base,unpaid:true}:settle(api,tx,[c],service.base);if(Number.isSafeInteger(b.received)&&b.paymentConfirmed)tx.result={...tx.result,received:b.received,change:b.received-service.base};tx.audit('monthly_manual',id,{start,end,serviceId:b.serviceId});return tx.commit();
 }
 if(path==='catalog-entry'){
  const card=integer(b,'card'),row=await api.store.one('SELECT * FROM cards WHERE id=?',card);requireThat(row?.state==='available','La tarjeta no está disponible.');
  let service;if(b.monthlyId){
   const contract=await api.store.one('SELECT m.*,q.id charge_id,q.total,coalesce((SELECT sum(cents) FROM charge_allocations WHERE charge_id=q.id),0) paid FROM monthly m JOIN service_charges q ON q.monthly_id=m.id WHERE m.id=?',b.monthlyId);requireThat(contract&&contract.start_at<=api.at&&contract.end_at>=api.at,'Selecciona una pensión vigente.');const mode=parse(contract.mode);
   requireThat(contract.paid>=contract.total||mode.creditApproved&&mode.profile==='presidencia'&&mode.customerId,'La pensión requiere pago o crédito autorizado.');requireThat(plateKey(parse(contract.vehicle).plate)===v.plate,'La placa no coincide con la pensión.');requireThat(mode.profile===b.profile&&(!mode.customerId||mode.customerId===customer?.id),'El perfil no coincide con el contrato.');
   service={...mode,baseCovered:true,contractEnd:contract.end_at,monthlyId:contract.id};v.type=parse(contract.vehicle).type;tx.guard('EXISTS(SELECT 1 FROM monthly WHERE id=? AND revision=?)',[contract.id,contract.revision]);tx.guard("NOT EXISTS(SELECT 1 FROM stays WHERE state='active' AND json_extract(service,'$.monthlyId')=?)",[contract.id]);
  }else service=snapshotService(config,b.serviceId,b.profile,v.type,api.at,events);
  requireThat(!['bathroom','monthly'].includes(service.kind)&&!(service.kind==='fixed'&&service.parking==='none')||!!b.monthlyId,'Selecciona un servicio de vehículo o una pensión registrada.');
  service.customerId=customer?.id||null;service.parkingSelected=b.parkingSelected===true;service.rateVersion=settings.version;service.extras=[];
  requireThat(!customer?.deleted_at||!(b.extraIds||[]).length,'El cliente eliminado sólo conserva la cobertura de su pensión vigente.');
  for(const id of [...new Set(b.extraIds||[])]){const s=config.catalog.services.find(s=>s.id===id&&s.active);requireThat(s&&s.kind==='fixed'&&s.parking==='none'&&!s.system,'Complemento desconocido.');requireThat(!s.vehicleTypes.length||s.vehicleTypes.includes(v.type),'Selecciona un tipo de vehículo compatible con el complemento.');service.extras.push({id,name:s.name,category:serviceCategory(s),price:priceOf(s,b.profile,!!service.eventId)});}
  const lost=config.catalog.services.find(s=>s.system==='lost'&&s.active);service.lostPrice=lost?priceOf(lost,b.profile):config.lostCard;
  const id=crypto.randomUUID();tx.guard("EXISTS(SELECT 1 FROM cards WHERE id=? AND state='available' AND revision=?)",[card,row.revision]);tx.write(`INSERT INTO stays(id,card_id,vehicle,service,entered,actor,state) SELECT ?,?,?,?,?,?,'active' WHERE ${tx.exists()}`,[id,card,json(v),json(service),api.at,api.user.name]);tx.write(`UPDATE cards SET state='assigned',revision=revision+1 WHERE id=? AND ${tx.exists()}`,[card]);tx.audit('entry',id,{serviceId:service.serviceId,profile:service.profile});tx.result={id,entered:api.at};return tx.commit();
 }
 return null;
}
