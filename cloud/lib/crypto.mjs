import {requireThat} from './rules.mjs';
import {pbkdf2} from '@noble/hashes/pbkdf2.js';
import {sha256} from '@noble/hashes/sha2.js';
const utf8=new TextEncoder(),text=new TextDecoder();
export const hex=bytes=>[...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');
export const unhex=s=>{requireThat(typeof s==='string'&&/^[a-f0-9]{64}$/.test(s),'Clave de servidor no configurada.',503,'CONFIG');return Uint8Array.from(s.match(/../g),x=>parseInt(x,16));};
export const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export const b64=bytes=>{const input=new Uint8Array(bytes),parts=[];for(let i=0;i<input.length;i+=8192)parts.push(String.fromCharCode(...input.subarray(i,i+8192)));return btoa(parts.join('')).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');};
export const from64=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),x=>x.charCodeAt(0));
export const hash=async s=>hex(await crypto.subtle.digest('SHA-256',utf8.encode(s)));
export function equal(a,b){if(typeof a!=='string'||typeof b!=='string')return false;let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0;}
export function canonical(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';}
export async function fingerprint(path,body,secret){const key=await crypto.subtle.importKey('raw',unhex(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,utf8.encode('oeste-request-v1\n'+path+'\n'+canonical(body))));}
export async function password(pin,salt){const bytes=pbkdf2(sha256,utf8.encode(pin),utf8.encode(salt),{c:210000,dkLen:32});try{return hex(bytes);}finally{bytes.fill(0);}}
export function validPin(pin){requireThat(typeof pin==='string'&&/^[0-9]{6,12}$/.test(pin),'El PIN personal debe tener entre 6 y 12 dígitos.');}
export async function seal(value,secret,context){const key=await crypto.subtle.importKey('raw',unhex(secret),'AES-GCM',false,['encrypt']),iv=crypto.getRandomValues(new Uint8Array(12)),bytes=utf8.encode(JSON.stringify(value));const sealed=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:utf8.encode('oeste-cloud-v1:'+context)},key,bytes);bytes.fill(0);return b64(iv)+'.'+b64(sealed);}
export async function open(box,secret,context){const [iv,body]=box.split('.'),key=await crypto.subtle.importKey('raw',unhex(secret),'AES-GCM',false,['decrypt']);const bytes=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:from64(iv),additionalData:utf8.encode('oeste-cloud-v1:'+context)},key,from64(body)));try{return JSON.parse(text.decode(bytes));}finally{bytes.fill(0);}}
export function base32(secret){requireThat(typeof secret==='string'&&/^[A-Z2-7]{32}$/.test(secret),'Se requiere una clave TOTP de 160 bits.');let bits='';for(const char of secret)bits+='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(char).toString(2).padStart(5,'0');return Uint8Array.from(bits.match(/.{8}/g),x=>parseInt(x,2));}
export function totpSecret(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[v&31]).join('');}
export async function totp(secret,step){const key=await crypto.subtle.importKey('raw',base32(secret),{name:'HMAC',hash:'SHA-1'},false,['sign']),counter=new ArrayBuffer(8);new DataView(counter).setBigUint64(0,BigInt(step));const digest=new Uint8Array(await crypto.subtle.sign('HMAC',key,counter)),offset=digest[19]&15,code=((digest[offset]&127)<<24)|(digest[offset+1]<<16)|(digest[offset+2]<<8)|digest[offset+3];return String(code%1000000).padStart(6,'0');}
export async function verifyTotp(secret,code,at,last=-1){if(typeof code!=='string'||!/^\d{6}$/.test(code))return -1;const step=Math.floor(at/30000);for(const delta of [0,-1,1])if(step+delta>last&&equal(await totp(secret,step+delta),code))return step+delta;return -1;}
export async function encryptBackup(document,pass){
 requireThat(typeof pass==='string'&&pass.length>=12&&pass.length<=128,'Usa una contraseña de 12 a 128 caracteres.');
 const salt=crypto.getRandomValues(new Uint8Array(32)),iv=crypto.getRandomValues(new Uint8Array(12)),derived=pbkdf2(sha256,utf8.encode(pass),salt,{c:210000,dkLen:32});
 let key;try{key=await crypto.subtle.importKey('raw',derived,'AES-GCM',false,['encrypt']);}finally{derived.fill(0);}
 const bytes=utf8.encode(JSON.stringify(document));requireThat(bytes.length<=16000000,'Respaldo demasiado grande; usa exportación D1 protegida.');
 try{return {format:'el-oeste-cloud-v1',salt:b64(salt),iv:b64(iv),data:b64(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:utf8.encode('el-oeste-cloud-v1')},key,bytes))};}finally{bytes.fill(0);}
}
