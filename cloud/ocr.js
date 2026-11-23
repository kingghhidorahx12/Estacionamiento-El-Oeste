'use strict';
// Bounded adapter to the bundled Tesseract 5.1.1 worker protocol. No image/network
// service, browser storage or external URLs. A failed initialization is terminated.
class LocalPlateReader {
 constructor({workerFactory=()=>new Worker('/vendor/worker.min.js'),timeout=25000,onProgress=()=>{}}={}){
  this.workerFactory=workerFactory;this.timeout=timeout;this.onProgress=onProgress;this.worker=null;this.pending=new Map();this.sequence=0;this.ready=null;this.busy=false;this.pageMode='7';
 }
 job(action,payload){
  return new Promise((resolve,reject)=>{
   const jobId='oeste-'+(++this.sequence),timer=setTimeout(()=>this.stop(new Error('OCR_TIMEOUT')),this.timeout);
   this.pending.set(jobId,{resolve,reject,timer});
   try{this.worker.postMessage({workerId:'oeste-local',jobId,action,payload});}catch(e){this.stop(e);}
  });
 }
 prepare(){
  if(this.ready)return this.ready;
  const attempt=(async()=>{
   this.worker=this.workerFactory();
   this.worker.onerror=()=>this.stop(new Error('OCR_WORKER'));
   this.worker.onmessage=({data:message})=>{
    const job=this.pending.get(message.jobId);if(!job)return;
    if(message.status==='progress'){this.onProgress(message.data);return;}
    clearTimeout(job.timer);this.pending.delete(message.jobId);
    if(message.status==='resolve')job.resolve(message.data);else if(message.status==='reject'){job.reject(new Error('OCR_ENGINE'));this.stop();}
   };
   await this.job('load',{options:{lstmOnly:true,corePath:location.origin+'/vendor',logging:false}});
   await this.job('loadLanguage',{langs:'eng',options:{langPath:location.origin+'/vendor',cacheMethod:'none',gzip:true,lstmOnly:true}});
   await this.job('initialize',{langs:'eng',oem:1,config:{}});
   await this.job('setParameters',{params:{tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ',tessedit_pageseg_mode:'7'}});
   this.pageMode='7';return this;
  })().catch(error=>{if(this.ready===attempt)this.stop(error);throw error;});
  this.ready=attempt;return attempt;
 }
 async read(canvas,{pageSegMode='7'}={}){
  if(this.busy)throw new Error('OCR_BUSY');this.busy=true;
  try{
   await this.prepare();
   if(pageSegMode!==this.pageMode){await this.job('setParameters',{params:{tessedit_pageseg_mode:pageSegMode}});this.pageMode=pageSegMode;}
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('OCR_IMAGE');
   const image=new Uint8Array(await blob.arrayBuffer());
   try{return await this.job('recognize',{image,options:{},output:{text:true,blocks:false,hocr:false,tsv:false}});}finally{image.fill(0);}
  }finally{this.busy=false;}
 }
 stop(reason=new Error('OCR_STOPPED')){
  this.worker?.terminate();this.worker=null;this.ready=null;
  for(const job of this.pending.values()){clearTimeout(job.timer);job.reject(reason);}this.pending.clear();
 }
}
function plateCandidates(text){
 const rows=String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().split(/\r?\n/),found=new Map();
 for(let i=0,n=rows.length;i<n-1;i++)if(/^[ A-Z-]{2,6}$/.test(rows[i])&&rows[i].replace(/[^A-Z]/g,'').length<=4&&/^[ -]*\d[ A-Z0-9-]{1,7}$/.test(rows[i+1]))rows.push(rows[i]+' '+rows[i+1]);
 for(const row of rows){
  const parts=row.match(/[A-Z0-9]+(?:-[A-Z0-9]+)*/g)||[];
  for(let i=0;i<parts.length;i++)for(let j=i;j<Math.min(parts.length,i+3);j++){
   const value=parts.slice(i,j+1).join(''),compact=value.replace(/-/g,'');
   if(compact.length>10)break;
   if(compact.length<5||!/[A-Z]/.test(compact)||!/[0-9]/.test(compact))continue;
   const score=/^[A-Z]{3}\d{3}[A-Z]$/.test(compact)?100:/^[A-Z]{3}\d{4}$/.test(compact)?95:/^[A-Z]{3}\d{3}$/.test(compact)?90:/^[A-Z]{2,3}\d{2,5}[A-Z]{0,2}$/.test(compact)?80:/^[A-Z0-9]{6,8}$/.test(compact)?50:10;
   found.set(compact,Math.max(found.get(compact)||0,score+Math.min(compact.length,8)/100));
  }
 }
 return [...found].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([value])=>value);
}
