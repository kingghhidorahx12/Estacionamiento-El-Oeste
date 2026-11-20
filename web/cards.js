
'use strict';

// Tarjetas bancarias ID-1: 2 columnas × 4 filas por hoja Carta.
const CARD_PRINT={width:85.6,height:53.98,gap:8,perPage:8,pageWidth:215.9,pageHeight:279.4};
const PRINTABLE_CARD_STATES=new Set(['available','assigned','reserve']);
function cardNumber(id){return Number(id)>50?'P'+String(Number(id)-50).padStart(2,'0'):String(id).padStart(2,'0');}
let cardPreviewObserver=null;

function fitCardPreviews(){
 cardPreviewObserver?.disconnect();const pages=document.querySelector('.card-pages');if(!pages)return;
 const fit=()=>pages.style.setProperty('--card-scale',String(Math.min(1,Math.max(.35,(pages.clientWidth-16)/(CARD_PRINT.width*96/25.4)))));
 fit();if(typeof ResizeObserver==='function'){cardPreviewObserver=new ResizeObserver(fit);cardPreviewObserver.observe(pages);}
}

function cardPrintCopy(config){
 const price=n=>'$'+new Intl.NumberFormat('es-MX',{maximumFractionDigits:2}).format(n/100);
 return {
  noticeTitle:'AVISO AL CLIENTE',
  notice:'No nos hacemos responsables por robo total o parcial de vehículos, fallas mecánicas, robo de piezas, multas, traslado por grúa, fenómenos naturales, incendios, terremotos, objetos olvidados, vehículos abandonados después del horario de servicio o robo con violencia.',
  loss:`EXTRAVÍO DE TARJETA: ${price(config.lostCard)}`,
  returnCard:'Conserva y devuelve esta tarjeta al salir.'
 };
}

function printableCard(card,config){
 const copy=cardPrintCopy(config),number=cardNumber(card.id);
 return `<article class="bank-card" aria-label="Tarjeta ${number}"><i class="cut tl"></i><i class="cut tr"></i><i class="cut bl"></i><i class="cut br"></i>
  <div class="bank-card-qr"><div class="qr-code" data-token="${esc(card.token)}"></div><span>ENTRADA Y SALIDA</span></div>
  <div class="bank-card-info" style="padding:2mm 1.8mm 1.3mm;min-width:0;overflow:hidden">
   <img src="/assets/logo-horizontal.svg" alt="El Oeste · Estacionamiento" style="width:35mm;height:8.7mm;margin-bottom:.7mm">
   <div class="bank-card-number" style="font-size:12pt;line-height:1.05;margin-bottom:.7mm"><span>${card.id>50?'PROVISIONAL':'TARJETA'}</span> ${number}</div>
   <div class="bank-card-notice" style="width:100%;text-align:center;font-size:5.7pt;line-height:1.13;overflow-wrap:break-word">
    <b style="display:block;text-align:center;font-size:7pt;margin-bottom:.7mm">${esc(copy.noticeTitle)}</b><p style="margin:0;text-align:center">${esc(copy.notice)}</p>
   </div>
   <div class="bank-card-rules" style="margin-top:auto;padding-top:.7mm;gap:.3mm;white-space:normal;line-height:1.1;text-align:center">
    <b style="font-size:6.6pt;margin:0">${esc(copy.loss)}</b><span style="font-size:5.5pt">${esc(copy.returnCard)}</span>
   </div>
  </div></article>`;
}

function wrapCardText(text,font,size,maxWidth){
 const lines=[];let current='';
 for(const word of text.trim().split(/\s+/)){
  const candidate=current?current+' '+word:word;
  if(font.widthOfTextAtSize(candidate,size)<=maxWidth){current=candidate;continue;}
  if(current){lines.push(current);current='';}
  if(font.widthOfTextAtSize(word,size)>maxWidth)throw new Error('El aviso contiene una palabra que no cabe en la tarjeta.');
  current=word;
 }
 if(current)lines.push(current);return lines;
}

