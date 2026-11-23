let cloudCameraGeneration=0,cloudPhotoPicker=null;
function cloudCameraCrop(v){
 const scale=Math.max(v.clientWidth/v.videoWidth,v.clientHeight/v.videoHeight),sw=v.clientWidth/scale,sh=v.clientHeight/scale;
 return {sx:(v.videoWidth-sw)/2,sy:(v.videoHeight-sh)/2,sw,sh};
}
async function startCamera(){
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Error('No se pudo abrir la cámara. Revisa el permiso de cámara en este navegador.');
 const video=$('#camera'),generation=cloudCameraGeneration;
 const camera=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280}},audio:false});
 if(generation!==cloudCameraGeneration||!video?.isConnected||!$('#modal').open){camera.getTracks().forEach(t=>t.stop());return false;}
 stream=camera;video.srcObject=camera;
 try{await video.play();}catch(error){if(stream===camera)cleanupCamera();throw error;}
 return generation===cloudCameraGeneration&&video.isConnected&&$('#modal').open;
}
function cleanupCamera(){
 cloudCameraGeneration++;cancelAnimationFrame(raf);raf=0;stream?.getTracks().forEach(t=>t.stop());stream=null;
 const video=$('#camera');if(video){video.pause();video.srcObject=null;}
 $('#modal')?.classList.remove('camera-dialog');
 if(cloudPhotoPicker){cloudPhotoPicker.value='';cloudPhotoPicker.remove();cloudPhotoPicker=null;}
 if(lastPhoto){lastPhoto.width=0;lastPhoto.height=0;lastPhoto=null;}
 if(plateReader?.busy)stopOcr();
}
async function scan(){
 openModal('Escanear tarjeta','<div class="qr-stage"><video id="camera" playsinline muted autoplay></video><span class="qr-guide" aria-hidden="true"></span><p id="scan-status" class="qr-caption" role="status">Centra el QR de la tarjeta</p></div>');
 $('#modal').classList.add('camera-dialog');const generation=cloudCameraGeneration;
 try{
  if(!await startCamera())return;
  const video=$('#camera'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});let previous=0;
  const tick=now=>{
   if(generation!==cloudCameraGeneration||!stream||!$('#modal').open){canvas.width=canvas.height=0;return;}
   if(video.readyState>=2&&video.videoWidth&&now-previous>=90){
    previous=now;const c=cloudCameraCrop(video);canvas.width=Math.min(720,Math.round(c.sw));canvas.height=Math.round(c.sh/c.sw*canvas.width);ctx.drawImage(video,c.sx,c.sy,c.sw,c.sh,0,0,canvas.width,canvas.height);
    const frame=ctx.getImageData(0,0,canvas.width,canvas.height),code=jsQR(frame.data,frame.width,frame.height,{inversionAttempts:'dontInvert'});
    if(code){canvas.width=canvas.height=0;closeModal();routeCard({token:code.data}).catch(e=>toast(e.message));return;}
   }
   raf=requestAnimationFrame(tick);
  };raf=requestAnimationFrame(tick);
 }catch(error){if(generation===cloudCameraGeneration){closeModal();toast(error.message);}}
}
async function photo(){
 const target=$('#entry-form');if(!target)return;closeModal();warmOcr();
 const generation=cloudCameraGeneration,input=document.createElement('input');input.type='file';input.accept='image/*';input.setAttribute('capture','environment');input.hidden=true;input.setAttribute('aria-label','Tomar foto de la placa');document.body.append(input);cloudPhotoPicker=input;
 const discard=()=>{input.value='';input.remove();if(cloudPhotoPicker===input)cloudPhotoPicker=null;};input.addEventListener('cancel',discard,{once:true});
 input.addEventListener('change',async()=>{
  const file=input.files?.[0];discard();if(!file||generation!==cloudCameraGeneration||!target.isConnected)return;
  openModal('Revisar placa','<p id="ocr-status" class="fine" role="status">Leyendo la foto en este teléfono…</p><canvas id="photo" class="photo plate-preview" hidden></canvas><label class="gap-top" id="ocr-result-label" hidden>Confirma o corrige la placa<input id="ocr-result" class="plate-input" maxlength="20" autocapitalize="characters" autocomplete="off"></label><div class="camera-actions"><button type="button" class="secondary" data-action="photo">Otra foto</button><button type="button" class="primary" data-action="use-photo" hidden>Usar placa</button><button type="button" data-action="recognize" hidden>Reintentar lectura</button></div>');
  const run=cloudCameraGeneration,url=URL.createObjectURL(file),image=new Image();
  try{
   if(file.size>30*1024*1024)throw Error('IMAGE_SIZE');
   await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('IMAGE_TIMEOUT')),10000);image.onload=()=>{clearTimeout(timeout);resolve();};image.onerror=()=>{clearTimeout(timeout);reject(Error('IMAGE_DECODE'));};image.src=url;});
   if(run!==cloudCameraGeneration||!target.isConnected)return;
   const width=image.naturalWidth,height=image.naturalHeight,sw=Math.round(width*.9),sh=Math.round(Math.min(height*.46,sw*.45)),canvas=$('#photo');
   canvas.width=Math.min(sw,1280);canvas.height=Math.round(sh/sw*canvas.width);canvas.getContext('2d').drawImage(image,(width-sw)/2,(height-sh)/2,sw,sh,0,0,canvas.width,canvas.height);canvas.hidden=false;lastPhoto=canvas;await recognize();
  }catch{
   if(run===cloudCameraGeneration&&$('#ocr-status')){$('#ocr-status').textContent='No se pudo leer la foto. Escribe la placa o toma otra foto.';$('#ocr-result-label').hidden=false;$('[data-action="use-photo"]').hidden=false;$('[data-action="use-photo"]').textContent='Usar placa';}
  }finally{image.onload=image.onerror=null;image.src='';URL.revokeObjectURL(url);}
 },{once:true});input.click();
}
function capture(){return photo();}
async function recognize(){
 const button=$('[data-action="recognize"]'),image=lastPhoto;if(!image)return;button.disabled=true;const reader=plateReader||new LocalPlateReader();plateReader=reader;
 try{
  $('#ocr-status').textContent='Leyendo placa en este teléfono…';const data=await reader.read(image);if(lastPhoto!==image||!$('#ocr-result-label'))return;
  let candidates=plateCandidates(data.text);
  if(!candidates.length||(Number.isFinite(data.confidence)&&data.confidence<45)){
   $('#ocr-status').textContent='Comprobando el número de la placa…';let adjusted;
   try{adjusted=document.createElement('canvas');const scale=Math.min(2,1600/image.width);adjusted.width=Math.round(image.width*scale);adjusted.height=Math.round(image.height*scale);const ctx=adjusted.getContext('2d');ctx.filter='grayscale(1) contrast(1.4) brightness(1.1)';ctx.drawImage(image,0,0,adjusted.width,adjusted.height);const alternate=await reader.read(adjusted,{pageSegMode:'11'});candidates=plateCandidates(data.text+'\n'+alternate.text);}catch{}finally{if(adjusted){adjusted.width=adjusted.height=0;}}
  }
  if(lastPhoto!==image||!$('#ocr-result-label'))return;
  $('#ocr-result-label').hidden=false;$('#ocr-result').value=candidates[0]||'';
  $('#ocr-status').textContent=candidates.length?'Verifica la lectura con la placa física.':'No se reconoció una placa confiable. Corrígela aquí o toma otra foto.';
 }catch{if(lastPhoto===image&&$('#ocr-status')){$('#ocr-result-label').hidden=false;$('#ocr-status').textContent='El lector no respondió. Escribe la placa para continuar.';}}
 finally{if(button?.isConnected)button.disabled=false;if(lastPhoto===image&&$('[data-action="use-photo"]'))$('[data-action="use-photo"]').hidden=false;}
}
