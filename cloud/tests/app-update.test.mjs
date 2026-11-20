import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
test('published HTML loads both controllers under the same revision as its service worker',()=>{
 const html=readFileSync(new URL('../../build/cloud-assets/index.html',import.meta.url),'utf8'),sw=readFileSync(new URL('../../build/cloud-assets/sw.js',import.meta.url),'utf8'),version=html.match(/data-cloud-version="([a-f0-9]+)"/)?.[1];assert.ok(version);
 for(const asset of ['app.js','cloud-client.js','cloud.css']){assert.ok(html.includes('/'+asset+'?v='+version));assert.ok(sw.includes('/'+asset+'?v='+version));}
 assert.ok(sw.includes("VERSION='"+version+"'"));new vm.Script(sw);
});
test('an arriving update waits for an open form or an in-flight mutation instead of interrupting it',async()=>{
 const events={},nodes=new Map();let reloads=0;
 const context=vm.createContext({busy:false,location:{reload(){reloads++;}},document:{hidden:false,documentElement:{dataset:{cloudVersion:'old'}},querySelector:s=>nodes.get(s),addEventListener(){}},navigator:{serviceWorker:{addEventListener:(name,fn)=>events[name]=fn,register:async()=>({update:async()=>{}})}},setTimeout});
 vm.runInContext(readFileSync(new URL('../app-update.js',import.meta.url),'utf8'),context);context.cloudInstallUpdates();
 nodes.set('dialog[open],[data-sending]',{});events.message({data:{type:'cloud-ui-version',version:'new'}});assert.equal(reloads,0);
 nodes.clear();context.busy=true;context.cloudApplyUpdate();assert.equal(reloads,0);
 context.busy=false;context.cloudApplyUpdate();assert.equal(reloads,1);context.cloudApplyUpdate();assert.equal(reloads,1);
});
