
import {admin,verifyAccount} from './auth.mjs';
import {requireThat} from './rules.mjs';
import {fingerprint,equal,random,hash} from './crypto.mjs';

export async function devices(api){
 admin(api.user);
 const rows=await api.store.all(`SELECT d.id,d.label,d.created,d.expires,d.state,u.display_name AS name,COALESCE(u.login_name,u.name) AS login,u.active
 FROM devices d JOIN users u ON u.id=d.user_id ORDER BY d.created DESC,d.id LIMIT 500`);
 return {devices:rows.map(d=>({...d,current:d.id===api.user.device_id,state:d.state!=='active'?'revoked':!d.active?'inactive':d.expires<=api.at?'expired':'active'})).sort((a,b)=>Number(b.current)-Number(a.current)),
 requests:await api.store.all(`SELECT r.id,r.code,r.label,r.created,r.expires,u.display_name AS name,COALESCE(u.login_name,u.name) AS login FROM device_requests r JOIN users u ON u.id=r.user_id
 WHERE r.state='pending' AND r.expires>? AND u.active=1 AND u.deleted_at IS NULL AND r.user_revision=u.revision ORDER BY r.created DESC LIMIT 100`,api.at)};
}

const countExpressions={
 visits:'(SELECT count(*) FROM stays)',
 active:"(SELECT count(*) FROM stays WHERE state='active')",
 payments:'((SELECT count(*) FROM payments)+(SELECT count(*) FROM bathroom_payments))',
 total:'((SELECT coalesce(sum(total),0) FROM payments)+(SELECT coalesce(sum(total),0) FROM bathroom_payments))',
 monthly:'(SELECT count(*) FROM monthly)',
 bathrooms:'(SELECT count(*) FROM bathroom_payments)',
 bathroomPeople:'(SELECT coalesce(sum(quantity),0) FROM bathroom_payments)',
 bathroomTotal:'(SELECT coalesce(sum(total),0) FROM bathroom_payments)',
 stayRevision:'(SELECT coalesce(sum(revision),0) FROM stays)',
 monthlyRevision:'(SELECT coalesce(sum(revision),0) FROM monthly)',
 cardRevision:'(SELECT coalesce(sum(revision),0) FROM cards)',
 rateVersion:'(SELECT max(version) FROM settings)'
};

export async function deliveryStatus(api){
 admin(api.user);
 const counts=await api.store.one('SELECT '+Object.entries(countExpressions).map(([key,sql])=>sql+' AS '+key).join(','));
 const meta=Object.fromEntries((await api.store.all("SELECT id,value FROM meta WHERE id IN ('authority','sourceKind','operationEpoch')")).map(r=>[r.id,r.value]));
 const epoch=meta.operationEpoch||'0';
 const permitted=api.env.ENVIRONMENT==='staging'&&meta.authority==='cloud-test'&&meta.sourceKind==='synthetic';
 const hasData=!!(counts.visits||counts.payments||counts.monthly||counts.bathrooms);

 return {
  allowed:permitted&&hasData,
  reason:!permitted?'El reinicio de datos no está habilitado en esta instalación.':!hasData?'No hay datos para reiniciar.':'',
  counts,epoch,
  snapshot:await fingerprint('delivery-preview',{counts,epoch},api.env.REQUEST_KEY)
 };
}

