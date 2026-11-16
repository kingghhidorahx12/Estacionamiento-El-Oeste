export const ZONE='America/Mexico_City';
export class Fault extends Error{constructor(message,status=400,code='INVALID'){super(message);this.status=status;this.code=code;}}
export function requireThat(ok,message,status=400,code='INVALID'){if(!ok)throw new Fault(message,status,code);}
export function integer(object,key){const n=object?.[key];requireThat(Number.isSafeInteger(n),'Se requiere un entero exacto: '+key);return n;}
export function amount(object,key){const n=integer(object,key);requireThat(n>=0&&n<=100000000,'Importe fuera de rango.');return n;}
export const defaults=()=>({ordinary:1500,preferred:1000,preferredFullHour:true,partial:500,normalPartial:1000,normalFromStart:true,graceMinutes:10,wash:{auto:12000,camioneta:17000,van:17000,pickup:20000},dayAddon:3000,freeNormal:5000,freePreferred:4000,opening:null,closing:null,monthly:[{id:'12h',name:'Mensual 12 horas',hours:12,price:50000},{id:'24h',name:'Mensual 24 horas',hours:24,price:60000}],monthlyNightStart:null,monthlyNightEnd:null,monthlyPeriod:null,temporary:{price:10000,hours:12,status:'provisional'},lostCard:10000});
export function hourly(elapsed,preferred,c){
 requireThat(Number.isSafeInteger(elapsed)&&elapsed>=0,'La salida no puede preceder a la entrada.');
 const rate=c[preferred?'preferred':'ordinary'];
 if(preferred&&c.preferredFullHour)return Math.max(1,Math.ceil(elapsed/3600000))*rate;
 const whole=Math.floor(elapsed/3600000),rem=elapsed%3600000;
 if(!preferred&&c.normalFromStart){const window=c.graceMinutes*60000;if(elapsed===0)return window>0?c.normalPartial:rate;return whole*rate+(rem===0?0:rem<=window?c.normalPartial:rate);}
 if(elapsed<=3600000)return rate;
 return whole*rate+(rem===0?0:rem<=c.graceMinutes*60000?c.partial:rate);
}
export const line=(category,label,cents)=>({category,label,cents});
export function coverageReason(s,entered,at,name){
 if(s.coverageStart==null||s.coverageEnd==null)return 'Cobertura de '+name+' sin horario definido. Requiere resolución administrativa.';
 if(entered<s.coverageStart||entered>s.coverageEnd||at>s.coverageEnd)return 'Estancia fuera de la cobertura de '+name+'. No hay recargo automático aprobado.';
 return '';
}
export function quote(stay,at){
 const s=typeof stay.service==='string'?JSON.parse(stay.service):stay.service,c=s.rates,entered=stay.entered;
 requireThat(at>=entered,'Reloj del servidor anterior a la entrada; requiere revisión.');
 const lines=[];let reason='';const mode=s.mode,wash=s.wash||'';
 if(wash)lines.push(line('wash_'+wash,'Lavado · '+wash,c.wash[wash]));
 if(mode==='hourly')lines.push(line(s.preferred?'parking_hourly_preferred':'parking_hourly_normal','Estacionamiento '+(s.preferred?'preferencial':'normal'),hourly(at-entered,!!s.preferred,c)));
 else if(mode==='free'){lines.push(line(s.preferred?'time_free_preferred':'time_free_normal','Tiempo libre '+(s.preferred?'preferencial':'normal'),c[s.preferred?'freePreferred':'freeNormal']));reason=coverageReason(s,entered,at,'tiempo libre');}
 else if(mode==='day_wash'){requireThat(!!wash,'La jornada requiere lavado.');lines.push(line('day_addon','Complemento de jornada',c.dayAddon));reason=coverageReason(s,entered,at,'jornada con lavado');}
 else if(mode==='monthly')reason=coverageReason(s,entered,at,'pensión mensual');
 else if(mode==='temporary'){lines.push(line('pension_temporary','Pensión temporal provisional',c.temporary.price));if(at>entered+c.temporary.hours*3600000)reason='Excedente de pensión provisional. Requiere resolución administrativa.';}
 else requireThat(mode==='wash_only','Modalidad inválida.');
 if(s.lostCard)lines.push(line('lost_card','Tarjeta extraviada',c.lostCard));
 return {lines,total:lines.reduce((n,l)=>n+l.cents,0),blocked:!!reason,reason,at};
}
const partsFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
export function dateParts(at){return Object.fromEntries(partsFormatter.formatToParts(new Date(at)).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));}
export function businessDate(at){const p=dateParts(at);return `${p.year}-${p.month}-${p.day}`;}
export function civilEpoch(date,time='00:00'){
 const desired=Date.parse(date+'T'+time+(time.length===5?':00':'')+'Z');requireThat(Number.isFinite(desired),'Fecha u hora inválida.');
 let guess=desired;for(let i=0;i<4;i++){const p=dateParts(guess),local=Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`),delta=desired-local;if(!delta)return guess;guess+=delta;}
 throw new Fault('Hora civil inexistente o ambigua; requiere revisión.');
}
export function nextDate(date,days=1){return new Date(Date.parse(date+'T12:00:00Z')+days*86400000).toISOString().slice(0,10);}
export function attachWindow(s,entered,c,opening,closing){
 if(c[opening]==null||c[closing]==null){s.coverageStart=null;s.coverageEnd=null;return;}
 const open=c[opening],close=c[closing];requireThat(open!==close,'Apertura y cierre iguales no definen una jornada; no se asumen 24 horas.');
 let date=businessDate(entered);const p=dateParts(entered),time=p.hour+':'+p.minute+':'+p.second;
 if(close<open&&time<=close+':00')date=nextDate(date,-1);
 s.coverageStart=civilEpoch(date,open);s.coverageEnd=civilEpoch(close>open?date:nextDate(date),close);
}
export function attachCoverage(s,entered,c){if(['free','day_wash'].includes(s.mode))attachWindow(s,entered,c,'opening','closing');}
export function attachMonthly(s,entered,contract,c){
 const m=JSON.parse(contract.mode);requireThat(m.hours!=null,'La modalidad de este registro anterior necesita definición administrativa antes de utilizar su cobertura.');
 s.monthlyId=contract.id;s.monthlyHours=m.hours;
 if(m.hours===24){s.coverageStart=contract.start_at;s.coverageEnd=contract.end_at;}
 else{attachWindow(s,entered,c,'monthlyNightStart','monthlyNightEnd');if(s.coverageStart!=null){s.coverageStart=Math.max(s.coverageStart,contract.start_at);s.coverageEnd=Math.min(s.coverageEnd,contract.end_at);}}
}
const timeValid=s=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(s);
const timeSeconds=s=>s.split(':').map(Number).reduce((n,v)=>n*60+v,0)*(s.length===5?60:1);
export function validateConfig(c){
 requireThat(c&&typeof c==='object','Configuración inválida.');
 for(const k of ['ordinary','preferred','partial','dayAddon','lostCard','freeNormal','freePreferred'])amount(c,k);
 if(c.normalFromStart)requireThat(amount(c,'normalPartial')<=c.ordinary,'La fracción normal no puede superar la hora completa.');
 requireThat(integer(c,'graceMinutes')>=0&&c.graceMinutes<60,'Minutos parciales inválidos.');
 for(const k of ['auto','camioneta','van','pickup'])amount(c.wash,k);
 requireThat(Array.isArray(c.monthly)&&c.monthly.length===2,'Se requieren las dos modalidades mensuales.');
 const ids=new Set(),hours=new Set();for(const m of c.monthly){amount(m,'price');requireThat(typeof m.id==='string'&&m.id.length<=40&&!ids.has(m.id)&&typeof m.name==='string'&&m.name.trim().length>0&&m.name.length<=100,'Modalidad mensual inválida.');ids.add(m.id);requireThat([12,24].includes(integer(m,'hours')),'Modalidad mensual de 12 o 24 horas.');hours.add(m.hours);}requireThat(hours.size===2,'Se requieren modalidades de 12 y 24 horas distintas.');
 amount(c.temporary,'price');requireThat(integer(c.temporary,'hours')>0&&c.temporary.hours<=744,'Duración temporal inválida.');
 for(const [a,b] of [['opening','closing'],['monthlyNightStart','monthlyNightEnd']]){requireThat((c[a]==null)===(c[b]==null),'Define ambos horarios o deja ambos pendientes.');if(c[a]!=null){requireThat(timeValid(c[a])&&timeValid(c[b])&&c[a]!==c[b],'Horario inválido.');if(a==='monthlyNightStart')requireThat((timeSeconds(c[b])-timeSeconds(c[a])+86400)%86400===43200,'La cobertura nocturna mensual debe abarcar las 12 horas confirmadas.');}}
 return c;
}
export function vehicle(v,plateOnly=true){
 requireThat(v&&typeof v==='object','Registra la placa del vehículo.');const out={};for(const [key,max]of [['type',20],['plate',20],['color',50],['brand',60],['notes',500]]){requireThat(v[key]==null||typeof v[key]==='string','Descripción inválida.');out[key]=(v[key]||'').trim();requireThat(out[key].length<=max,'Descripción demasiado larga.');}out.plate=out.plate.toUpperCase();
 requireThat(plateOnly&&!out.type||['auto','moto','camioneta','van','pickup'].includes(out.type),'Tipo inválido.');requireThat(plateOnly||!!out.color,'Confirma el color del vehículo.');requireThat(!!out.plate||!!out.notes,'Sin placas, añade una descripción del vehículo.');return out;
}
export function reason(body){const s=body?.reason;requireThat(typeof s==='string'&&s.trim().length>=4&&s.trim().length<=500,'Registra un motivo de 4 a 500 caracteres.');return s.trim();}
export const CATEGORIES=['parking_hourly_normal','parking_hourly_preferred','time_free_normal','time_free_preferred','day_addon','wash_auto','wash_camioneta','wash_van','wash_pickup','pension_temporary','pension_monthly_12','pension_monthly_24','lost_card'];
