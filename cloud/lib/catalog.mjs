import {requireThat,amount,integer,quote as legacyQuote,hourly,civilEpoch,businessDate,nextDate,dateParts,line,defaults} from './rules.mjs';
export const PROFILES=['normal','preferred','presidencia'];
export const defaultCustomerTypes=()=>[{id:'normal',name:'Normal',active:true,calculation:'normal'},{id:'preferred',name:'Preferencial',active:true,calculation:'full_hour'},{id:'presidencia',name:'Presidencia',active:true,calculation:'normal'}];
export const plateKey=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const HOUR=3600000,DAY=24*HOUR;
const prices=(normal,preferred=null,presidencia=null)=>({normal,preferred,presidencia});
export function catalogConfig(original){
 const c=structuredClone(original||defaults());if(c.catalog){c.catalog.customerTypes??=defaultCustomerTypes();return c;}
 // The confirmed schedule replaces legacy trial hours when creating the catalogue.
 // Existing catalogues and stay snapshots retain their explicitly saved settings.
 c.opening='07:00';c.closing='20:00';
 const service=(id,name,kind,price,extra={})=>({id,name,kind,active:true,vehicleTypes:[],prices:prices(price),eventPrices:prices(null),parking:'none',addonPrices:prices(c.dayAddon??3000),...extra});
 c.catalog={revision:1,customerTypes:defaultCustomerTypes(),reminderDays:3,opening:c.opening||'07:00',closing:c.closing||'20:00',eventClosing:'03:00',nightRateId:'pension12',overdueShortId:'pension12',overdueLongId:'pension24',
  vehicleTypes:[['auto','Automóvil'],['camioneta','Camioneta'],['moto','Moto'],['pickup','Pickup'],['van','Van']].map(([id,name])=>({id,name,active:true})),
  services:[service('hourly','Por hora','hourly',c.ordinary??1500,{prices:prices(c.ordinary??1500,c.preferred??1000,1000),shortPrices:prices(c.normalPartial??1000,null,500)}),service('free','Tiempo libre','free',c.freeNormal??5000,{prices:prices(c.freeNormal??5000,c.freePreferred??4000,3500)}),
   ...[['auto','Automóvil',12000],['camioneta','Camioneta',17000],['moto','Moto',10000],['pickup','Pickup',20000],['van','Van',17000]].map(([id,name,price])=>service('wash_'+id,'Lavado · '+name,'wash',c.wash?.[id]??price,{vehicleTypes:[id],parking:'addon'})),
   service('pension12','Pensión 12 horas','pension',5000,{durationHours:12}),service('pension24','Pensión 24 horas','pension',6000,{durationHours:24}),
   service('monthly500','Mensualidad $500','monthly',50000,{durationHours:720,needsVehicleAssignment:true}),service('monthly600','Mensualidad $600','monthly',60000,{durationHours:720,needsVehicleAssignment:true}),
   service('bathroom','Baños','bathroom',700,{vehicleRequired:false}),service('lost','Extravío','fixed',c.lostCard??10000,{system:'lost'})]};
 c.bathroomPrice=700;return c;
}
export function validateCatalog(c){
 requireThat(c&&typeof c==='object'&&c.catalog,'Catálogo inválido.');const k=c.catalog;k.customerTypes??=defaultCustomerTypes();
 requireThat(Array.isArray(k.vehicleTypes)&&k.vehicleTypes.length>0&&k.vehicleTypes.length<=100,'Registra de 1 a 100 tipos de vehículo.');
 requireThat(Array.isArray(k.services)&&k.services.length>0&&k.services.length<=200,'Registra de 1 a 200 servicios.');
 const ids=new Set(),typeIds=new Set();const identity=(v,set)=>{requireThat(/^[a-zA-Z0-9_-]{1,50}$/.test(v.id||'')&&!set.has(v.id)&&typeof v.name==='string'&&v.name.trim().length>0&&v.name.length<=100&&typeof v.active==='boolean','Nombre o identificador inválido o repetido.');requireThat(v.deleted==null||typeof v.deleted==='boolean'&&(!v.deleted||!v.active),'Una opción eliminada no puede estar activa.');set.add(v.id);};
 for(const t of k.vehicleTypes)identity(t,typeIds);const customerIds=new Set();requireThat(Array.isArray(k.customerTypes)&&k.customerTypes.length>0&&k.customerTypes.length<=50,'Registra de 1 a 50 tipos de cliente.');for(const p of k.customerTypes){identity(p,customerIds);requireThat(['normal','full_hour'].includes(p.calculation),'Selecciona el cálculo horario del cliente.');}requireThat(k.customerTypes.some(p=>p.id==='normal'&&p.active&&!p.deleted&&p.calculation==='normal'),'Normal es el precio base y debe permanecer activo.');for(const p of k.customerTypes)if(PROFILES.includes(p.id))requireThat(p.calculation===(p.id==='preferred'?'full_hour':'normal'),'Conserva el cálculo confirmado de '+p.name+'.');
 requireThat(k.vehicleTypes.some(t=>t.active&&!t.deleted),'Conserva al menos un tipo de vehículo activo.');
 const checkPrices=(p,nullable=true)=>{requireThat(p&&typeof p==='object','Configura los precios por perfil.');for(const [id,value]of Object.entries(p)){requireThat(customerIds.has(id),'Precio de un tipo de cliente desconocido.');if(value!=null)amount(p,id);else requireThat(nullable,'Falta un precio normal.');}};
 for(const s of k.services){identity(s,ids);requireThat(['hourly','free','wash','pension','monthly','bathroom','fixed'].includes(s.kind),'Tipo de cobro inválido.');checkPrices(s.prices);amount(s.prices,'normal');checkPrices(s.eventPrices);requireThat(Array.isArray(s.vehicleTypes)&&s.vehicleTypes.every(id=>typeIds.has(id)),'Tipo de vehículo desconocido.');requireThat(['none','included','addon'].includes(s.parking),'Cobertura de estacionamiento inválida.');checkPrices(s.addonPrices);amount(s.addonPrices,'normal');if(s.kind==='hourly'){checkPrices(s.shortPrices);amount(s.shortPrices,'normal');for(const p of PROFILES)if(p!=='preferred')requireThat(priceOf(s,p,false,'shortPrices')<=priceOf(s,p),'La fracción no puede superar la hora.');}if(['pension','monthly'].includes(s.kind))requireThat(Number.isInteger(s.durationHours)&&s.durationHours>0&&s.durationHours<=8760,'Duración inválida.');}
 for(const key of ['opening','closing','eventClosing'])requireThat(/^([01]\d|2[0-3]):[0-5]\d$/.test(k[key]||''),'Configura los horarios.');requireThat(k.opening!==k.closing&&k.opening!==k.eventClosing,'Apertura y cierre deben ser distintos.');
 requireThat(Number.isInteger(k.reminderDays)&&k.reminderDays>=0&&k.reminderDays<=365,'Aviso de 0 a 365 días.');
 for(const s of k.services)if(s.active&&s.typeSelectionRequired)requireThat(s.vehicleTypes.length>0,'Asigna los vehículos de '+s.name+' antes de activarlo.');
 for(const s of k.services)if(s.active&&s.vehicleTypes.length)requireThat(s.vehicleTypes.some(id=>k.vehicleTypes.some(t=>t.id===id&&!t.deleted)),'El servicio '+s.name+' requiere un tipo de vehículo que no esté eliminado.');
 requireThat(k.services.some(s=>s.active&&s.kind==='hourly'),'Conserva un servicio por hora para cobrar al reabrir.');
 for(const key of ['nightRateId','overdueShortId','overdueLongId'])requireThat(k.services.some(s=>s.id===k[key]&&s.active&&s.kind==='pension'),'Selecciona las pensiones para noche y vencimiento.');
 const short=k.services.find(s=>s.id===k.overdueShortId),long=k.services.find(s=>s.id===k.overdueLongId);requireThat(short.durationHours<long.durationHours,'El periodo corto debe ser menor que el largo.');
 c.temporary={price:priceOf(short,'normal'),hours:short.durationHours,status:'confirmed'};
 // Keep public QR cards and historical clients reading the normal tariff fields.
 const active=id=>k.services.find(s=>s.id===id&&s.active);for(const [id,key]of [['hourly','ordinary'],['free','freeNormal'],['bathroom','bathroomPrice'],['lost','lostCard']])if(active(id))c[key]=priceOf(active(id),'normal');
 if(active('hourly'))c.preferred=priceOf(active('hourly'),'preferred');if(active('free'))c.freePreferred=priceOf(active('free'),'preferred');c.opening=k.opening;c.closing=k.closing;
 for(const id of ['auto','camioneta','van','pickup','moto'])if(active('wash_'+id))c.wash[id]=priceOf(active('wash_'+id),'normal');return c;
}
export function priceOf(service,profile='normal',event=false,field='prices'){
 if(service.kind==='bathroom'&&field==='prices')return amount(service.prices,'normal');
 requireThat(/^[a-zA-Z0-9_-]{1,50}$/.test(profile),'Perfil desconocido.');const base=service[field]||{},over=event&&field==='prices'?service.eventPrices||{}:{};
 const value=over[profile]??(profile==='normal'?over.normal:null)??base[profile]??base.normal;return amount({value},'value');
}
export const serviceCategory=s=>s.id.startsWith('wash_')?s.id:s.kind==='hourly'?'parking_hourly_normal':s.kind==='free'?'time_free_normal':s.kind==='pension'?'pension_temporary':s.kind==='monthly'?'pension_monthly':s.kind==='bathroom'?'bathroom':s.system==='lost'?'lost_card':'service_'+s.id;
export function overdue(elapsed,short,long){
 if(elapsed<=0)return 0;const block=long.hours*HOUR,whole=Math.floor(elapsed/block),rem=elapsed%block;
 return whole*long.price+(rem===0?0:rem<=short.hours*HOUR?short.price:long.price);
}
export function windowFor(date,k,events=[]){
 const opening=civilEpoch(date,k.opening),ordinary=civilEpoch(k.closing>k.opening?date:nextDate(date),k.closing);
 const event=events.filter(e=>e.business_date===date&&e.state!=='cancelled').sort((a,b)=>b.created-a.created)[0];
 return {opening,closing:event?Math.max(ordinary,event.ends):ordinary,nextOpening:civilEpoch(nextDate(date),k.opening),event};
}
export function snapshotService(config,id,profile,vehicleType,at,events=[]){
 const k=config.catalog,customerType=(k.customerTypes||defaultCustomerTypes()).find(p=>p.id===profile&&p.active&&!p.deleted),s=k.services.find(s=>s.id===id&&s.active);requireThat(customerType,'Selecciona un tipo de cliente vigente.');requireThat(s,'Servicio retirado o desconocido.');
 requireThat(!s.vehicleTypes.length||s.vehicleTypes.includes(vehicleType),'El servicio no corresponde al tipo de vehículo.');
 if(s.kind==='monthly')requireThat(!s.needsVehicleAssignment||s.vehicleTypes.length,'Asigna los tipos de vehículo de esta mensualidad en Tarifas.');
 const event=events.find(e=>e.state==='active'&&e.starts<=at&&e.ends>at),fullHour=customerType.calculation==='full_hour',tariff=s;
 const short=k.services.find(v=>v.id===k.overdueShortId),long=k.services.find(v=>v.id===k.overdueLongId),night=k.services.find(v=>v.id===k.nightRateId),hour=s.kind==='hourly'?s:k.services.find(v=>v.id==='hourly'&&v.active)||k.services.find(v=>v.kind==='hourly'&&v.active);
 requireThat(short&&long&&night&&hour,'Completa las reglas de estacionamiento y pensión.');
 return {schema:2,mode:s.kind==='pension'?'temporary':s.kind==='wash'?'wash_only':s.kind,serviceId:s.id,serviceLabel:s.name,kind:s.kind,profile,profileName:customerType.name,hourScheme:customerType.calculation,preferred:profile==='preferred',base:priceOf(tariff,profile,!!event),category:s.kind==='free'?'time_free_'+(profile==='preferred'?'preferred':profile):serviceCategory(s),parking:s.parking,addon:priceOf(s,profile,false,'addonPrices'),durationHours:s.durationHours||0,
  hourlyRate:priceOf(hour,profile),shortRate:fullHour?priceOf(hour,profile):Math.min(priceOf(hour,profile,false,'shortPrices'),priceOf(hour,profile)),initialHourlyRate:priceOf(hour,profile,!!event),initialShortRate:fullHour?priceOf(hour,profile,!!event):Math.min(priceOf(hour,profile,false,'shortPrices'),priceOf(hour,profile,!!event)),
  shortPension:{hours:short.durationHours,price:priceOf(short,profile,!!event)},longPension:{hours:long.durationHours,price:priceOf(long,profile,!!event)},nightPrice:priceOf(night,profile,!!event),schedule:{opening:k.opening,closing:k.closing},eventId:event?.id||null,rates:config};
}
export function pricing(stay,at,events=[]){
 const s=typeof stay.service==='string'?JSON.parse(stay.service):stay.service;if(s.schema!==2){
  if(['free','day_wash'].includes(s.mode)&&s.coverageEnd!=null){const date=businessDate(stay.entered),event=events.find(e=>e.business_date===date&&e.state!=='cancelled');if(event&&event.ends>s.coverageEnd)return legacyQuote({...stay,service:{...s,coverageEnd:event.ends}},at);}
  return legacyQuote(stay,at);
 }
 requireThat(Number.isSafeInteger(at)&&at>=stay.entered,'Hora de salida inválida.');const lines=[],segments=[];let overdueMs=0;const add=(category,label,cents,start,end)=>{if(!cents)return;lines.push(line(category,label,cents));if(start!=null)segments.push({label,start,end,cents});};
 if(s.kind==='pension'||s.kind==='monthly'){
  if(s.kind!=='monthly'||!s.baseCovered)add(s.category,s.serviceLabel,s.base);
  const end=s.contractEnd??(stay.entered+s.durationHours*HOUR);overdueMs=Math.max(0,at-end);add('pension_overdue','Pensión · saldo vencido',overdue(overdueMs,s.shortPension,s.longPension),end,at);
 }else{
  const parking=s.kind==='hourly'||s.kind==='free'||s.parking!=='none';if(s.kind!=='hourly')add(s.category,s.serviceLabel,s.base);
  if(s.parking==='addon'&&s.parkingSelected)add('day_addon','Estacionamiento con lavado',s.addon);
  const hasParking=parking&&(s.parking!=='addon'||s.parkingSelected||['hourly','free'].includes(s.kind));
  if(hasParking){
   let date=businessDate(stay.entered);const parts=dateParts(stay.entered);if(parts.hour+':'+parts.minute<s.schedule.opening)date=nextDate(date,-1);
   const days=Math.ceil((at-stay.entered)/DAY)+2;requireThat(days<=3700,'Estancia extensa; requiere revisión administrativa.');
   for(let i=0;i<days;i++,date=nextDate(date)){
    const w=windowFor(date,s.schedule,events);if(w.opening>at)break;const start=Math.max(stay.entered,w.opening),end=Math.min(at,w.closing),initial=stay.entered>=w.opening&&stay.entered<w.closing;
    if(end>=start&&(end>start||at===stay.entered)&&at>=w.opening&&(s.kind==='hourly'||!initial)){
     const rate=initial?s.initialHourlyRate:s.hourlyRate,short=initial?s.initialShortRate:s.shortRate;
     const cents=hourly(end-start,s.hourScheme==='full_hour'||!s.hourScheme&&s.profile==='preferred',{ordinary:rate,preferred:rate,preferredFullHour:true,normalFromStart:true,normalPartial:short,graceMinutes:10});
     add('parking_hourly_'+s.profile,'Estacionamiento por hora',cents,start,end);
    }
    const nightStart=Math.max(stay.entered,w.closing),nightEnd=Math.min(at,w.nextOpening);if(nightEnd>nightStart)add('pension_temporary','Pensión nocturna',s.nightPrice,nightStart,nightEnd);
   }
  }
 }
 for(const item of s.extras||[])add(item.category,item.name,item.price);
 if(s.lostCard)add('lost_card','Tarjeta extraviada',s.lostPrice??s.rates.lostCard);
 const total=lines.reduce((v,l)=>v+l.cents,0);amount({total},'total');return {lines,total,blocked:false,reason:'',at,segments,overdueMs,coverageEnd:s.contractEnd??(['pension','monthly'].includes(s.kind)?stay.entered+s.durationHours*HOUR:null)};
}
