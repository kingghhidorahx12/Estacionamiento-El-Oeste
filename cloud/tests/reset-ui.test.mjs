import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../management.js',import.meta.url),'utf8');
function fixture(allowed=true){
 const calls=[],main={innerHTML:''},preview={allowed,reason:allowed?'':'No hay datos para reiniciar.',snapshot:'current-preview',counts:{visits:3,active:1,payments:2,bathrooms:1,monthly:1,total:3500}};
 const context=vm.createContext({document:{addEventListener(){}},$:()=>main,heading:(...v)=>v.join(' '),esc:v=>String(v??''),icon:()=>'',money:v=>String(v/100),request:async(path,body)=>{calls.push({path,body});return path==='delivery-status'?preview:{ok:true};},openModal:(title,html)=>{context.modal={title,html};},closeModal:()=>{},refresh:async()=>{},toast:()=>{}});
 vm.runInContext(source,context);context.managementForm=(id,run)=>{context.form={id,run};};return {context,main,calls,preview};
}
test('reset option stays in Application with neutral copy and opens a confirmation without deleting anything',async()=>{
 const f=fixture();await f.context.cloudApplication();assert.match(f.main.innerHTML,/Reiniciar datos/);assert.match(f.main.innerHTML,/data-management="reset-data"/);assert.doesNotMatch(f.main.innerHTML,/entrega|ensayo|prueba/i);
 await f.context.cloudResetDataDialog();assert.equal(f.context.modal.title,'Reiniciar datos');assert.match(f.context.modal.html,/Tu PIN de administrador/);assert.match(f.context.modal.html,/LIMPIAR/);assert.match(f.context.modal.html,/Cobros de baños/);assert.doesNotMatch(f.context.modal.html,/entrega|ensayo|prueba/i);assert.ok(f.calls.every(c=>c.path==='delivery-status'));
 await f.context.form.run({elements:{confirmation:{value:'LIMPIAR'},pin:{value:'65432198'}}});const mutation=f.calls.find(c=>c.path==='delivery-reset');assert.equal(mutation.body.snapshot,'current-preview');assert.equal(mutation.body.confirmation,'LIMPIAR');assert.equal(mutation.body.pin,'65432198');assert.equal(mutation.body.confirmed,true);
});
test('reset option remains visible but disabled when there is nothing eligible to clear',async()=>{
 const f=fixture(false);await f.context.cloudApplication();assert.match(f.main.innerHTML,/data-management="reset-data" disabled/);assert.match(f.main.innerHTML,/No hay datos para reiniciar/);await f.context.cloudResetDataDialog();assert.equal(f.context.modal,undefined);assert.ok(f.calls.every(c=>c.path==='delivery-status'));
});
