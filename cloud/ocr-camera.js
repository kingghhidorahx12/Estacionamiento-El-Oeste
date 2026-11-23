// The guide and capture use the same source rectangle, including letterboxing.
function cloudPlateCrop(v){
 const width=v.videoWidth,height=v.videoHeight,sw=Math.round(width*.9),sh=Math.round(Math.min(height*.46,sw*.45));
 return {sx:(width-sw)/2,sy:(height-sh)/2,sw,sh};
}
function cloudPlateGuide(v){
 const guide=document.querySelector('.plate-guide');if(!guide||!v.videoWidth||!v.videoHeight)return;
 const c=cloudPlateCrop(v),scale=Math.min(v.clientWidth/v.videoWidth,v.clientHeight/v.videoHeight),left=(v.clientWidth-v.videoWidth*scale)/2,top=(v.clientHeight-v.videoHeight*scale)/2;
 Object.assign(guide.style,{left:(left+c.sx*scale)+'px',top:(top+c.sy*scale)+'px',width:(c.sw*scale)+'px',height:(c.sh*scale)+'px',right:'auto',bottom:'auto'});
}
async function photo(){
 openModal('Leer placas','<p class="muted">Acerca el número de la placa a la guía. La foto permanece en este teléfono.</p><div class="plate-camera gap-top"><video id="camera" playsinline muted autoplay></video><span class="plate-guide" aria-hidden="true"></span></div><canvas id="photo" class="photo gap-top" hidden></canvas><div class="camera-actions"><button class="primary" data-action="capture" disabled>Tomar foto y leer</button><button class="secondary" data-action="recognize" hidden>Reintentar lectura</button><button class="secondary" data-action="use-photo" hidden>Continuar sin lectura</button></div><label class="gap-top" id="ocr-result-label" hidden>Placa sugerida · confirma o corrige<input id="ocr-result" maxlength="20" autocapitalize="characters"></label><p class="fine gap-top" id="ocr-status" role="status">Preparando lector local…</p>');
 warmOcr();try{await startCamera();cloudPlateGuide($('#camera'));const b=$('[data-action="capture"]');if(b)b.disabled=false;}catch(e){toast(e.message);closeModal();}
}
function capture(){
 const v=$('#camera'),canvas=$('#photo');if(!v?.videoWidth)return;const c=cloudPlateCrop(v);
 canvas.width=Math.min(c.sw,1280);canvas.height=Math.round(c.sh/c.sw*canvas.width);canvas.getContext('2d').drawImage(v,c.sx,c.sy,c.sw,c.sh,0,0,canvas.width,canvas.height);lastPhoto=canvas;
 stream?.getTracks().forEach(t=>t.stop());stream=null;v.srcObject=null;v.closest('.plate-camera').hidden=true;canvas.hidden=false;
 $('[data-action="capture"]').hidden=true;$('[data-action="recognize"]').hidden=false;$('[data-action="use-photo"]').hidden=false;recognize();
}
async function recognize(){
 const button=$('[data-action="recognize"]'),image=lastPhoto;if(!image)return;button.disabled=true;const reader=plateReader||new LocalPlateReader();plateReader=reader;
 try{
  $('#ocr-status').textContent='Leyendo placa en este teléfono…';const data=await reader.read(image);if(lastPhoto!==image||!$('#ocr-result-label'))return;
  let candidates=plateCandidates(data.text);
  if(!candidates.length||(Number.isFinite(data.confidence)&&data.confidence<45)){
   $('#ocr-status').textContent='Comprobando el número de la placa…';
   let adjusted;
   try{adjusted=document.createElement('canvas');const scale=Math.min(2,1600/image.width);adjusted.width=Math.round(image.width*scale);adjusted.height=Math.round(image.height*scale);const ctx=adjusted.getContext('2d');ctx.filter='grayscale(1) contrast(1.4) brightness(1.1)';ctx.drawImage(image,0,0,adjusted.width,adjusted.height);const alternate=await reader.read(adjusted,{pageSegMode:'11'});candidates=plateCandidates(data.text+'\n'+alternate.text);}catch{}finally{if(adjusted){adjusted.width=0;adjusted.height=0;}}
  }
  if(lastPhoto!==image||!$('#ocr-result-label'))return;
  $('#ocr-result-label').hidden=false;$('#ocr-result').value=candidates[0]||'';$('[data-action="use-photo"]').textContent=candidates.length?'Usar esta placa':'Continuar sin lectura';
  $('#ocr-status').textContent=candidates.length?'Verifica la lectura con la placa física.':'No se reconoció una placa confiable. Acerca el número, evita reflejos o escríbelo para continuar.';
 }catch{if(lastPhoto===image&&$('#ocr-status')){$('#ocr-result-label').hidden=false;$('#ocr-status').textContent='El lector no respondió. Reintenta o escribe la placa para continuar.';}}
 finally{if(button?.isConnected)button.disabled=false;}
}
window.addEventListener('resize',()=>{const v=$('#camera');if(v?.closest('.plate-camera'))cloudPlateGuide(v);});
