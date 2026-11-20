
import {Fault,requireThat,CAPACITY,defaults,validateConfig,vehicle,reason,amount,integer,quote,attachCoverage,attachMonthly,line,businessDate,civilEpoch,nextDate,CATEGORIES} from './rules.mjs';
import {random,hash,password,seal,open,validPin,encryptBackup} from './crypto.mjs';
import {Transaction} from './store.mjs';
import {admin,verifyAccount} from './auth.mjs';
import {devices,deliveryStatus,manage} from './management.mjs';

const parse=row=>JSON.parse(row);
const safeUser=u=>({id:u.id,name:u.name,login_name:u.login_name||u.name,display_name:u.display_name,role:u.role,active:u.active,identity:u.identity});
const requireRow=(row,message)=>{requireThat(row,message,409,'CONFLICT');return row;};

export class Api{
 constructor(store,env,user,at,{epoch}={}){Object.assign(this,{store,env,user,at,epoch});}
 async config(){return requireRow(await this.store.one('SELECT * FROM settings ORDER BY version DESC LIMIT 1'),'Completa la configuración inicial de El Oeste.');}
 async active(id){return requireRow(await this.store.one("SELECT * FROM stays WHERE id=? AND state='active'",id),'La estancia ya fue cerrada o no existe.');}

 async history(from,to){
  requireThat(/^\d{4}-\d{2}-\d{2}$/.test(from||'')&&/^\d{4}-\d{2}-\d{2}$/.test(to||''),'Indica inicio y fin del periodo.');
  const a=civilEpoch(from),b=civilEpoch(nextDate(to)),span=(Date.parse(to)-Date.parse(from))/86400000;
  requireThat(span>=0&&span<=366,'Elige un periodo de hasta 367 días.');
  const actor=this.user.role==='admin'?null:this.user.name;

  const snapshot=await this.store.batch([
   actor?this.store.stmt('SELECT id,paid,actor,total,lines FROM payments WHERE actor=? AND paid>=? AND paid<? ORDER BY paid DESC',[actor,a,b]):this.store.stmt('SELECT id,paid,actor,total,lines FROM payments WHERE paid>=? AND paid<? ORDER BY paid DESC',[a,b]),
   this.store.stmt("SELECT entered FROM stays WHERE entered>=? AND entered<? AND state<>'cancelled'",[a,b]),
   this.store.stmt("SELECT exited FROM stays WHERE state='closed' AND exited>=? AND exited<?",[a,b]),
   actor?this.store.stmt('SELECT id,paid,actor,total,lines,quantity FROM bathroom_payments WHERE actor=? AND paid>=? AND paid<? ORDER BY paid DESC',[actor,a,b]):this.store.stmt('SELECT id,paid,actor,total,lines,quantity FROM bathroom_payments WHERE paid>=? AND paid<? ORDER BY paid DESC',[a,b])
  ]);

  const [parkingPayments,entries,exits,bathrooms]=snapshot.map(x=>x.results);
  const payments=[...parkingPayments,...bathrooms].sort((a,b)=>b.paid-a.paid);
  const days=new Map();

  for(let d=from;d<=to;d=nextDate(d)){
   days.set(d,{date:d,categories:{...Object.fromEntries(CATEGORIES.map(k=>[k,0])),bathroom:0},employees:{},total:0,payments:[],entries:0,exits:0,bathroomPeople:0,bathroomTransactions:0});
  }

  for(const p of payments){
   const day=days.get(businessDate(p.paid));if(!day)continue;
   day.payments.push(p);day.total+=p.total;
   day.employees[p.actor]=(day.employees[p.actor]||0)+p.total;
   for(const l of parse(p.lines))day.categories[l.category]=(day.categories[l.category]||0)+l.cents;
  }

  for(const p of bathrooms){
   const day=days.get(businessDate(p.paid));
   if(day){day.bathroomPeople+=p.quantity;day.bathroomTransactions++;}
  }

  for(const s of entries){const d=days.get(businessDate(s.entered));if(d)d.entries++;}
  for(const s of exits){const d=days.get(businessDate(s.exited));if(d)d.exits++;}

  return {days:[...days.values()],total:payments.reduce((n,p)=>n+p.total,0)};
 }

