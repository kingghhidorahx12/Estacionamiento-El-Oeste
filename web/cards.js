'use strict';
// Physical dimensions: ISO/IEC 7810 ID-1; letter portrait, two columns x four rows.
const CARD_PRINT={width:85.6,height:53.98,gap:8,perPage:8,pageWidth:215.9,pageHeight:279.4};
let cardPreviewObserver=null;
function fitCardPreviews(){
 cardPreviewObserver?.disconnect();const pages=document.querySelector('.card-pages');if(!pages)return;
 const fit=()=>pages.style.setProperty('--card-scale',String(Math.min(1,Math.max(.5,(pages.clientWidth-16)/(85.6*96/25.4)))));
 fit();cardPreviewObserver=new ResizeObserver(fit);cardPreviewObserver.observe(pages);
}
function cardPrintCopy(config){
  const price=n=>'$'+new Intl.NumberFormat('es-MX',{maximumFractionDigits:2}).format(n/100);
  const washes=Object.values(config.wash);
  return {tolerance:config.normalFromStart?`Primeros ${config.graceMinutes} min de cada hora ${price(config.normalPartial)}`:'',hour:`Hora ${price(config.ordinary)}`,
    free:`Tiempo libre ${price(config.freeNormal)}`,
    wash:`Lavados desde ${price(Math.min(...washes))}`,
    addon:`Jornada +${price(config.dayAddon)} sólo con lavado`,
    loss:`Extravío de tarjeta: ${price(config.lostCard)}`,
    rules:['Conserva y devuelve esta tarjeta al salir.','Verifica tu vehículo antes de retirarte.']};
}
function printableCard(card,config){
  const copy=cardPrintCopy(config);
  return `<article class="bank-card" aria-label="Tarjeta ${num(card.id)}"><i class="cut tl"></i><i class="cut tr"></i><i class="cut bl"></i><i class="cut br"></i><div class="bank-card-qr"><div class="qr-code" data-token="${esc(card.token)}"></div><span>ENTRADA Y SALIDA</span></div><div class="bank-card-info"><img src="/assets/logo-horizontal.svg" alt="El Oeste · Estacionamiento"><div class="bank-card-number"><span>TARJETA</span> ${num(card.id)}</div><div class="bank-card-prices"><b>${esc(copy.hour)}</b>${copy.tolerance?`<span>${esc(copy.tolerance)}</span>`:''}<span>${esc(copy.free)}</span><span>${esc(copy.wash)}</span><span>${esc(copy.addon)}</span></div><div class="bank-card-rules"><b>${esc(copy.loss)}</b><span>${esc(copy.rules[0])}</span><span>${esc(copy.rules[1])}</span></div></div></article>`;
}
async function createCardPdf(cards,config,logoBytes,sample=false){
  const {PDFDocument,StandardFonts,rgb,PrintScaling}=PDFLib, pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),logo=await pdf.embedPng(logoBytes),mm=72/25.4;
  pdf.setTitle('El Oeste · Tarjetas QR · Carta');pdf.setAuthor('Estacionamiento El Oeste');pdf.setSubject('Tarjetas 85.60 × 53.98 mm. Imprimir a tamaño real (100%).');pdf.catalog.getOrCreateViewerPreferences().setPrintScaling(PrintScaling.None);
  const ink=rgb(0.098,0.184,0.212),rule=rgb(.45,.45,.42),white=rgb(1,1,1),copy=cardPrintCopy(config),W=CARD_PRINT.width*mm,H=CARD_PRINT.height*mm,gap=CARD_PRINT.gap*mm,PW=612,PH=792,startX=(PW-2*W-gap)/2,startY=(PH-4*H-3*gap)/2;
  const center=(page,text,cx,y,size,type=font)=>{let fitted=size;while(type.widthOfTextAtSize(text,fitted)>W/2-5*mm&&fitted>5)fitted-=.1;page.drawText(text,{x:cx-type.widthOfTextAtSize(text,fitted)/2,y,size:fitted,font:type,color:ink});};
  for(let offset=0;offset<cards.length;offset+=CARD_PRINT.perPage){
    const page=pdf.addPage([PW,PH]);
    cards.slice(offset,offset+8).forEach((card,index)=>{
      const x=startX+(index%2)*(W+gap),y=PH-startY-H-Math.floor(index/2)*(H+gap),right=x+W*.75;
      page.drawRectangle({x,y,width:W,height:H,color:white,borderColor:ink,borderWidth:.5});
      page.drawLine({start:{x:x+W/2,y:y+3*mm},end:{x:x+W/2,y:y+H-3*mm},thickness:.4,color:rule});
      // Four-module quiet zone is included within the left half; the QR is vector.
      const qr=qrcode(0,'M');qr.addData(card.token);qr.make();const count=qr.getModuleCount(),side=35*mm,unit=side/(count+8),left=x+(W/2-side)/2,bottom=y+(H-side)/2+2*mm;
      for(let row=0;row<count;row++)for(let col=0;col<count;col++)if(qr.isDark(row,col))page.drawRectangle({x:left+(col+4)*unit,y:bottom+side-(row+5)*unit,width:unit,height:unit,color:rgb(0,0,0)});
      center(page,sample?'MUESTRA · NO VÁLIDO':'ENTRADA Y SALIDA',x+W/4,y+5.5*mm,6.4,bold);
      const logoW=36*mm,logoH=logoW*logo.height/logo.width;page.drawImage(logo,{x:right-logoW/2,y:y+H-3*mm-logoH,width:logoW,height:logoH});
      center(page,'TARJETA '+String(card.id).padStart(2,'0'),right,y+H-17.5*mm,13,bold);
      center(page,copy.hour,right,y+H-21*mm,7,bold);if(copy.tolerance)center(page,copy.tolerance,right,y+H-24.5*mm,6.1);center(page,copy.free,right,y+H-28*mm,6.6);center(page,copy.wash,right,y+H-31.5*mm,7);center(page,copy.addon,right,y+H-35*mm,6.4);
      page.drawLine({start:{x:x+W/2+4*mm,y:y+H-37*mm},end:{x:x+W-4*mm,y:y+H-37*mm},thickness:.4,color:rule});
      center(page,copy.loss,right,y+H-41*mm,7.5,bold);center(page,copy.rules[0],right,y+H-45.5*mm,6.3);center(page,copy.rules[1],right,y+H-49*mm,6.3);
      for(const [cx,cy,sx,sy] of [[x,y,-1,-1],[x+W,y,1,-1],[x,y+H,-1,1],[x+W,y+H,1,1]]){
        page.drawLine({start:{x:cx+sx*mm,y:cy},end:{x:cx+sx*3*mm,y:cy},thickness:.35,color:rule});page.drawLine({start:{x:cx,y:cy+sy*mm},end:{x:cx,y:cy+sy*3*mm},thickness:.35,color:rule});
      }
    });
    const footer=`CARTA · 100% / TAMAÑO REAL · ${offset/8+1} / ${Math.ceil(cards.length/8)} · Tarifas de impresión, confirma vigentes en caja`;
    page.drawText(footer,{x:startX,y:20,size:7,font,color:ink});
  }
  return pdf.save();
}
async function downloadCards(){const current=await request('state'),result=await request('cards'),response=await fetch('/assets/logo-horizontal.png',{cache:'no-store'});if(!response.ok)throw new Error('No se pudo cargar el logo para impresión.');const bytes=await createCardPdf(result.cards,current.config,await response.arrayBuffer());download(new Blob([bytes],{type:'application/pdf'}),'El-Oeste-Tarjetas-Carta.pdf');toast('PDF listo · '+result.cards.length+' tarjetas · imprime en Carta al 100 %.');}
if(typeof module!=='undefined')module.exports={CARD_PRINT,cardPrintCopy,createCardPdf};