export async function manage(api,path,b,tx){
 admin(api.user);

 if(path==='user-delete'){
  requireThat(b.confirmed===true,'Confirma la eliminación del acceso.');
  const u=await api.store.one('SELECT * FROM users WHERE id=? AND deleted_at IS NULL',b.id);
  requireThat(u,'El acceso ya fue eliminado o no existe.',409);
  requireThat(u.id!==api.user.id,'No puedes eliminar tu propia cuenta. Otro administrador debe hacerlo.',409);
  if(u.role==='admin'&&u.active)requireThat((await api.store.one("SELECT count(*) n FROM users WHERE role='admin' AND active=1 AND deleted_at IS NULL")).n>1,'Debe conservarse un administrador activo.',409);

  tx.guard('EXISTS(SELECT 1 FROM users WHERE id=? AND revision=? AND deleted_at IS NULL)',[u.id,u.revision]);
  if(u.role==='admin'&&u.active)tx.guard("(SELECT count(*) FROM users WHERE role='admin' AND active=1 AND deleted_at IS NULL)>1");

  tx.write(`UPDATE users SET active=0,deleted_at=?,revision=revision+1,salt=?,hash=?,totp_box=NULL,totp_step=-1 WHERE id=? AND ${tx.exists()}`,[api.at,random(),await hash(random()),u.id]);
  tx.write(`DELETE FROM sessions WHERE user_id=? AND ${tx.exists()}`,[u.id]);
  tx.write(`UPDATE devices SET state='revoked',revision=revision+1 WHERE user_id=? AND ${tx.exists()}`,[u.id]);
  tx.write(`UPDATE device_requests SET state='denied',revision=revision+1 WHERE user_id=? AND state='pending' AND ${tx.exists()}`,[u.id]);
  tx.audit('user_deleted',u.name,{role:u.role,historyPreserved:true});
  return tx.commit();
 }

 if(path==='device-rename'){
  const label=typeof b.label==='string'?b.label.trim():'';
  requireThat(label.length>=3&&label.length<=80,'Nombre del dispositivo: de 3 a 80 caracteres.');
  const d=await api.store.one('SELECT id,revision FROM devices WHERE id=?',b.id);
  requireThat(d,'Dispositivo desconocido.',409);
  tx.guard('EXISTS(SELECT 1 FROM devices WHERE id=? AND revision=?)',[d.id,d.revision]);
  tx.write(`UPDATE devices SET label=?,revision=revision+1 WHERE id=? AND ${tx.exists()}`,[label,d.id]);
  tx.audit('device_renamed',d.id,{label});
  return tx.commit();
 }

 if(path==='device-deny'){
  const r=await api.store.one("SELECT id,revision FROM device_requests WHERE id=? AND state='pending' AND expires>?",b.id,api.at);
  requireThat(r,'La solicitud venció o ya fue resuelta.',409);
  tx.guard("EXISTS(SELECT 1 FROM device_requests WHERE id=? AND state='pending' AND revision=? AND expires>?)",[r.id,r.revision,api.at]);
  tx.write(`UPDATE device_requests SET state='denied',revision=revision+1 WHERE id=? AND ${tx.exists()}`,[r.id]);
  tx.audit('device_denied',r.id,{});
  return tx.commit();
 }

 if(path==='delivery-reset'){
  requireThat(b.confirmed===true&&b.confirmation==='LIMPIAR','Escribe LIMPIAR para confirmar el reinicio de datos.');

  const preview=await deliveryStatus(api);
  requireThat(preview.allowed,preview.reason,409,'RESET_UNAVAILABLE');
  requireThat(equal(b.snapshot,preview.snapshot),'Los datos cambiaron. Actualiza el resumen antes de limpiar.',409,'RESET_CHANGED');

  const {account,bucket}=await verifyAccount(api.store,api.env,{email:api.user.identity},api.user.login_name||api.user.name,b.pin,null,api.at,{authorization:true});
  requireThat(account.id===api.user.id,'Se requiere el PIN de tu cuenta administradora.',403);
  api.guardUser(tx,account);

  tx.guard("EXISTS(SELECT 1 FROM meta WHERE id='sourceKind' AND value='synthetic')");
  for(const [key,sql] of Object.entries(countExpressions))tx.guard(sql+'=?',[preview.counts[key]]);

  tx.write(`INSERT INTO maintenance_reset_gate(operation_id,actor_id) SELECT ?,? WHERE ${tx.exists()}`,[tx.id,api.user.id]);

  for(const table of ['payments','bathroom_payments','stays','monthly','backup_chunks']){
   tx.write(`DELETE FROM ${table} WHERE ${tx.exists()}`);
  }

  tx.write(`UPDATE cards SET state='available',revision=revision+1 WHERE state='assigned' AND ${tx.exists()}`);

  tx.write(`DELETE FROM audit WHERE action IN ('entry','checkout','administrative_resolution','entry_cancelled','cancel_wash','lost_card','replace_lost_card','monthly_manual','monthly_paid','bathroom_payment','receipt_requested') AND ${tx.exists()}`);

  tx.write(`DELETE FROM operations WHERE id<>? AND ${tx.exists()}`,[tx.id]);
  tx.write(`UPDATE meta SET value=CAST(CAST(value AS INTEGER)+1 AS TEXT) WHERE id='operationEpoch' AND ${tx.exists()}`);
  tx.write(`DELETE FROM attempts WHERE bucket=? AND ${tx.exists()}`,[bucket]);
  tx.write(`DELETE FROM maintenance_reset_gate WHERE operation_id=? AND ${tx.exists()}`,[tx.id]);

  tx.audit('delivery_reset','cloud',{cleared:preview.counts,configurationAndAccountsPreserved:true});
  tx.result={ok:true,cleared:preview.counts,operationEpoch:String(Number(preview.epoch)+1)};
  return tx.commit();
 }
}