 async read(path,params){
  if(path==='state'){
   const [settings,stays,cards,monthly,report]=await Promise.all([
    this.config(),
    this.store.all("SELECT s.*,c.state AS card_state FROM stays s JOIN cards c ON c.id=s.card_id WHERE s.state='active' ORDER BY s.entered DESC"),
    this.store.all('SELECT id,state FROM cards ORDER BY id'),
    this.store.all('SELECT m.*,CASE WHEN p.id IS NULL THEN 0 ELSE 1 END AS paid FROM monthly m LEFT JOIN payments p ON p.monthly_id=m.id WHERE m.end_at>=? ORDER BY m.created DESC LIMIT 500',this.user.role==='admin'?0:this.at),
    this.history(businessDate(this.at),businessDate(this.at))
   ]);

   const authority=(await this.store.one("SELECT value FROM meta WHERE id='authority'"))?.value||'inactive';
   const config={bathroomPrice:0,...parse(settings.body)};
   const result={capacity:CAPACITY,deployment:'cloud',environment:this.env.ENVIRONMENT||'production',authority,serverTime:this.at,zone:'America/Mexico_City',name:this.user.display_name,login:this.user.name,accountLogin:this.user.login_name||this.user.name,role:this.user.role,csrf:this.user.csrf,config,version:settings.version,cards,stays:stays.map(s=>({...s,quote:quote(s,this.at)})),monthly,report:report.days[0]};

   result.operationEpoch=(await this.store.one("SELECT value FROM meta WHERE id='operationEpoch'"))?.value||'0';
   if(this.user.role==='admin')result.users=(await this.store.all('SELECT id,name,login_name,display_name,role,active,identity FROM users WHERE deleted_at IS NULL ORDER BY name')).map(safeUser);
   return result;
  }

  if(path==='history')return this.history(params.get('from'),params.get('to'));
  if(path==='report'){admin(this.user);return (await this.history(params.get('date'),params.get('date'))).days[0];}

  if(path==='cards'){
   admin(this.user);
   const rows=await this.store.all('SELECT id,state,token_box FROM cards ORDER BY id');
   return {cards:await Promise.all(rows.map(async c=>({id:c.id,state:c.state,token:await open(c.token_box,this.env.DATA_KEY,'card:'+c.id)})))};
  }

  if(path==='audit'){admin(this.user);return {events:await this.store.all('SELECT * FROM audit ORDER BY id DESC LIMIT 300')};}
  if(path==='config-history'){admin(this.user);return {versions:await this.store.all('SELECT * FROM settings ORDER BY version DESC LIMIT 100')};}
  if(path==='peripherals'){admin(this.user);return {deployment:'cloud',supported:false,browserPrint:true,message:'Imprime desde el navegador mediante una impresora disponible en este teléfono o computadora. USB y ESC/POS de red requieren un puente local opcional; Cloudflare no los controla.'};}
  if(path==='application'){admin(this.user);return {supported:false,deployment:'cloud',version:'cloud-1',message:'La aplicación se actualiza en el servidor. Recarga para obtener la versión publicada.'};}
  if(path==='devices')return devices(this);
  if(path==='delivery-status')return deliveryStatus(this);

  if(path==='receipt'){
   const id=params.get('id');
   const p=requireRow(
    await this.store.one('SELECT id,paid,actor,total,lines FROM payments WHERE id=?',id)||
    await this.store.one('SELECT id,paid,actor,total,lines FROM bathroom_payments WHERE id=?',id),
    'Comprobante desconocido.'
   );
   requireThat(this.user.role==='admin'||p.actor===this.user.name,'No puedes imprimir ese comprobante.',403);
   return {...p,lines:parse(p.lines)};
  }

  throw new Fault('Operación no encontrada.',404);
 }

 async scan(body){
  let card;
  if(typeof body.token==='string'){
   requireThat(/^[a-f0-9]{64}$/.test(body.token),'Código desconocido o revocado.');
   card=await this.store.one('SELECT id,state FROM cards WHERE token_hash=?',await hash(body.token));
  }else{
   card=await this.store.one('SELECT id,state FROM cards WHERE id=?',integer(body,'card'));
  }
  requireThat(card,'Código desconocido o revocado.');
  const stay=await this.store.one("SELECT id FROM stays WHERE card_id=? AND state='active'",card.id);
  return {...card,action:card.state==='assigned'&&stay?'exit':card.state==='available'&&!stay?'entry':'blocked',stayId:stay?.id||null};
 }

