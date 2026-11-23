import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
test('remembering an authenticated account stores names only and replaces a renamed login by stable identity',()=>{
 const values=new Map(),context=vm.createContext({document:{querySelector:()=>null},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}});vm.runInContext(readFileSync(new URL('../remember-users.js',import.meta.url),'utf8'),context);
 context.rememberAccount('oldname','OldName','ledger-id');context.rememberAccount('employee','Employee','another-id');context.rememberAccount('newname','NewName','ledger-id');
 const data=JSON.parse([...values.values()][0]);assert.equal(data.length,2);assert.equal(data[0].login,'newname');assert.equal(data[0].display,'NewName');assert.ok(!JSON.stringify(data).includes('oldname'));assert.deepEqual(Object.keys(data[0]).sort(),['display','identity','login']);
 context.rememberAccount('invalid name','Invalid','other');assert.equal(context.rememberedUsers().length,2);
});
