import test from 'node:test';import assert from 'node:assert/strict';import {pbkdf2Sync} from 'node:crypto';import {password,encryptBackup} from '../lib/crypto.mjs';
test('existing PIN hashes keep exactly SHA256/210000 and UTF8 string salt despite the public native iteration cap',async()=>{
 const original=crypto.subtle.deriveBits;crypto.subtle.deriveBits=async()=>{throw new DOMException('iteration counts above 100000 are not supported','NotSupportedError');};
 try{for(const [pin,salt]of [['65432198','synthetic-salt'],['000001','a'.repeat(64)],['123456789012','b'.repeat(64)]])assert.equal(await password(pin,salt),pbkdf2Sync(pin,salt,210000,32,'sha256').toString('hex'));const backup=await encryptBackup({application:'mx.eloeste.cloud',schema:1},'synthetic-backup-password');assert.equal(backup.format,'el-oeste-cloud-v1');}finally{crypto.subtle.deriveBits=original;}
});