 tx(key,fp,path,result){return new Transaction(this.store,this.user,key,fp,path,this.at,this.env,result);}
 guardStay(tx,s){tx.guard("EXISTS(SELECT 1 FROM stays WHERE id=? AND state='active' AND revision=?)",[s.id,s.revision]);}
 guardUser(tx,u=this.user){tx.guard('EXISTS(SELECT 1 FROM users WHERE id=? AND active=1 AND revision=?)',[u.id,u.revision]);}

 payment(tx,stay,monthly,lines){
  const total=lines.reduce((n,l)=>n+l.cents,0);amount({total},'total');
  if(stay&&!lines.length&&!total)return {id:'close-'+stay,paid:this.at,total:0,lines,actor:this.user.name,covered:true};
  const result={id:crypto.randomUUID(),paid:this.at,total,lines,actor:this.user.name};
  tx.write(`INSERT INTO payments(id,stay_id,monthly_id,lines,total,actor,paid) SELECT ?,?,?,?,?,?,? WHERE ${tx.exists()}`,[result.id,stay,monthly,JSON.stringify(lines),total,this.user.name,this.at]);
  return result;
 }

 async cancelAuthorization(body,tx){
  if(this.user.role==='admin')return this.user.name;
  const {account,bucket}=await verifyAccount(this.store,this.env,{email:this.user.identity},body.adminName,body.adminPin,null,this.at,{authorization:true});
  this.guardUser(tx,account);
  tx.write(`DELETE FROM attempts WHERE bucket=? AND ${tx.exists()}`,[bucket]);
  return account.name;
 }

