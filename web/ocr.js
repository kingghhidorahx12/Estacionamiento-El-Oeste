'use strict';
// Bounded adapter to the bundled Tesseract 5.1.1 worker protocol. No image/network
// service, browser storage or external URLs. A failed initialization is terminated.
class LocalPlateReader {
 constructor({workerFactory=()=>new Worker('/vendor/worker.min.js'),timeout=25000,onProgress=()=>{}}={}){
  this.workerFactory=workerFactory;this.timeout=timeout;this.onProgress=onProgress;this.worker=null;this.pending=new Map();this.sequence=0;this.ready=null;this.busy=false;
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
   await this.job('setParameters',{params:{tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',tessedit_pageseg_mode:'11'}});
   return this;
  })().catch(error=>{if(this.ready===attempt)this.stop(error);throw error;});
  this.ready=attempt;return attempt;
 }
 async read(canvas){
  if(this.busy)throw new Error('OCR_BUSY');this.busy=true;
  try{
   await this.prepare();
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
function plateCandidates(text){return (String(text||'').toUpperCase().match(/[A-Z0-9][A-Z0-9 -]{3,14}[A-Z0-9]/g)||[]).map(t=>t.replace(/\s/g,'')).filter(t=>/[A-Z]/.test(t)&&/\d/.test(t)&&t.length>=5&&t.length<=12);}