async function createCardPdf(cards,config,logoBytes,sample=false){
 const {PDFDocument,StandardFonts,rgb,PrintScaling}=PDFLib;
 if(!Array.isArray(cards)||!cards.length)throw new Error('No hay tarjetas válidas para imprimir.');
 if(!sample&&cards.some(c=>typeof c.token!=='string'||!c.token||c.state!=null&&!PRINTABLE_CARD_STATES.has(c.state)))throw new Error('Hay tarjetas sin QR vigente o con estado no imprimible.');
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),logo=await pdf.embedPng(logoBytes),mm=72/25.4;
 pdf.setTitle('El Oeste · Tarjetas QR · Carta');pdf.setAuthor('Estacionamiento El Oeste');pdf.setSubject('Tarjetas 85.60 × 53.98 mm. Imprimir a tamaño real (100%).');
 pdf.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None);
 const ink=rgb(.098,.184,.212),rule=rgb(.45,.45,.42),white=rgb(1,1,1),black=rgb(0,0,0),copy=cardPrintCopy(config);
 const W=CARD_PRINT.width*mm,H=CARD_PRINT.height*mm,gap=CARD_PRINT.gap*mm,PW=CARD_PRINT.pageWidth*mm,PH=CARD_PRINT.pageHeight*mm;
 const startX=(PW-2*W-gap)/2,startY=(PH-4*H-3*gap)/2;
 const center=(page,text,cx,y,size,face=font,limit=W/2-4*mm)=>{
  const width=face.widthOfTextAtSize(text,size),actual=width>limit?size*limit/width:size;
  if(actual<4.7)throw new Error('Un texto de la tarjeta no cabe de forma legible.');
  page.drawText(text,{x:cx-face.widthOfTextAtSize(text,actual)/2,y,size:actual,font:face,color:ink});
 };
 const totalPages=Math.ceil(cards.length/CARD_PRINT.perPage);

 for(let offset=0;offset<cards.length;offset+=CARD_PRINT.perPage){
  const page=pdf.addPage([PW,PH]);
  cards.slice(offset,offset+CARD_PRINT.perPage).forEach((card,index)=>{
   const x=startX+(index%2)*(W+gap),y=PH-startY-H-Math.floor(index/2)*(H+gap),right=x+W*.75;
   page.drawRectangle({x,y,width:W,height:H,color:white,borderColor:ink,borderWidth:.5});
   page.drawLine({start:{x:x+W/2,y:y+3*mm},end:{x:x+W/2,y:y+H-3*mm},thickness:.4,color:rule});

   if(!sample){
    const qr=qrcode(0,'M');qr.addData(card.token);qr.make();const count=qr.getModuleCount(),side=35*mm,unit=side/(count+8),left=x+(W/2-side)/2,bottom=y+(H-side)/2+2*mm;
    for(let row=0;row<count;row++)for(let col=0;col<count;col++)if(qr.isDark(row,col))page.drawRectangle({x:left+(col+4)*unit,y:bottom+side-(row+5)*unit,width:unit,height:unit,color:black});
   }

   center(page,sample?'MUESTRA · NO VÁLIDO':'ENTRADA Y SALIDA',x+W/4,y+5.5*mm,6.4,bold);
   const logoW=Math.min(35*mm,10*mm*logo.width/logo.height),logoH=logoW*logo.height/logo.width;
   page.drawImage(logo,{x:right-logoW/2,y:y+H-2.7*mm-logoH,width:logoW,height:logoH});
   center(page,(card.id>50?'PROVISIONAL ':'TARJETA ')+cardNumber(card.id),right,y+H-17.5*mm,12,bold);
   center(page,copy.noticeTitle,right,y+H-22*mm,7,bold);

   const textWidth=W/2-5.4*mm,firstLineY=y+H-25.6*mm,minLineY=y+11.3*mm;
   let size=6,step=7,lines=wrapCardText(copy.notice,font,size,textWidth);
   while(firstLineY-(lines.length-1)*step<minLineY&&size>5.3){size=Number((size-.1).toFixed(2));step=size+1;lines=wrapCardText(copy.notice,font,size,textWidth);}
   if(firstLineY-(lines.length-1)*step<minLineY)throw new Error('El aviso no cabe en la tarjeta. Revisa el texto antes de imprimir.');
   lines.forEach((text,j)=>center(page,text,right,firstLineY-j*step,size,font,textWidth));

   page.drawLine({start:{x:x+W/2+3*mm,y:y+9.8*mm},end:{x:x+W-3*mm,y:y+9.8*mm},thickness:.4,color:rule});
   center(page,copy.loss,right,y+6.7*mm,7,bold);
   center(page,copy.returnCard,right,y+3.3*mm,5.5,font);

   for(const [cx,cy,sx,sy] of [[x,y,-1,-1],[x+W,y,1,-1],[x,y+H,-1,1],[x+W,y+H,1,1]]){
    page.drawLine({start:{x:cx+sx*mm,y:cy},end:{x:cx+sx*3*mm,y:cy},thickness:.35,color:rule});
    page.drawLine({start:{x:cx,y:cy+sy*mm},end:{x:cx,y:cy+sy*3*mm},thickness:.35,color:rule});
   }
  });
  page.drawText(`CARTA · 100% / TAMAÑO REAL · ${offset/CARD_PRINT.perPage+1} / ${totalPages} · Verifica los datos antes de imprimir`,{x:startX,y:20,size:7,font,color:ink});
 }
 return pdf.save();
}

async function downloadCards(){
 const current=await request('state'),result=await request('cards');
 const printable=result.cards.filter(c=>PRINTABLE_CARD_STATES.has(c.state)&&typeof c.token==='string'&&c.token.length>0);
 if(!printable.length)throw new Error('No hay tarjetas vigentes para imprimir.');
 const response=await fetch('/assets/logo-horizontal.png',{cache:'no-store'});
 if(!response.ok)throw new Error('No se pudo cargar el logo para impresión.');
 const bytes=await createCardPdf(printable,current.config,await response.arrayBuffer());
 download(new Blob([bytes],{type:'application/pdf'}),'El-Oeste-Tarjetas-Carta.pdf');
 toast(`PDF listo · ${printable.length} tarjetas vigentes · imprime en Carta al 100 %.`);
}

if(typeof module!=='undefined')module.exports={CARD_PRINT,cardNumber,cardPrintCopy,createCardPdf};