 async write(path,b,key,fp){
  let tx=this.tx(key,fp,path,{ok:true});this.guardUser(tx);

  if(this.user.device_id){
   tx.guard("EXISTS(SELECT 1 FROM sessions s JOIN devices d ON d.id=s.device_id WHERE s.token=? AND s.user_id=? AND s.expires>? AND d.id=? AND d.user_id=s.user_id AND d.state='active' AND d.expires>?)",[this.user.session_token,this.user.id,this.at,this.user.device_id,this.at]);
  }

  const epoch=(await this.store.one("SELECT value FROM meta WHERE id='operationEpoch'"))?.value||'0';
  requireThat((this.epoch??'0')===epoch,'La aplicación cambió desde que abriste esta pantalla. Recarga antes de continuar.',409,'STALE_STATE');
  tx.guard("EXISTS(SELECT 1 FROM meta WHERE id='operationEpoch' AND value=?)",[epoch]);

  const authority=this.env.ENVIRONMENT==='staging'?'cloud-test':'cloud-active';
  if(!['backup','print-receipt'].includes(path))tx.guard("EXISTS(SELECT 1 FROM meta WHERE id='authority' AND value=?)",[authority]);

  if(['user-delete','device-rename','device-deny','delivery-reset'].includes(path))return manage(this,path,b,tx);

  // Baños: cobro independiente de tarjetas, vehículos y pensiones.
  if(path==='bathroom'){
   const quantity=integer(b,'quantity');
   requireThat(quantity>=1&&quantity<=50,'Selecciona de 1 a 50 personas.');
   requireThat(b.paymentConfirmed===true,'Confirma el cobro en efectivo.');

   const settings=await this.config(),rates=parse(settings.body);
   const unitPrice=amount({bathroomPrice:rates.bathroomPrice??0},'bathroomPrice');
   requireThat(unitPrice>0,'Configura la tarifa de baños antes de cobrar.');

   const total=unitPrice*quantity;
   requireThat(total<=100000000,'Importe de baños fuera de rango.');
   tx.guard('(SELECT max(version) FROM settings)=?',[settings.version]);

   const id=crypto.randomUUID();
   const lines=[line('bathroom','Baños · '+quantity+' '+(quantity===1?'persona':'personas'),total)];

   tx.write(
    `INSERT INTO bathroom_payments(id,quantity,unit_price,rate_version,lines,total,actor,paid) SELECT ?,?,?,?,?,?,?,? WHERE ${tx.exists()}`,
    [id,quantity,unitPrice,settings.version,JSON.stringify(lines),total,this.user.name,this.at]
   );

   tx.audit('bathroom_payment',id,{quantity,unitPrice,total,rateVersion:settings.version});
   tx.result={id,paid:this.at,actor:this.user.name,quantity,unitPrice,total,lines};
   return tx.commit();
  }

  if(path==='entry'){
   const card=integer(b,'card'),c=requireRow(await this.store.one('SELECT * FROM cards WHERE id=?',card),'La tarjeta no está disponible.');
   requireThat(c.state==='available','La tarjeta no está disponible.');

   const selected=await this.config(),rates=parse(selected.body),s=b.service||{},mode=s.mode,wash=s.wash||'';
   let v=vehicle(b.vehicle);

   requireThat(['hourly','free','temporary','day_wash','wash_only','monthly'].includes(mode),'Modalidad inválida.');
   requireThat(!wash||Object.hasOwn(rates.wash,wash),'Lavado sin tarifa confirmada.');
   requireThat(!wash||v.type===wash,'El lavado debe corresponder al tipo confirmado del vehículo.');
   requireThat(!['day_wash','wash_only'].includes(mode)||!!wash,'Selecciona un lavado para esta modalidad.');

   const service={mode,wash,preferred:s.preferred===true,rates,rateVersion:selected.version};
   attachCoverage(service,this.at,rates);

   if(mode==='monthly'){
    const m=requireRow(await this.store.one('SELECT m.* FROM monthly m JOIN payments p ON p.monthly_id=m.id WHERE m.id=?',s.monthlyId||''),'Selecciona una pensión mensual pagada.');
    v=parse(m.vehicle);attachMonthly(service,this.at,m,rates);
    tx.guard('EXISTS(SELECT 1 FROM monthly m JOIN payments p ON p.monthly_id=m.id WHERE m.id=? AND m.revision=?)',[m.id,m.revision]);
   }

   tx.guard("EXISTS(SELECT 1 FROM cards WHERE id=? AND state='available' AND revision=?)",[card,c.revision]);
   tx.guard('(SELECT max(version) FROM settings)=?',[selected.version]);

   const id=crypto.randomUUID();
   tx.write(`INSERT INTO stays(id,card_id,vehicle,service,entered,actor,state) SELECT ?,?,?,?,?,?,'active' WHERE ${tx.exists()}`,[id,card,JSON.stringify(v),JSON.stringify(service),this.at,this.user.name]);
   tx.write(`UPDATE cards SET state='assigned',revision=revision+1 WHERE id=? AND ${tx.exists()}`,[card]);
   tx.audit('entry',id,service);tx.result={id,entered:this.at};
   return tx.commit();
  }

  if(path==='checkout'){
   const s=await this.active(b.id);this.guardStay(tx,s);
   requireThat(b.vehicleConfirmed===true,'Confirma físicamente el vehículo antes de la salida.');
   const q=quote(s,this.at);
   requireThat(amount(b,'expectedTotal')===q.total,'El importe cambió con el tiempo transcurrido. Actualiza la salida y confirma el nuevo total.',409,'TOTAL_CHANGED');

   let resolution=b.resolution;
   if(q.blocked){
    admin(this.user);requireThat(resolution,'Se requiere resolución administrativa explícita.');
    if(resolution.acceptBase===true)resolution={extraCents:0,reason:'Administrador autoriza el importe base sin cargo adicional para esta salida.',coverageIssue:q.reason};
    const extra=amount(resolution,'extraCents'),why=reason(resolution),service=parse(s.service),mode=service.mode;
    const category=mode==='temporary'?'pension_temporary':mode==='free'?(service.preferred?'time_free_preferred':'time_free_normal'):mode==='monthly'?(service.monthlyHours===12?'pension_monthly_12':'pension_monthly_24'):'day_addon';
    if(extra)q.lines.push(line(category,'Resolución administrativa · '+why,extra));
    q.total+=extra;
    tx.audit('administrative_resolution',s.id,{...resolution,quotedAt:this.at});
   }else{
    requireThat(resolution==null,'No se necesita ajuste para esta cobertura.');
   }

   const simple=Object.hasOwn(b,'paymentConfirmed');
   if(simple)requireThat(b.paymentConfirmed===true,'Confirma el pago para cerrar el servicio.');
   const received=simple?q.total:amount(b,'received');
   requireThat(received>=q.total,'El efectivo recibido es insuficiente.');
   const paid=this.payment(tx,s.id,null,q.lines);

   tx.write(`UPDATE stays SET state='closed',exited=?,revision=revision+1 WHERE id=? AND ${tx.exists()}`,[this.at,s.id]);
   tx.write(`UPDATE cards SET state='available',revision=revision+1 WHERE id=? AND state='assigned' AND ${tx.exists()}`,[s.card_id]);
   tx.audit('checkout',s.id,{payment:paid.id});
   tx.result=simple?paid:{...paid,received,change:received-q.total};
   return tx.commit();
  }

  if(path==='cancel-entry'||path==='cancel-wash'){
   const s=await this.active(b.id);this.guardStay(tx,s);
   const why=reason(b),authorizedBy=await this.cancelAuthorization(b,tx);

   if(path==='cancel-entry'){
    tx.guard('NOT EXISTS(SELECT 1 FROM payments WHERE stay_id=?)',[s.id]);
    tx.write(`UPDATE stays SET state='cancelled',revision=revision+1 WHERE id=? AND ${tx.exists()}`,[s.id]);
    tx.write(`UPDATE cards SET state='available',revision=revision+1 WHERE id=? AND state='assigned' AND ${tx.exists()}`,[s.card_id]);
    tx.audit('entry_cancelled',s.id,{reason:why,authorizedBy});
   }else{
    const service=parse(s.service);requireThat(!!service.wash,'No hay lavado activo.');
    if(['day_wash','wash_only'].includes(service.mode)){
     requireThat(['hourly','temporary'].includes(b.replacementMode),'El administrador debe seleccionar la modalidad restante explícitamente.');
     service.mode=b.replacementMode;
    }
    service.wash='';
    tx.write(`UPDATE stays SET service=?,revision=revision+1 WHERE id=? AND ${tx.exists()}`,[JSON.stringify(service),s.id]);
    tx.audit('cancel_wash',s.id,{reason:why,authorizedBy});
   }
   return tx.commit();
  }

  if(path==='lost-card'){
   const s=await this.active(b.id);this.guardStay(tx,s);
   const service=parse(s.service);
   requireThat(!service.lostCard,'El extravío ya fue registrado.');
   requireThat(b.vehicleConfirmed===true&&b.lossConfirmed===true,'Confirma el vehículo y la declaración de extravío.');
   const why=reason(b),token=random();service.lostCard=true;
   tx.write(`UPDATE stays SET service=?,revision=revision+1 WHERE id=? AND ${tx.exists()}`,[JSON.stringify(service),s.id]);
   tx.write(`UPDATE cards SET state='lost',token_hash=?,token_box=?,revision=revision+1 WHERE id=? AND ${tx.exists()}`,[await hash(token),await seal(token,this.env.DATA_KEY,'card:'+s.card_id),s.card_id]);
   tx.audit('lost_card',s.id,{reason:why});
   return tx.commit();
  }

  if(path==='replace-card'){
   admin(this.user);
   const s=await this.active(b.id);this.guardStay(tx,s);
   const card=integer(b,'card'),why=reason(b),c=requireRow(await this.store.one('SELECT * FROM cards WHERE id=?',card),'Tarjeta desconocida.');
   requireThat(['reserve','available'].includes(c.state),'Selecciona una tarjeta de reserva o disponible.');
   tx.guard("EXISTS(SELECT 1 FROM cards WHERE id=? AND state='lost')",[s.card_id]);
   tx.guard("EXISTS(SELECT 1 FROM cards WHERE id=? AND revision=? AND state IN ('available','reserve'))",[card,c.revision]);
   tx.guard("NOT EXISTS(SELECT 1 FROM stays WHERE card_id=? AND state='active')",[card]);
   tx.write(`UPDATE stays SET card_id=?,revision=revision+1 WHERE id=? AND ${tx.exists()}`,[card,s.id]);
   tx.write(`UPDATE cards SET state='assigned',revision=revision+1 WHERE id=? AND ${tx.exists()}`,[card]);
   tx.audit('replace_lost_card',s.id,{old:s.card_id,new:card,reason:why});
   return tx.commit();
  }

  if(path==='monthly'){
   admin(this.user);
   const start=integer(b,'start'),end=integer(b,'end');
   requireThat(start>0&&end>start,'Registra inicio y fin explícitos.');
   requireThat(b.manualDatesConfirmed===true,'Confirma las fechas acordadas manualmente.');

   const settings=await this.config();
   const selected=parse(settings.body).monthly.find(m=>m.id===b.mode);
   requireThat(selected,'Selecciona una modalidad mensual válida.');

   const v=vehicle(b.vehicle,false),id=crypto.randomUUID(),payNow=b.payNow!==false,received=payNow?amount(b,'received'):0;
   requireThat(!payNow||received>=selected.price,'Efectivo insuficiente.');

   tx.guard('(SELECT max(version) FROM settings)=?',[settings.version]);
   tx.write(`INSERT INTO monthly(id,mode,start_at,end_at,vehicle,actor,created) SELECT ?,?,?,?,?,?,? WHERE ${tx.exists()}`,[id,JSON.stringify(selected),start,end,JSON.stringify(v),this.user.name,this.at]);
   tx.audit('monthly_manual',id,{start,end,mode:selected});
   tx.result=payNow?{...this.payment(tx,null,id,[line(selected.hours===12?'pension_monthly_12':'pension_monthly_24','Pensión mensual · '+selected.name,selected.price)]),received,change:received-selected.price}:{id,unpaid:true};
   return tx.commit();
  }

  if(path==='monthly-pay'){
   admin(this.user);
   const m=requireRow(await this.store.one('SELECT * FROM monthly WHERE id=?',b.id),'Pensión desconocida.'),mode=parse(m.mode);
   requireThat(mode.hours!=null,'Contrato anterior sin modalidad horaria; requiere regularización manual.');
   const received=amount(b,'received');requireThat(received>=mode.price,'Efectivo insuficiente.');
   tx.guard('EXISTS(SELECT 1 FROM monthly WHERE id=? AND revision=?)',[m.id,m.revision]);
   tx.guard('NOT EXISTS(SELECT 1 FROM payments WHERE monthly_id=?)',[m.id]);
   const paid=this.payment(tx,null,m.id,[line(mode.hours===12?'pension_monthly_12':'pension_monthly_24','Pensión mensual · '+mode.name,mode.price)]);
   tx.audit('monthly_paid',m.id,{payment:paid.id});
   tx.result={...paid,received,change:received-mode.price};
   return tx.commit();
  }

  if(path==='config'){
   admin(this.user);
   const c=validateConfig(b.config),version=integer(b,'version'),why=reason(b);
   c.bathroomPrice=amount({bathroomPrice:c.bathroomPrice??0},'bathroomPrice');
   tx.guard('(SELECT max(version) FROM settings)=?',[version]);
   tx.write(`INSERT INTO settings(version,body,created,actor) SELECT ?,?,?,? WHERE ${tx.exists()}`,[version+1,JSON.stringify(c),this.at,this.user.name]);
   tx.audit('config',String(version+1),{reason:why});
   tx.result={version:version+1};
   return tx.commit();
  }

  if(path==='card-admin'){
   admin(this.user);
   const card=integer(b,'card'),state=b.state,why=reason(b);
   requireThat(['available','suspended','reserve','revoked'].includes(state),'Estado inválido.');
   const c=requireRow(await this.store.one('SELECT * FROM cards WHERE id=?',card),'Tarjeta desconocida.'),token=random();
   tx.guard("NOT EXISTS(SELECT 1 FROM stays WHERE card_id=? AND state='active')",[card]);
   tx.guard('EXISTS(SELECT 1 FROM cards WHERE id=? AND revision=?)',[card,c.revision]);
   tx.write(`UPDATE cards SET state=?,token_hash=?,token_box=?,revision=revision+1 WHERE id=? AND ${tx.exists()}`,[state,await hash(token),await seal(token,this.env.DATA_KEY,'card:'+card),card]);
   tx.audit('card_'+state,String(card),{reason:why});
   tx.result={ok:true,token};
   return tx.commit();
  }

  if(path==='users'){
   admin(this.user);
   const display=typeof b.name==='string'?b.name.trim():'',name=display.toLowerCase(),identity=typeof b.identity==='string'?b.identity.trim().toLowerCase():'';
   requireThat(/^[a-z0-9._-]{3,40}$/.test(name),'Usuario: 3 a 40 letras, números, puntos o guiones.');
   validPin(b.password);
   requireThat(['admin','employee'].includes(b.role),'Rol inválido.');
   requireThat(!identity||(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity)&&identity.length<=254),'Correo inválido.');
   const id=crypto.randomUUID(),salt=random();let totpBox=null;
   tx.write(`INSERT INTO users(id,name,display_name,salt,hash,role,active,identity,totp_box) SELECT ?,?,?,?,?,?,1,?,? WHERE ${tx.exists()}`,[id,name,display,salt,await password(b.password,salt),b.role,identity,totpBox]);
   tx.audit('user_created',name,{role:b.role});
   return tx.commit();
  }

