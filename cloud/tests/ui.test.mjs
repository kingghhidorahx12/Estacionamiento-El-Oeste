import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const ui=readFileSync(new URL('../ui.js',import.meta.url),'utf8');
const historical=readFileSync(new URL('../../web/app.js',import.meta.url),'utf8');
const vehicle=readFileSync(new URL('../../web/vehicle.js',import.meta.url),'utf8');
test('the final asset preserves the view source literally and compiles as a single script',()=>{
 const built=readFileSync(new URL('../../build/cloud-assets/app.js',import.meta.url),'utf8');
 assert.ok(built.includes(ui),'Build must not interpret dollar sequences as replacement patterns');
 new vm.Script(built);
 for(const name of ['entryView','checkoutView','adminView'])assert.equal((built.match(new RegExp('function '+name+'\\(','g'))||[]).length,1);
});
const extract=name=>historical.match(new RegExp('^(?:async )?function '+name+'\\([^]*?(?=\\n(?:async )?function )','m'))[0];
// Exercise the real cloud controller and unchanged submitters, including the
// serialized request. Layout/native form validation are reviewed in a browser.
function scene(){
 const nodes=new Map(),node=selector=>{if(!nodes.has(selector))nodes.set(selector,{hidden:false,innerHTML:'',textContent:''});return nodes.get(selector);};
 const fields=Object.fromEntries(['card','plate','type','notes','mode','monthlyId','preferred','wash','addon','noPlate'].map(k=>[k,{name:k,value:'',checked:false,required:false,disabled:false}]));
 fields.card.value='2';fields.plate.value='ABC123A';fields.mode.value='hourly';
 const details={open:false};fields.notes.closest=()=>details;
 const form={elements:fields,dataset:{},_vehicle:null,querySelectorAll:()=>[],querySelector:s=>s==='[data-no-plate]'?fields.noPlate:details,reportValidity:()=>!Object.values(fields).some(f=>f.required&&!f.disabled&&!f.value)};
 nodes.set('#entry-form',form);nodes.set('#modal',{close(){}});
 const config={ordinary:1500,preferred:1000,freeNormal:5000,freePreferred:4000,dayAddon:3000,wash:{auto:12000,camioneta:17000,van:17000,pickup:20000},temporary:{price:10000,hours:12},opening:null,closing:null};
 const calls=[],state={config,monthly:[],stays:[],role:'employee',serverTime:Date.parse('2026-11-16T18:00:00Z')};
 class FormData{constructor(f){this.entries=Object.entries(f.elements).filter(([,v])=>!v.disabled).map(([k,v])=>[k,v.value]);}[Symbol.iterator](){return this.entries[Symbol.iterator]();}}
 const context=vm.createContext({state,tab:'entrada',FormData,JSON,Object,Number,Math,Date,console,document:{addEventListener(){}},$:node,esc:s=>String(s??''),icon:()=>'',money:n=>'$'+(n/100).toFixed(2),cardNumber:n=>String(n).padStart(2,'0'),modes:{hourly:'Por hora',free:'Tiempo libre',wash_only:'Sólo lavado',temporary:'Temporal provisional',monthly:'Pensión mensual'},request:async(path,body)=>{calls.push({path,body});return {entered:state.serverTime,total:body.expectedTotal||0};},toast(){},clock(){return '12:00';},refresh:async()=>{},closeModal(){},duration(){return '0 h 42 min';},dateTime(){return '16/11/26 12:00';},openModal:(title,html)=>{context.dialog={title,html};}});
 vm.runInContext(vehicle,context);vm.runInContext(ui,context);vm.runInContext(extract('submitEntry'),context);vm.runInContext(extract('submitCheckout'),context);
 return {context,fields,form,nodes,calls,state,details,update:()=>context.updateEntry(),enter:()=>context.submitEntry(form)};
}
test('normal, preferential and time-free selections serialize independently without client-side hourly rounding',async()=>{
 const s=scene();s.update();assert.match(s.nodes.get('#entry-summary').innerHTML,/Cobro a la salida/);
 s.fields.preferred.checked=true;s.update();await s.enter();assert.equal(s.calls[0].body.service.mode,'hourly');assert.equal(s.calls[0].body.service.preferred,true);assert.ok(!('total'in s.calls[0].body));
 s.fields.mode.value='free';s.update();assert.match(s.nodes.get('#entry-summary').innerHTML,/40.00/);s.fields.preferred.checked=false;s.update();assert.match(s.nodes.get('#entry-summary').innerHTML,/50.00/);
 await s.enter();assert.equal(s.calls[1].body.service.preferred,false);assert.equal(s.calls[1].body.vehicle.plate,'ABC123A');
});
test('each wash can stand alone or include its fixed parking supplement; changing modality clears an incompatible supplement',async()=>{
 for(const [type,base,total]of [['auto',120,150],['camioneta',170,200],['van',170,200],['pickup',200,230]]){
  const s=scene();s.fields.mode.value='wash_only';s.fields.type.value=type;s.update();assert.match(s.nodes.get('#entry-summary').innerHTML,new RegExp(base+'.00'));assert.equal(s.fields.wash.checked,true);assert.equal(s.fields.type.required,true);
  s.fields.addon.checked=true;s.update();assert.match(s.nodes.get('#entry-summary').innerHTML,new RegExp(total+'.00'));await s.enter();assert.equal(s.calls[0].body.service.mode,'day_wash');assert.equal(s.calls[0].body.service.wash,type);
  s.fields.mode.value='temporary';s.update();assert.equal(s.fields.addon.checked,false);assert.equal(s.nodes.get('#addon-label').hidden,true);assert.match(s.nodes.get('#entry-notice').textContent,/excedentes requieren autorización/);
 }
});
test('a pending coverage is explicit; an hourly wash summary cannot imply that the wash is the final parking total',()=>{
 const s=scene();s.fields.mode.value='free';s.update();assert.match(s.nodes.get('#entry-notice').textContent,/revisión administrativa/);
 s.fields.mode.value='hourly';s.fields.wash.checked=true;s.fields.type.value='auto';s.update();assert.match(s.nodes.get('#entry-summary').innerHTML,/120.00 \+ estancia/);
 s.fields.type.value='moto';s.update();assert.match(s.nodes.get('#entry-notice').textContent,/tarifa de lavado confirmada/);
});
test('no-plate expands the required identifying observation and preserves previous vehicle metadata',async()=>{
 const s=scene();s.fields.noPlate.checked=true;s.form._vehicle={brand:'Ford',color:'Azul'};s.update();assert.equal(s.fields.plate.disabled,true);assert.equal(s.fields.notes.required,true);assert.equal(s.details.open,true);
 await s.enter();assert.equal(s.calls.length,0);s.fields.notes.value='Identificación acordada';await s.enter();assert.equal(s.calls[0].body.vehicle.plate,'');assert.equal(s.calls[0].body.vehicle.brand,'Ford');assert.equal(s.calls[0].body.vehicle.color,'Azul');
});
test('a monthly visit keeps its selected paid contract and sends no separate monthly payment',async()=>{
 const s=scene();s.fields.mode.value='monthly';s.fields.monthlyId.value='paid-contract';s.update();await s.enter();assert.equal(s.calls[0].path,'entry');assert.equal(s.calls[0].body.service.monthlyId,'paid-contract');assert.equal(s.calls[0].body.service.mode,'monthly');assert.equal(s.nodes.get('#preferred-label').hidden,true);
});
test('ordinary exit only confirms the server quote; pending coverage keeps administrative resolution and employee blocking',async()=>{
 const s=scene(),stay={id:'stay',card_id:2,entered:s.state.serverTime-2520000,vehicle:JSON.stringify({plate:'ABC123A'}),service:JSON.stringify({mode:'hourly'}),quote:{blocked:false,total:1500,lines:[]}};s.state.stays=[stay];s.context.checkoutView('stay');assert.ok(!/name="(?:received|reason|additional)/.test(s.context.dialog.html));assert.match(s.context.dialog.html,/Confirmar pago y cerrar/);
 s.form.dataset={id:'stay',total:'1500',blocked:'false'};await s.context.submitCheckout(s.form);assert.deepEqual(JSON.parse(JSON.stringify(s.calls[0].body)),{id:'stay',expectedTotal:1500,paymentConfirmed:true,vehicleConfirmed:true});
 stay.quote.blocked=true;stay.quote.reason='Cobertura pendiente';s.context.checkoutView('stay');assert.match(s.context.dialog.html,/type="submit" disabled/);
 s.state.role='admin';s.context.checkoutView('stay');assert.ok(!s.context.dialog.html.includes('type="submit" disabled'));s.form.dataset.blocked='true';await s.context.submitCheckout(s.form);assert.equal(s.calls[1].body.resolution.acceptBase,true);
});