  if(path==='user-update'){
   admin(this.user);
   const u=requireRow(await this.store.one('SELECT * FROM users WHERE id=? AND deleted_at IS NULL',b.id),'Usuario desconocido.');
   requireThat(['admin','employee'].includes(b.role)&&typeof b.active==='boolean','Acceso inválido.');
   const display=Object.hasOwn(b,'displayName')?b.displayName.trim():u.display_name;
   const login=Object.hasOwn(b,'loginName')?String(b.loginName).trim().toLowerCase():(u.login_name||u.name);
   requireThat(/^[a-z0-9._-]{3,40}$/.test(login),'Usuario: de 3 a 40 letras, números, puntos o guiones.');
   requireThat(!await this.store.one('SELECT id FROM users WHERE COALESCE(login_name,name)=? AND id<>?',login,u.id),'Ese usuario de acceso ya está ocupado.',409,'LOGIN_TAKEN');
   requireThat(display&&display.length<=80,'Nombre visible: de 1 a 80 caracteres.');
   let identity=Object.hasOwn(b,'identity')?b.identity.trim().toLowerCase():u.identity;
   requireThat(!identity||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity),'Correo inválido.');
   let totpBox=u.totp_box;

   tx.guard('EXISTS(SELECT 1 FROM users WHERE id=? AND revision=?)',[u.id,u.revision]);
   if(u.role==='admin'&&(!b.active||b.role!=='admin'))tx.guard("(SELECT count(*) FROM users WHERE role='admin' AND active=1)>1");
   let salt=u.salt,stored=u.hash;
   if(b.pin){validPin(b.pin);salt=random();stored=await password(b.pin,salt);}
   const changed=!!b.pin||login!==(u.login_name||u.name)||b.role!==u.role||Number(b.active)!==u.active||identity!==u.identity;
   const own=u.id===this.user.id,keepCurrent=changed&&own&&b.active&&b.role===u.role&&identity===u.identity&&!!this.user.session_token;

   tx.write(`UPDATE users SET login_name=?,display_name=?,role=?,active=?,identity=?,salt=?,hash=?,totp_box=?,revision=revision+? WHERE id=? AND ${tx.exists()}`,[login,display,b.role,b.active?1:0,identity,salt,stored,totpBox,changed?1:0,u.id]);
   if(changed){
    if(keepCurrent){
     tx.write(`DELETE FROM sessions WHERE user_id=? AND token<>? AND ${tx.exists()}`,[u.id,this.user.session_token]);
     tx.write(`UPDATE sessions SET user_revision=user_revision+1 WHERE token=? AND user_id=? AND ${tx.exists()}`,[this.user.session_token,u.id]);
    }else tx.write(`DELETE FROM sessions WHERE user_id=? AND ${tx.exists()}`,[u.id]);
   }
   tx.result={ok:true,loginName:login,ownAccount:own,reauthenticate:own&&changed&&!keepCurrent};
   tx.audit('user_updated',u.name,{role:b.role,active:b.active,pinReset:!!b.pin,loginChanged:login!==(u.login_name||u.name)});
   return tx.commit();
  }

  if(path==='backup'){
   admin(this.user);
   const tables={},names=['settings','users','cards','stays','monthly','payments','bathroom_payments','audit','meta'];
   const rows=await this.store.batch(names.map(name=>this.store.stmt('SELECT * FROM '+name)));
   names.forEach((name,i)=>tables[name]=rows[i].results);

   for(const c of tables.cards){
    c.token=await open(c.token_box,this.env.DATA_KEY,'card:'+c.id);
    delete c.token_box;
   }
   for(const u of tables.users){
    if(u.totp_box)u.totpSecret=await open(u.totp_box,this.env.DATA_KEY,'totp:'+u.id);
    delete u.totp_box;
   }

   // Snapshot D1 cifrado. No almacena fotografías.
   const backup=await encryptBackup({application:'mx.eloeste.cloud',schema:1,created:this.at,tables},b.password);
   const encoded=JSON.stringify(backup);let index=0;

   for(let offset=0;offset<encoded.length;offset+=900000){
    tx.write(`INSERT INTO backup_chunks(operation_id,chunk_index,data) SELECT ?,?,? WHERE ${tx.exists()}`,[tx.id,index++,encoded.slice(offset,offset+900000)]);
   }

   tx.audit('backup_export','cloud',{encrypted:true});
   tx.result={backupRef:tx.id};
   return tx.commit();
  }

  if(path==='restore')throw new Fault('La restauración cloud se verifica primero en una D1 vacía mediante el procedimiento de recuperación; no sobrescribe cobros desde el navegador.',409,'CONTROLLED_RESTORE');

  if(path==='device-revoke'){
   admin(this.user);
   const why=reason(b),device=requireRow(await this.store.one('SELECT id,revision FROM devices WHERE id=?',b.id),'Teléfono desconocido.');
   tx.guard('EXISTS(SELECT 1 FROM devices WHERE id=? AND revision=?)',[device.id,device.revision]);
   tx.write(`UPDATE devices SET state='revoked',revision=revision+1 WHERE id=? AND ${tx.exists()}`,[device.id]);
   tx.write(`DELETE FROM sessions WHERE device_id=? AND ${tx.exists()}`,[device.id]);
   tx.audit('device_revoked',device.id,{reason:why});
   return tx.commit();
  }

  if(path==='device-approve'){
   admin(this.user);
   requireThat(b.confirmed===true,'Comprueba que el código corresponde al teléfono que autorizas.');

   const r=requireRow(await this.store.one("SELECT r.*,u.revision AS current_revision FROM device_requests r JOIN users u ON u.id=r.user_id WHERE r.id=? AND r.state='pending' AND r.expires>? AND u.active=1",b.id,this.at),'Solicitud vencida o ya resuelta.');
   requireThat(r.user_revision===r.current_revision,'El acceso cambió; solicita otra autorización.');

   tx.guard("EXISTS(SELECT 1 FROM device_requests WHERE id=? AND state='pending' AND revision=? AND expires>?)",[r.id,r.revision,this.at]);
   tx.guard('EXISTS(SELECT 1 FROM users WHERE id=? AND active=1 AND revision=?)',[r.user_id,r.user_revision]);

   const old=await this.store.one('SELECT id FROM devices WHERE user_id=? AND token_hash=?',r.user_id,r.token_hash),id=old?.id||r.id;

   tx.write(`INSERT INTO devices(id,user_id,token_hash,label,approved_by,created,expires,user_revision) SELECT ?,?,?,?,?,?,?,? WHERE ${tx.exists()} ON CONFLICT(user_id,token_hash) DO UPDATE SET label=excluded.label,approved_by=excluded.approved_by,created=excluded.created,expires=excluded.expires,user_revision=devices.revision+1`,[id,r.user_id,r.token_hash,r.label,this.user.id,this.at,this.at+31536000000,r.user_revision]);

   tx.write(`UPDATE device_requests SET state='approved',revision=revision+1 WHERE id=? AND ${tx.exists()}`,[r.id]);
   tx.audit('device_approved',id,{user:r.user_id,label:r.label,code:r.code});
   return tx.commit();
  }

  if(path==='print-receipt'){
   const receipt=await this.read('receipt',new URLSearchParams({id:b.id}));
   tx.audit('receipt_requested',b.id,{transport:'browser',physicalConfirmed:false});
   tx.result={receipt,message:'Comprobante preparado. El navegador solicita la impresión; comprueba la salida en papel.'};
   return tx.commit();
  }

  throw new Fault('Operación no encontrada.',404);
 }
}
